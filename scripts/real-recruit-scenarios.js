"use strict";

const DATE = "2026-08-18";

function account(overrides = {}) {
  return { status: "CURRENT", serverConfirmed: true, lastVerifiedAt: "2026-08-18T08:00:00.000Z", ...overrides };
}

function lineageSnapshot(options = {}) {
  const contractRevision = Number(options.contractRevision || 12);
  const operatingRevision = Number(options.operatingRevision || contractRevision);
  const contractId = options.contractId || "contract-1";
  const programId = options.programId || `program-r${operatingRevision}`;
  const weekId = options.weekId || `week-r${operatingRevision}`;
  const todayId = options.todayId || `today-r${operatingRevision}`;
  const operatingRef = `contract:${contractId}:r${operatingRevision}`;
  const contractRef = `contract:${contractId}:r${contractRevision}`;
  const evidence = options.evidence || { count: 0, ids: [], contractRevision: operatingRevision, programId, weekId, todayId };
  return {
    date: options.date || DATE,
    account: account(options.account),
    conflicts: options.conflicts || [],
    pendingWrites: Number(options.pendingWrites || 0),
    contract: { exists: true, signed: true, id: contractId, revision: contractRevision, hash: contractRef },
    program: { id: programId, state: "ACTIVE", contractRevision: operatingRevision, contractRef: operatingRef },
    week: {
      id: weekId,
      status: "COMMITTED",
      weekStart: options.weekStart || "2026-08-17",
      weekEnd: options.weekEnd || "2026-08-23",
      programId,
      contractRevision: operatingRevision
    },
    today: { id: todayId, date: options.date || DATE, committed: true, weekCommitted: true, weekId, programId, contractRevision: operatingRevision },
    evidence,
    closeout: options.closeout === undefined ? null : options.closeout,
    transition: options.transition || null,
    stagedWeek: options.stagedWeek || null,
    adaptation: options.adaptation || null
  };
}

function setupSnapshot(phase = "ACCOUNT") {
  const snapshot = lineageSnapshot();
  if (phase === "ACCOUNT") return { ...snapshot, contract: {}, program: {}, week: null, today: null, evidence: {}, closeout: null };
  if (phase === "CONTRACT") return { ...snapshot, program: {}, week: null, today: null, evidence: {}, closeout: null };
  if (phase === "PROGRAM") return { ...snapshot, week: null, today: null, evidence: {}, closeout: null };
  return snapshot;
}

function withEvidence(snapshot, ids = []) {
  return {
    ...snapshot,
    evidence: {
      count: ids.length,
      ids,
      contractRevision: snapshot.today?.contractRevision,
      programId: snapshot.today?.programId,
      weekId: snapshot.today?.weekId,
      todayId: snapshot.today?.id
    }
  };
}

function scenarios() {
  const healthy = lineageSnapshot();
  const logged = withEvidence(healthy, ["strength-set-1", "run-1", "fuel-day-1"]);
  const sealed = {
    ...logged,
    closeout: { status: "SEALED", closed: true, todayId: logged.today.id, weekId: logged.week.id, contractRevision: 12 }
  };
  const prior = lineageSnapshot({ contractRevision: 11, operatingRevision: 11 });
  const amended = lineageSnapshot({
    contractRevision: 12,
    operatingRevision: 11,
    transition: { protectedCurrentWeek: true, operatingContractRevision: 11, operatingContractRef: "contract:contract-1:r11" },
    stagedWeek: { id: "week-r12-next", status: "DRAFT", weekStart: "2026-08-24", weekEnd: "2026-08-30", contractRevision: 12, programId: "program-r12" }
  });
  const nextWeek = lineageSnapshot({
    contractRevision: 12,
    operatingRevision: 12,
    date: "2026-08-24",
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    weekId: "week-r12-next",
    todayId: "today-r12-next"
  });
  const badStaged = {
    ...amended,
    stagedWeek: { ...amended.stagedWeek, contractRevision: 11, programId: "program-r11" }
  };
  const protectedOffline = withEvidence(lineageSnapshot({ account: { status: "SAVE_QUEUED", serverConfirmed: false, lastVerifiedAt: null }, pendingWrites: 1 }), ["strength-set-1"]);
  const restored = withEvidence(healthy, ["strength-set-1"]);
  const adapted = withEvidence(lineageSnapshot({ todayId: "today-adapted", adaptation: { status: "APPROVED" } }), ["pre-adaptation-proof"]);
  return [
    {
      id: "NEW_RECRUIT_TO_CLOSEOUT",
      label: "New recruit reaches a sealed first day",
      steps: [
        { id: "account-created", input: setupSnapshot("ACCOUNT"), expect: { state: "ACTION_REQUIRED", firstProblemCode: "CONTRACT_REQUIRED", primaryActionCode: "OPEN_CONTRACT", receipt: false } },
        { id: "contract-signed", input: setupSnapshot("CONTRACT"), expect: { state: "ACTION_REQUIRED", firstProblemCode: "PROGRAM_REQUIRED", primaryActionCode: "OPEN_COMMISSIONING", receipt: false } },
        { id: "program-active", input: setupSnapshot("PROGRAM"), expect: { state: "ACTION_REQUIRED", firstProblemCode: "ACTIVE_WEEK_REQUIRED", primaryActionCode: "OPEN_CALENDAR", receipt: false } },
        { id: "week-committed", input: healthy, expect: { state: "CERTIFIED", certified: true, receipt: true } },
        { id: "day-sealed", input: sealed, expect: { state: "CERTIFIED", certified: true, receipt: true, preserveEvidenceFrom: "week-committed", stageStates: { evidence: "CURRENT", closeout: "CURRENT" } } }
      ]
    },
    {
      id: "RETURNING_RECRUIT_RESTORE",
      label: "Returning recruit reloads the same canonical program",
      steps: [
        { id: "first-session", input: restored, expect: { state: "CERTIFIED", certified: true, receipt: true } },
        { id: "second-session", input: JSON.parse(JSON.stringify(restored)), certifiedAt: "2026-08-18T18:00:00.000Z", expect: { state: "CERTIFIED", certified: true, receipt: true, sameReceiptAs: "first-session", preserveEvidenceFrom: "first-session" } }
      ]
    },
    {
      id: "CONTRACT_AMENDMENT_HANDOFF",
      label: "Contract amendment protects this week and governs the next",
      steps: [
        { id: "prior-contract", input: prior, expect: { state: "CERTIFIED", certified: true, receipt: true } },
        { id: "protected-current-week", input: amended, expect: { state: "CERTIFIED", certified: true, receipt: true, stageStates: { program: "CURRENT", calendar: "CURRENT", today: "CURRENT" } } },
        { id: "stale-next-week", input: badStaged, expect: { state: "INCONSISTENT", certified: false, firstProblemCode: "STAGED_WEEK_CONTRACT_MISMATCH", primaryActionCode: "OPEN_CALENDAR", receipt: false } },
        { id: "new-contract-week", input: nextWeek, expect: { state: "CERTIFIED", certified: true, receipt: true } }
      ]
    },
    {
      id: "OFFLINE_TO_CONFIRMED",
      label: "Offline work survives exact account confirmation",
      steps: [
        { id: "saved-before-offline", input: restored, expect: { state: "CERTIFIED", certified: true, receipt: true } },
        { id: "protected-offline", input: protectedOffline, expect: { state: "PROTECTED", certified: false, primaryActionCode: "", receipt: false, preserveEvidenceFrom: "saved-before-offline" } },
        { id: "server-confirmed", input: restored, expect: { state: "CERTIFIED", certified: true, receipt: true, sameReceiptAs: "saved-before-offline", preserveEvidenceFrom: "protected-offline" } }
      ]
    },
    {
      id: "DAILY_EVIDENCE_AND_CLOSEOUT",
      label: "Daily proof and Closeout stay on one command",
      steps: [
        { id: "open-day", input: healthy, expect: { state: "CERTIFIED", certified: true, receipt: true, stageStates: { evidence: "OPEN", closeout: "OPEN" } } },
        { id: "proof-saved", input: logged, expect: { state: "CERTIFIED", certified: true, receipt: true, stageStates: { evidence: "CURRENT", closeout: "OPEN" } } },
        { id: "closeout-sealed", input: sealed, expect: { state: "CERTIFIED", certified: true, receipt: true, preserveEvidenceFrom: "proof-saved", stageStates: { evidence: "CURRENT", closeout: "CURRENT" } } }
      ]
    },
    {
      id: "ATLAS_DECISION_CONTROL",
      label: "Atlas proposals never silently replace the active mission",
      steps: [
        { id: "mission-active", input: withEvidence(healthy, ["pre-adaptation-proof"]), expect: { state: "CERTIFIED", certified: true, receipt: true } },
        { id: "proposal-waiting", input: { ...withEvidence(healthy, ["pre-adaptation-proof"]), adaptation: { status: "PROPOSED" } }, expect: { state: "CERTIFIED", certified: true, receipt: true, sameReceiptAs: "mission-active", preserveEvidenceFrom: "mission-active" } },
        { id: "proposal-declined", input: { ...withEvidence(healthy, ["pre-adaptation-proof"]), adaptation: { status: "HELD" } }, expect: { state: "CERTIFIED", certified: true, receipt: true, sameReceiptAs: "mission-active", preserveEvidenceFrom: "proposal-waiting" } },
        { id: "proposal-accepted", input: adapted, expect: { state: "CERTIFIED", certified: true, receipt: true, preserveEvidenceFrom: "proposal-declined" } }
      ]
    }
  ];
}

module.exports = { DATE, account, lineageSnapshot, setupSnapshot, withEvidence, scenarios };
