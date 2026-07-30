const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const strength = require("../assets/js/strength-training.js");
const schedule = require("../assets/js/strength-schedule.js");
const dailyAssignment = require("../assets/js/daily-assignment.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

function approvedPlan(daysPerWeek = 3) {
  const draft = strength.buildStrengthProgram({
    goal: "GENERAL_STRENGTH",
    daysPerWeek,
    equipment: "FULL_GYM",
    sessionMinutes: 60,
    experience: "INTERMEDIATE"
  }, [], {
    startDate: "2026-07-30",
    generatedAt: "2026-07-30T12:00:00.000Z"
  });
  return strength.approvePlan(draft, "2026-07-30T12:05:00.000Z");
}

function build(plan = approvedPlan(), context = {}, options = {}) {
  return schedule.buildWeeklySchedule(plan, [], context, {
    today: "2026-07-30",
    createdAt: "2026-07-30T13:00:00.000Z",
    ...options
  });
}

test("weekly scheduling requires an approved strength program", () => {
  const result = schedule.buildWeeklySchedule({}, [], {}, { today: "2026-07-30" });
  assert.equal(result.status, "PLAN_REQUIRED");
  assert.equal(result.assignments.length, 0);
});

test("three-day strength defaults to Monday, Wednesday, and Friday", () => {
  const result = build();
  assert.deepEqual(result.preferredDays, [0, 2, 4]);
  assert.deepEqual(result.assignments.map((item) => item.date), ["2026-08-03", "2026-08-05", "2026-08-07"]);
  assert.deepEqual(result.assignments.map((item) => item.sessionId), approvedPlan().sessions.map((item) => item.id));
});

test("an incomplete current week rolls to the next complete operating week", () => {
  const result = build();
  assert.equal(result.weekStart, "2026-08-03");
  assert.equal(result.weekEnd, "2026-08-09");
  assert.equal(result.days.length, 7);
});

test("hard running sessions are avoided without rewriting the run plan", () => {
  const runningPlan = {
    status: "READY",
    sessions: [
      { id: "run-1", date: "2026-08-03", type: "INTERVAL" },
      { id: "run-2", date: "2026-08-07", type: "LONG" }
    ]
  };
  const before = JSON.stringify(runningPlan);
  const result = build(approvedPlan(), { runningPlan });
  assert.ok(result.assignments.every((item) => !["2026-08-03", "2026-08-07"].includes(item.date)));
  assert.equal(result.approvalBlocked, false);
  assert.equal(JSON.stringify(runningPlan), before);
});

test("core overlap remains visible as an advisory", () => {
  const result = build();
  const coordinatedDate = result.assignments[1].date;
  const corePlan = {
    status: "APPROVED",
    weeks: [{ sessions: [{ id: "core-1", date: coordinatedDate, title: "Core 1.2" }] }]
  };
  const coordinatedDay = schedule.scheduleDays(result, { corePlan }, [], "2026-07-30").find((item) => item.date === coordinatedDate);
  assert.equal(coordinatedDay.core.title, "Core 1.2");
  assert.ok(coordinatedDay.assignment.conflicts.some((item) => item.code === "CORE_COMBINED" && item.severity === "ADVISORY"));
});

test("an unavoidable hard-run collision blocks approval", () => {
  const runningPlan = {
    status: "READY",
    sessions: Array.from({ length: 7 }, (_, index) => ({
      id: `run-${index}`,
      date: schedule.addDays("2026-08-03", index),
      type: index === 6 ? "LONG" : "INTERVAL"
    }))
  };
  const result = build(approvedPlan(), { runningPlan });
  assert.equal(result.approvalBlocked, true);
  assert.throws(() => schedule.approveSchedule(result), /blocking schedule conflicts/i);
});

test("a coordinated draft requires explicit approval", () => {
  const draft = build();
  assert.equal(draft.status, "DRAFT");
  const approved = schedule.approveSchedule(draft, "2026-07-30T13:05:00.000Z");
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.approvedAt, "2026-07-30T13:05:00.000Z");
});

test("weekly status distinguishes completed, missed, today, and upcoming work", () => {
  const draft = schedule.buildWeeklySchedule(approvedPlan(), [], {}, {
    today: "2026-08-03",
    weekStart: "2026-08-03",
    createdAt: "2026-08-03T10:00:00.000Z"
  });
  const history = [{
    planId: draft.planId,
    sessionId: draft.assignments[0].sessionId,
    date: draft.assignments[0].date,
    state: "COMPLETE"
  }];
  assert.equal(schedule.assignmentState(draft.assignments[0], history, "2026-08-06"), "COMPLETE");
  assert.equal(schedule.assignmentState(draft.assignments[1], history, "2026-08-06"), "MISSED");
  assert.equal(schedule.assignmentState(draft.assignments[2], history, draft.assignments[2].date), "TODAY");
  const summary = schedule.scheduleSummary(draft, history, "2026-08-06");
  assert.equal(summary.completed, 1);
  assert.equal(summary.missed, 1);
  assert.equal(summary.upcoming, 1);
});

test("a missed session can be moved deliberately without completion credit", () => {
  const approved = schedule.approveSchedule(build(), "2026-07-30T13:05:00.000Z");
  const assignment = approved.assignments[0];
  const result = schedule.moveAssignment(approved, assignment.id, "2026-08-04", {}, {
    today: "2026-08-04",
    changedAt: "2026-08-04T09:00:00.000Z",
    reason: "Recovered and rescheduled."
  });
  assert.equal(result.valid, true);
  const moved = result.schedule.assignments.find((item) => item.id === assignment.id);
  assert.equal(moved.date, "2026-08-04");
  assert.equal(moved.originalDate, "2026-08-03");
  assert.equal(moved.placement, "RESCHEDULED");
  assert.equal(schedule.assignmentState(moved, [], "2026-08-04"), "TODAY");
  assert.equal(result.schedule.lastReschedule.from, "2026-08-03");
});

test("rescheduling rejects hard-run, occupied, past, and completed destinations", () => {
  const approved = schedule.approveSchedule(build(), "2026-07-30T13:05:00.000Z");
  const assignment = approved.assignments[0];
  const context = { runningPlan: { status: "READY", sessions: [{ date: "2026-08-04", type: "TEMPO" }] } };
  assert.equal(schedule.moveAssignment(approved, assignment.id, "2026-08-04", context, { today: "2026-08-03" }).valid, false);
  assert.equal(schedule.moveAssignment(approved, assignment.id, approved.assignments[1].date, {}, { today: "2026-08-03" }).valid, false);
  assert.equal(schedule.moveAssignment(approved, assignment.id, "2026-08-02", {}, { today: "2026-08-03" }).valid, false);
  const history = [{ planId: assignment.planId, sessionId: assignment.sessionId, date: assignment.date, state: "COMPLETE" }];
  assert.equal(schedule.moveAssignment(approved, assignment.id, "2026-08-04", {}, { today: "2026-08-03", history }).valid, false);
});

test("Today receives the exact scheduled session rather than the rotation fallback", () => {
  const plan = approvedPlan();
  const selected = plan.sessions[2];
  const prescription = strength.buildSessionPrescription(plan, selected.id, {
    today: "2026-08-07",
    readiness: { state: "YELLOW", pain: false }
  });
  assert.equal(prescription.sessionId, selected.id);
  assert.equal(prescription.exercises.length, selected.exercises.length);
  prescription.exercises.forEach((exercise, index) => {
    assert.equal(exercise.recommendedSets, Math.max(1, selected.exercises[index].recommendedSets - 1));
  });
});

test("scheduled recovery is operational and never renders as a missing program", () => {
  const assignment = dailyAssignment.buildDailyAssignment({
    date: "2026-08-04",
    readiness: { state: "GREEN", pain: false },
    programming: { scheduledRecovery: true, policy: { code: "SCHEDULED_RECOVERY" }, exercises: [] },
    generatedAt: "2026-08-04T08:00:00.000Z"
  });
  assert.equal(assignment.state, "RECOVERY ONLY");
  assert.equal(assignment.title, "Scheduled strength recovery");
  assert.equal(assignment.readinessDelta.code, "SCHEDULED_RECOVERY");
});

test("017C integration loads, persists, styles, tests, and migrates the schedule", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
  const migration = fs.readFileSync(path.join(root, "supabase/migrations/018_strength_schedule.sql"), "utf8");
  const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
  assert.match(html, /BUILD 017D/);
  assert.match(html, /strength-schedule\.js/);
  assert.match(app, /persistStrengthTrainingState\("SCHEDULE", "current"/);
  assert.match(app, /data-strength-schedule-action="approve"/);
  assert.match(app, /scheduledRecovery/);
  assert.match(styles, /\.strength-week-grid/);
  assert.match(migration, /'SCHEDULE'/);
  assert.match(pkg, /strength-schedule\.test\.js/);
});

console.log(`Strength schedule: ${passed} tests passed.`);
