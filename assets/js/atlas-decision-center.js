(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasDecisionCenter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025V.1";
  const CATEGORY_PRIORITY = Object.freeze({
    SAFETY: 100,
    INTEGRITY: 92,
    CALENDAR: 84,
    EVIDENCE: 76,
    PROGRESSION: 68,
    WEEK: 60,
    COACHING: 52
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

  function normalize(candidate = {}, index = 0) {
    const category = CATEGORY_PRIORITY[upper(candidate.category)] ? upper(candidate.category) : "COACHING";
    const urgency = Math.max(0, Math.min(9, Math.round(Number(candidate.urgency || 0))));
    const route = candidate.route && typeof candidate.route === "object" ? { ...candidate.route } : { section: "today" };
    const id = String(candidate.id || `${category.toLowerCase()}-${index + 1}`);
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
    const decisions = [...unique.values()].sort((left, right) =>
      right.priority - left.priority
      || String(left.domain).localeCompare(String(right.domain))
      || String(left.id).localeCompare(String(right.id))
    ).map((decision, index) => ({ ...decision, order: index + 1, primary: index === 0 }));
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
      safeguard: "The Decision Center never changes a plan. Every choice is completed in its canonical module and keeps its original receipt."
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

  return Object.freeze({ VERSION, CATEGORY_PRIORITY, buildCenter, buildEvent, stableHash });
});
