const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyStory, buildCzsFlowEntries, buildRssFallbackEntries } = require("../../assets/v8-final/czs-flow-engine.js");

test("classifies police by region instead of using one generic police bucket", () => {
  assert.equal(classifyStory({ title: "Polícia prende suspeito em Mâncio Lima" }).subsection, "Polícia do Juruá");
  assert.equal(classifyStory({ title: "Polícia Federal faz operação no Brasil" }).subsection, "Polícia do Brasil");
  assert.equal(classifyStory({ title: "PM apreende arma em Rio Branco" }).subsection, "Polícia de Rio Branco");
});

test("builds regional flow with headers, organic inserts and sponsors", () => {
  const stories = [
    { slug: "czs-1", title: "Prefeitura de Cruzeiro do Sul anuncia serviço", imageUrl: "a.jpg", category: "Serviços" },
    { slug: "czs-2", title: "Polícia prende suspeito em Cruzeiro do Sul", imageUrl: "b.jpg", category: "Polícia" },
    { slug: "jurua-1", title: "Polícia prende suspeito em Mâncio Lima", imageUrl: "c.jpg", category: "Polícia" },
    { slug: "jurua-2", title: "Rio Juruá tem alerta para comunidades", imageUrl: "d.jpg", category: "Clima" },
    { slug: "rb-1", title: "Governo decide pauta em Rio Branco", imageUrl: "e.jpg", category: "Política" },
    { slug: "purus-1", title: "Sena Madureira recebe ação no Purus", imageUrl: "f.jpg", category: "Cidades" },
    { slug: "br-1", title: "Polícia Federal faz operação no Brasil", imageUrl: "g.jpg", category: "Brasil" },
    { slug: "viral-1", title: "Vídeo viral gera polêmica nas redes", imageUrl: "h.jpg", category: "Vídeo" },
  ];
  const entries = buildCzsFlowEntries(stories, { limit: 30, sponsorEvery: 5, blockSize: 2 });
  assert(entries.some((entry) => entry.type === "region-header" && entry.regionId === "cruzeiro-do-sul"));
  assert(entries.some((entry) => entry.type === "organic"));
  assert(entries.some((entry) => entry.type === "sponsor"));
  assert(entries.some((entry) => entry.story?.flow?.subsection === "Polícia do Juruá"));
});

test("keeps viral stories and videos mixed inside the regional flow", () => {
  const stories = [
    { slug: "czs-1", title: "Serviço em Cruzeiro do Sul muda atendimento", imageUrl: "a.jpg", category: "Serviços" },
    { slug: "jurua-1", title: "Polícia prende suspeito em Mâncio Lima", imageUrl: "b.jpg", category: "Polícia" },
    { slug: "viral-video", title: "Vídeo viral gera polêmica nas redes", imageUrl: "c.jpg", videoUrl: "viral.mp4", category: "Vídeo" },
    { slug: "viral-meme", title: "Meme do Acre repercute e vira curiosidade", imageUrl: "d.jpg", category: "Memes" },
    { slug: "rio-branco", title: "Rio Branco anuncia serviço estadual", imageUrl: "e.jpg", category: "Serviços" },
    { slug: "brasil", title: "Polícia Federal faz operação no Brasil", imageUrl: "f.jpg", category: "Brasil" },
  ];
  const entries = buildCzsFlowEntries(stories, { limit: 24, viralEvery: 3, sponsorEvery: 99, blockSize: 2, seed: 7 });
  const viralEntries = entries.filter((entry) => entry.type === "viral");
  assert(viralEntries.length >= 1);
  assert(viralEntries.some((entry) => entry.story.slug === "viral-video" || entry.story.slug === "viral-meme"));
  assert(entries.findIndex((entry) => entry.type === "viral") > 0);
});

test("treats videoUrl stories as viral even when the title is not viral-coded", () => {
  const stories = [
    { slug: "police-video", title: "Polícia prende suspeito em Cruzeiro do Sul", imageUrl: "a.jpg", videoUrl: "police.mp4", category: "Polícia" },
    { slug: "service-1", title: "Serviço em Cruzeiro do Sul muda atendimento", imageUrl: "b.jpg", category: "Serviços" },
    { slug: "jurua-1", title: "Rio Juruá tem alerta para comunidades", imageUrl: "c.jpg", category: "Clima" },
  ];
  const entries = buildCzsFlowEntries(stories, { limit: 16, viralEvery: 3, sponsorEvery: 99, blockSize: 2 });
  assert(entries.some((entry) => entry.type === "viral" && entry.story.slug === "police-video"));
});

test("builds cyclic rss fallback entries so the stream does not end before footer button", () => {
  const stories = [
    { slug: "viral-1", title: "Curiosidade nacional viraliza", imageUrl: "a.jpg", category: "Curiosidade" },
    { slug: "brasil-1", title: "Brasil tem nova regra de serviço", imageUrl: "b.jpg", category: "Brasil" },
  ];
  const first = buildRssFallbackEntries(stories, { offset: 0, limit: 5 });
  const later = buildRssFallbackEntries(stories, { offset: 5, limit: 5 });
  assert.equal(first.length, 5);
  assert.equal(later.length, 5);
  assert(first.every((entry) => entry.type === "rss"));
  assert(later.some((entry) => /RSS aberto/.test(entry.flow.subsection)));
});
