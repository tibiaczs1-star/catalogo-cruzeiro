"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  decorateNewsItem,
  isLowSignalAdministrativeNotice,
  orderPortalStories
} = require("../../editorial-scope");

test("fonte regional nao transforma pauta nacional em capa local", () => {
  const national = decorateNewsItem({
    title: "Tenho alma jovem, disposta a descobrir, diz Fátima Bernardes",
    summary: "Apresentadora fala sobre a nova temporada de um programa nacional.",
    body: ["O CZS mantém a fonte original e prioriza o que afeta a rotina do leitor."],
    sourceName: "Juruá em Tempo",
    priority: 975,
    publishedAt: "2026-08-03T14:00:00.000Z"
  });

  assert.equal(national.editorialScope, "brasil-mundo");
  assert.equal(national.editorialLocalTier, 0);
  assert.equal(national.editorialPriority, "");
});

test("capa do portal prioriza fato recente de Cruzeiro do Sul sobre pauta nacional", () => {
  const [lead] = orderPortalStories([
    {
      title: "Atriz anuncia novo projeto em rede nacional",
      summary: "Novidade do entretenimento brasileiro.",
      sourceName: "Juruá em Tempo",
      priority: 975,
      publishedAt: "2026-08-03T15:00:00.000Z"
    },
    {
      title: "Cruzeiro do Sul abre inscrições para mutirão de saúde",
      summary: "Atendimento será realizado no centro da cidade.",
      sourceName: "Prefeitura de Cruzeiro do Sul",
      priority: 1000,
      publishedAt: "2026-08-03T10:00:00.000Z"
    }
  ]);

  assert.equal(lead.editorialScope, "cruzeiro-do-sul");
  assert.match(lead.title, /Cruzeiro do Sul/);
});

test("aviso administrativo de baixo sinal nao vira hero acima de noticia util", () => {
  const [lead, notice] = orderPortalStories([
    {
      title: "Cotação de Preços",
      summary: "Prefeitura de Cruzeiro do Sul publica aviso administrativo.",
      sourceName: "Prefeitura de Cruzeiro do Sul",
      priority: 1000,
      publishedAt: "2026-08-06T12:00:00.000Z"
    },
    {
      title: "Cruzeiro do Sul realizará casamento coletivo para 200 casais",
      summary: "Ação pública terá inscrições e data para moradores.",
      sourceName: "Juruá Online",
      priority: 940,
      publishedAt: "2026-08-06T11:00:00.000Z"
    }
  ]);

  assert.equal(isLowSignalAdministrativeNotice(notice), true);
  assert.match(lead.title, /casamento coletivo/);
  assert.equal(notice.editorialPriority, "arquivo-administrativo");
});
