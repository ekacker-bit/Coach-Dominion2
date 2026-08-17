(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasLiveAdaptation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026C.1";
  const STABILIZATION_VERSION = "029G.1";
  const ADAPTATION_STATES = Object.freeze({
    MISSION_ACTIVE: "MISSION_ACTIVE",
    ADAPTATION_PROPOSED: "ADAPTATION_PROPOSED",
    ADAPTATION_ACCEPTED: "ADAPTATION_ACCEPTED",
    ADAPTATION_DECLINED: "ADAPTATION_DECLINED",
    MISSION_COMPLETED: "MISSION_COMPLETED"
  });
  const DECISIONS = new Set(["ACCEPT", "HOLD", "NOT_FIT", "RESTORE"]);

  function text(value = "") {
    return String(value || "").trim();
  }

  function upper(value = "") {
    return text(value).toUpperCase().replaceAll(" ", "_");
  }

  function stableHash(value = "") {
    const source = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function proposalDefinition(code) {
    if (code === "PROTECT_TODAY") return {
      tone: "red",
      headline: "Protect today",
      reason: "Pain or RED readiness overrides loaded work.",
      impact: "Training becomes recovery-only. Fuel targets remain protected.",
      choiceId: "RECOVERY_ONLY",
      safetyOverride: true
    };
    if (code === "RECOVER_AFTER_DEVIATION") return {
      tone: "yellow",
      headline: "Atlas proposes recovery before the next exposure",
      reason: "Today ended partial, stopped, or materially outside the prescription.",
      impact: "If accepted, completed evidence stays intact and remaining loaded work becomes adapted, not required.",
      choiceId: "RECOVERY_ONLY",
      safetyOverride: false
    };
    return {
      tone: "yellow",
      headline: "Reduce today, keep the intent",
      reason: "Current energy or soreness is materially below the approved training assumption.",
      impact: "Today\'s volume drops about 25%. The approved program and Fuel targets do not change.",
      choiceId: "REDUCE_TODAY",
      safetyOverride: false
    };
  }

  function triggerFor(input = {}) {
    const readiness = upper(input.readinessState);
    if (input.pain === true || input.protected === true || readiness === "RED") return "PROTECT_TODAY";
    if (input.partialEvidence === true || ["PARTIAL", "STOPPED"].includes(upper(input.executionOutcome))) return "RECOVER_AFTER_DEVIATION";
    const energy = Number(input.energy);
    const soreness = Number(input.soreness);
    if ((Number.isFinite(energy) && energy <= 3) || (Number.isFinite(soreness) && soreness >= 8) || readiness === "YELLOW") return "REDUCE_TODAY";
    return null;
  }

  function directiveFor(proposal = {}, approvedAt = new Date().toISOString()) {
    const recovery = proposal.choiceId === "RECOVERY_ONLY";
    const changes = recovery
      ? [
          ["STRENGTH", "RECOVERY_ONLY", -100, 0],
          ["RUNNING", "RECOVERY_ONLY", -100, 0],
          ["CORE", "RECOVERY_ONLY", -100, 0],
          ["FUELING", "HOLD_TARGETS", 0, 0],
          ["RECOVERY", "PRIORITIZE", 0, 0]
        ]
      : [
          ["STRENGTH", "REDUCE_VOLUME", -25, -10],
          ["RUNNING", "REDUCE_VOLUME", -20, 0],
          ["CORE", "REDUCE_VOLUME", -25, 0],
          ["FUELING", "HOLD_TARGETS", 0, 0],
          ["RECOVERY", "ADD_WINDOW", 0, 0]
        ];
    return {
      version: VERSION,
      stabilizationVersion: STABILIZATION_VERSION,
      id: `atlas-live-directive:${proposal.date}:${proposal.fingerprint}`,
      status: "APPROVED",
      code: recovery ? "PROTECT" : "DELOAD",
      effectiveDate: proposal.date,
      reviewDate: proposal.date,
      approvedAt,
      planChangesApproved: true,
      assignmentOutcome: recovery ? "ADAPTED_NOT_REQUIRED" : "ADAPTED",
      evidencePolicy: "PRESERVE_COMPLETED",
      closeoutPolicy: recovery ? "RECOVERY_EVIDENCE_ONLY" : "ADAPTED_EXECUTION",
      laterSessionCountdown: recovery ? null : "UNCHANGED",
      changes: changes.map(([domain, action, volumeDeltaPercent, loadDeltaPercent]) => ({
        domain,
        action,
        volumeDeltaPercent,
        loadDeltaPercent,
        requiresPlanApproval: false
      }))
    };
  }

  function calendarOverride(proposal = {}) {
    return {
      status: "ATLAS_LIVE_OVERRIDE",
      date: proposal.date,
      label: proposal.headline,
      detail: proposal.impact,
      window: proposal.choiceId === "RECOVERY_ONLY" ? "RECOVERY" : "CURRENT",
      futureWeekChanged: false,
      sourceProposalId: proposal.id
    };
  }

  function buildProposal(input = {}) {
    const date = text(input.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || input.readinessComplete !== true || input.manualAdjustmentActive === true || input.missionComplete === true) return null;
    const code = triggerFor(input);
    if (!code) return null;
    const definition = proposalDefinition(code);
    const fingerprint = stableHash({
      date,
      code,
      readinessState: upper(input.readinessState),
      pain: Boolean(input.pain),
      energy: Number(input.energy) || null,
      soreness: Number(input.soreness) || null,
      executionOutcome: upper(input.executionOutcome),
      contractRevision: Number(input.contractRevision || 0),
      weekRevision: Number(input.weekRevision || 0)
    });
    const now = input.generatedAt || new Date().toISOString();
    return {
      version: VERSION,
      stabilizationVersion: STABILIZATION_VERSION,
      id: `atlas-live:${date}:${fingerprint}`,
      date,
      fingerprint,
      status: "PROPOSED",
      adaptationState: ADAPTATION_STATES.ADAPTATION_PROPOSED,
      code,
      ...definition,
      contractId: input.contractId || null,
      contractRevision: Number(input.contractRevision || 0),
      weekId: input.weekId || null,
      weekRevision: Number(input.weekRevision || 0),
      generatedAt: now,
      updatedAt: now
    };
  }

  function proposalApplies(proposal = null, context = {}) {
    if (!proposal || proposal.status === "RESTORED") return false;
    if (context.date && proposal.date !== context.date) return false;
    if (context.contractRevision && Number(proposal.contractRevision || 0) !== Number(context.contractRevision)) return false;
    if (context.weekRevision && Number(proposal.weekRevision || 0) !== Number(context.weekRevision)) return false;
    return true;
  }

  function resolveProposal(proposal = {}, decision = "HOLD", context = {}) {
    const code = upper(decision);
    if (!DECISIONS.has(code)) throw new Error("Choose Accept, Hold, or This does not fit.");
    if (proposal.status === "RESTORED" && code !== "RESTORE") return proposal;
    const now = context.resolvedAt || new Date().toISOString();
    if (code === "RESTORE") return { ...proposal, status: "RESTORED", adaptationState: ADAPTATION_STATES.MISSION_ACTIVE, directive: null, calendarOverride: null, restoredAt: now, updatedAt: now };
    if (code === "NOT_FIT") {
      return {
        ...proposal,
        status: "NEEDS_CONTEXT",
        adaptationState: ADAPTATION_STATES.ADAPTATION_DECLINED,
        responseReason: upper(context.reason || "OTHER"),
        note: text(context.note).slice(0, 240),
        resolvedAt: now,
        updatedAt: now
      };
    }
    if (code === "HOLD") return {
      ...proposal,
      status: "HELD",
      adaptationState: ADAPTATION_STATES.ADAPTATION_DECLINED,
      directive: null,
      calendarOverride: null,
      resolvedAt: now,
      updatedAt: now
    };
    return {
      ...proposal,
      status: "APPROVED",
      adaptationState: ADAPTATION_STATES.ADAPTATION_ACCEPTED,
      directive: directiveFor(proposal, now),
      calendarOverride: calendarOverride(proposal),
      approvedAt: now,
      resolvedAt: now,
      updatedAt: now
    };
  }

  function activeDirective(proposal = null, context = {}) {
    return proposalApplies(proposal, context) && proposal.status === "APPROVED" ? proposal.directive || null : null;
  }

  function activeCalendarOverride(proposal = null, context = {}) {
    return proposalApplies(proposal, context) && proposal.status === "APPROVED" ? proposal.calendarOverride || null : null;
  }

  function applyToCommand(command = {}, proposal = null, context = {}) {
    if (!proposalApplies(proposal, context) || command.blocker) return command;
    if (["PROPOSED", "NEEDS_CONTEXT"].includes(proposal.status)) {
      return {
        ...command,
        adaptationState: proposal.adaptationState || ADAPTATION_STATES.ADAPTATION_PROPOSED,
        liveAdaptation: proposal
      };
    }
    if (proposal.status !== "APPROVED") return {
      ...command,
      adaptationState: proposal.adaptationState || ADAPTATION_STATES.MISSION_ACTIVE,
      liveAdaptation: proposal
    };
    const recovery = proposal.choiceId === "RECOVERY_ONLY";
    return {
      ...command,
      title: recovery ? "Recovery governs today" : `Reduced: ${command.title}`,
      detail: proposal.impact,
      reason: `${proposal.reason} You approved this day-only change; future programming remains intact.`,
      window: recovery ? "RECOVERY" : command.window,
      duration: recovery ? { minutes: 20, label: "20 min", open: false } : Number(command.duration?.minutes) > 0 ? { minutes: Math.max(10, Math.round(command.duration.minutes * 0.75 / 5) * 5), label: `${Math.max(10, Math.round(command.duration.minutes * 0.75 / 5) * 5)} min`, open: false } : command.duration,
      primary: recovery ? { action: "MODULE", label: "OPEN - Recovery", section: "today", module: "recovery" } : command.primary,
      adaptationState: ADAPTATION_STATES.ADAPTATION_ACCEPTED,
      assignmentOutcome: recovery ? "ADAPTED_NOT_REQUIRED" : "ADAPTED",
      laterSessionCountdown: recovery ? null : command.laterSessionCountdown,
      liveAdaptation: proposal
    };
  }

  return Object.freeze({
    VERSION,
    STABILIZATION_VERSION,
    ADAPTATION_STATES,
    DECISIONS,
    stableHash,
    triggerFor,
    proposalDefinition,
    directiveFor,
    calendarOverride,
    buildProposal,
    proposalApplies,
    resolveProposal,
    activeDirective,
    activeCalendarOverride,
    applyToCommand
  });
});
