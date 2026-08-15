(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionFuelDayLedger = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026L.1";
  const METRICS = ["calories", "protein", "carbs", "fat"];

  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function normalizeRecord(input = {}, options = {}) {
    const date = String(input.date || options.date || "");
    if (!validDate(date)) throw new Error("Choose a valid Fuel date.");
    const totals = Object.fromEntries(METRICS.map((key) => [key, finite(input[key] ?? input.totals?.[key])]));
    const populated = METRICS.filter((key) => totals[key] !== null);
    const primaryComplete = totals.calories !== null && totals.protein !== null;
    const complete = populated.length === METRICS.length;
    const source = String(input.source || options.source || "MANUAL").toUpperCase();
    const updatedAt = input.updatedAt || options.now || new Date().toISOString();
    return {
      version: VERSION,
      id: `fuel-day:${date}`,
      date,
      ...totals,
      totals,
      source,
      status: complete ? "LOGGED" : populated.length ? "PARTIAL" : "EMPTY",
      primaryComplete,
      complete,
      populatedMetrics: populated.length,
      updatedAt
    };
  }

  function quality(record) {
    if (!record) return -1;
    const normalized = normalizeRecord(record, { date: record.date, source: record.source });
    return normalized.populatedMetrics + (normalized.primaryComplete ? 4 : 0) + (normalized.complete ? 4 : 0);
  }

  function variance(manual, imported) {
    if (!manual || !imported) return null;
    const differences = {};
    for (const key of METRICS) {
      const left = finite(manual[key]);
      const right = finite(imported[key]);
      differences[key] = left === null || right === null || right === 0 ? null : Math.round(((left - right) / right) * 100);
    }
    const material = [differences.calories, differences.protein].some((value) => value !== null && Math.abs(value) > 10);
    return { status: material ? "REVIEW" : "MATCH", differences, material };
  }

  function selectRecord(input = {}) {
    const manual = input.manual?.date ? normalizeRecord(input.manual, { source: "MANUAL" }) : null;
    const imported = input.imported?.date ? normalizeRecord(input.imported, { source: "MYFITNESSPAL" }) : null;
    let record = null;
    if (imported?.complete) record = imported;
    else if (manual?.primaryComplete && quality(manual) >= quality(imported)) record = manual;
    else record = imported || manual;
    const reconciliation = variance(manual, imported);
    return {
      version: VERSION,
      date: record?.date || input.date || null,
      status: record?.status || "EMPTY",
      record,
      manual,
      imported,
      source: record?.source || "NONE",
      primaryComplete: Boolean(record?.primaryComplete),
      complete: Boolean(record?.complete),
      reconciliation,
      message: !record
        ? "Log calories and macros once for today."
        : record.complete
          ? `${record.source === "MYFITNESSPAL" ? "MyFitnessPal" : "Manual"} day total secured.`
          : "Finish the missing daily totals to complete Fuel evidence."
    };
  }

  function progress(ledger = {}, targets = {}) {
    const record = ledger.record || {};
    return Object.fromEntries(METRICS.map((key) => {
      const actual = finite(record[key]);
      const target = finite(targets[key]);
      return [key, {
        actual,
        target,
        remaining: actual === null || target === null ? null : Math.max(0, target - actual),
        percent: actual === null || !target ? null : Math.round((actual / target) * 100)
      }];
    }));
  }

  function evidence(ledger = {}) {
    const record = ledger.record;
    if (!record?.date) return null;
    return {
      id: `fuel-day-total:${record.date}`,
      date: record.date,
      completedAt: record.updatedAt,
      status: record.primaryComplete ? "LOGGED" : "PARTIAL",
      state: record.primaryComplete ? "COMPLETE" : "INCOMPLETE",
      sourceType: "FUEL_DAY_TOTAL",
      domain: "nutrition",
      kind: "INTAKE",
      source: record.source,
      metrics: { ...record.totals }
    };
  }

  return Object.freeze({ VERSION, METRICS, normalizeRecord, selectRecord, progress, evidence });
});
