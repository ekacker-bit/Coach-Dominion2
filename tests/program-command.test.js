const assert = require("node:assert/strict");
const command = require("../assets/js/program-command.js");

const contract = {
  id: "contract-1",
  revision: 5,
  status: "APPROVED",
  primaryGoal: "BALANCED_FITNESS",
  target: "Build a durable hybrid body",
  targetDate: "2026-12-31",
  effectiveDate: "2026-08-10",
  trainingDaysPerWeek: 5,
  strengthDaysPerWeek: 3,
  runningDaysPerWeek: 3,
  coreDaysPerWeek: 3,
  nutritionCommitment: "TRACK_5_DAYS",
  twoADays: true
};

const plans = Object.fromEntries(["strength", "running", "core", "nutrition"].map((id) => [id, {
  id: `${id}-1`,
  status: "APPROVED",
  recruitContractId: contract.id,
  recruitContractRevision: contract.revision
}]));

const week = {
  weekStart: "2026-08-10",
  weekEnd: "2026-08-16",
  recoveryDays: 2,
  twoADayCount: 1,
  conflicts: [],
  days: [
    { date: "2026-08-10", estimatedMinutes: 135, twoADay: true, activities: [{ module: "STRENGTH" }, { module: "RUNNING" }, { module: "CORE" }], nutrition: { calories: 2400 } },
    { date: "2026-08-11", estimatedMinutes: 60, activities: [{ module: "STRENGTH" }], nutrition: { calories: 2200 } },
    { date: "2026-08-12", estimatedMinutes: 50, activities: [{ module: "RUNNING" }, { module: "CORE" }], nutrition: { calories: 2300 } },
    { date: "2026-08-13", isRecoveryDay: true, activities: [], nutrition: { calories: 2100 } }
  ]
};

{
  const model = command.buildProgramCommand({
    contract,
    plans,
    week,
    receipt: { status: "ACTIVE", weekStart: week.weekStart },
    receiptAudit: { status: "ACTIVE" },
    weekAutopilot: { status: "COMMITTED", tone: "green", headline: "Next week is ready", detail: "Atlas carried the active program forward.", targetWeekStart: "2026-08-17", action: "OPEN_CALENDAR" },
    truth: { title: "Complete Morning Roll Call", detail: "Readiness comes first.", action: { label: "Complete Roll Call", section: "today" }, contradictions: [] }
  });
  assert.equal(model.version, "024C.1");
  assert.equal(model.status, "ACTIVE");
  assert.equal(model.week.trainingWindows, 4);
  assert.equal(model.week.estimatedMinutes, 245);
  assert.equal(model.week.twoADays, 1);
  assert.equal(model.modules.find((item) => item.id === "strength").count, 2);
  assert.equal(model.modules.find((item) => item.id === "nutrition").count, 4);
  assert.equal(model.next.label, "Complete Roll Call");
  assert.equal(model.autopilot.status, "COMMITTED");
  assert.equal(model.autopilot.targetWeekStart, "2026-08-17");
  assert.ok(model.rationale.some((item) => /Core is paired/i.test(item)));
}

{
  const blocked = command.buildProgramCommand({
    contract,
    plans,
    week: { ...week, conflicts: [{ severity: "BLOCKING", detail: "Recovery day collision." }] },
    receipt: { status: "ACTIVE" },
    receiptAudit: { status: "ACTIVE" },
    truth: { contradictions: [] }
  });
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(blocked.next.section, "calendar");
  assert.match(blocked.next.detail, /collision/i);
}

{
  const setup = command.buildProgramCommand({ truth: { contradictions: [] } });
  assert.equal(setup.status, "SETUP_REQUIRED");
  assert.equal(setup.next.section, "contract");
}

{
  const model = command.buildProgramCommand({ contract, plans, week, receipt: { status: "ACTIVE" }, receiptAudit: { status: "ACTIVE" }, truth: { contradictions: [] } });
  const schedule = command.previewChange(model, { type: "SCHEDULE", note: "Move Tuesday." });
  assert.equal(schedule.route, "calendar");
  assert.equal(schedule.signature, false);
  assert.equal(schedule.currentWeekProtected, true);
  assert.deepEqual(schedule.modules, ["Calendar"]);
  const capacity = command.previewChange(model, { type: "CAPACITY" });
  assert.equal(capacity.route, "contract");
  assert.equal(capacity.signature, true);
  assert.ok(capacity.modules.includes("Fuel"));
  assert.match(capacity.message, /Nothing changes until you sign and activate it/i);
}

console.log("Build 024C Program Command tests passed.");
