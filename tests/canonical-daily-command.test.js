const test = require("node:test");
const assert = require("node:assert/strict");

const canonical = require("../assets/js/canonical-daily-command.js");
const decisionIntegrity = require("../assets/js/daily-decision-integrity.js");

const date = "2026-08-17";
const week = {
  id: "week-r3",
  status: "COMMITTED",
  state: "COMMITTED",
  revision: 3,
  weekStart: "2026-08-17",
  weekEnd: "2026-08-23"
};

function draft() {
  return {
    id: "draft-r4",
    status: "DRAFT",
    approvalBlocked: false,
    days: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-08-${String(17 + index).padStart(2, "0")}`,
      activities: index === 0 ? [{ id: "draft-lower", module: "STRENGTH", title: "Draft Lower A", estimatedMinutes: 65 }] : []
    }))
  };
}

test("029B makes a complete draft visible but never executable", () => {
  const command = canonical.build({ date, contract: { id: "contract-r2", status: "APPROVED" }, draftWeek: draft() });
  assert.equal(canonical.VERSION, "029B.1");
  assert.equal(command.lifecycle.week, "READY_TO_COMMIT");
  assert.equal(command.lifecycle.day, "READY_TO_COMMIT");
  assert.equal(command.week.committed, false);
  assert.equal(command.schedule.available, false);
  assert.equal(command.schedule.sessions.length, 0);
  assert.equal(command.draftSchedule.visible, true);
  assert.equal(command.draftSchedule.executable, false);
  assert.equal(command.draftSchedule.sessions.length, 1);
  assert.equal(command.primaryAction.label, "Commit the coordinated week");
  assert.equal(command.primaryAction.section, "calendar");
  assert.equal(command.fuelContext.type, "SCHEDULE_PENDING");
  assert.equal(command.fuelContext.target, null);
  assert.equal(command.day.recoveryDay, false);
  assert.equal(canonical.moduleState(command, "strength").status, "BLOCKED");
  assert.equal(canonical.moduleState(command, "nutrition").status, "SCHEDULE PENDING");
  assert.equal(canonical.moduleState(command, "recovery").status, "PROTECTED");
  assert.equal(canonical.consistencyReport(command).valid, true);
});

test("029B committed training supplies the only executable schedule and Fuel target", () => {
  const day = {
    date,
    activities: [{ id: "lower-a", module: "STRENGTH", title: "Lower A", estimatedMinutes: 65 }],
    estimatedMinutes: 65,
    nutrition: { calories: 2650, protein: 190 }
  };
  const command = canonical.build({ date, committedWeek: week, committedDay: day, draftWeek: draft() });
  assert.equal(command.lifecycle.program, "ACTIVE");
  assert.equal(command.lifecycle.week, "ACTIVE");
  assert.equal(command.lifecycle.day, "ACTIVE");
  assert.equal(command.schedule.available, true);
  assert.equal(command.schedule.sessions[0].title, "Lower A");
  assert.equal(command.draftSchedule.executable, false);
  assert.equal(command.fuelContext.type, "TRAINING_DAY");
  assert.deepEqual(command.fuelContext.target, day.nutrition);
  assert.equal(command.executable, true);
  assert.equal(canonical.consistencyReport(command).valid, true);
});

test("029B committed recovery is explicit; a missing week is not recovery", () => {
  const recovery = canonical.build({ date, committedWeek: week, committedDay: { date, activities: [], nutrition: { calories: 2200, protein: 190 } } });
  const missing = canonical.build({ date });
  assert.equal(recovery.schedule.recoveryDay, true);
  assert.equal(recovery.fuelContext.type, "RECOVERY_DAY");
  assert.equal(recovery.executable, false);
  assert.equal(missing.schedule.recoveryDay, false);
  assert.equal(missing.fuelContext.type, "SCHEDULE_PENDING");
  assert.equal(missing.blocker.code, "CONTRACT_REQUIRED");
  assert.equal(missing.primaryAction.label, "Build Contract");
  assert.equal(canonical.consistencyReport(recovery).valid, true);
});

test("029B builds a week before asking the recruit to commit one that does not exist", () => {
  const command = canonical.build({ date, contract: { id: "contract-r2", status: "APPROVED" } });
  assert.equal(command.blocker.code, "WEEK_BUILD_REQUIRED");
  assert.equal(command.primaryAction.label, "Build the coordinated week");
  assert.equal(command.primaryAction.section, "calendar");
});

test("029B preserves committed AM/PM and uncapped long-run truth", () => {
  const command = canonical.build({
    date,
    committedWeek: week,
    committedDay: {
      date,
      twoADay: true,
      longRunUncapped: true,
      activities: [
        { id: "long-run", module: "RUNNING", title: "Long run", sessionWindow: "AM" },
        { id: "upper-a", module: "STRENGTH", title: "Upper A", sessionWindow: "PM", estimatedMinutes: 70 }
      ]
    }
  });
  assert.equal(command.schedule.twoADay, true);
  assert.deepEqual(command.schedule.sessions.map((session) => session.window), ["AM", "PM"]);
  assert.equal(command.schedule.sessions[0].longRunUncapped, true);
  assert.equal(canonical.consistencyReport(command).valid, true);
});

test("029B forces the Daily Decision to commit the week before Roll Call or training", () => {
  const canonicalCommand = canonical.build({ date, contract: { id: "contract-r2", status: "APPROVED" }, draftWeek: draft() });
  const decision = decisionIntegrity.resolve({
    operatingDate: date,
    canonicalDailyCommand: canonicalCommand,
    day: draft().days[0],
    readinessComplete: false,
    plans: [
      { id: "strength", complete: true, status: "APPROVED" },
      { id: "running", complete: true, status: "APPROVED" },
      { id: "core", complete: true, status: "APPROVED" },
      { id: "nutrition", complete: true, status: "APPROVED" }
    ]
  });
  assert.equal(decision.status, "BLOCKED");
  assert.equal(decision.blocker.code, "WEEK_COMMIT_REQUIRED");
  assert.equal(decision.primaryAction.label, "Commit the coordinated week");
  assert.equal(decision.schedule.sessions.length, 0);
  assert.equal(decision.recoveryDay, false);
  assert.equal(decision.nutritionContext.type, "SCHEDULE_PENDING");
  assert.equal(decision.authorization.strength.executable, false);
  assert.equal(decision.authorization.recovery.executable, false);
});

test("029B lifecycle vocabulary covers completion and supersession", () => {
  assert.equal(canonical.weekLifecycle({ ...week, weekEnd: "2026-08-16" }, null, date), "COMPLETED");
  assert.equal(canonical.weekLifecycle({ ...week, status: "REPLACED" }, null, date), "SUPERSEDED");
  assert.deepEqual(Object.values(canonical.LIFECYCLE), ["DRAFT", "READY_TO_COMMIT", "ACTIVE", "COMPLETED", "SUPERSEDED"]);
});
