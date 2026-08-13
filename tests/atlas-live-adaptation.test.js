const test = require("node:test");
const assert = require("node:assert/strict");
const atlas = require("../assets/js/atlas-live-adaptation.js");

function context(overrides = {}) {
  return {
    date: "2026-08-13",
    readinessComplete: true,
    readinessState: "GREEN",
    energy: 8,
    soreness: 2,
    pain: false,
    protected: false,
    partialEvidence: false,
    executionOutcome: "READY",
    missionComplete: false,
    contractId: "contract-8",
    contractRevision: 8,
    weekId: "week-3",
    weekRevision: 3,
    generatedAt: "2026-08-13T12:00:00.000Z",
    ...overrides
  };
}

test("Build 026C stays quiet when reality still matches the approved day", () => {
  assert.equal(atlas.buildProposal(context()), null);
});
test("Build 026C proposes a bounded reduction for low energy", () => {
  const proposal = atlas.buildProposal(context({ energy: 3, readinessState: "YELLOW" }));
  assert.equal(proposal.version, "026C.1");
  assert.equal(proposal.code, "REDUCE_TODAY");
  assert.equal(proposal.status, "PROPOSED");
  assert.equal(proposal.choiceId, "REDUCE_TODAY");
  assert.equal(proposal.safetyOverride, false);
});

test("Build 026C makes pain a non-overridable recovery order", () => {
  const proposal = atlas.buildProposal(context({ pain: true, readinessState: "RED" }));
  assert.equal(proposal.code, "PROTECT_TODAY");
  assert.equal(proposal.safetyOverride, true);
  assert.throws(() => atlas.resolveProposal(proposal, "HOLD"), /cannot be overridden/i);
  const approved = atlas.resolveProposal(proposal, "ACCEPT", { resolvedAt: "2026-08-13T12:05:00.000Z" });
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.calendarOverride.window, "RECOVERY");
  assert.equal(approved.directive.changes.find((item) => item.domain === "FUELING").action, "HOLD_TARGETS");
});

test("Build 026C preserves partial evidence and stops additional loaded work", () => {
  const proposal = atlas.buildProposal(context({ partialEvidence: true, executionOutcome: "PARTIAL" }));
  assert.equal(proposal.code, "RECOVER_AFTER_DEVIATION");
  assert.match(proposal.impact, /evidence stays intact/i);
});

test("Build 026C records This does not fit without changing today", () => {
  const proposal = atlas.buildProposal(context({ energy: 2 }));
  const challenged = atlas.resolveProposal(proposal, "NOT_FIT", {
    reason: "MISSING_CONTEXT",
    note: "Energy is low because Roll Call was entered before breakfast.",
    resolvedAt: "2026-08-13T12:05:00.000Z"
  });
  assert.equal(challenged.status, "NEEDS_CONTEXT");
  assert.equal(challenged.directive, undefined);
  assert.equal(challenged.responseReason, "MISSING_CONTEXT");
});

test("Build 026C applies only an approved, matching day directive", () => {
  const proposal = atlas.buildProposal(context({ energy: 3 }));
  const approved = atlas.resolveProposal(proposal, "ACCEPT", { resolvedAt: "2026-08-13T12:05:00.000Z" });
  const matching = { date: "2026-08-13", contractRevision: 8, weekRevision: 3 };
  assert.ok(atlas.activeDirective(approved, matching));
  assert.ok(atlas.activeCalendarOverride(approved, matching));
  assert.equal(atlas.activeDirective(approved, { ...matching, weekRevision: 4 }), null);
});

test("Build 026C promotes one proposal above execution and keeps approval reversible", () => {
  const proposal = atlas.buildProposal(context({ energy: 3 }));
  const command = atlas.applyToCommand({ state: "EXECUTION_REQUIRED", title: "Lower A", primary: { action: "MISSION_SPINE" }, adjustment: { available: true } }, proposal, { date: "2026-08-13", contractRevision: 8, weekRevision: 3 });
  assert.equal(command.state, "ADAPTATION_REQUIRED");
  assert.equal(command.primary.action, "LIVE_ADAPTATION");
  assert.equal(command.adjustment.available, false);
  const approved = atlas.resolveProposal(proposal, "ACCEPT", { resolvedAt: "2026-08-13T12:05:00.000Z" });
  const applied = atlas.applyToCommand({ state: "EXECUTION_REQUIRED", title: "Lower A", duration: { minutes: 60 }, primary: { action: "MISSION_SPINE" } }, approved, { date: "2026-08-13", contractRevision: 8, weekRevision: 3 });
  assert.equal(applied.duration.label, "45 min");
  const restored = atlas.resolveProposal(approved, "RESTORE", { resolvedAt: "2026-08-13T12:10:00.000Z" });
  assert.equal(restored.status, "RESTORED");
  assert.equal(atlas.activeDirective(restored, { date: "2026-08-13" }), null);
});
