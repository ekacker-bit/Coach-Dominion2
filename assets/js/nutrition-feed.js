(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionNutritionFeed = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "015A.1";
  const SOURCE = "MYFITNESSPAL_APPLE_HEALTH";
  const LIMITS = Object.freeze({
    calories: 20000,
    protein: 2000,
    carbs: 3000,
    fat: 2000,
    sampleCount: 1000
  });

  function text(value) {
    return String(value ?? "").trim();
  }

  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round(value, precision = 1) {
    const factor = 10 ** precision;
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function dateIso(value) {
    const date = text(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  }

  function stableHash(value = "") {
    const source = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function validateTokenFormat(value) {
    return /^cdnf_[A-Za-z0-9_-]{40,128}$/.test(text(value));
  }

  function normalizeNutritionFeedPayload(input = {}, options = {}) {
    const totals = input.totals && typeof input.totals === "object" ? input.totals : input;
    const normalized = {
      version: VERSION,
      source: SOURCE,
      date: dateIso(input.date),
      timezone: text(input.timezone || "UTC").slice(0, 64) || "UTC",
      sentAt: text(input.sentAt || input.sent_at || options.now || new Date().toISOString()),
      dryRun: Boolean(input.dryRun || input.dry_run),
      sampleCount: Math.max(0, Math.round(finite(input.sampleCount ?? input.sample_count) || 0)),
      totals: {
        calories: round(Math.max(0, finite(totals.calories) || 0)),
        protein: round(Math.max(0, finite(totals.protein ?? totals.protein_grams) || 0)),
        carbs: round(Math.max(0, finite(totals.carbs ?? totals.carbohydrates ?? totals.carbohydrate_grams) || 0)),
        fat: round(Math.max(0, finite(totals.fat ?? totals.fat_grams) || 0))
      }
    };
    const errors = [];
    if (!normalized.date && !normalized.dryRun) errors.push("A local date in YYYY-MM-DD format is required.");
    if (normalized.timezone.length > 64) errors.push("Timezone is too long.");
    Object.entries(normalized.totals).forEach(([key, value]) => {
      if (value > LIMITS[key]) errors.push(`${key} exceeds the supported daily limit.`);
    });
    if (normalized.sampleCount > LIMITS.sampleCount) errors.push("sampleCount exceeds the supported daily limit.");
    const totalNutrition = Object.values(normalized.totals).reduce((sum, value) => sum + value, 0);
    if (!normalized.dryRun && totalNutrition <= 0) errors.push("At least one nutrition total is required.");
    return {
      valid: errors.length === 0,
      errors,
      payload: normalized,
      fingerprint: stableHash({
        source: normalized.source,
        date: normalized.date,
        timezone: normalized.timezone,
        dryRun: normalized.dryRun,
        sampleCount: normalized.sampleCount,
        totals: normalized.totals
      })
    };
  }

  function buildShortcutTemplate(origin, token = "PASTE_FEED_KEY") {
    const endpoint = `${text(origin).replace(/\/+$/, "")}/api/nutrition-feed`;
    return {
      endpoint,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: {
        date: "CURRENT_DATE_YYYY-MM-DD",
        timezone: "CURRENT_TIMEZONE",
        source: SOURCE,
        sampleCount: "NUMBER_OF_HEALTH_SAMPLES",
        totals: {
          calories: "SUM_DIETARY_ENERGY_KCAL",
          protein: "SUM_DIETARY_PROTEIN_G",
          carbs: "SUM_DIETARY_CARBOHYDRATES_G",
          fat: "SUM_DIETARY_FAT_TOTAL_G"
        }
      }
    };
  }

  return Object.freeze({
    VERSION,
    SOURCE,
    LIMITS: { ...LIMITS },
    stableHash,
    validateTokenFormat,
    normalizeNutritionFeedPayload,
    buildShortcutTemplate
  });
});
