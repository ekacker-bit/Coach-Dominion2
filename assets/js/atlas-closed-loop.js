(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasClosedLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030I.1";
  const VERDICTS = Object.freeze({
    ADVANCE: "ADVANCE",
    MAINTAIN: "MAINTAIN",
    REDUCE: "REDUCE",
    RECOVER: "RECOVER"
  });
  const RESOLUTIONS = new Set(["ACCEPT", "KEEP"]);
  const APPLIED = new Set(["ACTIVE", "APPROVED"]);
  const TRAINING_DOMAINS = Object.freeze(["strength", "running", "core"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function dateIso(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function addDays(value = "", days = 1) {
    const date = dateIso(value);
    if (!date) return null;
    const result = new Date(`${date}T12:00:00Z`);
    result.setUTCDate(result.getUTCDate() + Number(days || 0));
    return result.toISOString().slice(0, 10);
  }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function stableHash(value = "") {
    let hash = 2166136261;
    for (const char of typeof value === "string" ? value : stableJson(value)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function domain(value = "") {
    const code = upper(value);
    return ({ TRAINING: "strength", WORKOUT: "strength", STRENGTH: "strength", RUN: "running", RUNNING: "running", CARDIO: "running", ABS: "core", ABS_CORE: "core", CORE: "core", FUEL: "nutrition", FUELING: "nutrition", NUTRITION: "nutrition" })[code] || text(value).toLowerCase();
  }
  function applicableEntries(ledger = {}) {
    return (Array.isArray(ledger.entries) ? ledger.entries : []).filter((entry) => !["cancelled", "superseded"].includes(text(entry.state).toLowerCase()));
  }
  function effortValue(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 1 && number <= 10 ? number : null;
  }
  function painFound(input = {}, entries = []) {
    return input.readiness?.pain === true || entries.some((entry) => entry.execution?.painReported === true || entry.evidence?.some((item) => item.painReported === true));
  }
  function targetDomains(verdict, entries = []) {
    const planned = entries.map((entry) => domain(entry.module)).filter((item) => TRAINING_DOMAINS.includes(item));
    if (verdict === VERDICTS.ADVANCE) {
      const completed = entries.filter((entry) => entry.complete).map((entry) => domain(entry.module));
      return TRAINING_DOMAINS.filter((item) => completed.includes(item)).slice(0, 1);
    }
    if ([VERDICTS.REDUCE, VERDICTS.RECOVER].includes(verdict)) return [...new Set(planned)];
    return [];
  }
  function definition(verdict, context = {}) {
    const count = Number(context.total || 0);
    const completed = Number(context.completed || 0);
    const label = count ? `${completed}/${count} assignments secured` : "Recovery day secured";
    if (verdict === VERDICTS.RECOVER) return {
      tone: "red",
      headline: "Recovery governs",
      reason: context.pain ? "Pain evidence overrides progression." : "Readiness is RED. More training demand is not justified.",
      impact: "Tomorrow begins with recovery and a fresh Roll Call. Hard work stays held.",
      label,
      requiresApproval: false,
      safetyOverride: true
    };
    if (verdict === VERDICTS.REDUCE) return {
      tone: "yellow",
      headline: "Reduce the next dose",
      reason: `${label}. The current dose was not fully executable.`,
      impact: "If accepted, tomorrow's planned training volume is reduced about 20%; Fuel stays unchanged.",
      label,
      requiresApproval: true,
      safetyOverride: false
    };
    if (verdict === VERDICTS.ADVANCE) return {
      tone: "green",
      headline: "Advance one step",
      reason: `${label} with GREEN readiness${context.effort === null ? "" : ` and ${context.effort}/10 effort`}.`,
      impact: "If accepted, one eligible primary training target advances conservatively tomorrow.",
      label,
      requiresApproval: true,
      safetyOverride: false
    };
    return {
      tone: "neutral",
      headline: "Hold steady",
      reason: `${label}. The evidence supports the current dose, not a change.`,
      impact: "Tomorrow keeps the committed plan.",
      label,
      requiresApproval: false,
      safetyOverride: false
    };
  }

  function buildDecision(input = {}) {
    const date = dateIso(input.date || input.closeout?.date || input.ledger?.date);
    if (!date) throw new Error("A valid operating date is required.");
    const effectiveDate = dateIso(input.effectiveDate) || addDays(date, 1);
    const closeout = input.closeout || null;
    if (upper(closeout?.status) !== "SEALED" || dateIso(closeout?.date) !== date) {
      return {
        version: VERSION,
        date,
        effectiveDate,
        status: "EVIDENCE_OPEN",
        verdict: null,
        headline: "Close the day first",
        reason: "Atlas waits for the sealed Daily Closeout before issuing tomorrow's call.",
        impact: "No change is staged.",
        requiresApproval: false
      };
    }
    const ledger = input.ledger || {};
    const entries = applicableEntries(ledger);
    if (ledger.consistency?.consistent === false) {
      return {
        version: VERSION,
        id: `atlas-loop:${date}:blocked:${stableHash(ledger.consistency.issues || [])}`,
        date,
        effectiveDate,
        status: "BLOCKED",
        verdict: null,
        headline: "Evidence needs review",
        reason: "Assignment-linked proof does not reconcile cleanly.",
        impact: "The committed plan stays unchanged until the evidence conflict is resolved.",
        requiresApproval: false,
        safetyOverride: false,
        confidence: "LOW",
        signals: [{ label: "Evidence", value: "CONFLICT" }],
        targetDomains: []
      };
    }
    const total = Number.isFinite(Number(ledger.total)) ? Number(ledger.total) : entries.length;
    const completed = Number.isFinite(Number(ledger.completed)) ? Number(ledger.completed) : entries.filter((entry) => entry.complete).length;
    const verified = entries.filter((entry) => entry.verified).length;
    const completionRatio = total ? completed / total : 1;
    const readinessState = upper(input.readiness?.state || "UNKNOWN");
    const pain = painFound(input, entries);
    const effort = effortValue(input.effort);
    let verdict = VERDICTS.MAINTAIN;
    if (pain || readinessState === "RED") verdict = VERDICTS.RECOVER;
    else if (total > 0 && completionRatio < 0.75) verdict = VERDICTS.REDUCE;
    else if (readinessState === "GREEN" && total > 0 && completionRatio === 1 && (effort === null || effort <= 8)) verdict = VERDICTS.ADVANCE;
    const details = definition(verdict, { total, completed, pain, effort });
    const confidence = total === 0 ? "MODERATE" : verified === total ? "HIGH" : completed === total ? "MODERATE" : "LOW";
    const targets = targetDomains(verdict, entries);
    const fingerprintBasis = {
      version: VERSION,
      date,
      effectiveDate,
      verdict,
      ledgerFingerprint: ledger.fingerprint || null,
      closeoutRevision: Number(closeout.revision || 1),
      readinessState,
      pain,
      effort,
      targets,
      contractRevision: Number(input.contractRevision || 0),
      weekRevision: Number(input.weekRevision || 0)
    };
    const fingerprint = stableHash(fingerprintBasis);
    const status = details.requiresApproval ? "PROPOSED" : "ACTIVE";
    const decision = {
      version: VERSION,
      id: `atlas-loop:${date}:${fingerprint}`,
      fingerprint,
      date,
      effectiveDate,
      status,
      verdict,
      ...details,
      confidence,
      completion: { completed, total, percent: total ? Math.round(completionRatio * 100) : 100, verified },
      readiness: { state: readinessState, pain },
      effort,
      targetDomains: targets,
      contractRevision: Number(input.contractRevision || 0),
      weekRevision: Number(input.weekRevision || 0),
      signals: [
        { label: "Execution", value: details.label },
        { label: "Readiness", value: pain ? "PAIN" : readinessState },
        { label: "Confidence", value: confidence }
      ],
      generatedAt: input.generatedAt || new Date().toISOString(),
      updatedAt: input.generatedAt || new Date().toISOString()
    };
    decision.calendarOverride = {
      status: "CLOSED_LOOP_OVERRIDE",
      decisionId: decision.id,
      sourceDate: date,
      date: effectiveDate,
      label: decision.headline,
      detail: decision.impact,
      verdict,
      targetDomains: [...targets]
    };
    if (input.previous?.fingerprint === fingerprint) return { ...decision, ...input.previous, signals: decision.signals, calendarOverride: decision.calendarOverride };
    return decision;
  }

  function resolveDecision(decision = {}, resolution = "KEEP", options = {}) {
    const choice = upper(resolution);
    if (!RESOLUTIONS.has(choice)) throw new Error("Choose Accept or Keep current plan.");
    if (decision.status !== "PROPOSED" || !decision.id) return decision;
    const now = options.resolvedAt || new Date().toISOString();
    return {
      ...decision,
      status: choice === "ACCEPT" ? "APPROVED" : "HELD",
      resolution: choice,
      resolvedAt: now,
      approvedAt: choice === "ACCEPT" ? now : null,
      updatedAt: now
    };
  }

  function decisionApplies(decision = null, value = "") {
    return Boolean(decision?.id && APPLIED.has(upper(decision.status)) && dateIso(decision.effectiveDate) === dateIso(value));
  }
  function decisionForDate(history = [], value = "") {
    const date = dateIso(value);
    return (Array.isArray(history) ? history : [])
      .filter((item) => decisionApplies(item, date))
      .sort((left, right) => text(right.updatedAt || right.generatedAt).localeCompare(text(left.updatedAt || left.generatedAt)))[0] || null;
  }
  function scaled(value, factor, minimum = 1) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.max(minimum, Math.round(number * factor)) : value;
  }
  function loadStep(value, unit = "lb") {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return value;
    const step = text(unit).toLowerCase() === "kg" ? 1.25 : 2.5;
    return Math.round((number * 1.025) / step) * step;
  }
  function adjustmentMeta(decision) {
    return { version: VERSION, decisionId: decision.id, sourceDate: decision.date, effectiveDate: decision.effectiveDate, verdict: decision.verdict, headline: decision.headline, reason: decision.reason };
  }
  function applyToStrength(prescription = {}, decision = null, value = "") {
    if (!decisionApplies(decision, value) || prescription.atlasClosedLoop?.decisionId === decision.id) return prescription;
    const meta = adjustmentMeta(decision);
    if (decision.verdict === VERDICTS.RECOVER) return { ...prescription, state: "RECOVERY ONLY", status: "ATLAS RECOVERY", exercises: [], estimatedMinutes: 20, adjustment: { code: "CLOSED_LOOP_RECOVERY", detail: decision.reason }, atlasClosedLoop: meta };
    if (decision.verdict === VERDICTS.REDUCE) return { ...prescription, estimatedMinutes: scaled(prescription.estimatedMinutes, 0.8, 10), exercises: (prescription.exercises || []).map((item) => ({ ...item, sets: scaled(item.sets, 0.8, 1) })), adjustment: { code: "CLOSED_LOOP_REDUCE", detail: decision.reason }, atlasClosedLoop: meta };
    if (decision.verdict === VERDICTS.ADVANCE && decision.targetDomains.includes("strength")) {
      return { ...prescription, exercises: (prescription.exercises || []).map((item, index) => index === 0 ? { ...item, load: loadStep(item.load, item.unit) } : item), adjustment: { code: "CLOSED_LOOP_ADVANCE", detail: decision.reason }, atlasClosedLoop: meta };
    }
    return { ...prescription, atlasClosedLoop: meta };
  }
  function applyToRunning(prescription = {}, decision = null, value = "") {
    if (!decisionApplies(decision, value) || prescription.atlasClosedLoop?.decisionId === decision.id) return prescription;
    const meta = adjustmentMeta(decision);
    if (decision.verdict === VERDICTS.RECOVER) return { ...prescription, status: "PAIN_HOLD", session: prescription.session ? { ...prescription.session, distance: 0, estimatedMinutes: 0, type: "RECOVERY" } : null, steps: [{ code: "STOP", title: "Recovery governs", instruction: decision.reason }], adjustment: { factor: 0, reason: decision.reason }, atlasClosedLoop: meta };
    if (decision.verdict === VERDICTS.REDUCE && prescription.session) return { ...prescription, status: "ADJUSTED", session: { ...prescription.session, distance: Number((Number(prescription.session.distance || 0) * 0.8).toFixed(1)), estimatedMinutes: scaled(prescription.session.estimatedMinutes, 0.8, 1), type: "EASY" }, adjustment: { factor: 0.8, reason: decision.reason }, atlasClosedLoop: meta };
    if (decision.verdict === VERDICTS.ADVANCE && decision.targetDomains.includes("running") && prescription.session) return { ...prescription, session: { ...prescription.session, distance: Number((Number(prescription.session.distance || 0) * 1.05).toFixed(1)), estimatedMinutes: scaled(prescription.session.estimatedMinutes, 1.05, 1) }, adjustment: { factor: 1.05, reason: decision.reason }, atlasClosedLoop: meta };
    return { ...prescription, atlasClosedLoop: meta };
  }
  function applyToCore(prescription = {}, decision = null, value = "") {
    if (!decisionApplies(decision, value) || prescription.atlasClosedLoop?.decisionId === decision.id) return prescription;
    const meta = adjustmentMeta(decision);
    if (decision.verdict === VERDICTS.RECOVER) return { ...prescription, status: "SAFETY_HOLD", session: null, exercises: [], message: decision.reason, atlasClosedLoop: meta };
    if (decision.verdict === VERDICTS.REDUCE) return { ...prescription, status: "ADJUSTED", exercises: (prescription.exercises || []).slice(0, Math.max(1, Math.ceil((prescription.exercises || []).length * 0.8))).map((item) => ({ ...item, sets: scaled(item.sets, 0.8, 1) })), session: prescription.session ? { ...prescription.session, estimatedMinutes: scaled(prescription.session.estimatedMinutes, 0.8, 5) } : null, message: decision.reason, atlasClosedLoop: meta };
    if (decision.verdict === VERDICTS.ADVANCE && decision.targetDomains.includes("core")) return { ...prescription, exercises: (prescription.exercises || []).map((item, index) => index === 0 ? { ...item, sets: Number(item.sets || 0) + 1 } : item), message: decision.reason, atlasClosedLoop: meta };
    return { ...prescription, atlasClosedLoop: meta };
  }
  function applyToDay(day = {}, decision = null, value = "") {
    if (!decisionApplies(decision, value)) return day;
    const targets = new Set(decision.targetDomains || []);
    const activities = (day.activities || []).map((activity) => {
      const itemDomain = domain(activity.module);
      if (!targets.has(itemDomain)) return activity;
      const factor = decision.verdict === VERDICTS.REDUCE ? 0.8 : decision.verdict === VERDICTS.RECOVER ? 0 : decision.verdict === VERDICTS.ADVANCE ? 1.05 : 1;
      return {
        ...activity,
        estimatedMinutes: factor === 0 ? 0 : scaled(activity.estimatedMinutes, factor, 1),
        type: itemDomain === "running" && decision.verdict === VERDICTS.REDUCE ? "EASY" : activity.type,
        atlasClosedLoop: adjustmentMeta(decision)
      };
    });
    return { ...day, activities, atlasClosedLoop: adjustmentMeta(decision) };
  }
  function calendarOverride(decision = null, value = "") {
    return decisionApplies(decision, value) ? { ...decision.calendarOverride } : null;
  }

  return Object.freeze({
    VERSION,
    VERDICTS: { ...VERDICTS },
    TRAINING_DOMAINS: [...TRAINING_DOMAINS],
    dateIso,
    addDays,
    stableHash,
    buildDecision,
    resolveDecision,
    decisionApplies,
    decisionForDate,
    applyToStrength,
    applyToRunning,
    applyToCore,
    applyToDay,
    calendarOverride
  });
});
