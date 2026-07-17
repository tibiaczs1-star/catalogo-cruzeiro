const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyStory, buildCzsFlowEntries } = require("../../assets/v8-final/czs-flow-engine.js");

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
