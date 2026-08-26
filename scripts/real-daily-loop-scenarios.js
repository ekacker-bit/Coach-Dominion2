"use strict";

function entry(id, module, state) {
  return {
    assignmentId: id,
    identityValid: true,
    module,
    state,
    complete: ["completed", "verified"].includes(state),
    evidenceIds: ["completed", "verified"].includes(state) ? [`evidence:${id}`] : []
  };
}

function fixture(overrides = {}) {
  const date = "2026-08-26";
  const entries = overrides.entries || [entry("assignment:strength", "strength", "completed"), entry("assignment:fuel", "nutrition", "verified")];
  const ids = entries.map((item) => item.assignmentId);
  return {
    date,
    contractRevision: 19,
    weekId: "week:2026-08-24:r7",
    todayId: `today:${date}:r7`,
    ledger: {
      date,
      entries,
      complete: entries.every((item) => item.complete),
      consistency: { consistent: true, issues: [] },
      fingerprint: `execution-ledger:${date}:fixture`
    },
    closeout: { id: `daily-closeout:${date}`, date, status: "SEALED", revision: 2, updatedAt: "2026-08-27T02:15:00.000Z" },
    decision: { id: `atlas-loop:${date}:fixture`, date, effectiveDate: "2026-08-27", status: "ACTIVE", verdict: "MAINTAIN", headline: "Hold steady" },
    surfaceAssignments: { calendar: ids, today: ids, train: ids, quickLog: ids },
    accountReceipts: [],
    serverConfirmed: false,
    ...overrides
  };
}

const scenarios = [
  {
    id: "OPEN_DAY_REMAINS_OPEN",
    build: () => fixture({ entries: [entry("assignment:strength", "strength", "in_progress")], closeout: null, decision: null, surfaceAssignments: { calendar: ["assignment:strength"], today: ["assignment:strength"], train: ["assignment:strength"], quickLog: ["assignment:strength"] } }),
    expect: { state: "OPEN", certified: false }
  },
  {
    id: "SEALED_DAY_WAITS_FOR_ATLAS",
    build: () => fixture({ decision: null }),
    expect: { state: "SETTLING", certified: false }
  },
  {
    id: "PARTIAL_AND_MISSED_ARE_HONESTLY_CLASSIFIED",
    build: () => fixture({ entries: [entry("assignment:run", "running", "draft_evidence"), entry("assignment:core", "core", "scheduled")], surfaceAssignments: { calendar: ["assignment:run", "assignment:core"], today: ["assignment:run", "assignment:core"], train: ["assignment:run", "assignment:core"], quickLog: ["assignment:run", "assignment:core"] } }),
    expect: { state: "PROTECTED", certified: false, partial: 1, missed: 1 }
  },
  {
    id: "SURFACE_DIVERGENCE_STOPS_THE_LINE",
    build: () => fixture({ surfaceAssignments: { calendar: ["assignment:strength", "assignment:fuel"], today: ["assignment:strength"], train: ["assignment:strength", "assignment:fuel"], quickLog: ["assignment:strength", "assignment:fuel"] } }),
    expect: { state: "ACTION_REQUIRED", certified: false }
  },
  {
    id: "DEVICE_RECEIPT_IS_PROTECTED",
    build: () => fixture(),
    expect: { state: "PROTECTED", certified: false }
  },
  {
    id: "ACCOUNT_RECEIPT_CERTIFIES_THE_DAY",
    build: (certification) => {
      const first = certification.evaluate(fixture());
      return fixture({ accountReceipts: [first.receipt], serverConfirmed: true, accountConfirmedAt: "2026-08-27T02:16:00.000Z" });
    },
    expect: { state: "CERTIFIED", certified: true }
  },
  {
    id: "MOBILE_RESTORE_KEEPS_THE_SAME_RECEIPT",
    build: (certification) => {
      const first = certification.evaluate(fixture());
      return fixture({ accountReceipts: [{ ...first.receipt, status: "CERTIFIED" }], serverConfirmed: true });
    },
    expect: { state: "CERTIFIED", certified: true }
  }
];

module.exports = { entry, fixture, scenarios };
