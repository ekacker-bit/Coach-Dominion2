(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeeklyRolloverCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030L.1";
  const COMMITTED_STATES = new Set(["COMMITTED", "ACTIVE", "COMPLETED"]);
  const REPLACED_STATES = new Set(["REPLACED", "SUPERSEDED"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function dateIso(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function addDays(value = "", count = 0) {
    const source = dateIso(value);
    if (!source) return null;
    const date = new Date(`${source}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(count || 0));
    return date.toISOString().slice(0, 10);
  }
  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce((output, key) => {
      if (value[key] !== undefined) output[key] = stable(value[key]);
      return output;
    }, {});
  }
  function fingerprint(value) {
    const serialized = JSON.stringify(stable(value));
    let hash = 2166136261;
    for (let index = 0; index < serialized.length; index += 1) {
      hash ^= serialized.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  function revision(value) { return Number(text(value).replace(/^R/i, "")) || 0; }
  function sameRevision(left, right) { return revision(left) === revision(right); }
  function liveWeek(week = null) {
    const status = upper(week?.status || week?.state);
    return Boolean(week && !REPLACED_STATES.has(status) && COMMITTED_STATES.has(status));
  }
  function activityIds(day = {}) {
    const activities = Array.isArray(day.activities) ? day.activities : [];
    return activities.map((item) => text(item.assignmentId || item.id || item.activityId || item.sessionId)).filter(Boolean).sort();
  }
  function firstAssignmentId(day = {}) {
    const sequence = Array.isArray(day.sessionSequence) && day.sessionSequence.length ? day.sessionSequence : (Array.isArray(day.activities) ? day.activities : []);
    const item = sequence[0] || null;
    return text(item?.assignmentId || item?.id || item?.activityId || item?.sessionId);
  }
  function assignmentIds(week = {}) {
    return Array.from(new Set((Array.isArray(week.days) ? week.days : []).flatMap(activityIds))).sort();
  }
  function sameList(left = [], right = []) {
    const a = Array.from(new Set(left.map(text).filter(Boolean))).sort();
    const b = Array.from(new Set(right.map(text).filter(Boolean))).sort();
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  function summarizeWeek(week = null) {
    const days = Array.isArray(week?.days) ? week.days : [];
    const activities = days.flatMap((day) => Array.isArray(day.activities) ? day.activities : []);
    const modules = activities.reduce((counts, item) => {
      const key = text(item.module || item.domain || "training").toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    return {
      weekStart: dateIso(week?.weekStart),
      trainingDays: Number(week?.trainingDays ?? days.filter((day) => (day.activities || []).length).length),
      recoveryDays: Number(week?.recoveryDays ?? days.filter((day) => !(day.activities || []).length).length),
      twoADays: Number(week?.twoADayCount ?? days.filter((day) => day.twoADay === true).length),
      plannedMinutes: days.reduce((sum, day) => sum + Number(day.estimatedMinutes || (day.activities || []).reduce((total, item) => total + Number(item.estimatedMinutes || 0), 0)), 0),
      assignments: assignmentIds(week).length,
      modules
    };
  }

  function changeSummary(sourceWeek = null, targetWeek = null) {
    const before = summarizeWeek(sourceWeek);
    const after = summarizeWeek(targetWeek);
    const fields = [
      ["Training days", before.trainingDays, after.trainingDays],
      ["Recovery days", before.recoveryDays, after.recoveryDays],
      ["Two-a-Days", before.twoADays, after.twoADays],
      ["Planned minutes", before.plannedMinutes, after.plannedMinutes],
      ["Assignments", before.assignments, after.assignments]
    ];
    const changes = fields.filter(([, left, right]) => left !== right).map(([label, left, right]) => ({ label, before: left, after: right }));
    return {
      before,
      after,
      changed: changes.length > 0,
      changes: changes.length ? changes : [{ label: "Weekly structure", before: "Held", after: "Held" }]
    };
  }

  function problem(code, title, detail, action, section = "review") {
    return { code, title, detail, action: { label: action, section } };
  }

  function firstProblem(input = {}) {
    const reconciliation = input.reconciliation || null;
    const packet = reconciliation?.packet || {};
    const sourceWeek = input.sourceWeek || null;
    const targetWeek = input.targetWeek || null;
    const targetWeekStart = dateIso(reconciliation?.verdict?.targetWeekStart || reconciliation?.commitReceipt?.targetWeekStart);
    const targetIds = assignmentIds(targetWeek);
    const calendar = input.calendarReceipt || null;
    const weeks = Array.isArray(input.weeks) ? input.weeks : [];
    const currentDate = dateIso(input.currentDate) || new Date().toISOString().slice(0, 10);

    if (!reconciliation?.id || !packet.finalizedAt) return problem("FINALIZED_INSPECTION_REQUIRED", "Finalize the week", "A rollover cannot be certified before the source inspection is final.", "Open Review", "inspection");
    if (!sourceWeek?.id || sourceWeek.id !== packet.activeWeekId || dateIso(sourceWeek.weekStart) !== dateIso(packet.weekStart) || revision(sourceWeek.revision) !== revision(packet.activeWeekRevision)) {
      return problem("SOURCE_WEEK_MISMATCH", "Restore the inspected week", "The finalized inspection no longer points to the exact committed week it assessed.", "Repair week history", "review");
    }
    if (!targetWeekStart || !targetWeek?.id || !liveWeek(targetWeek) || dateIso(targetWeek.weekStart) !== targetWeekStart) {
      return problem("TARGET_WEEK_NOT_COMMITTED", "Commit the next week", "The finalized result has no matching committed calendar.", "Open Calendar", "calendar");
    }
    const liveTargets = weeks.filter((week) => liveWeek(week) && dateIso(week.weekStart) === targetWeekStart);
    if (liveTargets.length !== 1) return problem("DUPLICATE_TARGET_WEEK", "Choose one committed week", "More than one live revision can govern the target week.", "Repair Calendar", "calendar");
    if (!sameRevision(targetWeek.contractRevision, packet.contractRevision)) return problem("CONTRACT_REVISION_MISMATCH", "Restore Contract lineage", "The target week was built from a different Contract revision.", "Open Contract", "contract");
    if (packet.programId && targetWeek.programId && text(packet.programId) !== text(targetWeek.programId)) return problem("PROGRAM_ID_MISMATCH", "Restore program lineage", "The target week points to a different approved program.", "Open Program", "performance");
    if (packet.programRevision && targetWeek.programRevision && !sameRevision(packet.programRevision, targetWeek.programRevision)) return problem("PROGRAM_REVISION_MISMATCH", "Restore program revision", "The target week points to a different program revision.", "Open Program", "performance");
    const commit = reconciliation.commitReceipt || null;
    if (commit && (text(commit.targetWeekId) !== text(targetWeek.id) || !sameRevision(commit.targetWeekRevision, targetWeek.revision) || dateIso(commit.targetWeekStart) !== targetWeekStart)) {
      return problem("ROLLOVER_COMMIT_MISMATCH", "Restore the committed revision", "The weekly result receipt points to a different target calendar.", "Repair Calendar", "calendar");
    }
    if (!calendar?.id || dateIso(calendar.weekStart) !== targetWeekStart || !sameRevision(calendar.calendarRevision, targetWeek.revision) || !sameRevision(calendar.contractRevision, targetWeek.contractRevision) || !sameList(calendar.assignmentIds || [], targetIds)) {
      return problem("CALENDAR_RECEIPT_MISMATCH", "Certify the Calendar commit", "The saved Calendar receipt does not match every target-week assignment.", "Repair Calendar", "calendar");
    }

    if (currentDate >= dateIso(sourceWeek.weekStart) && currentDate <= dateIso(sourceWeek.weekEnd) && text(input.resolvedWeek?.id) !== text(sourceWeek.id)) {
      return problem("SOURCE_WEEK_NOT_PROTECTED", "Restore the current week", "The future commitment displaced the week that is still in force.", "Repair Calendar", "calendar");
    }
    const targetEnd = dateIso(targetWeek.weekEnd || addDays(targetWeekStart, 6));
    if (currentDate >= targetWeekStart && currentDate <= targetEnd) {
      if (text(input.resolvedWeek?.id) !== text(targetWeek.id) || !sameRevision(input.resolvedWeek?.revision, targetWeek.revision)) {
        return problem("TARGET_WEEK_NOT_ACTIVE", "Activate the committed week", "Today is not resolving to the certified target revision.", "Repair Calendar", "calendar");
      }
      const command = input.canonicalCommand || null;
      const day = (targetWeek.days || []).find((item) => dateIso(item.date) === currentDate) || null;
      const dayIds = activityIds(day);
      const commandIds = (command?.schedule?.sessions || []).map((item) => text(item.assignmentId || item.id)).filter(Boolean).sort();
      if (text(command?.week?.id) !== text(targetWeek.id) || !sameRevision(command?.week?.revision, targetWeek.revision) || !sameList(commandIds, dayIds)) {
        return problem("DAILY_COMMAND_MISMATCH", "Restore today's mission", "Today is not using the assignments from the certified week.", "Reload Today", "today");
      }
      if (dayIds.length && (upper(command?.primaryAction?.action) !== "START" || text(command?.primaryAction?.sessionId) !== firstAssignmentId(day))) {
        return problem("FIRST_MISSION_MISMATCH", "Open the first mission", "Monday did not resolve directly to the first executable assignment.", "Reload Today", "today");
      }
      if (!dayIds.length && upper(command?.primaryAction?.action) !== "RECOVERY") {
        return problem("RECOVERY_COMMAND_MISMATCH", "Protect recovery", "The certified recovery day did not open its recovery order.", "Reload Today", "today");
      }
    }
    return null;
  }

  function lifecycle(targetWeek = null, currentDate = "") {
    const date = dateIso(currentDate) || new Date().toISOString().slice(0, 10);
    const start = dateIso(targetWeek?.weekStart);
    const end = dateIso(targetWeek?.weekEnd || addDays(start, 6));
    if (!start) return "BLOCKED";
    if (date < start) return "SCHEDULED";
    if (date <= end) return "ACTIVE";
    return "HISTORICAL";
  }

  function evaluate(input = {}) {
    const reconciliation = input.reconciliation || null;
    const sourceWeek = input.sourceWeek || null;
    const targetWeek = input.targetWeek || null;
    const issue = firstProblem(input);
    const changes = changeSummary(sourceWeek, targetWeek);
    if (issue) return {
      version: VERSION,
      status: "BLOCKED",
      valid: false,
      targetWeekStart: dateIso(reconciliation?.verdict?.targetWeekStart || reconciliation?.commitReceipt?.targetWeekStart || targetWeek?.weekStart),
      headline: issue.title,
      detail: issue.detail,
      repair: issue,
      changes,
      receipt: null,
      shouldSave: false
    };

    const calendar = input.calendarReceipt;
    const targetIds = assignmentIds(targetWeek);
    const basis = {
      version: VERSION,
      reconciliationId: reconciliation.id,
      reconciliationFingerprint: reconciliation.fingerprint || null,
      sourceWeekId: sourceWeek.id,
      sourceWeekRevision: revision(sourceWeek.revision),
      sourceWeekStart: dateIso(sourceWeek.weekStart),
      targetWeekId: targetWeek.id,
      targetWeekRevision: revision(targetWeek.revision),
      targetWeekStart: dateIso(targetWeek.weekStart),
      targetWeekEnd: dateIso(targetWeek.weekEnd || addDays(targetWeek.weekStart, 6)),
      contractId: targetWeek.contractId || reconciliation.packet?.contractId || null,
      contractRevision: revision(targetWeek.contractRevision),
      programId: targetWeek.programId || reconciliation.packet?.programId || null,
      programRevision: revision(targetWeek.programRevision || reconciliation.packet?.programRevision),
      calendarReceiptId: calendar.id,
      calendarContentHash: calendar.contentHash || fingerprint(calendar),
      calendarAccountRevision: revision(calendar.accountRevision),
      assignmentIds: targetIds
    };
    const receiptFingerprint = fingerprint(basis);
    const prior = input.priorReceipt || null;
    const recovered = !reconciliation.commitReceipt;
    const receipt = prior?.fingerprint === receiptFingerprint ? { ...prior } : Object.freeze({
      ...basis,
      type: "WEEKLY_ROLLOVER_CERTIFICATION",
      id: `weekly-rollover:${basis.sourceWeekStart}:${basis.targetWeekStart}:${receiptFingerprint}`,
      fingerprint: receiptFingerprint,
      status: "CERTIFIED",
      recovered,
      recoveryReason: recovered ? "Committed Calendar recovered after an interrupted weekly-result save." : null,
      certifiedAt: input.certifiedAt || calendar.committedAt || reconciliation.updatedAt || new Date().toISOString()
    });
    const status = lifecycle(targetWeek, input.currentDate);
    const labels = {
      SCHEDULED: ["Next week is committed", `Effective ${basis.targetWeekStart}. The current week stays protected.`],
      ACTIVE: ["This is the committed week", `${basis.assignmentIds.length} assignments are active from one certified revision.`],
      HISTORICAL: ["Rollover completed", `Week ${basis.targetWeekStart} executed from its certified revision.`]
    };
    return {
      version: VERSION,
      status,
      valid: true,
      headline: labels[status][0],
      detail: labels[status][1],
      effectiveDate: basis.targetWeekStart,
      why: reconciliation.verdict?.next || reconciliation.verdict?.headline || "Finalized weekly evidence set the next prescription.",
      changes,
      receipt,
      repair: null,
      shouldSave: prior?.fingerprint !== receiptFingerprint
    };
  }

  function upsertHistory(history = [], receipt = null, limit = 52) {
    if (!receipt?.id) return Array.isArray(history) ? [...history] : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => dateIso(item?.targetWeekStart) !== dateIso(receipt.targetWeekStart) && item?.id !== receipt.id)]
      .sort((left, right) => text(right.targetWeekStart).localeCompare(text(left.targetWeekStart)))
      .slice(0, Math.max(1, Number(limit || 52)));
  }

  return Object.freeze({
    VERSION,
    dateIso,
    addDays,
    fingerprint,
    assignmentIds,
    summarizeWeek,
    changeSummary,
    lifecycle,
    firstProblem,
    evaluate,
    upsertHistory
  });
});
