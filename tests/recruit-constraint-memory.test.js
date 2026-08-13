const assert = require("assert");
const constraints = require("../assets/js/recruit-constraint-memory.js");

let memory = constraints.buildMemory([]);
memory = constraints.addConstraint(memory, { type: "EQUIPMENT", domain: "STRENGTH", note: "Hotel gym has dumbbells only." }, { recordedAt: "2026-08-12T18:00:00.000Z" });
assert.equal(constraints.VERSION, "025Y.1");
assert.equal(memory.status, "ACTIVE");
assert.equal(memory.count, 1);
assert.equal(memory.active[0].label, "Equipment");
assert.deepEqual(memory.active[0].domains, ["STRENGTH"]);

memory = constraints.addConstraint(memory, { type: "EQUIPMENT", domain: "STRENGTH", note: "Hotel gym has dumbbells only." }, { recordedAt: "2026-08-12T18:02:00.000Z" });
assert.equal(memory.count, 1);
assert.equal(constraints.relevantForDecision(memory, { domain: "STRENGTH" }).length, 1);
assert.equal(constraints.relevantForDecision(memory, { domain: "FUEL" }).length, 0);

const id = memory.active[0].id;
memory = constraints.retireConstraint(memory, id, { recordedAt: "2026-08-13T18:00:00.000Z" });
assert.equal(memory.status, "CLEAR");
assert.equal(memory.count, 0);
assert.equal(memory.retired[0].status, "RETIRED");

const fromResolution = constraints.fromResolution({ recordedAt: "2026-08-14T18:00:00.000Z", constraintDraft: { type: "FOOD", note: "No refrigerator at work.", sourceFeedbackId: "f-1" } });
assert.equal(fromResolution.type, "FOOD");
assert.ok(fromResolution.domains.includes("FUEL"));
assert.throws(() => constraints.normalizeConstraint({ type: "OTHER", note: "" }), /useful detail/);

console.log("Recruit Constraint Memory tests passed.");
