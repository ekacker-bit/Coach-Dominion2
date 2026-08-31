(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeekProgress = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031A.1";
  const DAY_MS = 86400000;

  function isoDate(value = "") {
    const candidate = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }

  function ordinal(value = "") {
    const normalized = isoDate(value);
    if (!normalized) return null;
    const [year, month, day] = normalized.split("-").map(Number);
    const result = Date.UTC(year, month - 1, day) / DAY_MS;
    return Number.isFinite(result) ? result : null;
  }

  function dateInZone(value = new Date(), timeZone = "UTC") {
    const instant = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(instant.getTime())) throw new TypeError("A valid instant is required.");
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(instant).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function resolve(input = {}) {
    const weekStartDate = isoDate(input.weekStartDate || input.weekStart);
    const weekEndDate = isoDate(input.weekEndDate || input.weekEnd);
    const asOfDate = isoDate(input.asOfDate) || dateInZone(input.now || new Date(), input.timeZone || "UTC");
    const start = ordinal(weekStartDate);
    const end = ordinal(weekEndDate);
    const asOf = ordinal(asOfDate);
    if ([start, end, asOf].some((value) => value === null) || end < start) throw new TypeError("Week progress requires valid YYYY-MM-DD bounds.");
    const evidenceThroughOrdinal = asOf < start ? null : Math.min(asOf, end);
    const elapsedDayCount = evidenceThroughOrdinal === null ? 0 : evidenceThroughOrdinal - start + 1;
    return Object.freeze({
      version: VERSION,
      weekStartDate,
      weekEndDate,
      asOfDate,
      evidenceThroughDate: evidenceThroughOrdinal === null
        ? null
        : new Date(evidenceThroughOrdinal * DAY_MS).toISOString().slice(0, 10),
      elapsedDayCount,
      projectedDayCount: end - start + 1,
      weekComplete: asOf >= end,
      isCurrentWeek: asOf >= start && asOf <= end,
      isFutureWeek: asOf < start,
      isPreviousWeek: asOf > end
    });
  }

  return Object.freeze({ VERSION, isoDate, ordinal, dateInZone, resolve });
});
