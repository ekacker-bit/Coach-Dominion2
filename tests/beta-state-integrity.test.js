const test = require("node:test");
const assert = require("node:assert/strict");

const Integrity = require("../assets/js/beta-state-integrity.js");

function signedContract(revision, overrides = {}) {
  const id = overrides.id || `contract-r${revision}`;
  return {
    id,
    revision,
    status: "APPROVED",
    updatedAt: `2026-08-${String(revision).padStart(2, "0")}T12:00:00.000Z`,
    signature: {
      signerName: "Eric Recruit",
      accepted: true,
      contractId: id,
      contractRevision: revision,
      oathVersion: Integrity.OATH_VERSION,
      signedAt: `2026-08-${String(revision).padStart(2, "0")}T12:00:00.000Z`
    },
    ...overrides
  };
}

test("unsigned R15 remains a draft while signed R14 stays authoritative", () => {
  const r14 = signedContract(14);
  const r15 = { id: "contract-r15", revision: 15, status: "READY_FOR_APPROVAL", effectiveDate: "2026-08-24" };
  const lifecycle = Integrity.resolveContractLifecycle({ approved: r15, draft: r15, history: [r14] });
  assert.equal(lifecycle.activeSignedContract, r14);
  assert.equal(lifecycle.activeSignedContractRevision, 14);
  assert.equal(lifecycle.draftContract, r15);
  assert.equal(lifecycle.draftContractRevision, 15);
  assert.equal(lifecycle.draftContractStatus, "UNSIGNED_DRAFT");
  assert.equal(lifecycle.draftEffectiveDate, "2026-08-24");
  assert.equal(lifecycle.draftAuthoritative, false);
});

test("discarding the draft read model restores the same signed authority", () => {
  const r14 = signedContract(14);
  const withDraft = Integrity.resolveContractLifecycle({ approved: r14, draft: { id: "r15", revision: 15, status: "DRAFT" }, history: [r14] });
  const discarded = Integrity.resolveContractLifecycle({ approved: r14, draft: null, history: [r14] });
  assert.equal(withDraft.activeSignedContractRevision, 14);
  assert.equal(discarded.activeSignedContractRevision, 14);
  assert.equal(discarded.draftContract, null);
});

test("signing R15 advances authority without rewriting the protected R12 week", () => {
  const r14 = signedContract(14);
  const r15 = signedContract(15, { supersedesId: r14.id });
  const lifecycle = Integrity.resolveContractLifecycle({ approved: r15, history: [r15, r14] });
  const status = Integrity.resolvePlanRevisionStatus({
    activeSignedContract: r15,
    activeWeek: { id: "week-r12", contractRevision: 12 },
    activePlans: {}
  });
  assert.equal(lifecycle.activeSignedContractRevision, 15);
  assert.equal(lifecycle.supersededContractRevision, 14);
  assert.equal(status.activeWeek.contractRevision, 12);
  assert.equal(status.currentExecutionBlocked, false);
});

test("an older Lower A execution wins every route until it is closed", () => {
  const lower = { id: "workout-lower-a", assignmentId: "assignment-lower-a", state: "IN_PROGRESS", date: "2026-08-17", sessionName: "Lower A", startedAt: "2026-08-17T14:00:00.000Z" };
  const upper = { id: "assignment-upper-a", assignmentId: "assignment-upper-a", date: "2026-08-20", sessionName: "Upper A" };
  const active = Integrity.resolveActiveStrengthSession({ today: "2026-08-20", executions: [lower], assignments: [upper] });
  assert.equal(active.activeAssignmentId, "assignment-lower-a");
  assert.equal(active.requiresResolution, true);
  assert.equal(active.canStartScheduled, false);
  assert.equal(active.primaryAction.label, "Resume Lower A");
  assert.equal(active.secondaryAction.label, "End incomplete session");
  assert.match(active.dailyRecordTarget, /assignment-lower-a/);
  const stopped = Integrity.endIncompleteSession(lower, { endedAt: "2026-08-20T15:00:00.000Z" });
  const next = Integrity.resolveActiveStrengthSession({ today: "2026-08-20", executions: [stopped], assignments: [upper] });
  assert.equal(next.activeExecution, null);
  assert.equal(next.canStartScheduled, true);
  assert.equal(next.primaryAction.label, "Start Upper A");
});

test("plan status and evidence are revision and assignment specific", () => {
  const r14 = signedContract(14);
  const r15 = { id: "contract-r15", revision: 15, status: "DRAFT" };
  const plans = Object.fromEntries(["strength", "running", "core", "nutrition"].map((domain) => [domain, { id: `${domain}-r14`, status: "APPROVED", contractRevision: 14 }]));
  const status = Integrity.resolvePlanRevisionStatus({ activeSignedContract: r14, draftContract: r15, activePlans: plans, draftPlans: plans, activeWeek: { contractRevision: 12 } });
  assert.equal(status.activeWeek.plans.core.ready, true);
  assert.equal(status.draft.plans.core.ready, false);
  assert.equal(status.draft.requiredCount, 4);
  const assigned = Integrity.linkEvidenceToAssignment({ assignment: { id: "run-1", date: "2026-08-20" }, operationalDate: "2026-08-20", occurredAt: "2026-08-20T13:00:00.000Z" });
  const unplanned = Integrity.linkEvidenceToAssignment({ operationalDate: "2026-08-20" });
  assert.equal(assigned.satisfiesAssignment, true);
  assert.equal(assigned.unplanned, false);
  assert.equal(unplanned.satisfiesAssignment, false);
  assert.equal(unplanned.unplanned, true);
});

test("Core paired with Strength counts as one training window", () => {
  const result = Integrity.countTrainingWindows([
    { module: "STRENGTH", trainingWindowId: "am" },
    { module: "CORE", trainingWindowId: "am" }
  ]);
  assert.equal(result.count, 1);
  assert.equal(result.corePaired, true);
  assert.equal(result.label, "1 training window · Core paired");
});
