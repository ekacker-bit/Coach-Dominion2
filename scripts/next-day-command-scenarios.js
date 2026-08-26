const Handoff = require("../assets/js/next-day-command-handoff.js");

function base() {
  const decision = { id: "decision-1", date: "2026-08-25", effectiveDate: "2026-08-26", status: "ACTIVE", verdict: "MAINTAIN", headline: "Hold steady", reason: "The evidence supports the current dose.", contractRevision: 14, weekRevision: 3 };
  const sourceReceipt = { id: "daily-loop-1", type: "DAILY_LOOP_CERTIFICATION", status: "CERTIFIED", date: "2026-08-25", decision: { id: decision.id, effectiveDate: decision.effectiveDate }, counts: { COMPLETE: 1, PARTIAL: 0, MISSED: 0 } };
  const assignments = [{ assignmentId: "run-1", module: "running", state: "scheduled" }, { assignmentId: "fuel-1", module: "nutrition", state: "scheduled" }];
  return { targetDate: "2026-08-26", decision, sourceReceipt, sourceWeekId: "week-34", contractRevision: 14, weekId: "week-34", weekRevision: 3, canonical: { id: "today-1", date: "2026-08-26", week: { id: "week-34", revision: 3 } }, assignments, surfaceAssignments: { calendar: assignments, today: assignments, train: [assignments[0]], quickLog: assignments, fuel: [assignments[1]] } };
}

const scenarios = {
  PRIOR_DAY_MUST_BE_CERTIFIED: () => Handoff.evaluate({ ...base(), sourceReceipt: null }).state === "WAITING",
  PROPOSED_CHANGE_NEEDS_ONE_CHOICE: () => { const input = base(); input.decision = { ...input.decision, status: "PROPOSED", verdict: "REDUCE" }; input.sourceReceipt = { ...input.sourceReceipt, decision: { id: input.decision.id, effectiveDate: input.decision.effectiveDate } }; return Handoff.evaluate(input).state === "REVIEW_REQUIRED"; },
  SURFACE_DIVERGENCE_STOPS_THE_LINE: () => { const input = base(); input.surfaceAssignments = { ...input.surfaceAssignments, today: [] }; return Handoff.evaluate(input).state === "ACTION_REQUIRED"; },
  CURRENT_CONTRACT_OUTRANKS_STALE_CALL: () => Handoff.evaluate({ ...base(), contractRevision: 15 }).command?.headline === "Current Contract governs",
  NEW_WEEK_STAYS_INTACT: () => Handoff.evaluate({ ...base(), weekId: "week-35" }).command?.headline === "Committed week governs",
  ACCOUNT_RECEIPT_CERTIFIES_COMMAND: () => { const first = Handoff.evaluate(base()); return Handoff.evaluate({ ...base(), accountReceipts: [first.receipt], serverConfirmed: true }).state === "CERTIFIED"; },
  SECOND_DEVICE_RESTORES_SAME_COMMAND: () => { const first = Handoff.evaluate(base()); const second = Handoff.evaluate({ ...base(), accountReceipts: [first.receipt], serverConfirmed: true }); return first.receipt.id === second.receipt.id; }
};

module.exports = { base, scenarios };
