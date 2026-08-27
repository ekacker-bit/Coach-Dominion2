"use strict";

const Activation = require("../assets/js/morning-command-activation.js");

function base() {
  const assignments = [
    { assignmentId: "lower-a-26", module: "strength", title: "Lower A", order: 1 },
    { assignmentId: "fuel-26", module: "nutrition", title: "Training-day Fuel", order: 2 }
  ];
  const handoff = {
    id: "next-day-command:2026-08-26:source",
    type: "NEXT_DAY_COMMAND_HANDOFF",
    version: "030T.1",
    status: "CERTIFIED",
    targetDate: "2026-08-26",
    fingerprint: "source",
    accountConfirmedAt: "2026-08-25T23:55:00Z",
    decision: { id: "decision-25", status: "ACTIVE", verdict: "MAINTAIN" },
    authority: { contractRevision: 14, weekId: "week-34", weekRevision: 3, canonicalId: "canonical-26", canonicalDate: "2026-08-26" },
    assignments: assignments.map((item) => ({ assignmentId: item.assignmentId, module: item.module }))
  };
  return {
    targetDate: "2026-08-26",
    handoff,
    contractRevision: 14,
    weekId: "week-34",
    weekRevision: 3,
    canonical: { id: "canonical-26", date: "2026-08-26", week: { id: "week-34", revision: 3 }, schedule: { recoveryDay: false, sessions: [assignments[0]] } },
    assignments,
    previousExecutions: [],
    resolutions: [],
    accountReceipts: []
  };
}

function priorRun() {
  return { id: "run-25-execution", assignmentId: "run-25", module: "running", title: "Tempo", date: "2026-08-25", state: "PAUSED" };
}

const scenarios = {
  CERTIFIED_HANDOFF_REQUIRED: () => Activation.evaluate({ ...base(), handoff: null }).state === "WAITING",
  MIDNIGHT_UNFINISHED_WORK_NEEDS_ONE_CHOICE: () => Activation.evaluate({ ...base(), previousExecutions: [priorRun()] }).state === "DECISION_REQUIRED",
  RESUME_PRESERVES_TODAY: () => {
    const resolution = Activation.resolutionReceipt(priorRun(), "RESUME", "2026-08-26");
    return Activation.evaluate({ ...base(), previousExecutions: [priorRun()], resolutions: [resolution] }).target?.assignmentId === "run-25";
  },
  RESCHEDULE_RELEASES_TODAY: () => {
    const resolution = Activation.resolutionReceipt(priorRun(), "RESCHEDULE", "2026-08-26");
    return Activation.evaluate({ ...base(), previousExecutions: [priorRun()], resolutions: [resolution] }).target?.assignmentId === "lower-a-26";
  },
  CLOSE_INCOMPLETE_RELEASES_TODAY: () => {
    const resolution = Activation.resolutionReceipt(priorRun(), "CLOSE_INCOMPLETE", "2026-08-26");
    return Activation.evaluate({ ...base(), previousExecutions: [priorRun()], resolutions: [resolution] }).target?.assignmentId === "lower-a-26";
  },
  AUTHORITY_DRIFT_STOPS_THE_LINE: () => Activation.evaluate({ ...base(), contractRevision: 15 }).state === "ACTION_REQUIRED",
  ASSIGNMENT_DRIFT_STOPS_THE_LINE: () => Activation.evaluate({ ...base(), assignments: [] }).state === "ACTION_REQUIRED",
  ACCOUNT_RECEIPT_CERTIFIES_ACTIVATION: () => {
    const first = Activation.evaluate(base());
    return Activation.evaluate({ ...base(), accountReceipts: [first.receipt], serverConfirmed: true }).state === "CERTIFIED";
  },
  SECOND_DEVICE_RESTORES_SAME_COMMAND: () => {
    const first = Activation.evaluate(base());
    const second = Activation.evaluate({ ...base(), accountReceipts: [first.receipt], serverConfirmed: true });
    return first.receipt.id === second.receipt.id && second.target.assignmentId === "lower-a-26";
  },
  DIRECT_ROUTE_OPENS_ACTUAL_LOGGER: () => Activation.evaluate(base()).target?.route?.anchor === "daily-assignment-heading"
};

module.exports = { base, priorRun, scenarios };
