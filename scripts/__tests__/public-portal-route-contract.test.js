"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");

test("public portal keeps canonical entry routes for every published subsite", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

  for (const route of ["bookray", "ashotelaria", "questfest", "metafest"]) {
    assert.match(server, new RegExp(`pathname === "\\/${route}"`));
    assert.match(server, new RegExp(`Location: "\\/${route}\\/"`));
  }

  assert.match(server, /pathname === "\/reservar"/);
  assert.match(server, /pathname === "\/reservar\/"/);
  assert.match(server, /Location: "\/reservar\/hotel-jurua-palace\/"/);
  assert.match(server, /pathname === "\/pubpaid" \|\| pathname === "\/pubpaid\/"/);
});

test("CZS Labs has a canonical public subpage with its own visual shell", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const pagePath = path.join(root, "czslbs", "index.html");
  const stylesheetPath = path.join(root, "czslbs", "styles.css");
  const scriptPath = path.join(root, "czslbs", "script.js");

  assert.match(server, /pathname === "\/czslbs"/);
  assert.match(server, /Location: "\/czslbs\/"/);
  assert.match(server, /pathname\.startsWith\("\/czslbs\/"\)/);
  assert.ok(fs.existsSync(pagePath), "CZS Labs must provide its public entry page");
  assert.ok(fs.existsSync(stylesheetPath), "CZS Labs must provide its dedicated stylesheet");
  assert.ok(fs.existsSync(scriptPath), "CZS Labs must provide its visual interaction script");

  const html = fs.readFileSync(pagePath, "utf8");
  assert.match(html, /CZS LABS/);
  assert.match(html, /Tecnologia para o Vale do Juruá/);
  assert.doesNotMatch(html, /media\/brand\.png/);
  assert.doesNotMatch(html, /hero-signal/);
  assert.doesNotMatch(html, /hero-river/);
  assert.doesNotMatch(html, /media\/portal\.png/);
  assert.doesNotMatch(html, /data-visual-lab/);
  assert.doesNotMatch(html, /catalog-spotlight/);
  assert.match(html, /Quem cria tecnologia decide o futuro/);
  assert.match(html, /Acre e o Brasil/);
});

test("CZS Labs frames its work as a cinematic proof of regional autonomy", () => {
  const html = fs.readFileSync(path.join(root, "czslbs", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "czslbs", "styles.css"), "utf8");

  assert.match(html, /data-cinematic-hero/);
  assert.match(html, /data-work-reel/);
  assert.match(html, /data-technology-atlas/);
  assert.match(html, /Do Vale do Juruá para uma\s+<em>autonomia<\/em>\s+que fica\./);
  assert.match(css, /\.hero--cinematic/);
  assert.match(css, /\.work-ledger/);
});

test("CZS Labs presents projects beside its multicapable creative studio", () => {
  const html = fs.readFileSync(path.join(root, "czslbs", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "czslbs", "styles.css"), "utf8");

  assert.match(html, /data-studio-capabilities/);
  assert.match(html, /Vídeo, fotografia e direção/);
  assert.match(html, /Influência e distribuição/);
  assert.match(html, /EQUIPE MULTICAPAZ/);
  assert.match(html, /data-creative-stack/);
  assert.match(html, /EFEITOS PARA WEB/);
  assert.match(html, /RETENÇÃO RESPONSÁVEL/);
  assert.match(css, /\.work-columns/);
  assert.match(css, /\.studio-capabilities/);
  assert.match(css, /\.creative-stack/);
});

test("CZS Labs explains regional autonomy without generic river frames or legacy portal captures", () => {
  const html = fs.readFileSync(path.join(root, "czslbs", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "czslbs", "styles.css"), "utf8");

  assert.match(html, /TECNOLOGIA É PODER DE DECISÃO/);
  assert.match(html, /data-regional-shift/);
  assert.match(html, /Tecnologia organiza informação, comércio, serviços, cultura e oportunidades/);
  assert.match(css, /\.regional-shift/);
  assert.match(css, /\.shift-map/);
});

test("CZS Labs supports an ambitious motion layer without leaving accessibility behind", () => {
  const html = fs.readFileSync(path.join(root, "czslbs", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "czslbs", "styles.css"), "utf8");
  const script = fs.readFileSync(path.join(root, "czslbs", "script.js"), "utf8");

  assert.match(html, /data-signal-field/);
  assert.match(html, /data-motion-toggle/);
  assert.match(html, /data-scroll-progress/);
  assert.match(html, /data-ambition-atlas/);
  assert.match(html, /Quem vive o problema também precisa controlar a ferramenta/);
  assert.match(css, /@view-transition/);
  assert.match(css, /animation-timeline:\s*view\(\)/);
  assert.match(css, /\.motion-toggle/);
  assert.match(script, /czs-labs-motion/);
  assert.match(script, /visibilitychange/);
});

test("cinematic loader is valid body content and keeps daily and skip controls", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const bodyAt = html.indexOf("<body");
  const loaderAt = html.indexOf('id="cinematicLoader"');
  const headEndAt = html.indexOf("</head>");

  assert.ok(bodyAt > headEndAt, "body must begin after head");
  assert.ok(loaderAt > bodyAt, "cinematic loader must be inside body");
  assert.match(html, /var requested=.*forceIntro.*intro/);
  assert.match(html, /var disabled=.*skipIntro/);
  assert.match(html, /var showIntro=!disabled&&\(requested\|\|!seenToday\)/);
});
