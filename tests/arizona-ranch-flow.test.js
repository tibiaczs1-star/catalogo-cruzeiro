const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const readProjectFile = (...segments) =>
  fs.readFileSync(path.join(projectRoot, ...segments), "utf8");

test("a reserva conduz a pessoa por login, dados, mesa, WhatsApp e pagamento", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");

  ["login", "details", "table", "whatsapp", "payment"].forEach((step) => {
    assert.match(html, new RegExp(`data-flow-step=["']${step}["']`));
  });

  assert.match(html, /id=["']payment-pix["']/);
  assert.match(html, /id=["']payment-card["']/);
  assert.match(html, /Pagamento por cart[ãa]o em constru[çc][ãa]o/i);
});

test("a abertura incorpora a trilha oficial sem camada visual extra", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const openingMarkup = html.match(
    /<section[^>]*id=["']opening-screen["'][^>]*>[\s\S]*?<\/section>/i,
  )?.[0];

  assert.match(html, /id=["']opening-screen["']/);
  assert.ok(openingMarkup);
  assert.match(openingMarkup, /id=["']opening-video["']/i);
  assert.match(openingMarkup, /id=["']opening-voice["']/i);
  assert.doesNotMatch(openingMarkup, /id=["']opening-player["']/);
  assert.match(openingMarkup, /arizona-entrada\.mp4/i);
  assert.match(openingMarkup, /arizona-welcome\.mp3/i);
  assert.match(openingMarkup, /class=["']opening-brand["']/i);
  assert.match(openingMarkup, /arizona-logo\.png/i);
  assert.match(openingMarkup, /Reserva para a Inaugura[çc][ãa]o Oficial do Arizona Ranch/i);
  assert.doesNotMatch(openingMarkup, /opening-image/i);
  assert.doesNotMatch(openingMarkup, /opening-vignette/i);
  assert.doesNotMatch(openingMarkup, /Todos os direitos reservados/i);
  assert.doesNotMatch(app, /YOUTUBE_VIDEO_ID|youtube\.com|youtube-nocookie\.com|sendPlayerCommand/);
  assert.match(app, /const OPENING_VOICE_TEXT = /);
});

test("a abertura leva direto à reserva, inicia a trilha e mantém o vídeo inteiro", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");

  assert.match(html, /id=["']start-experience["']/i);
  assert.match(html, />Iniciar reserva</);
  assert.match(app, /openingButton\.textContent = "Iniciar reserva"/);
  assert.match(app, /openingVideo\.muted = true/);
  assert.match(app, /openingVideo\.volume = 0/);
  assert.doesNotMatch(app, /openingVideo\.muted = false/);
  assert.match(app, /openingVideo\.play\(\)/);
  assert.match(app, /await playOpeningVoice\(openingVoice\)/);
  assert.doesNotMatch(app, /Promise\.race\(\[playOpeningVoice\(openingVoice\), wait\(5200\)\]\)/);
  assert.doesNotMatch(`${html}\n${app}`, /Entrar com trilha/i);
  assert.doesNotMatch(`${html}\n${app}`, /Liberar vídeo, voz e reserva/i);
  assert.doesNotMatch(html, /id=["']toggle-sound["']/i);
  assert.match(css, /\.opening-video\s*\{[^}]*object-fit:\s*contain;[^}]*filter:\s*none;/s);
  assert.doesNotMatch(css, /\.opening-screen::before/);
  assert.doesNotMatch(css, /\.opening-screen::after/);
  assert.doesNotMatch(css, /\.opening-image/);
  assert.match(css, /@keyframes logo-entrance/);
});

test("usa os Pix copia e cola exatos dos QR enviados", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.match(html, /Pix copia e cola — código exato do QR/);
  assert.match(html, /As quebras na tela não alteram o código/);
  assert.match(app, /5406100\.005802BR5920SILEN DE PAULO SOUZA6014RIO DE JANEIRO62070503\*\*\*63042013/);
  assert.match(app, /5406200\.005802BR5920SILEN DE PAULO SOUZA6014RIO DE JANEIRO62070503\*\*\*63048038/);
});

test("o mapa exibe somente mesa livre ou comprada", () => {
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.match(app, /function tableAvailability\(/);
  assert.match(app, /✓ Livre/);
  assert.match(app, /✕ Comprada/);
  assert.doesNotMatch(app, new RegExp(["Em", "andamento"].join(" ")));
});

test("identificação permite corrigir dados e mantém o Google simples", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.doesNotMatch(html, /id=["']details-name["'][^>]*\breadonly\b/i);
  assert.doesNotMatch(html, /id=["']details-email["'][^>]*\breadonly\b/i);
  assert.match(html, /Conecte com Google/i);
  assert.match(app, /elements\.accountTitle\.textContent = "Conectar com Google";/);
  assert.doesNotMatch(app, /Conectado como/);
  const googleAuth = app.match(/async function handleGoogleCredential\(response\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.doesNotMatch(googleAuth, /showToast\(error\.message, "error"\)/);
  assert.match(googleAuth, /showToast\("Não foi possível conectar com Google agora\. Tente novamente\.", "error"\)/);
  assert.match(app, /customer: \{ name: state\.customer\.name, email: state\.customer\.email \}/);
});

test("o painel usa sessão própria de administrador sem login Google", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "admin.html");
  const app = readProjectFile("pagamentos", "reservaranch", "admin.js");

  assert.match(html, /id=["']admin-login-form["']/);
  assert.match(html, /id=["']admin-password["'][^>]*type=["']password["']/);
  assert.doesNotMatch(html, /accounts\.google\.com/);
  assert.doesNotMatch(app, /renderGoogleLogin/);
  assert.match(app, /\/admin\/login/);
});
