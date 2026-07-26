"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterResolvedHumanActions,
  resolveHumanApprovalQueue
} = require("../scripts/editorial-health-check");

test("remove da fila humana os itens com decisão registrada e preserva os pendentes", () => {
  const queue = [
    { slug: "aprovada", resolutionType: "human-approval" },
    { slug: "estacionada", resolutionType: "human-approval" },
    { slug: "pendente", resolutionType: "human-approval" }
  ];
  const decisions = {
    decisions: [
      { slug: "aprovada", decision: "APPROVE" },
      { slug: "estacionada", decision: "PARK" }
    ]
  };

  const result = resolveHumanApprovalQueue(queue, decisions);

  assert.deepEqual(result.pending.map((item) => item.slug), ["pendente"]);
  assert.deepEqual(
    result.resolved.map((item) => [item.slug, item.humanDecision]),
    [
      ["aprovada", "APPROVE"],
      ["estacionada", "PARK"]
    ]
  );
});

test("ignora decisão inválida e decisão de slug que não está na fila", () => {
  const queue = [{ slug: "a", resolutionType: "human-approval" }];
  const decisions = {
    decisions: [
      { slug: "a", decision: "MAYBE" },
      { slug: "fora", decision: "REJECT" }
    ]
  };

  const result = resolveHumanApprovalQueue(queue, decisions);

  assert.equal(result.pending.length, 1);
  assert.equal(result.resolved.length, 0);
});

test("remove ações humanas resolvidas da fila operacional ativa", () => {
  const actions = [
    { slug: "aprovada", resolutionType: "human-approval" },
    { slug: "pendente", resolutionType: "human-approval" },
    { slug: "visual", resolutionType: "visual-review" }
  ];
  const resolved = [{ slug: "aprovada", humanDecision: "APPROVE" }];

  assert.deepEqual(filterResolvedHumanActions(actions, resolved), [
    { slug: "pendente", resolutionType: "human-approval" },
    { slug: "visual", resolutionType: "visual-review" }
  ]);
});
