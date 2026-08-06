const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const root = __dirname,
  html = fs.readFileSync(path.join(root, "index.html"), "utf8"),
  app = fs.readFileSync(path.join(root, "app.js"), "utf8"),
  css = fs.readFileSync(path.join(root, "styles.css"), "utf8"),
  kit = fs.readFileSync(path.join(root, "media-kit.html"), "utf8");
const old = [
  "6ffa85aa-813c-4136-b2e8-0ff248324533.JPG.jpeg",
  "IMG_0406.jpeg",
  "IMG_0407.jpeg",
  "IMG_0449.jpeg",
  "5f9195c0-957a-44e8-ba89-f8e0291b8a32.JPG.jpeg",
  "IMG_0602.jpeg",
  "IMG_0605.jpeg",
  "IMG_0657.jpeg",
  "259b0ccb-9b2a-4b97-b0e2-fc2d09eee812.JPG.jpeg",
  "bc0cea41-9f73-4f8a-a754-04290a741733.JPG.jpeg",
  "1c69e6fc-05f9-4ad6-9d4f-5e595f645762.JPG.jpeg",
  "21496ee4-5f41-4ea0-850e-85ffb099a475.JPG.jpeg",
  "5200325f-1857-4517-8fbc-c4fcabd0ab73.JPG.jpeg",
  "1999e35b-ef92-41c8-b717-9df2e47bd880.JPG.jpeg",
  "6a2f159a-5513-4df7-8214-a58ea0caca22.JPG.jpeg",
  "5b61d66c-39e7-4868-a193-230185470d4d.JPG.jpeg",
  "IMG_0767.jpeg",
  "IMG_0812.jpeg",
  "IMG_0816.jpeg",
  "IMG_0817.jpeg",
  "IMG_0818.jpeg",
  "IMG_0830.jpeg",
  "IMG_0903.jpeg",
  "87189062-434a-437b-aea5-2b0afaaadfe2.JPG.jpeg",
  "304aa290-f2bc-43fc-b953-0b427eba0cc3.JPG.jpeg",
  "3b0d5937-0611-43cc-8b7e-81dd4cb1b44f.JPG.jpeg",
  "96cd42f8-7399-42a1-a6cf-26aceb41ecc2.JPG.jpeg",
  "IMG_1127.jpeg",
  "IMG_1128.jpeg",
  "IMG_1129.jpeg",
  "IMG_1130.jpeg",
  "IMG_1154.jpeg",
  "IMG_1200.jpeg",
  "IMG_1201.jpeg",
];
const treated = [
  "campanha-country-botas-douradas-close.webp",
  "campanha-country-botas-rosa-estudio.webp",
  "campanha-country-botas-rosa-loja.webp",
  "campanha-country-raiane-blocos.webp",
  "campanha-country-raiane-botas-douradas.webp",
  "campanha-country-raiane-botas-rosa-loja.webp",
  "campanha-country-raiane-editorial-estudio.webp",
  "campanha-country-raiane-por-do-sol.webp",
  "lifestyle-country-cavalo.webp",
  "parceiros-laco-de-ouro.webp",
  "produto-botas-douradas-frontal.webp",
  "produto-botas-douradas-perfil.webp",
  "produto-botas-rosa-fazenda.webp",
  "produto-botas-rosa-pegada-loja.webp",
];
test("acervo cumulativo usa 48 fotos distintas uma vez cada", () => {
  const refs = [
    ...`${html}\n${app}`.matchAll(/assets\/([^\"'`]+\.(?:jpe?g|webp))/gi),
  ].map((x) => x[1]);
  assert.equal(refs.length, 48);
  assert.equal(new Set(refs).size, 48);
  assert.deepEqual([...refs].sort(), [...old, ...treated].sort());
  for (const f of refs)
    assert.ok(fs.existsSync(path.join(root, "assets", f)), f);
});
test("não usa fotos brutas com logos e preserva enquadramento", () => {
  assert.doesNotMatch(`${html}\n${app}`, /raiane-sensacao-/);
  assert.match(css, /\.scene\.face-safe img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(html, /Sem alterar rosto, corpo ou identidade/i);
  assert.doesNotMatch(app, /imagegen|face-swap|body-edit/i);
});
test("cada foto recebe conceito e interação", () => {
  for (const x of [
    "Magnetismo",
    "Ritmo",
    "Presença",
    "Precisão",
    "Raiz",
    "Impulso",
    "Atitude",
    "Movimento",
    "Instinto",
    "Desejo",
    "Elegância",
    "Assinatura",
    "Horizonte",
    "Suspense",
    "Calor",
  ])
    assert.match(app, new RegExp(x));
  assert.match(html, /<dialog[^>]+id="lightbox"/);
  assert.match(app, /IntersectionObserver/);
});
test("media kit profissional em português", () => {
  for (const x of [
    "17",
    "1,82",
    "55",
    "ATM Modas",
    "80 MIL",
    "50 MI",
    "responsável legal",
  ])
    assert.match(kit, new RegExp(x, "i"));
  assert.match(kit, /Métricas históricas/i);
  assert.match(kit, /@page/);
});
test("media kit alterna P&B, cor e showcases sem cortar rostos", () => {
  for (const x of ["visual-bw", "visual-pop", "visual-showcase"])
    assert.match(kit, new RegExp(x));
  assert.match(kit, /object-fit:\s*contain/);
  assert.match(kit, /word-break:\s*keep-all/);
  assert.match(kit, /hyphens:\s*none/);
});
test("media kit oferece PDF para download", () => {
  assert.match(kit, /href="downloads\/media-kit-rayane\.pdf"/);
  assert.match(kit, /download/);
});
test("book liga para o media kit", () => assert.match(html, /media-kit\.html/));
test("javascript aprimora sem derrubar o conteúdo quando um módulo está ausente", () => {
  assert.match(app, /if\s*\(!root\)\s*return/);
  assert.match(app, /if\s*\(!box\)\s*return/);
  assert.match(app, /typeof IntersectionObserver/);
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.js \.scene[\s\S]*opacity:\s*1/,
  );
});
test("merge mantém narrativa e destinos profissionais", () => {
  for (const id of ["manifesto", "portfolio", "trajetoria"])
    assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /EDITORIAL EM MOVIMENTO/i);
  assert.match(html, /downloads\/media-kit-rayane\.pdf/);
});
