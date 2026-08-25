const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const kit = fs.readFileSync(path.join(root, "media-kit.html"), "utf8");
const server = fs.readFileSync(path.join(root, "..", "server.js"), "utf8");

function galleryAssets() {
  const block = app.match(/const assets = \[([\s\S]*?)\];/);
  assert.ok(block, "lista principal de fotos ausente");
  return [...block[1].matchAll(/"(assets\/[^"]+\.(?:jpe?g|png|webp))"/gi)].map(
    (match) => match[1],
  );
}

function mediaKitArchiveAssets() {
  const block = kit.match(/const archiveAssets = \[([\s\S]*?)\];/);
  assert.ok(block, "lista completa do media kit ausente");
  return [...block[1].matchAll(/"(assets\/[^\"]+\.(?:jpe?g|png|webp))"/gi)].map(
    (match) => match[1],
  );
}

test("o book principal mantém as 70 fotos da galeria, incluindo o Jardim Noturno", () => {
  const refs = galleryAssets();
  assert.equal(refs.length, 70);
  assert.equal(new Set(refs).size, refs.length);

  for (let index = 1; index <= 15; index += 1) {
    const suffix = String(index).padStart(2, "0");
    assert.ok(
      refs.includes(`assets/raiane-sensacao-${suffix}.jpg`),
      `raiane-sensacao-${suffix}.jpg não entrou no book principal`,
    );
  }

  for (const ref of [
    "assets/raiane-jardim-noturno-01-corpo.png",
    "assets/raiane-jardim-noturno-02.jpeg",
    "assets/raiane-jardim-noturno-03.jpeg",
    "assets/raiane-jardim-noturno-04.jpeg",
    "assets/raiane-jardim-noturno-05.jpeg",
    "assets/raiane-jardim-noturno-06.jpeg",
    "assets/raiane-jardim-noturno-07.jpeg",
    "assets/raiane-jardim-noturno-08.jpeg",
    "assets/raiane-bastidores-retrato-01.jpeg",
  ]) {
    assert.ok(refs.includes(ref), ref);
  }

  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), ref);
  }
});

test("o media kit e o PDF incorporam as 72 fotos únicas do book", () => {
  const expected = [
    "assets/campanha-country-raiane-por-do-sol.webp",
    ...galleryAssets(),
    "assets/campanha-country-raiane-botas-rosa-loja.webp",
  ];
  const refs = mediaKitArchiveAssets();

  assert.equal(refs.length, 72);
  assert.equal(new Set(refs).size, 72);
  assert.deepEqual(new Set(refs), new Set(expected));
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), ref);
});

test("a página oficial sempre busca o HTML atual e usa assets versionados juntos", () => {
  const styleVersion = html.match(/styles\.css\?v=([^\"]+)/)?.[1];
  const scriptVersion = html.match(/app\.js\?v=([^\"]+)/)?.[1];
  const webglVersion = html.match(/webgl\.js\?v=([^\"]+)/)?.[1];
  assert.ok(styleVersion, "versão do CSS ausente");
  assert.equal(scriptVersion, styleVersion);
  assert.equal(webglVersion, styleVersion);
  assert.doesNotMatch(styleVersion, /20260806-r(?:8|11)$/);
  assert.match(
    server,
    /pathname === "\/bookray\/"[\s\S]*?cacheControl:\s*"no-store"/,
  );
});

test("o capítulo de passarela usa a nova foto e fala profissionalmente de Raiane", () => {
  const runway = html.match(/<section class="runway-break"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.doesNotMatch(runway, /campanha-country-raiane-botas-douradas\.webp/);
  assert.match(runway, /campanha-country-raiane-editorial-estudio\.webp/);
  assert.doesNotMatch(html, /book construído|cada imagem ganha ritmo/i);
  assert.match(html, /Versátil para editoriais, campanhas e passarela/i);
});

test("a foto retirada do destaque aparece somente no acervo completo", () => {
  const references = kit.match(/assets\/raiane-sensacao-10\.jpg/g) ?? [];
  assert.equal(references.length, 1);
  assert.match(kit, /<img src="assets\/campanha-country-raiane-editorial-estudio\.webp" \/>/);
});

test("a direção visual tem abertura, profundidade e capítulo editorial", () => {
  for (const hook of [
    "experience-intro",
    "hero-webgl",
    "hero-depth",
    "runway-break",
    "pointer-orb",
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${hook}`));
  }
  assert.match(css, /perspective:\s*\d+px/);
  assert.match(css, /transform-style:\s*preserve-3d/);
  assert.match(css, /@keyframes\s+studio-curtain/);
  assert.match(css, /@keyframes\s+type-sweep/);
  assert.match(app, /JARDIM NOTURNO/);
  assert.match(app, /BASTIDORES/);
  assert.match(css, /\.chapter-divider/);
  assert.match(css, /\.scene\.full-body/);
});

test("o WebGL é progressivo, leve e respeita acessibilidade", () => {
  const webgl = fs.readFileSync(path.join(root, "webgl.js"), "utf8");
  assert.match(webgl, /getContext\(["']webgl/);
  assert.match(webgl, /prefers-reduced-motion/);
  assert.match(webgl, /saveData/);
  assert.match(webgl, /pointer:\s*coarse/);
  assert.match(webgl, /devicePixelRatio/);
  assert.match(webgl, /visibilitychange/);
});

test("as revelações e o 3D funcionam sem depender de CSS experimental", () => {
  assert.match(css, /\.js \.scene\s*\{[^}]*opacity:\s*0/s);
  assert.match(css, /\.js \.scene\.seen\s*\{[^}]*opacity:\s*1/s);
  assert.match(app, /requestAnimationFrame/);
  assert.match(app, /pointermove/);
  assert.match(app, /--tilt-x/);
  assert.match(app, /--scene-shift/);
  assert.match(app, /IntersectionObserver/);
  assert.match(app, /startViewTransition/);
});

test("redução de movimento mantém todas as fotos visíveis", () => {
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.js \.scene[\s\S]*opacity:\s*1/,
  );
});

test("o enquadramento preserva rosto, corpo e identidade", () => {
  assert.match(css, /\.scene\.face-safe img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(
    css,
    /@media\s*\(max-width:\s*900px\)[\s\S]*?\.scene img\s*\{[^}]*transform:\s*none/s,
  );
  assert.match(html, /identidade própria diante das câmeras/i);
  assert.doesNotMatch(app, /imagegen|face-swap|body-edit/i);
});

test("o media kit remove o fundo barrento e protege as tarjas", () => {
  assert.doesNotMatch(kit, /#8e2415|#24100d|radial-gradient\(\s*circle at 50% 30%/i);
  assert.doesNotMatch(kit, /filter:\s*blur\(/i);
  assert.match(kit, /\.shot,\s*\.card\s*\{[^}]*background:\s*#(?:090909|0a0a0a)/s);
  assert.match(kit, /\.cover::before\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(kit, /\.cover::after\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(kit, /\.gallery-title\s*\{[^}]*overflow-wrap:\s*normal/s);
});

test("media kit profissional conserva informações e download", () => {
  for (const value of [
    "17",
    "1,82",
    "55",
    "ATM Modas",
    "80 MIL",
    "50 MI",
    "responsável legal",
  ]) {
    assert.match(kit, new RegExp(value, "i"));
  }
  assert.match(kit, /Métricas históricas/i);
  assert.match(kit, /@page/);
  assert.match(kit, /href="downloads\/media-kit-rayane\.pdf"/);
});

test("book conserva narrativa e destinos profissionais", () => {
  for (const id of ["manifesto", "portfolio", "trajetoria"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /EDITORIAL EM MOVIMENTO/i);
  assert.match(html, /media-kit\.html/);
  assert.match(html, /downloads\/media-kit-rayane\.pdf/);
});

test("a faixa editorial não cria rolagem horizontal no mobile", () => {
  assert.match(
    css,
    /@media\s*\(max-width:\s*900px\)[\s\S]*?\.ticker\s*\{[^}]*transform:\s*none/
  );
});

test("a inclinação da faixa preserva o desenho sem alargar o desktop", () => {
  const tickerBlock = css.match(/\.ticker\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(tickerBlock, /transform:\s*rotate/);
  assert.match(tickerBlock, /clip-path:\s*polygon/);
});

test("o media kit encaixa a prancheta inteira no celular", () => {
  assert.match(kit, /--page-fit/);
  assert.match(kit, /zoom:\s*var\(--page-fit/);
  assert.match(kit, /function\s+fitMediaKitPages/);
  assert.match(kit, /window\.innerWidth/);
});
