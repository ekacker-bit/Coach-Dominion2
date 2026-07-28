(function runningCommandModule(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.DominionRunning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRunningCommand() {
  "use strict";

  const GOALS = Object.freeze(["GENERAL_FITNESS", "5K", "10K", "HALF_MARATHON", "MARATHON"]);
  const UNITS = Object.freeze(["mi", "km"]);
  const DISTANCE_KM = Object.freeze({ "1_MILE": 1.609344, "5K": 5, "10K": 10, "HALF_MARATHON": 21.0975, "MARATHON": 42.195 });
  const ZONE_RULES = Object.freeze([
    { code: "RECOVERY", label: "Recovery", fast: 1.30, slow: 1.45, purpose: "Low-stress movement and recovery." },
    { code: "EASY", label: "Easy", fast: 1.20, slow: 1.35, purpose: "Aerobic development and routine mileage." },
    { code: "LONG", label: "Long", fast: 1.15, slow: 1.30, purpose: "Durability at controlled effort." },
    { code: "TEMPO", label: "Tempo", fast: 1.03, slow: 1.10, purpose: "Sustained, comfortably hard work." },
    { code: "INTERVAL", label: "Interval", fast: 0.92, slow: 1.00, purpose: "Short controlled repetitions with recovery." }
  ]);

  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function dateIso(value) {
    const text = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }
  function normalizeGoal(value) {
    const goal = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
    return GOALS.includes(goal) ? goal : "GENERAL_FITNESS";
  }
  function normalizeUnit(value) { return UNITS.includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "mi"; }
  function normalizeProfile(input = {}) {
    const benchmarkDistance = String(input.benchmarkDistance || input.benchmark_distance || "").toUpperCase();
    return {
      goal: normalizeGoal(input.goal),
      targetDate: dateIso(input.targetDate || input.target_date),
      runningDaysPerWeek: clamp(Math.round(finite(input.runningDaysPerWeek ?? input.running_days_per_week) || 3), 1, 7),
      preferredUnit: normalizeUnit(input.preferredUnit || input.preferred_unit),
      benchmarkDistance: DISTANCE_KM[benchmarkDistance] ? benchmarkDistance : null,
      benchmarkSeconds: Math.round(finite(input.benchmarkSeconds ?? input.benchmark_seconds) || 0) || null,
      benchmarkDate: dateIso(input.benchmarkDate || input.benchmark_date),
      approvedAt: input.approvedAt || input.approved_at || null,
      updatedAt: input.updatedAt || input.updated_at || null
    };
  }
  function distanceToKm(distance, unit = "mi") {
    const value = finite(distance);
    if (!(value > 0)) return null;
    return normalizeUnit(unit) === "mi" ? value * 1.609344 : value;
  }
  function distanceFromKm(distanceKm, unit = "mi") {
    return normalizeUnit(unit) === "mi" ? distanceKm / 1.609344 : distanceKm;
  }
  function formatDuration(seconds) {
    const value = Math.max(0, Math.round(finite(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const remaining = value % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}` : `${minutes}:${String(remaining).padStart(2, "0")}`;
  }
  function formatPace(secondsPerUnit, unit = "mi") {
    return `${formatDuration(secondsPerUnit)}/${normalizeUnit(unit)}`;
  }
  function runningEntryEvidence(entry = {}) {
    const metrics = entry.metrics || {};
    const distanceKm = distanceToKm(metrics.distance, metrics.distance_unit || metrics.distanceUnit || "mi");
    const durationSeconds = finite(metrics.duration_seconds ?? metrics.durationSeconds);
    if (entry.domain !== "running" || !(distanceKm > 0) || !(durationSeconds > 0)) return null;
    return {
      id: entry.id || null,
      date: dateIso(entry.performanceDate || entry.performance_date),
      distanceKm,
      durationSeconds,
      entryType: String(entry.entryType || entry.entry_type || "").toUpperCase(),
      evidenceStatus: String(entry.evidenceStatus || entry.evidence_status || "SELF REPORTED").toUpperCase(),
      source: entry.provenance?.sourceProvider || entry.source || "MANUAL"
    };
  }
  function selectBenchmark(profileInput = {}, entries = []) {
    const profile = normalizeProfile(profileInput);
    const candidates = (entries || []).map(runningEntryEvidence).filter(Boolean)
      .filter((item) => item.entryType === "RACE" || item.entryType === "FORMAL_TEST" || item.entryType === "BENCHMARK")
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    if (profile.benchmarkDistance && profile.benchmarkSeconds > 0) {
      return {
        source: "PROFILE",
        sourceLabel: "Approved profile benchmark",
        date: profile.benchmarkDate,
        distanceKm: DISTANCE_KM[profile.benchmarkDistance],
        durationSeconds: profile.benchmarkSeconds,
        evidenceStatus: "SELF REPORTED"
      };
    }
    const candidate = candidates[0];
    return candidate ? { ...candidate, sourceLabel: `${candidate.source} ${candidate.entryType.replaceAll("_", " ").toLowerCase()}` } : null;
  }
  function equivalentFiveKilometerPace(benchmark) {
    if (!benchmark || !(benchmark.distanceKm > 0) || !(benchmark.durationSeconds > 0)) return null;
    const fiveKilometerSeconds = benchmark.durationSeconds * Math.pow(5 / benchmark.distanceKm, 1.06);
    return fiveKilometerSeconds / 5;
  }
  function derivePaceZones(profileInput = {}, entries = []) {
    const profile = normalizeProfile(profileInput);
    const benchmark = selectBenchmark(profile, entries);
    const pacePerKm = equivalentFiveKilometerPace(benchmark);
    if (!pacePerKm) return { status: "INSUFFICIENT_EVIDENCE", benchmark: null, zones: [], message: "Add an approved benchmark or a timed race/test to calculate planning pace zones." };
    const multiplier = profile.preferredUnit === "mi" ? 1.609344 : 1;
    const zones = ZONE_RULES.map((rule) => ({
      code: rule.code,
      label: rule.label,
      fastSecondsPerUnit: Math.round(pacePerKm * rule.fast * multiplier),
      slowSecondsPerUnit: Math.round(pacePerKm * rule.slow * multiplier),
      purpose: rule.purpose
    }));
    return {
      status: "READY",
      benchmark,
      zones,
      message: "Planning estimates derived deterministically from the selected benchmark; effort, terrain, weather, and pain still govern execution."
    };
  }
  function deriveMileageBaseline(entries = [], options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const end = Date.parse(`${today}T23:59:59Z`);
    const start = end - (27 * 86400000);
    const runs = (entries || []).map(runningEntryEvidence).filter(Boolean).filter((run) => {
      const epoch = Date.parse(`${run.date || ""}T12:00:00Z`);
      return Number.isFinite(epoch) && epoch >= start && epoch <= end;
    });
    const distanceKm = runs.reduce((total, run) => total + run.distanceKm, 0);
    const preferredUnit = normalizeUnit(options.preferredUnit);
    return {
      status: runs.length ? "OBSERVED" : "NO_DATA",
      runCount: runs.length,
      fourWeekDistance: Number(distanceFromKm(distanceKm, preferredUnit).toFixed(1)),
      averageWeeklyDistance: Number(distanceFromKm(distanceKm / 4, preferredUnit).toFixed(1)),
      unit: preferredUnit,
      windowStart: new Date(start).toISOString().slice(0, 10),
      windowEnd: today
    };
  }
  function buildRunningCommand(profileInput = {}, entries = [], options = {}) {
    const profile = normalizeProfile(profileInput);
    const pace = derivePaceZones(profile, entries);
    const baseline = deriveMileageBaseline(entries, { ...options, preferredUnit: profile.preferredUnit });
    const readiness = !profile.approvedAt ? "PROFILE_DRAFT" : pace.status !== "READY" ? "BENCHMARK_REQUIRED" : baseline.status !== "OBSERVED" ? "BASELINE_LIMITED" : "READY";
    return {
      profile,
      readiness,
      benchmark: pace.benchmark,
      zones: pace.zones,
      baseline,
      message: readiness === "PROFILE_DRAFT" ? "Approve the running profile to establish the planning contract." : readiness === "BENCHMARK_REQUIRED" ? pace.message : readiness === "BASELINE_LIMITED" ? "Pace zones are available, but recent mileage is missing. Begin conservatively until four weeks of evidence accumulates." : pace.message
    };
  }

  return {
    GOALS, DISTANCE_KM, ZONE_RULES, normalizeProfile, distanceToKm, formatDuration, formatPace,
    runningEntryEvidence, selectBenchmark, equivalentFiveKilometerPace, derivePaceZones,
    deriveMileageBaseline, buildRunningCommand
  };
});
