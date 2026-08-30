"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const recovery = require("../assets/js/recruit-continuity-recovery.js");
const betaIntegrity = require("../assets/js/beta-state-integrity.js");

const date = "2026-08-28";
const authority = { contractRevision: 9, weekId: "week-35", weekRevision: 3, calendarCommitId: "calendar-3" };
const verified = (key) => ({ key, status: "VERIFIED", label: key, detail: "Verified" });
const target = {
  assignmentId: "strength:lower-a:2026-08-28",
  module: "strength",
  title: "Lower A",
  route: { section: "today", module: "strength", anchor: "daily-assignment-heading" }
};
function loop(overrides = {}) {
  return {
    targetDate: date,
    state: "WAITING",
    stages: ["account", "authority", "priorDay", "handoff", "morning", "execution"].map(verified),
    links: { assignmentId: target.assignmentId, morning: { id: "morning-1", target } },
    ...overrides
  };
}
function withStage(key, status, detail = "Needs attention") {
  return loop({ stages: ["account", "authority", "priorDay", "handoff", "morning", "execution"].map((name) => name === key ? { key: name, status, label: name, detail } : verified(name)) });
}
function input(loopValue, overrides = {}) {
  return {
    targetDate: date,
    userId: "user-1",
    authority,
    loop: loopValue,
    online: true,
    serverConfirmed: true,
    pendingWrites: 0,
    accountReceipts: [],
    createdAt: "2026-08-28T12:00:00.000Z",
    ...overrides
  };
}

test("certified recruit loop needs no recovery", () => {
  const result = recovery.evaluate(input(loop({ state: "CERTIFIED" })));
  assert.equal(result.state, recovery.STATES.CLEAR);
  assert.equal(result.order, null);
  assert.equal(result.receipt, null);
});

test("protected writes are retried automatically only while online", () => {
  const online = recovery.evaluate(input(withStage("account", "PROTECTED"), { serverConfirmed: false, pendingWrites: 1 }));
  assert.equal(online.state, recovery.STATES.AUTO_REPAIR);
  assert.equal(online.order.code, "RETRY_PROTECTED_SAVE");
  assert.equal(online.order.mode, recovery.MODES.AUTO);
  const offline = recovery.evaluate(input(withStage("account", "PROTECTED"), { online: false, serverConfirmed: false, pendingWrites: 1 }));
  assert.equal(offline.state, recovery.STATES.PROTECTED);
  assert.equal(offline.order.mode, recovery.MODES.RECRUIT);
});

test("signed authority is never mutated by recovery", () => {
  const contract = recovery.evaluate(input(withStage("authority", "BROKEN"), { authority: { contractRevision: 0 } }));
  assert.equal(contract.order.code, "OPEN_CONTRACT");
  assert.equal(contract.order.mutatesSignedAuthority, false);
  assert.equal(contract.order.inventsCompletion, false);
  const calendar = recovery.evaluate(input(withStage("authority", "BROKEN"), { authority: { ...authority, calendarCommitId: null } }));
  assert.equal(calendar.order.code, "OPEN_CALENDAR");
  assert.equal(calendar.state, recovery.STATES.DECISION_REQUIRED);
});

test("certified prior evidence may rebuild handoff and activate today silently", () => {
  const handoff = recovery.evaluate(input(withStage("handoff", "WAITING"), { canRebuildHandoff: true }));
  assert.equal(handoff.order.code, "REBUILD_HANDOFF");
  assert.equal(handoff.order.mode, recovery.MODES.AUTO);
  const morning = recovery.evaluate(input(withStage("morning", "WAITING"), { canActivateMorning: true }));
  assert.equal(morning.order.code, "ACTIVATE_TODAY");
  assert.equal(morning.order.mode, recovery.MODES.AUTO);
});

test("missing prior closeout opens the exact prior operating date", () => {
  const result = recovery.evaluate(input(withStage("priorDay", "WAITING")));
  assert.equal(result.order.code, "OPEN_CLOSEOUT");
  assert.equal(result.order.label, "Review yesterday");
  assert.equal(result.order.operatingDate, "2026-08-27");
  assert.equal(result.receipt.recovery.operatingDate, "2026-08-27");
  assert.equal(recovery.addDays("2026-03-01", -1), "2026-02-28");
});

test("unfinished execution resumes the exact activated assignment", () => {
  const result = recovery.evaluate(input(withStage("execution", "WAITING")));
  assert.equal(result.state, recovery.STATES.ACTION_REQUIRED);
  assert.equal(result.order.code, "RESUME_ASSIGNMENT");
  assert.equal(result.order.label, "Resume Lower A");
  assert.equal(result.order.assignmentId, target.assignmentId);
  assert.equal(result.order.module, "strength");
  assert.equal(result.order.section, "today");
  assert.equal(result.order.inventsCompletion, false);
});

test("exact account receipt restores the same recovery order on a second device", () => {
  const first = recovery.evaluate(input(withStage("execution", "WAITING"), { serverConfirmed: false }));
  const second = recovery.evaluate(input(withStage("execution", "WAITING"), {
    accountReceipts: [first.receipt],
    accountConfirmedAt: "2026-08-28T12:00:05.000Z"
  }));
  assert.equal(second.receipt.id, first.receipt.id);
  assert.equal(second.receipt.fingerprint, first.receipt.fingerprint);
  assert.equal(second.receipt.verificationStatus, "ACCOUNT_CONFIRMED");
  assert.equal(second.order.assignmentId, first.order.assignmentId);
});

test("recovery history is deterministic and bounded", () => {
  const result = recovery.evaluate(input(withStage("execution", "WAITING")));
  const history = recovery.upsertHistory([result.receipt, { id: "older", type: recovery.RECEIPT_TYPE }], result.receipt, 2);
  assert.equal(history.length, 2);
  assert.equal(history.filter((item) => item.id === result.receipt.id).length, 1);
  assert.equal(recovery.latestForDate(history, date).id, result.receipt.id);
});

test("empty account state remains a valid protected startup state", () => {
  const authorityResult = betaIntegrity.resolveOperatingProgramAuthority({
    today: date,
    signedContract: null,
    activeWeek: null,
    receipt: null
  });
  assert.equal(authorityResult.source, "NONE");
  assert.equal(authorityResult.contractRevision, null);
  assert.equal(authorityResult.signedWeekAuthoritative, false);
});
