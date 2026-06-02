const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENING_DIR = path.join(ROOT_DIR, "docs", "commercial", "research", "screening");
const JSONL_PATH = path.join(SCREENING_DIR, "czs-premium-corpus-screening-2026-06-01.jsonl");
const SUMMARY_PATH = path.join(SCREENING_DIR, "czs-premium-corpus-screening-summary-2026-06-01.json");
const OUT_PATH = path.join(ROOT_DIR, "docs", "commercial", "czs-premium-research-synthesis-2026-06-01.md");

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topItems(counts, limit = 12) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

function topByCategory(items, category, predicate, limit = 12) {
  return items
    .filter((item) => item.category === category && (!predicate || predicate(item)))
    .slice(0, limit)
    .map((item) => {
      const title = item.summary.title || item.summary.description || item.url;
      return `- ${item.id}: ${title.slice(0, 120)} | ${item.summary.howItWorks}`;
    })
    .join("\n");
}

function signalCount(items, group, signal) {
  return items.filter((item) => item.signals[group] && item.signals[group][signal] && item.signals[group][signal].score > 0).length;
}

function markdown(summary, items) {
  const byCategory = countBy(items, (item) => item.category);
  const byAccessMode = countBy(items, (item) => item.corpusReadMode || (item.access.ok ? "html_read" : "blocked_or_missing"));
  const failedByCategory = countBy(items.filter((item) => !item.access.ok), (item) => item.category);
  const okByCategory = countBy(items.filter((item) => item.access.ok), (item) => item.category);

  return `# Sintese Da Leitura - CZS Premium

Data base: 2026-06-01

## O Que Foi Lido

Foram processadas 3000 referencias do corpus comercial:

${topItems(byCategory, 20)}

Leitura por modo:

${topItems(byAccessMode, 20)}

Acesso por categoria:

- OK por categoria: ${JSON.stringify(okByCategory)}
- falhas/bloqueios por categoria: ${JSON.stringify(failedByCategory)}
- status HTTP: ${JSON.stringify(summary.byStatusCode)}

Observacao importante: uma pagina bloqueada, 404 ou com timeout nao vira referencia visual aprovada. Ela fica registrada como ausencia/falha de caminho. As listagens de venda de websites foram lidas por dado estruturado do coletor, com preco, receita, lucro e multiplo no campo de notas do corpus.

## O Que As 500 Landings De Jornal Ensinam

Padrao dominante:

- jornal bom nao depende de uma hero bonita; depende de hierarquia editorial viva;
- a home precisa responder rapido: o que aconteceu, onde, quando, fonte e o que muda agora;
- paginas de noticia fortes usam densidade organizada, nao vazio decorativo;
- o valor comercial vem de atencao diaria, confianca e habito local;
- tempo, transito, servico, newsletter, mais lidas e ultimas noticias aparecem como infraestrutura de retencao.

Sinais medidos:

- editorial_grid: ${signalCount(items, "visual", "editorial_grid")}
- local_identity: ${signalCount(items, "visual", "local_identity")}
- direct_cta: ${signalCount(items, "sales", "direct_cta")}
- seo: ${signalCount(items, "technical", "seo")}
- media_delivery: ${signalCount(items, "technical", "media_delivery")}

Exemplos lidos:

${topByCategory(items, "newspaper_landing", (item) => item.access.ok, 12)}

Aplicacao no CZS:

- A landing precisa abrir com o CZS como painel operacional do Vale do Jurua, nao como flyer de anuncio.
- A prova de jornal deve aparecer como painel de 3 dias, fontes, editorias, velocidade e confianca.
- A venda deve nascer da utilidade local: anunciante compra presenca onde a cidade consulta noticia, servico, catalogo e oportunidade.

## O Que As 500 Landings De Tecnologia Ensinam

Padrao dominante:

- tecnologia madura mostra produto em funcionamento;
- codigo, console, dashboard, fluxo e prova visual valem mais que frases abstratas;
- motion funciona quando explica sistema, nao quando vira enfeite;
- CTA precisa ser simples e repetido depois de prova;
- paginas fortes combinam produto visivel, design limpo, prova social e microinteracoes.

Sinais medidos:

- product_visible: ${signalCount(items, "visual", "product_visible")}
- cinematic: ${signalCount(items, "visual", "cinematic")}
- data_visual: ${signalCount(items, "visual", "data_visual")}
- modern_frontend: ${signalCount(items, "technical", "modern_frontend")}
- analytics: ${signalCount(items, "technical", "analytics")}

Exemplos lidos:

${topByCategory(items, "technology_landing", (item) => item.access.ok, 12)}

Aplicacao no CZS:

- Mostrar a maquina: 200 agentes, APIs, captura de noticia, catalogo, PubPaid, distribuicao e SEO em fluxo visual.
- Trocar texto de promessa por demonstracao: terminal, graficos, rede de agentes, painel de status e antes/depois comercial.
- Usar Open Design como direcao de sistema, nao como copia de SaaS estrangeiro.

## O Que Os 1000 Media Kits/Candidatos De Jornal Ensinam

Padrao dominante:

- muitas rotas obvias de media kit falham; isso ensina que a landing comercial do CZS precisa ser facil de achar e indexar;
- media kit bom mostra audiencia, formatos, exemplos, contato e pacote;
- midia local vende contexto, nao apenas impressao;
- patrocinio, newsletter, display, branded content e social precisam virar menu claro;
- sem numeros verificados, a melhor saida e rotular como estimativa, operacao ou prova local.

Sinais medidos:

- media_kit: ${signalCount(items, "sales", "media_kit")}
- proof: ${signalCount(items, "sales", "proof")}
- pricing: ${signalCount(items, "sales", "pricing")}
- direct_cta: ${signalCount(items, "sales", "direct_cta")}
- conversion_stack: ${signalCount(items, "technical", "conversion_stack")}

Exemplos acessiveis/candidatos lidos:

${topByCategory(items, "newspaper_media_kit_report", (item) => item.access.ok, 12)}

Aplicacao no CZS:

- Criar secoes comerciais com nome claro: Anuncio Local, Pacote Jornal, Pacote Catalogo, PubPaid, Cota Premium, Operacao Completa.
- Cada pacote deve ter: onde aparece, para quem serve, resultado esperado, prova, CTA.
- SEO precisa tornar a pagina encontravel para buscas como anunciar em Cruzeiro do Sul, propaganda no Vale do Jurua, catalogo comercial CZS.

## O Que Os 1000 Relatorios/Listagens De Venda De Websites Ensinam

Padrao dominante:

- site vendavel e apresentado como ativo: receita, lucro, margem, multiplo, risco e oportunidade;
- comprador nao compra beleza; compra maquina que opera e pode crescer;
- risco declarado aumenta confianca quando vem com plano de mitigacao;
- historico, recorrencia e canal de aquisicao valem mais que promessa;
- uma pagina comercial premium precisa parecer due diligence simplificada.

Sinais medidos:

- valuation: ${signalCount(items, "sales", "valuation")}
- proof: ${signalCount(items, "sales", "proof")}
- data_visual: ${signalCount(items, "visual", "data_visual")}
- pricing: ${signalCount(items, "sales", "pricing")}

Exemplos lidos por dado estruturado:

${topByCategory(items, "website_sales_report", (item) => item.access.ok, 12)}

Aplicacao no CZS:

- A landing deve ter camada de relatorio: operacao, ativos, tecnologia, audiencia, monetizacao, riscos e proximos 90 dias.
- Onde nao houver dado publico confiavel, usar linguagem de capacidade operacional, nao inflar metrica.
- Os graficos devem explicar motor economico: produto -> distribuicao -> captura -> conversao -> recorrencia.

## Decisao De Design Para A Proxima Landing

O caminho premium nao e "mais brilho" sozinho. O caminho e:

1. Hero como sala de controle regional: CZS operando agora no Vale do Jurua.
2. Painel de 3 dias: noticias, fontes, alertas, catalogo e servicos.
3. Rede de tecnologia: agentes, APIs, captura, SEO, distribuicao, PubPaid.
4. Media kit vivo: produtos comerciais, formatos, exemplos, prova e CTA.
5. Relatorio de ativo: numeros verificaveis, risco, crescimento e cota.
6. Camada cinematografica: motion, parallax, nodes e graficos para explicar fluxo, nao para decorar.

## Regras Para Nao Ficar Amador

- Nada de flyer grande com pouco conteudo.
- Nada de tecnologia contada apenas em frase.
- Nada de grafico sem explicar decisao comercial.
- Nada de metrica sem origem ou rotulo.
- Nada de hero que esconda o produto real.
- Nada de pagina sem CTA comercial claro.
- Nada de SEO generico; o CZS deve ranquear para hiperlocal + anunciar + catalogo + jornal.

## Arquivos De Evidencia

- Corpus: \`docs/commercial/research/czs-premium-corpus-2026-06-01.csv\`
- Leitura linha a linha: \`docs/commercial/research/screening/czs-premium-corpus-screening-2026-06-01.jsonl\`
- Sumario tecnico: \`docs/commercial/research/screening/czs-premium-corpus-screening-summary-2026-06-01.json\`
- Relatorio automatico: \`docs/commercial/research/screening/czs-premium-corpus-screening-report-2026-06-01.md\`
`;
}

function main() {
  const items = readJsonl(JSONL_PATH);
  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
  fs.writeFileSync(OUT_PATH, markdown(summary, items), "utf8");
  console.log(JSON.stringify({ output: path.relative(ROOT_DIR, OUT_PATH), total: items.length }, null, 2));
}

main();
