(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasDecisionCenter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025W.1";
  const CATEGORY_PRIORITY = Object.freeze({
    SAFETY: 100,
    INTEGRITY: 92,
    CALENDAR: 84,
    EVIDENCE: 76,
    PROGRESSION: 68,
    WEEK: 60,
    COACHING: 52
  });
  const FEEDBACK_REASONS = Object.freeze({
    TIMING: Object.freeze({ label: "Timing does not work", detail: "Keep the call open and record that its timing needs review." }),
    CONSTRAINT: Object.freeze({ label: "A constraint is missing", detail: "Record a schedule, equipment, recovery, or life constraint for the source review." }),
    EVIDENCE_DISPUTED: Object.freeze({ label: "The evidence looks wrong", detail: "Flag the source evidence for reconciliation before the call is accepted." }),
    PREFER_HOLD: Object.freeze({ label: "I prefer to hold", detail: "Record a preference to keep the current approved prescription unchanged." })
  });
  const CATEGORY_RULES = Object.freeze({
    SAFETY: "Safety evidence outranks progression and schedule convenience.",
    INTEGRITY: "Conflicting approved records must be reconciled before Atlas advances the program.",
    CALENDAR: "Structural plan changes require a deliberate future-calendar review.",
    EVIDENCE: "Conflicting or incomplete evidence must be reconciled before Atlas judges execution.",
    PROGRESSION: "Only verified completed work can support a future progression call.",
    WEEK: "The next week changes only through one coordinated recruit approval.",
    COACHING: "Atlas keeps the current prescription until the recruit makes a deliberate choice."
  });

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
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

  function normalizeEvidence(evidence = []) {
    return (Array.isArray(evidence) ? evidence : [])
      .map((item) => {
        if (typeof item === "string") return { label: "Signal", value: item, source: "Program evidence" };
        if (!item || typeof item !== "object") return null;
        const value = item.value === 0 ? "0" : String(item.value || "").trim();
        if (!value) return null;
        return {
          label: String(item.label || "Signal").trim(),
          value,
          source: String(item.source || "Program evidence").trim()
        };
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  function normalizeConfidence(value, evidenceCount = 0) {
    const confidence = upper(value);
    if (["HIGH", "MODERATE", "LOW"].includes(confidence)) return confidence;
    return evidenceCount >= 3 ? "HIGH" : evidenceCount >= 1 ? "MODERATE" : "LOW";
  }

  function normalize(candidate = {}, index = 0) {
    const category = CATEGORY_PRIORITY[upper(candidate.category)] ? upper(candidate.category) : "COACHING";
    const urgency = Math.max(0, Math.min(9, Math.round(Number(candidate.urgency || 0))));
    const route = candidate.route && typeof candidate.route === "object" ? { ...candidate.route } : { section: "today" };
    const id = String(candidate.id || `${category.toLowerCase()}-${index + 1}`);
    const evidence = normalizeEvidence(candidate.evidence);
    const decision = {
      version: VERSION,
      id,
      domain: upper(candidate.domain || category),
      category,
      priority: CATEGORY_PRIORITY[category] + urgency,
      title: String(candidate.title || "Review the next decision"),
      detail: String(candidate.detail || "Atlas needs a deliberate choice before this item can advance."),
      consequence: String(candidate.consequence || "Nothing changes until you review the source decision."),
      actionLabel: String(candidate.actionLabel || "Review decision"),
      route,
      sourceStatus: upper(candidate.sourceStatus || "OPEN"),
      sourceRevision: candidate.sourceRevision ?? null,
      evidence,
      confidence: normalizeConfidence(candidate.confidence, evidence.length),
      rule: String(candidate.rule || CATEGORY_RULES[category]),
      generatedAt: candidate.generatedAt || null
    };
    decision.fingerprint = stableHash({
      id: decision.id,
      category: decision.category,
      domain: decision.domain,
      sourceStatus: decision.sourceStatus,
      sourceRevision: decision.sourceRevision,
      route: decision.route
    });
    return decision;
  }

  function buildCenter(input = {}) {
    const candidates = Array.isArray(input.candidates) ? input.candidates : [];
    const unique = new Map();
    candidates
      .filter((candidate) => candidate && upper(candidate.status || "OPEN") === "OPEN")
      .map(normalize)
      .forEach((decision) => {
        const current = unique.get(decision.id);
        if (!current || decision.priority > current.priority) unique.set(decision.id, decision);
      });
    const feedback = (Array.isArray(input.feedback) ? input.feedback : [])
      .filter((item) => item?.type === "RECRUIT_FEEDBACK" && item.decisionFingerprint)
      .sort((left, right) => String(right.recordedAt || "").localeCompare(String(left.recordedAt || "")));
    const decisions = [...unique.values()].sort((left, right) =>
      right.priority - left.priority
      || String(left.domain).localeCompare(String(right.domain))
      || String(left.id).localeCompare(String(right.id))
    ).map((decision, index) => ({
      ...decision,
      order: index + 1,
      primary: index === 0,
      recruitFeedback: feedback.find((item) => item.decisionFingerprint === decision.fingerprint) || null
    }));
    const count = decisions.length;
    const primary = decisions[0] || null;
    return {
      version: VERSION,
      status: count ? "DECISION_REQUIRED" : "CLEAR",
      tone: primary?.category === "SAFETY" ? "red" : count ? "yellow" : "green",
      count,
      headline: count ? (count === 1 ? "Atlas needs one decision" : `Atlas needs ${count} decisions`) : "No decisions waiting",
      detail: primary ? primary.detail : "The program can continue without another approval right now.",
      primary,
      decisions,
      generatedAt: input.generatedAt || null,
      safeguard: "Atlas explains the call and records your context. Only the canonical source controls can change a plan."
    };
  }

  function buildEvent(decision = {}, eventType = "OPENED", options = {}) {
    if (!decision.id || !decision.fingerprint) throw new Error("A canonical decision is required before recording an event.");
    const recordedAt = options.recordedAt || new Date().toISOString();
    const type = upper(eventType);
    return {
      version: VERSION,
      id: `atlas-decision-${stableHash(`${decision.fingerprint}:${type}:${recordedAt}`)}`,
      type,
      decisionId: decision.id,
      decisionFingerprint: decision.fingerprint,
      category: decision.category,
      domain: decision.domain,
      route: { ...(decision.route || {}) },
      recordedAt,
      userId: options.userId || null
    };
  }

  function buildFeedback(decision = {}, reasonCode = "", options = {}) {
    if (!decision.id || !decision.fingerprint) throw new Error("A canonical decision is required before recording feedback.");
    const reason = upper(reasonCode);
    if (!FEEDBACK_REASONS[reason]) throw new Error("Choose one reason before sending feedback to Atlas.");
    const recordedAt = options.recordedAt || new Date().toISOString();
    const note = String(options.note || "").replace(/\s+/g, " ").trim().slice(0, 240);
    return {
      version: VERSION,
      id: `atlas-feedback-${stableHash(`${decision.fingerprint}:${reason}:${recordedAt}`)}`,
      type: "RECRUIT_FEEDBACK",
      decisionId: decision.id,
      decisionFingerprint: decision.fingerprint,
      category: decision.category,
      domain: decision.domain,
      sourceRevision: decision.sourceRevision ?? null,
      reasonCode: reason,
      reasonLabel: FEEDBACK_REASONS[reason].label,
      note,
      status: "RECORDED",
      recordedAt,
      userId: options.userId || null,
      safeguard: "Feedback preserves the open decision and cannot modify the approved program."
    };
  }

  return Object.freeze({ VERSION, CATEGORY_PRIORITY, CATEGORY_RULES, FEEDBACK_REASONS, buildCenter, buildEvent, buildFeedback, stableHash });
});
