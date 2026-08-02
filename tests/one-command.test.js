const assert = require("node:assert/strict");
const command = require("../assets/js/one-command.js");

assert.equal(command.VERSION, "021N.1");
assert.equal(command.modeFor("PLANS_REQUIRED"), "SETUP");
assert.equal(command.modeFor("EVIDENCE_REQUIRED"), "VERIFY");
assert.equal(command.modeFor("REVIEW_REQUIRED"), "CLOSE");
assert.equal(command.modeFor("EXECUTION_REQUIRED"), "EXECUTE");

const stages = ["contract", "plans", "week", "today", "evidence", "review"].map((id, index) => ({
  id,
  label: id[0].toUpperCase() + id.slice(1),
  complete: index < 3,
  current: index === 3,
  locked: index > 3
}));

let model = command.buildOneCommand({
  state: "PLANS_REQUIRED",
  title: "Link the Running plan",
  detail: "3 of 4 required plans match Contract 2.",
  action: { action: "PLAN", label: "Open Running", section: "performance", module: "running" },
  stages,
  modules: [],
  evidence: { complete: 0, total: 0 },
  source: "Contract 2 · 3/4 plans · No week"
});
assert.equal(model.mode, "SETUP");
assert.equal(model.primary.label, "Open Running");
assert.equal(model.primary.module, "running");
assert.equal(model.secondary.label, "View source chain");

model = command.buildOneCommand({
  state: "EXECUTION_REQUIRED",
  title: "Execute Strength",
  detail: "Upper-body session",
  action: { action: "MODULE", label: "Open Strength", section: "performance", module: "strength" },
  stages,
  modules: [
    { id: "strength", label: "Strength", scheduled: true, status: "READY", detail: "Upper body" },
    { id: "running", label: "Run", scheduled: false, observed: false, status: "NOT_SCHEDULED" },
    { id: "nutrition", label: "Fuel", scheduled: true, status: "COMPLETE", complete: true }
  ],
  evidence: { complete: 1, total: 2 },
  source: "Contract 2 · 4/4 plans · Week r1"
});
assert.equal(model.mode, "EXECUTE");
assert.equal(model.modules.length, 2);
assert.equal(model.modules[0].active, true);
assert.equal(model.modules[1].complete, true);
assert.equal(model.context.evidence, "1/2 assigned domains verified");

model = command.buildOneCommand({
  state: "CONFLICT",
  action: { action: "REPAIR_WEEK", label: "Repair the Week", section: "contract" },
  stages,
  contradictions: [{ severity: "WARNING", message: "150 minutes exceed the commitment.", repair: "Reduce the day." }]
});
assert.match(model.context.conflict, /Reduce the day/);

model = command.buildOneCommand({
  state: "SECURED",
  title: "Today is secured",
  action: { action: "HISTORY", label: "View the Record", section: "record" },
  stages: stages.map((item) => ({ ...item, complete: true, current: item.id === "review" })),
  modules: [],
  evidence: { complete: 4, total: 4 }
});
assert.equal(model.secured, true);
assert.equal(model.eyebrow, "DAY SECURED");
assert.equal(model.progress.percent, 100);

model = command.buildTodayMission({
  state: "ROLL_CALL_REQUIRED",
  title: "Complete Roll Call",
  detail: "Atlas needs today’s readiness.",
  action: { action: "ROLL_CALL", label: "Start Roll Call", section: "today" },
  stages,
  modules: [],
  evidence: { complete: 0, total: 2 }
}, {
  readiness: "ROLL_CALL_NEEDED",
  schedule: "AM + PM · AM SESSION FIRST"
});
assert.equal(model.eyebrow, "TODAY // EXECUTE");
assert.match(model.reason, /readiness/i);
assert.equal(model.facts.readiness, "ROLL CALL NEEDED");
assert.equal(model.facts.schedule, "AM + PM · AM SESSION FIRST");
assert.match(model.after, /authorize|adjust|protect/i);
assert.equal(model.closeoutReady, false);

model = command.buildTodayMission({
  state: "REVIEW_REQUIRED",
  title: "Seal the Day",
  action: { action: "REVIEW", label: "Review and Seal", section: "today" },
  stages: stages.map((item) => ({ ...item, complete: item.id !== "review", current: item.id === "review" })),
  evidence: { complete: 4, total: 4 }
});
assert.equal(model.mode, "CLOSE");
assert.equal(model.closeoutReady, true);
assert.match(model.after, /seal/i);

console.log("Build 021N Today Mission model tests passed.");

