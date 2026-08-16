(function (root, factory) {
  const adaptive = typeof module === "object" && module.exports
    ? require("./adaptive-coaching.js")
    : root.DominionAdaptiveCoaching;
  const orchestrator = typeof module === "object" && module.exports
    ? require("./weekly-orchestrator.js")
    : root.DominionWeeklyOrchestrator;
  const api = factory(adaptive, orchestrator);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasAdaptiveWeek = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (adaptive, orchestrator) {
  "use strict";

  const VERSION = "025A.2";
  const REVIEW_OPEN_DAY_OFFSET = 4;
  const ACTIONABLE_CODES = new Set(["PROTECT", "DELOAD", "REBALANCE", "PROGRESS"]);

  function dateIso(value) {
    const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function addDays(value, count) {
    const source = dateIso(value);
    if (!source) return null;
    const next = new Date(`${source}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + Number(count || 0));
    return next.toISOString().slice(0, 10);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value || 0)));
  }

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function reviewWindow(activeWeek = null, todayValue = null) {
    const today = dateIso(todayValue) || new Date().toISOString().slice(0, 10);
    if (!activeWeek?.weekStart || !activeWeek?.weekEnd) {
      return { available: false, status: "WEEK_REQUIRED", today, opensAt: null, closesAt: null, daysUntilOpen: null };
    }
    const opensAt = addDays(activeWeek.weekStart, REVIEW_OPEN_DAY_OFFSET);
    const available = today >= opensAt;
    const daysUntilOpen = available
      ? 0
      : Math.max(0, Math.round((Date.parse(`${opensAt}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000));
    return {
      available,
      status: available ? "OPEN" : "COLLECTING",
      today,
      opensAt,
      closesAt: activeWeek.weekEnd,
      daysUntilOpen
    };
  }

  function evidenceMetrics(signals = {}, performance = {}) {
    const readiness = signals.readiness || {};
    const evidence = signals.evidence || {};
    const domains = evidence.domains || {};
    return {
      executionPercent: evidence.adherencePercent,
      completed: Number(evidence.completed || 0),
      planned: Number(evidence.planned || 0),
      rollCalls: Number(readiness.days || 0),
      greenDays: Number(readiness.greenDays || 0),
      redDays: Number(readiness.redDays || 0),
      painDays: Number(readiness.painDays || 0),
      averageEnergy: readiness.averageEnergy,
      averageSoreness: readiness.averageSoreness,
      fuelPercent: domains.FUELING?.percent ?? null,
      strengthPercent: domains.STRENGTH?.percent ?? null,
      runningPercent: domains.RUNNING?.percent ?? null,
      corePercent: domains.CORE?.percent ?? null,
      performanceEvents: Math.max(0, Number(performance.events || 0)),
      techniqueFlags: Math.max(0, Number(performance.techniqueFlags || 0)),
      stoppedSessions: Math.max(0, Number(performance.stoppedSessions || 0)),
      recoveryOrders: Math.max(0, Number(performance.recoveryOrders || 0)),
      recoveryCompleted: Math.max(0, Number(performance.recoveryCompleted || 0)),
      recoveryUnresolved: Math.max(0, Number(performance.recoveryUnresolved || 0)),
      recoveryPercent: performance.recoveryPercent === null || performance.recoveryPercent === undefined
        ? null
        : clamp(performance.recoveryPercent, 0, 100),
      recoverySafetyHolds: Math.max(0, Number(performance.recoverySafetyHolds || 0))
    };
  }

  function weeklyCopy(base = {}, input = {}, window = {}) {
    const activeWeek = input.activeWeek || {};
    const targetWeekStart = dateIso(input.targetWeekStart) || addDays(activeWeek.weekStart, 7);
    const targetWeekEnd = addDays(targetWeekStart, 6);
    const performance = input.performance || {};
    const metrics = evidenceMetrics(base.signals, performance);
    let code = base.code;
    let status = base.status;
    let label = base.label;
    let reason = base.reason;
    let changes = base.changes || [];

    if (!["PROTECT", "DELOAD"].includes(code) && Number(performance.techniqueFlags || 0) >= 2) {
      code = "DELOAD";
      status = "PROPOSED";
      [label, reason] = adaptive.proposalDefinition(code);
      reason = "Repeated technique-limited evidence supports a bounded reduction before another loaded week.";
      changes = adaptive.changesFor(code);
    } else if (code === "PROGRESS" && Number(performance.stoppedSessions || 0) > 0) {
      code = "REBALANCE";
      status = "PROPOSED";
      [label, reason] = adaptive.proposalDefinition(code);
      reason = "A stopped session blocks progression. Atlas will reduce friction before adding demand.";
      changes = adaptive.changesFor(code);
    } else if (code === "PROGRESS" && Number(performance.recoveryOrders || 0) >= 2 && Number(performance.recoveryPercent) < 50) {
      code = "REBALANCE";
      status = "PROPOSED";
      [label, reason] = adaptive.proposalDefinition(code);
      reason = "Recovery orders are not yet closing consistently. Atlas will reduce friction before adding demand.";
      changes = adaptive.changesFor(code);
    }

    if (["OBSERVATION_REQUIRED", "COLLECT_EVIDENCE"].includes(code)) {
      code = "HOLD";
      status = "CURRENT";
      label = "Repeat the current week";
      reason = "Evidence is still building. Atlas will not increase demand from a partial week.";
      changes = [];
    }

    const fingerprint = adaptive.stableHash({ base: base.fingerprint, performance, code, targetWeekStart });
    const id = `atlas-week:${targetWeekStart}:${fingerprint}`;
    return {
      ...base,
      version: VERSION,
      id,
      scope: "WEEK",
      status,
      code,
      fingerprint,
      label,
      reason,
      changes,
      tone: ["PROTECT", "DELOAD"].includes(code) ? "red" : code === "PROGRESS" ? "green" : status === "PROPOSED" ? "gold" : "neutral",
      activeWeekId: activeWeek.id || null,
      activeWeekStart: activeWeek.weekStart || null,
      activeWeekEnd: activeWeek.weekEnd || null,
      targetWeekStart,
      targetWeekEnd,
      effectiveDate: targetWeekStart,
      reviewDate: targetWeekEnd,
      reviewWindow: window,
      metrics,
      performance: {
        events: metrics.performanceEvents,
        techniqueFlags: metrics.techniqueFlags,
        stoppedSessions: metrics.stoppedSessions,
        recoveryOrders: metrics.recoveryOrders,
        recoveryCompleted: metrics.recoveryCompleted,
        recoveryUnresolved: metrics.recoveryUnresolved,
        recoveryPercent: metrics.recoveryPercent,
        recoverySafetyHolds: metrics.recoverySafetyHolds
      },
      planChangesApproved: false,
      headline: label,
      detail: reason,
      approvalRequired: ACTIONABLE_CODES.has(code) && status === "PROPOSED"
    };
  }

  function preserveDecision(next = {}, prior = null) {
    if (!prior || prior.scope !== "WEEK" || prior.targetWeekStart !== next.targetWeekStart) return next;
    if (prior.contractId !== next.contractId || Number(prior.contractRevision || 0) !== Number(next.contractRevision || 0)) return next;
    if (["APPROVED", "HELD"].includes(prior.status)) return deepCopy(prior);
    if (prior.fingerprint === next.fingerprint && prior.status === next.status) return deepCopy(prior);
    return next;
  }

  function buildProposal(input = {}) {
    if (!adaptive?.buildProposal) return null;
    const contract = input.contract || null;
    const activeWeek = input.activeWeek || null;
    const window = reviewWindow(activeWeek, input.today);
    const targetWeekStart = activeWeek?.weekStart ? addDays(activeWeek.weekStart, 7) : null;

    if (!contract || contract.status !== "APPROVED" || !activeWeek) {
      return {
        version: VERSION,
        scope: "WEEK",
        status: "SETUP_REQUIRED",
        code: "SETUP_REQUIRED",
        tone: "gold",
        targetWeekStart,
        headline: "Activate the operating week",
        detail: "Atlas needs one signed Contract and active week before it can coach the next one.",
        approvalRequired: false,
        reviewWindow: window,
        metrics: evidenceMetrics()
      };
    }

    const base = adaptive.buildProposal({
      date: window.today > activeWeek.weekEnd ? activeWeek.weekEnd : window.today,
      contractApproved: true,
      contractId: contract.id || null,
      contractRevision: contract.revision || null,
      planCoverage: Number(input.planCoverage || 0),
      readinessHistory: input.readinessHistory || [],
      evidence: input.evidence || {},
      generatedAt: input.generatedAt || new Date().toISOString()
    });
    let proposal = weeklyCopy(base, { ...input, targetWeekStart }, window);

    if (!window.available) {
      proposal = {
        ...proposal,
        status: "MONITORING",
        code: "OBSERVE",
        tone: "neutral",
        headline: "Atlas is reading the week",
        detail: `The next-week call opens ${window.opensAt}. Until then, execution and recovery evidence continue to accumulate.`,
        approvalRequired: false,
        changes: []
      };
    }
    return preserveDecision(proposal, input.priorProposal || null);
  }

  function approveProposal(proposal = {}, approvedAt = new Date().toISOString()) {
    if (proposal.scope !== "WEEK" || proposal.status !== "PROPOSED" || !ACTIONABLE_CODES.has(proposal.code)) return null;
    const approved = adaptive.approveProposal(proposal, approvedAt, proposal.targetWeekStart);
    if (!approved) return null;
    return deepCopy({
      ...approved,
      version: VERSION,
      scope: "WEEK",
      status: "APPROVED",
      planChangesApproved: true,
      effectiveDate: proposal.targetWeekStart,
      reviewDate: proposal.targetWeekEnd,
      decision: proposal.code,
      headline: proposal.label,
      detail: `Approved for the week of ${proposal.targetWeekStart}. The current week remains unchanged.`
    });
  }

  function holdProposal(proposal = {}, heldAt = new Date().toISOString()) {
    if (proposal.scope !== "WEEK" || !["PROPOSED", "APPROVED"].includes(proposal.status)) return null;
    return deepCopy({
      ...proposal,
      status: "HELD",
      decision: "HOLD",
      heldAt,
      approvedAt: null,
      planChangesApproved: false,
      changes: [],
      tone: "neutral",
      headline: "Repeat the current week",
      detail: "The recruit kept the current prescription. Atlas will roll it forward unchanged."
    });
  }

  function domainChange(decision = {}, moduleId = "") {
    const domain = ({ STRENGTH: "STRENGTH", RUNNING: "RUNNING", CORE: "CORE", NUTRITION: "FUELING" })[String(moduleId || "").toUpperCase()];
    return (decision.changes || []).find((item) => item.domain === domain) || null;
  }

  function adjustedMinutes(minutes, change = null) {
    const current = Math.max(0, Number(minutes || 0));
    if (!change || !current) return current;
    if (change.action === "RECOVERY_ONLY") return Math.min(current, change.domain === "CORE" ? 15 : 20);
    if (change.action === "REDUCE_VOLUME") return Math.max(change.domain === "CORE" ? 8 : 20, Math.round(current * (1 + Number(change.volumeDeltaPercent || 0) / 100)));
    if (change.action === "STAGE_PROGRESS") return Math.max(current + 1, Math.round(current * (1 + clamp(change.volumeDeltaPercent, 0, 5) / 100)));
    return current;
  }

  function adaptActivity(activity = {}, decision = {}) {
    const change = domainChange(decision, activity.module);
    if (!change) return { ...activity };
    const next = {
      ...activity,
      estimatedMinutes: adjustedMinutes(activity.estimatedMinutes, change),
      adaptiveWeek: {
        decisionId: decision.id,
        fingerprint: decision.fingerprint,
        code: decision.code,
        action: change.action,
        label: change.label
      }
    };
    if (change.action === "RECOVERY_ONLY") {
      next.type = "RECOVERY";
      next.title = activity.module === "RUNNING" ? "Recovery run or walk" : activity.module === "CORE" ? "Pain-free core recovery" : "Recovery strength protocol";
    }
    if (change.action === "REDUCE_VOLUME" && activity.module === "RUNNING") next.type = "EASY";
    if (change.action === "EASY_ONLY" && activity.module === "RUNNING") next.type = "EASY";
    return next;
  }

  function decisionReceipt(decision = {}, appliedAt = new Date().toISOString()) {
    return {
      version: VERSION,
      status: decision.status,
      decisionId: decision.id || null,
      fingerprint: decision.fingerprint || null,
      code: decision.decision || decision.code || "HOLD",
      activeWeekStart: decision.activeWeekStart || null,
      targetWeekStart: decision.targetWeekStart || null,
      appliedAt,
      weeklyReplanning: decision.weeklyReplanning ? deepCopy(decision.weeklyReplanning) : null,
      changes: (decision.changes || []).map((item) => ({
        domain: item.domain,
        action: item.action,
        volumeDeltaPercent: Number(item.volumeDeltaPercent || 0),
        loadDeltaPercent: Number(item.loadDeltaPercent || 0)
      }))
    };
  }

  function applyToDraft(draft = {}, decision = {}, options = {}) {
    if (!orchestrator?.recalculateDraftWeek) throw new Error("Atlas calendar coordination is unavailable.");
    if (draft.status !== "DRAFT") throw new Error("Atlas can only adapt a draft week.");
    if (decision.scope !== "WEEK" || decision.status !== "APPROVED" || !decision.planChangesApproved) throw new Error("Approve the Atlas weekly call before adapting the calendar.");
    if (draft.weekStart !== decision.targetWeekStart) throw new Error("The approved coaching call targets a different week.");
    const next = deepCopy(draft);
    next.days = next.days.map((day) => {
      const fuelChange = domainChange(decision, "NUTRITION");
      return {
        ...day,
        activities: (day.activities || []).map((activity) => adaptActivity(activity, decision)),
        nutrition: day.nutrition && fuelChange ? {
          ...day.nutrition,
          adaptiveWeek: {
            decisionId: decision.id,
            fingerprint: decision.fingerprint,
            code: decision.code,
            action: fuelChange.action,
            label: fuelChange.label
          },
          guidance: fuelChange.detail
        } : day.nutrition
      };
    });
    const recalculated = orchestrator.recalculateDraftWeek(next);
    const appliedAt = options.appliedAt || new Date().toISOString();
    return {
      ...recalculated,
      generatedBy: "ATLAS_ADAPTIVE_WEEK",
      atlasAdaptiveWeek: decisionReceipt(decision, appliedAt),
      message: recalculated.approvalBlocked
        ? "Atlas staged the approved adjustment, but the resulting week needs one calendar fix."
        : `${decision.label} is staged for ${decision.targetWeekStart}.`
    };
  }

  function draftMatchesDecision(draft = null, decision = null) {
    if (!draft || !decision || decision.status !== "APPROVED") return false;
    return draft.weekStart === decision.targetWeekStart
      && draft.atlasAdaptiveWeek?.decisionId === decision.id
      && draft.atlasAdaptiveWeek?.fingerprint === decision.fingerprint;
  }

  function gate(decision = null) {
    if (!decision) return { status: "ROLL_FORWARD", canBuild: true, requiresApproval: false };
    if (decision.status === "MONITORING") return { status: "MONITORING", canBuild: false, requiresApproval: false };
    if (decision.status === "PROPOSED") return { status: "REVIEW_REQUIRED", canBuild: false, requiresApproval: true };
    if (decision.status === "APPROVED") return { status: "ADAPT", canBuild: true, requiresApproval: false };
    if (["HELD", "CURRENT"].includes(decision.status)) return { status: "ROLL_FORWARD", canBuild: true, requiresApproval: false };
    return { status: "BLOCKED", canBuild: false, requiresApproval: false };
  }

  return Object.freeze({
    VERSION,
    REVIEW_OPEN_DAY_OFFSET,
    ACTIONABLE_CODES,
    addDays,
    reviewWindow,
    evidenceMetrics,
    buildProposal,
    approveProposal,
    holdProposal,
    domainChange,
    adjustedMinutes,
    adaptActivity,
    decisionReceipt,
    applyToDraft,
    draftMatchesDecision,
    gate
  });
});
