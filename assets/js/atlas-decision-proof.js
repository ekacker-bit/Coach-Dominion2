(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasDecisionProof = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030J.1";
  const APPLIED = new Set(["ACTIVE", "APPROVED"]);
  const FINAL_CODES = new Set(["WORKED", "MIXED", "MISSED", "INSUFFICIENT_EVIDENCE"]);
  const SIGNIFICANT = new Set(["ADVANCE", "REDUCE", "RECOVER"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function dateIso(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function dateValue(value = "") {
    const date = dateIso(value);
    return date ? Date.parse(`${date}T12:00:00Z`) : NaN;
  }
  function dayDistance(left = "", right = "") {
    const from = dateValue(left);
    const to = dateValue(right);
    return Number.isFinite(from) && Number.isFinite(to) ? Math.round((to - from) / 86400000) : null;
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
  function expectationFor(value = "MAINTAIN") {
    const verdict = upper(value);
    if (verdict === "ADVANCE") return {
      code: "EXECUTE_ADVANCE",
      label: "Success looks like",
      text: "Complete the adjusted work without a RED readiness or pain signal."
    };
    if (verdict === "REDUCE") return {
      code: "EXECUTE_REDUCTION",
      label: "Success looks like",
      text: "Complete the bounded dose while readiness holds or improves."
    };
    if (verdict === "RECOVER") return {
      code: "PROTECT_RECOVERY",
      label: "Success looks like",
      text: "Protect hard work and return with a clearer readiness signal."
    };
    return {
      code: "HOLD_DOSE",
      label: "Success looks like",
      text: "Complete the current dose while readiness remains stable."
    };
  }
  function attachExpectation(decision = null) {
    if (!decision || !decision.verdict) return decision;
    return { ...decision, expectation: decision.expectation || expectationFor(decision.verdict) };
  }
  function applicableEntries(ledger = {}) {
    return (Array.isArray(ledger.entries) ? ledger.entries : [])
      .filter((item) => !["cancelled", "superseded"].includes(text(item.state).toLowerCase()));
  }
  function readinessState(readiness = null) {
    return upper(readiness?.state || "UNKNOWN");
  }
  function readinessRank(value = "UNKNOWN") {
    return ({ RED: 0, YELLOW: 1, GREEN: 2 })[upper(value)] ?? null;
  }
  function painFound(readiness = null, entries = []) {
    return readiness?.pain === true || entries.some((entry) => entry.execution?.painReported === true || (entry.evidence || []).some((item) => item?.painReported === true));
  }
  function proofDefinition(code, context = {}) {
    if (code === "WORKED") return {
      tone: "green",
      headline: "Coaching call worked",
      summary: context.verdict === "RECOVER" ? "Recovery protected the next day and readiness moved in the right direction." : "The prescribed adjustment produced the expected response.",
      lesson: "Keep this response in the coaching model."
    };
    if (code === "MIXED") return {
      tone: "yellow",
      headline: "Response was mixed",
      summary: "Part of the expected response appeared, but the evidence does not support repeating the change yet.",
      lesson: "Hold steady and gather one more comparable day."
    };
    if (code === "MISSED") return {
      tone: "red",
      headline: "Coaching call missed",
      summary: context.pain ? "Pain or RED readiness overruled the expected response." : "Execution or readiness moved against the expected response.",
      lesson: "Do not repeat the same adjustment without a new reason."
    };
    return {
      tone: "neutral",
      headline: "Evidence is too thin",
      summary: context.conflict ? "Assignment-linked evidence conflicts and cannot verify the coaching call." : "The next-day record is incomplete, so Atlas will not claim a result.",
      lesson: "Complete Roll Call, assigned work, and Closeout before adapting again."
    };
  }
  function buildProof(input = {}) {
    const decision = attachExpectation(input.decision || null);
    if (!decision?.id || !dateIso(decision.effectiveDate)) return null;
    const effectiveDate = dateIso(decision.effectiveDate);
    const evaluatedDate = dateIso(input.evaluatedAt || input.today) || effectiveDate;
    if (!APPLIED.has(upper(decision.status))) return { status: "NOT_APPLIED", decisionId: decision.id, effectiveDate };
    if (dayDistance(effectiveDate, evaluatedDate) < 0) return { status: "WAITING", decisionId: decision.id, effectiveDate };
    const closeout = input.closeout || null;
    if (upper(closeout?.status) !== "SEALED" || dateIso(closeout?.date) !== effectiveDate) {
      return { status: "WAITING", decisionId: decision.id, effectiveDate };
    }

    const ledger = input.ledger || {};
    const entries = applicableEntries(ledger);
    const total = Number.isFinite(Number(ledger.total)) ? Number(ledger.total) : entries.length;
    const completed = Number.isFinite(Number(ledger.completed)) ? Number(ledger.completed) : entries.filter((item) => item.complete).length;
    const verified = entries.filter((item) => item.verified).length;
    const completionPercent = total ? Math.round((completed / total) * 100) : 100;
    const baselineState = readinessState(input.baselineReadiness || decision.readiness);
    const effectiveState = readinessState(input.effectiveReadiness);
    const baselineRank = readinessRank(baselineState);
    const effectiveRank = readinessRank(effectiveState);
    const readinessDelta = baselineRank === null || effectiveRank === null ? null : effectiveRank - baselineRank;
    const pain = painFound(input.effectiveReadiness, entries);
    const conflict = ledger.consistency?.consistent === false;
    const hasReadiness = effectiveRank !== null;
    const hasExecution = total === 0 || entries.length > 0;
    const evidenceCount = Number(hasReadiness) + Number(hasExecution) + 1;
    const confidence = conflict || evidenceCount < 2 ? "LOW" : total > 0 && verified === total && hasReadiness ? "HIGH" : "MODERATE";
    const verdict = upper(decision.verdict);
    let code = "INSUFFICIENT_EVIDENCE";

    if (!conflict && hasReadiness && hasExecution) {
      if (pain || effectiveState === "RED") code = "MISSED";
      else if (verdict === "ADVANCE") {
        if (completionPercent >= 95 && (readinessDelta === null || readinessDelta >= 0)) code = "WORKED";
        else if (completionPercent < 75 || (readinessDelta !== null && readinessDelta < 0)) code = "MISSED";
        else code = "MIXED";
      } else if (verdict === "REDUCE") {
        if (completionPercent >= 75 && (readinessDelta === null || readinessDelta >= 0)) code = "WORKED";
        else if (completionPercent < 50 || (readinessDelta !== null && readinessDelta < 0)) code = "MISSED";
        else code = "MIXED";
      } else if (verdict === "RECOVER") {
        if (hasReadiness && readinessDelta > 0) code = "WORKED";
        else if (hasReadiness && readinessDelta < 0) code = "MISSED";
        else code = "MIXED";
      } else {
        if (completionPercent >= 90 && (readinessDelta === null || readinessDelta >= 0)) code = "WORKED";
        else if (completionPercent < 75 || (readinessDelta !== null && readinessDelta < 0)) code = "MISSED";
        else code = "MIXED";
      }
    }

    const fingerprintBasis = {
      version: VERSION,
      decisionId: decision.id,
      decisionFingerprint: decision.fingerprint || null,
      effectiveDate,
      ledgerFingerprint: ledger.fingerprint || null,
      closeoutRevision: Number(closeout.revision || 1),
      baselineState,
      effectiveState,
      pain,
      completionPercent,
      confidence,
      code
    };
    const fingerprint = stableHash(fingerprintBasis);
    const prior = input.priorProof;
    if (prior?.fingerprint === fingerprint && FINAL_CODES.has(upper(prior.code))) return { ...prior };
    const definition = proofDefinition(code, { verdict, pain, conflict });
    const now = input.evaluatedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `atlas-proof:${stableHash(decision.id)}:${effectiveDate}`,
      fingerprint,
      decisionId: decision.id,
      sourceDate: dateIso(decision.date),
      effectiveDate,
      status: "EVALUATED",
      code,
      verdict,
      expectation: decision.expectation,
      ...definition,
      confidence,
      verified: confidence !== "LOW" && code !== "INSUFFICIENT_EVIDENCE",
      evidence: {
        completed,
        total,
        completionPercent,
        verified,
        baselineReadiness: baselineState,
        effectiveReadiness: effectiveState,
        readinessDelta,
        pain,
        conflict
      },
      evaluatedAt: now,
      updatedAt: now
    };
  }
  function latestProof(history = [], beforeDate = null) {
    return (Array.isArray(history) ? history : [])
      .filter((item) => FINAL_CODES.has(upper(item?.code)) && (!beforeDate || dateValue(item.effectiveDate) < dateValue(beforeDate)))
      .sort((left, right) => text(right.evaluatedAt || right.updatedAt).localeCompare(text(left.evaluatedAt || left.updatedAt)))[0] || null;
  }
  function decisionResolutionPreserved(base = {}, previous = null) {
    if (!previous || previous.fingerprint !== base.fingerprint) return base;
    return { ...base, ...previous, expectation: base.expectation, cooldown: base.cooldown, calendarOverride: base.calendarOverride };
  }
  function applyCooldown(candidate = null, decisionHistory = [], proofHistory = [], previous = null) {
    const decision = attachExpectation(candidate);
    if (!decision?.id || !decision.verdict || ["RECOVER", "MAINTAIN"].includes(upper(decision.verdict))) return decision;
    const prior = (Array.isArray(decisionHistory) ? decisionHistory : [])
      .filter((item) => item?.id !== decision.id && APPLIED.has(upper(item?.status)) && SIGNIFICANT.has(upper(item?.verdict)) && dateValue(item.effectiveDate) < dateValue(decision.effectiveDate))
      .sort((left, right) => dateValue(right.effectiveDate) - dateValue(left.effectiveDate))[0] || null;
    if (!prior) return decision;
    const elapsed = dayDistance(prior.effectiveDate, decision.effectiveDate);
    const threshold = upper(prior.verdict) === "ADVANCE" ? 2 : 1;
    const proof = (Array.isArray(proofHistory) ? proofHistory : []).find((item) => item?.decisionId === prior.id) || null;
    const conservativeCorrection = upper(prior.verdict) === "ADVANCE" && upper(decision.verdict) === "REDUCE" && upper(proof?.code) === "MISSED";
    if (elapsed === null || elapsed > threshold || conservativeCorrection) return decision;
    const now = decision.generatedAt || decision.updatedAt || new Date().toISOString();
    const basis = { version: VERSION, sourceFingerprint: decision.fingerprint, priorDecisionId: prior.id, priorProof: proof?.code || "PENDING", effectiveDate: decision.effectiveDate };
    const fingerprint = stableHash(basis);
    const held = {
      ...decision,
      id: `atlas-loop:${decision.date}:cooldown:${fingerprint}`,
      fingerprint,
      verdict: "MAINTAIN",
      status: "ACTIVE",
      tone: "neutral",
      headline: "Hold the adjustment",
      reason: proof ? "The last change is still settling. Atlas needs a comparable response before changing direction again." : "The last change has not been evaluated yet.",
      impact: "The current dose stays in place for the next operating day.",
      requiresApproval: false,
      safetyOverride: false,
      targetDomains: [],
      expectation: expectationFor("MAINTAIN"),
      cooldown: { active: true, priorDecisionId: prior.id, priorVerdict: prior.verdict, priorOutcome: proof?.code || "PENDING", daysElapsed: elapsed, releaseAfterDays: threshold },
      generatedAt: now,
      updatedAt: now
    };
    held.calendarOverride = {
      status: "CLOSED_LOOP_OVERRIDE",
      decisionId: held.id,
      sourceDate: held.date,
      date: held.effectiveDate,
      label: held.headline,
      detail: held.impact,
      verdict: held.verdict,
      targetDomains: []
    };
    return decisionResolutionPreserved(held, previous);
  }
  function summarize(history = [], options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const rangeDays = Math.max(1, Number(options.rangeDays || 28));
    const eligible = (Array.isArray(history) ? history : [])
      .filter((item) => FINAL_CODES.has(upper(item?.code)))
      .filter((item) => { const age = dayDistance(item.effectiveDate, today); return age !== null && age >= 0 && age < rangeDays; })
      .sort((left, right) => text(right.evaluatedAt || right.updatedAt).localeCompare(text(left.evaluatedAt || left.updatedAt)));
    const counts = { WORKED: 0, MIXED: 0, MISSED: 0, INSUFFICIENT_EVIDENCE: 0 };
    eligible.forEach((item) => { counts[upper(item.code)] += 1; });
    const verified = counts.WORKED + counts.MIXED + counts.MISSED;
    return {
      version: VERSION,
      rangeDays,
      evaluated: eligible.length,
      verified,
      verifiedPercent: eligible.length ? Math.round((verified / eligible.length) * 100) : 0,
      counts,
      latest: eligible[0] || null
    };
  }

  return Object.freeze({
    VERSION,
    FINAL_CODES: [...FINAL_CODES],
    dateIso,
    dayDistance,
    stableHash,
    expectationFor,
    attachExpectation,
    buildProof,
    latestProof,
    applyCooldown,
    summarize
  });
});
