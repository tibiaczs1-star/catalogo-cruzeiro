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

test("cinematic loader is valid body content and never traps the default portal", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const bodyAt = html.indexOf("<body>");
  const loaderAt = html.indexOf('id="cinematicLoader"');
  const headEndAt = html.indexOf("</head>");

  assert.ok(bodyAt > headEndAt, "body must begin after head");
  assert.ok(loaderAt > bodyAt, "cinematic loader must be inside body");
  assert.match(html, /var requested=.*forceIntro.*intro/);
  assert.match(html, /var skip=.*skipIntro.*!requested/);
});
