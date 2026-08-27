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
  assert.match(html, /media\/brand\.png/);
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

test("CZS Labs labels new cinematic visual studies without confusing them with project records", () => {
  const html = fs.readFileSync(path.join(root, "czslbs", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "czslbs", "styles.css"), "utf8");

  for (const asset of [
    "media/lab-night-v1.png",
    "media/makers-desk-v1.png",
    "media/jurua-signal-v1.png",
  ]) {
    assert.ok(html.includes(asset), `expected ${asset} to be part of the visual lab`);
  }

  assert.match(html, /data-visual-lab/);
  assert.match(html, /IMAGENS CONCEITUAIS/);
  assert.match(css, /\.visual-lab/);
  assert.match(css, /\.visual-card--primary/);
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
