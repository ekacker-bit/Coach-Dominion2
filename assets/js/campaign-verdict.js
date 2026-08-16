(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCampaignVerdict = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "027E.1";
  const TERMINAL_CAMPAIGN_STATES = new Set(["WON", "CLOSED"]);
  const USABLE_EVIDENCE = new Set(["VERIFIED", "SELF_REPORTED"]);
  const BODY_METRICS = Object.freeze([
    { key: "waist", label: "Waist", unit: "in", better: "LOWER" },
    { key: "body_fat", label: "Body fat", unit: "%", better: "LOWER" },
    { key: "chest", label: "Chest", unit: "in", better: "CONTEXT" },
    { key: "hips", label: "Hips", unit: "in", better: "CONTEXT" },
    { key: "arm", label: "Arm", unit: "in", better: "CONTEXT" },
    { key: "thigh", label: "Thigh", unit: "in", better: "CONTEXT" }
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    return String(value === undefined || value === null ? fallback : value).trim();
  }

  function upper(value, fallback = "") {
    return text(value, fallback).toUpperCase().replace(/[\s-]+/g, "_");
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round(value, places = 1) {
    const parsed = number(value);
    if (parsed === null) return null;
    const factor = 10 ** places;
    return Math.round(parsed * factor) / factor;
  }

  function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function isoDate(value) {
    const direct = text(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
  }

  function addDays(value, days = 0) {
    const date = new Date(`${isoDate(value)}T12:00:00Z`);
    if (!Number.isFinite(date.getTime())) return null;
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function fingerprint(value) {
    const source = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `verdict-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function formatValue(value, unit = "") {
    const parsed = number(value);
    if (parsed === null) return "—";
    const digits = Math.abs(parsed) >= 100 ? 0 : 1;
    return `${round(parsed, digits)}${unit ? ` ${unit}` : ""}`;
  }

  function bodySummary(outcome = {}, photos = [], campaign = {}) {
    const metrics = [];
    const weight = outcome.weight || {};
    if (number(weight.baselineAverage) !== null && number(weight.sevenDayAverage) !== null) {
      metrics.push({
        key: "weight",
        label: "Weight",
        unit: "lb",
        start: round(weight.baselineAverage, 1),
        finish: round(weight.sevenDayAverage, 1),
        change: round(number(weight.sevenDayAverage) - number(weight.baselineAverage), 1),
        better: "CONTEXT"
      });
    }
    BODY_METRICS.forEach((definition) => {
      const item = outcome.measurements?.summaries?.[definition.key] || {};
      if (number(item.baseline) === null || number(item.latest) === null || Number(item.observations || 0) < 2) return;
      metrics.push({
        ...definition,
        start: round(item.baseline, 1),
        finish: round(item.latest, 1),
        change: round(number(item.latest) - number(item.baseline), 1),
        startDate: item.series?.[0]?.date || null,
        finishDate: item.latestDate || null
      });
    });
    const startDate = campaign.startDate || "0000-00-00";
    const endDate = campaign.endDate || "9999-99-99";
    const photoRows = (Array.isArray(photos) ? photos : [])
      .filter((item) => isoDate(item?.date) && item.date >= startDate && item.date <= endDate);
    const photoDates = [...new Set(photoRows.map((item) => isoDate(item.date)))].sort();
    return {
      complete: Number(outcome.measurements?.count || 0) >= 2,
      checkpoints: Number(outcome.measurements?.count || 0),
      confidence: clamp(outcome.confidence),
      metrics,
      photos: {
        checkpoints: photoDates.length,
        startDate: photoDates[0] || null,
        finishDate: photoDates.at(-1) || null,
        comparable: photoDates.length >= 2,
        images: photoRows.length
      }
    };
  }

  function performanceSignal(entry = {}) {
    const domain = upper(entry.domain);
    const metrics = entry.metrics || {};
    const label = text(entry.activityName || entry.sessionName || entry.activityCode, domain.replaceAll("_", " "));
    const key = `${domain}:${text(entry.activityCode || label).toLowerCase()}`;
    const date = isoDate(entry.performanceDate || entry.date || entry.completedAt);
    if (!date || !USABLE_EVIDENCE.has(upper(entry.evidenceStatus || "SELF_REPORTED"))) return null;
    if (domain === "STRENGTH") {
      const weight = number(metrics.weight);
      const repetitions = Math.max(1, number(metrics.repetitions) || 1);
      if (weight === null || weight <= 0) return null;
      return { key, domain, label, date, value: weight * (1 + repetitions / 30), unit: metrics.weight_unit || metrics.weightUnit || "lb est. 1RM", better: "HIGHER" };
    }
    if (domain === "RUNNING") {
      const distance = number(metrics.distance);
      const duration = number(metrics.duration_seconds ?? metrics.durationSeconds);
      if (distance === null || distance <= 0 || duration === null || duration <= 0) return null;
      return { key, domain, label, date, value: duration / distance, unit: `sec/${metrics.distance_unit || metrics.distanceUnit || "unit"}`, better: "LOWER" };
    }
    if (domain === "FITNESS_TEST") {
      const value = number(metrics.test_event_value ?? metrics.measurement_value ?? metrics.score);
      if (value === null) return null;
      return { key, domain, label, date, value, unit: metrics.unit || metrics.measurement_unit || "", better: upper(metrics.direction || "HIGHER") };
    }
    if (domain === "CORE") {
      const value = number(metrics.repetitions ?? metrics.duration_seconds ?? metrics.durationSeconds);
      if (value === null || value <= 0) return null;
      return { key, domain, label, date, value, unit: number(metrics.repetitions) !== null ? "reps" : "sec", better: "HIGHER" };
    }
    return null;
  }

  function performanceSummary(entries = [], campaign = {}) {
    const startDate = campaign.startDate || "0000-00-00";
    const endDate = campaign.endDate || "9999-99-99";
    const signals = (Array.isArray(entries) ? entries : [])
      .map(performanceSignal)
      .filter((item) => item && item.date >= startDate && item.date <= endDate)
      .sort((left, right) => left.date.localeCompare(right.date));
    const byKey = new Map();
    signals.forEach((item) => {
      if (!byKey.has(item.key)) byKey.set(item.key, []);
      byKey.get(item.key).push(item);
    });
    const comparisons = [...byKey.values()].map((items) => {
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last || first.date === last.date) return null;
      const raw = last.value - first.value;
      const improvement = first.better === "LOWER" ? -raw : raw;
      const percent = first.value ? improvement / Math.abs(first.value) * 100 : null;
      return {
        key: first.key,
        domain: first.domain,
        label: first.label,
        unit: first.unit,
        start: round(first.value, 1),
        finish: round(last.value, 1),
        startDate: first.date,
        finishDate: last.date,
        change: round(raw, 1),
        improvement: round(improvement, 1),
        improvementPercent: round(percent, 1),
        direction: improvement > 0 ? "IMPROVED" : improvement < 0 ? "DECLINED" : "HELD"
      };
    }).filter(Boolean);
    comparisons.sort((left, right) => Math.abs(right.improvementPercent || 0) - Math.abs(left.improvementPercent || 0));
    return {
      complete: comparisons.length > 0,
      evidenceCount: signals.length,
      comparisons,
      improved: comparisons.filter((item) => item.direction === "IMPROVED").length,
      held: comparisons.filter((item) => item.direction === "HELD").length,
      declined: comparisons.filter((item) => item.direction === "DECLINED").length
    };
  }

  function adaptationSummary(outcomes = [], campaign = {}) {
    const startDate = campaign.startDate || "0000-00-00";
    const endDate = campaign.endDate || "9999-99-99";
    const rows = (Array.isArray(outcomes) ? outcomes : [])
      .filter((item) => {
        const date = isoDate(item.reviewDate || item.updatedAt);
        return date && date >= startDate && date <= endDate && !["WAITING", "NOT_APPLIED"].includes(upper(item.code));
      });
    const verified = rows.filter((item) => item.verified === true && item.status === "ACKNOWLEDGED");
    const worked = verified.filter((item) => ["HELPED", "HELD_STANDARD"].includes(upper(item.code)));
    const lessons = [...new Map(worked.map((item) => [item.calibrationTag || item.id, {
      tag: item.calibrationTag || null,
      headline: text(item.headline, "Verified Atlas lesson"),
      lesson: text(item.lesson, "The verified response can inform the next campaign."),
      confidence: item.confidence || "MODERATE"
    }])).values()].slice(0, 4);
    return {
      evaluated: rows.length,
      verified: verified.length,
      worked: worked.length,
      challenged: rows.filter((item) => item.status === "CHALLENGED").length,
      lessons
    };
  }

  function verdictDecision(campaign = {}) {
    const conditions = campaign.conditions || [];
    const passed = conditions.filter((item) => item.passed).length;
    const won = campaign.status === "WON" || (conditions.length >= 5 && passed === conditions.length);
    if (won) return {
      code: "ADVANCE",
      label: "CAMPAIGN WON",
      tone: "green",
      headline: "The standard was earned",
      detail: "Execution, proof, qualifying weeks, outcome evidence, and standards all cleared the declared campaign test.",
      nextMission: "Raise the next mission from demonstrated capacity."
    };
    if (passed >= 3 && Number(campaign.execution?.rate || 0) >= 70) return {
      code: "RE_ENLIST",
      label: "RE-ENLIST",
      tone: "yellow",
      headline: "Progress was real. The full standard was not earned.",
      detail: "Carry the demonstrated gains forward and correct the named gaps before raising demand.",
      nextMission: "Re-enlist against the missed conditions with the proven lessons intact."
    };
    return {
      code: "RECOMMISSION",
      label: "RECOMMISSION",
      tone: "red",
      headline: "The campaign closed short",
      detail: "The next Contract should preserve the evidence and rebuild the operating approach around the missed conditions.",
      nextMission: "Recommission the same objective with a more executable commitment."
    };
  }

  function nextAction(status, campaign = {}, decision = {}) {
    if (status === "ACTIVE") return { code: "FINISH_CAMPAIGN", label: `Finish Week ${campaign.currentWeek || 1}`, section: "today" };
    if (status === "EVIDENCE_DUE") return { code: "CAPTURE_FINISH", label: "Log final checkpoint", section: "trends" };
    if (status === "READY_TO_SEAL") return { code: "SEAL_VERDICT", label: "Issue Campaign Verdict", section: "program" };
    if (status === "REENLISTMENT_READY") return { code: "REVIEW_NEXT_CONTRACT", label: "Review next Contract", section: "contract" };
    return { code: "PREPARE_REENLISTMENT", label: decision.code === "ADVANCE" ? "Set next mission" : "Prepare re-enlistment", section: "program" };
  }

  function buildVerdict(input = {}) {
    const campaign = input.campaign || null;
    if (!campaign?.id) return null;
    const previous = input.previous?.campaignId === campaign.id ? input.previous : null;
    if (previous?.status === "SEALED" || previous?.status === "REENLISTMENT_READY") return clone(previous);
    const today = isoDate(input.today || new Date().toISOString());
    const ended = TERMINAL_CAMPAIGN_STATES.has(upper(campaign.status)) || Boolean(today && campaign.endDate && today > campaign.endDate);
    const body = bodySummary(input.bodyOutcome || {}, input.photos || [], campaign);
    const performance = performanceSummary(input.performanceEntries || [], campaign);
    const adaptations = adaptationSummary(input.adaptationOutcomes || [], campaign);
    const decision = verdictDecision(campaign);
    const earned = (campaign.conditions || []).filter((item) => item.passed).map((item) => ({ id: item.id, label: item.label, detail: item.detail }));
    const missed = (campaign.conditions || []).filter((item) => !item.passed).map((item) => ({ id: item.id, label: item.label, detail: item.detail }));
    const learned = adaptations.lessons.length
      ? adaptations.lessons
      : [{ tag: "CAMPAIGN_RECORD", headline: "The campaign record is preserved", lesson: performance.complete ? `${performance.improved} performance signal${performance.improved === 1 ? "" : "s"} improved.` : "The next campaign needs a comparable performance benchmark.", confidence: performance.complete ? "MODERATE" : "LOW" }];
    const status = !ended ? "ACTIVE" : !body.complete ? "EVIDENCE_DUE" : "READY_TO_SEAL";
    const result = {
      version: VERSION,
      id: `campaign-verdict:${campaign.id}`,
      campaignId: campaign.id,
      contractId: campaign.contractId || input.contract?.id || null,
      contractRevision: Number(campaign.contractRevision || input.contract?.revision || 0),
      status,
      decision,
      campaign: {
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        executionRate: Number(campaign.execution?.rate || 0),
        evidenceRate: Number(campaign.evidence?.rate || 0),
        qualifyingWeeks: Number(campaign.weekly?.qualifying || 0),
        conditionsPassed: earned.length,
        conditionsTotal: (campaign.conditions || []).length,
        objective: clone(campaign.objective || {})
      },
      body,
      performance,
      adaptations,
      earned,
      missed,
      learned,
      nextMission: decision.nextMission,
      nextAction: nextAction(status, campaign, decision),
      generatedAt: input.generatedAt || new Date().toISOString(),
      sealedAt: null,
      reEnlistment: null
    };
    result.fingerprint = fingerprint({ campaign: result.campaign, body, performance, adaptations, earned, missed, decision: decision.code });
    return result;
  }

  function sealVerdict(model = {}, options = {}) {
    if (model.status !== "READY_TO_SEAL") throw new Error("The campaign verdict is not ready to issue.");
    const sealedAt = options.sealedAt || new Date().toISOString();
    return {
      ...clone(model),
      status: "SEALED",
      sealedAt,
      updatedAt: sealedAt,
      nextAction: nextAction("SEALED", {}, model.decision)
    };
  }

  function reEnlistmentSeed(verdict = {}, contract = {}, options = {}) {
    if (verdict.status !== "SEALED") throw new Error("Issue the campaign verdict before preparing the next Contract.");
    const createdAt = options.createdAt || new Date().toISOString();
    return {
      sourceVerdictId: verdict.id,
      sourceCampaignId: verdict.campaignId,
      sourceContractId: verdict.contractId,
      sourceContractRevision: verdict.contractRevision,
      decision: verdict.decision?.code || "RE_ENLIST",
      objective: clone(verdict.campaign?.objective || {}),
      carryForward: {
        primaryGoal: contract.primaryGoal || null,
        target: contract.target || null,
        trainingDaysPerWeek: contract.trainingDaysPerWeek || null,
        strengthDaysPerWeek: contract.strengthDaysPerWeek || null,
        runningDaysPerWeek: contract.runningDaysPerWeek || null,
        coreDaysPerWeek: contract.coreDaysPerWeek || null,
        sessionMinutes: contract.sessionMinutes || null,
        twoADays: contract.twoADays === true,
        nutritionCommitment: contract.nutritionCommitment || null
      },
      evidence: {
        executionRate: verdict.campaign?.executionRate || 0,
        evidenceRate: verdict.campaign?.evidenceRate || 0,
        conditionsPassed: verdict.campaign?.conditionsPassed || 0,
        conditionsTotal: verdict.campaign?.conditionsTotal || 0,
        bodyMetrics: verdict.body?.metrics?.length || 0,
        performanceComparisons: verdict.performance?.comparisons?.length || 0,
        verifiedAdaptations: verdict.adaptations?.worked || 0
      },
      missedConditions: clone(verdict.missed || []),
      verifiedLessons: clone(verdict.adaptations?.lessons || []),
      nextMission: verdict.nextMission,
      createdAt
    };
  }

  function withReEnlistment(verdict = {}, draft = {}, options = {}) {
    if (verdict.status !== "SEALED") throw new Error("A sealed verdict is required before re-enlistment.");
    const updatedAt = options.updatedAt || new Date().toISOString();
    return {
      ...clone(verdict),
      status: "REENLISTMENT_READY",
      reEnlistment: {
        draftId: draft.id || draft.fingerprint || null,
        draftStatus: draft.status || "READY_FOR_APPROVAL",
        preparedAt: updatedAt
      },
      nextAction: nextAction("REENLISTMENT_READY", {}, verdict.decision),
      updatedAt
    };
  }

  return Object.freeze({
    VERSION,
    TERMINAL_CAMPAIGN_STATES,
    BODY_METRICS,
    isoDate,
    addDays,
    performanceSignal,
    bodySummary,
    performanceSummary,
    adaptationSummary,
    verdictDecision,
    buildVerdict,
    sealVerdict,
    reEnlistmentSeed,
    withReEnlistment,
    formatValue
  });
});
