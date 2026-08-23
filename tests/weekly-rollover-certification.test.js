const test = require("node:test");
const assert = require("node:assert/strict");
const rollover = require("../assets/js/weekly-rollover-certification.js");

const sourceStart = "2026-08-17";
const targetStart = "2026-08-24";
const activity = (id, module, title) => ({ assignmentId: id, module, title, estimatedMinutes: 45 });
const sourceWeek = (overrides = {}) => ({
  id: "week-source",
  status: "COMMITTED",
  revision: 3,
  weekStart: sourceStart,
  weekEnd: "2026-08-23",
  contractId: "contract-9",
  contractRevision: 9,
  programId: "program-9",
  programRevision: 9,
  trainingDays: 4,
  recoveryDays: 3,
  days: [
    { date: sourceStart, estimatedMinutes: 45, activities: [activity("source-lower", "strength", "Lower A")] },
    { date: "2026-08-18", estimatedMinutes: 0, activities: [] }
  ],
  ...overrides
});
const targetWeek = (overrides = {}) => ({
  id: "week-target",
  status: "COMMITTED",
  revision: 4,
  weekStart: targetStart,
  weekEnd: "2026-08-30",
  contractId: "contract-9",
  contractRevision: 9,
  programId: "program-9",
  programRevision: 9,
  trainingDays: 5,
  recoveryDays: 2,
  twoADayCount: 1,
  days: [
    {
      date: targetStart,
      estimatedMinutes: 75,
      activities: [activity("target-upper", "strength", "Upper A"), activity("target-core", "core", "Core A")],
      sessionSequence: [activity("target-upper", "strength", "Upper A"), activity("target-core", "core", "Core A")]
    },
    { date: "2026-08-25", estimatedMinutes: 0, activities: [] }
  ],
  ...overrides
});
const reconciliation = (overrides = {}) => ({
  id: "weekly-result-source",
  fingerprint: "weekly-result-proof",
  status: "COMMITTED",
  updatedAt: "2026-08-23T23:59:00.000Z",
  packet: {
    finalizedAt: "2026-08-23T23:50:00.000Z",
    weekStart: sourceStart,
    activeWeekId: "week-source",
    activeWeekRevision: 3,
    contractId: "contract-9",
    contractRevision: 9,
    programId: "program-9",
    programRevision: 9
  },
  verdict: {
    targetWeekStart: targetStart,
    next: "Maintain Strength and add one protected Core exposure."
  },
  commitReceipt: {
    targetWeekStart: targetStart,
    targetWeekId: "week-target",
    targetWeekRevision: 4
  },
  ...overrides
});
function calendar(week = targetWeek(), overrides = {}) {
  const assignmentIds = rollover.assignmentIds(week);
  return {
    id: "calendar-commit-target",
    weekStart: targetStart,
    calendarRevision: 4,
    contractRevision: 9,
    assignmentIds,
    contentHash: rollover.fingerprint({ targetStart, assignmentIds }),
    accountRevision: 12,
    committedAt: "2026-08-23T23:58:00.000Z",
    ...overrides
  };
}
function canonical(week = targetWeek(), date = targetStart, overrides = {}) {
  const day = week.days.find((item) => item.date === date);
  const sessions = (day?.sessionSequence?.length ? day.sessionSequence : day?.activities || []).map((item) => ({ id: item.assignmentId, assignmentId: item.assignmentId }));
  return {
    week: { id: week.id, revision: week.revision },
    schedule: { sessions },
    primaryAction: sessions[0]
      ? { action: "START", sessionId: sessions[0].assignmentId }
      : { action: "RECOVERY" },
    ...overrides
  };
}
function base(overrides = {}) {
  const source = sourceWeek();
  const target = targetWeek();
  return {
    reconciliation: reconciliation(),
    sourceWeek: source,
    targetWeek: target,
    calendarReceipt: calendar(target),
    weeks: [source, target],
    currentDate: "2026-08-23",
    resolvedWeek: source,
    ...overrides
  };
}

test("030L certifies one scheduled rollover while the source week stays protected", () => {
  const result = rollover.evaluate(base());
  assert.equal(result.valid, true);
  assert.equal(result.status, "SCHEDULED");
  assert.equal(result.receipt.sourceWeekId, "week-source");
  assert.equal(result.receipt.targetWeekId, "week-target");
  assert.equal(result.receipt.assignmentIds.length, 2);
  assert.equal(result.shouldSave, true);
});

test("030L receipt is immutable and idempotent across reload and device restore", () => {
  const first = rollover.evaluate(base());
  const restored = rollover.evaluate(base({ priorReceipt: JSON.parse(JSON.stringify(first.receipt)) }));
  assert.deepEqual(restored.receipt, first.receipt);
  assert.equal(restored.shouldSave, false);
  assert.equal(rollover.upsertHistory([first.receipt], restored.receipt).length, 1);
});

test("030L shows a concise, truthful before and after", () => {
  const result = rollover.evaluate(base());
  assert.equal(result.changes.changed, true);
  assert.deepEqual(result.changes.changes.find((item) => item.label === "Training days"), { label: "Training days", before: 4, after: 5 });
  assert.equal(result.effectiveDate, targetStart);
  assert.match(result.why, /Strength/);
});

test("030L blocks duplicate live target revisions with one repair", () => {
  const target = targetWeek();
  const duplicate = targetWeek({ id: "week-target-duplicate", revision: 5 });
  const result = rollover.evaluate(base({ targetWeek: target, weeks: [sourceWeek(), target, duplicate] }));
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.repair.code, "DUPLICATE_TARGET_WEEK");
  assert.equal(result.receipt, null);
});

test("030L never certifies a target week without an explicit committed status", () => {
  const target = targetWeek({ status: null });
  const result = rollover.evaluate(base({ targetWeek: target, calendarReceipt: calendar(target), weeks: [sourceWeek(), target] }));
  assert.equal(result.valid, false);
  assert.equal(result.repair.code, "TARGET_WEEK_NOT_COMMITTED");
  assert.equal(result.targetWeekStart, targetStart);
});

test("030L blocks a Calendar assignment mismatch instead of inventing a replacement", () => {
  const target = targetWeek();
  const result = rollover.evaluate(base({ targetWeek: target, calendarReceipt: calendar(target, { assignmentIds: ["wrong-assignment"] }) }));
  assert.equal(result.valid, false);
  assert.equal(result.repair.code, "CALENDAR_RECEIPT_MISMATCH");
  assert.equal(result.repair.action.section, "calendar");
});

test("030L safely recovers an interrupted weekly-result save from exact committed truth", () => {
  const interrupted = reconciliation();
  delete interrupted.commitReceipt;
  interrupted.status = "RECONCILED";
  const result = rollover.evaluate(base({ reconciliation: interrupted }));
  assert.equal(result.valid, true);
  assert.equal(result.receipt.recovered, true);
  assert.match(result.receipt.recoveryReason, /interrupted/);
});

test("030L Monday activates the exact certified week and first executable mission", () => {
  const target = targetWeek();
  const result = rollover.evaluate(base({
    targetWeek: target,
    currentDate: targetStart,
    resolvedWeek: target,
    canonicalCommand: canonical(target)
  }));
  assert.equal(result.valid, true);
  assert.equal(result.status, "ACTIVE");
  assert.match(result.headline, /committed week/i);
});

test("030L Monday blocks when Today resolves a different assignment", () => {
  const target = targetWeek();
  const wrong = canonical(target, targetStart, {
    schedule: { sessions: [{ id: "invented", assignmentId: "invented" }] },
    primaryAction: { action: "START", sessionId: "invented" }
  });
  const result = rollover.evaluate(base({ targetWeek: target, currentDate: targetStart, resolvedWeek: target, canonicalCommand: wrong }));
  assert.equal(result.valid, false);
  assert.equal(result.repair.code, "DAILY_COMMAND_MISMATCH");
});

test("030L accepts a certified recovery Monday without inventing training", () => {
  const target = targetWeek({
    days: [{ date: targetStart, estimatedMinutes: 0, activities: [] }],
    trainingDays: 0,
    recoveryDays: 7,
    twoADayCount: 0
  });
  const result = rollover.evaluate(base({
    targetWeek: target,
    calendarReceipt: calendar(target, { assignmentIds: [] }),
    weeks: [sourceWeek(), target],
    currentDate: targetStart,
    resolvedWeek: target,
    canonicalCommand: canonical(target)
  }));
  assert.equal(result.valid, true);
  assert.equal(result.status, "ACTIVE");
});
