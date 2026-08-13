(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitConstraintMemory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025Y.1";
  const TYPES = Object.freeze({
    SCHEDULE: { label: "Schedule", domains: ["PROGRAM", "CALENDAR", "STRENGTH", "RUNNING", "CORE"] },
    EQUIPMENT: { label: "Equipment", domains: ["STRENGTH", "CORE"] },
    RECOVERY: { label: "Recovery", domains: ["PROGRAM", "STRENGTH", "RUNNING", "CORE"] },
    INJURY: { label: "Injury or pain", domains: ["PROGRAM", "STRENGTH", "RUNNING", "CORE"] },
    FOOD: { label: "Food or fueling", domains: ["FUEL", "NUTRITION"] },
    OTHER: { label: "Other", domains: ["PROGRAM"] }
  });

  function upper(value = "") { return String(value || "").trim().toUpperCase().replaceAll(" ", "_"); }
  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function normalizeDomains(domains, type) {
    const requested = (Array.isArray(domains) ? domains : [domains]).map(upper).filter(Boolean);
    return [...new Set(requested.length ? requested : TYPES[type].domains)];
  }
  function normalizeConstraint(input = {}, options = {}) {
    const type = TYPES[upper(input.type)] ? upper(input.type) : "OTHER";
    const note = String(input.note || input.detail || "").replace(/\s+/g, " ").trim().slice(0, 240);
    if (!note) throw new Error("Add one useful detail for Atlas to remember.");
    const createdAt = input.createdAt || options.recordedAt || new Date().toISOString();
    const domains = normalizeDomains(input.domains || input.domain, type);
    return {
      version: VERSION,
      id: input.id || `recruit-constraint-${stableHash(`${type}:${domains.sort().join("|")}:${note.toLowerCase()}`)}`,
      type,
      label: TYPES[type].label,
      note,
      domains,
      status: upper(input.status || "ACTIVE") === "RETIRED" ? "RETIRED" : "ACTIVE",
      sourceFeedbackId: input.sourceFeedbackId || null,
      decisionId: input.decisionId || null,
      createdAt,
      updatedAt: input.updatedAt || createdAt,
      retiredAt: input.retiredAt || null
    };
  }
  function buildMemory(items = [], options = {}) {
    const normalized = (Array.isArray(items) ? items : []).map((item) => normalizeConstraint(item, options));
    const unique = [...new Map(normalized.map((item) => [item.id, item])).values()];
    return {
      version: VERSION,
      status: unique.some((item) => item.status === "ACTIVE") ? "ACTIVE" : "CLEAR",
      active: unique.filter((item) => item.status === "ACTIVE").sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      retired: unique.filter((item) => item.status === "RETIRED").sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      count: unique.filter((item) => item.status === "ACTIVE").length,
      updatedAt: unique.reduce((latest, item) => String(item.updatedAt) > String(latest) ? item.updatedAt : latest, options.recordedAt || null)
    };
  }
  function addConstraint(memory = {}, input = {}, options = {}) {
    const constraint = normalizeConstraint(input, options);
    const items = [...(memory.active || []), ...(memory.retired || [])].filter((item) => item.id !== constraint.id);
    return buildMemory([constraint, ...items], options);
  }
  function retireConstraint(memory = {}, id = "", options = {}) {
    const recordedAt = options.recordedAt || new Date().toISOString();
    const items = [...(memory.active || []), ...(memory.retired || [])].map((item) => item.id === id ? { ...item, status: "RETIRED", retiredAt: recordedAt, updatedAt: recordedAt } : item);
    return buildMemory(items, { recordedAt });
  }
  function relevantForDecision(memory = {}, decision = {}) {
    const domain = upper(decision.domain || decision.category || "PROGRAM");
    return (memory.active || []).filter((item) => item.domains.includes(domain) || item.domains.includes("PROGRAM") || (domain === "NUTRITION" && item.domains.includes("FUEL"))).slice(0, 3);
  }
  function fromResolution(resolution = {}) {
    if (!resolution.constraintDraft) return null;
    return normalizeConstraint({ ...resolution.constraintDraft, domain: resolution.constraintDraft.domain || null }, { recordedAt: resolution.recordedAt });
  }

  return Object.freeze({ VERSION, TYPES, normalizeConstraint, buildMemory, addConstraint, retireConstraint, relevantForDecision, fromResolution, stableHash });
});
