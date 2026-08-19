(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionExecutionContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030C.1";

  function isoDate(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
  }

  function revision(value) {
    const number = Number(value?.revision ?? value?.contractRevision ?? value?.contract_revision ?? value ?? 0);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
  }

  function effectiveDate(value = null, fallback = null) {
    return isoDate(value?.effectiveDate || value?.effective_date || value?.weekStart || value?.week_start || fallback);
  }

  function dateLabel(value) {
    const [year, month, day] = isoDate(value).split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(year, month - 1, day)));
  }

  function covers(week = null, date = null) {
    const target = isoDate(date);
    return Boolean(week && week.status !== "REPLACED" && target >= isoDate(week.weekStart) && target <= isoDate(week.weekEnd));
  }

  function activeWeekForDate(weeks = [], date = null) {
    return (Array.isArray(weeks) ? weeks : []).find((week) => covers(week, date)) || null;
  }

  function contractForRevision(contracts = [], targetRevision = 0) {
    const target = revision(targetRevision);
    return (Array.isArray(contracts) ? contracts : []).find((contract) => revision(contract) === target) || null;
  }

  function conflictDate(conflict = {}) {
    const value = conflict.effectiveDate || conflict.effective_date || conflict.weekStart || conflict.week_start || conflict.startsOn || conflict.starts_on;
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function conflictAffectsActiveDate(conflict = {}, context = {}) {
    const code = String(conflict.code || "").toUpperCase();
    const scope = String(conflict.scope || conflict.timeScope || "").toUpperCase();
    const dated = conflictDate(conflict);
    if (["FUTURE", "NEXT_WEEK", "STAGED"].includes(scope)) return false;
    if (dated && dated > context.date) return false;
    if (code === "WEEK_CONTRACT_MISMATCH" && context.expectedVersionSplit) return false;
    if (revision(conflict.contractRevision || conflict.contract_revision) && context.activeContractRevision
      && revision(conflict.contractRevision || conflict.contract_revision) !== context.activeContractRevision
      && dated && dated > context.date) return false;
    return true;
  }

  function blockingConflicts(conflicts = [], context = {}) {
    return (Array.isArray(conflicts) ? conflicts : [])
      .filter((item) => ["BLOCKING", "CONFLICT", "USER_ACTION_REQUIRED"].includes(String(item?.severity || item?.state || "BLOCKING").toUpperCase()))
      .filter((item) => conflictAffectsActiveDate(item, context));
  }

  function resolveExecutionContext(input = {}) {
    const date = isoDate(input.date);
    const weeks = Array.isArray(input.weeks) ? input.weeks : [];
    const activeWeek = input.activeWeek || input.committedWeek || activeWeekForDate(weeks, date);
    const currentContract = input.currentContract || input.contract || null;
    const contracts = [currentContract, ...(Array.isArray(input.contractHistory) ? input.contractHistory : [])].filter(Boolean);
    const activeContractRevision = revision(activeWeek?.contractRevision || activeWeek?.contract_revision || currentContract);
    const activeContract = input.activeContract || contractForRevision(contracts, activeContractRevision) || (revision(currentContract) === activeContractRevision ? currentContract : null);
    const stagedWeek = input.stagedWeek || input.draftWeek || null;
    const stagedContractRevision = revision(stagedWeek?.contractRevision || stagedWeek?.contract_revision || currentContract);
    const stagedDate = effectiveDate(stagedWeek, currentContract?.effectiveDate || currentContract?.effective_date || date);
    const currentRevision = revision(currentContract);
    const expectedVersionSplit = Boolean(activeWeek
      && currentRevision
      && activeContractRevision
      && currentRevision !== activeContractRevision
      && stagedDate > date);
    const base = {
      version: VERSION,
      date,
      activeWeek,
      activeContract,
      currentContract,
      stagedWeek,
      activeContractRevision,
      currentContractRevision: currentRevision,
      stagedContractRevision,
      stagedEffectiveDate: stagedDate,
      expectedVersionSplit,
      currentWeekProtected: Boolean(activeWeek && expectedVersionSplit)
    };
    const conflicts = blockingConflicts(input.conflicts, base);
    const nextWeekReady = Boolean(stagedWeek && stagedDate > date && conflicts.length === 0);
    return {
      ...base,
      conflicts,
      blocked: conflicts.length > 0,
      nextWeekReady,
      today: {
        contractRevision: activeContractRevision || currentRevision,
        label: activeContractRevision ? `Today executes active R${activeContractRevision} assignment.` : "Today executes the active assignment.",
        secondary: nextWeekReady ? "Next week is ready to commit." : null
      },
      program: expectedVersionSplit
        ? `Current week protected under R${activeContractRevision} · R${currentRevision} staged for ${dateLabel(stagedDate)}.`
        : activeContractRevision ? `Current week executes under R${activeContractRevision}.` : "Program authority is being verified.",
      sync: expectedVersionSplit ? { state: "user_action_required", label: "Future program update pending" } : null,
      contractAction: nextWeekReady || expectedVersionSplit ? { action: "COMMIT_WEEK", label: "Commit next week" } : null
    };
  }

  return Object.freeze({
    VERSION,
    isoDate,
    revision,
    covers,
    activeWeekForDate,
    contractForRevision,
    conflictAffectsActiveDate,
    blockingConflicts,
    resolveExecutionContext,
    resolve: resolveExecutionContext
  });
});
