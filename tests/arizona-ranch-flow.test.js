const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const readProjectFile = (...segments) =>
  fs.readFileSync(path.join(projectRoot, ...segments), "utf8");

test("a reserva apresenta o mapa antes do Google e segue direto ao pagamento", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  ["table", "login", "payment"].forEach((step) => {
    assert.match(html, new RegExp(`data-flow-step=["']${step}["']`));
  });
  assert.doesNotMatch(html, /data-flow-step=["']details["']/);
  assert.doesNotMatch(html, /data-flow-step=["']whatsapp["']/);
  assert.match(app, /const flow = \["table", "login", "payment"\]/);
  assert.match(html, /data-flow-step=["']table["'][^>]*>/);
  assert.match(html, /data-flow-step=["']login["'][^>]*hidden/);

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
  assert.match(openingMarkup, /id=["']opening-player["']/);
  assert.match(openingMarkup, /arizona-entrada\.mp4/i);
  assert.match(openingMarkup, /arizona-welcome\.mp3/i);
  assert.match(openingMarkup, /class=["']opening-brand["']/i);
  assert.match(openingMarkup, /arizona-logo\.png/i);
  assert.match(openingMarkup, /Reserva para a Inaugura[çc][ãa]o Oficial do Arizona Ranch/i);
  assert.match(openingMarkup, /Sua mesa escolhida com calma/i);
  assert.doesNotMatch(openingMarkup, /opening-image/i);
  assert.doesNotMatch(openingMarkup, /opening-vignette/i);
  assert.doesNotMatch(openingMarkup, /Todos os direitos reservados/i);
  assert.match(html, /youtube\.com\/iframe_api/);
  assert.match(app, /const YOUTUBE_MUSIC_VIDEO_ID = "CxKRaR6kFYs"/);
  assert.match(app, /const OPENING_MUSIC_PRESENTATION_VOLUME = 18/);
  assert.match(app, /const RESERVATION_MUSIC_VOLUME = 38/);
  assert.match(app, /const OPENING_PRESENTATION_MAX_MS = 16500/);
  assert.match(app, /const OPENING_MUSIC_READY_TIMEOUT_MS = 4200/);
  assert.doesNotMatch(app, /sendPlayerCommand/);
  assert.match(app, /const OPENING_VOICE_TEXT = /);
});

test("a abertura leva direto à reserva, inicia a trilha e mantém o vídeo inteiro", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");

  assert.match(html, /id=["']start-experience["']/i);
  assert.match(html, />Entrar no Arizona</);
  assert.doesNotMatch(html, /com som|som inicia|experiência sonora/i);
  assert.match(app, /openingButton\.textContent = "Entrar no Arizona"/);
  assert.match(app, /openingButton\.textContent = "Preparando a entrada…"/);
  assert.match(app, /let openingMusicIsReady = false/);
  assert.match(app, /let openingMusicLoadTimedOut = false/);
  assert.match(app, /openingButton\.disabled = true; openingButton\.textContent = "Preparando a entrada…"/);
  assert.match(app, /window\.setTimeout\(\(\) => \{\s*openingMusicLoadTimedOut = true;\s*releaseStart\(\);\s*\}, OPENING_MUSIC_READY_TIMEOUT_MS\)/);
  assert.match(app, /releaseStart\(\);/);
  assert.match(app, /ensureOpeningMusicPlayer\(\)\s*\.then\(\(\) => \{/);
  assert.doesNotMatch(app, /openingButton\.textContent = "Atualize para iniciar"/);
  assert.match(app, /getIframe\?\.\(\)\?\.setAttribute\("allow", "autoplay; encrypted-media; picture-in-picture"\)/);
  assert.match(app, /openingVideo\.muted = false/);
  assert.match(app, /openingVideo\.volume = \.52/);
  assert.match(app, /window\.startRanchAmbience\?\.\(\)/);
  assert.match(app, /openingVideo\.play\(\)/);
  assert.match(app, /await Promise\.race\(\[\s*playOpeningVoice\(openingVoice\),\s*wait\(OPENING_PRESENTATION_MAX_MS\),\s*\]\)/);
  const startExperienceBody = app.match(/async function startExperience\(\) \{([\s\S]*?)\n  function bindEvents/)?.[1] || "";
  const videoPlayIndex = startExperienceBody.indexOf("const videoPlay = openingVideo.play()");
  const voicePlayIndex = startExperienceBody.indexOf("playOpeningVoice(openingVoice)");
  const musicPlayIndex = startExperienceBody.indexOf("await startOpeningMusic()");
  assert.ok(videoPlayIndex > -1);
  assert.ok(startExperienceBody.includes("await Promise.race([videoPlay, wait(850)]).catch(() => {})"));
  assert.ok(voicePlayIndex > -1);
  assert.ok(musicPlayIndex > -1);
  assert.ok(videoPlayIndex < voicePlayIndex);
  assert.ok(voicePlayIndex < musicPlayIndex);
  const startMusicBody = app.match(/async function startOpeningMusic\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.ok(startMusicBody.includes("player.playVideo?.()"));
  assert.ok(startMusicBody.includes("setOpeningMusicVolume(OPENING_MUSIC_PRESENTATION_VOLUME)"));
  assert.equal(startMusicBody.includes("await Promise.race([\n      ensureOpeningMusicPlayer()"), false);
  assert.ok(startMusicBody.indexOf("player.playVideo?.()") < startMusicBody.indexOf("await Promise.race(["));
  assert.match(app, /function setOpeningMusicVolume\(volume\)/);
  assert.match(app, /if \(step === "table"\) setOpeningMusicVolume\(RESERVATION_MUSIC_VOLUME\)/);
  assert.doesNotMatch(app, /Promise\.race\(\[playOpeningVoice\(openingVoice\), wait\(5200\)\]\)/);
  assert.doesNotMatch(`${html}\n${app}`, /Entrar com trilha/i);
  assert.doesNotMatch(`${html}\n${app}`, /Liberar vídeo, voz e reserva/i);
  assert.doesNotMatch(html, /id=["']toggle-sound["']/i);
  assert.match(css, /\.opening-video\s*\{[^}]*object-fit:\s*contain;[^}]*filter:\s*none;/s);
  assert.match(css, /--opening-frame-width: min\(100vw, calc\(100svh \* 9 \/ 16\)\)/);
  assert.match(css, /\.opening-screen\.is-live \.opening-brand\s*\{[^}]*left:\s*calc\(\(100vw - var\(--opening-frame-width\)\) \/ 2/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*\.opening-screen\.is-live \.opening-brand\s*\{[^}]*left:\s*max\(14px, calc\(\(100vw - var\(--opening-frame-width\)\) \/ 2 \+ 14px\)\)/);
  assert.doesNotMatch(css, /@media \(max-width: 640px\)\s*\{[^}]*\.opening-brand\s*\{[^}]*top:\s*18px/s);
  assert.match(css, /\.opening-screen::before/);
  assert.match(css, /\.opening-screen::after/);
  assert.match(css, /@keyframes cinematic-glow-in/);
  assert.match(css, /@keyframes stage-line/);
  assert.match(css, /@keyframes tagline-reveal/);
  assert.match(css, /@keyframes button-settle/);
  assert.match(css, /@keyframes gold-veil-pass/);
  assert.match(css, /@keyframes cta-glimmer/);
  assert.match(css, /@keyframes step-gold-rise/);
  assert.match(css, /\.opening-screen\.is-live::after\s*\{[^}]*gold-veil-pass/s);
  assert.match(css, /\.button-gold::after\s*\{[^}]*cta-glimmer/s);
  assert.match(css, /\[data-flow-step\]:not\(\[hidden\]\)\s*\{[^}]*step-gold-rise/s);
  assert.match(css, /logo-breathe 2\.7s ease-in-out 1\.45s 2/);
  assert.match(css, /\.decor-lantern[^}]*mix-blend-mode:screen/);
  assert.doesNotMatch(css, /premium-sweep/);
  assert.doesNotMatch(css, /button-shine/);
  assert.doesNotMatch(css, /logo-breathe 2\.7s ease-in-out 1\.45s infinite/);
  assert.doesNotMatch(css, /\.opening-image/);
  assert.match(css, /@keyframes logo-entrance/);
});

test("a abertura não trava quando a trilha externa atrasa no celular", () => {
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const setupOpening = app.match(/function setupOpening\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  const startExperience = app.match(/async function startExperience\(\) \{([\s\S]*?)\n  function bindEvents/)?.[1] || "";

  assert.match(setupOpening, /releaseStart/);
  assert.match(setupOpening, /OPENING_MUSIC_READY_TIMEOUT_MS/);
  assert.match(setupOpening, /openingMusicLoadTimedOut = true/);
  assert.match(startExperience, /await startOpeningMusic\(\);/);
  assert.match(startExperience, /catch \(error\) \{[\s\S]*openingMusicLoadTimedOut = true;[\s\S]*Abertura seguindo sem bloquear pela trilha externa/s);
  const liveIndex = startExperience.indexOf('openingScreen?.classList.add("is-live")');
  const musicIndex = startExperience.indexOf("await startOpeningMusic();");
  const musicCatchIndex = startExperience.indexOf("catch (error)", musicIndex);
  const releaseIndex = startExperience.indexOf("window.setTimeout");
  assert.ok(liveIndex > -1);
  assert.ok(musicIndex > -1);
  assert.ok(musicCatchIndex > -1);
  assert.ok(releaseIndex > -1);
  assert.ok(liveIndex < musicIndex);
  assert.ok(musicIndex < musicCatchIndex);
  assert.ok(musicCatchIndex < releaseIndex);
  assert.doesNotMatch(startExperience, /showToast\("A trilha ainda não iniciou/);
  assert.doesNotMatch(startExperience, /return;\s*\}\s*window\.setTimeout/);
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

test("Google identifica o comprador apenas quando ele avança para pagar", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.doesNotMatch(html, /id=["']details-name["']/i);
  assert.doesNotMatch(html, /id=["']details-email["']/i);
  assert.doesNotMatch(html, /id=["']contact-phone["']/i);
  assert.match(html, /Conecte com Google/i);
  assert.match(app, /elements\.accountTitle\.textContent = "Conectar com Google";/);
  assert.doesNotMatch(app, /Conectado como/);
  const googleAuth = app.match(/async function handleGoogleCredential\(response\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.doesNotMatch(googleAuth, /showToast\(error\.message, "error"\)/);
  assert.match(googleAuth, /showToast\("Não foi possível conectar com Google agora\. Tente novamente\.", "error"\)/);
  assert.match(app, /customer: \{ name: user\.name, email: user\.email \}/);
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
