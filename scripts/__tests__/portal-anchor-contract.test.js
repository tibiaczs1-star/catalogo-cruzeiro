const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("atalhos principais apontam para secoes reais e intencionais", () => {
  const js = read("assets/v8-final/v8-merge-ready.js");

  assert.match(js, /function renderTempoAgoraSection\(\)/, "Tempo Agora deve ganhar seção própria");
  assert.match(js, /section\.id = "tempo"/, "a seção de previsão deve manter a âncora #tempo");
  assert.match(js, /href="#tempo"/, "links de tempo devem apontar para #tempo");
  assert.match(js, /function ensurePortalAnchorAliases\(\)/, "aliases de modais e social devem existir");
  assert.match(js, /id: "checagemCzs"/, "checagem deve ter âncora auditável");
  assert.match(js, /id: "correcaoEditorialCzs"/, "correção editorial deve ter âncora auditável");
  assert.match(js, /id: "social"/, "social deve apontar para uma área real");
  assert.match(js, /#vagasCzs/, "atalho de vagas deve ser normalizado para #vagasCzs");
  assert.match(js, /#agenda/, "atalho de agenda deve permanecer ancorado");
  assert.match(js, /#servicos/, "atalho de serviços deve permanecer ancorado");
});

test("Cheffe Call fica encaixada no rodape completo", () => {
  const js = read("assets/v8-final/v8-merge-ready.js");

  assert.match(js, /function dockCheffeCallInFooter\(\)/, "deve existir uma doca de rodapé para Cheffe Call");
  assert.match(js, /id = "v8FooterCheffeDock"/, "doca precisa ter ID fixo para auditoria");
  assert.match(js, /dock\.appendChild\(section\)/, "Cheffe Call deve ser movida para dentro da doca");
  assert.match(js, /renderNewsFooter\(\);\s*dockCheffeCallInFooter\(\);/s, "a doca deve rodar depois que o rodapé é recriado");
});
