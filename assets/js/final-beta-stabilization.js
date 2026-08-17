(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionFinalBetaStabilization = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029G.1";
  const ADAPTATION_STATES = Object.freeze({
    MISSION_ACTIVE: "MISSION_ACTIVE",
    ADAPTATION_PROPOSED: "ADAPTATION_PROPOSED",
    ADAPTATION_ACCEPTED: "ADAPTATION_ACCEPTED",
    ADAPTATION_DECLINED: "ADAPTATION_DECLINED",
    MISSION_COMPLETED: "MISSION_COMPLETED"
  });

  function adaptationState(proposal = null, options = {}) {
    if (options.missionCompleted === true) return ADAPTATION_STATES.MISSION_COMPLETED;
    if (!proposal) return ADAPTATION_STATES.MISSION_ACTIVE;
    if (proposal.adaptationState && Object.values(ADAPTATION_STATES).includes(proposal.adaptationState)) return proposal.adaptationState;
    if (proposal.status === "APPROVED") return ADAPTATION_STATES.ADAPTATION_ACCEPTED;
    if (["HELD", "RESTORED", "NEEDS_CONTEXT"].includes(proposal.status)) return ADAPTATION_STATES.ADAPTATION_DECLINED;
    if (proposal.status === "PROPOSED") return ADAPTATION_STATES.ADAPTATION_PROPOSED;
    return ADAPTATION_STATES.MISSION_ACTIVE;
  }

  function adaptationControls(proposal = null) {
    const state = adaptationState(proposal);
    if (state === ADAPTATION_STATES.ADAPTATION_PROPOSED) return [
      { code: "ACCEPT", label: "Accept recovery", primary: true },
      { code: "HOLD", label: "Hold current mission", primary: false },
      { code: "NOT_FIT", label: "This doesn’t fit", primary: false }
    ];
    if (state === ADAPTATION_STATES.ADAPTATION_ACCEPTED) return [
      { code: "RESTORE", label: "Restore current mission", primary: false }
    ];
    return [];
  }

  function canonicalPendingEntries(continuityQueue = [], accountQueue = []) {
    const granular = Array.isArray(continuityQueue) ? continuityQueue.filter(Boolean) : [];
    const aggregate = Array.isArray(accountQueue) ? accountQueue.filter(Boolean) : [];
    if (granular.length) return granular.map((item) => ({ ...item, queueSource: "CONTINUITY" }));
    return aggregate.map((item) => ({ ...item, queueSource: "ACCOUNT_TRUTH" }));
  }

  function pendingState(continuityQueue = [], accountQueue = []) {
    const entries = canonicalPendingEntries(continuityQueue, accountQueue);
    return {
      count: entries.length,
      entries,
      state: entries.length ? "SYNC_PENDING" : "CURRENT",
      label: entries.length ? `Sync · ${entries.length}` : "Synced"
    };
  }

  function weekView(input = {}) {
    const activeWeek = input.activeWeek || null;
    const stagedWeek = input.stagedWeek || null;
    const requested = String(input.requested || "ACTIVE").toUpperCase();
    if (requested === "STAGED" && stagedWeek) return { mode: "STAGED", week: stagedWeek, activeWeek, stagedWeek };
    if (activeWeek) return { mode: "ACTIVE", week: activeWeek, activeWeek, stagedWeek };
    if (stagedWeek) return { mode: "STAGED", week: stagedWeek, activeWeek, stagedWeek };
    return { mode: "EMPTY", week: null, activeWeek, stagedWeek };
  }

  function percent(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : fallback;
  }

  function campaignMetrics(campaign = {}) {
    const totalDays = Math.max(1, Number(campaign.totalWeeks || 12) * 7);
    const finalized = Number(campaign.weekly?.finalized || 0);
    const executionScore = finalized > 0 && Number.isFinite(Number(campaign.weekly?.disciplineAverage))
      ? percent(campaign.weekly.disciplineAverage)
      : null;
    const qualifyingTarget = Math.max(1, Number(campaign.qualifyingWeekTarget || 9));
    const programActive = ["ACTIVE", "STAGED", "WON", "CLOSED"].includes(String(campaign.status || "").toUpperCase());
    return {
      campaignElapsed: percent(Number(campaign.elapsedDays || 0) / totalDays * 100),
      evidenceCoverage: percent(campaign.evidence?.rate || 0),
      assessedExecutionScore: executionScore,
      promotionRequirement: percent(Number(campaign.weekly?.qualifying || 0) / qualifyingTarget * 100),
      setupCompleteness: campaign.status === "CONTRACT_REQUIRED" ? 0 : campaign.status === "PROGRAM_REQUIRED" ? 50 : programActive ? 100 : 0,
      assessedWeeks: finalized,
      qualifyingWeeks: Number(campaign.weekly?.qualifying || 0),
      qualifyingWeekTarget: qualifyingTarget
    };
  }

  function mobileDisclosure(input = {}) {
    return {
      commandOpen: true,
      quickLogOpen: true,
      currentMissionOpen: true,
      bodyCheckpointCollapsed: true,
      learningCollapsed: true,
      technicalDetailsCollapsed: true,
      fullFormsUseDedicatedView: true
    };
  }

  return Object.freeze({
    VERSION,
    ADAPTATION_STATES,
    adaptationState,
    adaptationControls,
    canonicalPendingEntries,
    pendingState,
    weekView,
    campaignMetrics,
    mobileDisclosure
  });
});
