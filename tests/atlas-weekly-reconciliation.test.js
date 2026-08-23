const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/atlas-weekly-reconciliation.js");

const weekStart = "2026-08-17";
const weekEnd = "2026-08-23";
const targetWeekStart = "2026-08-24";
const inspection = (overrides = {}) => ({
  weekStartDate: weekStart,
  weekEndDate: weekEnd,
  finalizedAt: "2026-08-24T00:05:00.000Z",
  calculationVersion: "009A.1",
  score: 84,
  evidenceCoverage: 88,
  elapsedDayCount: 7,
  counts: { assessedDays: 6, unscoredDays: 1 },
  strongestDomains: ["strength"],
  weakestDomains: ["recovery"],
  ...overrides
});
const activeWeek = (overrides = {}) => ({
  id: "week-current",
  status: "COMMITTED",
  revision: 3,
  weekStart,
  weekEnd,
  contractId: "contract-9",
  contractRevision: 9,
  programId: "program-9",
  programRevision: 9,
  ...overrides
});
const command = (overrides = {}) => ({
  id: "atlas-weekly-command:2026-08-24",
  status: "PROPOSED",
  code: "REBALANCE",
  targetWeekStart,
  targetWeekEnd: "2026-08-30",
  headline: "Rebalance the coordinated week",
  priority: "Protect Recovery before adding demand.",
  ...overrides
});
const proposedWeek = (overrides = {}) => ({
  id: "week-next-draft",
  status: "DRAFT",
  weekStart: targetWeekStart,
  weekEnd: "2026-08-30",
  contractRevision: 9,
  approvalBlocked: false,
  blockingConflictCount: 0,
  ...overrides
});
const proof = (id, date, code) => ({
  id,
  decisionId: `decision-${id}`,
  effectiveDate: date,
  status: "EVALUATED",
  code,
  fingerprint: `${id}-${code}`,
  evaluatedAt: `${date}T23:30:00.000Z`
});
const base = (overrides = {}) => ({
  inspection: inspection(),
  activeWeek: activeWeek(),
  contract: { id: "contract-9", revision: 9 },
  programReceipt: { id: "program-9", revision: 9 },
  command: command(),
  proposedWeek: proposedWeek(),
  proofs: [
    proof("one", "2026-08-18", "WORKED"),
    proof("two", "2026-08-20", "MIXED"),
    proof("three", "2026-08-22", "MISSED")
  ],
  decisions: [
    { id: "decision-one", effectiveDate: "2026-08-18" },
    { id: "decision-two", effectiveDate: "2026-08-20" },
    { id: "decision-three", effectiveDate: "2026-08-22" }
  ],
  closeouts: [
    { id: "closeout-1", date: "2026-08-18", status: "SEALED", revision: 1 },
    { id: "closeout-2", date: "2026-08-20", status: "SEALED", revision: 1 }
  ],
  standards: [],
  generatedAt: "2026-08-24T00:10:00.000Z",
  ...overrides
});

test("030K refuses to issue a final weekly verdict before finalization", () => {
  const result = engine.buildReconciliation(base({ inspection: inspection({ finalizedAt: null, canFinalize: false, score: 92, evidenceCoverage: 94 }) }));
  assert.equal(result.status, "COLLECTING");
  assert.equal(result.verdict.position, "PROVISIONAL");
  assert.equal(result.verdict.commitReady, false);
  assert.equal(result.verdict.action.code, "FINALIZE_FIRST");
});

test("030K reconciles finalized weekly evidence without treating an unscored day as failure", () => {
  const result = engine.buildReconciliation(base());
  assert.equal(result.status, "RECONCILED");
  assert.equal(result.verdict.position, "ON_TRACK");
  assert.match(result.verdict.broke, /unscored, not failed/i);
  assert.equal(result.packet.proofCounts.WORKED, 1);
  assert.equal(result.packet.proofCounts.MISSED, 1);
});

test("030K makes an open standards case a truthful weekly blocker", () => {
  const result = engine.buildReconciliation(base({ standards: [{ id: "case-1", date: "2026-08-21", status: "CONFIRMED" }] }));
  assert.equal(result.verdict.position, "BLOCKED");
  assert.equal(result.verdict.commitReady, false);
  assert.match(result.verdict.broke, /blocks the weekly decision/);
});

test("030K ties every result to exact Contract, program, week, and source versions", () => {
  const result = engine.buildReconciliation(base());
  assert.equal(result.packet.contractRevision, 9);
  assert.equal(result.packet.programRevision, 9);
  assert.equal(result.packet.activeWeekId, "week-current");
  assert.equal(result.packet.source.inspectionVersion, "009A.1");
  assert.equal(result.packet.lineage.consistent, true);
});

test("030K blocks a next-week draft from another Contract revision", () => {
  const result = engine.buildReconciliation(base({ proposedWeek: proposedWeek({ contractRevision: 8 }) }));
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.verdict.position, "BLOCKED");
  assert.deepEqual(result.packet.lineage.issues, ["CONTRACT_REVISION_MISMATCH"]);
});

test("030K exposes one commit action only when the finalized coordinated draft is safe", () => {
  const result = engine.buildReconciliation(base());
  assert.equal(result.verdict.commitReady, true);
  assert.deepEqual(result.verdict.action, { code: "COMMIT_NEXT_WEEK", label: "Commit next week", disabled: false });
  const committed = engine.attachCommit(result, proposedWeek({ status: "COMMITTED", id: "week-next", revision: 1 }), "2026-08-24T00:20:00.000Z");
  assert.equal(committed.status, "COMMITTED");
  assert.equal(committed.verdict.action.code, "COMMITTED");
  assert.equal(committed.commitReceipt.sourceWeekStart, weekStart);
  assert.equal(committed.commitReceipt.targetWeekStart, targetWeekStart);
});

test("030K keeps blocking calendar conflicts visible instead of bypassing them", () => {
  const result = engine.buildReconciliation(base({ proposedWeek: proposedWeek({ approvalBlocked: true, blockingConflictCount: 2 }) }));
  assert.equal(result.verdict.commitReady, false);
  assert.equal(result.verdict.action.code, "CALENDAR_REVIEW");
  assert.equal(result.verdict.proposedWeekBlockers, 2);
});

test("030K is idempotent across reload and preserves one record per week", () => {
  const first = engine.buildReconciliation(base());
  const second = engine.buildReconciliation(base({ prior: first }));
  assert.deepEqual(second, first);
  const history = engine.upsertHistory([first], { ...first, updatedAt: "2026-08-24T00:30:00.000Z" });
  assert.equal(history.length, 1);
  const summary = engine.summarize(history);
  assert.equal(summary.weeks, 1);
  assert.equal(summary.counts.ON_TRACK, 1);
});
