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
let trendBodyMetric = "waist";
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
let bodyProgressPhotos = [];
let bodyPhotoUrls = new Map();
let bodyPhotoState = { loading: true, available: false, migrationRequired: false, error: null };
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
let fastingProtocolDraft = null;
let mealExecutionDraft = null;
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
let currentProgramCommand = null;
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
  { code: "BENCH_PRESS_BODYWEIGHT_1_0", title: "Bench press 1.0Ã— bodyweight", description: "Bench press weight meets at least 1.0Ã— bodyweight.", domain: "strength", evaluationType: "ratio", targetValue: 1, targetUnit: "bodyweight", direction: "higher", requiredActivity: "bench_press", evidenceRequirement: "VERIFIED", repeatable: false, active: true, commandNote: "Strong foundation benchmark reached." },
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
  { code: "FIVE_OR_MORE_EVENTS_IMPROVED", title: "Improved five or more events in one complete test", description: "One completed test improved five or more events versus a prior attempt.", domain: "fitness_test", evaluationType: "test", targetValue: 5, targetUnit: "events", direction: "higher", requiredActivity: null, evidenceRequirement: "VERIFIED", repeatable: false, active: true, commandNote: "A stronÛµã‹h‘éì¶»§q«^uµµ¥ÑÑ•‘U¹¥™¥•‘…ä¡‘…Ñ”¤°(€€€¥µÁ½ÉÑ•‘QÉ…¥¹¥¹…ä°(€€€™…±±‰…­]¥¹‘½ÜèÉ•…‘5•…±QÉ…¥¹¥¹]¥¹‘½Ü ¤°(€€€ÍÁ±¥Ñ¡•­Á½¥¹ĞèÉ•…‘MÁ±¥Ñ…å¡•­Á½¥¹Ğ¡‘…Ñ”¤(€ô¤ì)ô()™Õ¹Ñ¥½¸‰Õ¥±‘ÕÉÉ•¹Ñ5•…±½…¡¥¹A±…¸¡‘…Ñ”€ô¹ÕÑÉ¥Ñ¥½¹½µµ…¹‘…Ñ” ¤¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹5•…±½…¡¥¹œ€ôôô€‰Õ¹‘•™¥¹•ˆñğ€…½¹¹•Ñ•‘Á¤ ¤¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍĞ‰…Í•±¥¹”€ô…Ñ¥Ù•9ÕÑÉ¥Ñ¥½¹	…Í•±¥¹”¡‘…Ñ”¤ì(€½¹ÍĞ…±•¹‘…É½¹Ñ•áĞ€ô‰Õ¥±‘ÕÉÉ•¹ÑÕ•±…±•¹‘…É½¹Ñ•áĞ¡‘…Ñ”¤ì(€½¹ÍĞ™…ÍÑ¥¹½¹Ñ•áĞ€ô‰Õ¥±‘ÕÉÉ•¹Ñ…ÍÑ¥¹½¹Ñ•áĞ¡‘…Ñ”°…±•¹‘…É½¹Ñ•áĞ¤ì(€½¹ÍĞÑÉ…¥¹¥¹…ä€ô…±•¹‘…É½¹Ñ•áĞü¹ÑÉ…¥¹¥¹…ä€ôôôÑÉÕ”ì(€½¹ÍĞÑ…É•ÑÌ€ô‰…Í•±¥¹”€ü€¡ÑÉ…¥¹¥¹…ä€ü‰…Í•±¥¹”¹ÑÉ…¥¹¥¹Q…É•ÑÌ€è‰…Í•±¥¹”¹É•½Ù•ÉåQ…É•ÑÌ¤€èíôì(€½¹ÍĞÁ±…¸€ô½µ¥¹¥½¹5•…±½…¡¥¹œ¹‰Õ¥±‘5•…±½…¡¥¹A±…¸¡ì(€€€‘…Ñ”°(€€€Ñ…É•ÑÌ°(€€€ÑÉ…¥¹¥¹…ä°(€€€ÑÉ…¥¹¥¹]¥¹‘½Üè™…ÍÑ¥¹½¹Ñ•áĞü¹µ•…±]¥¹‘½Üñğ…±•¹‘…É½¹Ñ•áĞü¹µ•…±]¥¹‘½ÜñğÉ•…‘5•…±QÉ…¥¹¥¹]¥¹‘½Ü ¤°(€€€µ•…±Ìè¹ÕÑÉ¥Ñ¥½¹5•…±Í½É…Ñ”¡‘…Ñ”¤(€ô¤ì(€É•ÑÕÉ¸ì€¸¸¹Á±…¸°…±•¹‘…É½¹Ñ•áĞ°™…ÍÑ¥¹½¹Ñ•áĞôì)ô()™Õ¹Ñ¥½¸É•¹‘•É5•…±½…¡¥¹œ ¤ì(€½¹ÍĞ½ÕÑÁÕĞ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ½…¡¥¹œµ½ÕÑÁÕĞˆ¤ì(€½¹ÍĞÍÑ…ÑÕÌ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ½…¡¥¹œµÍÑ…ÑÕÌˆ¤ì(€½¹ÍĞİ¥¹‘½İM•±•Ğ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µÑÉ…¥¹¥¹œµİ¥¹‘½Üˆ¤ì(€¥˜€ …½ÕÑÁÕĞñğ€…ÍÑ…ÑÕÌñğ€…İ¥¹‘½İM•±•ĞñğÑåÁ•½˜½µ¥¹¥½¹5•…±½…¡¥¹œ€ôôô€‰Õ¹‘•™¥¹•ˆñğ€…½¹¹•Ñ•‘Á¤ ¤¤É•ÑÕÉ¸ì(€¥˜€¡İ¥¹‘½İM•±•Ğ¹Ù…±Õ”€ôôô€‰U9M!U1ˆ¤İ¥¹‘½İM•±•Ğ¹Ù…±Õ”€ôÉ•…‘5•…±QÉ…¥¹¥¹]¥¹‘½Ü ¤ì(€½¹ÍĞÁ±…¸€ô‰Õ¥±‘ÕÉÉ•¹Ñ5•…±½…¡¥¹A±…¸ ¤ì(€¥˜€ …Á±…¸¤É•ÑÕÉ¸ì(€ÍÑ…ÑÕÌ¹Ñ•áÑ½¹Ñ•¹Ğ€ôÁ±…¸¹ÍÑ…ÑÕÌì(€ÍÑ…ÑÕÌ¹±…ÍÍ9…µ”€ôÍÑ…Ñ”µÁ¥±°€‘íÁ±…¸¹ÍÑ…ÑÕÌ€ôôô€‰50Y%9Q%Yˆ€ü€‰É••¸ˆ€èÁ±…¸¹ÍÑ…ÑÕÌ€ôôô€‰U1%95@Q%Yˆ€ü€‰å•±±½Üˆ€è€‰¹•ÕÑÉ…°‰õ€ì(€¥˜€ …Á±…¸¹Í±½ÑÌ¹±•¹Ñ ¤ì(€€€½ÕÑÁÕĞ¹±…ÍÍ9…µ”€ô€‰Á•É™½Éµ…¹”µ•µÁÑäˆì(€€€½ÕÑÁÕĞ¹¥¹¹•É!Q50€ô€ñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡Á±…¸¹ÍÑ…ÑÕÌ¥ôğ½ÍÑÉ½¹œøñÀø‘í•Í…Á•!Ñµ°¡Á±…¸¹É•…Í½¸¥ôğ½Àù€ì(€€€É•ÑÕÉ¸ì(€ô(€½¹ÍĞÍ±½ÑÌ€ôÁ±…¸¹Í±½ÑÌ¹µ…À ¡Í±½Ğ°¥¹‘•à¤€ôø€ñ…ÉÑ¥±”±…ÍÌô‰µ•…°µÍ±½Ğˆø(€€€€ñÍÁ…¸ù¹¡½È€‘í¥¹‘•à€¬€Åôğ½ÍÁ…¸øñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡Í±½Ğ¹±…‰•°¥ôğ½ÍÑÉ½¹œø(€€€€ñ‘°ø(€€€€€€ñ‘¥Øøñ‘Ğù…±½É¥•Ìğ½‘Ğøñ‘ø‘í5…Ñ ¹É½Õ¹¡Í±½Ğ¹…±½É¥•Ì¥ôğ½‘øğ½‘¥Øø(€€€€€€ñ‘¥Øøñ‘ĞùAÉ½Ñ•¥¸ğ½‘Ğøñ‘ø‘í5…Ñ ¹É½Õ¹¡Í±½Ğ¹ÁÉ½Ñ•¥¸¥õœğ½‘øğ½‘¥Øø(€€€€€€ñ‘¥Øøñ‘Ğù…É‰Ìğ½‘Ğøñ‘ø‘í5…Ñ ¹É½Õ¹¡Í±½Ğ¹…É‰Ì¥õœğ½‘øğ½‘¥Øø(€€€€€€ñ‘¥Øøñ‘Ğù…Ğğ½‘Ğøñ‘ø‘í5…Ñ ¹É½Õ¹¡Í±½Ğ¹™…Ğ¥õœğ½‘øğ½‘¥Øø(€€€€ğ½‘°øñÀø‘í•Í…Á•!Ñµ°¡Í±½Ğ¹¹½Ñ”¥ôğ½Àø(€€ğ½…ÉÑ¥±”ù€¤¹©½¥¸ ˆˆ¤ì(€½¹ÍĞµ•…±Ì€ôÁ±…¸¹µ•…±Ì¹±•¹Ñ €ü€ñ‘¥Ø±…ÍÌô‰µ•…°µ•Ù¥‘•¹”µ±¥ÍĞˆø‘íÁ±…¸¹µ•…±Ì¹µ…À ¡µ•…°¤€ôø€ñ…ÉÑ¥±”±…ÍÌô‰µ•…°µ•Ù¥‘•¹”ˆøñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡µ•…°¹¹…µ”¥ôğ½ÍÑÉ½¹œøñÍµ…±°ø‘í5…Ñ ¹É½Õ¹¡µ•…°¹…±½É¥•Ì¥ô­…°ƒ
Ü€‘í5…Ñ ¹É½Õ¹¡µ•…°¹ÁÉ½Ñ•¥¸¥õœÁÉ½Ñ•¥¸ƒ
Ü€‘í5…Ñ ¹É½Õ¹¡µ•…°¹…É‰Ì¥õœ…É‰Ìƒ
Ü€‘í5…Ñ ¹É½Õ¹¡µ•…°¹™…Ğ¥õœ™…Ğğ½Íµ…±°øğ½…ÉÑ¥±”ù€¤¹©½¥¸ ˆˆ¥ôğ½‘¥Øù€€è€ˆˆì(€½ÕÑÁÕĞ¹±…ÍÍ9…µ”€ô€ˆˆì(€½ÕÑÁÕĞ¹¥¹¹•É!Q50€ô€ñÀøñÍÑÉ½¹œø‘íÁ±…¸¹ÑÉ…¥¹¥¹…ä€ü€‰QI%9%9dˆ€è€‰I=YIdd‰ôğ½ÍÑÉ½¹œøƒ
Ü€‘í•Í…Á•!Ñµ°¡Á±…¸¹ÑÉ…¥¹¥¹]¥¹‘½Ü¹É•Á±…” ‰|ˆ°€ˆ€ˆ¤¥ôÑ¥µ¥¹œƒ
Ü€‘í•Í…Á•!Ñµ°¡Á±…¸¹‘…Ñ”¥ôğ½Àø(€€€€ñ‘¥Ø±…ÍÌô‰µ•…°µÍ±½ĞµÉ¥ˆø‘íÍ±½ÑÍôğ½‘¥Øø(€€€€ñ‘¥Ø±…ÍÌô‰¹ÕÑÉ¥Ñ¥½¸µÉ•Ù¥•Üµ…Éˆøñ Ğù%µÁ½ÉÑ•µ•…°•Ù¥‘•¹”ğ½ ĞøñÀø‘í•Í…Á•!Ñµ°¡Á±…¸¹•Ù¥‘•¹•5•ÍÍ…”¥ôğ½Àø‘íµ•…±Íôğ½‘¥Øø(€€€€ñÕ°±…ÍÌô‰‰…Í•±¥¹”µÍ…™•Õ…É‘Ìˆø‘íÁ±…¸¹Í…™•Õ…É‘Ì¹µ…À ¡¥Ñ•´¤€ôø€ñ±¤ø‘í•Í…Á•!Ñµ°¡¥Ñ•´¥ôğ½±¤ù€¤¹©½¥¸ ˆˆ¥ôğ½Õ°ù€ì)ô()™Õ¹Ñ¥½¸‰Õ¥±‘ÕÉÉ•¹ÑQ½‘…å9ÕÑÉ¥Ñ¥½¹á•ÕÑ¥½¸ ¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹Q½‘…å9ÕÑÉ¥Ñ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆñğ€…½¹¹•Ñ•‘Á¤ ¤¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍĞ‘…Ñ”€ôÑ½‘…å%M=…Ñ” ¤ì(€½¹ÍĞ¹ÕÑÉ¥Ñ¥½¹…åÌ€ô½¹¹•Ñ•‘Á¤ ¤¹…É•…Ñ•9ÕÑÉ¥Ñ¥½¹	å…Ñ”¡½¹¹•Ñ•‘%µÁ½ÉÑ•‘I•½É‘Ì¤ì(€½¹ÍĞ¥µÁ½ÉÑ•€ô¹ÕÑÉ¥Ñ¥½¹…åÌ¹™¥¹ ¡‘…ä¤€ôø‘…ä¹‘…Ñ”€ôôô‘…Ñ”¤ñğ¹Õ±°ì(€½¹ÍĞµ…¹Õ…°€ôÉ•…‘5…¹Õ…±9ÕÑÉ¥Ñ¥½¸¡‘…Ñ”¤ì(€½¹ÍĞ…ÑÕ…°€ô¥µÁ½ÉÑ•ñğµ…¹Õ…°ñğíôì(€½¹ÍĞÍ½ÕÉ”€ô¥µÁ½ÉÑ•€ü€‰5e%Q9MMA0ˆ€èµ…¹Õ…°€ü€‰59U0ˆ€è¹ÕÑÉ¥Ñ¥½¹…åÌ¹±•¹Ñ €ü€‰5e%Q9MMA0ˆ€è€‰9=9ˆì(€½¹ÍĞÍ½ÕÉ•I•½É‘•‘Ğ€ô¥µÁ½ÉÑ•ü¹É•½É‘Ì(€€€€ü¹µ…À ¡É•½É¤€ôøÉ•½É¹Í½ÕÉ•UÁ‘…Ñ•‘ĞñğÉ•½É¹ÕÁ‘…Ñ•‘ĞñğÉ•½É¹É•…Ñ•‘ĞñğÉ•½É¹½ÕÉÉ•‘Ğ¤(€€€€¹™¥±Ñ•È¡	½½±•…¸¤(€€€€¹Í½ÉĞ ¤(€€€€¹…Ğ ´Ä¤ñğµ…¹Õ…°ü¹ÕÁ‘…Ñ•‘Ğñğ¹Õ±°ì(€½¹ÍĞÑÉ…¥¹¥¹M•ÍÍ¥½¹Ì€ô½¹¹•Ñ•‘Á¤ ¤¹É½ÕÁ¥Ñ‰½‘]½É­½ÕÑM•ÍÍ¥½¹Ì¡½¹¹•Ñ•‘%µÁ½ÉÑ•‘I•½É‘Ì¤ì(€½¹ÍĞ…±•¹‘…É½¹Ñ•áĞ€ô‰Õ¥±‘ÕÉÉ•¹ÑÕ•±…±•¹‘…É½¹Ñ•áĞ¡‘…Ñ”¤ì(€½¹ÍĞ™…ÍÑ¥¹½¹Ñ•áĞ€ô‰Õ¥±‘ÕÉÉ•¹Ñ…ÍÑ¥¹½¹Ñ•áĞ¡‘…Ñ”°…±•¹‘…É½¹Ñ•áĞ¤ì(€½¹ÍĞÑÉ…¥¹¥¹…ä€ô…±•¹‘…É½¹Ñ•áĞü¹ÑÉ…¥¹¥¹…ä€ôôôÑÉÕ”ì(€½¹ÍĞ‰…Í•Q…É•ÑÌ€ôÕÉÉ•¹Ñ9ÕÑÉ¥Ñ¥½¹Q…É•ÑÍ½É½¹Ñ•áĞ¡ÑÉ…¥¹¥¹…ä°‘…Ñ”¤ì(€½¹ÍĞ…ÁÁÉ½Ù•‘Õ•±¥¹œ€ôÉ•…‘ÁÁÉ½Ù•‘‘…ÁÑ¥Ù•Õ•±¥¹œ¡ÕÉÉ•¹Ñ‘…ÁÑ¥Ù•Õ•±¥¹½…° ¤¤ì(€½¹ÍĞÑ…É•ÑÌ€ô…ÁÁÉ½Ù•‘Õ•±¥¹œ€ü€¡ÑÉ…¥¹¥¹…ä€ü…ÁÁÉ½Ù•‘Õ•±¥¹œ¹ÑÉ…¥¹¥¹Q…É•ÑÌ€è…ÁÁÉ½Ù•‘Õ•±¥¹œ¹É•½Ù•ÉåQ…É•ÑÌ¤€è‰…Í•Q…É•ÑÌì(€½¹ÍĞÉ•…‘¥¹•ÍÌ€ô‘…¥±åMÑ…Ñ”ü¹‘…Ñ”€ôôô‘…Ñ”€ü•Ù…±Õ…Ñ•=Á•É…Ñ¥½¹…±I•…‘¥¹•ÍÌ¡‘…¥±åMÑ…Ñ”¤¹ÍÑ…Ñ”€è€‰U9-9=]8ˆì(€É•ÑÕÉ¸½µ¥¹¥½¹Q½‘…å9ÕÑÉ¥Ñ¥½¸¹‰Õ¥±‘Q½‘…å9ÕÑÉ¥Ñ¥½¹á•ÕÑ¥½¸¡ì(€€€‘…Ñ”°(€€€…ÑÕ…±…Ñ”è¥µÁ½ÉÑ•ü¹‘…Ñ”ñğµ…¹Õ…°ü¹‘…Ñ”ñğ¹Õ±°°(€€€±…Ñ•ÍÑÙ¥‘•¹•…Ñ”è¹ÕÑÉ¥Ñ¥½¹…åÍlÁtü¹‘…Ñ”ñğ¹Õ±°°(€€€Í½ÕÉ•I•½É‘•‘Ğ°(€€€…ÑÕ…°°(€€€Ñ…É•ÑÌ°(€€€Í½ÕÉ”°(€€€ÑÉ…¥¹¥¹…ä°(€€€ÑÉ…¥¹¥¹]¥¹‘½Üè™…ÍÑ¥¹½¹Ñ•áĞü¹µ•…±]¥¹‘½Üñğ…±•¹‘…É½¹Ñ•áĞü¹µ•…±]¥¹‘½ÜñğÉ•…‘5•…±QÉ…¥¹¥¹]¥¹‘½Ü ¤°(€€€…±•¹‘…É½¹Ñ•áĞ°(€€€™…ÍÑ¥¹½¹Ñ•áĞ°(€€€É•…‘¥¹•ÍÌ(€ô¤ì)ô()™Õ¹Ñ¥½¸‰Õ¥±‘ÕÉÉ•¹ÑÕ•±±½Í•‘1½½À¡‘…Ñ”€ôÑ½‘…å%M=…Ñ” ¤°•á•ÕÑ¥½¸€ô¹Õ±°¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹Õ•±±½Í•‘1½½À€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍĞÑ…É•Ñá•ÕÑ¥½¸€ô•á•ÕÑ¥½¸ñğ‰Õ¥±‘ÕÉÉ•¹ÑQ½‘…å9ÕÑÉ¥Ñ¥½¹á•ÕÑ¥½¸ ¤ì(€¥˜€ …Ñ…É•Ñá•ÕÑ¥½¸¤É•ÑÕÉ¸¹Õ±°ì(€É•ÑÕÉ¸½µ¥¹¥½¹Õ•±±½Í•‘1½½À¹‰Õ¥±‘Õ•±1½½À¡ì(€€€‘…Ñ”°(€€€•á•ÕÑ¥½¸èÑ…É•Ñá•ÕÑ¥½¸°(€€€µ•…±1•‘•ÈèÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤°(€€€±•‘•ÈèÉ•…‘Õ•±±½Í•‘1½½Á1•‘•È ¤°(€€€¹½Üè‘…Ñ”€ôôôÑ½‘…å%M=…Ñ” ¤€ü¹•Ü…Ñ” ¤€è¹•Ü…Ñ”¡€‘í‘…Ñ•õPÈÀèÀÀèÀÁ€¤(€ô¤ì)ô()™Õ¹Ñ¥½¸‰Õ¥±‘ÕÉÉ•¹ÑÕ•±½µµ…¹ ¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹Õ•±½µµ…¹€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍĞ•á•ÕÑ¥½¸€ô‰Õ¥±‘ÕÉÉ•¹ÑQ½‘…å9ÕÑÉ¥Ñ¥½¹á•ÕÑ¥½¸ ¤ì(€½¹ÍĞµ•…±A±…¸€ô‰Õ¥±‘ÕÉÉ•¹Ñ5•…±½…¡¥¹A±…¸¡Ñ½‘…å%M=…Ñ” ¤¤ì(€½¹ÍĞ±½Í•‘1½½À€ô‰Õ¥±‘ÕÉÉ•¹ÑÕ•±±½Í•‘1½½À¡Ñ½‘…å%M=…Ñ” ¤°•á•ÕÑ¥½¸¤ì(€É•ÑÕÉ¸½µ¥¹¥½¹Õ•±½µµ…¹¹‰Õ¥±‘Õ•±½µµ…¹¡ì•á•ÕÑ¥½¸°µ•…±A±…¸°±½Í•‘1½½À°…±•¹‘…É½¹Ñ•áĞè•á•ÕÑ¥½¸ü¹…±•¹‘…É½¹Ñ•áĞ°™…ÍÑ¥¹½¹Ñ•áĞè•á•ÕÑ¥½¸ü¹™…ÍÑ¥¹½¹Ñ•áĞ°¹½Üè¹•Ü…Ñ” ¤ô¤ì)ô()™Õ¹Ñ¥½¸¡å‘É…Ñ•5•…±á•ÕÑ¥½¹AÉ•™•É•¹•Ì¡™½É”€ô™…±Í”¤ì(€½¹ÍĞ™½É´€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ•á•ÕÑ¥½¸µÁÉ•™•É•¹•Ìµ™½É´ˆ¤ì(€¥˜€ …™½É´ñğ™½É´¹‘…Ñ…Í•Ğ¹¡å‘É…Ñ•€ôôô€‰ÑÉÕ”ˆ€˜˜€…™½É”ñğÑåÁ•½˜½µ¥¹¥½¹5•…±á•ÕÑ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸ì(€½¹ÍĞÁÉ•™•É•¹•Ì€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤¹ÁÉ•™•É•¹•Ìì(€™½É´¹•±•µ•¹ÑÌ¹‘¥•Ğ¹Ù…±Õ”€ôÁÉ•™•É•¹•Ì¹‘¥•Ğì(€™½É´¹•±•µ•¹ÑÌ¹ÁÉ•À¹Ù…±Õ”€ôÁÉ•™•É•¹•Ì¹ÁÉ•Àì(€™½É´¹ÅÕ•ÉåM•±•Ñ½É±° ¥¹ÁÕÑm¹…µ”ô‰•á±ÕÍ¥½¹Ì‰tœ¤¹™½É…  ¡¥¹ÁÕĞ¤€ôøì(€€€¥¹ÁÕĞ¹¡•­•€ôÁÉ•™•É•¹•Ì¹•á±ÕÍ¥½¹Ì¹¥¹±Õ‘•Ì¡¥¹ÁÕĞ¹Ù…±Õ”¤ì(€ô¤ì(€™½É´¹‘…Ñ…Í•Ğ¹¡å‘É…Ñ•€ô€‰ÑÉÕ”ˆì)ô()™Õ¹Ñ¥½¸µ•…±á•ÕÑ¥½¹M•ÅÕ•¹”¡É•½É¤ì(€½¹ÍĞµ…Ñ €ôMÑÉ¥¹œ¡É•½Éü¹¥ñğ€ˆˆ¤¹µ…Ñ  ¼´¡q¬¤¼¤ì(€É•ÑÕÉ¸µ…Ñ €ü9Õµ‰•È¡µ…Ñ¡lÅt¤€è€Äì)ô()™Õ¹Ñ¥½¸¹•áÑ5•…±á•ÕÑ¥½¹M•ÅÕ•¹”¡‘…Ñ”€ôÑ½‘…å%M=…Ñ” ¤¤ì(€½¹ÍĞ±•‘•È€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤ì(€½¹ÍĞÉ•½É‘Ì€ô½µ¥¹¥½¹5•…±á•ÕÑ¥½¸¹µ•É•I•½É¡±•‘•È¹¡¥ÍÑ½Éä°±•‘•È¹ÕÉÉ•¹Ğ¤¹™¥±Ñ•È ¡¥Ñ•´¤€ôø¥Ñ•´¹‘…Ñ”€ôôô‘…Ñ”¤ì(€É•ÑÕÉ¸5…Ñ ¹µ…à À°€¸¸¹É•½É‘Ì¹µ…À¡µ•…±á•ÕÑ¥½¹M•ÅÕ•¹”¤¤€¬€Äì)ô()™Õ¹Ñ¥½¸‰Õ¥±‘ÕÉÉ•¹Ñ5•…±á•ÕÑ¥½¹=É‘•È¡½ÁÑ¥½¹Ì€ôíô¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹5•…±á•ÕÑ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍĞ™Õ•°€ô‰Õ¥±‘ÕÉÉ•¹ÑÕ•±½µµ…¹ ¤ì(€¥˜€ …™Õ•°¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍĞ±•‘•È€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤ì(€½¹ÍĞÉ•µ…¥¹¥¹œ€ôìµ•ÑÉ¥Ìè=‰©•Ğ¹™É½µ¹ÑÉ¥•Ì¡™Õ•°¹µ•ÑÉ¥Ì¹µ…À ¡µ•ÑÉ¥Œ¤€ôømµ•ÑÉ¥Œ¹­•ä°ìÉ•µ…¥¹¥¹œèµ•ÑÉ¥Œ¹É•µ…¥¹¥¹œõt¤¤ôì(€É•ÑÕÉ¸½µ¥¹¥½¹5•…±á•ÕÑ¥½¸¹‰Õ¥±‘5•…±=É‘•È¡ì(€€€‘…Ñ”èÑ½‘…å%M=…Ñ” ¤°(€€€¹•áÑ5•…°è™Õ•°¹¹•áÑ5•…°°(€€€É•µ…¥¹¥¹œ°(€€€ÁÉ•™•É•¹•Ìè±•‘•È¹ÁÉ•™•É•¹•Ì°(€€€Í•±•Ñ¥½¸è½ÁÑ¥½¹Ì¹Í•±•Ñ¥½¸ñğ¹Õ±°°(€€€Í•ÅÕ•¹”è½ÁÑ¥½¹Ì¹Í•ÅÕ•¹”ñğ¹•áÑ5•…±á•ÕÑ¥½¹M•ÅÕ•¹” ¤°(€€€¹½Üè¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤(€ô¤ì)ô()™Õ¹Ñ¥½¸ÕÉÉ•¹Ñ5•…±á•ÕÑ¥½¹=É‘•È ¤ì(€½¹ÍĞ‘…Ñ”€ôÑ½‘…å%M=…Ñ” ¤ì(€¥˜€¡µ•…±á•ÕÑ¥½¹É…™Ğü¹‘…Ñ”€ôôô‘…Ñ”¤É•ÑÕÉ¸µ•…±á•ÕÑ¥½¹É…™Ğì(€½¹ÍĞÕÉÉ•¹Ğ€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤¹ÕÉÉ•¹Ğì(€¥˜€¡ÕÉÉ•¹Ğü¹‘…Ñ”€ôôô‘…Ñ”¤É•ÑÕÉ¸ÕÉÉ•¹Ğì(€µ•…±á•ÕÑ¥½¹É…™Ğ€ô‰Õ¥±‘ÕÉÉ•¹Ñ5•…±á•ÕÑ¥½¹=É‘•È ¤ì(€É•ÑÕÉ¸µ•…±á•ÕÑ¥½¹É…™Ğì)ô()™Õ¹Ñ¥½¸µ•…±5…É½5…É­ÕÀ¡±…‰•°°Ù…±Õ”°Õ¹¥Ğ€ô€‰œˆ¤ì(€½¹ÍĞ…µ½Õ¹Ğ€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡9Õµ‰•È¡Ù…±Õ”¤¤€ü5…Ñ ¹É½Õ¹¡9Õµ‰•È¡Ù…±Õ”¤¤€è¹Õ±°ì(€É•ÑÕÉ¸€ñ‘¥ØøñÍÁ…¸ø‘í•Í…Á•!Ñµ°¡±…‰•°¥ôğ½ÍÁ…¸øñÍÑÉ½¹œø‘í…µ½Õ¹Ğ€ôôô¹Õ±°€ü€ˆ´ˆ€è€‘í…µ½Õ¹Ñô‘íÕ¹¥Ñõôğ½ÍÑÉ½¹œøğ½‘¥Øù€ì)ô()™Õ¹Ñ¥½¸µ•…±½µÁ½¹•¹Ñ½¹ÑÉ½°¡½É‘•È°½µÁ½¹•¹Ğ¤ì(€½¹ÍĞ½ÁÑ¥½¹Ì€ô½É‘•È¹½ÁÑ¥½¹Ìü¹m½µÁ½¹•¹Ğ¹­¥¹‘tñğmtì(€¥˜€¡½É‘•È¹ÍÑ…ÑÕÌ€„ôô€‰Idˆ¤É•ÑÕÉ¸€ñ‘¥Ø±…ÍÌô‰µ•…°µ½µÁ½¹•¹Ğµ½ÁäˆøñÍÁ…¸ø‘í•Í…Á•!Ñµ°¡½µÁ½¹•¹Ğ¹­¥¹¥ôğ½ÍÁ…¸øñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡½µÁ½¹•¹Ğ¹Á½ÉÑ¥½¸¥ôğ½ÍÑÉ½¹œøğ½‘¥Øù€ì(€½¹ÍĞ¡½¥•Ì€ô½ÁÑ¥½¹Ì¹µ…À ¡¥Ñ•´¤€ôø€ñ½ÁÑ¥½¸Ù…±Õ”ôˆ‘í•Í…Á•!Ñµ°¡¥Ñ•´¹­•ä¥ôˆ€‘í¥Ñ•´¹­•ä€ôôô½µÁ½¹•¹Ğ¹­•ä€ü€‰Í•±•Ñ•ˆ€è€ˆ‰ôø‘í•Í…Á•!Ñµ°¡¥Ñ•´¹¹…µ”¥ôğ½½ÁÑ¥½¸ù€¤¹©½¥¸ ˆˆ¤ì(€É•ÑÕÉ¸€ñ±…‰•°±…ÍÌô‰µ•…°µ½µÁ½¹•¹Ğµ½¹ÑÉ½°ˆøñÍÁ…¸ø‘í•Í…Á•!Ñµ°¡½µÁ½¹•¹Ğ¹­¥¹¥ôğ½ÍÁ…¸øñÍ•±•Ğ‘…Ñ„µµ•…°µ½µÁ½¹•¹Ğôˆ‘í•Í…Á•!Ñµ°¡½µÁ½¹•¹Ğ¹­¥¹¥ôˆø‘í¡½¥•Íôğ½Í•±•ĞøñÍµ…±°ø‘í•Í…Á•!Ñµ°¡½µÁ½¹•¹Ğ¹Á½ÉÑ¥½¸¥ôğ½Íµ…±°øğ½±…‰•°ù€ì)ô()™Õ¹Ñ¥½¸É•¹‘•É5•…±á•ÕÑ¥½¹!¥ÍÑ½Éä ¤ì(€½¹ÍĞ½ÕÑÁÕĞ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ•á•ÕÑ¥½¸µ¡¥ÍÑ½Éäˆ¤ì(€¥˜€ …½ÕÑÁÕĞñğÑåÁ•½˜½µ¥¹¥½¹5•…±á•ÕÑ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸ì(€½¹ÍĞ±•‘•È€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤ì(€½¹ÍĞÉ•½É‘Ì€ô½µ¥¹¥½¹5•…±á•ÕÑ¥½¸¹µ•É•I•½É¡±•‘•È¹¡¥ÍÑ½Éä°±•‘•È¹ÕÉÉ•¹Ğ¤¹Í±¥” À°€ÄÈ¤ì(€¥˜€ …É•½É‘Ì¹±•¹Ñ ¤ì(€€€½ÕÑÁÕĞ¹±…ÍÍ9…µ”€ô€‰Á•É™½Éµ…¹”µ•µÁÑäˆì(€€€½ÕÑÁÕĞ¹Ñ•áÑ½¹Ñ•¹Ğ€ô€‰9¼µ•…°•á•ÕÑ¥½¸É•½É‘•å•Ğ¸ˆì(€€€É•ÑÕÉ¸ì(€ô(€½ÕÑÁÕĞ¹±…ÍÍ9…µ”€ô€‰µ•…°µÉ•½Éµ±¥ÍĞˆì(€½ÕÑÁÕĞ¹¥¹¹•É!Q50€ôÉ•½É‘Ì¹µ…À ¡É•½É¤€ôøì(€€€½¹ÍĞµ…É½Ì€ôÉ•½É¹…ÑÕ…°ñğÉ•½É¹•ÍÑ¥µ…Ñ”ñğíôì(€€€½¹ÍĞÍ½ÕÉ”€ôÉ•½É¹…ÑÕ…±M½ÕÉ”€ôôô€‰M1}IA=IQ}QU0ˆ€ü€‰¹Ñ•É•Ñ½Ñ…±Ìˆ€èÉ•½É¹ÍÑ…ÑÕÌ€ôôô€‰=9%I5ˆ€ü€‰½¹™¥Éµ••ÍÑ¥µ…Ñ”ˆ€è€‰A±…¹¹¥¹œ•ÍÑ¥µ…Ñ”ˆì(€€€É•ÑÕÉ¸€ñ…ÉÑ¥±”øñ‘¥ØøñÍÁ…¸ø‘í•Í…Á•!Ñµ°¡É•½É¹‘…Ñ”ñğ€ˆˆ¥ôğ½ÍÁ…¸øñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡É•½É¹¹…µ”ñğÉ•½É¹Í±½Ñ1…‰•°ñğ€‰5•…°ˆ¥ôğ½ÍÑÉ½¹œøñÍµ…±°ø‘í•Í…Á•!Ñµ°¡Í½ÕÉ”¥ô€´¥µÁ½ÉÑ•‘…¥±äÑ½Ñ…±ÌÉ•µ…¥¸…ÕÑ¡½É¥Ñ…Ñ¥Ù”ğ½Íµ…±°øğ½‘¥Øøñ‘¥ØøñÍÁ…¸±…ÍÌô‰ÍÑ…Ñ”µÁ¥±°€‘íÉ•½É¹ÍÑ…ÑÕÌ€ôôô€‰=9%I5ˆ€ü€‰É••¸ˆ€è€‰å•±±½Ü‰ôˆø‘í•Í…Á•!Ñµ°¡É•½É¹ÍÑ…ÑÕÌñğ€‰A199ˆ¥ôğ½ÍÁ…¸øñÍÑÉ½¹œø‘í5…Ñ ¹É½Õ¹¡9Õµ‰•È¡µ…É½Ì¹…±½É¥•Ìñğ€À¤¥ô­…°ğ½ÍÑÉ½¹œøñÍµ…±°ø‘í5…Ñ ¹É½Õ¹¡9Õµ‰•È¡µ…É½Ì¹ÁÉ½Ñ•¥¸ñğ€À¤¥õœ@€¼€‘í5…Ñ ¹É½Õ¹¡9Õµ‰•È¡µ…É½Ì¹…É‰Ìñğ€À¤¥õœ€¼€‘í5…Ñ ¹É½Õ¹¡9Õµ‰•È¡µ…É½Ì¹™…Ğñğ€À¤¥õœğ½Íµ…±°øğ½‘¥Øøğ½…ÉÑ¥±”ù€ì(€ô¤¹©½¥¸ ˆˆ¤ì)ô()™Õ¹Ñ¥½¸É•¹‘•É5•…±á•ÕÑ¥½¸ ¤ì(€½¹ÍĞÁ…¹•°€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ•á•ÕÑ¥½¸µÁ…¹•°ˆ¤ì(€½¹ÍĞ½ÕÑÁÕĞ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ•á•ÕÑ¥½¸µ½ÕÑÁÕĞˆ¤ì(€½¹ÍĞÍÑ…ÑÕÌ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ•á•ÕÑ¥½¸µÍÑ…ÑÕÌˆ¤ì(€½¹ÍĞ½¹™¥Éµ½É´€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ½¹™¥É´µ™½É´ˆ¤ì(€¥˜€ …Á…¹•°ñğ€…½ÕÑÁÕĞñğ€…ÍÑ…ÑÕÌñğ€…½¹™¥Éµ½É´ñğÑåÁ•½˜½µ¥¹¥½¹5•…±á•ÕÑ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸ì(€¡å‘É…Ñ•5•…±á•ÕÑ¥½¹AÉ•™•É•¹•Ì ¤ì(€½¹ÍĞ½É‘•È€ôÕÉÉ•¹Ñ5•…±á•ÕÑ¥½¹=É‘•È ¤ì(€½¹™¥Éµ½É´¹¡¥‘‘•¸€ôÑÉÕ”ì(€¥˜€ …½É‘•Èñğl‰9LQIQLˆ°€‰	1=-‰t¹¥¹±Õ‘•Ì¡½É‘•È¹ÍÑ…ÑÕÌ¤¤ì(€€€ÍÑ…ÑÕÌ¹Ñ•áÑ½¹Ñ•¹Ğ€ô½É‘•Èü¹ÍÑ…ÑÕÌñğ€‰U9Y%1	1ˆì(€€€ÍÑ…ÑÕÌ¹±…ÍÍ9…µ”€ôÍÑ…Ñ”µÁ¥±°€‘í½É‘•Èü¹ÍÑ…ÑÕÌ€ôôô€‰	1=-ˆ€ü€‰É•ˆ€è€‰¹•ÕÑÉ…°‰õ€ì(€€€½ÕÑÁÕĞ¹¥¹¹•É!Q50€ô€ñ‘¥Ø±…ÍÌô‰Á•É™½Éµ…¹”µ•µÁÑäˆøñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡½É‘•Èü¹ÍÑ…ÑÕÌ€ôôô€‰	1=-ˆ€ü€‰5•…°‰±½­•ˆ€è€‰Q…É•ÑÌ¹••‘•ˆ¥ôğ½ÍÑÉ½¹œøñÀø‘í•Í…Á•!Ñµ°¡½É‘•Èü¹É•…Í½¸ñğ€‰ÁÁÉ½Ù”‘…¥±äÕ•°Ñ…É•ÑÌÑ¼‰Õ¥±„µ•…°¸ˆ¥ôğ½Àøğ½‘¥Øù€ì(€€€É•¹‘•É5•…±á•ÕÑ¥½¹!¥ÍÑ½Éä ¤ì(€€€É•ÑÕÉ¸ì(€ô(€ÍÑ…ÑÕÌ¹Ñ•áÑ½¹Ñ•¹Ğ€ô½É‘•È¹ÍÑ…ÑÕÌì(€ÍÑ…ÑÕÌ¹±…ÍÍ9…µ”€ôÍÑ…Ñ”µÁ¥±°€‘í½É‘•È¹ÍÑ…ÑÕÌ€ôôô€‰=9%I5ˆ€ü€‰É••¸ˆ€è½É‘•È¹ÍÑ…ÑÕÌ€ôôô€‰A199ˆ€ü€‰å•±±½Üˆ€è€‰¹•ÕÑÉ…°‰õ€ì(€½¹ÍĞ½µÁ½¹•¹ÑÌ€ô½É‘•È¹½µÁ½¹•¹ÑÌ¹µ…À ¡½µÁ½¹•¹Ğ¤€ôøµ•…±½µÁ½¹•¹Ñ½¹ÑÉ½°¡½É‘•È°½µÁ½¹•¹Ğ¤¤¹©½¥¸ ˆˆ¤ì(€½¹ÍĞµ…É½Ì€ô€‘íµ•…±5…É½5…É­ÕÀ ‰…±½É¥•Ìˆ°½É‘•È¹•ÍÑ¥µ…Ñ”ü¹…±½É¥•Ì°€ˆˆ¥ô‘íµ•…±5…É½5…É­ÕÀ ‰AÉ½Ñ•¥¸ˆ°½É‘•È¹•ÍÑ¥µ…Ñ”ü¹ÁÉ½Ñ•¥¸¥ô‘íµ•…±5…É½5…É­ÕÀ ‰…É‰Ìˆ°½É‘•È¹•ÍÑ¥µ…Ñ”ü¹…É‰Ì¥ô‘íµ•…±5…É½5…É­ÕÀ ‰…Ğˆ°½É‘•È¹•ÍÑ¥µ…Ñ”ü¹™…Ğ¥õ€ì(€½¹ÍĞ…Ñ¥½¹Ì€ô½É‘•È¹ÍÑ…ÑÕÌ€ôôô€‰Idˆ(€€€€ü€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µµ•…°µ•á•ÕÑ¥½¸µ…Ñ¥½¸ô‰A18ˆùA±…¸Ñ¡¥Ìµ•…°ğ½‰ÕÑÑ½¸ù€(€€€€è½É‘•È¹ÍÑ…ÑÕÌ€ôôô€‰A199ˆ(€€€€€€ü€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µµ•…°µ•á•ÕÑ¥½¸µ…Ñ¥½¸ô‰=9%I4ˆù½¹™¥É´•…Ñ•¸ğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌô‰¡½ÍĞˆ‘…Ñ„µµ•…°µ•á•ÕÑ¥½¸µ…Ñ¥½¸ô‰!9ˆù¡…¹”µ•…°ğ½‰ÕÑÑ½¸ù€(€€€€€€è€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µµ•…°µ•á•ÕÑ¥½¸µ…Ñ¥½¸ô‰9\ˆù	Õ¥±…¹½Ñ¡•Èµ•…°ğ½‰ÕÑÑ½¸ù€ì(€½ÕÑÁÕĞ¹¥¹¹•É!Q50€ô€ñ…ÉÑ¥±”±…ÍÌô‰µ•…°µ½É‘•È€‘í½É‘•È¹ÍÑ…ÑÕÌ¹Ñ½1½İ•É…Í” ¥ôˆø(€€€€ñ¡•…‘•Èøñ‘¥ØøñÍÁ…¸ø‘í•Í…Á•!Ñµ°¡½É‘•È¹Í±½Ñ1…‰•°¥ôğ½ÍÁ…¸øñ Ğø‘í•Í…Á•!Ñµ°¡½É‘•È¹¹…µ”¥ôğ½ ĞøñÀø‘í•Í…Á•!Ñµ°¡½É‘•È¹¹½Ñ”¥ôğ½Àøğ½‘¥ØøñÍÑÉ½¹œø‘í•Í…Á•!Ñµ°¡½É‘•È¹Ñ¥µ¥¹œ¥ôğ½ÍÑÉ½¹œøğ½¡•…‘•Èø(€€€€ñ‘¥Ø±…ÍÌô‰µ•…°µ½µÁ½¹•¹ĞµÉ¥ˆø‘í½µÁ½¹•¹ÑÍôğ½‘¥Øø(€€€€ñ‘¥Ø±…ÍÌô‰µ•…°µ•ÍÑ¥µ…Ñ”ˆøñ‘¥Øø‘íµ…É½Íôğ½‘¥ØøñÍµ…±°ùÍÑ¥µ…Ñ•Á½ÉÑ¥½¹Ì¸Y•É¥™äÁ…­…•µ™½½±…‰•±Ì…¹…‘©ÕÍĞ™½Èİ¡…Ğå½Ô…ÑÕ…±±ä•…Ğ¸ğ½Íµ…±°øğ½‘¥Øø(€€€€ñ‘¥Ø±…ÍÌô‰µ•…°µ•á•ÕÑ¥½¸µ…Ñ¥½¹Ìˆø‘í…Ñ¥½¹Íôğ½‘¥Øø(€€€€ñ™½½Ñ•ÈøñÍÁ…¸ùUMµ¥¹™½Éµ•Á±…¹¹¥¹œ•ÍÑ¥µ…Ñ”ğ½ÍÁ…¸øñ„¡É•˜ô‰¡ÑÑÁÌè¼½™‘Œ¹¹…°¹ÕÍ‘„¹½Ø¼ˆÑ…É•Ğô‰}‰±…¹¬ˆÉ•°ô‰¹½É•™•ÉÉ•Èˆù½½‘…Ñ„•¹ÑÉ…°ğ½„øñÍµ…±°ø‘í•Í…Á•!Ñµ°¡½É‘•È¹•Ù¥‘•¹•A½±¥ä¥ôğ½Íµ…±°øğ½™½½Ñ•Èø(€€ğ½…ÉÑ¥±”ù€ì(€É•¹‘•É5•…±á•ÕÑ¥½¹!¥ÍÑ½Éä ¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸Í…Ù•5•…±á•ÕÑ¥½¹AÉ•™•É•¹•Ì¡•Ù•¹Ğ¤ì(€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹5•…±á•ÕÑ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸ì(€½¹ÍĞ‘…Ñ„€ô¹•Ü½Éµ…Ñ„¡•Ù•¹Ğ¹ÕÉÉ•¹ÑQ…É•Ğ¤ì(€½¹ÍĞ±•‘•È€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤ì(€½¹ÍĞÁÉ•™•É•¹•Ì€ô½µ¥¹¥½¹5•…±á•ÕÑ¥½¸¹¹½Éµ…±¥é•AÉ•™•É•¹•Ì¡ì(€€€‘¥•Ğè‘…Ñ„¹•Ğ ‰‘¥•Ğˆ¤°(€€€ÁÉ•Àè‘…Ñ„¹•Ğ ‰ÁÉ•Àˆ¤°(€€€•á±ÕÍ¥½¹Ìè‘…Ñ„¹•Ñ±° ‰•á±ÕÍ¥½¹Ìˆ¤(€ô¤ì(€µ•…±á•ÕÑ¥½¹É…™Ğ€ô¹Õ±°ì(€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥ĞÍ…Ù•5•…±á•ÕÑ¥½¹1•‘•È¡ì€¸¸¹±•‘•È°ÁÉ•™•É•¹•Ìô¤ì(€¡å‘É…Ñ•5•…±á•ÕÑ¥½¹AÉ•™•É•¹•Ì¡ÑÉÕ”¤ì(€É•¹‘•É9ÕÑÉ¥Ñ¥½¹½µµ…¹ ¤ì(€Í•ÑQ•áĞ ‰µ•…°µÁÉ•™•É•¹•Ìµ™••‘‰…¬ˆ°AÉ•™•É•¹•ÌÍ…Ù•‘íÉ•ÍÕ±Ğ¹Íå¹•€ü€ˆÑ¼å½ÕÈ…½Õ¹Ğˆ€è€ˆ±½…±±ä‰ô¸½½™¥±Ñ•ÉÌ‘¼¹½ĞÉ•Á±…”±…‰•°½È…±±•Éä¡•­Ì¹€¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸¡…¹‘±•5•…±á•ÕÑ¥½¹Ñ¥½¸¡…Ñ¥½¸¤ì(€¥˜€¡ÑåÁ•½˜½µ¥¹¥½¹5•…±á•ÕÑ¥½¸€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸ì(€½¹ÍĞ±•‘•È€ôÉ•…‘5•…±á•ÕÑ¥½¹1•‘•È ¤ì(€½¹ÍĞ½É‘•È€ôÕÉÉ•¹Ñ5•…±á•ÕÑ¥½¹=É‘•È ¤ì(€¥˜€ …½É‘•È¤É•ÑÕÉ¸ì(€¥˜€¡…Ñ¥½¸€ôôô€‰A18ˆ¤ì(€€€½¹ÍĞÁ±…¹¹•€ô½µ¥¹¥½¹5•…±á•ÕÑ¥½¸¹Á±…¹5•…°¡½É‘•È¤ì(€€€µ•…±á•ÕÑ¥½¹É…™Ğ€ô¹Õ±°ì(€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥ĞÍ…Ù•5•…±á•ÕÑ¥½¹1•‘•È¡ì€¸¸¹±•‘•È°ÕÉÉ•¹ĞèÁ±…¹¹•ô¤ì(€€€É•¹‘•É9ÕÑÉ¥Ñ¥½¹½µµ…¹ ¤ì(€€€Í•ÑQ•áĞ ‰µ•…°µ•á•ÕÑ¥½¸µ™••‘‰…¬ˆ°5•…°Á±…¹¹•‘íÉ•ÍÕ±Ğ¹Íå¹•€ü€ˆÑ¼å½ÕÈ…½Õ¹Ğˆ€è€ˆ±½…±±ä‰ô¸Q¡”•ÍÑ¥µ…Ñ”‘¥¹½Ğ¡…¹”Ñ½‘…äÌ¥¹Ñ…­”¹€¤ì(€€€É•ÑÕÉ¸ì(€ô(€¥˜€¡…Ñ¥½¸€ôôô€‰=9%I4ˆ¤ì(€€€½¹ÍĞ™½É´€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰µ•…°µ½¹™¥É´µ™½É´ˆ¤ì(€€€¥˜€ …™½É´¤É•ÑÕÉ¸ì(€€€l‰…±½É¥•Ìˆ°€‰ÁÉ½Ñ•¥¸ˆ°€‰…É‰Ìˆ°€‰™…Ğ‰t¹™½É…  ¡­•ä¤€ôøì™½É´¹•±•µ•¹ÑÍm­•åt¹Ù…±Õ”€ô5…Ñ ¹É½Õ¹¡9Õµ‰•È¡½É‘•È¹•ÍÑ¥µ…Ñ”ü¹m­•åtñğ€À¤¤ìô¤ì(€€€™½É´¹¡¥‘‘•¸€ô™…±Í”ì(€€€™½É´¹•±•µ•¹ÑÌ¹…±½É¥•Ì¹™½ÕÌ¡ìÁÉ•Ù•¹ÑMÉ½±°èÑÉÕ”ô¤ì(€€€É•ÑÕÉ¸ì(€ô(€¥˜€¡…Ñ¥½¸€ôôô€‰!9