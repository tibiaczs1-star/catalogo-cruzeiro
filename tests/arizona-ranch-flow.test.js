const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const readProjectFile = (...segments) =>
  fs.readFileSync(path.join(projectRoot, ...segments), "utf8");

test("a reserva apresenta o mapa e segue direto ao pagamento sem Google", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  ["table", "payment"].forEach((step) => {
    assert.match(html, new RegExp(`data-flow-step=["']${step}["']`));
  });
  assert.doesNotMatch(html, /data-flow-step=["']login["']/);
  assert.doesNotMatch(html, /data-flow-step=["']details["']/);
  assert.doesNotMatch(html, /data-flow-step=["']whatsapp["']/);
  assert.match(app, /const flow = \["table", "payment"\]/);
  assert.match(html, /data-flow-step=["']table["'][^>]*>/);
  assert.match(html, /data-flow-step=["']payment["'][^>]*hidden/);
  assert.doesNotMatch(`${html}\n${app}`, /accounts\.google\.com|Conecte com Google|google-login/i);

  assert.match(html, /id=["']payment-pix["']/);
  assert.match(html, /id=["']payment-card["']/);
  assert.match(html, /Pagamento por cart[ãa]o em constru[çc][ãa]o/i);
});

test("a abertura mantém filmes próprios para desktop e mobile e a única chamada de voz", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const openingMarkup = html.match(
    /<section[^>]*id=["']opening-screen["'][^>]*>[\s\S]*?<\/section>/i,
  )?.[0];

  assert.match(html, /id=["']opening-screen["']/);
  assert.ok(openingMarkup);
  assert.equal((openingMarkup.match(/data-opening-video/g) || []).length, 2);
  assert.match(openingMarkup, /class=["'][^"']*opening-video-wide[^"']*["']/i);
  assert.match(openingMarkup, /class=["'][^"']*opening-video-mobile[^"']*["']/i);
  assert.match(openingMarkup, /id=["']opening-voice["']/i);
  assert.match(openingMarkup, /cinematic-v2\/opening-wide\.mp4/i);
  assert.match(openingMarkup, /cinematic-v2\/opening-mobile\.mp4/i);
  assert.doesNotMatch(openingMarkup, /arizona-entrada\.mp4/i);
  assert.match(openingMarkup, /arizona-welcome\.mp3/i);
  assert.match(openingMarkup, /class=["']opening-brand["']/i);
  assert.match(openingMarkup, /arizona-logo\.png/i);
  assert.match(openingMarkup, /Reserva para a Inaugura[çc][ãa]o Oficial do Arizona Ranch/i);
  assert.match(openingMarkup, /Sua mesa escolhida com calma/i);
  assert.doesNotMatch(openingMarkup, /opening-image/i);
  assert.doesNotMatch(openingMarkup, /opening-vignette/i);
  assert.doesNotMatch(openingMarkup, /Todos os direitos reservados/i);
  assert.doesNotMatch(html, /youtube\.com\/iframe_api/);
  assert.match(html, /soundscape\.js/);
  assert.doesNotMatch(app, /YOUTUBE_MUSIC_VIDEO_ID|openingMusicPlayer/);
  assert.match(app, /const OPENING_PRESENTATION_MAX_MS = 16500/);
  assert.match(app, /const OPENING_MUSIC_READY_TIMEOUT_MS = 4200/);
  assert.doesNotMatch(app, /sendPlayerCommand/);
  assert.match(app, /const OPENING_VOICE_TEXT = /);
  assert.match(app, /document\.querySelectorAll\("\[data-opening-video\]"\)/);
});

test("a abertura inicia a jornada com o vídeo mudo e apenas a narradora no soundscape", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");

  assert.match(html, /id=["']start-experience["']/i);
  assert.match(html, />Entrar no Arizona</);
  assert.doesNotMatch(html, /com som|som inicia|experiência sonora/i);
  assert.match(app, /openingButton\.textContent = "Entrar no Arizona"/);
  assert.match(app, /createSoundscape/);
  assert.match(app, /soundscape\.start\(\)/);
  const startExperienceBody = app.match(/async function startExperience\(\) \{([\s\S]*?)\n  function bindEvents/)?.[1] || "";
  assert.doesNotMatch(app, /openingVideo\.muted = false/);
  assert.match(startExperienceBody, /openingVideo\.muted = true/);
  assert.match(startExperienceBody, /openingVideo\.volume = 0/);
  assert.match(startExperienceBody, /createSoundscape\?\.\(\{ voice: openingVoice \}\)/);
  assert.match(app, /openingVideo\.play\(\)/);
  const videoPlayIndex = startExperienceBody.indexOf("const videoPlay = openingVideo.play()");
  assert.ok(videoPlayIndex > -1);
  assert.ok(startExperienceBody.includes("await Promise.race([videoPlay, wait(850)]).catch(() => {})"));
  assert.match(startExperienceBody, /soundscape\.start\(\)/);
  assert.doesNotMatch(app, /Promise\.race\(\[playOpeningVoice\(openingVoice\), wait\(5200\)\]\)/);
  assert.doesNotMatch(`${html}\n${app}`, /Entrar com trilha/i);
  assert.doesNotMatch(`${html}\n${app}`, /Liberar vídeo, voz e reserva/i);
  assert.doesNotMatch(html, /id=["']toggle-sound["']/i);
  assert.match(css, /\.opening-video\s*\{[^}]*object-fit:\s*cover;[^}]*filter:\s*none;/s);
  assert.match(css, /\.opening-video-wide\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.opening-video-mobile\s*\{[^}]*display:\s*none/);
  assert.match(css, /@media \(max-width: 900px\), \(orientation: portrait\)\s*\{[\s\S]*\.opening-video-wide\s*\{[^}]*display:\s*none[\s\S]*\.opening-video-mobile\s*\{[^}]*display:\s*block/);
  assert.doesNotMatch(css, /--opening-frame-width/);
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

test("a abertura não trava se vídeo ou áudio falharem", () => {
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const startExperience = app.match(/async function startExperience\(\) \{([\s\S]*?)\n  function bindEvents/)?.[1] || "";

  assert.match(startExperience, /soundscape\.start\(\)\.catch\(\(\) => \{\}\)/);
  assert.match(startExperience, /\.catch\(\(\) => \{\}\)/);
  const liveIndex = startExperience.indexOf('openingScreen?.classList.add("is-live")');
  const releaseIndex = startExperience.indexOf("window.setTimeout");
  assert.ok(liveIndex > -1);
  assert.ok(releaseIndex > -1);
  assert.ok(liveIndex < releaseIndex);
  assert.doesNotMatch(startExperience, /return;\s*\}\s*window\.setTimeout/);
});

test("a história usa quatro capítulos com doze quadros de tela cheia por cena", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const episodes = [...html.matchAll(/<article[^>]*data-episode=["'](\d+)["'][\s\S]*?<\/article>/gi)];
  const frames = [...html.matchAll(/<img[^>]*class=["'][^"']*cinema-shot-image[^"']*["'][^>]*src=["']([^"']+)["']/gi)]
    .map((match) => match[1]);
  const mobileFrames = [...html.matchAll(/<source[^>]*srcset=["']([^"']+-mobile\.webp)["']/gi)]
    .map((match) => match[1]);
  const narrations = [...html.matchAll(/data-narration=["']([^"']+)["']/gi)].map((match) => match[1]);

  assert.equal(episodes.length, 4);
  assert.equal(frames.length, 48);
  assert.equal(mobileFrames.length, 48);
  assert.equal(new Set(frames).size, frames.length);
  assert.equal(new Set(mobileFrames).size, mobileFrames.length);
  assert.equal(narrations.length, 4);
  assert.equal(new Set(narrations).size, narrations.length);
  ["gate", "trail", "saloon", "stage"].forEach((scene) => {
    assert.equal(frames.filter((source) => source.includes(`/sequences/${scene}-`) && source.endsWith("-wide.webp")).length, 12);
    assert.equal(mobileFrames.filter((source) => source.includes(`/sequences/${scene}-`) && source.endsWith("-mobile.webp")).length, 12);
    assert.ok(narrations.some((source) => source.endsWith(`voice/scene-${scene}.mp3`)));
  });
  assert.doesNotMatch(html, /cinema-shot-detail|detail\.png/i);
  assert.doesNotMatch(html, /class=["'][^"']*episode-frame/);
  assert.doesNotMatch(html, /Narrações desta experiência foram geradas por IA|FILME INTERATIVO/i);
  assert.match(html, /id=["']episode-count["']>01 \/ 04</i);
});

test("cada clique executa um corte de mini-filme com quadros, zoom e troca controlada", () => {
  const episodes = readProjectFile("pagamentos", "reservaranch", "episodes.js");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");

  assert.match(episodes, /async function transitionTo\(/);
  assert.match(episodes, /async function playFrameSequence\(/);
  assert.match(episodes, /is-advancing/);
  assert.match(episodes, /\.animate\(/);
  assert.match(episodes, /is-shot-wide/);
  assert.match(episodes, /is-comic/);
  assert.doesNotMatch(episodes, /is-shot-detail/);
  assert.match(episodes, /is-ready/);
  assert.match(episodes, /for \(let index = 1; index < frames\.length; index \+= 1\)/);
  assert.match(episodes, /const FRAME_INTERVAL_MS = 420/);
  assert.match(episodes, /const SCENE_TRANSITION_MS = 3200/);
  assert.match(episodes, /await delay\(reducedMotion\(\) \? 8 : FRAME_INTERVAL_MS\)/);
  assert.doesNotMatch(episodes, /setInterval/);
  assert.match(css, /perspective:\s*1400px/);
  assert.match(css, /clip-path:/);
  assert.match(css, /rotateY\(/);
  assert.match(css, /@keyframes cinema-wide-flight/);
  assert.match(css, /@keyframes comic-panel-sweep/);
  assert.match(css, /@keyframes film-frame-change/);
  assert.match(css, /\.film-keyframe/);
});

test("os dois primeiros capítulos vendem a abertura, as melhores mesas e a experiência familiar", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  assert.doesNotMatch(html, /velho oeste/i);
  assert.match(html, /A porteira abre em 05 de setembro/i);
  assert.match(html, /melhores mesas ainda disponíveis/i);
  assert.match(html, /ambiente foi pensado para criar uma experiência única, familiar e cheia de sentimentos/i);
  assert.match(app, /let openingJourneyStarted = false/);
  assert.match(app, /if \(openingJourneyStarted\) return/);
});

test("o terceiro capítulo apresenta a celebração antes do mapa", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const thirdEpisode = html.match(/<article[^>]*data-episode=["']2["'][^>]*>[\s\S]*?<\/article>/i)?.[0] || "";

  assert.match(thirdEpisode, /Capítulo III · a celebração/i);
  assert.match(thirdEpisode, /Tudo preparado para receber você/i);
  assert.match(thirdEpisode, /Conforto, música e bons encontros/i);
  assert.match(thirdEpisode, /Chegar ao mapa/i);
});

test("o quarto capítulo encerra no mapa sem etapas intermediárias", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const finalEpisode = html.match(/<article[^>]*data-scene=["']stage["'][^>]*>[\s\S]*?<\/article>/i)?.[0] || "";
  assert.match(finalEpisode, /Agora chegou a hora de escolher o seu lugar/i);
  assert.match(finalEpisode, /mapa de mesas/i);
  assert.doesNotMatch(finalEpisode, /Google/i);
  assert.match(finalEpisode, /data-finish-episodes/i);
});

test("desktop e mobile recebem composições de imagem separadas", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");
  const mobileSources = [...html.matchAll(/<source[^>]+sequences\/([a-z]+)-\d{2}-mobile\.webp/gi)].map((match) => match[1]);
  const wideSources = [...html.matchAll(/<img[^>]+sequences\/([a-z]+)-\d{2}-wide\.webp/gi)].map((match) => match[1]);
  assert.equal(mobileSources.length, 48);
  assert.equal(wideSources.length, 48);
  assert.deepEqual([...new Set(mobileSources)].sort(), ["gate", "saloon", "stage", "trail"]);
  assert.deepEqual([...new Set(wideSources)].sort(), ["gate", "saloon", "stage", "trail"]);
  assert.match(css, /\.cinema-shot-image\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s);
  assert.doesNotMatch(css, /\.cinema-shot-detail/);
});

test("a mesa escolhida abre o capítulo final com Luzienne antes do pagamento", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");
  const finale = html.match(/<section[^>]*data-reservation-finale[^>]*>[\s\S]*?<\/section>/i)?.[0] || "";

  assert.match(finale, /Luzienne Lucena/i);
  assert.match(finale, /buffet/i);
  assert.match(finale, /drinks/i);
  assert.match(finale, /atendimento VIP/i);
  assert.match(finale, /scene-finale\.mp3/i);
  assert.match(finale, /data-continue-payment/i);
  assert.match(app, /function openReservationFinale\(\)/);
  assert.match(app, /playScene\?\.\("finale"\)/);
  assert.match(app, /tableNext\.addEventListener\(["']click["'],\s*openReservationFinale\)/);
  assert.match(app, /showFlowStep\(["']payment["']\)/);
  assert.match(css, /\.finale-artist\{[^}]*width:min\(24vw,340px\)/s);
  assert.match(css, /\.finale-artist img\{[^}]*max-height:60vh/s);
  assert.match(css, /@media \(max-width: 900px\), \(orientation: portrait\)[\s\S]*?\.finale-artist\{[^}]*width:min\(44vw,220px\)/s);
  assert.match(css, /@media \(max-width: 900px\), \(orientation: portrait\)[\s\S]*?\.finale-artist img\{[^}]*max-height:34vh/s);
});

test("a narradora abre a experiência e os capítulos só começam quando a abertura termina", () => {
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const episodes = readProjectFile("pagamentos", "reservaranch", "episodes.js");
  const startExperience = app.match(/async function startExperience\(\) \{([\s\S]*?)\n  function bindEvents/)?.[1] || "";

  assert.match(startExperience, /ArizonaEpisodes\?\.begin\?\.\(\)/);
  assert.doesNotMatch(episodes, /closest\(["']#start-experience["']\)/);
  assert.doesNotMatch(episodes, /setTimeout\(begin,\s*1100\)/);
});

test("a experiência termina no mapa e a landing aparece somente depois do comprovante", () => {
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");
  const episodes = readProjectFile("pagamentos", "reservaranch", "episodes.js");
  const css = readProjectFile("pagamentos", "reservaranch", "arizona.css");
  const reserve = app.match(/async function reserveSelectedTable\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  const upload = app.match(/async function uploadReceipt\(file\) \{([\s\S]*?)\n  \}/)?.[1] || "";

  assert.match(episodes, /function completePurchase\(\)/);
  assert.match(episodes, /classList\.add\(["']is-landing["']\)/);
  assert.doesNotMatch(reserve, /ArizonaEpisodes\?\.completePurchase\?\.\(\)/);
  assert.match(upload, /ArizonaEpisodes\?\.completePurchase\?\.\(\)/);
  assert.match(css, /body:not\(\.is-purchase\):not\(\.is-landing\) \.site-shell\s*\{[^}]*display:\s*none/s);
  assert.match(css, /body\.is-landing \.site-shell\s*\{[^}]*display:\s*flex/s);
});

test("o ambiente usa somente gravações locais e nunca sintetiza efeitos", () => {
  const soundscape = readProjectFile("pagamentos", "reservaranch", "soundscape.js");

  ["wind", "cow", "horse", "gun", "gate", "boots", "night", "fire", "saloon", "coin"].forEach((sound) => {
    assert.match(soundscape, new RegExp(`${sound}:\\s*["'][^"']+\\.mp3["']`));
  });
  assert.doesNotMatch(soundscape, /AudioContext|webkitAudioContext|createOscillator|oscillator/i);
  assert.match(soundscape, /pickNonRepeating/);
  assert.doesNotMatch(soundscape, /sessionStorage|localStorage/);
  assert.match(soundscape, /playSceneNarration/);
  assert.match(soundscape, /const SCENE_SOUND_LAYERS =/);
  assert.match(soundscape, /gate:\s*\["gate", "horse"\]/);
  assert.match(soundscape, /trail:\s*\["boots", "night"\]/);
  assert.match(soundscape, /saloon:\s*\["saloon", "fire"\]/);
  assert.match(soundscape, /stage:\s*\["saloon", "coin"\]/);
  assert.match(soundscape, /finale:\s*\["saloon", "fire"\]/);
  assert.match(soundscape, /function playScene\(scene\)/);
  assert.match(soundscape, /sceneSoundsPlayed/);
  assert.match(soundscape, /narrationsPlayed/);
  assert.match(soundscape, /let introPlayed = false/);
  assert.match(soundscape, /if \(voice && !introPlayed\)/);

  [
    ["assets", "arizona-welcome.mp3"],
    ["assets", "voice", "scene-gate.mp3"],
    ["assets", "voice", "scene-trail.mp3"],
    ["assets", "voice", "scene-saloon.mp3"],
    ["assets", "voice", "scene-stage.mp3"],
    ["assets", "voice", "scene-finale.mp3"],
  ].forEach((segments) => {
    const audioPath = path.join(projectRoot, "pagamentos", "reservaranch", ...segments);
    assert.ok(fs.existsSync(audioPath));
    assert.ok(fs.statSync(audioPath).size > 10_000);
  });
});

test("usa exclusivamente o QR Pix e o copia e cola gerados pelo servidor", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.match(html, /Pix copia e cola — código exato do QR/);
  assert.match(html, /As quebras na tela não alteram o código/);
  assert.doesNotMatch(app, /PIX_PAYMENT_OPTIONS/);
  assert.match(app, /payment\.qrCodeDataUrl/);
  assert.match(app, /payment\.pixCode/);
  assert.match(app, /payment\.pixKey/);
});

test("o mapa exibe somente mesa livre ou comprada", () => {
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.match(app, /function tableAvailability\(/);
  assert.match(app, /✓ Livre/);
  assert.match(app, /✕ Comprada/);
  assert.doesNotMatch(app, new RegExp(["Em", "andamento"].join(" ")));
});

test("a compra pública usa token próprio sem solicitar conta Google", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const app = readProjectFile("pagamentos", "reservaranch", "app.js");

  assert.doesNotMatch(html, /id=["']details-name["']/i);
  assert.doesNotMatch(html, /id=["']details-email["']/i);
  assert.doesNotMatch(html, /id=["']contact-phone["']/i);
  assert.doesNotMatch(`${html}\n${app}`, /Google|accounts\.google\.com|google-login/i);
  assert.match(app, /reservationToken/);
  assert.match(app, /x-arizona-reservation-token/);
  assert.match(app, /payload\.accessToken/);
  assert.match(app, /customer: \{ name: "Cliente Arizona Ranch", email: "" \}/);
});

test("a landing pós-comprovante separa imagens criadas e fotos originais e oferece suporte", () => {
  const html = readProjectFile("pagamentos", "reservaranch", "index.html");
  const generated = [...html.matchAll(/data-gallery=["']generated["'][\s\S]*?<\/section>/gi)][0]?.[0] || "";
  const originals = [...html.matchAll(/data-gallery=["']originals["'][\s\S]*?<\/section>/gi)][0]?.[0] || "";
  const sources = [...html.matchAll(/data-gallery-item[^>]+src=["']([^"']+)/gi)].map((match) => match[1]);

  assert.match(generated, /cinematic-v2\/(gate|trail|saloon|stage)-wide\.png/i);
  assert.match(originals, /assets\/gallery\//i);
  assert.equal(new Set(sources).size, sources.length);
  assert.match(html, /pagamento protegido|comprovante/i);
  assert.match(html, /wa\.me\//i);
  assert.match(html, /class=["'][^"']*whatsapp-float/i);
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
