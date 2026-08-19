(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCalendarCommitAuthority = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030E.1";

  function text(value = "") { return String(value ?? "").trim(); }
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
  function assignmentIds(week = {}) {
    const days = Array.isArray(week.days) ? week.days : [];
    return days.flatMap((day) => Array.isArray(day.activities) ? day.activities : [])
      .map((activity) => text(activity.assignmentId || activity.id || activity.sessionId))
      .filter(Boolean)
      .sort();
  }
  function create(input = {}) {
    const ids = Array.from(new Set(input.assignmentIds || assignmentIds(input.week))).map(text).filter(Boolean).sort();
    const content = {
      contractRevision: text(input.contractRevision).replace(/^R/i, ""),
      weekStart: text(input.weekStart || input.week?.weekStart || input.week?.week_start),
      calendarRevision: text(input.calendarRevision),
      assignmentIds: ids,
      accountRevision: text(input.accountRevision)
    };
    return Object.freeze({
      version: VERSION,
      id: `calendar-commit-${content.weekStart}-${fingerprint(content)}`,
      ...content,
      contentHash: fingerprint(content),
      committedAt: text(input.committedAt) || new Date().toISOString()
    });
  }
  function matches(receipt = {}, input = {}) {
    if (!receipt?.contentHash) return false;
    const candidate = create({ ...input, committedAt: receipt.committedAt });
    return receipt.contentHash === candidate.contentHash
      && text(receipt.weekStart) === candidate.weekStart;
  }
  function latestForWeek(receipts = [], weekStart = "") {
    return (Array.isArray(receipts) ? receipts : [])
      .filter((receipt) => text(receipt.weekStart) === text(weekStart))
      .sort((a, b) => text(b.committedAt).localeCompare(text(a.committedAt)))[0] || null;
  }

  return Object.freeze({ VERSION, stable, fingerprint, assignmentIds, create, matches, latestForWeek });
});
