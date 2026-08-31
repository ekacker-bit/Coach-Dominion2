"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Startup = require("../assets/js/startup-authority.js");
const Week = require("../assets/js/week-progress.js");
const Integrity = require("../assets/js/beta-state-integrity.js");
const Continuity = require("../assets/js/dominion-continuity.js");
const Fuel = require("../assets/js/nutrition-state-contract.js");
const Lifecycle = require("../assets/js/program-lifecycle.js");
const Stabilization = require("../assets/js/release-stabilization.js");

function signedContract(revision, overrides = {}) {
  const id = overrides.id || `contract-r${revision}`;
  return {
    id,
    revision,
    status: "APPROVED",
    primaryGoal: "Lose fat",
    trainingDaysPerWeek: 5,
    strengthDaysPerWeek: 4,
    runningDaysPerWeek: 3,
    coreDaysPerWeek: 3,
    signature: {
      signerName: "Beta Recruit",
      accepted: true,
      contractId: id,
      contractRevision: revision,
      oathVersion: Integrity.OATH_VERSION,
      signedAt: `2026-08-${String(revision).padStart(2, "0")}T12:00:00.000Z`
    },
    ...overrides
  };
}

test("verified signed state becomes usable before background hydration and remains read-only", () => {
  const early = Startup.verifiedDevicePreview(Startup.initial(), {
    deviceSnapshot: { fingerprint: "account-r14" },
    deviceVerified: true
  });
  assert.equal(early.phase, Startup.PHASES.READY);
  assert.equal(Startup.permitsAction(early), true);
  assert.equal(early.readOnly, true);
  assert.equal(early.backgroundHydration, true);
  assert.equal(early.accountAvailable, null);
  assert.equal(Startup.permitsAccountWrite(early, "quick-log"), false);
  const hydrated = Startup.completeHydration(early);
  assert.equal(hydrated.readOnly, false);
  assert.equal(Startup.permitsAccountWrite(hydrated, "quick-log"), true);
});

test("startup timeout is bounded and never invents authority", () => {
  const verified = Startup.timeout(Startup.initial(), { verifiedSnapshot: true });
  assert.equal(verified.phase, Startup.PHASES.DEGRADED);
  assert.equal(Startup.permitsAction(verified), true);
  assert.equal(Startup.permitsAccountWrite(verified, "quick-log"), false);
  const blocked = Startup.timeout(Startup.initial(), { verifiedSnapshot: false });
  assert.equal(blocked.phase, Startup.PHASES.BLOCKED);
  assert.equal(blocked.errorCode, "RESTORE_TIMEOUT");
  assert.equal(Startup.timeout(blocked, { verifiedSnapshot: false }).phase, Startup.PHASES.BLOCKED);
  assert.deepEqual(Startup.timing(1000, { usable: 3900 }, 7800), { usableMs: 2900, hydrationMs: 6800, phases: { usable: 2900 } });
});

test("week progress includes today, excludes the future, and stays date-only across timezones and DST", () => {
  const week = { weekStartDate: "2026-08-24", weekEndDate: "2026-08-30" };
  assert.equal(Week.resolve({ ...week, asOfDate: "2026-08-24" }).elapsedDayCount, 1);
  assert.equal(Week.resolve({ ...week, asOfDate: "2026-08-27" }).elapsedDayCount, 4);
  assert.equal(Week.resolve({ ...week, asOfDate: "2026-08-30" }).elapsedDayCount, 7);
  assert.equal(Week.resolve({ ...week, asOfDate: "2026-08-23" }).elapsedDayCount, 0);
  assert.equal(Week.resolve({ ...week, asOfDate: "2026-08-31" }).elapsedDayCount, 7);
  assert.equal(Week.dateInZone("2026-08-30T02:00:00.000Z", "America/Chicago"), "2026-08-29");
  assert.equal(Week.dateInZone("2026-03-08T07:30:00.000Z", "America/Chicago"), "2026-03-08");
  assert.equal(Week.dateInZone("2026-11-01T06:30:00.000Z", "America/Chicago"), "2026-11-01");
});

test("one effective identity keeps unsigned drafts non-operational", () => {
  const r14 = signedContract(14);
  const week = { id: "week-r14", revision: 9, contractRevision: 14, weekStart: "2026-08-24", weekEnd: "2026-08-30", status: "COMMITTED" };
  const unchanged = { ...r14, id: "contract-r15", revision: 15, status: "DRAFT", signature: null };
  const unchangedIdentity = Integrity.resolveEffectiveProgramIdentity({ today: "2026-08-30", signedContract: r14, draftContract: unchanged, activeWeek: week });
  assert.equal(unchangedIdentity.signedContractRevision, 14);
  assert.equal(unchangedIdentity.draftUnchanged, true);
  assert.equal(unchangedIdentity.draftAuthoritative, false);
  const material = { ...unchanged, trainingDaysPerWeek: 6 };
  assert.equal(Integrity.resolveEffectiveProgramIdentity({ today: "2026-08-30", signedContract: r14, draftContract: material, activeWeek: week }).draftHasMaterialChanges, true);
  assert.equal(Integrity.resolveEffectiveProgramIdentity({ today: "2026-08-30", signedContract: r14, draftContract: null, activeWeek: week }).draftContractRevision, null);
  const r15 = signedContract(15);
  assert.equal(Integrity.resolveEffectiveProgramIdentity({ today: "2026-08-30", signedContract: r15, activeWeek: week }).signedContractRevision, 15);
});

test("effective signed identity overrides a stale continuity manifest", () => {
  const r14 = signedContract(14);
  const stale = Continuity.buildManifest({
    contract: { payload: { ...r14, id: "contract-r15", revision: 15, signature: null }, options: { stateType: "DRAFT" } },
    calendar: { payload: { id: "week-r14", contractRevision: 14, weekStart: "2026-08-24", weekEnd: "2026-08-30", status: "COMMITTED" } }
  });
  const identity = Integrity.resolveEffectiveProgramIdentity({
    today: "2026-08-30",
    signedContract: r14,
    draftContract: { ...r14, id: "contract-r15", revision: 15, signature: null },
    activeWeek: { id: "week-r14", contractRevision: 14, weekStart: "2026-08-24", weekEnd: "2026-08-30", status: "COMMITTED" }
  });
  const lineage = Continuity.canonicalLineage(stale, { today: "2026-08-30", effectiveIdentity: identity });
  assert.equal(lineage.contractRevision, 14);
  assert.equal(lineage.draftUnchanged, true);
  assert.equal(/R15/.test(lineage.headline), false);
});

test("Fuel save requires an exact server receipt and stays idempotent across sessions", () => {
  const rows = new Map();
  const userId = "user-1";
  const payload = { date: "2026-08-30", calories: 2200, protein: 190, carbs: 220, fat: 62 };
  const save = (candidate) => {
    const identity = Fuel.writeIdentity({ userId, stateType: "MANUAL_DAY", stateKey: payload.date, payload: candidate });
    if (!rows.has(identity.key)) rows.set(identity.key, { user_id: userId, state_type: "MANUAL_DAY", state_key: payload.date, payload: candidate });
    return Fuel.confirmWrite({ userId, stateType: "MANUAL_DAY", stateKey: payload.date, payload: candidate, row: rows.get(identity.key) });
  };
  assert.equal(save(payload).confirmed, true);
  assert.equal(save(payload).confirmed, true);
  assert.equal(rows.size, 1);
  const restored = [...rows.values()][0];
  assert.equal(Fuel.confirmWrite({ userId, stateType: "MANUAL_DAY", stateKey: payload.date, payload, row: restored }).confirmed, true);
  assert.equal(Fuel.confirmWrite({ userId, stateType: "MANUAL_DAY", stateKey: payload.date, payload, row: { ...restored, payload: { ...payload, protein: 0 } } }).confirmed, false);
  assert.equal(Fuel.confirmWrite({ userId, stateType: "MANUAL_DAY", stateKey: payload.date, payload, row: null }).reason, "SAVE_NOT_ACKNOWLEDGED");
});

test("next-week lifecycle and status channels remain separate", () => {
  const days = Array.from({ length: 7 }, (_, index) => ({ date: `2026-09-0${index + 1}` }));
  assert.equal(Lifecycle.deriveNextWeek({}).state, "NOT_GENERATED");
  assert.equal(Lifecycle.deriveNextWeek({ draftWeek: { days: [] } }).state, "DRAFT");
  assert.equal(Lifecycle.deriveNextWeek({ draftWeek: { days } }).state, "READY_TO_COMMIT");
  assert.equal(Lifecycle.deriveNextWeek({ committedWeek: { weekStart: "2026-09-01", weekEnd: "2026-09-07", status: "COMMITTED" }, today: "2026-08-30" }).state, "COMMITTED");
  assert.equal(Lifecycle.deriveNextWeek({ committedWeek: { weekStart: "2026-09-01", weekEnd: "2026-09-07", status: "COMMITTED" }, today: "2026-09-03" }).state, "ACTIVE");
  assert.equal(Lifecycle.deriveNextWeek({ committedWeek: { status: "FINALIZED" }, finalized: true }).state, "FINALIZED");
  const channels = Stabilization.statusChannels({ account: { pending: 1 }, program: { state: "ACTIVE" }, evidence: { state: "CURRENT" }, connection: { status: "CONNECTED", evidenceCount: 4, lastSuccessfulAt: "2026-08-30T12:00:00.000Z" } });
  assert.deepEqual(Object.keys(channels), ["account", "program", "evidence", "connection"]);
  assert.equal(channels.account.state, "SYNC PENDING");
  assert.equal(channels.evidence.state, "CURRENT");
});
