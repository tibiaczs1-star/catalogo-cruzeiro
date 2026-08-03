const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const readProjectFile = (...segments) =>
  fs.readFileSync(path.join(projectRoot, ...segments), "utf8");

test("a reserva conduz a pessoa por login, dados, mesa, WhatsApp e pagamento", () => {
  const html = readProjectFile("pagamentos", "ai", "index.html");

  ["login", "details", "table", "whatsapp", "payment"].forEach((step) => {
    assert.match(html, new RegExp(`data-flow-step=["']${step}["']`));
  });

  assert.match(html, /id=["']payment-pix["']/);
  assert.match(html, /id=["']payment-card["']/);
  assert.match(html, /Pagamento por cart[ãa]o em constru[çc][ãa]o/i);
});

test("a abertura incorpora a trilha oficial e mostra o aviso de direitos", () => {
  const html = readProjectFile("pagamentos", "ai", "index.html");
  const app = readProjectFile("pagamentos", "ai", "app.js");
  const openingMarkup = html.match(
    /<section[^>]*id=["']opening-screen["'][^>]*>[\s\S]*?<\/section>/i,
  )?.[0];

  assert.match(html, /id=["']opening-screen["']/);
  assert.ok(openingMarkup);
  assert.doesNotMatch(openingMarkup, /id=["']opening-player["']/);
  assert.match(html, /Todos os direitos reservados/i);
  assert.match(app, /const YOUTUBE_VIDEO_ID = "CxKRaR6kFYs";/);
  assert.match(app, /mute: "0"/);
  assert.match(app, /https:\/\/www\.youtube\.com\/embed\/\$\{YOUTUBE_VIDEO_ID\}/);
  assert.doesNotMatch(app, /youtube-nocookie\.com/i);
});

test("a abertura leva direto à reserva, inicia a trilha e exibe a foto sem recorte", () => {
  const html = readProjectFile("pagamentos", "ai", "index.html");
  const app = readProjectFile("pagamentos", "ai", "app.js");
  const css = readProjectFile("pagamentos", "ai", "arizona.css");

  assert.match(html, /id=["']start-experience["']/i);
  assert.match(app, /openingButton\.textContent = "Reservar mesa"/);
  assert.doesNotMatch(`${html}\n${app}`, /Entrar com trilha/i);
  assert.doesNotMatch(html, /id=["']toggle-sound["']/i);
  assert.match(css, /\.opening-image\s*\{[^}]*\/ contain no-repeat;/);
  assert.match(css, /\.opening-screen::before\s*\{[^}]*filter:\s*blur\(/);
  assert.match(app, /function startExperience\(\)[\s\S]*?sendPlayerCommand\("playVideo"\)/);
});

test("o mapa exibe somente mesa livre ou comprada", () => {
  const app = readProjectFile("pagamentos", "ai", "app.js");

  assert.match(app, /function tableAvailability\(/);
  assert.match(app, /✓ Livre/);
  assert.match(app, /✕ Comprada/);
  assert.doesNotMatch(app, new RegExp(["Em", "andamento"].join(" ")));
});
