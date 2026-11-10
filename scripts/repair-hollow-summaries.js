"use strict";

// Reconstroi o texto de materias que ficaram com resumo de formula:
// "<Fonte> publicou uma atualizacao sobre <titulo>. O portal mantem a
// referencia da fonte original...". Esse texto nao vem da fonte; e um
// preenchimento gerado pelo proprio portal quando o sanitizador achava (por
// engano) que o texto estava em ingles. O leitor ve a mesma frase em dezenas
// de materias e chama isso de IA slop, com razao.
//
// O script busca a pagina original de cada item, extrai os paragrafos reais
// dentro de <article> (ou do bloco principal) e regrava summary, lede e body.
// Item que nao entrega texto util fica marcado, sem inventar nada.
//
// Uso:
//   node scripts/repair-hollow-summaries.js --dry --limit=5
//   node scripts/repair-hollow-summaries.js --limit=20
//   node scripts/repair-hollow-summaries.js            (todos)

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const http = require("node:http");
const { splitSentences } = require("./lib/split-sentences.js");

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "data", "runtime-news.json");
const DRY = process.argv.includes("--dry");
// --slugs=a,b,c forca a reextracao desses itens mesmo que o resumo atual
// pareca bom. Serve para consertar corpo montado com divisor de frase errado
// (numeros partidos) sem reprocessar o acervo inteiro.
const SLUGS_ARG = process.argv.find((arg) => arg.startsWith("--slugs="));
const FORCED_SLUGS = SLUGS_ARG
  ? new Set(
      SLUGS_ARG.split("=")[1]
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean)
    )
  : null;
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : Infinity;
const CONCURRENCY = 6;
const TIMEOUT_MS = 12000;

// Marcadores do texto de formula que este script existe para remover.
const HOLLOW_MARKERS = [
  "publicou uma atualizacao sobre",
  "publicou uma atualização sobre",
  "mantem a referencia da fonte original",
  "mantém a referência da fonte original",
  "mantem o link da fonte original",
  "mantém o link da fonte original",
  "apresenta o tema em portugues para acompanhamento",
  "apresenta o tema em português para acompanhamento",
  "permanece no acervo como acompanhamento de fonte externa"
];

function isHollow(value) {
  const text = String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return HOLLOW_MARKERS.some((marker) =>
    text.includes(marker.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase())
  );
}

function decodeEntities(value = "") {
  return String(value || "")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&hellip;/gi, "...");
}

// Blocos que nunca sao texto de materia.
const NOISE_BLOCK =
  /<(nav|header|footer|aside|form|script|style|figure|figcaption|iframe|noscript|button|select|svg)\b[\s\S]*?<\/\1>/gi;
const NOISE_LINE =
  /^(capa|ultimas noticias|últimas notícias|acre|politica|política|agro|economia|editorial|blogs e colunas|home|inicio|início|menu|buscar|pesquisar|compartilhe|compartilhar|leia mais|leia também|publicidade|anuncie|newsletter|por |foto:|imagem:|credito:|crédito:|tags?:|categorias?:|deixe seu comentario|deixe seu comentário|veja tambem|veja também|saiba mais)/i;

// Iscas de rede social e chamadas do proprio veiculo. Nao sao texto da
// materia: aparecem em quase toda pagina e, coladas ao resumo, sujam a
// chamada com um convite que nao informa nada sobre o fato.
const SOCIAL_BAIT =
  /(siga (o|a|nos|nós)\b|siga nosso|siga nossas|no whatsapp e receba|receba as principais not|em primeira m[aã]o|entre no (nosso|canal)|nosso canal no whatsapp|nos siga|acompanhe (o|a) \S+ (no|nas) (instagram|facebook|twitter|x|youtube|whatsapp)|acompanhe as principais not|favorite o g1|curta (a|nossa) p[aá]gina|compartilhe nas redes|inscreva-se no canal|assine a newsletter|apoio jornalistico|seja um apoiador|apoie o jornalismo)/i;

// Aviso de conteudo sensivel no topo da materia (violencia, abuso). Nao e
// texto da noticia: e um alerta de redacao e nao deve abrir a chamada.
const CONTENT_WARNING =
  /^aviso:?\s+(esta|esse|este)\s+reportagem\s+cont[eé]m\s+relatos/i;

function toPlainText(markup) {
  return decodeEntities(
    String(markup || "")
      .replace(NOISE_BLOCK, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length >= 60)
    .filter((line) => !NOISE_LINE.test(line))
    .filter((line) => !isHollow(line))
    .filter((line) => !SOCIAL_BAIT.test(line))
    .filter((line) => !CONTENT_WARNING.test(line))
    .filter((line) => !/https?:\/\//i.test(line))
    .filter((line) => !/^(por|by)\s+\S+$/i.test(line));
}

// Extrai o corpo da materia. Ordem de preferencia:
//   1. paragrafos marcados como texto de materia (content-text, post-text,
//      entrada, corpo-materia). E o sinal mais confiavel: o G1 usa
//      <p class="content-text"> e a pagina tem mais de 1 MB de HTML.
//   2. bloco com classe de conteudo (entry-content, post-content...).
//   3. o <article> cujo texto comeca com o titulo, ou com mais paragrafos.
//   4. a pagina inteira, como ultimo recurso.
function extractParagraphs(html, title = "") {
  const source = String(html || "");
  const normalizeKey = (value) =>
    String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\W+/g, " ").trim();

  const collector = [];

  // 1) Paragrafos de corpo marcados por classe. Sao paragrafos soltos e
  // vao juntos para toPlainText: tratar cada um como bloco independente
  // fazia o extrator comparar "quantos paragrafos saiu de cada" e ficar
  // com o primeiro, que rende 1 linha. Era o defeito que deixava 40
  // paragrafos reais do G1 de fora.
  const bodyParagraph =
    /<p\b[^>]*class="[^"]*(?:content-text|post-text|corpo-materia|materia-texto|article-text|entrada)[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  const markedParagraphs = [...source.matchAll(bodyParagraph)].map((match) => match[1]);
  if (markedParagraphs.length) collector.push(markedParagraphs.join("\n"));

  // 2) Bloco com classe de conteudo. A captura precisa aceitar <div> aninhado:
  //    por isso o fecho e procurado com uma varredura, nao com regex guloso.
  if (!collector.length) {
    const openTag =
      /<(div|section|article)\b[^>]*class="[^"]*(?:entry-content|post-content|article-content|article-body|article__body|conteudo-materia|post-body|materia)[^"]*"[^>]*>/gi;
    for (const match of source.matchAll(openTag)) {
      const start = match.index + match[0].length;
      const block = readBalancedBlock(source, start);
      if (block) collector.push(block);
    }
  }

  // 3) <article> com o titulo ou, na falta dele, o mais cheio.
  if (!collector.length) {
    const articles = [...source.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
    const titleKey = normalizeKey(title).slice(0, 40);
    const matching = titleKey.length > 20
      ? articles.filter((inner) => normalizeKey(inner.replace(/<[^>]+>/g, " ").slice(0, 800)).includes(titleKey))
      : [];
    if (matching.length) collector.push(matching[0]);
    else if (articles.length) {
      const ranked = articles
        .map((inner) => ({ inner, score: (inner.match(/<p[^>]*>/gi) || []).length }))
        .sort((a, b) => b.score - a.score);
      collector.push(ranked[0].inner);
    }
  }

  // 4) Ultimo recurso: pagina inteira.
  if (!collector.length) collector.push(source);

  let best = [];
  for (const pool of collector) {
    const paragraphs = toPlainText(pool);
    if (paragraphs.length > best.length) best = paragraphs;
  }

  // Descarta o paragrafo que repete o titulo. A pagina costuma repetir a
  // manchete num <h1> e o texto extraido comeca com ela; sem esta poda a
  // chamada fica "Titulo ... Titulo ...".
  const titleKeyFull = normalizeKey(title);
  const filtered = best.filter((line) => {
    const key = normalizeKey(line);
    if (!titleKeyFull) return true;
    if (key === titleKeyFull) return false;
    if (titleKeyFull.length > 20 && key.startsWith(titleKeyFull) && key.length < titleKeyFull.length + 80) return false;
    return true;
  });

  // Junta paragrafos curtos (legendas soltas) no seguinte e corta repetidos.
  const seen = new Set();
  const unique = [];
  for (const line of filtered) {
    const key = normalizeKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(line);
  }
  return unique;
}

// Le um bloco balanceado a partir de uma posicao, contando as tags de
// abertura e de fecho do mesmo nome. Paginas reais aninham <div> varias vezes
// e uma regex nao-gulosa fecharia na primeira div interna.
function readBalancedBlock(source, startIndex) {
  const openMatch = source.slice(Math.max(0, startIndex - 400), startIndex).match(/<(\w+)[^>]*>$/);
  const tag = openMatch ? openMatch[1].toLowerCase() : "div";
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  const closeRe = new RegExp(`<\\/${tag}\\s*>`, "gi");
  let depth = 1;
  let cursor = startIndex;
  while (cursor < source.length) {
    const openIdx = nextMatchIndex(source, openRe, cursor);
    const closeIdx = nextMatchIndex(source, closeRe, cursor);
    if (closeIdx < 0) return source.slice(startIndex);
    if (openIdx >= 0 && openIdx < closeIdx) {
      depth += 1;
      cursor = openIdx + 1;
    } else {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, closeIdx);
      cursor = closeIdx + 1;
    }
  }
  return source.slice(startIndex);
}

function nextMatchIndex(source, regex, from) {
  regex.lastIndex = from;
  const match = regex.exec(source);
  return match ? match.index : -1;
}

function fetchHtml(url) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value || "");
    };
    let parsed;
    try {
      parsed = new URL(url);
    } catch (_e) {
      return done("");
    }
    const client = parsed.protocol === "https:" ? https : http;
    let req;
    try {
      req = client.get(
        url,
        {
          timeout: TIMEOUT_MS,
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
            accept: "text/html,application/xhtml+xml",
            "accept-language": "pt-BR,pt;q=0.9"
          }
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            const target = new URL(res.headers.location, url).toString();
            return fetchHtml(target).then(done);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return done("");
          }
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
            // Pagina gigante nao vai render texto util melhor; corta e usa
            // o que ja chegou em vez de deixar o socket pendurado.
            if (body.length > 900000) res.destroy();
          });
          res.on("end", () => done(body));
          res.on("aborted", () => done(body));
          res.on("close", () => done(body));
          res.on("error", () => done(body));
        }
      );
    } catch (_e) {
      return done("");
    }
    req.on("timeout", () => {
      req.destroy();
      done("");
    });
    req.on("error", () => done(""));
    // Rede de seguranca: nenhuma requisicao pode segurar a fila.
    const guard = setTimeout(() => {
      try {
        req.destroy();
      } catch (_e) {
        /* socket ja fechado */
      }
      done("");
    }, TIMEOUT_MS + 3000);
    if (typeof guard.unref === "function") guard.unref();
    req.on("close", () => clearTimeout(guard));
  });
}

// Monta chamada + corpo a partir dos paragrafos reais.
function buildFromParagraphs(paragraphs, maxChars = 1400) {
  if (!paragraphs.length) return null;
  const joined = [];
  let total = 0;
  for (const paragraph of paragraphs) {
    if (total >= maxChars) break;
    joined.push(paragraph);
    total += paragraph.length;
  }
  const full = joined.join(" ").replace(/\s+/g, " ").trim();
  if (full.length < 120) return null;

  // Sem quebra em numero: "1.171 km" nao vira duas frases.
  const sentences = splitSentences(full);
  if (!sentences.length) return null;
  let consumed = 1;
  if (sentences[0].length < 60 && sentences.length > 1) consumed = 2;
  const kicker = sentences.slice(0, consumed).join(" ");
  const rest = sentences.slice(consumed);

  const body = [];
  for (let i = 0; i < rest.length; i += 2) {
    const paragraph = rest.slice(i, i + 2).join(" ").trim();
    if (paragraph.length >= 60) body.push(paragraph);
  }

  return {
    lede: kicker.slice(0, 300),
    summary: full.slice(0, 600),
    body: body.slice(0, 4)
  };
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;
  async function next() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next));
  return results;
}

(async () => {
  const runtime = JSON.parse(fs.readFileSync(TARGET, "utf8"));
  const items = Array.isArray(runtime.items) ? runtime.items : [];
  const isForced = (item) => Boolean(FORCED_SLUGS && item && FORCED_SLUGS.has(item.slug));
  const hollow = items.filter(
    (item) =>
      isForced(item) ||
      isHollow(item.summary) ||
      isHollow(item.lede) ||
      /^sem resumo\.?$/i.test(String(item.summary || "").trim())
  );
  console.log(
    FORCED_SLUGS
      ? `[hollow] ${hollow.length} item(ns) forcado(s) de ${items.length}`
      : `[hollow] ${hollow.length} de ${items.length} itens com texto de formula ou sem resumo`
  );
  if (!hollow.length) return;

  const targets = hollow.slice(0, LIMIT === Infinity ? hollow.length : LIMIT);
  let ok = 0;
  let failed = 0;
  let completed = 0;
  const failures = [];
  const verbose = DRY || LIMIT <= 12;

  await runPool(targets, async (item) => {
    const url = item.sourceUrl || item.url || "";
    const report = (line) => {
      completed += 1;
      if (verbose) console.log(`  [${completed}/${targets.length}] ${line}`);
      else if (completed % 20 === 0) console.log(`  ... ${completed}/${targets.length}`);
    };

    if (!/^https?:\/\//i.test(url)) {
      failed += 1;
      failures.push(`${item.sourceName}: url invalida`);
      return report("falha: url invalida");
    }
    const html = await fetchHtml(url);
    if (!html) {
      failed += 1;
      failures.push(`${item.sourceName}: sem resposta (${url.slice(0, 60)})`);
      return report("falha: sem resposta");
    }
    const paragraphs = extractParagraphs(html, item.title);
    const built = buildFromParagraphs(paragraphs);
    if (!built) {
      failed += 1;
      failures.push(`${item.sourceName}: sem texto util (${paragraphs.length} paragrafos) ${item.title.slice(0, 40)}`);
      return report("falha: sem texto util");
    }
    item.lede = built.lede;
    item.summary = built.summary;
    item.body = built.body;
    ok += 1;
    report(`ok  ${String(item.sourceName).slice(0, 16)} | ${built.lede.slice(0, 90)}`);
  });

  console.log(`[hollow] corrigidos: ${ok} | sem texto: ${failed}`);
  if (failures.length) {
    console.log("[hollow] falhas (nao inventa nada, item fica como esta):");
    failures.slice(0, 15).forEach((line) => console.log("   - " + line));
  }

  if (DRY) {
    console.log("[hollow] modo seco: nada gravado");
    return;
  }
  if (ok) {
    runtime.items = items;
    fs.writeFileSync(TARGET, JSON.stringify(runtime), "utf8");
    console.log(`[hollow] runtime-news.json gravado com ${ok} item(ns) reescrito(s)`);
  }
})().catch((error) => {
  console.error("[hollow] erro fatal:", error && error.message ? error.message : error);
  process.exitCode = 1;
});