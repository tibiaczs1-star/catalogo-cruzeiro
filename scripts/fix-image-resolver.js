const fs = require("node:fs");
const p = "C:/Users/junio/Documents/Codex/_czs-work/server.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const start = lines.findIndex((l) => l.startsWith("function resolveSafeArticleRecordImage(item, fallback = \"\") {"));
if (start < 0) throw new Error("funcao nao achada");
let end = -1;
for (let i = start + 1; i < lines.length; i += 1) if (lines[i] === "}") { end = i; break; }
if (end < 0) throw new Error("fim nao achado");

const block = [
'// CZS 2026-11-10 - duas correcoes num lugar so.',
'//',
'// 1) A funcao devolvia SEMPRE o fallback e ignorava o candidato. O card da',
'//    materia recebia string vazia e a pagina mostrava um retangulo branco de',
'//    433px. Agora devolve o candidato, e o fallback so entra quando nao ha',
'//    nada utilizavel.',
'//',
'// 2) O RSS as vezes entrega um srcset inteiro colado no campo de imagem:',
'//    "https://site/foto.jpg%201536w,%20https://site/foto-300x220.webp%20300w".',
'//    Nada disso e uma URL. Agora o primeiro endereco valido da lista e',
'//    extraido.',
'const IMAGE_EXT_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)(?:\?[^\s,]*)?/i;',
'',
'function extractFirstImageUrl(value = "") {',
'  const raw = String(value || "").trim();',
'  if (!raw) return "";',
'',
'  // Caso normal: ja e uma URL limpa.',
'  if (/^https?:\/\/\S+$/i.test(raw) && IMAGE_EXT_PATTERN.test(raw) && !/%20/i.test(raw)) {',
'    return raw;',
'  }',
'',
'  // srcset colado: separa por virgula/espaco e pega o primeiro que e imagem.',
'  const parts = raw.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);',
'  for (const part of parts) {',
'    let candidate = part.replace(/\d+w$/i, "").trim();',
'    try {',
'      candidate = decodeURIComponent(candidate);',
'    } catch (_error) {',
'      // sequencia invalida: tenta como veio',
'    }',
'    if (/^https?:\/\//i.test(candidate) && IMAGE_EXT_PATTERN.test(candidate)) {',
'      return candidate;',
'    }',
'  }',
'  return "";',
'}',
'',
'function resolveSafeArticleRecordImage(item, fallback = "") {',
'  const slug = String(item?.slug || slugify(item?.title || "") || "").trim().toLowerCase();',
'  const overrideUrl = ARTICLE_UNSAFE_IMAGE_OVERRIDES[slug] || "";',
'  const candidates = [',
'    item?.feedImageUrl,',
'    item?.imageUrl,',
'    item?.sourceImageUrl,',
'    item?.image,',
'    fallback',
'  ].map((value) => extractFirstImageUrl(value));',
'',
'  const candidateUrl = candidates.find(Boolean) || "";',
'',
'  if (overrideUrl && /img_6556-1024x723\.jpeg/i.test(candidateUrl)) {',
'    return overrideUrl;',
'  }',
'',
'  return candidateUrl;',
'}'
];

lines.splice(start, end - start + 1, ...block);
fs.writeFileSync(p, lines.join("\n"), "utf8");
console.log("resolveSafeArticleRecordImage corrigida");
