"use strict";

// Reescreve o bloco de imagem do server.js por completo.
// As tentativas anteriores varreram o arquivo procurando barras e
// corromperam as regex. Aqui o bloco e substituido integralmente, com as
// barras invertidas construidas a partir de String.fromCharCode(92), que
// nenhuma camada de shell ou template interpreta.

const fs = require("node:fs");
const path = require("node:path");

const B = String.fromCharCode(92);
const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "server.js");
const lines = fs.readFileSync(file, "utf8").split("\n");

const start = lines.findIndex((line) => line.startsWith("const IMAGE_EXT_PATTERN ="));
const fnStart = lines.findIndex((line) => line.startsWith("function resolveSafeArticleRecordImage("));
if (start < 0 || fnStart < 0) throw new Error("ancoras nao encontradas");

let fnEnd = -1;
for (let i = fnStart + 1; i < lines.length; i += 1) {
  if (lines[i] === "}") {
    fnEnd = i;
    break;
  }
}
if (fnEnd < 0) throw new Error("fim da funcao nao encontrado");

const block = [
  "const IMAGE_EXT_PATTERN = /" + B + ".(?:avif|gif|jpe?g|png|webp)(?:" + B + "?[^" + B + "s,]*)?/i;",
  "",
  "// Extrai a primeira URL de imagem valida de um campo que pode vir sujo.",
  '// O RSS as vezes cola um srcset inteiro no campo: "foto.jpg%201536w,%20foto',
  '// -300x220.webp%20300w". Nada disso e uma URL, e o navegador so mostra um',
  '// retangulo vazio.',
  'function extractFirstImageUrl(value = "") {',
  '  const raw = String(value || "").trim();',
  '  if (!raw) return "";',
  "",
  "  if (/^https?:" + B + B + "/" + B + "S+$/i.test(raw) && IMAGE_EXT_PATTERN.test(raw) && !/%20/i.test(raw)) {",
  "    return raw;",
  "  }",
  "",
  '  const parts = raw.split(/[' + B + 's,]+/).map((part) => part.trim()).filter(Boolean);',
  "  for (const part of parts) {",
  '    let candidate = part.replace(/' + B + "d+w$/i, \"\").trim();",
  "    try {",
  "      candidate = decodeURIComponent(candidate);",
  "    } catch (_error) {",
  "      // sequencia invalida: tenta como veio",
  "    }",
  "    if (/^https?:" + B + B + "/" + B + "S+$/i.test(candidate) && IMAGE_EXT_PATTERN.test(candidate)) {",
  "      return candidate;",
  "    }",
  "  }",
  '  return "";',
  "}",
  "",
  "// CZS 2026-11-10 - a funcao devolvia SEMPRE o fallback e ignorava o",
  "// candidato, entao o card da materia recebia string vazia e a pagina",
  "// mostrava um retangulo branco de 433px. Agora devolve o candidato e o",
  "// fallback so entra quando nao ha nada utilizavel.",
  'function resolveSafeArticleRecordImage(item, fallback = "") {',
  '  const slug = String(item?.slug || slugify(item?.title || "") || "").trim().toLowerCase();',
  '  const overrideUrl = ARTICLE_UNSAFE_IMAGE_OVERRIDES[slug] || "";',
  "  const candidates = [",
  "    item?.feedImageUrl,",
  "    item?.imageUrl,",
  "    item?.sourceImageUrl,",
  "    item?.image,",
  "    fallback",
  "  ].map((value) => extractFirstImageUrl(value));",
  "",
  "  const candidateUrl = candidates.find(Boolean) || \"\";",
  "",
  "  if (overrideUrl && /img_6556-1024x723" + B + ".jpeg/i.test(candidateUrl)) {",
  "    return overrideUrl;",
  "  }",
  "",
  "  return candidateUrl;",
  "}"
];

lines.splice(start, fnEnd - start + 1, ...block);
fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log("bloco de imagem reescrito");