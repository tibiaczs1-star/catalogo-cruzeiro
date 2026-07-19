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

test("rodapé é acessado pela seta discreta e Cheffe Call aponta para acesso restrito", () => {
  const js = read("assets/v8-final/v8-merge-ready.js");
  const css = read("assets/v8-final/v8-merge-ready.css");

  assert.match(js, /function installCzsNavigationContract\(\)/);
  assert.match(js, /const adminHref = "\/cheffe-call\.html\?admin=1";/);
  assert.match(js, /\["Cheffe Call", "\/cheffe-call\.html\?admin=1"\]/);
  assert.match(js, /function installFloatingFooterControl\(\)/);
  assert.match(js, /aria-label", "Ir para o rodapé"/);
  assert.match(js, /Leitura contínua/);
  assert.doesNotMatch(js, /function renderCheffeFooterAccess\(\)/);
  assert.doesNotMatch(js, /renderNewsFooter\(\);\s*renderCheffeFooterAccess/);
  assert.match(css, /#footerJumpFloat\.czs-footer-arrow/);
});

test("home preserva o feed aprovado e nao inicializa o pacote CZS Flow rejeitado", () => {
  const html = read("index.html");
  const js = read("assets/v8-final/v8-merge-ready.js");

  assert.doesNotMatch(html, /czs-flow-engine\.js/, "home não deve carregar o pacote experimental rejeitado");
  assert.doesNotMatch(js, /\n\s*installCzsRegionalFlow\(\);\s*\n/, "o pacote CZS Flow não pode esconder o feed aprovado");
  assert.match(js, /CZS Flow experimental rejeitado visualmente/, "o boot deve documentar por que o pacote foi desligado");
  assert.match(js, /renderContinuousNewsScroll\(\);/, "scroll contínuo estável deve continuar renderizando");
});
