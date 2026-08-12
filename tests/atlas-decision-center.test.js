const assert = require("assert");
const center = require("../assets/js/atlas-decision-center.js");

const candidates = [
  { id: "weekly", category: "WEEK", domain: "PROGRAM", title: "Approve next week", route: { section: "program" } },
  { id: "running", category: "PROGRESSION", domain: "RUNNING", title: "Review Running progression", route: { section: "performance", view: "running" } },
  { id: "conflict", category: "INTEGRITY", domain: "PROGRAM", title: "Choose saved program", route: { action: "RESOLVE_CONTINUITY" } },
  { id: "safety", category: "SAFETY", domain: "STRENGTH", title: "Review pain hold", route: { section: "today" } }
];

const built = center.buildCenter({ candidates, generatedAt: "2026-08-12T12:00:00.000Z" });
assert.equal(built.version, "025V.1");
assert.equal(built.status, "DECISION_REQUIRED");
assert.equal(built.count, 4);
assert.equal(built.primary.id, "safety");
assert.equal(built.decisions[1].id, "conflict");
assert.equal(built.decisions[3].id, "weekly");
assert.equal(built.tone, "red");
assert.equal(candidates[0].priority, undefined);

const deduped = center.buildCenter({ candidates: [
  { id: "running", category: "PROGRESSION", domain: "RUNNING", title: "Old" },
  { id: "running", category: "SAFETY", domain: "RUNNING", title: "Safety" },
  { id: "closed", status: "CLOSED", category: "INTEGRITY", title: "Closed" }
] });
assert.equal(deduped.count, 1);
assert.equal(deduped.primary.title, "Safety");

const clear = center.buildCenter({ candidates: [] });
assert.equal(clear.status, "CLEAR");
assert.equal(clear.count, 0);
assert.equal(clear.primary, null);

const event = center.buildEvent(built.primary, "opened", { recordedAt: "2026-08-12T12:05:00.000Z", userId: "recruit-1" });
assert.equal(event.type, "OPENED");
assert.equal(event.decisionId, "safety");
assert.equal(event.userId, "recruit-1");
assert.deepEqual(event.route, built.primary.route);

console.log("Atlas Decision Center tests passed.");
