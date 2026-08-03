(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyCloseout = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022F.1";
  const RESPONSE = Object.freeze({ MET: "MET", NOT_MET: "NOT_MET", NOT_APPLICABLE: "NOT_APPLICABLE", UNANSWERED: "UNANSWERED" });
  const DISCIPLINE_ITEMS = Object.freeze([
    { id: "alcohol", label: "Alcohol-free" },
    { id: "masturbation", label: "Masturbation count" },
    { id: "fried_food", label: "Avoided fried food" },
    { id: "dessert", label: "Declined dessert" },
    { id: "processed_food", label: "Processed food" }
  ]);

  function isoDate(value = "") {
    const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function optionalInteger(value, label, maximum = 1000000) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > maximum) throw new Error(`${label} must be a whole number from 0 to ${maximum.toLocaleString()}.`);
    return number;
  }

  function response(value, options = {}) {
    const normalized = String(value || "").trim().toUpperCase();
    if (normalized === RESPONSE.MET || normalized === "YES" || normalized === "TRUE") return RESPONSE.MET;
    if (normalized === RESPONSE.NOT_MET || normalized === "NO" || normalized === "FALSE") return RESPONSE.NOT_MET;
    if (options.allowNotApplicable && [RESPONSE.NOT_APPLICABLE, "N/A", "NA"].includes(normalized)) return RESPONSE.NOT_APPLICABLE;
    return RESPONSE.UNANSWERED;
  }

  function processedFoods(value) {
    const source = Array.isArray(value) ? value : String(value || "").split(/[\n,;]+/);
    const seen = new Set();
    return source.map((item) => String(item || "").trim()).filter((item) => {
      const key = item.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);
  }

  function disciplineObservation(input = {}) {
    const alcohol = response(input.alcoholAbstained);
    const fried = response(input.friedFoodAvoided);
    const dessert = response(input.dessertDeclined, { allowNotApplicable: true });
    const masturbationCount = optionalInteger(input.masturbationCount, "Masturbation count", 100);
    const processedStatus = String(input.processedFoodStatus || "").toUpperCase();
    const foods = processedFoods(input.processedFoods);
    if (processedStatus === "NONE" && foods.length) throw new Error("Choose either no processed food or list what was consumed—not both.");
    if (processedStatus === "LISTED" && !foods.length) throw new Error("List the processed food consumed, or choose none.");

    const observations = [
      { id: "alcohol", label: "Alcohol-free", response: alcohol, answered: alcohol !== RESPONSE.UNANSWERED, applicable: alcohol !== RESPONSE.NOT_APPLICABLE, met: alcohol === RESPONSE.MET },
      { id: "masturbation", label: "Masturbation count", response: masturbationCount === null ? RESPONSE.UNANSWERED : masturbationCount === 0 ? RESPONSE.MET : RESPONSE.NOT_MET, answered: masturbationCount !== null, applicable: true, met: masturbationCount === 0 },
      { id: "fried_food", label: "Avoided fried food", response: fried, answered: fried !== RESPONSE.UNANSWERED, applicable: fried !== RESPONSE.NOT_APPLICABLE, met: fried === RESPONSE.MET },
      { id: "dessert", label: "Declined dessert", response: dessert, answered: dessert !== RESPONSE.UNANSWERED, applicable: dessert !== RESPONSE.NOT_APPLICABLE, met: dessert === RESPONSE.MET },
      { id: "processed_food", label: "Processed food", response: processedStatus === "NONE" ? RESPONSE.MET : processedStatus === "LISTED" ? RESPONSE.NOT_MET : RESPONSE.UNANSWERED, answered: ["NONE", "LISTED"].includes(processedStatus), applicable: true, met: processedStatus === "NONE" }
    ];
    const answered = observations.filter((item) => item.answered).length;
    const assessed = observations.filter((item) => item.answered && item.applicable).length;
    const met = observations.filter((item) => item.answered && item.applicable && item.met).length;
    return {
      alcoholAbstained: alcohol === RESPONSE.UNANSWERED ? null : alcohol === RESPONSE.MET,
      masturbationCount,
      friedFoodAvoided: fried === RESPONSE.UNANSWERED ? null : fried === RESPONSE.MET,
      dessertDeclined: dessert === RESPONSE.UNANSWERED || dessert === RESPONSE.NOT_APPLICABLE ? null : dessert === RESPONSE.MET,
      dessertNotApplicable: dessert === RESPONSE.NOT_APPLICABLE,
      processedFoodStatus: ["NONE", "LISTED"].includes(processedStatus) ? processedStatus : "UNANSWERED",
      processedFoods: foods,
      observations,
      answered,
      possible: DISCIPLINE_ITEMS.length,
      coverage: Math.round(answered / DISCIPLINE_ITEMS.length * 100),
      assessed,
      met,
      score: assessed ? Math.round(met / assessed * 100) : null
    };
  }

  function resolveSteps(selfReported, connected = null) {
    const manual = optionalInteger(selfReported, "Self-reported steps", 250000);
    const imported = optionalInteger(connected, "Connected steps", 250000);
    return {
      selfReported: manual,
      connected: imported,
      effective: manual !== null ? manual : imported,
      source: manual !== null ? "SELF_REPORTED_CLOSEOUT" : imported !== null ? "CONNECTED" : "MISSING"
    };
  }

  function buildCloseout(input = {}, options = {}) {
    const date = isoDate(input.date);
    if (!date) throw new Error("A valid closeout date is required.");
    const steps = resolveSteps(input.selfReportedSteps, input.connectedSteps);
    if (steps.selfReported === null) throw new Error("Enter today’s self-reported steps before sealing the day.");
    const discipline = disciplineObservation(input);
    const previous = options.previous && isoDate(options.previous.date) === date ? options.previous : null;
    const now = options.now || new Date().toISOString();
    const revision = Math.max(1, Number(previous?.revision || 0) + 1);
    return {
      version: VERSION,
      id: `daily-closeout:${date}`,
      date,
      status: "SEALED",
      revision,
      steps,
      discipline,
      reflection: {
        win: String(input.win || "").trim().slice(0, 280) || null,
        adjustment: String(input.adjustment || "").trim().slice(0, 280) || null
      },
      sealedAt: previous?.sealedAt || now,
      updatedAt: now
    };
  }

  function summarizeWeek(history = [], range = {}) {
    const start = isoDate(range.weekStartDate || range.start);
    const end = isoDate(range.weekEndDate || range.end);
    const days = (Array.isArray(history) ? history : [])
      .filter((item) => item?.status === "SEALED" && isoDate(item.date) && (!start || item.date >= start) && (!end || item.date <= end))
      .sort((a, b) => a.date.localeCompare(b.date));
    const stepDays = days.filter((item) => Number.isFinite(Number(item.steps?.effective)));
    const totalSteps = stepDays.reduce((sum, item) => sum + Number(item.steps.effective), 0);
    const observations = days.flatMap((item) => Array.isArray(item.discipline?.observations) ? item.discipline.observations : []);
    const answered = observations.filter((item) => item.answered).length;
    const assessed = observations.filter((item) => item.answered && item.applicable).length;
    const met = observations.filter((item) => item.answered && item.applicable && item.met).length;
    return {
      version: VERSION,
      days,
      sealedDays: days.length,
      stepDays: stepDays.length,
      totalSteps,
      averageSteps: stepDays.length ? Math.round(totalSteps / stepDays.length) : null,
      disciplineAnswered: answered,
      disciplinePossible: days.length * DISCIPLINE_ITEMS.length,
      disciplineCoverage: days.length ? Math.round(answered / (days.length * DISCIPLINE_ITEMS.length) * 100) : 0,
      disciplineAssessed: assessed,
      disciplineMet: met,
      observedAdherence: assessed ? Math.round(met / assessed * 100) : null
    };
  }

  return Object.freeze({ VERSION, RESPONSE, DISCIPLINE_ITEMS: DISCIPLINE_ITEMS.map((item) => ({ ...item })), isoDate, optionalInteger, response, processedFoods, disciplineObservation, resolveSteps, buildCloseout, summarizeWeek });
});
