(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionMorningVerification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025E.1";
  const DECISIONS = Object.freeze({
    PROCEED: "PROCEED",
    REDUCE_TODAY: "REDUCE_TODAY",
    RECOVERY_ONLY: "RECOVERY_ONLY"
  });

  function text(value = "") {
    return String(value ?? "").trim();
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
    return (hash >>> 0).toString(36);
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function progress(order = {}) {
    const tasks = Array.isArray(order.tasks) ? order.tasks : [];
    const completed = tasks.filter((task) => upper(task.status) === "COMPLETE").length;
    return {
      completed,
      total: tasks.length,
      complete: tasks.length === 0 || completed === tasks.length
    };
  }

  function baselineConcerns(profile = {}) {
    return ["sleep", "resting_heart_rate", "heart_rate_variability"]
      .map((key) => ({ key, metric: profile?.metrics?.[key], signal: profile?.metrics?.[key]?.signal }))
      .filter((item) => item.signal && item.signal.status !== "UNAVAILABLE" && Number(item.signal.severity || 0) > 0)
      .sort((left, right) => Number(right.signal.severity || 0) - Number(left.signal.severity || 0));
  }

  function latestPrior(items = [], today = "") {
    return (Array.isArray(items) ? items : [])
      .filter((item) => item?.date && (!today || item.date < today))
      .sort((left, right) => String(right.updatedAt || right.submittedAt || right.completedAt || right.date).localeCompare(String(left.updatedAt || left.submittedAt || left.completedAt || left.date)))[0] || null;
  }

  function decisionPolicy(code) {
    if (code === DECISIONS.RECOVERY_ONLY) {
      return {
        code,
        tone: "red",
        headline: "Recovery only",
        detail: "Training is held today. Complete the recovery order and reassess tomorrow.",
        action: "RECOVERY",
        actionLabel: "Open recovery",
        dailyOverride: {
          scope: "TODAY_ONLY",
          readinessState: "RED",
          volumeMultiplier: 0,
          intensityCap: "RECOVERY",
          trainingAllowed: false
        }
      };
    }
    if (code === DECISIONS.REDUCE_TODAY) {
      return {
        code,
        tone: "yellow",
        headline: "Reduce today",
        detail: "Keep the approved work, remove optional intensity, and reduce volume for today only.",
        action: "MISSION",
        actionLabel: "Open reduced mission",
        dailyOverride: {
          scope: "TODAY_ONLY",
          readinessState: "YELLOW",
          volumeMultiplier: 0.8,
          intensityCap: "EASY",
          trainingAllowed: true
        }
      };
    }
    return {
      code: DECISIONS.PROCEED,
      tone: "green",
      headline: "Mission cleared",
      detail: "Execute the approved mission exactly as written.",
      action: "MISSION",
      actionLabel: "Open mission",
      dailyOverride: {
        scope: "TODAY_ONLY",
        readinessState: "GREEN",
        volumeMultiplier: 1,
        intensityCap: null,
        trainingAllowed: true
      }
    };
  }

  function signal(label, value, reason, tone = "neutral", priority = 0) {
    return { label, value: text(value), reason: text(reason), tone, priority };
  }

  function evaluate(input = {}) {
    const date = text(input.date || input.rollCall?.date);
    const rollCall = input.rollCall || null;
    if (!date || !rollCall || rollCall.date !== date) {
      return {
        code: "ROLL_CALL_REQUIRED",
        policy: null,
        reasons: ["Today’s Roll Call has not been secured."],
        signals: [signal("TODAY", "ROLL CALL NEEDED", "Energy, soreness, and pain are required before clearance.", "neutral", 100)]
      };
    }

    const readiness = input.readiness || {};
    const state = upper(readiness.state || "YELLOW");
    const energy = numberOrNull(rollCall.energy);
    const soreness = numberOrNull(rollCall.soreness);
    const debrief = input.priorDebrief || latestPrior(input.debriefHistory, date);
    const order = input.priorRecoveryOrder || latestPrior(input.recoveryHistory, date);
    const recovery = progress(order || {});
    const concerns = baselineConcerns(input.baselineProfile);
    const reasons = [];
    const signals = [];
    let code = DECISIONS.PROCEED;

    const painToday = rollCall.pain === true || state === "RED";
    const priorPainSignal = Boolean(debrief?.painReported || upper(debrief?.coachingDecision?.code) === "SAFETY_HOLD");
    const priorSafetyHold = Boolean((order?.safetyHold || priorPainSignal) && (!order?.id || !recovery.complete));
    const severelyReduced = (energy !== null && energy <= 3) || (soreness !== null && soreness >= 8);
    const priorStrain = Boolean(
      priorPainSignal
      || debrief?.techniqueLimited
      || upper(debrief?.executionQuality) === "TECHNIQUE_LIMITED"
      || numberOrNull(debrief?.effort) >= 9
      || (numberOrNull(debrief?.recoveryConfidence) !== null && numberOrNull(debrief?.recoveryConfidence) <= 4)
    );
    const unresolvedRecovery = Boolean(order?.id && !recovery.complete);

    if (painToday) {
      code = DECISIONS.RECOVERY_ONLY;
      reasons.push("Pain or RED readiness overrides training.");
      signals.push(signal("TODAY", "PAIN HOLD", "Pain is the controlling signal.", "red", 100));
    } else if (priorSafetyHold) {
      code = DECISIONS.RECOVERY_ONLY;
      reasons.push("The latest safety hold has not been cleared by a pain-free morning decision.");
      signals.push(signal("YESTERDAY", "SAFETY HOLD", "The prior pain safeguard remains controlling.", "red", 95));
    } else if (severelyReduced) {
      code = DECISIONS.RECOVERY_ONLY;
      reasons.push("Today’s subjective readiness is below the minimum training threshold.");
      signals.push(signal("TODAY", energy !== null && energy <= 3 ? `ENERGY ${energy}/10` : `SORENESS ${soreness}/10`, "Current capacity is too low for loaded work.", "red", 90));
    } else if (state === "YELLOW" || priorStrain || unresolvedRecovery) {
      code = DECISIONS.REDUCE_TODAY;
      if (state === "YELLOW") reasons.push("Today’s readiness requires reduced execution.");
      if (priorStrain) reasons.push("The latest debrief indicates unusually high strain or limited recovery.");
      if (unresolvedRecovery) reasons.push("The latest recovery order is not fully secured.");
      if (concerns.length && state === "YELLOW") reasons.push("Personal baseline evidence corroborates reduced recovery capacity.");
    } else {
      reasons.push("Today’s readiness and the latest recovery evidence support the approved mission.");
    }

    if (!signals.some((item) => item.label === "TODAY")) {
      signals.push(signal(
        "TODAY",
        state,
        `Energy ${energy ?? "—"}/10 · soreness ${soreness ?? "—"}/10 · ${rollCall.pain ? "pain" : "no pain"}.`,
        state === "GREEN" ? "green" : state === "RED" ? "red" : "yellow",
        80
      ));
    }
    if (order?.id) {
      signals.push(signal(
        "RECOVERY",
        recovery.complete ? "SECURED" : `${recovery.completed}/${recovery.total}`,
        recovery.complete ? "The latest order is complete." : "The latest order remains open.",
        recovery.complete ? "green" : order.safetyHold ? "red" : "yellow",
        unresolvedRecovery ? 85 : 40
      ));
    } else if (debrief?.id) {
      signals.push(signal(
        "LAST SESSION",
        debrief.painReported ? "PAIN" : debrief.executionQuality === "TECHNIQUE_LIMITED" ? "LIMITED" : `EFFORT ${debrief.effort ?? "—"}/10`,
        `Recovery confidence ${debrief.recoveryConfidence ?? "—"}/10.`,
        priorStrain ? "yellow" : "green",
        priorStrain ? 75 : 35
      ));
    }
    if (concerns.length) {
      const item = concerns[0];
      const ratio = Number(item.signal.ratio || 0);
      const percent = Math.round(Math.abs(1 - ratio) * 100);
      const direction = item.key === "resting_heart_rate" ? "above" : "below";
      signals.push(signal("BASELINE", item.signal.status, `${item.metric.label} is ${percent}% ${direction} the 28-day median.`, item.signal.severity >= 2 ? "red" : "yellow", 70));
    }

    return {
      code,
      policy: decisionPolicy(code),
      reasons,
      signals: signals
        .filter((item, index, list) => list.findIndex((candidate) => candidate.label === item.label && candidate.value === item.value) === index)
        .sort((left, right) => right.priority - left.priority)
        .slice(0, 3)
        .map(({ priority, ...item }) => item),
      source: {
        readinessState: state,
        rollCallDate: rollCall.date,
        priorDebriefId: debrief?.id || null,
        priorRecoveryOrderId: order?.id || null,
        priorRecoveryComplete: order?.id ? recovery.complete : null,
        baselineState: input.baselineProfile?.state || "LEARNING"
      }
    };
  }

  function buildReceipt(input = {}) {
    const date = text(input.date || input.rollCall?.date);
    const result = evaluate(input);
    if (result.code === "ROLL_CALL_REQUIRED") return null;
    const previous = input.previous?.date === date ? input.previous : null;
    const fingerprint = stableHash({
      date,
      code: result.code,
      reasons: result.reasons,
      signals: result.signals,
      source: result.source,
      dailyOverride: result.policy.dailyOverride
    });
    if (previous?.fingerprint === fingerprint) return previous;
    const now = input.now || new Date().toISOString();
    return {
      version: VERSION,
      id: `morning-verification:${date}`,
      type: "MORNING_VERIFICATION",
      date,
      status: "ISSUED",
      code: result.code,
      tone: result.policy.tone,
      headline: result.policy.headline,
      detail: result.policy.detail,
      action: result.policy.action,
      actionLabel: result.policy.actionLabel,
      reasons: result.reasons,
      signals: result.signals,
      source: result.source,
      dailyOverride: result.policy.dailyOverride,
      planMutationAllowed: false,
      fingerprint,
      revision: Math.max(1, Number(previous?.revision || 0) + 1),
      issuedAt: previous?.issuedAt || now,
      updatedAt: now
    };
  }

  function applyToReadiness(receipt = null, readiness = {}) {
    if (!receipt?.dailyOverride) return { ...(readiness || {}) };
    const code = receipt.code;
    if (code === DECISIONS.RECOVERY_ONLY) return { ...(readiness || {}), pain: true, state: "RED" };
    if (code === DECISIONS.REDUCE_TODAY) {
      return {
        ...(readiness || {}),
        pain: false,
        state: "YELLOW",
        energy: Math.min(numberOrNull(readiness?.energy) ?? 5, 5),
        soreness: Math.max(numberOrNull(readiness?.soreness) ?? 6, 6)
      };
    }
    return { ...(readiness || {}), state: upper(readiness?.state || "GREEN") };
  }

  function upsert(items = [], receipt = {}, limit = 90) {
    if (!receipt?.id) return Array.isArray(items) ? items : [];
    return [receipt, ...(Array.isArray(items) ? items : []).filter((item) => item.id !== receipt.id)]
      .sort((left, right) => String(right.updatedAt || right.issuedAt || "").localeCompare(String(left.updatedAt || left.issuedAt || "")))
      .slice(0, limit);
  }

  return Object.freeze({
    VERSION,
    DECISIONS,
    stableHash,
    progress,
    baselineConcerns,
    latestPrior,
    evaluate,
    buildReceipt,
    applyToReadiness,
    upsert
  });
});
