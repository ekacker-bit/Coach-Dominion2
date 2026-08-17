const test = require("node:test");
const assert = require("node:assert/strict");

const Gate = require("../assets/js/beta-readiness-gate.js");

const date = "2026-08-17";

function healthy(overrides = {}) {
  return {
    online: true,
    trustReport: { status: "VERIFIED", checks: { program: "CURRENT", calendar: "CURRENT", today: "CURRENT", evidence: "SAVED" } },
    account: { mode: "VERIFIED", serverConfirmed: true, lastVerifiedAt: "2026-08-17T12:00:00.000Z", accountRevision: 8 },
    pendingWrites: 0,
    lifecycle: { state: "ACTIVE" },
    activeWeek: { id: "week-8", status: "COMMITTED", weekStart: "2026-08-17", weekEnd: "2026-08-23" },
    canonicalCommand: {
      id: "canonical-day-8",
      date,
      lifecycle: { program: "ACTIVE" },
      week: { committed: true },
      day: { committed: true }
    },
    adaptation: null,
    ...overrides
  };
}

test("029H stays quiet when the complete operating chain is server-confirmed", () => {
  const result = Gate.evaluate(healthy());
  assert.equal(Gate.VERSION, "029H.1");
  assert.equal(result.state, "READY");
  assert.equal(result.quiet, true);
  assert.equal(result.primaryAction, null);
  assert.deepEqual(result.checks, {
    account: "CURRENT",
    program: "CURRENT",
    calendar: "CURRENT",
    today: "CURRENT",
    evidence: "SAVED"
  });
});

test("029H does not call device-only truth current before an exact account receipt", () => {
  const result = Gate.evaluate(healthy({ account: { mode: "VERIFYING", serverConfirmed: false } }));
  assert.equal(result.state, "VERIFYING");
  assert.equal(result.serverConfirmed, false);
  assert.equal(result.checks.account, "VERIFYING");
  assert.match(result.detail, /exact revision/);
});

test("029H protects one canonical pending-save count without asking for manual repair", () => {
  const result = Gate.evaluate(healthy({
    pendingWrites: 4,
    account: { mode: "SAVE_QUEUED", serverConfirmed: false, accountRevision: 8 }
  }));
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.label, "SYNC · 4");
  assert.equal(result.primaryAction, null);
  assert.equal(result.checks.evidence, "SYNC PENDING");
});

test("029H treats a proposed adaptation as one decision, not a broken program", () => {
  const result = Gate.evaluate(healthy({ adaptation: { status: "PROPOSED", adaptationState: "ADAPTATION_PROPOSED" } }));
  assert.equal(result.state, "DECISION_REQUIRED");
  assert.equal(result.primaryAction.label, "Review Today");
  assert.equal(result.primaryAction.section, "today");
  assert.equal(result.checks.today, "CURRENT");
  assert.match(result.detail, /active mission remains unchanged/);
});

test("029H requires the active operating week but ignores a separate staged week", () => {
  const missing = Gate.evaluate(healthy({
    lifecycle: { state: "READY_TO_COMMIT" },
    activeWeek: null,
    canonicalCommand: { date, lifecycle: { program: "READY_TO_COMMIT" }, week: { committed: false }, day: { committed: false } }
  }));
  assert.equal(missing.state, "ACTION_REQUIRED");
  assert.equal(missing.primaryAction.section, "calendar");

  const withStaged = Gate.evaluate(healthy({ stagedWeek: { id: "week-9-draft", status: "DRAFT" } }));
  assert.equal(withStaged.state, "READY");
});

test("029H preserves the Trust Layer's single recruit action", () => {
  const result = Gate.evaluate(healthy({
    trustReport: {
      status: "ACTION_REQUIRED",
      headline: "Choose the program to keep",
      detail: "Two saved programs need one decision.",
      primaryAction: { code: "CHOOSE_SAVED_COPY", label: "Choose saved copy", section: "more" }
    }
  }));
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.deepEqual(result.primaryAction, { code: "CHOOSE_SAVED_COPY", label: "Choose saved copy", section: "more" });
});
