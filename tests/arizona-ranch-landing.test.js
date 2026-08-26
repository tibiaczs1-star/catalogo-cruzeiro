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
  assert.match(html, /data-cinematic-scene=["']trail["']/);
  assert.match(html, /id=["']mesas-e-valores["']/);
  assert.match(html, /id=["']como-funciona["']/);
  assert.match(html, /id=["']duvidas["']/);
  assert.match(html, /href=["']#mapa-de-mesas["'][^>]*>[^<]*(?:Reservar|Garantir|Escolher)/i);
  assert.match(html, /Mesa para 2[^]*R\$ 100,00/i);
  assert.match(html, /Mesa para 4[^]*R\$ 200,00/i);
});

test("a linguagem de venda apresenta o Arizona Ranch como experiência familiar", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  assert.match(html, /Arizona Ranch/i);
  assert.match(html, /palco|música ao vivo/i);
  assert.match(html, /A porteira abre em 05 de setembro/i);
  assert.match(html, /experiência única, familiar e cheia de sentimentos/i);
  assert.doesNotMatch(html, /velho oeste|bar pub western/i);
});

test("a narrativa usa cenas cinematográficas antes da galeria pós-pagamento", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  ["gate", "trail", "saloon", "stage", "tables"].forEach((scene) => {
    assert.match(html, new RegExp(`data-cinematic-scene=["']${scene}["']`));
  });
  assert.match(html, /id=["']mapa-de-mesas["']/);
  assert.match(html, /id=["']pos-pagamento["']/);
  assert.match(html, /gallery-dialog|data-gallery-item/);
  assert.ok(html.indexOf('id="pos-pagamento"') > html.indexOf('id="mapa-de-mesas"'));
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
  assert.doesNotMatch(html, /com som|som inicia|experiência sonora/i);
  assert.doesNotMatch(html, /id=["']sound-status["']/);
  assert.match(app, /setupEventCountdown/);
  assert.match(html, /cinematic\.js/);
  assert.match(app, /requestAnimationFrame/);
  assert.match(css, /\.trail-progress/);
  assert.match(css, /\.ranch-moment/);
});
