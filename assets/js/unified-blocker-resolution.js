(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionUnifiedBlockerResolution = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029N.1";
  const DOMAIN_ORDER = Object.freeze(["contract", "strength", "running", "core", "nutrition", "calendar"]);
  const DOMAIN_LABELS = Object.freeze({
    contract: "Contract",
    strength: "Strength plan",
    running: "Cardio plan",
    core: "Core plan",
    nutrition: "Fuel plan",
    calendar: "Calendar"
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

  function whole(value = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
  }

  function domainLabel(domain = "") {
    return DOMAIN_LABELS[String(domain || "").toLowerCase()] || "saved program";
  }

  function conflictRevision(conflict = {}) {
    const values = [
      conflict.device?.revision,
      conflict.account?.revision,
      conflict.device?.payload?.revision,
      conflict.account?.payload?.revision
    ].map(whole).filter(Boolean);
    return values[0] || 0;
  }

  function normalizeConflicts(conflicts = []) {
    return (Array.isArray(conflicts) ? conflicts : [])
      .filter((item) => item && item.domain)
      .map((item) => ({ ...item, domain: String(item.domain).toLowerCase() }))
      .sort((left, right) => {
        const leftIndex = DOMAIN_ORDER.indexOf(left.domain);
        const rightIndex = DOMAIN_ORDER.indexOf(right.domain);
        const domainDelta = (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
        return domainDelta || String(left.choiceKey || left.key || "").localeCompare(String(right.choiceKey || right.key || ""));
      });
  }

  function stageForDomain(domain = "") {
    if (domain === "contract") return "contract";
    if (domain === "calendar") return "week";
    return "plans";
  }

  function buildBlocker(input = {}) {
    const conflicts = normalizeConflicts(input.conflicts);
    if (!conflicts.length) return null;
    const first = conflicts[0];
    const label = domainLabel(first.domain);
    const revision = conflictRevision(first);
    const revisionText = revision ? ` revision ${revision}` : "";
    const title = first.domain === "contract" ? "Choose the saved Contract" : `Choose the saved ${label}`;
    const detail = `This device and your account contain different approved contents for the same ${label}${revisionText}. Choose the copy that reflects your intent.`;
    const conflictCount = conflicts.length;
    return {
      version: VERSION,
      id: `atlas-blocker-${stableHash(conflicts.map((item) => ({ domain: item.domain, choiceKey: item.choiceKey || item.key, reason: item.reason })))}`,
      status: "CONFLICT",
      state: "CONFLICT",
      stateLabel: "CHOICE REQUIRED",
      tone: "red",
      priority: first.domain === "contract" ? 200 : 100,
      code: first.domain === "contract" ? "CONTRACT_CONFLICT" : "CONTINUITY_CHOICE",
      affectedDomains: first.domain === "contract" ? ["strength", "running", "core", "recovery"] : [],
      domain: first.domain,
      label,
      title,
      detail,
      reason: "Saved-program integrity outranks planning and execution. Atlas cannot safely advance until one approved copy governs every surface.",
      decision: `${label} continuity is the first unresolved blocker. Program, Calendar, and Today must wait for the same choice.`,
      after: "Atlas will verify the selected copy, retry protected account saves, refresh Program and Calendar, and reveal the next valid order.",
      duration: { minutes: 1, label: "About 1 min", open: false },
      window: "NOW",
      confidence: { score: 100, label: "HIGH", sourceCount: 2, blockerCount: conflictCount },
      conflictCount,
      pendingWrites: whole(input.pendingWrites),
      choiceKey: first.choiceKey || first.key || null,
      stage: stageForDomain(first.domain),
      primary: {
        action: "RESOLVE_CONTINUITY",
        label: first.domain === "contract" ? "Compare and choose saved Contract" : `Compare and choose saved ${label}`,
        section: "today",
        module: "continuity"
      }
    };
  }

  function blockerStages(stages = [], target = "contract") {
    const list = Array.isArray(stages) ? stages : [];
    const targetIndex = list.findIndex((item) => item.id === target);
    if (targetIndex < 0) return list.map((item) => ({ ...item }));
    return list.map((item, index) => ({
      ...item,
      complete: index < targetIndex ? Boolean(item.complete) : false,
      current: index === targetIndex,
      locked: index > targetIndex
    }));
  }

  function applyToDailyCommand(command = null, blocker = null) {
    if (!command || !blocker) return command;
    const stages = blockerStages(command.stages, blocker.stage);
    const complete = stages.filter((item) => item.complete).length;
    const total = stages.length || command.progress?.total || 0;
    const progress = {
      ...(command.progress || {}),
      complete,
      total,
      percent: total ? Math.round((complete / total) * 100) : 0,
      current: "Saved program"
    };
    return {
      ...command,
      version: `${command.version || "COMMAND"}+${VERSION}`,
      blocker,
      priority: blocker.priority,
      state: blocker.state,
      stateLabel: blocker.stateLabel,
      mode: "FIX",
      title: blocker.title,
      detail: blocker.detail,
      primary: { ...blocker.primary },
      reason: blocker.reason,
      decision: blocker.decision,
      after: blocker.after,
      duration: { ...blocker.duration },
      window: blocker.window,
      confidence: { ...blocker.confidence },
      facts: {
        duration: blocker.duration.label,
        window: blocker.window,
        confidence: `${blocker.confidence.label} - ${blocker.confidence.score}%`
      },
      adjustment: { available: false, active: false, label: null, choices: [] },
      stages,
      progress,
      progressLabel: `${complete} of ${total} - saved program choice required`,
      closeoutReady: false,
      secured: false,
      context: {
        ...(command.context || {}),
        source: "Account continuity",
        evidence: `${blocker.conflictCount} same-revision difference${blocker.conflictCount === 1 ? "" : "s"}`,
        conflict: blocker.detail
      },
      orderFingerprint: stableHash({ blockerId: blocker.id, base: command.orderFingerprint || null })
    };
  }

  function programView(blocker = null) {
    if (!blocker) return null;
    return {
      status: blocker.stateLabel,
      tone: blocker.tone,
      eyebrow: "PROGRAM BLOCKER",
      title: blocker.title,
      detail: blocker.detail,
      primary: { ...blocker.primary }
    };
  }

  function resolutionOutcome(input = {}) {
    const remainingConflicts = whole(input.remainingConflicts);
    const pendingWrites = whole(input.pendingWrites);
    if (remainingConflicts) {
      return {
        status: "CHOICE_REQUIRED",
        advance: false,
        keepDialogOpen: true,
        message: `${remainingConflicts} saved-program choice${remainingConflicts === 1 ? " remains" : "s remain"}.`
      };
    }
    const nextTitle = String(input.nextTitle || "Atlas is choosing the next order");
    return {
      status: input.synced ? "ADVANCED" : "ADVANCED_LOCAL",
      advance: true,
      keepDialogOpen: false,
      route: "today",
      message: input.synced
        ? `Saved program reconciled. ${nextTitle} is now next.`
        : `Choice applied on this device. ${pendingWrites ? `${pendingWrites} protected save${pendingWrites === 1 ? "" : "s"} will retry. ` : ""}${nextTitle} is now next.`
    };
  }

  return {
    VERSION,
    DOMAIN_ORDER,
    normalizeConflicts,
    buildBlocker,
    applyToDailyCommand,
    programView,
    resolutionOutcome,
    stableHash
  };
});
