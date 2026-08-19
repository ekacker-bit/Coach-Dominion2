"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const journey = require("../assets/js/beta-journey-certification.js");

function healthy(overrides = {}) {
  const base = {
    date: "2026-08-18",
    account: { status: "CURRENT", serverConfirmed: true, lastVerifiedAt: "2026-08-18T12:00:00.000Z" },
    conflicts: [],
    pendingWrites: 0,
    contract: { exists: true, signed: true, id: "contract-1", revision: 12, hash: "contract:contract-1:r12" },
    program: { id: "program-12", state: "ACTIVE", contractRevision: 12, contractRef: "contract:contract-1:r12" },
    week: { id: "week-12", status: "COMMITTED", weekStart: "2026-08-17", weekEnd: "2026-08-23", programId: "program-12", contractRevision: 12 },
    today: { id: "today-18", date: "2026-08-18", committed: true, weekCommitted: true, weekId: "week-12", programId: "program-12", contractRevision: 12 },
    evidence: { count: 0, weekId: "week-12", programId: "program-12", todayId: "today-18", contractRevision: 12 },
    closeout: null
  };
  return { ...base, ...overrides };
}

test("certifies the complete open-day journey", () => {
  const result = journey.evaluate(healthy());
  assert.equal(result.state, "CERTIFIED");
  assert.equal(result.certified, true);
  assert.equal(result.currentCount, 7);
  assert.equal(result.total, 7);
  assert.equal(result.label, "CURRENT");
  assert.equal(result.stages.find((item) => item.id === "evidence").state, "OPEN");
  assert.equal(result.stages.find((item) => item.id === "closeout").state, "OPEN");
});

test("certifies a sealed day against the same lineage", () => {
  const result = journey.evaluate(healthy({
    closeout: { status: "SEALED", closed: true, todayId: "today-18", weekId: "week-12", contractRevision: 12 }
  }));
  assert.equal(result.state, "CERTIFIED");
  assert.equal(result.stages.find((item) => item.id === "closeout").state, "CURRENT");
});

test("makes a saved Contract conflict the first action", () => {
  const result = journey.evaluate(healthy({ conflicts: [{ domain: "contract" }] }));
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.equal(result.firstProblem.id, "account");
  assert.equal(result.firstProblem.code, "CONTRACT_CONFLICT");
  assert.equal(result.primaryAction.code, "RESOLVE_CONTINUITY");
});

test("protects a pending account write without inventing a broken plan", () => {
  const result = journey.evaluate(healthy({
    account: { status: "SAVE_QUEUED", serverConfirmed: false },
    pendingWrites: 1
  }));
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.primaryAction, null);
  assert.equal(result.label, "SYNC 1");
});

test("rejects each mismatched program lineage", () => {
  const program = journey.evaluate(healthy({ program: { id: "program-12", state: "ACTIVE", contractRevision: 11, contractRef: "contract:contract-1:r11" } }));
  assert.equal(program.firstProblem.code, "PROGRAM_CONTRACT_MISMATCH");

  const calendar = journey.evaluate(healthy({ week: { id: "week-12", status: "COMMITTED", weekStart: "2026-08-17", weekEnd: "2026-08-23", programId: "wrong", contractRevision: 12 } }));
  assert.equal(calendar.firstProblem.code, "CALENDAR_LINEAGE_MISMATCH");

  const today = journey.evaluate(healthy({ today: { id: "today-18", committed: true, weekCommitted: true, weekId: "wrong", programId: "program-12", contractRevision: 12 } }));
  assert.equal(today.firstProblem.code, "TODAY_LINEAGE_MISMATCH");
});

test("rejects evidence and Closeout attached to another day", () => {
  const evidence = journey.evaluate(healthy({ evidence: { count: 1, weekId: "week-12", programId: "program-12", todayId: "old-day", contractRevision: 12 } }));
  assert.equal(evidence.firstProblem.code, "EVIDENCE_LINEAGE_MISMATCH");

  const closeout = journey.evaluate(healthy({ closeout: { status: "SEALED", todayId: "old-day", weekId: "week-12", contractRevision: 12 } }));
  assert.equal(closeout.firstProblem.code, "CLOSEOUT_LINEAGE_MISMATCH");
});

test("requires a signed revisioned Contract before downstream setup", () => {
  const result = journey.evaluate(healthy({ contract: { exists: true, signed: false, id: "contract-1", revision: 12 } }));
  assert.equal(result.firstProblem.id, "contract");
  assert.equal(result.firstProblem.code, "CONTRACT_REQUIRED");
});

test("does not mistake a staged next week for the active week", () => {
  assert.equal(journey.activeWeekForDate({ status: "DRAFT", weekStart: "2026-08-24", weekEnd: "2026-08-30" }, "2026-08-18"), false);
  const result = journey.evaluate(healthy({ week: { id: "staged", status: "DRAFT", weekStart: "2026-08-24", weekEnd: "2026-08-30" } }));
  assert.equal(result.firstProblem.code, "ACTIVE_WEEK_REQUIRED");
});

test("issues the same certification id in a second unchanged session", () => {
  const result = journey.evaluate(healthy());
  const first = journey.certificationReceipt(result, { certifiedAt: "2026-08-18T12:00:00.000Z" });
  const second = journey.certificationReceipt(journey.evaluate(healthy()), { certifiedAt: "2026-08-18T18:00:00.000Z" });
  assert.equal(first.id, second.id);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.notEqual(first.certifiedAt, second.certifiedAt);
});

test("protects an active prior-Contract week after an amendment", () => {
  const result = journey.evaluate(healthy({
    contract: { exists: true, signed: true, id: "contract-1", revision: 13, hash: "contract:contract-1:r13" },
    program: { id: "program-12", state: "ACTIVE", contractRevision: 12, contractRef: "contract:contract-1:r12" },
    transition: { protectedCurrentWeek: true, operatingContractRevision: 12, operatingContractRef: "contract:contract-1:r12" },
    stagedWeek: { id: "week-13", status: "DRAFT", weekStart: "2026-08-24", weekEnd: "2026-08-30", contractRevision: 13, programId: "program-13" }
  }));
  assert.equal(result.state, "CERTIFIED");
  assert.equal(result.protectedCurrentWeek, true);
  assert.equal(result.lineage.contractRevision, 13);
  assert.equal(result.lineage.operatingContractRevision, 12);
});

test("rejects a staged week that ignores the amended Contract", () => {
  const result = journey.evaluate(healthy({
    contract: { exists: true, signed: true, id: "contract-1", revision: 13, hash: "contract:contract-1:r13" },
    program: { id: "program-12", state: "ACTIVE", contractRevision: 12, contractRef: "contract:contract-1:r12" },
    transition: { protectedCurrentWeek: true, operatingContractRevision: 12, operatingContractRef: "contract:contract-1:r12" },
    stagedWeek: { id: "week-13", status: "DRAFT", weekStart: "2026-08-24", weekEnd: "2026-08-30", contractRevision: 12, programId: "program-12" }
  }));
  assert.equal(result.state, "INCONSISTENT");
  assert.equal(result.firstProblem.code, "STAGED_WEEK_CONTRACT_MISMATCH");
  assert.equal(result.primaryAction.code, "OPEN_CALENDAR");
});

test("uses canonical sync vocabulary without treating a protected retry as lost work", () => {
  const offline = journey.evaluate(healthy({ account: { status: "OFFLINE_PROTECTED", serverConfirmed: false }, pendingWrites: 1, syncState: "offline_queued" }));
  assert.equal(offline.state, "PROTECTED");
  assert.equal(offline.stages.find((item) => item.id === "account").code, "OFFLINE_SAVE_QUEUED");

  const repair = journey.evaluate(healthy({ syncState: "user_action_required" }));
  assert.equal(repair.state, "ACTION_REQUIRED");
  assert.equal(repair.firstProblem.code, "ACCOUNT_ACTION_REQUIRED");
});

test("blocks only a genuine active-date conflict", () => {
  const result = journey.evaluate(healthy({ executionContext: { blocked: true } }));
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.equal(result.firstProblem.id, "today");
  assert.equal(result.firstProblem.code, "ACTIVE_DATE_CONFLICT");
});

test("requires Today and Quick Log to describe the same assignments", () => {
  const result = journey.evaluate(healthy({ assignmentAudit: { matches: false } }));
  assert.equal(result.state, "INCONSISTENT");
  assert.equal(result.firstProblem.code, "ASSIGNMENT_SURFACE_MISMATCH");
});

test("quarantined biometrics stay outside coaching without blocking execution", () => {
  const result = journey.evaluate(healthy({ biometricReview: { pending: true, metric: "weight" } }));
  assert.equal(result.state, "CERTIFIED");
  assert.equal(result.attention.length, 1);
  assert.equal(result.attention[0].code, "BIOMETRIC_CONFIRMATION_REQUIRED");
});
