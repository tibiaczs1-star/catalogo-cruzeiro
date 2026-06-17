const test = require("node:test");
const assert = require("node:assert/strict");

const {
  selectVideoNews,
  selectVideoBatch,
  buildEditorialLabel,
} = require("../czs-video-news-pilot");

test("prioritizes recent regional news with a real video URL", () => {
  const selected = selectVideoNews([
    {
      title: "Noticia nacional sem impacto local",
      publishedAt: "2026-06-15T20:00:00.000Z",
      videoUrl: "https://example.com/nacional.mp4",
      category: "Brasil",
      sourceName: "Fonte",
    },
    {
      title: "Tradicao cultural em Mancio Lima",
      publishedAt: "2026-06-15T18:00:00.000Z",
      videoUrl: "https://example.com/mancio.mp4",
      category: "Cultura",
      sourceName: "Portal Acre",
      summary: "Comunidade de Mancio Lima mantem tradicao.",
    },
  ], { limit: 1, now: new Date("2026-06-15T22:00:00.000Z") });

  assert.equal(selected.length, 1);
  assert.equal(selected[0].title, "Tradicao cultural em Mancio Lima");
});

test("labels police videos without sensationalism", () => {
  assert.deepEqual(buildEditorialLabel({ category: "Policia" }), {
    eyebrow: "SEGURANCA",
    status: "CONTEXTO DA FONTE",
    color: "C62828",
  });
});

test("fills a video batch with real same-day videos only", () => {
  const batch = selectVideoBatch([
    {
      title: "Video real de Mancio Lima",
      publishedAt: "2026-06-17T14:00:00.000Z",
      videoUrl: "https://example.com/mancio.mp4",
      imageUrl: "https://example.com/mancio.jpg",
      summary: "Registro em video.",
    },
    {
      title: "Servico em Cruzeiro do Sul",
      publishedAt: "2026-06-17T13:00:00.000Z",
      imageUrl: "https://example.com/servico.jpg",
      summary: "Imagem vira video vertical.",
    },
    {
      title: "Video antigo de Cruzeiro do Sul",
      publishedAt: "2026-06-16T16:00:00.000Z",
      videoUrl: "https://example.com/antigo.mp4",
      summary: "Registro de ontem.",
    },
  ], { limit: 3, now: new Date("2026-06-17T16:00:00.000Z") });

  assert.equal(batch.length, 1);
  assert.equal(batch[0].renderMode, "source-video");
  assert.equal(batch[0].title, "Video real de Mancio Lima");
});
