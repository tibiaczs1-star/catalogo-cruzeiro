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

test("rodape mostra apenas acesso para Cheffe Call, sem executar a Cheffe ali dentro", () => {
  const html = read("index.html");
  const js = read("assets/v8-final/v8-merge-ready.js");
  const css = read("assets/v8-final/v8-merge-ready.css");

  assert.match(js, /function renderCheffeFooterAccess\(\)/, "rodapé deve renderizar apenas acesso para Cheffe");
  assert.match(js, /id = "v8FooterCheffeDock"/, "doca precisa ter ID fixo para auditoria");
  assert.match(js, /href="#cheffeCallEditor"/, "botão do rodapé deve apontar para a Cheffe real");
  assert.match(js, /title="[^"]*Cheffe Call/, "explicação da Cheffe no rodapé deve ficar só no hover/title");
  assert.match(js, /site de scroll infinito/i, "rodapé deve explicar que o portal é de scroll infinito");
  assert.doesNotMatch(html, /id="footerJumpFloat"/, "não deve existir botão flutuante de rodapé na marcação inicial");
  assert.doesNotMatch(js, /\n\s*installFooterOnlyByButtonGate\(\);\s*\n/, "o gate flutuante do rodapé não deve inicializar");
  assert.match(css, /#footerJumpFloat[\s\S]*display:\s*none\s*!important;/, "qualquer botão flutuante legado precisa ficar oculto");
  assert.doesNotMatch(js, /dock\.appendChild\(section\)/, "Cheffe funcional não pode ser movida para dentro do rodapé");
  assert.doesNotMatch(js, /v8-cheffe-in-footer/, "Cheffe não deve receber classe de execução dentro do rodapé");
  assert.doesNotMatch(js, /<small>Uso da equipe CZS/, "Cheffe no rodapé não deve explicar em texto fixo");
  assert.doesNotMatch(css, /v8-footer-cheffe-head/, "CSS não deve manter bloco explicativo pesado da Cheffe no rodapé");
  assert.match(js, /renderNewsFooter\(\);\s*renderCheffeFooterAccess\(\);/s, "o acesso deve ser recriado depois que o rodapé é recriado");
});

test("home preserva o feed aprovado e nao inicializa o pacote CZS Flow rejeitado", () => {
  const html = read("index.html");
  const js = read("assets/v8-final/v8-merge-ready.js");

  assert.doesNotMatch(html, /czs-flow-engine\.js/, "home não deve carregar o pacote experimental rejeitado");
  assert.doesNotMatch(js, /\n\s*installCzsRegionalFlow\(\);\s*\n/, "o pacote CZS Flow não pode esconder o feed aprovado");
  assert.match(js, /CZS Flow experimental rejeitado visualmente/, "o boot deve documentar por que o pacote foi desligado");
  assert.match(js, /renderContinuousNewsScroll\(\);/, "scroll contínuo estável deve continuar renderizando");
});
