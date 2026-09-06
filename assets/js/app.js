YªçŠx-®éÜj×¢ëiºÚ+Š§j[h‘éÜ¢éíã½÷×O8ã®¶o+^²‰¢¶×let client;
let session;
let dailyState;
let readinessHistory = [];
let dailyCompliance;
let weeklyInspection;
let weeklyInspectionStorageMode = "LOCAL";
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
let currentAtlasDailyCommand = null;
let currentCanonicalDailyCommand = null;
let currentAtlasCoachProposal = null;
let currentAtlasCoachSource = "DAILY_COMMAND";
let currentDailyDecision = null;
let currentAdaptiveHorizon = null;
let currentAdaptationOutcome = null;
let currentProgramCommand = null;
let currentAtlasWeekAutopilot = null;
let currentAtlasAdaptiveWeek = null;
let currentAtlasWeeklyReconciliation = null;
let currentWeeklyRolloverCertification = null;
let currentWeeklyVerdictLaunch = null;
let currentWeekExecutionCertification = null;
let currentDailyLoopCertification = null;
let currentNextDayCommandHandoff = null;
let currentMorningCommandActivation = null;
let currentCommandCompletionCertification = null;
let currentRecruitLoopCertification = null;
let currentRecruitContinuityRecovery = null;
let dailyCloseoutOperatingDate = null;
let operatingTruthReconcileTimer = null;
let continuitySyncTimer = null;
let continuityRetryFlushPromise = null;
let continuityState = {
  mode: "CHECKING",
  initialized: false,
  accountRevision: 0,
  manifest: null,
  accountManifest: null,
  manifestConflicts: [],
  lineage: null,
  pendingWrites: 0,
  lastSyncedAt: null,
  lastError: null,
  lastResolution: null,
  previewedConflictKeys: []
};
const continuityRecordConflicts = new Map();
let accountTruthSyncTimer = null;
let accountTruthRetryTimer = null;
let accountTruthSyncPromise = null;
let accountTruthAuthSubscription = null;
let accountPersistenceWarningState = null;
let accountTruthState = {
  mode: "CHECKING",
  initialized: false,
  applying: false,
  accountRevision: 0,
  truthSchemaVersion: 0,
  snapshot: null,
  accountSnapshot: null,
  pendingWrites: 0,
  lastVerifiedAt: null,
  confirmedMutationId: null,
  confirmedFingerprint: null,
  serverConfirmed: false,
  lastError: null,
  legacyFallback: false,
  recovered: false
};
let trustLayerState = {
  report: null,
  lastReportedFingerprint: null,
  lastSupportSignal: null,
  startupIssues: [],
  running: false
};
let currentBetaJourneyCertification = null;
let currentJourneyContinuity = null;
let journeyContinuitySaveTimer = null;
let currentRealAccountJourney = null;
let realAccountJourneySaveTimer = null;
let currentRecruitProofWeek = null;
let recruitProofWeekSaveTimer = null;
let weeklyVerdictLaunchSaveTimer = null;
let currentRecruitWeekCertification = null;
let recruitWeekCertificationSaveTimer = null;
const trustSignalLedger = new Map();
let evidenceAutopilotTimer = null;
let evidenceAutopilotState = {
  reconciling: false,
  lastReconciledAt: null,
  lastSavedRemotely: false,
  repairedPerformanceEntries: 0,
  lastError: null
};
let dominionCampaignTimer = null;
let currentDominionCampaign = null;
let dominionCampaignState = {
  reconciling: false,
  lastReconciledAt: null,
  lastSavedRemotely: false,
  lastError: null
};
let campaignCommissioningBackfillPending = false;
let currentCampaignVerdict = null;
let campaignVerdictState = {
  reconciling: false,
  lastReconciledAt: null,
  lastSavedRemotely: false,
  lastError: null
};
let startupAuthorityState = typeof DominionStartupAuthority === "undefined"
  ? { phase: "AUTHENTICATING", actionable: false, validated: false, readOnly: true }
  : DominionStartupAuthority.initial();
let startupAccountLedger = null;
let startupAccountError = null;
let startupRestoreWatchTimers = [];
let startupRestoreStartedAt = null;
let startupRestoreDurationMs = 0;
let startupRestoreIssues = [];
let startupRestoreTimeline = {};

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
  { code: "RECOVERY-01", category: "Recovery", title: "Recovery restriction", description: "Recovery restrictions must be respected and not ignored.", evidenceRule: "Ignoring a recovery restriction or training through pain may warrant review.", defaultSeverity: "LEVEL II", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "NUTRITION-01", category: "Nutrition", title: "Nutrition target", description: "Nutrition targets should be followed unless a protected exception applies.", evidenceRule: "A missed nutrition target without a protected exception may warrant review.", defaultSeverity: "LEVEL I", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "REPORTING-01", category: "Reporting and Evidence", title: "Required evidence", description: "Required evidence and note quality should be recorded.", evidenceRule: "Missing evidence or contradictory reporting may warrant review.", defaultSeverity: "LEVEL I", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "SAFETY-01", category: "Safety", title: "Safety restriction", description: "Safety restrictions must be followed.", evidenceRule: "A deliberate or repeated safety breach may be serious.", defaultSeverity: "LEVEL II", repeatEscalates: true, manualReviewRequired: true, active: true },
  { code: "CONDUCT-01", category: "Program Conduct", title: "Integrity and reporting", description: "Reporting must be honest and consistent.", evidenceRule: "Deliberate falsification or contradictory reporting may warrant serious review.", defaultSeverity: "LEVEL II", repeatEscalates: true, manualReviewRequired: true, active: true }
];

const RANK_CATALOG = [
  { code: "RECRUIT", displayName: "Recruit", sequenceOrder: 1, description: "Starting rank", minimumFinalizedInspections: 0, requiredLookbackWindow: 0, minimumAverageDisciplineScore: 0, minimumAverageEvidenceCoverage: 0, minimumMissionDomainScore: 0, maximumUnresolvedConfirmedViolations: 999, maximumLevelTwoOrLevelThreeViolations: 999, requiredConsecutiveQualifyingWeeks: 0, correctivePeriodBlocksEligibility: false, promotionCommandNote: "No requirements to begin progression.", privilegesPlaceholder: "expanded historical view" },
  { code: "CADET", displayName: "Cadet", sequenceOrder: 2, description: "Demonstrated baseline execution", minimumFinalizedInspections: 2, requiredLookbackWindow: 4, minimumAverageDisciplineScore: 70, minimumAverageEvidenceCoverage: 60, minimumMissionDomainScore: 70, maximumUnresolvedConfirmedViolations: 0, maximumLevelTwoOrLevelThreeViolations: 0, requiredConsecutiveQualifyingWeeks: 0, correctivePeriodBlocksEligibility: false, promotionCommandNote: "Demonstrate baseline execution and evidence quality.", privilegesPlaceholder: "advanced inspection access" },
  { code: "OPERATOR", displayName: "Operator", sequenceOrder: 3, description: "Consistent execution across a recent window", minimumFinalizedInspections: 4, requiredLookbackWindow: 6, minimumAverageDisciplineScore: 78, minimumAverageEvidenceCoverage: 70, minimumMissionDomainScore: 74, maximumUnresolvedConfirmedViolations: 0, maximumLevelTwoOrLevelThreeViolations: 1, requiredConsecutiveQualifyingWeeks: 2, correctivePeriodBlocksEligibility: false, promotionCommandNote: "Maintain discipline, evidence quality, and consecutive qualifying weeks.", privilegesPlaceholder: "additional program templates" },
  { code: "VANGUARD", displayName: "Vanguard", sequenceOrder: 4, description: "Sustained quality at the command level", minimumFinalizedInspections: 8, requiredLookbackWindow: 8, minimumAverageDisciplineScore: 84, minimumAverageEvidenceCoverage: 75, minimumMissionDomainScore: 78, maximumUnresolvedConfirmedViolations: 0, maximumLevelTwoOrLevelThreeViolations: 0, requiredConsecutiveQualifyingWeeks: 3, correctivePeriodBlocksEligibility: true, promotionCommandNote: "Demonstrate sustained quality and a clean standards record.", privilegesPlaceholder: "cosmetic insignia" },
  { code: "DOMINION", displayName: "Dominion", sequenceOrder: 5, description: "Trusted steady execution", minimumFinalizedInspections: 12, requiredLookbackWindow: 10, minimumAverageDisciplineScore: 88, minimumAverageEvidenceCoverage: 80, minimumMissionDomainScore: 80, maximumUnresolvedConfirmedViolations: 0, maximumLevelTwoOrLevelThreeViolations: 0, requiredConsecutiveQualifyingWeeks: 4, correctivePeriodBlocksEligibility: true, promotionCommandNote: "Maintain a clean record and strong evidence across all domains.", privilegesPlaceholder: "advanced historical view" },
  { code: "ASCENDANT", displayName: "Ascendant", sequenceOrder: 6, description: "Elite progression and operational confidence", minimumFinalizedInspections: 16, requiredLookbackWindow: 12, minimumAverageDisciplineScore: 92, minimumAverageEvidenceCoverage: 85, minimumMissionDomainScore: 82, maximumUnresolvedConfirmedViolations: 0, maximumLevelTwoOrLevelThreeViolations: 0, requiredConsecutiveQualifyingWeeks: 6, correctivePeriodBlocksEligibility: true, promotionCommandNote: "Demonstrate sustained quality and strong evidence across all five domains.", privilegesPlaceholder: "premium command templates" }
];

const SECTION_ORDER = ["today", "program", "contract", "calendar", "nutrition", "performance", "record", "inspection", "trends", "standards", "connected"];
const SECTION_LABELS = {
  today: "Today",
  program: "Program",
  contract: "Contract",
  calendar: "Calendar",
  nutrition: "Nutrition",
  record: "Record",
  inspection: "Inspection",
  trends: "Trends",
  standards: "Standards",
  rank: "Rank",
  performance: "Performance",
  connected: "Connected"
};

function continuityDeviceId() {
  const key = "coach-dominion:continuity:device-id";
  try {
    let value = window.localStorage.getItem(key);
    if (!value) {
      value = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(key, value);
    }
    return value;
  } catch (_) {
    return "device-local";
  }
}

function continuityManifestStorageKey() {
  return `coach-dominion:continuity:${session?.user?.id || "local"}:manifest`;
}

function continuityMetaStorageKey(domain, stateType, stateKey) {
  return `coach-dominion:continuity:${session?.user?.id || "local"}:record:${domain}:${String(stateType).toLowerCase()}:${stateKey}`;
}

function continuityRetryStorageKey() {
  return `coach-dominion:continuity:${session?.user?.id || "local"}:pending-writes`;
}

function readContinuityRetryQueue() {
  try {
    const value = JSON.parse(window.localStorage.getItem(continuityRetryStorageKey()) || "[]");
    const valid = Array.isArray(value) ? value.filter((item) => item?.domain && item?.stateType && item?.stateKey && item.payload !== undefined) : [];
    return valid.map((item) => {
      if (item.domain !== "nutrition" || typeof DominionNutritionStateContract === "undefined") return item;
      const stateType = DominionNutritionStateContract.normalizeStateType(item.stateType);
      if (!stateType) return null;
      return {
        ...item,
        stateType,
        key: continuityRetryKey("nutrition", stateType, item.stateKey, item.payload)
      };
    }).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function saveContinuityRetryQueue(items = []) {
  const queue = Array.isArray(items) ? items.slice(-50) : [];
  window.localStorage.setItem(continuityRetryStorageKey(), JSON.stringify(queue));
  continuityState.pendingWrites = queue.length;
  return queue;
}

function continuityRetryKey(domain, stateType, stateKey, payload = undefined) {
  if (domain === "nutrition" && payload !== undefined && typeof DominionNutritionStateContract !== "undefined") {
    const identity = DominionNutritionStateContract.writeIdentity({
      userId: session?.user?.id || "local",
      stateType,
      stateKey,
      payload
    });
    if (identity) return `${domain}:${identity.key}`;
  }
  return `${domain}:${stateType}:${stateKey}`;
}

function enqueueContinuityRetry(domain, stateType, stateKey, payload, error = null) {
  if (payload === undefined || payload === null) return null;
  const queue = readContinuityRetryQueue();
  const key = continuityRetryKey(domain, stateType, stateKey, payload);
  const now = new Date().toISOString();
  const fuelFailure = domain === "nutrition" && error && typeof DominionNutritionStateContract !== "undefined"
    ? DominionNutritionStateContract.classifyFailure(error)
    : null;
  if (typeof DominionReleaseStabilization !== "undefined") {
    const fingerprint = typeof DominionContinuity === "undefined" ? DominionReleaseStabilization.fingerprint(payload) : DominionContinuity.semanticFingerprint(payload, { sortRootArray: stateType === "HISTORY" });
    const next = DominionReleaseStabilization.enqueue(queue, {
      key,
      domain,
      stateType,
      stateKey,
      payload,
      fingerprint,
      errorCode: fuelFailure?.errorCode || error?.code || null,
      entity: continuityDomainLabel(domain),
      reason: fuelFailure?.userMessage || error?.message || (error ? "Account confirmation failed" : "Account confirmation pending"),
      category: fuelFailure?.category || null,
      persistenceState: fuelFailure?.persistenceState || (typeof DominionAccountPersistence === "undefined"
        ? null
        : DominionAccountPersistence.classifyFailure(error, { authenticated: Boolean(session?.user?.id) }))
    }, { now, failedAttempt: Boolean(error) });
    saveContinuityRetryQueue(next);
    if (!queue.some((item) => item.id === next.find((item) => item.key === key)?.id) || error) {
      void reportSyncLifecycle("save_queued", { domain, failed: Boolean(error) });
    }
    if (continuityState.initialized && continuityState.mode !== "CONFLICT") setContinuityMode("PENDING", { pendingWrites: next.length });
    return next.find((item) => item.key === key) || null;
  }
  const existing = queue.find((item) => item.key === key);
  const item = {
    key,
    domain,
    stateType,
    stateKey,
    payload,
    fingerprint: typeof DominionContinuity === "undefined" ? null : DominionContinuity.semanticFingerprint(payload, { sortRootArray: stateType === "HISTORY" }),
    queuedAt: existing?.queuedAt || now,
    lastAttemptAt: now,
    attempts: Number(existing?.attempts || 0) + 1,
    errorCode: fuelFailure?.errorCode || error?.code || null,
    entity: continuityDomainLabel(domain),
    reason: fuelFailure?.userMessage || error?.message || (error ? "Account confirmation failed" : "Account confirmation pending"),
    category: fuelFailure?.category || null,
    persistenceState: fuelFailure?.persistenceState || (typeof DominionAccountPersistence === "undefined"
      ? null
      : DominionAccountPersistence.classifyFailure(error, { authenticated: Boolean(session?.user?.id) }))
  };
  saveContinuityRetryQueue([...queue.filter((entry) => entry.key !== key), item]);
  if (continuityState.initialized && continuityState.mode !== "CONFLICT") setContinuityMode("PENDING", { pendingWrites: canonicalPendingWriteState().count });
  return item;
}

function acknowledgeContinuityRetry(domain, stateType, stateKey, payload = undefined) {
  const key = continuityRetryKey(domain, stateType, stateKey, payload);
  return saveContinuityRetryQueue(readContinuityRetryQueue().filter((item) => item.key !== key));
}

async function persistContinuityRetryItem(item = {}) {
  if (item.domain === "contract") return persistRecruitContractState(item.stateType, item.payload);
  if (item.domain === "orientation") return persistRecruitOnboardingState(item.payload);
  if (item.domain === "strength") return persistStrengthTrainingState(item.stateType, item.stateKey, item.payload);
  if (item.domain === "running") return persistRunningState(item.stateType, item.stateKey, item.payload);
  if (item.domain === "core") return persistCoreProgramState(item.stateType, item.stateKey, item.payload);
  if (item.domain === "nutrition") return persistNutritionState(item.stateType, item.stateKey, item.payload, { force: true, retry: true });
  if (item.domain === "calendar") return persistWeeklyOrchestrationState(item.stateType, item.stateKey, item.payload);
  return false;
}

async function flushContinuityPendingWrites() {
  if (continuityRetryFlushPromise) return continuityRetryFlushPromise;
  continuityRetryFlushPromise = (async () => {
    const queue = readContinuityRetryQueue();
    continuityState.pendingWrites = queue.length;
    if (!queue.length) return true;
    if (currentContinuityConflicts().some((item) => item.domain === "contract")) {
      setContinuityMode("CONFLICT", { pendingWrites: queue.length });
      return false;
    }
    if (!session?.user?.id || navigator.onLine === false) {
      setContinuityMode("PENDING", { pendingWrites: queue.length });
      return false;
    }
    const ready = typeof DominionReleaseStabilization === "undefined"
      ? queue
      : DominionReleaseStabilization.ready(queue);
    for (const item of ready) {
      try {
        void reportSyncLifecycle("queue_retry", { domain: item.domain, attempts: item.attempts });
        const saved = await persistContinuityRetryItem(item);
        if (saved !== false) {
          acknowledgeContinuityRetry(item.domain, item.stateType, item.stateKey, item.payload);
          void reportSyncLifecycle("retry_succeeded", { domain: item.domain, attempts: item.attempts });
        } else {
          enqueueContinuityRetry(item.domain, item.stateType, item.stateKey, item.payload, { code: "SAVE_NOT_ACKNOWLEDGED" });
          void reportSyncLifecycle("retry_failed", { domain: item.domain, attempts: Number(item.attempts || 0) + 1 });
        }
      } catch (error) {
        enqueueContinuityRetry(item.domain, item.stateType, item.stateKey, item.payload, error);
        void reportSyncLifecycle("retry_failed", { domain: item.domain, attempts: Number(item.attempts || 0) + 1, code: error?.code || "UNKNOWN" });
      }
    }
    const remaining = readContinuityRetryQueue();
    continuityState.pendingWrites = remaining.length;
    if (remaining.length && continuityState.mode !== "CONFLICT") setContinuityMode("PENDING", { pendingWrites: remaining.length });
    return remaining.length === 0;
  })();
  try {
    return await continuityRetryFlushPromise;
  } finally {
    continuityRetryFlushPromise = null;
  }
}

function readContinuityRecordMeta(domain, stateType, stateKey) {
  try {
    return JSON.parse(window.localStorage.getItem(continuityMetaStorageKey(domain, stateType, stateKey)) || "null");
  } catch (_) {
    return null;
  }
}

function writeContinuityRecordMeta(domain, stateType, stateKey, payload, options = {}) {
  if (!payload || typeof DominionContinuity === "undefined") return null;
  const previous = readContinuityRecordMeta(domain, stateType, stateKey) || {};
  const value = {
    domain,
    stateType,
    stateKey,
    fingerprint: DominionContinuity.fingerprint(payload),
    payloadHash: domain === "nutrition" && typeof DominionNutritionStateContract !== "undefined"
      ? DominionNutritionStateContract.fingerprint(payload)
      : previous.payloadHash || null,
    updatedAt: options.updatedAt || previous.updatedAt || new Date().toISOString(),
    syncedAt: options.syncedAt || previous.syncedAt || null,
    source: options.source || previous.source || "DEVICE"
  };
  window.localStorage.setItem(continuityMetaStorageKey(domain, stateType, stateKey), JSON.stringify(value));
  return value;
}

function recordContinuityWrite(domain, stateType, stateKey, payload) {
  const value = writeContinuityRecordMeta(domain, stateType, stateKey, payload, { updatedAt: new Date().toISOString(), source: "DEVICE" });
  const unsignedContractDraft = domain === "contract" && String(stateType || "").toUpperCase() === "DRAFT";
  const startupPermitsWrite = typeof DominionStartupAuthority === "undefined"
    || DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "state_change");
  if (continuityState.initialized && startupPermitsWrite && !unsignedContractDraft) {
    scheduleContinuitySync();
    scheduleAccountTruthSync();
  }
  if (startupPermitsWrite && !unsignedContractDraft && !evidenceAutopilotState.reconciling) scheduleEvidenceAutopilotReconciliation();
  return value;
}

function accountTruthSnapshotStorageKey() {
  return `coach-dominion:account-truth:${session?.user?.id || "local"}:snapshot`;
}

function accountTruthQueueStorageKey() {
  return `coach-dominion:account-truth:${session?.user?.id || "local"}:pending`;
}

function readAccountTruthLocalSnapshot() {
  try { return JSON.parse(window.localStorage.getItem(accountTruthSnapshotStorageKey()) || "null"); }
  catch (_) { return null; }
}

function saveAccountTruthLocalSnapshot(snapshot) {
  if (!snapshot) return null;
  try { window.localStorage.setItem(accountTruthSnapshotStorageKey(), JSON.stringify(snapshot)); }
  catch (_) {}
  accountTruthState.snapshot = snapshot;
  return snapshot;
}

function readAccountTruthQueue() {
  try {
    const value = JSON.parse(window.localStorage.getItem(accountTruthQueueStorageKey()) || "[]");
    const queue = Array.isArray(value) ? value.slice(-1) : [];
    if (typeof DominionAccountPersistence === "undefined") return queue;
    const fallbackManifest = continuityState.manifest || readContinuityManifestLocal() || buildCurrentContinuityManifest();
    return queue.map((item) => DominionAccountPersistence.buildEnvelope(item, {
      manifest: fallbackManifest,
      userId: session?.user?.id || null,
      deviceId: continuityDeviceId(),
      expectedRevision: continuityState.accountRevision
    })).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function saveAccountTruthQueue(queue = []) {
  const next = Array.isArray(queue) ? queue.slice(-1) : [];
  try { window.localStorage.setItem(accountTruthQueueStorageKey(), JSON.stringify(next)); }
  catch (_) {}
  accountTruthState.pendingWrites = next.length;
  renderAccountTruthHealth();
  return next;
}

function canonicalPendingWriteState() {
  const continuityQueue = readContinuityRetryQueue();
  const accountQueue = readAccountTruthQueue();
  if (typeof DominionAccountPersistence !== "undefined" && DominionAccountPersistence.pendingState) {
    return DominionAccountPersistence.pendingState(continuityQueue, accountQueue);
  }
  const entries = continuityQueue.length ? continuityQueue : accountQueue;
  return {
    count: entries.length,
    entries,
    state: entries.length ? "SYNC_PENDING" : "CURRENT",
    label: entries.length ? `Sync Â· ${entries.length}` : "Synced"
  };
}

function canonicalPendingWriteDetail(pending = canonicalPendingWriteState()) {
  if (!pending.count) return "Account is current.";
  const first = pending.entries?.[0] || {};
  if (first.domain === "nutrition" || first.category === "FUEL_SAVE_RETRY" || first.category === "FUEL_SCHEMA_RETRY") {
    return `Fuel save needs retry Â· ${pending.count} protected change${pending.count === 1 ? "" : "s"} waiting.`;
  }
  const operation = String(first.entity || first.operation || first.domain || first.stateType || "account save").replaceAll("_", " ").toLowerCase();
  const reason = String(first.reason || first.errorCode || "account confirmation pending").replaceAll("_", " ").toLowerCase();
  const queuedAt = Date.parse(first.queuedAt || first.createdAt || first.clientUpdatedAt || "");
  const ageMinutes = Number.isFinite(queuedAt) ? Math.max(0, Math.floor((Date.now() - queuedAt) / 60000)) : null;
  const age = ageMinutes === null ? "" : ageMinutes < 1 ? " Â· queued now" : ` Â· waiting ${ageMinutes} min`;
  return `${pending.count} protected change${pending.count === 1 ? "" : "s"} waiting Â· ${operation} Â· ${reason}${age}.`;
}

function currentReliabilityContext() {
  const pending = canonicalPendingWriteState();
  const entries = Array.isArray(pending.entries) ? pending.entries : [];
  const now = Date.now();
  const queuedAt = entries
    .map((item) => Date.parse(item?.queuedAt || item?.createdAt || item?.clientUpdatedAt || item?.updatedAt || ""))
    .filter(Number.isFinite);
  return {
    pendingWrites: pending.count,
    retryCount: entries.reduce((highest, item) => Math.max(highest, Number(item?.attempts || item?.attempt || 0)), 0),
    oldestQueuedAgeMs: queuedAt.length ? Math.max(0, now - Math.min(...queuedAt)) : 0,
    accountConfirmed: accountTruthState.serverConfirmed === true,
    online: navigator.onLine !== false
  };
}

function shouldReportTrustPayload(payload = {}) {
  const noiseEvents = new Set(["trust_check", "repair_started", "sync_started", "save_queued", "queue_retry", "startup_recovery"]);
  if (!noiseEvents.has(payload.event)) return true;
  const key = [payload.event, payload.route, payload.status, payload.operationStatus, payload.pendingWrites, payload.retryCount, payload.fingerprint].join("|");
  const now = Date.now();
  const lastReportedAt = Number(trustSignalLedger.get(key) || 0);
  trustSignalLedger.set(key, now);
  if (trustSignalLedger.size > 80) {
    [...trustSignalLedger.entries()]
      .filter(([, timestamp]) => now - timestamp > 10 * 60 * 1000)
      .forEach(([staleKey]) => trustSignalLedger.delete(staleKey));
  }
  return now - lastReportedAt >= 60 * 1000;
}

function renderReliabilitySupportCode() {
  const signal = trustLayerState.lastSupportSignal;
  const root = document.getElementById("account-truth-support");
  const code = document.getElementById("account-truth-support-code");
  const visible = Boolean(signal?.supportCode && ["warning", "error"].includes(signal.severity));
  if (root) root.hidden = !visible;
  if (code) code.textContent = visible ? signal.supportCode : "";
}

function buildAccountTruthWriteEnvelope(manifest, snapshot, expectedRevision, options = {}) {
  if (!manifest || !snapshot) return null;
  if (typeof DominionAccountPersistence === "undefined") return {
    manifest,
    snapshot,
    expectedRevision: Number(expectedRevision || 0),
    clientUpdatedAt: options.clientUpdatedAt || new Date().toISOString()
  };
  return DominionAccountPersistence.buildEnvelope({
    userId: session?.user?.id || null,
    deviceId: continuityDeviceId(),
    expectedRevision,
    manifest,
    snapshot,
    mutationId: options.mutationId,
    clientUpdatedAt: options.clientUpdatedAt || new Date().toISOString()
  });
}

function scheduleAccountTruthQueueDrain() {
  window.clearTimeout(accountTruthRetryTimer);
  const queue = readAccountTruthQueue();
  if (!queue.length || !session?.user?.id || navigator.onLine === false) return;
  if (currentExecutionConflicts().some((item) => item.domain === "contract")) return;
  const delay = typeof DominionAccountPersistence === "undefined"
    ? 1000
    : DominionAccountPersistence.nextDelay(queue);
  if (delay === null) return;
  accountTruthRetryTimer = window.setTimeout(() => drainAccountPersistence({ reason: "retry_timer" }), Math.max(0, delay));
}

function queueAccountTruthWrite(write, error = null) {
  if (typeof DominionStartupAuthority !== "undefined"
    && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "account_write")) return readAccountTruthQueue();
  if (!write || typeof DominionAccountTruth === "undefined") return [];
  const envelope = write.snapshot && write.manifest
    ? buildAccountTruthWriteEnvelope(write.manifest, write.snapshot, write.expectedRevision, write)
    : buildAccountTruthWriteEnvelope(continuityState.manifest || buildCurrentContinuityManifest(), write, continuityState.accountRevision);
  if (!envelope) return [];
  const previous = readAccountTruthQueue();
  const queue = typeof DominionAccountPersistence === "undefined"
    ? DominionAccountTruth.queueLatest(previous, envelope.snapshot, error, { failedAttempt: Boolean(error) })
    : DominionAccountPersistence.queueLatest(previous, envelope, error, { failedAttempt: Boolean(error) });
  accountTruthState.mode = navigator.onLine === false ? "OFFLINE_PROTECTED" : "SAVE_QUEUED";
  accountTruthState.serverConfirmed = false;
  accountTruthState.lastError = error?.message || null;
  saveAccountTruthQueue(queue);
  if (!previous.some((item) => (item.mutationId || item.id) === (queue[0]?.mutationId || queue[0]?.id)) || error) void reportSyncLifecycle("save_queued", { domain: "account_truth", failed: Boolean(error) });
  scheduleAccountTruthQueueDrain();
  return queue;
}

function accountTruthMissionEvidence() {
  const saved = readClosedLoopState("HISTORY", "account-truth-mission-evidence", []);
  const sources = [
    ...(Array.isArray(saved) ? saved : []),
    ...readClosedLoopHistory(),
    ...readMissionExecutionReceipts(todayISODate()),
    ...readMissionDebriefHistory(),
    ...readMissionRecoveryHistory(),
    ...readMorningVerificationHistory(),
    ...readEvidenceAutopilotHistory()
  ];
  return typeof DominionAccountTruth === "undefined"
    ? sources
    : DominionAccountTruth.mergeCollection(sources, [], DominionAccountTruth.COLLECTION_LIMITS.missionReceipts);
}

function journeyEvidenceItemsForDate(value = todayISODate()) {
  const date = String(value || todayISODate()).slice(0, 10);
  const sources = [...performanceEntries, ...accountTruthMissionEvidence()];
  const seen = new Set();
  return sources.filter((item) => {
    const itemDate = String(item?.performanceDate || item?.date || item?.sourceDate || item?.operatingDate || item?.recordedAt || item?.createdAt || "").slice(0, 10);
    const id = String(item?.id || "");
    if (itemDate !== date || !id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function readJourneyCertificationReceipts() {
  const receipts = readClosedLoopState("HISTORY", "journey-certification", []);
  return Array.isArray(receipts) ? receipts : [];
}

function saveJourneyCertificationReceipt(receipt = null) {
  if (!receipt?.id || typeof DominionJourneyContinuity === "undefined") return false;
  const current = readJourneyCertificationReceipts();
  if (current.some((item) => item?.id === receipt.id)) return false;
  const limit = typeof DominionAccountTruth === "undefined" ? 120 : DominionAccountTruth.COLLECTION_LIMITS.journeyReceipts;
  const next = DominionJourneyContinuity.appendReceipt(current, receipt, limit || 120);
  saveClosedLoopLocal("HISTORY", "journey-certification", next);
  return true;
}

function scheduleJourneyCertificationReceipt(report = null) {
  if (!report?.shouldSave || !report?.candidate || journeyContinuitySaveTimer) return;
  if (typeof DominionStartupAuthority !== "undefined" && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "state_change")) return;
  journeyContinuitySaveTimer = window.setTimeout(() => {
    journeyContinuitySaveTimer = null;
    if (saveJourneyCertificationReceipt(report.candidate)) scheduleAccountTruthSync(50);
  }, 0);
}

function readRealAccountJourneyReceipts() {
  if (typeof DominionRealAccountJourney === "undefined") return [];
  return readJourneyCertificationReceipts().filter((item) => item?.type === DominionRealAccountJourney.RECEIPT_TYPE);
}

function scheduleRealAccountJourneyReceipt(report = null) {
  if (!report?.shouldSave || !report?.candidate || realAccountJourneySaveTimer) return;
  if (typeof DominionStartupAuthority !== "undefined" && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "state_change")) return;
  realAccountJourneySaveTimer = window.setTimeout(() => {
    realAccountJourneySaveTimer = null;
    if (saveJourneyCertificationReceipt(report.candidate)) scheduleAccountTruthSync(50);
  }, 0);
}

function readRecruitProofWeekReceipts() {
  if (typeof DominionRecruitProofWeek === "undefined") return [];
  return readJourneyCertificationReceipts().filter((item) => item?.type === DominionRecruitProofWeek.RECEIPT_TYPE);
}

function scheduleRecruitProofWeekReceipt(report = null) {
  if (!report?.shouldSave || !report?.candidate || recruitProofWeekSaveTimer) return;
  if (typeof DominionStartupAuthority !== "undefined" && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "state_change")) return;
  recruitProofWeekSaveTimer = window.setTimeout(() => {
    recruitProofWeekSaveTimer = null;
    if (saveJourneyCertificationReceipt(report.candidate)) scheduleAccountTruthSync(50);
  }, 0);
}

function readWeeklyVerdictLaunchReceipts() {
  if (typeof DominionWeeklyVerdictLaunch === "undefined") return [];
  return readJourneyCertificationReceipts().filter((item) => item?.type === DominionWeeklyVerdictLaunch.RECEIPT_TYPE);
}

function scheduleWeeklyVerdictLaunchReceipt(report = null) {
  if (!report?.shouldSave || !report?.candidate || weeklyVerdictLaunchSaveTimer) return;
  if (typeof DominionStartupAuthority !== "undefined" && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "state_change")) return;
  weeklyVerdictLaunchSaveTimer = window.setTimeout(() => {
    weeklyVerdictLaunchSaveTimer = null;
    if (saveJourneyCertificationReceipt(report.candidate)) {
      scheduleAccountTruthSync(50);
      if (weeklyInspection) renderWeeklyVerdictLaunch(weeklyInspection);
    }
  }, 0);
}

function readRecruitWeekCertificationReceipts() {
  if (typeof DominionRecruitWeekCertification === "undefined") return [];
  return readJourneyCertificationReceipts().filter((item) => item?.type === DominionRecruitWeekCertification.RECEIPT_TYPE);
}

function scheduleRecruitWeekCertificationReceipt(report = null) {
  if (!report?.shouldSave || !report?.candidate || recruitWeekCertificationSaveTimer) return;
  if (typeof DominionStartupAuthority !== "undefined" && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "state_change")) return;
  recruitWeekCertificationSaveTimer = window.setTimeout(() => {
    recruitWeekCertificationSaveTimer = null;
    if (saveJourneyCertificationReceipt(report.candidate)) {
      scheduleAccountTruthSync(50);
      if (weeklyInspection) renderRecruitWeekCertification(weeklyInspection);
    }
  }, 0);
}

function readCalendarCommitReceipts() {
  const receipts = readClosedLoopState("HISTORY", "calendar-commit-receipts", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readDailyLoopCertificationHistory() {
  const receipts = readClosedLoopState("HISTORY", "daily-loop-certification", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readNextDayCommandHandoffHistory() {
  const receipts = readClosedLoopState("HISTORY", "next-day-command-handoff", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readMorningCommandActivationHistory() {
  const receipts = readClosedLoopState("HISTORY", "morning-command-activation", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readMorningCommandResolutionHistory() {
  const receipts = readClosedLoopState("HISTORY", "morning-command-resolution", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readCommandCompletionHistory() {
  const receipts = readClosedLoopState("HISTORY", "command-completion-certification", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readRecruitLoopCertificationHistory() {
  const receipts = readClosedLoopState("HISTORY", "recruit-loop-certification", []);
  return Array.isArray(receipts) ? receipts : [];
}

function readRecruitContinuityRecoveryHistory() {
  const receipts = readClosedLoopState("HISTORY", "recruit-continuity-recovery", []);
  return Array.isArray(receipts) ? receipts : [];
}

function saveCalendarCommitReceipt(receipt = null) {
  if (!receipt?.id) return [];
  const limit = typeof DominionAccountTruth === "undefined" ? 120 : DominionAccountTruth.COLLECTION_LIMITS.calendarCommitReceipts;
  const next = [receipt, ...readCalendarCommitReceipts().filter((item) => item?.id !== receipt.id)]
    .sort((left, right) => String(right.committedAt || "").localeCompare(String(left.committedAt || "")))
    .slice(0, limit || 120);
  saveClosedLoopLocal("HISTORY", "calendar-commit-receipts", next);
  return next;
}

function matchingCalendarCommitReceipt(week = null) {
  if (!week?.weekStart || typeof DominionCalendarCommitAuthority === "undefined") return null;
  const receipt = DominionCalendarCommitAuthority.latestForWeek(readCalendarCommitReceipts(), week.weekStart);
  if (!receipt) return null;
  return DominionCalendarCommitAuthority.matches(receipt, {
    contractRevision: String(week.contractRevision || readApprovedRecruitContract()?.revision || 0).replace(/^R/i, ""),
    weekStart: week.weekStart,
    calendarRevision: Number(week.revision || 0),
    assignmentIds: DominionCalendarCommitAuthority.assignmentIds(week),
    accountRevision: receipt.accountRevision
  }) ? receipt : null;
}

function buildCurrentAccountTruthSnapshot(manifest = continuityState.manifest || buildCurrentContinuityManifest()) {
  if (typeof DominionAccountTruth === "undefined") return null;
  return DominionAccountTruth.buildSnapshot({
    profile: {
      orientation: readRecruitOnboardingState(null),
      constraints: readRecruitConstraintMemory()
    },
    readiness: {
      current: dailyState || null,
      history: readinessHistory
    },
    evidence: {
      performance: performanceEntries,
      closeouts: readDailyCloseoutHistory(),
      missionReceipts: accountTruthMissionEvidence(),
      reconciliationReceipts: readContractReconciliationReceipts(),
      journeyReceipts: readJourneyCertificationReceipts(),
      calendarCommitReceipts: readCalendarCommitReceipts(),
      dailyLoopReceipts: readDailyLoopCertificationHistory(),
      commandCompletions: readCommandCompletionHistory(),
      recruitLoopCertifications: readRecruitLoopCertificationHistory(),
      continuityRecoveries: readRecruitContinuityRecoveryHistory()
    },
    coaching: {
      horizons: readAtlasAdaptiveHorizonHistory(),
      outcomes: readAtlasAdaptationOutcomeHistory(),
      decisions: readAtlasDecisionHistory(),
      dailyVerdicts: readAtlasClosedLoopHistory(),
      proofs: readAtlasDecisionProofHistory(),
      weeklyReconciliations: readAtlasWeeklyReconciliationHistory(),
      weeklyRollovers: readWeeklyRolloverHistory(),
      weeklyExecutions: readWeekExecutionCertificationHistory(),
      rankAdvancements: readRankAdvancementHistory(),
      rankHandoffs: readRankAdvancementHandoffHistory(),
      nextDayHandoffs: readNextDayCommandHandoffHistory(),
      morningActivations: readMorningCommandActivationHistory(),
      morningResolutions: readMorningCommandResolutionHistory()
    }
  }, {
    userId: session?.user?.id || null,
    deviceId: continuityDeviceId(),
    capturedAt: new Date().toISOString(),
    programFingerprint: manifest?.fingerprint || null
  });
}

function applyAccountTruthSnapshot(snapshot = null) {
  if (!snapshot || typeof DominionAccountTruth === "undefined") return 0;
  const normalized = DominionAccountTruth.normalizeSnapshot(snapshot, {
    userId: session?.user?.id || null,
    deviceId: continuityDeviceId()
  });
  const profile = normalized.domains.profile.payload;
  const readiness = normalized.domains.readiness.payload;
  const evidence = normalized.domains.evidence.payload;
  const coaching = normalized.domains.coaching.payload;
  let restored = 0;
  accountTruthState.applying = true;
  try {
    if (profile.orientation) {
      const current = readRecruitOnboardingState(null);
      const selected = DominionAccountTruth.mergeOrientation(current, profile.orientation);
      if (DominionAccountTruth.semanticFingerprint(selected) !== DominionAccountTruth.semanticFingerprint(current)) restored += 1;
      saveRecruitOnboardingLocal(selected);
    }
    if (profile.constraints) {
      const current = readRecruitConstraintMemory();
      const merged = DominionAccountTruth.mergeConstraints(current, profile.constraints);
      if (DominionAccountTruth.semanticFingerprint(merged) !== DominionAccountTruth.semanticFingerprint(current)) restored += 1;
      saveClosedLoopLocal("CONTEXT", "recruit-constraints", merged);
    }
    const mergedReadiness = DominionAccountTruth.mergeCollection(readinessHistory, readiness.history, DominionAccountTruth.COLLECTION_LIMITS.readiness);
    if (DominionAccountTruth.semanticFingerprint(mergedReadiness) !== DominionAccountTruth.semanticFingerprint(readinessHistory)) restored += 1;
    readinessHistory = mergedReadiness;
    const todayReadiness = [readiness.current, ...mergedReadiness].find((item) => item?.date === todayISODate());
    if (todayReadiness) {
      dailyState = { ...(dailyState || {}), ...todayReadiness };
      saveMobileDailyState(dailyState);
    }
    const mergedPerformance = DominionAccountTruth.mergeCollection(performanceEntries, evidence.performance, DominionAccountTruth.COLLECTION_LIMITS.performance);
    if (DominionAccountTruth.semanticFingerprint(mergedPerformance) !== DominionAccountTruth.semanticFingerprint(performanceEntries)) restored += 1;
    performanceEntries = mergedPerformance;
    saveLocalPerformanceEntries(mergedPerformance);
    const closeouts = DominionAccountTruth.mergeCollection(readDailyCloseoutHistory(), evidence.closeouts, DominionAccountTruth.COLLECTION_LIMITS.closeouts);
    if (DominionAccountTruth.semanticFingerprint(closeouts) !== DominionAccountTruth.semanticFingerprint(readDailyCloseoutHistory())) restored += 1;
    saveClosedLoopLocal("HISTORY", "daily-closeout", closeouts);
    closeouts.forEach((item) => { if (item?.date) saveClosedLoopLocal("CLOSEOUT", item.date, item); });
    const missionEvidence = DominionAccountTruth.mergeCollection(accountTruthMissionEvidence(), evidence.missionReceipts, DominionAccountTruth.COLLECTION_LIMITS.missionReceipts);
    if (DominionAccountTruth.semanticFingerprint(missionEvidence) !== DominionAccountTruth.semanticFingerprint(accountTruthMissionEvidence())) restored += 1;
    saveClosedLoopLocal("HISTORY", "account-truth-mission-evidence", missionEvidence);
    const reconciliationReceipts = DominionAccountTruth.mergeCollection(readContractReconciliationReceipts(), evidence.reconciliationReceipts, DominionAccountTruth.COLLECTION_LIMITS.reconciliationReceipts);
    if (DominionAccountTruth.semanticFingerprint(reconciliationReceipts) !== DominionAccountTruth.semanticFingerprint(readContractReconciliationReceipts())) restored += 1;
    saveClosedLoopLocal("HISTORY", "contract-reconciliation", reconciliationReceipts);
    const journeyReceipts = DominionAccountTruth.mergeCollection(readJourneyCertificationReceipts(), evidence.journeyReceipts, DominionAccountTruth.COLLECTION_LIMITS.journeyReceipts);
    if (DominionAccountTruth.semanticFingerprint(journeyReceipts) !== DominionAccountTruth.semanticFingerprint(readJourneyCertificationReceipts())) restored += 1;
    saveClosedLoopLocal("HISTORY", "journey-certification", journeyReceipts);
    const calendarCommitReceipts = DominionAccountTruth.mergeCollection(readCalendarCommitReceipts(), evidence.calendarCommitReceipts, DominionAccountTruth.COLLECTION_LIMITS.calendarCommitReceipts);
    if (DominionAccountTruth.semanticFingerprint(calendarCommitReceipts) !== DominionAccountTruth.semanticFingerprint(readCalendarCommitReceipts())) restored += 1;
    saveClosedLoopLocal("HISTORY", "calendar-commit-receipts", calendarCommitReceipts);
    const dailyLoopReceipts = DominionAccountTruth.mergeCollection(readDailyLoopCertificationHistory(), evidence.dailyLoopReceipts, DominionAccountTruth.COLLECTION_LIMITS.dailyLoopReceipts);
    const commandCompletions = DominionAccountTruth.mergeCollection(readCommandCompletionHistory(), evidence.commandCompletions, DominionAccountTruth.COLLECTION_LIMITS.commandCompletions);
    const recruitLoopCertifications = DominionAccountTruth.mergeCollection(readRecruitLoopCertificationHistory(), evidence.recruitLoopCertifications, DominionAccountTruth.COLLECTION_LIMITS.recruitLoopCertifications);
    const continuityRecoveries = DominionAccountTruth.mergeCollection(readRecruitContinuityRecoveryHistory(), evidence.continuityRecoveries, DominionAccountTruth.COLLECTION_LIMITS.continuityRecoveries);
    if (DominionAccountTruth.semanticFingerprint(dailyLoopReceipts) !== DominionAccountTruth.semanticFingerprint(readDailyLoopCertificationHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(commandCompletions) !== DominionAccountTruth.semanticFingerprint(readCommandCompletionHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(recruitLoopCertifications) !== DominionAccountTruth.semanticFingerprint(readRecruitLoopCertificationHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(continuityRecoveries) !== DominionAccountTruth.semanticFingerprint(readRecruitContinuityRecoveryHistory())) restored += 1;
    saveClosedLoopLocal("HISTORY", "daily-loop-certification", dailyLoopReceipts);
    saveClosedLoopLocal("HISTORY", "command-completion-certification", commandCompletions);
    saveClosedLoopLocal("HISTORY", "recruit-loop-certification", recruitLoopCertifications);
    saveClosedLoopLocal("HISTORY", "recruit-continuity-recovery", continuityRecoveries);
    const horizons = DominionAccountTruth.mergeCollection(readAtlasAdaptiveHorizonHistory(), coaching.horizons, DominionAccountTruth.COLLECTION_LIMITS.horizons);
    const outcomes = DominionAccountTruth.mergeCollection(readAtlasAdaptationOutcomeHistory(), coaching.outcomes, DominionAccountTruth.COLLECTION_LIMITS.outcomes);
    const decisions = DominionAccountTruth.mergeCollection(readAtlasDecisionHistory(), coaching.decisions, DominionAccountTruth.COLLECTION_LIMITS.decisions);
    const dailyVerdicts = DominionAccountTruth.mergeCollection(readAtlasClosedLoopHistory(), coaching.dailyVerdicts, DominionAccountTruth.COLLECTION_LIMITS.dailyVerdicts);
    const proofs = DominionAccountTruth.mergeCollection(readAtlasDecisionProofHistory(), coaching.proofs, DominionAccountTruth.COLLECTION_LIMITS.proofs);
    const weeklyReconciliations = DominionAccountTruth.mergeCollection(readAtlasWeeklyReconciliationHistory(), coaching.weeklyReconciliations, DominionAccountTruth.COLLECTION_LIMITS.weeklyReconciliations);
    const weeklyRollovers = DominionAccountTruth.mergeCollection(readWeeklyRolloverHistory(), coaching.weeklyRollovers, DominionAccountTruth.COLLECTION_LIMITS.weeklyRollovers);
    const weeklyExecutions = DominionAccountTruth.mergeCollection(readWeekExecutionCertificationHistory(), coaching.weeklyExecutions, DominionAccountTruth.COLLECTION_LIMITS.weeklyExecutions);
    const rankAdvancements = DominionAccountTruth.mergeCollection(readRankAdvancementHistory(), coaching.rankAdvancements, DominionAccountTruth.COLLECTION_LIMITS.rankAdvancements);
    const rankHandoffs = DominionAccountTruth.mergeCollection(readRankAdvancementHandoffHistory(), coaching.rankHandoffs, DominionAccountTruth.COLLECTION_LIMITS.rankHandoffs);
    const nextDayHandoffs = DominionAccountTruth.mergeCollection(readNextDayCommandHandoffHistory(), coaching.nextDayHandoffs, DominionAccountTruth.COLLECTION_LIMITS.nextDayHandoffs);
    const morningActivations = DominionAccountTruth.mergeCollection(readMorningCommandActivationHistory(), coaching.morningActivations, DominionAccountTruth.COLLECTION_LIMITS.morningActivations);
    const morningResolutions = DominionAccountTruth.mergeCollection(readMorningCommandResolutionHistory(), coaching.morningResolutions, DominionAccountTruth.COLLECTION_LIMITS.morningResolutions);
    if (DominionAccountTruth.semanticFingerprint(horizons) !== DominionAccountTruth.semanticFingerprint(readAtlasAdaptiveHorizonHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(outcomes) !== DominionAccountTruth.semanticFingerprint(readAtlasAdaptationOutcomeHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(decisions) !== DominionAccountTruth.semanticFingerprint(readAtlasDecisionHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(dailyVerdicts) !== DominionAccountTruth.semanticFingerprint(readAtlasClosedLoopHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(proofs) !== DominionAccountTruth.semanticFingerprint(readAtlasDecisionProofHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(weeklyReconciliations) !== DominionAccountTruth.semanticFingerprint(readAtlasWeeklyReconciliationHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(weeklyRollovers) !== DominionAccountTruth.semanticFingerprint(readWeeklyRolloverHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(weeklyExecutions) !== DominionAccountTruth.semanticFingerprint(readWeekExecutionCertificationHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(rankAdvancements) !== DominionAccountTruth.semanticFingerprint(readRankAdvancementHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(rankHandoffs) !== DominionAccountTruth.semanticFingerprint(readRankAdvancementHandoffHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(nextDayHandoffs) !== DominionAccountTruth.semanticFingerprint(readNextDayCommandHandoffHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(morningActivations) !== DominionAccountTruth.semanticFingerprint(readMorningCommandActivationHistory())) restored += 1;
    if (DominionAccountTruth.semanticFingerprint(morningResolutions) !== DominionAccountTruth.semanticFingerprint(readMorningCommandResolutionHistory())) restored += 1;
    saveClosedLoopLocal("HISTORY", "atlas-adaptive-horizon", horizons);
    saveClosedLoopLocal("HISTORY", "atlas-adaptation-outcomes", outcomes);
    saveClosedLoopLocal("HISTORY", "atlas-decision-center", decisions);
    saveClosedLoopLocal("HISTORY", "atlas-closed-loop", dailyVerdicts);
    saveClosedLoopLocal("HISTORY", "atlas-decision-proof", proofs);
    saveClosedLoopLocal("HISTORY", "atlas-weekly-reconciliation", weeklyReconciliations);
    saveClosedLoopLocal("HISTORY", "weekly-rollover-certification", weeklyRollovers);
    saveClosedLoopLocal("HISTORY", "week-execution-certification", weeklyExecutions);
    saveClosedLoopLocal("HISTORY", "rank-advancement-certification", rankAdvancements);
    saveClosedLoopLocal("HISTORY", "rank-advancement-handoff", rankHandoffs);
    saveClosedLoopLocal("HISTORY", "next-day-command-handoff", nextDayHandoffs);
    saveClosedLoopLocal("HISTORY", "morning-command-activation", morningActivations);
    saveClosedLoopLocal("HISTORY", "morning-command-resolution", morningResolutions);
    promotionHistory = rankAdvancements;
    if (typeof DominionRankAdvancementCertification !== "undefined") {
      const advancementState = DominionRankAdvancementCertification.validateHistory(rankAdvancements, rankStatus.currentRank || "RECRUIT");
      if (advancementState.valid && advancementState.count) {
        rankStatus = { ...rankStatus, currentRank: advancementState.currentRank, promotionState: "PROMOTED", updatedAt: rankAdvancements[0]?.certifiedAt || rankStatus.updatedAt || null };
        saveRankStatus();
      }
    }
  } finally {
    accountTruthState.applying = false;
  }
  saveAccountTruthLocalSnapshot(normalized);
  return restored;
}

function renderAccountTruthHealth() {
  if (typeof DominionAccountTruth === "undefined") return;
  const snapshot = accountTruthState.snapshot || readAccountTruthLocalSnapshot();
  let report = DominionAccountTruth.healthReport({
    ...accountTruthState,
    snapshot,
    pendingWrites: canonicalPendingWriteState().count,
    online: navigator.onLine !== false
  });
  const executionContext = buildCurrentExecutionContext(todayISODate());
  if (executionContext?.expectedVersionSplit && !executionContext.blocked) {
    report = {
      ...report,
      status: "FUTURE PROGRAM UPDATE PENDING",
      tone: "yellow",
      headline: `${executionContext.today.label} ${executionContext.today.secondary || ""}`.trim()
    };
  }
  if (currentExecutionConflicts().some((item) => item.domain === "contract")) {
    report = {
      ...report,
      status: "CONFLICT_REQUIRES_CHOICE",
      tone: "red",
      headline: "Resolve the saved Contract. Automatic account retries are paused."
    };
  }
  const root = document.getElementById("account-truth-health");
  if (root) root.dataset.truthTone = report.tone;
  setText("account-truth-status", report.status.replaceAll("_", " "));
  setText("account-truth-headline", report.headline);
  setText("account-truth-program", snapshot?.programFingerprint ? "LOCKED" : "CHECKING");
  const evidence = snapshot?.domains?.evidence?.payload || {};
  const coaching = snapshot?.domains?.coaching?.payload || {};
  const evidenceCount = (evidence.performance?.length || 0) + (evidence.closeouts?.length || 0) + (evidence.missionReceipts?.length || 0) + (evidence.reconciliationReceipts?.length || 0) + (evidence.journeyReceipts?.length || 0) + (evidence.calendarCommitReceipts?.length || 0) + (evidence.dailyLoopReceipts?.length || 0) + (evidence.commandCompletions?.length || 0);
  const coachingCount = (coaching.horizons?.length || 0) + (coaching.outcomes?.length || 0) + (coaching.decisions?.length || 0) + (coaching.dailyVerdicts?.length || 0) + (coaching.proofs?.length || 0) + (coaching.weeklyReconciliations?.length || 0) + (coaching.weeklyRollovers?.length || 0) + (coaching.weeklyExecutions?.length || 0) + (coaching.rankAdvancements?.length || 0) + (coaching.rankHandoffs?.length || 0) + (coaching.nextDayHandoffs?.length || 0) + (coaching.morningActivations?.length || 0) + (coaching.morningResolutions?.length || 0);
  setText("account-truth-evidence", `${evidenceCount} SAVED`);
  setText("account-truth-continuity", currentJourneyContinuity?.label || "CHECKING");
  setText("account-truth-coaching", `${coachingCount} SAVED`);
  const verified = report.lastVerifiedAt ? new Date(report.lastVerifiedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "NOT YET";
  setText("account-truth-verified", verified);
  const allQueued = canonicalPendingWriteState().entries;
  const queueAge = typeof DominionReleaseStabilization === "undefined" ? "NONE" : DominionReleaseStabilization.oldestAge(allQueued).label;
  setText("account-truth-queue-age", queueAge);
  document.body.dataset.accountTruth = report.status.toLowerCase().replaceAll("_", "-");
  if (trustLayerState.report) renderTrustLayerHealth(trustLayerState.report);
}

function buildCurrentBetaJourneyCertification(context = {}) {
  if (typeof DominionBetaJourneyCertification === "undefined") return null;
  const date = todayISODate();
  const contract = readApprovedRecruitContract();
  const lifecycle = context.lifecycle || currentProgramLifecycle();
  const week = context.week || readCommittedUnifiedWeek(date);
  const canonical = context.canonical || (currentCanonicalDailyCommand?.date === date
    ? currentCanonicalDailyCommand
    : buildCurrentCanonicalDailyCommand(date));
  const receipt = lifecycle?.receipt || readAtlasProgramReceipt();
  const pending = canonicalPendingWriteState();
  const accountHealth = context.accountHealth || accountTruthState;
  const lineage = context.lineage || continuityState.lineage || null;
  const contractRevision = Number(contract?.revision || 0);
  const contractRef = contract ? `contract:${contract.id || "approved"}:r${contractRevision}` : "";
  const protectedCurrentWeek = lineage?.modules?.calendar?.state === "PROTECTED_CURRENT_WEEK";
  const operatingContractRevision = protectedCurrentWeek ? Number(week?.contractRevision || 0) : contractRevision;
  const operatingContractRef = contract ? `contract:${week?.contractId || contract.id || "approved"}:r${operatingContractRevision}` : "";
  const programAuthority = typeof DominionBetaStateIntegrity === "undefined"
    ? null
    : DominionBetaStateIntegrity.resolveOperatingProgramAuthority({
        today: date,
        signedContract: contract,
        activeWeek: week,
        receipt,
        programId: canonical?.program?.id
      });
  const programId = programAuthority?.programId
    || week?.programId
    || canonical?.program?.id
    || (contract ? `atlas-program:${contract.id || "contract"}:r${contractRevision}` : "");
  let signed = false;
  try {
    signed = Boolean(contract && typeof DominionContractExperience !== "undefined" && DominionContractExperience.signatureStatus(contract).valid);
  } catch (_) {}
  const evidenceItems = journeyEvidenceItemsForDate(date);
  const activeDay = readEffectiveUnifiedDay(date);
  const activeAssignments = Array.isArray(activeDay?.activities) ? activeDay.activities : [];
  const expectedAssignmentIds = activeAssignments.map((item, index) => String(item?.id || item?.activityId || `${date}:assignment:${index + 1}`)).sort();
  const canonicalAssignmentIds = (canonical?.schedule?.sessions || []).map((item, index) => String(item?.id || `${date}:assignment:${index + 1}`)).sort();
  const executionContext = buildCurrentExecutionContext(date);
  const pendingBiometric = readClosedLoopState("BIOMETRIC_QUARANTINE", date, null);
  const journey = DominionBetaJourneyCertification.evaluate({
    date,
    account: {
      ...accountTruthState,
      status: accountHealth.status || accountTruthState.mode,
      pendingWrites: pending.count
    },
    conflicts: currentContinuityConflicts(),
    pendingWrites: pending.count,
    syncState: pending.state,
    contract: {
      exists: Boolean(contract),
      signed,
      id: contract?.id || null,
      revision: contractRevision,
      hash: contractRef
    },
    program: {
      id: programId,
      state: lifecycle?.state || canonical?.lifecycle?.program,
      contractRevision: Number(programAuthority?.contractRevision || week?.contractRevision || receipt?.contractRevision || 0),
      contractRef: operatingContractRef || contractRef
    },
    week: week ? {
      ...week,
      id: week.id || canonical?.week?.id || null,
      programId: week.programId || canonical?.program?.id || programId,
      contractRevision: Number(week.contractRevision || 0)
    } : null,
    today: canonical ? {
      id: canonical.id,
      date,
      committed: canonical.day?.committed,
      weekCommitted: canonical.week?.committed,
      weekId: canonical.week?.id,
      programId: canonical.program?.id || programId,
      contractRevision: operatingContractRevision
    } : null,
    evidence: {
      count: evidenceItems.length,
      ids: evidenceItems.map((item) => item?.id).filter(Boolean),
      contractRevision: operatingContractRevision,
      programId,
      weekId: week?.id || canonical?.week?.id || null,
      todayId: canonical?.id || null
    },
    closeout: readDailyCloseout(date),
    stagedWeek: lifecycle?.weekDraft || null,
    executionContext,
    assignmentAudit: {
      matches: expectedAssignmentIds.length === canonicalAssignmentIds.length
        && expectedAssignmentIds.every((id, index) => id === canonicalAssignmentIds[index]),
      expectedAssignmentIds,
      canonicalAssignmentIds
    },
    biometricReview: { pending: Boolean(pendingBiometric?.metric), metric: pendingBiometric?.metric || null },
    transition: protectedCurrentWeek ? {
      protectedCurrentWeek: true,
      operatingContractRevision,
      operatingContractRef
    } : null
  });
  if (typeof DominionJourneyContinuity !== "undefined") {
    const candidate = DominionJourneyContinuity.buildReceipt(journey, {
      assignments: activeAssignments,
      evidenceIds: evidenceItems.map((item) => item?.id).filter(Boolean),
      closeout: readDailyCloseout(date),
      biometricReview: Boolean(pendingBiometric?.metric)
    });
    currentJourneyContinuity = DominionJourneyContinuity.evaluate({
      journey,
      candidate,
      localReceipts: readJourneyCertificationReceipts(),
      accountReceipts: accountTruthState.accountSnapshot?.domains?.evidence?.payload?.journeyReceipts || [],
      serverConfirmed: accountTruthState.serverConfirmed === true,
      pendingWrites: pending.count,
      syncState: pending.state,
      online: navigator.onLine !== false
    });
    scheduleJourneyCertificationReceipt(currentJourneyContinuity);
  } else {
    currentJourneyContinuity = null;
  }
  currentRealAccountJourney = buildCurrentRealAccountJourney({
    date,
    contract,
    week,
    canonical,
    activeDay,
    activeAssignments,
    evidenceItems,
    operatingContractRevision,
    signed
  });
  currentRecruitProofWeek = buildCurrentRecruitProofWeek({
    date,
    contract,
    week,
    operatingContractRevision,
    realAccountJourney: currentRealAccountJourney
  });
  currentBetaJourneyCertification = Object.freeze({
    ...journey,
    continuity: currentJourneyContinuity,
    realAccount: currentRealAccountJourney,
    proofWeek: currentRecruitProofWeek
  });
  return currentBetaJourneyCertification;
}

function buildCurrentRealAccountJourney(context = {}) {
  if (typeof DominionRealAccountJourney === "undefined") return null;
  const date = String(context.date || todayISODate()).slice(0, 10);
  const contract = context.contract || readApprovedRecruitContract();
  const week = context.week || readCommittedUnifiedWeek(date);
  const canonical = context.canonical || (currentCanonicalDailyCommand?.date === date ? currentCanonicalDailyCommand : buildCurrentCanonicalDailyCommand(date));
  const activeDay = context.activeDay || readEffectiveUnifiedDay(date);
  const calendarAssignments = context.activeAssignments || (Array.isArray(activeDay?.activities) ? activeDay.activities : []);
  const ledger = buildCurrentExecutionLedger(date);
  const assignments = (ledger?.entries || []).map((entry) => ({
    ...(entry.assignment || {}),
    id: entry.assignmentId,
    assignmentId: entry.assignmentId,
    module: String(entry.module || "").toUpperCase(),
    status: entry.state,
    required: !["superseded", "cancelled"].includes(String(entry.state || "").toLowerCase())
  }));
  const nutritionAssignment = assignments.find((item) => String(item.module || "").toUpperCase() === "NUTRITION") || null;
  const withNutrition = (items = []) => nutritionAssignment && !items.some((item) => String(item?.id || item?.assignmentId || item?.activityId || "") === nutritionAssignment.assignmentId)
    ? [...items, nutritionAssignment]
    : [...items];
  const todayAssignments = withNutrition(Array.isArray(canonical?.schedule?.sessions) ? canonical.schedule.sessions : []);
  const calendarSurface = withNutrition(calendarAssignments);
  const activeStrength = readActiveStrengthExecution();
  const activeStrengthDate = typeof DominionBetaStateIntegrity === "undefined"
    ? String(activeStrength?.operationalDate || activeStrength?.date || "").slice(0, 10)
    : DominionBetaStateIntegrity.executionDate(activeStrength || {});
  const activeExecutionId = typeof DominionBetaStateIntegrity === "undefined"
    ? (activeStrengthDate === date ? String(activeStrength?.assignmentId || activeStrength?.calendarAssignmentId || "") : "")
    : (activeStrengthDate === date ? DominionBetaStateIntegrity.assignmentId(activeStrength || {}) : "");
  const completionReceipts = readCommandCompletionHistory().filter((item) => String(item?.operationalDate || item?.date || "").slice(0, 10) === date);
  const evidenceItems = [
    ...(context.evidenceItems || journeyEvidenceItemsForDate(date)),
    ...completionReceipts
  ];
  const fuelReceipt = nutritionAssignment
    ? completionReceipts.find((item) => String(item?.assignmentId || item?.calendarAssignmentId || "") === nutritionAssignment.assignmentId) || null
    : null;
  const fuelLedger = nutritionAssignment ? buildFuelDayLedger(date) : null;
  const closeout = readDailyCloseout(date);
  const pending = canonicalPendingWriteState();
  let contractSigned = context.signed === true;
  if (!contractSigned) {
    try { contractSigned = Boolean(contract && typeof DominionContractExperience !== "undefined" && DominionContractExperience.signatureStatus(contract).valid); }
    catch (_) {}
  }
  const report = DominionRealAccountJourney.evaluate({
    date,
    authority: {
      contractSigned,
      contractRevision: Number(context.operatingContractRevision || week?.contractRevision || contract?.revision || 0),
      programContractRevision: Number(week?.contractRevision || context.operatingContractRevision || 0),
      weekContractRevision: Number(week?.contractRevision || 0),
      programId: week?.programId || canonical?.program?.id || null,
      weekId: week?.id || canonical?.week?.id || week?.weekStart || null,
      todayId: canonical?.id || null
    },
    assignments,
    surfaces: {
      calendar: calendarSurface,
      today: todayAssignments,
      activeExecutionId
    },
    evidence: evidenceItems,
    fuel: nutritionAssignment ? {
      recordId: fuelLedger?.record?.id || (fuelLedger?.record ? `manual-day:${date}` : null),
      receiptId: fuelReceipt?.id || null,
      confirmed: fuelReceipt?.verificationStatus === "VERIFIED" && Boolean(fuelReceipt?.accountConfirmedAt),
      accountConfirmedAt: fuelReceipt?.accountConfirmedAt || null,
      pending: Boolean(fuelLedger?.record && !fuelReceipt?.accountConfirmedAt)
    } : null,
    closeout,
    review: { operatingDate: closeout ? dailyCloseoutDate(closeout.date || closeout.operatingDate || date) : null },
    account: {
      serverConfirmed: accountTruthState.serverConfirmed === true,
      lastVerifiedAt: accountTruthState.lastVerifiedAt,
      confirmedMutationId: accountTruthState.confirmedMutationId,
      confirmedFingerprint: accountTruthState.confirmedFingerprint,
      pendingWrites: pending.count,
      online: navigator.onLine !== false
    },
    localReceipts: readRealAccountJourneyReceipts(),
    accountReceipts: accountTruthState.accountSnapshot?.domains?.evidence?.payload?.journeyReceipts || []
  });
  if (context.deferReceipt !== true) scheduleRealAccountJourneyReceipt(report);
  if (document?.body) {
    document.body.dataset.realAccountJourney = String(report.state || "checking").toLowerCase().replaceAll("_", "-");
    document.body.dataset.realAccountJourneyReceipt = report.candidate?.id || "";
  }
  return report;
}

function recruitProofWeekContractStart(contract = null) {
  return String(
    contract?.signature?.signedAt
    || contract?.approvedAt
    || contract?.createdAt
    || contract?.startDate
    || ""
  ).slice(0, 10) || null;
}

function buildCurrentRecruitProofWeek(context = {}) {
  if (typeof DominionRecruitProofWeek === "undefined") return null;
  const date = String(context.date || todayISODate()).slice(0, 10);
  const contract = context.contract || readApprovedRecruitContract();
  const week = context.week || readCommittedUnifiedWeek(date);
  if (!contract || !week?.weekStart || !week?.weekEnd) return null;
  const pending = canonicalPendingWriteState();
  const accountReceipts = accountTruthState.accountSnapshot?.domains?.evidence?.payload?.journeyReceipts || [];
  const report = DominionRecruitProofWeek.evaluate({
    authority: {
      contractRevision: Number(context.operatingContractRevision || week.contractRevision || contract.revision || 0),
      programId: week.programId || readAtlasProgramReceipt()?.programId || `contract-r${contract.revision || 0}`,
      weekId: week.id || week.weekStart,
      weekStartDate: week.weekStart,
      weekEndDate: week.weekEnd
    },
    asOfDate: date,
    contractStartDate: recruitProofWeekContractStart(contract),
    liveDaily: {
      date,
      report: Object.prototype.hasOwnProperty.call(context, "realAccountJourney")
        ? context.realAccountJourney
        : currentRealAccountJourney
    },
    localReceipts: readJourneyCertificationReceipts(),
    accountReceipts,
    account: {
      serverConfirmed: accountTruthState.serverConfirmed === true,
      lastVerifiedAt: accountTruthState.lastVerifiedAt,
      confirmedMutationId: accountTruthState.confirmedMutationId,
      confirmedFingerprint: accountTruthState.confirmedFingerprint,
      pendingWrites: pending.count,
      online: navigator.onLine !== false
    }
  });
  scheduleRecruitProofWeekReceipt(report);
  if (document?.body) {
    document.body.dataset.recruitProofWeek = String(report.state || "checking").toLowerCase().replaceAll("_", "-");
    document.body.dataset.recruitProofWeekReceipt = report.candidate?.id || "";
  }
  return report;
}

function buildRecruitProofWeekForInspection(inspection = weeklyInspection) {
  if (!inspection?.weekStartDate) return null;
  const week = readCommittedUnifiedWeekByStart(inspection.weekStartDate);
  if (!week) return null;
  return buildCurrentRecruitProofWeek({
    date: todayISODate() > week.weekEnd ? week.weekEnd : todayISODate(),
    week,
    contract: readApprovedRecruitContract(),
    operatingContractRevision: Number(week.contractRevision || 0),
    realAccountJourney: null
  });
}

function recruitProofWeekMarkup(report = currentRecruitProofWeek) {
  if (!report) return '<div class="recruit-proof-week-copy"><span>THIS WEEK</span><strong>Checking daily proof</strong><small>Your saved evidence is being restored.</small></div>';
  const days = (report.days || []).map((day) => `<i data-proof-day="${escapeHtml(day.state.toLowerCase())}" title="${escapeHtml(`${day.date} Â· ${day.state.replaceAll("_", " ")}`)}"></i>`).join("");
  const repair = report.repair
    ? `<button type="button" data-recruit-proof-week-action="${escapeHtml(report.repair.code)}" data-recruit-proof-week-section="${escapeHtml(report.repair.section || "today")}" data-recruit-proof-week-date="${escapeHtml(report.repair.operatingDate || "")}">${escapeHtml(report.repair.label || "Review")}</button>`
    : report.state === "VERIFIED"
      ? '<span class="recruit-proof-week-seal">7 / 7</span>'
      : '<a href="#today" data-section="today">Finish today</a>';
  return `<div class="recruit-proof-week-copy"><span>${escapeHtml(report.weekLabel)}</span><strong>${escapeHtml(`${report.counts.secure} of 7 days secure`)}</strong><small>${escapeHtml(report.detail)}</small></div><div class="recruit-proof-week-days" aria-label="${escapeHtml(report.headline)}">${days}</div>${repair}`;
}

function renderRecruitProofWeek(report = currentRecruitProofWeek || buildCurrentRecruitProofWeek(), targets = ["recruit-proof-week-today", "recruit-proof-week-review"]) {
  if (targets.includes("recruit-proof-week-today")) currentRecruitProofWeek = report;
  targets.forEach((id) => {
    const host = document.getElementById(id);
    if (!host) return;
    host.hidden = !report;
    host.dataset.proofTone = report?.tone || "neutral";
    host.dataset.proofState = report?.state || "CHECKING";
    host.innerHTML = recruitProofWeekMarkup(report);
  });
  return report;
}

function buildRecruitWeekCertification(inspection = weeklyInspection, options = {}) {
  if (!inspection?.weekStartDate || typeof DominionRecruitWeekCertification === "undefined") return null;
  const sourceWeek = options.sourceWeek || readCommittedUnifiedWeekByStart(inspection.weekStartDate);
  if (!sourceWeek) return null;
  const proofWeek = options.proofWeek || buildRecruitProofWeekForInspection(inspection);
  const weeklyLaunch = Object.prototype.hasOwnProperty.call(options, "weeklyLaunch")
    ? options.weeklyLaunch
    : buildWeeklyVerdictLaunch(inspection, { proofWeek });
  const targetWeekStart = weeklyLaunch?.targetWeekStart || DominionRecruitWeekCertification.addDays(inspection.weekEndDate, 1);
  const targetWeek = options.targetWeek || readCommittedUnifiedWeekByStart(targetWeekStart);
  const pending = canonicalPendingWriteState();
  const report = DominionRecruitWeekCertification.evaluate({
    userId: session?.user?.id || null,
    authority: {
      contractRevision: Number(sourceWeek.contractRevision || 0),
      programId: sourceWeek.programId || "",
      weekId: sourceWeek.id || sourceWeek.weekStart,
      weekStartDate: sourceWeek.weekStart,
      weekEndDate: sourceWeek.weekEnd
    },
    proofWeek,
    inspection,
    weeklyLaunch,
    targetWeek,
    localReceipts: readRecruitWeekCertificationReceipts(),
    accountReceipts: (accountTruthState.accountSnapshot?.domains?.evidence?.payload?.journeyReceipts || [])
      .filter((item) => item?.type === DominionRecruitWeekCertification.RECEIPT_TYPE),
    account: {
      serverConfirmed: accountTruthState.serverConfirmed === true,
      lastVerifiedAt: accountTruthState.lastVerifiedAt,
      confirmedMutationId: accountTruthState.confirmedMutationId,
      confirmedFingerprint: accountTruthState.confirmedFingerprint,
      pendingWrites: pending.count,
      online: navigator.onLine !== false
    }
  });
  currentRecruitWeekCertification = report;
  scheduleRecruitWeekCertificationReceipt(report);
  return report;
}

function recruitWeekCertificationActionMarkup(report = null) {
  const action = report?.primaryAction;
  if (!action) return '<span class="recruit-week-certification-wait">Account confirmation in progress</span>';
  return `<button type="button" data-recruit-week-action="${escapeHtml(action.code)}" data-recruit-week-section="${escapeHtml(action.section || "inspection")}" data-recruit-week-date="${escapeHtml(action.operatingDate || "")}">${escapeHtml(action.label || "Continue")}</button>`;
}

function recruitWeekCertificationMarkup(report = null) {
  if (!report) return '<div><span>WEEK STATUS</span><strong>Checking saved proof</strong><small>Your verified week is being restored.</small></div>';
  const stageSummary = (report.stages || []).map((item) => `<li><span>${escapeHtml(item.id)}</span><strong>${escapeHtml(item.state.replaceAll("_", " "))}</strong></li>`).join("");
  return `<div class="recruit-week-certification-copy"><span>WEEK STATUS</span><strong>${escapeHtml(report.label)}</strong><small>${escapeHtml(report.detail)}</small></div>
    <div class="recruit-week-certification-mark" aria-hidden="true"><span>${report.verified ? "7/7" : "â†’"}</span></div>
    <div class="recruit-week-certification-action">${recruitWeekCertificationActionMarkup(report)}</div>
    <details class="recruit-week-certification-support"><summary>Support details</summary><code>${escapeHtml(report.diagnostic?.code || "CHECKING")}</code><ul>${stageSummary}</ul></details>`;
}

function renderRecruitWeekCertification(inspection = weeklyInspection, options = {}) {
  const host = document.getElementById("recruit-week-certification");
  if (!host) return null;
  const report = options.error ? null : (options.report || buildRecruitWeekCertification(inspection, options));
  host.hidden = false;
  host.dataset.weekTone = report?.tone || (options.error ? "red" : "neutral");
  host.dataset.weekState = report?.state || (options.error ? "ERROR" : "CHECKING");
  host.innerHTML = options.error
    ? `<div class="recruit-week-certification-copy"><span>WEEK STATUS</span><strong>Review unavailable</strong><small>${escapeHtml(options.error)}</small></div><div class="recruit-week-certification-action"><button type="button" data-recruit-week-action="RETRY_ACCOUNT" data-recruit-week-section="inspection">Try again</button></div>`
    : recruitWeekCertificationMarkup(report);
  document.getElementById("inspection")?.setAttribute("data-week-certification", report?.state || "CHECKING");
  if (document?.body) {
    document.body.dataset.recruitWeekCertification = String(report?.state || "checking").toLowerCase().replaceAll("_", "-");
    document.body.dataset.recruitWeekCertificationReceipt = report?.candidate?.id || "";
  }
  return report;
}

function buildCurrentTrustLayerReport(options = {}) {
  if (typeof DominionTrustLayer === "undefined") return null;
  const manifest = continuityState.manifest || buildCurrentContinuityManifest();
  const lineage = continuityState.lineage || (typeof DominionContinuity === "undefined" ? null : DominionContinuity.canonicalLineage(manifest || {}, { today: todayISODate() }));
  const decisionConsistency = typeof DominionDailyDecisionIntegrity === "undefined" || !currentDailyDecision
    ? Boolean(currentDailyDecision)
    : DominionDailyDecisionIntegrity.consistencyReport(currentDailyDecision).valid;
  const accountHealth = typeof DominionAccountTruth === "undefined"
    ? accountTruthState
    : DominionAccountTruth.healthReport({
      ...accountTruthState,
      snapshot: accountTruthState.snapshot || readAccountTruthLocalSnapshot(),
      pendingWrites: canonicalPendingWriteState().count,
      online: navigator.onLine !== false
    });
  const report = DominionTrustLayer.evaluate({
    online: navigator.onLine !== false,
    accountHealth: { ...accountTruthState, ...accountHealth },
    lineage,
    conflicts: currentContinuityConflicts(),
    pendingWrites: canonicalPendingWriteState().count,
    programFingerprint: manifest?.fingerprint || null,
    accountProgramFingerprint: continuityState.accountManifest?.fingerprint || accountTruthState.accountSnapshot?.programFingerprint || null,
    decision: currentDailyDecision,
    decisionConsistency,
    startupIssues: options.startupIssues || trustLayerState.startupIssues,
    recovered: options.recovered === true || accountTruthState.recovered === true
  });
  if (typeof DominionBetaReadinessGate === "undefined") return report;
  const date = todayISODate();
  const canonical = currentCanonicalDailyCommand?.date === date
    ? currentCanonicalDailyCommand
    : buildCurrentCanonicalDailyCommand(date);
  const lifecycle = currentProgramLifecycle();
  const activeWeek = readCommittedUnifiedWeek(date);
  const readiness = DominionBetaReadinessGate.evaluate({
    trustReport: report,
    account: { ...accountTruthState, status: accountHealth.status },
    pendingWrites: canonicalPendingWriteState().count,
    online: navigator.onLine !== false,
    lifecycle,
    activeWeek,
    canonicalCommand: canonical,
    adaptation: readAtlasLiveAdaptation(date)
  });
  const journey = buildCurrentBetaJourneyCertification({ accountHealth, canonical, lifecycle, week: activeWeek, lineage });
  return { ...report, readiness, journey };
}

function renderTrustLayerHealth(report = trustLayerState.report || buildCurrentTrustLayerReport()) {
  if (!report) return;
  trustLayerState.report = report;
  const readiness = report.readiness || null;
  const journey = report.journey || null;
  const journeyContinuity = journey?.continuity || currentJourneyContinuity || null;
  const realAccountJourney = journey?.realAccount || currentRealAccountJourney || null;
  const journeyProblem = journey && ["ACTION_REQUIRED", "INCONSISTENT"].includes(journey.state);
  const realJourneyProblem = realAccountJourney?.state === "ACTION_REQUIRED";
  const governing = realJourneyProblem
    ? { ...realAccountJourney, headline: realAccountJourney.detail }
    : journeyProblem ? journey : readiness;
  const root = document.getElementById("account-truth-health");
  if (root) {
    root.dataset.truthTone = governing?.tone || report.tone;
    root.dataset.readiness = readiness?.state || report.status;
    root.dataset.journey = journey?.state || "CHECKING";
    root.dataset.realAccountJourney = realAccountJourney?.state || "CHECKING";
  }
  const stage = (id) => journey?.stages?.find((item) => item.id === id)?.state || null;
  setText("account-truth-status", governing?.label || report.status.replaceAll("_", " "));
  setText("account-truth-headline", governing?.headline || report.headline);
  setText("account-truth-program", stage("program") || readiness?.checks?.program || report.checks.program);
  setText("account-truth-calendar", stage("calendar") || readiness?.checks?.calendar || report.checks.calendar);
  setText("account-truth-today", stage("today") || readiness?.checks?.today || report.checks.today);
  setText("account-truth-evidence", stage("evidence") || readiness?.checks?.evidence || report.checks.evidence);
  const continuityLabel = realAccountJourney && ["VERIFIED", "PROTECTED", "ACTION_REQUIRED", "READY_TO_SAVE"].includes(realAccountJourney.state)
    ? realAccountJourney.label
    : journeyContinuity?.label || "CHECKING";
  setText("account-truth-continuity", continuityLabel);
  const action = document.getElementById("account-truth-action");
  const primaryAction = governing?.primaryAction || (journeyContinuity?.tone === "red" ? journeyContinuity.action : null) || report.primaryAction;
  if (action) {
    action.hidden = !primaryAction;
    action.textContent = primaryAction?.label || "Review";
    action.dataset.trustAction = primaryAction?.code || "";
    action.dataset.trustSection = primaryAction?.section || "";
  }
  document.body.dataset.trustLayer = report.status.toLowerCase().replaceAll("_", "-");
  document.body.dataset.betaReadiness = readiness?.state?.toLowerCase().replaceAll("_", "-") || "checking";
  document.body.dataset.betaJourney = journey?.state?.toLowerCase().replaceAll("_", "-") || "checking";
  const journeyReceipt = journey ? DominionBetaJourneyCertification.certificationReceipt(journey) : null;
  document.body.dataset.betaJourneyReceipt = journeyReceipt?.id || "";
  renderRecruitProofWeek(journey?.proofWeek || currentRecruitProofWeek);
  renderReliabilitySupportCode();
}

async function reportTrustEvent(event, report = trustLayerState.report, context = {}) {
  if (!report || typeof DominionTrustLayer === "undefined" || typeof fetch === "undefined") return false;
  const payload = DominionTrustLayer.telemetryPayload(event, report, {
    ...currentReliabilityContext(),
    conflictCount: currentContinuityConflicts().length,
    route: window.location.hash.replace(/^#/, "") || "app",
    ...context
  });
  if (!shouldReportTrustPayload(payload)) return true;
  try {
    const response = await fetch("/api/trust-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "same-origin"
    });
    const receipt = await response.json().catch(() => null);
    if (response.ok && receipt?.supportCode) {
      if (["warning", "error"].includes(receipt.severity)) {
        trustLayerState.lastSupportSignal = {
          supportCode: receipt.supportCode,
          severity: receipt.severity,
          event,
          reportedAt: new Date().toISOString()
        };
      } else if (["sync_completed", "retry_succeeded", "repair_completed"].includes(event) && currentReliabilityContext().pendingWrites === 0) {
        trustLayerState.lastSupportSignal = null;
      }
      renderReliabilitySupportCode();
    }
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function reportSyncLifecycle(event, context = {}) {
  const report = trustLayerState.report || buildCurrentTrustLayerReport();
  if (!report) return false;
  const safeContext = typeof DominionAccountPersistence !== "undefined" && DominionAccountPersistence.telemetry
    ? DominionAccountPersistence.telemetry({
        operation: event,
        type: context.domain || context.subsystem || context.surface || "ACCOUNT_SYNC",
        revision: context.revision || continuityState.accountRevision,
        status: context.status || context.code || (context.failed ? "FAILED" : "ACTIVE"),
        attempt: context.attempt || context.attempts || 0
      })
    : { operation: event, type: "ACCOUNT_SYNC", revision: Number(continuityState.accountRevision || 0), status: "ACTIVE", attempt: 0 };
  return reportTrustEvent(event, report, { ...currentReliabilityContext(), ...safeContext, errorCode: context.code || "" });
}

function reportSafeRuntimeError(route = "runtime", error = null) {
  try {
    const report = trustLayerState.report || buildCurrentTrustLayerReport();
    if (report) void reportTrustEvent("runtime_error", report, {
      route,
      errorName: error?.name || (typeof error === "string" ? "Error" : "UnknownError"),
      errorCode: error?.code || ""
    });
  } catch (_) {}
}

async function runTrustLayer(options = {}) {
  if (trustLayerState.running || typeof DominionTrustLayer === "undefined") return trustLayerState.report;
  trustLayerState.running = true;
  trustLayerState.startupIssues = Array.isArray(options.startupIssues) ? options.startupIssues : trustLayerState.startupIssues;
  try {
    let report = buildCurrentTrustLayerReport({ startupIssues: trustLayerState.startupIssues });
    renderTrustLayerHealth(report);
    if (options.repair !== false && report?.repairActions?.length && navigator.onLine !== false) {
      await reportTrustEvent("repair_started", report);
      let recovered = false;
      try {
        if (report.repairActions.includes("RETRY_SAVED_WORK")) {
          await flushContinuityPendingWrites();
          await flushAccountTruthPendingWrite({ force: true });
          recovered = true;
        }
        if (report.repairActions.includes("SYNC_ACCOUNT_STATE")) {
          await syncDominionAccountTruth({ force: true, reason: "trust_repair" });
          recovered = true;
        }
        if (report.repairActions.includes("REBUILD_TODAY")) {
          const truth = buildCurrentOperatingTruth();
          if (truth) {
            renderOneCommand(truth);
            recovered = Boolean(currentDailyDecision);
          }
        }
        report = buildCurrentTrustLayerReport({ startupIssues: [], recovered });
        renderTrustLayerHealth(report);
        await reportTrustEvent("repair_completed", report);
      } catch (_) {
        report = buildCurrentTrustLayerReport({ startupIssues: trustLayerState.startupIssues });
        renderTrustLayerHealth(report);
        await reportTrustEvent("repair_failed", report);
      }
    }
    if (report && report.fingerprint !== trustLayerState.lastReportedFingerprint) {
      trustLayerState.lastReportedFingerprint = report.fingerprint;
      await reportTrustEvent("trust_check", report);
    }
    return report;
  } finally {
    trustLayerState.running = false;
  }
}

function accountTruthMigrationMissing(error = null) {
  return ["42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error?.code)
    || /truth_schema_version|truth_snapshot|sync_dominion_account_truth/i.test(error?.message || "");
}

function accountTruthRevisionConflict(error = null) {
  return error?.code === "40001" || /REVISION_CONFLICT/i.test(error?.message || "");
}

function accountPersistenceMigrationMissing(error = null) {
  return ["42703", "42883", "PGRST202", "PGRST204"].includes(error?.code)
    || /last_mutation_id|last_mutation_fingerprint|sync_dominion_account_truth_v2/i.test(error?.message || "");
}

async function loadAccountTruthLedger() {
  const supabase = await getClient();
  const baseColumns = "revision,schema_version,truth_schema_version,device_id,manifest,truth_snapshot,integrity_status,last_verified_at,client_updated_at,updated_at";
  const receiptColumns = `${baseColumns},last_mutation_id,last_mutation_fingerprint,last_acknowledged_at`;
  let result = await supabase.from("dominion_continuity_state")
    .select(receiptColumns)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (result.error && accountPersistenceMigrationMissing(result.error)) {
    result = await supabase.from("dominion_continuity_state")
      .select(baseColumns)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!result.error && result.data) result.data.__legacyReceipt = true;
  }
  if (result.error) throw result.error;
  return result.data || null;
}

async function saveAccountTruthLedger(envelope, integrityStatus = "VERIFIED") {
  const supabase = await getClient();
  const common = {
    expected_revision: Number(envelope.expectedRevision || 0),
    next_schema_version: DominionContinuity.SCHEMA_VERSION,
    next_truth_schema_version: DominionAccountTruth.SCHEMA_VERSION,
    next_device_id: envelope.deviceId || continuityDeviceId(),
    next_manifest: envelope.manifest,
    next_truth_snapshot: envelope.snapshot,
    next_integrity_status: integrityStatus,
    next_client_updated_at: envelope.clientUpdatedAt || new Date().toISOString()
  };
  let { data, error } = await supabase.rpc("sync_dominion_account_truth_v2", {
    ...common,
    next_mutation_id: envelope.mutationId,
    next_mutation_fingerprint: envelope.mutationFingerprint
  });
  if (error && accountPersistenceMigrationMissing(error)) {
    ({ data, error } = await supabase.rpc("sync_dominion_account_truth", common));
    if (!error) {
      const legacy = Array.isArray(data) ? data[0] : data;
      return legacy ? { ...legacy, __legacyReceipt: true } : legacy;
    }
  }
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

function accountTruthReceiptMatches(receipt, envelope, options = {}) {
  if (!receipt || !envelope) return false;
  if (typeof DominionAccountPersistence !== "undefined") {
    return DominionAccountPersistence.receiptMatches(receipt, envelope, {
      acceptExactState: options.acceptExactState === true || receipt.__legacyReceipt === true
    });
  }
  return receipt?.manifest?.fingerprint === envelope?.manifest?.fingerprint
    && receipt?.truth_snapshot?.fingerprint === envelope?.snapshot?.fingerprint;
}

function confirmAccountTruthReceipt(receipt, envelope, restored = 0) {
  const snapshot = receipt?.truth_snapshot || envelope.snapshot;
  saveAccountTruthLocalSnapshot(snapshot);
  saveAccountTruthQueue([]);
  window.clearTimeout(accountTruthRetryTimer);
  continuityState.accountRevision = Number(receipt?.revision || envelope.expectedRevision + 1);
  continuityState.accountManifest = receipt?.manifest || envelope.manifest;
  continuityState.lastSyncedAt = receipt?.last_acknowledged_at || receipt?.last_verified_at || receipt?.updated_at || new Date().toISOString();
  if (receipt?.manifest) saveContinuityManifestLocal(receipt.manifest);
  accountTruthState = {
    ...accountTruthState,
    mode: restored ? "RECOVERED" : "VERIFIED",
    initialized: true,
    accountRevision: continuityState.accountRevision,
    truthSchemaVersion: Number(receipt?.truth_schema_version || DominionAccountTruth.SCHEMA_VERSION),
    snapshot,
    accountSnapshot: snapshot,
    pendingWrites: 0,
    lastVerifiedAt: receipt?.last_acknowledged_at || receipt?.last_verified_at || receipt?.updated_at || new Date().toISOString(),
    confirmedMutationId: receipt?.last_mutation_id || envelope.mutationId || null,
    confirmedFingerprint: receipt?.last_mutation_fingerprint || envelope.mutationFingerprint || null,
    serverConfirmed: true,
    lastError: null,
    legacyFallback: receipt?.__legacyReceipt === true,
    recovered: restored > 0
  };
  renderAccountTruthHealth();
  if (weeklyInspection) renderRecruitWeekCertification(weeklyInspection);
  return snapshot;
}

async function syncDominionAccountTruth(options = {}) {
  if (accountTruthSyncPromise) return accountTruthSyncPromise;
  if (!session?.user?.id || typeof DominionAccountTruth === "undefined" || typeof DominionContinuity === "undefined") return false;
  if (typeof DominionStartupAuthority !== "undefined"
    && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, options.reason || (options.force ? "forced" : "scheduled"))) return false;
  accountTruthSyncPromise = (async () => {
    void reportSyncLifecycle("sync_started", { reason: options.reason || (options.force ? "forced" : "scheduled") });
    const localManifest = continuityState.manifest || buildCurrentContinuityManifest();
    const localSnapshot = buildCurrentAccountTruthSnapshot(localManifest);
    let writeEnvelope = buildAccountTruthWriteEnvelope(localManifest, localSnapshot, continuityState.accountRevision);
    saveAccountTruthLocalSnapshot(localSnapshot);
    if (navigator.onLine === false) {
      queueAccountTruthWrite(writeEnvelope);
      accountTruthState = { ...accountTruthState, mode: "OFFLINE_PROTECTED", initialized: true, serverConfirmed: false };
      renderAccountTruthHealth();
      return false;
    }
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const data = await loadAccountTruthLedger();
        const accountRevision = Number(data?.revision || 0);
        const accountManifest = data?.manifest || null;
        const manifestReconciliation = accountManifest ? DominionContinuity.reconcileManifests(localManifest, accountManifest) : null;
        const recordDomains = new Set([...continuityRecordConflicts.values()].map((item) => item.domain));
        const unresolvedManifest = (manifestReconciliation?.conflicts || []).filter((item) => !recordDomains.has(item.domain));
        if (!options.prefer && (continuityRecordConflicts.size || unresolvedManifest.length)) {
          continuityState.accountRevision = accountRevision;
          continuityState.accountManifest = accountManifest;
          continuityState.manifestConflicts = unresolvedManifest;
          setContinuityMode("CONFLICT", { initialized: true });
          accountTruthState = { ...accountTruthState, mode: "CONFLICT_REQUIRES_CHOICE", initialized: true, serverConfirmed: false, lastError: null };
          void reportSyncLifecycle("conflict_detected", { conflictCount: continuityRecordConflicts.size + unresolvedManifest.length });
          return false;
        }
        const programManifest = options.prefer === "ACCOUNT" && accountManifest
          ? accountManifest
          : options.prefer === "DEVICE" || !accountManifest
            ? localManifest
            : manifestReconciliation?.manifest || localManifest;
        saveContinuityManifestLocal(programManifest);
        applyContinuitySnapshotPayloads(programManifest);
        const deviceSnapshot = buildCurrentAccountTruthSnapshot(programManifest);
        const reconciliation = DominionAccountTruth.reconcileSnapshots(deviceSnapshot, data?.truth_snapshot || {}, {
          userId: session.user.id,
          deviceId: continuityDeviceId(),
          programFingerprint: programManifest?.fingerprint || null
        });
        const restored = applyAccountTruthSnapshot(reconciliation.snapshot);
        const manifestMatches = Boolean(data?.manifest?.fingerprint && data.manifest.fingerprint === programManifest?.fingerprint);
        const truthMatches = Boolean(data?.truth_snapshot?.fingerprint && data.truth_snapshot.fingerprint === reconciliation.snapshot.fingerprint);
        const pendingEnvelope = readAccountTruthQueue()[0] || null;
        if (data && manifestMatches && truthMatches) {
          const readEnvelope = pendingEnvelope || buildAccountTruthWriteEnvelope(programManifest, reconciliation.snapshot, Math.max(0, accountRevision - 1), {
            mutationId: data.last_mutation_id || undefined,
            clientUpdatedAt: data.client_updated_at || data.updated_at
          });
          if (!accountTruthReceiptMatches(data, readEnvelope, { acceptExactState: true })) throw Object.assign(new Error("Account state matched but did not produce an exact server receipt."), { code: "SAVE_NOT_ACKNOWLEDGED" });
          confirmAccountTruthReceipt(data, readEnvelope, restored);
          void reportSyncLifecycle("sync_completed", { changed: false, revision: accountRevision });
          if (restored) refreshContinuityConsumers();
          return true;
        }
        const identity = typeof DominionAccountPersistence !== "undefined"
          && pendingEnvelope
          && pendingEnvelope.manifestFingerprint === programManifest?.fingerprint
          && pendingEnvelope.truthFingerprint === reconciliation.snapshot?.fingerprint
          ? { mutationId: pendingEnvelope.mutationId, clientUpdatedAt: pendingEnvelope.clientUpdatedAt }
          : {};
        writeEnvelope = buildAccountTruthWriteEnvelope(programManifest, reconciliation.snapshot, accountRevision, identity);
        const saved = await saveAccountTruthLedger(writeEnvelope, restored ? "RECOVERED" : "VERIFIED");
        if (!accountTruthReceiptMatches(saved, writeEnvelope)) throw Object.assign(new Error("Account save was not acknowledged by the server."), { code: "SAVE_NOT_ACKNOWLEDGED" });
        confirmAccountTruthReceipt(saved, writeEnvelope, restored);
        void reportSyncLifecycle("sync_completed", { changed: true, revision: continuityState.accountRevision });
        if (restored) refreshContinuityConsumers();
        return true;
      } catch (error) {
        lastError = error;
        if (accountTruthRevisionConflict(error)) {
          void reportSyncLifecycle("conflict_detected", { attempt: attempt + 1 });
          if (attempt === 0) continue;
        }
        break;
      }
    }
    if (accountTruthMigrationMissing(lastError)) {
      accountTruthState = {
        ...accountTruthState,
        mode: "LEGACY_ACTIVE",
        initialized: true,
        legacyFallback: true,
        lastError: lastError?.message || "Migration 028 is not active"
      };
    } else {
      queueAccountTruthWrite(writeEnvelope || buildAccountTruthWriteEnvelope(localManifest, localSnapshot, continuityState.accountRevision), lastError);
      accountTruthState = {
        ...accountTruthState,
        mode: "SAVE_QUEUED",
        initialized: true,
        serverConfirmed: false,
        legacyFallback: false,
        lastError: lastError?.message || "Account truth sync unavailable"
      };
    }
    renderAccountTruthHealth();
    void reportSyncLifecycle("sync_failed", { code: lastError?.code || "UNKNOWN", recoverable: true });
    return false;
  })();
  try {
    return await accountTruthSyncPromise;
  } finally {
    accountTruthSyncPromise = null;
  }
}

function scheduleAccountTruthSync(delay = 900) {
  if (typeof DominionStartupAuthority !== "undefined"
    && !DominionStartupAuthority.permitsAccountWrite(startupAuthorityState, "scheduled")) return;
  if (accountTruthState.applying || !accountTruthState.initialized) return;
  if (currentExecutionConflicts().some((item) => item.domain === "contract")) {
    accountTruthState = { ...accountTruthState, mode: "CONFLICT_REQUIRES_CHOICE", serverConfirmed: false, lastError: null };
    renderAccountTruthHealth();
    return;
  }
  window.clearTimeout(accountTruthSyncTimer);
  accountTruthSyncTimer = window.setTimeout(() => syncDominionAccountTruth(), delay);
}

async function flushAccountTruthPendingWrite(options = {}) {
  const queue = readAccountTruthQueue();
  if (!queue.length) return true;
  if (navigator.onLine === false || !session?.user?.id) return false;
  if (currentExecutionConflicts().some((item) => item.domain === "contract")) {
    accountTruthState = { ...accountTruthState, mode: "CONFLICT_REQUIRES_CHOICE", initialized: true, serverConfirmed: false, lastError: null };
    renderAccountTruthHealth();
    return false;
  }
  const ready = typeof DominionAccountPersistence === "undefined"
    ? DominionAccountTruth.readyQueuedWrite(queue)
    : DominionAccountPersistence.ready(queue);
  if (!options.force && !ready) {
    scheduleAccountTruthQueueDrain();
    return false;
  }
  const item = queue[0];
  const saved = await syncDominionAccountTruth({ force: true, reason: "queued_retry" });
  void reportSyncLifecycle(saved ? "retry_succeeded" : "retry_failed", { domain: "account_truth", attempts: item?.attempts || 0 });
  if (!saved) scheduleAccountTruthQueueDrain();
  return saved;
}

async function drainAccountPersistence(options = {}) {
  const cycleId = `${options.reason || "retry"}:${new Date().toISOString()}`;
  const continuitySaved = readContinuityRetryQueue().length ? await flushContinuityPendingWrites() : true;
  const accountSaved = readAccountTruthQueue().length
    ? await flushAccountTruthPendingWrite({ force: options.force === true })
    : true;
  if (!accountSaved) scheduleAccountTruthQueueDrain();
  const saved = continuitySaved && accountSaved;
  if (!saved) {
    const pending = canonicalPendingWriteState();
    accountPersistenceWarningState = { cycleId, pending: pending.count };
    console.warn("[account:persist] Protected writes will retry.", {
      cycleId,
      count: pending.count,
      entries: (pending.entries || []).map((item) => ({ entity: item.entity || item.domain || item.stateType, reason: item.reason || item.errorCode || "Account confirmation pending" }))
    });
  } else {
    accountPersistenceWarningState = null;
  }
  return saved;
}

function installAccountPersistenceRecovery(supabase) {
  if (accountTruthAuthSubscription || !supabase?.auth?.onAuthStateChange) return;
  const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
    if (typeof DominionAccountPersistence !== "undefined"
      && !DominionAccountPersistence.shouldDrainForAuthEvent(event, nextSession)) return;
    if (!nextSession?.user?.id) return;
    session = nextSession;
    window.setTimeout(() => drainAccountPersistence({ reason: `auth_${String(event || "session").toLowerCase()}`, force: true }), 0);
  });
  accountTruthAuthSubscription = data?.subscription || null;
}

function readEvidenceAutopilotHistory() {
  const history = readClosedLoopState("HISTORY", "evidence-autopilot", []);
  return Array.isArray(history) ? history : [];
}

function readConnectedEvidenceReport() {
  return readClosedLoopState("HISTORY", "connected-evidence-current", null);
}

function readConnectedEvidenceHistory() {
  const history = readClosedLoopState("HISTORY", "connected-evidence", []);
  return Array.isArray(history) ? history : [];
}

function readConnectedEvidenceResolutions() {
  const resolutions = readClosedLoopState("HISTORY", "connected-evidence-resolutions", []);
  return Array.isArray(resolutions) ? resolutions : [];
}

function connectedEvidenceAssignments() {
  const seen = new Set();
  return readUnifiedWeekHistory()
    .filter((week) => week?.status !== "REPLACED")
    .flatMap((week) => (week.days || []).flatMap((day) => (day.activities || []).map((activity) => ({
      ...activity,
      id: activity.id || activity.activityId || `${day.date}:${activity.module}:${activity.title || activity.name || "assignment"}`,
      date: day.date,
      domain: activity.module
    }))))
    .filter((assignment) => {
      const key = `${assignment.date}|${assignment.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function reconcileConnectedEvidence(options = {}) {
  if (typeof DominionConnectedEvidence === "undefined") return null;
  let report = DominionConnectedEvidence.reconcile({
    records: connectedImportedRecords,
    assignments: connectedEvidenceAssignments(),
    generatedAt: options.generatedAt || new Date().toISOString()
  });
  readConnectedEvidenceResolutions().forEach((item) => {
    if (report.exceptions.some((exception) => exception.id === item.exceptionId)) {
      report = DominionConnectedEvidence.resolve(report, item.exceptionId, item.resolution, { resolvedAt: item.resolvedAt });
    }
  });
  const history = DominionConnectedEvidence.upsertHistory(readConnectedEvidenceHistory(), report);
  saveClosedLoopLocal("HISTORY", "connected-evidence-current", report);
  saveClosedLoopLocal("HISTORY", "connected-evidence", history);
  if (options.persist !== false) {
    await Promise.all([
      persistClosedLoopState("HISTORY", "connected-evidence-current", report),
      persistClosedLoopState("HISTORY", "connected-evidence", history)
    ]);
  }
  if (options.render !== false) renderConnectedDominion();
  return report;
}

async function resolveConnectedEvidence(exceptionId, resolution) {
  const report = readConnectedEvidenceReport();
  if (!report || typeof DominionConnectedEvidence === "undefined") return null;
  const next = DominionConnectedEvidence.resolve(report, exceptionId, resolution);
  const record = { exceptionId, resolution, resolvedAt: new Date().toISOString() };
  const resolutions = [record, ...readConnectedEvidenceResolutions().filter((item) => item.exceptionId !== exceptionId)].slice(0, 180);
  const history = DominionConnectedEvidence.upsertHistory(readConnectedEvidenceHistory(), next);
  saveClosedLoopLocal("HISTORY", "connected-evidence-current", next);
  saveClosedLoopLocal("HISTORY", "connected-evidence", history);
  saveClosedLoopLocal("HISTORY", "connected-evidence-resolutions", resolutions);
  await Promise.all([
    persistClosedLoopState("HISTORY", "connected-evidence-current", next),
    persistClosedLoopState("HISTORY", "connected-evidence", history),
    persistClosedLoopState("HISTORY", "connected-evidence-resolutions", resolutions)
  ]);
  await reconcileEvidenceAutopilot({ persist: true });
  renderConnectedDominion();
  return next;
}

function evidenceAutopilotMissionReceipts() {
  const history = readClosedLoopState("HISTORY", "account-truth-mission-evidence", []);
  return [
    ...(Array.isArray(history) ? history : []),
    ...readMissionExecutionReceipts(todayISODate()),
    ...readCommandCompletionHistory()
  ].filter((item) => item?.module && item?.summary && item?.id);
}

function evidenceAutopilotSources() {
  const readiness = [...readinessHistory, dailyState]
    .filter(Boolean)
    .map((item) => ({ ...item, sourceType: "ROLL_CALL", domain: "readiness", kind: "ROLL_CALL", state: "COMPLETE", source: "COACH_DOMINION" }));
  const closeouts = readDailyCloseoutHistory()
    .map((item) => ({ ...item, sourceType: "DAILY_CLOSEOUT", domain: "closeout", kind: "CLOSEOUT", state: "SEALED", metrics: { steps: item.steps, discipline: item.discipline } }));
  const strength = readStrengthHistory()
    .map((item) => ({ ...item, sourceType: "STRENGTH_EXECUTION", domain: "strength", kind: "SESSION", sessionId: item.sessionId || item.id, sessionName: item.sessionName || item.sessionSnapshot?.title || "Strength session", metrics: missionExecutionSummary("STRENGTH", item, item.sessionSnapshot) }));
  const core = readCoreHistory()
    .map((item) => ({ ...item, sourceType: "CORE_EXECUTION", domain: "core", kind: "SESSION", sessionId: item.sessionId || item.id, sessionName: item.sessionName || "Core session", metrics: { exercisesCompleted: Object.values(item.completedExercises || {}).filter(Boolean).length, quality: item.quality, effort: item.effort } }));
  const performance = performanceEntries.map((item) => ({ ...item, sourceType: "PERFORMANCE_ENTRY" }));
  const fuelLedger = readFuelClosedLoopLedger();
  const fuel = (fuelLedger.closeouts || [])
    .map((item) => ({ ...item, sourceType: "FUEL_CLOSEOUT", domain: "nutrition", kind: "INTAKE", state: item.status || "SEALED", metrics: item.metrics || item.actual || item.summary || {} }));
  const manualFuel = nutritionEvidenceHistory(todayISODate())
    .map((item) => typeof DominionFuelDayLedger === "undefined" ? null : DominionFuelDayLedger.evidence({ record: item }))
    .filter(Boolean);
  const meals = (readMealExecutionLedger().history || [])
    .filter((item) => String(item.status || "").toUpperCase() === "CONFIRMED")
    .map((item) => ({ ...item, sourceType: "MEAL_EXECUTION", domain: "nutrition", kind: "MEAL", state: "CONFIRMED", metrics: item.actual || item.estimate || {} }));
  const recovery = readMissionRecoveryHistory()
    .filter((item) => item?.completedAt || item?.status === "COMPLETE")
    .map((item) => ({ ...item, sourceType: "RECOVERY_ORDER", domain: "recovery", kind: "RECOVERY", state: "COMPLETE", metrics: { completedTasks: (item.tasks || []).filter((task) => task.completedAt).length } }));
  const connected = readConnectedEvidenceReport()?.proofSources || [];
  return [...evidenceAutopilotMissionReceipts(), ...connected, ...strength, ...core, ...performance, ...manualFuel, ...fuel, ...meals, ...readiness, ...closeouts, ...recovery];
}

function evidenceAutopilotRequiredDomains(date = todayISODate()) {
  const day = readEffectiveUnifiedDay(date);
  const scheduled = (day?.activities || []).map((item) => DominionEvidenceAutopilot.normalizeDomain(item.module)).filter((domain) => ["strength", "running", "core", "nutrition"].includes(domain));
  return [...new Set(["readiness", ...scheduled])];
}

function evidenceAutopilotWeekRequirements(date = todayISODate()) {
  const week = readCommittedUnifiedWeek(date);
  return (week?.days || []).map((day) => ({
    date: day.date,
    domains: [...new Set((day.activities || []).map((item) => DominionEvidenceAutopilot.normalizeDomain(item.module)).filter((domain) => ["strength", "running", "core", "nutrition"].includes(domain)))]
  })).filter((item) => item.domains.length);
}

function evidenceAutopilotHasPerformanceEntry(receipt) {
  return performanceEntries.some((entry) => {
    if (entry.metrics?.source_evidence_id === receipt.id || String(entry.notes || "").includes(receipt.id)) return true;
    if (entry.performanceDate !== receipt.date || entry.domain !== receipt.domain) return false;
    const notes = String(entry.notes || "");
    if ((receipt.sourceRefs || []).some((source) => source.sourceId && notes.includes(source.sourceId))) return true;
    const receiptLabel = String(receipt.label || "").trim().toLowerCase();
    const entryLabels = [entry.sessionName, entry.activityName].map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
    return Boolean(receiptLabel) && entryLabels.includes(receiptLabel) && String(entry.source || "").toUpperCase() === "COACH_DOMINION";
  });
}

async function repairEvidenceAutopilotPerformance(receipts = []) {
  let repaired = 0;
  for (const receipt of receipts) {
    const entry = DominionEvidenceAutopilot.performanceEntryFor(receipt);
    if (!entry || evidenceAutopilotHasPerformanceEntry(receipt)) continue;
    try {
      await persistPerformanceEvidenceEntry(entry);
      repaired += 1;
    } catch (_) {
      // Incomplete evidence remains a proof receipt and never becomes a trend entry.
    }
  }
  return repaired;
}

function renderEvidenceAutopilot() {
  if (typeof DominionEvidenceAutopilot === "undefined") return;
  const receipts = readEvidenceAutopilotHistory();
  const today = DominionEvidenceAutopilot.dailyProof(todayISODate(), receipts, evidenceAutopilotRequiredDomains());
  const todayRoot = document.getElementById("evidence-autopilot-status");
  if (todayRoot) {
    const securedCount = today.secured.length;
    const missing = today.missingDomains.map((item) => item.toUpperCase().replaceAll("_", " "));
    todayRoot.dataset.proofTone = missing.length ? "yellow" : securedCount ? "green" : "neutral";
    setText("evidence-autopilot-state", missing.length ? "PROOF NEEDED" : securedCount ? "SECURED" : "AWAITING ACTION");
    setText("evidence-autopilot-headline", missing.length ? missing.join(" + ") : `${securedCount} proof${securedCount === 1 ? "" : "s"} secured`);
    setText("evidence-autopilot-detail", `${today.verified.length} verified Â· ${today.selfReported.length} self-reported${today.incomplete.length ? ` Â· ${today.incomplete.length} open` : ""}`);
  }
  const selectedDate = document.getElementById("weekly-date")?.value || todayISODate();
  const range = getInspectionWeekRange(selectedDate);
  const weekly = DominionEvidenceAutopilot.weeklyProof(range, receipts, evidenceAutopilotWeekRequirements(selectedDate));
  const weeklyRoot = document.getElementById("weekly-proof-status");
  if (weeklyRoot) {
    setText("weekly-proof-secured", String(weekly.secured.length));
    setText("weekly-proof-verified", String(weekly.verified.length));
    setText("weekly-proof-reported", String(weekly.selfReported.length));
    setT) <= tolerance) return "5k";
  if (Math.abs(meters - 10000) <= tolerance) return "10k";
  if (Math.abs(meters - 21097.5) <= tolerance) return "half_marathon";
  if (Math.abs(meters - 42195) <= tolerance) return "marathon";
  if (Math.abs(meters - 3218.69) <= tolerance) return "2mi";
  return `custom:${Math.round(meters)}`;
}

function determineRecordCategory(entry = {}, testAttempt = null) {
  const normalizedEntry = normalizePerformanceEntry(entry);
  const domain = normalizedEntry?.domain;
  const metrics = normalizedEntry?.metrics || {};
  if (domain === "strength") {
    const hasVerifiedOneRepMax = metrics.verified_one_rep_max === true || metrics.verifiedOneRepMax === true || metrics.verified_1rm === true || entry?.verifiedOneRepMax === true || entry?.verified_1rm === true;
    if (hasVerifiedOneRepMax) return "VERIFIED_1RM_PR";
    const hasEstimatedOneRepMax = metrics.estimated_one_rep_max === true || metrics.estimatedOneRepMax === true || metrics.estimated_1rm === true || entry?.estimatedOneRepMax === true || entry?.estimated_1rm === true;
    if (hasEstimatedOneRepMax || normalizedEntry?.evidenceStatus === "ESTIMATED") return "ESTIMATED_1RM_PR";
    if (metrics.weight !== undefined && metrics.weight !== null) return "LOAD_PR";
    if (metrics.repetitions !== undefined && metrics.repetitions !== null) return "REP_PR";
    if (metrics.sets !== undefined && metrics.sets !== null && metrics.repetitions !== undefined && metrics.repetitions !== null) return "VOLUME_PR";
    return null;
  }
  if (domain === "running") {
    if (normalizedEntry?.entryType === "RACE" || normalizedEntry?.activityCode === "race") return "TIME_PR";
    return "TIME_PR";
  }
  if (domain === "core" || domain === "conditioning") {
    return "CONDITIONING_PR";
  }
  if (domain === "fitness_test") {
    return (testAttempt || normalizedEntry?.metrics?.test_event_value !== undefined || normalizedEntry?.metrics?.test_event_value !== null || normalizedEntry?.metrics?.overall_score !== undefined) ? "TEST_EVENT_PR" : null;
  }
  if (testAttempt) {
    return "TEST_EVENT_PR";
  }
  return null;
}

function isPerformanceComparable(candidate = {}, target = {}, recordCategory = "LOAD_PR") {
  const candidateKey = buildPerformanceComparisonKey(candidate, recordCategory);
  const targetKey = buildPerformanceComparisonKey(target, recordCategory);
  if (!candidateKey || !targetKey) return false;
  if (candidateKey === targetKey) {
    if (recordCategory === "ESTIMATED_1RM_PR" && candidate?.evidenceStatus !== target?.evidenceStatus) return false;
    if (recordCategory === "VERIFIED_1RM_PR" && candidate?.evidenceStatus !== target?.evidenceStatus) return false;
    return true;
  }
  return false;
}

function selectComparablePerformanceEntries(entries = [], targetEntry = {}, recordCategory = "LOAD_PR") {
  const normalizedTarget = normalizePerformanceEntry(targetEntry);
  const targetComparisonKey = buildPerformanceComparisonKey(normalizedTarget, recordCategory);
  return (entries || []).filter((entry) => {
    const candidate = normalizeComparableRecord(entry, recordCategory, targetComparisonKey);
    if (!candidate) return false;
    if (candidate.recordCategory !== recordCategory) return false;
    const candidateComparisonKey = candidate.comparisonKey || targetComparisonKey;
    if (candidateComparisonKey !== targetComparisonKey) return false;
    if (candidate.domain && normalizedTarget.domain && candidate.domain !== normalizedTarget.domain) return false;
    if (candidate.activityCode && normalizedTarget.activityCode && candidate.activityCode !== normalizedTarget.activityCode) return false;
    if (candidate.recordStatus === "INVALIDATED" || candidate.recordStatus === "INCOMPLETE") return false;
    return true;
  }).map((entry) => normalizeComparableRecord(entry, recordCategory, targetComparisonKey));
}

function findCurrentPersonalRecord(records = [], recordCategory = "LOAD_PR", comparisonKey = null, targetEntry = null) {
  const normalizedTarget = targetEntry ? normalizePerformanceEntry(targetEntry) : null;
  const targetComparisonKey = comparisonKey || (normalizedTarget ? buildPerformanceComparisonKey(normalizedTarget, recordCategory) : null);
  const targetDomain = normalizedTarget?.domain || null;
  const targetActivityCode = normalizedTarget?.activityCode || null;
  let best = null;
  (records || []).forEach((record) => {
    const candidate = normalizeComparableRecord(record, recordCategory, targetComparisonKey);
    if (!candidate) return;
    if (candidate.recordCategory !== recordCategory) return;
    if (targetComparisonKey && candidate.comparisonKey !== targetComparisonKey) return;
    if (targetDomain && candidate.domain && candidate.domain !== targetDomain) return;
    if (targetActivityCode && candidate.activityCode && candidate.activityCode !== targetActivityCode) return;
    if (candidate.recordStatus === "INVALIDATED" || candidate.recordStatus === "INCOMPLETE") return;
    const currentValue = Number(candidate.normalizedValue);
    if (!Number.isFinite(currentValue)) return;
    if (!best) {
      best = candidate;
      return;
    }
    const bestValue = Number(best.normalizedValue);
    if (!Number.isFinite(bestValue)) {
      best = candidate;
      return;
    }
    if (recordCategory === "TIME_PR" || recordCategory === "DURATION_PR" || recordCategory === "DISTANCE_PR") {
      if (currentValue < bestValue) best = candidate;
      return;
    }
    if (currentValue > bestValue) best = candidate;
  });
  return best;
}

function calculateRecordImprovement(previousValue = null, currentValue = null, direction = "higher") {
  const previous = Number(previousValue);
  const current = Number(currentValue);
  if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) return { absolute: current - previous, percentage: null };
  const absolute = current - previous;
  const percentage = direction === "lower" ? ((previous - current) / previous) * 100 : ((current - previous) / previous) * 100;
  return { absolute, percentage };
}

function buildPersonalRecordSnapshot(entry = {}, recordCategory = "LOAD_PR", previousRecord = null, existingRecords = []) {
  const normalizedEntry = normalizePerformanceEntry(entry);
  const comparisonKey = buildPerformanceComparisonKey(normalizedEntry, recordCategory);
  const normalizedValue = determineRecordValue(normalizedEntry, recordCategory);
  if (!Number.isFinite(Number(normalizedValue))) return null;
  const duplicate = (existingRecords || []).some((record) => record?.sourceEntryId === normalizedEntry.id && record?.recordCategory === recordCategory);
  if (duplicate) return null;
  const evidenceStatus = normalizedEntry.evidenceStatus === "INCOMPLETE"
    ? "INCOMPLETE"
    : normalizedEntry.evidenceStatus === "ESTIMATED"
      ? "ESTIMATED"
      : normalizedEntry.evidenceStatus === "VERIFIED"
        ? "VERIFIED"
        : "SELF REPORTED";
  const recordStatus = evidenceStatus === "ESTIMATED"
    ? "ESTIMATED"
    : evidenceStatus === "INCOMPLETE"
      ? "INVALIDATED"
      : "CONFIRMED";
  const improvement = calculateRecordImprovement(previousRecord?.normalizedValue || null, normalizedValue, recordCategory === "TIME_PR" || recordCategory === "DURATION_PR" ? "lower" : "higher");
  return {
    id: `pr-${stableSerializePerformanceValue({ entryId: normalizedEntry.id, recordCategory, comparisonKey, value: normalizedValue })}`,
    userId: normalizedEntry.userId || null,
    recordCategory,
    domain: normalizedEntry.domain,
    activityCode: normalizedEntry.activityCode,
    activityName: normalizedEntry.activityName,
    comparisonKey,
    sourceEntryId: normalizedEntry.id,
    sourceTestAttemptId: null,
    achievedDate: normalizedEntry.performanceDate,
    rawValue: normalizedValue,
    normalizedValue,
    unit: determineRecordUnit(normalizedEntry, recordCategory),
    previousRecordValue: previousRecord?.normalizedValue || null,
    improvementAbsolute: improvement.absolute,
    improvementPercentage: improvement.percentage,
    evidenceStatus,
    recordStatus,
    calculationEvidence: { comparisonKey, recordCategory, direction: recordCategory === "TIME_PR" || recordCategory === "DURATION_PR" ? "lower" : "higher" },
    createdAt: new Date().toISOString()
  };
}

function determineRecordValue(entry = {}, recordCategory = "LOAD_PR") {
  const normalizedEntry = normalizePerformanceEntry(entry);
  const metrics = normalizedEntry?.metrics || {};
  if (entry?.normalizedValue !== undefined || entry?.normalized_value !== undefined) return Number(entry?.normalizedValue ?? entry?.normalized_value);
  if (entry?.rawValue !== undefined || entry?.raw_value !== undefined) return Number(entry?.rawValue ?? entry?.raw_value);
  if (entry?.value !== undefined) return Number(entry.value);
  if (recordCategory === "LOAD_PR") return Number(metrics.weight);
  if (recordCategory === "REP_PR") return Number(metrics.repetitions);
  if (recordCategory === "VOLUME_PR") return Number(calculateStrengthVolume(normalizedEntry)?.value);
  if (recordCategory === "ESTIMATED_1RM_PR") return Number(estimateOneRepMax(normalizedEntry)?.value);
  if (recordCategory === "VERIFIED_1RM_PR") return Number(metrics.verified_1rm || metrics.verifiedOneRepMax);
  if (recordCategory === "TIME_PR") return Number(metrics.duration_seconds || metrics.duration);
  if (recordCategory === "DISTANCE_PR") return Number(metrics.distance);
  if (recordCategory === "DURATION_PR") return Number(metrics.duration_seconds || metrics.duration);
  if (recordCategory === "TEST_EVENT_PR") return Number(metrics.test_event_value || metrics.overall_score);
  if (recordCategory === "TEST_SCORE_PR") return Number(metrics.overall_score);
  if (recordCategory === "CONDITIONING_PR") return Number(metrics.repetitions || metrics.distance || metrics.calories || metrics.rounds);
  return null;
}

function determineRecordUnit(entry = {}, recordCategory = "LOAD_PR") {
  const normalizedEntry = normalizePerformanceEntry(entry);
  const metrics = normalizedEntry?.metrics || {};
  if (recordCategory === "LOAD_PR" || recordCategory === "VOLUME_PR" || recordCategory === "ESTIMATED_1RM_PR" || recordCategory === "VERIFIED_1RM_PR") return metrics.weight_unit || "lb";
  if (recordCategory === "TIME_PR" || recordCategory === "DURATION_PR") return "seconds";
  if (recordCategory === "DISTANCE_PR") return metrics.distance_unit || "mi";
  if (recordCategory === "TEST_EVENT_PR" || recordCategory === "TEST_SCORE_PR") return "score";
  return "value";
}

function explainPersonalRecordDecision(entry = {}, recordCategory = "LOAD_PR", previousRecord = null, reason = "eligible") {
  return { eligible: Boolean(entry), recordCategory, reason, previousRecordValue: previousRecord?.normalizedValue || null };
}

function evaluatePersonalRecord(entry = {}, existingRecords = []) {
  const normalizedEntry = normalizePerformanceEntry(entry);
  const recordCategory = determineRecordCategory(normalizedEntry);
  if (!recordCategory) return null;
  if (normalizedEntry.evidenceStatus === "INCOMPLETE") return null;
  if (normalizedEntry.domain === "body_metrics") return null;
  const targetComparisonKey = buildPerformanceComparisonKey(normalizedEntry, recordCategory);
  const sameDomainActivityCategoryRecords = (existingRecords || []).map((record) => normalizeComparableRecord(record, recordCategory, targetComparisonKey)).filter((candidate) => {
    if (candidate.recordCategory !== recordCategory) return false;
    if (candidate.domain && normalizedEntry.domain && candidate.domain !== normalizedEntry.domain) return false;
    if (candidate.activityCode && normalizedEntry.activityCode && candidate.activityCode !== normalizedEntry.activityCode) return false;
    return true;
  });
  const comparable = sameDomainActivityCategoryRecords.filter((candidate) => candidate.recordStatus !== "INVALIDATED" && candidate.recordStatus !== "INCOMPLETE" && candidate.comparisonKey === targetComparisonKey);
  const hasSameComparisonKeyRecord = sameDomainActivityCategoryRecords.some((candidate) => candidate.comparisonKey === targetComparisonKey);
  if (!hasSameComparisonKeyRecord && sameDomainActivityCategoryRecords.length > 0) return null;
  const previousRecord = findCurrentPersonalRecord(comparable, recordCategory, targetComparisonKey, normalizedEntry);
  const currentValue = determineRecordValue(normalizedEntry, recordCategory);
  if (!Number.isFinite(Number(currentValue))) return null;
  const direction = recordCategory === "TIME_PR" || recordCategory === "DURATION_PR" ? "lower" : "higher";
  const isBetter = previousRecord ? (direction === "lower" ? currentValue < previousRecord.normalizedValue : currentValue > previousRecord.normalizedValue) : true;
  if (!isBetter) return null;
  return buildPersonalRecordSnapshot(normalizedEntry, recordCategory, previousRecord, existingRecords);
}

function syncFitnessAnalyticState(entry = null, testAttempt = null, bodyWeight = null) {
  ensurePerformanceAnalyticStateLoaded();
  const nextPersonalRecords = [...personalRecords];
  const nextMilestoneAchievements = [...milestoneAchievements];
  const nextAtlasReviews = [...atlasPerformanceReviews];
  let changed = false;
  if (entry) {
    const recordSnapshot = evaluatePersonalRecord(entry, nextPersonalRecords);
    if (recordSnapshot) {
      const existingIndex = nextPersonalRecords.findIndex((item) => item?.sourceEntryId === recordSnapshot.sourceEntryId && item?.recordCategory === recordSnapshot.recordCategory);
      if (existingIndex >= 0) nextPersonalRecords[existingIndex] = recordSnapshot; else nextPersonalRecords.unshift(recordSnapshot);
      changed = true;
    }
    const milestoneSnapshots = evaluateMilestones({ entry, bodyWeight }, nextMilestoneAchievements);
    if (milestoneSnapshots.length) {
      nextMilestoneAchievements.unshift(...milestoneSnapshots);
      changed = true;
    }
  }
  if (testAttempt) {
    const evaluation = evaluateFitnessTestAttempt(testAttempt, nextPersonalRecords);
    if (evaluation.records.length) {
      evaluation.records.forEach((record) => {
        const existingIndex = nextPersonalRecords.findIndex((item) => item?.sourceEntryId === record.sou { protocolCode: normalizedTestAttempt.protocolCode, status: normalizedTestAttempt.status }, evidenceStatus: normalizedTestAttempt.evidenceStatus, createdAt: new Date().toISOString() });
  }
  return achievements;
}

function buildAtlasPerformanceReview(records = [], milestones = [], context = {}) {
  const confirmedRecords = (records || []).filter((record) => record?.recordStatus === "CONFIRMED");
  const estimatedRecords = (records || []).filter((record) => record?.recordStatus === "ESTIMATED");
  const limitedEvidence = Boolean(context.incompleteEvidence || context.entry?.evidenceStatus === "INCOMPLETE" || context.testAttempt?.evidenceStatus === "INCOMPLETE");
  const strongestResult = confirmedRecords[0] || estimatedRecords[0] || null;
  const improvement = strongestResult?.improvementAbsolute ? `${strongestResult.improvementAbsolute.toFixed(1)}` : "â€”";
  return {
    id: `atlas-${stableSerializePerformanceValue({ records: records.length, milestones: milestones.length, context: context.entry?.id || context.testAttempt?.id || "none" })}`,
    status: confirmedRecords.length ? "TEST COMPLETED" : "NO NEW RECORDS",
    newRecords: confirmedRecords.length ? confirmedRecords.map((record) => record.recordCategory).join(", ") : "None",
    milestones: milestones.length ? milestones.map((milestone) => milestone.title).join(" / ") : "None",
    strongestResult: strongestResult ? `${strongestResult.activityName || strongestResult.recordCategory} â€¢ ${strongestResult.normalizedValue}` : "No comparable result",
    improvement,
    limitedEvidence,
    nextBenchmark: confirmedRecords.length ? "Maintain evidentiary quality and repeat the benchmark." : "Complete a verified test or entry to generate a benchmark.",
    commandNote: confirmedRecords.length ? "Confirmed result captured for review." : (estimatedRecords.length ? "Estimated result captured for review." : "No new record was generated."),
    createdAt: new Date().toISOString()
  };
}

function getFitnessTestPersistenceKey(userId = null) {
  return `coach-dominion:fitness-tests:${userId || session?.user?.id || "local"}`;
}

function getPersonalRecordPersistenceKey(userId = null) {
  return `coach-dominion:personal-records:${userId || session?.user?.id || "local"}`;
}

function getMilestonePersistenceKey(userId = null) {
  return `coach-dominion:milestone-achievements:${userId || session?.user?.id || "local"}`;
}

function getAtlasReviewPersistenceKey(userId = null) {
  return `coach-dominion:atlas-reviews:${userId || session?.user?.id || "local"}`;
}

function loadFitnessTestAttemptsFromStorage(userId = null) {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const stored = window.localStorage.getItem(getFitnessTestPersistenceKey(userId));
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map((item) => normalizeFitnessTestAttempt(item)) : [];
  } catch (_) {
    return [];
  }
}

function saveFitnessTestAttemptsToStorage(items = [], userId = null) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    fitnessTestAttempts = Array.isArray(items) ? items.map((item) => normalizeFitnessTestAttempt(item)) : [];
    window.localStorage.setItem(getFitnessTestPersistenceKey(userId), JSON.stringify(fitnessTestAttempts));
  } catch (_) {
    // Ignore local persistence errors.
  }
}

function loadPersonalRecordsFromStorage(userId = null) {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const stored = window.localStorage.getItem(getPersonalRecordPersistenceKey(userId));
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function savePersonalRecordsToStorage(items = [], userId = null) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    personalRecords = Array.isArray(items) ? items : [];ormalTest: testEntries.sort((a, b) => (a.performanceDate > b.performanceDate ? -1 : 1))[0] || null,
    domainsRepresentedThisWeek: Array.from(new Set(currentWeek.map((entry) => entry.domain))).filter(Boolean)
  };
}

function buildCoreWorkspaceModel(entries = [], achievements = [], options = {}) {
  const requestedReferenceDate = options?.referenceDate;
  const referenceDate = parseISODateUTC(requestedReferenceDate) || parseISODateUTC(todayISODate()) || new Date();
  const referenceDateISO = formatISODateUTC(referenceDate);
  const weekStart = new Date(referenceDate);
  weekStart.setUTCDate(referenceDate.getUTCDate() - ((referenceDate.getUTCDay() + 6) % 7));
  const weekStartISO = formatISODateUTC(weekStart);
  const coreEntries = (entries || [])
    .map((entry) => normalizePerformanceEntry(entry))
    .filter((entry) => entry.domain === "core" && entry.performanceDate <= referenceDateISO)
    .sort((left, right) => {
      const dateDelta = parsePerformanceDateTimeToEpoch(right.performanceDate, right.performanceTime) - parsePerformanceDateTimeToEpoch(left.performanceDate, left.performanceTime);
      return dateDelta || String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
    });
  const weeklyEntries = coreEntries.filter((entry) => entry.performanceDate >= weekStartISO);
  const totalRepetitions = weeklyEntries.reduce((total, entry) => total + Math.max(0, Number(entry.metrics?.repetitions) || 0), 0);
  const totalDurationSeconds = weeklyEntries.reduce((total, entry) => total + Math.max(0, Number(entry.metrics?.duration_seconds) || 0), 0);
  const achievedCodes = new Set((achievements || []).map((achievement) => String(achievement?.milestoneCode || achievement?.milestone_code || "")).filter(Boolean));
  const coreMilestones = MILESTONE_CATALOG.filter((milestone) => milestone.active !== false && milestone.domain === "core");
  const milestoneProgress = coreMilestones.map((milestone) => {
    const relevantEntries = coreEntries.filter((entry) => !milestone.requiredActivity || entry.activityCode === milestone.requiredActivity);
    let currentValue = 0;
    if (milestone.evaluationType === "entry") currentValue = relevantEntries.length;
    if (milestone.evaluationType === "duration") currentValue = Math.max(0, ...relevantEntries.map((entry) => Number(entry.metrics?.duration_seconds) || 0));
    if (milestone.evaluationType === "repetitions") currentValue = Math.max(0, ...relevantEntries.map((entry) => Number(entry.metrics?.repetitions) || 0));
    const metByEvidence = milestone.direction === "lower"
      ? currentValue > 0 && currentValue <= milestone.targetValue
      : currentValue >= milestone.targetValue;
    const achieved = achievedCodes.has(milestone.code) || metByEvidence;
    return {
      ...milestone,
      achieved,
      currentValue,
      progressPercent: achieved ? 100 : Math.min(99, Math.max(0, Math.round((currentValue / Math.max(1, Number(milestone.targetValue))) * 100)))
    };
  });
  const nextMilestone = milestoneProgress.find((milestone) => !milestone.achieved) || null;
  return {
    status: weeklyEntries.length ? "ACTIVE THIS WEEK" : coreEntries.length ? "HISTORY READY" : "NO CORE EVIDENCE",
    weekStart: weekStartISO,
    referenceDate: referenceDateISO,
    sessionsThisWeek: weeklyEntries.length,
    totalRepetitions,
    totalDurationSeconds,
    activeDays: new Set(weeklyEntries.map((entry) => entry.performanceDate)).size,
    recentEntries: coreEntries.slice(0, 5),
    completedMilestones: milestoneProgress.filter((milestone) => milestone.achieved).length,
    totalMilestones: milestoneProgress.length,
    nextMilestone
  };
}

function filterPerformanceEntries(entries = [], filters = {}) {
  const normalizedEntries = (entries || []).map((entry) => normalizePerformanceEntry(entry));
  const normalizedFilters = {
    date: String(filters.date || "").trim(),
    domain: normalizePerformanceDomain(filters.domain),
    activity: String(filters.activity || "").trim().toLowerCase(),
    entryType: normalizePerformanceEntryType(filters.entryType)
  };
  return normalizedEntries.filter((entry) => {
    if (normalizedFilters.date && entry.performanceDate !== normalizedFilters.date) return false;
    if (normalizedFilters.domain && entry.domain !== normalizedFilters.domain) return false;
    if (normalizedFilters.activity && !String(entry.activityName || "").toLowerCase().includes(normalizedFilters.activity)) return false;
    if (normalizedFilters.entryType && entry.entryType !== normalizedFilters.entryType) return false;
    return true;
  });
}

function removePerformanceEntry(entries = [], entryId = null) {
  if (entryId === null || entryId === undefined || entryId === "") return Array.isArray(entries) ? entries : [];
  const normalizedId = String(entryId).trim();
  const list = Array.isArray(entries) ? entries : [];
  const matchedIndex = list.findIndex((entry) => String(entry?.id ?? "") === normalizedId);
  if (matchedIndex >= 0) {
    return list.filter((_, index) => index !== matchedIndex);
  }
  return list;
}

function derivePerformanceEmptyState(options = {}) {
  return {
    visible: true,
    message: options.message || "No performance entries yet.",
    storageState: options.storageState || "empty"
  };
}

function normalizeIntelligenceEvidenceStatus(value = "") {
  const normalized = String(value || "").trim().toUpperCase().replaceAll("_", " ");
  if (normalized === "VERIFIED") return "VERIFIED";
  if (normalized === "ESTIMATED") return "ESTIMATED";
  if (normalized === "INCOMPLETE") return "INCOMPLETE";
  if (normalized === "INVALIDATED") return "INVALIDATED";
  return "SELF REPORTED";
}

function metricDirectionForCategory(metricCategory = "") {
  if (metricCategory.includes("time")) return "lower";
  return "higher";
}

function normalizePerformanceViewCode(view = "today_training") {
  const normalized = String(view || "").trim().toLowerCase();
  const aliased = PERFORMANCE_VIEW_ALIASES[normalized] || normalized;
  return PERFORMANCE_VIEW_CODES.includes(aliased) ? aliased : "today_training";
}

function parsePerformanceDateTimeToEpoch(date = "", time = "") {
  const dateText = String(date || "").trim();
  if (!dateText) return Number.POSITIVE_INFINITY;
  const iso = time ? `${dateText}T${time}` : `${dateText}T00:00:00`;
  const value = Date.parse(iso);
  if (Number.isFinite(value)) return value;
  const fallback = Date.parse(`${dateText}T00:00:00`);
  return Number.isFinite(fallback) ? fallback : Number.POSITIVE_INFINITY;
}

function compareSeriesPoints(a = {}, b = {}) {
  const aEpoch = parsePerformanceDateries });
    }
    if (Number.isFinite(rounds) && rounds > 0) {
      pushComparablePoint(points, { ...base, metricCategory: `${normalized.domain}_rounds`, comparisonKey: `${normalized.domain}:${base.activityCode}:rounds:${protocolTag}`, direction: "higher", normalizedUnit: "rounds", normalizedValue: rounds });
    }
  }

  return points;
}

function buildComparablePerformanceSeries(entries = []) {
  const flatPoints = [];
  (entries || []).forEach((entry, sourceIndex) => {
    const points = buildComparablePointsFromPerformanceEntry(entry, sourceIndex);
    points.forEach((point) => flatPoints.push(point));
  });

  const grouped = new Map();
  flatPoints.forEach((point) => {
    if (!grouped.has(point.comparisonKey)) grouped.set(point.comparisonKey, []);
    grouped.get(point.comparisonKey).push(point);
  });

  const series = Array.from(grouped.values()).map((items) => {
    const sortedItems = [...items].sort(compareSeriesPoints);
    const validItems = sortedItems.filter((item) => isSeriesPointValid(item));
    const first = sortedItems[0] || {};
    return {
      domain: first.domain || null,
      activityCode: first.activityCode || null,
      activityName: first.activityName || null,
      metricCategory: first.metricCategory || null,
      comparisonKey: first.comparisonKey || null,
      direction: first.direction || metricDirectionForCategory(first.metricCategory || ""),
      normalizedUnit: first.normalizedUnit || "value",
      points: sortedItems,
      validPoints: validItems,
      validCount: validItems.length,
      evidenceStatuses: Array.from(new Set(sortedItems.map((item) => item.evidenceStatus)))
    };
  }).sort((a, b) => String(a.comparisonKey || "").localeCompare(String(b.comparisonKey || "")));

  return {
    series,
    seriesByKey: Object.fromEntries(series.map((item) => [item.comparisonKey, item])),
    pointCount: flatPoints.length,
    validPointCount: flatPoints.filter((item) => isSeriesPointValid(item)).length
  };
}

function average(values = []) {
  const valid = values.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function median(values = []) {
  const valid = values.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)).sort((a, b) => a - b);
  if (!valid.length) return null;
  const midpoint = Math.floor(valid.length / 2);
  if (valid.length % 2) return valid[midpoint];
  return (valid[midpoint - 1] + valid[midpoint]) / 2;
}

function standardDeviation(values = []) {
  const mean = average(values);
  if (!Number.isFinite(mean)) return null;
  const variance = average(values.map((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? (numeric - mean) ** 2 : null;
  }));
  return Number.isFinite(variance) ? Math.sqrt(variance) : null;
}

function calculateDirectionAwareChange(currentValue = null, previousValue = null, direction = "higher") {
  const current = toFiniteNumber(currentValue);
  const previous = toFiniteNumber(previousValue);
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return direction === "lower" ? previous - current : current - previous;
}

function calculateDirectionAwarePercentChange(currentValue = null, previousValue = null, direction = "higher") {
  const current = toFiniteNumber(currentValue);
  const previous = toFiniteNumber(previousValue);
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  const delta = calculateDirectionAwareChange(current, previous, direction);
  if (!Number.isFinite(delta)) return null;
  return (delta / Math.abs(previous)) * 100;
}

function detectPerformanceNoise(points = [], direction = "higher") {
  const validPoints = (points || []).filter((point) => isSeriesPointValid(point));
  if (validPoints.length < 4) return false;
  const deltas = [];
  for (let index = 1; index < validPoints.length; index += 1) {
    const delta = calculateDirectionAwarePercentChange(validPoints[index].normalizedValue, validPoints[index - 1].normalizedValue, direction);
    if (Number.isFinite(delta)) deltas.push(delta);
  }
  if (deltas.length < 3) return false;
  const signFlips = deltas.slice(1).reduce((count, value, index) => {
    const prior = deltas[index];
    if (prior === 0 || value === 0) return count;
    return Math.sign(prior) !== Math.sign(value) ? count + 1 : count;
  }, 0);
  const absoluteDeltas = deltas.map((value) => Math.abs(value));
  const variability = standardDeviation(absoluteDeltas);
  const band = Math.max(...absoluteDeltas) - Math.min(...absoluteDeltas);
  return signFlips >= 2 && Number.isFinite(variability) && variability >= 1 && band >= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.noisyBandPct;
}

function classifyPerformanceTrajectory(trend = {}) {
  if (!trend || trend.validCount < PERFORMANCE_INTELLIGENCE_WINDOW_RULES.minimumTrendSeries) return "INSUFFICIENT DATA";
  if (trend.noisy) return "NOISY";
  const pct = Number(trend.recentNetPercent || 0);
  const absPct = Math.abs(pct);
  if (absPct < PERFORMANCE_INTELLIGENCE_WINDOW_RULES.meaningfulChangePct) return "STABLE";
  if (pct >= 3) return "STRONGLY IMPROVING";
  if (pct >= 1) return "IMPROVING";
  if (pct <= -3) return "STRONGLY DECLINING";
  return "DECLINING";
}

function calculateTrendConfidence(series = {}, trajectory = "INSUFFICIENT DATA") {
  const points = (series.validPoints || []).filter((point) => isSeriesPointValid(point));
  if (points.length < PERFORMANCE_INTELLIGENCE_WINDOW_RULES.minimumTrendSeries) return "INSUFFICIENT";
  const estimatedOnly = points.every((point) => point.evidenceStatus === "ESTIMATED");
  if (estimatedOnly) return "LOW";
  const verifiedCount = points.filter((point) => point.evidenceStatus === "VERIFIED").length;
  const verifiedShare = verifiedCount / points.length;
  const latestEpoch = parsePerformanceDateTimeToEpoch(points[points.length - 1]?.date, points[points.length - 1]?.time);
  const daysOld = Number.isFinite(latestEpoch) ? Math.floor((Date.now() - latestEpoch) / 86400000) : 365;
  let score = 0;
  if (points.length >= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.preferredConfidenceSeries) score += 2;
  else if (points.length >= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.minimumTrendSeries) score += 1;
  if (verifiedShare >= 0.6) score += 1;
  if (daysOld <= 45) score += 1;
  if (trajectory === "IMPROVING" || trajectory === "STRONGLY IMPROVING" || trajectory === "STABLE") score += 1;
  if (score >= 4) return "HIGH";
  if (score >= 3) return "MODERATE";
  return "LOW";
}

function calculateSeriesTrend(series = {}) {
  const validPoints = (series.validPoints || []).filter((point) => isSeriesPointValid(point));
  const direction = series.direction || "higher";
  const validCount = validPoints.length;
  if (validCount < PERFORMANCE_INTELLIGENCE_WINDOW_RULES.minimumTrendSeries) {
    return {
      validCount,
      direction,
      recentNetChange: null,
      recentNetPercent: null,
      priorNetPercent: null,
      consistency: 0,
      noisy: false,
      trajectory: "INSUFFICIENT DATA",
      confidence: "INSUFFICIENT"
    };
  }
  const recentWindow = validPoints.slice(-PERFORMANCE_INTELLIGENCE_WINDOW_RULES.recentWindowSize);
  const priorWindow = validPoints.slice(-(PERFORMANCE_INTELLIGENCE_WINDOW_RULES.recentWindowSize + PERFORMANCE_INTELLIGENCE_WINDOW_RULES.priorWindowSize), -PERFORMANCE_INTELLIGENCE_WINDOW_RULES.recentWindowSize);
  const deltas = [];
  for (let index = 1; index < recentWindow.length; index += 1) {
    const delta = calculateDirectionAwareChange(recentWindow[index].normalizedValue, recentWindow[index - 1].normalizedValue, direction);
    if (Number.isFinite(delta)) deltas.push(delta);
  }
  const positiveMoves = deltas.filter((value) => value > 0).length;
  const consistency = deltas.length ? positiveMoves / deltas.length : 0;
  const recentNetChange = calculateDirectionAwareChange(recentWindow[recentWindow.length - 1].normalizedValue, recentWindow[0].normalizedValue, direction);
  const recentNetPercent = calculateDirectionAwarePercentChange(recentWindow[recentWindow.length - 1].normalizedValue, recentWindow[0].normalizedValue, direction);
  const priorNetPercent = priorWindow.length >= 2
    ? calculateDirectionAwarePercentChange(priorWindow[priorWindow.length - 1].normalizedValue, priorWindow[0].normalizedValue, direction)
    : null;
  const noisy = detectPerformanceNoise(recentWindow, direction) || detectPerformanceNoise(validPoints, direction);
  const trajectory = classifyPerformanceTrajectory({ validCount, noisy, recentNetPercent, consistency });
  const confidence = calculateTrendConfidence(series, trajectory);
  return {
    validCount,
    direction,
    recentNetChange,
    recentNetPercent,
    priorNetPercent,
    consistency,
    noisy,
    trajectory,
    confidence
  };
}

function detectPerformancePlateau(series = {}, trend = null) {
  const validPoints = (series.validPoints || []).filter((point) => isSeriesPointValid(point));
  if (validPoints.length < 4) return { state: "INSUFFICIENT DATA", reason: "Not enough comparable observations." };
  const direction = series.direction || "higher";
  const recent = validPoints.slice(-4).map((point) => Number(point.normalizedValue));
  const recentMin = Math.min(...recent);
  const recentMax = Math.max(...recent);
  const mean = Math.abs(average(recent) || 0);
  const bandPct = mean > 0 ? ((recentMax - recentMin) / mean) * 100 : 0;
  const recentDeltaPct = calculateDirectionAwarePercentChange(recent[recent.length - 1], recent[0], direction) || 0;
  const noMeaningfulImprovement = recentDeltaPct < PERFORMANCE_INTELLIGENCE_WINDOW_RULES.meaningfulChangePct;
  if (trend && trend.trajectory.includes("DECLINING")) return { state: "NO PLATEAU", reason: "Recent movement is declining rather than flat." };
  if (bandPct >= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.noisyBandPct) return { state: "NO PLATEAU", reason: "Variability is too high for a plateau call." };
  if (bandPct <= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.likelyPlateauBandPct && noMeaningfulImprovement && validPoints.length >= 6) {
    return { state: "LIKELY PLATEAU", reason: "Comparable results are clustered with no meaningful improvement." };
  }
  if (bandPct <= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.possiblePlateauBandPct && noMeaningfulImprovement) {
    return { state: "POSSIBLE PLATEAU", reason: "Recent results are tight with limited improvement." };
  }
  return { state: "NO PLATEAU", reason: "Recent movement is still meaningful." };
}

function detectRecentRegression(series = {}, trend = null) {
  const validPoints = (series.validPoints || []).filter((point) => isSeriesPointValid(point));
  if (validPoints.length < 3) return { state: "INSUFFICIENT DATA", reason: "Not enough recent data." };
  const direction = series.direction || "higher";
  const recent = validPoints.slice(-3);
  const deltasPct = [];
  for (let index = 1; index < recent.length; index += 1) {
    const pct = calculateDirectionAwarePercentChange(recent[index].normalizedValue, recent[index - 1].normalizedValue, direction);
    if (Number.isFinite(pct)) deltasPct.push(pct);
  }
  const negative = deltasPct.filter((value) => value < -PERFORMANCE_INTELLIGENCE_WINDOW_RULES.meaningfulChangePct).length;
  const extremeNegative = deltasPct.some((value) => value <= -PERFORMANCE_INTELLIGENCE_WINDOW_RULES.likelyRegressionPct);
  if (negative >= 2) return { state: "LIKELY REGRESSION", reason: "Multiple recent comparable declines are present." };
  if (negative === 1 && (extremeNegative || trend?.trajectory === "DECLINING" || trend?.trajectory === "STRONGLY DECLINING")) return { state: "POSSIBLE REGRESSION", reason: "A recent decline needs confirmation." };
  return { state: "NO REGRESSION", reason: "No sustained recent decline was detected." };
}

function formatIntelligenceDelta(value = null, unit = "", direction = "higher") {
  if (!Number.isFinite(Number(value))) return "No meaningful change";
  const numeric = Number(value);
  const sign = numeric > 0 ? "+" : "";
  if (direction === "lower") {
    return `${sign}${numeric.toFixed(2)} ${unit}`.trim();
  }
  return `${sign}${numeric.toFixed(2)} ${unit}`.trim();
}

function resolveRunningMilestoneDistanceKey(milestone = {}) {
  const code = String(milestone.code || "").toUpperCase();
  if (code.includes("5K")) return "5k";
  if (code.includes("HALF")) return "half_marathon";
  if (code.includes("MILE")) return "1mi";
  return null;
}

function collectRecentBodyweightEvidence(entries = []) {
  const candidates = (entries || []).map((entry, index) => ({ entry: normalizePerformanceEntry(entry), index })).filter(({ entry }) => entry.domain === "body_metrics" && entry.activityCode === "bodyweight" && Number.isFinite(toFiniteNumber(entry.metrics?.measurement_value)) && normalizeIntelligenceEvidenceStatus(entry.evidenceStatus) !== "INCOMPLETE");
  if (!candidates.length) return null;
  candidates.sort((a, b) => compareSeriesPoints({ date: a.entry.performanceDate, time: a.entry.performanceTime, sourceIndex: a.index }, { date: b.entry.performanceDate, time: b.entry.performanceTime, sourceIndex: b.index }));
  const latest = candidates[candidates.length - 1]?.entry;
  return latest ? { value: Number(latest.metrics.measurement_value), unit: latest.metrics.measurement_unit || "kg", date: latest.performanceDate, evidenceStatus: latest.evidenceStatus } : null;
}

function calculateBenchmarkProximity(milestone = {}, entries = []) {
  if (!milestone || !milestone.active) return { eligible: false, reason: "inactive milestone" };
  if (milestone.domain === "body_metrics") return { eligible: false, reason: "body metrics are not benchmark trophies" };
  if (milestone.evaluationType === "entry" || milestone.evaluationType === "test") return { eligible: false, reason: "count-based milestones are excluded from proximity ranking" };
  const normalizedEntries = (entries || []).map((entry) => normalizePerformanceEntry(entry));
  const filtered = normalizedEntries.filter((entry) => entry.domain === milestone.domain && normalizeIntelligenceEvidenceStatus(entry.evidenceStatus) !== "INCOMPLETE");
  if (!filtered.length) return { eligible: false, reason: "no comparable entries" };

  if (milestone.evaluationType === "ratio") {
    const bodyweight = collectRecentBodyweightEvidence(normalizedEntries);
    if (!bodyweight || !Number.isFinite(bodyweight.value) || bodyweight.value <= 0) return { eligible: false, reason: "missing bodyweight evidence" };
    const matching = filtered.filter((entry) => (!milestone.requiredActivity || entry.activityCode === milestone.requiredActivity) && Number.isFinite(toFiniteNumber(entry.metrics?.weight)));
    if (!matching.length) return { eligible: false, reason: "missing comparable load evidence" };
    const bestLoad = Math.max(...matching.map((entry) => Number(entry.metrics.weight)));
    const ratio = bestLoad / bodyweight.value;
    const target = Number(milestone.targetValue);
    return {
      eligible: true,
      milestoneCode: milestone.code,
      title: milestone.title,
      domain: milestone.domain,
      direction: "higher",
      target,
      current: ratio,
      gapAbsolute: target - ratio,
      progressPct: target > 0 ? Math.min((ratio / target) * 100, 100) : null,
      comparisonNote: `${bestLoad.toFixed(2)} / ${bodyweight.value.toFixed(2)} bodyweight`
    };
  }

  let comparable = filtered;
  if (milestone.requiredActivity) comparable = comparable.filter((entry) => entry.activityCode === milestone.requiredActivity);
  if (milestone.domain === "running" && milestone.evaluationType === "time") {
    const requiredDistance = resolveRunningMilestoneDistanceKey(milestone);
    comparable = comparable.filter((entry) => normalizeRunningDistanceCategory(entry.metrics?.distance, entry.metrics?.distance_unit || "mi") === requiredDistance);
  }
  if (!comparable.length) return { eligible: false, reason: "no distance or protocol-compatible evidence" };

  const values = comparable.map((entry) => {
    if (milestone.evaluationType === "time") return toFiniteNumber(entry.metrics?.duration_seconds);
    if (milestone.evaluationType === "duration") return toFiniteNumber(entry.metrics?.duration_seconds);
    if (milestone.evaluationType === "repetitions") return toFiniteNumber(entry.metrics?.repetitions);
    return null;
  }).filter((value) => Number.isFinite(value));
  if (!values.length) return { eligible: false, reason: "no numeric comparable metric" };
  const direction = milestone.direction === "lower" ? "lower" : "higher";
  const current = direction === "lower" ? Math.min(...values) : Math.max(...values);
  const target = Number(milestone.targetValue);
  const gapAbsolute = direction === "lower" ? current - target : target - current;
  return {
    eligible: true,
    milestoneCode: milestone.code,
    title: milestone.title,
    domain: milestone.domain,
    direction,
    target,
    current,
    gapAbsolute,
    progressPct: direction === "higher" && target > 0 ? Math.min((current / target) * 100, 100) : null,
    comparisonNote: milestone.commandNote
  };
}

function rankEligibleBenchmarks(entries = []) {
  return getMilestoneCatalog()
    .map((milestone) => calculateBenchmarkProximity(milestone, entries))
    .filter((item) => item.eligible)
    .sort((a, b) => {
      const aGap = Math.abs(Number(a.gapAbsolute));
      const bGap = Math.abs(Number(b.gapAbsolute));
      if (aGap !== bGap) return aGap - bGap;
      return String(a.milestoneCode || "").localeCompare(String(b.milestoneCode || ""));
    });
}

function buildNextBenchmarkRecommendation(entries = []) {
  const ranked = rankEligibleBenchmarks(entries);
  if (!ranked.length) {
    return { status: "NO ELIGIBLE BENCHMARK", benchmark: null, rationale: "No benchmark has sufficient comparable evidence yet." };
  }
  return { status: "BENCHMARK AVAILABLE", benchmark: ranked[0], rationale: "Closest benchmark selected from eligible evidence." };
}

function mapMetricCategoryToRecordCategory(metricCategory = "") {
  if (metricCategory === "strength_load") return "LOAD_PR";
  if (metricCategory === "strength_repetitions_at_load") return "REP_PR";
  if (metricCategory === "strength_volume") return "VOLUME_PR";
  if (metricCategory === "strength_estimated_1rm") return "ESTIMATED_1RM_PR";
  if (metricCategory === "strength_verified_1rm") return "VERIFIED_1RM_PR";
  if (metricCategory === "running_time") return "TIME_PR";
  return "CONDITIONING_PR";
}

function evaluatePrAttemptReadiness(series = {}, personalRecord = null) {
  const trend = calculateSeriesTrend(series);
  const regression = detectRecentRegression(series, trend);
  const validPoints = (series.validPoints || []).filter((point) => isSeriesPointValid(point));
  if (validPoints.length < PERFORMANCE_INTELLIGENCE_WINDOW_RULES.minimumTrendSeries) {
    return { status: "INSUFFICIENT EVIDENCE", reason: "At least three comparable results are required.", gapPct: null, trend, regression };
  }
  const estimatedOnly = validPoints.every((point) => point.evidenceStatus === "ESTIMATED");
  if (estimatedOnly || series.metricCategory === "strength_estimated_1rm") {
    return { status: "ESTIMATED ONLY", reason: "Evidence is estimated and cannot confirm a verified PR attempt.", gapPct: null, trend, regression };
  }
  if (regression.state === "LIKELY REGRESSION") {
    return { status: "RECENT REGRESSION", reason: regression.reason, gapPct: null, trend, regression };
  }
  const direction = series.direction || "higher";
  const currentBest = direction === "lower"
    ? Math.min(...validPoints.map((point) => Number(point.normalizedValue)))
    : Math.max(...validPoints.map((point) => Number(point.normalizedValue)));
  const referencePr = personalRecord && Number.isFinite(toFiniteNumber(personalRecord.normalizedValue))
    ? Number(personalRecord.normalizedValue)
    : currentBest;
  const gapPct = referencePr !== 0
    ? (direction === "lower" ? ((currentBest - referencePr) / Math.abs(referencePr)) * 100 : ((referencePr - currentBest) / Math.abs(referencePr)) * 100)
    : null;
  const trendAcceptable = trend.trajectory === "IMPROVING" || trend.trajectory === "STRONGLY IMPROVING" || trend.trajectory === "STABLE";
  if (trendAcceptable && Number.isFinite(gapPct) && gapPct <= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.readyPrGapPct) {
    return { status: "READY", reason: "Recent best is close to current PR with acceptable trend evidence.", gapPct, trend, regression };
  }
  if (trendAcceptable && Number.isFinite(gapPct) && gapPct <= PERFORMANCE_INTELLIGENCE_WINDOW_RULES.approachingPrGapPct) {
    return { status: "APPROACHING", reason: "Performance is close but not yet at ready threshold.", gapPct, trend, regression };
  }
  return { status: "NOT READY", reason: "Comparable evidence does not currently support a PR attempt.", gapPct, trend, regression };
}

function buildFitnessTestIntelligence(attempts = []) {
  const normalizedAttempts = (attempts || []).map((attempt, sourceIndex) => ({ attempt: normalizeFitnessTestAttempt(attempt), sourceIndex }));
  const completeAttempts = normalizedAttempts.filter(({ attempt }) => attempt.status === "COMPLETE" && normalizeIntelligenceEvidenceStatus(attempt.evidenceStatus) !== "INVALIDATED");
  if (!completeAttempts.length) {
    return {
      status: "INSUFFICIENT DATA",
      improvedEventCount: 0,
      unchangedEventCount: 0,
      declinedEventCount: 0,
      missingEventCount: 0,
      eventIntelligence: [],
      consecutiveCompletedAttempts: 0,
      evidenceLimitations: ["No completed compatible fitness-test attempts are available."]
    };
  }
  const protocolCatalog = getFitnessTestProtocolCatalog();
  const eventSeries = new Map();
  completeAttempts.sort((a, b) => compareSeriesPoints({ date: a.attempt.testDate, sourceIndex: a.sourceIndex }, { date: b.attempt.testDate, sourceIndex: b.sourceIndex }));
  completeAttempts.forEach(({ attempt, sourceIndex }) => {
    const protocol = protocolCatalog.find((item) => item.code === attempt.protocolCode) || protocolCatalog[0];
    const protocolKey = `${attempt.protocolCode}:${attempt.protocolVersion || protocol.version || "1.0"}`;
    (protocol.orderedEvents || []).forEach((eventDef) => {
      const eventResult = (attempt.eventResults || []).find((item) => item.eventCode === eventDef.code);
      const key = `${protocolKey}:${eventDef.code}`;
      if (!eventSeries.has(key)) {
        eventSeries.set(key, {
          key,
          protocolCode: attempt.protocolCode,
          protocolVersion: attempt.protocolVersion || protocol.version || "1.0",
          eventCode: eventDef.code,
          eventName: eventDef.name,
          direction: eventDef.direction || "higher",
          required: Boolean(eventDef.required),
          unit: eventDef.unit || "value",
          points: []
        });
      }
      const target = eventSeries.get(key);
      target.points.push({
        date: attempt.testDate,
        time: null,
        sourceIndex,
        normalizedValue: Number.isFinite(toFiniteNumber(eventResult?.rawValue)) ? Number(eventResult.rawValue) : null,
        evidenceStatus: normalizeIntelligenceEvidenceStatus(eventResult?.evidenceStatus || attempt.evidenceStatus),
        validity: Number.isFinite(toFiniteNumber(eventResult?.rawValue)),
        sourceStatusIndicator: normalizeIntelligenceEvidenceStatus(attempt.evidenceStatus) === "INCOMPLETE" ? "INCOMPLETE" : "VALID"
      });
    });
  });
  const eventIntelligence = Array.from(eventSeries.values()).map((item) => {
    const series = {
      domain: "fitness_test",
      activityCode: item.eventCode,
      activityName: item.eventName,
      metricCategory: "fitness_test_event",
      comparisonKey: item.key,
      direction: item.direction,
      normalizedUnit: item.unit,
      points: [...item.points].sort(compareSeriesPoints),
      validPoints: item.points.filter((point) => point.validity && Number.isFinite(toFiniteNumber(point.normalizedValue))),
      validCount: item.points.filter((point) => point.validity && Number.isFinite(toFiniteNumber(point.normalizedValue))).length
    };
    const trend = calculateSeriesTrend(series);
    return {
      ...item,
      series,
      trajectory: trend.trajectory,
      confidence: trend.confidence,
      supportingResultCount: series.validCount
    };
  });
  const improvedEventCount = eventIntelligence.filter((event) => event.trajectory === "IMPROVING" || event.trajectory === "STRONGLY IMPROVING").length;
  const unchangedEventCount = eventIntelligence.filter((event) => event.trajectory === "STABLE").length;
  const declinedEventCount = eventIntelligence.filter((event) => event.trajectory === "DECLINING" || event.trajectory === "STRONGLY DECLINING").length;
  const missingEventCount = eventIntelligence.filter((event) => event.series.validCount === 0 && event.required).length;
  return {
    status: completeAttempts.length >= 2 ? "READY" : "INSUFFICIENT DATA",
    improvedEventCount,
    unchangedEventCount,
    declinedEventCount,
    missingEventCount,
    eventIntelligence,
    consecutiveCompletedAttempts: completeAttempts.length,
    evidenceLimitations: completeAttempts.length >= 2 ? [] : ["At least two complete attempts are needed for event progression."]
  };
}

function trajectoryScore(state = "INSUFFICIENT DATA") {
  if (state === "STRONGLY IMPROVING") return 3;
  if (state === "IMPROVING") return 2;
  if (state === "STABLE") return 1;
  if (state === "NOISY") return 0;
  if (state === "DECLINING") return -2;
  if (state === "STRONGLY DECLINING") return -3;
  return -1;
}

function buildDomainPerformanceIntelligence(domain = "strength", metricIntelligence = [], benchmarkRecommendation = null, prCandidates = []) {
  const rows = (metricIntelligence || []).filter((item) => item.series?.domain === domain);
  const trajectoryCounts = {
    improving: rows.filter((row) => row.trajectory === "IMPROVING" || row.trajectory === "STRONGLY IMPROVING").length,
    stable: rows.filter((row) => row.trajectory === "STABLE").length,
    noisy: rows.filter((row) => row.trajectory === "NOISY").length,
    declining: rows.filter((row) => row.trajectory === "DECLINING" || row.trajectory === "STRONGLY DECLINING").length,
    insufficient: rows.filter((row) => row.trajectory === "INSUFFICIENT DATA").length
  };
  const ranked = [...rows].sort((a, b) => {
    const scoreDiff = trajectoryScore(b.trajectory) - trajectoryScore(a.trajectory);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a.series?.comparisonKey || "").localeCompare(String(b.series?.comparisonKey || ""));
  });
  const strongest = ranked[0] || null;
  const weakest = ranked[ranked.length - 1] || null;
  const plateaus = rows.filter((row) => row.plateau.state === "POSSIBLE PLATEAU" || row.plateau.state === "LIKELY PLATEAU").length;
  const regressions = rows.filter((row) => row.regression.state === "LIKELY REGRESSION").length;
  let trajectory = "INSUFFICIENT DATA";
  if (rows.length) {
    const weighted = average(rows.map((row) => trajectoryScore(row.trajectory))) || 0;
    trajectory = weighted >= 2 ? "STRONGLY IMPROVING" : weighted >= 1 ? "IMPROVING" : weighted <= -2 ? "STRONGLY DECLINING" : weighted <= -1 ? "DECLINING" : trajectoryCounts.noisy > trajectoryCounts.stable ? "NOISY" : "STABLE";
  }
  let recommendedFocusCode = "ADD_COMPARABLE_EVIDENCE";
  let recommendedFocusText = "Add comparable evidence";
  if (!rows.length || trajectoryCounts.insufficient === rows.length) {
    recommendedFocusCode = "ADD_COMPARABLE_EVIDENCE";
    recommendedFocusText = "No action until more data exists";
  } else if (regressions > 0 || trajectory.includes("DECLINING")) {
    recommendedFocusCode = "REVIEW_RECENT_DECLINE";
    recommendedFocusText = "Review recent decline";
  } else if (plateaus > 0) {
    recommendedFocusCode = "RETEST_BENCHMARK";
    recommendedFocusText = "Retest benchmark";
  } else if (trajectory === "IMPROVING" || trajectory === "STRONGLY IMPROVING") {
    recommendedFocusCode = "CONTINUE_PROGRESSION";
    recommendedFocusText = "Continue progression";
  } else if (trajectory === "STABLE") {
    recommendedFocusCode = "MAINTAIN_CURRENT_LEVEL";
    recommendedFocusText = "Maintain current level";
  } else {
    recommendedFocusCode = "REESTABLISH_CONSISTENCY";
    recommendedFocusText = "Re-establish consistency";
  }
  const confidence = rows.length ? (rows.some((row) => row.confidence === "HIGH") ? "HIGH" : rows.some((row) => row.confidence === "MODERATE") ? "MODERATE" : rows.some((row) => row.confidence === "LOW") ? "LOW" : "INSUFFICIENT") : "INSUFFICIENT";
  return {
    domain,
    trajectory,
    confidence,
    strongestSeries: strongest,
    weakestSeries: weakest,
    improvingCount: trajectoryCounts.improving,
    stableCount: trajectoryCounts.stable,
    noisyCount: trajectoryCounts.noisy,
    decliningCount: trajectoryCounts.declining,
    insufficientCount: trajectoryCounts.insufficient,
    plateauCount: plateaus,
    likelyRegressionCount: regressions,
    closestBenchmark: benchmarkRecommendation?.benchmark?.domain === domain ? benchmarkRecommendation.benchmark : null,
    prReadinessCandidate: (prCandidates || []).find((item) => item.series?.domain === domain) || null,
    evidenceLimitations: rows.filter((row) => row.trajectory === "INSUFFICIENT DATA").map((row) => `${row.series.activityName} lacks sufficient comparable evidence.`),
    recommendedFocusCode,
    recommendedFocusText
  };
}

function buildAtlasPerformanceIntelligence(input = {}) {
  const overall = input.overall || {};
  const strongestDomain = input.strongestDomain || "None";
  const weakestDomain = input.weakestDomain || "None";
  const plateaus = Number(input.plateaus || 0);
  const regressions = Number(input.regressions || 0);
  const nextBenchmark = input.nextBenchmark?.benchmark ? input.nextBenchmark.benchmark.title : "No eligible benchmark";
  const readiness = input.prReadiness?.length ? input.prReadiness[0].status : "INSUFFICIENT EVIDENCE";
  const limitations = (input.evidenceLimitations || []).length ? input.evidenceLimitations.join("; ") : "None";
  const recommendedFocus = input.recommendedFocus || "No action until more data exists";
  const commandNote = regressions > 0
    ? "Recent regression signals are present. Re-establish consistency before escalating targets."
    : plateaus > 0
      ? "Progress has narrowed into a plateau band. A formal retest is appropriate."
      : overall.trajectory === "INSUFFICIENT DATA"
        ? "Evidence is insufficient for a confirmed readiness call."
        : "Performance progression is intact. Preserve current execution quality.";
  const lines = [
    "ATLAS // PERFORMANCE INTELLIGENCE",
    "",
    `STATUS: ${overall.status || "ANALYSIS READY"}`,
    `OVERALL TRAJECTORY: ${overall.trajectory || "INSUFFICIENT DATA"}`,
    `STRONGEST DOMAIN: ${strongestDomain}`,
    `WEAKEST DOMAIN: ${weakestDomain}`,
    `PLATEAUS: ${plateaus}`,
    `REGRESSIONS: ${regressions}`,
    `NEXT BENCHMARK: ${nextBenchmark}`,
    `PR READINESS: ${readiness}`,
    `EVIDENCE LIMITATIONS: ${limitations}`,
    `RECOMMENDED FOCUS: ${recommendedFocus}`,
    `COMMAND NOTE: ${commandNote}`
  ];
  return {
    status: overall.status || "ANALYSIS READY",
    commandNote,
    text: lines.join("\n")
  };
}

function derivePerformanceIntelligenceViewState(input = {}) {
  if (input.authRequired) return { state: "authentication_required", label: "AUTHENTICATION REQUIRED", tone: "red" };
  if (input.remoteLoadFailed && !input.hasHistory) return { state: "remote_load_failed", label: "REMOTE LOAD FAILED", tone: "red" };
  if (input.localFallbackActive) return { state: "local_fallback_active", label: "LOCAL FALLBACK ACTIVE", tone: "yellow" };
  if (!input.hasHistory) return { state: "no_history", label: "NO PERFORMANCE HISTORY", tone: "neutral" };
  if (input.hasHistory && !input.hasComparableHistory) return { state: "insufficient_comparable_history", label: "INSUFFICIENT COMPARABLE HISTORY", tone: "yellow" };
  if (input.calculationUnavailable) return { state: "calculation_unavailable", label: "CALCULATION UNAVAILABLE", tone: "red" };
  return { state: "ready", label: "INTELLIGENCE READY", tone: "green" };
}

function buildPerformanceIntelligenceOverview(entries = [], attempts = [], records = [], milestones = [], options = {}) {
  const comparable = buildComparablePerformanceSeries(entries);
  const metricIntelligence = comparable.series.map((series) => {
    const trend = calculateSeriesTrend(series);
    const plateau = detectPerformancePlateau(series, trend);
    const regression = detectRecentRegression(series, trend);
    const recordCategory = mapMetricCategoryToRecordCategory(series.metricCategory);
    const personalRecord = findCurrentPersonalRecord(records, recordCategory, series.comparisonKey, {
      domain: series.domain,
      activityCode: series.activityCode,
      activityName: series.activityName,
      metrics: {}
    });
    const prReadiness = evaluatePrAttemptReadiness(series, personalRecord);
    return {
      series,
      trend,
      trajectory: trend.trajectory,
      confidence: trend.confidence,
      plateau,
      regression,
      personalRecord,
      prReadiness,
      latestMeaningfulChange: formatIntelligenceDelta(trend.recentNetChange, series.normalizedUnit, series.direction)
    };
  });
  const trajectoryCounts = {
    improving: metricIntelligence.filter((item) => item.trajectory === "IMPROVING" || item.trajectory === "STRONGLY IMPROVING").length,
    stable: metricIntelligence.filter((item) => item.trajectory === "STABLE").length,
    noisy: metricIntelligence.filter((item) => item.trajectory === "NOISY").length,
    declining: metricIntelligence.filter((item) => item.trajectory === "DECLINING" || item.trajectory === "STRONGLY DECLINING").length,
    insufficient: metricIntelligence.filter((item) => item.trajectory === "INSUFFICIENT DATA").length
  };
  const totalComparableMetrics = metricIntelligence.length;
  const overallTrajectory = totalComparableMetrics === 0
    ? "INSUFFICIENT DATA"
    : trajectoryCounts.declining > trajectoryCounts.improving && trajectoryCounts.declining >= 2
      ? trajectoryCounts.declining >= trajectoryCounts.improving + 2 ? "STRONGLY DECLINING" : "DECLINING"
      : trajectoryCounts.improving > trajectoryCounts.declining && trajectoryCounts.improving >= 2
        ? trajectoryCounts.improving >= trajectoryCounts.declining + 2 ? "STRONGLY IMPROVING" : "IMPROVING"
        : trajectoryCounts.noisy > trajectoryCounts.stable
          ? "NOISY"
          : "STABLE";
  const nextBenchmark = buildNextBenchmarkRecommendation(entries);
  const prCandidates = metricIntelligence.map((item) => ({ ...item.prReadiness, series: item.series, trajectory: item.trajectory, confidence: item.confidence })).sort((a, b) => {
    const order = PERFORMANCE_PR_READINESS_STATES;
    const scoreDiff = order.indexOf(a.status) - order.indexOf(b.status);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a.series?.comparisonKey || "").localeCompare(String(b.series?.comparisonKey || ""));
  });
  const domains = ["strength", "running", "core", "conditioning"].map((domain) => buildDomainPerformanceIntelligence(domain, metricIntelligence, nextBenchmark, prCandidates));
  const fitnessTestIntelligence = buildFitnessTestIntelligence(attempts);
  const fitnessDomain = buildDomainPerformanceIntelligence("fitness_test", metricIntelligence, nextBenchmark, prCandidates);
  fitnessDomain.trajectory = fitnessTestIntelligence.status === "READY"
    ? (fitnessTestIntelligence.declinedEventCount > fitnessTestIntelligence.improvedEventCount ? "DECLINING" : fitnessTestIntelligence.improvedEventCount > 0 ? "IMPROVING" : "STABLE")
    : "INSUFFICIENT DATA";
  fitnessDomain.confidence = fitnessTestIntelligence.status === "READY" ? "MODERATE" : "INSUFFICIENT";
  fitnessDomain.plateauCount = 0;
  fitnessDomain.likelyRegressionCount = fitnessTestIntelligence.declinedEventCount > 0 ? 1 : 0;
  const allDomains = [...domains, fitnessDomain];
  const sortedDomains = [...allDomains].sort((a, b) => {
    const scoreDiff = trajectoryScore(b.trajectory) - trajectoryScore(a.trajectory);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a.domain).localeCompare(String(b.domain));
  });
  const strongestDomain = sortedDomains[0]?.domain || "none";
  const weakestDomain = sortedDomains[sortedDomains.length - 1]?.domain || "none";
  const totalPlateaus = metricIntelligence.filter((item) => item.plateau.state === "POSSIBLE PLATEAU" || item.plateau.state === "LIKELY PLATEAU").length;
  const totalRegressions = metricIntelligence.filter((item) => item.regression.state === "LIKELY REGRESSION").length;
  const evidenceLimitations = [];
  if (!comparable.pointCount) evidenceLimitations.push("No performance entries are available.");
  if (comparable.pointCount > 0 && comparable.validPointCount === 0) evidenceLimitations.push("All current evidence is invalidated or incomplete for trend analysis.");
  if (metricIntelligence.some((item) => item.confidence === "INSUFFICIENT")) evidenceLimitations.push("Several metrics do not meet the minimum comparable window for confident trend calls.");
  if (metricIntelligence.some((item) => item.series.evidenceStatuses.every((status) => status === "ESTIMATED"))) evidenceLimitations.push("Estimated-only evidence limits confidence for selected metrics.");
  if (options.remoteLoadFailed) evidenceLimitations.push("Remote performance load failed; shown intelligence may reflect local-only history.");
  const recommendedFocus = sortedDomains[0]?.recommendedFocusText || "No action until more data exists";
  const atlas = buildAtlasPerformanceIntelligence({
    overall: { status: "ANALYSIS READY", trajectory: overallTrajectory },
    strongestDomain: PERFORMANCE_DOMAIN_LABELS[strongestDomain] || strongestDomain,
    weakestDomain: PERFORMANCE_DOMAIN_LABELS[weakestDomain] || weakestDomain,
    plateaus: totalPlateaus,
    regressions: totalRegressions,
    nextBenchmark,
    prReadiness: prCandidates,
    evidenceLimitations,
    recommendedFocus
  });
  const viewState = derivePerformanceIntelligenceViewState({
    authRequired: Boolean(options.authRequired),
    remoteLoadFailed: Boolean(options.remoteLoadFailed),
    localFallbackActive: Boolean(options.localFallbackActive),
    calculationUnavailable: Boolean(options.calculationUnavailable),
    hasHistory: (entries || []).length > 0,
    hasComparableHistory: comparable.validPointCount > 0
  });
  return {
    rules: { ...PERFORMANCE_INTELLIGENCE_WINDOW_RULES },
    comparable,
    metricIntelligence,
    trajectoryCounts,
    overallTrajectory,
    strongestDomain,
    weakestDomain,
    totalPlateaus,
    totalRegressions,
    nextBenchmark,
    prCandidates,
    domainSummaries: allDomains,
    fitnessTestIntelligence,
    evidenceLimitations,
    recommendedFocus,
    atlas,
    viewState
  };
}

function performanceStorageKey() {
  return `coach-dominion:performance-entries:${session?.user?.id || "local"}`;
}

function loadLocalPerformanceEntries() {
  try {
    const stored = window.localStorage.getItem(performanceStorageKey());
    return stored ? JSON.parse(stored) : [];
  } catch (_) {
    return [];
  }
}

function saveLocalPerformanceEntries(entries = []) {
  try {
    window.localStorage.setItem(performanceStorageKey(), JSON.stringify(entries));
    scheduleAccountTruthSync();
    return true;
  } catch (_) {
    return false;
  }
}

function resetPerformanceForm() {
  performanceEditId = null;
  const form = document.getElementById("performance-form");
  if (!form) return;
  form.reset();
  document.getElementById("performance-date").value = todayISODate();
  document.getElementById("performance-domain").value = "strength";
  document.getElementById("performance-entry-type").value = "TRAINING_SET";
  document.getElementById("performance-source").value = "MANUAL";
  document.getElementById("performance-evidence-status").value = "SELF REPORTED";
  document.getElementById("performance-activity-code").value = "bench_press";
  document.getElementById("performance-activity-name").value = "Bench Press";
  refreshPerformanceFieldVisibility();
  setText("performance-save-state", "READY");
  setText("performance-save-hint", "Create a fresh entry.");
}

function refreshPerformanceFieldVisibility() {
  const form = document.getElementById("performance-form");
  if (!form) return;
  const domain = document.getElementById("performance-domain").value;
  const entryType = document.getElementById("performance-entry-type").value;
  const strengthGroup = document.getElementById("performance-strength-fields");
  const runningGroup = document.getElementById("performance-running-fields");
  const coreGroup = document.getElementById("performance-core-fields");
  const fitnessGroup = document.getElementById("performance-fitness-fields");
  const bodyMetricsGroup = document.getElementById("performance-body-metrics-fields");
  const showStrength = domain === "strength";
  const showRunning = domain === "running";
  const showCore = domain === "core" || domain === "conditioning";
  const showFitness = domain === "fitness_test" || entryType === "FORMAL_TEST";
  const showBodyMetrics = domain === "body_metrics";
  if (strengthGroup) strengthGroup.hidden = !showStrength;
  if (runningGroup) runningGroup.hidden = !showRunning;
  if (coreGroup) coreGroup.hidden = !showCore;
  if (fitnessGroup) fitnessGroup.hidden = !showFitness;
  if (bodyMetricsGroup) bodyMetricsGroup.hidden = !showBodyMetrics;
}

function populatePerformanceActivityOptions(domain = "strength") {
  const activityCode = document.getElementById("performance-activity-code");
  const activityName = document.getElementById("performance-activity-name");
  if (!activityCode) return;
  const activities = getPerformanceActivityCatalog(domain);
  const currentValue = activityCode.value || activities[0]?.code || "custom";
  activityCode.innerHTML = activities.map((activity) => `<option value="${activity.code}">${activity.label}</option>`).join("");
  activityCode.insertAdjacentHTML("beforeend", '<option value="custom">Custom</option>');
  activityCode.value = currentValue;
  if (activityName && !activityName.value) activityName.value = activities.find((activity) => activity.code === currentValue)?.label || "";
}

function readPerformanceFormValues() {
  const form = document.getElementById("performance-form");
  if (!form) return null;
  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());
  const visibleMetricValues = {};
  const domain = values.domain || "strength";
  const entryType = values.entry_type || "TRAINING_SET";
  const activeGroups = [];
  if (domain === "strength") activeGroups.push(document.getElementById("performance-strength-fields"));
  if (domain === "running") activeGroups.push(document.getElementById("performance-running-fields"));
  if (domain === "core" || domain === "conditioning") activeGroups.push(document.getElementById("performance-core-fields"));
  if (domain === "fitness_test" || entryType === "FORMAL_TEST") activeGroups.push(document.getElementById("performance-fitness-fields"));
  if (domain === "body_metrics") activeGroups.push(document.getElementById("performance-body-metrics-fields"));
  activeGroups.filter(Boolean).forEach((group) => {
    group.querySelectorAll("[name]").forEach((field) => {
      if (!field.name) return;
      visibleMetricValues[field.name] = field.value;
    });
  });
  const resolvedValues = { ...values, ...visibleMetricValues };
  const metrics = {};
  if (domain === "strength") {
    metrics.sets = resolvedValues.sets ? Number(resolvedValues.sets) : null;
    metrics.repetitions = resolvedValues.repetitions ? Number(resolvedValues.repetitions) : null;
    metrics.weight = resolvedValues.weight ? Number(resolvedValues.weight) : null;
    metrics.weight_unit = resolvedValues.weight_unit || "lb";
    metrics.duration_seconds = resolvedValues.duration_seconds ? Number(resolvedValues.duration_seconds) : null;
    metrics.assistance = resolvedValues.assistance || null;
    metrics.bodyweight_added = resolvedValues.bodyweight_added ? Number(resolvedValues.bodyweight_added) : null;
  }
  if (domain === "running") {
    metrics.distance = resolvedValues.distance ? Number(resolvedValues.distance) : null;
    metrics.distance_unit = resolvedValues.distance_unit || "mi";
    metrics.duration_seconds = resolvedValues.duration_seconds ? Number(resolvedValues.duration_seconds) : null;
    metrics.pace_seconds_per_unit = resolvedValues.pace_seconds_per_unit ? Number(resolvedValues.pace_seconds_per_unit) : null;
    metrics.elevation_gain = resolvedValues.elevation_gain ? Number(resolvedValues.elevation_gain) : null;
    metrics.route_type = resolvedValues.route_type || null;
    metrics.run_type = resolvedValues.run_type || null;
    metrics.race_name = resolvedValues.race_name || null;
  }
  if (domain === "core" || domain === "conditioning") {
    metrics.repetitions = resolvedValues.repetitions ? Number(resolvedValues.repetitions) : null;
    metrics.duration_seconds = resolvedValues.duration_seconds ? Number(resolvedValues.duration_seconds) : null;
    metrics.distance = resolvedValues.distance ? Number(resolvedValues.distance) : null;
    metrics.calories = resolvedValues.calories ? Number(resolvedValues.calories) : null;
    metrics.rounds = resolvedValues.rounds ? Number(resolvedValues.rounds) : null;
    metrics.work_interval_seconds = resolvedValues.work_interval_seconds ? Number(resolvedValues.work_interval_seconds) : null;
    metrics.rest_interval_seconds = resolvedValues.rest_interval_seconds ? Number(resolvedValues.rest_interval_seconds) : null;
  }
  if (domain === "fitness_test" || entryType === "FORMAL_TEST") {
    metrics.test_protocol_name = resolvedValues.test_protocol_name || null;
    metrics.test_protocol_code = resolvedValues.test_protocol_code || null;
    metrics.event_results = resolvedValues.event_results ? resolvedValues.event_results.split("\n").filter(Boolean).map((line) => {
      const [name, score] = line.split(",");
      return { name: name?.trim() || "Event", score: score ? Number(score.trim()) : null };
    }) : [];
    metrics.overall_score = resolvedValues.overall_score ? Number(resolvedValues.overall_score) : null;
  }
  if (domain === "body_metrics") {
    metrics.measurement_value = resolvedValues.measurement_value ? Number(resolvedValues.measurement_value) : null;
    metrics.measurement_unit = resolvedValues.measurement_unit || "kg";
    metrics.measurement_location = resolvedValues.measurement_location || null;
  }
  return {
    id: performanceEditId,
    userId: session?.user?.id || null,
    performanceDate: resolvedValues.performance_date || todayISODate(),
    performanceTime: resolvedValues.performance_time || null,
    domain,
    entryType,
    activityCode: resolvedValues.activity_code || "custom",
    activityName: resolvedValues.activity_name || resolvedValues.activity_code || "",
    sessionName: resolvedValues.session_name || "",
    source: resolvedValues.source || "MANUAL",
    notes: resolvedValues.notes || "",
    evidenceStatus: resolvedValues.evidence_status || "SELF REPORTED",
    metrics
  };
}

function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSparkline(points = [], direction = "higher") {
  const values = (points || []).filter((point) => isSeriesPointValid(point)).slice(-8).map((point) => Number(point.normalizedValue));
  if (values.length < 2) {
    return '<span class="intelligence-sparkline-empty">No trend line</span>';
  }
  const width = 140;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coordinates = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const normalized = (value - min) / range;
    const y = height - (normalized * (height - 4)) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const arrow = direction === "lower" ? "LOWER IS BETTER" : "HIGHER IS BETTER";
  return `<svg class="intelligence-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Recent values sparkline, ${arrow}"><polyline points="${coordinates}" /></svg>`;
}

function renderPerformanceViewPanels() {
  const active = normalizePerformanceViewCode(performanceActiveView);
  PERFORMANCE_VIEW_CODES.forEach((code) => {
    const panel = document.getElementById(`performance-view-${code}`);
    if (panel) panel.hidden = code !== active;
    const tab = document.querySelector(`[data-performance-view="${code}"]`);
    if (tab) {
      const selected = code === active;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.classList.toggle("active", selected);
      tab.tabIndex = selected ? 0 : -1;
    }
  });
}

function setPerformanceActiveView(view = "today_training") {
  const requestedView = String(view || "").trim().toLowerCase();
  performanceActiveView = normalizePerformanceViewCode(requestedView);
  renderPerformanceViewPanels();
  const legacyDetailIds = {
    programming: "training-programming-detail",
    recovery: "training-recovery-detail",
    fitness_tests: "training-fitness-tests-detail",
    records: "training-records-detail",
    milestones: "training-milestones-detail",
    intelligence: "training-intelligence-detail"
  };
  const detail = document.getElementById(legacyDetailIds[requestedView]);
  if (detail) detail.open = true;
}

function formatCoreWorkspaceDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = seconds / 60;
  return `${minutes >= 10 ? Math.round(minutes) : minutes.toFixed(1).replace(/\.0$/, "")} min`;
}

function renderCoreWorkspace(entries = performanceEntries) {
  const panel = document.getElementById("performance-view-core");
  if (!panel) return;
  const model = buildCoreWorkspaceModel(entries, milestoneAchievements);
  setText("core-week-sessions", model.sessionsThisWeek);
  setText("core-week-reps", model.totalRepetitions);
  setText("core-week-time", formatCoreWorkspaceDuration(model.totalDurationSeconds));
  setText("core-active-days", model.activeDays);
  const status = document.getElementById("core-command-status");
  if (status) {
    status.textContent = model.status;
    status.className = `state-pill ${model.sessionsThisWeek ? "green" : model.recentEntries.length ? "yellow" : "neutral"}`;
  }
  const nextMilestone = document.getElementById("core-next-milestone");
  if (nextMilestone) {
    nextMilestone.innerHTML = model.nextMilestone
      ? `<strong>${escapeHtml(model.nextMilestone.title)}</strong><p>${escapeHtml(model.nextMilestone.description)}</p><div class="core-progress-track" role="progressbar" aria-label="${escapeHtml(model.nextMilestone.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${model.nextMilestone.progressPercent}"><span style="width:${model.nextMilestone.progressPercent}%"></span></div><small>${model.nextMilestone.currentValue} / ${model.nextMilestone.targetValue} ${escapeHtml(model.nextMilestone.targetUnit)} Â· ${model.nextMilestone.progressPercent}%</small>`
      : `<strong>Core milestone set complete</strong><p>Every current abs/core objective has qualifying evidence. Keep building durable capacity.</p><small>${model.completedMilestones} of ${model.totalMilestones} complete</small>`;
  }
  const recentList = document.getElementById("core-recent-list");
  if (recentList) {
    recentList.innerHTML = model.recentEntries.length
      ? model.recentEntries.map((entry) => {
        const details = [];
        if (Number(entry.metrics?.repetitions) > 0) details.push(`${Number(entry.metrics.repetitions)} reps`);
        if (Number(entry.metrics?.duration_seconds) > 0) details.push(formatCoreWorkspaceDuration(entry.metrics.duration_seconds));
        return `<div class="core-recent-entry"><div><strong>${escapeHtml(entry.activityName || "Core work")}</strong><span>${escapeHtml(entry.performanceDate)}</span></div><small>${escapeHtml(details.join(" Â· ") || entry.entryType.replaceAll("_", " "))}</small></div>`;
      }).join("")
      : `<div class="performance-empty">No abs/core evidence yet. Start with a training entry or a benchmark.</div>`;
  }
  renderCoreProgramming();
}

function renderPerformanceIntelligenceSection(entries = performanceEntries) {
  const container = document.getElementById("performance-intelligence-panel");
  if (!container) return;
  ensurePerformanceAnalyticStateLoaded();
  const overview = buildPerformanceIntelligenceOverview(entries, fitnessTestAttempts, personalRecords, milestoneAchievements, {
    remoteLoadFailed: performanceLoadState.remoteLoadFailed,
    localFallbackActive: performanceStorageMode === "LOCAL",
    authRequired: performanceLoadState.authRequired,
    calculationUnavailable: performanceLoadState.calculationUnavailable
  });
  const statusStrip = document.getElementById("performance-intelligence-status");
  if (statusStrip) {
    statusStrip.textContent = overview.viewState.label;
    statusStrip.className = `state-pill ${overview.viewState.tone || "neutral"}`;
  }

  const filters = performanceIntelligenceFilters || { domain: "all", trajectory: "all", confidence: "all", evidenceStatus: "all" };
  const filteredMetrics = overview.metricIntelligence.filter((item) => {
    if (filters.domain !== "all" && item.series.domain !== filters.domain) return false;
    if (filters.trajectory !== "all" && item.trajectory !== filters.trajectory) return false;
    if (filters.confidence !== "all" && item.confidence !== filters.confidence) return false;
    if (filters.evidenceStatus !== "all" && !item.series.evidenceStatuses.includes(filters.evidenceStatus)) return false;
    return true;
  });

  const domainCards = overview.domainSummaries.map((domainSummary) => {
    const strongest = domainSummary.strongestSeries;
    const weakest = domainSummary.weakestSeries;
    return `<article class="intelligence-domain-card"><h4>${escapeHtml(PERFORMANCE_DOMAIN_LABELS[domainSummary.domain] || domainSummary.domain)}</h4><dl><div><dt>Trajectory</dt><dd>${escapeHtml(domainSummary.trajectory)}</dd></div><div><dt>Confidence</dt><dd>${escapeHtml(domainSummary.confidence)}</dd></div><div><dt>Strongest metric</dt><dd>${escapeHtml(strongest?.series?.activityName || strongest?.series?.metricCategory || "None")}</dd></div><div><dt>Weakest metric</dt><dd>${escapeHtml(weakest?.series?.activityName || weakest?.series?.metricCategory || "None")}</dd></div><div><dt>Plateau count</dt><dd>${domainSummary.plateauCount}</dd></div><div><dt>Latest meaningful change</dt><dd>${escapeHtml(strongest?.latestMeaningfulChange || "No meaningful change")}</dd></div><div><dt>Evidence limitations</dt><dd>${escapeHtml(domainSummary.evidenceLimitations[0] || "None")}</dd></div><div><dt>Recommended focus</dt><dd>${escapeHtml(domainSummary.recommendedFocusText)}</dd></div></dl></article>`;
  }).join("");

  const watchlistRows = overview.metricIntelligence.filter((item) => item.plateau.state !== "NO PLATEAU" || item.regression.state !== "NO REGRESSION").map((item) => {
    return `<tr><td>${escapeHtml(item.series.activityName)} <span class="muted">${escapeHtml(item.series.metricCategory)}</span></td><td>${escapeHtml(item.plateau.state)}</td><td>${escapeHtml(item.regression.state)}</td><td>${escapeHtml(item.confidence)}</td></tr>`;
  }).join("");

  const prRows = overview.prCandidates.slice(0, 6).map((candidate) => {
    return `<article class="intelligence-row"><div><strong>${escapeHtml(candidate.status)}</strong><p>${escapeHtml(candidate.series?.activityName || "Metric")} â€¢ ${escapeHtml(candidate.series?.metricCategory || "unknown")}</p></div><div><span>${escapeHtml(candidate.reason || "No rationale")}</span><small>${Number.isFinite(candidate.gapPct) ? `${candidate.gapPct.toFixed(2)}% gap` : "Gap unavailable"}</small></div></article>`;
  }).join("");

  const metricCards = filteredMetrics.slice(0, 12).map((item) => {
    return `<article class="intelligence-metric-card"><header><strong>${escapeHtml(item.series.activityName)}</strong><span class="state-pill neutral">${escapeHtml(item.trajectory)}</span></header><p class="muted">${escapeHtml(item.series.metricCategory)}</p>${buildSparkline(item.series.validPoints, item.series.direction)}<dl><div><dt>Confidence</dt><dd>${escapeHtml(item.confidence)}</dd></div><div><dt>Recent direction</dt><dd>${escapeHtml(item.trend.recentNetPercent !== null ? `${item.trend.recentNetPercent.toFixed(2)}%` : "No change")}</dd></div><div><dt>Supporting results</dt><dd>${item.series.validCount}</dd></div><div><dt>Evidence status</dt><dd>${escapeHtml(item.series.evidenceStatuses.join(", "))}</dd></div><div><dt>Latest change</dt><dd>${escapeHtml(item.latestMeaningfulChange)}</dd></div><div><dt>Next action</dt><dd>${escapeHtml(item.regression.state === "LIKELY REGRESSION" ? "Review recent decline" : item.plateau.state === "LIKELY PLATEAU" ? "Retest benchmark" : "Continue progression")}</dd></div></dl></article>`;
  }).join("");

  const benchmark = overview.nextBenchmark.benchmark;
  const benchmarkPanel = benchmark
    ? `<div class="intelligence-panel-body"><strong>${escapeHtml(benchmark.title)}</strong><p>${escapeHtml(benchmark.comparisonNote || "")}</p><p>Gap: ${Number(benchmark.gapAbsolute).toFixed(3)} ${escapeHtml(benchmark.direction === "lower" ? "seconds" : "target units")}</p><p>${benchmark.progressPct !== null ? `Progress: ${benchmark.progressPct.toFixed(1)}%` : "Progress percentage unavailable for this benchmark type."}</p></div>`
    : `<div class="intelligence-empty">No eligible benchmark with sufficient comparable evidence.</div>`;

  const fitnessRows = overview.fitnessTestIntelligence.eventIntelligence.slice(0, 8).map((event) => {
    return `<article class="intelligence-row"><div><strong>${escapeHtml(event.eventName)}</strong><p>${escapeHtml(event.trajectory)}</p></div><div><span>${escapeHtml(event.confidence)}</span><small>${event.supportingResultCount} result(s)</small></div></article>`;
  }).join("");

  container.innerHTML = `
    <section class="intelligence-status-strip" aria-live="polite">
      <div><span>Overall trajectory</span><strong>${escapeHtml(overview.overallTrajectory)}</strong></div>
      <div><span>Strongest domain</span><strong>${escapeHtml(PERFORMANCE_DOMAIN_LABELS[overview.strongestDomain] || overview.strongestDomain)}</strong></div>
      <div><span>Weakest domain</span><strong>${escapeHtml(PERFORMANCE_DOMAIN_LABELS[overview.weakestDomain] || overview.weakestDomain)}</strong></div>
      <div><span>Improving metrics</span><strong>${overview.trajectoryCounts.improving}</strong></div>
      <div><span>Stable metrics</span><strong>${overview.trajectoryCounts.stable}</strong></div>
      <div><span>Declining metrics</span><strong>${overview.trajectoryCounts.declining}</strong></div>
      <div><span>Insufficient metrics</span><strong>${overview.trajectoryCounts.insufficient}</strong></div>
    </section>
    <section class="intelligence-filter-row" aria-label="Performance intelligence filters">
      <label>Domain<select id="intelligence-filter-domain"><option value="all">All</option>${Object.entries(PERFORMANCE_DOMAIN_LABELS).map(([code, label]) => `<option value="${code}" ${filters.domain === code ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label>Trajectory<select id="intelligence-filter-trajectory"><option value="all">All</option>${PERFORMANCE_TRAJECTORY_STATES.map((state) => `<option value="${state}" ${filters.trajectory === state ? "selected" : ""}>${state}</option>`).join("")}</select></label>
      <label>Confidence<select id="intelligence-filter-confidence"><option value="all">All</option>${PERFORMANCE_CONFIDENCE_STATES.map((state) => `<option value="${state}" ${filters.confidence === state ? "selected" : ""}>${state}</option>`).join("")}</select></label>
      <label>Evidence<select id="intelligence-filter-evidence"><option value="all">All</option>${["VERIFIED", "SELF REPORTED", "ESTIMATED", "INCOMPLETE"].map((state) => `<option value="${state}" ${filters.evidenceStatus === state ? "selected" : ""}>${state}</option>`).join("")}</select></label>
    </section>
    <section class="intelligence-metric-grid" aria-label="Comparable metric intelligence cards">${metricCards || '<div class="intelligence-empty">No metrics match the selected filters.</div>'}</section>
    <section class="intelligence-panel"><h3>Domain Intelligence</h3><div class="intelligence-domain-grid">${domainCards}</div></section>
    <section class="intelligence-panel"><h3>Plateau and Regression Watchlist</h3>${watchlistRows ? `<table class="intelligence-watchlist"><thead><tr><th>Metric</th><th>Plateau</th><th>Regression</th><th>Confidence</th></tr></thead><tbody>${watchlistRows}</tbody></table>` : '<div class="intelligence-empty">No plateau or regression alerts detected.</div>'}</section>
    <section class="intelligence-panel"><h3>Next Benchmark</h3>${benchmarkPanel}</section>
    <section class="intelligence-panel"><h3>PR Readiness</h3>${prRows || '<div class="intelligence-empty">No PR readiness candidates available.</div>'}<p class="muted">PR readiness is evidence-based and not a guarantee. Do not test through pain, fatigue, or injury.</p></section>
    <section class="intelligence-panel"><h3>Fitness-Test Event Intelligence</h3>${fitnessRows || '<div class="intelligence-empty">No completed compatible test attempts available.</div>'}<p class="muted">Improved: ${overview.fitnessTestIntelligence.improvedEventCount} â€¢ Unchanged: ${overview.fitnessTestIntelligence.unchangedEventCount} â€¢ Declined: ${overview.fitnessTestIntelligence.declinedEventCount} â€¢ Missing required: ${overview.fitnessTestIntelligence.missingEventCount}</p></section>
    <section class="intelligence-panel"><h3>Atlas Performance Intelligence</h3><pre class="atlas-brief-output" aria-live="polite">${escapeHtml(overview.atlas.text)}</pre></section>
    <section class="intelligence-panel"><h3>Evidence Limitations</h3>${overview.evidenceLimitations.length ? `<ul>${overview.evidenceLimitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : '<div class="intelligence-empty">No material evidence limitations detected.</div>'}</section>
  `;

  const filterDomain = document.getElementById("intelligence-filter-domain");
  const filterTrajectory = document.getElementById("intelligence-filter-trajectory");
  const filterConfidence = document.getElementById("intelligence-filter-confidence");
  const filterEvidence = document.getElementById("intelligence-filter-evidence");
  if (filterDomain) {
    filterDomain.addEventListener("change", (event) => {
      performanceIntelligenceFilters.domain = event.target.value || "all";
      renderPerformanceIntelligenceSection(performanceEntries);
    });
  }
  if (filterTrajectory) {
    filterTrajectory.addEventListener("change", (event) => {
      performanceIntelligenceFilters.trajectory = event.target.value || "all";
      renderPerformanceIntelligenceSection(performanceEntries);
    });
  }
  if (filterConfidence) {
    filterConfidence.addEventListener("change", (event) => {
      performanceIntelligenceFilters.confidence = event.target.value || "all";
      renderPerformanceIntelligenceSection(performanceEntries);
    });
  }
  if (filterEvidence) {
    filterEvidence.addEventListener("change", (event) => {
      performanceIntelligenceFilters.evidenceStatus = event.target.value || "all";
      renderPerformanceIntelligenceSection(performanceEntries);
    });
  }
}

function renderFitnessTestsSection() {
  const container = document.getElementById("fitness-test-history");
  const summary = document.getElementById("fitness-test-summary");
  if (!container) return;
  ensurePerformanceAnalyticStateLoaded();
  if (summary) summary.textContent = fitnessTestAttempts.length ? `${fitnessTestAttempts.length} saved attempt${fitnessTestAttempts.length === 1 ? "" : "s"}` : "No fitness tests yet";
  renderFitnessTestWorkspace(getFitnessTestAttemptById(activeFitnessTestAttemptId));
}

function renderPersonalRecordsSection() {
  const container = document.getElementById("performance-pr-list");
  if (!container) return;
  ensurePerformanceAnalyticStateLoaded();
  container.innerHTML = personalRecords.length ? personalRecords.map((record) => `<article class="performance-entry-card"><div class="performance-entry-header"><div><strong>${record.recordCategory}</strong><p>${record.activityName || record.domain}</p></div><span class="state-pill neutral">${record.recordStatus}</span></div><div class="performance-entry-meta"><span>${record.normalizedValue} ${record.unit || ""}</span><span>Prev: ${record.previousRecordValue ?? "â€”"}</span></div></article>`).join("") : `<div class="performance-empty">No personal records yet.</div>`;
}

function renderMilestonesSection() {
  const container = document.getElementById("performance-milestone-history");
  const catalog = document.getElementById("performance-milestone-catalog");
  if (!container) return;
  ensurePerformanceAnalyticStateLoaded();
  if (catalog) catalog.innerHTML = getMilestoneCatalog().slice(0, 8).map((milestone) => `<div class="performance-entry-card"><strong>${milestone.title}</strong><p>${milestone.commandNote}</p></div>`).join("");
  container.innerHTML = milestoneAchievements.length ? milestoneAchievements.map((item) => `<article class="performance-entry-card"><div class="performance-entry-header"><div><strong>${item.title}</strong><p>${item.achievedDate}</p></div><span class="state-pill neutral">${item.evidenceStatus || "SELF REPORTED"}</span></div></article>`).join("") : `<div class="performance-empty">No milestones achieved yet.</div>`;
}

function renderAtlasPerformanceReviewSection() {
  const container = document.getElementById("performance-atlas-review-output");
  if (!container) return;
  ensurePerformanceAnalyticStateLoaded();
  const review = atlasPerformanceReviews[0] || buildAtlasPerformanceReview(personalRecords, milestoneAchievements, { incompleteEvidence: false });
  container.innerHTML = `<article class="performance-entry-card"><div class="performance-entry-header"><div><strong>ATLAS // PERFORMANCE REVIEW</strong><p>${review.status}</p></div><span class="state-pill neutral">${review.limitedEvidence ? "LIMITED EVIDENCE" : "READY"}</span></div><div class="performance-entry-meta"><span>${review.newRecords}</span><span>${review.milestones}</span></div></article>`;
}

function recruitContractStorageKey(stateType = "APPROVED") {
  return `coach-dominion:recruit-contract:${session?.user?.id || "local"}:${String(stateType).toLowerCase()}`;
}

function readRecruitContractState(stateType = "APPROVED", fallback = null) {
  try {
    const stored = window.localStorage.getItem(recruitContractStorageKey(stateType));
    return stored ? JSON.parse(stored) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveRecruitContractLocal(stateType, payload) {
  window.localStorage.setItem(recruitContractStorageKey(stateType), JSON.stringify(payload));
  return payload;
}

function readRecruitContractLifecycle() {
  const approved = readRecruitContractState("APPROVED", null);
  const draft = readRecruitContractState("DRAFT", null);
  const history = readRecruitContractState("HISTORY", []);
  if (typeof DominionBetaStateIntegrity !== "undefined") {
    return DominionBetaStateIntegrity.resolveContractLifecycle({ approved, draft, history });
  }
  return {
    activeSignedContract: approved?.status === "APPROVED" ? approved : null,
    draftContract: ["READY_FOR_APPROVAL", "REVIEW_REQUIRED"].includes(draft?.status) ? draft : null,
    activeSignedContractRevision: Number(approved?.revision || 0) || null,
    draftContractRevision: Number(draft?.revision || 0) || null,
    draftContractStatus: draft ? "UNSIGNED_DRAFT" : null,
    draftEffectiveDate: draft?.effectiveDate || null,
    supersededContractRevision: null
  };
}

function readRecruitContractDraft() {
  return readRecruitContractLifecycle().draftContract || null;
}

function readApprovedRecruitContract() {
  return readRecruitContractLifecycle().activeSignedContract || null;
}

function readRecruitContractTombstone() {
  const contract = readRecruitContractState("APPROVED", null);
  return contract?.status === "DELETED" ? contract : null;
}

function readRecruitContractHistory() {
  const history = readRecruitContractState("HISTORY", []);
  return Array.isArray(history) ? history : [];
}

function currentContractPlanRevisionStatus() {
  if (typeof DominionBetaStateIntegrity === "undefined") return null;
  const lifecycle = readRecruitContractLifecycle();
  return DominionBetaStateIntegrity.resolvePlanRevisionStatus({
    activeSignedContract: lifecycle.activeSignedContract,
    draftContract: lifecycle.draftContract,
    activeWeek: readCommittedUnifiedWeek(todayISODate()),
    activePlans: {
      strength: readApprovedStrengthPlan(),
      running: readApprovedRunningBlock(),
      core: readApprovedCorePlan(),
      nutrition: activeNutritionBaseline(todayISODate())
    }
  });
}

function contractRevisionStatusCopy() {
  const lifecycle = readRecruitContractLifecycle();
  const plans = currentContractPlanRevisionStatus();
  if (!lifecycle.draftContract) return null;
  const active = lifecycle.activeSignedContractRevision ? `R${lifecycle.activeSignedContractRevision} signed` : "No signed Contract";
  const draft = `R${lifecycle.draftContractRevision} draft open`;
  const count = Number(plans?.draft?.requiredCount || 0);
  const noOperatingChanges = plans?.draft?.noOperatingChanges === true;
  return {
    label: `${active} Â· ${draft}`,
    detail: noOperatingChanges
      ? `No operating changes detected. Discard this draft without changing the signed R${lifecycle.activeSignedContractRevision || "â€”"} program.`
      : `${count} plan${count === 1 ? "" : "s"} will update after R${lifecycle.draftContractRevision} is signed. Current-week execution continues under R${readCommittedUnifiedWeek(todayISODate())?.contractRevision || "the protected revision"}.`,
    draftRequiredCount: count,
    noOperatingChanges
  };
}

function currentEffectiveProgramIdentity(date = todayISODate()) {
  if (typeof DominionBetaStateIntegrity === "undefined") return null;
  const lifecycle = readRecruitContractLifecycle();
  const ledger = typeof DominionUnifiedExecutionLedger === "undefined" ? null : buildCurrentExecutionLedger(date);
  const activeEntry = ledger?.next || ledger?.entries?.find((entry) => entry.state === "in_progress") || null;
  return DominionBetaStateIntegrity.resolveEffectiveProgramIdentity({
    today: date,
    signedContract: lifecycle.activeSignedContract,
    draftContract: lifecycle.draftContract,
    activeWeek: readCommittedUnifiedWeek(date),
    receipt: readAtlasProgramReceipt(),
    assignment: activeEntry?.assignment || null,
    execution: activeEntry?.execution || null,
    evidence: activeEntry?.evidence || []
  });
}

async function persistRecruitContractState(stateType, payload) {
  try {
    recordContinuityWrite("contract", stateType, "current", payload);
  } catch (error) {
    console.warn("[contract:continuity] Contract save will continue without the continuity sidecar.", {
      stateType,
      code: error?.code || null,
      message: error?.message || "Continuity metadata unavailable"
    });
  }
  if (!session?.user?.id) return false;
  try {
    const accountWrite = (async () => {
      const supabase = await getClient();
      return supabase.from("recruit_contract_state").upsert({
        user_id: session.user.id,
        state_type: stateType,
        state_key: "current",
        payload,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,state_type,state_key" });
    })();
    const { error } = typeof DominionContractAutosave !== "undefined"
      ? await DominionContractAutosave.withTimeout(accountWrite, RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS)
      : await accountWrite;
    if (error) throw error;
    markContinuityRecordSynced("contract", stateType, "current", payload);
    acknowledgeContinuityRetry("contract", stateType, "current");
    recruitContractStorageMode = "REMOTE";
    return true;
  } catch (error) {
    console.error("[contract:persist] Account save failed.", {
      stateType,
      code: error?.code || null,
      message: error?.message || "Unknown persistence error"
    });
    logAccountPersistenceFailure("contract", stateType, "current", payload, error);
    recruitContractStorageMode = "LOCAL";
    return false;
  }
}

async function finalizeRecruitContractDraftState(contract) {
  const marker = {
    status: "FINALIZED",
    finalizedAt: contract?.signature?.signedAt || new Date().toISOString(),
    finalizedContractId: contract?.id || null,
    finalizedContractRevision: Number(contract?.revision || 0)
  };
  saveRecruitContractLocal("DRAFT", marker);
  const synced = await persistRecruitContractState("DRAFT", marker);
  window.localStorage.removeItem(recruitContractStorageKey("DRAFT"));
  return synced;
}

function recruitContractDraftWasFinalized(draft, approved) {
  if (!draft || !approved || typeof DominionContractExperience === "undefined") return false;
  if (!DominionContractExperience.signatureStatus(approved).valid) return false;
  if (draft.amendsContractId && approved.supersedesId === draft.amendsContractId) return true;
  const signedAt = Date.parse(approved.signature?.signedAt || "") || 0;
  const draftedAt = Date.parse(draft.updatedAt || draft.createdAt || "") || 0;
  return Boolean(signedAt && draftedAt && draftedAt <= signedAt);
}

async function clearRecruitContractState(stateType = "DRAFT") {
  if (!session?.user?.id) {
    window.localStorage.removeItem(recruitContractStorageKey(stateType));
    return true;
  }
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("recruit_contract_state")
      .delete()
      .eq("user_id", session.user.id)
      .eq("state_type", stateType)
      .eq("state_key", "current")
      .select("state_type,state_key");
    if (error) throw error;
    window.localStorage.removeItem(recruitContractStorageKey(stateType));
    return true;
  } catch (error) {
    console.info("[contract:clear-retry] Account copy was not removed; the device copy remains visible.", {
      stateType,
      code: error?.code || "ACCOUNT_DELETE_FAILED"
    });
    return false;
  }
}

async function loadRecruitContractState() {
  if (!session?.user?.id || typeof DominionRecruitContract === "undefined") return;
  const stateTypes = ["DRAFT", "APPROVED", "HISTORY"];
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("recruit_contract_state")
      .select("state_type,state_key,payload,updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = data || [];
    for (const stateType of stateTypes) {
      const row = rows.find((item) => item.state_type === stateType && item.state_key === "current");
      const local = readRecruitContractState(stateType, stateType === "HISTORY" ? [] : null);
      const selected = resolveContinuityPayload("contract", stateType, "current", local, row || null, { immutable: stateType === "APPROVED" });
      if (selected.payload && (stateType !== "HISTORY" || selected.payload.length)) saveRecruitContractLocal(stateType, selected.payload);
      if (selected.source === "DEVICE" && selected.payload) await persistRecruitContractState(stateType, selected.payload);
    }
    recruitContractStorageMode = "REMOTE";
    for (const stateType of stateTypes) {
      const local = readRecruitContractState(stateType, stateType === "HISTORY" ? [] : null);
      const exists = rows.some((item) => item.state_type === stateType && item.state_key === "current");
      if (!exists && local && (stateType !== "HISTORY" || local.length)) {
        await persistRecruitContractState(stateType, local);
      }
    }
    const approved = readApprovedRecruitContract();
    const strandedDraft = readRecruitContractDraft();
    if (recruitContractDraftWasFinalized(strandedDraft, approved)) {
      await finalizeRecruitContractDraftState(approved);
    }
  } catch (_) {
    recruitContractStorageMode = "LOCAL";
  }
  renderRecruitContract();
}

function recruitOnboardingStorageKey() {
  return `coach-dominion:recruit-onboarding:${session?.user?.id || "local"}:current`;
}

function readRecruitOnboardingState(fallback = null) {
  try {
    const stored = window.localStorage.getItem(recruitOnboardingStorageKey());
    return stored ? JSON.parse(stored) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveRecruitOnboardingLocal(payload) {
  if (!payload) return payload;
  try {
    window.localStorage.setItem(recruitOnboardingStorageKey(), JSON.stringify(payload));
    scheduleAccountTruthSync();
  } catch (error) {
    console.warn("[orientation:local] Device save failed.", {
      message: error?.message || "Local storage unavailable"
    });
  }
  return payload;
}

function recruitOnboardingFromRow(row) {
  if (!row) return null;
  const orientation = row.orientation && typeof row.orientation === "object" ? row.orientation : {};
  return {
    ...orientation,
    contractId: row.contract_id || orientation.contractId || null,
    contractRevision: Number(row.contract_revision ?? orientation.contractRevision ?? 0),
    status: row.status || orientation.status || "PROFILE_REQUIRED",
    currentStep: Number(row.current_step ?? orientation.currentStep ?? 0),
    profile: row.profile && typeof row.profile === "object" ? row.profile : (orientation.profile || {}),
    updatedAt: row.updated_at || orientation.updatedAt || new Date().toISOString()
  };
}

function selectRecruitOnboardingState(local, account) {
  if (typeof DominionFirstWeekOrientation !== "undefined" && typeof DominionFirstWeekOrientation.selectCanonicalOrientation === "function") {
    return DominionFirstWeekOrientation.selectCanonicalOrientation(local, account);
  }
  if (!local) return account;
  if (!account) return local;
  const localComplete = Boolean(local.completedAt || local.status === "COMPLETE");
  const accountComplete = Boolean(account.completedAt || account.status === "COMPLETE");
  if (localComplete !== accountComplete) return localComplete ? local : account;
  const localUpdatedAt = Date.parse(local.updatedAt || "") || 0;
  const accountUpdatedAt = Date.parse(account.updatedAt || "") || 0;
  return localUpdatedAt >= accountUpdatedAt ? local : account;
}

async function persistRecruitOnboardingState(payload) {
  if (!payload || !session?.user?.id) return false;
  try {
    const accountWrite = (async () => {
      const supabase = await getClient();
      return supabase.from("recruit_onboarding_state").upsert({
        user_id: session.user.id,
        contract_id: payload.contractId,
        contract_revision: Number(payload.contractRevision || 0),
        status: payload.status || "PROFILE_REQUIRED",
        current_step: Number(payload.currentStep || 0),
        profile: payload.profile || {},
        orientation: payload,
        updated_at: payload.updatedAt || new Date().toISOString()
      }, { onConflict: "user_id" });
    })();
    const { error } = typeof DominionContractAutosave !== "undefined"
      ? await DominionContractAutosave.withTimeout(accountWrite, RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS)
      : await accountWrite;
    if (error) throw error;
    acknowledgeContinuityRetry("orientation", "STATE", "current");
    recruitOnboardingStorageMode = "REMOTE";
    return true;
  } catch (error) {
    console.error("[orientation:persist] Account save failed; device state remains active.", {
      code: error?.code || null,
      message: error?.message || "Unknown persistence error"
    });
    logAccountPersistenceFailure("orientation", "STATE", "current", payload, error);
    recruitOnboardingStorageMode = "LOCAL";
    return false;
  }
}

async function loadRecruitOnboardingState() {
  const local = readRecruitOnboardingState();
  if (!session?.user?.id) {
    recruitOnboardingStorageMode = "LOCAL";
    return local;
  }
  try {
    const accountRead = (async () => {
      const supabase = await getClient();
      return supabase
        .from("recruit_onboarding_state")
        .select("contract_id,contract_revision,status,current_step,profile,orientation,updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
    })();
    const { data, error } = typeof DominionContractAutosave !== "undefined"
      ? await DominionContractAutosave.withTimeout(accountRead, RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS)
      : await accountRead;
    if (error) throw error;
    const account = recruitOnboardingFromRow(data);
    const selected = selectRecruitOnboardingState(local, account);
    if (selected) saveRecruitOnboardingLocal(selected);
    recruitOnboardingStorageMode = data ? "REMOTE" : "LOCAL";
    if (selected === local && (!account || JSON.stringify(local) !== JSON.stringify(account))) {
      await persistRecruitOnboardingState(local);
    }
    return selected;
  } catch (error) {
    console.warn("[orientation:load] Account state unavailable; continuing with device state.", {
      code: error?.code || null,
      message: error?.message || "Unknown load error"
    });
    if (local) enqueueContinuityRetry("orientation", "STATE", "current", local, error);
    recruitOnboardingStorageMode = "LOCAL";
    return local;
  }
}

async function clearRecruitOnboardingState() {
  try {
    window.localStorage.removeItem(recruitOnboardingStorageKey());
  } catch (_) {}
  recruitOnboardingStorageMode = "LOCAL";
  if (!session?.user?.id) return false;
  try {
    const accountDelete = (async () => {
      const supabase = await getClient();
      return supabase.from("recruit_onboarding_state").delete().eq("user_id", session.user.id);
    })();
    const { error } = typeof DominionContractAutosave !== "undefined"
      ? await DominionContractAutosave.withTimeout(accountDelete, RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS)
      : await accountDelete;
    if (error) throw error;
    recruitOnboardingStorageMode = "REMOTE";
    return true;
  } catch (error) {
    console.warn("[orientation:clear] Account state could not be cleared.", {
      code: error?.code || null,
      message: error?.message || "Unknown delete error"
    });
    return false;
  }
}

function weeklyOrchestrationStorageKey(stateType = "HISTORY", stateKey = "current") {
  return `coach-dominion:weekly-orchestration:${session?.user?.id || "local"}:${String(stateType).toLowerCase()}:${stateKey}`;
}

function readWeeklyOrchestrationState(stateType = "HISTORY", stateKey = "current", fallback = null) {
  try {
    const stored = window.localStorage.getItem(weeklyOrchestrationStorageKey(stateType, stateKey));
    return stored ? JSON.parse(stored) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveWeeklyOrchestrationLocal(stateType, stateKey, payload) {
  window.localStorage.setItem(weeklyOrchestrationStorageKey(stateType, stateKey), JSON.stringify(payload));
  return payload;
}

function readUnifiedWeekDraft() {
  return readWeeklyOrchestrationState("DRAFT", "current", null);
}

function readUnifiedWeekHistory() {
  const history = readWeeklyOrchestrationState("HISTORY", "current", []);
  return Array.isArray(history)
    ? history.filter((item) => item && typeof item === "object" && item.weekStart && item.weekEnd)
    : [];
}

function refreshProgramActivationSurfaces() {
  const renderers = [
    ["Program", renderProgramCommand],
    ["calendar", renderWeeklyOrchestrator],
    ["Contract activation", renderContractActivation],
    ["Contract", renderRecruitContract],
    ["Today week", renderTodayCommittedWeek],
    ["Today command", renderTodayCommandSurface],
    ["daily assignment", renderDailyAssignment],
    ["Train", renderPerformanceSection],
    ["Core", renderCoreProgramming],
    ["Fuel", renderNutritionCommand],
    ["weekly rollover", renderWeeklyRolloverCertification]
  ];
  renderers.forEach(([surface, renderer]) => {
    try { renderer(); }
    catch (error) {
      console.info("[atlas:render-fallback] Active program is safe; one surface will recover on reload.", {
        operation: "render_active_program_surface",
        type: surface,
        status: "fallback"
      });
    }
  });
}

function readCommittedUnifiedWeek(value = todayISODate()) {
  if (typeof DominionWeeklyOrchestrator === "undefined") return null;
  const signedRevision = Number(readRecruitContractLifecycle().activeSignedContractRevision || 0);
  const authoritative = readUnifiedWeekHistory().filter((week) => week?.status !== "REPLACED"
    && (!signedRevision || Number(week.contractRevision || 0) <= signedRevision));
  return DominionWeeklyOrchestrator.weekForDate(authoritative, value);
}

function readCommittedUnifiedWeekByStart(weekStart = "") {
  const signedRevision = Number(readRecruitContractLifecycle().activeSignedContractRevision || 0);
  return readUnifiedWeekHistory().find((item) => item?.status !== "REPLACED"
    && item.weekStart === weekStart
    && (!signedRevision || Number(item.contractRevision || 0) <= signedRevision)) || null;
}

function readCommittedUnifiedDay(value = todayISODate()) {
  if (typeof DominionWeeklyOrchestrator === "undefined") return null;
  const week = readCommittedUnifiedWeek(value);
  return week ? DominionWeeklyOrchestrator.dayForDate(week, value) : null;
}

function readEffectiveUnifiedDay(value = todayISODate()) {
  const date = String(value || todayISODate()).slice(0, 10);
  const day = readCommittedUnifiedDay(date);
  if (!day) return day;
  const proposal = activeAtlasAdaptiveHorizon(date);
  const horizonDay = typeof DominionAtlasAdaptiveHorizon === "undefined"
    ? day
    : DominionAtlasAdaptiveHorizon.applyToDay(day, proposal, adaptiveHorizonContext(date));
  const closedLoopDay = typeof DominionAtlasClosedLoop === "undefined"
    ? horizonDay
    : DominionAtlasClosedLoop.applyToDay(horizonDay, activeAtlasClosedLoopDecision(date), date);
  const liveProposal = typeof DominionAtlasLiveAdaptation === "undefined" ? null : readAtlasLiveAdaptation(date);
  const liveState = typeof DominionFinalBetaStabilization === "undefined"
    ? liveProposal?.status
    : DominionFinalBetaStabilization.adaptationState(liveProposal);
  if (["PROPOSED", "HELD", "NEEDS_CONTEXT", "ADAPTATION_PROPOSED", "ADAPTATION_DECLINED"].includes(liveState)) return closedLoopDay;
  if (typeof DominionRecoveryCommand === "undefined") return closedLoopDay;
  const recoveryCommand = buildCurrentRecoveryCommand(date);
  if (["AMBER", "RED"].includes(recoveryCommand?.posture) && liveProposal?.status !== "APPROVED") return closedLoopDay;
  return DominionRecoveryCommand.applyToDay(closedLoopDay, recoveryCommand, recoveryCommandContext(date));
}

function buildCurrentCanonicalDailyCommand(value = todayISODate()) {
  if (typeof DominionCanonicalDailyCommand === "undefined") return null;
  const date = String(value || todayISODate()).slice(0, 10);
  const week = readCommittedUnifiedWeek(date);
  const day = week ? readEffectiveUnifiedDay(date) : null;
  const closeout = readDailyCloseout(date);
  return DominionCanonicalDailyCommand.buildCanonicalDailyCommand({
    date,
    contract: readApprovedRecruitContract(),
    committedWeek: week,
    committedDay: day,
    draftWeek: readUnifiedWeekDraft(),
    dayComplete: closeout?.status === "SEALED" && Boolean(closeout?.accountConfirmedAt),
    executions: {
      strength: readDailyAssignmentExecution(),
      running: readRunningExecution(),
      core: readCurrentCoreExecution()
    }
  });
}

function splitDayCheckpointStorageKey(value = todayISODate()) {
  return `coach-dominion:split-day:${session?.user?.id || "local"}:${String(value).slice(0, 10)}`;
}

function readSplitDayCheckpoint(value = todayISODate()) {
  try {
    return JSON.parse(window.localStorage.getItem(splitDayCheckpointStorageKey(value)) || "null");
  } catch (_) {
    return null;
  }
}

function saveSplitDayCheckpointLocal(payload) {
  if (!payload?.date) return null;
  window.localStorage.setItem(splitDayCheckpointStorageKey(payload.date), JSON.stringify(payload));
  return payload;
}

async function persistSplitDayCheckpoint(payload) {
  recordContinuityWrite("calendar", "CHECKPOINT", payload?.date || todayISODate(), payload);
  if (!session?.user?.id || !payload?.date) return false;
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("split_day_checkpoint_state").upsert({
      user_id: session.user.id,
      checkpoint_date: payload.date,
      week_id: payload.weekId || null,
      payload,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,checkpoint_date" });
    if (error) throw error;
    markContinuityRecordSynced("calendar", "CHECKPOINT", payload.date, payload);
    splitDayStorageMode = "REMOTE";
    return true;
  } catch (_) {
    splitDayStorageMode = "LOCAL";
    return false;
  }
}

async function loadSplitDayCheckpointState(value = todayISODate()) {
  if (!session?.user?.id || typeof DominionSplitDayCommand === "undefined") return;
  const local = readSplitDayCheckpoint(value);
  try {
    const supabase = await getClient();
    const { data, error } = await supabase.from("split_day_checkpoint_state")
      .select("checkpoint_date,week_id,payload,updated_at")
      .eq("user_id", session.user.id)
      .eq("checkpoint_date", value)
      .maybeSingle();
    if (error) throw error;
    if (data?.payload) {
      const localUpdated = Date.parse(local?.updatedAt || local?.recordedAt || "") || 0;
      const remoteUpdated = Date.parse(data.updated_at || data.payload.updatedAt || "") || 0;
      if (local && localUpdated > remoteUpdated) await persistSplitDayCheckpoint(local);
      else saveSplitDayCheckpointLocal(data.payload);
    } else if (local) {
      await persistSplitDayCheckpoint(local);
    }
    splitDayStorageMode = "REMOTE";
  } catch (_) {
    splitDayStorageMode = "LOCAL";
  }
  renderTodayCommittedWeek();
}

function logAccountPersistenceFailure(domain, stateType, stateKey, payload, error) {
  enqueueContinuityRetry(domain, stateType, stateKey, payload, error);
}

async function persistWeeklyOrchestrationState(stateType, stateKey, payload) {
  recordContinuityWrite("calendar", stateType, stateKey, payload);
  if (!session?.user?.id) return false;
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("weekly_orchestration_state").upsert({
      user_id: session.user.id,
      state_type: stateType,
      state_key: stateKey,
      payload,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,state_type,state_key" });
    if (error) throw error;
    markContinuityRecordSynced("calendar", stateType, stateKey, payload);
    acknowledgeContinuityRetry("calendar", stateType, stateKey);
    weeklyOrchestrationStorageMode = "REMOTE";
    return true;
  } catch (error) {
    logAccountPersistenceFailure("calendar", stateType, stateKey, payload, error);
    weeklyOrchestrationStorageMode = "LOCAL";
    return false;
  }
}

async function clearWeeklyOrchestrationDraft() {
  window.localStorage.removeItem(weeklyOrchestrationStorageKey("DRAFT", "current"));
  if (!session?.user?.id) return false;
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("weekly_orchestration_state")
      .delete()
      .eq("user_id", session.user.id)
      .eq("state_type", "DRAFT")
      .eq("state_key", "current");
    if (error) throw error;
    return true;
  } catch (_) {
    return false;
  }
}

async function loadWeeklyOrchestrationState() {
  if (!session?.user?.id || typeof DominionWeeklyOrchestrator === "undefined") return;
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("weekly_orchestration_state")
      .select("state_type,state_key,payload,updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = data || [];
    const draft = rows.find((item) => item.state_type === "DRAFT" && item.state_key === "current");
    const history = rows.find((item) => item.state_type === "HISTORY" && item.state_key === "current");
    const selectedDraft = resolveContinuityPayload("calendar", "DRAFT", "current", readUnifiedWeekDraft(), draft || null);
    const selectedHistory = resolveContinuityPayload("calendar", "HISTORY", "current", readUnifiedWeekHistory(), history || null);
    if (selectedDraft.payload) saveWeeklyOrchestrationLocal("DRAFT", "current", selectedDraft.payload);
    if (selectedHistory.payload?.length) saveWeeklyOrchestrationLocal("HISTORY", "current", selectedHistory.payload);
    if (selectedDraft.source === "DEVICE" && selectedDraft.payload) await persistWeeklyOrchestrationState("DRAFT", "current", selectedDraft.payload);
    if (selectedHistory.source === "DEVICE" && selectedHistory.payload?.length) await persistWeeklyOrchestrationState("HISTORY", "current", selectedHistory.payload);
    weeklyOrchestrationStorageMode = "REMOTE";
    const localDraft = readUnifiedWeekDraft();
    const localHistory = readUnifiedWeekHistory();
    if (!draft && localDraft) await persistWeeklyOrchestrationState("DRAFT", "current", localDraft);
    if (!history && localHistory.length) await persistWeeklyOrchestrationState("HISTORY", "current", localHistory);
  } catch (_) {
    weeklyOrchestrationStorageMode = "LOCAL";
  }
  await refreshUnifiedWeekDraftForNutrition();
  renderWeeklyOrchestrator();
  renderTodayCommittedWeek();
}

function unifiedWeekTargetStart() {
  if (typeof DominionWeeklyOrchestrator === "undefined") return todayISODate();
  const contract = readApprovedRecruitContract();
  const draft = readUnifiedWeekDraft();
  if (draft?.weekStart && unifiedWeekMatchesContract(draft, contract)) return draft.weekStart;
  const active = readCommittedUnifiedWeek(todayISODate());
  return active
    ? DominionWeeklyOrchestrator.addDays(active.weekStart, 7)
    : DominionWeeklyOrchestrator.weekStartIso(todayISODate());
}

function unifiedWeekMatchesContract(week = null, contract = readApprovedRecruitContract()) {
  if (typeof DominionAtlasProgramRepair !== "undefined") {
    return DominionAtlasProgramRepair.weekLinkedToContract(week, contract);
  }
  return Boolean(week && contract?.id
    && week.contractId === contract.id
    && Number(week.contractRevision || 0) === Number(contract.revision || 0));
}

function unifiedWeekDisposition(week = null, contract = readApprovedRecruitContract()) {
  if (typeof DominionAtlasProgramRepair !== "undefined") {
    return DominionAtlasProgramRepair.calendarDisposition(week, contract, todayISODate());
  }
  if (!week) return "MISSING";
  if (unifiedWeekMatchesContract(week, contract)) return "CURRENT_CONTRACT";
  if (week.weekStart <= todayISODate() && week.weekEnd >= todayISODate() && week.status !== "REPLACED") return "PROTECTED_CURRENT_WEEK";
  return week.weekEnd < todayISODate() ? "EXPIRED_LEGACY_WEEK" : "STALE_CONTRACT_WEEK";
}

function nutritionBaselineForUnifiedWeek(weekStart = unifiedWeekTargetStart()) {
  if (typeof DominionWeeklyOrchestrator === "undefined" || typeof activeNutritionBaseline !== "function") return null;
  const planningDate = DominionWeeklyOrchestrator.planningDateForWeek(weekStart, todayISODate());
  return activeNutritionBaseline(planningDate);
}

function nutritionBaselineReference(baseline = null) {
  return baseline?.id || baseline?.approvedAt || null;
}

function unifiedWeekSourceSignature(week = null) {
  if (!week) return "";
  return JSON.stringify({
    contractId: week.contractId || null,
    contractRevision: Number(week.contractRevision || 0),
    generatedBy: week.generatedBy || null,
    programId: week.programId || null,
    sourceRefs: week.sourceRefs || {},
    placements: (week.placementDecisions || []).map((item) => `${item.activityId}:${item.scheduledDate}`),
    blocking: (week.conflicts || []).filter((item) => item.severity === "BLOCKING").map((item) => item.code).sort()
  });
}

async function refreshUnifiedWeekDraftForPlans({ force = false, contractHandoff = false } = {}) {
  const existing = readUnifiedWeekDraft();
  if (typeof DominionWeeklyOrchestrator === "undefined") return false;
  const contract = readApprovedRecruitContract();
  const active = contractHandoff ? readCommittedUnifiedWeek(todayISODate()) : null;
  const existingMatchesContract = unifiedWeekMatchesContract(existing, contract);
  const targetWeekStart = active
    ? DominionWeeklyOrchestrator.addDays(active.weekStart, 7)
    : existingMatchesContract ? existing.weekStart : unifiedWeekTargetStart();
  const refreshed = buildUnifiedWeekDraft(targetWeekStart);
  if (!refreshed) return false;
  if (!force && existingMatchesContract && unifiedWeekSourceSignature(existing) === unifiedWeekSourceSignature(refreshed)) return false;
  saveWeeklyOrchestrationLocal("DRAFT", "current", refreshed);
  await persistWeeklyOrchestrationState("DRAFT", "current", refreshed);
  return true;
}

async function refreshUnifiedWeekDraftForNutrition() {
  return refreshUnifiedWeekDraftForPlans();
}

function buildUnifiedWeekDraft(weekStart = unifiedWeekTargetStart()) {
  if (typeof DominionWeeklyOrchestrator === "undefined") return null;
  const contract = readApprovedRecruitContract();
  const draft = DominionWeeklyOrchestrator.buildUnifiedWeek({
    contract,
    strengthPlan: readApprovedStrengthPlan(),
    runningBlock: readApprovedRunningBlock(),
    corePlan: readApprovedCorePlan(),
    nutritionBaseline: nutritionBaselineForUnifiedWeek(weekStart)
  }, {
    today: todayISODate(),
    weekStart,
    programId: `atlas-program:${contract?.id || "contract"}:r${Number(contract?.revision || 0)}`,
    generatedAt: new Date().toISOString()
  });
  return applyContractActivationGuards(draft, weekStart);
}

function applyContractActivationGuards(draft = null, weekStart = unifiedWeekTargetStart()) {
  if (!draft || typeof DominionContractActivation === "undefined") return draft;
  const state = DominionContractActivation.buildActivation(contractActivationInputs(weekStart, {
    weekDraft: null,
    committedWeeks: [],
    currentWeek: null
  }));
  const pending = (state.modules || []).filter((item) => item.included && !item.complete);
  if (!pending.length) return draft;
  const activationConflicts = pending.map((item) => ({
    code: `${item.id.toUpperCase()}_CONTRACT_LINK_REQUIRED`,
    severity: "BLOCKING",
    module: item.id.toUpperCase(),
    date: null,
    detail: `${item.label} must be approved against Recruit Contract ${readApprovedRecruitContract()?.revision || "current"} before this week can be committed.`
  }));
  const conflicts = [...(draft.conflicts || []).filter((item) => !String(item.code || "").endsWith("_CONTRACT_LINK_REQUIRED")), ...activationConflicts];
  return {
    ...draft,
    conflicts,
    blockingConflictCount: conflicts.filter((item) => item.severity === "BLOCKING").length,
    advisoryCount: conflicts.filter((item) => item.severity === "ADVISORY").length,
    approvalBlocked: true,
    message: "Link every required plan to the current Recruit Contract before committing this week."
  };
}

async function saveUnifiedWeekDraftForActivation(weekStart = unifiedWeekTargetStart()) {
  const draft = buildUnifiedWeekDraft(weekStart);
  if (!draft) return null;
  saveWeeklyOrchestrationLocal("DRAFT", "current", draft);
  await persistWeeklyOrchestrationState("DRAFT", "current", draft);
  renderWeeklyOrchestrator();
  renderContractActivation();
  return draft;
}

function atlasWeekAutopilotInput(overrides = {}) {
  const contract = readApprovedRecruitContract();
  const activeWeek = overrides.activeWeek === undefined ? readCommittedUnifiedWeek(todayISODate()) : overrides.activeWeek;
  const targetWeekStart = typeof DominionAtlasWeekAutopilot !== "undefined"
    ? DominionAtlasWeekAutopilot.targetWeekStart({ activeWeek, today: todayISODate() })
    : unifiedWeekTargetStart();
  return {
    today: todayISODate(),
    contract,
    receipt: readAtlasProgramReceipt(),
    plans: currentAtlasActivePlans(contract),
    activeWeek,
    futureWeek: overrides.futureWeek === undefined ? readCommittedUnifiedWeekByStart(targetWeekStart) : overrides.futureWeek,
    draft: overrides.draft === undefined ? readUnifiedWeekDraft() : overrides.draft,
    adaptation: overrides.adaptation === undefined ? buildCurrentAtlasAdaptiveWeek() : overrides.adaptation
  };
}

function buildCurrentAtlasWeekAutopilot(overrides = {}) {
  if (typeof DominionAtlasWeekAutopilot === "undefined") return null;
  currentAtlasWeekAutopilot = DominionAtlasWeekAutopilot.buildAutopilot(atlasWeekAutopilotInput(overrides));
  return currentAtlasWeekAutopilot;
}

async function runAtlasWeekAutopilot() {
  if (typeof DominionAtlasWeekAutopilot === "undefined" || typeof DominionWeeklyOrchestrator === "undefined") return null;
  const initialInput = atlasWeekAutopilotInput();
  let model = DominionAtlasWeekAutopilot.buildAutopilot(initialInput);
  if (["ACTIVATION_REQUIRED", "REVIEW_REQUIRED", "ADAPTATION_REVIEW", "MONITORING", "COMMITTED"].includes(model.status)) {
    currentAtlasWeekAutopilot = model;
    return model;
  }

  let draft = initialInput.draft?.weekStart === model.targetWeekStart ? initialInput.draft : null;
  const adaptiveDecision = initialInput.adaptation;
  if (adaptiveDecision?.status === "APPROVED"
    && typeof DominionAtlasAdaptiveWeek !== "undefined"
    && !DominionAtlasAdaptiveWeek.draftMatchesDecision(draft, adaptiveDecision)) {
    draft = buildUnifiedWeekDraft(model.targetWeekStart);
    if (draft) draft = DominionAtlasAdaptiveWeek.applyToDraft(draft, adaptiveDecision);
  }
  if (!draft) draft = buildUnifiedWeekDraft(model.targetWeekStart);
  if (!draft) {
    currentAtlasWeekAutopilot = model;
    return model;
  }

  saveWeeklyOrchestrationLocal("DRAFT", "current", draft);
  await persistWeeklyOrchestrationState("DRAFT", "current", draft);
  model = DominionAtlasWeekAutopilot.buildAutopilot(atlasWeekAutopilotInput({ draft, futureWeek: null, adaptation: adaptiveDecision }));
  currentAtlasWeekAutopilot = model;
  if (model.status !== "READY_TO_COMMIT") return model;

  const approved = await commitUnifiedWeekDraft({ autopilotModel: model, adaptation: adaptiveDecision, deferRender: true });
  currentAtlasWeekAutopilot = DominionAtlasWeekAutopilot.buildAutopilot(atlasWeekAutopilotInput({
    draft: null,
    futureWeek: approved,
    adaptation: adaptiveDecision
  }));
  return currentAtlasWeekAutopilot;
}

async function commitUnifiedWeekDraft(options = {}) {
  const draft = readUnifiedWeekDraft();
  if (!draft || typeof DominionWeeklyOrchestrator === "undefined") return null;
  const contract = readApprovedRecruitContract();
  const activeWeek = readCommittedUnifiedWeek(todayISODate());
  const isNextWeek = Boolean(activeWeek && draft.weekStart === addClosedLoopDays(activeWeek.weekStart, 7));
  if (isNextWeek && typeof DominionRecruitProofWeek !== "undefined") {
    const proofWeek = buildCurrentRecruitProofWeek({
      date: todayISODate(),
      week: activeWeek,
      contract,
      operatingContractRevision: Number(activeWeek.contractRevision || 0)
    });
    if (!proofWeek?.canAdvance) throw new Error(proofWeek?.repair?.detail || "Secure and finalize the current week before committing the next one.");
  }
  const receipt = readAtlasProgramReceipt();
  const adaptation = options.adaptation || buildCurrentAtlasAdaptiveWeek();
  const autopilotCommit = typeof DominionAtlasWeekAutopilot !== "undefined"
    && DominionAtlasWeekAutopilot.canAutoCommit(options.autopilotModel, { contract, receipt, draft, adaptation });
  const verifiedPackageCommit = typeof DominionAtlasActivation !== "undefined"
    && DominionAtlasActivation.canCommitCalendarFromPreflight(options.activationPreflight, {
      contract,
      weekDraft: draft
    });
  const activation = typeof DominionContractActivation === "undefined"
    ? null
    : DominionContractActivation.buildActivation(contractActivationInputs(draft.weekStart));
  if (!verifiedPackageCommit && !autopilotCommit && activation && activation.next.action !== "COMMIT_WEEK") {
    throw new Error("Finish the Contract activation steps before committing this week.");
  }
  const history = readUnifiedWeekHistory();
  const previous = history.find((item) => item.status !== "REPLACED" && item.weekStart === draft.weekStart) || null;
  const approvedAt = new Date().toISOString();
  const approvedBase = DominionWeeklyOrchestrator.approveWeek(draft, previous, { approvedAt });
  const approved = autopilotCommit ? {
    ...approvedBase,
    atlasWeekAutopilot: DominionAtlasWeekAutopilot.buildCommitReceipt(options.autopilotModel, approvedBase, {
      committedAt: approvedAt,
      contractId: contract?.id || null,
      contractRevision: contract?.revision || 0,
      adaptation
    })
  } : approvedBase;
  const nextHistory = DominionWeeklyOrchestrator.mergeCommittedWeek(history, approved);
  saveWeeklyOrchestrationLocal("HISTORY", "current", nextHistory);
  saveWeeklyOrchestrationLocal("WEEK", approved.weekStart, approved);
  const strengthSchedule = DominionWeeklyOrchestrator.strengthScheduleFromWeek(approved);
  saveStrengthStateLocal("SCHEDULE", `unifieth} steps` : `${execution.session?.distance || currentRunningPrescription()?.session?.distance || "-"} ${execution.session?.unit || currentRunningPrescription()?.session?.unit || ""}`.trim(),
      secondary: active?.title || (sessionModel.state === "REVIEW" ? "Review the run" : "Follow the prescribed run"),
      restUntil: null,
      advanceLabel: active?.kind === "RECOVER" ? "Recovery done" : "Complete step",
      advanceEnabled: sessionModel.state === "IN_PROGRESS" && Boolean(active)
    };
  }
  if (module === "CORE") {
    const prescription = currentCorePrescription();
    const exercises = prescription?.exercises || [];
    const complete = Object.values(execution.completedExercises || {}).filter(Boolean).length;
    const active = exercises.find((exercise) => !execution.completedExercises?.[exercise.id]);
    return {
      primary: `${complete}/${exercises.length} movements`,
      secondary: active ? `Next: ${active.name}` : exercises.length ? "Ready to finish" : "Core prescription unavailable",
      restUntil: null,
      advanceLabel: "Complete movement",
      advanceEnabled: sessionModel.state === "IN_PROGRESS" && Boolean(active)
    };
  }
  return { primary: sessionModel.state, secondary: sessionModel.title, advanceEnabled: false };
}

function renderMissionExecution() {
  const section = document.getElementById("mission-execution");
  const panel = document.getElementById("mission-execution-panel");
  const badge = document.getElementById("mission-execution-state");
  if (!section || !panel || !badge || typeof DominionMissionExecution === "undefined") return;
  const model = buildCurrentMissionCockpit();
  if (!model) return;
  const contractPolicy = contractConflictExecutionPolicy();
  if (contractPolicy.blocked) {
    section.dataset.missionState = "PROTECTED";
    badge.textContent = "CHOICE REQUIRED";
    badge.className = "state-pill red";
    panel.innerHTML = `<article class="mission-player protected"><div class="mission-player-command"><span>READ-ONLY PREVIEW</span><h3>Mission protected</h3><p>${escapeHtml(contractPolicy.detail)}</p></div><div class="mission-primary-actions"><button type="button" data-unified-blocker-action="RESOLVE_CONTINUITY">Compare and choose saved Contract</button></div><footer class="mission-evidence-strip"><small>Completed assignments and raw evidence remain authoritative.</small></footer></article>`;
    return;
  }
  const receipts = readMissionExecutionReceipts();
  const debriefs = readMissionDebriefs();
  const pendingDebrief = typeof DominionMissionDebrief === "undefined" ? null : DominionMissionDebrief.pendingDebrief({ cockpit: model, receipts, debriefs });
  const latestDebrief = debriefs[0] || null;
  const handoff = latestDebrief?.coachingDecision || null;
  const recoveryOrder = latestDebrief && handoff ? ensureMissionRecoveryOrder(latestDebrief, handoff) : null;
  const recoveryProgress = recoveryOrder && typeof DominionMissionRecovery !== "undefined" ? DominionMissionRecovery.progress(recoveryOrder) : null;
  const handoffBlocksCurrent = ["SAFETY_HOLD", "RECOVER_AND_REVIEW"].includes(handoff?.code)
    || (model.current?.locked && handoff?.code === "RECOVER_BETWEEN_SESSIONS");
  const recoveryBlocksCurrent = recoveryProgress && !recoveryProgress.complete;
  const showHandoff = !pendingDebrief && handoff && (model.complete || model.protected || handoffBlocksCurrent || recoveryBlocksCurrent);
  const displayState = pendingDebrief ? "DEBRIEF" : showHandoff && recoveryBlocksCurrent ? "RECOVERING" : model.state;
  section.dataset.missionState = displayState;
  badge.textContent = displayState.replaceAll("_", " ");
  badge.className = `state-pill ${missionExecutionTone(displayState)}`;
  const windows = model.windows.map((window) => {
    const locked = window.sessions.some((sessionModel) => sessionModel.locked);
    const status = window.complete ? "COMPLETE" : locked ? "LOCKED" : window.active ? "LIVE" : window.held ? "PROTECTED" : "READY";
    return `<article class="mission-window ${status.toLowerCase()}">
      <header><span>${escapeHtml(window.label)}</span><strong>${escapeHtml(status)}</strong></header>
      ${window.sessions.map((sessionModel) => `<div><span>${escapeHtml(sessionModel.module === "RUNNING" ? "CARDIO" : sessionModel.module)}</span><strong>${escapeHtml(sessionModel.title)}</strong><small>${sessionModel.estimatedMinutes ? `${sessionModel.estimatedMinutes} min` : escapeHtml(sessionModel.type.replaceAll("_", " "))}</small></div>`).join("")}
    </article>`;
  }).join("");
  const current = model.current;
  const metrics = current ? missionSessionMetrics(current) : null;
  const isReview = current?.state === "REVIEW";
  const allCoreComplete = current?.module === "CORE" && metrics && !metrics.advanceEnabled && current.state === "IN_PROGRESS";
  const liveControls = current?.active ? `<div class="mission-live-controls">
    ${metrics?.advanceEnabled ? `<button type="button" data-mission-action="advance" data-mission-module="${escapeHtml(current.module)}">${escapeHtml(metrics.advanceLabel)}</button>` : ""}
    ${["STRENGTH", "RUNNING"].includes(current.module) && current.state === "IN_PROGRESS" ? `<button type="button" class="ghost" data-mission-action="pause" data-mission-module="${escapeHtml(current.module)}">Pause</button>` : ""}
    ${current.state !== "REVIEW" ? `<button type="button" class="ghost" data-mission-action="finish" data-mission-module="${escapeHtml(current.module)}" ${current.module === "CORE" && !allCoreComplete ? "disabled" : ""}>Finish session</button>` : ""}
    <button type="button" class="ghost danger-action" data-mission-action="pain" data-mission-module="${escapeHtml(current.module)}">Report pain</button>
  </div>` : "";
  const reviewFields = isReview && current?.module === "RUNNING"
    ? runningActualReviewMarkup("mission", readRunningExecution() || {}, currentRunningPrescription())
    : isReview ? `<div class="mission-review-fields">
    <label>Session note <input data-mission-review-notes maxlength="280" placeholder="Optional context"></label>
  </div>` : current?.module === "CORE" && allCoreComplete ? `<div class="mission-review-fields core">
    <label>Quality <select data-mission-core-quality><option value="CONTROLLED">Controlled</option><option value="TECHNIQUE_LIMITED">Technique limited</option></select></label>
    <label>Effort <input data-mission-core-effort type="number" min="1" max="10" value="7"></label>
  </div>` : "";
  const standardPlayer = current ? `<article class="mission-player ${escapeHtml(current.state.toLowerCase())}">
    <div class="mission-player-order"><span>${escapeHtml(current.windowLabel)}</span><small>${escapeHtml(current.module === "RUNNING" ? "CARDIO" : current.module)}</small></div>
    <div class="mission-player-command"><span>${current.active ? "LIVE ORDER" : current.locked ? "WAIT" : current.held ? "SAFETY" : "NEXT ORDER"}</span><h3>${escapeHtml(current.title)}</h3><p>${escapeHtml(model.primary.detail)}</p></div>
    <div class="mission-player-metrics"><div><span>Progress</span><strong>${escapeHtml(metrics?.primary || current.state)}</strong></div><div><span>Now</span><strong>${escapeHtml(metrics?.secondary || current.title)}</strong></div>${metrics?.restUntil ? `<div><span>Rest</span><strong data-strength-rest-until="${escapeHtml(metrics.restUntil)}">--</strong></div>` : ""}</div>
    ${reviewFields}
    <div class="mission-primary-actions">
      <button type="button" data-mission-action="primary" data-mission-code="${escapeHtml(model.primary.code)}" data-mission-module="${escapeHtml(model.primary.module || current.module)}" ${model.primary.code === "COMPLETE" ? "disabled" : ""}>${escapeHtml(model.primary.label)}</button>
      <button type="button" class="ghost" data-mission-action="open" data-mission-module="${escapeHtml(current.module)}">Open details</button>
    </div>
    ${liveControls}
  </article>` : `<article class="mission-player empty"><div><span class="kicker">${model.complete ? "MISSION COMPLETE" : "CALENDAR REQUIRED"}</span><h3>${model.complete ? "Today's work is secured" : "No executable training order"}</h3><p>${escapeHtml(model.primary.detail)}</p></div><button type="button" data-mission-action="primary" data-mission-code="${escapeHtml(model.primary.code)}">${escapeHtml(model.primary.label)}</button></article>`;
  const player = pendingDebrief ? renderMissionDebriefForm(pendingDebrief) : showHandoff ? renderMissionHandoff(handoff, recoveryOrder) : standardPlayer;
  panel.innerHTML = `<div class="mission-progress"><span style="width:${model.percent}%"></span></div>
    <div class="mission-window-grid">${windows || `<article class="mission-window ready"><header><span>TODAY</span><strong>NO ORDER</strong></header></article>`}</div>
    ${player}
    <footer class="mission-evidence-strip"><div><span>Assignments verified</span><strong>${model.completed} of ${model.total || 0}</strong></div><div><span>Debriefs</span><strong>${debriefs.length}</strong></div><small>Execution, recovery, safety, and Atlas evidence reconcile here once.</small></footer>`;
  startStrengthRestCountdown();
}

function openMissionSessionDetails(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  const context = document.getElementById("today-more-context");
  if (context) context.open = true;
  if (code === "STRENGTH") {
    const detail = document.querySelector(".today-workout-detail");
    if (detail) detail.open = true;
    renderDailyAssignment();
    detail?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (code === "CORE") {
    const detail = document.getElementById("today-core-detail");
    if (detail) detail.open = true;
    renderCoreToday();
    detail?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  setActiveSection("performance");
  setPerformanceActiveView("running");
  window.history.replaceState(null, "", "#performance");
  renderRunningCommand();
  document.getElementById("running-command-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function startMissionSession(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  const verification = currentMorningVerification();
  if (verification?.dailyOverride?.trainingAllowed === false) throw new Error("Today is recovery only. Complete the recovery order before loaded training.");
  if (code === "STRENGTH") {
    const assignment = buildCurrentDailyAssignment();
    let execution = readDailyAssignmentExecution();
    if (!assignment?.exercises?.length || assignment.state === "RECOVERY ONLY") throw new Error("Strength is not cleared to start.");
    execution = execution.state === "PAUSED"
      ? DominionStrengthTraining.resumeWorkout(execution, new Date().toISOString())
      : DominionStrengthTraining.startWorkout(execution, currentStrengthPrescription(), new Date().toISOString());
    await saveDailyAssignmentExecution(execution);
  } else if (code === "RUNNING") {
    const prescription = currentRunningPrescription();
    if (!prescription?.session || ["PAIN_HOLD", "REST_DAY"].includes(prescription.status)) throw new Error("Running is not cleared to start.");
    const plan = readApprovedRunningPlan();
    const execution = {
      ...DominionMissionExecution.startRunningExecution(prescription, readRunningExecution(), new Date().toISOString()),
      assignmentId: currentRunningCalendarAssignment()?.assignmentId || prescription.session.id || null,
      blockId: plan?.blockId || null,
      blockRevision: plan?.blockRevision || null,
      weekStart: plan?.weekStart || null
    };
    window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
    await persistRunningState("EXECUTION", todayISODate(), execution);
  } else if (code === "CORE") {
    const prescription = currentCorePrescription();
    const execution = DominionCoreProgramming.startExecution(prescription, new Date().toISOString());
    if (!execution) throw new Error("Core is not cleared to start.");
    saveCoreProgramLocal("EXECUTION", todayISODate(), execution);
    await persistCoreProgramState("EXECUTION", todayISODate(), execution);
  }
  setText("mission-execution-feedback", `${code === "RUNNING" ? "Cardio" : code.charAt(0) + code.slice(1).toLowerCase()} started. Follow the live order below.`);
}

async function resumeMissionSession(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  if (code === "STRENGTH") {
    const execution = DominionStrengthTraining.resumeWorkout(readDailyAssignmentExecution(), new Date().toISOString());
    await saveDailyAssignmentExecution(execution);
  } else if (code === "RUNNING") {
    const execution = {
      ...DominionMissionExecution.resumeRunningExecution(readRunningExecution() || {}, new Date().toISOString()),
      assignmentId: readRunningExecution()?.assignmentId || currentRunningCalendarAssignment()?.assignmentId || null
    };
    window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
    await persistRunningState("EXECUTION", todayISODate(), execution);
  }
}

async function advanceMissionSession(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  if (code === "STRENGTH") {
    openMissionSessionDetails(code);
    return;
  }
  if (code === "RUNNING") {
    const execution = DominionMissionExecution.completeRunningSegment(readRunningExecution() || {}, null, new Date().toISOString());
    window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
    await persistRunningState("EXECUTION", todayISODate(), execution);
    setText("mission-execution-feedback", execution.state === "REVIEW" ? "All run steps are complete. Save the session evidence." : "Step complete. The next interval is ready.");
  }
  if (code === "CORE") {
    const prescription = currentCorePrescription();
    const current = readCurrentCoreExecution() || {};
    const next = prescription?.exercises?.find((exercise) => !current.completedExercises?.[exercise.id]);
    if (!next) return;
    const execution = DominionCoreProgramming.completeExercise(current, next.id);
    saveCoreProgramLocal("EXECUTION", todayISODate(), execution);
    await persistCoreProgramState("EXECUTION", todayISODate(), execution);
    setText("mission-execution-feedback", `${next.name} complete.`);
  }
}

async function pauseMissionSession(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  if (code === "STRENGTH") {
    await saveDailyAssignmentExecution(DominionStrengthTraining.pauseWorkout(readDailyAssignmentExecution(), new Date().toISOString()));
  } else if (code === "RUNNING") {
    const execution = DominionMissionExecution.pauseRunningExecution(readRunningExecution() || {}, new Date().toISOString());
    window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
    await persistRunningState("EXECUTION", todayISODate(), execution);
  }
  setText("mission-execution-feedback", "Session paused. Inactive time is excluded.");
}

async function prepareMissionSessionFinish(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  if (code === "STRENGTH") {
    await saveDailyAssignmentExecution(DominionStrengthTraining.prepareWorkoutReview(readDailyAssignmentExecution(), new Date().toISOString()));
  } else if (code === "RUNNING") {
    const execution = DominionMissionExecution.prepareRunningReview(readRunningExecution() || {}, new Date().toISOString());
    window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
    await persistRunningState("EXECUTION", todayISODate(), execution);
  } else if (code === "CORE") {
    const prescription = currentCorePrescription();
    const quality = document.querySelector("[data-mission-core-quality]")?.value || "CONTROLLED";
    const effort = Number(document.querySelector("[data-mission-core-effort]")?.value || 7);
    const result = DominionCoreProgramming.completeSession(readCurrentCoreExecution() || {}, prescription, { quality, effort, completedAt: new Date().toISOString() });
    if (!result.valid) throw new Error(result.message);
    const history = [...readCoreHistory().filter((item) => !(item.planId === result.execution.planId && item.date === todayISODate())), result.execution];
    saveCoreProgramLocal("EXECUTION", todayISODate(), result.execution);
    saveCoreProgramLocal("HISTORY", "current", history);
    await persistCoreProgramState("EXECUTION", todayISODate(), result.execution);
    await persistCoreProgramState("HISTORY", "current", history);
    await saveCorePerformanceEvidence(prescription, result.execution);
    await saveMissionExecutionReceipt("CORE", result.execution, buildCurrentMissionCockpit()?.current || {}, prescription);
    await reconcileAtlasProgressionOrder({ render: false });
  }
  setText("mission-execution-feedback", code === "CORE" ? "Core complete. Evidence saved automatically." : "Review the completed work, then save one evidence receipt.");
}

async function finalizeRunningSession(context = "mission") {
  const validation = readRunningActualReview(context);
  const feedback = document.querySelector(`[data-running-actual-review="${context}"] [data-running-actual-feedback]`);
  if (!validation.valid) {
    const message = validation.errors[0]?.message || "Enter the actual run result.";
    if (feedback) feedback.textContent = message;
    const error = new Error(message);
    error.preserveSurface = true;
    throw error;
  }
  const prescription = currentRunningPrescription();
  const current = readRunningExecution() || {};
  const completedAt = new Date().toISOString();
  const reviewed = ["IN_PROGRESS", "PAUSED"].includes(current.state)
    ? DominionMissionExecution.prepareRunningReview(current, completedAt)
    : current;
  const base = DominionMissionExecution.finishRunningExecution(reviewed, { notes: validation.actual.notes }, completedAt);
  const verdict = DominionRunningVerdict.buildVerdict(prescription || { session: current.session }, validation.actual, reviewed);
  const execution = DominionRunningVerdict.applyActual(base, validation.actual, verdict, completedAt);
  window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
  await persistRunningState("EXECUTION", todayISODate(), execution);
  await saveMissionExecutionReceipt("RUNNING", execution, buildCurrentMissionCockpit()?.current || {}, prescription);
  await reconcileAtlasProgressionOrder({ render: false });
  setText("running-command-feedback", `${verdict.headline}. Actual distance and time are now the canonical run evidence.`);
  setText("mission-execution-feedback", `${verdict.headline}. Actual distance and time are secured.`);
  renderRunningCommand();
  renderTodayCommittedWeek();
  renderMissionExecution();
  return execution;
}

async function finalizeMissionSession(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  const item = buildCurrentMissionCockpit()?.current || {};
  const notes = document.querySelector("[data-mission-review-notes]")?.value || "";
  if (code === "STRENGTH") {
    let execution = DominionStrengthTraining.finishWorkout({ ...readDailyAssignmentExecution(), reviewNotes: notes }, { notes }, new Date().toISOString());
    execution = attachStrengthCompletionReport(execution);
    await saveDailyAssignmentExecution(execution);
    await preserveStrengthWorkout(execution);
    await saveMissionExecutionReceipt(code, execution, item, currentStrengthPrescription());
  } else if (code === "RUNNING") await finalizeRunningSession("mission");
}

async function reportMissionPain(module = "STRENGTH") {
  const code = String(module || "STRENGTH").toUpperCase();
  const item = buildCurrentMissionCockpit()?.current || {};
  if (code === "STRENGTH") {
    let execution = DominionStrengthTraining.reportPain(readDailyAssignmentExecution(), new Date().toISOString());
    execution = attachStrengthCompletionReport(execution);
    await saveDailyAssignmentExecution(execution);
    await preserveStrengthWorkout(execution);
    await saveMissionExecutionReceipt(code, execution, item, currentStrengthPrescription());
  } else if (code === "RUNNING") {
    const execution = DominionMissionExecution.reportRunningPain(readRunningExecution() || {}, new Date().toISOString());
    window.localStorage.setItem(runningExecutionStorageKey(), JSON.stringify(execution));
    await persistRunningState("EXECUTION", todayISODate(), execution);
    await saveMissionExecutionReceipt(code, execution, item, currentRunningPrescription());
  } else if (code === "CORE") {
    const current = readCurrentCoreExecution() || { planId: currentCorePrescription()?.planId, sessionId: currentCorePrescription()?.session?.id, date: todayISODate(), completedExercises: {} };
    const execution = DominionCoreProgramming.reportPain(current, new Date().toISOString());
    const history = [...readCoreHistory().filter((saved) => !(saved.planId === execution.planId && saved.date === todayISODate())), execution];
    saveCoreProgramLocal("EXECUTION", todayISODate(), execution);
    saveCoreProgramLocal("HISTORY", "current", history);
    await persistCoreProgramState("EXECUTION", todayISODate(), execution);
    await persistCoreProgramState("HISTORY", "current", history);
    await saveMissionExecutionReceipt(code, execution, item, currentCorePrescription());
    await reconcileAtlasProgressionOrder({ render: false });
  }
  setText("mission-execution-feedback", "Pain hold saved. Stop the session and update Roll Call before more training.");
}

function refreshMissionExecutionSurfaces() {
  renderMissionExecution();
  renderMissionExecutionSpine();
  renderTodayCommittedWeek();
  renderDailyAssignment();
  renderCoreToday();
  renderRunningCommand();
  renderDailyCoachingLoop();
}

function recruitContractGoalLabel(value = "") {
  return {
    BALANCED_FITNESS: "Balanced fitness",
    BUILD_STRENGTH: "Build strength",
    RUN_FASTER: "Run faster",
    BUILD_ENDURANCE: "Build endurance",
    LOSE_FAT: "Lose fat"
  }[value] || String(value || "").replaceAll("_", " ");
}

function recruitContractNutritionLabel(value = "") {
  return {
    TRACK_DAILY: "Track daily",
    TRACK_5_DAYS: "Track 5 days/week",
    PROTEIN_FIRST: "Protein first",
    FOUNDATION_ONLY: "Foundation habits"
  }[value] || String(value || "").replaceAll("_", " ");
}

function hydrateRecruitContractForm(value = {}) {
  const form = document.getElementById("recruit-contract-form");
  if (!form || typeof DominionRecruitContract === "undefined") return;
  const contract = DominionRecruitContract.normalizeContractDraft(value, { today: todayISODate() });
  Object.entries(contract).forEach(([name, fieldValue]) => {
    const field = form.elements.namedItem(name);
    if (!field) return;
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = fieldValue === true;
      return;
    }
    field.value = fieldValue ?? "";
  });
  const runningFields = form.querySelector("[data-recruit-running-fields]");
  if (runningFields) runningFields.hidden = contract.runningDaysPerWeek === 0;
  renderContractAthleteType(contract.trainingYears);
  renderRecruitContractSetupStep();
}

function renderContractAthleteType(trainingYears) {
  const output = document.getElementById("contract-athlete-type");
  if (!output || typeof DominionRecruitContract === "undefined") return;
  const type = DominionRecruitContract.deriveAthleteType(trainingYears);
  const labels = {
    FOUNDATION: "Foundation athlete Â· 0â€“1 years",
    DEVELOPING: "Developing athlete Â· 2â€“3 years",
    TRAINED: "Trained athlete Â· 4â€“7 years",
    VETERAN: "Veteran athlete Â· 8+ years"
  };
  output.querySelector("strong").textContent = labels[type] || "Complete training history";
  output.classList.toggle("complete", Boolean(type));
}

function recruitContractFromForm() {
  const form = document.getElementById("recruit-contract-form");
  if (!form || typeof DominionRecruitContract === "undefined") return null;
  const existing = readRecruitContractDraft();
  const approved = readApprovedRecruitContract();
  const input = Object.fromEntries(new FormData(form).entries());
  const options = {
    today: todayISODate(),
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  if (approved && typeof DominionRecruitContract.buildRecruitContractAmendment === "function") {
    return DominionRecruitContract.buildRecruitContractAmendment(
      approved,
      input,
      readRecruitOnboardingState()?.profile || {},
      options
    );
  }
  return DominionRecruitContract.buildRecruitContract(input, options);
}

async function saveRecruitContractDraftFromForm({ render = false, announce = true } = {}) {
  const draft = recruitContractFromForm();
  if (!draft) return null;
  saveRecruitContractLocal("DRAFT", draft);
  if (render) renderRecruitContract();
  const approved = readApprovedRecruitContract();
  if (announce) {
    setText("recruit-contract-autosave-status", approved
      ? `Amendment saved on this device. Syncing to your accountâ€¦ Signed Contract ${approved.revision} remains active.`
      : "Contract draft saved on this device. Syncing to your accountâ€¦");
  }
  queueRecruitContractAccountSync(draft, recruitContractAutosaveRevision);
  return draft;
}

function recruitContractAutosaveFailure(error, phase = "current") {
  console.error("[contract:autosave] Draft save recovered without blocking the editor.", {
    phase,
    code: error?.code || null,
    message: error?.message || "Unknown autosave error"
  });
  setText(
    "recruit-contract-autosave-status",
    "Draft save was interrupted. Your signed Contract is unchanged; edit a field or press Continue to retry."
  );
}

function queueRecruitContractAccountSync(draft, revision = recruitContractAutosaveRevision) {
  const task = () => persistRecruitContractState("DRAFT", draft);
  recruitContractAutosavePromise = typeof DominionContractAutosave !== "undefined"
    ? DominionContractAutosave.enqueue(recruitContractAutosavePromise, task, recruitContractAutosaveFailure)
    : Promise.resolve(recruitContractAutosavePromise)
      .catch((error) => {
        recruitContractAutosaveFailure(error, "previous");
        return null;
      })
      .then(task)
      .catch((error) => {
        recruitContractAutosaveFailure(error, "current");
        return false;
      });
  recruitContractAutosavePromise.then((synced) => {
    if (revision !== recruitContractAutosaveRevision) return;
    const approved = readApprovedRecruitContract();
    setText("recruit-contract-autosave-status", approved
      ? synced
        ? `Amendment saved to your account. Signed Contract ${approved.revision} remains active until you sign the replacement.`
        : `Amendment saved on this device. Account sync is pending; Continue is available. Signed Contract ${approved.revision} remains active.`
      : synced
        ? "Contract draft saved to your account."
        : "Contract draft saved on this device. Account sync is pending; Continue is available.");
  });
  return recruitContractAutosavePromise;
}

async function saveRecruitContractDraftForNavigation() {
  window.clearTimeout(recruitContractAutosaveTimer);
  recruitContractAutosaveRevision += 1;
  try {
    return await saveRecruitContractDraftFromForm({ announce: false });
  } catch (error) {
    recruitContractAutosaveFailure(error, "navigation");
    return null;
  }
}

function updateRecruitContractAmendmentPreview(draft, approved = readApprovedRecruitContract()) {
  if (!draft || !approved) return;
  setText("contract-amendment-heading", draft.twoADays
    ? "Two-a-Days are ON in the draftâ€”not yet in force."
    : "Contract changes are savedâ€”not yet in force.");
  setText("contract-amendment-draft-capacity", draft.twoADays ? "TWO-A-DAYS ON" : "TWO-A-DAYS OFF");
  setText("contract-amendment-draft-detail", draft.twoADays ? "AM/PM Â· up to 240 min" : `${draft.sessionMinutes} min standard`);
  const editorSummary = document.getElementById("recruit-contract-editor-summary");
  if (editorSummary) editorSummary.textContent = `${recruitContractGoalLabel(draft.primaryGoal)} Â· ${draft.trainingDaysPerWeek} days Â· ${draft.twoADays ? "Two-a-Days" : `${draft.sessionMinutes} min`}`;
}

function queueRecruitContractAutosave() {
  window.clearTimeout(recruitContractAutosaveTimer);
  const revision = ++recruitContractAutosaveRevision;
  setText("recruit-contract-autosave-status", "Saving amendment draftâ€¦");
  recruitContractAutosaveTimer = window.setTimeout(async () => {
    try {
      const draft = await saveRecruitContractDraftFromForm({ announce: false });
      if (!draft || revision !== recruitContractAutosaveRevision) return;
      const approved = readApprovedRecruitContract();
      updateRecruitContractAmendmentPreview(draft, approved);
      setText("recruit-contract-autosave-status", approved
        ? `Amendment saved on this device. Syncing to your accountâ€¦ Signed Contract ${approved.revision} remains active.`
        : "Draft saved on this device. Syncing to your accountâ€¦");
      const status = document.getElementById("recruit-contract-status");
      if (status && approved) {
        status.textContent = "AMENDMENT UNSIGNED";
        status.className = "state-pill yellow";
      }
    } catch (error) {
      recruitContractAutosaveFailure(error, "local");
    }
  }, 350);
}

function recruitContractStateTone(status = "") {
  if (["APPROVED", "READY_TO_STAGE", "PLAN_LINKED"].includes(status)) return "green";
  if (["READY_FOR_APPROVAL", "BASELINE_REQUIRED", "TARGETS_REQUIRED", "SCHEDULED", "PLAN_REVIEW"].includes(status)) return "yellow";
  if (status === "REVIEW_REQUIRED") return "red";
  return "neutral";
}

function renderRecruitContractSetupStep() {
  const form = document.getElementById("recruit-contract-form");
  if (!form) return;
  const step = Math.max(0, Math.min(4, Number(recruitContractSetupStep || 0)));
  form.querySelectorAll("[data-contract-form-step]").forEach((element) => {
    const elementStep = Number(element.dataset.contractFormStep);
    const runningExcluded = element.hasAttribute("data-recruit-running-fields")
      && Number(form.elements.namedItem("runningDaysPerWeek")?.value || 0) === 0;
    element.hidden = elementStep !== step || runningExcluded;
  });
  document.querySelectorAll("[data-contract-progress-step]").forEach((element) => {
    const elementStep = Number(element.dataset.contractProgressStep);
    element.classList.toggle("complete", elementStep < step);
    element.classList.toggle("current", elementStep === step);
    if (elementStep === step) element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  });
  const back = form.querySelector('[data-contract-experience-action="setup-back"]');
  const next = form.querySelector('[data-contract-experience-action="setup-next"]');
  if (back) back.hidden = step === 0;
  if (next) next.textContent = step === 3 ? "Review the Contract" : step === 4 ? "Read and sign" : "Continue";
  const stepMeta = typeof DominionContractExperience !== "undefined"
    ? DominionContractExperience.SETUP_STEPS[step]
    : null;
  const summary = document.getElementById("recruit-contract-editor-summary");
  if (summary && stepMeta) summary.textContent = stepMeta.prompt;
}

function routeRecruitContractReview(draft, { readyMessage = "Replacement Contract is ready. Read the change, enter your signature, and sign it into force." } = {}) {
  if (!draft || typeof DominionContractExperience === "undefined") return false;
  const route = DominionContractExperience.amendmentReviewRoute(draft);
  recruitContractSetupStep = route.step;
  renderRecruitContract();
  const editor = document.getElementById("recruit-contract-editor");
  if (editor) editor.open = true;
  if (route.ready) {
    setText("recruit-contract-feedback", readyMessage);
    document.getElementById("contract-signature-heading")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("contract-signer-name")?.focus({ preventScroll: true });
    return true;
  }
  setText("recruit-contract-feedback", `Fix before signing: ${route.errors.join(" ")}`);
  const field = document.querySelector(`#recruit-contract-form [name="${route.focusName}"]`);
  field?.scrollIntoView({ behavior: "smooth", block: "center" });
  field?.focus({ preventScroll: true });
  return false;
}

function contractIntegrityInputs() {
  return {
    weekDraft: readUnifiedWeekDraft(),
    committedWeeks: readUnifiedWeekHistory(),
    currentWeek: readCommittedUnifiedWeek(todayISODate())
  };
}

function currentContractCalendarIntegrity(contract = readApprovedRecruitContract()) {
  if (typeof DominionContractIntegrity === "undefined") return null;
  return DominionContractIntegrity.calendarIntegrity(contract, contractIntegrityInputs());
}

function contractIntegrityTone(status = "") {
  if (status === "ACTIVE") return "green";
  if (status === "DRAFT_MATCHED") return "yellow";
  if (status === "REPAIR_REQUIRED") return "red";
  return "neutral";
}

function contractAmendmentChangesMarkup(approved = null, draft = null) {
  if (!approved || !draft || typeof DominionContractIntegrity === "undefined") return "";
  const changes = DominionContractIntegrity.amendmentChanges(approved, draft);
  if (!changes.length) return `<div class="contract-amendment-diff empty"><strong>No operating changes detected.</strong><span>The replacement still requires a new signature before it can supersede Contract ${escapeHtml(String(approved.revision))}.</span></div>`;
  return `<div class="contract-amendment-diff"><div><span class="kicker">WHAT CHANGES</span><strong>${changes.length} operating term${changes.length === 1 ? "" : "s"}</strong></div><ul>${changes.map((change) => `<li><span>${escapeHtml(change.label)}</span><small>${escapeHtml(change.from)}</small><strong>${escapeHtml(change.to)}</strong></li>`).join("")}</ul></div>`;
}

function contractIntegrityMarkup(contract = null) {
  if (!contract || typeof DominionContractIntegrity === "undefined") return "";
  const integrity = currentContractCalendarIntegrity(contract);
  if (!integrity) return "";
  const receipt = DominionContractIntegrity.receiptMatchesContract(contract.handoffReceipt, contract)
    ? contract.handoffReceipt
    : null;
  const receiptChanges = receipt?.changes?.length
    ? receipt.changes.map((change) => change.label).join(", ")
    : "Initial Contract activation";
  const signedAt = receipt?.signedAt
    ? new Date(receipt.signedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : contract.signature?.signedAt
      ? new Date(contract.signature.signedAt).toLocaleString([], { dateStyle: "ëmyÚÚ$z{-®éÜj×öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢&6VçFW""Ò“°¢&WGW&ã°¢Ð¢–b†7F–öâÓÓÒ&Ö—76–öâÖ6ö×ÆWFR"’°Ð¢v—B6ö×ÆWFU&V6÷fW'”6öÖÖæB‚“°Ð¢v—B6ö×ÆWFTÖ—76–öå&V6÷fW'•F6²†'WGFöâæFF6WBç&V6÷fW'•F6´–BÇÂ""“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'FöF’×&V6÷fW'’ÖfVVF&6²"Â$7W'&VçB&V6÷fW'’7F–öâ6V7W&VBâF†R÷&FW"Gfæ6VBöæ6Râ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&Ö—76–öâ×VæFò"’°Ð¢v—B&V÷VäÖ—76–öå&V6÷fW'”÷&FW"‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'FöF’×&V6÷fW'’ÖfVVF&6²"Â%F†RÆ7B&V6÷fW'’7F–öâ—2÷Vâv–ââ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&Ö—76–öâ×&÷WFR"’°Ð¢&÷WFTÖ—76–öå&V6÷fW'•F6²†'WGFöâæFF6WBç&V6÷fW'•F6´–BÇÂ""“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6öÖÖæBÖ6ö×ÆWFR"’°Ð¢v—B6ö×ÆWFU&V6÷fW'”6öÖÖæB‚“°Ð¢6WEFW‡B‚'FöF’×&V6÷fW'’ÖfVVF&6²"Â%&V6÷fW'’6öÖÖæB6V7W&VBâFÆ2v–ÆÂ§VFvRF†R&W7VÇBv–ç7BF†RæW‡B&öÆÂ6ÆÂâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6öÖÖæB×VæFò"’°Ð¢v—B&V÷Vå&V6÷fW'”6öÖÖæB‚“°Ð¢6WEFW‡B‚'FöF’×&V6÷fW'’ÖfVVF&6²"Â%&V6÷fW'’6öÖÖæB&V÷VæVBf÷"FöF’â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6ö×ÆWFR"’°Ð¢6fTF–Ç”W†V7WF–öåVWVU7FFR‡²&V6÷fW'”6ö×ÆWFS¢G'VRÂ&V6÷fW'”6ö×ÆWFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'FöF’×&V6÷fW'’ÖfVVF&6²"Â%&V6÷fW'’7F–öâ&V6÷&FVBâFöF’w2Wf–FVæ6RæBF–Ç’6VÂ&RWFFVBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'VæFò"’°Ð¢6fTF–Ç”W†V7WF–öåVWVU7FFR‡²&V6÷fW'”6ö×ÆWFS¢fÇ6RÂ&V6÷fW'”6ö×ÆWFVDC¢çVÆÂÒ“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'FöF’×&V6÷fW'’ÖfVVF&6²"Â%&V6÷fW'’6ö×ÆWF–öâ&V÷VæVBf÷"FöF’â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&öÆÂÖ6ÆÂ"’°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&öÆÂÖ6ÆÂÖ6&B"“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷"‚r7&öÆÂÖ6ÆÂÖf÷&Ò¶æÖSÒ&VæW&w’%Òr“òæfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Wf–Wr"’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&V6÷fW'’"“°Ð¢&VæFW%&V6÷fW'•&Wf–Wr‚“°Ð¢ÐÐ¢Ò“°Ð¢&W7F÷&TçWG&—F–öä7F—fUf–Wr‚“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖf÷&Ò"’æFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â6fUW&f÷&Öæ6TVçG'’“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6R×&W6WB"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â&W6WEW&f÷&Öæ6Tf÷&Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖFöÖ–â"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â‚’Óâ²÷VÆFUW&f÷&Öæ6T7F—f—G”÷F–öç2†Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖFöÖ–â"’çfÇVR“²&Vg&W6…W&f÷&Öæ6Tf–VÆEf—6–&–Æ—G’‚“²Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖVçG'’×G—R"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â&Vg&W6…W&f÷&Öæ6Tf–VÆEf—6–&–Æ—G’“°Ð¢6öç7Bf—FæW757F'D'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f—FæW72×7F'BÖæWr×FW7B"“°Ð¢–b†f—FæW757F'D'WGFöâ’°Ð¢f—FæW757F'D'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢6öç7B&÷Fö6öÅ6VÆV7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f—FæW72×&÷Fö6öÂ×6VÆV7F÷""“°Ð¢6öç7B&÷Fö6öÄ6öFRÒ&÷Fö6öÅ6VÆV7CòçfÇVRÇÂ$5U5DôÕõDU5B#°Ð¢6öç7B&÷Fö6öÄæÖRÒ&÷Fö6öÅ6VÆV7Còæ÷F–öç5·&÷Fö6öÅ6VÆV7Bç6VÆV7FVD–æFW…ÓòçFW‡BÇÂ$7W7FöÒFW7B#°Ð¢6öç7BW†—7F–ætG&gBÒf—FæW75FW7DGFV×G2æf–æB‚†GFV×B’Óâ7G&–ær†GFV×Bç7FGW2’çFõWW$66R‚’ÓÓÒ$E$eB"bb7G&–ær†GFV×Bæ–B’ç7F'G5v—F‚‚&G&gBÒ"’“°Ð¢6öç7BG&gBÒW†—7F–ætG&gBÇÂ–æ—F–Æ—¦Tf—FæW75FW7DGFV×Ev÷&·76R‡°Ð¢–C¢G&gBÒG´FFRææ÷r‚—ÖÀÐ¢&÷Fö6öÄ6öFRÀÐ¢&÷Fö6öÄæÖRÀÐ¢7FGW3¢$E$eB"ÀÐ¢Wf–FVæ6U7FGW3¢%4TÄb$Uõ%DTB Ð¢Ò“°Ð¢6WD7F—fTf—FæW75FW7DGFV×B†G&gB“°Ð¢6öç7BæW‡DGFV×G2ÒW†—7F–ætG&gBòf—FæW75FW7DGFV×G2¢¶G&gBÂââæf—FæW75FW7DGFV×G5Ó°Ð¢W'6—7Df—FæW75FW7DGFV×G2†æW‡DGFV×G2“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢Ò“°Ð¢ÐÐ¢6öç7Bf—FæW74†—7F÷'”6öçF–æW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f—FæW72×FW7BÖ†—7F÷'’"“°Ð¢–b†f—FæW74†—7F÷'”6öçF–æW"’°Ð¢f—FæW74†—7F÷'”6öçF–æW"æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæ7F–öã°Ð¢–b†7F–öâÓÓÒ&f—FæW72×FW7B×&W7VÖR"’°Ð¢6öç7BGFV×BÒvWDf—FæW75FW7DGFV×D'”–B†'WGFöâæFF6WBæ–B“°Ð¢–b†GFV×B’°Ð¢6WD7F—fTf—FæW75FW7DGFV×B†GFV×B“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢ÐÐ¢–b†7F–öâÓÓÒ&f—FæW72×FW7BÖFVÆWFR"’°Ð¢6öç7BF&vWD–BÒ'WGFöâæFF6WBæ–C°Ð¢–b‚F&vWD–B’&WGW&ã°Ð¢6öç7BæW‡DGFV×G2Òf—FæW75FW7DGFV×G2æf–ÇFW"‚†GFV×B’Óâ7G&–ær†GFV×Bæ–B’ÓÒ7G&–ær‡F&vWD–B’“°Ð¢W'6—7Df—FæW75FW7DGFV×G2†æW‡DGFV×G2“°Ð¢–b…7G&–ær†7F—fTf—FæW75FW7DGFV×D–B’ÓÓÒ7G&–ær‡F&vWD–B’’°Ð¢7F—fTf—FæW75FW7DGFV×D–BÒçVÆÃ°Ð¢ÐÐ¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&f—FæW72×FW7B×6fR"’°Ð¢6öç7BWFFVDGFV×BÒ6öÆÆV7Df—FæW75FW7Ev÷&·76UfÇVW2‚“°Ð¢–b‚WFFVDGFV×B’&WGW&ã°Ð¢6öç7BæW‡DGFV×G2Òf—FæW75FW7DGFV×G2æÖ‚†GFV×B’Óâ7G&–ær†GFV×Bæ–B’ÓÓÒ7G&–ær‡WFFVDGFV×Bæ–B’ò²ââæGFV×BÂââçWFFVDGFV×BÂ7FGW3¢$E$eB"ÂWFFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò¢GFV×B“°Ð¢W'6—7Df—FæW75FW7DGFV×G2†æW‡DGFV×G2“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&f—FæW72×FW7BÖ6ö×ÆWFR"’°Ð¢6öç7BWFFVDGFV×BÒ6öÆÆV7Df—FæW75FW7Ev÷&·76UfÇVW2‚“°Ð¢–b‚WFFVDGFV×B’&WGW&ã°Ð¢6öç7BæW‡DGFV×G2Òf—FæW75FW7DGFV×G2æÖ‚†GFV×B’Óâ7G&–ær†GFV×Bæ–B’ÓÓÒ7G&–ær‡WFFVDGFV×Bæ–B’ò²ââæGFV×BÂââçWFFVDGFV×BÂ7FGW3¢$4ôÕÄUDR"ÂWFFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò¢GFV×B“°Ð¢W'6—7Df—FæW75FW7DGFV×G2†æW‡DGFV×G2“°Ð¢7F—fTf—FæW75FW7DGFV×D–BÒçVÆÃ°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&f—FæW72×FW7BÖ6æ6VÂ"’°Ð¢6öç7BWFFVDGFV×BÒ6öÆÆV7Df—FæW75FW7Ev÷&·76UfÇVW2‚“°Ð¢–b‚WFFVDGFV×B’&WGW&ã°Ð¢6öç7BæW‡DGFV×G2Òf—FæW75FW7DGFV×G2æÖ‚†GFV×B’Óâ7G&–ær†GFV×Bæ–B’ÓÓÒ7G&–ær‡WFFVDGFV×Bæ–B’ò²ââæGFV×BÂââçWFFVDGFV×BÂ7FGW3¢$”ådÄ”DDTB"ÂWFFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò¢GFV×B“°Ð¢W'6—7Df—FæW75FW7DGFV×G2†æW‡DGFV×G2“°Ð¢7F—fTf—FæW75FW7DGFV×D–BÒçVÆÃ°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢Ò“°Ð¢ÐÐ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖf–ÇFW"ÖFFR"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â†WfVçB’Óâ²W&f÷&Öæ6Tf–ÇFW'2æFFRÒWfVçBçF&vWBçfÇVS²&VæFW%W&f÷&Öæ6U6V7F–öâ‚“²Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖf–ÇFW"ÖFöÖ–â"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â†WfVçB’Óâ²W&f÷&Öæ6Tf–ÇFW'2æFöÖ–âÒWfVçBçF&vWBçfÇVS²&VæFW%W&f÷&Öæ6U6V7F–öâ‚“²Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖf–ÇFW"Ö7F—f—G’"’æFDWfVçDÆ—7FVæW"‚&–çWB"Â†WfVçB’Óâ²W&f÷&Öæ6Tf–ÇFW'2æ7F—f—G’ÒWfVçBçF&vWBçfÇVS²&VæFW%W&f÷&Öæ6U6V7F–öâ‚“²Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖf–ÇFW"ÖVçG'’×G—R"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â†WfVçB’Óâ²W&f÷&Öæ6Tf–ÇFW'2æVçG'•G—RÒWfVçBçF&vWBçfÇVS²&VæFW%W&f÷&Öæ6U6V7F–öâ‚“²Ò“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×W&f÷&Öæ6R×f–WuÒ"’æf÷$V6‚‚†'WGFöâ’Óâ°Ð¢'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr†'WGFöâæFF6WBçW&f÷&Öæ6Uf–WrÇÂ'FöF•÷G&–æ–ær"“°Ð¢Ò“°Ð¢'WGFöâæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°Ð¢–b‚²$'&÷tÆVgB"Â$'&÷u&–v‡B"Â$†öÖR"Â$VæB%Òæ–æ6ÇVFW2†WfVçBæ¶W’’’&WGW&ã°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7BF'2Ò²ââæFö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×W&f÷&Öæ6R×f–WuÒ"•Ó°Ð¢6öç7B7W'&VçD–æFW‚ÒF'2æ–æFW„öb†'WGFöâ“°Ð¢6öç7BæW‡D–æFW‚ÒWfVçBæ¶W’ÓÓÒ$†öÖR Ð¢ò Ð¢¢WfVçBæ¶W’ÓÓÒ$VæB Ð¢òF'2æÆVæwF‚ÒÐ¢¢†7W'&VçD–æFW‚²†WfVçBæ¶W’ÓÓÒ$'&÷u&–v‡B"ò¢Ó’²F'2æÆVæwF‚’RF'2æÆVæwFƒ°Ð¢6öç7BæW‡EF"ÒF'5¶æW‡D–æFW…Ó°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr†æW‡EF#òæFF6WBçW&f÷&Öæ6Uf–WrÇÂ'FöF•÷G&–æ–ær"“°Ð¢æW‡EF#òæfö7W2‚“°Ð¢Ò“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6R×f–WrÖ6÷&R"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6÷&RÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7BVçG'•G—RÒ'WGFöâæFF6WBæ6÷&T7F–öâÓÓÒ&&Væ6†Ö&²"ò$$Tä4„Ô$²"¢%E$”ä”äuõ4UB#°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚&Æör"“°Ð¢6öç7BFöÖ–âÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖFöÖ–â"“°Ð¢6öç7BG—RÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖVçG'’×G—R"“°Ð¢6öç7B7F—f—G”6öFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖ7F—f—G’Ö6öFR"“°Ð¢6öç7B7F—f—G”æÖRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖ7F—f—G’ÖæÖR"“°Ð¢–b†FöÖ–â’FöÖ–âçfÇVRÒ&6÷&R#°Ð¢–b‡G—R’G—RçfÇVRÒVçG'•G—S°Ð¢÷VÆFUW&f÷&Öæ6T7F—f—G”÷F–öç2‚&6÷&R"“°Ð¢–b†7F—f—G”6öFR’7F—f—G”6öFRçfÇVRÒ'Ææ²#°Ð¢–b†7F—f—G”æÖR’7F—f—G”æÖRçfÇVRÒ%Ææ²#°Ð¢&Vg&W6…W&f÷&Öæ6Tf–VÆEf—6–&–Æ—G’‚“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B†VçG'•G—RÓÓÒ$$Tä4„Ô$²"ò'W&f÷&Öæ6RÖ6÷&RÖGW&F–öâ×6V6öæG2"¢'W&f÷&Öæ6RÖ7F—f—G’Ö6öFR"“òæfö7W2‚“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6÷&R×&öw&ÖÖ–ær×æVÂ"“òæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7–æ2†WfVçB’Óâ°Ð¢–b†WfVçBçF&vWBæ–BÓÒ&6÷&R×&öf–ÆRÖf÷&Ò"ÇÂG—VöbFöÖ–æ–öä6÷&U&öw&ÖÖ–ærÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7Bæ÷rÒæWrFFR‚’çFô•4õ7G&–ær‚“°Ð¢6öç7B&öf–ÆRÒFöÖ–æ–öä6÷&U&öw&ÖÖ–ærææ÷&ÖÆ—¦U&öf–ÆR‡°Ð¢vöÃ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6÷&RÖvöÂ"“òçfÇVRÀÐ¢6W76–öç5W%vVV³¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6÷&RÖF—2"“òçfÇVRÀÐ¢W‡W&–Væ6S¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6÷&RÖW‡W&–Væ6R"“òçfÇVRÀÐ¢WV—ÖVçC¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6÷&RÖWV—ÖVçB"“òçfÇVRÀÐ¢6W76–öäÖ–çWFW3¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6÷&RÖÖ–çWFW2"“òçfÇVRÀÐ¢WFFVDC¢æ÷pÐ¢Ò“°Ð¢6öç7B6öçG&7BÒ&VD&÷fVE&V7'V—D6öçG&7B‚“°Ð¢6öç7BvVæW&FVBÒFöÖ–æ–öä6÷&U&öw&ÖÖ–æræ'V–ÆDf÷W%vVVµÆâ‡&öf–ÆRÂ²FöF“¢FöF”•4ôFFR‚’ÂvVæW&FVDC¢æ÷rÒ“°Ð¢6öç7BG&gBÒ6öçG&7BòFöÖ–æ–öä6÷&U&öw&ÖÖ–æræÆ–æµÆåFô6öçG&7B†vVæW&FVBÂ6öçG&7B’¢vVæW&FVC°Ð¢6fT6÷&U&öw&ÔÆö6Â‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$E$eB"Â&7W'&VçB"ÂG&gB“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$E$eB"Â&7W'&VçB"ÂG&gB“°Ð¢&VæFW$6÷&U&öw&ÖÖ–ær‚“°Ð¢6WEFW‡B‚&6÷&R×&öw&ÖÖ–ærÖfVVF&6²"Â$æWrf÷W"×vVV²G&gBvVæW&FVBâ&Wf–Wr—BÂF†Vâ&÷fRFVÆ–&W&FVÇ’âç’7F—fRÆâ&VÖ–ç2Væ6†ævVBâ"“°Ð¢Ò“°Ð¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6÷&R×&öw&ÒÖ7F–öåÒ"“°Ð¢–b‚'WGFöâÇÂG—VöbFöÖ–æ–öä6÷&U&öw&ÖÖ–ærÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæ6÷&U&öw&Ô7F–öã°Ð¢6öç7BÆâÒ&VD&÷fVD6÷&UÆâ‚“°Ð¢6öç7B&W67&—F–öâÒ7W'&VçD6÷&U&W67&—F–öâ‚“°Ð¢–b†7F–öâÓÓÒ&&÷fR×Æâ"’°Ð¢6öç7BG&gBÒ&VD6÷&TG&gEÆâ‚“°Ð¢6öç7B6öçG&7BÒ&VD&÷fVE&V7'V—D6öçG&7B‚“°Ð¢6öç7BÆ–æ¶VDG&gBÒ6öçG&7BòFöÖ–æ–öä6÷&U&öw&ÖÖ–æræÆ–æµÆåFô6öçG&7B†G&gBÂ6öçG&7B’¢G&gC°Ð¢6öç7B&÷fVBÒFöÖ–æ–öä6÷&U&öw&ÖÖ–æræ&÷fUÆâ†Æ–æ¶VDG&gBÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢–b‚&÷fVB’&WGW&ã°Ð¢6fT6÷&U&öw&ÔÆö6Â‚%Äâ"Â&7W'&VçB"Â&÷fVB“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$E$eB"Â&7W'&VçB"Â&÷fVB“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚%Äâ"Â&7W'&VçB"Â&÷fVB“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$E$eB"Â&7W'&VçB"Â&÷fVB“°Ð¢v—B&Vg&W6…Væ–f–VEvVV´G&gDf÷%Æç2‚“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢&VæFW$6öçG&7D7F—fF–öâ‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢6WEFW‡B‚&6÷&R×&öw&ÖÖ–ærÖfVVF&6²"Â$f÷W"×vVV²6÷&RÆâ&÷fVBæB6fVBâ&VF–æW72Ö’&VGV6RF–Ç’föÇVÖRÂ'WBF†RÆâv–ÆÂæ÷B6†ævR6–ÆVçFÇ’â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷VâÖ6÷&RÖ6öÖÖæB"’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚&6÷&R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷Vâ×&öÆÂÖ6ÆÂ"’°Ð¢6WD7F—fU6V7F–öâ‚'FöF’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7FöF’"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&öÆÂÖ6ÆÂÖf÷&Ò"“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‚ÆâÇÂ&W67&—F–öãòç6W76–öâ’&WGW&ã°Ð¢–b†7F–öâÓÓÒ'7F'B×6W76–öâ"’°Ð¢6öç7BW†V7WF–öâÒFöÖ–æ–öä6÷&U&öw&ÖÖ–ærç7F'DW†V7WF–öâ‡&W67&—F–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢–b‚W†V7WF–öâ’&WGW&ã°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’ÂW†V7WF–öâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’ÂW†V7WF–öâ“°Ð¢&VæFW$6÷&U&öw&ÖÖ–ær‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢6WEFW‡B‚&6÷&R×&öw&ÖÖ–ærÖfVVF&6²"Â$6÷&R6W76–öâ7F'FVBâ6ö×ÆWFRV6‚Ö÷fVÖVçBv—F‚6öçG&öÆÆVBÂ–âÖg&VRFV6†æ—VRâ"“°Ð¢6WEFW‡B‚&6÷&R×FöF’ÖfVVF&6²"Â%6W76–öâ7F'FVBâ6ö×ÆWFRV6‚Ö÷fVÖVçBÂF†Vâ6Æ÷6RF†R6W76–öââ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6ö×ÆWFRÖW†W&6—6R"’°Ð¢6öç7B7W'&VçBÒ&VD7W'&VçD6÷&TW†V7WF–öâ‚“°Ð¢6öç7BW†V7WF–öâÒFöÖ–æ–öä6÷&U&öw&ÖÖ–æræ6ö×ÆWFTW†W&6—6R†7W'&VçBÇÂ·ÒÂ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’ÂW†V7WF–öâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’ÂW†V7WF–öâ“°Ð¢&VæFW$6÷&U&öw&ÖÖ–ær‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&W÷'B×–â"’°Ð¢6öç7B&6RÒ&VD7W'&VçD6÷&TW†V7WF–öâ‚’ÇÂ°Ð¢fW'6–öã¢FöÖ–æ–öä6÷&U&öw&ÖÖ–ærådU%4”ôâÀÐ¢Æä–C¢Æâæ–BÀÐ¢6W76–öä–C¢&W67&—F–öâç6W76–öâæ–BÀÐ¢FFS¢FöF”•4ôFFR‚’ÀÐ¢6ö×ÆWFVDW†W&6—6W3¢·ÐÐ¢Ó°Ð¢6öç7BW†V7WF–öâÒFöÖ–æ–öä6÷&U&öw&ÖÖ–ærç&W÷'E–â†&6RÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6öç7B†—7F÷'’Ò²ââç&VD6÷&T†—7F÷'’‚’æf–ÇFW"‚†—FVÒ’Óâ†—FVÒçÆä–BÓÓÒÆâæ–Bbb—FVÒæFFRÓÓÒFöF”•4ôFFR‚’’’ÂW†V7WF–öåÓ°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’ÂW†V7WF–öâ“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’ÂW†V7WF–öâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢v—B6fTÖ—76–öäW†V7WF–öå&V6V—B‚$4õ$R"ÂW†V7WF–öâÂ'V–ÆD7W'&VçDÖ—76–öä6ö6·—B‚“òæ7W'&VçBÇÂ·ÒÂ&W67&—F–öâ“°Ð¢&VæFW$6÷&U&öw&ÖÖ–ær‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢6WEFW‡B‚&6÷&R×&öw&ÖÖ–ærÖfVVF&6²"Â%–â†öÆB&V6÷&FVBâFöF’w26W76–öâ—26Æ÷6VBæB&öw&W76–öâ—2&Æö6¶VBVæF–ær7–×FöÒ&W6öÇWF–öââ"“°Ð¢6WEFW‡B‚&6÷&R×FöF’ÖfVVF&6²"Â%7F÷F†R6W76–öââ–â†öÆB&V6÷&FVC²Fòæ÷BG&–âF‡&÷Vv‚7–×Fö×2â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6ö×ÆWFR×6W76–öâ"’°Ð¢6öç7B7W'&VçBÒ&VD7W'&VçD6÷&TW†V7WF–öâ‚“°Ð¢6öç7Bg&öÕFöF’Ò&ööÆVâ†'WGFöâæ6Æ÷6W7B‚"66÷&R×FöF’×æVÂ"’“°Ð¢6öç7BVÆ—G’ÒFö7VÖVçBævWDVÆVÖVçD'”–B†g&öÕFöF’ò&6÷&R×FöF’×VÆ—G’"¢&6÷&R×6W76–öâ×VÆ—G’"“òçfÇVRÇÂ$4ôåE$ôÄÄTB#°Ð¢6öç7BVff÷'BÒçVÖ&W"†Fö7VÖVçBævWDVÆVÖVçD'”–B†g&öÕFöF’ò&6÷&R×FöF’ÖVff÷'B"¢&6÷&R×6W76–öâÖVff÷'B"“òçfÇVRÇÂr“°Ð¢6öç7B&W7VÇBÒFöÖ–æ–öä6÷&U&öw&ÖÖ–æræ6ö×ÆWFU6W76–öâ†7W'&VçBÇÂ·ÒÂ&W67&—F–öâÂ°Ð¢VÆ—G’ÀÐ¢Vff÷'BÀÐ¢6ö×ÆWFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢–b‚&W7VÇBçfÆ–B’°Ð¢6WEFW‡B†g&öÕFöF’ò&6÷&R×FöF’ÖfVVF&6²"¢&6÷&R×&öw&ÖÖ–ærÖfVVF&6²"Â&W7VÇBæÖW76vR“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B†—7F÷'’Ò²ââç&VD6÷&T†—7F÷'’‚’æf–ÇFW"‚†—FVÒ’Óâ†—FVÒçÆä–BÓÓÒÆâæ–Bbb—FVÒæFFRÓÓÒFöF”•4ôFFR‚’’’Â&W7VÇBæW†V7WF–öåÓ°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’Â&W7VÇBæW†V7WF–öâ“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’Â&W7VÇBæW†V7WF–öâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢v—B6fT6÷&UW&f÷&Öæ6TWf–FVæ6R‡&W67&—F–öâÂ&W7VÇBæW†V7WF–öâ“°Ð¢v—B6fTÖ—76–öäW†V7WF–öå&V6V—B‚$4õ$R"Â&W7VÇBæW†V7WF–öâÂ'V–ÆD7W'&VçDÖ—76–öä6ö6·—B‚“òæ7W'&VçBÇÂ·ÒÂ&W67&—F–öâ“°Ð¢v—B&V6öæ6–ÆTFÆ5&öw&W76–öä÷&FW"‡²&VæFW#¢fÇ6RÒ“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢&VæFW%FöF”6öÖÖ—GFVEvVV²‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢6WEFW‡B‚&6÷&R×&öw&ÖÖ–ærÖfVVF&6²"ÂG·&W7VÇBæÖW76vWÒW&f÷&Öæ6RWf–FVæ6RæBF†RÖ—76–öâ&V6V—BvW&RFFVBWFöÖF–6ÆÇ’æ“°Ð¢6WEFW‡B‚&6÷&R×FöF’ÖfVVF&6²"ÂG·&W7VÇBæÖW76vWÒW&f÷&Öæ6RWf–FVæ6RæBF†RÖ—76–öâ&V6V—BvW&RFFVBWFöÖF–6ÆÇ’æ“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&V7'V—BÖ6öç7G&–çBÖf÷&Ò"“òæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7–æ2†WfVçB’Óâ°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢–b‡G—VöbFöÖ–æ–öå&V7'V—D6öç7G&–çDÖVÖ÷'’ÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7Bf÷&ÒÒWfVçBæ7W'&VçEF&vWC°Ð¢6öç7B7V&Ö—BÒf÷&ÒçVW'•6VÆV7F÷"‚v'WGFöå·G—SÒ'7V&Ö—B%Òr“°Ð¢–b‡7V&Ö—B’7V&Ö—BæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7BfÇVW2Òö&¦V7Bæg&öÔVçG&–W2†æWrf÷&ÔFF†f÷&Ò’æVçG&–W2‚’“°Ð¢6öç7BÖVÖ÷'’ÒFöÖ–æ–öå&V7'V—D6öç7G&–çDÖVÖ÷'’æFD6öç7G&–çB‡&VE&V7'V—D6öç7G&–çDÖVÖ÷'’‚’Â²G—S¢fÇVW2çG—RÂFöÖ–ã¢fÇVW2æFöÖ–âÂæ÷FS¢fÇVW2ææ÷FRÒ“°Ð¢6öç7B7–æ6VBÒv—B6fU&V7'V—D6öç7G&–çDÖVÖ÷'’†ÖVÖ÷'’“°Ð¢f÷&Òç&W6WB‚“°Ð¢6WEFW‡B‚'&V7'V—BÖ6öç7G&–çBÖfVVF&6²"Â6öç7G&–çB&VÖVÖ&W&VBG·7–æ6VBò"öâ–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òæ“°Ð¢Ò6F6‚†W'&÷"’²6WEFW‡B‚'&V7'V—BÖ6öç7G&–çBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ$FÆ26÷VÆBæ÷B&VÖVÖ&W"F†B6öç7G&–çBâ"“²ÐÐ¢f–æÆÇ’²–b‡7V&Ö—B’7V&Ö—BæF—6&ÆVBÒfÇ6S²ÐÐ¢Ò“°¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&–ç7V7F–öâ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°¢6öç7B†æFöfd'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚v'WGFöå¶FF×&æ²Ö†æFöfbÖ7F–öãÒ&6¶æ÷vÆVFvR%Òr“°¢–b††æFöfd'WGFöâ’°¢6öç7B&Wf–WrÒ'V–ÆE&æ´Gfæ6VÖVçD†æFöfb‚“°¢–b‡&Wf–Wsòç7FGW2ÓÒ%TäD”är"’°¢&VæFW%&æµ6V7F–öâ‚“°¢&WGW&ã°¢Ð¢–b‚v–æF÷ræ6öæf—&Ò†66WBF†RV&æVBGµ7G&–ær‡&Wf–Wrç&æ²ÇÂ'&æ²"’ç&WÆ6TÆÂ‚%ò"Â""—Ò&æ²æB—G2æW‡B7FæF&Cö’’&WGW&ã°¢†æFöfd'WGFöâæF—6&ÆVBÒG'VS°¢6öç7B&V6V—BÒ'V–ÆE&æ´Gfæ6VÖVçD†æFöfb‡²6¶æ÷vÆVFvS¢G'VRÂ6¶æ÷vÆVFvVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°¢–b‡&V6V—Còç7FGW2ÓÒ$4´äõtÄTDtTB"’°¢†æFöfd'WGFöâæF—6&ÆVBÒfÇ6S°¢6WEFW‡B‚'&æ²×&öÖ÷F–öâÖfVVF&6²"Â%F†R&æ²†æFöfb6÷VÆBæ÷B&R6V7W&VBâæ÷F†–ær6†ævVBâ"“°¢&WGW&ã°¢Ð¢6öç7BÆ–Ö—BÒG—VöbFöÖ–æ–öä66÷VçEG'WF‚ÓÓÒ'VæFVf–æVB"ò"¢FöÖ–æ–öä66÷VçEG'WF‚ä4ôÄÄT5D”ôåôÄ”Ô•E2ç&æ´†æFöfg3°¢6öç7B†—7F÷'’ÒFöÖ–æ–öå&æ´Gfæ6VÖVçD†æFöfbçW6W'D†—7F÷'’‡&VE&æ´Gfæ6VÖVçD†æFöfd†—7F÷'’‚’Â&V6V—BÂÆ–Ö—BÇÂ"“°¢6öç7B7–æ6VBÒv—B6fU&æ´Gfæ6VÖVçD†æFöfd†—7F÷'’††—7F÷'’“°¢6WEFW‡B‚'&æ²×&öÖ÷F–öâÖfVVF&6²"ÂGµ7G&–ær‡&V6V—Bç&æ²ÇÂ%&æ²"’ç&WÆ6TÆÂ‚%ò"Â""—Ò66WFVBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òæ“°¢&VæFW%&æµ6V7F–öâ‚“°¢&WGW&ã°¢Ð¢6öç7BÆVæ6„'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×vVV¶Ç’×fW&F–7BÖÆVæ6‚Ö7F–öåÒ"“°¢–b†ÆVæ6„'WGFöâ’°¢6öç7B7F–öâÒÆVæ6„'WGFöâæFF6WBçvVV¶Ç•fW&F–7DÆVæ6„7F–öã°¢–b†7F–öâÓÓÒ'&WG'’"’°¢v—BÆöEvVV¶Ç”–ç7V7F–öâ‚“°¢&WGW&ã°¢Ð¢–b†7F–öâÓÓÒ'&V÷Vâ"’°¢ÆVæ6„'WGFöâæF—6&ÆVBÒG'VS°¢G'’°¢v—B&V÷VäæW‡EvVV´g&öÕvVV¶Ç•fW&F–7B‡vVV¶Ç”–ç7V7F–öâ“°¢6WD7F—fU6V7F–öâ‚&6ÆVæF""“°¢Ò6F6‚†W'&÷"’°¢&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚‡vVV¶Ç”–ç7V7F–öâÂ²W'&÷"Ò“°¢Ð¢&WGW&ã°¢Ð¢–b†7F–öâÓÒ&&÷fR"’&WGW&ã°¢ÆVæ6„'WGFöâæF—6&ÆVBÒG'VS°¢&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚†çVÆÂÂ²6f–æs¢G'VRÂÖW76vS¢$&÷f–ærF†R6ö÷&F–æFVBvVV²æB6öæf—&Ö–ær—Böâ–÷W"66÷VçN(
b"Ò“°¢G'’°¢6öç7B&W7VÇBÒv—BÆVæ6„æW‡EvVV´g&öÕvVV¶Ç•fW&F–7B‡vVV¶Ç”–ç7V7F–öâ“°¢6öç7BfW&–f–VBÒ&W7VÇBæÆVæ6ƒòç7FFRÓÓÒ%dU$”d”TB#°¢Ç•vVV¶Ç•&Wf–WtÆ–fV7–6ÆR‡&W7VÇBæÆVæ6‚Â²ÖW76vS¢fW&–f–VBò""¢æW‡BvVV²—2&÷fVBf÷"G·&W7VÇBæ6öÖÖ—GFVEvVV²çvVVµ7F'GÓ²66÷VçB6öæf—&ÖF–öâ—2f–æ—6†–æræÒ“°¢Ò6F6‚†W'&÷"’°¢&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚‡vVV¶Ç”–ç7V7F–öâÂ²W'&÷#¢W'&÷#òæÖW76vRÇÂ%F†RæW‡BvVV²6÷VÆBæ÷B&R&÷fVBâ"Ò“°¢Ð¢&WGW&ã°¢Ð¢6öç7B&V6öæ6–Æ–F–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×vVV¶Ç’×&V6öæ6–Æ–F–öâÖ7F–öåÒ"“°¢–b‡&V6öæ6–Æ–F–öä'WGFöâ’°¢&V6öæ6–Æ–F–öä'WGFöâæF—6&ÆVBÒG'VS°¢G'’°¢6öç7B&W7VÇBÒv—B6öÖÖ—DFÆ5vVV¶Ç•&V6öæ6–Æ–F–öâ‡vVV¶Ç”–ç7V7F–öâ“°¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂæW‡BvVV²6öÖÖ—GFVBf÷"G·&W7VÇBæ6öÖÖ—GFVEvVV²çvVVµ7F'GÒG·&W7VÇBç7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òæ“°¢Ò6F6‚†W'&÷"’°¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂW'&÷#òæÖW76vRÇÂ$FÆ26÷VÆBæ÷B6öÖÖ—BF†R&V6öæ6–ÆVBvVV²â"“°¢Òf–æÆÇ’°¢&V6öæ6–Æ–F–öä'WGFöâæF—6&ÆVBÒfÇ6S°¢Ð¢&WGW&ã°¢Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖFÆ2×vVV²Ö7F–öåÒ"“°¢–b‚'WGFöâ’&WGW&ã°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7B²FV6—6–öâÂ&W7VÇBÂ7–æ6VBÒÒv—BÇ”FÆ5vVV¶Ç”6öÖÖæD7F–öâ†'WGFöâæFF6WBæFÆ5vVV´7F–öâÇÂ&&÷fR"“°Ð¢6öç7BÖW76vRÒ&W7VÇCòç7FGW2ÓÓÒ$4ôÔÔ•EDTB Ð¢òG¶FV6—6–öâç7FGW2ÓÓÒ$$õdTB"òFV6—6–öâæÆ&VÂ¢$7W'&VçB&W67&—F–öâ'Ò6öÖÖ—GFVBf÷"G¶FV6—6–öâçF&vWEvVVµ7F'GÒG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òæ Ð¢¢&W7VÇCòæFWF–ÂÇÂ$FÆ26fVBF†RvVV¶Ç’6öÖÖæBâ&Wf–WrF†RæÖVB6ÆVæF"—FVÒ&Vf÷&R6öÖÖ—FÖVçBâ#°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂÖW76vR“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂW'&÷#òæÖW76vRÇÂ$FÆ26÷VÆBæ÷BÇ’F†RvVV¶Ç’6öÖÖæBâ"“°Ð¢Òf–æÆÇ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ6öÖÖæB×æVÂ"“òæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7–æ2†WfVçB’Óâ°Ð¢–b†WfVçBçF&vWBæÖF6†W2‚u¶FF×'Vææ–ærÖ7GVÂ×&Wf–WsÒ'W&f÷&Öæ6R%Òr’’°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBçVW'•6VÆV7F÷"‚u¶FF×'Vææ–ærÖ7F–öãÒ'6fRÖ7GVÂ×'Vâ%Òr“°Ð¢–b†'WGFöâ’°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢'WGFöâçFW‡D6öçFVçBÒ%6V7W&–ærWf–FVæ6^(
b#°Ð¢ÐÐ¢G'’°Ð¢v—Bf–æÆ—¦U'Vææ–æu6W76–öâ‚'W&f÷&Öæ6R"“°Ð¢v—B6ÆV$g&–7F–öæÆW74G&gB‚''Vææ–ær"“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6öç7BfVVF&6²ÒWfVçBçF&vWBçVW'•6VÆV7F÷"‚%¶FF×'Vææ–ærÖ7GVÂÖfVVF&6µÒ"“°Ð¢–b†fVVF&6²’fVVF&6²çFW‡D6öçFVçBÒW'&÷#òæÖW76vRÇÂ%'VâWf–FVæ6R6÷VÆBæ÷B&R6V7W&VBâ#°Ð¢–b†'WGFöâ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢'WGFöâçFW‡D6öçFVçBÒ%6V7W&R'VâWf–FVæ6R#°Ð¢ÐÐ¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†WfVçBçF&vWBæ–BÓÓÒ&ÖçVÂ×'VâÖf÷&Ò"’°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7B'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&ÖçVÂ×'Vâ×7V&Ö—B"“°Ð¢6öç7Bf÷&ÔFFÒæWrf÷&ÔFF†WfVçBçF&vWB“°Ð¢6öç7B6÷VçEF÷v&EFöF’Òf÷&ÔFFæ†2‚&6÷VçEF÷v&EFöF’"“°¢6öç7B–çWBÒ°¢ââäö&¦V7Bæg&öÔVçG&–W2†f÷&ÔFFæVçG&–W2‚’’À¢6÷VçEF÷v&EFöF’À¢76–væÖVçD–C¢6÷VçEF÷v&EFöF’ò7W'&VçE'Vææ–æt6ÆVæF$76–væÖVçB‚“òæ76–væÖVçD–BÇÂçVÆÂ¢çVÆÂÀ¢66†VGVÆVDFFS¢6÷VçEF÷v&EFöF’ò7W'&VçE'Vææ–æt6ÆVæF$76–væÖVçB‚“òæFFRÇÂçVÆÂ¢çVÆÀ¢Ó°¢6öç7BfÆ–FF–öâÒG—VöbFöÖ–æ–öäÖçVÅ'VâÓÒ'VæFVf–æVB Ð¢òFöÖ–æ–öäÖçVÅ'VâçfÆ–FFR†–çWBÂ²FöF“¢FöF”•4ôFFR‚’ÒÐ¢¢²fÆ–C¢fÇ6RÂW'&÷'3¢·²ÖW76vS¢$ÖçVÂ'Vâ6GW&R—2FV×÷&&–Ç’Væf–Æ&ÆRâ"ÕÒÓ°Ð¢–b‚fÆ–FF–öâçfÆ–B’°Ð¢6WEFW‡B‚&ÖçVÂ×'VâÖfVVF&6²"ÂfÆ–FF–öâæW'&÷'5³ÓòæÖW76vRÇÂ$6ö×ÆWFRF†R&WV—&VB'VâFWF–Ç2â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†'WGFöâ’°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢'WGFöâçFW‡D6öçFVçBÒ%6f–ær'Vî(
b#°Ð¢ÐÐ¢6WEFW‡B‚&ÖçVÂ×'VâÖfVVF&6²"Â%6f–ær'VâWf–FVæ6^(
b"“°Ð¢G'’°Ð¢6öç7B7&VFVDBÒæWrFFR‚’çFô•4õ7G&–ær‚“°Ð¢6öç7BVçG'’ÒFöÖ–æ–öäÖçVÅ'Vâæ'V–ÆEW&f÷&Öæ6TVçG'’†–çWBÂ²FöF“¢FöF”•4ôFFR‚’ÂW6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÂ7&VFVDBÒ“°Ð¢6öç7B6fVBÒv—BW'6—7EW&f÷&Öæ6TWf–FVæ6TVçG'’†VçG'’“°Ð¢6öç7BÆ–6F–öâÒv—BÇ”ÖçVÅ'VåFõFöF’‡fÆ–FF–öâç'VâÂ6fVBæVçG'’“°Ð¢v—B6ÆV$g&–7F–öæÆW74G&gB‚''Vææ–ær"“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‡W&f÷&Öæ6TVçG&–W2ÂW&f÷&Öæ6U7F÷&vTÖöFRÂW&f÷&Öæ6U6fU7FFR“°Ð¢&VæFW%FöF”6öÖÖ—GFVEvVV²‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢&VæFW%FöF”6öÖÖæE7W&f6R‚“°Ð¢–b‡G&VæDæÇ—F–746öçFW‡B’&VæFW%G&VæG4æÇ—F–72‡G&VæDæÇ—F–746öçFW‡Bæ–ç7V7F–öç2ÂG&VæDæÇ—F–746öçFW‡BæF–Ç•&V6÷&G2ÂG&VæDæÇ—F–746öçFW‡Bç7F÷&vTÖöFR“°Ð¢6öç7B7F÷&vTÖW76vRÒ6fVBç&VÖ÷FRò'6fVBFò–÷W"66÷VçB"¢'6fVBöâF†—2FWf–6S²66÷VçB7–æ2v–ÆÂ&WG'’#°Ð¢6öç7B76–væÖVçDÖW76vRÒÆ–6F–öâæÆ–V@Ð¢ò"FöFž(	—276–væVB'Vâ—26ö×ÆWFRâ Ð¢¢Æ–6F–öâç&V6öâÓÓÒ$Å$TE•ô4Äõ4TB Ð¢ò"FöFž(	—276–væÖVçBv2Ç&VG’6Æ÷6VBÂ6ò—G2&V6V—Bv2æ÷B&WÆ6VBâ Ð¢¢fÆ–FF–öâç'Vâæ6÷VçEF÷v&EFöFÐ¢ò"'VâWf–FVæ6R—26fVBÂ'WBæò7F—fR76–væÖVçB6÷VÆB&R6Æ÷6VBâ Ð¢¢"#°Ð¢6WEFW‡B‚&ÖçVÂ×'VâÖfVVF&6²"ÂG·fÆ–FF–öâç'VâæF—7Fæ6WÒG·fÆ–FF–öâç'VâçVæ—GÒG·7F÷&vTÖW76vWÒâG¶76–væÖVçDÖW76vWÖ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚&ÖçVÂ×'VâÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R'Vâ6÷VÆBæ÷B&R6fVBâ–÷W"W†—7F–ærWf–FVæ6Rv2æ÷B6†ævVBâ"“°Ð¢–b†'WGFöâ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢'WGFöâçFW‡D6öçFVçBÒ%6fR'Vâ#°Ð¢ÐÐ¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†WfVçBçF&vWBæ–BÓÒ''Vææ–ær×&öf–ÆRÖf÷&Ò"’&WGW&ã°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7BF—7Fæ6RÒFö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ&Væ6†Ö&²ÖF—7Fæ6R"“òçfÇVRÇÂ"#°Ð¢6öç7BÖ–çWFW2ÒçVÖ&W"†Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ&Væ6†Ö&²ÖÖ–çWFW2"“òçfÇVRÇÂ“°Ð¢6öç7B6V6öæG2ÒçVÖ&W"†Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ&Væ6†Ö&²×6V6öæG2"“òçfÇVRÇÂ“°Ð¢–b†F—7Fæ6Rbb†Ö–çWFW2¢c²6V6öæG2â’’°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â$VçFW"fÆ–B&Væ6†Ö&²F–ÖR÷"6†ö÷6RW6RW&f÷&Öæ6RWf–FVæ6Râ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7Bæ÷rÒæWrFFR‚’çFô•4õ7G&–ær‚“°Ð¢6öç7B6öçG&7BÒ&VD&÷fVE&V7'V—D6öçG&7B‚“°Ð¢6öç7B6fVE&öf–ÆRÒ6fU'Vææ–æu&öf–ÆR‡°Ð¢vöÃ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖvöÂ"“òçfÇVRÀÐ¢F&vWDFFS¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ær×F&vWBÖFFR"“òçfÇVRÀÐ¢'Vææ–ætF—5W%vVV³¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖF—2"“òçfÇVRÀÐ¢&VfW'&VEVæ—C¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ær×Væ—B"“òçfÇVRÀÐ¢FV6Æ&VEvVV¶Ç”F—7Fæ6S¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖFV6Æ&VBÖF—7Fæ6R"“òçfÇVRÀÐ¢&Væ6†Ö&´F—7Fæ6S¢F—7Fæ6RÇÂçVÆÂÀÐ¢&Væ6†Ö&µ6V6öæG3¢F—7Fæ6Rò†Ö–çWFW2¢c’²6V6öæG2¢çVÆÂÀÐ¢&Væ6†Ö&´FFS¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ&Væ6†Ö&²ÖFFR"“òçfÇVRÀÐ¢&÷fVDC¢æ÷rÀÐ¢WFFVDC¢æ÷rÀÐ¢&V7'V—D6öçG&7D–C¢6öçG&7Còæ–BÇÂçVÆÂÀÐ¢&V7'V—D6öçG&7E&Wf—6–öã¢6öçG&7Còç&Wf—6–öâÇÂçVÆÀÐ¢Ò“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%$ôd”ÄR"Â&7W'&VçB"Â6fVE&öf–ÆR“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â%'Vææ–ær6WGW6fVBâ'V–ÆBF†Rf÷W"×vVV²G&gBv†Vâ–÷R&R&VG“²F†R7F—fRÆâ&VÖ–ç2Væ6†ævVBâ"“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ6öÖÖæB×æVÂ"“òæFDWfVçDÆ—7FVæW"‚&–çWB"Â†WfVçB’Óâ°Ð¢6öç7Bf÷&ÒÒWfVçBçF&vWBæ6Æ÷6W7B‚u¶FF×'Vææ–ærÖ7GVÂ×&Wf–WsÒ'W&f÷&Öæ6R%Òr“°Ð¢–b†f÷&Ò’66†VGVÆTg&–7F–öæÆW74G&gB‚''Vææ–ær"Âf÷&Ò“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ6öÖÖæB×æVÂ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×'Vææ–ærÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&÷VâÖ6öçG&7B"’°Ð¢v–æF÷ræÆö6F–öâæ†6‚Ò&6öçG&7B#°Ð¢&WGW&ã°Ð¢ÐÐ¢–b…²&&÷fR×&öw&W76–öâ"Â&†öÆB×&öw&W76–öâ%Òæ–æ6ÇVFW2†'WGFöâæFF6WBç'Vææ–æt7F–öâ’’°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7B&÷÷6ÂÒ'V–ÆD7W'&VçE'Vææ–æu&öw&W76–öâ‚“°Ð¢–b‚&÷÷6ÂÇÂ&÷÷6Âç7FGW2ÓÒ%$õõ4TB"’F‡&÷ræWrW'&÷"‚$æò'Vææ–ær&öw&W76–öâ—2v—F–ærFV6—6–öââ"“°Ð¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&†öÆB×&öw&W76–öâ"’°Ð¢6öç7B†VÆBÒFöÖ–æ–öå'Vææ–æu&öw&W76–öâæ†öÆE&÷÷6Â‡&÷÷6ÂÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6öç7B7–æ6VBÒv—B6fU'Vææ–æu&öw&W76–öâ††VÆB“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢&VæFW$FÆ4FV6—6–öä6VçFW"‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â7W'&VçB'Vææ–ærF÷6R&WF–æVBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâFÆ2v–ÆÂ&Wf–WrF†RæW‡BfW&–f–VB'Vç2æ“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B7W'&VçBÒ&VD&÷fVE'Vææ–æt&Æö6²‚“°Ð¢6öç7BFV6—6–öâÒFöÖ–æ–öå'Vææ–æu&öw&W76–öâæ&÷fU&÷÷6Â‡&÷÷6ÂÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6öç7B&Wf—6VBÒFöÖ–æ–öå'Vææ–æu&öw&W76–öâæÇ•Fô&Æö6²†7W'&VçBÂFV6—6–öâÂ²Æ–VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&6†—fS¢G¶7W'&VçBæ–GÖÂ7W'&VçB“°Ð¢6fU'Vææ–æt&Æö6´Æö6Â‚&7F—fR"Â&Wf—6VB“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&7F—fR"Â&Wf—6VB“°Ð¢6öç7B&V6V—BÒ²ââæFV6—6–öâÂÆ–VD&Æö6´–C¢&Wf—6VBæ–BÂÆ–VD&Æö6µ&Wf—6–öã¢&Wf—6VBç&Wf—6–öâÂÆ–VDC¢&Wf—6VBæ&÷fVDBÓ°Ð¢6öç7B7–æ6VBÒv—B6fU'Vææ–æu&öw&W76–öâ‡&V6V—B“°Ð¢v—B&Vg&W6…Væ–f–VEvVV´G&gDf÷%Æç2‡²f÷&6S¢G'VRÒ“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢&VæFW%&öw&Ô6öÖÖæB‚“°Ð¢&VæFW$FÆ4FV6—6–öä6VçFW"‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"ÂG¶FV6—6–öâæ†VFÆ–æWÒÆ–VBFògWGW&R'Vç2G·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òâ6ö×ÆWFVBv÷&²—2Væ6†ævVC²6ÆVæF"—27FvVBg&öÒ&Wf—6–öâG·&Wf—6VBç&Wf—6–öçÒæ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R'Vææ–ær&öw&W76–öâ6÷VÆBæ÷B&RÆ–VBâ"“°Ð¢Òf–æÆÇ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&vVæW&FRÖ&Æö6²"ÇÂ'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&&÷fR×Æâ"’°Ð¢6öç7B&öf–ÆRÒ&VE'Vææ–æu&öf–ÆR‚“°Ð¢6öç7B6öçG&7BÒ&VD&÷fVE&V7'V—D6öçG&7B‚“°Ð¢6öç7B7F'DFFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚''Vææ–ærÖ&Æö6²×7F'B"“òçfÇVRÇÂFöF”•4ôFFR‚“°Ð¢6öç7BG&gBÒFöÖ–æ–öå'Vææ–æræ'V–ÆE'Vææ–æt&Æö6²‡&öf–ÆRÂW&f÷&Öæ6TVçG&–W2Â°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢7F'DFFRÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢6öçG&7E66†VGVÆS¢6öçG&7Còç66†VGVÆRÇÂµÒÀÐ¢&V7'V—D6öçG&7D–C¢6öçG&7Còæ–BÇÂ&öf–ÆRç&V7'V—D6öçG&7D–BÇÂçVÆÂÀÐ¢&V7'V—D6öçG&7E&Wf—6–öã¢6öçG&7Còç&Wf—6–öâÇÂ&öf–ÆRç&V7'V—D6öçG&7E&Wf—6–öâÇÂçVÆÀÐ¢Ò“°Ð¢–b†G&gBç7FGW2ÓÒ$E$eB"’°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"ÂG&gBæÖW76vRÇÂ%F†R'Vææ–ærG&gB—2æ÷B&VG’–WBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6fU'Vææ–æt&Æö6´Æö6Â‚&G&gB"ÂG&gB“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&G&gB"ÂG&gB“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â$f÷W"×vVV²'Vææ–ærG&gB6fVBâ&Wf–WrÆÂf÷W"vVV·2ÂF†Vâ&÷fR—BFòÖ¶RF†RÆâ7F—fRâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&&÷fRÖ&Æö6²"’°Ð¢6öç7BG&gBÒ&VE'Vææ–æt&Æö6´G&gB‚“°Ð¢6öç7B&Wf–÷W2Ò&VD&÷fVE'Vææ–æt&Æö6²‚“°Ð¢–b‚G&gB’&WGW&ã°Ð¢G'’°Ð¢6öç7B&÷fVBÒFöÖ–æ–öå'Vææ–æræ&÷fU'Vææ–æt&Æö6²†G&gBÂ&Wf–÷W2Â²&÷fVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢–b‡&Wf–÷W2’v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&6†—fS¢G·&Wf–÷W2æ–GÖÂ&Wf–÷W2“°Ð¢6fU'Vææ–æt&Æö6´Æö6Â‚&7F—fR"Â&÷fVB“°Ð¢v–æF÷ræÆö6Å7F÷&vRç&VÖ÷fT—FVÒ‡'Vææ–æt&Æö6µ7F÷&vT¶W’‚&G&gB"’“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&7F—fR"Â&÷fVB“°Ð¢v—BFVÆWFU'Vææ–æu7FFR‚%Äâ"Â&G&gB"“°Ð¢v—B&Vg&W6…Væ–f–VEvVV´G&gDf÷%Æç2‚“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢&VæFW%FöF”6öÖÖæE7W&f6R‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$6öçG&7D7F—fF–öâ‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Âf÷W"×vVV²'Vææ–ær&Æö6²&Wf—6–öâG¶&÷fVBç&Wf—6–öçÒ&÷fVBæB6fVBFò–÷W"66÷VçBâFöF’æ÷rföÆÆ÷w2F†R7F—fR&Æö6²æ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R'Vææ–ær&Æö6²6÷VÆBæ÷B&R&÷fVBâ"“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ'&Wf–WrÖÆör"’°Ð¢W&f÷&Öæ6Tf–ÇFW'2æFöÖ–âÒ''Vææ–ær#°Ð¢6öç7Bf–ÇFW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖf–ÇFW"ÖFöÖ–â"“°Ð¢–b†f–ÇFW"’f–ÇFW"çfÇVRÒ''Vææ–ær#°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚&Æör"“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&&÷fR×&V6öæ6–Æ–F–öâ"’°Ð¢6öç7BÆâÒ&VD&÷fVE'Vææ–æuÆâ‚“°Ð¢–b‚Æâ’&WGW&ã°Ð¢6öç7B&V6öæ6–Æ–F–öâÒFöÖ–æ–öå'Vææ–ærç&V6öæ6–ÆUvVV¶Ç•'Vææ–æuÆâ‡ÆâÂW&f÷&Öæ6TVçG&–W2Â²FöF“¢FöF”•4ôFFR‚’Ò“°Ð¢–b‡&V6öæ6–Æ–F–öâç7FGW2ÓÒ%$TE’"’&WGW&ã°Ð¢6öç7B&÷fVBÒ°Ð¢&÷fVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢Æä&÷fVDC¢Æâæ&÷fVDBÀÐ¢vVVµ7F'C¢ÆâçvVVµ7F'BÀÐ¢7VÖÖ'“¢&V6öæ6–Æ–F–öâç7VÖÖ'’ÀÐ¢F—3¢&V6öæ6–Æ–F–öâæF—2æÖ‚†F’’Óâ‡²FFS¢F’æFFRÂ6Æ76–f–6F–öã¢F’æ6Æ76–f–6F–öâÂ6÷W&6T–G3¢F’ç'Vç2æÖ‚‡'Vâ’Óâ'Vâæ–B’Ò’Ð¢Ó°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡'Vææ–æu&V6öæ6–Æ–F–öå7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’†&÷fVB’“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%$T4ôä4”Ä”D”ôâ"ÂÆâçvVVµ7F'BÂ&÷fVB“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â%vVV¶Ç’'VâWf–FVæ6R&Wf–Wr&÷fVBâ6÷W&6R&V6÷&G2æBF†R&÷fVBÆâ&VÖ–âVæ6†ævVBâ"“°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ'7F'B×'Vâ"’°Ð¢6öç7BÆâÒ&VD&÷fVE'Vææ–æuÆâ‚“°Ð¢6öç7B&W67&—F–öâÒFöÖ–æ–öå'Vææ–æræ'V–ÆDF–Ç•'Vå&W67&—F–öâ‡ÆâÇÂ·ÒÂ²FöF“¢FöF”•4ôFFR‚’Â&VF–æW73¢F–Ç•7FFRÇÂ·ÒÒ“°Ð¢–b‚&W67&—F–öâç6W76–öâÇÂ&W67&—F–öâç7FGW2ÓÓÒ%”åô„ôÄB"’&WGW&ã°Ð¢6öç7B7FFRÒ°Ð¢ââäFöÖ–æ–öäÖ—76–öäW†V7WF–öâç7F'E'Vææ–ætW†V7WF–öâ‡&W67&—F–öâÂ&VE'Vææ–ætW†V7WF–öâ‚’ÂæWrFFR‚’çFô•4õ7G&–ær‚’’ÀÐ¢&Æö6´–C¢Æãòæ&Æö6´–BÇÂçVÆÂÀÐ¢&Æö6µ&Wf—6–öã¢Æãòæ&Æö6µ&Wf—6–öâÇÂçVÆÂÀÐ¢vVVµ7F'C¢ÆãòçvVVµ7F'BÇÂçVÆÀÐ¢Ó°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡'Vææ–ætW†V7WF–öå7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡7FFR’“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’Â7FFR“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â%'Vâ7F'FVBâÖ—76–öâW†V7WF–öâ—2G&6¶–ærV6‚7FWæB7F—fRF–ÖRâ"“°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&6ö×ÆWFR×'Vâ"’°Ð¢6öç7B7W'&VçBÒ&VE'Vææ–ætW†V7WF–öâ‚’ÇÂ·Ó°Ð¢6öç7B&Wf–WvVBÒFöÖ–æ–öäÖ—76–öäW†V7WF–öâç&W&U'Vææ–æu&Wf–Wr†7W'&VçBÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡'Vææ–ætW†V7WF–öå7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡&Wf–WvVB’“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’Â&Wf–WvVB“°Ð¢&VæFW%'Vææ–æt6öÖÖæB‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â$VçFW"7GVÂF—7Fæ6RæBVÆ6VBF–ÖRFò6V7W&RF†R'VââF†R&W67&—F–öâv–ÆÂæ÷B&R6÷–VB2F†R&W7VÇBâ"“°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ&ÖöF–g’×'Vâ"’6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â%W6RF†R&VF–æW72ÖF§W7FVBV7’ÇFW&æF—fRâF†R&÷fVBvVV¶Ç’Æâ&VÖ–ç2Væ6†ævVBâ"“°Ð¢–b†'WGFöâæFF6WBç'Vææ–æt7F–öâÓÓÒ'&W÷'B×–â"’°Ð¢6öç7B7W'&VçBÒ&VE'Vææ–ætW†V7WF–öâ‚“°Ð¢–b†7W'&VçB’°Ð¢6öç7B7FFRÒFöÖ–æ–öäÖ—76–öäW†V7WF–öâç&W÷'E'Vææ–æu–â†7W'&VçBÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡'Vææ–ætW†V7WF–öå7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡7FFR’“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚$U„T5UD”ôâ"ÂFöF”•4ôFFR‚’Â7FFR“°Ð¢v—B6fTÖ—76–öäW†V7WF–öå&V6V—B‚%%Tää”är"Â7FFRÂ'V–ÆD7W'&VçDÖ—76–öä6ö6·—B‚“òæ7W'&VçBÇÂ·ÒÂ7W'&VçE'Vææ–æu&W67&—F–öâ‚’“°Ð¢ÐÐ¢6WEFW‡B‚''Vææ–ærÖ6öÖÖæBÖfVVF&6²"Â%–â†öÆB6fVBâ7F÷'Vææ–æræBWFFR&öÆÂ6ÆÂ&Vf÷&RÖ÷&RG&–æ–ærâ"“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&öw&ÖÖ–ær×&Wf–Wr×æVÂ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B&Æö6´'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×7G&VæwF‚Ö&Æö6²Ö7F–öåÒ"“°Ð¢–b†&Æö6´'WGFöâbbG—VöbFöÖ–æ–öå7G&VæwF„&Æö6²ÓÒ'VæFVf–æVB"’°Ð¢6öç7B&Æö6´7F–öâÒ&Æö6´'WGFöâæFF6WBç7G&VæwF„&Æö6´7F–öã°Ð¢6öç7BÆâÒ&VD&÷fVE7G&VæwF…Æâ‚“°Ð¢–b‚Æâ’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$&÷fRF†R7G&VæwF‚&öw&Ò&Vf÷&RÆææ–ærG&–æ–ær&Æö6²â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B–çFVÆÆ–vVæ6RÒ7W'&VçE7G&VæwF„–çFVÆÆ–vVæ6R‡Æâ’ÇÂ·Ó°Ð¢G'’°Ð¢–b†&Æö6´7F–öâÓÓÒ&vVæW&FR"’°Ð¢6öç7B÷F–öç2Ò7G&VæwF„&Æö6´÷F–öç4g&öÕæVÂ‚“°Ð¢6öç7BG&gBÒFöÖ–æ–öå7G&VæwF„&Æö6²æ'V–ÆD&Æö6´G&gB‡ÆâÂ–çFVÆÆ–vVæ6RÂ°Ð¢ââæ÷F–öç2ÀÐ¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢7&VFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$$Äô4²"Â&G&gB"ÂG&gB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&G&gB"ÂG&gB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂG&gBæ&÷fÄ&Æö6¶V@Ð¢ò$&Æö6²G&gB&W6W'fVBÂ'WB–âWf–FVæ6R×W7B&R&W6öÇfVB&Vf÷&R7F—fF–öââ Ð¢¢G¶G&gBæÆVæwF…vVV·7Ò×vVV²7G&VæwF‚&Æö6²G&gFVBâ&Wf–WrWfW'’†6R&Vf÷&R&÷fÂæ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†&Æö6´7F–öâÓÓÒ'&Wf—6R"’°Ð¢6öç7BW†—7F–ærÒ&VE7G&VæwF„&Æö6´G&gB‚“°Ð¢6öç7B&Wf—6VBÒFöÖ–æ–öå7G&VæwF„&Æö6²ç&Wf—6T&Æö6²†W†—7F–ærÂÆâÂ–çFVÆÆ–vVæ6RÂ7G&VæwF„&Æö6´÷F–öç4g&öÕæVÂ‚’ÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$$Äô4²"Â&G&gB"Â&Wf—6VB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&G&gB"Â&Wf—6VB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â7G&VæwF‚&Æö6²G&gBWFFVBFò&Wf—6–öâG·&Wf—6VBç&Wf—6–öçÒâæ÷F†–ærv27F—fFVBæ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†&Æö6´7F–öâÓÓÒ&&÷fR"’°Ð¢–b‡&VD7F—fU7G&VæwF„&Æö6²‚’’F‡&÷ræWrW'&÷"‚$VæBF†R7F—fR7G&VæwF‚&Æö6²&Vf÷&R7F—fF–æræ÷F†W"öæRâ"“°Ð¢6öç7B&÷fVBÒFöÖ–æ–öå7G&VæwF„&Æö6²æ&÷fT&Æö6²‡&VE7G&VæwF„&Æö6´G&gB‚’ÂÆâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$$Äô4²"Â&7W'&VçB"Â&÷fVB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&7W'&VçB"Â&÷fVB“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&G&gB"“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â7G&VæwF‚&Æö6²7F—fFVBâG´FöÖ–æ–öå7G&VæwF„&Æö6²æ&Æö6µvVV´f÷$FFR†&÷fVBÂFöF”•4ôFFR‚’’æÆ&VÇÒâFöF’æ÷r†öæ÷'2†6R×7V6–f–26WB&VGV7F–öç2æ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†&Æö6´7F–öâÓÓÒ&VæB"’°Ð¢6öç7B7F—fRÒ&VD7F—fU7G&VæwF„&Æö6²‚“°Ð¢6öç7BVæFVBÒFöÖ–æ–öå7G&VæwF„&Æö6²æVæD&Æö6²†7F—fRÂæWrFFR‚’çFô•4õ7G&–ær‚’Â$VæFVBW‡Æ–6—FÇ’g&öÒ7G&VæwF‚&Æö6²6öÖÖæBâ"“°Ð¢6öç7B†—7F÷'’Ò¶VæFVBÂââç&VE7G&VæwF„&Æö6´†—7F÷'’‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒVæFVBæ–B•Òç6Æ–6RƒÂ#B“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$$Äô4²"Â&7W'&VçB"ÂVæFVB“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$$Äô4²"Â&†—7F÷'’"Â†—7F÷'’“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&7W'&VçB"ÂVæFVB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&†—7F÷'’"Â†—7F÷'’“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â%7G&VæwF‚&Æö6²VæFVBæB&W6W'fVBâF†R&÷fVB&öw&Ò&VÖ–ç2–çF7C²F†RæW‡B&Æö6²7F–ÆÂ&WV—&W2æWrG&gBæB&÷fÂâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†&Æö6´7F–öâÓÓÒ&æW‡B"’°Ð¢6öç7BVæFVBÒ&VE7G&VæwF„&Æö6²‚“°Ð¢6öç7B÷F–öç2Ò7G&VæwF„&Æö6´÷F–öç4g&öÕæVÂ‚“°Ð¢6öç7BæW‡BÒFöÖ–æ–öå7G&VæwF„&Æö6²æ'V–ÆDæW‡D&Æö6´G&gB†VæFVBÂÆâÂ–çFVÆÆ–vVæ6RÂ°Ð¢ÆVæwF…vVV·3¢÷F–öç2æÆVæwF…vVV·2ÀÐ¢7&VFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$$Äô4²"Â&G&gB"ÂæW‡B“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&G&gB"ÂæW‡B“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$æW‡B7G&VæwF‚&Æö6²G&gFVBâæò†6R÷"&W67&—F–öâv27F—fFVBWFöÖF–6ÆÇ’â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R7G&VæwF‚&Æö6²6÷VÆBæ÷B&RWFFVBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢ÐÐ¢6öç7B&Wf–Wt'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×7G&VæwF‚×&Wf–WrÖ7F–öåÒ"“°Ð¢–b‡&Wf–Wt'WGFöâbbG—VöbFöÖ–æ–öå7G&VæwF…vVVµ&Wf–WrÓÒ'VæFVf–æVB"bbG—VöbFöÖ–æ–öå7G&VæwF…66†VGVÆRÓÒ'VæFVf–æVB"’°Ð¢6öç7B&Wf–Wt7F–öâÒ&Wf–Wt'WGFöâæFF6WBç7G&VæwF…&Wf–Wt7F–öã°Ð¢6öç7BÆâÒ&VD&÷fVE7G&VæwF…Æâ‚“°Ð¢6öç7B66†VGVÆRÒ&VD&÷fVE7G&VæwF…66†VGVÆR‚“°Ð¢–b‚ÆâÇÂ66†VGVÆR’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$&÷fRF†R7G&VæwF‚&öw&ÒæBvVV¶Ç’66†VGVÆR&Vf÷&R&Wf–Wv–ærF†RvVV²â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‡&Wf–Wt7F–öâÓÓÒ'&Vg&W6‚"’°Ð¢6öç7B&Vg&W6†VBÒ'V–ÆD7W'&VçE7G&VæwF…vVVµ&Wf–Wr‡ÆâÂ66†VGVÆR“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%tTTµõ$Ud”Ur"Â&7W'&VçB"Â&Vg&W6†VB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%tTTµõ$Ud”Ur"Â&7W'&VçB"Â&Vg&W6†VB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â7G&VæwF‚Wf–FVæ6R&Vg&W6†VBâG·&Vg&W6†VBç7VÖÖ'’æ6ö×ÆWFVGÒ6ö×ÆWFRÂG·&Vg&W6†VBç7VÖÖ'’ç'F–ÇÒ'F–ÂÂG·&Vg&W6†VBç7VÖÖ'’æÖ—76VGÒÖ—76VC²Ö&–wV÷W2–×÷'G2&VÖ–âVæ7&VF—FVBæ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‡&Wf–Wt7F–öâÓÓÒ&f–æÆ—¦R"’°Ð¢G'’°Ð¢6öç7BÆ—fU&Wf–WrÒ'V–ÆD7W'&VçE7G&VæwF…vVVµ&Wf–Wr‡ÆâÂ66†VGVÆR“°Ð¢6öç7Bf–æÆ—¦VBÒFöÖ–æ–öå7G&VæwF…vVVµ&Wf–Wræf–æÆ—¦UvVVµ&Wf–Wr†Æ—fU&Wf–WrÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6öç7B†—7F÷'’Ò¶f–æÆ—¦VBÂââç&VE7G&VæwF…vVVµ&Wf–Wt†—7F÷'’‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒf–æÆ—¦VBæ–B•Òç6Æ–6RƒÂS"“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%tTTµõ$Ud”Ur"Â&7W'&VçB"Âf–æÆ—¦VB“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%tTTµõ$Ud”Ur"Â&†—7F÷'’"Â†—7F÷'’“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%tTTµõ$Ud”Ur"Â&7W'&VçB"Âf–æÆ—¦VB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%tTTµõ$Ud”Ur"Â&†—7F÷'’"Â†—7F÷'’“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â7G&VæwF‚vVV²f–æÆ—¦VBâ6ö6†–ær÷7GW&S¢G¶f–æÆ—¦VBç&V6öÖÖVæFF–öâæÆ&VÇÒâF†R&öw&ÒæB6÷W&6R†—7F÷'’vW&Ræ÷B6†ævVBæ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R7G&VæwF‚vVV²6÷VÆBæ÷B&Rf–æÆ—¦VBâ"“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b‡&Wf–Wt7F–öâÓÓÒ'&öÆÆ÷fW""’°Ð¢G'’°Ð¢6öç7Bf–æÆ—¦VBÒ&VE7G&VæwF…vVVµ&Wf–Wr‚“°Ð¢–b†f–æÆ—¦VCòç66†VGVÆT–BÓÒ66†VGVÆRæ–B’F‡&÷ræWrW'&÷"‚$f–æÆ—¦RF†R7F—fR7G&VæwF‚vVV²&Vf÷&RG&gF–ær—G2&öÆÆ÷fW"â"“°Ð¢6öç7B–çFVçBÒFöÖ–æ–öå7G&VæwF…vVVµ&Wf–Wrç&öÆÆ÷fW$–çFVçB†f–æÆ—¦VB“°Ð¢6öç7BW†—7F–ætG&gBÒ&VE7G&VæwF…66†VGVÆTG&gB‚“°Ð¢–b†W†—7F–ætG&gBbb†W†—7F–ætG&gBçvVVµ7F'BÓÓÒ–çFVçBçvVVµ7F'BbbW†—7F–ætG&gBç6÷W&6UvVVµ&Wf–Wt–BÓÓÒf–æÆ—¦VBæ–B’’°Ð¢F‡&÷ræWrW'&÷"‚$âW†—7F–ærvVV¶Ç’66†VGVÆRG&gB—2&÷FV7FVBâ&Wf–Wr÷"&÷fR—B&Vf÷&R7&VF–ærF†R&öÆÆ÷fW"â"“°Ð¢ÐÐ¢6öç7BG&gBÒ°Ð¢ââäFöÖ–æ–öå7G&VæwF…66†VGVÆRæ'V–ÆEvVV¶Ç•66†VGVÆR‡ÆâÂ&VE7G&VæwF„†—7F÷'’‚’Â7G&VæwF…66†VGVÆT6öçFW‡B‚’Â°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢&VfW'&VDF—3¢66†VGVÆRç&VfW'&VDF—2ÀÐ¢vVVµ7F'C¢–çFVçBçvVVµ7F'BÀÐ¢7&VFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò’ÀÐ¢6÷W&6UvVVµ&Wf–Wt–C¢–çFVçBç6÷W&6U&Wf–Wt–BÀÐ¢6÷W&6U66†VGVÆT–C¢–çFVçBç6÷W&6U66†VGVÆT–BÀÐ¢&öÆÆ÷fW%&V6öÖÖVæFF–öã¢–çFVçBç&V6öÖÖVæFF–öä6öFPÐ¢Ó°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%44„TETÄR"Â&G&gB"ÂG&gB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&G&gB"ÂG&gB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$æW‡B6ö÷&F–æFVB7G&VæwF‚vVV²G&gFVBâ&Wf–WrWfW'’F“²æò66†VGVÆR÷"&öw&W76–öâv2&÷fVBWFöÖF–6ÆÇ’â"“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†RæW‡B7G&VæwF‚vVV²6÷VÆBæ÷B&RG&gFVBâ"“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢ÐÐ¢6öç7B66†VGVÆT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×7G&VæwF‚×66†VGVÆRÖ7F–öåÒ"“°Ð¢–b‡66†VGVÆT'WGFöâbbG—VöbFöÖ–æ–öå7G&VæwF…66†VGVÆRÓÒ'VæFVf–æVB"’°Ð¢6öç7B66†VGVÆT7F–öâÒ66†VGVÆT'WGFöâæFF6WBç7G&VæwF…66†VGVÆT7F–öã°Ð¢6öç7BÆâÒ&VD&÷fVE7G&VæwF…Æâ‚“°Ð¢6öç7B6öçFW‡BÒ7G&VæwF…66†VGVÆT6öçFW‡B‚“°Ð¢–b‚Æâ’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$&÷fRF†R7G&VæwF‚&öw&Ò&Vf÷&R66†VGVÆ–ærF†RvVV²â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‡66†VGVÆT7F–öâÓÓÒ&vVæW&FR"’°Ð¢6öç7BG&gBÒFöÖ–æ–öå7G&VæwF…66†VGVÆRæ'V–ÆEvVV¶Ç•66†VGVÆR‡ÆâÂ&VE7G&VæwF„†—7F÷'’‚’Â6öçFW‡BÂ°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢&VfW'&VDF—3¢7G&VæwF…66†VGVÆU&VfW'&VDF—4g&öÔf÷&Ò‡Æâ’ÀÐ¢7&VFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%44„TETÄR"Â&G&gB"ÂG&gB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&G&gB"ÂG&gB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂG&gBæ&÷fÄ&Æö6¶V@Ð¢ò%vVV¶Ç’G&gBvVæW&FVBÂ'WB†&B×6W76–öâ6öÆÆ—6–öâ×W7B&R&W6öÇfVB&Vf÷&R&÷fÂâ Ð¢¢$6ö÷&F–æFVB6WfVâÖF’7G&VæwF‚G&gBvVæW&FVBâ&Wf–WrV6‚F’&Vf÷&R&÷fÂâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‡66†VGVÆT7F–öâÓÓÒ&&÷fR"’°Ð¢G'’°Ð¢6öç7B&÷fVBÒFöÖ–æ–öå7G&VæwF…66†VGVÆRæ&÷fU66†VGVÆR‡&VE7G&VæwF…66†VGVÆTG&gB‚’ÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%44„TETÄR"Â&7W'&VçB"Â&÷fVB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&7W'&VçB"Â&÷fVB“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&G&gB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚%tTTµõ$Ud”Ur"Â&7W'&VçB"“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â%vVV¶Ç’7G&VæwF‚66†VGVÆR&÷fVBâ66†VGVÆVB6W76–öç2æB&V6÷fW'’F—2æ÷rv÷fW&âFöF’â"“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†RvVV¶Ç’7G&VæwF‚66†VGVÆR6÷VÆBæ÷B&R&÷fVBâ"“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b‡66†VGVÆT7F–öâÓÓÒ&Ö÷fR"’°Ð¢6öç7B66†VGVÆRÒ&VD&÷fVE7G&VæwF…66†VGVÆR‚“°Ð¢6öç7BF&vWBÒ66†VGVÆT'WGFöâæ6Æ÷6W7B‚"ç7G&VæwF‚×&W66†VGVÆRÖ6öçG&öÂ"“òçVW'•6VÆV7F÷"‚'6VÆV7B"“òçfÇVRÇÂ"#°Ð¢6öç7B&W7VÇBÒFöÖ–æ–öå7G&VæwF…66†VGVÆRæÖ÷fT76–væÖVçB‡66†VGVÆRÂ66†VGVÆT'WGFöâæFF6WBæ76–væÖVçD–BÂF&vWBÂ6öçFW‡BÂ°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢†—7F÷'“¢&VE7G&VæwF„†—7F÷'’‚’ÀÐ¢6†ævVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢&V6öã¢$Ö÷fVBFVÆ–&W&FVÇ’'’F†RF†ÆWFR–âvVV¶Ç’7G&VæwF‚6öÖÖæBâ Ð¢Ò“°Ð¢–b‡&W7VÇBçfÆ–B’°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%44„TETÄR"Â&7W'&VçB"Â&W7VÇBç66†VGVÆR“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&7W'&VçB"Â&W7VÇBç66†VGVÆR“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢ÐÐ¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â&W7VÇBæÖW76vR“°Ð¢&WGW&ã°Ð¢ÐÐ¢ÐÐ¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×&öw&ÖÖ–ærÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBç&öw&ÖÖ–æt7F–öã°Ð¢–b…²'&WF–â×G&–Â"Â'&WVB×G&–Â"Â'&öÆÆ&6²×G&–Â%Òæ–æ6ÇVFW2†7F–öâ’’°Ð¢–b†7F–öâÓÓÒ'&öÆÆ&6²×G&–Â"bbv–æF÷ræ6öæf—&Ò‚%&W7F÷&RF†R&R×G&–ÂF&vWG2–âæWrÆâ&Wf—6–öãòF†Rv÷&¶÷WBWf–FVæ6Rv–ÆÂ&VÖ–â–çF7Bâ"’’&WGW&ã°Ð¢G'’°Ð¢6öç7B&W7VÇBÒv—B&W6öÇfU7G&VæwF…&öw&W76–öåG&–Â†7F–öâç&WÆ6R‚"×G&–Â"Â""’“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â&W7VÇBæÖW76vR“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R&öw&W76–öâG&–Â6÷VÆBæ÷B&R&W6öÇfVBâ"“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'G&–â×6W76–öâ"’°Ð¢v—BÆVæ6„&÷fVE7G&VæwF…6W76–öâ†'WGFöâæFF6WBç6W76–öä–B“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'f–WrÖ–çFVÆÆ–vVæ6R"’°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&öw&W72"“°Ð¢&VæFW%7G&VæwF„–çFVÆÆ–vVæ6R‡&VD&÷fVE7G&VæwF…Æâ‚’“°Ð¢6öç7BFWF–ÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7G&VæwF‚Ö–çFVÆÆ–vVæ6RÖFWF–Â"“°Ð¢–b†FWF–Â’°Ð¢FWF–Âæ÷VâÒG'VS°Ð¢FWF–Âç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç&öw&ÖÖ–æt7F–öâÓÓÒ'&Vg&W6‚"’°Ð¢6öç7B&öf–ÆRÒ7G&VæwF…&öf–ÆTg&öÔf÷&Ò‚“°Ð¢6öç7BG&gBÒFöÖ–æ–öå7G&VæwF…G&–æ–æræ'V–ÆE7G&VæwF…&öw&Ò‡&öf–ÆRÂW&f÷&Öæ6TVçG&–W2Â°Ð¢7F'DFFS¢FöF”•4ôFFR‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$E$eB"Â&7W'&VçB"ÂG&gB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$E$eB"Â&7W'&VçB"ÂG&gB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$Wf–FVæ6R&Vg&W6†VBâ&Wf–WrF†R&Wf—6VBG&gB&Vf÷&R&÷fÂâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&'V–ÆB×Æâ"’°Ð¢6öç7B&öf–ÆRÒ7G&VæwF…&öf–ÆTg&öÔf÷&Ò‚“°Ð¢6öç7BG&gBÒFöÖ–æ–öå7G&VæwF…G&–æ–æræ'V–ÆE7G&VæwF…&öw&Ò‡&öf–ÆRÂW&f÷&Öæ6TVçG&–W2Â°Ð¢7F'DFFS¢FöF”•4ôFFR‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚$E$eB"Â&7W'&VçB"ÂG&gB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚$E$eB"Â&7W'&VçB"ÂG&gB“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â$&Ææ6VBG&gBvVæW&FVBâ&Wf–WrWfW'’6W76–öâÂF†Vâ&÷fRv†Vâ—BÖF6†W2–÷W"6öç7G&–çG2â"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&&÷fR"’°Ð¢6öç7B&öf–ÆRÒ7G&VæwF…&öf–ÆTg&öÔf÷&Ò‚“°Ð¢6öç7BG&gBÒ&VE7G&VæwF„G&gB‚’ÇÂFöÖ–æ–öå7G&VæwF…G&–æ–æræ'V–ÆE7G&VæwF…&öw&Ò‡&öf–ÆRÂW&f÷&Öæ6TVçG&–W2Â°Ð¢7F'DFFS¢FöF”•4ôFFR‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢6öç7B&÷fVBÒFöÖ–æ–öå7G&VæwF…G&–æ–æræ&÷fUÆâ†G&gBÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%Äâ"Â&7W'&VçB"Â&÷fVB“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%$ôd”ÄR"Â&7W'&VçB"Â&öf–ÆR“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%Äâ"Â&7W'&VçB"Â&÷fVB“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚$E$eB"Â&7W'&VçB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚$D¥U5DÔTåB"Â&7W'&VçB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚%E$”Â"Â&7W'&VçB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&7W'&VçB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"Â&G&gB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚%tTTµõ$Ud”Ur"Â&7W'&VçB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&7W'&VçB"“°Ð¢v—B6ÆV%7G&VæwF…G&–æ–æu7FFR‚$$Äô4²"Â&G&gB"“°Ð¢v—B&Vg&W6…Væ–f–VEvVV´G&gDf÷%Æç2‚“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢&VæFW$6öçG&7D7F—fF–öâ‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â%7G&VæwF‚&öw&Ò&÷fVBæB7F—fFVBöâFöF’â—Bæ÷rW'6—7G2v—F‚–÷W"66÷VçBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&&÷fRÖF§W7FÖVçB"’°Ð¢G'’°Ð¢6öç7B&÷fVBÒv—B&÷fU7G&VæwF„F§W7FÖVçB‚“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢&VæFW%FöF”6öÖÖ—GFVEvVV²‚“°Ð¢&VæFW%&öw&Ô6öÖÖæB‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂG¶&÷fVBæF§W7FÖVçBç7VÖÖ'’æÆ–VD6÷VçGÒV&æVB6†ævRG¶&÷fVBæF§W7FÖVçBç7VÖÖ'’æÆ–VD6÷VçBÓÓÒò""¢'2'Ò7F—fFVBâÆâ"G¶&÷fVBçÆâç&Wf—6–öçÒv–ÆÂv÷fW&âF†RæW‡BÖF6†–ær6W76–öâæ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†RF§W7FÖVçB6÷VÆBæ÷B&R&÷fVBâ"“°Ð¢ÐÐ¢ÐÐ¢–b†7F–öâÓÓÒ&†öÆBÖF§W7FÖVçB"’°Ð¢v—B†öÆE7G&VæwF„F§W7FÖVçB‚“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â%&V6öÖÖVæFF–öâ†VÆBâF†R7F—fR7G&VæwF‚Æâ&VÖ–ç2Væ6†ævVBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&öÆÆ&6²ÖF§W7FÖVçB"’°Ð¢–b‚v–æF÷ræ6öæf—&Ò‚%VæFòF†—27F—fF–öâæB&W7F÷&RF†R&–÷"F&vWG2–âæWrÆâ&Wf—6–öãò"’’&WGW&ã°Ð¢G'’°Ð¢6öç7B&öÆÆVD&6²Òv—B&öÆÆ&6µ7G&VæwF„F§W7FÖVçB‚“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢&VæFW%FöF”6öÖÖ—GFVEvVV²‚“°Ð¢&VæFW%&öw&Ô6öÖÖæB‚“°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"Â7F—fF–öâVæFöæRâ&–÷"F&vWG2&R&W7F÷&VB–âÆâ"G·&öÆÆVD&6²çÆâç&Wf—6–öçÒæ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'&öw&ÖÖ–ærÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R7F—fF–öâ6÷VÆBæ÷B&RVæFöæR6fVÇ’â"“°Ð¢ÐÐ¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&V6÷fW'’×&Wf–Wr×æVÂ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×&V6÷fW'’Ö7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢–b†'WGFöâæFF6WBç&V6÷fW'”7F–öâÓÓÒ'&Vg&W6‚"’°Ð¢&VæFW%&V6÷fW'•&Wf–Wr‚“°Ð¢6WEFW‡B‚'&V6÷fW'’ÖfVVF&6²"Â%&V6÷fW'’æBgVVÆ–ærWf–FVæ6R&Vg&W6†VBâ"“°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç&V6÷fW'”7F–öâÓÓÒ&&÷fR"’°Ð¢6öç7B&V6öÖÖVæFF–öâÒ'V–ÆD7W'&VçE&V6÷fW'•&V6öÖÖVæFF–öâ‚“°Ð¢–b‚&V6öÖÖVæFF–öâ’&WGW&ã°Ð¢6öç7BÆâÒ°Ð¢&÷fVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢&V6öÖÖVæFF–öâÀÐ¢Æã¢FöÖ–æ–öå&V6÷fW'’æf÷&ÖE&V6÷fW'•Æâ‡&V6öÖÖVæFF–öâÐ¢Ó°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡&V6÷fW'•7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡Æâ’“°Ð¢&VæFW%&V6÷fW'•&Wf–Wr‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚'&V6÷fW'’ÖfVVF&6²"Â%&V6÷fW'’Æâ&÷fVBÆö6ÆÇ’âFöFœ:.(*Î(J'2Ö—76–öâv2æ÷B6†ævVBâ"“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°¢6öç7B&–÷$'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖÖ÷&æ–ær×&–÷"Ö7F–öåÒ"“°¢–b‡&–÷$'WGFöâ’°¢&–÷$'WGFöâæF—6&ÆVBÒG'VS°¢G'’°¢6öç7B&W7VÇBÒv—B&W6öÇfTÖ÷&æ–æu&–÷%v÷&²‡&–÷$'WGFöâæFF6WBæÖ÷&æ–æu&–÷$7F–öâÂ&–÷$'WGFöâæFF6WBæW†V7WF–öä–B“°¢6WEFW‡B‚&Ö÷&æ–ærÖ6öÖÖæBÖfVVF&6²"Â&–÷$'WGFöâæFF6WBæÖ÷&æ–æu&–÷$7F–öâÓÓÒ%$U5TÔR ¢ò%F†RVæf–æ—6†VB6W76–öâ—2æ÷rF†R7F—fR6öÖÖæBâFöFž(	—266†VGVÆVB76–væÖVçB&VÖ–ç2&÷FV7FVBâ ¢¢&–÷$'WGFöâæFF6WBæÖ÷&æ–æu&–÷$7F–öâÓÓÒ%$U44„TETÄR ¢ò%&–÷"Wf–FVæ6R&W6W'fVBâ6ÆVæF"÷VæVBf÷"FVÆ–&W&FRÆ6VÖVçBâ ¢¢%&–÷"Wf–FVæ6R&W6W'fVB2–æ6ö×ÆWFRâFöFž(	—26öÖÖæB—2æ÷r6ÆV"â"“°¢&WGW&â&W7VÇC°¢Ò6F6‚†W'&÷"’°¢6WEFW‡B‚&Ö÷&æ–ærÖ6öÖÖæBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†B&–÷"ÖF’FV6—6–öâ6÷VÆBæ÷B&R6fVBâ"“°¢Òf–æÆÇ’°¢&–÷$'WGFöâæF—6&ÆVBÒfÇ6S°¢Ð¢&WGW&ã°¢Ð¢6öç7B6öÖÖæD'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖÖ÷&æ–ærÖ6öÖÖæBÖ7F–öåÒ"“°¢–b†6öÖÖæD'WGFöâ’°¢6öÖÖæD'WGFöâæF—6&ÆVBÒG'VS°¢G'’²v—B÷VäÖ÷&æ–æt6öÖÖæEF&vWB†7W'&VçDÖ÷&æ–æt6öÖÖæD7F—fF–öâ“²Ð¢6F6‚†W'&÷"’²6WEFW‡B‚&Ö÷&æ–ærÖ6öÖÖæBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R7F—fRÆövvW"6÷VÆBæ÷B&R÷VæVBâ"“²Ð¢f–æÆÇ’²6öÖÖæD'WGFöâæF—6&ÆVBÒfÇ6S²Ð¢&WGW&ã°¢Ð¢6öç7B6ö×ÆWF–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6öÖÖæBÖ6ö×ÆWF–öâÖ7F–öåÒ"“°¢–b†6ö×ÆWF–öä'WGFöâ’°¢6ö×ÆWF–öä'WGFöâæF—6&ÆVBÒG'VS°¢G'’²÷Vä6öÖÖæD6ö×ÆWF–öåF&vWB†7W'&VçD6öÖÖæD6ö×ÆWF–öä6W'F–f–6F–öâ“²Ð¢f–æÆÇ’²6ö×ÆWF–öä'WGFöâæF—6&ÆVBÒfÇ6S²Ð¢&WGW&ã°¢Ð¢6öç7BFV6—6–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖFÆ2Ö6Æ÷6VBÖÆö÷Ö7F–öåÒ"“°¢–b‚FV6—6–öä'WGFöâ’&WGW&ã°¢6öç7BFV6—6–öäFFRÒFV6—6–öä'WGFöâæFF6WBæFV6—6–öäFFRÇÂFöF”•4ôFFR‚“°¢6öç7B7F–öâÒFV6—6–öä'WGFöâæFF6WBæFÆ46Æ÷6VDÆö÷7F–öã°¢FV6—6–öä'WGFöâæF—6&ÆVBÒG'VS°¢G'’°¢6öç7B&W6öÇfVBÒv—B&W6öÇfTFÆ46Æ÷6VDÆö÷FV6—6–öâ†FV6—6–öäFFRÂ7F–öâ“°¢6WEFW‡B‚&F–Ç’Ö6Æ÷6V÷WBÖfVVF&6²"Â&W6öÇfVCòç7FGW2ÓÓÒ$$õdTB ¢ò66WFVBf÷"G·&W6öÇfVBæVffV7F—fTFFWÒâFöF’æB6ÆVæF"æ÷rW6RF†R6ÖR&÷VæFVBF§W7FÖVçBæ ¢¢$7W'&VçBÆâ&W6W'fVBâF†R6ö6†–ær6ÆÂ&VÖ–ç2–â†—7F÷'’â"“°¢Òf–æÆÇ’°¢FV6—6–öä'WGFöâæF—6&ÆVBÒfÇ6S°¢Ð¢Ò“°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6Æ÷6VBÖÆö÷Ö7F–öåÒ"“°¢–b‚'WGFöâÇÂG—VöbFöÖ–æ–öä6Æ÷6VDÆö÷ÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæ6Æ÷6VDÆö÷7F–öã°Ð¢–b†7F–öâÓÓÒ&÷W&F–æu÷G'WF‚"’°Ð¢6öç7BG'WF‚Ò'V–ÆD7W'&VçD÷W&F–æuG'WF‚‚“°Ð¢6öç7B6V7F–öâÒG'WFƒòæ7F–öãòç6V7F–öâÇÂ'FöF’#°Ð¢–b‡G'WFƒòæ7F–öãòæÖöGVÆRbb6V7F–öâÓÓÒ'W&f÷&Öæ6R"’°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‡G'WF‚æ7F–öâæÖöGVÆRÓÓÒ''Vææ–ær"ò''Vææ–ær"¢G'WF‚æ7F–öâæÖöGVÆRÓÓÒ&6÷&R"ò&6÷&R"¢'FöF•÷G&–æ–ær"“°Ð¢ÐÐ¢6WD7F—fU6V7F–öâ‡6V7F–öâ“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â2G·6V7F–öçÖ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Vg&W6‚"’°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"Â%&VF–æW72Â&W67&—F–öç2ÂW†V7WF–öâÂæBWf–FVæ6RvW&R&V6öæ6–ÆVBv–ââ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6ö×ÆWFUöö'6W'fF–öâ"’°Ð¢6WD7F—fU6V7F–öâ‚'FöF’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7FöF’"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&VæW&w’"“òæfö7W2‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&&÷fUöFV6—6–öâ"’°Ð¢6öç7B&÷fVBÒv—B&÷fT7W'&VçD6Æ÷6VDÆö÷FV6—6–öâ‚“°Ð¢–b‚&÷fVB’°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"Â$6ö×ÆWFRFöF’w2&öÆÂ6ÆÂ&Vf÷&RWF†÷&—¦–ær6ö6†–ærFV6—6–öââ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B6ö6†–ærÒ'V–ÆD7W'&VçDF–Ç”6ö6†–ætÆö÷‚’ÇÂ·Ó°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ†F–Ç”÷&FW'57F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡°Ð¢&÷fVDC¢&÷fVBæ&÷fVDBÀÐ¢FV6—6–öä–C¢&÷fVBæ–BÀÐ¢÷7GW&S¢&÷fVBç÷7GW&RÀÐ¢†VFÆ–æS¢&÷fVBæÖ—76–öâÀÐ¢÷&FW'3¢&÷fVBæÖ—76–öâÀÐ¢6fVwV&G3¢&÷fVBç6fVwV&G2ÀÐ¢6ö6†–æu÷7GW&S¢6ö6†–ærç÷7GW&RÇÂçVÆÀÐ¢Ò’“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"Â%FöF’w2FV6—6–öâ—2WF†÷&—¦VBâF†R&÷fVB&W67&—F–öâf–ævW'&–çB—2æ÷rf—†VBf÷"Wf–FVæ6R&V6öæ6–Æ–F–öââ"“°Ð¢6WEFW‡B‚&F–Ç’Ö÷&FW'2ÖfVVF&6²"Â%FöF’w26ö6†–ærFV6—6–öâæBW†V7WF–öâ÷&FW'2&RWF†÷&—¦VBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6öçF–çVUöW†V7WF–öâ"’°Ð¢6WD7F—fU6V7F–öâ‚'FöF’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7FöF’"“°Ð¢6öç7B6WVVæ6RÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’×6WVVæ6RÖFWF–Â"“°Ð¢–b‡6WVVæ6R’6WVVæ6Ræ÷VâÒG'VS°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&F–Ç’Ö÷&FW'2Ö†VF–ær"“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷Våö6Æ÷6V÷WB"’°¢÷VäF–Ç”6Æ÷6V÷WDf÷$FFR‡FöF”•4ôFFR‚’“°¢&WGW&ã°¢ÐÐ¢–b†7F–öâÓÓÒ&6Æ÷6U÷&Wf–Wr"’°¢–b‡&VDF–Ç”6Æ÷6V÷WB‚“òç7FGW2ÓÒ%4TÄTB"’°¢÷VäF–Ç”6Æ÷6V÷WDf÷$FFR‡FöF”•4ôFFR‚’Â²f÷&6S¢G'VRÒ“°¢6WEFW‡B‚&F–Ç’Ö6Æ÷6V÷WBÖfVVF&6²"Â$6ö×ÆWFRF†RF–Ç’6Æ÷6V÷WB&Vf÷&R6VÆ–ærF†RWf–FVæ6R&Wf–Wrâ"“°¢&WGW&ã°¢ÐÐ¢6öç7B7FFRÒ'V–ÆD7W'&VçD6Æ÷6VDÆö÷7FFR‚“°Ð¢6öç7B&W7VÇBÒFöÖ–æ–öä6Æ÷6VDÆö÷æ6Æ÷6U&Wf–Wr‡7FFSòæFV6—6–öâÇÂ·ÒÂ7FFSòç&V6öæ6–Æ–F–öâÇÂ·ÒÂ°Ð¢†—7F÷'“¢&VD6Æ÷6VDÆö÷†—7F÷'’‚’ÀÐ¢6Æ÷6VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢VffV7F—fTFFS¢FD6Æ÷6VDÆö÷F—2‡FöF”•4ôFFR‚’ÂÐ¢Ò“°Ð¢–b‚&W7VÇBçfÆ–B’°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"Â&W7VÇBæÖW76vR“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B†—7F÷'’Ò²ââç&VD6Æ÷6VDÆö÷†—7F÷'’‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæFV6—6–öä–BÓÒ&W7VÇBç&Wf–WræFV6—6–öä–B’Â&W7VÇBç&Wf–WuÓ°Ð¢6fT6Æ÷6VDÆö÷Æö6Â‚%$Ud”Ur"ÂFöF”•4ôFFR‚’Â&W7VÇBç&Wf–Wr“°Ð¢6fT6Æ÷6VDÆö÷Æö6Â‚$DDD”ôâ"Â&7W'&VçB"Â&W7VÇBç&Wf–WræFFF–öâ“°Ð¢6fT6Æ÷6VDÆö÷Æö6Â‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢v—BW'6—7D6Æ÷6VDÆö÷7FFR‚%$Ud”Ur"ÂFöF”•4ôFFR‚’Â&W7VÇBç&Wf–Wr“°Ð¢v—BW'6—7D6Æ÷6VDÆö÷7FFR‚$DDD”ôâ"Â&7W'&VçB"Â&W7VÇBç&Wf–WræFFF–öâ“°Ð¢v—BW'6—7D6Æ÷6VDÆö÷7FFR‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"Â&W7VÇBæÖW76vR“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&&÷fUöFFF–öâ"’°Ð¢6öç7B7FFRÒ'V–ÆD7W'&VçD6Æ÷6VDÆö÷7FFR‚“°Ð¢6öç7B&÷fVBÒFöÖ–æ–öä6Æ÷6VDÆö÷æ&÷fTFFF–öâ€Ð¢7FFSòæFFF–öâÇÂ·ÒÀÐ¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢FD6Æ÷6VDÆö÷F—2‡FöF”•4ôFFR‚’ÂÐ¢“°Ð¢–b‚&÷fVB’&WGW&ã°Ð¢6öç7B&Wf–WrÒ7FFRç&Wf–Wrò²ââç7FFRç&Wf–WrÂFFF–öã¢&÷fVBÒ¢çVÆÃ°Ð¢6öç7B†—7F÷'’Ò&VD6Æ÷6VDÆö÷†—7F÷'’‚’æÖ‚†—FVÒ’Óâ—FVÒæFV6—6–öä–BÓÓÒ&÷fVBæFV6—6–öä–Bò²ââæ—FVÒÂFFF–öã¢&÷fVBÒ¢—FVÒ“°Ð¢6fT6Æ÷6VDÆö÷Æö6Â‚$DDD”ôâ"Â&7W'&VçB"Â&÷fVB“°Ð¢–b‡&Wf–Wr’6fT6Æ÷6VDÆö÷Æö6Â‚%$Ud”Ur"ÂFöF”•4ôFFR‚’Â&Wf–Wr“°Ð¢6fT6Æ÷6VDÆö÷Æö6Â‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢v—BW'6—7D6Æ÷6VDÆö÷7FFR‚$DDD”ôâ"Â&7W'&VçB"Â&÷fVB“°Ð¢–b‡&Wf–Wr’v—BW'6—7D6Æ÷6VDÆö÷7FFR‚%$Ud”Ur"ÂFöF”•4ôFFR‚’Â&Wf–Wr“°Ð¢v—BW'6—7D6Æ÷6VDÆö÷7FFR‚$„•5Dõ%’"Â&7W'&VçB"Â†—7F÷'’“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"ÂæW‡BF§W7FÖVçB&÷fVBf÷"G¶&÷fVBæVffV7F—fTFFWÒâW†—7F–ærÆç2&VÖ–âVæ6†ævVBVçF–ÂF†V—"÷vâ&÷fÂv÷&¶fÆ÷rÆ–W2—Bæ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'f–Wuö†—7F÷'’"’°Ð¢6öç7B†—7F÷'’Ò&VD6Æ÷6VDÆö÷†—7F÷'’‚“°Ð¢6öç7BÆ7BÒ†—7F÷'•¶†—7F÷'’æÆVæwF‚ÒÓ°Ð¢6WEFW‡B‚&6Æ÷6VBÖÆö÷ÖfVVF&6²"ÂÆ7@Ð¢òG¶†—7F÷'’æÆVæwF‡Ò6Æ÷6VBÆö÷G¶†—7F÷'’æÆVæwF‚ÓÓÒò""¢'2'ÒâÆFW7C¢G¶Æ7BæFFWÒ+rG¶Æ7BæFFF–öãòæÆ&VÂÇÂ$æòF§W7FÖVçB'Òæ Ð¢¢$æò&–÷"6Æ÷6VBÆö÷2–WBâ"“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖFÆ2Ö–çFW'fVçF–öâÖ7F–öåÒÂ'WGFöå¶FFÖFF—fRÖ7F–öåÒ"“°Ð¢–b‚'WGFöâÇÂG—VöbFöÖ–æ–öäFF—fT6ö6†–ærÓÓÒ'VæFVf–æVB"ÇÂG—VöbFöÖ–æ–öäFÆ4–çFW'fVçF–öâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæFÆ4–çFW'fVçF–öä7F–öâÇÂ'WGFöâæFF6WBæFF—fT7F–öã°Ð¢–b†7F–öâÓÓÒ'&Vg&W6‚"’°Ð¢&VæFW$FF—fT6ö6†–ær‚“°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"Â$6ö6‚6†V6²&Vg&W6†VBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷VâÖ6öçG&7B"’°Ð¢6WD7F—fU6V7F–öâ‚&6öçG&7B"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"66öçG&7B"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&V7'V—BÖ6öçG&7BÖ†VF–ær"“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷Vâ×&öÆÂÖ6ÆÂ"’°Ð¢6WD7F—fU6V7F–öâ‚'FöF’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7FöF’"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&VæW&w’"“òæfö7W2‚“°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"Â%&Wf–WrFöF’w2&öÆÂ6ÆÂÂF†VâFÆ2v–ÆÂ6†V6²v–ââ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6öçF–çVR"’°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&öæRÖ6öÖÖæB×&–Ö'’"“òæ6Æ–6²‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B&÷÷6ÂÒ'V–ÆD7W'&VçDFF—fT6ö6†–ær‚“°Ð¢–b‚&÷÷6Â’&WGW&ã°Ð¢–b†7F–öâÓÓÒ&ç7vW""’°Ð¢6öç7B–çFW'fVçF–öâÒFöÖ–æ–öäFÆ4–çFW'fVçF–öâæ'V–ÆD–çFW'fVçF–öâ‡&÷÷6ÂÂ&÷÷6ÂæFÆ4–çFW'fVçF–öãòç&W7öç6RÇÂçVÆÂ“°Ð¢6öç7B&W7öç6RÒFöÖ–æ–öäFÆ4–çFW'fVçF–öâæç7vW$–çFW'fVçF–öâ€Ð¢–çFW'fVçF–öâÀÐ¢'WGFöâæFF6WBæç7vW"ÀÐ¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢“°Ð¢6öç7Bç7vW&VE&÷÷6ÂÒFöÖ–æ–öäFÆ4–çFW'fVçF–öâæGF6…&W7öç6R‡&÷÷6ÂÂ&W7öç6R“°Ð¢–b‚ç7vW&VE&÷÷6Â’&WGW&ã°Ð¢v—B6fTFF—fT6ö6†–æu&V6÷&B†ç7vW&VE&÷÷6Â“°Ð¢&VæFW$FF—fT6ö6†–ær‚“°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"Â$ç7vW"6fVBâ&Wf–WrF†R6ö6†–ær6ÆÂâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&&÷fR"’°Ð¢6öç7B–çFW'fVçF–öâÒFöÖ–æ–öäFÆ4–çFW'fVçF–öâæ'V–ÆD–çFW'fVçF–öâ‡&÷÷6ÂÂ&÷÷6ÂæFÆ4–çFW'fVçF–öãòç&W7öç6RÇÂçVÆÂ“°Ð¢–b‚–çFW'fVçF–öâæ6ä&÷fR’°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"Â%F†RF§W7FÖVçB6÷VÆBæ÷B&R&÷fVBv—F†÷WB–÷W"ç7vW"â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B&÷fVBÒFöÖ–æ–öäFF—fT6ö6†–æræ&÷fU&÷÷6Â€Ð¢&÷÷6ÂÀÐ¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢&÷÷6ÂæVffV7F—fTFFPÐ¢“°Ð¢–b‚&÷fVB’°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"Â%F†—26ö6†–ær7FFRFöW2æ÷B&WV—&R&÷fÂâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B7–æ6VBÒv—B6fTFF—fT6ö6†–æu&V6÷&B†&÷fVB“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"ÂF§W7FÖVçB&÷fVBf÷"G¶&÷fVBæVffV7F—fTFFWÒG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òæ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&†öÆB"’°Ð¢6öç7B†VÆBÒFöÖ–æ–öäFF—fT6ö6†–æræ†öÆE&÷÷6Â‡&÷÷6ÂÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢–b‚†VÆB’&WGW&ã°Ð¢6öç7B7–æ6VBÒv—B6fTFF—fT6ö6†–æu&V6÷&B††VÆB“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&FF—fRÖ6ö6†–ærÖfVVF&6²"Â7W'&VçBÆâ¶WBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'Òæ“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&F–Ç’Ö÷&FW'2×æVÂ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖF–Ç’Ö7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæF–Ç”7F–öã°Ð¢–b†7F–öâÓÓÒ'&Vg&W6‚"’°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&F–Ç’Ö÷&FW'2ÖfVVF&6²"Â%FöFž(	—2&VF–æW72Â6öææV7FVBWf–FVæ6RÂæB&÷fVBÆç2vW&R&Vg&W6†VBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&&÷fUö÷&FW'2"’°Ð¢6öç7BÆö÷Ò'V–ÆD7W'&VçDF–Ç”6ö6†–ætÆö÷‚“°Ð¢–b‚Æö÷ÇÂF–Ç•7FFRÇÂÆö÷ç6fVwV&G2ç–ä÷fW'&–FRÇÂ†Æö÷ç6fVwV&G2ç&öw&W76–öä†VÆBbb&VE&V6÷fW'•Æâ‚’’’&WGW&ã°Ð¢6öç7B&÷fÂÒ°Ð¢&÷fVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢÷7GW&S¢Æö÷ç÷7GW&RÀÐ¢†VFÆ–æS¢Æö÷æ†VFÆ–æRÀÐ¢÷&FW'3¢FöÖ–æ–öäF–Ç”6ö6†–æræf÷&ÖD&÷fVD÷&FW'2†Æö÷’ÀÐ¢6fVwV&G3¢Æö÷ç6fVwV&G0Ð¢Ó°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ†F–Ç”÷&FW'57F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’†&÷fÂ’“°Ð¢v—B&÷fT7W'&VçD6Æ÷6VDÆö÷FV6—6–öâ‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&F–Ç’Ö÷&FW'2ÖfVVF&6²"Â%FöFž(	—2÷&FW'2&÷fVBöâF†—2FWf–6RâF†RÖ—76–öâæBF–Ç’&V6÷&BvW&Ræ÷B6†ævVBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Wf–Wu÷&V6÷fW'’"’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&V6÷fW'’"“°Ð¢&VæFW%&V6÷fW'•&Wf–Wr‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Wf–Wu÷&öw&ÖÖ–ær"’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&öw&ÖÖ–ær"“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'7F'E÷G&–æ–ær"’°Ð¢6öç7B76–væÖVçBÒ'V–ÆD7W'&VçDF–Ç”76–væÖVçB‚“°Ð¢6öç7BW†V7WF–öâÒ&VDF–Ç”76–væÖVçDW†V7WF–öâ‚“°Ð¢–b†76–væÖVçCòæW†W&6—6W2æÆVæwF‚bbW†V7WF–öâç7FFRÓÓÒ%$TE’"’°Ð¢6öç7B7F'FVBÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç7F'Ev÷&¶÷WB†W†V7WF–öâÂ7W'&VçE7G&VæwF…&W67&—F–öâ‚’ÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ‡7F'FVB“°Ð¢ÒVÇ6R–b‚76–væÖVçCòæW†W&6—6W2æÆVæwF‚’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&öw&ÖÖ–ær"“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢ÐÐ¢6öç7Bv÷&¶÷WDFWF–ÂÒFö7VÖVçBçVW'•6VÆV7F÷"‚"çFöF’×v÷&¶÷WBÖFWF–Â"“°Ð¢–b‡v÷&¶÷WDFWF–Â’v÷&¶÷WDFWF–Âæ÷VâÒG'VS°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&F–Ç’Ö76–væÖVçBÖ†VF–ær"“òæfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷VåögVVÂ"’°Ð¢6WD7F—fU6V7F–öâ‚&çWG&—F–öâ"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"6çWG&—F–öâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&6ö×ÆWFU÷&V6÷fW'’"’°Ð¢6öç7BÖ—76–öä÷&FW"Ò7W'&VçDÖ—76–öå&V6÷fW'”÷&FW"‚“°Ð¢6öç7B7W'&VçEF6²ÒG—VöbFöÖ–æ–öäÖ—76–öå&V6÷fW'’ÓÓÒ'VæFVf–æVB"òçVÆÂ¢FöÖ–æ–öäÖ—76–öå&V6÷fW'’ææW‡EF6²†Ö—76–öä÷&FW"ÇÂ·Ò“°Ð¢–b†Ö—76–öä÷&FW"bb7W'&VçEF6²’v—B6ö×ÆWFTÖ—76–öå&V6÷fW'•F6²†7W'&VçEF6²æ–B“°Ð¢VÇ6R6fTF–Ç”W†V7WF–öåVWVU7FFR‡²&V6÷fW'”6ö×ÆWFS¢G'VRÂ&V6÷fW'”6ö×ÆWFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢6WEFW‡B‚&F–Ç’Ö÷&FW'2ÖfVVF&6²"Â%&V6÷fW'’7F–öâ&V6÷&FVBâF†RVWVRGfæ6VBFòF†RæW‡B–æ6ö×ÆWFR7FWâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Wf–Wu÷&V6÷&B"’°Ð¢6WD7F—fU6V7F–öâ‚'&V6÷&B"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7&V6÷&B"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&÷Våö6Æ÷6V÷WB"’°¢6WD7F—fU6V7F–öâ‚'FöF’"“°¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7FöF’"“°¢÷VäF–Ç”6Æ÷6V÷WDf÷$FFR‡FöF”•4ôFFR‚’“°¢Ð¢–b†7F–öâÓÓÒ'&öÆÅö6ÆÂ"’°Ð¢6WD7F—fU6V7F–öâ‚'FöF’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7FöF’"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&VæW&w’"“òæfö7W2‚“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&F–Ç’Ö76–væÖVçB×æVÂ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ76–væÖVçBÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæ76–væÖVçD7F–öã°Ð¢6öç7B76–væÖVçBÒ'V–ÆD7W'&VçDF–Ç”76–væÖVçB‚“°¢ÆWBW†V7WF–öâÒ&VDF–Ç”76–væÖVçDW†V7WF–öâ‚“°¢–b†7F–öâÓÓÒ'&V6öæ6–ÆR×&W7VÖR"’°¢–b…7G&–ær†W†V7WF–öâç7FFRÇÂ""’çFõWW$66R‚’ÓÓÒ%U4TB"’°¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&W7VÖUv÷&¶÷WB†W†V7WF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°¢Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â&W7VÖ–ærG¶W†V7WF–öâç6W76–öå6æ6†÷Còç6W76–öäæÖRÇÂW†V7WF–öâç6W76–öå6æ6†÷CòçF—FÆRÇÂ'F†RVæf–æ—6†VB6W76–öâ'ÒâFöF’w276–væÖVçB&VÖ–ç2VçF÷V6†VBæ“°¢&VæFW$F–Ç”76–væÖVçB‚“°¢&WGW&ã°¢Ð¢–b†7F–öâÓÓÒ'&V6öæ6–ÆR×7F'B×FöF’"’°¢6öç7B7F—fRÒ&VD7F—fU7G&VæwF„W†V7WF–öâ‚“°¢–b‚7F—fRÇÂ76–væÖVçCòæW†W&6—6W3òæÆVæwF‚’&WGW&ã°¢–b‚v–æF÷ræ6öæf—&Ò†VæBG¶7F—fRç6W76–öå6æ6†÷Còç6W76–öäæÖRÇÂ7F—fRç6W76–öå6æ6†÷CòçF—FÆRÇÂ'F†RVæf–æ—6†VB6W76–öâ'Ò2–æ6ö×ÆWFRæB7F'BFöF’w2G¶76–væÖVçBç6W76–öäæÖRÇÂ76–væÖVçBçF—FÆWÓò&–÷"Wf–FVæ6Rv–ÆÂ&R&W6W'fVBæ’’&WGW&ã°¢6öç7B7F÷VBÒFöÖ–æ–öä&WF7FFT–çFVw&—G’æVæD–æ6ö×ÆWFU6W76–öâ†7F—fRÂ°¢VæFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’À¢&V6öã¢$VæFVB'’&V7'V—B&Vf÷&R7F'F–ærFöF’w26öÖÖ—GFVB76–væÖVçB ¢Ò“°¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ‡7F÷VB“°¢v—B&W6W'fU7G&VæwF…v÷&¶÷WB‡7F÷VB“°¢ÆWBFöF”W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–æræW†V7WF–öäf÷%&W67&—F–öâ†7W'&VçE7G&VæwF…&W67&—F–öâ‚’ÇÂ²FFS¢FöF”•4ôFFR‚’ÂW†W&6—6W3¢µÒÒ“°¢FöF”W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç7F'Ev÷&¶÷WB‡FöF”W†V7WF–öâÂ7W'&VçE7G&VæwF…&W67&—F–öâ‚’ÂæWrFFR‚’çFô•4õ7G&–ær‚’“°¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ‡FöF”W†V7WF–öâ“°¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG¶76–væÖVçBç6W76–öäæÖRÇÂ76–væÖVçBçF—FÆWÒ7F'FVBâF†RöÆFW"GFV×B&VÖ–ç2&W6W'fVB2–æ6ö×ÆWFRæ“°¢&VæFW$F–Ç”76–væÖVçB‚“°¢&WGW&ã°¢Ð¢–b…²'&WF–â×G&–Â"Â'&WVB×G&–Â"Â'&öÆÆ&6²×G&–Â%Òæ–æ6ÇVFW2†7F–öâ’’°Ð¢–b†7F–öâÓÓÒ'&öÆÆ&6²×G&–Â"bbv–æF÷ræ6öæf—&Ò‚%&W7F÷&RF†R&R×G&–ÂF&vWG2–âæWrÆâ&Wf—6–öãòF†Rv÷&¶÷WBWf–FVæ6Rv–ÆÂ&VÖ–â–çF7Bâ"’’&WGW&ã°Ð¢G'’°Ð¢6öç7B&W7VÇBÒv—B&W6öÇfU7G&VæwF…&öw&W76–öåG&–Â†7F–öâç&WÆ6R‚"×G&–Â"Â""’“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â&W7VÇBæÖW76vR“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†R&öw&W76–öâG&–Â6÷VÆBæ÷B&R&W6öÇfVBâ"“°Ð¢ÐÐ¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'7F'B"bb76–væÖVçCòæW†W&6—6W2æÆVæwF‚’°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç7F'Ev÷&¶÷WB†W†V7WF–öâÂ7W'&VçE7G&VæwF…&W67&—F–öâ‚’ÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%v÷&¶÷WB7F'FVBâ&V6÷&B7GVÂ&W2ÂÆöBÂæBVff÷'Bf÷"WfW'’v÷&²6WBÂF†Vâf–æ—6‚F†R6W76–öâW‡Æ–6—FÇ’â"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Vf–ÆÂÖÖVÖ÷'’"’°Ð¢6öç7BW†W&6—6RÒ76–væÖVçCòæW†W&6—6W2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢–b‚W†W&6—6R’&WGW&ã°Ð¢6öç7BÖVÖ÷'’Ò7G&VæwF…&öw&W76–öäÖVÖ÷'’†W†W&6—6RÂW†V7WF–öâÂ&VE7G&VæwF„†—7F÷'’‚’Â76–væÖVçB“°Ð¢6öç7B6÷W&6RÒ'WGFöâæFF6WBæÖVÖ÷'”ÖöFRÓÓÒ$Ä5B"òÖVÖ÷'“òæÆFW7B¢ÖVÖ÷'“òæ6ö6†VEF&vWC°Ð¢–b‚6÷W&6RÇÂ6÷W&6Ræ&Æö6¶VB’°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â$FÆ2—2†öÆF–ær&öw&W76–öâVçF–ÂF†R7W'&VçB6fWG’Wf–FVæ6R—2&W6öÇfVBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B6&BÒ'WGFöâæ6Æ÷6W7B‚"æF–Ç’ÖW†W&6—6RÖ6&B"“°Ð¢6öç7B&W4–çWBÒ6&CòçVW'•6VÆV7F÷"‚u¶FF×6WBÖf–VÆCÒ'&W2%Òr“°Ð¢6öç7BÆöD–çWBÒ6&CòçVW'•6VÆV7F÷"‚u¶FF×6WBÖf–VÆCÒ&ÆöB%Òr“°Ð¢–b‡&W4–çWB’&W4–çWBçfÇVRÒçVÖ&W"‡6÷W&6Rç&W2ÇÂW†W&6—6Rç&W2ÇÂ“°Ð¢–b†ÆöD–çWB’ÆöD–çWBçfÇVRÒçVÖ&W"‡6÷W&6RæÆöBóòW†W&6—6RæÆöBóò“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG¶W†W&6—6RææÖWÓ¢G¶'WGFöâæFF6WBæÖVÖ÷'”ÖöFRÓÓÒ$Ä5B"ò&Æ7Bv÷&¶÷WB"¢$FÆ2F&vWB'ÒÆöFVBâ&V6÷&BF†R6WBFò6öæf—&Ò7GVÂv÷&²æ“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&V6÷&B×6WB"’°Ð¢6öç7BW†W&6—6RÒ76–væÖVçCòæW†W&6—6W2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢–b‚W†W&6—6R’&WGW&ã°Ð¢6öç7B6&BÒ'WGFöâæ6Æ÷6W7B‚"æF–Ç’ÖW†W&6—6RÖ6&B"“°Ð¢6öç7B&W2ÒçVÖ&W"†6&CòçVW'•6VÆV7F÷"‚u¶FF×6WBÖf–VÆCÒ'&W2%Òr“òçfÇVR“°Ð¢6öç7BÆöBÒçVÖ&W"†6&CòçVW'•6VÆV7F÷"‚u¶FF×6WBÖf–VÆCÒ&ÆöB%Òr“òçfÇVR“°Ð¢6öç7B'UfÇVRÒ6&CòçVW'•6VÆV7F÷"‚u¶FF×6WBÖf–VÆCÒ''R%Òr“òçfÇVS°Ð¢6öç7Bv&×WÒ&ööÆVâ†6&CòçVW'•6VÆV7F÷"‚u¶FF×6WBÖf–VÆCÒ'v&×W%Òr“òæ6†V6¶VB“°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&V6÷&E6WB†W†V7WF–öâÂW†W&6—6Ræ–BÂ°Ð¢&W2ÀÐ¢ÆöBÀÐ¢'S¢'UfÇVRÓÓÒ""òçVÆÂ¢çVÖ&W"‡'UfÇVR’ÀÐ¢¶–æC¢v&×Wò%t$ÕU"¢%tõ$² Ð¢ÒÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6öç7B6ö×ÆWFVBÒFöÖ–æ–öå7G&VæwF…G&–æ–æræ6ö×ÆWFVE6WD6÷VçB†W†V7WF–öâ“°Ð¢6öç7BÆææVBÒFöÖ–æ–öå7G&VæwF…G&–æ–ærçÆææVE6WD6÷VçB†W†V7WF–öâç6W76–öå6æ6†÷B“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Âv&×WòG¶W†W&6—6RææÖWÓ¢v&Ò×W6WB&V6÷&FVBv—F†÷WBv÷&²×6WB7&VF—Bæ¢6ö×ÆWFVBãÒÆææVBò$ÆÂ&W67&–&VB6WG2&R&V6÷&FVBâ&Wf–WrF†R6W76–öâ&Vf÷&Rf–æÆ—¦–ærâ"¢G¶W†W&6—6RææÖWÓ¢v÷&²6WBG·7G&VæwF…v÷&´Æöw2†W†V7WF–öâÂW†W&6—6Ræ–B’æÆVæwF‡Ò&V6÷&FVBâ&W7BF–ÖW"7F'FVBæ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&WVB×6WB"’°Ð¢6öç7BW†W&6—6RÒ76–væÖVçCòæW†W&6—6W2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢6öç7B&Wf–÷W2ÒW†W&6—6Rò7G&VæwF…v÷&´Æöw2†W†V7WF–öâÂW†W&6—6Ræ–B’æB‚Ó’¢çVÆÃ°Ð¢–b‚W†W&6—6RÇÂ&Wf–÷W2’&WGW&ã°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&V6÷&E6WB†W†V7WF–öâÂW†W&6—6Ræ–BÂ°Ð¢&W3¢&Wf–÷W2ç&W2ÀÐ¢ÆöC¢&Wf–÷W2æÆöBÀÐ¢'S¢&Wf–÷W2ç'RÀÐ¢¶–æC¢%tõ$² Ð¢ÒÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG¶W†W&6—6RææÖWÓ¢&WVFVBF†R&Wf–÷W2v÷&²6WBæB7F'FVBF†R&W7BF–ÖW"æ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&VF—B×6WB"’°Ð¢6öç7B&÷rÒ'WGFöâæ6Æ÷6W7B‚"ç7G&VæwF‚×6WBÖÆör×&÷r"“°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–æræVF—E6WB†W†V7WF–öâÂ'WGFöâæFF6WBæW†W&6—6T–BÂ'WGFöâæFF6WBç6WD–BÂ°Ð¢&W3¢çVÖ&W"‡&÷sòçVW'•6VÆV7F÷"‚u¶FFÖÆörÖf–VÆCÒ'&W2%Òr“òçfÇVR’ÀÐ¢ÆöC¢çVÖ&W"‡&÷sòçVW'•6VÆV7F÷"‚u¶FFÖÆörÖf–VÆCÒ&ÆöB%Òr“òçfÇVR’ÀÐ¢'S¢&÷sòçVW'•6VÆV7F÷"‚u¶FFÖÆörÖf–VÆCÒ''R%Òr“òçfÇVRÇÂçVÆÀÐ¢ÒÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%6WB6÷'&V7F–öâ6fVBv—F‚—G2VF—BF–ÖW7F×â"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'VæFò×6WB"’°Ð¢6öç7BW†W&6—6RÒ76–væÖVçCòæW†W&6—6W2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢–b‚W†W&6—6R’&WGW&ã°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærçVæFôÆ7E6WB†W†V7WF–öâÂW†W&6—6Ræ–BÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG¶W†W&6—6RææÖWÓ¢F†RÆ7B6WBv2&VÖ÷fVBæ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'7V'7F—GWFR"’°Ð¢6öç7BW†W&6—6RÒ76–væÖVçCòæW†W&6—6W2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢–b‚W†W&6—6R’&WGW&ã°Ð¢6öç7B7V'7F—GWF–öâÒ'WGFöâæ6Æ÷6W7B‚"æF–Ç’ÖW†W&6—6RÖ6&B"“òçVW'•6VÆV7F÷"‚%¶FF×7V'7F—GWF–öâÖ6†ö–6UÒ"“òçfÇVS°Ð¢–b‚7V'7F—GWF–öâ’°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â$6†ö÷6R7V'7F—GWF–öâf—'7Bâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærçW6U7V'7F—GWF–öâ†W†V7WF–öâÂW†W&6—6Ræ–BÂ7V'7F—GWF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG·7V'7F—GWF–öçÒ6VÆV7FVBf÷"G¶W†W&6—6RææÖWÒâF†R6†ævR—2&W6W'fVBv—F‚F†—26W76–öâæ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'6¶—"’°Ð¢6öç7BW†W&6—6RÒ76–væÖVçCòæW†W&6—6W2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæW†W&6—6T–B“°Ð¢–b‚W†W&6—6R’&WGW&ã°Ð¢6öç7B&V6öâÒ'WGFöâæ6Æ÷6W7B‚"æF–Ç’ÖW†W&6—6RÖ6&B"“òçVW'•6VÆV7F÷"‚%¶FF×6¶—×&V6öåÒ"“òçfÇVRÇÂ%6¶—VBGW&–ærv÷&¶÷WB#°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç6¶—W†W&6—6R†W†V7WF–öâÂW†W&6—6Ræ–BÂ&V6öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG¶W†W&6—6RææÖWÒ6¶—VC¢G·&V6öçÒâF†R&V6öâv–ÆÂ&VÖ–âv—F‚F†—2GFV×Bæ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'W6R"’°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærçW6Uv÷&¶÷WB†W†V7WF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%v÷&¶÷WBW6VBâ–æ7F—fRF–ÖRv–ÆÂæ÷B6÷VçBF÷v&BGW&F–öââ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&W7VÖR"’°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&W7VÖUv÷&¶÷WB†W†V7WF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%v÷&¶÷WB&W7VÖVBâ7F—fR×F–ÖRG&6¶–ær&W7F'FVBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&f–æ—6‚"’°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&W&Uv÷&¶÷WE&Wf–Wr†W†V7WF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%&Wf–WrF†R6W76–öâ7VÖÖ'’æBæ÷FW2ÂF†Vâf–æÆ—¦R÷"&WGW&âFòF†Rv÷&¶÷WBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&f–æÆ—¦R"’°Ð¢6öç7Bæ÷FW2ÒFö7VÖVçBçVW'•6VÆV7F÷"‚%¶FF×7G&VæwF‚×&Wf–WrÖæ÷FW5Ò"“òçfÇVRÇÂ"#°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–æræf–æ—6…v÷&¶÷WB‡²ââæW†V7WF–öâÂ&Wf–Wtæ÷FW3¢æ÷FW2ÒÂ²æ÷FW2ÒÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢W†V7WF–öâÒGF6…7G&VæwF„6ö×ÆWF–öå&W÷'B†W†V7WF–öâ“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢v—B&W6W'fU7G&VæwF…v÷&¶÷WB†W†V7WF–öâ“°Ð¢v—B6fTÖ—76–öäW†V7WF–öå&V6V—B‚%5E$TäuD‚"ÂW†V7WF–öâÂ'V–ÆD7W'&VçDÖ—76–öä6ö6·—B‚“òæ7W'&VçBÇÂ·ÒÂ7W'&VçE7G&VæwF…&W67&—F–öâ‚’“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂW†V7WF–öâç7FFRÓÓÒ$4ôÕÄUDR"ò%v÷&¶÷WB6ö×ÆWFRâ6W76–öâWf–FVæ6Rv26fVBWFöÖF–6ÆÇ’â"¢%v÷&¶÷WB&W6W'fVB2'F–Ââ6ö×ÆWFVBv÷&²Â6¶—VBW†W&6—6W2ÂæBF†R&VÖ–æ–ærv&RÆÂ&WF–æVBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'7F÷"’°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–æræf–æ—6…v÷&¶÷WB†W†V7WF–öâÂ²f÷&6U7F÷¢G'VRÂ&V6öã¢%v÷&¶÷WB7F÷VB'’W6W"â"ÒÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢W†V7WF–öâÒGF6…7G&VæwF„6ö×ÆWF–öå&W÷'B†W†V7WF–öâ“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢v—B&W6W'fU7G&VæwF…v÷&¶÷WB†W†V7WF–öâ“°Ð¢v—B6fTÖ—76–öäW†V7WF–öå&V6V—B‚%5E$TäuD‚"ÂW†V7WF–öâÂ'V–ÆD7W'&VçDÖ—76–öä6ö6·—B‚“òæ7W'&VçBÇÂ·ÒÂ7W'&VçE7G&VæwF…&W67&—F–öâ‚’“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%v÷&¶÷WB7F÷VBæB&W6W'fVBâæòFF—F–öæÂ&öw&W76–öâv2WF†÷&—¦VBâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'–â"’°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&W÷'E–â†W†V7WF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢W†V7WF–öâÒGF6…7G&VæwF„6ö×ÆWF–öå&W÷'B†W†V7WF–öâ“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢v—B&W6W'fU7G&VæwF…v÷&¶÷WB†W†V7WF–öâ“°Ð¢v—B6fTÖ—76–öäW†V7WF–öå&V6V—B‚%5E$TäuD‚"ÂW†V7WF–öâÂ'V–ÆD7W'&VçDÖ—76–öä6ö6·—B‚“òæ7W'&VçBÇÂ·ÒÂ7W'&VçE7G&VæwF…&W67&—F–öâ‚’“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â%v÷&¶÷WB7F÷VBf÷"–ââÆöFVB&öw&W76–öâ—2†VÆC²WFFRÖ÷&æ–ær&öÆÂ6ÆÂ&Vf÷&RF†RæW‡B6W76–öââ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&W7F'B"’°Ð¢v—B&W6W'fU7G&VæwF…v÷&¶÷WB†W†V7WF–öâ“°Ð¢W†V7WF–öâÒFöÖ–æ–öå7G&VæwF…G&–æ–ærç&W7F'Ev÷&¶÷WB†W†V7WF–öâÂæWrFFR‚’çFô•4õ7G&–ær‚’“°Ð¢v—B6fTF–Ç”76–væÖVçDW†V7WF–öâ†W†V7WF–öâ“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂGFV×BG¶W†V7WF–öâæGFV×GÒ—2&VG’âF†R&–÷"7F÷VB÷"'F–ÂGFV×B&VÖ–ç2–â†—7F÷'’æ“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&§V×Ö7F—fR"’°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B†7G&VæwF‚ÖW†W&6—6RÒG¶'WGFöâæFF6WBæW†W&6—6T–GÖ“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢&6VçFW""Ò“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&öw&Ò"’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&öw&ÖÖ–ær"“°Ð¢6öç7BFWF–ÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&–æ–ær×&öw&ÖÖ–ærÖFWF–Â"“°Ð¢–b†FWF–Â’FWF–Âæ÷VâÒG'VS°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ&7F—fFRÖF§W7FÖVçB"’°Ð¢G'’°Ð¢6öç7B&÷fVBÒv—B&÷fU7G&VæwF„F§W7FÖVçB‚“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂG¶&÷fVBæF§W7FÖVçBç7VÖÖ'’æÆ–VD6÷VçGÒV&æVB6†ævRG¶&÷fVBæF§W7FÖVçBç7VÖÖ'’æÆ–VD6÷VçBÓÓÒò""¢'2'Ò7F—fFVB–âÆâ"G¶&÷fVBçÆâç&Wf—6–öçÒâF†RæW‡BÖF6†–ærv÷&¶÷WBv–ÆÂW6RF†RæWrF&vWG2æ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†RV&æVB6†ævW26÷VÆBæ÷B&R7F—fFVBâ"“°Ð¢ÐÐ¢ÐÐ¢–b†7F–öâÓÓÒ&†öÆBÖF§W7FÖVçB"’°Ð¢v—B†öÆE7G&VæwF„F§W7FÖVçB‚“°Ð¢6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â$7W'&VçBF&vWG2†VÆBâF†R6ö×ÆWFVBv÷&¶÷WB&VÖ–ç26fVBæBF†R7F—fRÆâF–Bæ÷B6†ævRâ"“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Wf–WrÖF§W7FÖVçB"’°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr‚'&öw&ÖÖ–ær"“°Ð¢6öç7BFWF–ÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&–æ–ær×&öw&ÖÖ–ærÖFWF–Â"“°Ð¢–b†FWF–Â’FWF–Âæ÷VâÒG'VS°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷"‚"ç7G&VæwF‚ÖFFF–öâ×æVÂ"“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Vg&W6‚"’6WEFW‡B‚&F–Ç’Ö76–væÖVçBÖfVVF&6²"Â$f—F&öBWf–FVæ6R&Vg&W6†VBâ"“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð¢&VæFW%&öw&ÖÖ–æu&Wf–Wr‚“°Ð¢&VæFW%FöF”6öÖÖ—GFVEvVV²‚“°Ð¢&VæFW$Ö—76–öäW†V7WF–öâ‚“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6öææV7FVB"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7Bf–Wt'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6öææV7FVB×f–WuÒ"“°Ð¢–b‡f–Wt'WGFöâ’°Ð¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ð¢6WD6öææV7FVD7F—fUf–Wr‡f–Wt'WGFöâæFF6WBæ6öææV7FVEf–WrÇÂ&÷fW'f–Wr"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B7F–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6öææV7FVBÖ7F–öåãÒvÖgÖfVVBÒuÒ"“°Ð¢–b‚7F–öä'WGFöâ’&WGW&ã°Ð¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ð¢v—B'VäÖgçWG&—F–öäfVVD7F–öâ†7F–öä'WGFöâæFF6WBæ6öææV7FVD7F–öâ“°Ð¢ÒÂG'VR“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6öææV7FVB"“òæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â7–æ2†WfVçB’Óâ°Ð¢–b‚²$VçFW""Â"%Òæ–æ6ÇVFW2†WfVçBæ¶W’’’&WGW&ã°Ð¢6öç7B7F–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6öææV7FVBÖ7F–öåãÒvÖgÖfVVBÒuÒ"“°Ð¢–b‚7F–öä'WGFöâ’&WGW&ã°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ð¢v—B'VäÖgçWG&—F–öäfVVD7F–öâ†7F–öä'WGFöâæFF6WBæ6öææV7FVD7F–öâ“°Ð¢ÒÂG'VR“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ6öææV7FVB×f–WuÒ"’æf÷$V6‚‚†'WGFöâ’Óâ°Ð¢'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢–b…²'&V6öæ6–Æ–F–öâ"Â&çWG&—F–öâ"Â&ÆUö†VÇF‚%Òæ–æ6ÇVFW2†'WGFöâæFF6WBæ6öææV7FVEf–Wr’’&VæFW$6öææV7FVDFöÖ–æ–öâ‚“°Ð¢6WD6öææV7FVD7F—fUf–Wr†'WGFöâæFF6WBæ6öææV7FVEf–WrÇÂ&÷fW'f–Wr"“°Ð¢Ò“°Ð¢'WGFöâæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°Ð¢–b‚²$'&÷tÆVgB"Â$'&÷u&–v‡B%Òæ–æ6ÇVFW2†WfVçBæ¶W’’’&WGW&ã°Ð¢6öç7BF'2Ò'&’æg&öÒ†Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ6öææV7FVB×f–WuÒ"’“°Ð¢6öç7B–æFW‚ÒF'2æ–æFW„öb†'WGFöâ“°Ð¢6öç7BæW‡BÒF'5²†–æFW‚²†WfVçBæ¶W’ÓÓÒ$'&÷u&–v‡B"ò¢Ó’²F'2æÆVæwF‚’RF'2æÆVæwF…Ó°Ð¢æW‡Bæfö7W2‚“°Ð¢6WD6öææV7FVD7F—fUf–Wr†æW‡BæFF6WBæ6öææV7FVEf–Wr“°Ð¢Ò“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&6öææV7FVB"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ6öææV7FVBÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæ6öææV7FVD7F–öã°Ð¢–b†7F–öâÓÓÒ&÷Vâ×&Wf–Wr"’²6WD6öææV7FVD7F—fUf–Wr‚'&V6öæ6–Æ–F–öâ"“²&WGW&ã²ÐÐ¢–b†7F–öâÓÓÒ&÷Vâ×6÷W&6W2"’²6WD6öææV7FVD7F—fUf–Wr‚'6÷W&6W2"“²&WGW&ã²ÐÐ¢–b†7F–öâÓÓÒ&÷VâÖ–×÷'BÖ†—7F÷'’"’²6WD6öææV7FVD7F—fUf–Wr‚&–×÷'FVE÷&V6÷&G2"“²&WGW&ã²ÐÐ¢–b†7F–öâÓÓÒ&÷Vâ×&—f7’"’²6WD6öææV7FVD7F—fUf–Wr‚'&—f7’"“²&WGW&ã²ÐÐ¢–b†7F–öâÓÓÒ&÷VâÖ6ÆVæF""’°Ð¢6WD7F—fU6V7F–öâ‚&6ÆVæF""“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"66ÆVæF""“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&W6öÇfRÖ6öææV7FVB×&–Ö'’"’²v—B&W6öÇfT6öææV7FVDWf–FVæ6R†'WGFöâæFF6WBæW†6WF–öä–BÂ%U4Uõ$”Ô%’"“²&WGW&ã²ÐÐ¢–b†7F–öâÓÓÒ&–væ÷&RÖ6öææV7FVBÖW†6WF–öâ"’²v—B&W6öÇfT6öææV7FVDWf–FVæ6R†'WGFöâæFF6WBæW†6WF–öä–BÂ$”täõ$R"“²&WGW&ã²ÐÐ¢–b†7F–öâÓÓÒ&f—F&öBÖ–×÷'B"’Fö7VÖVçBævWDVÆVÖVçD'”–B‚&f—F&öBÖ–×÷'BÖf–ÆR"“òæ6Æ–6²‚“°Ð¢–b†7F–öâÓÓÒ&ÖgÖ–×÷'B"’Fö7VÖVçBævWDVÆVÖVçD'”–B‚&ÖgÖ–×÷'BÖf–ÆR"“òæ6Æ–6²‚“°Ð¢–b†v—B'VäÖgçWG&—F–öäfVVD7F–öâ†7F–öâ’’&WGW&ã°Ð¢–b†7F–öâÓÓÒ&ÆRÖ†VÇF‚Ö–×÷'B"’Fö7VÖVçBævWDVÆVÖVçD'”–B‚&ÆRÖ†VÇF‚Ö–×÷'BÖf–ÆR"“òæ6Æ–6²‚“°Ð¢–b†7F–öâÓÓÒ&†VÇF‚Ö6öææV7BÖ–×÷'B"’Fö7VÖVçBævWDVÆVÖVçD'”–B‚&†VÇF‚Ö6öææV7BÖ–×÷'BÖf–ÆR"“òæ6Æ–6²‚“°Ð¢–b†7F–öâÓÓÒ&Ç’ÖÆR×&VF–æW72"’v—BÇ”ÆT†VÇF…&VF–æW72‚“°Ð¢–b†7F–öâÓÓÒ&Ç’×&V6öæ6–Æ–F–öâ"’Ç”f—F&öE&V6öæ6–Æ–F–öâ†'WGFöâæFF6WBç6W76–öä–B“°Ð¢–b†7F–öâÓÓÒ&Ç’ÖçWG&—F–öâ"’Ç”çWG&—F–öå&V6öæ6–Æ–F–öâ†'WGFöâæFF6WBæçWG&—F–öäFFR“°Ð¢–b†7F–öâÓÓÒ'&Wf–Wr×7G&VæwF‚×F&vWB"’°Ð¢6WD7F—fU6V7F–öâ‚'&V6÷&B"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7&V6÷&B"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'7G&VæwF…÷F&vWB"“òæfö7W2‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&Wf–WrÖçWG&—F–öâ×F&vWB"’°Ð¢6WD7F—fU6V7F–öâ‚'&V6÷&B"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7&V6÷&B"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&çWG&—F–öå÷F&vWB"“òæfö7W2‚“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'6–×VÆFR"’v—B6–×VÆFT6öææV7FVD66÷VçB†'WGFöâæFF6WBç&÷f–FW"“°Ð¢–b†7F–öâÓÓÒ'&Wf–WrÖ66÷VçB"’6WD6öææV7FVD7F—fUf–Wr‚&66÷VçG2"“°Ð¢–b†7F–öâÓÓÒ'7–æ2"’v—B'Vä6öææV7FVDFVÖõ7–æ2†'WGFöâæFF6WBæ66÷VçD–B“°Ð¢–b†7F–öâÓÓÒ&F—66öææV7B"’°Ð¢6öç7B–æFW‚Ò6öææV7FVD66÷VçG2æf–æD–æFW‚‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæ66÷VçD–B“°Ð¢–b†–æFW‚ãÒ’°Ð¢6öç7BG&ç6—F–öæVBÒ6öææV7FVD’‚’çG&ç6—F–öä6öææV7FVD66÷VçB†6öææV7FVD66÷VçG5¶–æFW…ÒÂ$D•44ôääT5DTB"“°Ð¢–b‡G&ç6—F–öæVBçfÆ–B’6öææV7FVD66÷VçG5¶–æFW…ÒÒG&ç6—F–öæVBæ66÷VçC°Ð¢v—B6fT6öææV7FVE7FFR‚%6–×VÆFVB66÷VçBF—66öææV7FVC²†—7F÷'’&W6W'fVBâ"“°Ð¢ÐÐ¢ÐÐ¢–b†7F–öâÓÓÒ'&WG'’"’°Ð¢6öç7B÷&–v–æÂÒ6öææV7FVE7–æ4¦ö'2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBæ¦ö$–B“°Ð¢–b†÷&–v–æÂ’v—B'Vä6öææV7FVDFVÖõ7–æ2†÷&–v–æÂæ6öææV7FVD66÷VçD–BÂ%$UE%’"Â÷&–v–æÂæ–B“°Ð¢ÐÐ¢–b†7F–öâÓÓÒ'&öÆÆ&6²Ö–×÷'B"’°Ð¢6öç7B¦ö$–BÒ'WGFöâæFF6WBæ¦ö$–C°Ð¢6öç7B¦ö$–æFW‚Ò6öææV7FVE7–æ4¦ö'2æf–æD–æFW‚‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ¦ö$–B“°Ð¢–b†¦ö$–æFW‚ÂÇÂv–æF÷ræ6öæf—&Ò‚%&öÆÆ&6²F†—2–×÷'B&F6ƒò–×÷'FVBW&f÷&Öæ6RVçG&–W2v–ÆÂ&R&VÖ÷fVBv†–ÆRF†R6÷W&6RVF—BG&–Â—2&WF–æVBâ"’’&WGW&ã°Ð¢6öç7B&öÆÆ&6²Ò6öææV7FVD’‚’ç&öÆÆ&6´–×÷'D&F6‚†6öææV7FVD–×÷'FVE&V6÷&G2Â¦ö$–B“°Ð¢6öææV7FVD–×÷'FVE&V6÷&G2Ò&öÆÆ&6²ç&V6÷&G3°Ð¢6öç7BÖVD–G2ÒæWr6WB‡&öÆÆ&6²æÖVEW&f÷&Öæ6TVçG'”–G2“°Ð¢W&f÷&Öæ6TVçG&–W2ÒW&f÷&Öæ6TVçG&–W2æf–ÇFW"‚†VçG'’’ÓâÖVD–G2æ†2†VçG'’æ–B’“°Ð¢6fTÆö6ÅW&f÷&Öæ6TVçG&–W2‡W&f÷&Öæ6TVçG&–W2“°Ð¢6öææV7FVE7–æ4¦ö'5¶¦ö$–æFW…ÒÒ°Ð¢ââæ6öææV7FVE7–æ4¦ö'5¶¦ö$–æFW…ÒÀÐ¢7VÖÖ'“¢°Ð¢âââ†6öææV7FVE7–æ4¦ö'5¶¦ö$–æFW…Òç7VÖÖ'’ÇÂ·Ò’ÀÐ¢&öÆÆVD&6´C¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢&öÆÆVD&6µ&V6÷&G3¢&öÆÆ&6²ç&VÖ÷fVBæÆVæwF‚ÀÐ¢&VÖ÷fVEW&f÷&Öæ6TVçG&–W3¢ÖVD–G2ç6—¦PÐ¢ÐÐ¢Ó°Ð¢–b‡6W76–öãòçW6W#òæ–BbbÖVD–G2ç6—¦R’°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B&W7VÇBÒv—B7W&6Ræg&öÒ‚'W&f÷&Öæ6UöVçG&–W2"’æFVÆWFR‚’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æ–â‚&–B"Â²ââæÖVD–G5Ò“°Ð¢–b‡&W7VÇBæW'&÷"’F‡&÷r&W7VÇBæW'&÷#°Ð¢Ò6F6‚…ò’°Ð¢6WEFW‡B‚&6öææV7FVBÖfVVF&6²"Â%&öÆÆ&6²—26fVBÆö6ÆÇ“²&VÖ÷FRW&f÷&Öæ6R6ÆVçWv–ÆÂ&WG'’öâF†RæW‡B7V66W76gVÂ6öææV7F–öââ"“°Ð¢ÐÐ¢ÐÐ¢v—B6fT6öææV7FVE7FFR†–×÷'B&F6‚&öÆÆVB&6²âG·&öÆÆ&6²ç&VÖ÷fVBæÆVæwF‡Ò6÷W&6R&V6÷&B‡2’&WF–æVB2–çfÆ–FFVC²G¶ÖVD–G2ç6—¦WÒÖVBW&f÷&Öæ6RVçG'’÷"VçG&–W2&VÖ÷fVBæ“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð¢ÐÐ¢Ò“°Ð¢6öç7Bf—F&öD–×÷'Df–ÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f—F&öBÖ–×÷'BÖf–ÆR"“°Ð¢–b†f—F&öD–×÷'Df–ÆR’f—F&öD–×÷'Df–ÆRæFDWfVçDÆ—7FVæW"‚&6†ævR"Â7–æ2‚’Óâ°Ð¢6öç7Bf–ÆRÒf—F&öD–×÷'Df–ÆRæf–ÆW3òå³Ó°Ð¢f—F&öD–×÷'Df–ÆRçfÇVRÒ"#°Ð¢–b†f–ÆR’v—B–×÷'Df—F&öEv÷&¶÷WDf–ÆR†f–ÆR“°Ð¢Ò“°Ð¢6öç7BÖg–×÷'Df–ÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&ÖgÖ–×÷'BÖf–ÆR"“°Ð¢–b†Ög–×÷'Df–ÆR’Ög–×÷'Df–ÆRæFDWfVçDÆ—7FVæW"‚&6†ævR"Â7–æ2‚’Óâ°Ð¢6öç7Bf–ÆRÒÖg–×÷'Df–ÆRæf–ÆW3òå³Ó°Ð¢Ög–×÷'Df–ÆRçfÇVRÒ"#°Ð¢–b†f–ÆR’v—B–×÷'D×”f—FæW75ÄçWG&—F–öäf–ÆR†f–ÆR“°Ð¢Ò“°Ð¢6öç7BÆT†VÇF„–×÷'Df–ÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&ÆRÖ†VÇF‚Ö–×÷'BÖf–ÆR"“°Ð¢–b†ÆT†VÇF„–×÷'Df–ÆR’ÆT†VÇF„–×÷'Df–ÆRæFDWfVçDÆ—7FVæW"‚&6†ævR"Â7–æ2‚’Óâ°Ð¢6öç7Bf–ÆRÒÆT†VÇF„–×÷'Df–ÆRæf–ÆW3òå³Ó°Ð¢ÆT†VÇF„–×÷'Df–ÆRçfÇVRÒ"#°Ð¢–b†f–ÆR’v—B–×÷'DÆT†VÇF„f–ÆR†f–ÆR“°Ð¢Ò“°Ð¢6öç7B†VÇF„6öææV7D–×÷'Df–ÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&†VÇF‚Ö6öææV7BÖ–×÷'BÖf–ÆR"“°Ð¢–b††VÇF„6öææV7D–×÷'Df–ÆR’†VÇF„6öææV7D–×÷'Df–ÆRæFDWfVçDÆ—7FVæW"‚&6†ævR"Â7–æ2‚’Óâ°Ð¢6öç7Bf–ÆRÒ†VÇF„6öææV7D–×÷'Df–ÆRæf–ÆW3òå³Ó°Ð¢†VÇF„6öææV7D–×÷'Df–ÆRçfÇVRÒ"#°Ð¢–b†f–ÆR’v—B–×÷'D†VÇF„6öææV7Df–ÆR†f–ÆR“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'W&f÷&Öæ6RÖVçG'’ÖÆ—7B"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7BVçG'”–BÒ'WGFöâæFF6WBæ–C°Ð¢–b†'WGFöâæFF6WBæ7F–öâÓÓÒ&VF—B"’°Ð¢6öç7BVçG'’ÒW&f÷&Öæ6TVçG&–W2æf–æB‚†—FVÒ’Óâ7G&–ær†—FVÒæ–B’ÓÓÒ7G&–ær†VçG'”–B’“°Ð¢–b†VçG'’’÷VÆFUW&f÷&Öæ6Tf÷&Ò†VçG'’“°Ð¢ÐÐ¢–b†'WGFöâæFF6WBæ7F–öâÓÓÒ&FVÆWFR"’°Ð¢FVÆWFUW&f÷&Öæ6TVçG'’†VçG'”–B“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚v¶FF×6V7F–öåÕ¶‡&VeãÒ"2%Òr’æf÷$V6‚‚†Æ–æ²’Óâ°Ð¢Æ–æ²æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢–b††æFÆU6V7F–öäæf–vF–öâ†Æ–æ²’’°Ð¢v–æF÷ræÆö6F–öâæ†6‚Ò2G¶æ÷&ÖÆ—¦U6V7F–öä¶W’†Æ–æ²æFF6WBç6V7F–öâ—Ö°Ð¢ÐÐ¢Ò“°Ð¢Ò“°Ð¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°Ð¢–b†WfVçBæ¶W’ÓÒ$W66R"’&WGW&ã°Ð¢6öç7BÖ÷&RÒFö7VÖVçBçVW'•6VÆV7F÷"‚"ææbÖÖ÷&U¶÷VåÒ"“°Ð¢–b‚Ö÷&R’&WGW&ã°Ð¢Ö÷&Rç&VÖ÷fTGG&–'WFR‚&÷Vâ"“°Ð¢Ö÷&RçVW'•6VÆV7F÷"‚'7VÖÖ'’"“òæfö7W2‚“°Ð¢Ò“°Ð¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ð¢6öç7BÖ÷&RÒFö7VÖVçBçVW'•6VÆV7F÷"‚"ææbÖÖ÷&U¶÷VåÒ"“°Ð¢–b†Ö÷&RbbÖ÷&Ræ6öçF–ç2†WfVçBçF&vWB’’Ö÷&Rç&VÖ÷fTGG&–'WFR‚&÷Vâ"“°Ð¢Ò“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&VF—B×&öÆÂÖ6ÆÂ"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢&Vf–ÆÄÖ÷&æ–æu&öÆÄ6ÆÄf÷&Ò†F–Ç•7FFR“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&öÆÂÖ6ÆÂÖ6&B"’æ†–FFVâÒfÇ6S°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'&öÆÂÖ6ÆÂÖ6&B"’ç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷"‚r7&öÆÂÖ6ÆÂÖf÷&Ò¶æÖSÒ&VæW&w’%Òr“òæfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°Ð¢Ò“°Ð¢6öç7B&Wf–Wu&öÖ÷F–öä'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&Wf–Wr×&öÖ÷F–öâ"“°Ð¢6öç7Bf–æÆ—¦U&öÖ÷F–öä'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f–æÆ—¦R×&öÖ÷F–öâ"“°Ð¢–b‡&Wf–Wu&öÖ÷F–öä'WGFöâ’°Ð¢&Wf–Wu&öÖ÷F–öä'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢&VæFW%&æµ6V7F–öâ‚“°Ð¢Ò“°Ð¢ÐÐ¢–b†f–æÆ—¦U&öÖ÷F–öä'WGFöâ’°¢f–æÆ—¦U&öÖ÷F–öä'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2‚’Óâ°¢6öç7BæW‡E&æ²ÒvWDæW‡E&æ´FVf–æ—F–öâ‡&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B"“°¢–b‚æW‡E&æ²’&WGW&ã°¢6öç7B&Wf–WrÒ'V–ÆE&æ´Gfæ6VÖVçD6W'F–f–6F–öâ‡²7W'&VçE&æ³¢&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B"ÂF&vWE&æ³¢æW‡E&æ²æ6öFRÒ“°¢–b‡&Wf–Wsòç7FGW2ÓÒ%$TE’"’°¢6WEFW‡B‚'&æ²×&öÖ÷F–öâÖfVVF&6²"Â&Wf–Wsòç&W—#òæFWF–ÂÇÂ%&öÖ÷F–öâ—2Æö6¶VBVçF–ÂWfW'’Gfæ6VÖVçBvFR—26V7W&VBâ"“°¢&VæFW%&æµ6V7F–öâ‚“°¢&WGW&ã°¢Ð¢–b‚v–æF÷ræ6öæf—&Ò†WF†÷&—¦R&öÖ÷F–öâg&öÒG·&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B'ÒFòG¶æW‡E&æ²æF—7Æ”æÖWÓö’’&WGW&ã°¢f–æÆ—¦U&öÖ÷F–öä'WGFöâæF—6&ÆVBÒG'VS°¢6öç7B6æ6†÷BÒ'V–ÆE&æ´Gfæ6VÖVçD6W'F–f–6F–öâ‡²7W'&VçE&æ³¢&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B"ÂF&vWE&æ³¢æW‡E&æ²æ6öFRÂ6W'F–g“¢G'VRÂ6W'F–f–VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°¢–b‡6æ6†÷Còç7FGW2ÓÒ$4U%D”d”TB"’°¢f–æÆ—¦U&öÖ÷F–öä'WGFöâæF—6&ÆVBÒfÇ6S°¢6WEFW‡B‚'&æ²×&öÖ÷F–öâÖfVVF&6²"Â6æ6†÷Còç&W—#òæFWF–ÂÇÂ$Gfæ6VÖVçB&ööb6÷VÆBæ÷B&R6W'F–f–VBâæ÷F†–ær6†ævVBâ"“°¢&VæFW%&æµ6V7F–öâ‚“°¢&WGW&ã°¢Ð¢&æµ7FGW2Ò°¢ââç&æµ7FGW2À¢7W'&VçE&æ³¢6æ6†÷BææWu&æ²À¢&öÖ÷F–öå7FFS¢6æ6†÷Bç&öÖ÷F–öå7FFRÀ¢WFFVDC¢6æ6†÷Bæ6W'F–f–VD@¢Ó°¢6öç7BGfæ6VÖVçDÆ–Ö—BÒG—VöbFöÖ–æ–öä66÷VçEG'WF‚ÓÓÒ'VæFVf–æVB"ò"¢FöÖ–æ–öä66÷VçEG'WF‚ä4ôÄÄT5D”ôåôÄ”Ô•E2ç&æ´Gfæ6VÖVçG3°¢&öÖ÷F–öä†—7F÷'’ÒFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâçW6W'D†—7F÷'’‡&öÖ÷F–öä†—7F÷'’Â6æ6†÷BÂGfæ6VÖVçDÆ–Ö—BÇÂ"“°¢6fU&æµ7FGW2‚“°¢v—B6fU&öÖ÷F–öä†—7F÷'’‡&öÖ÷F–öä†—7F÷'’“°¢6WEFW‡B‚'&æ²×&öÖ÷F–öâÖfVVF&6²"ÂG·6æ6†÷BææWu&æ·ÒV&æVBâF†R&ööb—2Æö6¶VBFò–÷W"66÷VçBæ“°¢&VæFW%vVV¶Ç”§VFvÖVçB‡vVV¶Ç”–ç7V7F–öâÇÂ·ÒÂvVV¶Ç”–ç7V7F–öå7F÷&vTÖöFR“°¢Ò“°¢Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×7FæF&BÖ7F–öåÒ"“°Ð¢–b‚'WGFöâ’&WGW&ã°Ð¢6öç7B—FV×2ÒÖW&vU7FæF&G5&Wf–Wt—FV×2†FW&—fU7FæF&G5&Wf–Wt—FV×2†F–Ç”6ö×Æ–æ6R’“°Ð¢6öç7B6VÆV7FVBÒ—FV×2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ'WGFöâæFF6WBç7FæF&D–B“°Ð¢–b‚6VÆV7FVB’&WGW&ã°Ð¢6öç7B66TVÆVÖVçBÒ'WGFöâæ6Æ÷6W7B‚"ç7FæF&G2Ö66R"“°Ð¢–b†'WGFöâæFF6WBç7FæF&D7F–öâÓÓÒ'6fR×Æâ"’°Ð¢6öç7BGVTFFRÒ66TVÆVÖVçCòçVW'•6VÆV7F÷"‚%¶FF×7FæF&BÖGVUÒ"“òçfÇVRÇÂ"#°Ð¢6öç7B7V66W747&—FW&–Ò66TVÆVÖVçCòçVW'•6VÆV7F÷"‚%¶FF×7FæF&BÖ7&—FW&–Ò"“òçfÇVSòçG&–Ò‚’ÇÂ"#°Ð¢–b‚GVTFFRÇÂ7V66W747&—FW&–’°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"Â$GVRFFRæB7V66W727&—FW&–&R&WV—&VBâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7BWFFVBÒ°Ð¢ââç6VÆV7FVBÀÐ¢6÷'&V7F—fT7F–öã¢²ââç6VÆV7FVBæ6÷'&V7F—fT7F–öâÂGVTFFRÂ7V66W747&—FW&–ÒÀÐ¢WFFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ó°Ð¢7FæF&G5&Wf–Wu7FFRÒ7FæF&G5&Wf–Wu7FFRæÖ‚†—FVÒ’Óâ—FVÒæ–BÓÓÒWFFVBæ–BòWFFVB¢—FVÒ“°Ð¢6fU7FæF&G5&Wf–Wu7FFR‡7FæF&G5&Wf–Wu7FFR“°Ð¢6öç7BWfVçG2ÒÆöE7FæF&G4VF—DWfVçG2‚“°Ð¢WfVçG2çW6‚‡²ââæ'V–ÆEf–öÆF–öäVF—DWfVçB‡WFFVBæ–BÂWFFVBç7FGW2ÂWFFVBç7FGW2Â$6÷'&V7F—fR7F–öâÆâWFFVBâ"’ÂW6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÒ“°Ð¢6fU7FæF&G4VF—DWfVçG2†WfVçG2“°Ð¢G'’°Ð¢v—B6fU7FæF&G5&Wf–Wu7FFUFõ7W&6R…·WFFVEÒ“°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"Â$6÷'&V7F—fR7F–öâÆâWFFVBâ"“°Ð¢Ò6F6‚…ò’°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"Â$6÷'&V7F—fR7F–öâÆâ6fVBÆö6ÆÇ’â"“°Ð¢ÐÐ¢&VæFW%7FæF&G56V7F–öâ‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b†'WGFöâæFF6WBç7FæF&D7F–öâÓÓÒ'7V&Ö—BÖWf–FVæ6R"’°Ð¢6öç7B6ö×ÆWF–öäWf–FVæ6RÒ66TVÆVÖVçCòçVW'•6VÆV7F÷"‚%¶FF×7FæF&BÖWf–FVæ6UÒ"“òçfÇVSòçG&–Ò‚’ÇÂ"#°Ð¢–b‚6ö×ÆWF–öäWf–FVæ6R’°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"Â$FW67&–&RF†R6ö×ÆWF–öâWf–FVæ6R&Vf÷&R7V&Ö—GF–ær—Bf÷"&Wf–Wrâ"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B7V&Ö—GFVDBÒæWrFFR‚’çFô•4õ7G&–ær‚“°Ð¢6öç7BVç&–6†VBÒ°Ð¢ââç6VÆV7FVBÀÐ¢6÷'&V7F–öäæ÷FS¢6ö×ÆWF–öäWf–FVæ6RÀÐ¢6÷'&V7F—fT7F–öã¢²ââç6VÆV7FVBæ6÷'&V7F—fT7F–öâÂ6ö×ÆWF–öäWf–FVæ6RÂ6ö×ÆWF–öå7V&Ö—GFVDC¢7V&Ö—GFVDBÐÐ¢Ó°Ð¢6öç7BWFFVBÒWFFU7FæF&G5&Wf–Wt—FVÒ†Vç&–6†VBÂ$4õ%$T5DTB"Â$6ö×ÆWF–öâWf–FVæ6R7V&Ö—GFVBf÷"&Wf–Wrâ"“°Ð¢G'’°Ð¢v—B6fU7FæF&G5&Wf–Wu7FFUFõ7W&6R…·WFFVEÒ“°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"Â$6ö×ÆWF–öâWf–FVæ6R7V&Ö—GFVBâ&W6öÇWF–öâæ÷r&WV—&W2W‡Æ–6—B&Wf–Wrâ"“°Ð¢Ò6F6‚…ò’°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"Â$6ö×ÆWF–öâWf–FVæ6R6fVBÆö6ÆÇ’f÷"&Wf–Wrâ"“°Ð¢ÐÐ¢&VæFW%7FæF&G56V7F–öâ‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B7FGW4'”7F–öâÒ°Ð¢&Wf–Ws¢%TäDU"$Ud”Ur"Â6Æ&–g“¢%TäDU"$Ud”Ur"Â6öæf—&Ó¢$4ôäd•$ÔTB"ÀÐ¢F—6Ö—73¢$D•4Ô•54TB"ÂW†7W6S¢$U„5U4TB"Â6÷'&V7C¢$4õ%$T5DTB"Â&W6öÇfS¢%$U4ôÅdTB Ð¢Ó°Ð¢6öç7BæW‡E7FGW2Ò7FGW4'”7F–öå¶'WGFöâæFF6WBç7FæF&D7F–öåÓ°Ð¢–b‚æW‡E7FGW2’&WGW&ã°Ð¢6öç7Bæ÷FRÒ'WGFöâæFF6WBç7FæF&D7F–öâÓÓÒ&6Æ&–g’"ò$6Æ&–f–6F–öâ&WVW7FVB&Vf÷&RFV6—6–öââ"¢FV6—6–öâ&V6÷&FVC¢G¶æW‡E7FGW2çFôÆ÷vW$66R‚’ç&WÆ6TÆÂ‚""Â%ò"—Òæ°Ð¢6öç7BWFFVBÒWFFU7FæF&G5&Wf–Wt—FVÒ‡6VÆV7FVBÂæW‡E7FGW2Âæ÷FR“°Ð¢–b‚WFFVB’°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"ÂF†BG&ç6—F–öâ—2æ÷Bf–Æ&ÆRg&öÒG·6VÆV7FVBç7FGW7Òæ“°Ð¢&WGW&ã°Ð¢ÐÐ¢G'’°Ð¢v—B6fU7FæF&G5&Wf–Wu7FFUFõ7W&6R…·WFFVEÒ“°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"ÂG¶æW‡E7FGW2ç&WÆ6TÆÂ‚%ò"Â""—Ò6fVBFò–÷W"66÷VçBæ“°Ð¢Ò6F6‚…ò’°Ð¢6WEFW‡B‚'7FæF&G2ÖfVVF&6²"ÂG¶æW‡E7FGW2ç&WÆ6TÆÂ‚%ò"Â""—Ò6fVBÆö6ÆÇ’â&VÖ÷FR7FæF&G27F÷&vR—2FV×÷&&–Ç’Væf–Æ&ÆRæ“°Ð¢ÐÐ¢&VæFW%7FæF&G56V7F–öâ‚“°Ð¢Ò“°Ð¢v–æF÷ræFDWfVçDÆ—7FVæW"‚&†6†6†ævR"Â&W7F÷&U6V7F–öäg&öÔ†6‚“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&Æöv÷WB"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6–vä÷WEW6W"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&Öö&–ÆRÖÆöv÷WB"“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6–vä÷WEW6W"“°Ð Ð¢v–æF÷rç6WD–çFW'fÂ‚‚’Óâ°Ð¢–b†Fö7VÖVçBçf—6–&–Æ—G•7FFRÓÒ'f—6–&ÆR"’&WGW&ã°Ð¢&VæFW$f7F–ætW†V7WF–öâ‚“°Ð¢&VæFW%FöF”çWG&—F–öäW†V7WF–öâ‚“°Ð¢&VæFW$çWG&—F–öäæW‡D7F–öâ‚“°Ð¢ÒÂc“°Ð¢–æ—B‚“°Ð§ÐÐ Ð¦–b‡G—VöbÖöGVÆRÓÒ'VæFVf–æVB"’°Ð¢ÖöGVÆRæW‡÷'G2Ò°Ð¢æ÷&ÖÆ—¦Tf—FæW75FW7DGFV×BÀÐ¢fÆ–FFTf—FæW75FW7DGFV×BÀÐ¢'V–ÆEW&f÷&Öæ6T6ö×&—6öä¶W’ÀÐ¢FWFW&Ö–æU&V6÷&D6FVv÷'’ÀÐ¢—5W&f÷&Öæ6T6ö×&&ÆRÀÐ¢WfÇVFUW'6öæÅ&V6÷&BÀÐ¢'V–ÆEW'6öæÅ&V6÷&E6æ6†÷BÀÐ¢WfÇVFTÖ–ÆW7FöæW2ÀÐ¢'V–ÆDFÆ5W&f÷&Öæ6U&Wf–WrÀÐ¢æ÷&ÖÆ—¦Tf—FæW75FW7E&÷Fö6öÂÀÐ¢vWDf—FæW75FW7E&÷Fö6öÄ6FÆörÀÐ¢vWDÖ–ÆW7FöæT6FÆörÀÐ¢vWEW'6öæÅ&V6÷&EW'6—7FVæ6T¶W’ÀÐ¢vWDf—FæW75FW7EW'6—7FVæ6T¶W’ÀÐ¢vWDÖ–ÆW7FöæUW'6—7FVæ6T¶W’ÀÐ¢vWDFÆ5&Wf–WuW'6—7FVæ6T¶W’ÀÐ¢–æ—F–Æ—¦Tf—FæW75FW7DGFV×Ev÷&·76RÀÐ¢WfÇVFU&VF–æW72ÀÐ¢6Æ7VÆFT6öæf–FVæ6RÀÐ¢6Æ7VÆFU&VF–æW72ÀÐ¢'6T÷F–öæÄÖWG&–2ÀÐ¢ô$¤T5D•dUôÔUE$”5ô4ôäd”rÀÐ¢ö&¦V7F—fU6÷W&6TÆ&VÂÀÐ¢vVæW&FTÖ—76–öâÀÐ¢vVæW&FTÖ÷&æ–æt'&–VbÀÐ¢f÷&ÖDFÆ4'&–Vefö–6RÀÐ¢æ÷&ÖÆ—¦T6ö×Æ–æ6U7FGW2ÀÐ¢66÷&T6ö×Æ–æ6TFöÖ–âÀÐ¢6Æ7VÆFTF—66—Æ–æU66÷&RÀÐ¢f÷&ÖDF—66—Æ–æU66÷&RÀÐ¢'V–ÆD6ö×Æ–æ6TW‡ÆæF–öâÀÐ¢FW&—fTF–Ç”6ö×Æ–æ6U7FFRÀÐ¢vWD–ç7V7F–öåvVVµ&ævRÀÐ¢6Æ7VÆFUvVV¶Ç”F—66—Æ–æU66÷&RÀÐ¢6Æ7VÆFTWf–FVæ6T6÷fW&vRÀÐ¢FW&—fT–ç7V7F–öå7FGW2ÀÐ¢–FVçF–g•7G&öævW7DæEvV¶W7DFöÖ–ç2ÀÐ¢6VÆV7DæW‡EvVVµ&–÷&—G’ÀÐ¢vw&VvFUvVV¶Ç”6ö×Æ–æ6RÀÐ¢–ç7V7F–öäæÇ—6—5v–æF÷rÀÐ¢6æöæ–6Äf–æÆ—¦VD–ç7V7F–öç2ÀÐ¢'V–ÆD–ç7V7F–öä–çFVw&—G•7VÖÖ'’ÀÐ¢&W6öÇfUvVV¶Ç”–ç7V7F–öäÆöD÷WF6öÖRÀÐ¢vVæW&FUvVV¶Ç”gFW$7F–öå&W÷'BÀÐ¢f–æÆ—¦UvVV¶Ç”–ç7V7F–öå6æ6†÷BÀÐ¢6÷'D–ç7V7F–öä†—7F÷'’ÀÐ¢6VÆV7EG&VæEv–æF÷rÀÐ¢6Æ7VÆFTÆ–æV%G&VæBÀÐ¢FW&—fUG&¦V7F÷'•7FFRÀÐ¢6Æ7VÆFTFöÖ–åG&VæG2ÀÐ¢6Æ7VÆFT6ö×Æ–æ6U7G&V·2ÀÐ¢7VÖÖ&—¦T–ç7V7F–öä†—7F÷'’ÀÐ¢–FVçF–g”&W7DæDÆ÷vW7EvVV·2ÀÐ¢'V–ÆD6†'E6W&–W2ÀÐ¢vVæW&FTFÆ5G&VæE&W÷'BÀÐ¢FW&—fT6öÖÖæD6VçFW$÷fW'f–WrÀÐ¢ÆFW7DFFVD—FVÒÀÐ¢FFG'WF…6÷W&6RÀÐ¢'V–ÆDFFG'WF„ÖöFVÂÀÐ¢'V–ÆD7F—fF–öäwV–FRÀÐ¢'V–ÆE&Wf–Wt¦÷W&æW’ÀÐ¢—4FWfVÆ÷W$'V–ÆDÆ&VÂÀÐ¢Ç•&öGV7EöÆ—6‚ÀÐ¢æ÷&ÖÆ—¦U6V7F–öä¶W’ÀÐ¢6†÷VÆEv&ä&Vf÷&Tæf–vF–öâÀÐ¢FW&—fTF—'G•7FFRÀÐ¢FW&—fTf–æÆ—¦T6öæf—&ÖF–öå7FFRÀÐ¢—4f–æÆ—¦VE&VDöæÇ”–ç7V7F–öâÀÐ¢vWE7FGW4ÖW76vRÀÐ¢FW&—fU6fU7FFRÀÐ¢FW&—fT–çWD–Ö×WF&–Æ—G•7FFRÀÐ¢vWE7FæF&G46FÆörÀÐ¢æ÷&ÖÆ—¦U&æ´6öFRÀÐ¢vWE&æ´6FÆörÀÐ¢vWD7W'&VçE&æ´FVf–æ—F–öâÀÐ¢vWDæW‡E&æ´FVf–æ—F–öâÀÐ¢fÆ–FFU&æµG&ç6—F–öâÀÐ¢6Æ7VÆFU&öÖ÷F–öäÖWG&–72ÀÐ¢6Æ7VÆFT6öç6V7WF—fUVÆ–g––æuvVV·2ÀÐ¢WfÇVFU&öÖ÷F–öäVÆ–v–&–Æ—G’ÀÐ¢FW&—fU&öÖ÷F–öå7FFRÀÐ¢'V–ÆE&öÖ÷F–öäWf–FVæ6RÀÐ¢vVæW&FTFÆ5&öÖ÷F–öå&Wf–WrÀÐ¢f–æÆ—¦U&öÖ÷F–öå6æ6†÷BÀÐ¢'V–ÆE&æµ7FGW4WfVçBÀÐ¢FW&—fT6÷'&V7F—fUW&–öE7FFRÀÐ¢7VÖÖ&—¦U&öÖ÷F–öä†—7F÷'’ÀÐ¢FW&—fU&æµ7FGW4g&öÕ&V6÷&BÀÐ¢f÷&ÖE&öÖ÷F–öäÖWG&–2ÀÐ¢FVGWUf–öÆF–öä6æF–FFW2ÀÐ¢FW&—fUf–öÆF–öä6æF–FFW2ÀÐ¢FWFV7E&÷FV7FVDW†6WF–öâÀÐ¢6Æ76–g•f–öÆF–öä6æF–FFRÀÐ¢6Æ7VÆFUf–öÆF–öå6WfW&—G’ÀÐ¢fÆ–FFUf–öÆF–öåG&ç6—F–öâÀÐ¢6VÆV7D6÷'&V7F—fT7F–öâÀÐ¢'V–ÆD6÷'&V7F—fT7F–öåÆâÀÐ¢FW&—fT6÷'&V7F—fT7F–öå7FGW2ÀÐ¢vVæW&FTFÆ57FæF&G5&Wf–WrÀÐ¢'V–ÆEf–öÆF–öäVF—DWfVçBÀÐ¢7VÖÖ&—¦UvVV¶Ç•f–öÆF–öä†—7F÷'’ÀÐ¢FW&—fU7FæF&G4÷W&F–öç2ÀÐ¢'V–ÆEFöF•7FæF&G4GWG’ÀÐ¢FWFV7E7FæF&G5GFW&ç2ÀÐ¢FW&—fU7FæF&G57FFRÀÐ¢'V–ÆE7FæF&G5&Wf–Wu7FFRÀÐ¢FW&—fU7FæF&G5&Wf–Wu7FFTg&öÕ&V6÷&BÀÐ¢6æ—F—¦U7FæF&G5&Wf–Wu7FFRÀÐ¢'V–ÆE7FæF&G5W'6—7FVæ6U–ÆöBÀÐ¢vWEW&f÷&Öæ6TFöÖ–ä6FÆörÀÐ¢vWEW&f÷&Öæ6T7F—f—G”6FÆörÀÐ¢æ÷&ÖÆ—¦UW&f÷&Öæ6TVçG'’ÀÐ¢fÆ–FFUW&f÷&Öæ6TVçG'’ÀÐ¢6Æ7VÆFU7G&VæwF…föÇVÖRÀÐ¢W7F–ÖFTöæU&WÖ‚ÀÐ¢6Æ7VÆFU'Vææ–æu6RÀÐ¢æ÷&ÖÆ—¦UW&f÷&Öæ6UVæ—G2ÀÐ¢'V–ÆEW&f÷&Öæ6UW'6—7FVæ6U–ÆöBÀÐ¢‡–G&FUW&f÷&Öæ6TVçG'’ÀÐ¢7VÖÖ&—¦U&V6VçEW&f÷&Öæ6RÀÐ¢'V–ÆD6÷&Uv÷&·76TÖöFVÂÀÐ¢æ÷&ÖÆ—¦UW&f÷&Öæ6Uf–Wt6öFRÀÐ¢f–ÇFW%W&f÷&Öæ6TVçG&–W2ÀÐ¢&VÖ÷fUW&f÷&Öæ6TVçG'’ÀÐ¢FW&—fUW&f÷&Öæ6TV×G•7FFRÀÐ¢'V–ÆD6ö×&&ÆUW&f÷&Öæ6U6W&–W2ÀÐ¢6Æ7VÆFTF—&V7F–öäv&T6†ævRÀÐ¢FWFV7EW&f÷&Öæ6Tæö—6RÀÐ¢6Æ7VÆFU6W&–W5G&VæBÀÐ¢6Æ76–g•W&f÷&Öæ6UG&¦V7F÷'’ÀÐ¢6Æ7VÆFUG&VæD6öæf–FVæ6RÀÐ¢FWFV7EW&f÷&Öæ6UÆFVRÀÐ¢FWFV7E&V6VçE&Vw&W76–öâÀÐ¢6Æ7VÆFT&Væ6†Ö&µ&÷†–Ö—G’ÀÐ¢&æ´VÆ–v–&ÆT&Væ6†Ö&·2ÀÐ¢'V–ÆDæW‡D&Væ6†Ö&µ&V6öÖÖVæFF–öâÀÐ¢WfÇVFU$GFV×E&VF–æW72ÀÐ¢'V–ÆDFöÖ–åW&f÷&Öæ6T–çFVÆÆ–vVæ6RÀÐ¢'V–ÆDf—FæW75FW7D–çFVÆÆ–vVæ6RÀÐ¢'V–ÆEW&f÷&Öæ6T–çFVÆÆ–vVæ6T÷fW'f–WrÀÐ¢'V–ÆDFÆ5W&f÷&Öæ6T–çFVÆÆ–vVæ6RÀÐ¢FW&—fUW&f÷&Öæ6T–çFVÆÆ–vVæ6Uf–Wu7FFRÀÐ¢f÷&ÖD–çFVÆÆ–vVæ6TFVÇFÀÐ¢6÷&U&öw&Õ7FFUF–ÖW7F×ÀÐ¢6VÆV7D6÷&U&öw&Õ7FFRÀÐ¢6÷&UÆäÖF6†W46öçG&7BÀÐ¢6÷&U&öf–ÆTf–ævW'&–çBÀÐ¢tTT´Å•ôUd”DTä4UõD…$U4„ôÄBÀÐ¢E$TäEõt”äDõuõ4•¤RÀÐ¢E$TäEõ4ÄõUõD…$U4„ôÄBÀÐ¢E$TäEôUd”DTä4UõD…$U4„ôÄBÀÐ¢F–Ç”–çFVÆÆ–vVæ6RÀÐ¢'V–ÆD6öÖÖæDWfVçG2ÀÐ¢õ÷6WE6W76–öäf÷%FW7G3¢‡fÇVR’Óâ²6W76–öâÒfÇVS²ÐÐ¢Ó°Ð§ÐÐ Ð¦gVæ7F–öâ7FæF&G57F÷&vT¶W’‚’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§7FæF&G3¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ö°Ð§ÐÐ Ð¦gVæ7F–öâ7FæF&G4WfVçE7F÷&vT¶W’‚’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§7FæF&G2ÖWfVçG3¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ö°Ð§ÐÐ Ð¦gVæ7F–öâÆöE7FæF&G5&Wf–Wu7FFR‚’°Ð¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&âµÓ°Ð¢G'’°Ð¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡7FæF&G57F÷&vT¶W’‚’“°Ð¢6öç7B'6VBÒ7F÷&VBò¥4ôâç'6R‡7F÷&VB’¢µÓ°Ð¢7FæF&G5&Wf–Wu7FFRÒ'&’æ—4'&’‡'6VB’ò'6VB¢µÓ°Ð¢&WGW&â7FæF&G5&Wf–Wu7FFS°Ð¢Ò6F6‚…ò’°Ð¢7FæF&G5&Wf–Wu7FFRÒµÓ°Ð¢&WGW&â7FæF&G5&Wf–Wu7FFS°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6fU7FæF&G5&Wf–Wu7FFR†—FV×2ÒµÒ’°Ð¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&ã°Ð¢G'’°Ð¢7FæF&G5&Wf–Wu7FFRÒ'&’æ—4'&’†—FV×2’ò—FV×2¢µÓ°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡7FæF&G57F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡7FæF&G5&Wf–Wu7FFR’“°Ð¢Ò6F6‚…ò’°Ð¢7FæF&G5&Wf–Wu7FFRÒµÓ°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâÆöE7FæF&G4VF—DWfVçG2‚’°Ð¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&âµÓ°Ð¢G'’°Ð¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡7FæF&G4WfVçE7F÷&vT¶W’‚’“°Ð¢&WGW&â7F÷&VBò¥4ôâç'6R‡7F÷&VB’¢µÓ°Ð¢Ò6F6‚…ò’°Ð¢&WGW&âµÓ°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6fU7FæF&G4VF—DWfVçG2†—FV×2ÒµÒ’°Ð¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&ã°Ð¢G'’°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡7FæF&G4WfVçE7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’†—FV×2’“°Ð¢Ò6F6‚…ò’°Ð¢òò–væ÷&RÆö6ÂW'6—7FVæ6Rf–ÇW&RàÐ¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ7FæF&G4FöÖ–ä6öFR†FöÖ–âÒ'&W÷'F–ær"’°Ð¢6öç7BÖ–ærÒ°Ð¢Ö—76–öã¢$Ô•54”ôâÔU„T5UD”ôâÓ"ÀÐ¢7G&VæwFƒ¢%5E$TäuD‚Ó"ÀÐ¢6&F–ó¢$4$D”òÓ"ÀÐ¢&V6÷fW'“¢%$T4õdU%’Ó"ÀÐ¢çWG&—F–öã¢$åUE$•D”ôâÓ Ð¢Ó°Ð¢&WGW&âÖ–æu¶FöÖ–åÒÇÂ%$Uõ%D”ärÓ#°Ð§ÐÐ Ð¦gVæ7F–öâFW&—fU7FæF&G5&Wf–Wt—FV×2‡&V6÷&BÒçVÆÂ’°Ð¢–b‚&V6÷&B’&WGW&âµÓ°Ð¢6öç7BVçG&–W2Ò4ôÕÄ”ä4UôDôÔ”å2ç&VGV6R‚‡&W7VÇG2ÂFöÖ–â’Óâ°Ð¢6öç7B7FGW2Òæ÷&ÖÆ—¦T6ö×Æ–æ6U7FGW2‡&V6÷&E¶G¶FöÖ–çÕ÷7FGW6Ò“°Ð¢6öç7BWf–FVæ6RÒ·&V6÷&E¶G¶FöÖ–çÕö7GVÆÒÇÂ""Â&V6÷&E¶G¶FöÖ–çÕöæ÷FVÒÇÂ""Â&V6÷&E¶G¶FöÖ–çÕ÷&W7G&–7F–öæÒÇÂ"%Òæf–ÇFW"„&ööÆVâ’æ¦ö–â‚"Â"“°Ð¢6öç7B&÷FV7FVDW†6WF–öâÒ&V6÷&E¶G¶FöÖ–çÕö&÷fVEöÖöF–f–6F–öæÒò&&÷fVEöÖöF–f–6F–öâ"¢‡&V6÷&E¶G¶FöÖ–çÕ÷&W7G&–7F–öæÒò&&÷fVEöÖöF–f–6F–öâ"¢çVÆÂ“°Ð¢–b‡7FGW2ÓÓÒ&Ö—76VB"bbWf–FVæ6Rbb&÷FV7FVDW†6WF–öâ’°Ð¢&W7VÇG2çW6‚‡°Ð¢–C¢G·&V6÷&Bæ6ö×Æ–æ6UöFFRÇÂFöF”•4ôFFR‚—Ó¢G¶FöÖ–çÖÀÐ¢7FæF&D6öFS¢7FæF&G4FöÖ–ä6öFR†FöÖ–â’ÀÐ¢FöÖ–âÀÐ¢6FVv÷'“¢4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶FöÖ–åÒÀÐ¢F—FÆS¢G´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶FöÖ–å×Ò&Wf–WvÀÐ¢6÷W&6UG—S¢&F–Ç•ö6ö×Æ–æ6R"ÀÐ¢6÷W&6TFFS¢&V6÷&Bæ6ö×Æ–æ6UöFFRÇÂFöF”•4ôFFR‚’ÀÐ¢Wf–FVæ6RÀÐ¢7FGW3¢&Ö—76VB"ÀÐ¢&WVD6÷VçC¢ÀÐ¢FVÆ–&W&FS¢fÇ6RÀÐ¢6fWG“¢fÇ6PÐ¢Ò“°Ð¢ÐÐ¢&WGW&â&W7VÇG3°Ð¢ÒÂµÒ“°Ð¢&WGW&âFW&—fUf–öÆF–öä6æF–FFW2†VçG&–W2ÂµÒ’æÖ‚†6æF–FFR’Óâ6Æ76–g•f–öÆF–öä6æF–FFR†6æF–FFR’“°Ð§ÐÐ Ð¦gVæ7F–öâÖW&vU7FæF&G5&Wf–Wt—FV×2†—FV×2ÒµÒ’°Ð¢6öç7BW†—7F–ærÒÆöE7FæF&G5&Wf–Wu7FFR‚“°Ð¢6öç7BÖW&vVD7W'&VçBÒ—FV×2æÖ‚†—FVÒ’Óâ°Ð¢6öç7BW'6—7FVBÒW†—7F–æræf–æB‚‡&V6÷&B’Óâ&V6÷&Bæ–BÓÓÒ—FVÒæ–B“°Ð¢–b‚W'6—7FVB’&WGW&â—FVÓ°Ð¢&WGW&â°Ð¢ââæ—FVÒÀÐ¢ââçW'6—7FVBÀÐ¢6WfW&—G“¢W'6—7FVBç6WfW&—G’ÇÂ—FVÒç6WfW&—G’ÀÐ¢6÷'&V7F—fT7F–öã¢W'6—7FVBæ6÷'&V7F—fT7F–öâÇÂ—FVÒæ6÷'&V7F—fT7F–öâÀÐ¢&÷FV7FVDW†6WF–öã¢W'6—7FVBç&÷FV7FVDW†6WF–öâÇÂ—FVÒç&÷FV7FVDW†6WF–öàÐ¢Ó°Ð¢Ò“°Ð¢6öç7B7W'&VçD–G2ÒæWr6WB†ÖW&vVD7W'&VçBæÖ‚†—FVÒ’Óâ—FVÒæ–B’“°Ð¢&WGW&â6æ—F—¦U7FæF&G5&Wf–Wu7FFR…²ââæÖW&vVD7W'&VçBÂââæW†—7F–æræf–ÇFW"‚†—FVÒ’Óâ7W'&VçD–G2æ†2†—FVÒæ–B’•Ò“°Ð§ÐÐ Ð¦gVæ7F–öâWFFU7FæF&G5&Wf–Wt—FVÒ†6æF–FFRÂæW‡E7FGW2Âæ÷FRÒ""’°Ð¢6öç7BG&ç6—F–öâÒfÆ–FFUf–öÆF–öåG&ç6—F–öâ†6æF–FFRç7FGW2ÇÂ$4äD”DDR"ÂæW‡E7FGW2“°Ð¢–b‚G&ç6—F–öâçfÆ–B’&WGW&âçVÆÃ°Ð¢6öç7Bæ÷rÒæWrFFR‚’çFô•4õ7G&–ær‚“°Ð¢6öç7B7F–öâÒæW‡E7FGW2ÓÓÒ$4ôäd•$ÔTB Ð¢ò'V–ÆD6÷'&V7F—fT7F–öåÆâ‡²FöÖ–ã¢6æF–FFRæFöÖ–âÂ6WfW&—G“¢6æF–FFRç6WfW&—G’ÒÂFöF”•4ôFFR‚’Ð¢¢°Ð¢âââ†6æF–FFRæ6÷'&V7F—fT7F–öâÇÂ6VÆV7D6÷'&V7F—fT7F–öâ‡²6Æ76–f–6F–öã¢6æF–FFRæ6Æ76–f–6F–öâÇÂ$4äD”DDR"Â6WfW&—G“¢6æF–FFRç6WfW&—G“òæÆWfVÂÇÂ$ÄUdTÂ’"ÂFöÖ–ã¢6æF–FFRæFöÖ–âÒ’’ÀÐ¢6÷'&V7FVDC¢æW‡E7FGW2ÓÓÒ$4õ%$T5DTB"òæ÷r¢6æF–FFRæ6÷'&V7F—fT7F–öãòæ6÷'&V7FVDBÇÂçVÆÂÀÐ¢&W6öÇfVDC¢æW‡E7FGW2ÓÓÒ%$U4ôÅdTB"òæ÷r¢6æF–FFRæ6÷'&V7F—fT7F–öãòç&W6öÇfVDBÇÂçVÆÂÀÐ¢Æå7FGW3¢æW‡E7FGW2ÓÓÒ%$U4ôÅdTB"ò%$U4ôÅdTB"¢6æF–FFRæ6÷'&V7F—fT7F–öãòçÆå7FGW2ÇÂ$5D•dR Ð¢Ó°Ð¢6öç7BWFFVBÒ°Ð¢ââæ6æF–FFRÀÐ¢7FGW3¢æW‡E7FGW2ÀÐ¢6Æ76–f–6F–öã¢æW‡E7FGW2ÓÓÒ$4ôäd•$ÔTB"ò$4ôäd•$ÔTB"¢æW‡E7FGW2ÓÓÒ$D•4Ô•54TB"ò$D•4Ô•54TB"¢æW‡E7FGW2ÓÓÒ$U„5U4TB"ò$U„5U4TB"¢6æF–FFRæ6Æ76–f–6F–öâÇÂ$4äD”DDR"ÀÐ¢6÷'&V7F—fT7F–öã¢7F–öâÀÐ¢6öæf—&ÖVDC¢æW‡E7FGW2ÓÓÒ$4ôäd•$ÔTB"òæ÷r¢6æF–FFRæ6öæf—&ÖVDBÀÐ¢6÷'&V7FVDC¢æW‡E7FGW2ÓÓÒ$4õ%$T5DTB"òæ÷r¢6æF–FFRæ6÷'&V7FVDBÀÐ¢&W6öÇfVDC¢æW‡E7FGW2ÓÓÒ%$U4ôÅdTB"òæ÷r¢6æF–FFRç&W6öÇfVDBÀÐ¢F—6Ö—76VDC¢æW‡E7FGW2ÓÓÒ$D•4Ô•54TB"òæ÷r¢6æF–FFRæF—6Ö—76VDBÀÐ¢W†7W6VDC¢æW‡E7FGW2ÓÓÒ$U„5U4TB"òæ÷r¢6æF–FFRæW†7W6VDBÀÐ¢WFFVDC¢æ÷pÐ¢Ó°Ð¢6öç7BW†—7F–æt–æFW‚Ò7FæF&G5&Wf–Wu7FFRæf–æD–æFW‚‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ6æF–FFRæ–B“°Ð¢–b†W†—7F–æt–æFW‚ãÒ’°Ð¢7FæF&G5&Wf–Wu7FFU¶W†—7F–æt–æFW…ÒÒWFFVC°Ð¢ÒVÇ6R°Ð¢7FæF&G5&Wf–Wu7FFRçW6‚‡WFFVB“°Ð¢ÐÐ¢6öç7BWfVçBÒ'V–ÆEf–öÆF–öäVF—DWfVçB†6æF–FFRæ–BÂ6æF–FFRç7FGW2ÇÂ$4äD”DDR"ÂæW‡E7FGW2Âæ÷FRÇÂ&Wf–WvVBf–G¶æW‡E7FGW2çFôÆ÷vW$66R‚’ç&WÆ6TÆÂ‚""Â%ò"—Ö“°Ð¢6öç7BWfVçG2ÒÆöE7FæF&G4VF—DWfVçG2‚“°Ð¢WfVçG2çW6‚‡²ââæWfVçBÂf–öÆF–öä–C¢6æF–FFRæ–BÂW6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÂ7&VFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢6fU7FæF&G4VF—DWfVçG2†WfVçG2“°Ð¢6fU7FæF&G5&Wf–Wu7FFR‡7FæF&G5&Wf–Wu7FFR“°Ð¢&WGW&âWFFVC°Ð§ÐÐ Ð¦gVæ7F–öâ6ö×÷6U7FæF&G5W'6—7FVæ6U–ÆöB†6æF–FFRÂ7F÷&vTÖöFRÒ%5U$4R"’°Ð¢&WGW&â'V–ÆE7FæF&G5W'6—7FVæ6U–ÆöB‡°Ð¢–C¢6æF–FFRæ–BÀÐ¢W6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÀÐ¢7FæF&D6öFS¢6æF–FFRç7FæF&D6öFRÇÂ6æF–FFRç7FæF&Eö6öFRÇÂ7FæF&G4FöÖ–ä6öFR†6æF–FFRæFöÖ–â’ÀÐ¢6FVv÷'“¢6æF–FFRæ6FVv÷'’ÇÂ%&W÷'F–æræBWf–FVæ6R"ÀÐ¢F—FÆS¢6æF–FFRçF—FÆRÇÂ%7FæF&G2&Wf–Wr"ÀÐ¢6÷W&6UG—S¢6æF–FFRç6÷W&6UG—RÇÂ6æF–FFRç6÷W&6U÷G—RÇÂ&F–Ç•ö6ö×Æ–æ6R"ÀÐ¢6÷W&6T–C¢6æF–FFRç6÷W&6T–BÇÂ6æF–FFRç6÷W&6Uö–BÇÂçVÆÂÀÐ¢6÷W&6TFFS¢6æF–FFRç6÷W&6TFFRÇÂ6æF–FFRç6÷W&6UöFFRÇÂFöF”•4ôFFR‚’ÀÐ¢FöÖ–ã¢6æF–FFRæFöÖ–âÇÂçVÆÂÀÐ¢Wf–FVæ6S¢6æF–FFRæWf–FVæ6RÇÂçVÆÂÀÐ¢&÷FV7FVDW†6WF–öã¢6æF–FFRç&÷FV7FVDW†6WF–öâÇÂçVÆÂÀÐ¢6æF–FFU&V6öã¢6æF–FFRæ6æF–FFU&V6öâÇÂ6æF–FFRæ6æF–FFU÷&V6öâÇÂçVÆÂÀÐ¢6Æ76–f–6F–öã¢6æF–FFRæ6Æ76–f–6F–öâÇÂ$4äD”DDR"ÀÐ¢6WfW&—G“¢6æF–FFRç6WfW&—G“òæÆWfVÂÇÂ6æF–FFRç6WfW&—G’ÇÂ$ÄUdTÂ’"ÀÐ¢7FGW3¢6æF–FFRç7FGW2ÇÂ$4äD”DDR"ÀÐ¢6÷'&V7F—fT7F–öã¢6æF–FFRæ6÷'&V7F—fT7F–öâÇÂçVÆÂÀÐ¢6÷'&V7F–öäæ÷FS¢6æF–FFRæ6÷'&V7F–öäæ÷FRÇÂ6æF–FFRæ6÷'&V7F–öåöæ÷FRÇÂçVÆÂÀÐ¢6öæf—&ÖVDC¢6æF–FFRæ6öæf—&ÖVDBÇÂ6æF–FFRæ6öæf—&ÖVEöBÇÂçVÆÂÀÐ¢6÷'&V7FVDC¢6æF–FFRæ6÷'&V7FVDBÇÂ6æF–FFRæ6÷'&V7FVEöBÇÂçVÆÂÀÐ¢&W6öÇfVDC¢6æF–FFRç&W6öÇfVDBÇÂ6æF–FFRç&W6öÇfVEöBÇÂçVÆÂÀÐ¢F—6Ö—76VDC¢6æF–FFRæF—6Ö—76VDBÇÂ6æF–FFRæF—6Ö—76VEöBÇÂçVÆÂÀÐ¢W†7W6VDC¢6æF–FFRæW†7W6VDBÇÂ6æF–FFRæW†7W6VEöBÇÂçVÆÂÀÐ¢7&VFVDC¢6æF–FFRæ7&VFVDBÇÂ6æF–FFRæ7&VFVEöBÇÂçVÆÂÀÐ¢WFFVDC¢6æF–FFRçWFFVDBÇÂ6æF–FFRçWFFVEöBÇÂçVÆÂÀÐ¢7F÷&vTÖöFPÐ¢Ò“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ6fU7FæF&G5&Wf–Wu7FFUFõ7W&6R†—FV×2ÒµÒ’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B–ÆöG2Ò6æ—F—¦U7FæF&G5&Wf–Wu7FFR†—FV×2’æÖ‚†—FVÒ’Óâ°Ð¢6öç7B–ÆöBÒ6ö×÷6U7FæF&G5W'6—7FVæ6U–ÆöB†—FVÒÂ%5U$4R"“°Ð¢6öç7BFF&6T–BÒ—FVÒæFF&6T–BÇÂ—FVÒæFF&6Uö–C°Ð¢–b†FF&6T–Bbbõå³Ó–Öe×³‡ÒÕ³Ó–Öe×³GÒÕ³ÓUÕ³Ó–Öe×³7ÒÕ³ƒ–%Õ³Ó–Öe×³7ÒÕ³Ó–Öe×³'ÒBö’çFW7B†FF&6T–B’’–ÆöBæ–BÒFF&6T–C°Ð¢VÇ6RFVÆWFR–ÆöBæ–C°Ð¢ö&¦V7Bæ¶W—2‡–ÆöB’æf÷$V6‚‚†¶W’’Óâ–ÆöE¶¶W•ÒÓÓÒçVÆÂbbFVÆWFR–ÆöE¶¶W•Ò“°Ð¢&WGW&â–ÆöC°Ð¢Ò“°Ð¢6öç7B²W'&÷"ÒÒv—B7W&6Ræg&öÒ‚'7FæF&G5÷f–öÆF–öç2"’çW6W'B‡–ÆöG2Â²öä6öæfÆ–7C¢'W6W%ö–BÇ7FæF&Eö6öFRÇ6÷W&6U÷G—RÇ6÷W&6UöFFRÆFöÖ–â"Ò“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâÆöE7FæF&G5&Wf–Wu7FFTg&öÕ7W&6R‚’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B²FFÂW'&÷"ÒÒv—B7W&6Ræg&öÒ‚'7FæF&G5÷f–öÆF–öç2"’ç6VÆV7B‚"¢"’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æ÷&FW"‚&7&VFVEöB"Â²66VæF–æs¢G'VRÒ“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð¢&WGW&âFFÇÂµÓ°Ð§ÐÐ Ð¦gVæ7F–öâ&æµ7F÷&vT¶W’‚’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§&æ³¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ö°Ð§ÐÐ Ð¦gVæ7F–öâ&öÖ÷F–öä†—7F÷'•7F÷&vT¶W’‚’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§&æ²Ö†—7F÷'“¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ö°Ð§ÐÐ Ð¦gVæ7F–öâÆöE&æµ7FGW2‚’°Ð¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&â&æµ7FGW3°Ð¢G'’°Ð¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡&æµ7F÷&vT¶W’‚’“°Ð¢6öç7B'6VBÒ7F÷&VBò¥4ôâç'6R‡7F÷&VB’¢çVÆÃ°Ð¢&æµ7FGW2Ò'6VBò²ââç&æµ7FGW2Âââç'6VBÒ¢&æµ7FGW3°Ð¢&WGW&â&æµ7FGW3°Ð¢Ò6F6‚…ò’°Ð¢&WGW&â&æµ7FGW3°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6fU&æµ7FGW2‚’°Ð¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&ã°Ð¢G'’°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡&æµ7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡&æµ7FGW2’“°Ð¢Ò6F6‚…ò’°Ð¢òò–væ÷&RÆö6ÂW'6—7FVæ6Rf–ÇW&RàÐ¢ÐÐ§ÐÐ Ð¦gVæ7F–öâÆöE&öÖ÷F–öä†—7F÷'’‚’°¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&â&öÖ÷F–öä†—7F÷'“°¢G'’°¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡&öÖ÷F–öä†—7F÷'•7F÷&vT¶W’‚’“°¢6öç7B'6VBÒ7F÷&VBò¥4ôâç'6R‡7F÷&VB’¢µÓ°¢6öç7BÆVv7’Ò'&’æ—4'&’‡'6VB’ò'6VB¢µÓ°¢6öç7B6W'F–f–VBÒ&VE&æ´Gfæ6VÖVçD†—7F÷'’‚“°¢&öÖ÷F–öä†—7F÷'’ÒG—VöbFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâÓÓÒ'VæFVf–æVB ¢ò6W'F–f–VBæÆVæwF‚ò6W'F–f–VB¢ÆVv7¢¢6W'F–f–VBç&VGV6R‚††—7F÷'’Â—FVÒ’ÓâFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâçW6W'D†—7F÷'’††—7F÷'’Â—FVÒÂ"’ÂÆVv7’æf–ÇFW"‚†—FVÒ’Óâ—FVÓòæÆö6¶VBbb—FVÓòç7FGW2ÓÓÒ$4U%D”d”TB"’“°¢–b‡G—VöbFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâÓÒ'VæFVf–æVB"bb&öÖ÷F–öä†—7F÷'’æÆVæwF‚’°¢6öç7BGfæ6VÖVçE7FFRÒFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâçfÆ–FFT†—7F÷'’‡&öÖ÷F–öä†—7F÷'’Â&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B"“°¢–b†Gfæ6VÖVçE7FFRçfÆ–BbbGfæ6VÖVçE7FFRæ6÷VçB’&æµ7FGW2Ò²ââç&æµ7FGW2Â7W'&VçE&æ³¢Gfæ6VÖVçE7FFRæ7W'&VçE&æ²Â&öÖ÷F–öå7FFS¢%$ôÔõDTB"Ó°¢Ð¢&WGW&â&öÖ÷F–öä†—7F÷'“°¢Ò6F6‚…ò’°¢&WGW&â&öÖ÷F–öä†—7F÷'“°¢Ð§Ð ¦7–æ2gVæ7F–öâ6fU&öÖ÷F–öä†—7F÷'’†—FV×2ÒµÒÂ÷F–öç2Ò·Ò’°¢–b‡G—Vöbv–æF÷rÓÓÒ'VæFVf–æVB"ÇÂv–æF÷ræÆö6Å7F÷&vR’&WGW&âfÇ6S°¢G'’°¢&öÖ÷F–öä†—7F÷'’Ò'&’æ—4'&’†—FV×2’ò—FV×2¢µÓ°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡&öÖ÷F–öä†—7F÷'•7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡&öÖ÷F–öä†—7F÷'’’“°¢6fT6Æ÷6VDÆö÷Æö6Â‚$„•5Dõ%’"Â'&æ²ÖGfæ6VÖVçBÖ6W'F–f–6F–öâ"Â&öÖ÷F–öä†—7F÷'’“°¢–b†÷F–öç2çW'6—7BÓÓÒfÇ6R’&WGW&âG'VS°¢&WGW&âW'6—7D6Æ÷6VDÆö÷7FFR‚$„•5Dõ%’"Â'&æ²ÖGfæ6VÖVçBÖ6W'F–f–6F–öâ"Â&öÖ÷F–öä†—7F÷'’“°¢Ò6F6‚…ò’°¢&WGW&âfÇ6S°¢Ð§Ð ¦7–æ2gVæ7F–öâ6fU&æ´Gfæ6VÖVçD†æFöfd†—7F÷'’†—FV×2ÒµÒÂ÷F–öç2Ò·Ò’°¢6öç7B†—7F÷'’Ò'&’æ—4'&’†—FV×2’ò—FV×2¢µÓ°¢6fT6Æ÷6VDÆö÷Æö6Â‚$„•5Dõ%’"Â'&æ²ÖGfæ6VÖVçBÖ†æFöfb"Â†—7F÷'’“°¢–b†÷F–öç2çW'6—7BÓÓÒfÇ6R’&WGW&âG'VS°¢&WGW&âW'6—7D6Æ÷6VDÆö÷7FFR‚$„•5Dõ%’"Â'&æ²ÖGfæ6VÖVçBÖ†æFöfb"Â†—7F÷'’“°§Ð ¦gVæ7F–öâ'V–ÆE&æ´Gfæ6VÖVçD†æFöfb†÷F–öç2Ò·Ò’°¢–b‡G—VöbFöÖ–æ–öå&æ´Gfæ6VÖVçD†æFöfbÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°¢6öç7B–çWBÒ°¢6W'F–f–6F–öç3¢&öÖ÷F–öä†—7F÷'’À¢†æFöfg3¢&VE&æ´Gfæ6VÖVçD†æFöfd†—7F÷'’‚’À¢&æ´6FÆös¢vWE&æ´6FÆör‚’À¢6¶æ÷vÆVFvVDC¢÷F–öç2æ6¶æ÷vÆVFvVD@¢Ó°¢&WGW&â÷F–öç2æ6¶æ÷vÆVFvRòFöÖ–æ–öå&æ´Gfæ6VÖVçD†æFöfbæ6¶æ÷vÆVFvR†–çWB’¢FöÖ–æ–öå&æ´Gfæ6VÖVçD†æFöfbæ76W72†–çWB“°§Ð ¦gVæ7F–öâ&æ´Gfæ6VÖVçD†æFöfdÖ&·W††æFöfbÒçVÆÂ’°¢–b‚†æFöfcòçf—6–&ÆR’&WGW&â"#°¢6öç7B&æ²Ò7G&–ær††æFöfbç&æ²ÇÂ%$ä²"’ç&WÆ6TÆÂ‚%ò"Â""“°¢6öç7BæW‡BÒ†æFöfbææW‡E&æ²ò7G&–ær††æFöfbææW‡E&æ²’ç&WÆ6TÆÂ‚%ò"Â""’¢çVÆÃ°¢–b††æFöfbç7FGW2ÓÓÒ$4´äõtÄTDtTB"’&WGW&âÇ6V7F–öâ6Æ73Ò'&æ²ÖGfæ6VÖVçBÖ†æFöfb6¶æ÷vÆVFvVB#ãÆF—b6Æ73Ò'&æ²ÖGfæ6VÖVçBÖ–ç6–væ–"&–Ö†–FFVãÒ'G'VR#âG¶W66T‡FÖÂ‡&æ²ç6Æ–6RƒÂ"’—ÓÂöF—cãÆF—cãÇ7ãå$ä²44UDTCÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&æ²—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ†æW‡BòæW‡B7FæF&C¢G¶æW‡GÖ¢$†–v†W7B&æ²6V7W&VBâ†öÆBF†R7FæF&Bâ"—ÓÂ÷6ÖÆÃãÂöF—cãÂ÷6V7F–öãæ°¢&WGW&âÇ6V7F–öâ6Æ73Ò'&æ²ÖGfæ6VÖVçBÖ†æFöfbVæF–ær#ãÆF—b6Æ73Ò'&æ²ÖGfæ6VÖVçBÖ–ç6–væ–"&–Ö†–FFVãÒ'G'VR#âG¶W66T‡FÖÂ‡&æ²ç6Æ–6RƒÂ"’—ÓÂöF—cãÆF—cãÇ7ãå$ä²4T5U$TCÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&æ²—ÒV&æVCÂ÷7G&öæsãÇâG¶W66T‡FÖÂ††æFöfbææW‡E7FæF&BÇÂ$66WBF†R&æ²æB6öçF–çVRV&æ–ærF†R7FæF&Bâ"—ÓÂ÷ãÆ'WGFöâG—SÒ&'WGFöâ"FF×&æ²Ö†æFöfbÖ7F–öãÒ&6¶æ÷vÆVFvR#ä66WBG¶W66T‡FÖÂ‡&æ²—ÓÂö'WGFöããÂöF—cãÂ÷6V7F–öãæ°§Ð ¦gVæ7F–öâ&æ´6W'F–f–6F–öä–ç7V7F–öç2‚’°¢6öç7B'•vVV²ÒæWrÖ†6æöæ–6Äf–æÆ—¦VD–ç7V7F–öç2†–ç7V7F–öä†—7F÷'’’æÖ‚†—FVÒ’Óâ¶—FVÒçvVVµ7F'DFFRÂ—FVÕÒ’“°¢–b‡vVV¶Ç”–ç7V7F–öãòæf–æÆ—¦VDBbbvVV¶Ç”–ç7V7F–öãòçvVVµ7F'DFFR’'•vVV²ç6WB‡vVV¶Ç”–ç7V7F–öâçvVVµ7F'DFFRÂæ÷&ÖÆ—¦T–ç7V7F–öäf÷$æÇ—F–72‡vVV¶Ç”–ç7V7F–öâ’“°¢&WGW&â²ââæ'•vVV²çfÇVW2‚•Òç6÷'B‚†ÆVgBÂ&–v‡B’Óâ7G&–ær†ÆVgBçvVVµ7F'DFFRÇÂ""’æÆö6ÆT6ö×&R…7G&–ær‡&–v‡BçvVVµ7F'DFFRÇÂ""’’“°§Ð ¦gVæ7F–öâ'V–ÆE&æ´Gfæ6VÖVçD6W'F–f–6F–öâ†÷F–öç2Ò·Ò’°¢–b‡G—VöbFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°¢6öç7B7W'&VçE&æ²Ò÷F–öç2æ7W'&VçE&æ²ÇÂ&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B#°¢6öç7BæW‡E&æ²ÒvWDæW‡E&æ´FVf–æ—F–öâ†7W'&VçE&æ²“°¢6öç7BF&vWE&æ²Ò÷F–öç2çF&vWE&æ²ÇÂæW‡E&æ³òæ6öFS°¢–b‚F&vWE&æ²’&WGW&â²fW'6–öã¢FöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâådU%4”ôâÂ7FGW3¢$4ôÕÄUDR"Â7W'&VçE&æ²ÂF&vWE&æ³¢çVÆÂÂ&W—#¢çVÆÂÓ°¢6öç7B&öÖ÷F–öä–çWBÒ'V–ÆD6æöæ–6Å&öÖ÷F–öä–çWB†7W'&VçE&æ²ÂF&vWE&æ²“°¢6öç7BVÆ–v–&–Æ—G’ÒWfÇVFU&öÖ÷F–öäVÆ–v–&–Æ—G’‡&öÖ÷F–öä–çWBÂF&vWE&æ²“°¢6öç7B–çWBÒ°¢7W'&VçE&æ²À¢F&vWE&æ²À¢VÆ–v–&–Æ—G’À¢–ç7V7F–öç3¢&æ´6W'F–f–6F–öä–ç7V7F–öç2‚’À¢W†V7WF–öä6W'F–f–6F–öç3¢&VEvVV´W†V7WF–öä6W'F–f–6F–öä†—7F÷'’‚’À¢7FæF&G3¢7FæF&G5&Wf–Wu7FFRÇÂµÒÀ¢†—7F÷'“¢&öÖ÷F–öä†—7F÷'’À¢6W'F–f–VDC¢÷F–öç2æ6W'F–f–VD@¢Ó°¢&WGW&â÷F–öç2æ6W'F–g’òFöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâæ6W'F–g’†–çWB’¢FöÖ–æ–öå&æ´Gfæ6VÖVçD6W'F–f–6F–öâæ76W72†–çWB“°§Ð ¦gVæ7F–öâ&æ´Gfæ6VÖVçD6W'F–f–6F–öäÖ&·W†6W'F–f–6F–öâÒçVÆÂ’°¢–b‚6W'F–f–6F–öâ’&WGW&â"#°¢–b†6W'F–f–6F–öâç7FGW2ÓÓÒ$4ôÕÄUDR"’&WGW&âsÆF—b6Æ73Ò'&æ²ÖGfæ6VÖVçB×&ööb6V7W&VB#ãÇ7ãäEdä4TÔTåB$ôôcÂ÷7ããÇ7G&öæsä†–v†W7B&æ²6V7W&VCÂ÷7G&öæsãÇ6ÖÆÃå–÷W"6W'F–f–VB&æ²†—7F÷'’&VÖ–ç2Æö6¶VBFòF†R66÷VçBãÂ÷6ÖÆÃãÂöF—câs°¢6öç7B&VG’Ò6W'F–f–6F–öâç7FGW2ÓÓÒ%$TE’#°¢6öç7BÆFW7BÒ6W'F–f–6F–öâç&ööcòæÆFW7DW†V7WF–öã°¢6öç7B7FGW2Ò&VG’ò%$TE’"¢6W'F–f–6F–öâç7FGW2ÓÓÒ$4U%D”d”TB"ò$Äô4´TB"¢$%T”ÄD”är#°¢6öç7BF—FÆRÒ&VG’òG¶6W'F–f–6F–öâçF&vWE&æ·Ò&ööb6ö×ÆWFV¢6W'F–f–6F–öâç&W—#òæÆ&VÂÇÂG¶6W'F–f–6F–öâçF&vWE&æ·Ò—27F–ÆÂ&V–ærV&æVF°¢6öç7BFWF–ÂÒ&VG¢òG¶6W'F–f–6F–öâçVÆ–g––æuvVV·7Òf–æÆ—¦VBvVV²G¶6W'F–f–6F–öâçVÆ–g––æuvVV·2ÓÓÒò""¢'2'Ò+rÆFW7BW†V7WF–öâ6W'F–f–VBG¶ÆFW7CòçvVVµ7F'BÇÂ"'Ö ¢¢6W'F–f–6F–öâç&W—#òæFWF–ÂÇÂ$f–æÆ—¦RG'W7Gv÷'F‡’vVV·2Fò6ö×ÆWFRF†R&ööbâ#°¢&WGW&âÆF—b6Æ73Ò'&æ²ÖGfæ6VÖVçB×&ööbG·&VG’ò'&VG’"¢&'V–ÆF–ær'Ò#ãÇ7ãäEdä4TÔTåB$ôôcÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡F—FÆR—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ†FWF–Â—ÓÂ÷6ÖÆÃãÂöF—cæ°§Ð Ð¦gVæ7F–öâ&VæFW%&æµ6V7F–öâ‚’°¢–b‡G—VöbFö7VÖVçBÓÓÒ'VæFVf–æVB"ÇÂG—VöbFöÖ–æ–öåvVV¶Ç”Gfæ6VÖVçBÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B6öçF–æW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&–ç7V7F–öâ"“°Ð¢–b‚6öçF–æW"’&WGW&ã°Ð¢6öç7B7W'&VçE&æ²Ò&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B#°Ð¢6öç7BæW‡E&æ²ÒvWDæW‡E&æ´FVf–æ—F–öâ†7W'&VçE&æ²“°Ð¢6öç7B&öÖ÷F–öä–çWBÒ'V–ÆD6æöæ–6Å&öÖ÷F–öä–çWB†7W'&VçE&æ²ÂæW‡E&æ³òæ6öFRÇÂ$4DUB"“°Ð¢6öç7BVÆ–v–&–Æ—G’ÒWfÇVFU&öÖ÷F–öäVÆ–v–&–Æ—G’‡&öÖ÷F–öä–çWBÂæW‡E&æ³òæ6öFRÇÂ$4DUB"’ÇÂ°Ð¢7FGW3¢%$ôu$U54”är"ÀÐ¢&Æö6¶W'3¢µÒÀÐ¢&VÖ–æ–æt7F–öç3¢µÒÀÐ¢F&vWC¢·ÒÀÐ¢Vç&W6öÇfVD6öæf—&ÖVEf–öÆF–öç3¢ÀÐ¢6öç6V7WF—fUVÆ–g––æuvVV·5&WV—&VC¢ Ð¢Ó°Ð¢6öç7B§VFvÖVçBÒFöÖ–æ–öåvVV¶Ç”Gfæ6VÖVçBæ'V–ÆEvVV¶Ç”§VFvÖVçB‡²–ç7V7F–öã¢vVV¶Ç”–ç7V7F–öâÇÂ·ÒÂVÆ–v–&–Æ—G’Â7FæF&G3¢7FæF&G5&Wf–Wu7FFRÂ7W'&VçE&æ²ÂæW‡E&æ³¢æW‡E&æ³òæF—7Æ”æÖRÇÂçVÆÂÒ“°¢6öç7BGfæ6VÖVçD6W'F–f–6F–öâÒ'V–ÆE&æ´Gfæ6VÖVçD6W'F–f–6F–öâ‡²7W'&VçE&æ²ÂF&vWE&æ³¢æW‡E&æ³òæ6öFRÒ“°¢6öç7BGfæ6VÖVçD†æFöfbÒ'V–ÆE&æ´Gfæ6VÖVçD†æFöfb‚“°¢6WEFW‡B‚'&æ²Ö7W'&VçB"Â7W'&VçE&æ²“°Ð¢6WEFW‡B‚'&æ²ÖæW‡B"ÂæW‡E&æ³òæF—7Æ”æÖRÇÂ.(	B"“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖGfæ6VÖVçB×W&6VçB"ÂG¶§VFvÖVçBç&öÖ÷F–öä6öæF—F–öç3òç76VBÇÂÒöbG¶§VFvÖVçBç&öÖ÷F–öä6öæF—F–öç3òçF÷FÂÇÂ§VFvÖVçBævFW2æÆVæwF‡Ò6öæF—F–öç2ÖWF“°¢6WEFW‡B‚'vVV¶Ç’ÖGfæ6VÖVçBÖFWF–Â"Â§VFvÖVçBç&–Ö'”&Æö6¶W"òG¶§VFvÖVçBç&–Ö'”&Æö6¶W'Ò—2F†Rf—'7BvFR&WGvVVâ–÷RæBG¶æW‡E&æ³òæF—7Æ”æÖRÇÂ'F†RæW‡B&æ²'Òæ¢æW‡E&æ²òWfW'’vFRf÷"G¶æW‡E&æ²æF—7Æ”æÖWÒ—26ö×ÆWFRæ¢$†–v†W7B&æ²6V7W&VBâ"“°Ð¢6öç7BÖWFW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖGfæ6VÖVçBÖÖWFW""“°Ð¢–b†ÖWFW"’ÖWFW"ç7G–ÆRçv–GF‚ÒG¶§VFvÖVçBç&öÖ÷F–öå&öw&W77ÒV°Ð¢6öç7B&æµ7FFT&FvRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²×7FFR"“°Ð¢–b‡&æµ7FFT&FvR’°Ð¢&æµ7FFT&FvRçFW‡D6öçFVçBÒVÆ–v–&–Æ—G’ç7FGW2ÓÓÒ$äõBTÄ”t”$ÄR"ò$%T”ÄD”ärUd”DTä4R"¢VÆ–v–&–Æ—G’ç7FGW3°Ð¢&æµ7FFT&FvRæ6Æ74æÖRÒ7FFR×–ÆÂG¶VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ$TÄ”t”$ÄR"ò&w&VVâ"¢VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ%$ôu$U54”är"ò'–VÆÆ÷r"¢VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ$$Äô4´TB"ÇÂVÆ–v–&–Æ—G’ç7FGW2ÓÓÒ$4õ%$T5D•dRU$”ôB"ò'&VB"¢&æWWG&Â'Ö°Ð¢ÐÐ¢6öç7B&WV—&VÖVçG2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²×&WV—&VÖVçG2"“°¢–b‡&WV—&VÖVçG2’&WV—&VÖVçG2æ–ææW$…DÔÂÒ§VFvÖVçBævFW2æÖ‚†vFR’ÓâÆ'F–6ÆR6Æ73Ò"G¶vFRç76VBò'76VB"¢&÷Vâ'Ò#ãÆ’&–Ö†–FFVãÒ'G'VR#ãÂö“ãÆF—cãÇ7G&öæsâG¶W66T‡FÖÂ†vFRæÆ&VÂ—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶vFRç76VBò%6V7W&VB"¢G¶vFRç76VD6÷VçBÇÂÒöbG¶vFRçF÷FÄ6÷VçBÇÂÒ6öæF—F–öç2ÖWFÓÂ÷6ÖÆÃãÂöF—cãÂö'F–6ÆSæ’æ¦ö–â‚""“°¢6öç7B&Æö6¶W'2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²Ö&Æö6¶W'2"“°Ð¢–b†&Æö6¶W'2’&Æö6¶W'2æ–ææW$…DÔÂÒVÆ–v–&–Æ—G’æ&Æö6¶W'2æÆVæwF‚òÇ7G&öæsåv†B&VÖ–ç3Â÷7G&öæsãÇVÃâG¶VÆ–v–&–Æ—G’æ&Æö6¶W'2æÖ‚†—FVÒ’ÓâÆÆ“âG¶W66T‡FÖÂ†—FVÒ—ÓÂöÆ“æ’æ¦ö–â‚""—ÓÂ÷VÃæ¢sÇ7G&öæsäæò&öÖ÷F–öâ&Æö6¶W'2&VÖ–âãÂ÷7G&öæsâs°Ð¢6öç7B†—7F÷'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²Ö†—7F÷'’"“°¢–b††—7F÷'’’†—7F÷'’æ–ææW$…DÔÂÒ&öÖ÷F–öä†—7F÷'’æÆVæwF‚ò&öÖ÷F–öä†—7F÷'’æÖ‚†—FVÒ’ÓâÆÆ’6Æ73Ò&fVVBÖWfVçB–æfò#ãÆF—b6Æ73Ò&fVVBÖÖWF#ãÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒç&–÷%&æ²ÇÂ—FVÒæ7W'&VçE&æ²ÇÂ%$T5%T•B"—Ò(i"G¶W66T‡FÖÂ†—FVÒææWu&æ²ÇÂ—FVÒçF&vWE&æ²ÇÂ$4DUB"—ÓÂ÷7G&öæsãÇ7ãâG¶W66T‡FÖÂ†—FVÒæÆö6¶VBò$4U%D”d”TB"¢—FVÒç&öÖ÷F–öå7FFRÇÂ%$ôÔõDTB"—ÓÂ÷7ããÂöF—cãÇâG¶W66T‡FÖÂ†—FVÒæVffV7F—fTFFRÇÂ""—ÓÂ÷ãÂöÆ“æ’æ¦ö–â‚""’¢sÆÆ’6Æ73Ò&fVVBÖV×G’#äæò6W'F–f–VB&öÖ÷F–öç2–WBãÂöÆ“âs°¢6öç7B6W'F–f–6F–öä†÷7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²ÖGfæ6VÖVçBÖ6W'F–f–6F–öâ"“°¢–b†6W'F–f–6F–öä†÷7B’°¢6W'F–f–6F–öä†÷7BæFF6WBç&æµ&ööbÒ7G&–ær†Gfæ6VÖVçD6W'F–f–6F–öãòç7FGW2ÇÂ'Væf–Æ&ÆR"’çFôÆ÷vW$66R‚“°¢6W'F–f–6F–öä†÷7Bæ–ææW$…DÔÂÒ&æ´Gfæ6VÖVçD6W'F–f–6F–öäÖ&·W†Gfæ6VÖVçD6W'F–f–6F–öâ“°¢Ð¢6öç7B†æFöfd†÷7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²ÖGfæ6VÖVçBÖ†æFöfb"“°¢–b††æFöfd†÷7B’°¢†æFöfd†÷7BæFF6WBç&æ´†æFöfbÒ7G&–ær†Gfæ6VÖVçD†æFöfcòç7FGW2ÇÂ&æöæR"’çFôÆ÷vW$66R‚“°¢†æFöfd†÷7Bæ–ææW$…DÔÂÒ&æ´Gfæ6VÖVçD†æFöfdÖ&·W†Gfæ6VÖVçD†æFöfb“°¢†æFöfd†÷7Bæ†–FFVâÒGfæ6VÖVçD†æFöfcòçf—6–&ÆS°¢Ð¢6öç7B&öÖ÷FRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f–æÆ—¦R×&öÖ÷F–öâ"“°¢–b‡&öÖ÷FR’°¢&öÖ÷FRæ†–FFVâÒGfæ6VÖVçD6W'F–f–6F–öãòç7FGW2ÓÒ%$TE’"ÇÂæW‡E&æ³°¢&öÖ÷FRæF—6&ÆVBÒfÇ6S°¢Ð¢Fö7VÖVçBæ&öG’æFF6WBç&æ´Gfæ6VÖVçBÒ7G&–ær†Gfæ6VÖVçD6W'F–f–6F–öãòç7FGW2ÇÂ'Væf–Æ&ÆR"’çFôÆ÷vW$66R‚“°¢Fö7VÖVçBæ&öG’æFF6WBç&æ´†æFöfbÒ7G&–ær†Gfæ6VÖVçD†æFöfcòç7FGW2ÇÂ&æöæR"’çFôÆ÷vW$66R‚“°¢&WGW&ã°Ð¢6öç7BWf–FVæ6RÒ'V–ÆE&öÖ÷F–öäWf–FVæ6R‡²ââç&öÖ÷F–öä–çWBÂæW‡E&æ³¢æW‡E&æ³òæ6öFRÇÂ$4DUB"Ò“°Ð¢6öç7B&Wf–WrÒvVæW&FTFÆ5&öÖ÷F–öå&Wf–Wr‡°Ð¢7W'&VçE&æ²ÀÐ¢æW‡E&æ³¢æW‡E&æ³òæ6öFRÇÂ$4DUB"ÀÐ¢7FGW3¢VÆ–v–&–Æ—G’ç7FGW2ÀÐ¢&Æö6¶W'3¢VÆ–v–&–Æ—G’æ&Æö6¶W'2ÀÐ¢&VÖ–æ–æt7F–öç3¢VÆ–v–&–Æ—G’ç&VÖ–æ–æt7F–öç2ÀÐ¢VÆ–g––æt†—7F÷'“¢G·&öÖ÷F–öä–çWBæf–æÆ—¦VD–ç7V7F–öç7Òf–æÆ—¦VB–ç7V7F–öç2f–Æ&ÆVÀÐ¢F—66—Æ–æU7FæF&C¢&V6VçBvVV¶Ç’F—66—Æ–æR66÷&RF&vWB—2G¶VÆ–v–&–Æ—G’çF&vWCòæÖ–æ–×VÔfW&vTF—66—Æ–æU66÷&RÇÂÖÀÐ¢Wf–FVæ6U7FæF&C¢Wf–FVæ6R6÷fW&vRF&vWB—2G¶VÆ–v–&–Æ—G’çF&vWCòæÖ–æ–×VÔfW&vTWf–FVæ6T6÷fW&vRÇÂÒVÀÐ¢7FæF&G5&V6÷&C¢6öæf—&ÖVB7FæF&G2—77VW3¢G¶VÆ–v–&–Æ—G’çVç&W6öÇfVD6öæf—&ÖVEf–öÆF–öç2ÇÂÖÀÐ¢&öÖ÷F–öä÷&FW#¢$öæR&æ²BF–ÖRâ"ÀÐ¢6öÖÖæDæ÷FS¢æW‡E&æ²òG¶æW‡E&æ²ç&öÖ÷F–öä6öÖÖæDæ÷FWÖ¢$æòFF—F–öæÂ&æ²&VÖ–ç2â Ð¢Ò“°Ð¢6WEFW‡B‚'&æ²Ö7W'&VçB"Â7W'&VçE&æ²“°Ð¢6WEFW‡B‚'&æ²ÖæW‡B"ÂæW‡E&æ³òæF—7Æ”æÖRÇÂ.(	B"“°Ð¢6WEFW‡B‚'&æ²×7FGW2"ÂVÆ–v–&–Æ—G’ç7FGW2“°Ð¢6WEFW‡B‚'&æ²×VÆ–g––ær×vVV·2"Â7G&–ær†VÆ–v–&–Æ—G’æ6öç6V7WF—fUVÆ–g––æuvVV·5&WV—&VBÇÂ’“°Ð¢6öç7BÆVv7•&æµ7FFT&FvRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²×7FFR"“°Ð¢–b†ÆVv7•&æµ7FFT&FvR’°Ð¢ÆVv7•&æµ7FFT&FvRçFW‡D6öçFVçBÒVÆ–v–&–Æ—G’ç7FGW3°Ð¢ÆVv7•&æµ7FFT&FvRæ6Æ74æÖRÒ7FFR×–ÆÂG¶VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ$TÄ”t”$ÄR"ò&w&VVâ"¢VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ%$ôÔõDTB"ò&w&VVâ"¢VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ%$ôu$U54”är"ò'–VÆÆ÷r"¢VÆ–v–&–Æ—G’ç7FGW2ÓÓÒ$$Äô4´TB"ò'&VB"¢&æWWG&Â'Ö°Ð¢ÐÐ¢6öç7BÆVv7•&WV—&VÖVçG2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²×&WV—&VÖVçG2"“°Ð¢–b†ÆVv7•&WV—&VÖVçG2’°Ð¢ÆVv7•&WV—&VÖVçG2æ–ææW$…DÔÂÒWf–FVæ6Rç&WV—&VÖVçG2æÖ‚†—FVÒ’ÓâÆÆ“âG¶—FVÒç&WV—&VÖVçBç&WÆ6TÆÂ‚%ò"Â""—Ò(	BF&vWBG¶—FVÒçF&vWGÒÂ7GVÂG¶—FVÒæ7GVÂÓÓÒçVÆÂÇÂçVÖ&W"æ—4f–æ—FR„çVÖ&W"†—FVÒæ7GVÂ’’ò$–ç7Vff–6–VçBWf–FVæ6R"¢ÖF‚ç&÷VæB„çVÖ&W"†—FVÒæ7GVÂ’¢’òÒ‚G¶—FVÒç76VBò%52"¢$d”Â'Ò“ÂöÆ“æ’æ¦ö–â‚""“°Ð¢ÐÐ¢6öç7BÆVv7”&Æö6¶W'2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²Ö&Æö6¶W'2"“°Ð¢–b†ÆVv7”&Æö6¶W'2’°Ð¢ÆVv7”&Æö6¶W'2æ–ææW$…DÔÂÒVÆ–v–&–Æ—G’æ&Æö6¶W'2æÆVæwF‚òVÆ–v–&–Æ—G’æ&Æö6¶W'2æÖ‚†—FVÒ’ÓâÆF—b6Æ73Ò'7FæF&G2Ö—FVÒ#ãÇâG¶—FV×ÓÂ÷ãÂöF—cæ’æ¦ö–â‚""’¢sÆF—b6Æ73Ò'7FæF&G2ÖV×G’#äæò&Æö6¶W'2FWFV7FVBãÂöF—câs°Ð¢ÐÐ¢6öç7B&Wf–Wt÷WGWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²×&Wf–WrÖ÷WGWB"“°Ð¢–b‡&Wf–Wt÷WGWB’&Wf–Wt÷WGWBçFW‡D6öçFVçBÒ&Wf–WrçFW‡C°Ð¢6öç7BÆVv7”†—7F÷'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²Ö†—7F÷'’"“°Ð¢–b†ÆVv7”†—7F÷'’’°Ð¢6öç7B—FV×2Ò&öÖ÷F–öä†—7F÷'’æÆVæwF‚ò&öÖ÷F–öä†—7F÷'’æÖ‚†—FVÒ’ÓâÆÆ’6Æ73Ò&fVVBÖWfVçB–æfò#ãÆF—b6Æ73Ò&fVVBÖÖWF#ãÇ7G&öæsâG¶—FVÒç&–÷%&æ²ÇÂ%$T5%T•B'Ò(i"G¶—FVÒæ7W'&VçE&æ²ÇÂ$4DUB'ÓÂ÷7G&öæsãÇ7ãâG¶—FVÒç&öÖ÷F–öå7FFRÇÂ%$ôÔõDTB'ÓÂ÷7ããÂöF—cãÇâG¶—FVÒæVffV7F—fTFFRÇÂ"'ÓÂ÷ãÂöÆ“æ’æ¦ö–â‚""’¢sÆÆ’6Æ73Ò&fVVBÖV×G’#äæòf–æÆ—¦VB&öÖ÷F–öç2–WBãÂöÆ“âs°Ð¢ÆVv7”†—7F÷'’æ–ææW$…DÔÂÒ—FV×3°Ð¢ÐÐ¢6öç7BÆFFW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'&æ²ÖÆFFW""“°Ð¢–b†ÆFFW"’°Ð¢ÆFFW"æ–ææW$…DÔÂÒvWE&æ´6FÆör‚’æÖ‚‡&æ²’ÓâÆF—b6Æ73Ò'7FæF&G2Ö—FVÒ#ãÆF—b6Æ73Ò'7FæF&G2Ö—FVÒÖ†VFW"#ãÇ7G&öæsâG·&æ²æF—7Æ”æÖWÓÂ÷7G&öæsãÇ7â6Æ73Ò'7FFR×–ÆÂG·&æ²æ6öFRÓÓÒ7W'&VçE&æ²ò&w&VVâ"¢&æWWG&Â'Ò#âG·&æ²æ6öFWÓÂ÷7ããÂöF—cãÇâG·&æ²æFW67&—F–öçÓÂ÷ãÇ6ÖÆÃäÖ–â–ç7V7F–öç2G·&æ²æÖ–æ–×VÔf–æÆ—¦VD–ç7V7F–öç7Ó²Ö–â66÷&RG·&æ²æÖ–æ–×VÔfW&vTF—66—Æ–æU66÷&WÓ²Wf–FVæ6RG·&æ²æÖ–æ–×VÔfW&vTWf–FVæ6T6÷fW&vWÒSÂ÷6ÖÆÃãÂöF—cæ’æ¦ö–â‚""“°Ð¢ÐÐ¢&VæFW%&Wf–Wt‡V"‚“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%7FæF&G56V7F–öâ‚’°Ð¢–b‡G—VöbFö7VÖVçBÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B6öçF–æW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2"“°Ð¢–b‚6öçF–æW"’&WGW&ã°Ð¢6öç7B6FÆörÒvWE7FæF&G46FÆör‚“°Ð¢6öç7B—FV×2ÒÖW&vU7FæF&G5&Wf–Wt—FV×2†FW&—fU7FæF&G5&Wf–Wt—FV×2†F–Ç”6ö×Æ–æ6R’“°Ð¢6öç7B÷W&F–öç2ÒFW&—fU7FæF&G4÷W&F–öç2†—FV×2“°Ð¢6öç7BGFW&ç2ÒFWFV7E7FæF&G5GFW&ç2†—FV×2“°Ð¢6öç7B÷Vä—FV×2Ò²ââæ÷W&F–öç2ææVVG5&Wf–WrÂââæ÷W&F–öç2æ7F—fT7F–öç5Ó°Ð¢6öç7B7VÖÖ'•7FFRÒ÷Vä—FV×2æÆVæwF‚ò†÷Vä—FV×2ç6öÖR‚†—FVÒ’Óâ—FVÒç7FGW2ÓÓÒ$4ôäd•$ÔTB"’ò%$Ud”Ut”är"¢$Ôôä•Dõ$”är"’¢$4ÄT"#°Ð¢6WEFW‡B‚'7FæF&G2Ö6FÆörÖ6÷VçB"Â6FÆöræÆVæwF‚“°Ð¢6WEFW‡B‚'7FæF&G2Ö6æF–FFRÖ6÷VçB"Â÷Vä—FV×2æÆVæwF‚“°Ð¢6WEFW‡B‚'7FæF&G2Ö6öæf—&ÖVBÖ6÷VçB"Â—FV×2æf–ÇFW"‚†—FVÒ’Óâ—FVÒç7FGW2ÓÓÒ$4ôäd•$ÔTB"’æÆVæwF‚“°Ð¢6WEFW‡B‚'7FæF&G2×&W6öÇfVBÖ6÷VçB"Â—FV×2æf–ÇFW"‚†—FVÒ’Óâ—FVÒç7FGW2ÓÓÒ%$U4ôÅdTB"’æÆVæwF‚“°Ð¢6öç7B&FvRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2×7FFR"“°Ð¢–b†&FvR’°Ð¢&FvRçFW‡D6öçFVçBÒ7VÖÖ'•7FFS°Ð¢&FvRæ6Æ74æÖRÒ7FFR×–ÆÂG·7VÖÖ'•7FFRÓÓÒ%$Ud”Ut”är"ò'–VÆÆ÷r"¢7VÖÖ'•7FFRÓÓÒ$Ôôä•Dõ$”är"ò&æWWG&Â"¢&w&VVâ'Ö°Ð¢ÐÐ¢6WEFW‡B‚'7FæF&G2×&Wf–WrÖ6÷VçB"Â÷W&F–öç2ææVVG5&Wf–WræÆVæwF‚“°Ð¢6WEFW‡B‚'7FæF&G2Ö7F—fRÖ6÷VçB"Â÷W&F–öç2æ7F—fT7F–öç2æÆVæwF‚“°Ð¢6WEFW‡B‚'7FæF&G2Ö6Æ÷6VBÖ6÷VçB"Â÷W&F–öç2ç&W6öÇfVBæÆVæwF‚“°Ð¢6öç7BW7F&Æ—6†VEGFW&ç2ÒGFW&ç2æf–ÇFW"‚‡GFW&â’ÓâGFW&âç7Vff–6–VçB“°Ð¢6öç7BGFW&ä&FvRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2×GFW&â×7FFR"“°Ð¢–b‡GFW&ä&FvR’°Ð¢GFW&ä&FvRçFW‡D6öçFVçBÒW7F&Æ—6†VEGFW&ç2æÆVæwF‚òG¶W7F&Æ—6†VEGFW&ç2æÆVæwF‡Ò$Ud”Uv¢GFW&ç2æÆVæwF‚ò$”å5Tdd”4”TåBUd”DTä4R"¢$äòEDU$â#°Ð¢GFW&ä&FvRæ6Æ74æÖRÒ7FFR×–ÆÂG¶W7F&Æ—6†VEGFW&ç2æÆVæwF‚ò'–VÆÆ÷r"¢&æWWG&Â'Ö°Ð¢ÐÐ¢6öç7BGFW&åæVÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2×GFW&ç2"“°Ð¢–b‡GFW&åæVÂ’°Ð¢GFW&åæVÂæ–ææW$…DÔÂÒGFW&ç2æÆVæwF‚òGFW&ç2æÖ‚‡GFW&â’ÓâÆ'F–6ÆR6Æ73Ò'7FæF&G2×GFW&âG·GFW&âç7Vff–6–VçBò&W7F&Æ—6†VB"¢&–ç7Vff–6–VçB'Ò#àÐ¢ÆF—b6Æ73Ò'7FæF&G2Ö—FVÒÖ†VFW"#ãÆF—cãÇ7â6Æ73Ò&¶–6¶W"#âG¶W66T‡FÖÂ‡GFW&âç7FæF&D6öFR—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡GFW&âæFöÖ–â—ÒGFW&â&Wf–WsÂ÷7G&öæsãÂöF—cãÇ7â6Æ73Ò'7FFR×–ÆÂG·GFW&âç7Vff–6–VçBò'–VÆÆ÷r"¢&æWWG&Â'Ò#âG·GFW&âæ6öæf–FVæ6WÓÂ÷7ããÂöF—càÐ¢ÆF—b6Æ73Ò'7FæF&G2Ö66RÖÖWF#ãÇ7ãâG·GFW&âæ66T6÷VçGÒ$Ud”UtTB44U3Â÷7ããÇ7ãâG·GFW&âæF—7F–æ7DFFT6÷VçGÒD•5D”ä5BDDU3Â÷7ããÇ7ãâG·GFW&âæf—'7DFFRÇÂ.(	B'Ò(i"G·GFW&âæÆ7DFFRÇÂ.(	B'ÓÂ÷7ããÂöF—càÐ¢ÇâG¶W66T‡FÖÂ‡GFW&âç&V6öÖÖVæFF–öâ—ÓÂ÷àÐ¢Ç6ÖÆÃä7W'&VçB6WfW&—G’&VÖ–ç2G¶W66T‡FÖÂ‡GFW&âæ7W'&VçDÆWfVÂ—ÒVçF–Â‡VÖâ6öæf—&×2ç’6†ævRãÂ÷6ÖÆÃàÐ¢Âö'F–6ÆSæ’æ¦ö–â‚""’¢sÆF—b6Æ73Ò'7FæF&G2ÖV×G’#äæò&WVFVB&Wf–WvVB7FæF&G266W2&Rf–Æ&ÆRf÷"GFW&âæÇ—6—2ãÂöF—câs°Ð¢ÐÐ¢6öç7B&VæFW$6&BÒ†—FVÒÂÆæR’Óâ°Ð¢6öç7B7FæF&BÒ6FÆöræf–æB‚†VçG'’’ÓâVçG'’æ6öFRÓÓÒ†—FVÒç7FæF&D6öFRÇÂ7FæF&G4FöÖ–ä6öFR†—FVÒæFöÖ–â’’“°Ð¢6öç7B7F–öç2ÒÆæRÓÓÒ'&Wf–Wr Ð¢òÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×7FæF&BÖ7F–öãÒ&6Æ&–g’"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#å&WVW7B6öçFW‡CÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"FF×7FæF&BÖ7F–öãÒ&6öæf—&Ò"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#ä6öæf—&ÓÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×7FæF&BÖ7F–öãÒ&W†7W6R"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#äW†7W6SÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×7FæF&BÖ7F–öãÒ&F—6Ö—72"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#äF—6Ö—73Âö'WGFöãæ Ð¢¢ÆæRÓÓÒ&7F—fR Ð¢òÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×7FæF&BÖ7F–öãÒ'6fR×Æâ"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#å6fRÆãÂö'WGFöãâG¶—FVÒç7FGW2ÓÓÒ$4ôäd•$ÔTB"òÆ'WGFöâG—SÒ&'WGFöâ"FF×7FæF&BÖ7F–öãÒ'7V&Ö—BÖWf–FVæ6R"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#å7V&Ö—BWf–FVæ6SÂö'WGFöãæ¢Æ'WGFöâG—SÒ&'WGFöâ"FF×7FæF&BÖ7F–öãÒ'&W6öÇfR"FF×7FæF&BÖ–CÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#ä&÷fR&W6öÇWF–öãÂö'WGFöãæÖ Ð¢¢"#°Ð¢&WGW&âÆ'F–6ÆR6Æ73Ò'7FæF&G2Ö—FVÒ7FæF&G2Ö66R#àÐ¢ÆF—b6Æ73Ò'7FæF&G2Ö—FVÒÖ†VFW"#ãÆF—cãÇ7â6Æ73Ò&¶–6¶W"#âG¶W66T‡FÖÂ†—FVÒç7FæF&D6öFRÇÂ7FæF&G4FöÖ–ä6öFR†—FVÒæFöÖ–â’—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒçF—FÆRÇÂ7FæF&CòçF—FÆRÇÂ%7FæF&G2&Wf–Wr"—ÓÂ÷7G&öæsãÂöF—cãÇ7â6Æ73Ò'7FFR×–ÆÂG¶—FVÒç7FGW2ÓÓÒ$4ôäd•$ÔTB"ò'–VÆÆ÷r"¢—FVÒç7FGW2ÓÓÒ%$U4ôÅdTB"ò&w&VVâ"¢&æWWG&Â'Ò#âG¶W66T‡FÖÂ†—FVÒç7FGW2—ÓÂ÷7ããÂöF—càÐ¢ÇâG¶W66T‡FÖÂ†—FVÒæWf–FVæ6RÇÂ$æò7W÷'F–ærWf–FVæ6R&V6÷&FVBâ"—ÓÂ÷àÐ¢ÆF—b6Æ73Ò'7FæF&G2Ö66RÖÖWF#ãÇ7ãâG¶W66T‡FÖÂ†—FVÒç6WfW&—G“òæÆWfVÂÇÂ$ÄUdTÂ’"—ÓÂ÷7ããÇ7ãâG¶—FVÒæWf–FVæ6T6öæf–FVæ6WÒUd”DTä4SÂ÷7ããÇ7ãâG¶—FVÒævTF—7ÔBôÄCÂ÷7ããÂöF—càÐ¢G¶—FVÒç&÷FV7FVDW†6WF–öâòÇ6Æ73Ò'7FæF&G2×&÷FV7F–öâ#å&÷FV7FVB6öçFW‡C¢G¶W66T‡FÖÂ†—FVÒç&÷FV7FVDW†6WF–öâ—ÓÂ÷æ¢"'ÐÐ¢G¶ÆæRÓÓÒ&7F—fR"òÆF—b6Æ73Ò'7FæF&G2Ö7F–öâÖ÷&FW"#àÐ¢ÆF—b6Æ73Ò'7FæF&G2Ö7F–öâÖ†VF–ær#ãÇ7G&öæsä6÷'&V7F—fR7F–öâÆãÂ÷7G&öæsãÇ7â6Æ73Ò'7FFR×–ÆÂG¶FW&—fT6÷'&V7F—fT7F–öå7FGW2†—FVÒæ6÷'&V7F—fT7F–öâ’ÓÓÒ$õdU$ETR"ò'&VB"¢FW&—fT6÷'&V7F—fT7F–öå7FGW2†—FVÒæ6÷'&V7F—fT7F–öâ’ÓÓÒ$t•D”är$Ud”Ur"ò'–VÆÆ÷r"¢&æWWG&Â'Ò#âG¶FW&—fT6÷'&V7F—fT7F–öå7FGW2†—FVÒæ6÷'&V7F—fT7F–öâ—ÓÂ÷7ããÂöF—càÐ¢ÇâG¶W66T‡FÖÂ†—FVÒæ6÷'&V7F—fT7F–öãòæFW67&—F–öâÇÂ6VÆV7D6÷'&V7F—fT7F–öâ‡²6Æ76–f–6F–öã¢—FVÒæ6Æ76–f–6F–öâÂ6WfW&—G“¢—FVÒç6WfW&—G“òæÆWfVÂÂFöÖ–ã¢—FVÒæFöÖ–âÒ’æFW67&—F–öâ—ÓÂ÷àÐ¢ÆÆ&VÃäGVRFFSÆ–çWBG—SÒ&FFR"FF×7FæF&BÖGVRfÇVSÒ"G¶W66T‡FÖÂ†—FVÒæ6÷'&V7F—fT7F–öãòæGVTFFRÇÂ""—Ò#ãÂöÆ&VÃàÐ¢ÆÆ&VÃå7V66W727&—FW&–ÇFW‡F&V&÷w3Ò#""FF×7FæF&BÖ7&—FW&–âG¶W66T‡FÖÂ†—FVÒæ6÷'&V7F—fT7F–öãòç7V66W747&—FW&–ÇÂ""—ÓÂ÷FW‡F&VãÂöÆ&VÃàÐ¢ÆÆ&VÃä6ö×ÆWF–öâWf–FVæ6SÇFW‡F&V&÷w3Ò#2"FF×7FæF&BÖWf–FVæ6RÆ6V†öÆFW#Ò%v†Bv26ö×ÆWFVBÂv†W&R—2F†RWf–FVæ6RÂæBv†B6†ævVCò#âG¶W66T‡FÖÂ†—FVÒæ6÷'&V7F—fT7F–öãòæ6ö×ÆWF–öäWf–FVæ6RÇÂ""—ÓÂ÷FW‡F&VãÂöÆ&VÃàÐ¢G¶—FVÒæ6÷'&V7F—fT7F–öãòæ6ö×ÆWF–öå7V&Ö—GFVDBòÇ6ÖÆÃå7V&Ö—GFVBG¶æWrFFR†—FVÒæ6÷'&V7F—fT7F–öâæ6ö×ÆWF–öå7V&Ö—GFVDB’çFôÆö6ÆU7G&–ær‚—Òf÷"W‡Æ–6—B&Wf–WrãÂ÷6ÖÆÃæ¢"'ÐÐ¢ÂöF—cæ¢"'ÐÐ¢G¶7F–öç2òÆF—b6Æ73Ò'7FæF&G2Ö6öçG&öÇ2#âG¶7F–öç7ÓÂöF—cæ¢"'ÐÐ¢Âö'F–6ÆSæ°Ð¢Ó°Ð¢°Ð¢²'7FæF&G2×&Wf–Wr×VWVR"Â÷W&F–öç2ææVVG5&Wf–WrÂ'&Wf–Wr"Â$æòWf–FVæ6R&WV—&W2FV6—6–öââ%ÒÀÐ¢²'7FæF&G2Ö7F—fR×VWVR"Â÷W&F–öç2æ7F—fT7F–öç2Â&7F—fR"Â$æò6öæf—&ÖVB6÷'&V7F—fR7F–öç2&R7F—fRâ%ÒÀÐ¢²'7FæF&G2×&W6öÇfVB×VWVR"Â÷W&F–öç2ç&W6öÇfVBÂ'&W6öÇfVB"Â$æò&W6öÇfVB66W2–WBâ%ÐÐ¢Òæf÷$V6‚‚…¶–BÂÆæT—FV×2ÂÆæRÂV×G•Ò’Óâ°Ð¢6öç7BVÆVÖVçBÒFö7VÖVçBævWDVÆVÖVçD'”–B†–B“°Ð¢–b†VÆVÖVçB’VÆVÖVçBæ–ææW$…DÔÂÒÆæT—FV×2æÆVæwF‚òÆæT—FV×2æÖ‚†—FVÒ’Óâ&VæFW$6&B†—FVÒÂÆæR’’æ¦ö–â‚""’¢ÆF—b6Æ73Ò'7FæF&G2ÖV×G’#âG¶V×G—ÓÂöF—cæ°Ð¢Ò“°Ð¢6öç7B6FÆötVÆVÖVçBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2Ö6FÆör"“°Ð¢–b†6FÆötVÆVÖVçB’6FÆötVÆVÖVçBæ–ææW$…DÔÂÒ6FÆöræÖ‚‡7FæF&B’ÓâÆ'F–6ÆR6Æ73Ò'7FæF&G2Ö—FVÒ#ãÆF—b6Æ73Ò'7FæF&G2Ö—FVÒÖ†VFW"#ãÇ7G&öæsâG¶W66T‡FÖÂ‡7FæF&BçF—FÆR—ÓÂ÷7G&öæsãÇ7ãâG¶W66T‡FÖÂ‡7FæF&Bæ6öFR—ÓÂ÷7ããÂöF—cãÇâG¶W66T‡FÖÂ‡7FæF&BæFW67&—F–öâ—ÓÂ÷ãÇ6ÖÆÃâG¶W66T‡FÖÂ‡7FæF&BæWf–FVæ6U'VÆR—ÓÂ÷6ÖÆÃãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð¢6öç7BVF—EG&–ÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'7FæF&G2ÖVF—B×G&–Â"“°Ð¢–b†VF—EG&–Â’°Ð¢6öç7BWfVçG2ÒÆöE7FæF&G4VF—DWfVçG2‚’ç6Æ–6R‚’ç6÷'B‚†ÆVgBÂ&–v‡B’Óâ‡&–v‡Bæ7&VFVDBÇÂ""’æÆö6ÆT6ö×&R†ÆVgBæ7&VFVDBÇÂ""’“°Ð¢VF—EG&–Âæ–ææW$…DÔÂÒWfVçG2æÆVæwF€Ð¢òWfVçG2æÖ‚†WfVçB’ÓâÆÆ’6Æ73Ò&fVVBÖWfVçB–æfò#ãÆF—b6Æ73Ò&fVVBÖÖWF#ãÇ7G&öæsâG¶WfVçBçf–öÆF–öä–BÇÂ%&Wf–Wr'ÓÂ÷7G&öæsãÇ7ãâG¶WfVçBç&–÷%7FGW7Ò(i"G¶WfVçBææWu7FGW7ÓÂ÷7ããÂöF—cãÇâG¶WfVçBææ÷FRÇÂ%&Wf–WvVB'ÓÂ÷ãÇF–ÖSâG¶WfVçBæ7&VFVDBòæWrFFR†WfVçBæ7&VFVDB’çFôÆö6ÆU7G&–ær‚’¢%VæF–ær'ÓÂ÷F–ÖSãÂöÆ“æ’æ¦ö–â‚""Ð¢¢sÆÆ’6Æ73Ò&fVVBÖV×G’#å7FæF&G2&Wf–Ww2&RÆövvVBÆö6ÆÇ’VçF–Â7W&6RÖ&6¶VBVF—BF&ÆR—2Æ–VBãÂöÆ“âs°Ð¢ÐÐ¢&VæFW%FöF•7FæF&G4GWG’‚“°Ð¢&VæFW%&Wf–Wt‡V"‚“°Ð¢&Vg&W6…G&ç6f÷&ÖF–öäÆVFvW"‚“°Ð§ÐÐ Ð¦gVæ7F–öâV×G”6ö×Æ–æ6TFöÖ–ç2‚’°Ð¢&WGW&âö&¦V7Bæg&öÔVçG&–W2„4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’Óâ¶¶W’Â°Ð¢7FGW3¢çVÆÂÀÐ¢F&vWC¢""ÀÐ¢7GVÃ¢""ÀÐ¢æ÷FS¢""ÀÐ¢&W7G&–7F–öã¢""ÀÐ¢&÷fVDÖöF–f–6F–öã¢fÇ6PÐ¢ÕÒ’“°Ð§ÐÐ Ð¦gVæ7F–öâ6ö×Æ–æ6TFöÖ–ç4g&öÕ&V6÷&B‡&V6÷&B’°Ð¢6öç7BFöÖ–ç2ÒV×G”6ö×Æ–æ6TFöÖ–ç2‚“°Ð¢–b‚&V6÷&B’&WGW&âFöÖ–ç3°Ð¢4ôÕÄ”ä4UôDôÔ”å2æf÷$V6‚‚†¶W’’Óâ°Ð¢FöÖ–ç5¶¶W•ÒÒ°Ð¢7FGW3¢æ÷&ÖÆ—¦T6ö×Æ–æ6U7FGW2‡&V6÷&E¶G¶¶W—Õ÷7FGW6Ò’ÀÐ¢F&vWC¢&V6÷&E¶G¶¶W—Õ÷F&vWFÒÇÂ""ÀÐ¢7GVÃ¢&V6÷&E¶G¶¶W—Õö7GVÆÒÇÂ""ÀÐ¢æ÷FS¢&V6÷&E¶G¶¶W—Õöæ÷FVÒÇÂ""ÀÐ¢&W7G&–7F–öã¢&V6÷&E¶G¶¶W—Õ÷&W7G&–7F–öæÒÇÂ""ÀÐ¢&÷fVDÖöF–f–6F–öã¢&ööÆVâ‡&V6÷&E¶G¶¶W—Õö&÷fVEöÖöF–f–6F–öæÒÐ¢Ó°Ð¢Ò“°Ð¢&WGW&âFöÖ–ç3°Ð§ÐÐ Ð¦gVæ7F–öâ6ö×Æ–æ6TFöÖ–å&÷r†¶W’’°Ð¢&WGW&â Ð¢Æf–VÆG6WB6Æ73Ò&6ö×Æ–æ6RÖFöÖ–â"FFÖFöÖ–ãÒ"G¶¶W—Ò#àÐ¢ÆÆVvVæCãÆ'WGFöâ6Æ73Ò&FöÖ–â×FövvÆR"G—SÒ&'WGFöâ"&–ÖW‡æFVCÒ'G'VR"FFÖFöÖ–â×FövvÆSÒ"G¶¶W—Ò#âG´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•×ÓÂö'WGFöããÂöÆVvVæCàÐ¢ÆF—b6Æ73Ò&6ö×Æ–æ6RÖFöÖ–âÖw&–B"FFÖFöÖ–âÖ6öçFVçCÒ"G¶¶W—Ò#àÐ¢ÆÆ&VÂf÷#Ò"G¶¶W—Õ÷F&vWB#ä76–væVBF&vW@Ð¢Æ–çWB–CÒ"G¶¶W—Õ÷F&vWB"æÖSÒ"G¶¶W—Õ÷F&vWB"Ö†ÆVæwFƒÒ#S"Æ6V†öÆFW#Ò%v†Bv276–væVCò#àÐ¢ÂöÆ&VÃàÐ¢ÆÆ&VÂf÷#Ò"G¶¶W—Õ÷7FGW2#ä6ö×ÆWF–öâ7FGW0Ð¢Ç6VÆV7B–CÒ"G¶¶W—Õ÷7FGW2"æÖSÒ"G¶¶W—Õ÷7FGW2#àÐ¢Æ÷F–öâfÇVSÒ"#ääõB54U54TCÂö÷F–öãàÐ¢Æ÷F–öâfÇVSÒ&6ö×ÆWFVB#ä4ôÕÄUDSÂö÷F–öãàÐ¢Æ÷F–öâfÇVSÒ''F–Â#å%D”ÃÂö÷F–öãàÐ¢Æ÷F–öâfÇVSÒ&Ö—76VB#äÔ•54TCÂö÷F–öãàÐ¢Æ÷F–öâfÇVSÒ&W†7W6VB#äU„5U4TCÂö÷F–öãàÐ¢Æ÷F–öâfÇVSÒ&æ÷EöÆ–6&ÆR#äâôÂö÷F–öãàÐ¢Â÷6VÆV7CàÐ¢ÂöÆ&VÃàÐ¢ÆÆ&VÂf÷#Ò"G¶¶W—Õö7GVÂ#ä7GVÂ&W7VÇ@Ð¢Æ–çWB–CÒ"G¶¶W—Õö7GVÂ"æÖSÒ"G¶¶W—Õö7GVÂ"Ö†ÆVæwFƒÒ#S"Æ6V†öÆFW#Ò%v†Bv26ö×ÆWFVB÷"ÖöF–f–VCò#àÐ¢ÂöÆ&VÃàÐ¢ÆÆ&VÂf÷#Ò"G¶¶W—Õöæ÷FR#åW6W"æ÷FPÐ¢Æ–çWB–CÒ"G¶¶W—Õöæ÷FR"æÖSÒ"G¶¶W—Õöæ÷FR"Ö†ÆVæwFƒÒ#S"Æ6V†öÆFW#Ò$÷F–öæÂW†V7WF–öâ6öçFW‡B#àÐ¢ÂöÆ&VÃàÐ¢ÆÆ&VÂ6Æ73Ò&6ö×Æ–æ6R×&W7G&–7F–öâ"f÷#Ò"G¶¶W—Õ÷&W7G&–7F–öâ#å&W7G&–7F–öâ÷"&÷fVBÖöF–f–6F–öàÐ¢Æ–çWB–CÒ"G¶¶W—Õ÷&W7G&–7F–öâ"æÖSÒ"G¶¶W—Õ÷&W7G&–7F–öâ"Ö†ÆVæwFƒÒ#S"Æ6V†öÆFW#Ò%&VF–æW72ÂÖVF–6ÂÂ÷"&÷fVBF§W7FÖVçB#àÐ¢ÂöÆ&VÃàÐ¢ÆÆ&VÂ6Æ73Ò&6ö×Æ–æ6RÖ6†V6²"f÷#Ò"G¶¶W—Õö&÷fVEöÖöF–f–6F–öâ#ãÆ–çWB–CÒ"G¶¶W—Õö&÷fVEöÖöF–f–6F–öâ"æÖSÒ"G¶¶W—Õö&÷fVEöÖöF–f–6F–öâ"G—SÒ&6†V6¶&÷‚#â&÷fVBÖöF–f–6F–öãÂöÆ&VÃàÐ¢ÂöF—càÐ¢Âöf–VÆG6WCæ°Ð§ÐÐ Ð¦gVæ7F–öâ–æ—F–Æ—¦T6ö×Æ–æ6Tf÷&Ò‚’°Ð¢6öç7B6öçF–æW"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&6ö×Æ–æ6RÖFöÖ–ç2"“°Ð¢6öçF–æW"æ–ææW$…DÔÂÒ4ôÕÄ”ä4UôDôÔ”å2æÖ†6ö×Æ–æ6TFöÖ–å&÷r’æ¦ö–â‚""“°Ð¢6öçF–æW"çVW'•6VÆV7F÷$ÆÂ‚"æFöÖ–â×FövvÆR"’æf÷$V6‚‚†'WGFöâ’Óâ°Ð¢'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢6öç7BFöÖ–âÒ'WGFöâæFF6WBæFöÖ–åFövvÆS°Ð¢6öç7Bf–VÆG6WBÒ6öçF–æW"çVW'•6VÆV7F÷"†¶FFÖFöÖ–ãÒ"G¶FöÖ–çÒ%Ö“°Ð¢6öç7B6öçFVçBÒf–VÆG6WCòçVW'•6VÆV7F÷"†¶FFÖFöÖ–âÖ6öçFVçCÒ"G¶FöÖ–çÒ%Ö“°Ð¢6öç7BW‡æFVBÒ'WGFöâævWDGG&–'WFR‚&&–ÖW‡æFVB"’ÓÓÒ'G'VR#°Ð¢'WGFöâç6WDGG&–'WFR‚&&–ÖW‡æFVB"Â7G&–ær‚W‡æFVB’“°Ð¢f–VÆG6WCòæ6Æ74Æ—7BçFövvÆR‚&6öÆÆ6VB"ÂW‡æFVB“°Ð¢–b†6öçFVçB’6öçFVçBæ†–FFVâÒW‡æFVC°Ð¢Ò“°Ð¢Ò“°Ð§ÐÐ Ð¦gVæ7F–öâÇ”Ö—76–öä6ö×Æ–æ6TFVfVÇG2†FöÖ–ç2’°¢–b‚F–Ç•7FFRÇÂFöÖ–ç2æÖ—76–öâçF&vWB’&WGW&âFöÖ–ç3°Ð¢6öç7B&VF–æW75&W7VÇBÒWfÇVFT÷W&F–öæÅ&VF–æW72†F–Ç•7FFR“°Ð¢6öç7BÖ—76–öâÒvVæW&FTÖ—76–öâ‡&VF–æW75&W7VÇB“°Ð¢FöÖ–ç2æÖ—76–öâçF&vWBÒG¶Ö—76–öâçF—FÆWÓ¢G¶Ö—76–öâæFWF–ÇÖ°Ð¢FöÖ–ç2æÖ—76–öâç&W7G&–7F–öâÒ&VF–æW75&W7VÇBç&W7G&–7F–öç2æ¦ö–â‚#²"“°Ð¢FöÖ–ç2æÖ—76–öâæ&÷fVDÖöF–f–6F–öâÒ&VF–æW75&W7VÇBç7FFRÓÒ$u$TTâ#°Ð¢&WGW&âFöÖ–ç3°§Ð ¦gVæ7F–öâÇ”76–væVD6ö×Æ–æ6TFVfVÇG2†FöÖ–ç2’°¢–b‚FöÖ–ç3òç7G&VæwF‚’&WGW&âFöÖ–ç3°¢6öç7BF’Ò&VD6öÖÖ—GFVEVæ–f–VDF’‡FöF”•4ôFFR‚’“°¢6öç7B7F—f—F–W2Ò'&’æ—4'&’†F“òæ7F—f—F–W2’òF’æ7F—f—F–W2¢µÓ°¢6öç7B76–væVBÒ†ÖöGVÆR’Óâ7F—f—F–W2æf–ÇFW"‚†—FVÒ’Óâ7G&–ær†—FVÒæÖöGVÆRÇÂ""’çFõWW$66R‚’ÓÓÒÖöGVÆR“°¢6öç7BF&vWBÒ†—FVÒÂfÆÆ&6²’ÓâG¶—FVÓòçF—FÆRÇÂfÆÆ&6·ÒG¶—FVÓòæ76–væÖVçD–BÇÂ—FVÓòæ–Bò+r76–væÖVçBG¶—FVÒæ76–væÖVçD–BÇÂ—FVÒæ–GÖ¢"'Ö°¢6öç7B7G&VæwF„76–væÖVçG2Ò76–væVB‚%5E$TäuD‚"“°¢6öç7B6÷&T76–væÖVçG2Ò76–væVB‚$4õ$R"“°¢6öç7B7G&VæwF„VçG'’Ò7W'&VçDW†V7WF–öäÆVFvW$VçG'’‚'7G&VæwF‚"“°¢–b‚FöÖ–ç2ç7G&VæwF‚çF&vWB’°¢FöÖ–ç2ç7G&VæwF‚çF&vWBÒ²ââç7G&VæwF„76–væÖVçG2æÖ‚†—FVÒ’ÓâF&vWB†—FVÒÂ%7G&VæwF‚6W76–öâ"’’Âââæ6÷&T76–væÖVçG2æÖ‚†—FVÒ’ÓâF&vWB†—FVÒÂ$6÷&R6W76–öâ"’•Òæ¦ö–â‚#²"¢ÇÂ‡7G&VæwF„VçG'“òæ76–væÖVçD–BòG·7G&VæwF„VçG'’æ76–væÖVçCòçF—FÆRÇÂ7G&VæwF„VçG'’æ76–væÖVçCòç6W76–öäæÖRÇÂ%7G&VæwF‚6W76–öâ'Ò+r76–væÖVçBG·7G&VæwF„VçG'’æ76–væÖVçD–GÖ¢""“°¢Ð¢6öç7B'Vææ–ætVçG'’Ò7W'&VçDW†V7WF–öäÆVFvW$VçG'’‚''Vææ–ær"“°¢6öç7B'Vææ–æt76–væÖVçBÒ76–væVB‚%%Tää”är"•³Ó°¢–b†FöÖ–ç2æ6&F–òbbFöÖ–ç2æ6&F–òçF&vWB’°¢FöÖ–ç2æ6&F–òçF&vWBÒ'Vææ–æt76–væÖVçBòF&vWB‡'Vææ–æt76–væÖVçBÂ%'Vâ"’¢'Vææ–ætVçG'“òæ76–væÖVçD–BòG·'Vææ–ætVçG'’æ76–væÖVçCòçF—FÆRÇÂ%'Vâ'Ò+r76–væÖVçBG·'Vææ–ætVçG'’æ76–væÖVçD–GÖ¢"#°¢Ð¢–b†FöÖ–ç2æçWG&—F–öâbbFöÖ–ç2æçWG&—F–öâçF&vWBbbF“òæçWG&—F–öâ’°¢FöÖ–ç2æçWG&—F–öâçF&vWBÒG¶F’æçWG&—F–öâæ6Æ÷&–W2ÇÂ.(	B'Ò¶6Â+rG¶F’æçWG&—F–öâç&÷FV–âÇÂ.(	B'Ör&÷FV–æ°¢Ð¢–b†FöÖ–ç2ç&V6÷fW'’bbFöÖ–ç2ç&V6÷fW'’çF&vWBbbF’’°¢FöÖ–ç2ç&V6÷fW'’çF&vWBÒF’ç&V6÷fW'“òçF—FÆRÇÂF’ç&V6÷fW'•F—FÆRÇÂ†7F—f—F–W2æÆVæwF‚ò$6ö×ÆWFRFöF’w2&V6÷fW'’÷&FW""¢%&V6÷fW'’F’"“°¢Ð¢&WGW&âFöÖ–ç3°§Ð Ð¦gVæ7F–öâ&VD6ö×Æ–æ6Tf÷&Ò‚’°Ð¢6öç7Bf÷&ÒÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&6ö×Æ–æ6RÖf÷&Ò"“°Ð¢6öç7BfÇVW2ÒæWrf÷&ÔFF†f÷&Ò“°Ð¢&WGW&âö&¦V7Bæg&öÔVçG&–W2„4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’Óâ¶¶W’Â°Ð¢7FGW3¢æ÷&ÖÆ—¦T6ö×Æ–æ6U7FGW2‡fÇVW2ævWB†G¶¶W—Õ÷7FGW6’’ÀÐ¢F&vWC¢7G&–ær‡fÇVW2ævWB†G¶¶W—Õ÷F&vWF’ÇÂ""’çG&–Ò‚’ÀÐ¢7GVÃ¢7G&–ær‡fÇVW2ævWB†G¶¶W—Õö7GVÆ’ÇÂ""’çG&–Ò‚’ÀÐ¢æ÷FS¢7G&–ær‡fÇVW2ævWB†G¶¶W—Õöæ÷FV’ÇÂ""’çG&–Ò‚’ÀÐ¢&W7G&–7F–öã¢7G&–ær‡fÇVW2ævWB†G¶¶W—Õ÷&W7G&–7F–öæ’ÇÂ""’çG&–Ò‚’ÀÐ¢&÷fVDÖöF–f–6F–öã¢fÇVW2ævWB†G¶¶W—Õö&÷fVEöÖöF–f–6F–öæ’ÓÓÒ&öâ Ð¢ÕÒ’“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$6ö×Æ–æ6U66÷&R†FöÖ–ç2’°Ð¢6öç7B7FFRÒFW&—fTF–Ç”6ö×Æ–æ6U7FFR†FöÖ–ç2“°Ð¢6WEFW‡B‚&F—66—Æ–æR×66÷&R"Â7FFRæF—7Æ•66÷&R“°Ð¢6WEFW‡B‚&6ö×Æ–æ6R×7FGW2"Â7FFRæ6ö×Æ–æ6U7FGW2“°Ð¢6WEFW‡B‚&6ö×Æ–æ6RÖf÷&×VÆ"Â7FFRæW‡ÆæF–öâæf÷&×VÆ“°Ð¢6WDÆ—7B‚&6ö×Æ–æ6RÖ–æ6ÇVFVB"Â7FFRæW‡ÆæF–öâæ–æ6ÇVFVBÂ$æòFöÖ–ç2–æ6ÇVFVBâ"“°Ð¢6WDÆ—7B‚&6ö×Æ–æ6RÖW†6ÇVFVB"Â7FFRæW‡ÆæF–öâæW†6ÇVFVBÂ$æòFöÖ–ç2W†6ÇVFVBâ"“°Ð§ÐÐ Ð¦gVæ7F–öâWFFT6ö×Æ–æ6U7FGW4ÖW76vR‚’°Ð¢6öç7B6fU7FFRÒFW&—fU6fU7FFR†7W'&VçE6fU7FFR“°Ð¢6öç7B7F÷&vTÆ&VÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&6ö×Æ–æ6R×7F÷&vR"“°Ð¢7F÷&vTÆ&VÂçFW‡D6öçFVçBÒ6fU7FFRæÆ&VÂçFõWW$66R‚“°Ð¢7F÷&vTÆ&VÂæ6Æ74æÖRÒ6ö×Æ–æ6R×7F÷&vRG·6fU7FFRçFöæWÖ°Ð¢6öç7BWFFVDÆ&VÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&6ö×Æ–æ6R×WFFVB"“°Ð¢WFFVDÆ&VÂçFW‡D6öçFVçBÒ7W'&VçE6fU7FFRÓÓÒ&f–ÆVB Ð¢ò%6fRf–ÆVBâ&WG'’v†Vâ6öææV7F–öâ—2f–Æ&ÆRâ Ð¢¢7W'&VçE6fU7FFRÓÓÒ&Æö6ÆÇ’6fVB Ð¢ò%6fVBÆö6ÆÇ’v†–ÆR&VÖ÷FR7–æ2—2Væf–Æ&ÆRâ Ð¢¢7W'&VçE6fU7FFRÓÓÒ'6f–ær Ð¢ò%6f–ær&V6÷&N(
b Ð¢¢7W'&VçE6fU7FFRÓÓÒ'6fVB Ð¢ò%6fVB7V66W76gVÆÇ’â Ð¢¢$æ÷B6fVB–WB#°Ð§ÐÐ Ð¦gVæ7F–öâ6WD6ö×Æ–æ6TF—'G•7FFR†æW‡E7FFRÒçVÆÂ’°Ð¢6öç7Bf÷&ÒÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&6ö×Æ–æ6RÖf÷&Ò"“°Ð¢–b‚f÷&Ò’&WGW&ã°Ð¢6öç7BfÇVW2ÒæW‡E7FFRÇÂ&VD6ö×Æ–æ6Tf÷&Ò‚“°Ð¢6ö×Æ–æ6TF—'G•7FFRÒFW&—fTF—'G•7FFR†6ö×Æ–æ6U&Wf–÷W57FFRÇÂV×G”6ö×Æ–æ6TFöÖ–ç2‚’ÂfÇVW2“°Ð¢6öç7B6fT'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'6fRÖ6ö×Æ–æ6R"“°Ð¢–b‡6fT'WGFöâ’6fT'WGFöâæF—6&ÆVBÒ6ö×Æ–æ6TF—'G•7FFS°Ð¢f÷&ÒæFF6WBæF—'G’Ò6ö×Æ–æ6TF—'G•7FFRò'G'VR"¢&fÇ6R#°Ð§ÐÐ Ð¦gVæ7F–öâ6WD6ö×Æ–æ6TFVfVÇG4g&öÕ7FFR‡&V6÷&B’°¢6öç7BFöÖ–ç2ÒÇ”76–væVD6ö×Æ–æ6TFVfVÇG2†Ç”Ö—76–öä6ö×Æ–æ6TFVfVÇG2†6ö×Æ–æ6TFöÖ–ç4g&öÕ&V6÷&B‡&V6÷&B’’“°¢4ôÕÄ”ä4UôDôÔ”å2æf÷$V6‚‚†¶W’’Óâ°Ð¢6öç7Bf–VÆG6WBÒFö7VÖVçBçVW'•6VÆV7F÷"†¶FFÖFöÖ–ãÒ"G¶¶W—Ò%Ö“°Ð¢–b†f–VÆG6WB’f–VÆG6WBæ6Æ74Æ—7BçFövvÆR‚&6öÆÆ6VB"ÂfÇ6R“°Ð¢Ò“°Ð¢&WGW&âFöÖ–ç3°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$6ö×Æ–æ6U&V6÷&B‡&V6÷&BÂ7F÷&vTÖöFRÒ%5U$4R"’°Ð¢6öç7BFöÖ–ç2Ò6WD6ö×Æ–æ6TFVfVÇG4g&öÕ7FFR‡&V6÷&B“°Ð¢4ôÕÄ”ä4UôDôÔ”å2æf÷$V6‚‚†¶W’’Óâ°Ð¢6öç7BFöÖ–âÒFöÖ–ç5¶¶W•Ó°Ð¢6öç7Bf÷&ÒÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&6ö×Æ–æ6RÖf÷&Ò"“°Ð¢f÷&ÒæVÆVÖVçG5¶G¶¶W—Õ÷7FGW6ÒçfÇVRÒFöÖ–âç7FGW2ÇÂ"#°Ð¢f÷&ÒæVÆVÖVçG5¶G¶¶W—Õ÷F&vWFÒçfÇVRÒFöÖ–âçF&vWC°Ð¢f÷&ÒæVÆVÖVçG5¶G¶¶W—Õö7GVÆÒçfÇVRÒFöÖ–âæ7GVÃ°Ð¢f÷&ÒæVÆVÖVçG5¶G¶¶W—Õöæ÷FVÒçfÇVRÒFöÖ–âææ÷FS°Ð¢f÷&ÒæVÆVÖVçG5¶G¶¶W—Õ÷&W7G&–7F–öæÒçfÇVRÒFöÖ–âç&W7G&–7F–öã°Ð¢f÷&ÒæVÆVÖVçG5¶G¶¶W—Õö&÷fVEöÖöF–f–6F–öæÒæ6†V6¶VBÒFöÖ–âæ&÷fVDÖöF–f–6F–öã°Ð¢Ò“°Ð¢6ö×Æ–æ6U&Wf–÷W57FFRÒ&VD6ö×Æ–æ6Tf÷&Ò‚“°Ð¢6WD6ö×Æ–æ6TF—'G•7FFR†6ö×Æ–æ6U&Wf–÷W57FFR“°Ð¢6WEFW‡B‚&6ö×Æ–æ6RÖFFR"Â&V6÷&Còæ6ö×Æ–æ6UöFFRÇÂFöF”•4ôFFR‚’“°Ð¢&VæFW$6ö×Æ–æ6U66÷&R†FöÖ–ç2“°Ð¢7W'&VçE6fU7FFRÒ7F÷&vTÖöFRÓÓÒ$Äô4Â"ò&Æö6ÆÇ’6fVB"¢'6fVB#°Ð¢WFFT6ö×Æ–æ6U7FGW4ÖW76vR‚“°Ð¢Æ7E6fVD6ö×Æ–æ6U7FFRÒ7G'V7GW&VD6ÆöæR†6ö×Æ–æ6U&Wf–÷W57FFR“°Ð¢&VæFW%7FæF&G56V7F–öâ‚“°Ð§ÐÐ Ð¦gVæ7F–öâ6ö×Æ–æ6U7F÷&vT¶W’‚’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã¦F–Ç’Ö6ö×Æ–æ6S¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ó¢G·FöF”•4ôFFR‚—Ö°Ð§ÐÐ Ð¦gVæ7F–öâÆöDÆö6Ä6ö×Æ–æ6R‚’°Ð¢G'’°Ð¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ†6ö×Æ–æ6U7F÷&vT¶W’‚’“°Ð¢&WGW&â7F÷&VBò¥4ôâç'6R‡7F÷&VB’¢çVÆÃ°Ð¢Ò6F6‚…ò’°Ð¢&WGW&âçVÆÃ°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6fTÆö6Ä6ö×Æ–æ6R‡&V6÷&B’°Ð¢G'’°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ†6ö×Æ–æ6U7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’‡&V6÷&B’“°Ð¢&WGW&âG'VS°Ð¢Ò6F6‚…ò’°Ð¢&WGW&âfÇ6S°Ð¢ÐÐ§ÐÐ Ð¦7–æ2gVæ7F–öâÆöDF–Ç”6ö×Æ–æ6R‚’°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B²FFÂW'&÷"ÒÒv—B7W&6PÐ¢æg&öÒ‚&F–Ç•ö6ö×Æ–æ6R"Ð¢ç6VÆV7B„4ôÕÄ”ä4Uô4ôÅTÔå2Ð¢æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–BÐ¢æW‚&6ö×Æ–æ6UöFFR"ÂFöF”•4ôFFR‚’Ð¢æÖ–&U6–ævÆR‚“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð¢F–Ç”6ö×Æ–æ6RÒFF°Ð¢&VæFW$6ö×Æ–æ6U&V6÷&B†F–Ç”6ö×Æ–æ6RÂ%5U$4R"“°Ð¢G'’°Ð¢6öç7B&VÖ÷FU7FæF&G2Òv—BÆöE7FæF&G5&Wf–Wu7FFTg&öÕ7W&6R‚“°Ð¢7FæF&G5&Wf–Wu7FFRÒ&VÖ÷FU7FæF&G2æÖ‚†—FVÒ’Óâæ÷&ÖÆ—¦U&VÖ÷FU7FæF&G4—FVÒ†—FVÒ’“°Ð¢6fU7FæF&G5&Wf–Wu7FFR‡7FæF&G5&Wf–Wu7FFR“°Ð¢6fU7FæF&G4VF—DWfVçG2…µÒ“°Ð¢Ò6F6‚…ò’°Ð¢òòæò&VÖ÷FR7FæF&G27FFRf–Æ&ÆS²fÆÂ&6²FòÆö6Â7FFRàÐ¢ÐÐ¢Ò6F6‚…ò’°Ð¢F–Ç”6ö×Æ–æ6RÒÆöDÆö6Ä6ö×Æ–æ6R‚“°Ð¢&VæFW$6ö×Æ–æ6U&V6÷&B†F–Ç”6ö×Æ–æ6RÂ$Äô4Â"“°Ð¢7FæF&G5&Wf–Wu7FFRÒÆöE7FæF&G5&Wf–Wu7FFR‚“°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6ö×Æ–æ6U–ÆöB†FöÖ–ç2’°Ð¢6öç7B7FFRÒFW&—fTF–Ç”6ö×Æ–æ6U7FFR†FöÖ–ç2“°Ð¢6öç7B–ÆöBÒ°Ð¢W6W%ö–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÀÐ¢6ö×Æ–æ6UöFFS¢FöF”•4ôFFR‚’ÀÐ¢F—66—Æ–æU÷66÷&S¢7FFRç66÷&RÀÐ¢66÷&UöWf–FVæ6S¢²Wf–FVæ6S¢7FFRæWf–FVæ6RÂW‡ÆæF–öã¢7FFRæW‡ÆæF–öâÂ6ö×Æ–æ6U7FGW3¢7FFRæ6ö×Æ–æ6U7FGW2ÐÐ¢Ó°Ð¢4ôÕÄ”ä4UôDôÔ”å2æf÷$V6‚‚†¶W’’Óâ°Ð¢–ÆöE¶G¶¶W—Õ÷7FGW6ÒÒFöÖ–ç5¶¶W•Òç7FGW3°Ð¢–ÆöE¶G¶¶W—Õ÷F&vWFÒÒFöÖ–ç5¶¶W•ÒçF&vWBÇÂçVÆÃ°Ð¢–ÆöE¶G¶¶W—Õö7GVÆÒÒFöÖ–ç5¶¶W•Òæ7GVÂÇÂçVÆÃ°Ð¢–ÆöE¶G¶¶W—Õöæ÷FVÒÒFöÖ–ç5¶¶W•Òææ÷FRÇÂçVÆÃ°Ð¢–ÆöE¶G¶¶W—Õ÷&W7G&–7F–öæÒÒFöÖ–ç5¶¶W•Òç&W7G&–7F–öâÇÂçVÆÃ°Ð¢–ÆöE¶G¶¶W—Õö&÷fVEöÖöF–f–6F–öæÒÒFöÖ–ç5¶¶W•Òæ&÷fVDÖöF–f–6F–öã°Ð¢Ò“°Ð¢&WGW&â–ÆöC°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ6fTF–Ç”6ö×Æ–æ6R†WfVçB’°Ð¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7B'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'6fRÖ6ö×Æ–æ6R"“°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢'WGFöâçFW‡D6öçFVçBÒ%6f–æ~(
b#°Ð¢7W'&VçE6fU7FFRÒ'6f–ær#°Ð¢WFFT6ö×Æ–æ6U7FGW4ÖW76vR‚“°Ð¢6öç7B–ÆöBÒ6ö×Æ–æ6U–ÆöB‡&VD6ö×Æ–æ6Tf÷&Ò‚’“°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B²FFÂW'&÷"ÒÒv—B7W&6PÐ¢æg&öÒ‚&F–Ç•ö6ö×Æ–æ6R"Ð¢çW6W'B‡–ÆöBÂ²öä6öæfÆ–7C¢'W6W%ö–BÆ6ö×Æ–æ6UöFFR"ÒÐ¢ç6VÆV7B„4ôÕÄ”ä4Uô4ôÅTÔå2Ð¢ç6–ævÆR‚“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð¢F–Ç”6ö×Æ–æ6RÒFF°Ð¢7W'&VçE6fU7FFRÒ'6fVB#°Ð¢&VæFW$6ö×Æ–æ6U&V6÷&B†FFÂ%5U$4R"“°Ð¢G'’°Ð¢v—B6fU7FæF&G5&Wf–Wu7FFUFõ7W&6R‡7FæF&G5&Wf–Wu7FFR“°Ð¢Ò6F6‚…ò’°Ð¢òò–væ÷&R&VÖ÷FR7FæF&G2W'6—7FVæ6Rf–ÇW&RæB6öçF–çVRv—F‚Æö6ÂfÆÆ&6²àÐ¢ÐÐ¢Ò6F6‚…ò’°Ð¢6öç7BÆö6Å&V6÷&BÒ²ââç–ÆöBÂWFFVEöC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ó°Ð¢F–Ç”6ö×Æ–æ6RÒÆö6Å&V6÷&C°Ð¢6öç7B6fVBÒ6fTÆö6Ä6ö×Æ–æ6R†Æö6Å&V6÷&B“°Ð¢7W'&VçE6fU7FFRÒ6fVBò&Æö6ÆÇ’6fVB"¢&f–ÆVB#°Ð¢&VæFW$6ö×Æ–æ6U&V6÷&B†Æö6Å&V6÷&BÂ$Äô4Â"“°Ð¢–b‚6fVB’6WEFW‡B‚&6ö×Æ–æ6R×7F÷&vR"Â%Tå4dTB(	BÆö6Â7F÷&vRVæf–Æ&ÆR"“°Ð¢Òf–æÆÇ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢'WGFöâçFW‡D6öçFVçBÒ%6fRF–Ç’&V6÷&B#°Ð¢WFFT6ö×Æ–æ6U7FGW4ÖW76vR‚“°Ð¢ÐÐ¢v—BÆöEG&VæG4æÇ—F–72‚“°Ð¢6öç7B6VÆV7FVEvVV²ÒvWD–ç7V7F–öåvVVµ&ævR†Fö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖFFR"“òçfÇVRÇÂFöF”•4ôFFR‚’“°Ð¢–b‡FöF”•4ôFFR‚’ãÒ6VÆV7FVEvVV²çvVVµ7F'DFFRbbFöF”•4ôFFR‚’ÃÒ6VÆV7FVEvVV²çvVV´VæDFFR’°Ð¢v—BÆöEvVV¶Ç”–ç7V7F–öâ‚“°Ð¢ÐÐ¢&VæFW$F–Ç”6ö6†–ætÆö÷‚“°Ð§ÐÐ Ð¦gVæ7F–öâvVV¶Ç”–ç7V7F–öå7F÷&vT¶W’‡vVVµ7F'DFFR’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§vVV¶Ç’Ö–ç7V7F–öã¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ó¢G·vVVµ7F'DFFWÖ°Ð§ÐÐ Ð¦gVæ7F–öâÆöDÆö6ÅvVV¶Ç”–ç7V7F–öâ‡vVVµ7F'DFFR’°Ð¢G'’°Ð¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡vVV¶Ç”–ç7V7F–öå7F÷&vT¶W’‡vVVµ7F'DFFR’“°Ð¢&WGW&â7F÷&VBò¥4ôâç'6R‡7F÷&VB’¢çVÆÃ°Ð¢Ò6F6‚…ò’°Ð¢&WGW&âçVÆÃ°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6fTÆö6ÅvVV¶Ç”–ç7V7F–öâ‡&V6÷&B’°Ð¢G'’°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡vVV¶Ç”–ç7V7F–öå7F÷&vT¶W’‡&V6÷&BçvVVµ÷7F'EöFFR’Â¥4ôâç7G&–æv–g’‡&V6÷&B’“°Ð¢&WGW&âG'VS°Ð¢Ò6F6‚…ò’°Ð¢&WGW&âfÇ6S°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâvVV¶Ç•Æå7F÷&vT¶W’†æW‡EvVVµ7F'B’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§vVV¶Ç’×Æã¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ó¢G¶æW‡EvVVµ7F'BÇÂ'VæF–ær'Ö°Ð§ÐÐ Ð¦gVæ7F–öâÆöD&÷fVEvVV¶Ç•Æâ†æW‡EvVVµ7F'B’°Ð¢G'’²&WGW&â¥4ôâç'6R‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡vVV¶Ç•Æå7F÷&vT¶W’†æW‡EvVVµ7F'B’’ÇÂ&çVÆÂ"“²ÐÐ¢6F6‚…ò’²&WGW&âçVÆÃ²ÐÐ§ÐÐ Ð¦gVæ7F–öâ&VæFW%vVV¶Ç•Æâ†–ç7V7F–öâÒvVV¶Ç”–ç7V7F–öâ’°Ð¢6öç7B÷WGWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’×ÆâÖ÷WGWB"“°Ð¢6öç7B7FGW2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’×Æâ×7FGW2"“°Ð¢–b‚÷WGWBÇÂ7FGW2ÇÂG—VöbFöÖ–æ–öåvVV¶Ç•ÆâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7BÆâÒFöÖ–æ–öåvVV¶Ç•Æâæ'V–ÆEvVV¶Ç•Æâ†–ç7V7F–öâ“°Ð¢6öç7B&÷fVBÒÆâææW‡EvVVµ7F'BòÆöD&÷fVEvVV¶Ç•Æâ‡ÆâææW‡EvVVµ7F'B’¢çVÆÃ°Ð¢6öç7B7W'&VçBÒ&÷fVBÇÂÆã°Ð¢7FGW2çFW‡D6öçFVçBÒ7W'&VçBç7FGW3°Ð¢7FGW2æ6Æ74æÖRÒ7FFR×–ÆÂG¶7W'&VçBç7FGW2ÓÓÒ$$õdTB"ò&w&VVâ"¢7W'&VçBç7FGW2ÓÓÒ%$TE’dõ"$õdÂ"ò'–VÆÆ÷r"¢&æWWG&Â'Ö°Ð¢–b‚7W'&VçBæF—3òæÆVæwF‚’°Ð¢÷WGWBæ6Æ74æÖRÒ'W&f÷&Öæ6RÖV×G’#°Ð¢÷WGWBçFW‡D6öçFVçBÒ7W'&VçBç&V6öã°Ð¢&WGW&ã°Ð¢ÐÐ¢÷WGWBæ6Æ74æÖRÒ"#°Ð¢6öç7BF—2Ò7W'&VçBæF—2æÖ‚†F’’ÓâÆ'F–6ÆR6Æ73Ò'vVV¶Ç’×ÆâÖF’#ãÇ7ãâG¶W66T‡FÖÂ†F’æF’—Ò+rG¶W66T‡FÖÂ†F’æFFR—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†F’æfö7W2—ÓÂ÷7G&öæsãÇâG¶W66T‡FÖÂ†F’æ–ç7G'V7F–öâ—ÓÂ÷ãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð¢÷WGWBæ–ææW$…DÔÂÒÆF—b6Æ73Ò'vVV¶Ç’×ÆâÖ†VFW"#àÐ¢ÆF—cãÇ7ãäæW‡BvVV³Â÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†7W'&VçBææW‡EvVVµ7F'B—Ò(	BG¶W66T‡FÖÂ†7W'&VçBææW‡EvVV´VæB—ÓÂ÷7G&öæsãÂöF—càÐ¢ÆF—cãÇ7ãå&–÷&—G“Â÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†7W'&VçBæfö7W2—ÓÂ÷7G&öæsãÂöF—càÐ¢ÆF—cãÇ7ãå6÷W&6RF—66—Æ–æSÂ÷7ããÇ7G&öæsâG¶f÷&ÖDF—66—Æ–æU66÷&R†7W'&VçBæF—66—Æ–æU66÷&R—ÓÂ÷7G&öæsãÂöF—càÐ¢ÆF—cãÇ7ãå6÷W&6RWf–FVæ6SÂ÷7ããÇ7G&öæsâG´ÖF‚ç&÷VæB†7W'&VçBæWf–FVæ6T6÷fW&vR—ÒSÂ÷7G&öæsãÂöF—càÐ¢ÂöF—càÐ¢ÇãÇ7G&öæsäFÆ2&–÷&—G“£Â÷7G&öæsâG¶W66T‡FÖÂ†7W'&VçBç&–÷&—G’çFW‡B—ÓÂ÷àÐ¢ÆF—b6Æ73Ò'vVV¶Ç’×ÆâÖF—2#âG¶F—7ÓÂöF—càÐ¢ÇVÂ6Æ73Ò&&6VÆ–æR×6fVwV&G2#âG¶7W'&VçBæwV&G&–Ç2æÖ‚†—FVÒ’ÓâÆÆ“âG¶W66T‡FÖÂ†—FVÒ—ÓÂöÆ“æ’æ¦ö–â‚""—ÓÂ÷VÃàÐ¢ÆF—b6Æ73Ò'vVV¶Ç’×ÆâÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×vVV¶Ç’×ÆâÖ7F–öãÒ&&÷fR"G¶7W'&VçBç7FGW2ÓÓÒ$$õdTB"ò&F—6&ÆVB"¢"'ÓâG¶7W'&VçBç7FGW2ÓÓÒ$$õdTB"ò%Æâ&÷fVB"¢$&÷fRæW‡BvVV¾(	—2Æâ'ÓÂö'WGFöããÂöF—cæ°Ð§ÐÐ Ð¦gVæ7F–öâ&÷fT7W'&VçEvVV¶Ç•Æâ‚’°Ð¢–b‚vVV¶Ç”–ç7V7F–öâÇÂG—VöbFöÖ–æ–öåvVV¶Ç•ÆâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢G'’°Ð¢6öç7BÆâÒFöÖ–æ–öåvVV¶Ç•Æâæ'V–ÆEvVV¶Ç•Æâ‡vVV¶Ç”–ç7V7F–öâ“°Ð¢6öç7B&÷fVBÒFöÖ–æ–öåvVV¶Ç•Æâæ&÷fUvVV¶Ç•Æâ‡Æâ“°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡vVV¶Ç•Æå7F÷&vT¶W’†&÷fVBææW‡EvVVµ7F'B’Â¥4ôâç7G&–æv–g’†&÷fVB’“°Ð¢&VæFW%vVV¶Ç•Æâ‡vVV¶Ç”–ç7V7F–öâ“°Ð¢6WEFW‡B‚'vVV¶Ç’×ÆâÖfVVF&6²"Â%Æâ&÷fVBâF–Ç’&VF–æW72æB–â'VÆW27F–ÆÂv÷fW&âV6‚F’â"“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'vVV¶Ç’×ÆâÖfVVF&6²"ÂW'&÷"æÖW76vR“°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâÆöDÆö6ÅvVVµ&V6÷&G2‡&ævR’°Ð¢6öç7B&V6÷&G2ÒµÓ°Ð¢G'’°Ð¢f÷"†ÆWBöfg6WBÒ²öfg6WBÂs²öfg6WB³Ò’°Ð¢6öç7BFFRÒf÷&ÖD•4ôFFUUD2†FEUD4F—2‡'6T•4ôFFUUD2‡&ævRçvVVµ7F'DFFR’Âöfg6WB’“°Ð¢6öç7B¶W’Ò6ö6‚ÖFöÖ–æ–öã¦F–Ç’Ö6ö×Æ–æ6S¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ó¢G¶FFWÖ°Ð¢6öç7B7F÷&VBÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ†¶W’“°Ð¢–b‡7F÷&VB’&V6÷&G2çW6‚„¥4ôâç'6R‡7F÷&VB’“°Ð¢ÐÐ¢Ò6F6‚…ò’°Ð¢&WGW&â&V6÷&G3°Ð¢ÐÐ¢&WGW&â&V6÷&G3°Ð§ÐÐ Ð¦gVæ7F–öâ&W6öÇfUvVV¶Ç”–ç7V7F–öäÆöD÷WF6öÖR†–çWBÒ·Ò’°Ð¢–b†–çWBç6fVD–ç7V7F–öãòæf–æÆ—¦VEöBbb–çWBæ–ç7V7F–öå&VDW'&÷"’°Ð¢&WGW&â²ÖöFS¢$d”äÄ•¤TEõ$TÔõDR"Â7F÷&vTÖöFS¢%5U$4R"Â–ç7V7F–öã¢–çWBç6fVD–ç7V7F–öâÂ&V6÷&G3¢µÒÂv&æ–æs¢""Ó°Ð¢ÐÐ¢–b‚–çWBç&V6÷&G5&VDW'&÷"bb'&’æ—4'&’†–çWBç&VÖ÷FU&V6÷&G2’’°Ð¢6öç7Bv&æ–æw2ÒµÓ°Ð¢–b†–çWBæ–ç7V7F–öå&VDW'&÷"’v&æ–æw2çW6‚†vVV¶Ç’6æ6†÷B7F÷&vR—2Væf–Æ&ÆR‚G¶–çWBæ–ç7V7F–öå&VDW'&÷"æÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’æ“°Ð¢–b†–çWBæG&gEw&—FTW'&÷"’v&æ–æw2çW6‚†F†RÆ—fR–ç7V7F–öâv26Æ7VÆFVBÂ'WB—G2G&gB6æ6†÷Bv2æ÷B6fVB‚G¶–çWBæG&gEw&—FTW'&÷"æÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’æ“°Ð¢&WGW&â²ÖöFS¢%$TÔõDUõ$T4õ$E2"Â7F÷&vTÖöFS¢%5U$4R"Â–ç7V7F–öã¢çVÆÂÂ&V6÷&G3¢–çWBç&VÖ÷FU&V6÷&G2Âv&æ–æs¢v&æ–æw2æ¦ö–â‚""’Ó°Ð¢ÐÐ¢–b†–çWBç6fVD–ç7V7F–öãòæf–æÆ—¦VEöB’°Ð¢&WGW&â²ÖöFS¢$d”äÄ•¤TEôÄô4Â"Â7F÷&vTÖöFS¢$Äô4Â"Â–ç7V7F–öã¢–çWBç6fVD–ç7V7F–öâÂ&V6÷&G3¢µÒÂv&æ–æs¢%&VÖ÷FRvVV¶Ç’FF—2Væf–Æ&ÆRâ6†÷v–ærF†Rf–æÆ—¦VBÆö6Â6æ6†÷Bâ"Ó°Ð¢ÐÐ¢6öç7BÆö6Å&V6÷&G2Ò'&’æ—4'&’†–çWBæÆö6Å&V6÷&G2’ò–çWBæÆö6Å&V6÷&G2¢µÓ°Ð¢&WGW&â°Ð¢ÖöFS¢$Äô4Åõ$T4õ$E2"ÀÐ¢7F÷&vTÖöFS¢$Äô4Â"ÀÐ¢–ç7V7F–öã¢çVÆÂÀÐ¢&V6÷&G3¢Æö6Å&V6÷&G2ÀÐ¢v&æ–æs¢Æö6Å&V6÷&G2æÆVæwF€Ð¢ò66÷VçBF–Ç’&V6÷&G26÷VÆBæ÷B&RÆöFVB‚G¶–çWBç&V6÷&G5&VDW'&÷#òæÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’â6†÷v–ærF†R6fVBFWf–6R6÷’æ Ð¢¢66÷VçBF–Ç’&V6÷&G26÷VÆBæ÷B&RÆöFVB‚G¶–çWBç&V6÷&G5&VDW'&÷#òæÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’âæò6fVBFWf–6R6÷’v2f÷VæBæ Ð¢Ó°Ð§ÐÐ Ð¦gVæ7F–öâvVV¶Ç•W'6—7FVæ6U–ÆöB†vw&VvFRÂf–æÆ—¦VDBÒçVÆÂ’°Ð¢6öç7B&W÷'BÒvw&VvFRæFÆ5&W÷'BÇÂvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR“°Ð¢&WGW&â°Ð¢W6W%ö–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÀÐ¢vVVµ÷7F'EöFFS¢vw&VvFRçvVVµ7F'DFFRÀÐ¢vVVµöVæEöFFS¢vw&VvFRçvVV´VæDFFRÀÐ¢–ç7V7F–öå÷7FGW3¢f–æÆ—¦VDBò&–ç7V7F–öåö6ö×ÆWFR"¢vw&VvFRæ–ç7V7F–öå7FGW2çFôÆ÷vW$66R‚’ç&WÆ6TÆÂ‚""Â%ò"’ÀÐ¢vVV¶Ç•öF—66—Æ–æU÷66÷&S¢vw&VvFRç66÷&RÀÐ¢Wf–FVæ6Uö6÷fW&vS¢vw&VvFRæWf–FVæ6T6÷fW&vRÀÐ¢FöÖ–å÷66÷&W3¢vw&VvFRæFöÖ–å66÷&W2ÀÐ¢vw&VvFUö6÷VçG3¢vw&VvFRæ6÷VçG2ÀÐ¢7G&öævW7EöFöÖ–ã¢vw&VvFRç7G&öævW7DFöÖ–âÀÐ¢vV¶W7EöFöÖ–ã¢vw&VvFRçvV¶W7DFöÖ–âÀÐ¢æW‡E÷vVVµ÷&–÷&—G“¢vw&VvFRææW‡EvVVµ&–÷&—G’ÀÐ¢&W÷'EöWf–FVæ6S¢vw&VvFRÀÐ¢FÆ5÷&W÷'C¢&W÷'BÀÐ¢f–æÆ—¦VEöC¢f–æÆ—¦VD@Ð¢Ó°Ð§ÐÐ Ð¦gVæ7F–öâvw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ‡&V6÷&B’°Ð¢–b‚&V6÷&Còç&W÷'EöWf–FVæ6R’&WGW&âçVÆÃ°Ð¢6öç7Bvw&VvFRÒ7G'V7GW&VD6ÆöæR‡&V6÷&Bç&W÷'EöWf–FVæ6R“°Ð¢vw&VvFRæf–æÆ—¦VDBÒ&V6÷&Bæf–æÆ—¦VEöBÇÂvw&VvFRæf–æÆ—¦VDC°Ð¢vw&VvFRæ–ç7V7F–öå7FGW2Ò&V6÷&Bæf–æÆ—¦VEöBò$”å5T5D”ôâ4ôÕÄUDR"¢vw&VvFRæ–ç7V7F–öå7FGW3°Ð¢vw&VvFRæFÆ5&W÷'BÒ&V6÷&BæFÆ5÷&W÷'BÇÂvw&VvFRæFÆ5&W÷'BÇÂvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR“°Ð¢&WGW&âvw&VvFS°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%vVV¶Ç”§VFvÖVçB†vw&VvFRÂ7F÷&vTÖöFR’°¢vVV¶Ç”–ç7V7F–öâÒvw&VvFS°¢vVV¶Ç”–ç7V7F–öå7F÷&vTÖöFRÒ7F÷&vTÖöFS°¢–b‚vw&VvFRÇÂG—VöbFöÖ–æ–öåvVV¶Ç”Gfæ6VÖVçBÓÓÒ'VæFVf–æVB"’&WGW&ã°¢6öç7B&ööevVV²Ò'V–ÆE&V7'V—E&ööevVV´f÷$–ç7V7F–öâ†vw&VvFR“°¢&VæFW%&V7'V—E&ööevVV²‡&ööevVV²Â²'&V7'V—B×&ööb×vVV²×&Wf–Wr%Ò“°¢6öç7BWf–FVæ6U7VÖÖ'’ÒG—VöbFöÖ–æ–öäF–Ç”FV6—6–öä–çFVw&—G’ÓÒ'VæFVf–æVB Ð¢òFöÖ–æ–öäF–Ç”FV6—6–öä–çFVw&—G’ç&Wf–Wu7VÖÖ'’†vw&VvFRÐ¢¢°Ð¢VÆ6VDF—3¢çVÖ&W"†vw&VvFRæVÆ6VDF”6÷VçBÇÂ’ÀÐ¢76W76VDF—3¢çVÖ&W"†vw&VvFRæ6÷VçG3òæ76W76VDF—2ÇÂ’ÀÐ¢Vç66÷&VDF—3¢çVÖ&W"†vw&VvFRæ6÷VçG3òçVç66÷&VDF—2ÇÂ’ÀÐ¢6÷fW&vS¢ÖF‚ç&÷VæB„çVÖ&W"†vw&VvFRæWf–FVæ6T6÷fW&vRÇÂ’’ÀÐ¢66÷&UFW‡C¢f÷&ÖDF—66—Æ–æU66÷&R†vw&VvFRç66÷&R’ÀÐ¢F†–äWf–FVæ6S¢&ööÆVâ†vw&VvFRç66÷&T—5&÷f—6–öæÂÐ¢Ó°Ð¢6öç7Bf–æÆ—¦VBÒ&ööÆVâ†vw&VvFRæf–æÆ—¦VDB“°Ð¢6öç7B7W'&VçE&æ²Ò&æµ7FGW2æ7W'&VçE&æ²ÇÂ%$T5%T•B#°Ð¢6öç7BæW‡E&æ²ÒvWDæW‡E&æ´FVf–æ—F–öâ†7W'&VçE&æ²“°Ð¢6öç7B&öÖ÷F–öä–çWBÒ'V–ÆD6æöæ–6Å&öÖ÷F–öä–çWB†7W'&VçE&æ²ÂæW‡E&æ³òæ6öFRÇÂ$4DUB"“°Ð¢6öç7BVÆ–v–&–Æ—G’ÒWfÇVFU&öÖ÷F–öäVÆ–v–&–Æ—G’‡&öÖ÷F–öä–çWBÂæW‡E&æ³òæ6öFRÇÂ$4DUB"“°Ð¢6öç7B§VFvÖVçBÒFöÖ–æ–öåvVV¶Ç”Gfæ6VÖVçBæ'V–ÆEvVV¶Ç”§VFvÖVçB‡²–ç7V7F–öã¢vw&VvFRÂVÆ–v–&–Æ—G’Â7FæF&G3¢7FæF&G5&Wf–Wu7FFRÂ7W'&VçE&æ²ÂæW‡E&æ³¢æW‡E&æ³òæF—7Æ”æÖRÇÂçVÆÂÒ“°Ð¢6WEFW‡B‚'vVV¶Ç’×7FGW2"Â§VFvÖVçBç7FFRç&WÆ6TÆÂ‚%ò"Â""’“°Ð¢6WEFW‡B‚'vVV¶Ç’×&ævR"ÂG¶vw&VvFRçvVVµ7F'DFFWÒ(	BG¶vw&VvFRçvVV´VæDFFWÖ“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö§VFvÖVçBÖ†VFÆ–æR"Â§VFvÖVçBæ†VFÆ–æR“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö§VFvÖVçBÖFWF–Â"Â§VFvÖVçBæFWF–Â“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö§VFvÖVçB×7FFR"Â§VFvÖVçBç7FFRç&WÆ6TÆÂ‚%ò"Â""’“°Ð¢6WEFW‡B‚'vVV¶Ç’×66÷&R"ÂWf–FVæ6U7VÖÖ'’ç66÷&UFW‡B“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö6÷fW&vR"ÂWf–FVæ6U7VÖÖ'’æ†VFÆ–æRÇÂG¶Wf–FVæ6U7VÖÖ'’æ6÷fW&vWÒV“°Ð¢6WEFW‡B‚'vVV¶Ç’×7F÷&vR"Â7F÷&vTÖöFRÓÓÒ%5U$4R"ò$44õTåB"¢%D„•2DUd”4R"“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖWf–FVæ6R×F‡&÷Vv‚"Âvw&VvFRæWf–FVæ6UF‡&÷Vv„FFRÇÂ$æ÷B7F'FVB"“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö76W76VBÖF—2"ÂG¶Wf–FVæ6U7VÖÖ'’æ76W76VDF—7ÒöbG¶Wf–FVæ6U7VÖÖ'’æVÆ6VDF—7ÒVÆ6VF“°Ð¢6WEFW‡B‚'vVV¶Ç’×Vç66÷&VBÖF—2"ÂWf–FVæ6U7VÖÖ'’çVç66÷&VDF—2“°Ð¢6WEFW‡B‚'vVV¶Ç’×&W7VÇBÖ6÷VçG2"ÂG¶vw&VvFRæ6÷VçG3òæ6ö×ÆWFVBÇÂÒòG¶vw&VvFRæ6÷VçG3òç'F–ÂÇÂÒòG¶vw&VvFRæ6÷VçG3òæÖ—76VBÇÂÖ“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖW†6ÇVFVBÖ6÷VçG2"ÂG¶vw&VvFRæ6÷VçG3òæW†7W6VBÇÂÒòG¶vw&VvFRæ6÷VçG3òææ÷DÆ–6&ÆRÇÂÖ“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖÖöF–f–6F–öâÖ6÷VçB"Âvw&VvFRæ6÷VçG3òæ&÷fVDÖöF–f–6F–öç2ÇÂ“°Ð¢6WEFW‡B‚'vVV¶Ç’×&ö¦V7FVBÖ6÷fW&vR"ÂG´ÖF‚ç&÷VæB†vw&VvFRç&ö¦V7FVDgVÆÅvVV´6÷fW&vRÇÂ—ÒV“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö6Æ7VÆF–öâÖÖWF"ÂG¶vw&VvFRæ6Æ7VÆF–öåfW'6–öâÇÂ”å5T5D”ôåô4Ä5TÄD”ôåõdU%4”ôçÒ+rG¶Wf–FVæ6U7VÖÖ'’æVÆ6VDF—7ÒórF—2VÆ6VF“°Ð¢6WEFW‡B‚'vVV¶Ç’×7G&öævW7B"ÂWf–FVæ6U7VÖÖ'’çF†–äWf–FVæ6Rò$†–FFVâVçF–ÂWf–FVæ6R—27Vff–6–VçB"¢†vw&VvFRç7G&öævW7DFöÖ–ç2ÇÂµÒ’æÖ‚†¶W’’Óâ4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•ÒÇÂ¶W’’æ¦ö–â‚"ò"’ÇÂ%Tå44õ$TB"“°Ð¢6WEFW‡B‚'vVV¶Ç’×vV¶W7B"ÂWf–FVæ6U7VÖÖ'’çF†–äWf–FVæ6Rò$†–FFVâVçF–ÂWf–FVæ6R—27Vff–6–VçB"¢†vw&VvFRçvV¶W7DFöÖ–ç2ÇÂµÒ’æÖ‚†¶W’’Óâ4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•ÒÇÂ¶W’’æ¦ö–â‚"ò"’ÇÂ%Tå44õ$TB"“°Ð¢6öç7B7FGW2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’×7FGW2"“°Ð¢–b‡7FGW2’7FGW2æ6Æ74æÖRÒ7FFR×–ÆÂG¶§VFvÖVçBç7FFRÓÓÒ$T$äTB"ò&w&VVâ"¢§VFvÖVçBç7FFRÓÓÒ$äõEôT$äTB"ò'&VB"¢²$”ä4ôÕÄUDR"Â%$TE’%Òæ–æ6ÇVFW2†§VFvÖVçBç7FFR’ò'–VÆÆ÷r"¢&æWWG&Â'Ö°Ð¢6öç7BfW&F–7BÒFö7VÖVçBçVW'•6VÆV7F÷"‚"çvVV¶Ç’×fW&F–7B"“°Ð¢–b‡fW&F–7B’°Ð¢fW&F–7BæFF6WBæ§VFvÖVçBÒ§VFvÖVçBç7FFS°Ð¢fW&F–7BæFF6WBæWf–FVæ6U7G&VæwF‚ÒWf–FVæ6U7VÖÖ'’çF†–äWf–FVæ6Rò%D„”â"¢%5Uõ%DTB#°Ð¢ÐÐ¢6öç7B&ööd'”–BÒö&¦V7Bæg&öÔVçG&–W2†§VFvÖVçBç&ööbæÖ‚†—FVÒ’Óâ¶—FVÒæ–BÂ—FVÕÒ’“°Ð¢6öç7BW†V7WF–öâÒ&ööd'”–BäU„T5UD”ôã°Ð¢6öç7BWf–FVæ6RÒ&ööd'”–BäUd”DTä4S°Ð¢6öç7B7FæF&G2Ò&ööd'”–Bå5DäD$E3°Ð¢6WEFW‡B‚'vVV¶Ç’ÖW†V7WF–öâ×&ööb"ÂW†V7WF–öâçVæF–æròæ÷BWfÇVFVB+rG¶Wf–FVæ6U7VÖÖ'’æ&6—7Ö¢G¶W†V7WF–öâç76VBò$ÔTUE2"¢$$TÄõr'ÒG¶W†V7WF–öâçF&vWGÒR7FæF&B+rG¶Wf–FVæ6U7VÖÖ'’æ&6—7Ö“°¢6WEFW‡B‚'vVV¶Ç’ÖWf–FVæ6R×&ööb"ÂWf–FVæ6U7VÖÖ'’æ6÷fW&vT–æ6ö×ÆWFRò6÷fW&vR–æ6ö×ÆWFR+rG¶Wf–FVæ6U7VÖÖ'’æ&6—7Ö¢Wf–FVæ6RçVæF–ærò$æ÷BWfÇVFVB"¢G¶Wf–FVæ6Rç76VBò$ÔTUE2"¢$$TÄõr'ÒG¶Wf–FVæ6RçF&vWGÒR7FæF&B+rG¶Wf–FVæ6U7VÖÖ'’æ&6—7Ö“°¢6WEFW‡B‚'vVV¶Ç’×7FæF&G2×7FFR"Â7FæF&G2ç76VBò$4ÄT""¢G·7FæF&G2æ7GVÇÒõTæ“°Ð¢6WEFW‡B‚'vVV¶Ç’×7FæF&G2×&ööb"Â7FæF&G2ç76VBò$æò÷Vâ66R&Æö6·2Gfæ6VÖVçB"¢%&W6öÇfR÷Vâ&Wf–Wr&Vf÷&RGfæ6VÖVçB"“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚"7vVV¶Ç’×&ööbÖw&–B'F–6ÆR"’æf÷$V6‚‚†6&B’Óâ°Ð¢6öç7B&ööbÒ&ööd'”–E¶6&BçVW'•6VÆV7F÷"‚'7â"“òçFW‡D6öçFVçCòçG&–Ò‚’ÇÂ"%Ó°Ð¢6&BæFF6WBç&ööbÒ&ööcòçVæF–ærò%TäD”är"¢&ööcòç76VBò%52"¢$d”Â#°Ð¢Ò“°Ð¢6öç7BÆ&VÂÒ†¶W’’Óâ¶W’ò4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•Ò¢%Tå44õ$TB#°Ð¢6öç7BFöÖ–ç2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖFöÖ–â×66÷&W2"“°Ð¢–b†FöÖ–ç2’FöÖ–ç2æ–ææW$…DÔÂÒ4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’Óâ°Ð¢6öç7B66÷&RÒvw&VvFRæFöÖ–å66÷&W3òå¶¶W•Óòç66÷&S°Ð¢6öç7Bö'6W'fF–öç2ÒçVÖ&W"†vw&VvFRæFöÖ–å66÷&W3òå¶¶W•Óòæ76W76VBÇÂvw&VvFRæFöÖ–å66÷&W3òå¶¶W•Óòæ76W76VD6÷VçBÇÂ“°Ð¢&WGW&âÆF—bFFÖWf–FVæ6R×7FFSÒ"G¶ö'6W'fF–öç2ò$54U54TB"¢%Tå44õ$TB'Ò#ãÇ7ãâG´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•×ÓÂ÷7ããÇ7G&öæsâG·66÷&RÓÓÒçVÆÂÇÂG—Vöb66÷&RÓÓÒ'VæFVf–æVB"ò$æ÷BWfÇVFVB"¢G´ÖF‚ç&÷VæB‡66÷&R—ÒRöb76W76VFÓÂ÷7G&öæsãÇ6ÖÆÃâG¶ö'6W'fF–öç2òG¶ö'6W'fF–öç7Òö'6W'fF–öâG¶ö'6W'fF–öç2ÓÓÒò""¢'2'Ö¢$æòWf–FVæ6R'ÓÂ÷6ÖÆÃãÂöF—cæ°¢Ò’æ¦ö–â‚""“°Ð¢6öç7BWf–FVæ6TÆ—7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖWf–FVæ6R"“°¢–b†Wf–FVæ6TÆ—7B’Wf–FVæ6TÆ—7Bæ–ææW$…DÔÂÒ†vw&VvFRæF–Ç”Wf–FVæ6RÇÂµÒ’æÖ‚†F’’ÓâÆ'F–6ÆR6Æ73Ò'vVV¶Ç’ÖWf–FVæ6RÖF’G¶F’çW&–öE7FFRÓÓÒ$eUEU$R"ò&gWGW&R"¢F’æ76W76VD6÷VçBò&æWWG&Â"¢&Ö—76–ær'Ò#ãÇ7G&öæsâG¶W66T‡FÖÂ†F’æFFR—ÓÂ÷7G&öæsãÇ7ãâG¶F’çW&–öE7FFRÓÓÒ$eUEU$R"ò$gWGW&R"¢G¶F’æ76W76VD6÷VçGÒóR&V6÷&FVFÓÂ÷7ããÂö'F–6ÆSæ’æ¦ö–â‚""“°¢6öç7BW†V7WF–öä6W'F–f–6F–öâÒ&VæFW%vVV´W†V7WF–öä6W'F–f–6F–öâ†vw&VvFR“°¢6öç7BW†V7WF–öå&VG’Òf–æÆ—¦VBÇÂW†V7WF–öä6W'F–f–6F–öãòæ6äf–æÆ—¦RÓÓÒG'VRÇÂW†V7WF–öä6W'F–f–6F–öãòç7FGW2ÓÓÒ$4U%D”d”TB#°¢6öç7B&ööe&VG’Òf–æÆ—¦VBÇÂ&ööevVV³òæ6äf–æÆ—¦RÓÓÒG'VS°¢&VæFW%vVV¶Ç”6Æ÷6V÷WDWf–FVæ6R‡²vVVµ7F'DFFS¢vw&VvFRçvVVµ7F'DFFRÂvVV´VæDFFS¢vw&VvFRçvVV´VæDFFRÒ“°¢&VæFW%vVV¶Ç”FFF–öä÷WF6öÖW2‡²vVVµ7F'DFFS¢vw&VvFRçvVVµ7F'DFFRÂvVV´VæDFFS¢vw&VvFRçvVV´VæDFFRÒ“°¢ÆWBvVV¶Ç•&V6öæ6–Æ–F–öâÒçVÆÃ°¢G'’°¢vVV¶Ç•&V6öæ6–Æ–F–öâÒ&VæFW$FÆ5vVV¶Ç•&V6öæ6–Æ–F–öâ†vw&VvFR“°¢Ò6F6‚†W'&÷"’°¢6öç6öÆRçv&â‚%vVV¶Ç’&V6öæ6–Æ–F–öâFWF–Â6÷VÆBæ÷B&VæFW#²F†RÆVæ6‚FV6—6–öâ&VÖ–ç2f–ÂÖ6Æ÷6VBâ"ÂW'&÷"“°¢vVV¶Ç•&V6öæ6–Æ–F–öâÒ'V–ÆDFÆ5vVV¶Ç•&V6öæ6–Æ–F–öâ†vw&VvFR“°¢Ð¢6öç7BÖ—76–ætÆ&VÇ2Ò†vw&VvFRæÖ—76–æu&WV—&VDFöÖ–ç2ÇÂµÒ’æÖ†Æ&VÂ“°Ð¢6öç7Bv&æ–ærÒf–æÆ—¦V@¢òf–æÆ—¦VBG¶æWrFFR†vw&VvFRæf–æÆ—¦VDB’çFôÆö6ÆU7G&–ær‚—ÒâF†—2§VFvÖVçB—2Æö6¶VBæ ¢¢W†V7WF–öä6W'F–f–6F–öà¢ò$6öÖÖ—GFVB6ÆVæF"vVV²—2&WV—&VB&Vf÷&RF†—2–ç7V7F–öâ6â&Rf–æÆ—¦VBâ ¢¢&ööevVV³òç&W— ¢òG·&ööevVV²ç&W—"æÆ&VÇÒâG·&ööevVV²ç&W—"æFWF–ÇÖ ¢¢W†V7WF–öä6W'F–f–6F–öâç7FGW2ÓÓÒ$$Äô4´TB ¢òG¶W†V7WF–öä6W'F–f–6F–öâç&W—#òæÆ&VÂÇÂ%&W6öÇfRvVV²W†V7WF–öâ'ÒâG¶W†V7WF–öä6W'F–f–6F–öâç&W—#òæFWF–ÂÇÂ$öæR76–væÖVçB7F–ÆÂæVVG2â†öæW7B&W7VÇBâ'Ö ¢¢vw&VvFRç66÷&T—5&÷f—6–öæÀ¢òG¶Wf–FVæ6U7VÖÖ'’æ†VFÆ–æRÇÂ$Wf–FVæ6R—2–æ6ö×ÆWFR'ÒâG¶Wf–FVæ6U7VÖÖ'’çVç66÷&VDF—7ÒF’G¶Wf–FVæ6U7VÖÖ'’çVç66÷&VDF—2ÓÓÒò"&VÖ–ç2"¢'2&VÖ–â'ÒVç66÷&VBG¶Ö—76–ætÆ&VÇ2æÆVæwF‚ò²Ö—76–ærG¶Ö—76–ætÆ&VÇ2æ¦ö–â‚"Â"—Ö¢"'Òâ66÷&W2FW67&–&R76W76VBö'6W'fF–öç2öæÇ’æ ¢¢"#°Ð¢6öç7Bf–æÆ—¦F–öäÆÆ÷vVBÒ&ööÆVâ†vw&VvFRæ6äf–æÆ—¦RbbW†V7WF–öå&VG’bb&ööe&VG’“°¢6öç7Bf–æÆ—¦F–öâÒf–æÆ—¦VBòçVÆÂ¢°¢ÆÆ÷vVC¢f–æÆ—¦F–öäÆÆ÷vVBÀ¢6öFS¢&ööevVV³òç&W—#òæ6öFRÇÂW†V7WF–öä6W'F–f–6F–öãòç&W—#òæ6öFRÇÂ%$U4ôÅdUõtTT²"À¢Æ&VÃ¢&ööevVV³òç&W—#òæÆ&VÂÇÂW†V7WF–öä6W'F–f–6F–öãòç&W—#òæÆ&VÂÇÂ%&W6öÇfRvVV²"À¢6V7F–öã¢&ööevVV³òç&W—#òç6V7F–öâÇÂW†V7WF–öä6W'F–f–6F–öãòç&W—#òç6V7F–öâÇÂ&–ç7V7F–öâ"À¢÷W&F–ætFFS¢&ööevVV³òç&W—#òæ÷W&F–ætFFRÇÂW†V7WF–öä6W'F–f–6F–öãòç&W—#òæ÷W&F–ætFFRÇÂçVÆÂÀ¢FWF–Ã¢v&æ–ærÇÂ$öæRvVV¶Ç’&W7VÇB7F–ÆÂæVVG2â†öæW7B&W6öÇWF–öââ ¢Ó°¢6öç7BvVV¶Ç”ÆVæ6‚Ò&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚†vw&VvFRÂ²&ööevVV²Â&V6öæ6–Æ–F–öã¢vVV¶Ç•&V6öæ6–Æ–F–öâÂf–æÆ—¦F–öâÂÖW76vS¢v&æ–ærÒ“°¢&VæFW%&V7'V—EvVV´6W'F–f–6F–öâ†vw&VvFRÂ²&ööevVV²ÂvVV¶Ç”ÆVæ6‚Ò“°¢6WEFW‡B‚'vVV¶Ç’ÖæW‡BÖ7F–öâ×F—FÆR"Â§VFvÖVçBææW‡D7F–öâæÆ&VÂ“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖæW‡BÖ7F–öâÖFWF–Â"Â§VFvÖVçBææW‡D7F–öâæFWF–Â“°Ð¢6öç7BæW‡D7F–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖæW‡BÖ7F–öâÖÆ–æ²"“°Ð¢–b†æW‡D7F–öâ’°Ð¢æW‡D7F–öâæ†–FFVâÒ²$d”äÄ•¤R"Â%$ôÔõDR%Òæ–æ6ÇVFW2†§VFvÖVçBææW‡D7F–öâæ6öFR“°Ð¢æW‡D7F–öâçFW‡D6öçFVçBÒ§VFvÖVçBææW‡D7F–öâæ6öFRÓÓÒ%5DäD$E2"ò$÷Vâ7FæF&G2"¢§VFvÖVçBææW‡D7F–öâæ6öFRÓÓÒ$U„T5UDR"bb§VFvÖVçBææW‡D7F–öâç6V7F–öâÓÓÒ'FöF’"ò$÷VâFöF’"¢$÷Vâ&V6÷&B#°Ð¢æW‡D7F–öâæ‡&VbÒ2G¶§VFvÖVçBææW‡D7F–öâç6V7F–öçÖ°Ð¢æW‡D7F–öâæFF6WBç6V7F–öâÒ§VFvÖVçBææW‡D7F–öâç6V7F–öã°Ð¢ÐÐ¢&VæFW%&æµ6V7F–öâ‚“°Ð¢&VæFW$6öÖÖæD6VçFW$÷fW'f–Wr†F–Ç•7FFRòWfÇVFU&VF–æW72†F–Ç•7FFR’¢çVÆÂÂvw&VvFR“°Ð¢&VæFW%7FæF&G56V7F–öâ‚“°Ð¢&VæFW$7F—fF–öäwV–FR‚“°¢&VæFW$FöÖ–æ–öä6×–vâ‚“°§Ð Ð¦gVæ7F–öâ&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFRÂ7F÷&vTÖöFR’°¢G'’°¢&VæFW%vVV¶Ç”§VFvÖVçB†vw&VvFRÂ7F÷&vTÖöFR“°¢&WGW&âvw&VvFS°¢Ò6F6‚†W'&÷"’°¢6öç6öÆRæW'&÷"‚%vVV¶Ç’&Wf–Wr6÷VÆBæ÷B&VæFW"6fVÇ’â"ÂW'&÷"“°¢&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚†çVÆÂÂ²W'&÷#¢W'&÷#òæÖW76vRÇÂ%vVV¶Ç’&Wf–Wr6÷VÆBæ÷B&R&W7F÷&VBâ"Ò“°¢&VæFW%&V7'V—EvVV´6W'F–f–6F–öâ†çVÆÂÂ²W'&÷#¢W'&÷#òæÖW76vRÇÂ%vVV¶Ç’&Wf–Wr6÷VÆBæ÷B&R&W7F÷&VBâ"Ò“°¢&WGW&âçVÆÃ°¢Ð¢vVV¶Ç”–ç7V7F–öâÒvw&VvFS°¢6öç7Bf–æÆ—¦VBÒ&ööÆVâ†vw&VvFRæf–æÆ—¦VDB“°Ð¢6öç7Bf–æÆ—¦U7FFRÒFW&—fTf–æÆ—¦T6öæf—&ÖF–öå7FFR†f–æÆ—¦VBÂvw&VvFRæWf–FVæ6T6÷fW&vR“°Ð¢6öç7BÆ&VÂÒ†¶W’’Óâ¶W’ò4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•Ò¢%Tå44õ$TB#°Ð¢6WEFW‡B‚'vVV¶Ç’×7FGW2"Âvw&VvFRæ–ç7V7F–öå7FGW2“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’×7FGW2"’æ6Æ74æÖRÒ7FFR×–ÆÂG¶vw&VvFRæ–ç7V7F–öå7FGW2ÓÓÒ$”å5T5D”ôâ4ôÕÄUDR"ò&w&VVâ"¢vw&VvFRæ–ç7V7F–öå7FGW2ÓÓÒ%$TE’dõ"”å5T5D”ôâ"ò'–VÆÆ÷r"¢&æWWG&Â'Ö°Ð¢6WEFW‡B‚'vVV¶Ç’×&ævR"ÂG¶vw&VvFRçvVVµ7F'DFFWÒ(	BG¶vw&VvFRçvVV´VæDFFWÖ“°Ð¢6WEFW‡B‚'vVV¶Ç’×66÷&R"ÂG¶f÷&ÖDF—66—Æ–æU66÷&R†vw&VvFRç66÷&R—ÒG¶vw&VvFRç66÷&RÓÒçVÆÂbbvw&VvFRç66÷&T—5&÷f—6–öæÂò"+r$õd•4”ôäÂ"¢"'Ö“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö6÷fW&vR"ÂG´ÖF‚ç&÷VæB†vw&VvFRæWf–FVæ6T6÷fW&vR—ÒV“°Ð¢6WEFW‡B‚'vVV¶Ç’×7F÷&vR"Â7F÷&vTÖöFRÓÓÒ%5U$4R"ò%5U$4R"¢$Äô4ÂdÄÄ$4²"“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö76W76VBÖF—2"ÂG¶vw&VvFRæ6÷VçG2æ76W76VDF—7ÒòG¶vw&VvFRæ6÷VçG2ægVÆÇ”76W76VDF—7Ö“°Ð¢6WEFW‡B‚'vVV¶Ç’×Vç66÷&VBÖF—2"Âvw&VvFRæ6÷VçG2çVç66÷&VDF—2“°Ð¢6WEFW‡B‚'vVV¶Ç’×&W7VÇBÖ6÷VçG2"ÂG¶vw&VvFRæ6÷VçG2æ6ö×ÆWFVGÒòG¶vw&VvFRæ6÷VçG2ç'F–ÇÒòG¶vw&VvFRæ6÷VçG2æÖ—76VGÖ“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖW†6ÇVFVBÖ6÷VçG2"ÂG¶vw&VvFRæ6÷VçG2æW†7W6VGÒòG¶vw&VvFRæ6÷VçG2ææ÷DÆ–6&ÆWÖ“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖÖöF–f–6F–öâÖ6÷VçB"Âvw&VvFRæ6÷VçG2æ&÷fVDÖöF–f–6F–öç2“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖWf–FVæ6R×F‡&÷Vv‚"Âvw&VvFRæWf–FVæ6UF‡&÷Vv„FFRÇÂ%vVV²æ÷B7F'FVB"“°Ð¢6WEFW‡B‚'vVV¶Ç’×&ö¦V7FVBÖ6÷fW&vR"ÂG´ÖF‚ç&÷VæB†vw&VvFRç&ö¦V7FVDgVÆÅvVV´6÷fW&vRÇÂ—ÒV“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö6Æ7VÆF–öâÖÖWF"ÂG¶vw&VvFRæ6Æ7VÆF–öåfW'6–öâÇÂ”å5T5D”ôåô4Ä5TÄD”ôåõdU%4”ôçÒ+rG¶vw&VvFRæVÆ6VDF”6÷VçBÇÂÒórF—2VÆ6VF“°Ð¢6WEFW‡B‚'vVV¶Ç’×7G&öævW7B"Âvw&VvFRç7G&öævW7DFöÖ–ç2æÆVæwF‚òvw&VvFRç7G&öævW7DFöÖ–ç2æÖ†Æ&VÂ’æ¦ö–â‚"ò"’¢%Tå44õ$TB"“°Ð¢6WEFW‡B‚'vVV¶Ç’×vV¶W7B"Âvw&VvFRæFöÖ–å&æ¶–æuF–Rò$äòD•5D”ä5BtT´U5B(	BD”TB"¢vw&VvFRçvV¶W7DFöÖ–ç2æÆVæwF‚òvw&VvFRçvV¶W7DFöÖ–ç2æÖ†Æ&VÂ’æ¦ö–â‚"ò"’¢%Tå44õ$TB"“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖÖ—76VB"Âvw&VvFRæÖ—76VE&WV—&VÖVçG2æÆVæwF‚òvw&VvFRæÖ—76VE&WV—&VÖVçG2æÖ‚†—FVÒ’ÓâG¶—FVÒæFFWÒG¶Æ&VÂ†—FVÒæFöÖ–â—Ö’æ¦ö–â‚#²"’¢$æöæR&V6÷&FVBâ"“°Ð¢6WEFW‡B‚'vVV¶Ç’ÖW†7W6VB"Âvw&VvFRæW†7W6VD6öæF—F–öç2æÆVæwF‚òvw&VvFRæW†7W6VD6öæF—F–öç2æÖ‚†—FVÒ’ÓâG¶—FVÒæFFWÒG¶Æ&VÂ†—FVÒæFöÖ–â—Ó¢G¶—FVÒç&W7G&–7F–öçÖ’æ¦ö–â‚#²"’¢$æöæR&V6÷&FVBâ"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖFöÖ–â×66÷&W2"’æ–ææW$…DÔÂÒ4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’ÓâÆF—cãÇ7ãâG´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•×ÓÂ÷7ããÇ7G&öæsâG¶f÷&ÖDF—66—Æ–æU66÷&R†vw&VvFRæFöÖ–å66÷&W5¶¶W•Òç66÷&R—ÓÂ÷7G&öæsãÂöF—cæ’æ¦ö–â‚""“°Ð¢&VæFW%vVV¶Ç”6Æ÷6V÷WDWf–FVæ6R‡²vVVµ7F'DFFS¢vw&VvFRçvVVµ7F'DFFRÂvVV´VæDFFS¢vw&VvFRçvVV´VæDFFRÒ“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖWf–FVæ6R"’æ–ææW$…DÔÂÒvw&VvFRæF–Ç”Wf–FVæ6RæÖ‚†F’’ÓâÆFWF–Ç26Æ73Ò'vVV¶Ç’ÖWf–FVæ6RÖF’G¶F’çW&–öE7FFRÓÓÒ$eUEU$R"ò&gWGW&R"¢F’æ76W76VD6÷VçBò&æWWG&Â"¢&Ö—76–ær'Ò#ãÇ7VÖÖ'“ãÇ7G&öæsâG¶F’æFFWÓÂ÷7G&öæsãÇ7ãâG¶F’çW&–öE7FFRÓÓÒ$eUEU$R"ò$eUEU$R+räõB4õTåDTB"¢G¶F’æ76W76VD6÷VçGÒóR54U54TFÓÂ÷7ããÂ÷7VÖÖ'“ãÇâG¶F’çW&–öE7FFRÓÓÒ$eUEU$R"ò$W†6ÇVFVBg&öÒ7W'&VçB–ç7V7F–öâWf–FVæ6Râ"¢G¶F’æ–æ6ÇVFVD6÷VçGÒÆ–6&ÆR66÷&–ærö'6W'fF–öç6ÓÂ÷ãÂöFWF–Ç3æ’æ¦ö–â‚""“°Ð¢6WEFW‡B‚'vVV¶Ç’×&W÷'B"Â†vw&VvFRæFÆ5&W÷'BÇÂvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR’’çFW‡B“°Ð¢&VæFW%vVV¶Ç”&öG”÷WF6öÖR†vw&VvFR“°Ð¢6öç7BvVV¶Ç•7FæF&G57VÖÖ'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’×7FæF&G2×7VÖÖ'’"“°Ð¢6öç7BvVV¶Ç•7FæF&G4—FV×2Ò7FæF&G5&Wf–Wu7FFRæf–ÇFW"‚†—FVÒ’Óâ—FVÒç6÷W&6TFFRbb—FVÒç6÷W&6TFFRÃÒvw&VvFRçvVV´VæDFFRbb—FVÒç6÷W&6TFFRãÒvw&VvFRçvVVµ7F'DFFR“°Ð¢–b‡vVV¶Ç•7FæF&G57VÖÖ'’’°Ð¢vVV¶Ç•7FæF&G57VÖÖ'’æ–ææW$…DÔÂÒvVV¶Ç•7FæF&G4—FV×2æÆVæwF€Ð¢òvVV¶Ç•7FæF&G4—FV×2æÖ‚†—FVÒ’ÓâÆ'F–6ÆR6Æ73Ò'7FæF&G2Ö—FVÒ#ãÆF—b6Æ73Ò'7FæF&G2Ö—FVÒÖ†VFW"#ãÇ7G&öæsâG¶—FVÒæFöÖ–çÓÂ÷7G&öæsãÇ7â6Æ73Ò'7FFR×–ÆÂG¶—FVÒç7FGW2ÓÓÒ$4ôäd•$ÔTB"ò&w&VVâ"¢—FVÒç7FGW2ÓÓÒ%$U4ôÅdTB"ò&æWWG&Â"¢—FVÒç7FGW2ÓÓÒ$D•4Ô•54TB"ò&æWWG&Â"¢—FVÒç7FGW2ÓÓÒ$U„5U4TB"ò&æWWG&Â"¢'–VÆÆ÷r'Ò#âG¶—FVÒç7FGW2ÇÂ$4äD”DDR'ÓÂ÷7ããÂöF—cãÇâG¶—FVÒæWf–FVæ6RÇÂ$æòWf–FVæ6R&V6÷&FVBâ'ÓÂ÷ãÇ6ÖÆÃâG¶—FVÒç6WfW&—G“òæÆWfVÂÇÂ$ÄUdTÂ’'ÓÂ÷6ÖÆÃãÂö'F–6ÆSæ’æ¦ö–â‚""Ð¢¢sÆF—b6Æ73Ò'7FæF&G2ÖV×G’#äæò7FæF&G2&Wf–Wr†—7F÷'’f÷"F†—2–ç7V7F–öâvVV²ãÂöF—câs°Ð¢ÐÐ¢6öç7BÖ—76–ætÆ&VÇ2Ò†vw&VvFRæÖ—76–æu&WV—&VDFöÖ–ç2ÇÂµÒ’æÖ†Æ&VÂ“°Ð¢6öç7Bv&æ–ærÒf–æÆ—¦V@Ð¢òf–æÆ—¦VBG¶æWrFFR†vw&VvFRæf–æÆ—¦VDB’çFôÆö6ÆU7G&–ær‚—Òâ†—7F÷&–6Â6æ6†÷B—2&VBÖöæÇ’æ Ð¢¢vw&VvFRç66÷&T—5&÷f—6–öæÀÐ¢ò&÷f—6–öæÂ–ç7V7F–öââWf–FVæ6R—2ÖV7W&VBöæÇ’F‡&÷Vv‚G¶vw&VvFRæWf–FVæ6UF‡&÷Vv„FFRÇÂ'F†RvVV²7F'B'ÒG¶Ö—76–ætÆ&VÇ2æÆVæwF‚ò²–æ6ö×ÆWFR&WV—&VBFöÖ–ç3¢G¶Ö—76–ætÆ&VÇ2æ¦ö–â‚"Â"—Ö¢"'ÒG²vw&VvFRçvVV´6ö×ÆWFRò#²F†RvVV²—27F–ÆÂ–â&öw&W72"¢"'Òæ Ð¢¢"#°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"Âv&æ–ær“°Ð¢6öç7Bf–æÆ—¦T'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f–æÆ—¦R×vVV²"“°Ð¢f–æÆ—¦T'WGFöâæF—6&ÆVBÒf–æÆ—¦VBÇÂvw&VvFRæ6äf–æÆ—¦S°Ð¢f–æÆ—¦T'WGFöâçFW‡D6öçFVçBÒf–æÆ—¦VBò$–ç7V7F–öâf–æÆ—¦VB"¢$f–æÆ—¦R–ç7V7F–öâ#°Ð¢f–æÆ—¦T'WGFöâç6WDGG&–'WFR‚&&–ÖF—6&ÆVB"Âf–æÆ—¦T'WGFöâæF—6&ÆVBò'G'VR"¢&fÇ6R"“°Ð¢6öç7Bf–æÆ—¦T†–çBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’Öf–æÆ—¦RÖ†–çB"“°Ð¢–b†f–æÆ—¦T†–çB’f–æÆ—¦T†–çBçFW‡D6öçFVçBÒf–æÆ—¦VBò%F†—2–ç7V7F–öâ—2f–æÆ—¦VBæB&VBÖöæÇ’â"¢f–æÆ—¦U7FFRç&VDöæÇ”ÖW76vS°Ð¢6öç7B–ç7V7F–öå6V7F–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&–ç7V7F–öâ"“°Ð¢–b†–ç7V7F–öå6V7F–öâ’–ç7V7F–öå6V7F–öâæFF6WBæf–æÆ—¦VBÒf–æÆ—¦VBò'G'VR"¢&fÇ6R#°Ð¢&VæFW$6öÖÖæD6VçFW$÷fW'f–Wr†F–Ç•7FFRòWfÇVFU&VF–æW72†F–Ç•7FFR’¢çVÆÂÂvw&VvFR“°Ð¢&VæFW%vVV¶Ç•Æâ†vw&VvFR“°Ð¢&VæFW%7FæF&G56V7F–öâ‚“°Ð¢&VæFW$7F—fF–öäwV–FR‚“°Ð¢&VæFW%&Wf–Wt‡V"‚“°Ð¢&VæFW$FÆ5vVV¶Ç”6öÖÖæB‚“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâÆöEvVV¶Ç”–ç7V7F–öäÆVv7’‚’°Ð¢6öç7B6VÆV7FVDFFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖFFR"’çfÇVRÇÂFöF”•4ôFFR‚“°Ð¢6öç7B&ævRÒvWD–ç7V7F–öåvVVµ&ævR‡6VÆV7FVDFFR“°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"Â$6Æ7VÆF–ærvVV¶Ç’Wf–FVæ6^(
b"“°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B²FF¢6fVBÂW'&÷#¢–ç7V7F–öäW'&÷"ÒÒv—B7W&6Ræg&öÒ‚'vVV¶Ç•ö–ç7V7F–öç2"’ç6VÆV7B‚"¢"’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æW‚'vVVµ÷7F'EöFFR"Â&ævRçvVVµ7F'DFFR’æÖ–&U6–ævÆR‚“°Ð¢–b†–ç7V7F–öäW'&÷"’F‡&÷r–ç7V7F–öäW'&÷#°Ð¢–b‡6fVCòæf–æÆ—¦VEöB’°Ð¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ‡6fVB’Â%5U$4R"“°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B²FF¢&V6÷&G2ÂW'&÷#¢&V6÷&G4W'&÷"ÒÒv—B7W&6Ræg&öÒ‚&F–Ç•ö6ö×Æ–æ6R"’ç6VÆV7B„4ôÕÄ”ä4Uô4ôÅTÔå2’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æwFR‚&6ö×Æ–æ6UöFFR"Â&ævRçvVVµ7F'DFFR’æÇFR‚&6ö×Æ–æ6UöFFR"Â&ævRçvVV´VæDFFR“°Ð¢–b‡&V6÷&G4W'&÷"’F‡&÷r&V6÷&G4W'&÷#°Ð¢vVV¶Ç”F–Ç•&V6÷&G2Ò&V6÷&G2ÇÂµÓ°Ð¢6öç7Bvw&VvFRÒvw&VvFUvVV¶Ç”6ö×Æ–æ6R‡vVV¶Ç”F–Ç•&V6÷&G2Â&ævRçvVVµ7F'DFFR“°Ð¢vw&VvFRæFÆ5&W÷'BÒvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR“°Ð¢6öç7B–ÆöBÒvVV¶Ç•W'6—7FVæ6U–ÆöB†vw&VvFR“°Ð¢6öç7B²W'&÷#¢G&gDW'&÷"ÒÒv—B7W&6Ræg&öÒ‚'vVV¶Ç•ö–ç7V7F–öç2"’çW6W'B‡–ÆöBÂ²öä6öæfÆ–7C¢'W6W%ö–BÇvVVµ÷7F'EöFFR"Ò“°Ð¢–b†G&gDW'&÷"’F‡&÷rG&gDW'&÷#°Ð¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFRÂ%5U$4R"“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6öç7B6fVBÒÆöDÆö6ÅvVV¶Ç”–ç7V7F–öâ‡&ævRçvVVµ7F'DFFR“°Ð¢–b‡6fVCòæf–æÆ—¦VEöB’°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"Â&VÖ÷FRvVV¶Ç’–ç7V7F–öâFF6÷VÆBæ÷B&RÆöFVB‚G¶W'&÷#òæÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’â6†÷v–ærF†Rf–æÆ—¦VBÆö6Â6æ6†÷Bæ“°Ð¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ‡6fVB’Â$Äô4Â"“°Ð¢&WGW&ã°Ð¢ÐÐ¢vVV¶Ç”F–Ç•&V6÷&G2ÒÆöDÆö6ÅvVVµ&V6÷&G2‡&ævR“°Ð¢6öç7Bvw&VvFRÒvw&VvFUvVV¶Ç”6ö×Æ–æ6R‡vVV¶Ç”F–Ç•&V6÷&G2Â&ævRçvVVµ7F'DFFR“°Ð¢vw&VvFRæFÆ5&W÷'BÒvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR“°Ð¢6fTÆö6ÅvVV¶Ç”–ç7V7F–öâ‡vVV¶Ç•W'6—7FVæ6U–ÆöB†vw&VvFR’“°Ð¢6öç7BÖW76vRÒvVV¶Ç”F–Ç•&V6÷&G2æÆVæwF€Ð¢ò&VÖ÷FRvVV¶Ç’–ç7V7F–öâFF6÷VÆBæ÷B&RÆöFVB‚G¶W'&÷#òæÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’â6†÷v–ærÆö6ÂfÆÆ&6²æ Ð¢¢&VÖ÷FRvVV¶Ç’–ç7V7F–öâFF6÷VÆBæ÷B&RÆöFVB‚G¶W'&÷#òæÖW76vRÇÂ'Væ¶æ÷vâW'&÷"'Ò’âæòÆö6ÂfÆÆ&6²&÷w2vW&Rf÷VæBæ°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂÖW76vR“°Ð¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFRÂ$Äô4Â"“°Ð¢ÐÐ§ÐÐ Ð¦7–æ2gVæ7F–öâÆöEvVV¶Ç”–ç7V7F–öâ‚’°¢6öç7B6VÆV7FVDFFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’ÖFFR"’çfÇVRÇÂFöF”•4ôFFR‚“°¢6öç7B&ævRÒvWD–ç7V7F–öåvVVµ&ævR‡6VÆV7FVDFFR“°¢&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚†çVÆÂÂ²ÆöF–æs¢G'VRÒ“°¢G'’°¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°¢6öç7B–ç7V7F–öå&W7VÇBÒv—B7W&6Ræg&öÒ‚'vVV¶Ç•ö–ç7V7F–öç2"’ç6VÆV7B‚"¢"’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æW‚'vVVµ÷7F'EöFFR"Â&ævRçvVVµ7F'DFFR’æÖ–&U6–ævÆR‚“°¢–b†–ç7V7F–öå&W7VÇBæFFòæf–æÆ—¦VEöBbb–ç7V7F–öå&W7VÇBæW'&÷"’°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ†–ç7V7F–öå&W7VÇBæFF’Â%5U$4R"“°¢&WGW&ã°¢Ð ¢6öç7B&V6÷&G5&W7VÇBÒv—B7W&6Ræg&öÒ‚&F–Ç•ö6ö×Æ–æ6R"’ç6VÆV7B„4ôÕÄ”ä4Uô4ôÅTÔå2’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æwFR‚&6ö×Æ–æ6UöFFR"Â&ævRçvVVµ7F'DFFR’æÇFR‚&6ö×Æ–æ6UöFFR"Â&ævRçvVV´VæDFFR“°¢6öç7BÆö6Å6fVBÒÆöDÆö6ÅvVV¶Ç”–ç7V7F–öâ‡&ævRçvVVµ7F'DFFR“°¢6öç7B÷WF6öÖRÒ&W6öÇfUvVV¶Ç”–ç7V7F–öäÆöD÷WF6öÖR‡°¢6fVD–ç7V7F–öã¢–ç7V7F–öå&W7VÇBæFFÇÂÆö6Å6fVBÀ¢–ç7V7F–öå&VDW'&÷#¢–ç7V7F–öå&W7VÇBæW'&÷"À¢&VÖ÷FU&V6÷&G3¢&V6÷&G5&W7VÇBæFFÀ¢&V6÷&G5&VDW'&÷#¢&V6÷&G5&W7VÇBæW'&÷"À¢G&gEw&—FTW'&÷#¢çVÆÂÀ¢Æö6Å&V6÷&G3¢ÆöDÆö6ÅvVVµ&V6÷&G2‡&ævR¢Ò“°¢–b†÷WF6öÖRæÖöFRÓÓÒ$d”äÄ•¤TEôÄô4Â"’°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ†÷WF6öÖRæ–ç7V7F–öâ’Â÷WF6öÖRç7F÷&vTÖöFR“°¢–b†÷WF6öÖRçv&æ–ær’Ç•vVV¶Ç•&Wf–WtÆ–fV7–6ÆR†7W'&VçEvVV¶Ç•fW&F–7DÆVæ6‚Â²ÖW76vS¢÷WF6öÖRçv&æ–ærÒ“°¢&WGW&ã°¢Ð¢vVV¶Ç”F–Ç•&V6÷&G2Ò÷WF6öÖRç&V6÷&G3°¢6öç7Bvw&VvFRÒvw&VvFUvVV¶Ç”6ö×Æ–æ6R‡vVV¶Ç”F–Ç•&V6÷&G2Â&ævRçvVVµ7F'DFFR“°¢vw&VvFRæFÆ5&W÷'BÒvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR“°¢–b†÷WF6öÖRç7F÷&vTÖöFRÓÓÒ$Äô4Â"’6fTÆö6ÅvVV¶Ç”–ç7V7F–öâ‡vVV¶Ç•W'6—7FVæ6U–ÆöB†vw&VvFR’“°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFRÂ÷WF6öÖRç7F÷&vTÖöFR“°¢–b†÷WF6öÖRçv&æ–ær’Ç•vVV¶Ç•&Wf–WtÆ–fV7–6ÆR†7W'&VçEvVV¶Ç•fW&F–7DÆVæ6‚Â²ÖW76vS¢÷WF6öÖRçv&æ–ærÒ“°¢Ò6F6‚†W'&÷"’°¢6öç7BÆö6Å6fVBÒÆöDÆö6ÅvVV¶Ç”–ç7V7F–öâ‡&ævRçvVVµ7F'DFFR“°¢6öç7BÆö6Å&V6÷&G2ÒÆöDÆö6ÅvVVµ&V6÷&G2‡&ævR“°¢–b†Æö6Å6fVCòæf–æÆ—¦VEöB’°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ†Æö6Å6fVB’Â$Äô4Â"“°¢Ç•vVV¶Ç•&Wf–WtÆ–fV7–6ÆR†7W'&VçEvVV¶Ç•fW&F–7DÆVæ6‚Â²ÖW76vS¢%6†÷v–ærF†R6fVBvVV²g&öÒF†—2FWf–6Rv†–ÆRF†R66÷VçB&V6öææV7G2â"Ò“°¢&WGW&ã°¢Ð¢G'’°¢vVV¶Ç”F–Ç•&V6÷&G2ÒÆö6Å&V6÷&G3°¢6öç7Bvw&VvFRÒvw&VvFUvVV¶Ç”6ö×Æ–æ6R†Æö6Å&V6÷&G2Â&ævRçvVVµ7F'DFFR“°¢vw&VvFRæFÆ5&W÷'BÒvVæW&FUvVV¶Ç”gFW$7F–öå&W÷'B†vw&VvFR“°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†vw&VvFRÂ$Äô4Â"“°¢Ç•vVV¶Ç•&Wf–WtÆ–fV7–6ÆR†7W'&VçEvVV¶Ç•fW&F–7DÆVæ6‚Â²ÖW76vS¢%6†÷v–ærF†—2FWf–6^(	—26fVBWf–FVæ6Rv†–ÆRF†R66÷VçB&V6öææV7G2â"Ò“°¢Ò6F6‚…ò’°¢&VæFW%vVV¶Ç•fW&F–7DÆVæ6‚†çVÆÂÂ²W'&÷#¢W'&÷#òæÖW76vRÇÂ%vVV¶Ç’&Wf–Wr6÷VÆBæ÷B&R&W7F÷&VBâ"Ò“°¢Ð¢Ð§Ð Ð¦7–æ2gVæ7F–öâf–æÆ—¦UvVV¶Ç”–ç7V7F–öâ‚’°¢–b‚vVV¶Ç”–ç7V7F–öâ’&WGW&ã°¢6öç7Bf–æÆ—¦U7FFRÒFW&—fTf–æÆ—¦T6öæf—&ÖF–öå7FFR„&ööÆVâ‡vVV¶Ç”–ç7V7F–öâæf–æÆ—¦VDB’ÂvVV¶Ç”–ç7V7F–öâæWf–FVæ6T6÷fW&vR“°¢–b‚f–æÆ—¦U7FFRæ6äf–æÆ—¦RÇÂvVV¶Ç”–ç7V7F–öâæ6äf–æÆ—¦R’°¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂvVV¶Ç”–ç7V7F–öâçvVV´6ö×ÆWFRò$f–æÆ—¦F–öâ—2f–Æ&ÆRgFW"F†R–ç7V7F–öâvVV²VæG2â"¢$f–æÆ—¦F–öâ&WV—&W27Vff–6–VçBWf–FVæ6R7&÷72WfW'’&WV—&VBFöÖ–ââ"“°¢&WGW&ã°¢Ð¢6öç7B&ööevVV²Ò'V–ÆE&V7'V—E&ööevVV´f÷$–ç7V7F–öâ‡vVV¶Ç”–ç7V7F–öâ“°¢–b‚&ööevVV³òæ6äf–æÆ—¦R’°¢&VæFW%&V7'V—E&ööevVV²‡&ööevVV²Â²'&V7'V—B×&ööb×vVV²×&Wf–Wr%Ò“°¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"Â&ööevVV³òç&W— ¢òG·&ööevVV²ç&W—"æÆ&VÇÒâG·&ööevVV²ç&W—"æFWF–ÇÖ ¢¢&ööevVV³òæFWF–ÂÇÂ$6öæf—&ÒÆÂ6WfVâF–Ç’&V6V—G2&Vf÷&Rf–æÆ—¦–ærF†RvVV²â"“°¢&WGW&ã°¢Ð¢6öç7BW†V7WF–öå&Wf–WrÒ'V–ÆEvVV´W†V7WF–öä6W'F–f–6F–öâ‡vVV¶Ç”–ç7V7F–öâ“°¢–b‚W†V7WF–öå&Wf–Wsòæ6äf–æÆ—¦R’°¢&VæFW%vVV´W†V7WF–öä6W'F–f–6F–öâ‡vVV¶Ç”–ç7V7F–öâ“°¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂW†V7WF–öå&Wf–Wsòç&W— ¢òG¶W†V7WF–öå&Wf–Wrç&W—"æÆ&VÇÒâG¶W†V7WF–öå&Wf–Wrç&W—"æFWF–ÇÖ ¢¢$6öÖÖ—GFVB6ÆVæF"vVV²æB—G276–væÖVçBWf–FVæ6R&R&WV—&VB&Vf÷&Rf–æÆ—¦F–öââ"“°¢&WGW&ã°¢Ð¢6öç7B6öæf—&ÖVBÒv–æF÷ræ6öæf—&Ò†G¶f–æÆ—¦U7FFRç&VDöæÇ”ÖW76vWÕÆåÆäf–æÆ—¦RF†—2–ç7V7F–öâæ÷sö“°¢–b‚6öæf—&ÖVB’&WGW&ã°Ð¢6öç7B'WGFöâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&f–æÆ—¦R×vVV²"“°Ð¢'WGFöâæF—6&ÆVBÒG'VS°¢G'’°¢6öç7Bf–æÆ—¦VDBÒæWrFFR‚’çFô•4õ7G&–ær‚“°¢6öç7BW†V7WF–öä6W'F–f–6F–öâÒ'V–ÆEvVV´W†V7WF–öä6W'F–f–6F–öâ‡vVV¶Ç”–ç7V7F–öâÂ²f–æÆ—¦S¢G'VRÂf–æÆ—¦VDBÒ“°¢–b†W†V7WF–öä6W'F–f–6F–öãòç7FGW2ÓÒ$4U%D”d”TB"’F‡&÷ræWrW'&÷"†W†V7WF–öä6W'F–f–6F–öãòç&W—#òæFWF–ÂÇÂ%vVV²W†V7WF–öâ6÷VÆBæ÷B&R6W'F–f–VBâ"“°¢6öç7Bf–æÆ—¦VBÒf–æÆ—¦UvVV¶Ç”–ç7V7F–öå6æ6†÷B‡vVV¶Ç”–ç7V7F–öâÂf–æÆ—¦VDB“°¢f–æÆ—¦VBçvVV´W†V7WF–öä6W'F–f–6F–öâÒW†V7WF–öä6W'F–f–6F–öã°¢6öç7B–ÆöBÒvVV¶Ç•W'6—7FVæ6U–ÆöB†f–æÆ—¦VBÂf–æÆ—¦VBæf–æÆ—¦VDB“°¢ÆWBf–æÆ—¦VDvw&VvFRÒf–æÆ—¦VC°¢G'’°¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°¢6öç7B²FFÂW'&÷"ÒÒv—B7W&6Ræg&öÒ‚'vVV¶Ç•ö–ç7V7F–öç2"’çW6W'B‡–ÆöBÂ²öä6öæfÆ–7C¢'W6W%ö–BÇvVVµ÷7F'EöFFR"Ò’ç6VÆV7B‚"¢"’ç6–ævÆR‚“°¢–b†W'&÷"’F‡&÷rW'&÷#°¢f–æÆ—¦VDvw&VvFRÒvw&VvFTg&öÕ7F÷&VD–ç7V7F–öâ†FF“°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†f–æÆ—¦VDvw&VvFRÂ%5U$4R"“°¢Ò6F6‚…ò’°¢6fTÆö6ÅvVV¶Ç”–ç7V7F–öâ‡–ÆöB“°¢&VæFW%vVV¶Ç”–ç7V7F–öâ†f–æÆ—¦VBÂ$Äô4Â"“°¢Ð¢v—B6fUvVV´W†V7WF–öä6W'F–f–6F–öâ†W†V7WF–öä6W'F–f–6F–öâ“°¢6öç7B&V6öæ6–Æ–F–öâÒ'V–ÆDFÆ5vVV¶Ç•&V6öæ6–Æ–F–öâ†f–æÆ—¦VDvw&VvFR“°¢–b‡&V6öæ6–Æ–F–öâ’°¢v—B6fTFÆ5vVV¶Ç•&V6öæ6–Æ–F–öâ‡&V6öæ6–Æ–F–öâ“°¢&VæFW$FÆ5vVV¶Ç•&V6öæ6–Æ–F–öâ†f–æÆ—¦VDvw&VvFR“°¢Ð¢v—BÆöEG&VæG4æÇ—F–72‚“°¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'vVV¶Ç’×v&æ–ær"ÂW'&÷"æÖW76vR“°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâÆöDÆö6ÄæÇ—F–74†—7F÷'’‚’°Ð¢6öç7BW6W"Ò6W76–öãòçW6W#òæ–BÇÂ&Æö6Â#°Ð¢6öç7BF–Ç•&Vf—‚Ò6ö6‚ÖFöÖ–æ–öã¦F–Ç’Ö6ö×Æ–æ6S¢G·W6W'Ó¦°Ð¢6öç7BvVV¶Ç•&Vf—‚Ò6ö6‚ÖFöÖ–æ–öã§vVV¶Ç’Ö–ç7V7F–öã¢G·W6W'Ó¦°Ð¢6öç7BF–Ç•&V6÷&G2ÒµÓ°Ð¢6öç7B–ç7V7F–öç2ÒµÓ°Ð¢G'’°Ð¢f÷"†ÆWB–æFW‚Ò²–æFW‚Âv–æF÷ræÆö6Å7F÷&vRæÆVæwFƒ²–æFW‚³Ò’°Ð¢6öç7B¶W’Òv–æF÷ræÆö6Å7F÷&vRæ¶W’†–æFW‚“°Ð¢–b‚¶W’’6öçF–çVS°Ð¢6öç7B'6VBÒ¥4ôâç'6R‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ†¶W’’“°Ð¢–b†¶W’ç7F'G5v—F‚†F–Ç•&Vf—‚’’F–Ç•&V6÷&G2çW6‚‡'6VB“°Ð¢–b†¶W’ç7F'G5v—F‚‡vVV¶Ç•&Vf—‚’’–ç7V7F–öç2çW6‚‡'6VB“°Ð¢ÐÐ¢Ò6F6‚…ò’°Ð¢&WGW&â²F–Ç•&V6÷&G2Â–ç7V7F–öç2Ó°Ð¢ÐÐ¢&WGW&â²F–Ç•&V6÷&G2Â–ç7V7F–öç2Ó°Ð§ÐÐ Ð¦gVæ7F–öâ6–væVDF—7Æ’‡fÇVRÂ7Vff—‚Ò"R"’°Ð¢–b‚çVÖ&W"æ—4f–æ—FR„çVÖ&W"‡fÇVR’’’&WGW&â.(	B#°Ð¢6öç7B&÷VæFVBÒÖF‚ç&÷VæB„çVÖ&W"‡fÇVR’“°Ð¢&WGW&âG·&÷VæFVBâò"²"¢"'ÒG·&÷VæFVGÒG·7Vff—‡Ö°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%G&VæD6†'B†VÆVÖVçD–BÂ6W&–W2ÂfÇVT¶W’ÂÆ&VÂ’°Ð¢6öç7BVÆVÖVçBÒFö7VÖVçBævWDVÆVÖVçD'”–B†VÆVÖVçD–B“°Ð¢6öç7Bö–çG2Ò6W&–W2æf–ÇFW"‚†—FVÒ’Óâ—4f–æ—FTÖWG&–2†—FVÕ·fÇVT¶W•Ò’“°Ð¢–b‚ö–çG2æÆVæwF‚’°Ð¢VÆVÖVçBæ–ææW$…DÔÂÒÆF—b6Æ73Ò&6†'BÖV×G’#äæòG¶Æ&VÂçFôÆ÷vW$66R‚—ÒFFf–Æ&ÆRãÂöF—cæ°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7Bv–GF‚Òv–æF÷ræ–ææW%v–GF‚ÂcCò3#¢cC°Ð¢6öç7B†V–v‡BÒv–æF÷ræ–ææW%v–GF‚ÂcCò#¢#3°Ð¢6öç7BÆVgBÒC#°Ð¢6öç7B&–v‡BÒƒ°Ð¢6öç7BF÷Òƒ°Ð¢6öç7B&÷GFöÒÒCƒ°Ð¢6öç7B‚Ò†–æFW‚’Óâö–çG2æÆVæwF‚ÓÓÒòv–GF‚ò"¢ÆVgB²–æFW‚¢‚‡v–GF‚ÒÆVgBÒ&–v‡B’ò‡ö–çG2æÆVæwF‚Ò’“°Ð¢6öç7B’Ò‡fÇVR’ÓâF÷²ƒÒÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂçVÖ&W"‡fÇVR’’’’ò¢††V–v‡BÒF÷Ò&÷GFöÒ“°Ð¢6öç7Bf–æÆ—¦VBÒö–çG2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ¶–æBÓÓÒ$d”äÄ•¤TB"“°Ð¢6öç7Bf–æÆ—¦VD6ö÷&F–æFW2Òf–æÆ—¦VBæÖ‚†—FVÒ’ÓâG·‚‡ö–çG2æ–æFW„öb†—FVÒ’—ÒÂG·’†—FVÕ·fÇVT¶W•Ò—Ö’æ¦ö–â‚""“°Ð¢6öç7B&÷f—6–öæÂÒö–çG2æf–æB‚†—FVÒ’Óâ—FVÒæ¶–æBÓÓÒ%$õd•4”ôäÂ"“°Ð¢6öç7B&–÷"Ò&÷f—6–öæÂòö–çG2ç6Æ–6RƒÂö–çG2æ–æFW„öb‡&÷f—6–öæÂ’’æB‚Ó’¢çVÆÃ°Ð¢6öç7B&÷f—6–öæÄÆ–æRÒ&÷f—6–öæÂbb&–÷"òÆÆ–æR6Æ73Ò&6†'BÖÆ–æR6†'B×&÷f—6–öæÂÖÆ–æR"ƒÒ"G·‚‡ö–çG2æ–æFW„öb‡&–÷"’—Ò"“Ò"G·’‡&–÷%·fÇVT¶W•Ò—Ò"ƒ#Ò"G·‚‡ö–çG2æ–æFW„öb‡&÷f—6–öæÂ’—Ò"“#Ò"G·’‡&÷f—6–öæÅ·fÇVT¶W•Ò—Ò#ãÂöÆ–æSæ¢"#°Ð¢6öç7Bw&–BÒ³Â#RÂSÂsRÂÒæÖ‚‡fÇVR’ÓâÆÆ–æR6Æ73Ò&6†'BÖw&–FÆ–æR"ƒÒ"G¶ÆVgGÒ"“Ò"G·’‡fÇVR—Ò"ƒ#Ò"G·v–GF‚Ò&–v‡GÒ"“#Ò"G·’‡fÇVR—Ò#ãÂöÆ–æSãÇFW‡B6Æ73Ò&6†'BÖÆ&VÂ"ƒÒ#B"“Ò"G·’‡fÇVR’²GÒ#âG·fÇVWÓÂ÷FW‡Cæ’æ¦ö–â‚""“°Ð¢6öç7BÖ&·2Òö–çG2æÖ‚†—FVÒÂ–æFW‚’Óâ°Ð¢6öç7BvV´Wf–FVæ6RÒfÇVT¶W’ÓÓÒ'66÷&R"bbçVÖ&W"†—FVÒæWf–FVæ6T6÷fW&vR’ÂE$TäEôUd”DTä4UõD…$U4„ôÄC°Ð¢&WGW&âÆ6—&6ÆR6Æ73Ò&6†'B×ö–çBG¶—FVÒæ¶–æBÓÓÒ%$õd•4”ôäÂ"ò'&÷f—6–öæÂ"¢"'ÒG·vV´Wf–FVæ6Rò'vV²ÖWf–FVæ6R"¢"'Ò"7ƒÒ"G·‚†–æFW‚—Ò"7“Ò"G·’†—FVÕ·fÇVT¶W•Ò—Ò"#Ò#R#ãÇF—FÆSâG¶—FVÒçvVVµ7F'DFFWÓ¢G¶—FVÕ·fÇVT¶W•×ÒRG¶—FVÒæ¶–æBçFôÆ÷vW$66R‚—ÒG·vV´Wf–FVæ6Rò#²Æ–Ö—FVBWf–FVæ6R"¢"'ÓÂ÷F—FÆSãÂö6—&6ÆSãÇFW‡B6Æ73Ò&6†'BÖÆ&VÂ"FW‡BÖæ6†÷#Ò&Ö–FFÆR"ƒÒ"G·‚†–æFW‚—Ò"“Ò"G¶†V–v‡BÒ#WÒ#âG¶—FVÒçvVVµ7F'DFFRç6Æ–6RƒR—ÓÂ÷FW‡CãÇFW‡B6Æ73Ò&6†'BÖÆ&VÂ"FW‡BÖæ6†÷#Ò&Ö–FFÆR"ƒÒ"G·‚†–æFW‚—Ò"“Ò"G·’†—FVÕ·fÇVT¶W•Ò’Ò—Ò#âG´ÖF‚ç&÷VæB†—FVÕ·fÇVT¶W•Ò—ÓÂ÷FW‡Cæ°Ð¢Ò’æ¦ö–â‚""“°Ð¢6öç7BWV—fÆVçBÒö–çG2æÖ‚†—FVÒ’ÓâG¶—FVÒçvVVµ7F'DFFWÓ¢G¶—FVÕ·fÇVT¶W•×ÒR‚G¶—FVÒæ¶–æBçFôÆ÷vW$66R‚—ÒG·fÇVT¶W’ÓÓÒ'66÷&R"bbçVÖ&W"†—FVÒæWf–FVæ6T6÷fW&vR’ÂE$TäEôUd”DTä4UõD…$U4„ôÄBò"ÂÆ–Ö—FVBWf–FVæ6R"¢"'Ò–’æ¦ö–â‚#²"“°Ð¢VÆVÖVçBæ–ææW$…DÔÂÒÇ7frf–Wt&÷ƒÒ#G·v–GF‡ÒG¶†V–v‡GÒ"&öÆSÒ&–Ör"&–ÖÆ&VÃÒ"G¶Æ&VÇÒâf—†VB†—2g&öÒ¦W&òFòöæR‡VæG&VBW&6VçBâ#âG¶w&–GÒG¶f–æÆ—¦VD6ö÷&F–æFW2òÇöÇ–Æ–æR6Æ73Ò&6†'BÖÆ–æR"ö–çG3Ò"G¶f–æÆ—¦VD6ö÷&F–æFW7Ò#ãÂ÷öÇ–Æ–æSæ¢"'ÒG·&÷f—6–öæÄÆ–æWÒG¶Ö&·7ÓÂ÷7fsãÇ6Æ73Ò&6†'BÖWV—fÆVçB#âG¶WV—fÆVçGÓÂ÷æ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$ÆVv7•G&VæG4æÇ—F–72†–ç7V7F–öç2ÂF–Ç•&V6÷&G2Â7F÷&vTÖöFR’°Ð¢–ç7V7F–öä†—7F÷'’Ò6æöæ–6Äf–æÆ—¦VD–ç7V7F–öç2†–ç7V7F–öç2“°Ð¢6öç7B7W'&VçE&ævRÒvWD–ç7V7F–öåvVVµ&ævR‡FöF”•4ôFFR‚’“°Ð¢6öç7B7W'&VçDvw&VvFRÒvw&VvFUvVV¶Ç”6ö×Æ–æ6R†F–Ç•&V6÷&G2Â7W'&VçE&ævRçvVVµ7F'DFFR“°Ð¢6öç7B†4f–æÆ—¦VD7W'&VçEvVV²Ò6÷'D–ç7V7F–öä†—7F÷'’†–ç7V7F–öç2’ç6öÖR‚†—FVÒ’Óâ—FVÒçvVVµ7F'DFFRÓÓÒ7W'&VçE&ævRçvVVµ7F'DFFRbb—FVÒæf–æÆ—¦VDB“°Ð¢6öç7B&÷f—6–öæÂÒ7W'&VçDvw&VvFRæ6÷VçG2æ76W76VDö'6W'fF–öç2âbb†4f–æÆ—¦VD7W'&VçEvVV²ò7W'&VçDvw&VvFR¢çVÆÃ°Ð¢6öç7BG&¦V7F÷'’ÒFW&—fUG&¦V7F÷'•7FFR†–ç7V7F–öä†—7F÷'’“°Ð¢6öç7BFöÖ–åG&VæG2Ò6Æ7VÆFTFöÖ–åG&VæG2†–ç7V7F–öä†—7F÷'’“°Ð¢6öç7B7G&V·2Ò6Æ7VÆFT6ö×Æ–æ6U7G&V·2†F–Ç•&V6÷&G2ÂFöF”•4ôFFR‚’“°Ð¢6öç7B7VÖÖ'’Ò7VÖÖ&—¦T–ç7V7F–öä†—7F÷'’†–ç7V7F–öä†—7F÷'’“°Ð¢6öç7B6†'E6W&–W2Ò'V–ÆD6†'E6W&–W2†–ç7V7F–öä†—7F÷'’Â&÷f—6–öæÂ“°Ð¢6öç7B&W÷'BÒvVæW&FTFÆ5G&VæE&W÷'B‡²G&¦V7F÷'’ÂFöÖ–åG&VæG2Â7G&V·2Â7VÖÖ'’Â6†'E6W&–W2Ò“°Ð¢6WEFW‡B‚'G&¦V7F÷'’×7FGW2"ÂG&¦V7F÷'’ç7FFR“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&¦V7F÷'’×7FGW2"’æ6Æ74æÖRÒ7FFR×–ÆÂG·G&¦V7F÷'’ç7FFRÓÓÒ$”Õ$õd”är"ò&w&VVâ"¢G&¦V7F÷'’ç7FFRÓÓÒ$DT4Ä”ä”är"ò'&VB"¢G&¦V7F÷'’ç7FFRÓÓÒ$Ä”Ô•DTBUd”DTä4R"ò'–VÆÆ÷r"¢&æWWG&Â'Ö°Ð¢6WEFW‡B‚&æÇ—F–72×7F÷&vR"ÂG·7F÷&vTÖöFWÒäÅ•D”52(	BFW&—fVBÂæ÷B7F÷&VF“°Ð¢6WEFW‡B‚'G&VæB×7VÖÖ'’×G&¦V7F÷'’"ÂG&¦V7F÷'’ç7FFRÇÂ$”å5Tdd”4”TåB„•5Dõ%’"“°Ð¢6WEFW‡B‚'G&VæB×7VÖÖ'’×66÷&RÖ6†ævR"Â6–væVDF—7Æ’‡7VÖÖ'’ç66÷&T6†ævR’“°Ð¢6WEFW‡B‚'G&VæB×7VÖÖ'’ÖWf–FVæ6R"ÂG&¦V7F÷'’æfW&vTWf–FVæ6RÓÓÒçVÆÂò.(	B"¢G´ÖF‚ç&÷VæB‡G&¦V7F÷'’æfW&vTWf–FVæ6R—ÒV“°Ð¢6öç7BFöÖ–äE&—6²Ò&W÷'BæFöÖ–äE&—6²ÓÓÒ$æòFV6Æ–æ–ærFöÖ–âW7F&Æ—6†VBâ"ò.(	B"¢&W÷'BæFöÖ–äE&—6³°Ð¢6WEFW‡B‚'G&VæB×7VÖÖ'’ÖFöÖ–â"ÂFöÖ–äE&—6²“°Ð¢6WEFW‡B‚'G&VæB×7VÖÖ'’Ö6öç6—7FVæ7’"Â&W÷'Bæ6öç6—7FVæ7’ÇÂ.(	B"“°Ð¢6öç7Bv–æF÷tFFW2ÒG&¦V7F÷'’çv–æF÷ræÖ‚†—FVÒ’Óâ—FVÒçvVVµ7F'DFFR“°Ð¢6WEFW‡B‚'G&VæB×v–æF÷r"Âv–æF÷tFFW2æÆVæwF‚òf–æÆ—¦VBG&VæBv–æF÷s¢G·v–æF÷tFFW5³×ÒF‡&÷Vv‚G·v–æF÷tFFW2æB‚Ó—Ò‚G·v–æF÷tFFW2æÆVæwF‡Ò66÷&VBvVV·2’æ¢$æòf–æÆ—¦VB66÷&VBG&VæBv–æF÷rf–Æ&ÆRâ"“°Ð¢6WEFW‡B‚'G&VæBÖÆFW7B×66÷&R"Â7VÖÖ'’æÖ÷7E&V6VçDf–æÆ—¦VBòf÷&ÖDF—66—Æ–æU66÷&R‡7VÖÖ'’æÖ÷7E&V6VçDf–æÆ—¦VBç66÷&R’¢%Tå44õ$TB"“°Ð¢6WEFW‡B‚'G&VæBÖfW&vR×66÷&R"Âf÷&ÖDF—66—Æ–æU66÷&R‡7VÖÖ'’ç&V6VçDfW&vU66÷&R’“°Ð¢6WEFW‡B‚'G&VæB×66÷&RÖ6†ævR"Â6–væVDF—7Æ’‡7VÖÖ'’ç66÷&T6†ævR’“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6RÖ6†ævR"Â6–væVDF—7Æ’‡7VÖÖ'’æWf–FVæ6T6†ævR’“°Ð¢6WEFW‡B‚'G&VæBÖ&W7B×vVV²"Â7VÖÖ'’æ&W7EvVV²òG·7VÖÖ'’æ&W7EvVV²çvVVµ7F'DFFWÒòòG¶f÷&ÖDF—66—Æ–æU66÷&R‡7VÖÖ'’æ&W7EvVV²ç66÷&R—Ö¢.(	B"“°Ð¢6WEFW‡B‚'G&VæBÖÆ÷vW7B×vVV²"Â7VÖÖ'’æÆ÷vW7EvVV²òG·7VÖÖ'’æÆ÷vW7EvVV²çvVVµ7F'DFFWÒòòG¶f÷&ÖDF—66—Æ–æU66÷&R‡7VÖÖ'’æÆ÷vW7EvVV²ç66÷&R—Ö¢.(	B"“°Ð¢6WEFW‡B‚'G&VæBÖf–æÆ—¦VBÖ6÷VçB"Â7VÖÖ'’æf–æÆ—¦VD6÷VçB“°Ð¢6WEFW‡B‚'G&VæBÖ6ö×ÆWF–öâ×&FR"ÂçVÖ&W"æ—4f–æ—FR‡7VÖÖ'’ç&V6VçD–ç7V7F–öä6ö×ÆWF–öå&FR’òG´ÖF‚ç&÷VæB‡7VÖÖ'’ç&V6VçD–ç7V7F–öä6ö×ÆWF–öå&FR—ÒV¢.(	B"“°Ð¢6WEFW‡B‚&7W'&VçBÖ76W76VB×7G&V²"ÂG·7G&V·2æ7W'&VçD76W76VDF•7G&V·ÒF—6“°Ð¢6WEFW‡B‚&7W'&VçBÖgVÆÂ×7G&V²"ÂG·7G&V·2æ7W'&VçDgVÆÇ”76W76VDF•7G&V·ÒF—6“°Ð¢6WEFW‡B‚&ÆöævW7BÖ76W76VB×7G&V²"ÂG·7G&V·2æÆöævW7D76W76VDF•7G&V·ÒF—6“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖFöÖ–âÖw&–B"’æ–ææW$…DÔÂÒ4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’ÓâÆF—b6Æ73Ò'G&VæBÖFöÖ–âÖ6&BG¶FöÖ–åG&VæG5¶¶W•ÒæF—&V7F–öâçFôÆ÷vW$66R‚’ç&WÆ6TÆÂ‚""Â"Ò"—Ò#ãÇ7ãâG´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•×ÓÂ÷7ããÇ7G&öæsâG¶FöÖ–åG&VæG5¶¶W•ÒæF—&V7F–öçÓÂ÷7G&öæsãÇ6ÖÆÃâG¶FöÖ–åG&VæG5¶¶W•Òç6Æ÷RÓÓÒçVÆÂò$æò&VÆ–&ÆR6Æ÷R"¢G¶FöÖ–åG&VæG5¶¶W•Òç6Æ÷RçFôf—†VBƒ"—ÒG2÷vVV¶ÓÂ÷6ÖÆÃãÂöF—cæ’æ¦ö–â‚""“°Ð¢&VæFW%G&VæD6†'B‚&F—66—Æ–æR×G&VæBÖ6†'B"Â6†'E6W&–W2Â'66÷&R"Â%vVV¶Ç’F—66—Æ–æR66÷&R"“°Ð¢&VæFW%G&VæD6†'B‚&Wf–FVæ6R×G&VæBÖ6†'B"Â6†'E6W&–W2Â&Wf–FVæ6T6÷fW&vR"Â%vVV¶Ç’Wf–FVæ6R6÷fW&vR"“°Ð¢6WEFW‡B‚&FÆ2×G&VæB×&W÷'B"Â&W÷'BçFW‡B“°Ð¢&VæFW$6öÖÖæD6VçFW$÷fW'f–Wr†F–Ç•7FFRòWfÇVFU&VF–æW72†F–Ç•7FFR’¢çVÆÂÂvVV¶Ç”–ç7V7F–öâÇÂ·ÒÂG&¦V7F÷'’ç7FFR“°Ð¢&VæFW%&æµ6V7F–öâ‚“°Ð¢&VæFW%&Wf–Wt‡V"‚“°Ð§ÐÐ Ð¦gVæ7F–öâG&VæE&VfW&Væ6T¶W’‚’°Ð¢&WGW&â6ö6‚ÖFöÖ–æ–öã§G&VæG2×f–Ws¢G·6W76–öãòçW6W#òæ–BÇÂ&Æö6Â'Ö°Ð§ÐÐ Ð¦gVæ7F–öâÆöEG&VæE&VfW&Væ6W2‚’°Ð¢G'’°Ð¢6öç7B7F÷&VBÒ¥4ôâç'6R‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‡G&VæE&VfW&Væ6T¶W’‚’’ÇÂ&çVÆÂ"“°Ð¢–b‡G—VöbFöÖ–æ–öåG&VæG2ÓÒ'VæFVf–æVB"’G&VæE&ævTF—2ÒFöÖ–æ–öåG&VæG2ææ÷&ÖÆ—¦U&ævTF—2‡7F÷&VCòç&ævTF—2“°Ð¢G&VæD7F—fUf–WrÒ²&÷fW'f–Wr"Â'G&–æ–ær"Â'&V6÷fW'’"Â&gVVÂ"Â&&öG’%Òæ–æ6ÇVFW2‡7F÷&VCòçf–Wr’ò7F÷&VBçf–Wr¢&÷fW'f–Wr#°Ð¢G&VæD7F—fTÖWG&–2Ò²&F—66—Æ–æR"Â'7G&VæwF‚"Â'&VF–æW72"Â&gVVÂ"Â'vV–v‡B%Òæ–æ6ÇVFW2‡7F÷&VCòæÖWG&–2’ò7F÷&VBæÖWG&–2¢&F—66—Æ–æR#°Ð¢G&VæD&öG”ÖWG&–2Ò²'v—7B"Â&æV6²"Â&6†W7B"Â&†—2"Â&&Ò"Â'F†–v‚"Â&&öG•öfB%Òæ–æ6ÇVFW2‡7F÷&VCòæ&öG”ÖWG&–2’ò7F÷&VBæ&öG”ÖWG&–2¢'v—7B#°Ð¢Ò6F6‚…ò’°Ð¢G&VæE&ævTF—2Ò#ƒ°Ð¢G&VæD7F—fUf–WrÒ&÷fW'f–Wr#°Ð¢G&VæD7F—fTÖWG&–2Ò&F—66—Æ–æR#°Ð¢G&VæD&öG”ÖWG&–2Ò'v—7B#°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ6fUG&VæE&VfW&Væ6W2‚’°Ð¢G'’°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‡G&VæE&VfW&Væ6T¶W’‚’Â¥4ôâç7G&–æv–g’‡°Ð¢&ævTF—3¢G&VæE&ævTF—2ÀÐ¢f–Ws¢G&VæD7F—fUf–WrÀÐ¢ÖWG&–3¢G&VæD7F—fTÖWG&–2ÀÐ¢&öG”ÖWG&–3¢G&VæD&öG”ÖWG&–0Ð¢Ò’“°Ð¢Ò6F6‚…ò’·ÐÐ§ÐÐ Ð¦gVæ7F–öâG&VæDçWG&—F–öä†—7F÷'’‡&ævTF—2ÒƒB’°Ð¢6öç7B&÷w2ÒµÓ°Ð¢6öç7Bæ6†÷"ÒæWrFFR†G·FöF”•4ôFFR‚—ÕC#££¦“°Ð¢f÷"†ÆWBöfg6WBÒÖF‚æÖ‚ƒÂçVÖ&W"‡&ævTF—2ÇÂƒB’’Ò²öfg6WBãÒ²öfg6WBÓÒ’°Ð¢6öç7BFFRÒæWrFFR†æ6†÷"ævWEF–ÖR‚’Òöfg6WB¢ƒcC’çFô•4õ7G&–ær‚’ç6Æ–6RƒÂ“°Ð¢6öç7B&V6÷&BÒ'V–ÆDgVVÄF”ÆVFvW"†FFR’ç&V6÷&C°Ð¢–b‡&V6÷&B’&÷w2çW6‚‡&V6÷&B“°Ð¢ÐÐ¢&WGW&â&÷w3°Ð§ÐÐ Ð¦gVæ7F–öâG&VæDÖWG&–5fÇVR‡fÇVRÂ7Vff—‚Ò""’°Ð¢–b‡fÇVRÓÓÒçVÆÂÇÂfÇVRÓÓÒVæFVf–æVBÇÂçVÖ&W"æ—4f–æ—FR„çVÖ&W"‡fÇVR’’’&WGW&â.(	B#°Ð¢&WGW&âG·fÇVWÒG·7Vff—‡Ö°Ð§ÐÐ Ð¦gVæ7F–öâG&VæD6ö×7DçVÖ&W"‡fÇVR’°Ð¢6öç7BçVÖW&–2ÒçVÖ&W"‡fÇVR“°Ð¢–b‚çVÖ&W"æ—4f–æ—FR†çVÖW&–2’’&WGW&â"Ò#°Ð¢–b„ÖF‚æ'2†çVÖW&–2’ãÒ’&WGW&âG²†çVÖW&–2ò’çFôf—†VBƒ—ÔÖ°Ð¢–b„ÖF‚æ'2†çVÖW&–2’ãÒ’&WGW&âG²†çVÖW&–2ò’çFôf—†VBƒ—Ô¶°Ð¢&WGW&â7G&–ær„ÖF‚ç&÷VæB†çVÖW&–2’“°Ð§ÐÐ Ð¦gVæ7F–öâG&VæE6–væVEfÇVR‡fÇVRÂ7Vff—‚Ò""’°Ð¢6öç7BçVÖW&–2ÒçVÖ&W"‡fÇVR“°Ð¢–b‚çVÖ&W"æ—4f–æ—FR†çVÖW&–2’’&WGW&â$6ö×&—6öâ'V–ÆF–ær#°Ð¢&WGW&âG¶çVÖW&–2âò"²"¢"'ÒG´çVÖ&W"æ—4–çFVvW"†çVÖW&–2’òçVÖW&–2¢çVÖW&–2çFôf—†VBƒ—ÒG·7Vff—‡Ö°Ð§ÐÐ Ð¦gVæ7F–öâG&VæE6R‡fÇVR’°Ð¢6öç7B6V6öæG2ÒçVÖ&W"‡fÇVR“°Ð¢–b‚çVÖ&W"æ—4f–æ—FR‡6V6öæG2’ÇÂ6V6öæG2ÃÒ’&WGW&â"Ò#°Ð¢6öç7BF÷FÅ6V6öæG2ÒÖF‚ç&÷VæB‡6V6öæG2“°Ð¢6öç7BÖ–çWFW2ÒÖF‚æfÆö÷"‡F÷FÅ6V6öæG2òc“°Ð¢&WGW&âG¶Ö–çWFW7Ó¢Gµ7G&–ær‡F÷FÅ6V6öæG2Rc’çE7F'Bƒ"Â#"—Ö°Ð§ÐÐ Ð¦gVæ7F–öâG&VæE6W&–W4&'2‡6W&–W2ÒµÒÂ÷F–öç2Ò·Ò’°Ð¢6öç7Bö–çG2Ò‡6W&–W2ÇÂµÒ’æf–ÇFW"‚†—FVÒ’ÓâçVÖ&W"æ—4f–æ—FR„çVÖ&W"†—FVÒçfÇVR’’’ç6Æ–6R‚Ó"“°Ð¢–b‚ö–çG2æÆVæwF‚’&WGW&âsÆF—b6Æ73Ò'G&VæBÖ6†'BÖV×G’#ãÇ7G&öæså6–væÂæ÷BW7F&Æ—6†VCÂ÷7G&öæsãÇ7ãä¶VWÆövv–ærFòVæÆö6²F†—2G&¦V7F÷'’ãÂ÷7ããÂöF—câs°Ð¢6öç7BfÇVW2Òö–çG2æÖ‚†—FVÒ’ÓâçVÖ&W"†—FVÒçfÇVR’“°Ð¢6öç7Bf—†VDÖ–âÒçVÖ&W"æ—4f–æ—FR„çVÖ&W"†÷F–öç2æÖ–â’’òçVÖ&W"†÷F–öç2æÖ–â’¢çVÆÃ°Ð¢6öç7Bf—†VDÖ‚ÒçVÖ&W"æ—4f–æ—FR„çVÖ&W"†÷F–öç2æÖ‚’’òçVÖ&W"†÷F–öç2æÖ‚’¢çVÆÃ°Ð¢ÆWBÖ–âÒf—†VDÖ–âóòÖF‚æÖ–â‚ââçfÇVW2“°Ð¢ÆWBÖ‚Òf—†VDÖ‚óòÖF‚æÖ‚‚ââçfÇVW2“°Ð¢–b†Ö–âÓÓÒÖ‚’°Ð¢Ö–âÓÒÖF‚æÖ‚ƒÂÖF‚æ'2†Ö–â’¢ãB“°Ð¢Ö‚³ÒÖF‚æÖ‚ƒÂÖF‚æ'2†Ö‚’¢ãB“°Ð¢ÐÐ¢6öç7B7âÒÖ‚ÒÖ–âÇÂ°Ð¢6öç7BVæ—BÒ÷F–öç2çVæ—BÇÂ"#°Ð¢&WGW&âÆF—b6Æ73Ò'G&VæBÖ&'2"&öÆSÒ&–Ör"&–ÖÆ&VÃÒ"G¶W66T‡FÖÂ†÷F–öç2æÆ&VÂÇÂ%G&VæB"—Òg&öÒG¶W66T‡FÖÂ‡ö–çG5³ÒæFFR—ÒFòG¶W66T‡FÖÂ‡ö–çG2æB‚Ó’æFFR—Ò#àÐ¢G·ö–çG2æÖ‚†—FVÒ’Óâ°Ð¢6öç7BfÇVRÒçVÖ&W"†—FVÒçfÇVR“°Ð¢6öç7B†V–v‡BÒÖF‚æÖ‚ƒ‚ÂÖF‚æÖ–âƒÂ‚‡fÇVRÒÖ–â’ò7â’¢ƒ‚²‚’“°Ð¢&WGW&âÆF—b6Æ73Ò'G&VæBÖ&""7G–ÆSÒ"Ò×G&VæBÖ&#¢G¶†V–v‡GÒR#ãÆ“ãÂö“ãÇ7G&öæsâG¶W66T‡FÖÂ„çVÖ&W"æ—4–çFVvW"‡fÇVR’òfÇVR¢fÇVRçFôf—†VBƒ’—ÒG¶W66T‡FÖÂ‡Væ—B—ÓÂ÷7G&öæsãÇ7ãâG¶W66T‡FÖÂ†—FVÒæFFRç6Æ–6RƒR’—ÓÂ÷7ããÂöF—cæ°Ð¢Ò’æ¦ö–â‚""—ÐÐ¢ÂöF—cæ°Ð§ÐÐ Ð¦gVæ7F–öâG&VæE7&´&'2‡6W&–W2ÒµÒ’°Ð¢6öç7Bö–çG2Ò‡6W&–W2ÇÂµÒ’æf–ÇFW"‚†—FVÒ’ÓâçVÖ&W"æ—4f–æ—FR„çVÖ&W"†—FVÒçfÇVR’’’ç6Æ–6R‚Ór“°Ð¢–b‚ö–çG2æÆVæwF‚’&WGW&âsÇ7â6Æ73Ò'G&VæB×7&²V×G’#ãÂ÷7ãâs°Ð¢6öç7BfÇVW2Òö–çG2æÖ‚†—FVÒ’ÓâçVÖ&W"†—FVÒçfÇVR’“°Ð¢6öç7BÖ–âÒÖF‚æÖ–â‚ââçfÇVW2“°Ð¢6öç7BÖ‚ÒÖF‚æÖ‚‚ââçfÇVW2“°Ð¢6öç7B7âÒÖ‚ÒÖ–âÇÂ°Ð¢&WGW&âÇ7â6Æ73Ò'G&VæB×7&²"&–Ö†–FFVãÒ'G'VR#âG·ö–çG2æÖ‚†—FVÒ’ÓâÆ’7G–ÆSÒ"Ò×7&³¢G´ÖF‚æÖ‚ƒ‚Â‚„çVÖ&W"†—FVÒçfÇVR’ÒÖ–â’ò7â’¢ƒ"²‚—ÒR#ãÂö“æ’æ¦ö–â‚""—ÓÂ÷7ãæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%G&VæE&–Ö'”6†'B†ÖöFVÂÒG&VæDF6†&ö&DÖöFVÂ’°Ð¢6öç7BVÆVÖVçBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×&–Ö'’Ö6†'B"“°Ð¢6öç7BF—FÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖfö7W2×F—FÆR"“°Ð¢–b‚VÆVÖVçBÇÂF—FÆRÇÂÖöFVÂ’&WGW&ã°Ð¢6öç7B6öæf–w2Ò°Ð¢F—66—Æ–æS¢°Ð¢F—FÆS¢$F—66—Æ–æR"Â6W&–W3¢ÖöFVÂæF—66—Æ–æRç6W&–W2ÂVæ—C¢"R"ÂÖ–ã¢ÂÖƒ¢ÀÐ¢7VÖÖ'“¢µ²$7W'&VçB"ÂG&VæDÖWG&–5fÇVR†ÖöFVÂæF—66—Æ–æRçfÇVRÂ"R"•ÒÂ²$6†ævR"ÂÖöFVÂæF—66—Æ–æRæFVÇFÆ&VÅÒÂ²$Wf–FVæ6R"ÂG¶ÖöFVÂæF—66—Æ–æRæö'6W'fF–öç7Òf–æÆ—¦VBvVV·6ÕÐÐ¢ÒÀÐ¢7G&VæwFƒ¢°Ð¢F—FÆS¢%7G&VæwF‚v÷&¶ÆöB"Â6W&–W3¢ÖöFVÂçG&–æ–ærç7G&VæwF‚ç6W&–W2ÂVæ—C¢""ÂÖ–ã¢çVÆÂÂÖƒ¢çVÆÂÀÐ¢7VÖÖ'“¢µ²%v÷&²föÇVÖR"ÂG&VæD6ö×7DçVÖ&W"†ÖöFVÂçG&–æ–ærç7G&VæwF‚çföÇVÖR•ÒÂ²%g2&–÷""ÂG&VæE6–væVEfÇVR†ÖöFVÂçG&–æ–ærç7G&VæwF‚çföÇVÖTFVÇFÂ"R"•ÒÂ²$Wf–FVæ6R"ÂG¶ÖöFVÂçG&–æ–ærç7G&VæwF‚çv÷&µ6WG7Òv÷&²6WG6ÕÐÐ¢ÒÀÐ¢&VF–æW73¢°Ð¢F—FÆS¢%&V6÷fW'’VæW&w’"Â6W&–W3¢ÖöFVÂç&VF–æW72ç6W&–W2ÂVæ—C¢""ÂÖ–ã¢ÂÖƒ¢ÀÐ¢7VÖÖ'“¢µ²$ÆFW7BvB"ÂG&VæDÖWG&–5fÇVR†ÖöFVÂç&VF–æW72çfÇVRÂ"ó"•ÒÂ²%g2&–÷""ÂG&VæE6–væVEfÇVR†ÖöFVÂç&VF–æW72æFVÇF•ÒÂ²%7FFR"ÂÖöFVÂç&VF–æW72ç7FFUÕÐÐ¢ÒÀÐ¢gVVÃ¢°Ð¢F—FÆS¢$gVVÂF†W&Væ6R"Â6W&–W3¢ÖöFVÂæçWG&—F–öâç6W&–W2ÂVæ—C¢"R"ÂÖ–ã¢ÂÖƒ¢ÀÐ¢7VÖÖ'“¢µ²$–â&ævR"ÂG&VæDÖWG&–5fÇVR†ÖöFVÂæçWG&—F–öâçfÇVRÂ"R"•ÒÂ²$6÷fW&vR"ÂG&VæDÖWG&–5fÇVR†ÖöFVÂæçWG&—F–öâæ6÷fW&vRÂ"R"•ÒÂ²$Wf–FVæ6R"ÂG¶ÖöFVÂæçWG&—F–öâæWf–FVæ6TF—7Ò6ö×ÆWFRF—6ÕÐÐ¢ÒÀÐ¢vV–v‡C¢°Ð¢F—FÆS¢%vV–v‡B"Â6W&–W3¢ÖöFVÂçvV–v‡Bç6W&–W2ÂVæ—C¢""ÂÖ–ã¢çVÆÂÂÖƒ¢çVÆÂÀÐ¢7VÖÖ'“¢µ²$ÆFW7B"ÂG&VæDÖWG&–5fÇVR†ÖöFVÂçvV–v‡BçfÇVRÂ"Æ""•ÒÂ²#vBfW&vR"ÂG&VæDÖWG&–5fÇVR†ÖöFVÂçvV–v‡BæfW&vRÂ"Æ""•ÒÂ²%vVV¶Ç’&FR"ÂG&VæE6–væVEfÇVR†ÖöFVÂçvV–v‡BçvVV¶Ç•&FRÂ"Æ""•ÕÐÐ¢ÐÐ¢Ó°Ð¢6öç7B6öæf–rÒ6öæf–w5·G&VæD7F—fTÖWG&–5ÒÇÂ6öæf–w2æF—66—Æ–æS°Ð¢F—FÆRçFW‡D6öçFVçBÒ6öæf–rçF—FÆS°Ð¢VÆVÖVçBæ–ææW$…DÔÂÒG&VæE6W&–W4&'2†6öæf–rç6W&–W2Â²ââæ6öæf–rÂÆ&VÃ¢G¶6öæf–rçF—FÆWÒG&¦V7F÷'–Ò“°Ð¢6öç7B7VÖÖ'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖfö7W2×7VÖÖ'’"“°Ð¢–b‡7VÖÖ'’’7VÖÖ'’æ–ææW$…DÔÂÒ6öæf–rç7VÖÖ'’æÖ‚…¶Æ&VÂÂfÇVUÒ’ÓâÆF—cãÇ7ãâG¶W66T‡FÖÂ†Æ&VÂ—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡fÇVR—ÓÂ÷7G&öæsãÂöF—cæ’æ¦ö–â‚""“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×G&VæBÖÖWG&–5Ò"’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâç6WDGG&–'WFR‚&&–×&W76VB"Â'WGFöâæFF6WBçG&VæDÖWG&–2ÓÓÒG&VæD7F—fTÖWG&–2ò'G'VR"¢&fÇ6R"’“°Ð§ÐÐ Ð¦gVæ7F–öâ6WEG&VæEf–Wr‡f–WrÒ&÷fW'f–Wr"’°Ð¢G&VæD7F—fUf–WrÒ²&÷fW'f–Wr"Â'G&–æ–ær"Â'&V6÷fW'’"Â&gVVÂ"Â&&öG’%Òæ–æ6ÇVFW2‡f–Wr’òf–Wr¢&÷fW'f–Wr#°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×G&VæB×æUÒ"’æf÷$V6‚‚‡æR’Óâ²æRæ†–FFVâÒæRæFF6WBçG&VæEæRÓÒG&VæD7F—fUf–Ws²Ò“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×G&VæB×f–WuÒ"’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâç6WDGG&–'WFR‚&&–×6VÆV7FVB"Â'WGFöâæFF6WBçG&VæEf–WrÓÓÒG&VæD7F—fUf–Wrò'G'VR"¢&fÇ6R"’“°Ð¢6fUG&VæE&VfW&Væ6W2‚“°Ð§ÐÐ Ð¦gVæ7F–öâ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‡&öw&ÔÖöFVÂÒG&VæDF6†&ö&DÖöFVÂ’°Ð¢–b‡G—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢&WGW&âFöÖ–æ–öä&öG”6ö×÷6—F–öâæ'V–ÆD÷WF6öÖTÖöFVÂ‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢&ævTF—3¢G&VæE&ævTF—2ÀÐ¢W&f÷&Öæ6TVçG&–W2ÀÐ¢F–Ç•7FFW3¢ÖW&vU&VF–æW74†—7F÷'’‚’ÀÐ¢6öçG&7C¢&VD&÷fVE&V7'V—D6öçG&7B‚’ÇÂ·ÒÀÐ¢6–væÇ3¢°Ð¢F—66—Æ–æS¢&öw&ÔÖöFVÃòæF—66—Æ–æSòçfÇVRÀÐ¢çWG&—F–öã¢&öw&ÔÖöFVÃòæçWG&—F–öãòçfÇVRÀÐ¢7G&VæwF…6W76–öç3¢&öw&ÔÖöFVÃòçG&–æ–æsòç7G&VæwF…6W76–öç2ÇÂ Ð¢ÒÀÐ¢&–÷%&Wf–Ws¢&VD&öG”÷WF6öÖU&Wf–Wr‚Ð¢Ò“°Ð§ÐÐ Ð¦gVæ7F–öâ'V–ÆD7W'&VçE&öw&W75&Wf–Wr†÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚’Â&öw&ÔÖöFVÂÒG&VæDF6†&ö&DÖöFVÂ’°Ð¢–b‚÷WF6öÖRÇÂG—VöbFöÖ–æ–öå&öw&W75&Wf–WrÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢6öç7BÆFW7EvVV²ÒFD6Æ÷6VDÆö÷F—2‡FöF”•4ôFFR‚’ÂÓb“°Ð¢6öç7B&VF–æW75–âÒÖW&vU&VF–æW74†—7F÷'’‚’ç6öÖR‚†—FVÒ’Óâ—FVÒæFFRãÒÆFW7EvVV²bb—FVÒæFFRÃÒFöF”•4ôFFR‚’bb&ööÆVâ†—FVÒç–â’“°Ð¢6öç7BG&VæG2Ò&öw&ÔÖöFVÂÇÂ°Ð¢vV–v‡C¢²ö'6W'fF–öç3¢÷WF6öÖRçvV–v‡Còæö'6W'fF–öç2ÇÂÂ6†ævS¢÷WF6öÖRçvV–v‡Còæ6†ævRóòçVÆÂÒÀÐ¢çWG&—F–öã¢²Wf–FVæ6TF—3¢ÂfÇVS¢çVÆÂÒÀÐ¢G&–æ–æs¢²ö'6W'fF–öç3¢Â7G&VæwF…6W76–öç3¢Â7G&VæwF„FVÇF¢Â'Vå6W76–öç3¢Â'VäFVÇF¢çVÆÂÂF÷FÅ6W76–öäF—3¢ÒÀÐ¢&VF–æW73¢²ö'6W'fF–öç3¢ÂfÇVS¢çVÆÂÒÀÐ¢F—66—Æ–æS¢²ö'6W'fF–öç3¢ÂfÇVS¢çVÆÂÐÐ¢Ó°Ð¢&WGW&âFöÖ–æ–öå&öw&W75&Wf–Wræ'V–ÆE&öw&W75&Wf–Wr‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢6öçG&7C¢&VD&÷fVE&V7'V—D6öçG&7B‚’ÇÂ·ÒÀÐ¢&öG”÷WF6öÖS¢÷WF6öÖRÀÐ¢G&VæG2ÀÐ¢&VF–æW75–âÀÐ¢&–÷%&Wf–Ws¢&VE&öw&W75&Wf–Wr‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæD7W'&VçEÆç2‚’°Ð¢&WGW&â°Ð¢çWG&—F–öã¢G—Vöb7F—fTçWG&—F–öä&6VÆ–æRÓÓÒ&gVæ7F–öâ"ò7F—fTçWG&—F–öä&6VÆ–æR‡FöF”•4ôFFR‚’’¢çVÆÂÀÐ¢7G&VæwFƒ¢&VD&÷fVE7G&VæwF…Æâ‚’ÀÐ¢'Vææ–æs¢&VD&÷fVE'Vææ–æt&Æö6²‚’ÀÐ¢6÷&S¢&VD&÷fVD6÷&UÆâ‚Ð¢Ó°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæEÆç4f÷"†6öÖÖæBÒ·ÒÂW6U&÷÷6VBÒG'VR’°Ð¢6öç7BÆç2ÒÆä6öÖÖæD7W'&VçEÆç2‚“°Ð¢–b‚W6U&÷÷6VBÇÂ6öÖÖæCòæFöÖ–âÇÂ6öÖÖæBç&÷÷6VEÆâ’&WGW&âÆç3°Ð¢6öç7B¶W’Ò²åUE$•D”ôã¢&çWG&—F–öâ"Â5E$TäuDƒ¢'7G&VæwF‚"Â%Tää”äs¢''Vææ–ær"Â4õ$S¢&6÷&R"Õ¶6öÖÖæBæFöÖ–åÓ°Ð¢–b†¶W’’Æç5¶¶W•ÒÒ6öÖÖæBç&÷÷6VEÆã°Ð¢&WGW&âÆç3°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæD6ÆVæF%&Wf–Wr†6öÖÖæBÒ·ÒÂW6U&÷÷6VBÒG'VRÂvVVµ7F'BÒ6öÖÖæBæVffV7F—fTFFR’°Ð¢–b‚vVVµ7F'BÇÂG—VöbFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"ÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢6öç7BÆç2ÒÆä6öÖÖæEÆç4f÷"†6öÖÖæBÂW6U&÷÷6VB“°Ð¢6öç7BG&gBÒFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"æ'V–ÆEVæ–f–VEvVV²‡°Ð¢6öçG&7C¢&VD&÷fVE&V7'V—D6öçG&7B‚’ÀÐ¢7G&VæwF…Æã¢Æç2ç7G&VæwF‚ÀÐ¢'Vææ–æt&Æö6³¢Æç2ç'Vææ–ærÀÐ¢6÷&UÆã¢Æç2æ6÷&RÀÐ¢çWG&—F–öä&6VÆ–æS¢Æç2æçWG&—F–öàÐ¢ÒÂ°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢vVVµ7F'BÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢&WGW&âÇ”6öçG&7D7F—fF–öäwV&G2†G&gBÂvVVµ7F'B“°Ð§ÐÐ Ð¦gVæ7F–öâ'V–ÆD7W'&VçEÆä6öÖÖæB‡&Wf–WrÒ&VE&öw&W75&Wf–Wr‚’’°Ð¢–b‡G—VöbFöÖ–æ–öåÆä6öÖÖæBÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢6öç7B6öÖÖæBÒFöÖ–æ–öåÆä6öÖÖæBæ'V–ÆEÆä6öÖÖæB‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢&Wf–Ws¢&Wf–WrÇÂ·ÒÀÐ¢7W'&VçEÆç3¢Æä6öÖÖæD7W'&VçEÆç2‚’ÀÐ¢&–÷$6öÖÖæC¢&VEÆä6öÖÖæB‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð¢–b†6öÖÖæBç7FGW2ÓÒ$E$eB"’&WGW&â6öÖÖæC°Ð¢6öç7B&Wf–WrÒÆä6öÖÖæD6ÆVæF%&Wf–Wr†6öÖÖæBÂG'VRÂ6öÖÖæBæVffV7F—fTFFR“°Ð¢&WGW&â&Wf–WròFöÖ–æ–öåÆä6öÖÖæBçv—F„6ÆVæF%&Wf–Wr†6öÖÖæBÂ&Wf–Wr’¢6öÖÖæC°Ð§ÐÐ Ð¦gVæ7F–öâ'V–ÆD7W'&VçDö'6W'fF–öåfW&F–7B†6öÖÖæBÒ'V–ÆD7W'&VçEÆä6öÖÖæB‚’’°Ð¢–b‡G—VöbFöÖ–æ–öäö'6W'fF–öåfW&F–7BÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢6öç7B&–÷"Ò&VDö'6W'fF–öåfW&F–7B‚“°Ð¢&WGW&âFöÖ–æ–öäö'6W'fF–öåfW&F–7Bæ'V–ÆDö'6W'fF–öåfW&F–7B‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢6öÖÖæBÀÐ¢&–÷%fW&F–7C¢&–÷#òæ6öÖÖæD–BÓÓÒ6öÖÖæCòæ–Bò&–÷"¢çVÆÂÀÐ¢F–Ç•7FFW3¢ÖW&vU&VF–æW74†—7F÷'’‚’ÀÐ¢çWG&—F–öäF—3¢G&VæDçWG&—F–öä†—7F÷'’ƒ#’ÀÐ¢çWG&—F–öåF&vWG3¢7W'&VçDçWG&—F–öä&6UF&vWG2‡FöF”•4ôFFR‚’’ÀÐ¢W&f÷&Öæ6TVçG&–W2ÀÐ¢7G&VæwF„†—7F÷'“¢&VE7G&VæwF„†—7F÷'’‚’ÀÐ¢6÷&T†—7F÷'“¢&VD6÷&T†—7F÷'’‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð§ÐÐ Ð¦gVæ7F–öâö'6W'fF–öåfW&F–7EFöæR‡fW&F–7BÒ·Ò’°Ð¢–b‡fW&F–7BæFV6—6–öâÓÓÒ%$UD”â"ÇÂfW&F–7Bç&V6öÖÖVæFF–öâÓÓÒ%$UD”â"’&WGW&â'÷6—F—fR#°Ð¢–b‡fW&F–7BæFV6—6–öâÓÓÒ%$ôÄÄ$4²"ÇÂfW&F–7Bç&V6öÖÖVæFF–öâÓÓÒ%$ôÄÄ$4²"’&WGW&â&FævW"#°Ð¢&WGW&â'v&æ–ær#°Ð§ÐÐ Ð¦gVæ7F–öâö'6W'fF–öåfW&F–7DÖ&·W‡fW&F–7BÒ·ÒÂ6ö×7BÒfÇ6R’°Ð¢–b‚fW&F–7Còæ–BÇÂfW&F–7Bç7FGW2ÓÓÒ%t•D”är"’&WGW&â"#°Ð¢6öç7BFöæRÒö'6W'fF–öåfW&F–7EFöæR‡fW&F–7B“°Ð¢6öç7B&V6öÖÖVæFF–öâÒfW&F–7BæFV6—6–öâÇÂfW&F–7Bç&V6öÖÖVæFF–öã°Ð¢–b†6ö×7B’°Ð¢–b‡fW&F–7Bç7FGW2ÓÒ%$TE’"’&WGW&â"#°Ð¢&WGW&âÆ'F–6ÆR6Æ73Ò&ö'6W'fF–öâ×fW&F–7BÖ6&B6ö×7BG·FöæWÒ"FFÖö'6W'fF–öâ×7FFSÒ"G¶W66T‡FÖÂ‡fW&F–7Bç7FGW2—Ò#àÐ¢Æ†VFW#ãÇ7ãäDÄ2dU$D”5B+rG¶W66T‡FÖÂ‡fW&F–7BæFöÖ–â—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡fW&F–7Bæ6öæf–FVæ6SòæÆ&VÂÇÂ$ÄT$ä”är"—ÒUd”DTä4SÂ÷7G&öæsãÂö†VFW#àÐ¢Æƒ3âG¶W66T‡FÖÂ‡&V6öÖÖVæFF–öâÓÓÒ%$UD”â"ò$¶VWF†R6†ævR"¢&V6öÖÖVæFF–öâÓÓÒ%$ôÄÄ$4²"ò%&W7F÷&RF†R&–÷"Æâ"¢$ö'6W'fR6WfVâÖ÷&RF—2"—ÓÂöƒ3àÐ¢ÇâG¶W66T‡FÖÂ‡fW&F–7Bç&F–öæÆR—ÓÂ÷àÐ¢ÆF—b6Æ73Ò&ö'6W'fF–öâ×fW&F–7BÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FFÖö'6W'fF–öâ×fW&F–7B×&÷WFSÒ'G&VæG2#å&Wf–WrWf–FVæ6SÂö'WGFöããÂöF—càÐ¢Âö'F–6ÆSæ°Ð¢ÐÐ¢6öç7BÖWG&–72Ò‡fW&F–7BæÖWG&–72ÇÂµÒ’æÖ‚†—FVÒ’ÓâÆ'F–6ÆSàÐ¢Ç7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7ãàÐ¢ÆF—cãÇ6ÖÆÃä$Tdõ$SÂ÷6ÖÆÃãÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒæ&6VÆ–æR—ÓÂ÷7G&öæsãÂöF—càÐ¢Æ’&–Ö†–FFVãÒ'G'VR#î(i#Âö“àÐ¢ÆF—cãÇ6ÖÆÃäeDU#Â÷6ÖÆÃãÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒæö'6W'fVB—ÓÂ÷7G&öæsãÂöF—càÐ¢Âö'F–6ÆSæ’æ¦ö–â‚""“°Ð¢6öç7B&WV—&VÖVçG2Ò‡fW&F–7Bç&WV—&VÖVçG2ÇÂµÒ’æÖ‚†—FVÒ’ÓâÆÆ“âG¶W66T‡FÖÂ†—FVÒ—ÓÂöÆ“æ’æ¦ö–â‚""“°Ð¢6öç7BF—FÆRÒfW&F–7Bç7FGW2ÓÓÒ%$U4ôÅdTB Ð¢òG·fW&F–7BæFV6—6–öâÓÓÒ%$UD”â"ò$6†ævR&WF–æVB"¢%&–÷"Æâ&W7F÷&VB'Ö Ð¢¢fW&F–7Bç7FGW2ÓÓÒ$U…DTäDTB Ð¢òö'6W'fF–öâW‡FVæFVBFòG·fW&F–7BææW‡Dö'6W'fF–öäVæGÖ Ð¢¢fW&F–7Bç7FGW2ÓÓÒ%$TE’ Ð¢ò&V6öÖÖVæFF–öâÓÓÒ%$UD”â"ò%&WF–âF†R6†ævR"¢&V6öÖÖVæFF–öâÓÓÒ%$ôÄÄ$4²"ò%&öÆÂ&6²F†R6†ævR"¢$ö'6W'fR6WfVâÖ÷&RF—2 Ð¢¢fW&F–7Bç7FGW2ÓÓÒ%44„TETÄTB"òö'6W'fF–öâ7F'G2G·fW&F–7Bçv–æF÷w3òæö'6W'fF–öå7F'GÖ¢ö'6W'fF–öâ–â&öw&W76°Ð¢ÆWB7F–öç2Ò"#°Ð¢–b‡fW&F–7Bç7FGW2ÓÓÒ%$TE’"’°Ð¢7F–öç2ÒÆF—b6Æ73Ò&ö'6W'fF–öâ×fW&F–7BÖ7F–öç2#àÐ¢Æ'WGFöâG—SÒ&'WGFöâ"FFÖö'6W'fF–öâ×fW&F–7BÖ7F–öãÒ%$UD”â#å&WF–â6†ævSÂö'WGFöãàÐ¢Æ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FFÖö'6W'fF–öâ×fW&F–7BÖ7F–öãÒ$U…DTäB"G´çVÖ&W"‡fW&F–7BæW‡FVç6–öä6÷VçBÇÂ’ãÒ"ò&F—6&ÆVB"¢"'Óäö'6W'fRrÖ÷&RF—3Âö'WGFöãàÐ¢Æ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FFÖö'6W'fF–öâ×fW&F–7BÖ7F–öãÒ%$ôÄÄ$4²#å&öÆÂ&6³Âö'WGFöãàÐ¢ÂöF—cæ°Ð¢ÐÐ¢&WGW&âÆ'F–6ÆR6Æ73Ò&ö'6W'fF–öâ×fW&F–7BÖ6&BG·FöæWÒ"FFÖö'6W'fF–öâ×7FFSÒ"G¶W66T‡FÖÂ‡fW&F–7Bç7FGW2—Ò#àÐ¢Æ†VFW#ãÆF—cãÇ7ãäDÄ2ô%4U%dD”ôâdU$D”5B+rG¶W66T‡FÖÂ‡fW&F–7BæFöÖ–â—ÓÂ÷7ããÆƒ3âG¶W66T‡FÖÂ‡F—FÆR—ÓÂöƒ3ãÂöF—cãÇ7G&öæsâG¶W66T‡FÖÂ‡fW&F–7Bæ6öæf–FVæ6Sòç66÷&Róò—ÒRG¶W66T‡FÖÂ‡fW&F–7Bæ6öæf–FVæ6SòæÆ&VÂÇÂ$ÄT$ä”är"—ÓÂ÷7G&öæsãÂö†VFW#àÐ¢ÇâG¶W66T‡FÖÂ‡fW&F–7Bç&F–öæÆRÇÂ$FÆ2—26öÆÆV7F–ærF†R&W7VÇBöbF†R&÷fVB6†ævRâ"—ÓÂ÷àÐ¢ÆF—b6Æ73Ò&ö'6W'fF–öâ×fW&F–7B×v–æF÷r#ãÇ7ãä$Tdõ$R+rG¶W66T‡FÖÂ‡fW&F–7Bçv–æF÷w3òæ&6VÆ–æU7F'BÇÂ.(	B"—ÒDòG¶W66T‡FÖÂ‡fW&F–7Bçv–æF÷w3òæ&6VÆ–æTVæBÇÂ.(	B"—ÓÂ÷7ããÇ7ãäeDU"+rG¶W66T‡FÖÂ‡fW&F–7Bçv–æF÷w3òæö'6W'fF–öå7F'BÇÂ.(	B"—ÒDòG¶W66T‡FÖÂ‡fW&F–7Bçv–æF÷w3òæö'6W'fVEF‡&÷Vv‚ÇÂ.(	B"—ÓÂ÷7ããÂöF—càÐ¢ÆF—b6Æ73Ò&ö'6W'fF–öâ×fW&F–7BÖÖWG&–72#âG¶ÖWG&–77ÓÂöF—càÐ¢ÆF—b6Æ73Ò&ö'6W'fF–öâ×fW&F–7BÖWf–FVæ6R#ãÇ7G&öæsäWf–FVæ6R6†V6³Â÷7G&öæsãÇVÃâG·&WV—&VÖVçG7ÓÂ÷VÃãÂöF—càÐ¢G¶7F–öç7ÐÐ¢Æfö÷FW#ãÇ6ÖÆÃâG·&VDö'6W'fF–öåfW&F–7D†—7F÷'’‚’æÆVæwF‡ÒFV6—6–öâ&V6V—BG·&VDö'6W'fF–öåfW&F–7D†—7F÷'’‚’æÆVæwF‚ÓÓÒò""¢'2'ÓÂ÷6ÖÆÃãÇ6ÖÆÃäæòÆâ6†ævW2v—F†÷WB–÷W"FV6—6–öãÂ÷6ÖÆÃãÂöfö÷FW#àÐ¢Âö'F–6ÆSæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$ö'6W'fF–öåfW&F–7B‡F&vWD–BÂ6ö×7BÒfÇ6R’°Ð¢6öç7BF&vWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‡F&vWD–B“°Ð¢–b‚F&vWB’&WGW&ã°Ð¢6öç7BfW&F–7BÒ'V–ÆD7W'&VçDö'6W'fF–öåfW&F–7B‚“°Ð¢F&vWBæ–ææW$…DÔÂÒfW&F–7Bòö'6W'fF–öåfW&F–7DÖ&·W‡fW&F–7BÂ6ö×7B’¢"#°Ð¢F&vWBæ†–FFVâÒF&vWBæ–ææW$…DÔÃ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$ö'6W'fF–öåfW&F–7E7W&f6W2‚’°Ð¢&VæFW$ö'6W'fF–öåfW&F–7B‚'FöF’Öö'6W'fF–öâ×fW&F–7B"ÂG'VR“°Ð¢&VæFW$ö'6W'fF–öåfW&F–7B‚&&öG’Öö'6W'fF–öâ×fW&F–7B"“°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæEÆå7VÖÖ'’†FöÖ–âÂÆâÒ·Ò’°Ð¢–b†FöÖ–âÓÓÒ$åUE$•D”ôâ"’°Ð¢6öç7BF&vWG2ÒÆâç&V6÷fW'•F&vWG2ÇÂ·Ó°Ð¢&WGW&âÇ7G&öæsâG´ÖF‚ç&÷VæB„çVÖ&W"‡F&vWG2æ6Æ÷&–W2ÇÂ’—Ò¶6ÃÂ÷7G&öæsãÇ6ÖÆÃâG´ÖF‚ç&÷VæB„çVÖ&W"‡F&vWG2ç&÷FV–âÇÂ’—Ör&÷FV–â+rG´ÖF‚ç&÷VæB„çVÖ&W"‡F&vWG2æ6&'2ÇÂ’—Ör6&'3Â÷6ÖÆÃæ°Ð¢ÐÐ¢–b†FöÖ–âÓÓÒ%5E$TäuD‚"’°Ð¢6öç7B6WG2Ò‡Æâç6W76–öç2ÇÂµÒ’æfÆDÖ‚†—FVÒ’Óâ—FVÒæW†W&6—6W2ÇÂµÒ’ç&VGV6R‚‡7VÒÂ—FVÒ’Óâ7VÒ²çVÖ&W"†—FVÒç&V6öÖÖVæFVE6WG2ÇÂ’Â“°Ð¢&WGW&âÇ7G&öæsâG´çVÖ&W"‡Æâç&öf–ÆSòæF—5W%vVV²ÇÂÆâç6W76–öç3òæÆVæwF‚ÇÂ—ÒF—3Â÷7G&öæsãÇ6ÖÆÃâG·6WG7Òv÷&²6WG2+r&Wf—6–öâG´çVÖ&W"‡Æâç&Wf—6–öâÇÂ—ÓÂ÷6ÖÆÃæ°Ð¢ÐÐ¢–b†FöÖ–âÓÓÒ%%Tää”är"’°Ð¢6öç7BvVV²ÒÆâçvVV·3òå³ÒÇÂ·Ó°Ð¢&WGW&âÇ7G&öæsâG´çVÖ&W"‡vVV²çvVV¶Ç”F—7Fæ6RÇÂÆâæ&6VÆ–æTF—7Fæ6RÇÂ—ÒG¶W66T‡FÖÂ‡Æâç&öf–ÆSòç&VfW'&VEVæ—BÇÂ&Ö’"—ÓÂ÷7G&öæsãÇ6ÖÆÃâG´çVÖ&W"‡Æâç&öf–ÆSòç'Vææ–ætF—5W%vVV²ÇÂ—Ò'VâF—2+r&Æö6²G´çVÖ&W"‡Æâç&Wf—6–öâÇÂ—ÓÂ÷6ÖÆÃæ°Ð¢ÐÐ¢–b†FöÖ–âÓÓÒ$4õ$R"’°Ð¢&WGW&âÇ7G&öæsâG´çVÖ&W"‡Æâç&öf–ÆSòç6W76–öäÖ–çWFW2ÇÂ—ÒÖ–â÷6W76–öãÂ÷7G&öæsãÇ6ÖÆÃâG´çVÖ&W"‡Æâç&öf–ÆSòç6W76–öç5W%vVV²ÇÂ—Ò6W76–öç2÷vVV³Â÷6ÖÆÃæ°Ð¢ÐÐ¢&WGW&â#Ç7G&öæsä7W'&VçBÆãÂ÷7G&öæsâ#°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæE7FGW5FöæR‡7FGW2Ò""’°Ð¢–b…²%44„TETÄTB"Â$ô%4U%d”är"Â%$UD”äTB%Òæ–æ6ÇVFW2‡7FGW2’’&WGW&â'÷6—F—fR#°Ð¢–b…²$E$eB"Â%$Ud”UuôETR%Òæ–æ6ÇVFW2‡7FGW2’’&WGW&â'v&æ–ær#°Ð¢–b…²$$Äô4´TB"Â%$ôÄÄTEô$4²%Òæ–æ6ÇVFW2‡7FGW2’’&WGW&â&FævW"#°Ð¢&WGW&â&æWWG&Â#°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæDÖ&·W†6öÖÖæBÒ·ÒÂ6ö×7BÒfÇ6R’°Ð¢–b‚6öÖÖæCòæ–BÇÂ6öÖÖæBç7FGW2ÓÓÒ%t•D”är"’&WGW&â"#°Ð¢–b†6ö×7Bbb²$„TÄB"Â%$T¤T5DTB"Â%$UD”äTB"Â%$ôÄÄTEô$4²%Òæ–æ6ÇVFW2†6öÖÖæBç7FGW2’’&WGW&â"#°Ð¢6öç7BFöæRÒÆä6öÖÖæE7FGW5FöæR†6öÖÖæBç7FGW2“°Ð¢6öç7BFöÖ–âÒ7G&–ær†6öÖÖæBæFöÖ–âÇÂ%Äâ"’çFõWW$66R‚“°Ð¢–b†6ö×7B’°Ð¢6öç7B7F–öâÒ²$E$eB"Â$$Äô4´TB"Â%$Ud”UuôETR%Òæ–æ6ÇVFW2†6öÖÖæBç7FGW2Ð¢òsÆ'WGFöâG—SÒ&'WGFöâ"FF×ÆâÖ6öÖÖæB×&÷WFSÒ'G&VæG2#ä÷VâÆâFV6—6–öãÂö'WGFöãâpÐ¢¢6öÖÖæBç7FGW2ÓÓÒ$ô%4U%d”är Ð¢òsÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FF×ÆâÖ6öÖÖæBÖ7F–öãÒ%$ôÄÄ$4²#å&öÆÂ&6³Âö'WGFöãâpÐ¢¢"#°Ð¢&WGW&âÆ'F–6ÆR6Æ73Ò'ÆâÖ6öÖÖæBÖ6&B6ö×7BG·FöæWÒ"FF×ÆâÖ6öÖÖæB×7FFSÒ"G¶W66T‡FÖÂ†6öÖÖæBç7FGW2—Ò#àÐ¢Æ†VFW#ãÇ7ãâG¶W66T‡FÖÂ†FöÖ–â—ÒÄãÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†6öÖÖæBç7FGW2ç&WÆ6TÆÂ‚%ò"Â""’—ÓÂ÷7G&öæsãÂö†VFW#àÐ¢Æƒ3âG¶W66T‡FÖÂ†6öÖÖæBæ†VFÆ–æR—ÓÂöƒ3ãÇâG¶W66T‡FÖÂ†6öÖÖæBæFWF–Â—ÓÂ÷àÐ¢G¶7F–öâòÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ7F–öç2#âG¶7F–öçÓÂöF—cæ¢"'ÐÐ¢Âö'F–6ÆSæ°Ð¢ÐÐ¢6öç7B6ö×&—6öâÒ6öÖÖæBæ7W'&VçEÆâbb6öÖÖæBç&÷÷6VEÆâòÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ6ö×&R#àÐ¢Æ'F–6ÆSãÇ7ãä5U%$TåCÂ÷7ãâG·Æä6öÖÖæEÆå7VÖÖ'’†FöÖ–âÂ6öÖÖæBæ7W'&VçEÆâ—ÓÂö'F–6ÆSàÐ¢Æ’&–Ö†–FFVãÒ'G'VR#î(i#Âö“àÐ¢Æ'F–6ÆR6Æ73Ò'&÷÷6VB#ãÇ7ãå$õõ4TCÂ÷7ãâG·Æä6öÖÖæEÆå7VÖÖ'’†FöÖ–âÂ6öÖÖæBç&÷÷6VEÆâ—ÓÂö'F–6ÆSàÐ¢ÂöF—cæ¢"#°Ð¢6öç7B&Wf–WrÒ6öÖÖæBæ6ÆVæF%&Wf–WrÇÂ·Ó°Ð¢6öç7B&Æö6¶W'2Ò‡&Wf–Wræ6öæfÆ–7G2ÇÂµÒ’æf–ÇFW"‚†—FVÒ’Óâ—FVÒç6WfW&—G’ÓÓÒ$$Äô4´”är"“°Ð¢6öç7B6ÆVæF"Ò&Wf–WrçvVVµ7F'BòÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ6ÆVæF"G¶&Æö6¶W'2æÆVæwF‚ò&&Æö6¶VB"¢&6ÆV"'Ò#àÐ¢ÆF—cãÇ7ãääU…BtTT³Â÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf–WrçvVVµ7F'B—ÓÂ÷7G&öæsãÇ6ÖÆÃâG´çVÖ&W"‡&Wf–WrçG&–æ–ætF—2ÇÂ—ÒG&–æ–ærF—2+rG´çVÖ&W"‡&Wf–Wrç&V6÷fW'”F—2ÇÂ—Ò&V6÷fW'“Â÷6ÖÆÃãÂöF—càÐ¢ÆF—cãÇ7ãä4ÄTäD#Â÷7ããÇ7G&öæsâG¶&Æö6¶W'2æÆVæwF‚òG¶&Æö6¶W'2æÆVæwF‡Ò&Æö6¶W"G¶&Æö6¶W'2æÆVæwF‚ÓÓÒò""¢'2'Ö¢$4ÄT"'ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ†6öÖÖæBæ6†ævSòæ6ÆVæF"ÇÂ$æòÆ6VÖVçB6†ævR"—ÓÂ÷6ÖÆÃãÂöF—càÐ¢ÂöF—cæ¢"#°Ð¢6öç7B&Æö6¶W$Æ—7BÒ&Æö6¶W'2æÆVæwF‚òÆFWF–Ç26Æ73Ò'ÆâÖ6öÖÖæBÖ&Æö6¶W'2"÷VããÇ7VÖÖ'“å&W6öÇfR&Vf÷&R&÷fÃÂ÷7VÖÖ'“ãÇVÃâG¶&Æö6¶W'2æÖ‚†—FVÒ’ÓâÆÆ“âG¶W66T‡FÖÂ†—FVÒæFWF–ÂÇÂ—FVÒæ6öFR—ÓÂöÆ“æ’æ¦ö–â‚""—ÓÂ÷VÃãÂöFWF–Ç3æ¢"#°Ð¢ÆWB7F–öç2Ò"#°Ð¢–b†6öÖÖæBç7FGW2ÓÓÒ$E$eB"’°Ð¢7F–öç2ÒÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×ÆâÖ6öÖÖæBÖ7F–öãÒ$$õdR"G¶6öÖÖæBæ&÷fÄ&Æö6¶VBò&F—6&ÆVB"¢"'Óä&÷fRf÷"G¶W66T‡FÖÂ†6öÖÖæBæVffV7F—fTFFR—ÓÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×ÆâÖ6öÖÖæBÖ7F–öãÒ$„ôÄB#ä†öÆB7W'&VçBÆãÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FF×ÆâÖ6öÖÖæBÖ7F–öãÒ%$T¤T5B#å&V¦V7B6†ævSÂö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b†6öÖÖæBç7FGW2ÓÓÒ%44„TETÄTB"’°Ð¢7F–öç2ÒÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FF×ÆâÖ6öÖÖæBÖ7F–öãÒ%$ôÄÄ$4²#ä6æ6VÂ66†VGVÆVB6†ævSÂö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b†6öÖÖæBç7FGW2ÓÓÒ$ô%4U%d”är"’°Ð¢6öç7BF÷FÂÒC°Ð¢6öç7BVÆ6VBÒÖF‚æÖ‚ƒÂÖF‚æÖ–â‡F÷FÂÂÖF‚ç&÷VæB‚†æWrFFR†G·FöF”•4ôFFR‚—ÕC#££¦’ÒæWrFFR†G¶6öÖÖæBæVffV7F—fTFFWÕC#££¦’’òƒcC’²’“°Ð¢7F–öç2ÒÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖö'6W'fF–öâ#ãÇ7ãäô%4U%dD”ôãÂ÷7ããÇ7G&öæsäF’G¶VÆ6VGÒöbG·F÷FÇÓÂ÷7G&öæsãÆ“ãÆ"7G–ÆSÒ"Ò×ÆâÖö'6W'fF–öã¢G¶VÆ6VBòF÷FÂ¢ÒR#ãÂö#ãÂö“ãÂöF—cãÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FF×ÆâÖ6öÖÖæBÖ7F–öãÒ%$ôÄÄ$4²#å&öÆÂ&6²æ÷sÂö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b†6öÖÖæBç7FGW2ÓÓÒ%$Ud”UuôETR"’°Ð¢7F–öç2ÒsÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×ÆâÖ6öÖÖæB×&÷WFSÒ'G&VæG2#å&Wf–WrFÆ2fW&F–7CÂö'WGFöããÂöF—câs°Ð¢ÒVÇ6R–b†6öÖÖæBç7FGW2ÓÓÒ$$Äô4´TB"’°Ð¢7F–öç2ÒÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×ÆâÖ6öÖÖæB×&÷WFSÒ"G¶FöÖ–âÓÓÒ$åUE$•D”ôâ"ò&çWG&—F–öâ"¢'W&f÷&Öæ6R'Ò#ä÷VâG¶W66T‡FÖÂ†FöÖ–âçFôÆ÷vW$66R‚’—ÓÂö'WGFöããÂöF—cæ°Ð¢ÐÐ¢&WGW&âÆ'F–6ÆR6Æ73Ò'ÆâÖ6öÖÖæBÖ6&BG·FöæWÒ"FF×ÆâÖ6öÖÖæB×7FFSÒ"G¶W66T‡FÖÂ†6öÖÖæBç7FGW2—Ò#àÐ¢Æ†VFW#ãÆF—cãÇ7ãäDÄ2Äâ4ôÔÔäB+rG¶W66T‡FÖÂ†FöÖ–â—ÓÂ÷7ããÆƒ3âG¶W66T‡FÖÂ†6öÖÖæBæ†VFÆ–æR—ÓÂöƒ3ãÂöF—cãÇ7G&öæsâG¶W66T‡FÖÂ†6öÖÖæBç7FGW2ç&WÆ6TÆÂ‚%ò"Â""’—ÓÂ÷7G&öæsãÂö†VFW#àÐ¢ÇâG¶W66T‡FÖÂ†6öÖÖæBæFWF–Â—ÓÂ÷âG¶6ö×&—6öçÐÐ¢G¶6öÖÖæBæ6†ævRòÆF—b6Æ73Ò'ÆâÖ6öÖÖæBÖ6†ævR#ãÇ7ãäôäRÄUdU#Â÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†6öÖÖæBæ6†ævRæÆ&VÂ—ÓÂ÷7G&öæsãÇ6ÖÆÃäVffV7F—fRG¶W66T‡FÖÂ†6öÖÖæBæVffV7F—fTFFRÇÂ&gFW"&÷fÂ"—ÓÂ÷6ÖÆÃãÂöF—cæ¢"'ÐÐ¢G¶6ÆVæF'ÒG¶&Æö6¶W$Æ—7GÒG¶7F–öç7ÐÐ¢Æfö÷FW#ãÇ6ÖÆÃâG·&VEÆä6öÖÖæD†—7F÷'’‚’æÆVæwF‡Ò&–÷"FV6—6–öâG·&VEÆä6öÖÖæD†—7F÷'’‚’æÆVæwF‚ÓÓÒò""¢'2'ÓÂ÷6ÖÆÃãÇ6ÖÆÃå&Wf–Wr+r&÷fR+rö'6W'fR+r&WF–â÷"&öÆÂ&6³Â÷6ÖÆÃãÂöfö÷FW#àÐ¢Âö'F–6ÆSæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%Æä6öÖÖæB‡F&vWD–BÂ6ö×7BÒfÇ6R’°Ð¢6öç7BF&vWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‡F&vWD–B“°Ð¢–b‚F&vWB’&WGW&ã°Ð¢6öç7B6öÖÖæBÒ'V–ÆD7W'&VçEÆä6öÖÖæB‚“°Ð¢F&vWBæ–ææW$…DÔÂÒ6öÖÖæBòÆä6öÖÖæDÖ&·W†6öÖÖæBÂ6ö×7B’¢"#°Ð¢F&vWBæ†–FFVâÒF&vWBæ–ææW$…DÔÃ°Ð§ÐÐ Ð¦gVæ7F–öâÆä6öÖÖæDçWG&—F–öä–çWB‡ÆâÒ·ÒÂVffV7F—fTFFRÒÆâæVffV7F—fTFFR’°Ð¢6öç7B&V6÷fW'’ÒÆâç&V6÷fW'•F&vWG2ÇÂ·Ó°Ð¢6öç7BF§W7FÖVçG2ÒÆâçG&–æ–ætF§W7FÖVçG2ÇÂ·Ó°Ð¢&WGW&â°Ð¢vöÃ¢ÆâævöÂÇÂ$dEôÄõ52"ÀÐ¢VffV7F—fTFFRÀÐ¢6Æ÷&–W3¢&V6÷fW'’æ6Æ÷&–W2ÀÐ¢&÷FV–ã¢&V6÷fW'’ç&÷FV–âÀÐ¢6&'3¢&V6÷fW'’æ6&'2ÀÐ¢fC¢&V6÷fW'’æfBÀÐ¢G&–æ–æt6Æ÷&–W3¢çVÖ&W"†F§W7FÖVçG2æ6Æ÷&–W2ÇÂ’ÀÐ¢G&–æ–æt6&'3¢çVÖ&W"†F§W7FÖVçG2æ6&'2ÇÂÐ¢Ó°Ð§ÐÐ Ð¦gVæ7F–öâ&W&UÆä6öÖÖæDçWG&—F–öä&6VÆ–æR†6öÖÖæBÒ·Ò’°Ð¢–b†6öÖÖæBæFöÖ–âÓÒ$åUE$•D”ôâ"’&WGW&âçVÆÃ°Ð¢–b‡G—VöbFöÖ–æ–öäçWG&—F–öä&6VÆ–æRÓÓÒ'VæFVf–æVB"’F‡&÷ræWrW'&÷"‚$çWG&—F–öâ&6VÆ–æR6öçG&öÇ2&RVæf–Æ&ÆRâ"“°Ð¢6öç7B&÷÷6ÂÒFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ'V–ÆDçWG&—F–öä&6VÆ–æU&÷÷6Â‡Æä6öÖÖæDçWG&—F–öä–çWB†6öÖÖæBç&÷÷6VEÆâÂ6öÖÖæBæVffV7F—fTFFR’“°Ð¢–b‡&÷÷6Âç7FGW2ÓÒ%$TE’dõ"$õdÂ"’F‡&÷ræWrW'&÷"‡&÷÷6ÂæW'&÷'3òå³ÒÇÂ%F†R&÷÷6VBçWG&—F–öâ&6VÆ–æRF–Bæ÷B72—G26fVwV&G2â"“°Ð¢&WGW&âFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ&÷fTçWG&—F–öä&6VÆ–æR‡&÷÷6ÂÂ6öÖÖæBæ&÷fVDBÇÂæWrFFR‚’çFô•4õ7G&–ær‚’Â6öÖÖæBç&÷÷6VEÆãòæ–BÇÂÆâÖ6öÖÖæBÖçWG&—F–öã¢G¶6öÖÖæBæ–GÖ“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâW'6—7EÆä6öÖÖæDçWG&—F–öä&6VÆ–æR†&6VÆ–æRÒçVÆÂ’°Ð¢–b‚&6VÆ–æSòæ–B’&WGW&âçVÆÃ°Ð¢6öç7B†—7F÷'’Ò&VDçWG&—F–öä&6VÆ–æT†—7F÷'’‚“°Ð¢6öç7BæW‡BÒ¶&6VÆ–æRÂââæ†—7F÷'’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ&6VÆ–æRæ–B•Ó°Ð¢v—BW'6—7D÷WF6öÖTçWG&—F–öä†—7F÷'’†æW‡B“°Ð¢&WGW&â&6VÆ–æS°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ6öÖÖ—EÆä6öÖÖæD6ÆVæF"†6öÖÖæBÒ·ÒÂW6U&÷÷6VBÒG'VRÂvVVµ7F'BÒ6öÖÖæBæVffV7F—fTFFR’°Ð¢–b‡G—VöbFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"ÓÓÒ'VæFVf–æVB"’F‡&÷ræWrW'&÷"‚$6ÆVæF"6ö÷&F–æF–öâ—2Væf–Æ&ÆRâ"“°Ð¢6öç7BG&gBÒÆä6öÖÖæD6ÆVæF%&Wf–Wr†6öÖÖæBÂW6U&÷÷6VBÂvVVµ7F'B“°Ð¢–b‚G&gB’F‡&÷ræWrW'&÷"‚%F†RæW‡B÷W&F–ærvVV²6÷VÆBæ÷B&R'V–ÇBâ"“°Ð¢–b†G&gBæ&÷fÄ&Æö6¶VB’F‡&÷ræWrW'&÷"‚%&W6öÇfRF†R6ÆVæF"&Æö6¶W'2&Vf÷&R&÷f–ærF†—2Æâ6†ævRâ"“°Ð¢6öç7B†—7F÷'’Ò&VEVæ–f–VEvVV´†—7F÷'’‚“°Ð¢6öç7B&Wf–÷W2Ò†—7F÷'’æf–æB‚†—FVÒ’Óâ—FVÒç7FGW2ÓÒ%$UÄ4TB"bb—FVÒçvVVµ7F'BÓÓÒG&gBçvVVµ7F'B’ÇÂçVÆÃ°Ð¢6öç7B&÷fVBÒFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"æ&÷fUvVV²†G&gBÂ&Wf–÷W2Â²&÷fVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢6öç7BæW‡D†—7F÷'’ÒFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"æÖW&vT6öÖÖ—GFVEvVV²††—7F÷'’Â&÷fVB“°Ð¢6öç7B7G&VæwF…66†VGVÆRÒFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"ç7G&VæwF…66†VGVÆTg&öÕvVV²†&÷fVB“°Ð¢6fUvVV¶Ç”÷&6†W7G&F–öäÆö6Â‚$„•5Dõ%’"Â&7W'&VçB"ÂæW‡D†—7F÷'’“°Ð¢6fUvVV¶Ç”÷&6†W7G&F–öäÆö6Â‚%tTT²"Â&÷fVBçvVVµ7F'BÂ&÷fVB“°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%44„TETÄR"ÂVæ–f–VBÒG¶&÷fVBçvVVµ7F'GÖÂ7G&VæwF…66†VGVÆR“°Ð¢v—BW'6—7EvVV¶Ç”÷&6†W7G&F–öå7FFR‚%tTT²"Â&÷fVBçvVVµ7F'BÂ&÷fVB“°Ð¢v—BW'6—7EvVV¶Ç”÷&6†W7G&F–öå7FFR‚$„•5Dõ%’"Â&7W'&VçB"ÂæW‡D†—7F÷'’“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%44„TETÄR"ÂVæ–f–VBÒG¶&÷fVBçvVVµ7F'GÖÂ7G&VæwF…66†VGVÆR“°Ð¢–b‡&VEVæ–f–VEvVV´G&gB‚“òçvVVµ7F'BÓÓÒ&÷fVBçvVVµ7F'B’v—B6ÆV%vVV¶Ç”÷&6†W7G&F–öäG&gB‚“°Ð¢&WGW&â&÷fVC°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ7FvUÆä6öÖÖæB†6öÖÖæBÒ·Ò’°Ð¢6öç7BçWG&—F–öä&6VÆ–æRÒ&W&UÆä6öÖÖæDçWG&—F–öä&6VÆ–æR†6öÖÖæB“°Ð¢6öç7B6ÆVæF"Òv—B6öÖÖ—EÆä6öÖÖæD6ÆVæF"†6öÖÖæBÂG'VRÂ6öÖÖæBæVffV7F—fTFFR“°Ð¢–b†çWG&—F–öä&6VÆ–æR’v—BW'6—7EÆä6öÖÖæDçWG&—F–öä&6VÆ–æR†çWG&—F–öä&6VÆ–æR“°Ð¢&WGW&â°Ð¢ââæ6öÖÖæBÀÐ¢66†VGVÆVEÆä–C¢çWG&—F–öä&6VÆ–æSòæ–BÇÂ6öÖÖæBç&÷÷6VEÆãòæ–BÇÂçVÆÂÀÐ¢66†VGVÆVD6ÆVæF$–C¢6ÆVæF#òæ–BÇÂçVÆÂÀÐ¢6ÆVæF%&Wf–Ws¢6ÆVæF"ÇÂ6öÖÖæBæ6ÆVæF%&Wf–WpÐ¢Ó°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâÇ•Æä6öÖÖæEFôÖöGVÆR†6öÖÖæBÒ·Ò’°Ð¢6öç7BÆâÒ²âââ†6öÖÖæBç&÷÷6VEÆâÇÂ·Ò’Â&÷fVDC¢6öÖÖæBæ&÷fVDBÇÂæWrFFR‚’çFô•4õ7G&–ær‚’Â7F—fFVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ó°Ð¢–b†6öÖÖæBæFöÖ–âÓÓÒ$åUE$•D”ôâ"’°Ð¢ÆWB&6VÆ–æRÒ&VDçWG&—F–öä&6VÆ–æT†—7F÷'’‚’æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ6öÖÖæBç66†VGVÆVEÆä–BÇÂ—FVÒæ–BÓÓÒ6öÖÖæBç&÷÷6VEÆãòæ–B’ÇÂçVÆÃ°Ð¢–b‚&6VÆ–æR’&6VÆ–æRÒv—BW'6—7EÆä6öÖÖæDçWG&—F–öä&6VÆ–æR‡&W&UÆä6öÖÖæDçWG&—F–öä&6VÆ–æR†6öÖÖæB’“°Ð¢&WGW&â&6VÆ–æSòæ–BÇÂçVÆÃ°Ð¢ÐÐ¢–b†6öÖÖæBæFöÖ–âÓÓÒ%5E$TäuD‚"’°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢ÒVÇ6R–b†6öÖÖæBæFöÖ–âÓÓÒ%%Tää”är"’°Ð¢–b†6öÖÖæBæ7W'&VçEÆãòæ–B’v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&6†—fS¢G¶6öÖÖæBæ7W'&VçEÆâæ–GÖÂ6öÖÖæBæ7W'&VçEÆâ“°Ð¢6fU'Vææ–æt&Æö6´Æö6Â‚&7F—fR"ÂÆâ“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&7F—fR"ÂÆâ“°Ð¢ÒVÇ6R–b†6öÖÖæBæFöÖ–âÓÓÒ$4õ$R"’°Ð¢6fT6÷&U&öw&ÔÆö6Â‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$E$eB"Â&7W'&VçB"ÂÆâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$E$eB"Â&7W'&VçB"ÂÆâ“°Ð¢ÒVÇ6R°Ð¢F‡&÷ræWrW'&÷"‚%F†BÆâÖöGVÆR—2æ÷Bf–Æ&ÆRf÷"7F—fF–öââ"“°Ð¢ÐÐ¢&WGW&âÆâæ–BÇÂçVÆÃ°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&W7F÷&UÆä6öÖÖæDÖöGVÆR†6öÖÖæBÒ·Ò’°Ð¢6öç7BÆâÒ²âââ†6öÖÖæBæ7W'&VçEÆâÇÂ·Ò’Â&W7F÷&VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Â&W7F÷&VDg&öÕÆä6öÖÖæD–C¢6öÖÖæBæ–BÓ°Ð¢–b†6öÖÖæBæFöÖ–âÓÓÒ$åUE$•D”ôâ"’°Ð¢6öç7B†—7F÷'’Ò&VDçWG&—F–öä&6VÆ–æT†—7F÷'’‚“°Ð¢6öç7B66†VGVÆVD–BÒ6öÖÖæBç66†VGVÆVEÆä–BÇÂ6öÖÖæBç&÷÷6VEÆãòæ–C°Ð¢–b‡FöF”•4ôFFR‚’Â6öÖÖæBæVffV7F—fTFFR’°Ð¢6öç7BæW‡BÒ†—7F÷'’æÖ‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ66†VGVÆVD–Bò²ââæ—FVÒÂ7FGW3¢%$UdU%DTB"Â&WfW'FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò¢—FVÒ“°Ð¢v—BW'6—7D÷WF6öÖTçWG&—F–öä†—7F÷'’†æW‡B“°Ð¢&WGW&âÆâæ–BÇÂçVÆÃ°Ð¢ÐÐ¢–b‡G—VöbFöÖ–æ–öäçWG&—F–öä&6VÆ–æRÓÓÒ'VæFVf–æVB"’F‡&÷ræWrW'&÷"‚$çWG&—F–öâ&6VÆ–æR6öçG&öÇ2&RVæf–Æ&ÆRâ"“°Ð¢6öç7B&÷÷6ÂÒFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ'V–ÆDçWG&—F–öä&6VÆ–æU&÷÷6Â‡Æä6öÖÖæDçWG&—F–öä–çWB‡ÆâÂFöF”•4ôFFR‚’’“°Ð¢–b‡&÷÷6Âç7FGW2ÓÒ%$TE’dõ"$õdÂ"’F‡&÷ræWrW'&÷"‡&÷÷6ÂæW'&÷'3òå³ÒÇÂ%F†R&–÷"çWG&—F–öâ&6VÆ–æR6÷VÆBæ÷B&R&W7F÷&VBâ"“°Ð¢6öç7B&öÆÆ&6²ÒFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ&÷fTçWG&—F–öä&6VÆ–æR‡&÷÷6ÂÂæWrFFR‚’çFô•4õ7G&–ær‚’Â&öÆÆ&6³¢G¶6öÖÖæBæ–GÓ¢G·FöF”•4ôFFR‚—Ö“°Ð¢v—BW'6—7D÷WF6öÖTçWG&—F–öä†—7F÷'’…·&öÆÆ&6²Âââæ†—7F÷'’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ&öÆÆ&6²æ–B•Ò“°Ð¢&WGW&â&öÆÆ&6²æ–C°Ð¢ÐÐ¢–b‡FöF”•4ôFFR‚’Â6öÖÖæBæVffV7F—fTFFR’&WGW&âÆâæ–BÇÂçVÆÃ°Ð¢–b†6öÖÖæBæFöÖ–âÓÓÒ%5E$TäuD‚"’°Ð¢6fU7G&VæwF…7FFTÆö6Â‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢v—BW'6—7E7G&VæwF…G&–æ–æu7FFR‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢ÒVÇ6R–b†6öÖÖæBæFöÖ–âÓÓÒ%%Tää”är"’°Ð¢6fU'Vææ–æt&Æö6´Æö6Â‚&7F—fR"ÂÆâ“°Ð¢v—BW'6—7E'Vææ–æu7FFR‚%Äâ"Â&7F—fR"ÂÆâ“°Ð¢ÒVÇ6R–b†6öÖÖæBæFöÖ–âÓÓÒ$4õ$R"’°Ð¢6fT6÷&U&öw&ÔÆö6Â‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢6fT6÷&U&öw&ÔÆö6Â‚$E$eB"Â&7W'&VçB"ÂÆâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚%Äâ"Â&7W'&VçB"ÂÆâ“°Ð¢v—BW'6—7D6÷&U&öw&Õ7FFR‚$E$eB"Â&7W'&VçB"ÂÆâ“°Ð¢ÐÐ¢&WGW&âÆâæ–BÇÂçVÆÃ°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&öÆÆ&6µÆä6öÖÖæB†6öÖÖæBÒ·Ò’°Ð¢6öç7BÆä–BÒv—B&W7F÷&UÆä6öÖÖæDÖöGVÆR†6öÖÖæB“°Ð¢6öç7B&öÆÆ&6µvVV²ÒFöF”•4ôFFR‚’Â6öÖÖæBæVffV7F—fTFFPÐ¢ò6öÖÖæBæVffV7F—fTFFPÐ¢¢‡G—VöbFöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"ÓÓÒ'VæFVf–æVB"ò6öÖÖæBæVffV7F—fTFFR¢FöÖ–æ–öåvVV¶Ç”÷&6†W7G&F÷"çvVVµ7F'D—6ò‡FöF”•4ôFFR‚’’“°Ð¢6öç7B6ÆVæF"Òv—B6öÖÖ—EÆä6öÖÖæD6ÆVæF"†6öÖÖæBÂfÇ6RÂ&öÆÆ&6µvVV²“°Ð¢&WGW&âFöÖ–æ–öåÆä6öÖÖæBæ6ö×ÆWFTö'6W'fF–öâ†6öÖÖæBÂ%$ôÄÄ$4²"Â°Ð¢6Æ÷6VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢Æä–BÀÐ¢6ÆVæF$–C¢6ÆVæF#òæ–BÇÂçVÆÀÐ¢Ò“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ7F—fFTGVUÆä6öÖÖæB‚’°Ð¢–b‡G—VöbFöÖ–æ–öåÆä6öÖÖæBÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢ÆWB6öÖÖæBÒ&VEÆä6öÖÖæB‚“°Ð¢–b‚6öÖÖæCòæ–B’&WGW&âçVÆÃ°Ð¢6öç7B&Vg&W6†VBÒFöÖ–æ–öåÆä6öÖÖæBç&Vg&W6„Æ–fV7–6ÆR†6öÖÖæBÂFöF”•4ôFFR‚’“°Ð¢–b‚&Vg&W6†VB’&WGW&âçVÆÃ°Ð¢–b‡&Vg&W6†VBç7FGW2ÓÓÒ%44„TETÄTB"bbFöF”•4ôFFR‚’ãÒ&Vg&W6†VBæVffV7F—fTFFRbb&Vg&W6†VBæÆ–VDB’°Ð¢6öç7BÆä–BÒv—BÇ•Æä6öÖÖæEFôÖöGVÆR‡&Vg&W6†VB“°Ð¢6öÖÖæBÒFöÖ–æ–öåÆä6öÖÖæBæÖ&´Æ–VB‡&Vg&W6†VBÂ°Ð¢Æ–VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢Æä–BÀÐ¢6ÆVæF$–C¢&Vg&W6†VBç66†VGVÆVD6ÆVæF$–BÇÂ&Vg&W6†VBæ6ÆVæF%&Wf–Wsòæ–BÇÂçVÆÀÐ¢Ò“°Ð¢v—B6fUÆä6öÖÖæB†6öÖÖæB“°Ð¢&WGW&â6öÖÖæC°Ð¢ÐÐ¢–b‡&Vg&W6†VBç7FGW2ÓÒ6öÖÖæBç7FGW2’°Ð¢v—B6fUÆä6öÖÖæB‡&Vg&W6†VB“°Ð¢&WGW&â&Vg&W6†VC°Ð¢ÐÐ¢&WGW&â&Vg&W6†VC°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%Æä6öÖÖæE7W&f6W2‚’°Ð¢&VæFW%Æä6öÖÖæB‚'FöF’×ÆâÖ6öÖÖæB"ÂG'VR“°Ð¢&VæFW%Æä6öÖÖæB‚&&öG’×ÆâÖ6öÖÖæB"“°Ð¢&VæFW$ö'6W'fF–öåfW&F–7E7W&f6W2‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢&VæFW%FöF”6öÖÖ—GFVEvVV²‚“°Ð¢&VæFW%FöF”6öÖÖæE7W&f6R‚“°Ð¢&VæFW$F–Ç”76–væÖVçB‚“°Ð¢&VæFW$çWG&—F–öä6öÖÖæB‚“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‚“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ†æFÆTö'6W'fF–öåfW&F–7D7F–öâ†WfVçB’°Ð¢6öç7B&÷WFRÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖö'6W'fF–öâ×fW&F–7B×&÷WFUÒ"“°Ð¢–b‡&÷WFR’°Ð¢6WD7F—fU6V7F–öâ‚'G&VæG2"“°Ð¢6WEG&VæEf–Wr‚&&öG’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7G&VæG2"“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Öö'6W'fF–öâ×fW&F–7B"“òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°Ð¢&WGW&âG'VS°Ð¢ÐÐ¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖö'6W'fF–öâ×fW&F–7BÖ7F–öåÒ"“°Ð¢–b‚'WGFöâÇÂG—VöbFöÖ–æ–öäö'6W'fF–öåfW&F–7BÓÓÒ'VæFVf–æVB"ÇÂG—VöbFöÖ–æ–öåÆä6öÖÖæBÓÓÒ'VæFVf–æVB"’&WGW&âfÇ6S°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæö'6W'fF–öåfW&F–7D7F–öã°Ð¢ÆWB6öÖÖæBÒ'V–ÆD7W'&VçEÆä6öÖÖæB‚“°Ð¢6öç7BfW&F–7BÒ'V–ÆD7W'&VçDö'6W'fF–öåfW&F–7B†6öÖÖæB“°Ð¢–b‚6öÖÖæCòæ–BÇÂfW&F–7Còæ–B’F‡&÷ræWrW'&÷"‚$æòö'6W'fF–öâfW&F–7B—2&VG’â"“°Ð¢6öç7B&V6V—BÒFöÖ–æ–öäö'6W'fF–öåfW&F–7Bç&W6öÇfUfW&F–7B‡fW&F–7BÂ7F–öâÂ°Ð¢FV6–FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢W6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÀÐ¢Ò“°Ð¢–b†7F–öâÓÓÒ$U…DTäB"’°Ð¢6öÖÖæBÒ°Ð¢ââæ6öÖÖæBÀÐ¢7FGW3¢$ô%4U%d”är"ÀÐ¢ö'6W'fF–öäVæC¢&V6V—BææW‡Dö'6W'fF–öäVæBÀÐ¢W‡FVç6–öä6÷VçC¢&V6V—BæW‡FVç6–öä6÷VçBÀÐ¢W‡FVæFVDC¢&V6V—BæFV6–FVDBÀÐ¢Æ7Dö'6W'fF–öäFV6—6–öã¢$U…DTäB Ð¢Ó°Ð¢ÒVÇ6R–b†7F–öâÓÓÒ%$UD”â"’°Ð¢6öÖÖæBÒFöÖ–æ–öåÆä6öÖÖæBæ6ö×ÆWFTö'6W'fF–öâ†6öÖÖæBÂ%$UD”â"Â²6Æ÷6VDC¢&V6V—BæFV6–FVDBÒ“°Ð¢ÒVÇ6R°Ð¢6öÖÖæBÒv—B&öÆÆ&6µÆä6öÖÖæB†6öÖÖæB“°Ð¢ÐÐ¢6öç7B¶6öÖÖæE7–æ6VBÂfW&F–7E7–æ6VEÒÒv—B&öÖ—6RæÆÂ…·6fUÆä6öÖÖæB†6öÖÖæB’Â6fTö'6W'fF–öåfW&F–7B‡&V6V—B•Ò“°Ð¢&VæFW%Æä6öÖÖæE7W&f6W2‚“°Ð¢–b‡G&VæDæÇ—F–746öçFW‡B’&VæFW%G&VæG4æÇ—F–72‡G&VæDæÇ—F–746öçFW‡Bæ–ç7V7F–öç2ÂG&VæDæÇ—F–746öçFW‡BæF–Ç•&V6÷&G2ÂG&VæDæÇ—F–746öçFW‡Bç7F÷&vTÖöFR“°Ð¢6öç7BÖW76vRÒ7F–öâÓÓÒ$U…DTäB Ð¢òö'6W'fF–öâW‡FVæFVBF‡&÷Vv‚G·&V6V—BææW‡Dö'6W'fF–öäVæGÒâF†R&÷fVB6†ævR&VÖ–ç27F—fRæ Ð¢¢7F–öâÓÓÒ%$UD”â Ð¢ò%fW&F–7B&V6÷&FVBâF†Rö'6W'fVB6†ævR—2æ÷rF†R&WF–æVBÆââ Ð¢¢%fW&F–7B&V6÷&FVBâF†R&–÷"ÆâæB6ÆVæF"vW&R&W7F÷&VBâ#°Ð¢6öç7B7–æ4æ÷FRÒ6öÖÖæE7–æ6VBbbfW&F–7E7–æ6VBò"6fVBFò–÷W"66÷VçBâ"¢"6fVBöâF†—2FWf–6S²66÷VçB7–æ2v–ÆÂ&WG'’â#°Ð¢6WEFW‡B‚&ö'6W'fF–öâ×fW&F–7BÖfVVF&6²"ÂG¶ÖW76vWÒG·7–æ4æ÷FWÖ“°Ð¢6WEFW‡B‚'ÆâÖ6öÖÖæBÖfVVF&6²"ÂG¶ÖW76vWÒG·7–æ4æ÷FWÖ“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚&ö'6W'fF–öâ×fW&F–7BÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†Bö'6W'fF–öâFV6—6–öâ6÷VÆBæ÷B&R6ö×ÆWFVBâ"“°Ð¢Òf–æÆÇ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÐÐ¢&WGW&âG'VS°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ†æFÆUÆä6öÖÖæD7F–öâ†WfVçB’°Ð¢6öç7B&÷WFT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×ÆâÖ6öÖÖæB×&÷WFUÒ"“°Ð¢–b‡&÷WFT'WGFöâ’°Ð¢6öç7B&÷WFRÒ&÷WFT'WGFöâæFF6WBçÆä6öÖÖæE&÷WFS°Ð¢–b‡&÷WFRÓÓÒ'G&VæG2"’°Ð¢6WD7F—fU6V7F–öâ‚'G&VæG2"“°Ð¢6WEG&VæEf–Wr‚&&öG’"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7G&VæG2"“°Ð¢ÒVÇ6R–b‡&÷WFRÓÓÒ&çWG&—F–öâ"’°Ð¢6WD7F—fU6V7F–öâ‚&çWG&—F–öâ"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"6çWG&—F–öâ"“°Ð¢ÒVÇ6R°Ð¢6WD7F—fU6V7F–öâ‚'W&f÷&Öæ6R"“°Ð¢6öç7BFöÖ–âÒ7G&–ær†'V–ÆD7W'&VçEÆä6öÖÖæB‚“òæFöÖ–âÇÂ%5E$TäuD‚"’çFôÆ÷vW$66R‚“°Ð¢6WEW&f÷&Öæ6T7F—fUf–Wr†FöÖ–âÓÓÒ''Vææ–ær"ò''Vææ–ær"¢FöÖ–âÓÓÒ&6÷&R"ò&6÷&R"¢'FöF•÷G&–æ–ær"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"7W&f÷&Öæ6R"“°Ð¢ÐÐ¢&WGW&âG'VS°Ð¢ÐÐ¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×ÆâÖ6öÖÖæBÖ7F–öåÒ"“°Ð¢–b‚'WGFöâÇÂG—VöbFöÖ–æ–öåÆä6öÖÖæBÓÓÒ'VæFVf–æVB"’&WGW&âfÇ6S°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBçÆä6öÖÖæD7F–öã°Ð¢ÆWB6öÖÖæBÒ'V–ÆD7W'&VçEÆä6öÖÖæB‚“°Ð¢–b‚6öÖÖæCòæ–B’F‡&÷ræWrW'&÷"‚$æòÆâFV6—6–öâ—2&VG’â"“°Ð¢–b…²$$õdR"Â$„ôÄB"Â%$T¤T5B%Òæ–æ6ÇVFW2†7F–öâ’’°Ð¢6öÖÖæBÒFöÖ–æ–öåÆä6öÖÖæBç&W6öÇfUÆä6öÖÖæB†6öÖÖæBÂ7F–öâÂ²&W6öÇfVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÂW6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÒ“°Ð¢–b†7F–öâÓÓÒ$$õdR"’6öÖÖæBÒv—B7FvUÆä6öÖÖæB†6öÖÖæB“°Ð¢ÒVÇ6R–b†7F–öâÓÓÒ%$UD”â"’°Ð¢6öÖÖæBÒFöÖ–æ–öåÆä6öÖÖæBæ6ö×ÆWFTö'6W'fF–öâ†6öÖÖæBÂ%$UD”â"Â²6Æ÷6VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢ÒVÇ6R–b†7F–öâÓÓÒ%$ôÄÄ$4²"’°Ð¢6öÖÖæBÒv—B&öÆÆ&6µÆä6öÖÖæB†6öÖÖæB“°Ð¢ÐÐ¢6öç7B7–æ6VBÒv—B6fUÆä6öÖÖæB†6öÖÖæB“°Ð¢&VæFW%Æä6öÖÖæE7W&f6W2‚“°Ð¢6öç7BÖW76vRÒ6öÖÖæBç7FGW2ÓÓÒ%44„TETÄTB Ð¢òÆâæB6ÆVæF"&÷fVBf÷"G¶6öÖÖæBæVffV7F—fTFFWÒG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâF†R7W'&VçBÆâ&VÖ–ç27F—fRVçF–ÂF†Vâæ Ð¢¢6öÖÖæBç7FGW2ÓÓÒ%$ôÄÄTEô$4² Ð¢ò%F†R&–÷"ÆâæB6ÆVæF"vW&R&W7F÷&VBâF†RFV6—6–öâ&VÖ–ç2–â†—7F÷'’â Ð¢¢6öÖÖæBç7FGW2ÓÓÒ%$UD”äTB Ð¢ò%F†Rö'6W'fVB6†ævR—2æ÷rF†R&WF–æVBÆââ Ð¢¢$FV6—6–öâ6fVBâæòVæ&÷fVBÆâ6†ævRv2ÖFRâ#°Ð¢6WEFW‡B‚'ÆâÖ6öÖÖæBÖfVVF&6²"ÂÖW76vR“°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂÖW76vR“°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6¶–âÖfVVF&6²"ÂÖW76vR“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'ÆâÖ6öÖÖæBÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†BÆâFV6—6–öâ6÷VÆBæ÷B&R6ö×ÆWFVBâ"“°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†BÆâFV6—6–öâ6÷VÆBæ÷B&R6ö×ÆWFVBâ"“°Ð¢Òf–æÆÇ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÐÐ¢&WGW&âG'VS°Ð§ÐÐ Ð¦gVæ7F–öâ&öw&W75&Wf–WuFöæR‡&Wf–WrÒ·Ò’°Ð¢–b‡&Wf–Wræ6Æ76–f–6F–öâÓÓÒ$Edä4”är"ÇÂ&Wf–Wrç7FGW2ÓÓÒ$4ôäd•$ÔTB"’&WGW&â'÷6—F—fR#°Ð¢–b‡&Wf–Wræ6Æ76–f–6F–öâÓÓÒ%$Tu$U54”är"ÇÂ&Wf–Wrç7FGW2ÓÓÒ%$TE’"’&WGW&â'v&æ–ær#°Ð¢&WGW&â&æWWG&Â#°Ð§ÐÐ Ð¦gVæ7F–öâ&öw&W75&Wf–WtÖ&·W‡&Wf–WrÒ·ÒÂ6ö×7BÒfÇ6R’°Ð¢6öç7B6÷VçBÒÖF‚æÖ–â„çVÖ&W"‡&Wf–Wræ7–6ÆUF&vWBÇÂB’ÂçVÖ&W"‡&Wf–Wræ7–6ÆT6÷VçBÇÂ’“°Ð¢6öç7B&öw&W72ÒÖF‚æÖ–âƒÂ6÷VçBòçVÖ&W"‡&Wf–Wræ7–6ÆUF&vWBÇÂB’¢“°Ð¢–b…²$%T”ÄD”är"Â$Ôôä•Dõ$”är%Òæ–æ6ÇVFW2‡&Wf–Wrç7FGW2’’°Ð¢&WGW&âÆ'F–6ÆR6Æ73Ò'&öw&W72×&Wf–WrÖ6&BæWWG&ÂG¶6ö×7Bò&6ö×7B"¢"'Ò"FF×&öw&W72×&Wf–Wr×7FFSÒ"G¶W66T‡FÖÂ‡&Wf–Wrç7FGW2—Ò#àÐ¢Æ†VFW#ãÆF—cãÇ7ãâG¶W66T‡FÖÂ‡&Wf–WræÆ&VÂÇÂ$äU…B$Ud”Ur"—ÓÂ÷7ããÆƒ3âG¶W66T‡FÖÂ‡&Wf–Wræ†VFÆ–æRÇÂ$'V–ÆBF†R6–væÂ"—ÓÂöƒ3ãÂöF—cãÇ7G&öæsâG¶6÷VçGÒóCÂ÷7G&öæsãÂö†VFW#àÐ¢ÇâG¶W66T‡FÖÂ‡&Wf–WræFWF–ÂÇÂ$f÷W"6ö×&&ÆR6†V6·ö–çG2VæÆö6²F†R&Wf–Wrâ"—ÓÂ÷àÐ¢ÆF—b6Æ73Ò'&öw&W72×&Wf–WrÖ&""&–ÖÆ&VÃÒ"G¶6÷VçGÒöbB6†V6·ö–çG2#ãÇ7â7G–ÆSÒ"Ò×&öw&W72×&Wf–Ws¢G·&öw&W77ÒR#ãÂ÷7ããÂöF—càÐ¢Æfö÷FW#ãÇ6ÖÆÃäæW‡B6†V6·ö–çBG¶W66T‡FÖÂ‡&Wf–WrææW‡D6†V6´–äFFRÇÂ'FöF’"—ÓÂ÷6ÖÆÃãÇ6ÖÆÃäæòÆâ6†ævW3Â÷6ÖÆÃãÂöfö÷FW#àÐ¢Âö'F–6ÆSæ°Ð¢ÐÐ¢6öç7B&V6öÖÖVæFF–öâÒ&Wf–Wrç&V6öÖÖVæFF–öâÇÂ·Ó°Ð¢6öç7B6–væÇ2Ò‡&Wf–Wrç6–væÃòç6–væÇ2ÇÂµÒ’ç6Æ–6RƒÂ6ö×7Bò2¢b“°Ð¢6öç7B6–væÄÖ&·WÒ6–væÇ2æÆVæwF‚òÆF—b6Æ73Ò'&öw&W72×&Wf–Wr×6–væÇ2#âG·6–væÇ2æÖ‚†—FVÒ’ÓâÆF—cãÇ7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒçfÇVR—ÓÂ÷7G&öæsãÂöF—cæ’æ¦ö–â‚""—ÓÂöF—cæ¢"#°Ð¢6öç7B6†V6·2Ò‡&Wf–WræWf–FVæ6Sòæ6†V6·2ÇÂµÒ’æÖ‚†—FVÒ’ÓâÆÆ’6Æ73Ò"G¶—FVÒç72ò'72"¢&†öÆB'Ò#ãÇ7ãâG¶—FVÒç72ò.)É2"¢.(	B'ÓÂ÷7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂöÆ“æ’æ¦ö–â‚""“°Ð¢6öç7BWf–FVæ6RÒ6ö×7BÇÂ6†V6·2ò""¢ÆFWF–Ç26Æ73Ò'&öw&W72×&Wf–WrÖWf–FVæ6R#ãÇ7VÖÖ'“äWf–FVæ6RG´çVÖ&W"‡&Wf–WræWf–FVæ6Sòç66÷&RÇÂ—ÒR+rG¶W66T‡FÖÂ‡&Wf–WræWf–FVæ6SòæÆ&VÂÇÂ$ÄT$ä”är"—ÓÂ÷7VÖÖ'“ãÇVÃâG¶6†V6·7ÓÂ÷VÃãÂöFWF–Ç3æ°Ð¢ÆWB7F–öç2Ò"#°Ð¢–b‡&Wf–Wrç7FGW2ÓÓÒ%$TE’"’°Ð¢7F–öç2Ò6ö×7@Ð¢òsÆF—b6Æ73Ò'&öw&W72×&Wf–WrÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×&öw&W72×&Wf–Wr×&÷WFSÒ'G&VæG2#å&Wf–WrF†R6ö6†–ær6ÆÃÂö'WGFöããÂöF—câpÐ¢¢ÆF—b6Æ73Ò'&öw&W72×&Wf–WrÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×&öw&W72×&Wf–WrÖ7F–öãÒ$44UB#âG¶W66T‡FÖÂ‡&V6öÖÖVæFF–öâæÆ&VÂÇÂ$66WB&V6öÖÖVæFF–öâ"—ÓÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×&öw&W72×&Wf–WrÖ7F–öãÒ$„ôÄB#ä¶VW7W'&VçBÆãÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FF×&öw&W72×&Wf–WrÖ7F–öãÒ%$T54U55ôÄDU"#å&V76W72–ârF—3Âö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b‡&Wf–Wrç7FGW2ÓÓÒ$DTdU%$TB"’°Ð¢7F–öç2ÒÇ6Æ73Ò'&öw&W72×&Wf–WrÖwV&G&–Â#å&V÷Vç2G¶W66T‡FÖÂ‡&Wf–Wrç&V76W74FFRÇÂ&gFW"F†RæW‡B6†V6·ö–çB"—ÒãÂ÷æ°Ð¢ÒVÇ6R–b‡&Wf–Wrç7FGW2ÓÓÒ$4ôäd•$ÔTB"bb&V6öÖÖVæFF–öâç&WV—&W5Æä&÷fÂ’°Ð¢7F–öç2ÒÆF—b6Æ73Ò'&öw&W72×&Wf–WrÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FF×&öw&W72×&Wf–Wr×&÷WFSÒ"G¶W66T‡FÖÂ‡&V6öÖÖVæFF–öâç6V7F–öâÇÂ'G&VæG2"—Ò#ä÷VâG¶W66T‡FÖÂ‡&V6öÖÖVæFF–öâæFöÖ–âÇÂ'Æâ"—ÒFV6—6–öãÂö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b…²$4ôäd•$ÔTB"Â$„TÄB%Òæ–æ6ÇVFW2‡&Wf–Wrç7FGW2’’°Ð¢7F–öç2ÒÇ6Æ73Ò'&öw&W72×&Wf–WrÖwV&G&–Â#äFV6—6–öâ&V6÷&FVBâF†R&÷fVB6öçG&7BæBÆç2&VÖ–âWF†÷&—FF—fRãÂ÷æ°Ð¢ÐÐ¢&WGW&âÆ'F–6ÆR6Æ73Ò'&öw&W72×&Wf–WrÖ6&BG·&öw&W75&Wf–WuFöæR‡&Wf–Wr—ÒG¶6ö×7Bò&6ö×7B"¢"'Ò"FF×&öw&W72×&Wf–Wr×7FFSÒ"G¶W66T‡FÖÂ‡&Wf–Wrç7FGW2ÇÂ%$TE’"—Ò#àÐ¢Æ†VFW#ãÆF—cãÇ7ãäDÄ2$ôu$U52$Ud”UsÂ÷7ããÆƒ3âG¶W66T‡FÖÂ‡&Wf–Wræ†VFÆ–æRÇÂ%&öw&W72&Wf–Wr"—ÓÂöƒ3ãÂöF—cãÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf–Wrç7FGW2ÓÓÒ%$TE’"ò&Wf–Wræ6Æ76–f–6F–öâ¢&Wf–Wrç7FGW2—ÓÂ÷7G&öæsãÂö†VFW#àÐ¢ÆF—b6Æ73Ò'&öw&W72×&Wf–WrÖ6ÆÂ#ãÇ7ãäôäR4ô4„”är4ÄÃÂ÷7ããÆƒCâG¶W66T‡FÖÂ‡&V6öÖÖVæFF–öâæ†VFÆ–æRÇÂ&Wf–WræFWF–ÂÇÂ$†öÆBF†R&÷fVBÆâ"—ÓÂöƒCãÇâG¶W66T‡FÖÂ‡&V6öÖÖVæFF–öâæFWF–ÂÇÂ&Wf–WræFWF–ÂÇÂ$FÆ2—2Ööæ—F÷&–ærF†RæW‡BWf–FVæ6Rv–æF÷râ"—ÓÂ÷ãÂöF—càÐ¢G·6–væÄÖ&·WÒG¶Wf–FVæ6WÒG¶7F–öç7ÐÐ¢Æfö÷FW#ãÇ6ÖÆÃâG¶W66T‡FÖÂ‡&Wf–Wrç6÷W&6Tf—'7DFFRÇÂ.(	B"—Ò(i"G¶W66T‡FÖÂ‡&Wf–Wrç6÷W&6TÆFW7DFFRÇÂ.(	B"—ÓÂ÷6ÖÆÃãÇ6ÖÆÃâG·&VE&öw&W75&Wf–Wt†—7F÷'’‚’æÆVæwF‡Ò&–÷"FV6—6–öâG·&VE&öw&W75&Wf–Wt†—7F÷'’‚’æÆVæwF‚ÓÓÒò""¢'2'Ò+ræò6–ÆVçB6†ævW3Â÷6ÖÆÃãÂöfö÷FW#àÐ¢Âö'F–6ÆSæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%&öw&W75&Wf–Wr†÷WF6öÖRÂF&vWD–BÂ6ö×7BÒfÇ6R’°Ð¢6öç7BF&vWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‡F&vWD–B“°Ð¢–b‚F&vWBÇÂ÷WF6öÖRÇÂG—VöbFöÖ–æ–öå&öw&W75&Wf–WrÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B&Wf–WrÒ'V–ÆD7W'&VçE&öw&W75&Wf–Wr†÷WF6öÖR“°Ð¢–b‚&Wf–Wr’&WGW&ã°Ð¢F&vWBæ–ææW$…DÔÂÒ&öw&W75&Wf–WtÖ&·W‡&Wf–WrÂ6ö×7B“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&W6öÇfU&öw&W75&Wf–Wt7F–öâ†7F–öâ’°Ð¢–b‡G—VöbFöÖ–æ–öå&öw&W75&Wf–WrÓÓÒ'VæFVf–æVB"’&WGW&âfÇ6S°Ð¢6öç7B÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚“°Ð¢6öç7B7W'&VçBÒ'V–ÆD7W'&VçE&öw&W75&Wf–Wr†÷WF6öÖR“°Ð¢–b‚7W'&VçBÇÂ7W'&VçBç7FGW2ÓÒ%$TE’"’&WGW&âfÇ6S°Ð¢6öç7B&V6÷&BÒFöÖ–æ–öå&öw&W75&Wf–Wrç&W6öÇfU&öw&W75&Wf–Wr†7W'&VçBÂ7F–öâÂ°Ð¢&W6öÇfVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢W6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÀÐ¢Ò“°Ð¢–b†7F–öâÓÓÒ$44UB"bb7W'&VçBç&V6öÖÖVæFF–öãòç&WV—&W5Æä&÷fÂbb÷WF6öÖSòç&Wf–Wsòç7FGW2ÓÓÒ%$õõ4TB"bbG—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÒ'VæFVf–æVB"’°Ð¢6öç7BWF†÷&—¦VBÒFöÖ–æ–öä&öG”6ö×÷6—F–öâç&W6öÇfT÷WF6öÖU&Wf–Wr†÷WF6öÖRç&Wf–WrÂ$UD„õ$•¤Uõ$Ud”Ur"Â°Ð¢&W6öÇfVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢W6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÀÐ¢Ò“°Ð¢v—B6fT&öG”÷WF6öÖU&Wf–Wr†WF†÷&—¦VB“°Ð¢ÐÐ¢6öç7B7–æ6VBÒv—B6fU&öw&W75&Wf–Wr‡&V6÷&B“°Ð¢6öç7BæW‡D÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚“°Ð¢&VæFW%FöF”&öG”6†V6·ö–çB†æW‡D÷WF6öÖR“°Ð¢&VæFW$&öG”÷WF6öÖR†æW‡D÷WF6öÖR“°Ð¢6öç7BÖW76vRÒ7F–öâÓÓÒ$44UB"bb7W'&VçBç&V6öÖÖVæFF–öãòç&WV—&W5Æä&÷fÀÐ¢ò&Wf–WrWF†÷&—¦VBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâæòÆâ6†ævVC²F†R6W&FRÆâFV6—6–öâ—2&VG’&VÆ÷ræ Ð¢¢7F–öâÓÓÒ$44UB Ð¢ò&V6öÖÖVæFF–öâ6öæf—&ÖVBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâF†R&÷fVBÆâ&VÖ–ç27F—fRæ Ð¢¢7F–öâÓÓÒ%$T54U55ôÄDU" Ð¢ò%&Wf–WrFVfW'&VBf÷"6WfVâF—2âæòÆâ6†ævVBâ Ð¢¢$7W'&VçBÆâ†VÆBâFÆ2v–ÆÂ7F'BF†RæW‡BWf–FVæ6R7–6ÆRâ#°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂÖW76vR“°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6¶–âÖfVVF&6²"ÂÖW76vR“°Ð¢&WGW&âG'VS°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ†æFÆU&öw&W75&Wf–Wt7F–öâ†WfVçB’°Ð¢6öç7B7F–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×&öw&W72×&Wf–WrÖ7F–öåÒ"“°Ð¢–b†7F–öä'WGFöâ’°Ð¢7F–öä'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’²v—B&W6öÇfU&öw&W75&Wf–Wt7F–öâ†7F–öä'WGFöâæFF6WBç&öw&W75&Wf–Wt7F–öâ“²ÐÐ¢6F6‚†W'&÷"’²6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†B&öw&W72FV6—6–öâ6÷VÆBæ÷B&R6fVBâ"“²ÐÐ¢f–æÆÇ’²7F–öä'WGFöâæF—6&ÆVBÒfÇ6S²ÐÐ¢&WGW&âG'VS°Ð¢ÐÐ¢6öç7B&÷WFT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FF×&öw&W72×&Wf–Wr×&÷WFUÒ"“°Ð¢–b‡&÷WFT'WGFöâ’°Ð¢6öç7B6V7F–öâÒ&÷WFT'WGFöâæFF6WBç&öw&W75&Wf–Wu&÷WFRÇÂ'G&VæG2#°Ð¢–b‡6V7F–öâÓÓÒ'G&VæG2"’6WEG&VæEf–Wr‚&&öG’"“°Ð¢–b‡6V7F–öâÓÓÒ'W&f÷&Öæ6R"bb&VE&öw&W75&Wf–Wr‚“òç&V6öÖÖVæFF–öãòæFöÖ–âÓÓÒ%%Tää”är"’6WEW&f÷&Öæ6T7F—fUf–Wr‚''Vææ–ær"“°Ð¢6WD7F—fU6V7F–öâ‡6V7F–öâ“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â2G·6V7F–öçÖ“°Ð¢&WGW&âG'VS°Ð¢ÐÐ¢&WGW&âfÇ6S°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$&öG”ÖV7W&VÖVçD6†'B†÷WF6öÖR’°Ð¢6öç7B6†'BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’ÖÖV7W&VÖVçBÖ6†'B"“°Ð¢6öç7BF—FÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’ÖÖV7W&VÖVçB×F—FÆR"“°Ð¢–b‚6†'BÇÂF—FÆRÇÂ÷WF6öÖR’&WGW&ã°Ð¢6öç7BÖWG&–2Ò÷WF6öÖRæÖV7W&VÖVçG2ç7VÖÖ&–W5·G&VæD&öG”ÖWG&–5ÒÇÂ÷WF6öÖRæÖV7W&VÖVçG2ç7VÖÖ&–W2çv—7C°Ð¢F—FÆRçFW‡D6öçFVçBÒÖWG&–2æÆ&VÃ°Ð¢6öç7BVæ—BÒÖWG&–2æ¶W’ÓÓÒ&&öG•öfB"ò"R"¢"–â#°Ð¢6†'Bæ–ææW$…DÔÂÒG&VæE6W&–W4&'2†ÖWG&–2ç6W&–W2Â²Æ&VÃ¢G¶ÖWG&–2æÆ&VÇÒG&¦V7F÷'–ÂVæ—BÒ“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ&öG’ÖÖWG&–5Ò"’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâç6WDGG&–'WFR‚&&–×&W76VB"Â'WGFöâæFF6WBæ&öG”ÖWG&–2ÓÓÒÖWG&–2æ¶W’ò'G'VR"¢&fÇ6R"’“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$&öG”6†V6´–ä†—7F÷'’†÷WF6öÖR’°Ð¢6öç7B†—7F÷'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Ö6†V6¶–âÖ†—7F÷'’"“°Ð¢–b‚†—7F÷'’ÇÂ÷WF6öÖR’&WGW&ã°Ð¢6öç7B&÷w2Ò²ââæ÷WF6öÖRæÖV7W&VÖVçG2æ6†V6´–ç5Òç6÷'B‚†Â"’Óâ"æFFRæÆö6ÆT6ö×&R†æFFR’’ç6Æ–6RƒÂ‚“°Ð¢†—7F÷'’æ–ææW$…DÔÂÒ&÷w2æÆVæwF‚ò&÷w2æÖ‚†VçG'’’Óâ°Ð¢6öç7BfÇVW2ÒFöÖ–æ–öä&öG”6ö×÷6—F–öâäÔUE$”52æf–ÇFW"‚†ÖWG&–2’Óâö&¦V7Bæ†4÷vâ†VçG'’çfÇVW2ÂÖWG&–2æ¶W’’’æÖ‚†ÖWG&–2’Óâ°Ð¢6öç7BVæ—BÒÖWG&–2æ¶W’ÓÓÒ&&öG•öfB"ò"R"¢"–â#°Ð¢6öç7BW7F–ÖFVBÒÖWG&–2æ¶W’ÓÓÒ&&öG•öfB"bbVçG'’æ&öG”fDW7F–ÖFSòæW7F–ÖFVBò"W7Bâ"¢"#°Ð¢&WGW&âG¶ÖWG&–2æÆ&VÇÒG´çVÖ&W"†VçG'’çfÇVW5¶ÖWG&–2æ¶W•Ò’çFôf—†VBƒ’ç&WÆ6R‚õÂãBòÂ""—ÒG·Væ—GÒG¶W7F–ÖFVGÖ°Ð¢Ò“°Ð¢&WGW&âÆ'F–6ÆRFFÖ&öG’ÖVçG'’Ö–CÒ"G¶W66T‡FÖÂ†VçG'’æ–BÇÂ""—Ò#ãÆF—cãÇ7G&öæsâG¶W66T‡FÖÂ†VçG'’æFFR—ÓÂ÷7G&öæsãÇ7ãâG¶W66T‡FÖÂ‡fÇVW2æ¦ö–â‚"+r"’—ÓÂ÷7ããÂöF—cãÆF—cãÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FFÖ&öG’Ö6†V6¶–âÖVF—CÒ"G¶W66T‡FÖÂ†VçG'’æ–BÇÂ""—Ò#äVF—CÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FFÖ&öG’Ö6†V6¶–âÖFVÆWFSÒ"G¶W66T‡FÖÂ†VçG'’æ–BÇÂ""—Ò#äFVÆWFSÂö'WGFöããÂöF—cãÂö'F–6ÆSæ°Ð¢Ò’æ¦ö–â‚""’¢sÆF—b6Æ73Ò'G&VæBÖ6†'BÖV×G’#ãÇ7G&öæsäæò6†V6·ö–çG2–WCÂ÷7G&öæsãÇ7ãå&V6÷&BöæR6ö×&&ÆRvVV¶Ç’ÖV7W&VÖVçB6WBãÂ÷7ããÂöF—câs°Ð§ÐÐ Ð¦gVæ7F–öâ&öG”÷WF6öÖU&Wf–WtÖ&·W‡&Wf–WrÒ·ÒÂ6ö×7BÒfÇ6R’°Ð¢6öç7BFöæRÒ&Wf–Wrç7FGW2ÓÓÒ$UD„õ$•¤TB"ÇÂ&Wf–Wrç7FGW2ÓÓÒ$5U%$TåB Ð¢ò'÷6—F—fR Ð¢¢&Wf–Wrç7FGW2ÓÓÒ%$õõ4TB"ò'v&æ–ær"¢&æWWG&Â#°Ð¢ÆWB7F–öç2Ò"#°Ð¢–b‡&Wf–Wrç7FGW2ÓÓÒ%$õõ4TB"’°Ð¢7F–öç2ÒÆF—b6Æ73Ò&&öG’×&Wf–WrÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FFÖ&öG’×&Wf–WrÖ7F–öãÒ$UD„õ$•¤Uõ$Ud”Ur#äWF†÷&—¦R&Wf–WsÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FFÖ&öG’×&Wf–WrÖ7F–öãÒ$´TUô5U%$TåB#ä¶VW7W'&VçBÆãÂö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b‡&Wf–Wrç7FGW2ÓÓÒ$UD„õ$•¤TB"’°Ð¢6öç7BÆ&VÂÒ&Wf–WrææW‡E6V7F–öâÓÓÒ'G&VæG2"ò$÷VâÆâ&Wf–Wr"¢&Wf–WrææW‡E6V7F–öâÓÓÒ&çWG&—F–öâ"ò$÷VâgVVÂ&Wf–Wr"¢$÷VâG&–æ–ær&Wf–Wr#°Ð¢7F–öç2ÒÆF—b6Æ73Ò&&öG’×&Wf–WrÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FFÖ&öG’×&Wf–Wr×&÷WFSÒ"G¶W66T‡FÖÂ‡&Wf–WrææW‡E6V7F–öâÇÂ'G&VæG2"—Ò#âG¶Æ&VÇÓÂö'WGFöããÂöF—cæ°Ð¢ÐÐ¢6öç7B&öw&W72Ò&Wf–Wrç7FGW2ÓÓÒ$%T”ÄD”är Ð¢òÆF—b6Æ73Ò&&öG’×&Wf–Wr×&öw&W72"&–ÖÆ&VÃÒ"G´çVÖ&W"‡&Wf–Wræ6†V6·ö–çG2ÇÂ—ÒöbB6†V6·ö–çG2#ãÇ7â7G–ÆSÒ"ÒÖ&öG’×&Wf–Wr×&öw&W73¢G´ÖF‚æÖ–âƒÂçVÖ&W"‡&Wf–Wræ6†V6·ö–çG2ÇÂ’òB¢—ÒR#ãÂ÷7ããÂöF—cæ Ð¢¢"#°Ð¢&WGW&âÆ'F–6ÆR6Æ73Ò&&öG’×&Wf–WrÖ6&BG·FöæWÒG¶6ö×7Bò&6ö×7B"¢"'Ò#àÐ¢Æ†VFW#ãÆF—cãÇ7ãädõU"ÕtTT²$Ud”UsÂ÷7ããÆƒ3âG¶W66T‡FÖÂ‡&Wf–Wræ†VFÆ–æRÇÂ$'V–ÆF–ærF†R÷WF6öÖR6–væÂ"—ÓÂöƒ3ãÂöF—cãÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf–WræÆ&VÂÇÂ$%T”ÄD”är"—ÓÂ÷7G&öæsãÂö†VFW#àÐ¢ÇâG¶W66T‡FÖÂ‡&Wf–WræFWF–ÂÇÂ$f÷W"6ö×&&ÆRvVV¶Ç’6†V6·ö–çG2VæÆö6²F†Rf—'7B&Wf–Wrâ"—ÓÂ÷àÐ¢G·&öw&W77ÐÐ¢Æfö÷FW#ãÇ6ÖÆÃâG´çVÖ&W"‡&Wf–Wræ6†V6·ö–çG2ÇÂ—Ò6†V6·ö–çBG´çVÖ&W"‡&Wf–Wræ6†V6·ö–çG2ÇÂ’ÓÓÒò""¢'2'Ò+rG´çVÖ&W"‡&Wf–WræVÆ6VDF—2ÇÂ—ÒF—3Â÷6ÖÆÃãÇ6ÖÆÃäæò6–ÆVçBÆâ6†ævW3Â÷6ÖÆÃãÂöfö÷FW#àÐ¢G¶7F–öç7ÐÐ¢Âö'F–6ÆSæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$&öG”÷WF6öÖU&Wf–Wr†÷WF6öÖRÂF&vWD–BÂ6ö×7BÒfÇ6R’°Ð¢6öç7BF&vWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‡F&vWD–B“°Ð¢–b‚F&vWBÇÂ÷WF6öÖSòç&Wf–Wr’&WGW&ã°Ð¢F&vWBæ–ææW$…DÔÂÒ&öG”÷WF6öÖU&Wf–WtÖ&·W†÷WF6öÖRç&Wf–WrÂ6ö×7B“°Ð§ÐÐ Ð¦gVæ7F–öâ÷WF6öÖUÆå&VF–æW72‚’°Ð¢6öç7B7WFöfbÒFD6Æ÷6VDÆö÷F—2‡FöF”•4ôFFR‚’ÂÓb“°Ð¢6öç7B&÷w2ÒÖW&vU&VF–æW74†—7F÷'’‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæFFRãÒ7WFöfbbb—FVÒæFFRÃÒFöF”•4ôFFR‚’“°Ð¢6öç7BVæW&w’Ò&÷w2æÖ‚†—FVÒ’ÓâçVÖ&W"†—FVÒæVæW&w’’’æf–ÇFW"„çVÖ&W"æ—4f–æ—FR“°Ð¢&WGW&â°Ð¢fÇVS¢G&VæDF6†&ö&DÖöFVÃòç&VF–æW73òçfÇVRóò†VæW&w’æÆVæwF‚òVæW&w’ç&VGV6R‚‡7VÒÂfÇVR’Óâ7VÒ²fÇVRÂ’òVæW&w’æÆVæwF‚¢çVÆÂ’ÀÐ¢–ã¢&÷w2ç6öÖR‚†—FVÒ’Óâ&ööÆVâ†—FVÒç–â’Ð¢Ó°Ð§ÐÐ Ð¦gVæ7F–öâ'V–ÆD7W'&VçD÷WF6öÖUÆå&Wf—6–öâ†÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚’’°Ð¢–b‚÷WF6öÖRÇÂG—VöbFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢&WGW&âFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâæ'V–ÆE&÷÷6Â‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢÷WF6öÖRÀÐ¢÷WF6öÖU&Wf–Ws¢÷WF6öÖRç&Wf–WrÀÐ¢6öçG&7C¢&VD&÷fVE&V7'V—D6öçG&7B‚’ÇÂ·ÒÀÐ¢çWG&—F–öä&6VÆ–æS¢7F—fTçWG&—F–öä&6VÆ–æR‡FöF”•4ôFFR‚’’ÀÐ¢&VF–æW73¢÷WF6öÖUÆå&VF–æW72‚’ÀÐ¢&–÷%&Wf—6–öã¢&VD÷WF6öÖUÆå&Wf—6–öâ‚’ÀÐ¢vVæW&FVDC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ò“°Ð§ÐÐ Ð¦gVæ7F–öâ÷WF6öÖUÆåF&vWD6&G2‡ÆâÒ·Ò’°Ð¢6öç7B&V6÷fW'’ÒÆâç&V6÷fW'•F&vWG2ÇÂ·Ó°Ð¢6öç7BG&–æ–ærÒÆâçG&–æ–æuF&vWG2ÇÂ·Ó°Ð¢&WGW&âÆF—b6Æ73Ò&÷WF6öÖR×Æâ×F&vWG2#àÐ¢ÆF—cãÇ7ãå&V6÷fW'“Â÷7ããÇ7G&öæsâG´ÖF‚ç&÷VæB„çVÖ&W"‡&V6÷fW'’æ6Æ÷&–W2ÇÂ’—Ò¶6ÃÂ÷7G&öæsãÇ6ÖÆÃâG´ÖF‚ç&÷VæB„çVÖ&W"‡&V6÷fW'’ç&÷FV–âÇÂ’—Ör&÷FV–ãÂ÷6ÖÆÃãÂöF—càÐ¢ÆF—cãÇ7ãåG&–æ–æsÂ÷7ããÇ7G&öæsâG´ÖF‚ç&÷VæB„çVÖ&W"‡G&–æ–æræ6Æ÷&–W2ÇÂ’—Ò¶6ÃÂ÷7G&öæsãÇ6ÖÆÃâG´ÖF‚ç&÷VæB„çVÖ&W"‡G&–æ–ærç&÷FV–âÇÂ’—Ör&÷FV–ãÂ÷6ÖÆÃãÂöF—càÐ¢ÂöF—cæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$÷WF6öÖUÆå&Wf—6–öâ†÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚’’°Ð¢6öç7B÷WGWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&÷WF6öÖR×Æâ×&Wf—6–öâÖ÷WGWB"“°Ð¢6öç7B7FFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&÷WF6öÖR×Æâ×&Wf—6–öâ×7FFR"“°Ð¢–b‚÷WGWBÇÂ7FFRÇÂG—VöbFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B&Wf—6–öâÒ'V–ÆD7W'&VçD÷WF6öÖUÆå&Wf—6–öâ†÷WF6öÖR“°Ð¢–b‚&Wf—6–öâ’&WGW&ã°Ð¢7FFRçFW‡D6öçFVçBÒ&Wf—6–öâç7FGW2ç&WÆ6TÆÂ‚%ò"Â""“°Ð¢7FFRæ6Æ74æÖRÒ²%44„TETÄTB"Â$ô%4U%d”är"Â%$UD”äTB%Òæ–æ6ÇVFW2‡&Wf—6–öâç7FGW2’ò'÷6—F—fR"¢²$E$eB"Â%$Ud”UuôETR%Òæ–æ6ÇVFW2‡&Wf—6–öâç7FGW2’ò'v&æ–ær"¢&æWWG&Â#°Ð¢6öç7B6†V6·2Ò‡&Wf—6–öâæ–çfW7F–vF–öãòæ6†V6·2ÇÂµÒ’æÖ‚†—FVÒ’ÓâÆÆ’6Æ73Ò"G¶—FVÒç72ò'72"¢&†öÆB'Ò#ãÇ7ãâG¶—FVÒç72ò.)É2"¢.(	B'ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7G&öæsãÂöÆ“æ’æ¦ö–â‚""“°Ð¢6öç7B–çfW7F–vF–öâÒ6†V6·2òÆFWF–Ç26Æ73Ò&÷WF6öÖR×ÆâÖ–çfW7F–vF–öâ"G·&Wf—6–öâç7FGW2ÓÓÒ$„ôÄB"ò&÷Vâ"¢"'ÓãÇ7VÖÖ'“ä–çfW7F–vF–öâvFSÂ÷7VÖÖ'“ãÇVÃâG¶6†V6·7ÓÂ÷VÃãÂöFWF–Ç3æ¢"#°Ð¢ÆWB&öG’ÒÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖÖW76vR#ãÇ7ãâG¶W66T‡FÖÂ‡&Wf—6–öâæÆ&VÂÇÂ&Wf—6–öâç7FGW2—ÓÂ÷7ããÆƒCâG¶W66T‡FÖÂ‡&Wf—6–öâæ†VFÆ–æRÇÂ$÷WF6öÖR&Wf–Wr"—ÓÂöƒCãÇâG¶W66T‡FÖÂ‡&Wf—6–öâæFWF–ÂÇÂ$FÆ2—2&V6öæ6–Æ–ærF†R÷WF6öÖR6–væÂâ"—ÓÂ÷ãÂöF—cæ°Ð¢ÆWB7F–öç2Ò"#°Ð¢–b‡&Wf—6–öâç7FGW2ÓÓÒ$E$eB"’°Ð¢&öG’³ÒÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖ6ö×&R#àÐ¢Æ'F–6ÆSãÆ†VFW#ãÇ7ãä5U%$TåCÂ÷7ããÇ7G&öæsä&÷fVBçWG&—F–öãÂ÷7G&öæsãÂö†VFW#âG¶÷WF6öÖUÆåF&vWD6&G2‡&Wf—6–öâæ7W'&VçEÆâ—ÓÂö'F–6ÆSàÐ¢Æ’&–Ö†–FFVãÒ'G'VR#î(i#Âö“àÐ¢Æ'F–6ÆR6Æ73Ò'&÷÷6VB#ãÆ†VFW#ãÇ7ãå$õõ4TCÂ÷7ããÇ7G&öæsäöæRÆWfW"+rG·&Wf—6–öâç&÷÷6VEÆâæ6†ævRæ6Æ÷&–UW&6VçGÒRVæW&w“Â÷7G&öæsãÂö†VFW#âG¶÷WF6öÖUÆåF&vWD6&G2‡&Wf—6–öâç&÷÷6VEÆâ—ÓÇ6ÖÆÃå&÷FV–âVæ6†ævVB+rG&–æ–ærVæ6†ævVCÂ÷6ÖÆÃãÂö'F–6ÆSàÐ¢ÂöF—càÐ¢ÇVÂ6Æ73Ò&÷WF6öÖR×Æâ×&F–öæÆR#âG²‡&Wf—6–öâç&F–öæÆRÇÂµÒ’æÖ‚†—FVÒ’ÓâÆÆ“âG¶W66T‡FÖÂ†—FVÒ—ÓÂöÆ“æ’æ¦ö–â‚""—ÓÂ÷VÃàÐ¢ÆF—b6Æ73Ò&÷WF6öÖR×Æâ×v–æF÷r#ãÆF—cãÇ7ãäVffV7F—fSÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf—6–öâæVffV7F—fTFFR—ÓÂ÷7G&öæsãÂöF—cãÆF—cãÇ7ãäö'6W'fRF‡&÷VvƒÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf—6–öâæö'6W'fF–öäVæB—ÓÂ÷7G&öæsãÂöF—cãÂöF—cæ°Ð¢7F–öç2ÒÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ$$õdR#ä&÷fRf÷"æW‡BvVV³Âö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ$´TUô5U%$TåB#ä¶VW7W'&VçBÆãÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7B"FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ%$T54U55ôÄDU"#å&V76W72–ârF—3Âö'WGFöããÂöF—cæ°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ%44„TETÄTB"’°Ð¢&öG’³ÒÆF—b6Æ73Ò&÷WF6öÖR×Æâ×v–æF÷r#ãÆF—cãÇ7ãä7F—fFW3Â÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf—6–öâæVffV7F—fTFFR—ÓÂ÷7G&öæsãÂöF—cãÆF—cãÇ7ãäö'6W'fF–öâVæG3Â÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&Wf—6–öâæö'6W'fF–öäVæB—ÓÂ÷7G&öæsãÂöF—cãÂöF—cãÇ6Æ73Ò&÷WF6öÖR×ÆâÖwV&G&–Â#åF†R7W'&VçB&6VÆ–æR&VÖ–ç27F—fRVçF–ÂF†RVffV7F—fRFFRãÂ÷æ°Ð¢7F–öç2ÒsÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ%$ôÄÄ$4²#ä6æ6VÂ66†VGVÆVB&Wf—6–öãÂö'WGFöããÂöF—câs°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ$ô%4U%d”är"’°Ð¢6öç7BF÷FÂÒÖF‚æÖ‚ƒÂÖF‚ç&÷VæB‚†æWrFFR†G·&Wf—6–öâæö'6W'fF–öäVæGÕC#££¦’ÒæWrFFR†G·&Wf—6–öâæVffV7F—fTFFWÕC#££¦’’òƒcC’²“°Ð¢6öç7BVÆ6VBÒÖF‚æÖ‚ƒÂÖF‚æÖ–â‡F÷FÂÂÖF‚ç&÷VæB‚†æWrFFR†G·FöF”•4ôFFR‚—ÕC#££¦’ÒæWrFFR†G·&Wf—6–öâæVffV7F—fTFFWÕC#££¦’’òƒcC’²’“°Ð¢&öG’³ÒÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖö'6W'fF–öâ#ãÆF—cãÇ7ãäô%4U%dD”ôãÂ÷7ããÇ7G&öæsäF’G¶VÆ6VGÒöbG·F÷FÇÓÂ÷7G&öæsãÂöF—cãÆF—b6Æ73Ò&÷WF6öÖR×Æâ×&öw&W72#ãÇ7â7G–ÆSÒ"ÒÖ÷WF6öÖR×&öw&W73¢G¶VÆ6VBòF÷FÂ¢ÒR#ãÂ÷7ããÂöF—cãÇ6ÖÆÃä†öÆBWfW'’÷F†W"ÆâÆWfW"7FVG’F‡&÷Vv‚G¶W66T‡FÖÂ‡&Wf—6–öâæö'6W'fF–öäVæB—ÒãÂ÷6ÖÆÃãÂöF—cæ°Ð¢7F–öç2ÒsÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ%$ôÄÄ$4²#å&öÆÂ&6²æ÷sÂö'WGFöããÂöF—câs°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ%$Ud”UuôETR"’°Ð¢&öG’³ÒÇ6Æ73Ò&÷WF6öÖR×ÆâÖwV&G&–Â#åF†RBÖF’ö'6W'fF–öâv–æF÷r—26ö×ÆWFRâ&WF–âF†R&Wf—6–öâöæÇ’–bF†R÷WF6öÖRæB&V6÷fW'’&V6÷&B7W÷'B—BãÂ÷æ°Ð¢7F–öç2ÒsÆF—b6Æ73Ò&÷WF6öÖR×ÆâÖ7F–öç2#ãÆ'WGFöâG—SÒ&'WGFöâ"FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ%$UD”â#å&WF–â&Wf—6–öãÂö'WGFöããÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FFÖ÷WF6öÖR×ÆâÖ7F–öãÒ%$ôÄÄ$4²#å&öÆÂ&6³Âö'WGFöããÂöF—câs°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ$DTdU%$TB"’°Ð¢&öG’³ÒÇ6Æ73Ò&÷WF6öÖR×ÆâÖwV&G&–Â#äFÆ2v–ÆÂ&V÷VâF†—2&Wf–WröâG¶W66T‡FÖÂ‡&Wf—6–öâç&V76W74FFRÇÂ'F†RæW‡B6†V6·ö–çB"—ÒãÂ÷æ°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ$„TÄB"’°Ð¢&öG’³ÒsÇ6Æ73Ò&÷WF6öÖR×ÆâÖwV&G&–Â#åF†R7W'&VçBçWG&—F–öâæBG&–æ–ærÆç2&VÖ–âWF†÷&—FF—fRãÂ÷âs°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ%$UD”äTB"’°Ð¢&öG’³ÒsÇ6Æ73Ò&÷WF6öÖR×ÆâÖwV&G&–Â#åF†Rö'6W'fVB&Wf—6–öâ&VÖ–ç2F†R&÷fVBçWG&—F–öâ&6VÆ–æRâF†RFV6—6–öâ—2&W6W'fVB–â†—7F÷'’ãÂ÷âs°Ð¢ÒVÇ6R–b‡&Wf—6–öâç7FGW2ÓÓÒ%$UdU%DTB"’°Ð¢&öG’³ÒsÇ6Æ73Ò&÷WF6öÖR×ÆâÖwV&G&–Â#åF†R&–÷"&6VÆ–æRv2&W7F÷&VBæBF†R&Wf—6–öâ&VÖ–ç2–âF†RVF—B†—7F÷'’ãÂ÷âs°Ð¢ÐÐ¢÷WGWBæ–ææW$…DÔÂÒG¶&öG—ÒG¶–çfW7F–vF–öçÒG¶7F–öç7ÓÆfö÷FW#âG·&VD÷WF6öÖUÆå&Wf—6–öä†—7F÷'’‚’æÆVæwF‡Ò&–÷"FV6—6–öâG·&VD÷WF6öÖUÆå&Wf—6–öä†—7F÷'’‚’æÆVæwF‚ÓÓÒò""¢'2'Ò+röæRÆWfW"BF–ÖSÂöfö÷FW#æ°Ð§ÐÐ Ð¦gVæ7F–öâ÷WF6öÖTçWG&—F–öä&6VÆ–æT–çWB‡ÆâÒ·ÒÂVffV7F—fTFFR’°Ð¢6öç7B&V6÷fW'’ÒÆâç&V6÷fW'•F&vWG2ÇÂ·Ó°Ð¢6öç7BF§W7FÖVçG2ÒÆâçG&–æ–ætF§W7FÖVçG2ÇÂ·Ó°Ð¢&WGW&â°Ð¢vöÃ¢ÆâævöÂÇÂ$dEôÄõ52"ÀÐ¢VffV7F—fTFFRÀÐ¢6Æ÷&–W3¢&V6÷fW'’æ6Æ÷&–W2ÀÐ¢&÷FV–ã¢&V6÷fW'’ç&÷FV–âÀÐ¢6&'3¢&V6÷fW'’æ6&'2ÀÐ¢fC¢&V6÷fW'’æfBÀÐ¢G&–æ–æt6Æ÷&–W3¢çVÖ&W"†F§W7FÖVçG2æ6Æ÷&–W2ÇÂ’ÀÐ¢G&–æ–æt6&'3¢çVÖ&W"†F§W7FÖVçG2æ6&'2ÇÂÐ¢Ó°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâW'6—7D÷WF6öÖTçWG&—F–öä†—7F÷'’††—7F÷'’’°Ð¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ†çWG&—F–öä&6VÆ–æU7F÷&vT¶W’‚’Â¥4ôâç7G&–æv–g’††—7F÷'’’“°Ð¢6öç7B7–æ6VBÒv—BW'6—7DçWG&—F–öå7FFR‚$$4TÄ”äUô„•5Dõ%’"Â&7W'&VçB"Â²—FV×3¢†—7F÷'’Ò“°Ð¢²$Ô”åD”â"Â%U$dõ$Ôä4R"Â$dEôÄõ52%Òæf÷$V6‚‚†vöÄæÖR’Óâv–æF÷ræÆö6Å7F÷&vRç&VÖ÷fT—FVÒ†FF—fTgVVÆ–æu7F÷&vT¶W’†vöÄæÖR’’“°Ð¢v—B6ÆV$çWG&—F–öå7FFUG—R‚$DD•dUô$õdÂ"“°Ð¢v—B&Vg&W6…Væ–f–VEvVV´G&gDf÷$çWG&—F–öâ‚“°Ð¢&VæFW$çWG&—F–öä6öÖÖæB‚“°Ð¢&VæFW%&V7'V—D6öçG&7B‚“°Ð¢&VæFW%vVV¶Ç”÷&6†W7G&F÷"‚“°Ð¢&WGW&â7–æ6VC°Ð§ÐÐ Ð¦gVæ7F–öâ&÷fT÷WF6öÖTçWG&—F–öä&6VÆ–æR‡&Wf—6–öâ’°Ð¢–b‡G—VöbFöÖ–æ–öäçWG&—F–öä&6VÆ–æRÓÓÒ'VæFVf–æVB"’F‡&÷ræWrW'&÷"‚$çWG&—F–öâ&6VÆ–æR6öçG&öÇ2&RVæf–Æ&ÆRâ"“°Ð¢6öç7B&÷÷6ÂÒFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ'V–ÆDçWG&—F–öä&6VÆ–æU&÷÷6Â†÷WF6öÖTçWG&—F–öä&6VÆ–æT–çWB‡&Wf—6–öâç&÷÷6VEÆâÂ&Wf—6–öâæVffV7F—fTFFR’“°Ð¢–b‡&÷÷6Âç7FGW2ÓÒ%$TE’dõ"$õdÂ"’F‡&÷ræWrW'&÷"‡&÷÷6ÂæW'&÷'3òå³ÒÇÂ%F†R&÷÷6VB&6VÆ–æRF–Bæ÷B72çWG&—F–öâ6fVwV&G2â"“°Ð¢&WGW&âFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ&÷fTçWG&—F–öä&6VÆ–æR‡&÷÷6ÂÂæWrFFR‚’çFô•4õ7G&–ær‚’Â÷WF6öÖRÒG·&Wf—6–öâæ–GÖ“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&öÆÆ&6´÷WF6öÖUÆå&Wf—6–öâ‡&Wf—6–öâ’°Ð¢–b‡G—VöbFöÖ–æ–öäçWG&—F–öä&6VÆ–æRÓÓÒ'VæFVf–æVB"’F‡&÷ræWrW'&÷"‚$çWG&—F–öâ&6VÆ–æR6öçG&öÇ2&RVæf–Æ&ÆRâ"“°Ð¢6öç7B†—7F÷'’Ò&VDçWG&—F–öä&6VÆ–æT†—7F÷'’‚“°Ð¢ÆWB&öÆÆ&6´&6VÆ–æT–BÒçVÆÃ°Ð¢–b‡FöF”•4ôFFR‚’Â&Wf—6–öâæVffV7F—fTFFR’°Ð¢6öç7B66†VGVÆVBÒ†—7F÷'’æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ&Wf—6–öâæÆ–VD&6VÆ–æT–B“°Ð¢–b‡66†VGVÆVB’66†VGVÆVBç7FGW2Ò%$UdU%DTB#°Ð¢ÒVÇ6R°Ð¢6öç7B&÷÷6ÂÒFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ'V–ÆDçWG&—F–öä&6VÆ–æU&÷÷6Â†÷WF6öÖTçWG&—F–öä&6VÆ–æT–çWB‡&Wf—6–öâæ7W'&VçEÆâÂFöF”•4ôFFR‚’’“°Ð¢–b‡&÷÷6Âç7FGW2ÓÒ%$TE’dõ"$õdÂ"’F‡&÷ræWrW'&÷"‡&÷÷6ÂæW'&÷'3òå³ÒÇÂ%F†R&–÷"&6VÆ–æR6÷VÆBæ÷B&R&W7F÷&VBâ"“°Ð¢6öç7B&öÆÆ&6²ÒFöÖ–æ–öäçWG&—F–öä&6VÆ–æRæ&÷fTçWG&—F–öä&6VÆ–æR‡&÷÷6ÂÂæWrFFR‚’çFô•4õ7G&–ær‚’Â&öÆÆ&6²ÒG·&Wf—6–öâæ–GÒÒG·FöF”•4ôFFR‚—Ö“°Ð¢&öÆÆ&6´&6VÆ–æT–BÒ&öÆÆ&6²æ–C°Ð¢†—7F÷'’çW6‚‡&öÆÆ&6²“°Ð¢ÐÐ¢v—BW'6—7D÷WF6öÖTçWG&—F–öä†—7F÷'’††—7F÷'’“°Ð¢&WGW&âFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâæ6ö×ÆWFTö'6W'fF–öâ‡&Wf—6–öâÂ%$ôÄÄ$4²"Â²6Æ÷6VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Â&öÆÆ&6´&6VÆ–æT–BÒ“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ†æFÆT÷WF6öÖUÆä7F–öâ†WfVçB’°Ð¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ÷WF6öÖR×ÆâÖ7F–öåÒ"“°Ð¢–b‚'WGFöâÇÂG—VöbFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâÓÓÒ'VæFVf–æVB"’&WGW&âfÇ6S°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7B7F–öâÒ'WGFöâæFF6WBæ÷WF6öÖUÆä7F–öã°Ð¢6öç7B÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚“°Ð¢ÆWB&Wf—6–öâÒ'V–ÆD7W'&VçD÷WF6öÖUÆå&Wf—6–öâ†÷WF6öÖR“°Ð¢ÆWB7–æ6VBÒfÇ6S°Ð¢–b…²$$õdR"Â$´TUô5U%$TåB"Â%$T54U55ôÄDU"%Òæ–æ6ÇVFW2†7F–öâ’’°Ð¢&Wf—6–öâÒFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâç&W6öÇfU&÷÷6Â‡&Wf—6–öâÂ7F–öâÂ²&W6öÇfVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÂW6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÒ“°Ð¢–b†7F–öâÓÓÒ$$õdR"’°Ð¢6öç7B&6VÆ–æRÒ&÷fT÷WF6öÖTçWG&—F–öä&6VÆ–æR‡&Wf—6–öâ“°Ð¢6öç7B†—7F÷'’Ò&VDçWG&—F–öä&6VÆ–æT†—7F÷'’‚“°Ð¢–b‚†—7F÷'’ç6öÖR‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ&6VÆ–æRæ–B’’†—7F÷'’çW6‚†&6VÆ–æR“°Ð¢7–æ6VBÒv—BW'6—7D÷WF6öÖTçWG&—F–öä†—7F÷'’††—7F÷'’“°Ð¢&Wf—6–öâÒ²ââç&Wf—6–öâÂÆ–VD&6VÆ–æT–C¢&6VÆ–æRæ–BÓ°Ð¢ÐÐ¢ÒVÇ6R–b†7F–öâÓÓÒ%$UD”â"’°Ð¢&Wf—6–öâÒFöÖ–æ–öä÷WF6öÖUÆå&Wf—6–öâæ6ö×ÆWFTö'6W'fF–öâ‡&Wf—6–öâÂ%$UD”â"Â²6Æ÷6VDC¢æWrFFR‚’çFô•4õ7G&–ær‚’Ò“°Ð¢ÒVÇ6R–b†7F–öâÓÓÒ%$ôÄÄ$4²"’°Ð¢&Wf—6–öâÒv—B&öÆÆ&6´÷WF6öÖUÆå&Wf—6–öâ‡&Wf—6–öâ“°Ð¢ÐÐ¢7–æ6VBÒ†v—B6fT÷WF6öÖUÆå&Wf—6–öâ‡&Wf—6–öâ’’ÇÂ7–æ6VC°Ð¢&VæFW$÷WF6öÖUÆå&Wf—6–öâ†÷WF6öÖR“°Ð¢6WEFW‡B‚&÷WF6öÖR×Æâ×&Wf—6–öâÖfVVF&6²"Â&Wf—6–öâç7FGW2ÓÓÒ%44„TETÄTB Ð¢ò&Wf—6–öâ&÷fVBf÷"G·&Wf—6–öâæVffV7F—fTFFWÒG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâF†R7W'&VçBÆâ&VÖ–ç27F—fRVçF–ÂF†Vâæ Ð¢¢&Wf—6–öâç7FGW2ÓÓÒ%$UdU%DTB Ð¢ò%&–÷"çWG&—F–öâ&6VÆ–æR&W7F÷&VBâG&–æ–ærv2æ÷B6†ævVBâ Ð¢¢&Wf—6–öâç7FGW2ÓÓÒ%$UD”äTB Ð¢ò%&Wf—6–öâ&WF–æVBgFW"F†Rö'6W'fF–öâv–æF÷râ Ð¢¢$FV6—6–öâ6fVBâæòVæ&÷fVBÆâ6†ævRv2ÖFRâ"“°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚&÷WF6öÖR×Æâ×&Wf—6–öâÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†BÆâFV6—6–öâ6÷VÆBæ÷B&R6ö×ÆWFVBâ"“°Ð¢Òf–æÆÇ’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÐÐ¢&WGW&âG'VS°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%FöF”&öG”6†V6·ö–çB†÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚’’°Ð¢6öç7B6&BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6†V6·ö–çB"“°Ð¢–b‚6&BÇÂ÷WF6öÖR’&WGW&ã°Ð¢6öç7B6FVæ6RÒ÷WF6öÖRæ6FVæ6RÇÂ·Ó°Ð¢6&BæFF6WBæ6†V6·ö–çE7FFRÒ6FVæ6Rç7FGW2ÇÂ%U4ôÔ”är#°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6·ö–çB×7FFR"Â6FVæ6RæÆ&VÂÇÂ$4„T4´”är"“°Ð¢6öç7B7FFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6†V6·ö–çB×7FFR"“°Ð¢–b‡7FFR’7FFRæ6Æ74æÖRÒ7FFR×–ÆÂG¶6FVæ6Rç7FGW2ÓÓÒ$4EU$TB"ò&w&VVâ"¢6FVæ6Rç7FGW2ÓÓÒ$ETR"ò'–VÆÆ÷r"¢&æWWG&Â'Ö°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6·ö–çBÖFWF–Â"Â6FVæ6Rç7FGW2ÓÓÒ$4EU$TB Ð¢ò$6†V6·ö–çB6V7W&VBâFÆ2—2WFF–ærF†R÷WF6öÖR6–væÂâ Ð¢¢6FVæ6Rç7FGW2ÓÓÒ$ETR Ð¢ò$6GW&RöæR6ö×&&ÆRÖV7W&VÖVçB6WBâÖ—76–ær—BæWfW"6÷VçG22æöæ6ö×Æ–æ6Râ Ð¢¢–÷W"æW‡B6†V6·ö–çB—2G¶6FVæ6RææW‡DFFWÒæ“°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6·ö–çBÖÆ7B"Â6FVæ6RæÆFW7DFFRÇÂ$æò&6VÆ–æR"“°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6·ö–çBÖæW‡B"Â6FVæ6Rç7FGW2ÓÓÒ$ETR"ò%FöF’"¢6FVæ6RææW‡DFFRÇÂ%FöF’"“°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6GW&RÖÆ&VÂ"Â6FVæ6Rç7FGW2ÓÓÒ$4EU$TB"ò$6†V6·ö–çB6GW&VB"¢6FVæ6Rç7FGW2ÓÓÒ$ETR"ò$ÆörvVV¶Ç’ÖV7W&VÖVçG2"¢$ÆörV&Ç’–bæVVFVB"“°Ð¢6öç7B6GW&RÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6GW&R"“°Ð¢–b†6GW&Rbb6GW&RæFF6WBçW6W%FövvÆVB’6GW&Ræ÷VâÒ6FVæ6Rç7FGW2ÓÓÒ$ETR#°Ð¢6öç7BFFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6†V6¶–âÖFFR"“°Ð¢–b†FFR’FFRçfÇVRÒFöF”•4ôFFR‚“°Ð¢&VæFW$&öG”fDW7F–ÖFR†Fö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6†V6¶–âÖf÷&Ò"’“°Ð¢&VæFW$&öG•†÷FôW‡W&–Væ6R‚“°Ð¢&VæFW%&öw&W75&Wf–Wr†÷WF6öÖRÂ'FöF’Ö&öG’×&Wf–Wr"ÂG'VR“°Ð¢&VæFW%Æä6öÖÖæB‚'FöF’×ÆâÖ6öÖÖæB"ÂG'VR“°Ð¢&VæFW$ö'6W'fF–öåfW&F–7B‚'FöF’Öö'6W'fF–öâ×fW&F–7B"ÂG'VR“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$&öG”÷WF6öÖR†÷WF6öÖR’°Ð¢–b‚÷WF6öÖR’&WGW&ã°Ð¢6WEFW‡B‚&&öG’Ö÷WF6öÖRÖFV6—6–öâ"Â÷WF6öÖRæFV6—6–öâæÆ&VÂ“°Ð¢6öç7BFV6—6–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Ö÷WF6öÖRÖFV6—6–öâ"“°Ð¢–b†FV6—6–öâ’FV6—6–öâæ6Æ74æÖRÒ÷WF6öÖRæFV6—6–öâçFöæRÇÂ&æWWG&Â#°Ð¢6WEFW‡B‚&&öG’Ö÷WF6öÖRÖ†VFÆ–æR"Â÷WF6öÖRæFV6—6–öâæ†VFÆ–æR“°Ð¢6WEFW‡B‚&&öG’Ö÷WF6öÖRÖFWF–Â"Â÷WF6öÖRæFV6—6–öâæFWF–Â“°Ð¢6WEFW‡B‚&&öG’Ö÷WF6öÖRÖ6öæf–FVæ6R"ÂG¶÷WF6öÖRæ6öæf–FVæ6WÒV“°Ð¢6WEFW‡B‚&&öG’Ö÷WF6öÖRÖ6öæf–FVæ6RÖÆ&VÂ"Â÷WF6öÖRæ6öæf–FVæ6TÆ&VÂ“°Ð¢6WEFW‡B‚'G&VæBÖ&öG’×vV–v‡B"ÂG&VæDÖWG&–5fÇVR†÷WF6öÖRçvV–v‡BæÆFW7BÂ"Æ""’“°Ð¢6WEFW‡B‚'G&VæBÖ&öG’Ö6†ævR"Â÷WF6öÖRçvV–v‡Bæ6†ævTÆ&VÂ“°Ð¢6WEFW‡B‚'G&VæBÖ&öG’ÖfW&vR"ÂrÖF’fW&vRG·G&VæDÖWG&–5fÇVR†÷WF6öÖRçvV–v‡Bç6WfVäF”fW&vRÂ"Æ""—Ö“°Ð¢6öç7B6†'BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖ&öG’Ö6†'B"“°Ð¢–b†6†'B’6†'Bæ–ææW$…DÔÂÒG&VæE6W&–W4&'2†÷WF6öÖRçvV–v‡Bç6W&–W2Â²Æ&VÃ¢%vV–v‡BG&¦V7F÷'’"Ò“°Ð¢6öç7BGVTÆ&VÂÒ÷WF6öÖRææW‡D6†V6´–äFFRÃÒFöF”•4ôFFR‚’ò$GVRFöF’"¢æW‡BG¶÷WF6öÖRææW‡D6†V6´–äFFWÖ°Ð¢6WEFW‡B‚&&öG’ÖæW‡BÖ6†V6¶–â"ÂGVTÆ&VÂ“°Ð¢6öç7Bw&–BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’ÖÖV7W&VÖVçBÖw&–B"“°Ð¢–b†w&–B’w&–Bæ–ææW$…DÔÂÒFöÖ–æ–öä&öG”6ö×÷6—F–öâäÔUE$”52æÖ‚†FVf–æ—F–öâ’Óâ°Ð¢6öç7BÖWG&–2Ò÷WF6öÖRæÖV7W&VÖVçG2ç7VÖÖ&–W5¶FVf–æ—F–öâæ¶W•Ó°Ð¢6öç7BVæ—BÒFVf–æ—F–öâæ¶W’ÓÓÒ&&öG•öfB"ò"R"¢"–â#°Ð¢6öç7B6†ævRÒÖWG&–2æ6†ævRÓÓÒçVÆÂò$&6VÆ–æRæVVFVB"¢G¶ÖWG&–2æ6†ævRâò"²"¢ÖWG&–2æ6†ævRÂò.(‰""¢"'ÒG´ÖF‚æ'2†ÖWG&–2æ6†ævR—ÒG·Væ—GÖ°Ð¢6öç7BÆFW7DVçG'’ÒFVf–æ—F–öâæ¶W’ÓÓÒ&&öG•öfB Ð¢ò²ââæ÷WF6öÖRæÖV7W&VÖVçG2æ6†V6´–ç5Òç&WfW'6R‚’æf–æB‚†VçG'’’Óâö&¦V7Bæ†4÷vâ†VçG'’çfÇVW2Â&&öG•öfB"’Ð¢¢çVÆÃ°Ð¢6öç7BW7F–ÖFTæ÷FRÒÆFW7DVçG'“òæ&öG”fDW7F–ÖFSòæW7F–ÖFV@Ð¢òÆVÓäW7F–ÖFVB&ævRG¶W66T‡FÖÂ†ÆFW7DVçG'’æ&öG”fDW7F–ÖFRç&ævTÆ÷róò.(	B"—Þ(	2G¶W66T‡FÖÂ†ÆFW7DVçG'’æ&öG”fDW7F–ÖFRç&ævT†–v‚óò.(	B"—ÒSÂöVÓæ Ð¢¢"#°Ð¢&WGW&âÆ'F–6ÆSãÇ7ãâG¶W66T‡FÖÂ†FVf–æ—F–öâæÆ&VÂ—ÓÂ÷7ããÇ7G&öæsâG·G&VæDÖWG&–5fÇVR†ÖWG&–2æÆFW7BÂVæ—B—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ†6†ævR—ÓÂ÷6ÖÆÃâG¶W7F–ÖFTæ÷FWÓÂö'F–6ÆSæ°Ð¢Ò’æ¦ö–â‚""“°Ð¢&VæFW$&öG”ÖV7W&VÖVçD6†'B†÷WF6öÖR“°Ð¢&VæFW$&öG”6†V6´–ä†—7F÷'’†÷WF6öÖR“°Ð¢&VæFW%&öw&W75&Wf–Wr†÷WF6öÖRÂ&&öG’Öf÷W"×vVV²×&Wf–Wr"“°Ð¢&VæFW%Æä6öÖÖæB‚&&öG’×ÆâÖ6öÖÖæB"“°Ð¢&VæFW$ö'6W'fF–öåfW&F–7B‚&&öG’Öö'6W'fF–öâ×fW&F–7B"“°Ð¢6öç7BFFT–çWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Ö6†V6¶–âÖFFR"“°Ð¢–b†FFT–çWBbbFFT–çWBçfÇVR’°Ð¢FFT–çWBçfÇVRÒFöF”•4ôFFR‚“°Ð¢FFT–çWBæÖ‚ÒFöF”•4ôFFR‚“°Ð¢ÐÐ¢&VæFW$&öG”fDW7F–ÖFR†Fö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Ö6†V6¶–âÖf÷&Ò"’“°Ð¢&VæFW$&öG•†÷FôW‡W&–Væ6R‚“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%vVV¶Ç”&öG”÷WF6öÖR†vw&VvFR’°Ð¢–b‚vw&VvFRÇÂG—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B÷WF6öÖRÒFöÖ–æ–öä&öG”6ö×÷6—F–öâæ'V–ÆD÷WF6öÖTÖöFVÂ‡°Ð¢FöF“¢vw&VvFRçvVV´VæDFFRÀÐ¢&ævTF—3¢ƒBÀÐ¢W&f÷&Öæ6TVçG&–W2ÀÐ¢F–Ç•7FFW3¢ÖW&vU&VF–æW74†—7F÷'’‚’ÀÐ¢6öçG&7C¢&VD&÷fVE&V7'V—D6öçG&7B‚’ÇÂ·ÒÀÐ¢6–væÇ3¢°Ð¢F—66—Æ–æS¢G&VæDF6†&ö&DÖöFVÃòæF—66—Æ–æSòçfÇVRÀÐ¢çWG&—F–öã¢G&VæDF6†&ö&DÖöFVÃòæçWG&—F–öãòçfÇVRÀÐ¢7G&VæwF…6W76–öç3¢G&VæDF6†&ö&DÖöFVÃòçG&–æ–æsòç7G&VæwF…6W76–öç2ÇÂ Ð¢ÐÐ¢Ò“°Ð¢6öç7B7VÖÖ'’ÒFöÖ–æ–öä&öG”6ö×÷6—F–öâçvVV¶Ç”÷WF6öÖU7VÖÖ'’†÷WF6öÖRÂvw&VvFRçvVVµ7F'DFFRÂvw&VvFRçvVV´VæDFFR“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö÷WF6öÖR×7FFR"Â7VÖÖ'’ç7FFR“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö÷WF6öÖRÖFWF–Â"Â7VÖÖ'’æFWF–Â“°Ð¢6WEFW‡B‚'vVV¶Ç’Ö÷WF6öÖRÖFFR"Â7VÖÖ'’æFFRòG·7VÖÖ'’æFFWÒ+rG·7VÖÖ'’æFV6—6–öçÖ¢$æò6†V6·ö–çBF†—2vVV²"“°Ð¢6öç7B7FFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'vVV¶Ç’Ö÷WF6öÖR×7FFR"“°Ð¢–b‡7FFR’7FFRæ6Æ74æÖRÒ7VÖÖ'’ç7FFRÓÓÒ$4EU$TB"ò'÷6—F—fR"¢&æWWG&Â#°Ð§ÐÐ Ð¦gVæ7F–öâ&öG•†÷FôÖ–w&F–öäÖ—76–ær†W'&÷"’°Ð¢6öç7BÖW76vRÒ7G&–ær†W'&÷#òæÖW76vRÇÂW'&÷"ÇÂ""’çFôÆ÷vW$66R‚“°Ð¢&WGW&â²#C'"Â'w'7C#R"Â&æ÷Bf÷VæB"Â&FöW2æ÷BW†—7B%Òæ–æ6ÇVFW2…7G&–ær†W'&÷#òæ6öFRÇÂ""’çFôÆ÷vW$66R‚’Ð¢ÇÂÖW76vRæ–æ6ÇVFW2‚&&öG•÷&öw&W75÷†÷F÷2"Ð¢ÇÂÖW76vRæ–æ6ÇVFW2‚&&öG’×&öw&W72×†÷F÷2"“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&Vg&W6„&öG•†÷FõW&Ç2‚’°Ð¢&öG•†÷FõW&Ç2ÒæWrÖ‚“°Ð¢6öç7BF‡2Ò²ââææWr6WB†&öG•&öw&W75†÷F÷2æÖ‚†—FVÒ’Óâ—FVÒç7F÷&vUF‚’æf–ÇFW"„&ööÆVâ’•Ó°Ð¢–b‚F‡2æÆVæwF‚’&WGW&â&öG•†÷FõW&Ç3°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B²FFÂW'&÷"ÒÒv—B7W&6Rç7F÷&vRæg&öÒ„FöÖ–æ–öä&öG•&öw&W72ä%T4´UB’æ7&VFU6–væVEW&Ç2‡F‡2Â3c“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð¢†FFÇÂµÒ’æf÷$V6‚‚†—FVÒÂ–æFW‚’Óâ°Ð¢6öç7BF‚Ò—FVÒçF‚ÇÂF‡5¶–æFW…Ó°Ð¢6öç7BW&ÂÒ—FVÒç6–væVEW&ÂÇÂ—FVÒç6–væVEU$Ã°Ð¢–b‡F‚bbW&Â’&öG•†÷FõW&Ç2ç6WB‡F‚ÂW&Â“°Ð¢Ò“°Ð¢&WGW&â&öG•†÷FõW&Ç3°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâÆöD&öG•&öw&W75†÷F÷2‚’°Ð¢–b‡G—VöbFöÖ–æ–öä&öG•&öw&W72ÓÓÒ'VæFVf–æVB"ÇÂ6W76–öãòçW6W#òæ–B’&WGW&âµÓ°Ð¢&öG•†÷Fõ7FFRÒ²ÆöF–æs¢G'VRÂf–Æ&ÆS¢fÇ6RÂÖ–w&F–öå&WV—&VC¢fÇ6RÂW'&÷#¢çVÆÂÓ°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B²FFÂW'&÷"ÒÒv—B7W&6PÐ¢æg&öÒ‚&&öG•÷&öw&W75÷†÷F÷2"Ð¢ç6VÆV7B‚&–BÇW6W%ö–BÇW&f÷&Öæ6UöFFRÆævÆRÇ7F÷&vU÷F‚Æ6öçFVçE÷G—RÇ6—¦Uö'—FW2Çv–GF‚Æ†V–v‡BÆ7&VFVEöBÇWFFVEöB"Ð¢æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–BÐ¢æ÷&FW"‚'W&f÷&Öæ6UöFFR"Â²66VæF–æs¢fÇ6RÒÐ¢æÆ–Ö—Bƒc“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð¢&öG•&öw&W75†÷F÷2Ò†FFÇÂµÒ’æÖ„FöÖ–æ–öä&öG•&öw&W72ææ÷&ÖÆ—¦U†÷Fõ&V6÷&B“°Ð¢v—B&Vg&W6„&öG•†÷FõW&Ç2‚“°Ð¢&öG•†÷Fõ7FFRÒ²ÆöF–æs¢fÇ6RÂf–Æ&ÆS¢G'VRÂÖ–w&F–öå&WV—&VC¢fÇ6RÂW'&÷#¢çVÆÂÓ°Ð¢Ò6F6‚†W'&÷"’°Ð¢&öG•&öw&W75†÷F÷2ÒµÓ°Ð¢&öG•†÷FõW&Ç2ÒæWrÖ‚“°Ð¢&öG•†÷Fõ7FFRÒ²ÆöF–æs¢fÇ6RÂf–Æ&ÆS¢fÇ6RÂÖ–w&F–öå&WV—&VC¢&öG•†÷FôÖ–w&F–öäÖ—76–ær†W'&÷"’ÂW'&÷#¢W'&÷#òæÖW76vRÇÂ%†÷FòfVÇBVæf–Æ&ÆR"Ó°Ð¢ÐÐ¢&VæFW$&öG•†÷FôW‡W&–Væ6R‚“°Ð¢&WGW&â&öG•&öw&W75†÷F÷3°Ð§ÐÐ Ð¦gVæ7F–öâ&öG•†÷FõF–ÆR‡&V6÷&BÂÆ&VÂÂÆÆ÷tFVÆWFRÒG'VR’°Ð¢6öç7BW&ÂÒ&V6÷&Còç7F÷&vUF‚ò&öG•†÷FõW&Ç2ævWB‡&V6÷&Bç7F÷&vUF‚’¢çVÆÃ°Ð¢–b‚&V6÷&BÇÂW&Â’&WGW&âÆ'F–6ÆR6Æ73Ò&&öG’×†÷Fò×F–ÆRV×G’#ãÇ7ãâG¶W66T‡FÖÂ†Æ&VÂ—ÓÂ÷7ããÆF—cäæ÷B6GW&VCÂöF—cãÂö'F–6ÆSæ°Ð¢&WGW&âÆ'F–6ÆR6Æ73Ò&&öG’×†÷Fò×F–ÆR#ãÇ7ãâG¶W66T‡FÖÂ†Æ&VÂ—ÓÂ÷7ããÆ–Ör7&3Ò"G¶W66T‡FÖÂ‡W&Â—Ò"ÇCÒ"G¶W66T‡FÖÂ†Æ&VÂ—Ò&öw&W72†÷Fòg&öÒG·&V6÷&BæFFWÒ"ÆöF–æsÒ&Æ§’#âG¶ÆÆ÷tFVÆWFRòÆ'WGFöâG—SÒ&'WGFöâ"6Æ73Ò&v†÷7BFævW""FFÖ&öG’×†÷FòÖFVÆWFSÒ"G¶W66T‡FÖÂ‡&V6÷&Bæ–BÇÂ""—Ò"&–ÖÆ&VÃÒ$FVÆWFRG¶W66T‡FÖÂ†Æ&VÂ—Ò†÷Fòg&öÒG¶W66T‡FÖÂ‡&V6÷&BæFFR—Ò#äFVÆWFSÂö'WGFöãæ¢"'ÓÂö'F–6ÆSæ°Ð§ÐÐ Ð¦gVæ7F–öâ&öG•†÷FôFFT6öÇVÖâ†w&÷WÂ†VF–ær’°Ð¢–b‚w&÷W’&WGW&âÇ6V7F–öããÆ†VFW#ãÇ7ãâG¶W66T‡FÖÂ††VF–ær—ÓÂ÷7ããÇ7G&öæsäæò6†V6·ö–çCÂ÷7G&öæsãÂö†VFW#ãÆF—b6Æ73Ò&&öG’×†÷FòÖævÆRÖw&–B#âG´FöÖ–æ–öä&öG•&öw&W72å„õDõôätÄU2æÖ‚†ævÆR’Óâ&öG•†÷FõF–ÆR†çVÆÂÂævÆRæÆ&VÂÂfÇ6R’’æ¦ö–â‚""—ÓÂöF—cãÂ÷6V7F–öãæ°Ð¢&WGW&âÇ6V7F–öããÆ†VFW#ãÇ7ãâG¶W66T‡FÖÂ††VF–ær—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†w&÷WæFFR—ÓÂ÷7G&öæsãÂö†VFW#ãÆF—b6Æ73Ò&&öG’×†÷FòÖævÆRÖw&–B#âG´FöÖ–æ–öä&öG•&öw&W72å„õDõôätÄU2æÖ‚†ævÆR’Óâ&öG•†÷FõF–ÆR†w&÷Wç†÷F÷5¶ævÆRæ¶W•ÒÂævÆRæÆ&VÂ’’æ¦ö–â‚""—ÓÂöF—cãÂ÷6V7F–öãæ°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$&öG•†÷FôW‡W&–Væ6R‚’°Ð¢–b‡G—VöbFöÖ–æ–öä&öG•&öw&W72ÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B7FFRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’×†÷Fò×fVÇB×7FFR"“°Ð¢6öç7B÷WGWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’×†÷FòÖ6ö×&—6öâ"“°Ð¢6öç7BfVVF&6²ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’×†÷FòÖfVVF&6²"“°Ð¢6öç7Bg&öÒÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’×†÷FòÖg&öÒÖFFR"“°Ð¢6öç7BFòÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’×†÷Fò×FòÖFFR"“°Ð¢6öç7BFöF•7FGW2ÒFöÖ–æ–öä&öG•&öw&W72æ6†V6·ö–çE7FGW2†&öG•&öw&W75†÷F÷2ÂFöF”•4ôFFR‚’“°Ð¢6WEFW‡B‚'FöF’Ö&öG’×†÷FòÖ6÷VçB"ÂG·FöF•7FGW2æ6÷VçGÒó6“°Ð¢&Vg&W6…G&ç6f÷&ÖF–öäÆVFvW"‚“°Ð¢–b‚7FFRÇÂ÷WGWBÇÂg&öÒÇÂFò’&WGW&ã°Ð¢–b†&öG•†÷Fõ7FFRæÆöF–ær’°Ð¢7FFRçFW‡D6öçFVçBÒ$4„T4´”är#°Ð¢÷WGWBæ–ææW$…DÔÂÒsÆF—b6Æ73Ò'G&VæBÖ6†'BÖV×G’#ãÇ7G&öæsä÷Væ–ær–÷W"&—fFR&V6÷&CÂ÷7G&öæsãÇ7ãå†÷F÷27F’66÷VçBÖ÷væVBãÂ÷7ããÂöF—câs°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‚&öG•†÷Fõ7FFRæf–Æ&ÆR’°Ð¢7FFRçFW‡D6öçFVçBÒ&öG•†÷Fõ7FFRæÖ–w&F–öå&WV—&VBò$5D•dD”ôâäTTDTB"¢%Täd”Ä$ÄR#°Ð¢÷WGWBæ–ææW$…DÔÂÒsÆF—b6Æ73Ò'G&VæBÖ6†'BÖV×G’#ãÇ7G&öæså†÷FòfVÇB—2æ÷B7F—fR–WCÂ÷7G&öæsãÇ7ãäÖV7W&VÖVçG2æB&öG’ÖfBW7F–ÖFW27F–ÆÂ6fRæ÷&ÖÆÇ’ãÂ÷7ããÂöF—câs°Ð¢–b†fVVF&6²’fVVF&6²çFW‡D6öçFVçBÒ%&öw&W72†÷F÷2&WV—&RF†R&—fFR†÷Fò×fVÇBÖ–w&F–öââ#°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7B6ö×&—6öâÒFöÖ–æ–öä&öG•&öw&W72æ6ö×&—6öâ†&öG•&öw&W75†÷F÷2Âg&öÒçfÇVRÇÂçVÆÂÂFòçfÇVRÇÂçVÆÂ“°Ð¢6öç7B÷F–öç2Ò6ö×&—6öâæFFW2æÖ‚†FFR’ÓâÆ÷F–öâfÇVSÒ"G¶W66T‡FÖÂ†FFR—Ò#âG¶W66T‡FÖÂ†FFR—ÓÂö÷F–öãæ’æ¦ö–â‚""“°Ð¢6öç7B6VÆV7FVDg&öÒÒ6ö×&—6öâæg&öÓòæFFRÇÂ"#°Ð¢6öç7B6VÆV7FVEFòÒ6ö×&—6öâçFóòæFFRÇÂ"#°Ð¢g&öÒæ–ææW$…DÔÂÒ÷F–öç2ÇÂsÆ÷F–öâfÇVSÒ"#äæò6†V6·ö–çG3Âö÷F–öãâs°Ð¢Fòæ–ææW$…DÔÂÒ÷F–öç2ÇÂsÆ÷F–öâfÇVSÒ"#äæò6†V6·ö–çG3Âö÷F–öãâs°Ð¢g&öÒçfÇVRÒ6VÆV7FVDg&öÓ°Ð¢FòçfÇVRÒ6VÆV7FVEFó°Ð¢7FFRçFW‡D6öçFVçBÒ6ö×&—6öâæFFW2æÆVæwF‚òG¶6ö×&—6öâæFFW2æÆVæwF‡Ò4„T4µô”åBG¶6ö×&—6öâæFFW2æÆVæwF‚ÓÓÒò""¢%2'Ö¢$TÕE’#°Ð¢–b‚6ö×&—6öâæFFW2æÆVæwF‚’°Ð¢÷WGWBæ–ææW$…DÔÂÒsÆF—b6Æ73Ò'G&VæBÖ6†'BÖV×G’#ãÇ7G&öæsäæò&öw&W72†÷F÷2–WCÂ÷7G&öæsãÇ7ãäFBg&öçBÂ6–FRÂæB&6²v—F‚vVV¶Ç’6†V6·ö–çBãÂ÷7ããÂöF—câs°Ð¢ÒVÇ6R–b†6ö×&—6öâæFFW2æÆVæwF‚ÓÓÒ’°Ð¢÷WGWBæ–ææW$…DÔÂÒÆF—b6Æ73Ò&&öG’×†÷Fò×6–ævÆR#âG¶&öG•†÷FôFFT6öÇVÖâ†6ö×&—6öâçFòÂ$5U%$TåB"—ÓÂöF—cæ°Ð¢ÒVÇ6R°Ð¢÷WGWBæ–ææW$…DÔÂÒG¶&öG•†÷FôFFT6öÇVÖâ†6ö×&—6öâæg&öÒÂ$e$ôÒ"—ÒG¶&öG•†÷FôFFT6öÇVÖâ†6ö×&—6öâçFòÂ%Dò"—Ö°Ð¢ÐÐ¢–b†fVVF&6²’fVVF&6²çFW‡D6öçFVçBÒ%&—fFR66÷VçBWf–FVæ6Râ6ö×&RF†R6ÖR÷6RæB6öæF—F–öç2â#°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW$&öG”fDW7F–ÖFR†f÷&Ò’°Ð¢–b‚f÷&ÒÇÂG—VöbFöÖ–æ–öä&öG•&öw&W72ÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢6öç7B÷WGWBÒf÷&ÒçVW'•6VÆV7F÷"‚%¶FFÖ&öG’ÖfBÖW7F–ÖFUÒ"“°Ð¢6öç7BfÇVW2Òö&¦V7Bæg&öÔVçG&–W2†æWrf÷&ÔFF†f÷&Ò’æVçG&–W2‚’“°Ð¢6öç7BÖçVÂÒçVÖ&W"‡fÇVW2æ&öG•öfB“°Ð¢–b„çVÖ&W"æ—4f–æ—FR†ÖçVÂ’bbÖçVÂâ’°Ð¢–b†÷WGWB’÷WGWBæ–ææW$…DÔÂÒÇ7G&öæsâG¶W66T‡FÖÂ†ÖçVÂçFôf—†VBƒ’—ÒRVçFW&VCÂ÷7G&öæsãÇ7ãä6ÆV"F†R÷fW'&–FRFòW6RF†R6—&7VÖfW&Væ6RW7F–ÖFRãÂ÷7ãæ°Ð¢&WGW&â²fÆ–C¢G'VRÂÖçVÃ¢G'VRÂfÇVS¢ÖçVÂÂÖWF†öC¢%4TÄeõ$Uõ%DTB"Ó°Ð¢ÐÐ¢6öç7BW7F–ÖFRÒFöÖ–æ–öä&öG•&öw&W72æW7F–ÖFT&öG”fB‡fÇVW2Â&V7'V—E&öf–ÆTf÷$FÆ2‚’ÇÂ·Ò“°Ð¢–b†÷WGWB’÷WGWBæ–ææW$…DÔÂÒW7F–ÖFRçfÆ–@Ð¢òÇ7G&öæsâG¶W66T‡FÖÂ†W7F–ÖFRçfÇVR—ÒSÂ÷7G&öæsãÇ7ãäW7F–ÖFVB&ævRG¶W66T‡FÖÂ†W7F–ÖFRç&ævTÆ÷r—Þ(	2G¶W66T‡FÖÂ†W7F–ÖFRç&ævT†–v‚—ÒR+ræg’6—&7VÖfW&Væ6RÖWF†öCÂ÷7ãæ Ð¢¢Ç7G&öæsäW7F–ÖFRVæF–æsÂ÷7G&öæsãÇ7ãâG¶W66T‡FÖÂ†W7F–ÖFRæÆ&VÂ—ÓÂ÷7ãæ°Ð¢&WGW&âW7F–ÖFS°Ð§ÐÐ Ð¦gVæ7F–öâ&Wf–Wt&öG•&öw&W75†÷Fò†–çWB’°Ð¢6öç7B&Wf–WrÒ–çWCòæ6Æ÷6W7B‚&Æ&VÂ"“òçVW'•6VÆV7F÷"‚%¶FFÖ&öG’×†÷Fò×&Wf–WuÒ"“°Ð¢–b‚&Wf–Wr’&WGW&ã°Ð¢–b‡&Wf–WræFF6WBæö&¦V7EW&Â’U$Âç&Wfö¶Tö&¦V7EU$Â‡&Wf–WræFF6WBæö&¦V7EW&Â“°Ð¢6öç7Bf–ÆRÒ–çWBæf–ÆW3òå³ÒÇÂçVÆÃ°Ð¢–b‚f–ÆR’°Ð¢&Wf–WrçFW‡D6öçFVçBÒ$FB†÷Fò#°Ð¢FVÆWFR&Wf–WræFF6WBæö&¦V7EW&Ã°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7BfÆ–FF–öâÒFöÖ–æ–öä&öG•&öw&W72çfÆ–FFU†÷Fôf–ÆR†f–ÆR“°Ð¢–b‚fÆ–FF–öâçfÆ–B’°Ð¢–çWBçfÇVRÒ"#°Ð¢&Wf–WrçFW‡D6öçFVçBÒfÆ–FF–öâæW'&÷'5³Ó°Ð¢&WGW&ã°Ð¢ÐÐ¢6öç7BW&ÂÒU$Âæ7&VFTö&¦V7EU$Â†f–ÆR“°Ð¢&Wf–WræFF6WBæö&¦V7EW&ÂÒW&Ã°Ð¢&Wf–Wræ–ææW$…DÔÂÒÆ–Ör7&3Ò"G¶W66T‡FÖÂ‡W&Â—Ò"ÇCÒ%6VÆV7FVBG¶W66T‡FÖÂ†–çWBæFF6WBæ&öG•†÷FôævÆRçFôÆ÷vW$66R‚’—Ò&öw&W72†÷Fò&Wf–Wr#ãÇ6ÖÆÃå&WÆ6SÂ÷6ÖÆÃæ°Ð§ÐÐ Ð¦gVæ7F–öâ&W6WD&öG•&öw&W75†÷Fõ&Wf–Ww2†f÷&Ò’°Ð¢f÷&ÓòçVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ&öG’×†÷Fò×&Wf–WuÒ"’æf÷$V6‚‚‡&Wf–Wr’Óâ°Ð¢–b‡&Wf–WræFF6WBæö&¦V7EW&Â’U$Âç&Wfö¶Tö&¦V7EU$Â‡&Wf–WræFF6WBæö&¦V7EW&Â“°Ð¢FVÆWFR&Wf–WræFF6WBæö&¦V7EW&Ã°Ð¢&Wf–WrçFW‡D6öçFVçBÒ$FB†÷Fò#°Ð¢Ò“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&W&T&öG•&öw&W75†÷Fò†f–ÆR’°Ð¢6öç7BfÆ–FF–öâÒFöÖ–æ–öä&öG•&öw&W72çfÆ–FFU†÷Fôf–ÆR†f–ÆR“°Ð¢–b‚fÆ–FF–öâçfÆ–B’F‡&÷ræWrW'&÷"‡fÆ–FF–öâæW'&÷'5³Ò“°Ð¢ÆWB&—FÖ°Ð¢ÆWB6÷W&6UW&ÂÒçVÆÃ°Ð¢–b‡G—Vöb7&VFT–ÖvT&—FÖÓÓÒ&gVæ7F–öâ"’°Ð¢&—FÖÒv—B7&VFT–ÖvT&—FÖ†f–ÆRÂ²–ÖvT÷&–VçFF–öã¢&g&öÒÖ–ÖvR"Ò“°Ð¢ÒVÇ6R°Ð¢6÷W&6UW&ÂÒU$Âæ7&VFTö&¦V7EU$Â†f–ÆR“°Ð¢&—FÖÒv—BæWr&öÖ—6R‚‡&W6öÇfRÂ&V¦V7B’Óâ°Ð¢6öç7B–ÖvRÒæWr–ÖvR‚“°Ð¢–ÖvRæöæÆöBÒ‚’Óâ&W6öÇfR†–ÖvR“°Ð¢–ÖvRæöæW'&÷"Ò‚’Óâ&V¦V7B†æWrW'&÷"‚%†÷Fò6÷VÆBæ÷B&R÷VæVBâ"’“°Ð¢–ÖvRç7&2Ò6÷W&6UW&Ã°Ð¢Ò“°Ð¢ÐÐ¢6öç7BÖ„VFvRÒc°Ð¢6öç7B66ÆRÒÖF‚æÖ–âƒÂÖ„VFvRòÖF‚æÖ‚†&—FÖçv–GF‚Â&—FÖæ†V–v‡B’“°Ð¢6öç7Bv–GF‚ÒÖF‚æÖ‚ƒÂÖF‚ç&÷VæB†&—FÖçv–GF‚¢66ÆR’“°Ð¢6öç7B†V–v‡BÒÖF‚æÖ‚ƒÂÖF‚ç&÷VæB†&—FÖæ†V–v‡B¢66ÆR’“°Ð¢6öç7B6çf2ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚&6çf2"“°Ð¢6çf2çv–GF‚Òv–GFƒ°Ð¢6çf2æ†V–v‡BÒ†V–v‡C°Ð¢6öç7B6öçFW‡BÒ6çf2ævWD6öçFW‡B‚#&B"Â²Ç†¢fÇ6RÒ“°Ð¢6öçFW‡Bæf–ÆÅ7G–ÆRÒ"3#°Ð¢6öçFW‡Bæf–ÆÅ&V7BƒÂÂv–GF‚Â†V–v‡B“°Ð¢6öçFW‡BæG&t–ÖvR†&—FÖÂÂÂv–GF‚Â†V–v‡B“°Ð¢&—FÖæ6Æ÷6Sòâ‚“°Ð¢–b‡6÷W&6UW&Â’U$Âç&Wfö¶Tö&¦V7EU$Â‡6÷W&6UW&Â“°Ð¢6öç7B&Æö"Òv—BæWr&öÖ—6R‚‡&W6öÇfRÂ&V¦V7B’Óâ6çf2çFô&Æö"‚‡fÇVR’ÓâfÇVRò&W6öÇfR‡fÇVR’¢&V¦V7B†æWrW'&÷"‚%†÷Fò&ö6W76–ærf–ÆVBâ"’’Â&–ÖvRö§Vr"Âãƒb’“°Ð¢&WGW&â²&Æö"Âv–GF‚Â†V–v‡BÓ°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâWÆöD&öG•&öw&W75†÷F÷2†f÷&ÒÂFFR’°Ð¢–b‚f÷&ÒÇÂG—VöbFöÖ–æ–öä&öG•&öw&W72ÓÓÒ'VæFVf–æVB"’&WGW&â²6÷VçC¢ÂW'&÷'3¢µÒÓ°Ð¢6öç7B6VÆV7F–öç2Ò²ââæf÷&ÒçVW'•6VÆV7F÷$ÆÂ‚&–çWE¶FFÖ&öG’×†÷FòÖævÆUÒ"•ÐÐ¢æÖ‚†–çWB’Óâ‡²ævÆS¢–çWBæFF6WBæ&öG•†÷FôævÆRÂf–ÆS¢–çWBæf–ÆW3òå³ÒÇÂçVÆÂÒ’Ð¢æf–ÇFW"‚†—FVÒ’Óâ—FVÒæf–ÆR“°Ð¢–b‚6VÆV7F–öç2æÆVæwF‚’&WGW&â²6÷VçC¢ÂW'&÷'3¢µÒÓ°Ð¢–b‚6W76–öãòçW6W#òæ–B’&WGW&â²6÷VçC¢ÂW'&÷'3¢²%6–vâ–âFò6fR&—fFR&öw&W72†÷F÷2â%ÒÓ°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B6fVBÒµÓ°Ð¢6öç7BW'&÷'2ÒµÓ°Ð¢f÷"†6öç7B6VÆV7F–öâöb6VÆV7F–öç2’°Ð¢ÆWBF‚ÒçVÆÃ°Ð¢G'’°Ð¢6öç7B&W&VBÒv—B&W&T&öG•&öw&W75†÷Fò‡6VÆV7F–öâæf–ÆR“°Ð¢F‚ÒFöÖ–æ–öä&öG•&öw&W72ç†÷FõF‚‡6W76–öâçW6W"æ–BÂFFRÂ6VÆV7F–öâæævÆR“°Ð¢6öç7BWÆöBÒv—B7W&6Rç7F÷&vRæg&öÒ„FöÖ–æ–öä&öG•&öw&W72ä%T4´UB’çWÆöB‡F‚Â&W&VBæ&Æö"Â²W6W'C¢G'VRÂ6öçFVçEG—S¢&–ÖvRö§Vr"Â66†T6öçG&öÃ¢#3c"Ò“°Ð¢–b‡WÆöBæW'&÷"’F‡&÷rWÆöBæW'&÷#°Ð¢6öç7B&V6÷&BÒ°Ð¢W6W%ö–C¢6W76–öâçW6W"æ–BÀÐ¢W&f÷&Öæ6UöFFS¢FFRÀÐ¢ævÆS¢6VÆV7F–öâæævÆRÀÐ¢7F÷&vU÷Fƒ¢F‚ÀÐ¢6öçFVçE÷G—S¢&–ÖvRö§Vr"ÀÐ¢6—¦Uö'—FW3¢&W&VBæ&Æö"ç6—¦RÀÐ¢v–GFƒ¢&W&VBçv–GF‚ÀÐ¢†V–v‡C¢&W&VBæ†V–v‡BÀÐ¢6GW&U÷&÷Fö6öÃ¢%5DäD$EõtTT´Å’"ÀÐ¢WFFVEöC¢æWrFFR‚’çFô•4õ7G&–ær‚Ð¢Ó°Ð¢6öç7B&W7öç6RÒv—B7W&6Ræg&öÒ‚&&öG•÷&öw&W75÷†÷F÷2"’çW6W'B‡&V6÷&BÂ²öä6öæfÆ–7C¢'W6W%ö–BÇW&f÷&Öæ6UöFFRÆævÆR"Ò’ç6VÆV7B‚"¢"’ç6–ævÆR‚“°Ð¢–b‡&W7öç6RæW'&÷"’F‡&÷r&W7öç6RæW'&÷#°Ð¢6fVBçW6‚„FöÖ–æ–öä&öG•&öw&W72ææ÷&ÖÆ—¦U†÷Fõ&V6÷&B‡&W7öç6RæFF’“°Ð¢Ò6F6‚†W'&÷"’°Ð¢–b‡F‚’v—B7W&6Rç7F÷&vRæg&öÒ„FöÖ–æ–öä&öG•&öw&W72ä%T4´UB’ç&VÖ÷fR…·F…Ò“°Ð¢W'&÷'2çW6‚†G·6VÆV7F–öâæævÆRçFôÆ÷vW$66R‚—Ó¢G¶W'&÷#òæÖW76vRÇÂ'WÆöBf–ÆVB'Ö“°Ð¢ÐÐ¢ÐÐ¢–b‡6fVBæÆVæwF‚’v—BÆöD&öG•&öw&W75†÷F÷2‚“°Ð¢&WGW&â²6÷VçC¢6fVBæÆVæwF‚ÂW'&÷'2Ó°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâFVÆWFT&öG•&öw&W75†÷Fò‡†÷Fô–B’°Ð¢6öç7B&V6÷&BÒ&öG•&öw&W75†÷F÷2æf–æB‚†—FVÒ’Óâ7G&–ær†—FVÒæ–B’ÓÓÒ7G&–ær‡†÷Fô–B’“°Ð¢–b‚&V6÷&BÇÂv–æF÷ræ6öæf—&Ò†FVÆWFRF†RG·&V6÷&BæævÆRçFôÆ÷vW$66R‚—Ò†÷Fòg&öÒG·&V6÷&BæFFWÓö’’&WGW&ã°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B7F÷&vRÒv—B7W&6Rç7F÷&vRæg&öÒ„FöÖ–æ–öä&öG•&öw&W72ä%T4´UB’ç&VÖ÷fR…·&V6÷&Bç7F÷&vUF…Ò“°Ð¢–b‡7F÷&vRæW'&÷"’F‡&÷r7F÷&vRæW'&÷#°Ð¢6öç7BÖWFFFÒv—B7W&6Ræg&öÒ‚&&öG•÷&öw&W75÷†÷F÷2"’æFVÆWFR‚’æW‚&–B"Â&V6÷&Bæ–B’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B“°Ð¢–b†ÖWFFFæW'&÷"’F‡&÷rÖWFFFæW'&÷#°Ð¢&öG•&öw&W75†÷F÷2Ò&öG•&öw&W75†÷F÷2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ&V6÷&Bæ–B“°Ð¢&öG•†÷FõW&Ç2æFVÆWFR‡&V6÷&Bç7F÷&vUF‚“°Ð¢&VæFW$&öG•†÷FôW‡W&–Væ6R‚“°Ð¢6WEFW‡B‚&&öG’×†÷FòÖfVVF&6²"Â%†÷FòFVÆWFVBâ"“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâFVÆWFT&öG•&öw&W75†÷F÷4f÷$FFR†FFR’°Ð¢6öç7B&÷w2Ò&öG•&öw&W75†÷F÷2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæFFRÓÓÒFFR“°Ð¢–b‚&÷w2æÆVæwF‚ÇÂ6W76–öãòçW6W#òæ–B’&WGW&ã°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7BF‡2Ò&÷w2æÖ‚†—FVÒ’Óâ—FVÒç7F÷&vUF‚’æf–ÇFW"„&ööÆVâ“°Ð¢–b‡F‡2æÆVæwF‚’v—B7W&6Rç7F÷&vRæg&öÒ„FöÖ–æ–öä&öG•&öw&W72ä%T4´UB’ç&VÖ÷fR‡F‡2“°Ð¢v—B7W&6Ræg&öÒ‚&&öG•÷&öw&W75÷†÷F÷2"’æFVÆWFR‚’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æW‚'W&f÷&Öæ6UöFFR"ÂFFR“°Ð¢&öG•&öw&W75†÷F÷2Ò&öG•&öw&W75†÷F÷2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæFFRÓÒFFR“°Ð¢F‡2æf÷$V6‚‚‡F‚’Óâ&öG•†÷FõW&Ç2æFVÆWFR‡F‚’“°Ð¢&VæFW$&öG•†÷FôW‡W&–Væ6R‚“°Ð§ÐÐ Ð¦gVæ7F–öâ&öG”6†V6´–ä–çWB†f÷&Ô–BÒ&&öG’Ö6†V6¶–âÖf÷&Ò"’°Ð¢6öç7Bf÷&ÒÒG—Vöbf÷&Ô–BÓÓÒ'7G&–ær"òFö7VÖVçBævWDVÆVÖVçD'”–B†f÷&Ô–B’¢f÷&Ô–C°Ð¢–b‚f÷&Ò’&WGW&â·Ó°Ð¢6öç7BfÇVW2Òö&¦V7Bæg&öÔVçG&–W2†æWrf÷&ÔFF†f÷&Ò’æVçG&–W2‚’“°Ð¢6öç7BÖçVÂÒçVÖ&W"‡fÇVW2æ&öG•öfB“°Ð¢–b‡G—VöbFöÖ–æ–öä&öG•&öw&W72ÓÒ'VæFVf–æVB"bb‚çVÖ&W"æ—4f–æ—FR†ÖçVÂ’ÇÂÖçVÂÃÒ’’°Ð¢6öç7BW7F–ÖFRÒFöÖ–æ–öä&öG•&öw&W72æW7F–ÖFT&öG”fB‡fÇVW2Â&V7'V—E&öf–ÆTf÷$FÆ2‚’ÇÂ·Ò“°Ð¢–b†W7F–ÖFRçfÆ–B’°Ð¢fÇVW2æ&öG•öfBÒW7F–ÖFRçfÇVS°Ð¢fÇVW2æ&öG•öfEöÖWF†öBÒW7F–ÖFRæÖWF†öC°Ð¢fÇVW2æ&öG•öfEöW7F–ÖFVBÒG'VS°Ð¢fÇVW2æ&öG•öfE÷&ævUöÆ÷rÒW7F–ÖFRç&ævTÆ÷s°Ð¢fÇVW2æ&öG•öfE÷&ævUö†–v‚ÒW7F–ÖFRç&ævT†–vƒ°Ð¢ÐÐ¢ÒVÇ6R–b„çVÖ&W"æ—4f–æ—FR†ÖçVÂ’bbÖçVÂâ’°Ð¢fÇVW2æ&öG•öfEöÖWF†öBÒ%4TÄeõ$Uõ%DTB#°Ð¢fÇVW2æ&öG•öfEöW7F–ÖFVBÒfÇ6S°Ð¢ÐÐ¢&WGW&âfÇVW3°Ð§ÐÐ Ð¦gVæ7F–öâ&öG”6†V6´–åWV–B‚’°Ð¢&WGW&âvÆö&ÅF†—2æ7'—Fóòç&æFöÕUT”Còâ‚’ÇÂçVÆÃ°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâW'6—7D&öG”6†V6´–â†f÷&ÒÂfVVF&6´–BÒ&&öG’Ö6†V6¶–âÖfVVF&6²"’°Ð¢–b‡G—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7B–çWBÒ&öG”6†V6´–ä–çWB†f÷&Ò“°Ð¢6öç7BW†—7F–ærÒW&f÷&Öæ6TVçG&–W2æf–æB‚†VçG'’’ÓâVçG'’æFöÖ–âÓÓÒ&&öG•öÖWG&–72"bbVçG'’æ7F—f—G”6öFRÓÓÒ&&öG•ö6ö×÷6—F–öåö6†V6¶–â"bbVçG'’çW&f÷&Öæ6TFFRÓÓÒ–çWBæFFR“°Ð¢6öç7B&W7VÇBÒFöÖ–æ–öä&öG”6ö×÷6—F–öâæ'V–ÆD6†V6´–äVçG'’†–çWBÂ°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢æ÷s¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢W6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÂÀÐ¢W†—7F–æt–C¢W†—7F–æsòæ–BÇÂ&öG”6†V6´–åWV–B‚’ÀÐ¢7&VFVDC¢W†—7F–æsòæ7&VFVDBÇÂçVÆÀÐ¢Ò“°Ð¢–b‚&W7VÇBçfÆ–B’°Ð¢6WEFW‡B†fVVF&6´–BÂ&W7VÇBæW'&÷'5³Ò“°Ð¢&WGW&âfÇ6S°Ð¢ÐÐ¢6öç7BfÆ–FF–öâÒfÆ–FFUW&f÷&Öæ6TVçG'’‡&W7VÇBæVçG'’“°Ð¢–b‚fÆ–FF–öâçfÆ–B’°Ð¢6WEFW‡B†fVVF&6´–BÂfÆ–FF–öâæW'&÷'5³ÓòæÖW76vRÇÂ%F†B6†V6·ö–çB6÷VÆBæ÷B&RfÆ–FFVBâ"“°Ð¢&WGW&âfÇ6S°Ð¢ÐÐ¢6WEFW‡B†fVVF&6´–BÂ%6f–ær6†V6·ö–çN(
b"“°Ð¢6öç7B–ÆöBÒ'V–ÆEW&f÷&Öæ6UW'6—7FVæ6U–ÆöB‡fÆ–FF–öâæVçG'’Â6W76–öãòçW6W#òæ–BÇÂçVÆÂ“°Ð¢ÆWB6fVBÒ‡–G&FUW&f÷&Öæ6TVçG'’‡–ÆöB“°Ð¢ÆWB7F÷&vRÒ$Äô4Â#°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B&W7öç6RÒv—B7W&6Ræg&öÒ‚'W&f÷&Öæ6UöVçG&–W2"’çW6W'B‡–ÆöBÂ²öä6öæfÆ–7C¢&–B"Ò’ç6VÆV7B‚"¢"’ç6–ævÆR‚“°Ð¢–b‡&W7öç6RæW'&÷"’F‡&÷r&W7öç6RæW'&÷#°Ð¢6fVBÒ‡–G&FUW&f÷&Öæ6TVçG'’‡&W7öç6RæFFÇÂ–ÆöB“°Ð¢7F÷&vRÒ%5U$4R#°Ð¢Ò6F6‚…ò’·ÐÐ¢W&f÷&Öæ6TVçG&–W2Ò·6fVBÂââçW&f÷&Öæ6TVçG&–W2æf–ÇFW"‚†VçG'’’ÓâVçG'’æ–BÓÒ6fVBæ–Bbb†VçG'’æFöÖ–âÓÓÒ&&öG•öÖWG&–72"bbVçG'’æ7F—f—G”6öFRÓÓÒ&&öG•ö6ö×÷6—F–öåö6†V6¶–â"bbVçG'’çW&f÷&Öæ6TFFRÓÓÒ6fVBçW&f÷&Öæ6TFFR’•Ó°Ð¢W&f÷&Öæ6U7F÷&vTÖöFRÒ7F÷&vS°Ð¢W&f÷&Öæ6U6fU7FFRÒ7F÷&vRÓÓÒ%5U$4R"ò'6fVB"¢&Æö6ÆÇ’6fVB#°Ð¢6fTÆö6ÅW&f÷&Öæ6TVçG&–W2‡W&f÷&Öæ6TVçG&–W2“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‡W&f÷&Öæ6TVçG&–W2ÂW&f÷&Öæ6U7F÷&vTÖöFRÂW&f÷&Öæ6U6fU7FFR“°Ð¢–b‡G&VæDæÇ—F–746öçFW‡B’&VæFW%G&VæG4æÇ—F–72‡G&VæDæÇ—F–746öçFW‡Bæ–ç7V7F–öç2ÂG&VæDæÇ—F–746öçFW‡BæF–Ç•&V6÷&G2ÂG&VæDæÇ—F–746öçFW‡Bç7F÷&vTÖöFR“°Ð¢–b‡vVV¶Ç”–ç7V7F–öâ’&VæFW%vVV¶Ç”&öG”÷WF6öÖR‡vVV¶Ç”–ç7V7F–öâ“°Ð¢6öç7B†÷Fõ&W7VÇBÒv—BWÆöD&öG•&öw&W75†÷F÷2†f÷&ÒÂ6fVBçW&f÷&Öæ6TFFR“°Ð¢6öç7BVæ—BÒ–çWBçVæ—BÇÂ&–â#°Ð¢f÷&Óòç&W6WB‚“°Ð¢&W6WD&öG•&öw&W75†÷Fõ&Wf–Ww2†f÷&Ò“°Ð¢6öç7BFFT–çWBÒf÷&ÓòçVW'•6VÆV7F÷"‚u¶æÖSÒ&FFR%Òr“°Ð¢6öç7BVæ—D–çWBÒf÷&ÓòçVW'•6VÆV7F÷"‚u¶æÖSÒ'Væ—B%Òr“°Ð¢–b†FFT–çWB’FFT–çWBçfÇVRÒFöF”•4ôFFR‚“°Ð¢–b‡Væ—D–çWB’Væ—D–çWBçfÇVRÒVæ—C°Ð¢&VæFW$&öG”fDW7F–ÖFR†f÷&Ò“°Ð¢6öç7B÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚“°Ð¢&VæFW%FöF”&öG”6†V6·ö–çB†÷WF6öÖR“°Ð¢–b†÷WF6öÖR’&VæFW$&öG”÷WF6öÖR†÷WF6öÖR“°Ð¢v—B&V6öæ6–ÆT6×–våfW&F–7B‡²W'6—7C¢G'VRÒ“°Ð¢6öç7B†÷FôÖW76vRÒ†÷Fõ&W7VÇBæ6÷Vç@Ð¢òG·†÷Fõ&W7VÇBæ6÷VçGÒ&—fFR†÷FòG·†÷Fõ&W7VÇBæ6÷VçBÓÓÒò""¢'2'Ò6fVBæ Ð¢¢†÷Fõ&W7VÇBæW'&÷'2æÆVæwF€Ð¢òÖV7W&VÖVçG26fVC²†÷F÷2æVVBGFVçF–öâ‚G·†÷Fõ&W7VÇBæW'&÷'5³×Ò’æ Ð¢¢"#°Ð¢6WEFW‡B†fVVF&6´–BÂ‡7F÷&vRÓÓÒ%5U$4R"ò$6†V6·ö–çB6fVBFò–÷W"66÷VçBâFÆ2WFFVBF†R÷WF6öÖR6–væÂâ"¢$6†V6·ö–çB6fVBöâF†—2FWf–6S²66÷VçB7–æ2v–ÆÂ&WG'’â"’²†÷FôÖW76vR“°Ð¢&WGW&âG'VS°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ6fT&öG”6†V6´–â†WfVçB’°Ð¢WfVçCòç&WfVçDFVfVÇB‚“°Ð¢&WGW&âW'6—7D&öG”6†V6´–â†WfVçCòæ7W'&VçEF&vWBÇÂFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Ö6†V6¶–âÖf÷&Ò"’Â&&öG’Ö6†V6¶–âÖfVVF&6²"“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ6fUFöF”&öG”6†V6´–â†WfVçB’°Ð¢WfVçCòç&WfVçDFVfVÇB‚“°Ð¢6öç7B6fVBÒv—BW'6—7D&öG”6†V6´–â†WfVçCòæ7W'&VçEF&vWBÇÂFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6†V6¶–âÖf÷&Ò"’Â'FöF’Ö&öG’Ö6†V6¶–âÖfVVF&6²"“°Ð¢–b‡6fVB’°Ð¢6öç7B6GW&RÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'FöF’Ö&öG’Ö6GW&R"“°Ð¢–b†6GW&R’6GW&Ræ÷VâÒfÇ6S°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâVF—D&öG”6†V6´–â†VçG'”–B’°Ð¢6öç7BVçG'’ÒW&f÷&Öæ6TVçG&–W2æf–æB‚†—FVÒ’Óâ7G&–ær†—FVÒæ–B’ÓÓÒ7G&–ær†VçG'”–B’“°Ð¢–b‚VçG'’ÇÂG—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÓÒ'VæFVf–æVB"’&WGW&ã°Ð¢6öç7Bæ÷&ÖÆ—¦VBÒFöÖ–æ–öä&öG”6ö×÷6—F–öâææ÷&ÖÆ—¦T&öG”VçG'’†VçG'’“°Ð¢6öç7Bf÷&ÒÒFö7VÖVçBævWDVÆVÖVçD'”–B‚&&öG’Ö6†V6¶–âÖf÷&Ò"“°Ð¢–b‚f÷&Ò’&WGW&ã°Ð¢f÷&ÒæVÆVÖVçG2æFFRçfÇVRÒæ÷&ÖÆ—¦VBæFFRÇÂFöF”•4ôFFR‚“°Ð¢f÷&ÒæVÆVÖVçG2çVæ—BçfÇVRÒæ÷&ÖÆ—¦VBçVæ—BÇÂ&–â#°Ð¢FöÖ–æ–öä&öG”6ö×÷6—F–öâä4•$5TÔdU$Tä4Uô´U•2æf÷$V6‚‚†¶W’’Óâ²f÷&ÒæVÆVÖVçG5¶¶W•ÒçfÇVRÒFöÖ–æ–öä&öG”6ö×÷6—F–öâæF—7Æ”6—&7VÖfW&Væ6R†æ÷&ÖÆ—¦VBçfÇVW5¶¶W•ÒÂæ÷&ÖÆ—¦VBçVæ—B’óò"#²Ò“°Ð¢f÷&ÒæVÆVÖVçG2æ&öG•öfBçfÇVRÒæ÷&ÖÆ—¦VBçfÇVW2æ&öG•öfBóò"#°Ð¢f÷&ÒæVÆVÖVçG2ææ÷FW2çfÇVRÒæ÷&ÖÆ—¦VBææ÷FW2ÇÂ"#°Ð¢f÷&Òæ6Æ÷6W7B‚&FWF–Ç2"’æ÷VâÒG'VS°Ð¢f÷&Òç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢&6VçFW""Ò“°Ð¢&VæFW$&öG”fDW7F–ÖFR†f÷&Ò“°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂVF—F–ærG¶æ÷&ÖÆ—¦VBæFFWÒâ6f–ærv–ÆÂ&WÆ6RF†BFF^(	—26†V6·ö–çBæ“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâFVÆWFT&öG”6†V6´–â†VçG'”–B’°Ð¢–b‚VçG'”–BÇÂv–æF÷ræ6öæf—&Ò‚$FVÆWFRF†—2&öG’6†V6·ö–çCòF†—27F–öâ6ææ÷B&RVæFöæRâ"’’&WGW&ã°Ð¢6öç7B&VÖ÷fVBÒW&f÷&Öæ6TVçG&–W2æf–æB‚†VçG'’’Óâ7G&–ær†VçG'’æ–B’ÓÓÒ7G&–ær†VçG'”–B’“°Ð¢6öç7B&VÖ÷fVDFFRÒ&VÖ÷fVCòçW&f÷&Öæ6TFFRÇÂ&VÖ÷fVCòçW&f÷&Öæ6UöFFRÇÂçVÆÃ°Ð¢W&f÷&Öæ6TVçG&–W2ÒW&f÷&Öæ6TVçG&–W2æf–ÇFW"‚†VçG'’’Óâ7G&–ær†VçG'’æ–B’ÓÒ7G&–ær†VçG'”–B’“°Ð¢6fTÆö6ÅW&f÷&Öæ6TVçG&–W2‡W&f÷&Öæ6TVçG&–W2“°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B&W7öç6RÒv—B7W&6Ræg&öÒ‚'W&f÷&Öæ6UöVçG&–W2"’æFVÆWFR‚’æW‚&–B"ÂVçG'”–B“°Ð¢–b‡&W7öç6RæW'&÷"’F‡&÷r&W7öç6RæW'&÷#°Ð¢Ò6F6‚…ò’·ÐÐ¢–b‡&VÖ÷fVDFFR’v—BFVÆWFT&öG•&öw&W75†÷F÷4f÷$FFR‡&VÖ÷fVDFFR“°Ð¢&VæFW%W&f÷&Öæ6U6V7F–öâ‡W&f÷&Öæ6TVçG&–W2ÂW&f÷&Öæ6U7F÷&vTÖöFRÂW&f÷&Öæ6U6fU7FFR“°Ð¢–b‡G&VæDæÇ—F–746öçFW‡B’&VæFW%G&VæG4æÇ—F–72‡G&VæDæÇ—F–746öçFW‡Bæ–ç7V7F–öç2ÂG&VæDæÇ—F–746öçFW‡BæF–Ç•&V6÷&G2ÂG&VæDæÇ—F–746öçFW‡Bç7F÷&vTÖöFR“°Ð¢–b‡vVV¶Ç”–ç7V7F–öâ’&VæFW%vVV¶Ç”&öG”÷WF6öÖR‡vVV¶Ç”–ç7V7F–öâ“°Ð¢&VæFW%FöF”&öG”6†V6·ö–çB‚“°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"Â$6†V6·ö–çBFVÆWFVBâ"“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ&W6öÇfT&öG”÷WF6öÖU&Wf–Wr†7F–öâ’°Ð¢–b‡G—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÓÒ'VæFVf–æVB"’&WGW&âfÇ6S°Ð¢6öç7B÷WF6öÖRÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚“°Ð¢G'’°Ð¢6öç7B&V6÷&BÒFöÖ–æ–öä&öG”6ö×÷6—F–öâç&W6öÇfT÷WF6öÖU&Wf–Wr†÷WF6öÖSòç&Wf–WrÂ7F–öâÂ°Ð¢&W6öÇfVDC¢æWrFFR‚’çFô•4õ7G&–ær‚’ÀÐ¢W6W$–C¢6W76–öãòçW6W#òæ–BÇÂçVÆÀÐ¢Ò“°Ð¢6öç7B7–æ6VBÒv—B6fT&öG”÷WF6öÖU&Wf–Wr‡&V6÷&B“°Ð¢6öç7BæW‡BÒ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ‚“°Ð¢&VæFW%FöF”&öG”6†V6·ö–çB†æW‡B“°Ð¢&VæFW$&öG”÷WF6öÖR†æW‡B“°Ð¢6öç7BÖW76vRÒ&V6÷&Bç7FGW2ÓÓÒ$UD„õ$•¤TB Ð¢ò÷WF6öÖR&Wf–WrWF†÷&—¦VBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâæòÆâ÷"F&vWB6†ævVBæ Ð¢¢7W'&VçBÆâ†VÆBG·7–æ6VBò"æB6fVBFò–÷W"66÷VçB"¢"öâF†—2FWf–6R'ÒâFÆ2v–ÆÂ¶VWÖöæ—F÷&–æræ°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6¶–âÖfVVF&6²"ÂÖW76vR“°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂÖW76vR“°Ð¢&WGW&âG'VS°Ð¢Ò6F6‚†W'&÷"’°Ð¢6WEFW‡B‚'FöF’Ö&öG’Ö6†V6¶–âÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†B÷WF6öÖRFV6—6–öâ6÷VÆBæ÷B&R6fVBâ"“°Ð¢6WEFW‡B‚&&öG’Ö6†V6¶–âÖfVVF&6²"ÂW'&÷#òæÖW76vRÇÂ%F†B÷WF6öÖRFV6—6–öâ6÷VÆBæ÷B&R6fVBâ"“°Ð¢&WGW&âfÇ6S°Ð¢ÐÐ§ÐÐ Ð¦7–æ2gVæ7F–öâ†æFÆT&öG”÷WF6öÖT7F–öâ†WfVçB’°Ð¢6öç7B7F–öâÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ&öG’×&Wf–WrÖ7F–öåÒ"“°Ð¢–b†7F–öâ’°Ð¢7F–öâæF—6&ÆVBÒG'VS°Ð¢G'’²v—B&W6öÇfT&öG”÷WF6öÖU&Wf–Wr†7F–öâæFF6WBæ&öG•&Wf–Wt7F–öâ“²ÐÐ¢f–æÆÇ’²7F–öâæF—6&ÆVBÒfÇ6S²ÐÐ¢&WGW&âG'VS°Ð¢ÐÐ¢6öç7B&÷WFRÒWfVçBçF&vWBæ6Æ÷6W7B‚&'WGFöå¶FFÖ&öG’×&Wf–Wr×&÷WFUÒ"“°Ð¢–b‡&÷WFR’°Ð¢6öç7B6V7F–öâÒ&÷WFRæFF6WBæ&öG•&Wf–Wu&÷WFRÇÂ'G&VæG2#°Ð¢–b‡6V7F–öâÓÓÒ'G&VæG2"’6WEG&VæEf–Wr‚&&öG’"“°Ð¢6WD7F—fU6V7F–öâ‡6V7F–öâ“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â2G·6V7F–öçÖ“°Ð¢&WGW&âG'VS°Ð¢ÐÐ¢&WGW&âfÇ6S°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%&öw&ÕG&VæG4ÆVv7’†ÖöFVÂÂFöÖ–åG&VæG2ÂG&¦V7F÷'’Â7F÷&vTÖöFR’°Ð¢G&VæDF6†&ö&DÖöFVÂÒÖöFVÃ°Ð¢6WEFW‡B‚'G&VæBÖ6öÖÖæB×6–væÂ"ÂÖöFVÂæ6ö6†–ærç6–væÂ“°Ð¢6WEFW‡B‚'G&VæBÖ6öÖÖæBÖFWF–Â"ÂÖöFVÂæ6ö6†–æræFWF–Â“°Ð¢6öç7B7F–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖ6öÖÖæBÖ7F–öâ"“°Ð¢7F–öâçFW‡D6öçFVçBÒÖöFVÂæ6ö6†–æræ7F–öâæÆ&VÃ°Ð¢7F–öâæ‡&VbÒ2G¶ÖöFVÂæ6ö6†–æræ7F–öâç6V7F–öçÖ°Ð¢7F–öâæFF6WBç6V7F–öâÒÖöFVÂæ6ö6†–æræ7F–öâç6V7F–öã°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6R×66÷&R"ÂG¶ÖöFVÂæWf–FVæ6Rç66÷&WÒV“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6RÖÆ&VÂ"ÂÖöFVÂæWf–FVæ6RæÆ&VÂ“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6R×6÷W&6W2"ÂG¶ÖöFVÂæWf–FVæ6Rç6÷W&6T6÷VçGÒöbG¶ÖöFVÂæWf–FVæ6Rç÷76–&ÆU6÷W&6W7Ò6–væÇ6“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖWf–FVæ6R×&–ær"’ç7G–ÆRç6WE&÷W'G’‚"Ò×G&VæBÖWf–FVæ6R"ÂÖöFVÂæWf–FVæ6Rç66÷&R“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×G&VæB×&ævUÒ"’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâç6WDGG&–'WFR‚&&–×&W76VB"ÂçVÖ&W"†'WGFöâæFF6WBçG&VæE&ævR’ÓÓÒÖöFVÂç&ævTF—2ò'G'VR"¢&fÇ6R"’“°Ð Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖ·’Öw&–B"’æ–ææW$…DÔÂÒÖöFVÂæ·—2æÖ‚†—FVÒ’ÓâÆ'F–6ÆR6Æ73Ò'G&VæBÖ·’G¶W66T‡FÖÂ†—FVÒçFöæR—Ò"FFÖ·“Ò"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#àÐ¢Æ†VFW#ãÇ7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7ãâG·G&VæE7&´&'2†—FVÒç6W&–W2—ÓÂö†VFW#àÐ¢Ç7G&öæsâG·G&VæDÖWG&–5fÇVR†—FVÒçfÇVRÂ—FVÒç7Vff—‚—ÓÂ÷7G&öæsàÐ¢Ç6ÖÆÃâG¶W66T‡FÖÂ†—FVÒæFVÇFÆ&VÂÇÂ%6–væÂæ÷BW7F&Æ—6†VB"—ÓÂ÷6ÖÆÃàÐ¢ÆVÓâG¶W66T‡FÖÂ†—FVÒæWf–FVæ6RÇÂ$æòWf–FVæ6R"—ÓÂöVÓàÐ¢Âö'F–6ÆSæ’æ¦ö–â‚""“°Ð Ð¢6WEFW‡B‚'G&VæB×v–â"ÂÖöFVÂæ6ö6†–ærçv–â“°Ð¢6WEFW‡B‚'G&VæB×vF6‚"ÂÖöFVÂæ6ö6†–ærçvF6‚“°Ð¢6WEFW‡B‚'G&VæBÖæW‡B"ÂÖöFVÂæ6ö6†–ærææW‡B“°Ð¢&VæFW%G&VæE&–Ö'”6†'B†ÖöFVÂ“°Ð Ð¢6öç7BG&–æ–ærÒÖöFVÂçG&–æ–æs°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×G&–æ–ærÖw&–B"’æ–ææW$…DÔÂÒ°Ð¢²%7G&VæwF‚"ÂG&–æ–ærç7G&VæwF…6W76–öç2Â&F—2%ÒÀÐ¢²%'Vææ–ær"ÂG&–æ–ærç'VäÖ–ÆW2Â&Ö–ÆW2%ÒÀÐ¢²$6÷&R"ÂG&–æ–æræ6÷&U6W76–öç2Â'6W76–öç2%ÒÀÐ¢²$7F—fR"ÂG&–æ–ærçF÷FÅ6W76–öäF—2Â&F—2%ÐÐ¢ÒæÖ‚…¶Æ&VÂÂfÇVRÂVæ—EÒ’ÓâÆ'F–6ÆSãÇ7ãâG¶Æ&VÇÓÂ÷7ããÇ7G&öæsâG·fÇVWÓÂ÷7G&öæsãÇ6ÖÆÃâG·Væ—GÒ+rG¶ÖöFVÂç&ævTÆ&VÇÓÂ÷6ÖÆÃãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð Ð¢6öç7B&VF–æW72ÒÖöFVÂç&VF–æW73°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×&V6÷fW'’Öw&–B"’æ–ææW$…DÔÂÒ°Ð¢²$VæW&w’"ÂG&VæDÖWG&–5fÇVR‡&VF–æW72çfÇVRÂ"ó"’Â&ÆFW7BvB%ÒÀÐ¢²%6ÆVW"ÂG&VæDÖWG&–5fÇVR‡&VF–æW72ç6ÆVWfW&vRÂ"‡""’Â'&ævRfW&vR%ÒÀÐ¢²%&W7F–ær…""ÂG&VæDÖWG&–5fÇVR‡&VF–æW72ç&‡$fW&vRÂ"'Ò"’Â'&ævRfW&vR%ÒÀÐ¢²$…%b"ÂG&VæDÖWG&–5fÇVR‡&VF–æW72æ‡'dfW&vRÂ"×2"’Â'&ævRfW&vR%ÐÐ¢ÒæÖ‚…¶Æ&VÂÂfÇVRÂæ÷FUÒ’ÓâÆ'F–6ÆSãÇ7ãâG¶Æ&VÇÓÂ÷7ããÇ7G&öæsâG·fÇVWÓÂ÷7G&öæsãÇ6ÖÆÃâG¶æ÷FWÓÂ÷6ÖÆÃãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð Ð¢6öç7B&öG”÷WF6öÖRÒÖöFVÂæ&öG”6ö×÷6—F–öâÇÂ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ†ÖöFVÂ“°Ð¢&VæFW$&öG”÷WF6öÖR†&öG”÷WF6öÖR“°Ð¢&VæFW%FöF”&öG”6†V6·ö–çB†&öG”÷WF6öÖR“°Ð¢6öç7Bv–æF÷tFFW2ÒG&¦V7F÷'’çv–æF÷ræÖ‚†—FVÒ’Óâ—FVÒçvVVµ7F'DFFR“°Ð¢6WEFW‡B‚'G&VæB×v–æF÷r"Âv–æF÷tFFW2æÆVæwF‚òG·v–æF÷tFFW5³×Ò(	BG·v–æF÷tFFW2æB‚Ó—Ò+rG·v–æF÷tFFW2æÆVæwF‡Òf–æÆ—¦VBvVV²G·v–æF÷tFFW2æÆVæwF‚ÓÓÒò""¢'2'Ö¢$æòf–æÆ—¦VB66÷&VBv–æF÷r–WBâ"“°Ð¢6WEFW‡B‚&æÇ—F–72×7F÷&vR"Â7F÷&vTÖöFRÓÓÒ%5U$4R"ò$44õTåBUd”DTä4R"¢$DUd”4RUd”DTä4R"“°Ð¢6WEFW‡B‚'G&VæBÖÖWF†öB×fW'6–öâ"ÂÖöFVÂçfW'6–öâ“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖFöÖ–âÖw&–B"’æ–ææW$…DÔÂÒ4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’ÓâÆF—b6Æ73Ò'G&VæBÖFöÖ–âÖ6&BG¶FöÖ–åG&VæG5¶¶W•ÒæF—&V7F–öâçFôÆ÷vW$66R‚’ç&WÆ6TÆÂ‚""Â"Ò"—Ò#ãÇ7ãâG´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•×ÓÂ÷7ããÇ7G&öæsâG¶FöÖ–åG&VæG5¶¶W•ÒæF—&V7F–öçÓÂ÷7G&öæsãÇ6ÖÆÃâG¶FöÖ–åG&VæG5¶¶W•Òç6Æ÷RÓÓÒçVÆÂò$ÆV&æ–ær"¢G¶FöÖ–åG&VæG5¶¶W•Òç6Æ÷RçFôf—†VBƒ—ÒG2÷v¶ÓÂ÷6ÖÆÃãÂöF—cæ’æ¦ö–â‚""“°Ð¢6WEG&VæEf–Wr‡G&VæD7F—fUf–Wr“°Ð§ÐÐ Ð¦gVæ7F–öâ'V–ÆD7W'&VçEG&ç6f÷&ÖF–öäÆVFvW"†ÖöFVÂÒG&VæDF6†&ö&DÖöFVÂ’°Ð¢–b‚ÖöFVÂÇÂG—VöbFöÖ–æ–öåG&ç6f÷&ÖF–öäÆVFvW"ÓÓÒ'VæFVf–æVB"’&WGW&âçVÆÃ°Ð¢&WGW&âFöÖ–æ–öåG&ç6f÷&ÖF–öäÆVFvW"æ'V–ÆDÆVFvW"‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢G&VæDÖöFVÃ¢ÖöFVÂÀÐ¢6×–vã¢7W'&VçDFöÖ–æ–öä6×–vâÇÂ'V–ÆD7W'&VçDFöÖ–æ–öä6×–vâ‚’ÇÂ·ÒÀÐ¢7FæF&G3¢7FæF&G5&Wf–Wu7FFRÇÂµÒÀÐ¢†÷F÷3¢&öG•&öw&W75†÷F÷2ÇÂµÒÀÐ¢&æ³¢&æµ7FGW2ÇÂ·ÐÐ¢Ò“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%G&ç6f÷&ÖF–öäÆVFvW"†ÆVFvW"Ò'V–ÆD7W'&VçEG&ç6f÷&ÖF–öäÆVFvW"‚’’°Ð¢6öç7B&ö÷BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&ç6f÷&ÖF–öâÖÆVFvW""“°Ð¢–b‚&ö÷BÇÂÆVFvW"’&WGW&ã°Ð¢&ö÷BæFF6WBæÆVFvW%FöæRÒÆVFvW"ç7FGW2çFöæRÇÂ&æWWG&Â#°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"×7FGW2"ÂÆVFvW"ç7FGW2æÆ&VÂ“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6R×66÷&R"ÂG¶ÆVFvW"æ6öæf–FVæ6Rç66÷&WÒV“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6RÖÆ&VÂ"ÂÆVFvW"æ6öæf–FVæ6RæÆ&VÂ“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6R×6÷W&6W2"ÂG¶ÆVFvW"æ6öæf–FVæ6Rç6÷W&6T6÷VçGÒöbG¶ÆVFvW"æ6öæf–FVæ6Rç÷76–&ÆU6÷W&6W7Ò6–væÇ6“°Ð¢6öç7BWf–FVæ6U&–ærÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖWf–FVæ6R×&–ær"“°Ð¢–b†Wf–FVæ6U&–ær’Wf–FVæ6U&–ærç7G–ÆRç6WE&÷W'G’‚"Ò×G&VæBÖWf–FVæ6R"ÂÆVFvW"æ6öæf–FVæ6Rç66÷&R“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"×†6R"ÂÆVFvW"æ6×–vâç†6R“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"×vVV²"ÂÆVFvW"æ6×–vâçvVV²òtTT²G¶ÆVFvW"æ6×–vâçvVV·ÒòG¶ÆVFvW"æ6×–vâçF÷FÅvVV·7Ö¢$äõB5D%DTB"“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"Öf÷&V67B"ÂÆVFvW"æ6×–vâæf÷&V67B“°Ð¢6öç7B&öw&W72ÒFö7VÖVçBçVW'•6VÆV7F÷"‚"çG&ç6f÷&ÖF–öâÖÆVFvW"×&öw&W72"“°Ð¢–b‡&öw&W72’&öw&W72ç6WDGG&–'WFR‚&&–×fÇVVæ÷r"Â7G&–ær†ÆVFvW"æ6×–vâç&öw&W72’“°Ð¢6öç7B&öw&W74&"ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&ç6f÷&ÖF–öâÖÆVFvW"×&öw&W72"“°Ð¢–b‡&öw&W74&"’&öw&W74&"ç7G–ÆRçv–GF‚ÒG¶ÆVFvW"æ6×–vâç&öw&W77ÒV°Ð¢6öç7B&öö¶VæG2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&ç6f÷&ÖF–öâÖÆVFvW"Ö&öö¶VæG2"“°Ð¢–b†&öö¶VæG2’&öö¶VæG2æ–ææW$…DÔÂÒÆVFvW"æ&öö¶VæG2æÖ‚†—FVÒ’ÓâÆ'F–6ÆRFFÖ6ö×&&ÆSÒ"G¶—FVÒæ6ö×&&ÆRò'G'VR"¢&fÇ6R'Ò#àÐ¢Ç7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7ãàÐ¢ÆF—cãÇ6ÖÆÃå5D%CÂ÷6ÖÆÃãÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒæg&öÒ—ÓÂ÷7G&öæsãÆ’&–Ö†–FFVãÒ'G'VR#î(i#Âö“ãÇ6ÖÆÃääõsÂ÷6ÖÆÃãÇ7G&öæsâG¶W66T‡FÖÂ†—FVÒçFò—ÓÂ÷7G&öæsãÂöF—càÐ¢Æ#âG¶W66T‡FÖÂ†—FVÒæ6†ævR—ÓÂö#àÐ¢Âö'F–6ÆSæ’æ¦ö–â‚""“°Ð¢6öç7B6–væÇ2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&ç6f÷&ÖF–öâÖÆVFvW"×6–væÇ2"“°Ð¢–b‡6–væÇ2’6–væÇ2æ–ææW$…DÔÂÒÆVFvW"ç6–væÇ2æÖ‚†—FVÒ’ÓâÆ'F–6ÆRFFÖÆVFvW"×6–væÃÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò"FFÖÆVFvW"×FöæSÒ"G¶W66T‡FÖÂ†—FVÒçFöæRÇÂ&æWWG&Â"—Ò"FFÖÆVFvW"×&VG“Ò"G¶—FVÒç&VG’ò'G'VR"¢&fÇ6R'Ò#àÐ¢Æ†VFW#ãÇ7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7ããÆ’&–Ö†–FFVãÒ'G'VR#ãÂö“ãÂö†VFW#àÐ¢Ç7G&öæsâG¶W66T‡FÖÂ†—FVÒçfÇVR—ÓÂ÷7G&öæsàÐ¢Ç6ÖÆÃâG¶W66T‡FÖÂ†—FVÒæFWF–Â—ÓÂ÷6ÖÆÃàÐ¢ÆVÓâG¶W66T‡FÖÂ†—FVÒæWf–FVæ6R—ÓÂöVÓàÐ¢Âö'F–6ÆSæ’æ¦ö–â‚""“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"Ö6†ævVB"ÂÆVFvW"æ6†ævVBæ†VFÆ–æR“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"Ö6†ævVBÖFWF–Â"ÂG¶ÆVFvW"æ6†ævVBæÆ&VÇÒ+rG¶ÆVFvW"æ6†ævVBæFWF–ÇÖ“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"ÖæW‡B"ÂÆVFvW"ææW‡Bæ†VFÆ–æR“°Ð¢6WEFW‡B‚'G&ç6f÷&ÖF–öâÖÆVFvW"ÖæW‡BÖFWF–Â"ÂÆVFvW"ææW‡BæFWF–Â“°Ð¢6öç7B7F–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&ç6f÷&ÖF–öâÖÆVFvW"ÖæW‡BÖ7F–öâ"“°Ð¢–b†7F–öâ’°Ð¢6öç7B6V7F–öâÒÆVFvW"ææW‡Bç6V7F–öâÇÂ'FöF’#°Ð¢7F–öâçFW‡D6öçFVçBÒ6V7F–öâÓÓÒ'FöF’"ò$÷VâFöF’"¢6V7F–öâÓÓÒ&–ç7V7F–öâ"ò$÷Vâ&Wf–Wr"¢6V7F–öâÓÓÒ&çWG&—F–öâ"ò$÷VâgVVÂ"¢÷VâG·6V7F–öâæ6†$Bƒ’çFõWW$66R‚—ÒG·6V7F–öâç6Æ–6Rƒ—Ö°Ð¢7F–öâæ‡&VbÒ2G·6V7F–öçÖ°Ð¢7F–öâæFF6WBç6V7F–öâÒ6V7F–öã°Ð¢7F–öâæFF6WBçG&VæEF&vWEf–WrÒÆVFvW"ææW‡Bçf–WrÇÂ"#°Ð¢ÐÐ§ÐÐ Ð¦gVæ7F–öâ&Vg&W6…G&ç6f÷&ÖF–öäÆVFvW"‚’°Ð¢–b‡G&VæDF6†&ö&DÖöFVÂ’&VæFW%G&ç6f÷&ÖF–öäÆVFvW"†'V–ÆD7W'&VçEG&ç6f÷&ÖF–öäÆVFvW"‡G&VæDF6†&ö&DÖöFVÂ’“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%&öw&ÕG&VæG2†ÖöFVÂÂFöÖ–åG&VæG2ÂG&¦V7F÷'’Â7F÷&vTÖöFR’°¢G&VæDF6†&ö&DÖöFVÂÒÖöFVÃ°¢&VæFW$FÆ4FV6—6–öå&ööeG&VæG2‚“°¢6WEFW‡B‚'G&VæBÖ6öÖÖæB×6–væÂ"ÂÖöFVÂæ6ö6†–ærç6–væÂ“°Ð¢6WEFW‡B‚'G&VæBÖ6öÖÖæBÖFWF–Â"ÂÖöFVÂæ6ö6†–æræFWF–Â“°Ð¢6öç7B7F–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖ6öÖÖæBÖ7F–öâ"“°Ð¢7F–öâçFW‡D6öçFVçBÒÖöFVÂæ6ö6†–æræ7F–öâæÆ&VÃ°Ð¢7F–öâæ‡&VbÒ2G¶ÖöFVÂæ6ö6†–æræ7F–öâç6V7F–öçÖ°Ð¢7F–öâæFF6WBç6V7F–öâÒÖöFVÂæ6ö6†–æræ7F–öâç6V7F–öã°Ð¢7F–öâæFF6WBçG&VæEF&vWEf–WrÒÖöFVÂæ6ö6†–æræ7F–öâçf–WrÇÂ"#°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6R×66÷&R"ÂG¶ÖöFVÂæWf–FVæ6Rç66÷&WÒV“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6RÖÆ&VÂ"ÂÖöFVÂæWf–FVæ6RæÆ&VÂ“°Ð¢6WEFW‡B‚'G&VæBÖWf–FVæ6R×6÷W&6W2"ÂG¶ÖöFVÂæWf–FVæ6Rç6÷W&6T6÷VçGÒöbG¶ÖöFVÂæWf–FVæ6Rç÷76–&ÆU6÷W&6W7Ò6–væÇ6“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖWf–FVæ6R×&–ær"’ç7G–ÆRç6WE&÷W'G’‚"Ò×G&VæBÖWf–FVæ6R"ÂÖöFVÂæWf–FVæ6Rç66÷&R“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×G&VæB×&ævUÒ"’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâç6WDGG&–'WFR‚&&–×&W76VB"ÂçVÖ&W"†'WGFöâæFF6WBçG&VæE&ævR’ÓÓÒÖöFVÂç&ævTF—2ò'G'VR"¢&fÇ6R"’“°Ð Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖ·’Öw&–B"’æ–ææW$…DÔÂÒÖöFVÂç66÷&V6&G2æÖ‚†—FVÒ’ÓâÆ'F–6ÆR6Æ73Ò'G&VæBÖ·’G&VæB×66÷&V6&BG¶W66T‡FÖÂ†—FVÒçFöæR—Ò"FFÖ÷WF6öÖSÒ"G¶W66T‡FÖÂ†—FVÒæ–B—Ò#àÐ¢Æ†VFW#ãÇ7ãâG¶W66T‡FÖÂ†—FVÒæÆ&VÂ—ÓÂ÷7ããÆVÓâG¶W66T‡FÖÂ†—FVÒç7FGW2—ÓÂöVÓãÂö†VFW#àÐ¢Ç7G&öæsâG¶W66T‡FÖÂ†—FVÒçfÇVR—ÓÂ÷7G&öæsàÐ¢Ç6ÖÆÃâG¶W66T‡FÖÂ†—FVÒæFWF–ÂÇÂ%6–væÂæ÷BW7F&Æ—6†VB"—ÓÂ÷6ÖÆÃàÐ¢Æfö÷FW#âG¶W66T‡FÖÂ†—FVÒæWf–FVæ6RÇÂ$æòWf–FVæ6R"—ÓÂöfö÷FW#àÐ¢Âö'F–6ÆSæ’æ¦ö–â‚""“°Ð Ð¢6WEFW‡B‚'G&VæB×v–â"ÂÖöFVÂæ6ö6†–ærçv–â“°Ð¢6WEFW‡B‚'G&VæB×vF6‚"ÂÖöFVÂæ6ö6†–ærçvF6‚“°Ð¢6WEFW‡B‚'G&VæBÖæW‡B"ÂÖöFVÂæ6ö6†–ærææW‡B“°Ð¢&VæFW%G&VæE&–Ö'”6†'B†ÖöFVÂ“°Ð Ð¢6öç7BG&–æ–ærÒÖöFVÂçG&–æ–æs°Ð¢6öç7B7G&VæwF‚ÒG&–æ–ærç7G&VæwFƒ°Ð¢6öç7BG&–æ–æt6öÖÖæBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×G&–æ–ærÖ6öÖÖæB"“°Ð¢G&–æ–æt6öÖÖæBæ–ææW$…DÔÂÒÇ7ãåE$”ä”är$TCÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡7G&VæwF‚çG&¦V7F÷'’—ÓÂ÷7G&öæsãÆƒ3âG¶W66T‡FÖÂ‡7G&VæwF‚çG&¦V7F÷'’ÓÓÒ%$õDT5B"ò%&÷FV7BF†RæW‡BW‡÷7W&R"¢7G&VæwF‚çG&¦V7F÷'’ÓÓÒ$%T”ÄD”är"ò%v÷&¶ÆöB—2'V–ÆF–ær"¢7G&VæwF‚çG&¦V7F÷'’ÓÓÒ%5DTE’"ò%v÷&¶ÆöB—2†öÆF–ær"¢$W7F&Æ—6‚F†Rv÷&¶ÆöB"—ÓÂöƒ3ãÇâG¶W66T‡FÖÂ‡7G&VæwF‚çv÷&µ6WG2òG·7G&VæwF‚çv÷&µ6WG7ÒfW&–f–VBv÷&²6WG27&÷72G·G&–æ–ærç7G&VæwF…6W76–öç7Ò7G&VæwF‚F’G·G&–æ–ærç7G&VæwF…6W76–öç2ÓÓÒò""¢'2'Òæ¢$Æörv÷&¶–ær6WG2FòW7F&Æ—6‚ÆöBæBVff÷'BG&VæG2â"—ÓÂ÷æ°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×G&–æ–ærÖw&–B"’æ–ææW$…DÔÂÒ°Ð¢²%7G&VæwF‚"ÂG&–æ–ærç7G&VæwF…6W76–öç2Â'6W76–öç2"ÂG·G&VæE6–væVEfÇVR‡G&–æ–ærç7G&VæwF„FVÇF—Òg2&–÷&ÒÀÐ¢²%v÷&²6WG2"Â7G&VæwF‚çv÷&µ6WG2Â'fW&–f–VB6WG2"Â7G&VæwF‚æ6ö×ÆWF–öå&FRÓÓÒçVÆÂò$6ö×ÆWF–öâ'V–ÆF–ær"¢G·7G&VæwF‚æ6ö×ÆWF–öå&FWÒR6ö×ÆWF–öæÒÀÐ¢²%v÷&²föÇVÖR"ÂG&VæD6ö×7DçVÖ&W"‡7G&VæwF‚çföÇVÖR’Â&ÆöB‚&W2"Â7G&VæwF‚çföÇVÖTFVÇFÓÓÒçVÆÂò$6ö×&—6öâ'V–ÆF–ær"¢G·G&VæE6–væVEfÇVR‡7G&VæwF‚çföÇVÖTFVÇFÂ"R"—Òg2&–÷&ÒÀÐ¢²$fW&vR%R"ÂG&VæDÖWG&–5fÇVR‡7G&VæwF‚æfW&vU'R’Â'&V6÷&FVBVff÷'B"Â7G&VæwF‚ç–ä÷%7F÷2òG·7G&VæwF‚ç–ä÷%7F÷7Ò–â÷"7F÷fÆv¢$æò–â÷"7F÷fÆr%ÒÀÐ¢²%'Vææ–ær"ÂG&–æ–ærç'VäÖ–ÆW2Â&Ö–ÆW2"ÂG·G&–æ–ærç'Vå6W76–öç7Ò'VâF—6ÒÀÐ¢²%'Vâ6R"ÂG&VæE6R‡G&–æ–ærç'Vå6U6V6öæG2’Â'W"Ö–ÆR"ÂG&–æ–ærç'Vå6TFVÇF6V6öæG2ÓÓÒçVÆÂò$6ö×&—6öâ'V–ÆF–ær"¢G´ÖF‚æ'2‡G&–æ–ærç'Vå6TFVÇF6V6öæG2—Ò6V2G·G&–æ–ærç'Vå6TFVÇF6V6öæG2Âò&f7FW""¢'6Æ÷vW"'ÖÒÀÐ¢²$6÷&R"ÂG&–æ–æræ6÷&U6W76–öç2Â'6W76–öç2"ÂG·G&–æ–æræ6÷&TÖ–çWFW7Ò&V6÷&FVBÖ–çWFW6ÒÀÐ¢²$7F—fR"ÂG&–æ–ærçF÷FÅ6W76–öäF—2Â&F—2"ÂÖöFVÂç&ævTÆ&VÅÐÐ¢ÒæÖ‚…¶Æ&VÂÂfÇVRÂVæ—BÂæ÷FUÒ’ÓâÆ'F–6ÆSãÇ7ãâG¶W66T‡FÖÂ†Æ&VÂ—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡fÇVR—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ‡Væ—B—ÓÂ÷6ÖÆÃãÆVÓâG¶W66T‡FÖÂ†æ÷FR—ÓÂöVÓãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð Ð¢6öç7B&VF–æW72ÒÖöFVÂç&VF–æW73°Ð¢6öç7B&V6÷fW'”6öÖÖæBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×&V6÷fW'’Ö6öÖÖæB"“°Ð¢&V6÷fW'”6öÖÖæBæ–ææW$…DÔÂÒÇ7ãå$T4õdU%’$TCÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡&VF–æW72ç7FFR—ÓÂ÷7G&öæsãÆƒ3âG¶W66T‡FÖÂ‡&VF–æW72ç7FFRÓÓÒ%$õDT5B"ò%&V6÷fW'’7&÷76VBwV&G&–Â"¢&VF–æW72ç7FFRÓÓÒ%$TE’"ò%&V6÷fW'’7W÷'G2F†RÆâ"¢&VF–æW72ç7FFRÓÓÒ%tD4‚"ò$†öÆBF†R7W'&VçBwV&G&–Ç2"¢$'V–ÆBF†R&V6÷fW'’&6VÆ–æR"—ÓÂöƒ3ãÇâG¶W66T‡FÖÂ‡&VF–æW72æFVÇFÓÓÒçVÆÂò$6V6öæB6WfVâÖF’v–æF÷r—2&WV—&VBf÷"&VÆ–&ÆR6ö×&—6öââ"¢VæW&w’Ö÷fVBG·G&VæE6–væVEfÇVR‡&VF–æW72æFVÇF—ÒfW'7W2F†R&–÷"6WfVâF—2æ—ÓÂ÷æ°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæB×&V6÷fW'’Öw&–B"’æ–ææW$…DÔÂÒ°Ð¢²$VæW&w’"ÂG&VæDÖWG&–5fÇVR‡&VF–æW72çfÇVRÂ"ó"’Â&ÆFW7BvB"ÂG&VæE6–væVEfÇVR‡&VF–æW72æFVÇF•ÒÀÐ¢²%6ÆVW"ÂG&VæDÖWG&–5fÇVR‡&VF–æW72ç6ÆVWfW&vRÂ"‡""’Â&ÆFW7BvB"ÂG&VæE6–væVEfÇVR‡&VF–æW72ç6ÆVWFVÇFÂ"‡""•ÒÀÐ¢²%&W7F–ær…""ÂG&VæDÖWG&–5fÇVR‡&VF–æW72ç&‡$fW&vRÂ"'Ò"’Â&ÆFW7BvB"ÂG&VæE6–væVEfÇVR‡&VF–æW72ç&‡$FVÇFÂ"'Ò"•ÒÀÐ¢²$…%b"ÂG&VæDÖWG&–5fÇVR‡&VF–æW72æ‡'dfW&vRÂ"×2"’Â&ÆFW7BvB"ÂG&VæE6–væVEfÇVR‡&VF–æW72æ‡'dFVÇFÂ"×2"•ÐÐ¢ÒæÖ‚…¶Æ&VÂÂfÇVRÂæ÷FRÂFVÇFÒ’ÓâÆ'F–6ÆSãÇ7ãâG¶W66T‡FÖÂ†Æ&VÂ—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡fÇVR—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ†æ÷FR—ÓÂ÷6ÖÆÃãÆVÓâG¶W66T‡FÖÂ†FVÇF—Òg2&–÷"vCÂöVÓãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð Ð¢6öç7BgVVÂÒÖöFVÂæçWG&—F–öã°Ð¢6öç7BgVVÄ6öÖÖæBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖgVVÂÖ6öÖÖæB"“°Ð¢gVVÄ6öÖÖæBæ–ææW$…DÔÂÒÇ7ãäeTTÂ$TCÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ†gVVÂç7FFR—ÓÂ÷7G&öæsãÆƒ3âG¶W66T‡FÖÂ†gVVÂç7FFRÓÓÒ$ôâD$tUB"ò$gVVÂ7W÷'G2F†R&öw&Ò"¢gVVÂç7FFRÓÓÒ$4ôå5E$”åB"ò$gVVÂ—2Æ–Ö—F–ærF†R6–væÂ"¢gVVÂç7FFRÓÓÒ%tD4‚"ò$6Æ÷6RF†RF†W&Væ6Rv"¢$'V–ÆB6ö×ÆWFRgVVÂF—2"—ÓÂöƒ3ãÇâG¶W66T‡FÖÂ†gVVÂæFVÇFÆ&VÂ—ÓÂ÷æ°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖgVVÂÖw&–B"’æ–ææW$…DÔÂÒ°Ð¢²$–â&ævR"ÂG&VæDÖWG&–5fÇVR†gVVÂçfÇVRÂ"R"’Â&6Æ÷&–W2²&÷FV–â"ÂgVVÂæFVÇFÓÓÒçVÆÂò$6ö×&—6öâ'V–ÆF–ær"¢G·G&VæE6–væVEfÇVR†gVVÂæFVÇF—ÒG2g2&–÷&ÒÀÐ¢²$6÷fW&vR"ÂG&VæDÖWG&–5fÇVR†gVVÂæ6÷fW&vRÂ"R"’Â&F—2v—F‚6ö×ÆWFRFF"ÂG¶gVVÂæWf–FVæ6TF—7Ò6ö×ÆWFRF—6ÒÀÐ¢²$6Æ÷&–W2"ÂG&VæDÖWG&–5fÇVR†gVVÂæfW&vT6Æ÷&–W2’Â&F–Ç’fW&vR"ÂgVVÂçF&vWG5&VG’ò$&÷fVBF&vWG2Æ–æ¶VB"¢%F&vWG2&WV—&VB%ÒÀÐ¢²%&÷FV–â"ÂG&VæDÖWG&–5fÇVR†gVVÂæfW&vU&÷FV–âÂ"r"’Â&F–Ç’fW&vR"ÂgVVÂçF&vWG5&VG’ò$&÷fVBF&vWG2Æ–æ¶VB"¢%F&vWG2&WV—&VB%ÐÐ¢ÒæÖ‚…¶Æ&VÂÂfÇVRÂæ÷FRÂWf–FVæ6UÒ’ÓâÆ'F–6ÆSãÇ7ãâG¶W66T‡FÖÂ†Æ&VÂ—ÓÂ÷7ããÇ7G&öæsâG¶W66T‡FÖÂ‡fÇVR—ÓÂ÷7G&öæsãÇ6ÖÆÃâG¶W66T‡FÖÂ†æ÷FR—ÓÂ÷6ÖÆÃãÆVÓâG¶W66T‡FÖÂ†Wf–FVæ6R—ÓÂöVÓãÂö'F–6ÆSæ’æ¦ö–â‚""“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖgVVÂÖ6†'B"’æ–ææW$…DÔÂÒG&VæE6W&–W4&'2†gVVÂç6W&–W2Â²F—FÆS¢$gVVÂF†W&Væ6R"ÂVæ—C¢"R"ÂÖ–ã¢ÂÖƒ¢ÂÆ&VÃ¢$F–Ç’gVVÂF†W&Væ6R"Ò“°Ð Ð¢6öç7B&öG”÷WF6öÖRÒÖöFVÂæ&öG”6ö×÷6—F–öâÇÂ'V–ÆD7W'&VçD&öG”÷WF6öÖTÖöFVÂ†ÖöFVÂ“°Ð¢&VæFW$&öG”÷WF6öÖR†&öG”÷WF6öÖR“°Ð¢&VæFW%FöF”&öG”6†V6·ö–çB†&öG”÷WF6öÖR“°Ð¢6öç7Bv–æF÷tFFW2ÒG&¦V7F÷'’çv–æF÷ræÖ‚†—FVÒ’Óâ—FVÒçvVVµ7F'DFFR“°Ð¢6WEFW‡B‚'G&VæB×v–æF÷r"Âv–æF÷tFFW2æÆVæwF‚òG·v–æF÷tFFW5³×ÒÒG·v–æF÷tFFW2æB‚Ó—ÒÒG·v–æF÷tFFW2æÆVæwF‡Òf–æÆ—¦VBvVV²G·v–æF÷tFFW2æÆVæwF‚ÓÓÒò""¢'2'Ö¢$æòf–æÆ—¦VB66÷&VBv–æF÷r–WBâ"“°Ð¢6WEFW‡B‚&æÇ—F–72×7F÷&vR"Â7F÷&vTÖöFRÓÓÒ%5U$4R"ò$44õTåBUd”DTä4R"¢$DUd”4RUd”DTä4R"“°Ð¢6WEFW‡B‚'G&VæBÖÖWF†öB×fW'6–öâ"ÂÖöFVÂçfW'6–öâ“°Ð¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚'G&VæBÖFöÖ–âÖw&–B"’æ–ææW$…DÔÂÒ4ôÕÄ”ä4UôDôÔ”å2æÖ‚†¶W’’ÓâÆF—b6Æ73Ò'G&VæBÖFöÖ–âÖ6&BG¶FöÖ–åG&VæG5¶¶W•ÒæF—&V7F–öâçFôÆ÷vW$66R‚’ç&WÆ6TÆÂ‚""Â"Ò"—Ò#ãÇ7ãâG´4ôÕÄ”ä4UôDôÔ”åôÄ$TÅ5¶¶W•×ÓÂ÷7ããÇ7G&öæsâG¶FöÖ–åG&VæG5¶¶W•ÒæF—&V7F–öçÓÂ÷7G&öæsãÇ6ÖÆÃâG¶FöÖ–åG&VæG5¶¶W•Òç6Æ÷RÓÓÒçVÆÂò$ÆV&æ–ær"¢G¶FöÖ–åG&VæG5¶¶W•Òç6Æ÷RçFôf—†VBƒ—ÒG2÷v¶ÓÂ÷6ÖÆÃãÂöF—cæ’æ¦ö–â‚""“°Ð¢&VæFW%G&ç6f÷&ÖF–öäÆVFvW"†'V–ÆD7W'&VçEG&ç6f÷&ÖF–öäÆVFvW"†ÖöFVÂ’“°Ð¢6WEG&VæEf–Wr‡G&VæD7F—fUf–Wr“°Ð§ÐÐ Ð¦gVæ7F–öâ&VæFW%G&VæG4æÇ—F–72†–ç7V7F–öç2ÂF–Ç•&V6÷&G2Â7F÷&vTÖöFR’°Ð¢–ç7V7F–öä†—7F÷'’Ò6æöæ–6Äf–æÆ—¦VD–ç7V7F–öç2†–ç7V7F–öç2“°Ð¢6öç7B7W'&VçE&ævRÒvWD–ç7V7F–öåvVVµ&ævR‡FöF”•4ôFFR‚’“°Ð¢6öç7B7W'&VçDvw&VvFRÒvw&VvFUvVV¶Ç”6ö×Æ–æ6R†F–Ç•&V6÷&G2Â7W'&VçE&ævRçvVVµ7F'DFFR“°Ð¢6öç7B†4f–æÆ—¦VD7W'&VçEvVV²Ò6÷'D–ç7V7F–öä†—7F÷'’†–ç7V7F–öç2’ç6öÖR‚†—FVÒ’Óâ—FVÒçvVVµ7F'DFFRÓÓÒ7W'&VçE&ævRçvVVµ7F'DFFRbb—FVÒæf–æÆ—¦VDB“°Ð¢6öç7B&÷f—6–öæÂÒ7W'&VçDvw&VvFRæ6÷VçG2æ76W76VDö'6W'fF–öç2âbb†4f–æÆ—¦VD7W'&VçEvVV²ò7W'&VçDvw&VvFR¢çVÆÃ°Ð¢6öç7BG&¦V7F÷'’ÒFW&—fUG&¦V7F÷'•7FFR†–ç7V7F–öä†—7F÷'’Â²v–æF÷u6—¦S¢ÖF‚æÖ‚ƒBÂÖF‚ç&÷VæB‡G&VæE&ævTF—2òr’’Ò“°Ð¢6öç7BFöÖ–åG&VæG2Ò6Æ7VÆFTFöÖ–åG&VæG2†–ç7V7F–öä†—7F÷'’Â²v–æF÷u6—¦S¢ÖF‚æÖ‚ƒBÂÖF‚ç&÷VæB‡G&VæE&ævTF—2òr’’Ò“°Ð¢–b‡G—VöbFöÖ–æ–öåG&VæG2ÓÓÒ'VæFVf–æVB"’°Ð¢&VæFW$ÆVv7•G&VæG4æÇ—F–72†–ç7V7F–öç2ÂF–Ç•&V6÷&G2Â7F÷&vTÖöFR“°Ð¢&WGW&ã°Ð¢ÐÐ¢G&VæDæÇ—F–746öçFW‡BÒ²–ç7V7F–öç2ÂF–Ç•&V6÷&G2Â7F÷&vTÖöFRÓ°Ð¢6öç7BG&VæD–çWG2Ò°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢&ævTF—3¢G&VæE&ævTF—2ÀÐ¢–ç7V7F–öç3¢–ç7V7F–öä†—7F÷'’ÀÐ¢F–Ç•7FFW3¢ÖW&vU&VF–æW74†—7F÷'’‚’ÀÐ¢F–Ç•&V6÷&G2ÀÐ¢W&f÷&Öæ6TVçG&–W2ÀÐ¢7G&VæwF„†—7F÷'“¢&VE7G&VæwF„†—7F÷'’‚’ÀÐ¢6÷&T†—7F÷'“¢&VD6÷&T†—7F÷'’‚’ÀÐ¢çWG&—F–öäF—3¢G&VæDçWG&—F–öä†—7F÷'’ƒƒB’ÀÐ¢çWG&—F–öåF&vWG3¢7W'&VçDçWG&—F–öä&6UF&vWG2‡FöF”•4ôFFR‚’Ð¢Ó°Ð¢6öç7B&6TÖöFVÂÒFöÖ–æ–öåG&VæG2æ'V–ÆE&öw&ÕG&VæDÖöFVÂ‡G&VæD–çWG2“°Ð¢6öç7B&öG”6ö×÷6—F–öâÒG—VöbFöÖ–æ–öä&öG”6ö×÷6—F–öâÓÓÒ'VæFVf–æVB"òçVÆÂ¢FöÖ–æ–öä&öG”6ö×÷6—F–öâæ'V–ÆD÷WF6öÖTÖöFVÂ‡°Ð¢FöF“¢FöF”•4ôFFR‚’ÀÐ¢&ævTF—3¢G&VæE&ævTF—2ÀÐ¢W&f÷&Öæ6TVçG&–W2ÀÐ¢F–Ç•7FFW3¢G&VæD–çWG2æF–Ç•7FFW2ÀÐ¢6öçG&7C¢&VD&÷fVE&V7'V—D6öçG&7B‚’ÇÂ·ÒÀÐ¢6–væÇ3¢°Ð¢F—66—Æ–æS¢&6TÖöFVÂæF—66—Æ–æRçfÇVRÀÐ¢çWG&—F–öã¢&6TÖöFVÂæçWG&—F–öâçfÇVRÀÐ¢7G&VæwF…6W76–öç3¢&6TÖöFVÂçG&–æ–ærç7G&VæwF…6W76–öç0Ð¢ÒÀÐ¢&–÷%&Wf–Ws¢&VD&öG”÷WF6öÖU&Wf–Wr‚Ð¢Ò“°Ð¢6öç7BÖöFVÂÒFöÖ–æ–öåG&VæG2æ'V–ÆE&öw&ÕG&VæDÖöFVÂ‡²ââçG&VæD–çWG2Â&öG”6ö×÷6—F–öâÒ“°Ð¢&VæFW%&öw&ÕG&VæG2†ÖöFVÂÂFöÖ–åG&VæG2ÂG&¦V7F÷'’Â7F÷&vTÖöFR“°Ð¢&VæFW$6öÖÖæD6VçFW$÷fW'f–Wr†F–Ç•7FFRòWfÇVFU&VF–æW72†F–Ç•7FFR’¢çVÆÂÂvVV¶Ç”–ç7V7F–öâÇÂ&÷f—6–öæÂÇÂ·ÒÂG&¦V7F÷'’ç7FFR“°Ð¢&VæFW%&æµ6V7F–öâ‚“°Ð¢&VæFW%&Wf–Wt‡V"‚“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâÆöEG&VæG4æÇ—F–72‚’°Ð¢G'’°Ð¢6öç7B7W&6RÒv—BvWD6Æ–VçB‚“°Ð¢6öç7B&W7VÇG2Òv—B&öÖ—6RæÆÂ…°Ð¢7W&6Ræg&öÒ‚'vVV¶Ç•ö–ç7V7F–öç2"’ç6VÆV7B‚'vVVµ÷7F'EöFFRÇvVVµöVæEöFFRÇvVV¶Ç•öF—66—Æ–æU÷66÷&RÆWf–FVæ6Uö6÷fW&vRÆFöÖ–å÷66÷&W2Æ–ç7V7F–öå÷7FGW2Æf–æÆ—¦VEöB"’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æ÷&FW"‚'vVVµ÷7F'EöFFR"Â²66VæF–æs¢G'VRÒ’ÀÐ¢7W&6Ræg&öÒ‚&F–Ç•ö6ö×Æ–æ6R"’ç6VÆV7B„4ôÕÄ”ä4Uô4ôÅTÔå2’æW‚'W6W%ö–B"Â6W76–öâçW6W"æ–B’æÇFR‚&6ö×Æ–æ6UöFFR"ÂFöF”•4ôFFR‚’’æ÷&FW"‚&6ö×Æ–æ6UöFFR"Â²66VæF–æs¢G'VRÒÐ¢Ò“°Ð¢–b‡&W7VÇG5³ÒæW'&÷"’F‡&÷r&W7VÇG5³ÒæW'&÷#°Ð¢–b‡&W7VÇG5³ÒæW'&÷"’F‡&÷r&W7VÇG5³ÒæW'&÷#°Ð¢&VæFW%G&VæG4æÇ—F–72‡&W7VÇG5³ÒæFFÇÂµÒÂ&W7VÇG5³ÒæFFÇÂµÒÂ%5U$4R"“°Ð¢Ò6F6‚…ò’°Ð¢6öç7BÆö6ÂÒÆöDÆö6ÄæÇ—F–74†—7F÷'’‚“°Ð¢&VæFW%G&VæG4æÇ—F–72†Æö6Âæ–ç7V7F–öç2ÂÆö6ÂæF–Ç•&V6÷&G2Â$Äô4ÂdÄÄ$4²"“°Ð¢ÐÐ§ÐÐ 