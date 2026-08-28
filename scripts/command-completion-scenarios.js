"use strict";

const Completion = require("../assets/js/command-completion-certification.js");

function fixture(overrides = {}) {
  const assignments = [
    { assignmentId: "lower-a-27", module: "strength", title: "Lower A", sessionOrder: 1, trainingWindowId: "am", sessionLabel: "AM" },
    { assignmentId: "run-27", module: "running", title: "Easy run", sessionOrder: 2, trainingWindowId: "pm", sessionLabel: "PM" },
    { assignmentId: "core-27", module: "core", title: "Core control", sessionOrder: 1, trainingWindowId: "pm", sessionLabel: "PM", tertiary: true }
  ];
  return {
    operationalDate: "2026-08-27",
    authority: { contractRevision: 14, weekId: "week-35", weekRevision: 4, calendarCommitId: "calendar-35" },
    assignments,
    source: {
      id: "mission:2026-08-27:strength:lower-a-execution",
      date: "2026-08-27",
      module: "STRENGTH",
      assignmentId: "lower-a-27",
      sourceRecordId: "lower-a-execution",
      state: "COMPLETE",
      completedAt: "2026-08-27T13:00:00Z",
      summary: { completedSets: 16, plannedSets: 16 }
    },
    history: [],
    accountReceipts: [],
    serverConfirmed: false,
    ...overrides
  };
}

const scenarios = {
  STRENGTH_COMPLETION_CERTIFIED: () => Completion.evaluate({ ...fixture(), accountReceipts: [Completion.evaluate(fixture()).receipt], serverConfirmed: true }).state === "CERTIFIED",
  RUNNING_ACTUALS_CERTIFIED: () => Completion.evaluate(fixture({ source: { ...fixture().source, id: "run", module: "RUNNING", assignmentId: "run-27", sourceRecordId: "run-execution" } })).receipt?.completion?.module === "running",
  CORE_COMPLETION_CERTIFIED: () => Completion.evaluate(fixture({ source: { ...fixture().source, id: "core", module: "CORE", assignmentId: "core-27", sourceRecordId: "core-execution" } })).receipt?.completion?.module === "core",
  RECOVERY_COMPLETION_CERTIFIED: () => Completion.evaluate(fixture({ assignments: [...fixture().assignments, { assignmentId: "recovery-27", module: "RECOVERY", title: "Recovery order", sessionOrder: 9 }], source: { ...fixture().source, id: "recovery", module: "RECOVERY", assignmentId: "recovery-27", sourceRecordId: "recovery-order" } })).receipt?.completion?.module === "recovery",
  FUEL_DAY_CERTIFIED: () => Completion.evaluate(fixture({ assignments: [{ assignmentId: "fuel-27", module: "NUTRITION", title: "Fuel target", sessionOrder: 4 }], source: { ...fixture().source, id: "fuel", module: "NUTRITION", assignmentId: "fuel-27", sourceRecordId: "fuel-day", state: "SEALED" } })).receipt?.completion?.module === "nutrition",
  TWO_A_DAY_ADVANCES_TO_PM: () => Completion.evaluate(fixture()).next?.label === "PM Run",
  CORE_REMAINS_TERTIARY: () => {
    const first = Completion.evaluate(fixture()).receipt;
    const second = Completion.evaluate(fixture({ source: { ...fixture().source, id: "run", module: "RUNNING", assignmentId: "run-27", sourceRecordId: "run-execution" }, history: [first] }));
    return second.next?.assignmentId === "core-27" && second.next?.tertiary === true;
  },
  FINAL_SESSION_OPENS_CLOSEOUT: () => {
    const first = Completion.evaluate(fixture()).receipt;
    const second = Completion.evaluate(fixture({ source: { ...fixture().source, id: "run", module: "RUNNING", assignmentId: "run-27", sourceRecordId: "run-execution" }, history: [first] })).receipt;
    return Completion.evaluate(fixture({ source: { ...fixture().source, id: "core", module: "CORE", assignmentId: "core-27", sourceRecordId: "core-execution" }, history: [second, first] })).next?.type === "CLOSEOUT";
  },
  PARTIAL_SESSION_PRESERVED: () => Completion.evaluate(fixture({ source: { ...fixture().source, state: "PARTIAL" } })).receipt?.sessionComplete === false,
  OFFLINE_COMPLETION_PROTECTED: () => Completion.evaluate(fixture()).state === "PROTECTED",
  DUPLICATE_SUBMISSION_IDEMPOTENT: () => Completion.evaluate(fixture()).receipt?.id === Completion.evaluate(fixture()).receipt?.id,
  STALE_ASSIGNMENT_REJECTED: () => Completion.evaluate(fixture({ assignments: [] })).issues?.some((item) => item.code === "STALE_ASSIGNMENT_REJECTED"),
  SECOND_DEVICE_RESTORES_RECEIPT: () => {
    const first = Completion.evaluate(fixture());
    return Completion.evaluate(fixture({ accountReceipts: [first.receipt], serverConfirmed: true })).receipt?.id === first.receipt.id;
  }
};

module.exports = { scenarios };
