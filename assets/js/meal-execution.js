(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionMealExecution = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023F.1";
  const METRICS = ["calories", "protein", "carbs", "fat"];
  const DIETS = ["OMNIVORE", "PESCATARIAN", "VEGETARIAN", "PLANT_BASED"];
  const PREP = ["QUICK", "STANDARD"];
  const EXCLUSIONS = ["DAIRY", "GLUTEN", "SOY", "FISH"];
  const CATALOG = {
    protein: [
      { key: "CHICKEN", name: "chicken breast", quantity: 6, unit: "oz cooked", macros: { calories: 280, protein: 52, carbs: 0, fat: 6 }, diets: ["OMNIVORE"], tags: [] },
      { key: "SALMON", name: "salmon", quantity: 6, unit: "oz cooked", macros: { calories: 350, protein: 40, carbs: 0, fat: 22 }, diets: ["OMNIVORE", "PESCATARIAN"], tags: ["FISH"] },
      { key: "GREEK_YOGURT", name: "nonfat Greek yogurt", quantity: 2, unit: "cups", macros: { calories: 260, protein: 46, carbs: 18, fat: 0 }, diets: ["OMNIVORE", "PESCATARIAN", "VEGETARIAN"], tags: ["DAIRY"], quick: true },
      { key: "TOFU", name: "extra-firm tofu", quantity: 8, unit: "oz", macros: { calories: 220, protein: 24, carbs: 6, fat: 12 }, diets: DIETS, tags: ["SOY"] },
      { key: "LENTILS", name: "lentils", quantity: 1.5, unit: "cups cooked", macros: { calories: 345, protein: 27, carbs: 60, fat: 1 }, diets: DIETS, tags: [], quick: true }
    ],
    carb: [
      { key: "RICE", name: "rice", quantity: 1.5, unit: "cups cooked", macros: { calories: 310, protein: 6, carbs: 68, fat: 1 }, diets: DIETS, tags: [], quick: true },
      { key: "POTATO", name: "potato", quantity: 12, unit: "oz cooked", macros: { calories: 260, protein: 7, carbs: 60, fat: 0 }, diets: DIETS, tags: [] },
      { key: "QUINOA", name: "quinoa", quantity: 1.5, unit: "cups cooked", macros: { calories: 330, protein: 12, carbs: 59, fat: 5 }, diets: DIETS, tags: [] },
      { key: "OATS", name: "oats", quantity: 1.5, unit: "cups cooked", macros: { calories: 230, protein: 8, carbs: 40, fat: 4 }, diets: DIETS, tags: ["GLUTEN"], quick: true },
      { key: "FRUIT", name: "banana and berries", quantity: 2, unit: "cups", macros: { calories: 210, protein: 3, carbs: 52, fat: 1 }, diets: DIETS, tags: [], quick: true }
    ],
    produce: [
      { key: "GREENS", name: "mixed vegetables", quantity: 2, unit: "cups", macros: { calories: 100, protein: 5, carbs: 20, fat: 1 }, diets: DIETS, tags: [] },
      { key: "BERRIES", name: "berries", quantity: 2, unit: "cups", macros: { calories: 140, protein: 2, carbs: 34, fat: 1 }, diets: DIETS, tags: [], quick: true }
    ],
    fat: [
      { key: "NONE", name: "no added fat", quantity: 0, unit: "", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, diets: DIETS, tags: [], quick: true },
      { key: "OLIVE_OIL", name: "olive oil", quantity: 1, unit: "tbsp", macros: { calories: 120, protein: 0, carbs: 0, fat: 14 }, diets: DIETS, tags: [], quick: true },
      { key: "AVOCADO", name: "avocado", quantity: 0.5, unit: "whole", macros: { calories: 120, protein: 2, carbs: 6, fat: 11 }, diets: DIETS, tags: [], quick: true }
    ]
  };

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function round(value, step = 1) {
    return Math.round((Number(value) || 0) / step) * step;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function normalizePreferences(value = {}) {
    const diet = DIETS.includes(value.diet) ? value.diet : "OMNIVORE";
    const prep = PREP.includes(value.prep) ? value.prep : "STANDARD";
    const exclusions = [...new Set((Array.isArray(value.exclusions) ? value.exclusions : []).filter((item) => EXCLUSIONS.includes(item)))];
    return { diet, prep, exclusions };
  }

  function isAllowed(item, preferences) {
    return item.diets.includes(preferences.diet) && !item.tags.some((tag) => preferences.exclusions.includes(tag));
  }

  function optionsFor(kind, preferences = {}) {
    const normalized = normalizePreferences(preferences);
    const allowed = CATALOG[kind].filter((item) => isAllowed(item, normalized));
    if (normalized.prep !== "QUICK") return allowed;
    const quick = allowed.filter((item) => item.quick);
    return quick.length ? quick : allowed;
  }

  function metricFrom(input, key) {
    const direct = finite(input?.[key]);
    if (direct !== null) return direct;
    return finite(input?.metrics?.[key]?.remaining);
  }

  function mealTarget(input = {}) {
    const nextMeal = input.nextMeal || {};
    const remaining = input.remaining || input.metrics || {};
    const target = {};
    METRICS.forEach((key) => {
      const slot = finite(nextMeal[key]);
      const left = metricFrom(remaining, key);
      target[key] = left === null ? slot : slot === null ? left : Math.min(slot, left);
    });
    return target;
  }

  function selectDefault(kind, options, input = {}) {
    if (!options.length) return null;
    const label = String(input.nextMeal?.label || "").toUpperCase();
    const desired = input.selection?.[kind];
    const selected = options.find((item) => item.key === desired);
    if (selected) return selected;
    if (kind === "protein") {
      if (input.preferences?.diet === "PLANT_BASED") return options.find((item) => item.key === "TOFU") || options[0];
      if (input.preferences?.diet === "PESCATARIAN") return options.find((item) => item.key === "SALMON") || options[0];
      if (/BREAKFAST|OPEN EATING/.test(label)) return options.find((item) => item.key === "GREEK_YOGURT") || options[0];
      return options.find((item) => item.key === "CHICKEN") || options[0];
    }
    if (kind === "carb") {
      if (/BREAKFAST|OPEN EATING/.test(label)) return options.find((item) => item.key === "OATS") || options.find((item) => item.key === "FRUIT") || options[0];
      if (/PRE-|POST-|BETWEEN|RUN|TRAIN/.test(label)) return options.find((item) => item.key === "RICE") || options[0];
    }
    if (kind === "produce" && /BREAKFAST|OPEN EATING/.test(label)) return options.find((item) => item.key === "BERRIES") || options[0];
    return options[0];
  }

  function steppedScale(target, perPortion, minimum = 0.5, maximum = 3) {
    if (!(Number(perPortion) > 0)) return 1;
    if (!(Number(target) > 0)) return minimum;
    return clamp(round(Number(target) / Number(perPortion), 0.25), minimum, maximum);
  }

  function formatNumber(value) {
    const rounded = round(value, 0.25);
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.0+$/, "");
  }

  function component(kind, item, scale) {
    const actualScale = item.key === "NONE" ? 0 : scale;
    return {
      kind,
      key: item.key,
      name: item.name,
      quantity: round(item.quantity * actualScale, 0.25),
      unit: item.unit,
      portion: item.key === "NONE" ? "No added fat" : `${formatNumber(item.quantity * actualScale)} ${item.unit} ${item.name}`.trim(),
      scale: actualScale,
      macros: Object.fromEntries(METRICS.map((key) => [key, round(item.macros[key] * actualScale)]))
    };
  }

  function sumMacros(components) {
    return Object.fromEntries(METRICS.map((key) => [key, components.reduce((sum, item) => sum + Number(item.macros[key] || 0), 0)]));
  }

  function availableSelections(preferences = {}) {
    return Object.fromEntries(Object.keys(CATALOG).map((kind) => [kind, optionsFor(kind, preferences).map((item) => ({ key: item.key, name: item.name }))]));
  }

  function mealName(components, nextMeal = {}) {
    const protein = components.find((item) => item.kind === "protein")?.name || "protein";
    const carb = components.find((item) => item.kind === "carb")?.name || "carbohydrate";
    const phase = /POST|RECOVERY|BETWEEN/.test(String(nextMeal.label || "").toUpperCase()) ? "recovery" : "fuel";
    return `${protein} + ${carb} ${phase} plate`;
  }

  function buildMealOrder(input = {}) {
    const preferences = normalizePreferences(input.preferences);
    const target = mealTarget(input);
    if (!(target.calories > 0 || target.protein > 0 || target.carbs > 0)) {
      return { version: VERSION, status: "NEEDS TARGETS", reason: "Approve daily Fuel targets before Atlas builds a meal.", preferences, options: availableSelections(preferences), components: [], target, estimate: {} };
    }
    const choices = Object.fromEntries(Object.keys(CATALOG).map((kind) => [kind, optionsFor(kind, preferences)]));
    if (["protein", "carb", "produce"].some((kind) => !choices[kind].length)) {
      return { version: VERSION, status: "BLOCKED", reason: "The current food exclusions leave no complete meal combination. Adjust the filters or choose your own meal.", preferences, options: availableSelections(preferences), components: [], target, estimate: {} };
    }
    const selected = Object.fromEntries(Object.keys(CATALOG).map((kind) => [kind, selectDefault(kind, choices[kind], { ...input, preferences })]));
    const proteinScale = steppedScale(target.protein, selected.protein.macros.protein, 0.5, 2.5);
    const proteinComponent = component("protein", selected.protein, proteinScale);
    const carbNeed = Math.max(0, Number(target.carbs || 0) - Number(proteinComponent.macros.carbs || 0));
    const carbScale = steppedScale(carbNeed, selected.carb.macros.carbs, 0.5, 3);
    const carbComponent = component("carb", selected.carb, carbScale);
    const produceScale = /PRE-|DURING/.test(String(input.nextMeal?.label || "").toUpperCase()) ? 0.5 : 1;
    const produceComponent = component("produce", selected.produce, produceScale);
    const base = [proteinComponent, carbComponent, produceComponent];
    const baseMacros = sumMacros(base);
    const fatNeed = Math.max(0, Number(target.fat || 0) - baseMacros.fat);
    let fatItem = selected.fat;
    if (fatNeed < 5) fatItem = choices.fat.find((item) => item.key === "NONE") || fatItem;
    const fatScale = fatItem.key === "NONE" ? 0 : steppedScale(fatNeed, fatItem.macros.fat, 0.5, 2);
    const components = [...base, component("fat", fatItem, fatScale)];
    const estimate = sumMacros(components);
    const date = input.date || new Date().toISOString().slice(0, 10);
    const slotIndex = Number.isFinite(Number(input.nextMeal?.index)) ? Number(input.nextMeal.index) : 0;
    const sequence = Math.max(1, Number(input.sequence || 1));
    return {
      version: VERSION,
      id: `meal-${date}-${slotIndex + 1}-${sequence}`,
      date,
      status: "READY",
      slotIndex,
      slotLabel: input.nextMeal?.label || `Meal ${slotIndex + 1}`,
      name: mealName(components, input.nextMeal),
      timing: input.nextMeal?.availableAt ? `Available at ${input.nextMeal.availableAt}` : input.nextMeal?.basis || "FLEXIBLE",
      note: input.nextMeal?.note || "Continue toward the approved daily targets.",
      target,
      estimate,
      components,
      selection: Object.fromEntries(components.map((item) => [item.kind, item.key])),
      options: availableSelections(preferences),
      preferences,
      source: "COACH_DOMINION_ESTIMATE",
      evidencePolicy: "Planning estimates never replace imported or manually confirmed intake.",
      createdAt: input.now || new Date().toISOString(),
      updatedAt: input.now || new Date().toISOString()
    };
  }

  function planMeal(order, options = {}) {
    if (!order || order.status !== "READY") throw new Error("Build a complete meal before planning it.");
    const now = options.now || new Date().toISOString();
    return { ...order, status: "PLANNED", plannedAt: now, updatedAt: now };
  }

  function confirmMeal(record, actual = {}, options = {}) {
    if (!record || !["PLANNED", "READY"].includes(record.status)) throw new Error("Plan a meal before confirming it.");
    const confirmed = {};
    METRICS.forEach((key) => {
      const entered = finite(actual[key]);
      confirmed[key] = entered === null ? finite(record.estimate?.[key]) : entered;
    });
    const changedFromEstimate = METRICS.some((key) => {
      const entered = finite(actual[key]);
      const estimated = finite(record.estimate?.[key]);
      return entered !== null && entered !== estimated;
    });
    const now = options.now || new Date().toISOString();
    return {
      ...record,
      status: "CONFIRMED",
      actual: confirmed,
      actualSource: changedFromEstimate ? "SELF_REPORTED_ACTUAL" : "SELF_REPORTED_ESTIMATE",
      confirmedAt: now,
      updatedAt: now,
      evidencePolicy: "Self-reported meal evidence is supplemental. Imported daily totals remain authoritative."
    };
  }

  function mergeRecord(history = [], record) {
    const records = [...(Array.isArray(history) ? history : []).filter(Boolean)];
    if (record?.id) records.push(record);
    const byId = new Map();
    const rank = { READY: 0, PLANNED: 1, CONFIRMED: 2 };
    records.forEach((item) => {
      if (!item?.id) return;
      const current = byId.get(item.id);
      const itemRank = rank[item.status] ?? -1;
      const currentRank = rank[current?.status] ?? -1;
      if (!current || itemRank > currentRank || itemRank === currentRank && String(item.updatedAt || "") >= String(current.updatedAt || "")) byId.set(item.id, item);
    });
    return [...byId.values()].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 90);
  }

  function normalizeLedger(value = {}) {
    const history = mergeRecord(value.history || []);
    const current = value.current?.id ? value.current : null;
    return {
      current,
      history: current?.status === "CONFIRMED" ? mergeRecord(history, current) : history,
      preferences: normalizePreferences(value.preferences),
      updatedAt: value.updatedAt || null
    };
  }

  return {
    VERSION,
    CATALOG,
    normalizePreferences,
    availableSelections,
    mealTarget,
    buildMealOrder,
    planMeal,
    confirmMeal,
    mergeRecord,
    normalizeLedger
  };
}));
