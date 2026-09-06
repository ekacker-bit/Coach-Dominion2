"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Week = require("../assets/js/recruit-week-certification.js");

const authority = {
  contractRevision: 14,
  programId: "program-r14",
  weekId: "week-source",
  weekStartDate: "2026-08-24",
  weekEndDate: "2026-08-30"
};

const proofWeek = {
  state: "VERIFIED",
  authority,
  candidate: {
    id: "recruit-proof-week:2026-08-24:proof",
    type: "RECRUIT_PROOF_WEEK",
    authority,
    dailyReceiptIds: Array.from({ length: 7 }, (_, index) => `daily-${index + 1}`)
  }
};

const inspection = {
  id: "inspection-2026-08-24",
  weekStartDate: "2026-08-24",
  weekEndDate: "2026-08-30",
  finalizedAt: "2026-08-31T00:01:00.000Z"
};

const targetWeek = {
  id: "week-target",
  status: "COMMITTED",
  weekStart: "2026-08-31",
  weekEnd: "2026-09-06"
};

const launchCandidate = {
  id: "weekly-verdict-launch:source:target:proof",
  type: "WEEKLY_VERDICT_LAUNCH",
  proofWeekReceiptId: proofWeek.candidate.id,
  sourceWeekId: authority.weekId,
  sourceWeekStart: authority.weekStartDate,
  sourceWeekEnd: authority.weekEndDate,
  targetWeekId: targetWeek.id,
  targetWeekStart: targetWeek.weekStart,
  contractRevision: authority.contractRevision,
  programId: authority.programId,
  calendarReceiptId: "calendar-commit:target"
};

const weeklyLaunch = {
  state: "VERIFIED",
  verified: true,
  candidate: launchCandidate,
  primaryAction: { code: "OPEN_NEXT_WEEK", label: "Open next week", section: "calendar" }
};

function complete(overrides = {}) {
  return {
    userId: "recruit-1",
    authority,
    proofWeek,
    inspection,
    weeklyLaunch,
    targetWeek,
    account: {
      serverConfirmed: true,
      lastVerifiedAt: "2026-08-31T00:05:00.000Z",
      pendingWrites: 0,
      online: true
    },
    observedAt: "2026-08-31T00:05:00.000Z",
    ...overrides
  };
}

test("a missing prior day is the only recruit-facing repair", () => {
  const report = Week.evaluate(complete({
    proofWeek: {
      state: "ACTION_REQUIRED",
      repair: {
        code: "REVIEW_PRIOR_DAY",
        label: "Review yesterday",
        section: "today",
        operatingDate: "2026-08-29",
        detail: "Aug 29 is missing its account-backed daily proof."
      }
    },
    inspection: { ...inspection, finalizedAt: null },
    weeklyLaunch: null,
    targetWeek: null
  }));
  assert.equal(report.state, Week.STATES.ACTION_REQUIRED);
  assert.equal(report.primaryAction.code, "REVIEW_PRIOR_DAY");
  assert.equal(report.primaryAction.operatingDate, "2026-08-29");
  assert.equal(report.firstProblem.id, "dailyProof");
  assert.equal(report.candidate, null);
});

test("seven confirmed days route to one finalization action", () => {
  const report = Week.evaluate(complete({
    inspection: { ...inspection, finalizedAt: null },
    weeklyLaunch: null,
    targetWeek: null
  }));
  assert.equal(report.state, Week.STATES.ACTION_REQUIRED);
  assert.equal(report.primaryAction.code, "FINALIZE_WEEK");
  assert.equal(report.firstProblem.id, "inspection");
});

test("a finalized week routes to one next-week approval", () => {
  const report = Week.evaluate(complete({
    weeklyLaunch: {
      state: "VERDICT_READY",
      detail: "Approve its coordinated next-week calendar.",
      primaryAction: { code: "APPROVE_NEXT_WEEK", label: "Approve next week", section: "inspection" }
    },
    targetWeek: null
  }));
  assert.equal(report.state, Week.STATES.ACTION_REQUIRED);
  assert.equal(report.primaryAction.code, "APPROVE_NEXT_WEEK");
  assert.equal(report.firstProblem.id, "launch");
});

test("stale launch lineage fails closed on Calendar", () => {
  const report = Week.evaluate(complete({
    weeklyLaunch: {
      ...weeklyLaunch,
      candidate: { ...launchCandidate, sourceWeekId: "different-week" }
    }
  }));
  assert.equal(report.state, Week.STATES.ACTION_REQUIRED);
  assert.equal(report.primaryAction.code, "OPEN_CALENDAR");
  assert.equal(report.firstProblem.code, "LAUNCH_LINEAGE_MISMATCH");
  assert.equal(report.candidate, null);
});

test("the complete week produces one deterministic account-restorable receipt", () => {
  const first = Week.evaluate(complete());
  assert.equal(first.state, Week.STATES.READY_TO_SAVE);
  assert.equal(first.shouldSave, true);
  assert.ok(first.candidate?.id);
  assert.equal(first.candidate.proof.dailyReceiptIds.length, 7);

  const local = Week.evaluate(complete({ localReceipts: [first.candidate] }));
  assert.equal(local.state, Week.STATES.PROTECTED);
  assert.equal(local.verified, false);
  assert.equal(local.primaryAction.code, "RETRY_ACCOUNT");

  const restored = Week.evaluate(complete({
    localReceipts: [first.candidate],
    accountReceipts: [first.candidate]
  }));
  assert.equal(restored.state, Week.STATES.VERIFIED);
  assert.equal(restored.verified, true);
  assert.equal(restored.candidate.id, first.candidate.id);
  assert.equal(restored.primaryAction.section, "calendar");
  assert.equal(Week.appendReceipt([first.candidate], first.candidate).length, 1);
});

test("an offline completed week stays protected without claiming account proof", () => {
  const candidate = Week.buildReceipt(complete());
  const report = Week.evaluate(complete({
    localReceipts: [candidate],
    account: { serverConfirmed: false, pendingWrites: 1, online: false }
  }));
  assert.equal(report.state, Week.STATES.PROTECTED);
  assert.equal(report.verified, false);
  assert.equal(report.primaryAction.code, "RETRY_ACCOUNT");
});

test("private diagnostics expose bounded stage codes without personal data", () => {
  const report = Week.evaluate(complete());
  assert.match(report.diagnostic.code, /^WG-[A-F0-9]{8}$/);
  assert.deepEqual(Object.keys(report.diagnostic.stageStates), ["account", "authority", "dailyProof", "inspection", "launch"]);
  assert.doesNotMatch(JSON.stringify(report.diagnostic), /recruit-1|email|health/i);
});
