
const assert = require("node:assert/strict");
const activation = require("../assets/js/atlas-activation.js");

const contract = { id: "contract-1", revision: 4, status: "APPROVED", effectiveDate: "2026-08-10" };
const program = {
  status: "READY_FOR_APPROVAL",
  modules: ["strength", "running", "core", "nutrition"].map((id) => ({ id, included: true }))
};
const candidates = Object.fromEntries(["strength", "running", "core", "nutrition"].map((id) => [id, {
  id: `${id}-1`, status: "APPROVED", recruitContractId: contract.id, recruitContractRevision: contract.revision
}]));
const weekDraft = {
  id: "week-draft", status: "DRAFT", weekStart: "2026-08-10", weekEnd: "2026-08-16",
  contractId: contract.id, contractRevision: contract.revision, days: Array.from({ length: 7 }, () => ({})),
  conflicts: [], approvalBlocked: false,
  sourceRefs: {
    strengthPlanId: candidates.strength.id, strengthPlanRevision: candidates.strength.revision,
    runningBlockId: candidates.running.id, runningBlockRevision: candidates.running.revision,
    corePlanId: candidates.core.id, corePlanRevision: candidates.core.revision,
    nutritionBaselineId: candidates.nutrition.id
  }
};

{
  const result = activation.preflightActivation({ contract, program, candidates, weekDraft });
  assert.equal(result.status, "READY_TO_ACTIVATE");
  assert.equal(result.blockers.length, 0);
  assert.equal(result.checks.length, 5);
  assert.match(result.message, /passed preflight/i);
}

{
  assert.equal(activation.calendarLinkedToCandidates(weekDraft, candidates), true);
  const staleCore = {
    ...weekDraft,
    sourceRefs: { ...weekDraft.sourceRefs, corePlanId: "core-old" }
  };
  assert.equal(activation.calendarLinkedToCandidates(staleCore, candidates), false);
  const result = activation.preflightActivation({ contract, program, candidates, weekDraft: staleCore });
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blockers.some((item) => item.code === "CALENDAR_PLAN_MISMATCH"));
}

{
  const synced = activation.summarizeSyncResults([
    { domain: "strength", saved: true },
    { domain: "cardio", saved: true },
    { domain: "core", saved: true },
    { domain: "fuel", saved: true },
    { domain: "calendar", saved: true }
  ]);
  assert.equal(synced.status, "ACCOUNT_SAVED");
  assert.equal(synced.accountSaved, true);
  assert.deepEqual(synced.pendingDomains, []);

  const pending = activation.summarizeSyncResults([
    { domain: "strength", saved: true },
    { domain: "core", saved: false },
    { domain: "core", saved: false },
    { domain: "calendar", saved: true }
  ]);
  assert.equal(pending.status, "SYNC_PENDING");
  assert.equal(pending.accountSaved, false);
  assert.deepEqual(pending.pendingDomains, ["core"]);
  assert.equal(pending.savedCount, 2);
}

{
  const preflight = activation.preflightActivation({ contract, program, candidates, weekDraft });
  assert.equal(activation.canCommitCalendarFromPreflight(preflight, {
    contract,
    weekDraft
  }), true);
  assert.equal(activation.canCommitCalendarFromPreflight(preflight, {
    contract: { ...contract, revision: contract.revision + 1 },
    weekDraft
  }), false);
  assert.equal(activation.canCommitCalendarFromPreflight(preflight, {
    contract,
    weekDraft: { ...weekDraft, approvalBlocked: true }
  }), false);
}

{
  const blockedWeek = {
    ...weekDraft,
    approvalBlocked: true,
    conflicts: [{ code: "RECOVERY_MINIMUM_VIOLATED", severity: "BLOCKING", detail: "At least one recovery day is required." }]
  };
  const result = activation.preflightActivation({ contract, program, candidates, weekDraft: blockedWeek });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.blockers[0].title, "Protect one recovery day");
  assert.match(result.blockers[0].action, /move/i);
}

{
  const result = activation.preflightActivation({ contract, program, candidates: { ...candidates, core: null }, weekDraft });
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blockers.some((item) => item.code === "CORE_CANDIDATE_REQUIRED"));
}

{
  const preflight = activation.preflightActivation({ contract, program, candidates, weekDraft });
  const receipt = activation.buildReceipt({ contract, candidates, weekDraft, week: { ...weekDraft, id: "week-active" }, preflight, activatedAt: "2026-08-06T12:00:00.000Z" });
  assert.equal(receipt.status, "ACTIVE");
  assert.equal(receipt.contractRevision, 4);
  assert.match(receipt.headline, /Program Active.*Contract R4.*2026-08-10/);
  const audit = activation.auditReceipt(receipt, { contract, activePlans: candidates, week: { ...weekDraft, id: "week-active" } });
  assert.equal(audit.status, "ACTIVE");
  const damaged = activation.auditReceipt(receipt, { contract, activePlans: { ...candidates, core: { id: "wrong" } }, week: { ...weekDraft, id: "week-active" } });
  assert.equal(damaged.status, "REPAIR_REQUIRED");
  assert.ok(damaged.issues.some((item) => item.code === "CORE_MISMATCH"));

  const pendingReceipt = activation.buildReceipt({
    contract,
    candidates,
    weekDraft,
    week: { ...weekDraft, id: "week-active" },
    preflight,
    activatedAt: "2026-08-06T12:00:00.000Z",
    syncStatus: "SYNC_PENDING",
    pendingSyncDomains: ["core", "core", "calendar"]
  });
  assert.equal(pendingReceipt.syncStatus, "SYNC_PENDING");
  assert.deepEqual(pendingReceipt.pendingSyncDomains, ["core", "calendar"]);
}

console.log("Build 024I Atlas Activation tests passed.");