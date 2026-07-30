(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionClosedLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "014A.1";
  const PHASES = Object.freeze([
    { code: "OBSERVE", label: "Observe", purpose: "Collect current readiness and plan context." },
    { code: "DECIDE", label: "Decide", purpose: "Generate one bounded coaching decision." },
    { code: "AUTHORIZE", label: "Authorize", purpose: "Require deliberate approval before execution." },
    { code: "EXECUTE", label: "Execute", purpose: "Complete the approved work and safeguards." },
    { code: "VERIFY", label: "Verify", purpose: "Reconcile the prescription against actual evidence." },
    { code: "ADAPT", label: "Adapt", purpose: "Propose the next bounded adjustment for approval." }
  ]);
  const DOMAIN_ORDER = ["TRAINING", "RUNNING", "CORE", "FUELING", "RECOVERY", "RECORD"];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function normalizeReadiness(input = {}) {
    const state = ["GREEN", "YELLOW", "RED"].includes(String(input.state || "").toUpperCase())
      ? String(input.state).toUpperCase()
      : "UNKNOWN";
    return {
      state,
      pain: Boolean(input.pain),
      energy: Number.isFinite(Number(input.energy)) ? clamp(input.energy, 1, 10) : null,
      soreness: Number.isFinite(Number(input.soreness)) ? clamp(input.soreness, 1, 10) : null
    };
  }

  function normalizePrescription(input = {}) {
    const domains = input.domains || {};
    return {
      mission: String(input.mission || "Awaiting approved mission"),
      posture: String(input.posture || "UNSET"),
      domains: Object.fromEntries(DOMAIN_ORDER.map((code) => {
        const domain = domains[code] || domains[code.toLowerCase()] || {};
        return [code, {
          planned: Boolean(domain.planned),
          title: String(domain.title || code.charAt(0) + code.slice(1).toLowerCase()),
          target: String(domain.target || ""),
          sourceId: domain.sourceId || null,
          required: domain.required !== false && Boolean(domain.planned)
        }];
      }))
    };
  }

  function createDecisionSnapshot(input = {}) {
    const date = dateIso(input.date) || new Date().toISOString().slice(0, 10);
    const readiness = normalizeReadiness(input.readiness);
    if (readiness.state === "UNKNOWN") {
      return {
        valid: false,
        status: "OBSERVATION_REQUIRED",
        date,
        message: "Current readiness is required before Coach Dominion can issue a decision."
      };
    }
    const prescription = normalizePrescription(input.prescription);
    const painOverride = readiness.pain || readiness.state === "RED";
    const posture = painOverride ? "PROTECT / RECOVER" : prescription.posture;
    const decisionBasis = {
      version: VERSION,
      date,
      readiness,
      posture,
      prescription,
      priorAdaptation: input.priorAdaptation?.status === "APPROVED"
        ? { code: input.priorAdaptation.code, approvedAt: input.priorAdaptation.approvedAt }
        : null
    };
    const id = `loop-${date}-${stableHash(decisionBasis)}`;
    return {
      valid: true,
      version: VERSION,
      id,
      date,
      status: "DRAFT",
      generatedAt: input.generatedAt || new Date().toISOString(),
      approvedAt: null,
      readiness,
      posture,
      mission: painOverride
        ? "Protect recovery capacity. Hard training is not authorized."
        : prescription.mission,
      prescription,
      priorAdaptation: decisionBasis.priorAdaptation,
      safeguards: {
        painOverride,
        silentMutationAllowed: false,
        progressionRequiresVerifiedEvidence: true,
        futureAdjustmentRequiresApproval: true
      },
      fingerprint: stableHash(decisionBasis)
    };
  }

  function approveDecision(decision = {}, approvedAt = new Date().toISOString()) {
    if (!decision.valid || !decision.id || decision.status !== "DRAFT") return null;
    return JSON.parse(JSON.stringify({ ...decision, status: "APPROVED", approvedAt }));
  }

  function normalizeActual(actual = {}) {
    return Object.fromEntries(DOMAIN_ORDER.map((code) => {
      const item = actual[code] || actual[code.toLowerCase()] || {};
      return [code, {
        complete: Boolean(item.complete),
        partial: Boolean(item.partial),
        evidenceCount: Math.max(0, Number(item.evidenceCount || 0)),
        sourceIds: Array.isArray(item.sourceIds) ? [...new Set(item.sourceIds.filter(Boolean))] : [],
        quality: ["CONTROLLED", "TECHNIQUE_LIMITED", "UNKNOWN"].includes(item.quality) ? item.quality : "UNKNOWN",
        effort: Number.isFinite(Number(item.effort)) ? clamp(item.effort, 1, 10) : null,
        painReported: Boolean(item.painReported)
      }];
    }));
  }

  function reconcileDecision(decision = {}, actualInput = {}, options = {}) {
    if (!decision.id || decision.status !== "APPROVED") {
      return { valid: false, status: "DECISION_REQUIRED", domains: [], message: "Approve today's decision before reconciling evidence." };
    }
    const actual = normalizeActual(actualInput);
    const domains = DOMAIN_ORDER.map((code) => {
      const planned = decision.prescription.domains[code];
      const observed = actual[code];
      let status = "NOT_PLANNED";
      if (planned.required && observed.complete) status = "COMPLETE";
      else if (planned.required && (observed.partial || observed.evidenceCount > 0)) status = "PARTIAL";
      else if (planned.required) status = "MISSING";
      else if (observed.complete || observed.evidenceCount > 0) status = "UNPLANNED_EVIDENCE";
      return {
        code,
        label: planned.title,
        planned: planned.planned,
        required: planned.required,
        target: planned.target,
        status,
        evidenceCount: observed.evidenceCount,
        sourceIds: observed.sourceIds,
        quality: observed.quality,
        effort: observed.effort,
        painReported: observed.painReported
      };
    });
    const required = domains.filter((item) => item.required);
    const complete = required.filter((item) => item.status === "COMPLETE");
    const partial = required.filter((item) => item.status === "PARTIAL");
    const missing = required.filter((item) => item.status === "MISSING");
    const evidencePoints = complete.length + (partial.length * 0.5);
    const completionPercent = required.length ? Math.round((evidencePoints / required.length) * 100) : 100;
    const painFlags = domains.filter((item) => item.painReported).length + (decision.safeguards.painOverride ? 1 : 0);
    const record = domains.find((item) => item.code === "RECORD");
    const reviewReady = Boolean(record?.status === "COMPLETE" && !missing.length);
    const confidence = reviewReady && domains.some((item) => item.sourceIds.length)
      ? "HIGH"
      : completionPercent >= 70
        ? "MODERATE"
        : "LOW";
    return {
      valid: true,
      version: VERSION,
      decisionId: decision.id,
      date: decision.date,
      status: reviewReady ? "REVIEW_READY" : missing.length ? "EVIDENCE_REQUIRED" : "REVIEW_REQUIRED",
      generatedAt: options.generatedAt || new Date().toISOString(),
      domains,
      summary: {
        required: required.length,
        complete: complete.length,
        partial: partial.length,
        missing: missing.length,
        completionPercent,
        painFlags,
        confidence
      },
      reviewReady,
      message: reviewReady
        ? "The approved decision and actual evidence are ready for a closing review."
        : `${missing.length} required domain${missing.length === 1 ? "" : "s"} still need completion evidence.`
    };
  }

  function deriveAdaptation(decision = {}, reconciliation = {}, options = {}) {
    const history = Array.isArray(options.history) ? options.history : [];
    const recentPain = reconciliation.summary?.painFlags > 0
      || history.slice(-3).some((item) => item?.adaptation?.code === "PROTECT");
    const techniqueLimited = (reconciliation.domains || []).some((item) => item.quality === "TECHNIQUE_LIMITED");
    const sustainable = (reconciliation.domains || []).filter((item) => item.required && item.status === "COMPLETE")
      .filter((item) => item.effort === null || item.effort <= 8);
    const required = (reconciliation.domains || []).filter((item) => item.required);
    const highAdherence = Number(reconciliation.summary?.completionPercent || 0) >= 90;
    const verified = reconciliation.reviewReady && ["HIGH", "MODERATE"].includes(reconciliation.summary?.confidence);
    let code = "HOLD";
    let label = "Hold current plan";
    let reason = "Evidence is not yet strong enough to justify a change.";
    if (decision.safeguards?.painOverride || recentPain) {
      code = "PROTECT";
      label = "Protect and reassess";
      reason = "Pain evidence blocks progression and prioritizes recovery.";
    } else if (techniqueLimited) {
      code = "REGRESS";
      label = "Regress or substitute";
      reason = "Technique-limited evidence requires a lower-complexity or lower-load next exposure.";
    } else if (Number(reconciliation.summary?.completionPercent || 0) < 70) {
      code = "REDUCE";
      label = "Reduce next exposure";
      reason = "Low completion indicates the current prescription exceeded executable capacity or lacked sufficient evidence.";
    } else if (verified && highAdherence && required.length > 0 && sustainable.length === required.length && decision.readiness?.state === "GREEN") {
      code = "PROGRESS_CANDIDATE";
      label = "Progression candidate";
      reason = "Verified completion, controlled effort, and GREEN readiness support a conservative next-cycle proposal.";
    } else if (verified) {
      code = "REPEAT";
      label = "Repeat current exposure";
      reason = "The prescription was executable, but the evidence does not support increasing demand yet.";
    }
    return {
      version: VERSION,
      id: `adapt-${decision.date}-${stableHash({ decisionId: decision.id, code, reconciliation: reconciliation.summary })}`,
      decisionId: decision.id,
      date: decision.date,
      status: "PROPOSED",
      code,
      label,
      reason,
      generatedAt: options.generatedAt || new Date().toISOString(),
      approvedAt: null,
      effectiveDate: options.effectiveDate || null,
      bounds: {
        automaticPlanMutation: false,
        maximumLoadIncreasePercent: code === "PROGRESS_CANDIDATE" ? 5 : 0,
        maximumVolumeIncreasePercent: code === "PROGRESS_CANDIDATE" ? 10 : 0,
        painBlocksProgression: true
      }
    };
  }

  function closeReview(decision = {}, reconciliation = {}, options = {}) {
    if (!reconciliation.valid || !reconciliation.reviewReady) {
      return { valid: false, message: "Complete and verify every required domain before closing the loop." };
    }
    const adaptation = deriveAdaptation(decision, reconciliation, options);
    return {
      valid: true,
      message: "Today's evidence is reconciled. The next adjustment remains proposed until approved.",
      review: {
        version: VERSION,
        id: `review-${decision.date}-${stableHash({ decisionId: decision.id, summary: reconciliation.summary })}`,
        decisionId: decision.id,
        date: decision.date,
        status: "CLOSED",
        closedAt: options.closedAt || new Date().toISOString(),
        reconciliation,
        adaptation
      }
    };
  }

  function approveAdaptation(adaptation = {}, approvedAt = new Date().toISOString(), effectiveDate = null) {
    if (!adaptation.id || adaptation.status !== "PROPOSED") return null;
    return JSON.parse(JSON.stringify({
      ...adaptation,
      status: "APPROVED",
      approvedAt,
      effectiveDate: effectiveDate || adaptation.effectiveDate || null
    }));
  }

  function buildLoopState(input = {}) {
    const draft = createDecisionSnapshot(input);
    const decision = input.decision?.id === draft.id ? input.decision : draft;
    const approved = decision?.status === "APPROVED";
    const reconciliation = approved ? reconcileDecision(decision, input.actual || {}, { generatedAt: input.generatedAt }) : null;
    const review = input.review?.decisionId === decision?.id ? input.review : null;
    const adaptation = input.adaptation?.decisionId === decision?.id
      ? input.adaptation
      : review?.adaptation || null;
    const executionComplete = Boolean(
      reconciliation
      && reconciliation.summary?.missing === 0
      && reconciliation.summary?.partial === 0
    );
    const phases = PHASES.map((phase, index) => {
      let status = "LOCKED";
      if (phase.code === "OBSERVE") status = draft.valid ? "COMPLETE" : "CURRENT";
      if (phase.code === "DECIDE") status = draft.valid ? "COMPLETE" : "LOCKED";
      if (phase.code === "AUTHORIZE") status = approved ? "COMPLETE" : draft.valid ? "CURRENT" : "LOCKED";
      if (phase.code === "EXECUTE") status = approved ? (executionComplete ? "COMPLETE" : "CURRENT") : "LOCKED";
      if (phase.code === "VERIFY") status = review ? "COMPLETE" : reconciliation?.reviewReady ? "CURRENT" : approved ? "LOCKED" : "LOCKED";
      if (phase.code === "ADAPT") status = adaptation?.status === "APPROVED" ? "COMPLETE" : review ? "CURRENT" : "LOCKED";
      return { ...phase, index: index + 1, status };
    });
    const current = phases.find((phase) => phase.status === "CURRENT") || phases[phases.length - 1];
    let state = "OBSERVATION REQUIRED";
    let nextAction = "complete_observation";
    if (draft.valid && !approved) { state = "DECISION READY"; nextAction = "approve_decision"; }
    if (approved && !reconciliation.reviewReady) { state = "EXECUTION OPEN"; nextAction = "continue_execution"; }
    if (reconciliation?.reviewReady && !review) { state = "REVIEW READY"; nextAction = "close_review"; }
    if (review && adaptation?.status !== "APPROVED") { state = "ADAPTATION PROPOSED"; nextAction = "approve_adaptation"; }
    if (adaptation?.status === "APPROVED") { state = "LOOP CLOSED"; nextAction = "view_history"; }
    return {
      version: VERSION,
      date: draft.date,
      state,
      nextAction,
      current,
      phases,
      draft,
      decision,
      reconciliation,
      review,
      adaptation,
      historyCount: Array.isArray(input.history) ? input.history.length : 0
    };
  }

  return Object.freeze({
    VERSION,
    PHASES: PHASES.map((item) => ({ ...item })),
    DOMAIN_ORDER: [...DOMAIN_ORDER],
    stableHash,
    normalizeReadiness,
    normalizePrescription,
    createDecisionSnapshot,
    approveDecision,
    reconcileDecision,
    deriveAdaptation,
    closeReview,
    approveAdaptation,
    buildLoopState
  });
});
