"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { filterResolvedHumanActions } = require("./editorial-health-check");

const actions = [
  { slug: "approved", resolutionType: "human-approval", reason: "gate" },
  { slug: "approved", resolutionType: "ide-fix", missingRequirements: ["p0-com-fonte-unica"] },
  { slug: "approved", resolutionType: "ide-fix", missingRequirements: ["sem-credito-visual"] },
  { slug: "parked", resolutionType: "ide-fix", missingRequirements: ["p0-com-fonte-unica"] },
  { slug: "rejected", resolutionType: "ide-fix", missingRequirements: ["sem-imagem"] }
];

test("decisões humanas removem apenas ações efetivamente resolvidas", () => {
  const resolved = [
    { slug: "approved", humanDecision: "APPROVE" },
    { slug: "parked", humanDecision: "PARK" },
    { slug: "rejected", humanDecision: "REJECT" }
  ];
  assert.deepEqual(filterResolvedHumanActions(actions, resolved), [
    { slug: "approved", resolutionType: "ide-fix", missingRequirements: ["sem-credito-visual"] },
    { slug: "parked", resolutionType: "ide-fix", missingRequirements: ["p0-com-fonte-unica"] }
  ]);
});
