(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionFrictionlessExecution = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "028B.1";
  const MODULES = Object.freeze([
    { id: "strength", label: "Strength", route: { section: "today", target: "daily-assignment-panel" } },
    { id: "running", label: "Run", route: { section: "performance", target: "running-command-panel" } },
    { id: "core", label: "Core", route: { section: "today", target: "core-today-panel" } },
    { id: "fuel", label: "Fuel", route: { section: "today", target: "mobile-nutrition-form" } },
    { id: "recovery", label: "Recover", route: { section: "today", target: "today-recovery-card" } },
    { id: "closeout", label: "Close", route: { section: "today", target: "daily-closeout-form" } }
  ]);
  const COMPLETE = new Set(["COMPLETE", "COMPLETED", "LOGGED", "SEALED"]);
  const ACTIVE = new Set(["IN_PROGRESS", "PAUSED", "REVIEW", "PARTIAL"]);

  function cleanState(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_") || "WAITING";
  }

  function hasDraft(draft = null) {
    if (!draft || typeof draft !== "object") return false;
    const values = draft.values && typeof draft.values === "object" ? draft.values : draft;
    return Object.values(values).some((value) => value !== null && value !== undefined && String(value).trim() !== "");
  }

  function normalizeModule(definition, input = {}) {
    const rawState = cleanState(input.state);
    const complete = input.complete === true || COMPLETE.has(rawState);
    const draft = !complete && hasDraft(input.draft);
    const active = !complete && (input.active === true || ACTIVE.has(rawState));
    const planned = input.planned !== false;
    const available = input.available !== false;
    let state = complete ? "COMPLETE" : active ? rawState : draft ? "DRAFT" : planned && available ? (rawState === "WAITING" ? "READY" : rawState) : "WAITING";
    if (["EMPTY", "NOT_LOGGED", "OPEN"].includes(state)) state = draft ? "DRAFT" : "READY";
    const actionLabel = complete ? "Review" : active ? "Resume" : draft ? "Continue" : available && planned ? "Open" : "Review";
    return {
      ...definition,
      state,
      complete,
      active,
      draft,
      planned,
      available,
      actionLabel,
      detail: String(input.detail || "").trim(),
      updatedAt: input.updatedAt || input.draft?.updatedAt || null
    };
  }

  function buildDashboard(input = {}) {
    const source = input.modules || {};
    const modules = MODULES.map((definition) => normalizeModule(definition, source[definition.id] || {}));
    const lastModule = String(input.lastModule || "").toLowerCase();
    const resumable = modules.filter((item) => item.active || item.draft);
    const resume = resumable.find((item) => item.id === lastModule)
      || resumable.sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))[0]
      || null;
    const completed = modules.filter((item) => item.complete).length;
    return {
      version: VERSION,
      date: input.date || null,
      modules,
      resume,
      completed,
      total: modules.length,
      percent: Math.round((completed / modules.length) * 100)
    };
  }

  function updateDraftEnvelope(existing = {}, module = "", values = null, options = {}) {
    const id = String(module || "").toLowerCase();
    const allowed = MODULES.some((item) => item.id === id);
    if (!allowed) return { ...existing };
    const now = options.now || new Date().toISOString();
    const drafts = { ...(existing.drafts || {}) };
    if (values === null || options.clear === true) delete drafts[id];
    else drafts[id] = { values: { ...values }, updatedAt: now };
    return {
      version: VERSION,
      date: options.date || existing.date || null,
      activeModule: options.activate === false ? existing.activeModule || null : id,
      lastOpenedAt: options.activate === false ? existing.lastOpenedAt || null : now,
      updatedAt: now,
      drafts
    };
  }

  function routeFor(module = "") {
    const found = MODULES.find((item) => item.id === String(module || "").toLowerCase());
    return found ? { ...found.route } : { section: "today", target: "one-command" };
  }

  return Object.freeze({ VERSION, MODULES: MODULES.map((item) => ({ ...item, route: { ...item.route } })), cleanState, hasDraft, normalizeModule, buildDashboard, updateDraftEnvelope, routeFor });
});
