(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasProgressionEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "027B.1";
  const TERMINAL = new Set(["APPLIED", "HELD"]);

  function stableHash(value) {
    const text = JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function sentence(value, fallback) {
    const text = String(value || fallback || "").trim().replace(/\s+/g, " ");
    if (!text) return "Atlas needs more completed work before changing the prescription.";
    const first = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || text;
    return /[.!?]$/.test(first) ? first : `${first}.`;
  }

  function binding(input = {}) {
    return {
      contractId: input.contract?.id || null,
      contractRevision: Number(input.contract?.revision || 0),
      campaignId: input.campaign?.id || null,
      campaignRevision: Number(input.campaign?.revision || input.campaign?.currentWeek || 0),
      programId: input.program?.id || input.program?.programId || null,
      programRevision: Number(input.program?.revision || input.program?.programRevision || 0)
    };
  }

  function strengthCandidate(input = {}) {
    const plan = input.plan;
    const proposal = input.proposal;
    if (!plan || plan.status !== "APPROVED") return null;
    if (!proposal || proposal.planId !== plan.id || Number(proposal.planRevision || 1) !== Number(plan.revision || 1)) {
      return {
        domain: "STRENGTH", status: "LEARNING", tone: "neutral", rank: 10,
        sourceId: plan.id, sourceRevision: Number(plan.revision || 1),
        headline: "Strength prescription is holding",
        prescription: input.nextPrescription || "Execute the next approved Strength session.",
        rationale: "Atlas needs a completed set-level result before changing load, repetitions, or volume.",
        action: null
      };
    }
    const decisions = Array.isArray(proposal.decisions) ? proposal.decisions : [];
    if (proposal.safetyHold || decisions.some((item) => item.action === "SAFETY_HOLD")) {
      return {
        domain: "STRENGTH", status: "BLOCKED", tone: "red", rank: 500,
        sourceId: proposal.id, sourceRevision: Number(proposal.planRevision || 1),
        headline: "Hold loaded Strength work",
        prescription: "Use recovery work only until pain and readiness are cleared.",
        rationale: sentence(decisions.find((item) => item.action === "SAFETY_HOLD")?.reason, "Pain or a stopped session overrides progression."),
        action: { type: "OPEN_SAFETY", label: "Review safety hold", requiresApproval: false }
      };
    }
    const changed = decisions.filter((item) => item.changed && ["PROGRESS_LOAD", "PROGRESS_REPS", "REDUCE_LOAD", "ESTABLISH_BASELINE", "REPEAT"].includes(item.action));
    const display = (changed.length ? changed : decisions).slice(0, 3).map((item) => {
      const load = Number(item.proposedLoad || 0) > 0 ? `${item.proposedLoad} ${item.unit || "lb"}` : null;
      const reps = Number(item.proposedReps || 0) > 0 ? `${item.proposedReps} reps` : null;
      return `${item.exerciseName || item.exerciseCode}: ${[load, reps].filter(Boolean).join(" × ") || item.label || "repeat"}`;
    });
    const first = changed[0] || decisions[0];
    return {
      domain: "STRENGTH",
      status: changed.length ? "AWAITING_APPROVAL" : "READY",
      tone: changed.some((item) => item.action === "REDUCE_LOAD") ? "yellow" : changed.length ? "green" : "neutral",
      rank: changed.length ? 340 : 180,
      sourceId: proposal.id,
      sourceRevision: Number(proposal.planRevision || 1),
      headline: changed.length ? `${changed.length} Strength target${changed.length === 1 ? " is" : "s are"} ready` : `Repeat ${proposal.sessionName || "the Strength exposure"}`,
      prescription: display.join(" · ") || input.nextPrescription || "Repeat the approved Strength prescription.",
      rationale: sentence(first?.reason, "The last result supports another exposure at the current dose."),
      action: changed.length ? { type: "APPLY_STRENGTH", label: "Apply next Strength targets", requiresApproval: true, selectedCodes: changed.map((item) => item.exerciseCode) } : null
    };
  }

  function runningCandidate(input = {}) {
    const block = input.block;
    const proposal = input.proposal;
    if (!block || block.status !== "APPROVED") return null;
    if (!proposal || proposal.blockId !== block.id || Number(proposal.blockRevision || 1) !== Number(block.revision || 1)) {
      return {
        domain: "RUNNING", status: "LEARNING", tone: "neutral", rank: 10,
        sourceId: block.id, sourceRevision: Number(block.revision || 1),
        headline: "Running prescription is holding",
        prescription: input.nextPrescription || "Execute the next approved run.",
        rationale: "Atlas needs at least two judged runs before changing pace or duration.",
        action: null
      };
    }
    if (proposal.code === "RECOVER") {
      return {
        domain: "RUNNING", status: "BLOCKED", tone: "red", rank: 490,
        sourceId: proposal.id, sourceRevision: Number(proposal.blockRevision || 1),
        headline: "Hold Running progression",
        prescription: "Keep the Running plan unchanged and clear the recovery signal first.",
        rationale: sentence(proposal.detail, "Pain evidence overrides pace and duration progression."),
        action: { type: "OPEN_SAFETY", label: "Review recovery", requiresApproval: false }
      };
    }
    const change = proposal.status === "PROPOSED" && ["PROGRESS", "REDUCE"].includes(proposal.code);
    const mode = proposal.progressionMode === "PACE" ? "pace" : "duration";
    const delta = mode === "pace"
      ? `${Math.abs(Number(proposal.paceDeltaSecondsPerUnit || 0))} sec/${proposal.unit || "unit"} faster on quality work`
      : `${Number(proposal.distanceDeltaPercent || 0) > 0 ? "+" : ""}${Number(proposal.durationDeltaPercent ?? proposal.distanceDeltaPercent ?? 0)}% future duration`;
    return {
      domain: "RUNNING",
      status: change ? "AWAITING_APPROVAL" : proposal.status === "COLLECTING" ? "LEARNING" : "READY",
      tone: proposal.tone || "neutral",
      rank: change ? 330 : proposal.code === "REPEAT" ? 170 : 20,
      sourceId: proposal.id,
      sourceRevision: Number(proposal.blockRevision || 1),
      headline: proposal.headline || "Repeat the Running dose",
      prescription: change ? delta : input.nextPrescription || "Repeat the next approved run at its current target.",
      rationale: sentence(proposal.detail, "The current Running dose remains the most defensible next exposure."),
      action: change ? { type: "APPLY_RUNNING", label: "Apply future Running targets", requiresApproval: true } : null
    };
  }

  function coreCandidate(input = {}) {
    const plan = input.plan;
    const review = input.review;
    if (!plan || plan.status !== "APPROVED") return null;
    const recommendation = review?.recommendation || { code: "ESTABLISH", reason: "Complete controlled Core work before progression." };
    if (recommendation.code === "REGRESS") {
      return {
        domain: "CORE", status: "BLOCKED", tone: "red", rank: 480,
        sourceId: `${plan.id}:core-review`, sourceRevision: Number(plan.cycleRevision || 1),
        headline: "Hold Core progression",
        prescription: "Repeat only pain-free regressions and review technique before the next Core exposure.",
        rationale: sentence(recommendation.reason),
        action: { type: "OPEN_SAFETY", label: "Review Core evidence", requiresApproval: false }
      };
    }
    const cycleComplete = Boolean(input.cycleComplete);
    const canProgress = recommendation.code === "PROGRESS_NEXT_CYCLE" && cycleComplete;
    return {
      domain: "CORE",
      status: canProgress ? "AWAITING_APPROVAL" : recommendation.code === "ESTABLISH" ? "LEARNING" : "READY",
      tone: canProgress ? "green" : "neutral",
      rank: canProgress ? 320 : recommendation.code === "REPEAT" ? 160 : 30,
      sourceId: `${plan.id}:core-review:${review?.completedSessions || 0}`,
      sourceRevision: Number(plan.cycleRevision || 1),
      headline: canProgress ? "Next Core cycle is earned" : recommendation.code === "REPEAT" ? "Repeat the Core exposure" : "Core evidence is building",
      prescription: canProgress ? "Add one repetition or five controlled seconds per movement in the next four-week cycle." : input.nextPrescription || "Execute the next approved Core session.",
      rationale: sentence(recommendation.reason),
      action: canProgress ? { type: "APPLY_CORE", label: "Approve next Core cycle", requiresApproval: true } : null
    };
  }

  function buildDecision(input = {}) {
    const bindings = binding(input);
    const candidates = [
      strengthCandidate(input.strength || {}),
      runningCandidate(input.running || {}),
      coreCandidate(input.core || {})
    ].filter(Boolean).sort((left, right) => right.rank - left.rank || left.domain.localeCompare(right.domain));
    const selected = candidates[0] || {
      domain: "PROGRAM", status: "SETUP_REQUIRED", tone: "neutral", rank: 0,
      sourceId: "program-setup", sourceRevision: 0,
      headline: "Activate the training program",
      prescription: "Approve Strength, Running, and Core before Atlas can progress them.",
      rationale: "Progression begins only after an approved prescription produces completed evidence.",
      action: null
    };
    const fingerprint = stableHash({ bindings, sourceId: selected.sourceId, sourceRevision: selected.sourceRevision, status: selected.status, prescription: selected.prescription });
    const id = `atlas-progression:${selected.domain.toLowerCase()}:${fingerprint}`;
    if (input.previous?.id === id && TERMINAL.has(input.previous.status)) return JSON.parse(JSON.stringify(input.previous));
    return {
      version: VERSION,
      id,
      type: "ATLAS_PROGRESSION_ORDER",
      status: selected.status,
      tone: selected.tone,
      domain: selected.domain,
      headline: selected.headline,
      prescription: selected.prescription,
      rationale: sentence(selected.rationale),
      action: selected.action,
      candidates: candidates.map((item) => ({ domain: item.domain, status: item.status, headline: item.headline, prescription: item.prescription, rationale: sentence(item.rationale), sourceId: item.sourceId, sourceRevision: item.sourceRevision })),
      bindings,
      generatedAt: input.generatedAt || new Date().toISOString(),
      safeguard: "This order can revise only the approved training prescription; the Recruit Contract and Dominion Campaign remain unchanged."
    };
  }

  function resolveDecision(decision = {}, outcome = "APPLIED", options = {}) {
    if (!decision.id || !["AWAITING_APPROVAL", "READY", "LEARNING", "BLOCKED"].includes(decision.status)) throw new Error("Atlas has no current progression order to resolve.");
    const status = String(outcome).toUpperCase() === "HELD" ? "HELD" : "APPLIED";
    return {
      ...decision,
      status,
      resolvedAt: options.resolvedAt || new Date().toISOString(),
      resolution: status === "HELD" ? "The approved prescription was retained." : "The next prescription was activated.",
      appliedPlanRevision: options.appliedPlanRevision || null,
      appliedSourceId: options.appliedSourceId || null
    };
  }

  return Object.freeze({ VERSION, buildDecision, resolveDecision, stableHash });
});
