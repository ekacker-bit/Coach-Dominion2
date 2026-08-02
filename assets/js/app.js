let client;
let session;
let dailyState;
let readinessHistory = [];
let dailyCompliance;
let weeklyInspection;
let weeklyDailyRecords = [];
let inspectionHistory = [];
let trendRangeDays = 28;
let trendActiveView = "overview";
let trendActiveMetric = "discipline";
let trendDashboardModel = null;
let trendAnalyticsContext = null;
let activeSection = "today";
let complianceDirtyState = false;
let compliancePreviousState = null;
let lastSavedComplianceState = null;
let currentSaveState = "empty";
let standardsReviewState = [];
let rankStatus = { currentRank: "RECRUIT", promotionState: "NOT ELIGIBLE", activeCorrectivePeriod: false, correctivePeriodReason: null, correctivePeriodStatus: null, correctivePeriodStartedAt: null, correctivePeriodReviewDate: null };
let promotionHistory = [];
const INSPECTION_CALCULATION_VERSION = "009A.1";
let performanceEntries = [];
let performanceStorageMode = "LOADING";
let performanceSaveState = "loading";
let performanceEditId = null;
let performanceFilters = { date: "", domain: "", activity: "", entryType: "" };
let fitnessTestAttempts = [];
let activeFitnessTestAttemptId = null;
let personalRecords = [];
let milestoneAchievements = [];
let atlasPerformanceReviews = [];
let performanceActiveView = "today_training";
let performanceIntelligenceFilters = { domain: "all", trajectory: "all", confidence: "all", evidenceStatus: "all" };
let performanceLoadState = { remoteLoadFailed: false, authRequired: false, calculationUnavailable: false };
let connectedAccounts = [];
let connectedSyncJobs = [];
let connectedImportedRecords = [];
let connectedStorageMode = "LOADING";
let connectedLoadState = { loading: true, remoteLoadFailed: false, authRequired: false, localFallback: false };
let connectedActiveView = "overview";
let mfpNutritionFeedTokens = [];
let mfpNutritionFeedEvents = [];
let mfpNutritionFeedSecret = null;
let mfpNutritionFeedState = { loading: true, available: false, migrationRequired: false, authRequired: false };
let nutritionBaselineDraft = null;
let nutritionActiveView = "today";
let recruitContractStorageMode = "LOCAL";
let recruitOnboardingStorageMode = "LOCAL";
let recruitContractSetupStep = 0;
let recruitContractAutosaveTimer = null;
let recruitContractAutosaveRevision = 0;
let recruitContractAutosavePromise = Promise.resolve(null);
const RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS = 8000;
let weeklyOrchestrationStorageMode = "LOCAL";
let splitDayStorageMode = "LOCAL";
let splitDayRefreshTimer = null;
let mobileInstallPrompt = null;
let mobileSyncInFlight = false;
let currentOperatingTruth = null;
let operatingTruthReconcileTimer = null;
let continuitySyncTimer = null;
let continuityState = { mode: "CHECKING", initialized: false, accountRevision: 0, manifest: null, accountManifest: null, manifestConflicts: [] };
const continuityRecordConflicts = new Map();

const DAILY_STATE_COLUMNS = "date,energy,soreness,pain,sleep,weight,steps,resting_heart_rate,heart_rate_variability,objective_metric_sources,objective_metrics_updated_at,confidence,comments";
const COMPLIANCE_DOMAINS = ["mission", "strength", "cardio", "recovery", "nutrition"];
const PERFORMANCE_DOMAINS = ["strength", "running", "core", "conditioning", "fitness_test", "body_metrics"];
const PERFORMANCE_DOMAIN_LABELS = {
  strength: "Strength",
  running: "Running",
  core: "Core",
  conditioning: "Conditioning",
  fitness_test: "Fitness Test",
  body_metrics: "Body Metrics"
};
const PERFORMANCE_ENTRY_TYPE_OPTIONS = [
  { code: "TRAINING_SET", label: "Training Set" },
  { code: "WORKOUT_SUMMARY", label: "Workout Summary" },
  { code: "BENCHMARK", label: "Benchmark" },
  { code: "FORMAL_TEST", label: "Formal Test" },
  { code: "RACE", label: "Race" },
  { code: "MEASUREMENT", label: "Measurement" }
];
const PERFORMANCE_EVIDENCE_STATUS_OPTIONS = ["SELF REPORTED", "VERIFIED", "ESTIMATED", "INCOMPLETE"];
const PERFORMANCE_VIEW_CODES = ["today_training", "log", "running", "core", "progress"];
const PERFORMANCE_VIEW_ALIASES = Object.freeze({
  overview: "today_training",
  programming: "today_training",
  recovery: "today_training",
  fitness_tests: "progress",
  records: "progress",
  milestones: "progress",
  intelligence: "progress",
  abs: "core",
  abs_core: "core"
});
const PERFORMANCE_TRAJECTORY_STATES = ["STRONGLY IMPROVING", "IMPROVING", "STABLE", "NOISY", "DECLINING", "STRONGLY DECLINING", "INSUFFICIENT DATA"];
const PERFORMANCE_CONFIDENCE_STATES = ["HIGH", "MODERATE", "LOW", "INSUFFICIENT"];
const PERFORMANCE_PLATEAU_STATES = ["NO PLATEAU", "POSSIBLE PLATEAU", "LIKELY PLATEAU", "INSUFFICIENT DATA"];
const PERFORMANCE_REGRESSION_STATES = ["NO REGRESSION", "POSSIBLE REGRESSION", "LIKELY REGRESSION", "INSUFFICIENT DATA"];
const PERFORMANCE_PR_READINESS_STATES = ["READY", "APPROACHING", "NOT READY", "INSUFFICIENT EVIDENCE", "ESTIMATED ONLY", "RECENT REGRESSION"];
const PERFORMANCE_INTELLIGENCE_WINDOW_RULES = Object.freeze({
  recentWindowSize: 3,
  priorWindowSize: 3,
  minimumTrendSeries: 3,
  preferredConfidenceSeries: 6,
  meaningfulChangePct: 1,
  noisyBandPct: 6,
  likelyPlateauBandPct: 2,
  possiblePlateauBandPct: 3,
  likelyRegressionPct: 3,
  approachingPrGapPct: 5,
  readyPrGapPct: 2
});
const FITNESS_TEST_PROTOCOL_CATALOG = [
  {
    code: "DOMINION_MONTHLY_FITNESS_TEST",
    displayName: "Dominion Monthly Fitness Test",
    description: "Standard monthly test with strength, core, conditioning, and running benchmarks.",
    version: "1.0",
    orderedEvents: [
      { code: "push_ups_2m", name: "Push-ups in 2 minutes", metricType: "repetitions", unit: "repetitions", direction: "higher", required: true },
      { code: "pull_ups_max", name: "Pull-ups, maximum strict repetitions", metricType: "repetitions", unit: "repetitions", direction: "higher", required: true },
      { code: "air_squats_2m", name: "Air squats in 2 minutes", metricType: "repetitions", unit: "repetitions", direction: "higher", required: true },
      { code: "plank_hold", name: "Plank hold", metricType: "duration", unit: "seconds", direction: "higher", required: true },
      { code: "hanging_leg_raises", name: "Hanging leg raises", metricType: "repetitions", unit: "repetitions", direction: "higher", required: true },
      { code: "burpees_10m", name: "Burpees in 10 minutes", metricType: "repetitions", unit: "repetitions", direction: "higher", required: true },
      { code: "two_mile_run", name: "2-mile run", metricType: "distance_duration", unit: "seconds", direction: "lower", required: true },
      { code: "hundred_m_sprint", name: "100-meter sprint", metricType: "sprint_duration", unit: "seconds", direction: "lower", required: false }
    ],
    completionRules: { requiredEvents: ["push_ups_2m", "pull_ups_max", "air_squats_2m", "plank_hold", "hanging_leg_raises", "burpees_10m", "two_mile_run"] },
    scoringPlaceholder: "Overall score is derived from completed events once scoring rules are finalized.",
    active: true
  },
  {
    code: "CUSTOM_TEST",
    displayName: "Custom Test",
    description: "User-defined protocol using selected supported events.",
    version: "1.0",
    orderedEvents: [],
    completionRules: { requiredEvents: [] },
    scoringPlaceholder: "Overall score is optional for custom tests.",
    active: true
  }
];
const FITNESS_TEST_ATTEMPT_STATUS_OPTIONS = ["DRAFT", "IN PROGRESS", "COMPLETE", "INCOMPLETE", "INVALIDATED"];
const FITNESS_TEST_EVENT_METRIC_TYPES = new Set(["repetitions", "duration", "distance_duration", "sprint_duration", "load_and_repetitions", "rounds", "numeric_score"]);
const PERSONAL_RECORD_CATEGORY_OPTIONS = ["LOAD_PR", "REP_PR", "VOLUME_PR", "ESTIMATED_1RM_PR", "VERIFIED_1RM_PR", "TIME_PR", "DISTANCE_PR", "DURATION_PR", "TEST_EVENT_PR", "TEST_SCORE_PR", "CONDITIONING_PR"];
const MILESTONE_CATALOG = [
  { code: "FIRST_STRENGTH_BENCHMARK", title: "First strength benchmark logged", description: "A first strength benchmark is now recorded.", domain: "strength", evaluationType: "entry", targetValue: 1, targetUnit: "entry", direction: "higher", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Strength baseline established." },
  { code: "BENCH_PRESS_BODYWEIGHT_1_0", title: "Bench press 1.0× bodyweight", description: "Bench press weight meets at least 1.0× bodyweight.", domain: "strength", evaluationType: "ratio", targetValue: 1, targetUnit: "bodyweight", direction: "higher", requiredActivity: "bench_press", evidenceRequirement: "VERIFIED", repeatable: false, active: true, commandNote: "Strong foundation benchmark reached." },
  { code: "PULL_UPS_20", title: "20 strict pull-ups", description: "A strength benchmark of 20 strict pull-ups was achieved.", domain: "strength", evaluationType: "repetitions", targetValue: 20, targetUnit: "repetitions", direction: "higher", requiredActivity: "pull_up", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "A meaningful pull-up milestone was achieved." },
  { code: "PLANK_2MIN", title: "2-minute plank", description: "A 2-minute plank hold was achieved.", domain: "core", evaluationType: "duration", targetValue: 120, targetUnit: "seconds", direction: "higher", requiredActivity: "plank", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Core endurance milestone reached." },
  { code: "PLANK_3MIN", title: "3-minute plank", description: "A 3-minute plank hold was achieved.", domain: "core", evaluationType: "duration", targetValue: 180, targetUnit: "seconds", direction: "higher", requiredActivity: "plank", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Core endurance milestone reached." },
  { code: "PLANK_4MIN", title: "4-minute plank", description: "A 4-minute plank hold was achieved.", domain: "core", evaluationType: "duration", targetValue: 240, targetUnit: "seconds", direction: "higher", requiredActivity: "plank", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Core endurance milestone reached." },
  { code: "HANGING_LEG_RAISES_15", title: "15 hanging leg raises", description: "A milestone of 15 hanging leg raises was achieved.", domain: "core", evaluationType: "repetitions", targetValue: 15, targetUnit: "repetitions", direction: "higher", requiredActivity: "hanging_leg_raise", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Core repetition milestone reached." },
  { code: "HANGING_LEG_RAISES_20", title: "20 hanging leg raises", description: "A milestone of 20 hanging leg raises was achieved.", domain: "core", evaluationType: "repetitions", targetValue: 20, targetUnit: "repetitions", direction: "higher", requiredActivity: "hanging_leg_raise", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Core repetition milestone reached." },
  { code: "BURPEES_75_10M", title: "75 burpees in 10 minutes", description: "A 10-minute burpee benchmark of 75 repetitions was achieved.", domain: "conditioning", evaluationType: "repetitions", targetValue: 75, targetUnit: "repetitions", direction: "higher", requiredActivity: "burpee", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Conditioning benchmark reached." },
  { code: "BURPEES_90_10M", title: "90 burpees in 10 minutes", description: "A 10-minute burpee benchmark of 90 repetitions was achieved.", domain: "conditioning", evaluationType: "repetitions", targetValue: 90, targetUnit: "repetitions", direction: "higher", requiredActivity: "burpee", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Conditioning benchmark reached." },
  { code: "BURPEES_100_10M", title: "100 burpees in 10 minutes", description: "A 10-minute burpee benchmark of 100 repetitions was achieved.", domain: "conditioning", evaluationType: "repetitions", targetValue: 100, targetUnit: "repetitions", direction: "higher", requiredActivity: "burpee", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Conditioning benchmark reached." },
  { code: "FIRST_RACE_LOGGED", title: "First race logged", description: "A first race entry is now recorded.", domain: "running", evaluationType: "entry", targetValue: 1, targetUnit: "entry", direction: "higher", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Race history established." },
  { code: "SUB_7_MILE", title: "Sub-7:00 mile", description: "A sub-7-minute mile was completed.", domain: "running", evaluationType: "time", targetValue: 420, targetUnit: "seconds", direction: "lower", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "A strong running benchmark was achieved." },
  { code: "SUB_6_30_MILE", title: "Sub-6:30 mile", description: "A sub-6:30 mile was completed.", domain: "running", evaluationType: "time", targetValue: 390, targetUnit: "seconds", direction: "lower", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "A strong running benchmark was achieved." },
  { code: "SUB_20_5K", title: "Sub-20:00 5K", description: "A sub-20-minute 5K was completed.", domain: "running", evaluationType: "time", targetValue: 1200, targetUnit: "seconds", direction: "lower", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "A strong running benchmark was achieved." },
  { code: "SUB_90_MIN_HALF", title: "Sub-90-minute half marathon", description: "A sub-90-minute half marathon was completed.", domain: "running", evaluationType: "time", targetValue: 5400, targetUnit: "seconds", direction: "lower", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "A strong running benchmark was achieved." },
  { code: "FIRST_COMPLETE_DOMINION_TEST", title: "First complete Dominion Monthly Fitness Test", description: "A complete Dominion Monthly Fitness Test was saved.", domain: "fitness_test", evaluationType: "test", targetValue: 1, targetUnit: "test", direction: "higher", requiredActivity: null, evidenceRequirement: "VERIFIED", repeatable: false, active: true, commandNote: "Formal test history established." },
  { code: "FIVE_OR_MORE_EVENTS_IMPROVED", title: "Improved five or more events in one complete test", description: "One completed test improved five or more events versus a prior attempt.", domain: "fitness_test", evaluationType: "test", targetValue: 5, targetUnit: "events", direction: "higher", requiredActivity: null, evidenceRequirement: "VERIFIED", repeatable: false, active: true, commandNote: "A strong test-session improvement was observed." },
  { code: "THREE_CONSECUTIVE_MONTHLY_TESTS", title: "Completed three consecutive monthly tests", description: "Three consecutive completed monthly tests were logged.", domain: "fitness_test", evaluationType: "test", targetValue: 3, targetUnit: "tests", direction: "higher", requiredActivity: null, evidenceRequirement: "VERIFIED", repeatable: false, active: true, commandNote: "Consistent monthly test cadence achieved." },
  { code: "FIRST_BODY_METRIC_BASELINE", title: "First body-metric baseline completed", description: "A first body-metric baseline was logged.", domain: "body_metrics", evaluationType: "entry", targetValue: 1, targetUnit: "baseline", direction: "higher", requiredActivity: null, evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Baseline body metrics recorded." },
  { code: "TEN_WEEKLY_BODYWEIGHT_ENTRIES", title: "10 consecutive weekly bodyweight entries", description: "Ten consecutive weekly bodyweight entries were logged.", domain: "body_metrics", evaluationType: "entry", targetValue: 10, targetUnit: "entries", direction: "higher", requiredActivity: "bodyweight", evidenceRequirement: "SELF REPORTED", repeatable: false, active: true, commandNote: "Consistent bodyweight tracking is in place." }
];
const PERFORMANCE_ACTIVITY_CATALOG = {
  strength: [
    { code: "bench_press", label: "Bench Press" },
    { code: "squat", label: "Squat" },
    { code: "deadlift", label: "Deadlift" },
    { code: "overhead_press", label: "Overhead Press" },
    { code: "pull_up", label: "Pull-Up" },
    { code: "row", label: "Row" },
    { code: "custom", label: "Custom movement" }
  ],
  running: [
    { code: "easy_run", label: "Easy Run" },
    { code: "tempo", label: "Tempo" },
    { code: "interval", label: "Interval" },
    { code: "long_run", label: "Long Run" },
    { code: "recovery_run", label: "Recovery Run" },
    { code: "race", label: "Race" },
    { code: "custom", label: "Custom run" }
  ],
  core: [
    { code: "plank", label: "Plank" },
    { code: "hanging_leg_raise", label: "Hanging Leg Raise" },
    { code: "sit_up", label: "Sit-Up" },
    { code: "hollow_hold", label: "Hollow Hold" },
    { code: "custom", label: "Custom core benchmark" }
  ],
  conditioning: [
    { code: "burpee", label: "Burpee" },
    { code: "rowing", label: "Rowing" },
    { code: "assault_bike", label: "Assault Bike" },
    { code: "stair_machine", label: "Stair Machine" },
    { code: "circuit", label: "Circuit" },
    { code: "custom", label: "Custom conditioning test" }
  ],
  fitness_test: [
    { code: "wingate", label: "Wingate" },
    { code: "beep_test", label: "Beep Test" },
    { code: "yoyo_ir1", label: "Yo-Yo IR1" },
    { code: "custom", label: "Custom protocol" }
  ],
  body_metrics: [
    { code: "bodyweight", label: "Bodyweight" },
    { code: "waist", label: "Waist" },
    { code: "chest", label: "Chest" },
    { code: "arm", label: "Arm" },
    { code: "thigh", label: "Thigh" },
    { code: "custom", label: "Custom measurement" }
  ]
};
const COMPLIANCE_DOMAIN_LABELS = {
  mission: "Mission Compliance",
  strength: "Strength Compliance",
  cardio: "Running/Cardio Compliance",
  recovery: "Recovery Compliance",
  nutrition: "Nutrition Compliance"
};
const COMPLIANCE_STATUS_SCORES = { completed: 100, partial: 50, missed: 0 };
const COMPLIANCE_EXCLUDED_STATUSES = new Set(["excused", "not_applicable"]);
const WEEKLY_EVIDENCE_THRESHOLD = 60;
const TREND_WINDOW_SIZE = 4;
const TREND_SLOPE_THRESHOLD = 2;
const TREND_EVIDENCE_THRESHOLD = 60;
const COMPLIANCE_COLUMNS = [
  "compliance_date", "discipline_score", "score_evidence", "updated_at",
  ...COMPLIANCE_DOMAINS.flatMap((domain) => [
    `${domain}_status`, `${domain}_target`, `${domain}_actual`, `${domain}_note`,
    `${domain}_restriction`, `${domain}_approved_modification`
  ])
].join(",");

const readinessClass = {
  RED: "red",
  YELLOW: "yellow",
  GREEN: "green"
};

const readinessSeverity = {
  RED: "CRITICAL",
  YELLOW: "WARNING",
  GREEN: "SUCCESS"
};

const STANDARDS_CATALOG = [
  { code: "MISSION-EXECUTION-01", category: "Mission Execution", title: "Mission execution target", description: "A planned mission target is expected to be executed without unauthorized compensation.", evidenceRule: "A missed mission target without a protected exception may warrant review.", defaultSeverity: "LEVEL I", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "STRENGTH-01", category: "Strength Compliance", title: "Strength completion target", description: "Strength work should follow the assigned target unless a protected exception applies.", evidenceRule: "A missed strength target without a protected exception may warrant review.", defaultSeverity: "LEVEL I", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "CARDIO-01", category: "Running/Cardio Compliance", title: "Cardio completion target", description: "Assigned cardio work should be completed unless a protected exception applies.", evidenceRule: "A missed cardio target without a protected exception may warrant review.", defaultSeverity: "LEVEL I", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "RECOVERY-01", category: "Recov…225630 tokens truncated…(error) throw error;
      renderWeeklyInspection(aggregateFromStoredInspection(data), "SUPABASE");
    } catch (_) {
      saveLocalWeeklyInspection(payload);
      renderWeeklyInspection(finalized, "LOCAL");
    }
    await loadTrendsAnalytics();
  } catch (error) {
    setText("weekly-warning", error.message);
    button.disabled = false;
  }
}

function loadLocalAnalyticsHistory() {
  const user = session?.user?.id || "local";
  const dailyPrefix = `coach-dominion:daily-compliance:${user}:`;
  const weeklyPrefix = `coach-dominion:weekly-inspection:${user}:`;
  const dailyRecords = [];
  const inspections = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;
      const parsed = JSON.parse(window.localStorage.getItem(key));
      if (key.startsWith(dailyPrefix)) dailyRecords.push(parsed);
      if (key.startsWith(weeklyPrefix)) inspections.push(parsed);
    }
  } catch (_) {
    return { dailyRecords, inspections };
  }
  return { dailyRecords, inspections };
}

function signedDisplay(value, suffix = "%") {
  if (!Number.isFinite(Number(value))) return "—";
  const rounded = Math.round(Number(value));
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function renderTrendChart(elementId, series, valueKey, label) {
  const element = document.getElementById(elementId);
  const points = series.filter((item) => isFiniteMetric(item[valueKey]));
  if (!points.length) {
    element.innerHTML = `<div class="chart-empty">No ${label.toLowerCase()} data available.</div>`;
    return;
  }
  const width = window.innerWidth < 640 ? 320 : 640;
  const height = window.innerWidth < 640 ? 210 : 230;
  const left = 42;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const x = (index) => points.length === 1 ? width / 2 : left + index * ((width - left - right) / (points.length - 1));
  const y = (value) => top + (100 - Math.max(0, Math.min(100, Number(value)))) / 100 * (height - top - bottom);
  const finalized = points.filter((item) => item.kind === "FINALIZED");
  const finalizedCoordinates = finalized.map((item) => `${x(points.indexOf(item))},${y(item[valueKey])}`).join(" ");
  const provisional = points.find((item) => item.kind === "PROVISIONAL");
  const prior = provisional ? points.slice(0, points.indexOf(provisional)).at(-1) : null;
  const provisionalLine = provisional && prior ? `<line class="chart-line chart-provisional-line" x1="${x(points.indexOf(prior))}" y1="${y(prior[valueKey])}" x2="${x(points.indexOf(provisional))}" y2="${y(provisional[valueKey])}"></line>` : "";
  const grid = [0, 25, 50, 75, 100].map((value) => `<line class="chart-gridline" x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}"></line><text class="chart-label" x="4" y="${y(value) + 4}">${value}</text>`).join("");
  const marks = points.map((item, index) => {
    const weakEvidence = valueKey === "score" && Number(item.evidenceCoverage) < TREND_EVIDENCE_THRESHOLD;
    return `<circle class="chart-point ${item.kind === "PROVISIONAL" ? "provisional" : ""} ${weakEvidence ? "weak-evidence" : ""}" cx="${x(index)}" cy="${y(item[valueKey])}" r="5"><title>${item.weekStartDate}: ${item[valueKey]}% ${item.kind.toLowerCase()}${weakEvidence ? "; limited evidence" : ""}</title></circle><text class="chart-label" text-anchor="middle" x="${x(index)}" y="${height - 25}">${item.weekStartDate.slice(5)}</text><text class="chart-label" text-anchor="middle" x="${x(index)}" y="${y(item[valueKey]) - 9}">${Math.round(item[valueKey])}</text>`;
  }).join("");
  const equivalent = points.map((item) => `${item.weekStartDate}: ${item[valueKey]}% (${item.kind.toLowerCase()}${valueKey === "score" && Number(item.evidenceCoverage) < TREND_EVIDENCE_THRESHOLD ? ", limited evidence" : ""})`).join("; ");
  element.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}. Fixed axis from zero to one hundred percent.">${grid}${finalizedCoordinates ? `<polyline class="chart-line" points="${finalizedCoordinates}"></polyline>` : ""}${provisionalLine}${marks}</svg><p class="chart-equivalent">${equivalent}</p>`;
}

function renderLegacyTrendsAnalytics(inspections, dailyRecords, storageMode) {
  inspectionHistory = canonicalFinalizedInspections(inspections);
  const currentRange = getInspectionWeekRange(todayISODate());
  const currentAggregate = aggregateWeeklyCompliance(dailyRecords, currentRange.weekStartDate);
  const hasFinalizedCurrentWeek = sortInspectionHistory(inspections).some((item) => item.weekStartDate === currentRange.weekStartDate && item.finalizedAt);
  const provisional = currentAggregate.counts.assessedObservations > 0 && !hasFinalizedCurrentWeek ? currentAggregate : null;
  const trajectory = deriveTrajectoryState(inspectionHistory);
  const domainTrends = calculateDomainTrends(inspectionHistory);
  const streaks = calculateComplianceStreaks(dailyRecords, todayISODate());
  const summary = summarizeInspectionHistory(inspectionHistory);
  const chartSeries = buildChartSeries(inspectionHistory, provisional);
  const report = generateAtlasTrendReport({ trajectory, domainTrends, streaks, summary, chartSeries });
  setText("trajectory-status", trajectory.state);
  document.getElementById("trajectory-status").className = `state-pill ${trajectory.state === "IMPROVING" ? "green" : trajectory.state === "DECLINING" ? "red" : trajectory.state === "LIMITED EVIDENCE" ? "yellow" : "neutral"}`;
  setText("analytics-storage", `${storageMode} ANALYTICS — derived, not stored`);
  setText("trend-summary-trajectory", trajectory.state || "INSUFFICIENT HISTORY");
  setText("trend-summary-score-change", signedDisplay(summary.scoreChange));
  setText("trend-summary-evidence", trajectory.averageEvidence === null ? "—" : `${Math.round(trajectory.averageEvidence)}%`);
  const domainAtRisk = report.domainAtRisk === "No declining domain established." ? "—" : report.domainAtRisk;
  setText("trend-summary-domain", domainAtRisk);
  setText("trend-summary-consistency", report.consistency || "—");
  const windowDates = trajectory.window.map((item) => item.weekStartDate);
  setText("trend-window", windowDates.length ? `Finalized trend window: ${windowDates[0]} through ${windowDates.at(-1)} (${windowDates.length} scored weeks).` : "No finalized scored trend window available.");
  setText("trend-latest-score", summary.mostRecentFinalized ? formatDisciplineScore(summary.mostRecentFinalized.score) : "UNSCORED");
  setText("trend-average-score", formatDisciplineScore(summary.recentAverageScore));
  setText("trend-score-change", signedDisplay(summary.scoreChange));
  setText("trend-evidence-change", signedDisplay(summary.evidenceChange));
  setText("trend-best-week", summary.bestWeek ? `${summary.bestWeek.weekStartDate} // ${formatDisciplineScore(summary.bestWeek.score)}` : "—");
  setText("trend-lowest-week", summary.lowestWeek ? `${summary.lowestWeek.weekStartDate} // ${formatDisciplineScore(summary.lowestWeek.score)}` : "—");
  setText("trend-finalized-count", summary.finalizedCount);
  setText("trend-completion-rate", Number.isFinite(summary.recentInspectionCompletionRate) ? `${Math.round(summary.recentInspectionCompletionRate)}%` : "—");
  setText("current-assessed-streak", `${streaks.currentAssessedDayStreak} days`);
  setText("current-full-streak", `${streaks.currentFullyAssessedDayStreak} days`);
  setText("longest-assessed-streak", `${streaks.longestAssessedDayStreak} days`);
  document.getElementById("trend-domain-grid").innerHTML = COMPLIANCE_DOMAINS.map((key) => `<div class="trend-domain-card ${domainTrends[key].direction.toLowerCase().replaceAll(" ", "-")}"><span>${COMPLIANCE_DOMAIN_LABELS[key]}</span><strong>${domainTrends[key].direction}</strong><small>${domainTrends[key].slope === null ? "No reliable slope" : `${domainTrends[key].slope.toFixed(2)} pts/week`}</small></div>`).join("");
  renderTrendChart("discipline-trend-chart", chartSeries, "score", "Weekly Discipline Score");
  renderTrendChart("evidence-trend-chart", chartSeries, "evidenceCoverage", "Weekly Evidence Coverage");
  setText("atlas-trend-report", report.text);
  renderCommandCenterOverview(dailyState ? evaluateReadiness(dailyState) : null, weeklyInspection || {}, trajectory.state);
  renderRankSection();
  renderReviewHub();
}

function trendPreferenceKey() {
  return `coach-dominion:trends-view:${session?.user?.id || "local"}`;
}

function loadTrendPreferences() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(trendPreferenceKey()) || "null");
    if (typeof DominionTrends !== "undefined") trendRangeDays = DominionTrends.normalizeRangeDays(stored?.rangeDays);
    trendActiveView = ["overview", "training", "recovery", "body"].includes(stored?.view) ? stored.view : "overview";
    trendActiveMetric = ["discipline", "readiness", "weight"].includes(stored?.metric) ? stored.metric : "discipline";
  } catch (_) {
    trendRangeDays = 28;
    trendActiveView = "overview";
    trendActiveMetric = "discipline";
  }
}

function saveTrendPreferences() {
  try {
    window.localStorage.setItem(trendPreferenceKey(), JSON.stringify({
      rangeDays: trendRangeDays,
      view: trendActiveView,
      metric: trendActiveMetric
    }));
  } catch (_) {}
}

function trendNutritionHistory(rangeDays = 84) {
  const imported = connectedApi() ? connectedApi().aggregateNutritionByDate(connectedImportedRecords) : [];
  const importedByDate = new Map(imported.map((item) => [item.date, { ...item, source: "IMPORTED" }]));
  const rows = [];
  const anchor = new Date(`${todayISODate()}T12:00:00Z`);
  for (let offset = Math.max(1, Number(rangeDays || 84)) - 1; offset >= 0; offset -= 1) {
    const date = new Date(anchor.getTime() - offset * 86400000).toISOString().slice(0, 10);
    const manual = readManualNutrition(date);
    const record = importedByDate.get(date) || (manual ? { ...manual, source: "MANUAL" } : null);
    if (record) rows.push(record);
  }
  return rows;
}

function trendMetricValue(value, suffix = "") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return `${value}${suffix}`;
}

function trendSeriesBars(series = [], options = {}) {
  const points = (series || []).filter((item) => Number.isFinite(Number(item.value))).slice(-12);
  if (!points.length) return '<div class="trend-chart-empty"><strong>Signal not established</strong><span>Keep logging to unlock this trajectory.</span></div>';
  const values = points.map((item) => Number(item.value));
  const fixedMin = Number.isFinite(Number(options.min)) ? Number(options.min) : null;
  const fixedMax = Number.isFinite(Number(options.max)) ? Number(options.max) : null;
  let min = fixedMin ?? Math.min(...values);
  let max = fixedMax ?? Math.max(...values);
  if (min === max) {
    min -= Math.max(1, Math.abs(min) * 0.04);
    max += Math.max(1, Math.abs(max) * 0.04);
  }
  const span = max - min || 1;
  const unit = options.unit || "";
  return `<div class="trend-bars" role="img" aria-label="${escapeHtml(options.label || "Trend")} from ${escapeHtml(points[0].date)} to ${escapeHtml(points.at(-1).date)}">
    ${points.map((item) => {
      const value = Number(item.value);
      const height = Math.max(8, Math.min(100, ((value - min) / span) * 88 + 8));
      return `<div class="trend-bar" style="--trend-bar:${height}%"><i></i><strong>${escapeHtml(Number.isInteger(value) ? value : value.toFixed(1))}${escapeHtml(unit)}</strong><span>${escapeHtml(item.date.slice(5))}</span></div>`;
    }).join("")}
  </div>`;
}

function trendSparkBars(series = []) {
  const points = (series || []).filter((item) => Number.isFinite(Number(item.value))).slice(-7);
  if (!points.length) return '<span class="trend-spark empty"></span>';
  const values = points.map((item) => Number(item.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return `<span class="trend-spark" aria-hidden="true">${points.map((item) => `<i style="--spark:${Math.max(18, ((Number(item.value) - min) / span) * 82 + 18)}%"></i>`).join("")}</span>`;
}

function renderTrendPrimaryChart(model = trendDashboardModel) {
  const element = document.getElementById("trend-primary-chart");
  const title = document.getElementById("trend-focus-title");
  if (!element || !title || !model) return;
  const configs = {
    discipline: { title: "Discipline", series: model.discipline.series, unit: "%", min: 0, max: 100 },
    readiness: { title: "Readiness", series: model.readiness.series, unit: "", min: 1, max: 10 },
    weight: { title: "Weight", series: model.weight.series, unit: "", min: null, max: null }
  };
  const config = configs[trendActiveMetric] || configs.discipline;
  title.textContent = config.title;
  element.innerHTML = trendSeriesBars(config.series, { ...config, label: `${config.title} trajectory` });
  document.querySelectorAll("[data-trend-metric]").forEach((button) => button.setAttribute("aria-pressed", button.dataset.trendMetric === trendActiveMetric ? "true" : "false"));
}

function setTrendView(view = "overview") {
  trendActiveView = ["overview", "training", "recovery", "body"].includes(view) ? view : "overview";
  document.querySelectorAll("[data-trend-pane]").forEach((pane) => { pane.hidden = pane.dataset.trendPane !== trendActiveView; });
  document.querySelectorAll("[data-trend-view]").forEach((button) => button.setAttribute("aria-selected", button.dataset.trendView === trendActiveView ? "true" : "false"));
  saveTrendPreferences();
}

function renderProgramTrends(model, domainTrends, trajectory, storageMode) {
  trendDashboardModel = model;
  setText("trend-command-signal", model.coaching.signal);
  setText("trend-command-detail", model.coaching.detail);
  const action = document.getElementById("trend-command-action");
  action.textContent = model.coaching.action.label;
  action.href = `#${model.coaching.action.section}`;
  action.dataset.section = model.coaching.action.section;
  setText("trend-evidence-score", `${model.evidence.score}%`);
  setText("trend-evidence-label", model.evidence.label);
  setText("trend-evidence-sources", `${model.evidence.sourceCount} of ${model.evidence.possibleSources} signals`);
  document.getElementById("trend-evidence-ring").style.setProperty("--trend-evidence", model.evidence.score);
  document.querySelectorAll("[data-trend-range]").forEach((button) => button.setAttribute("aria-pressed", Number(button.dataset.trendRange) === model.rangeDays ? "true" : "false"));

  document.getElementById("trend-kpi-grid").innerHTML = model.kpis.map((item) => `<article class="trend-kpi ${escapeHtml(item.tone)}" data-kpi="${escapeHtml(item.id)}">
    <header><span>${escapeHtml(item.label)}</span>${trendSparkBars(item.series)}</header>
    <strong>${trendMetricValue(item.value, item.suffix)}</strong>
    <small>${escapeHtml(item.deltaLabel || "Signal not established")}</small>
    <em>${escapeHtml(item.evidence || "No evidence")}</em>
  </article>`).join("");

  setText("trend-win", model.coaching.win);
  setText("trend-watch", model.coaching.watch);
  setText("trend-next", model.coaching.next);
  renderTrendPrimaryChart(model);

  const training = model.training;
  document.getElementById("trend-training-grid").innerHTML = [
    ["Strength", training.strengthSessions, "days"],
    ["Running", training.runMiles, "miles"],
    ["Core", training.coreSessions, "sessions"],
    ["Active", training.totalSessionDays, "days"]
  ].map(([label, value, unit]) => `<article><span>${label}</span><strong>${value}</strong><small>${unit} · ${model.rangeLabel}</small></article>`).join("");

  const readiness = model.readiness;
  document.getElementById("trend-recovery-grid").innerHTML = [
    ["Energy", trendMetricValue(readiness.value, "/10"), "latest 7d"],
    ["Sleep", trendMetricValue(readiness.sleepAverage, " hr"), "range average"],
    ["Resting HR", trendMetricValue(readiness.rhrAverage, " bpm"), "range average"],
    ["HRV", trendMetricValue(readiness.hrvAverage, " ms"), "range average"]
  ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");

  setText("trend-body-weight", trendMetricValue(model.weight.value, " lb"));
  setText("trend-body-change", model.weight.changeLabel);
  document.getElementById("trend-body-chart").innerHTML = trendSeriesBars(model.weight.series, { label: "Weight trajectory" });
  const windowDates = trajectory.window.map((item) => item.weekStartDate);
  setText("trend-window", windowDates.length ? `${windowDates[0]} — ${windowDates.at(-1)} · ${windowDates.length} finalized week${windowDates.length === 1 ? "" : "s"}` : "No finalized scored window yet.");
  setText("analytics-storage", storageMode === "SUPABASE" ? "ACCOUNT EVIDENCE" : "DEVICE EVIDENCE");
  setText("trend-method-version", model.version);
  document.getElementById("trend-domain-grid").innerHTML = COMPLIANCE_DOMAINS.map((key) => `<div class="trend-domain-card ${domainTrends[key].direction.toLowerCase().replaceAll(" ", "-")}"><span>${COMPLIANCE_DOMAIN_LABELS[key]}</span><strong>${domainTrends[key].direction}</strong><small>${domainTrends[key].slope === null ? "Learning" : `${domainTrends[key].slope.toFixed(1)} pts/wk`}</small></div>`).join("");
  setTrendView(trendActiveView);
}

function renderTrendsAnalytics(inspections, dailyRecords, storageMode) {
  inspectionHistory = canonicalFinalizedInspections(inspections);
  const currentRange = getInspectionWeekRange(todayISODate());
  const currentAggregate = aggregateWeeklyCompliance(dailyRecords, currentRange.weekStartDate);
  const hasFinalizedCurrentWeek = sortInspectionHistory(inspections).some((item) => item.weekStartDate === currentRange.weekStartDate && item.finalizedAt);
  const provisional = currentAggregate.counts.assessedObservations > 0 && !hasFinalizedCurrentWeek ? currentAggregate : null;
  const trajectory = deriveTrajectoryState(inspectionHistory, { windowSize: Math.max(4, Math.round(trendRangeDays / 7)) });
  const domainTrends = calculateDomainTrends(inspectionHistory, { windowSize: Math.max(4, Math.round(trendRangeDays / 7)) });
  if (typeof DominionTrends === "undefined") {
    renderLegacyTrendsAnalytics(inspections, dailyRecords, storageMode);
    return;
  }
  trendAnalyticsContext = { inspections, dailyRecords, storageMode };
  const model = DominionTrends.buildProgramTrendModel({
    today: todayISODate(),
    rangeDays: trendRangeDays,
    inspections: inspectionHistory,
    dailyStates: mergeReadinessHistory(),
    dailyRecords,
    performanceEntries,
    strengthHistory: readStrengthHistory(),
    coreHistory: readCoreHistory(),
    nutritionDays: trendNutritionHistory(84),
    nutritionTargets: currentNutritionBaseTargets(todayISODate())
  });
  renderProgramTrends(model, domainTrends, trajectory, storageMode);
  renderCommandCenterOverview(dailyState ? evaluateReadiness(dailyState) : null, weeklyInspection || provisional || {}, trajectory.state);
  renderRankSection();
  renderReviewHub();
}

async function loadTrendsAnalytics() {
  try {
    const supabase = await getClient();
    const results = await Promise.all([
      supabase.from("weekly_inspections").select("week_start_date,week_end_date,weekly_discipline_score,evidence_coverage,domain_scores,inspection_status,finalized_at").eq("user_id", session.user.id).order("week_start_date", { ascending: true }),
      supabase.from("daily_compliance").select(COMPLIANCE_COLUMNS).eq("user_id", session.user.id).lte("compliance_date", todayISODate()).order("compliance_date", { ascending: true })
    ]);
    if (results[0].error) throw results[0].error;
    if (results[1].error) throw results[1].error;
    renderTrendsAnalytics(results[0].data || [], results[1].data || [], "SUPABASE");
  } catch (_) {
    const local = loadLocalAnalyticsHistory();
    renderTrendsAnalytics(local.inspections, local.dailyRecords, "LOCAL FALLBACK");
  }
}

