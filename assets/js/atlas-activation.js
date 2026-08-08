(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasActivation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "024H.1";
  const MODULES = Object.freeze([
    { id: "strength", label: "Strength" },
    { id: "running", label: "Cardio" },
    { id: "core", label: "Core" },
    { id: "nutrition", label: "Fuel" }
  ]);

  function date(value) {
    const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function candidateFor(context = {}, moduleId = "") {
    return context.candidates?.[moduleId] || null;
  }

  function linkedToContract(record = null, contract = null) {
    return Boolean(record && contract?.id
      && record.recruitContractId === contract.id
      && Number(record.recruitContractRevision || 0) === Number(contract.revision || 0));
  }

  function candidatePlanRef(moduleId = "", candidate = null) {
    if (!candidate) return { id: null, revision: 0 };
    if (moduleId === "nutrition") {
      return { id: candidate.id || candidate.approvedAt || null, revision: 0 };
    }
    return { id: candidate.id || null, revision: Number(candidate.revision || 0) };
  }

  function calendarLinkedToCandidates(week = null, candidates = {}) {
    if (!week || !week.sourceRefs) return false;
    const refs = week.sourceRefs;
    const mappings = {
      strength: ["strengthPlanId", "strengthPlanRevision"],
      running: ["runningBlockId", "runningBlockRevision"],
      core: ["corePlanId", "corePlanRevision"],
      nutrition: ["nutritionBaselineId", null]
    };
    return MODULES.every(({ id }) => {
      const candidate = candidatePlanRef(id, candidates?.[id] || null);
      const [idKey, revisionKey] = mappings[id];
      if ((refs[idKey] || null) !== candidate.id) return false;
      return revisionKey === null || Number(refs[revisionKey] || 0) === candidate.revision;
    });
  }

  function summarizeSyncResults(entries = []) {
    const normalized = (Array.isArray(entries) ? entries : []).map((entry, index) => ({
      domain: String(entry?.domain || `write-${index + 1}`),
      saved: entry?.saved === true
    }));
    const pendingDomains = [...new Set(normalized.filter((entry) => !entry.saved).map((entry) => entry.domain))];
    return {
      status: pendingDomains.length ? "SYNC_PENDING" : "ACCOUNT_SAVED",
      accountSaved: pendingDomains.length === 0,
      pendingDomains,
      savedCount: normalized.filter((entry) => entry.saved).length,
      totalCount: normalized.length
    };
  }

  function blocker(code, title, detail, action, options = {}) {
    return {
      code,
      title,
      detail,
      action,
      module: options.module || null,
      date: date(options.date),
      source: options.source || "PROGRAM"
    };
  }

  function calendarBlocker(item = {}) {
    const code = String(item.code || "CALENDAR_CONFLICT");
    const detail = item.detail || "The proposed calendar needs review before activation.";
    const options = { module: String(item.module || "").toLowerCase() || null, date: item.date, source: "CALENDAR" };
    if (code === "RECOVERY_MINIMUM_VIOLATED") {
      return blocker(code, "Protect one recovery day", detail, "Reduce or move one weekly assignment.", options);
    }
    if (code === "RECOVERY_DAY_COLLISION") {
      return blocker(code, "Recovery-day collision", detail, "Move the assignment to a training day.", options);
    }
    if (code === "HARD_RUN_STRENGTH_COLLISION") {
      return blocker(code, "Hard run and Strength collide", detail, "Separate the hard run and loaded Strength work.", options);
    }
    if (code === "TWO_A_DAY_SESSION_LIMIT" || code === "TRIPLE_TRAINING_WINDOW") {
      return blocker(code, "Too many training windows", detail, "Move one assignment; Core only stays tertiary when the combined window is 120 minutes or less.", options);
    }
    if (code.includes("CAP_EXCEEDED") || code === "TIME_COMMITMENT_EXCEEDED") {
      return blocker(code, "Daily time capacity exceeded", detail, "Shorten the commitment or move one assignment.", options);
    }
    if (code.includes("COVERAGE_INCOMPLETE")) {
      return blocker(code, "Calendar cannot meet the Contract", detail, "Adjust the weekly commitment or regenerate the affected plan.", options);
    }
    if (code.includes("PLAN_REQUIRED") || code.includes("CONTRACT_LINK_REQUIRED") || code === "NUTRITION_BASELINE_REQUIRED") {
      return blocker(code, "A required plan is missing", detail, "Regenerate the complete Atlas program.", options);
    }
    return blocker(code, "Calendar conflict", detail, "Review the commitment and proposed week.", options);
  }

  function preflightActivation(context = {}) {
    const contract = context.contract || null;
    const program = context.program || null;
    const week = context.weekDraft || null;
    const blockers = [];
    const checks = [];

    if (!contract || contract.status !== "APPROVED") {
      blockers.push(blocker("CONTRACT_REQUIRED", "Signed Contract required", "Approve the Recruit Contract before Atlas activates a program.", "Complete the Contract."));
    }
    if (!program || program.status !== "READY_FOR_APPROVAL") {
      blockers.push(blocker("PROGRAM_NOT_READY", "Program is not ready", program?.message || "Atlas has not prepared every required plan.", "Generate the complete program again."));
    }

    const included = MODULES.filter((definition) => program?.modules?.find((item) => item.id === definition.id)?.included !== false);
    included.forEach((definition) => {
      const candidate = candidateFor(context, definition.id);
      const approved = candidate?.status === "APPROVED";
      const linked = linkedToContract(candidate, contract);
      checks.push({ id: definition.id, label: definition.label, passed: approved && linked });
      if (!approved) {
        blockers.push(blocker(`${definition.id.toUpperCase()}_CANDIDATE_REQUIRED`, `${definition.label} is not ready`, `Atlas could not create an approvable ${definition.label} plan.`, `Regenerate ${definition.label} from the Contract.`, { module: definition.id }));
      } else if (!linked) {
        blockers.push(blocker(`${definition.id.toUpperCase()}_CONTRACT_MISMATCH`, `${definition.label} does not match this Contract`, `${definition.label} is not stamped to Contract ${contract?.revision || "current"}.`, `Regenerate ${definition.label} from the signed Contract.`, { module: definition.id }));
      }
    });

    const completeWeek = week?.status === "DRAFT" && Array.isArray(week.days) && week.days.length === 7;
    checks.push({ id: "calendar", label: "Calendar", passed: completeWeek && !week?.approvalBlocked });
    if (!completeWeek) {
      blockers.push(blocker("CALENDAR_REQUIRED", "Complete calendar required", "Atlas could not build a complete seven-day handoff.", "Regenerate the complete program.", { source: "CALENDAR" }));
    } else {
      if (week.contractId !== contract?.id || Number(week.contractRevision || 0) !== Number(contract?.revision || 0)) {
        blockers.push(blocker("CALENDAR_CONTRACT_MISMATCH", "Calendar uses an older Contract", `The proposed week does not match Contract ${contract?.revision || "current"}.`, "Rebuild the calendar from this Contract.", { source: "CALENDAR" }));
      }
      if (!calendarLinkedToCandidates(week, context.candidates || {})) {
        blockers.push(blocker("CALENDAR_PLAN_MISMATCH", "Calendar uses different plans", "The proposed week is not linked to the exact Strength, Cardio, Core, and Fuel plans awaiting activation.", "Rebuild the calendar from these plans.", { source: "CALENDAR" }));
      }
      (week.conflicts || []).filter((item) => item.severity === "BLOCKING").forEach((item) => blockers.push(calendarBlocker(item)));
    }

    const effectiveDate = date(contract?.effectiveDate);
    if (effectiveDate && week?.weekEnd && effectiveDate > week.weekEnd) {
      blockers.push(blocker("EFFECTIVE_DATE_AFTER_WEEK", "Effective date is outside this week", `The Contract begins ${effectiveDate}, after the proposed week ends.`, "Move the program to the Contract's effective week.", { source: "CALENDAR" }));
    }

    const unique = blockers.filter((item, index, list) => list.findIndex((candidate) => candidate.code === item.code && candidate.date === item.date) === index);
    const status = unique.length ? "BLOCKED" : "READY_TO_ACTIVATE";
    return {
      version: VERSION,
      status,
      contractId: contract?.id || null,
      contractRevision: Number(contract?.revision || 0),
      effectiveDate: effectiveDate || week?.weekStart || null,
      weekStart: week?.weekStart || null,
      blockers: unique,
      checks,
      message: status === "READY_TO_ACTIVATE"
        ? "All plans and the coordinated week passed preflight. One approval can activate the complete package."
        : `${unique.length} blocker${unique.length === 1 ? "" : "s"} must be cleared before anything changes.`
    };
  }

  function buildReceipt(context = {}) {
    const preflight = context.preflight || preflightActivation(context);
    if (preflight.status !== "READY_TO_ACTIVATE") throw new Error("Only a program that passed preflight can become active.");
    const contract = context.contract || {};
    const week = context.week || context.weekDraft || {};
    const activatedAt = context.activatedAt || new Date().toISOString();
    const candidates = context.candidates || {};
    return {
      version: VERSION,
      id: `atlas-activation:${contract.id}:r${Number(contract.revision || 0)}:${activatedAt}`,
      status: "ACTIVE",
      contractId: contract.id,
      contractRevision: Number(contract.revision || 0),
      effectiveDate: preflight.effectiveDate || week.weekStart,
      activatedAt,
      weekId: week.id || null,
      weekStart: week.weekStart || preflight.weekStart || null,
      planRefs: MODULES.reduce((refs, definition) => {
        refs[definition.id] = candidates[definition.id]?.id || null;
        return refs;
      }, {}),
      syncStatus: context.syncStatus || "DEVICE_SAVED",
      pendingSyncDomains: [...new Set(context.pendingSyncDomains || [])],
      headline: `Program Active · Contract R${Number(contract.revision || 0)} · Effective ${preflight.effectiveDate || week.weekStart}`
    };
  }

  function auditReceipt(receipt = null, context = {}) {
    if (!receipt || receipt.status !== "ACTIVE") return { status: "NO_RECEIPT", issues: [], message: "No active-program receipt is available." };
    const issues = [];
    const contract = context.contract || null;
    if (!contract || receipt.contractId !== contract.id || Number(receipt.contractRevision || 0) !== Number(contract.revision || 0)) {
      issues.push({ code: "CONTRACT_MISMATCH", detail: "The active receipt belongs to another Contract revision." });
    }
    MODULES.forEach((definition) => {
      const expected = receipt.planRefs?.[definition.id] || null;
      if (!expected) return;
      const active = context.activePlans?.[definition.id] || null;
      if (active?.id !== expected) issues.push({ code: `${definition.id.toUpperCase()}_MISMATCH`, detail: `${definition.label} does not match the active-program receipt.` });
    });
    if (receipt.weekId && context.week?.id !== receipt.weekId) issues.push({ code: "WEEK_MISMATCH", detail: "The coordinated week does not match the active-program receipt." });
    return {
      status: issues.length ? "REPAIR_REQUIRED" : "ACTIVE",
      issues,
      message: issues.length ? "The Contract remains safe. Repair the package to restore every active link." : receipt.headline
    };
  }

  return Object.freeze({ VERSION, MODULES, linkedToContract, calendarLinkedToCandidates, summarizeSyncResults, calendarBlocker, preflightActivation, buildReceipt, auditReceipt });
});
