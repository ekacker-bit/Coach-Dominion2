(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasCoach = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "028C.1";
  const REASONS = Object.freeze([
    { id: "PAIN", label: "Pain", detail: "Something hurts or feels unsafe." },
    { id: "FATIGUE", label: "Fatigue", detail: "Recovery does not match the planned dose." },
    { id: "TRAVEL", label: "Travel", detail: "Location or schedule changed." },
    { id: "EQUIPMENT", label: "Equipment", detail: "The planned setup is unavailable." },
    { id: "TIME", label: "Time", detail: "The full session will not fit today." },
    { id: "PREFERENCE", label: "Preference", detail: "A movement or format is a poor fit." }
  ]);

  const PLAYBOOK = Object.freeze({
    PAIN: {
      choiceId: "RECOVERY_ONLY",
      execution: "RECOVERY",
      headline: "Stop loaded work and reassess",
      summary: "Recovery governs today. Record the pain in Roll Call before training again.",
      change: "Loaded Strength, Running, and Core work stop for today. Fuel stays unchanged.",
      tradeoff: "Today’s planned stimulus is postponed so pain evidence can guide the next safe order.",
      safetyOverride: true,
      nextAction: "ROLL_CALL"
    },
    FATIGUE: {
      choiceId: "REDUCE_TODAY",
      execution: "REDUCE",
      headline: "Keep the intent. Trim the dose.",
      summary: "Atlas will reduce today’s work by about 25% and remove hard intensity.",
      change: "Main work remains. Secondary volume and intensity come out first.",
      tradeoff: "You give up some volume today to protect the next quality exposure.",
      safetyOverride: false,
      nextAction: "TRAIN"
    },
    TRAVEL: {
      choiceId: "REDUCE_TODAY",
      execution: "REDUCE",
      headline: "Run the travel version",
      summary: "Atlas will condense today’s order into the shortest viable session.",
      change: "Use portable work, keep the primary pattern, and remove optional volume.",
      tradeoff: "The session is less complete, but the program objective and future calendar stay intact.",
      safetyOverride: false,
      nextAction: "TRAIN"
    },
    EQUIPMENT: {
      choiceId: "REDUCE_TODAY",
      execution: "KEEP_DOSE",
      headline: "Swap the tool. Keep the pattern.",
      summary: "Atlas will substitute the unavailable equipment without adding volume or intensity.",
      change: "The movement pattern and effort target stay; the implement changes for today only.",
      tradeoff: "The substitute may be less specific, so no progression is earned from estimated loading.",
      safetyOverride: false,
      nextAction: "TRAIN"
    },
    TIME: {
      choiceId: "REDUCE_TODAY",
      execution: "REDUCE",
      headline: "Execute the minimum effective dose",
      summary: "Atlas will keep the priority work and cut today’s duration by about 25%.",
      change: "Primary work stays. Accessories and optional conditioning come out first.",
      tradeoff: "Lower-priority volume is lost today and is not piled onto tomorrow.",
      safetyOverride: false,
      nextAction: "TRAIN"
    },
    PREFERENCE: {
      choiceId: "REDUCE_TODAY",
      execution: "KEEP_DOSE",
      headline: "Use an equivalent movement",
      summary: "Atlas will keep the training objective and substitute within the same movement pattern.",
      change: "One movement or format changes. Dose, intent, and the approved week remain fixed.",
      tradeoff: "Preference alone does not authorize easier effort, extra volume, or a different objective.",
      safetyOverride: false,
      nextAction: "TRAIN"
    }
  });

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function cleanReason(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function reasonById(reasonId) {
    const id = cleanReason(reasonId);
    return REASONS.find((item) => item.id === id) || null;
  }

  function targetDomain(command = {}) {
    const moduleId = cleanReason(command.primary?.module || command.module || "");
    if (["STRENGTH", "RUNNING", "CORE"].includes(moduleId)) return moduleId;
    return "TRAINING";
  }

  function directiveFor(proposal = {}, context = {}) {
    const date = proposal.date;
    const reasonId = proposal.reasonId;
    const domain = targetDomain(context.command);
    const common = {
      version: VERSION,
      id: `atlas-coach-directive-${date}-${proposal.fingerprint}`,
      status: "APPROVED",
      code: reasonId,
      effectiveDate: date,
      reviewDate: date,
      planChangesApproved: true
    };
    if (reasonId === "PAIN") {
      return {
        ...common,
        changes: [
          ["STRENGTH", "RECOVERY_ONLY", "Stop loaded strength", "Record pain before loaded work resumes.", -100, 0],
          ["RUNNING", "RECOVERY_ONLY", "Stop running intensity", "No hard or long running today.", -100, 0],
          ["CORE", "RECOVERY_ONLY", "Use pain-free recovery only", "Remove loaded or provocative core work.", -100, 0],
          ["FUELING", "HOLD_TARGETS", "Hold Fuel targets", "Do not compensate by restricting food.", 0, 0],
          ["RECOVERY", "PRIORITIZE", "Reassess in Roll Call", "Pain evidence must govern the next order.", 0, 0]
        ].map(([domainId, action, label, detail, volumeDeltaPercent, loadDeltaPercent]) => ({
          domain: domainId, action, label, detail, volumeDeltaPercent, loadDeltaPercent, requiresPlanApproval: false
        }))
      };
    }
    const action = reasonId === "EQUIPMENT" ? "SUBSTITUTE_EQUIPMENT"
      : reasonId === "PREFERENCE" ? "SUBSTITUTE_PATTERN"
        : reasonId === "TRAVEL" ? "TRAVEL_VERSION"
          : "REDUCE_VOLUME";
    const volumeDeltaPercent = ["FATIGUE", "TRAVEL", "TIME"].includes(reasonId) ? -25 : 0;
    return {
      ...common,
      changes: [
        {
          domain,
          action,
          label: proposal.headline,
          detail: proposal.change,
          volumeDeltaPercent,
          loadDeltaPercent: reasonId === "FATIGUE" ? -10 : 0,
          requiresPlanApproval: false
        },
        {
          domain: "FUELING",
          action: "HOLD_TARGETS",
          label: "Hold Fuel targets",
          detail: "A day-only training adjustment does not authorize calorie restriction.",
          volumeDeltaPercent: 0,
          loadDeltaPercent: 0,
          requiresPlanApproval: false
        }
      ]
    };
  }

  function buildProposal(input = {}) {
    const reason = reasonById(input.reasonId);
    if (!reason) throw new Error("Choose what changed today.");
    const command = input.command || {};
    const automaticReview = input.source === "LIVE_ADAPTATION";
    if (!command.adjustment?.available && !automaticReview) throw new Error("This order cannot be changed after execution begins.");
    const date = String(input.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("A current operating date is required.");
    const play = PLAYBOOK[reason.id];
    const fingerprint = stableHash({
      date,
      reasonId: reason.id,
      commandFingerprint: command.orderFingerprint || null,
      contractRevision: Number(input.contractRevision || 0),
      weekRevision: Number(input.weekRevision || 0)
    });
    const proposal = {
      version: VERSION,
      id: `atlas-coach-${date}-${fingerprint}`,
      status: "PROPOSED",
      date,
      reasonId: reason.id,
      reasonLabel: reason.label,
      choiceId: play.choiceId,
      execution: play.execution,
      headline: play.headline,
      summary: play.summary,
      change: play.change,
      tradeoff: play.tradeoff,
      safetyOverride: play.safetyOverride,
      nextAction: play.nextAction,
      commandFingerprint: command.orderFingerprint || null,
      contractRevision: Number(input.contractRevision || 0),
      weekRevision: Number(input.weekRevision || 0),
      source: automaticReview ? "LIVE_ADAPTATION" : "DAILY_COMMAND",
      fingerprint,
      generatedAt: input.generatedAt || new Date().toISOString(),
      expiresAt: `${date}T23:59:59.999Z`
    };
    proposal.directive = directiveFor(proposal, { command });
    proposal.calendarOverride = {
      status: "DAY_OVERRIDE",
      date,
      label: reason.label,
      detail: play.summary,
      window: play.execution === "RECOVERY" ? "RECOVERY" : "CURRENT",
      baseWeekId: input.weekId || null,
      baseWeekRevision: Number(input.weekRevision || 0),
      futureWeekChanged: false
    };
    return proposal;
  }

  function responseContext(proposal = {}, note = "") {
    if (!proposal.id || proposal.status !== "PROPOSED") throw new Error("Review an Atlas adjustment first.");
    return {
      coachProposal: {
        version: proposal.version,
        id: proposal.id,
        reasonId: proposal.reasonId,
        reasonLabel: proposal.reasonLabel,
        execution: proposal.execution,
        headline: proposal.headline,
        summary: proposal.summary,
        change: proposal.change,
        tradeoff: proposal.tradeoff,
        safetyOverride: proposal.safetyOverride,
        nextAction: proposal.nextAction
      },
      directive: proposal.directive,
      calendarOverride: proposal.calendarOverride,
      note: String(note || "").trim().slice(0, 180)
    };
  }

  return Object.freeze({
    VERSION,
    REASONS: REASONS.map((item) => ({ ...item })),
    reasonById,
    buildProposal,
    responseContext
  });
});
