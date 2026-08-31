"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Launch = require("../assets/js/weekly-verdict-launch.js");

const proofWeek = {
  state: "VERIFIED",
  verified: true,
  candidate: { id: "recruit-proof-week:2026-08-24:proof" }
};
const inspection = {
  id: "inspection-2026-08-24",
  weekStartDate: "2026-08-24",
  weekEndDate: "2026-08-30",
  finalizedAt: "2026-08-31T00:01:00.000Z"
};
const sourceWeek = {
  id: "week-source",
  status: "COMMITTED",
  revision: 4,
  weekStart: "2026-08-24",
  weekEnd: "2026-08-30",
  contractRevision: 14,
  programId: "program-r14",
  programRevision: 3
};
const targetWeek = {
  id: "week-target",
  status: "COMMITTED",
  revision: 5,
  weekStart: "2026-08-31",
  weekEnd: "2026-09-06",
  contractRevision: 14,
  programId: "program-r14",
  programRevision: 3
};
const reconciliation = {
  id: "atlas-result-1",
  fingerprint: "reconciliation-proof",
  status: "COMMITTED",
  packet: { contractRevision: 14, programId: "program-r14", programRevision: 3 },
  verdict: {
    status: "COMMITTED",
    position: "ON_TRACK",
    tone: "green",
    commandCode: "CURRENT",
    targetWeekStart: "2026-08-31",
    targetWeekEnd: "2026-09-06",
    worked: "Training execution held under fatigue.",
    broke: "Fuel evidence was thin on two days.",
    next: "Repeat the coordinated week and close Fuel daily."
  },
  commitReceipt: {
    id: "atlas-weekly-commit:1",
    targetWeekStart: "2026-08-31",
    targetWeekId: "week-target",
    targetWeekRevision: 5
  }
};
const rollover = {
  valid: true,
  status: "SCHEDULED",
  receipt: {
    id: "weekly-rollover:1",
    fingerprint: "rollover-proof",
    calendarReceiptId: "calendar-commit:1",
    calendarContentHash: "calendar-proof"
  }
};

function complete(overrides = {}) {
  return {
    proofWeek,
    inspection,
    reconciliation,
    sourceWeek,
    targetWeek,
    rollover,
    calendarReceipt: { id: "calendar-commit:1", contentHash: "calendar-proof" },
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-31T00:05:00.000Z", online: true },
    ...overrides
  };
}

test("maps Atlas prescriptions into four recruit-facing verdicts", () => {
  assert.equal(Launch.decisionCode({ command: { code: "PROGRESS" } }), "ADVANCE");
  assert.equal(Launch.decisionCode({ command: { code: "CURRENT" } }), "MAINTAIN");
  assert.equal(Launch.decisionCode({ command: { code: "DELOAD" } }), "REDUCE");
  assert.equal(Launch.decisionCode({ command: { code: "PROTECT" } }), "RECOVER");
});

test("does not offer judgment before the seven-day account proof is verified", () => {
  const report = Launch.evaluate(complete({
    proofWeek: {
      state: "ACTION_REQUIRED",
      repair: { code: "REVIEW_PRIOR_DAY", label: "Review yesterday", section: "today", operatingDate: "2026-08-29", detail: "Yesterday is missing proof." }
    }
  }));
  assert.equal(report.state, "ACTION_REQUIRED");
  assert.equal(report.primaryAction.code, "REVIEW_PRIOR_DAY");
  assert.equal(report.primaryAction.operatingDate, "2026-08-29");
  assert.equal(report.candidate, null);
});

test("makes finalization the only action after proof is secure", () => {
  const report = Launch.evaluate(complete({ inspection: { ...inspection, finalizedAt: null }, reconciliation: null, targetWeek: null, rollover: null }));
  assert.equal(report.state, "READY_TO_FINALIZE");
  assert.equal(report.primaryAction.code, "FINALIZE_WEEK");
  assert.equal(report.candidate, null);
});

test("shows one next-week approval after final judgment", () => {
  const pendingReconciliation = {
    ...reconciliation,
    status: "FINALIZED",
    commitReceipt: null,
    verdict: { ...reconciliation.verdict, status: "FINALIZED", commandCode: "PROGRESS", position: "AHEAD" }
  };
  const report = Launch.evaluate(complete({ reconciliation: pendingReconciliation, targetWeek: null, rollover: null, command: { code: "PROGRESS" } }));
  assert.equal(report.state, "VERDICT_READY");
  assert.equal(report.decision, "ADVANCE");
  assert.equal(report.primaryAction.code, "APPROVE_NEXT_WEEK");
  assert.match(report.lines.win, /Training execution/);
});

test("confirms launch only after the exact receipt restores from the account", () => {
  const first = Launch.evaluate(complete());
  assert.equal(first.state, "READY_TO_SAVE");
  assert.equal(first.shouldSave, true);
  assert.ok(first.candidate?.id);

  const protectedReport = Launch.evaluate(complete({ localReceipts: [first.candidate] }));
  assert.equal(protectedReport.state, "PROTECTED");
  assert.equal(protectedReport.verified, false);

  const restored = Launch.evaluate(complete({
    localReceipts: [first.candidate],
    accountReceipts: [first.candidate],
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-31T00:06:00.000Z", online: true }
  }));
  assert.equal(restored.state, "VERIFIED");
  assert.equal(restored.verified, true);
  assert.equal(restored.candidate.id, first.candidate.id);
  assert.equal(restored.primaryAction.section, "calendar");
});

test("blocks a committed week when its rollover lineage is invalid", () => {
  const report = Launch.evaluate(complete({
    rollover: {
      valid: false,
      status: "BLOCKED",
      detail: "The Calendar revision no longer matches.",
      repair: { code: "CALENDAR_RECEIPT_MISMATCH", action: { label: "Repair Calendar", section: "calendar" } }
    }
  }));
  assert.equal(report.state, "BLOCKED");
  assert.equal(report.primaryAction.section, "calendar");
  assert.equal(report.candidate, null);
});
