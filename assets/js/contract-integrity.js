(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContractIntegrity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021F.1";
  const CHANGE_FIELDS = Object.freeze([
    { id: "target", label: "Mission" },
    { id: "targetDate", label: "Target date" },
    { id: "primaryGoal", label: "Primary goal" },
    { id: "trainingDaysPerWeek", label: "Training days", suffix: "/wk" },
    { id: "strengthDaysPerWeek", label: "Strength", suffix: "/wk" },
    { id: "runningDaysPerWeek", label: "Running", suffix: "/wk" },
    { id: "coreDaysPerWeek", label: "Core", suffix: "/wk" },
    { id: "sessionMinutes", label: "Standard session", suffix: " min" },
    { id: "twoADays", label: "Two-a-Days", boolean: true },
    { id: "nutritionCommitment", label: "Nutrition standard" },
    { id: "equipment", label: "Equipment" },
    { id: "restrictions", label: "Restrictions" }
  ]);

  function sameValue(left, right) {
    if (typeof left === "boolean" || typeof right === "boolean") return Boolean(left) === Boolean(right);
    if (left === null || left === undefined || right === null || right === undefined) return left === right;
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && String(left).trim() !== "" && String(right).trim() !== "") {
      return leftNumber === rightNumber;
    }
    return String(left).trim().toUpperCase() === String(right).trim().toUpperCase();
  }

  function describe(field, value) {
    if (field.boolean) return value === true ? "Enabled" : "Off";
    if (value === null || value === undefined || value === "") return "Not set";
    return `${String(value).replaceAll("_", " ")}${field.suffix || ""}`;
  }

  function amendmentChanges(previous = {}, replacement = {}) {
    return CHANGE_FIELDS
      .filter((field) => !sameValue(previous[field.id], replacement[field.id]))
      .map((field) => ({
        id: field.id,
        label: field.label,
        from: describe(field, previous[field.id]),
        to: describe(field, replacement[field.id])
      }));
  }

  function weekMatchesContract(week = null, contract = null) {
    return Boolean(
      week
      && contract?.id
      && week.contractId === contract.id
      && Number(week.contractRevision || 0) === Number(contract.revision || 0)
    );
  }

  function calendarIntegrity(contract = null, context = {}) {
    if (!contract?.id || contract.status !== "APPROVED") {
      return {
        version: VERSION,
        status: "CONTRACT_REQUIRED",
        label: "CONTRACT REQUIRED",
        detail: "Sign the Dominion Contract before checking calendar integrity.",
        contractRevision: null,
        calendarRevision: null,
        currentWeekRevision: null,
        weekStart: null,
        twoADaysAuthorized: false,
        twoADayCount: 0,
        longRunsUncapped: false,
        repairRequired: false
      };
    }

    const committedWeeks = Array.isArray(context.committedWeeks) ? context.committedWeeks : [];
    const matchingCommitted = committedWeeks.find((week) => week?.status !== "REPLACED" && weekMatchesContract(week, contract)) || null;
    const matchingDraft = weekMatchesContract(context.weekDraft, contract) ? context.weekDraft : null;
    const source = matchingCommitted || matchingDraft || null;
    const currentWeek = context.currentWeek || null;
    const twoADayCount = (source?.days || []).filter((day) => day?.twoADay === true).length;
    const longRunsUncapped = Number(contract.runningDaysPerWeek || 0) > 0
      || (source?.days || []).some((day) => day?.longRunUncapped === true);
    const base = {
      version: VERSION,
      contractRevision: Number(contract.revision || 0),
      calendarRevision: source ? Number(source.contractRevision || 0) : null,
      currentWeekRevision: currentWeek ? Number(currentWeek.contractRevision || 0) : null,
      weekStart: source?.weekStart || null,
      twoADaysAuthorized: contract.twoADays === true,
      twoADayCount,
      longRunsUncapped,
      protectedCurrentWeek: Boolean(currentWeek && !weekMatchesContract(currentWeek, contract))
    };

    if (matchingCommitted) {
      return {
        ...base,
        status: "ACTIVE",
        label: "CALENDAR MATCHED",
        detail: `The committed calendar is governed by Contract ${contract.revision}.`,
        repairRequired: false
      };
    }
    if (matchingDraft) {
      return {
        ...base,
        status: "DRAFT_MATCHED",
        label: "CALENDAR STAGED",
        detail: `The coordinated calendar draft is stamped to Contract ${contract.revision}.`,
        repairRequired: false
      };
    }
    return {
      ...base,
      status: "REPAIR_REQUIRED",
      label: "REPAIR REQUIRED",
      detail: `No calendar draft or committed week is stamped to Contract ${contract.revision}.`,
      repairRequired: true
    };
  }

  function createHandoffReceipt(previous = null, contract = {}, integrity = {}, options = {}) {
    const signedAt = contract.signature?.signedAt || options.signedAt || new Date().toISOString();
    const changes = previous ? amendmentChanges(previous, contract) : [];
    return {
      version: VERSION,
      id: `${contract.id || "contract"}:r${Number(contract.revision || 0)}:${signedAt}`,
      contractId: contract.id || null,
      contractRevision: Number(contract.revision || 0),
      previousRevision: previous?.revision ? Number(previous.revision) : null,
      signedAt,
      recordedAt: options.recordedAt || new Date().toISOString(),
      changes,
      calendarStatus: integrity.status || "REPAIR_REQUIRED",
      calendarRevision: integrity.calendarRevision ?? null,
      weekStart: integrity.weekStart || null,
      twoADaysAuthorized: contract.twoADays === true,
      twoADayCount: Number(integrity.twoADayCount || 0),
      longRunsUncapped: Number(contract.runningDaysPerWeek || 0) > 0 || integrity.longRunsUncapped === true
    };
  }

  function receiptMatchesContract(receipt = null, contract = null) {
    return Boolean(
      receipt
      && contract?.id
      && receipt.contractId === contract.id
      && Number(receipt.contractRevision || 0) === Number(contract.revision || 0)
    );
  }

  return {
    VERSION,
    CHANGE_FIELDS,
    amendmentChanges,
    weekMatchesContract,
    calendarIntegrity,
    createHandoffReceipt,
    receiptMatchesContract
  };
});
