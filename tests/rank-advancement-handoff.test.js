const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/rank-advancement-handoff.js");

const certification = Object.freeze({
  id: "rank-advancement-certification:RECRUIT:CADET:proof",
  status: "CERTIFIED",
  locked: true,
  priorRank: "RECRUIT",
  newRank: "CADET",
  fingerprint: "rank-advancement:RECRUIT:CADET:proof",
  certifiedAt: "2026-08-24T09:00:00.000Z"
});

const catalog = [
  { code: "OPERATOR", promotionCommandNote: "Maintain discipline and consecutive qualifying weeks." },
  { code: "ASCENDANT", promotionCommandNote: "Demonstrate elite operational confidence." }
];

test("no certified promotion creates no handoff", () => {
  const result = engine.assess({ certifications: [] });
  assert.equal(result.status, "NONE");
  assert.equal(result.visible, false);
});

test("latest locked promotion creates one pending earned-rank handoff", () => {
  const result = engine.assess({ certifications: [certification], handoffs: [], rankCatalog: catalog });
  assert.equal(result.status, "PENDING");
  assert.equal(result.rank, "CADET");
  assert.equal(result.nextRank, "OPERATOR");
  assert.equal(result.nextStandard, "Maintain discipline and consecutive qualifying weeks.");
  assert.equal(result.certification.id, certification.id);
});

test("acknowledgment locks a separate receipt without mutating certification", () => {
  const source = JSON.parse(JSON.stringify(certification));
  const receipt = engine.acknowledge({ certifications: [source], handoffs: [], rankCatalog: catalog, acknowledgedAt: "2026-08-24T10:00:00.000Z" });
  assert.equal(receipt.status, "ACKNOWLEDGED");
  assert.equal(receipt.locked, true);
  assert.equal(receipt.certificationId, certification.id);
  assert.equal(receipt.effectiveDate, "2026-08-24");
  assert.deepEqual(source, certification);
});

test("the same certification can only have one immutable handoff", () => {
  const first = engine.acknowledge({ certifications: [certification], handoffs: [], rankCatalog: catalog, acknowledgedAt: "2026-08-24T10:00:00.000Z" });
  const second = engine.acknowledge({ certifications: [{ ...certification, certifiedAt: "2026-08-25T10:00:00.000Z" }], handoffs: [first], rankCatalog: catalog, acknowledgedAt: "2026-08-25T11:00:00.000Z" });
  assert.equal(second.id, first.id);
  assert.equal(second.acknowledgedAt, first.acknowledgedAt);
  assert.equal(second.idempotent, true);
});

test("history keeps the first locked handoff for a certification", () => {
  const first = engine.acknowledge({ certifications: [certification], handoffs: [], rankCatalog: catalog, acknowledgedAt: "2026-08-24T10:00:00.000Z" });
  const late = { ...first, id: "late", acknowledgedAt: "2026-08-25T10:00:00.000Z", nextStandard: "Rewritten" };
  const history = engine.upsertHistory([first], late);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, first.id);
  assert.equal(history[0].nextStandard, first.nextStandard);
});

test("highest rank hands off to holding the standard", () => {
  const ascendant = { ...certification, id: "ascendant-proof", priorRank: "DOMINION", newRank: "ASCENDANT", fingerprint: "ascendant" };
  const result = engine.assess({ certifications: [ascendant], handoffs: [], rankCatalog: catalog });
  assert.equal(result.nextRank, null);
  assert.match(result.nextStandard, /Highest rank secured/);
});
