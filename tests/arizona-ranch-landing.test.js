"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), "utf8");

test("a landing apresenta o lugar antes de conduzir para a reserva", () => {
  const html = read("pagamentos", "reservaranch", "index.html");

  assert.match(html, /id=["']experiencia["']/);
  assert.match(html, /id=["']galeria["']/);
  assert.match(html, /id=["']mesas-e-valores["']/);
  assert.match(html, /id=["']como-funciona["']/);
  assert.match(html, /id=["']duvidas["']/);
  assert.match(html, /href=["']#mapa-de-mesas["'][^>]*>[^<]*(?:Reservar|Garantir|Escolher)/i);
  assert.match(html, /Mesa para 2[^]*R\$ 100,00/i);
  assert.match(html, /Mesa para 4[^]*R\$ 200,00/i);
});

test("a linguagem de venda reforça Arizona Ranch como bar pub western", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  assert.match(html, /bar pub western/i);
  assert.match(html, /Arizona Ranch/i);
  assert.match(html, /palco|música ao vivo/i);
  assert.match(html, /O portão vai abrir/i);
});

test("a galeria combina imagens realistas e símbolos western com lightbox acessível", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  const app = read("pagamentos", "reservaranch", "app.js");

  const galleryImages = [...html.matchAll(/class=["'][^"']*gallery-image[^"']*["'][^>]*src=["']([^"']+\.(?:webp|png))["']/g)];
  assert.ok(galleryImages.length >= 8, "a galeria precisa de pelo menos 8 imagens editoriais");
  assert.match(html, /assets\/ai\/kit-western\.png/);
  assert.match(html, /id=["']gallery-dialog["'][^>]*aria-label=/);
  assert.match(html, /id=["']gallery-dialog-image["'][^>]*alt=/);
  assert.match(app, /setupGallery/);
  assert.match(app, /ArrowLeft/);
  assert.match(app, /ArrowRight/);
});

test("a página inclui metadados sociais, FAQ e CTA móvel", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  const css = read("pagamentos", "reservaranch", "arizona.css");

  assert.match(html, /property=["']og:title["']/);
  assert.match(html, /property=["']og:image["']/);
  assert.match(html, /class=["'][^"']*mobile-reserve-bar/);
  assert.match(html, /<details[^>]*class=["'][^"']*faq-item/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
