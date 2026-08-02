Exit code: 0
Wall time: 1.1 seconds
Total output lines: 15874
Output:
let client;
let session;
let dailyState;
let readinessHistory = [];
let dailyCompliance;
let weeklyInspection;
let weeklyDailyRecords = [];
let inspectionHistory = [];
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
  { code: "RECOVERY-01", category: "Recovery", title: "Recovery restriction", description: "Recovery restrictions must be respected and not ignored.", evidenceRule: "Ignoring a recovery restriction or tra…222612 tokens truncated…SPECTION" ? "yellow" : "neutral"}`;
  setText("weekly-range", `${aggregate.weekStartDate} — ${aggregate.weekEndDate}`);
  setText("weekly-score", `${formatDisciplineScore(aggregate.score)}${aggregate.score !== null && aggregate.scoreIsProvisional ? " · PROVISIONAL" : ""}`);
  setText("weekly-coverage", `${Math.round(aggregate.evidenceCoverage)}%`);
  setText("weekly-storage", storageMode === "SUPABASE" ? "SUPABASE" : "LOCAL FALLBACK");
  setText("weekly-assessed-days", `${aggregate.counts.assessedDays} / ${aggregate.counts.fullyAssessedDays}`);
  setText("weekly-unscored-days", aggregate.counts.unscoredDays);
  setText("weekly-result-counts", `${aggregate.counts.completed} / ${aggregate.counts.partial} / ${aggregate.counts.missed}`);
  setText("weekly-excluded-counts", `${aggregate.counts.excused} / ${aggregate.counts.notApplicable}`);
  setText("weekly-modification-count", aggregate.counts.approvedModifications);
  setText("weekly-evidence-through", aggregate.evidenceThroughDate || "Week not started");
  setText("weekly-projected-coverage", `${Math.round(aggregate.projectedFullWeekCoverage || 0)}%`);
  setText("weekly-calculation-meta", `${aggregate.calculationVersion || INSPECTION_CALCULATION_VERSION} · ${aggregate.elapsedDayCount || 0}/7 days elapsed`);
  setText("weekly-strongest", aggregate.strongestDomains.length ? aggregate.strongestDomains.map(label).join(" / ") : "UNSCORED");
  setText("weekly-weakest", aggregate.domainRankingTie ? "NO DISTINCT WEAKEST — TIED" : aggregate.weakestDomains.length ? aggregate.weakestDomains.map(label).join(" / ") : "UNSCORED");
  setText("weekly-missed", aggregate.missedRequirements.length ? aggregate.missedRequirements.map((item) => `${item.date} ${label(item.domain)}`).join("; ") : "None recorded.");
  setText("weekly-excused", aggregate.excusedConditions.length ? aggregate.excusedConditions.map((item) => `${item.date} ${label(item.domain)}: ${item.restriction}`).join("; ") : "None recorded.");
  document.getElementById("weekly-domain-scores").innerHTML = COMPLIANCE_DOMAINS.map((key) => `<div><span>${COMPLIANCE_DOMAIN_LABELS[key]}</span><strong>${formatDisciplineScore(aggregate.domainScores[key].score)}</strong></div>`).join("");
  document.getElementById("weekly-evidence").innerHTML = aggregate.dailyEvidence.map((day) => `<details class="weekly-evidence-day ${day.periodState === "FUTURE" ? "future" : day.assessedCount ? "neutral" : "missing"}"><summary><strong>${day.date}</strong><span>${day.periodState === "FUTURE" ? "FUTURE · NOT COUNTED" : `${day.assessedCount}/5 ASSESSED`}</span></summary><p>${day.periodState === "FUTURE" ? "Excluded from current inspection evidence." : `${day.includedCount} applicable scoring observations`}</p></details>`).join("");
  setText("weekly-report", (aggregate.atlasReport || generateWeeklyAfterActionReport(aggregate)).text);
  const weeklyStandardsSummary = document.getElementById("weekly-standards-summary");
  const weeklyStandardsItems = standardsReviewState.filter((item) => item.sourceDate && item.sourceDate <= aggregate.weekEndDate && item.sourceDate >= aggregate.weekStartDate);
  if (weeklyStandardsSummary) {
    weeklyStandardsSummary.innerHTML = weeklyStandardsItems.length
      ? weeklyStandardsItems.map((item) => `<article class="standards-item"><div class="standards-item-header"><strong>${item.domain}</strong><span class="state-pill ${item.status === "CONFIRMED" ? "green" : item.status === "RESOLVED" ? "neutral" : item.status === "DISMISSED" ? "neutral" : item.status === "EXCUSED" ? "neutral" : "yellow"}">${item.status || "CANDIDATE"}</span></div><p>${item.evidence || "No evidence recorded."}</p><small>${item.severity?.level || "LEVEL I"}</small></article>`).join("")
      : '<div class="standards-empty">No standards review history for this inspection week.</div>';
  }
  const missingLabels = (aggregate.missingRequiredDomains || []).map(label);
  const warning = finalized
    ? `Finalized ${new Date(aggregate.finalizedAt).toLocaleString()}. Historical snapshot is read-only.`
    : aggregate.scoreIsProvisional
      ? `Provisional inspection. Evidence is measured only through ${aggregate.evidenceThroughDate || "the week start"}${missingLabels.length ? `; incomplete required domains: ${missingLabels.join(", ")}` : ""}${!aggregate.weekComplete ? "; the week is still in progress" : ""}.`
      : "";
  setText("weekly-warning", warning);
  const finalizeButton = document.getElementById("finalize-week");
  finalizeButton.disabled = finalized || !aggregate.canFinalize;
  finalizeButton.textContent = finalized ? "Inspection Finalized" : "Finalize Inspection";
  finalizeButton.setAttribute("aria-disabled", finalizeButton.disabled ? "true" : "false");
  const finalizeHint = document.getElementById("weekly-finalize-hint");
  if (finalizeHint) finalizeHint.textContent = finalized ? "This inspection is finalized and read-only." : finalizeState.readOnlyMessage;
  const inspectionSection = document.getElementById("inspection");
  if (inspectionSection) inspectionSection.dataset.finalized = finalized ? "true" : "false";
  renderCommandCenterOverview(dailyState ? evaluateReadiness(dailyState) : null, aggregate);
  renderWeeklyPlan(aggregate);
  renderStandardsSection();
  renderActivationGuide();
  renderReviewHub();
}

async function loadWeeklyInspectionLegacy() {
  const selectedDate = document.getElementById("weekly-date").value || todayISODate();
  const range = getInspectionWeekRange(selectedDate);
  setText("weekly-warning", "Calculating weekly evidence…");
  try {
    const supabase = await getClient();
    const { data: saved, error: inspectionError } = await supabase.from("weekly_inspections").select("*").eq("user_id", session.user.id).eq("week_start_date", range.weekStartDate).maybeSingle();
    if (inspectionError) throw inspectionError;
    if (saved?.finalized_at) {
      renderWeeklyInspection(aggregateFromStoredInspection(saved), "SUPABASE");
      return;
    }
    const { data: records, error: recordsError } = await supabase.from("daily_compliance").select(COMPLIANCE_COLUMNS).eq("user_id", session.user.id).gte("compliance_date", range.weekStartDate).lte("compliance_date", range.weekEndDate);
    if (recordsError) throw recordsError;
    weeklyDailyRecords = records || [];
    const aggregate = aggregateWeeklyCompliance(weeklyDailyRecords, range.weekStartDate);
    aggregate.atlasReport = generateWeeklyAfterActionReport(aggregate);
    const payload = weeklyPersistencePayload(aggregate);
    const { error: draftError } = await supabase.from("weekly_inspections").upsert(payload, { onConflict: "user_id,week_start_date" });
    if (draftError) throw draftError;
    renderWeeklyInspection(aggregate, "SUPABASE");
  } catch (error) {
    const saved = loadLocalWeeklyInspection(range.weekStartDate);
    if (saved?.finalized_at) {
      setText("weekly-warning", `Remote weekly inspection data could not be loaded (${error?.message || "unknown error"}). Showing the finalized local snapshot.`);
      renderWeeklyInspection(aggregateFromStoredInspection(saved), "LOCAL");
      return;
    }
    weeklyDailyRecords = loadLocalWeekRecords(range);
    const aggregate = aggregateWeeklyCompliance(weeklyDailyRecords, range.weekStartDate);
    aggregate.atlasReport = generateWeeklyAfterActionReport(aggregate);
    saveLocalWeeklyInspection(weeklyPersistencePayload(aggregate));
    const message = weeklyDailyRecords.length
      ? `Remote weekly inspection data could not be loaded (${error?.message || "unknown error"}). Showing local fallback.`
      : `Remote weekly inspection data could not be loaded (${error?.message || "unknown error"}). No local fallback rows were found.`;
    setText("weekly-warning", message);
    renderWeeklyInspection(aggregate, "LOCAL");
  }
}

async function loadWeeklyInspection() {
  const selectedDate = document.getElementById("weekly-date").value || todayISODate();
  const range = getInspectionWeekRange(selectedDate);
  setText("weekly-warning", "Calculating weekly evidence…");
  const supabase = await getClient();
  const inspectionResult = await supabase.from("weekly_inspections").select("*").eq("user_id", session.user.id).eq("week_start_date", range.weekStartDate).maybeSingle();
  if (inspectionResult.data?.finalized_at && !inspectionResult.error) {
    renderWeeklyInspection(aggregateFromStoredInspection(inspectionResult.data), "SUPABASE");
    return;
  }

  const recordsResult = await supabase.from("daily_compliance").select(COMPLIANCE_COLUMNS).eq("user_id", session.user.id).gte("compliance_date", range.weekStartDate).lte("compliance_date", range.weekEndDate);

  const localSaved = loadLocalWeeklyInspection(range.weekStartDate);
  const outcome = resolveWeeklyInspectionLoadOutcome({
    savedInspection: inspectionResult.data || localSaved,
    inspectionReadError: inspectionResult.error,
    remoteRecords: recordsResult.data,
    recordsReadError: recordsResult.error,
    draftWriteError: null,
    localRecords: loadLocalWeekRecords(range)
  });
  if (outcome.mode === "FINALIZED_LOCAL") {
    renderWeeklyInspection(aggregateFromStoredInspection(outcome.inspection), outcome.storageMode);
    setText("weekly-warning", outcome.warning);
    return;
  }
  weeklyDailyRecords = outcome.records;
  const aggregate = aggregateWeeklyCompliance(weeklyDailyRecords, range.weekStartDate);
  aggregate.atlasReport = generateWeeklyAfterActionReport(aggregate);
  if (outcome.storageMode === "LOCAL") saveLocalWeeklyInspection(weeklyPersistencePayload(aggregate));
  renderWeeklyInspection(aggregate, outcome.storageMode);
  if (outcome.warning) setText("weekly-warning", outcome.warning);
}

async function finalizeWeeklyInspection() {
  if (!weeklyInspection) return;
  const finalizeState = deriveFinalizeConfirmationState(Boolean(weeklyInspection.finalizedAt), weeklyInspection.evidenceCoverage);
  if (!finalizeState.canFinalize || !weeklyInspection.canFinalize) {
    setText("weekly-warning", !weeklyInspection.weekComplete ? "Finalization is available after the inspection week ends." : "Finalization requires sufficient evidence across every required domain.");
    return;
  }
  const confirmed = window.confirm(`${finalizeState.readOnlyMessage}\n\nFinalize this inspection now?`);
  if (!confirmed) return;
  const button = document.getElementById("finalize-week");
  button.disabled = true;
  try {
    const finalized = finalizeWeeklyInspectionSnapshot(weeklyInspection);
    const payload = weeklyPersistencePayload(finalized, finalized.finalizedAt);
    try {
      const supabase = await getClient();
      const { data, error } = await supabase.from("weekly_inspections").upsert(payload, { onConflict: "user_id,week_start_date" }).select("*").single();
      if (error) throw error;
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

function renderTrendsAnalytics(inspections, dailyRecords, storageMode) {
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

