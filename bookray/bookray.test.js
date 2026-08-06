const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const kit = fs.readFileSync(path.join(root, "media-kit.html"), "utf8");

function galleryAssets() {
  const block = app.match(/const assets = \[([\s\S]*?)\];/);
  assert.ok(block, "lista principal de fotos ausente");
  return [...block[1].matchAll(/"(assets\/[^"]+\.(?:jpe?g|webp))"/gi)].map(
    (match) => match[1],
  );
}

test("o book principal mantém o acervo completo com as 15 fotos novas", () => {
  const refs = galleryAssets();
  assert.equal(refs.length, 61);
  assert.equal(new Set(refs).size, refs.length);

  for (let index = 1; index <= 15; index += 1) {
    const suffix = String(index).padStart(2, "0");
    assert.ok(
      refs.includes(`assets/raiane-sensacao-${suffix}.jpg`),
      `raiane-sensacao-${suffix}.jpg não entrou no book principal`,
    );
  }

  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), ref);
  }
});

test("a direção visual tem abertura, profundidade e capítulo editorial", () => {
  for (const hook of [
    "experience-intro",
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
  assert.match(html, /Sem alterar rosto, corpo ou identidade/i);
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
