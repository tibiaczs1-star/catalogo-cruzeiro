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

test("separa imagens criadas, elementos de layout e fotos originais em galerias próprias", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  const app = read("pagamentos", "reservaranch", "app.js");

  const galleryImages = [...html.matchAll(/class=["'][^"']*gallery-image[^"']*["'][^>]*src=["']([^"']+\.(?:webp|png))["']/g)];
  assert.ok(galleryImages.length >= 8, "as duas galerias precisam manter pelo menos 8 imagens editoriais");
  const generatedGallery = html.match(/<div class="editorial-gallery generated-gallery"[\s\S]*?<\/div>/)?.[0] || "";
  const originalGallery = html.match(/<div class="editorial-gallery original-gallery"[\s\S]*?<\/div>/)?.[0] || "";
  assert.match(generatedGallery, /assets\/ai\/palco-noite\.png/);
  assert.match(generatedGallery, /assets\/ai\/brinde-noite\.png/);
  assert.match(generatedGallery, /assets\/ai\/hero-porteira\.png/);
  assert.doesNotMatch(generatedGallery, /assets\/gallery\//);
  assert.doesNotMatch(generatedGallery, /kit-western\.png/);
  assert.match(originalGallery, /assets\/gallery\/marca-arizona\.webp/);
  assert.doesNotMatch(originalGallery, /assets\/ai\//);
  assert.match(html, /<aside class="western-kit"[\s\S]*assets\/ai\/kit-western\.png/);
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

test("a experiência de retenção mantém o visitante orientado para a compra", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  const app = read("pagamentos", "reservaranch", "app.js");
  const css = read("pagamentos", "reservaranch", "arizona.css");

  assert.match(html, /id=["']trail-progress["']/);
  assert.match(html, /class=["'][^"']*event-countdown/);
  assert.match(html, /data-event-date=["']2026-09-05T20:00:00-05:00["']/);
  assert.match(html, /Aqui a noite começa antes do primeiro acorde/i);
  assert.match(html, /Som ambiente opcional/i);
  assert.match(app, /setupEventCountdown/);
  assert.match(app, /setupCinematicScroll/);
  assert.match(app, /requestAnimationFrame/);
  assert.match(css, /\.trail-progress/);
  assert.match(css, /\.ranch-moment/);
});

test("o modal navega somente dentro da galeria escolhida", () => {
  const app = read("pagamentos", "reservaranch", "app.js");

  assert.match(app, /closest\("\.editorial-gallery"\)/);
  assert.match(app, /activeCards/);
  assert.doesNotMatch(app, /currentIndex = \(index \+ cards\.length\) % cards\.length/);
});
