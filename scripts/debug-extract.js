"use strict";

// Harness de diagnostico da extracao: mostra em qual etapa os paragrafos da
// pagina original desaparecem. Uso:
//   node scripts/debug-extract.js <url> ["titulo"]
// Fica fora do fluxo de producao; existe porque o extrator roda dentro de um
// arquivo com require relativo e nao pode ser carregado de dentro de um -e.

const vm = require("node:vm");
const fs = require("node:fs");
const https = require("node:https");
const http = require("node:http");

const url = process.argv[2];
const title = process.argv[3] || "";
if (!url) {
  console.error("uso: node scripts/debug-extract.js <url> [titulo]");
  process.exit(1);
}

const source = fs.readFileSync(__dirname + "/repair-hollow-summaries.js", "utf8");
const cut = source.slice(0, source.indexOf("async function runPool"));

const sandboxRequire = (name) => {
  // Modulos nativos passam direto; caminhos relativos resolvem a partir de
  // scripts/, que e onde o arquivo real mora.
  if (name.startsWith("node:") || !name.startsWith(".")) return require(name);
  return require(require("node:path").join(__dirname, name));
};
const sandbox = {
  console,
  require: sandboxRequire,
  // O trecho carregado e o topo de um modulo CommonJS: espera __dirname,
  // __filename e process. Sem eles o vm quebra antes de chegar no extrator.
  __dirname,
  __filename,
  process,
  Buffer
};
vm.createContext(sandbox);
vm.runInContext(cut.replace(/^"use strict";/, ""), sandbox);

const client = url.startsWith("https:") ? https : http;
const req = client.get(
  url,
  { timeout: 20000, headers: { "user-agent": "Mozilla/5.0 Chrome/122", accept: "text/html" } },
  (res) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      console.log("status:", res.statusCode, "| bytes:", body.length);

      const bodyParagraph =
        /<p\b[^>]*class="[^"]*(?:content-text|post-text|corpo-materia|materia-texto|article-text|entrada)[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
      const raw = [...body.matchAll(bodyParagraph)].map((m) => m[1]);
      console.log("etapa 1 - paragrafos com classe de corpo:", raw.length);

      if (raw.length) {
        const plain = sandbox.toPlainText(raw.join("\n"));
        console.log("etapa 2 - apos toPlainText:", plain.length, "paragrafos");
        plain.slice(0, 6).forEach((line, i) => console.log(`   [${i}] ${line.length} chars | ${line.slice(0, 90)}`));
      }

      const final = sandbox.extractParagraphs(body, title);
      console.log("etapa 3 - extractParagraphs:", final.length, "paragrafos");
      final.slice(0, 6).forEach((line, i) => console.log(`   [${i}] ${line.length} chars | ${line.slice(0, 90)}`));
    });
  }
);
req.on("timeout", () => {
  console.log("timeout");
  req.destroy();
});
req.on("error", (error) => console.log("erro:", error.code || error.message));