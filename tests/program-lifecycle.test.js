const test = require("node:test");
const assert = require("node:assert/strict");

const Lifecycle = require("../assets/js/program-lifecycle.js");

const readyWeek = {
  status: "DRAFT",
  weekStart: "2026-08-17",
  weekEnd: "2026-08-23",
  days: Array.from({ length: 7 }, (_, index) => ({ date: `2026-08-${17 + index}` })),
  approvalBlocked: false
};

test("the program has exactly five user-facing lifecycle states", () => {
  assert.equal(Lifecycle.VERSION, "031A.1");
  assert.deepEqual(Object.values(Lifecycle.STATE), [
    "DRAFT",
    "READY_TO_COMMIT",
    "ACTIVE",
    "COMPLETED",
    "SUPERSEDED"
  ]);
});

test("lifecycle advances only when canonical evidence exists", () => {
  assert.equal(Lifecycle.derive({}).state, "DRAFT");
  assert.equal(Lifecycle.derive({ contractApproved: true, plansApproved: true, draftWeek: readyWeek }).state, "READY_TO_COMMIT");
  assert.equal(Lifecycle.derive({ contractApproved: true, committedWeek: { weekEnd: "2026-08-23" }, today: "2026-08-17" }).state, "ACTIVE");
  assert.equal(Lifecycle.derive({ contractApproved: true, committedWeek: { weekEnd: "2026-08-16" }, today: "2026-08-17" }).state, "COMPLETED");
  assert.equal(Lifecycle.derive({ receiptStatus: "REPLACED" }).state, "SUPERSEDED");
});

test("an amendment draft never demotes the active program", () => {
  const snapshot = Lifecycle.derive({
    contractApproved: true,
    committedWeek: { weekEnd: "2026-08-23" },
    today: "2026-08-17",
    amendmentDraft: true
  });
  assert.equal(snapshot.state, "ACTIVE");
  assert.equal(snapshot.attention, "AMENDMENT DRAFT");
});

test("blockers remain attention notices and cannot masquerade as readiness", () => {
  const conflict = Lifecycle.derive({
    contractApproved: true,
    plansApproved: true,
    draftWeek: readyWeek,
    conflict: true,
    blocked: true
  });
  assert.equal(conflict.state, "DRAFT");
  assert.equal(conflict.attention, "CHOICE REQUIRED");
});

test("every surface receives the same state and the same next action", () => {
  const snapshot = Lifecycle.derive({ contractApproved: true, plansApproved: true, draftWeek: readyWeek });
  const views = ["contract", "calendar", "today", "inspection", "trends"].map((surface) => Lifecycle.view(snapshot, surface));
  assert.equal(Lifecycle.consistent(views), true);
  views.forEach((view) => {
    assert.equal(view.state, "READY_TO_COMMIT");
    assert.deepEqual(view.action, { label: "Commit coordinated week", section: "calendar" });
  });
});
