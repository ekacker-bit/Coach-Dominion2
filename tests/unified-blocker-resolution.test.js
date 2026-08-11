const test = require("node:test");
const assert = require("node:assert/strict");
const resolver = require("../assets/js/unified-blocker-resolution.js");

function conflict(domain, revision = 12, suffix = "current") {
  return {
    domain,
    choiceKey: `${domain}:PLAN:${suffix}`,
    reason: "Same immutable revision has different contents.",
    device: { id: `${domain}-device`, revision },
    account: { id: `${domain}-account`, revision }
  };
}

function baseCommand() {
  const stages = ["contract", "plans", "week", "today", "evidence", "review"].map((id, index) => ({
    id,
    complete: index < 3,
    current: index === 3,
    locked: index > 3
  }));
  return {
    version: "025O.1",
    state: "WEEK_REQUIRED",
    stateLabel: "WEEK REQUIRED",
    mode: "FIX",
    title: "Commit the coordinated week",
    detail: "The week is ready.",
    primary: { action: "COMMIT_WEEK", label: "FIX - COMMIT THE WEEK", section: "contract" },
    stages,
    progress: { complete: 3, total: 6, percent: 50, current: "Week" },
    context: { source: "Contract 12", evidence: "4 plans active" },
    facts: {},
    adjustment: { available: false, choices: [] },
    orderFingerprint: "base-order"
  };
}

test("a same-revision Contract difference becomes the highest-priority blocker", () => {
  const blocker = resolver.buildBlocker({ conflicts: [conflict("contract")], pendingWrites: 2 });
  assert.equal(blocker.version, "025P.1");
  assert.equal(blocker.priority, 100);
  assert.equal(blocker.code, "CONTINUITY_CHOICE");
  assert.equal(blocker.title, "Choose the saved Contract");
  assert.equal(blocker.primary.action, "RESOLVE_CONTINUITY");
  assert.equal(blocker.duration.label, "About 1 min");
  assert.equal(blocker.confidence.score, 100);
});

test("conflict order is stable and Contract outranks Calendar", () => {
  const blocker = resolver.buildBlocker({ conflicts: [conflict("calendar", 11), conflict("contract", 12)] });
  assert.equal(blocker.domain, "contract");
  assert.equal(blocker.conflictCount, 2);
  assert.equal(blocker.stage, "contract");
});

test("the blocker replaces a lower-priority Today order without losing its evidence context", () => {
  const blocker = resolver.buildBlocker({ conflicts: [conflict("contract")] });
  const command = resolver.applyToDailyCommand(baseCommand(), blocker);
  assert.equal(command.title, blocker.title);
  assert.equal(command.primary.action, "RESOLVE_CONTINUITY");
  assert.equal(command.context.source, "Account continuity");
  assert.equal(command.context.evidence, "1 same-revision difference");
  assert.equal(command.stages.find((item) => item.id === "contract").current, true);
  assert.equal(command.stages.find((item) => item.id === "week").locked, true);
  assert.equal(command.adjustment.available, false);
  assert.equal(command.closeoutReady, false);
});

test("Program receives the exact same blocker title, detail, and action", () => {
  const blocker = resolver.buildBlocker({ conflicts: [conflict("core", 7)] });
  const program = resolver.programView(blocker);
  assert.equal(program.title, blocker.title);
  assert.equal(program.detail, blocker.detail);
  assert.deepEqual(program.primary, blocker.primary);
  assert.equal(program.tone, "red");
});

test("protected pending saves alone do not block today's training", () => {
  assert.equal(resolver.buildBlocker({ conflicts: [], pendingWrites: 3 }), null);
});

test("remaining conflicts keep the choice dialog open", () => {
  const outcome = resolver.resolutionOutcome({ remainingConflicts: 2, pendingWrites: 1, synced: false });
  assert.equal(outcome.advance, false);
  assert.equal(outcome.keepDialogOpen, true);
  assert.equal(outcome.status, "CHOICE_REQUIRED");
});

test("a completed choice advances even when an account save remains protected locally", () => {
  const outcome = resolver.resolutionOutcome({
    remainingConflicts: 0,
    pendingWrites: 1,
    synced: false,
    nextTitle: "Commit the coordinated week"
  });
  assert.equal(outcome.advance, true);
  assert.equal(outcome.route, "today");
  assert.equal(outcome.status, "ADVANCED_LOCAL");
  assert.match(outcome.message, /protected save will retry/i);
  assert.match(outcome.message, /Commit the coordinated week is now next/i);
});

test("blocker fingerprints are deterministic", () => {
  const first = resolver.buildBlocker({ conflicts: [conflict("contract"), conflict("calendar", 11)] });
  const second = resolver.buildBlocker({ conflicts: [conflict("calendar", 11), conflict("contract")] });
  assert.equal(first.id, second.id);
});
