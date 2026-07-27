let client;
let session;
let dailyState;
let dailyCompliance;
let weeklyInspection;
let weeklyDailyRecords = [];
let activeSection = "today";
let complianceDirtyState = false;
let compliancePreviousState = null;
let onboardingDismissed = false;
let lastSavedComplianceState = null;
let currentSaveState = "empty";
let standardsReviewState = [];
let rankStatus = { currentRank: "RECRUIT", promotionState: "NOT ELIGIBLE", activeCorrectivePeriod: false, correctivePeriodReason: null, correctivePeriodStatus: null, correctivePeriodStartedAt: null, correctivePeriodReviewDate: null };
let promotionHistory = [];
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
let performanceActiveView = "overview";
let performanceIntelligenceFilters = { domain: "all", trajectory: "all", confidence: "all", evidenceStatus: "all" };
let performanceLoadState = { remoteLoadFailed: false, authRequired: false, calculationUnavailable: false };
let connectedAccounts = [];
let connectedSyncJobs = [];
let connectedImportedRecords = [];
let connectedStorageMode = "LOADING";
let connectedLoadState = { loading: true, remoteLoadFailed: false, authRequired: false, localFallback: false };
let connectedActiveView = "overview";

const DAILY_STATE_COLUMNS = "date,energy,soreness,pain,sleep,weight,steps,resting_heart_rate,confidence,comments";
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
const PERFORMANCE_VIEW_CODES = ["overview", "log", "fitness_tests", "records", "milestones", "intelligence"];
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
    { code: "race׏vۋh�鬶��q�^t\

^JHO�]Z[Șۘ\܏H�ٙZ۞KY]�Y[�ًY^H	٘^K�\ܙ\ܙY۝[�Ȉ��]]�[���Z\ܚ[�ȟH��ݛ[X\�O�ݜ�ۙω٘^K�]_Oܝ�ۙϏܘ[��٘^K�\ܙ\ܙY۝[�K͈TԑTԑQܜ[��ܝ[[X\�O��٘^K�[�۝YY۝[�H\Xؘ�H؛ܚ[�ț؜ٜ��][ۜϋ܏�ٙ]Z[Ϙ
K��ڛ���Nٝ^
�ٙZ۞K\�\ܝ�
Yٜ�Y؝K�]\ԙ\ܝٛ�\�]UٙZ۞PY�\�Xݚ[۔�\ܝ
Yٜ�Y؝JJK�^
Nۛ�݈ٙZ۞Tݘ[�\�ԝ[[X\�HH؝[Y[��ٝ[[Y[��RY
�ٙZ۞K\ݘ[�\�˜ݛ[X\�H�Nۛ�݈ٙZ۞Tݘ[�\�ҝ[\ȏHݘ[�\�ԙ]�Y]ԝ]K��[\�
][JHO�][K�۝\�ّ]H	��][K�۝\�ّ]HHYٜ�Y؝K�ٙZћ�]H	��][K�۝\�ّ]H�HYٜ�Y؝K�ٙZԝ\�]JNY�
ٙZ۞Tݘ[�\�ԝ[[X\�JHٙZ۞Tݘ[�\�ԝ[[X\�K�[��\�SHٙZ۞Tݘ[�\�ҝ[\˛[�ݚ�ȝٙZ۞Tݘ[�\�ҝ[\˛X\

][JHO�\�XۙHۘ\܏H�ݘ[�\�˚][H��]�ۘ\܏H�ݘ[�\�˚][KZXY\���ݜ�ۙωڝ[K�ۘZ[�Oܝ�ۙϏܘ[�ۘ\܏H�ݘ]K\[	ڝ[K�ݘ]\ȏOOH�ӓ��T�QQ�Ȉ�ܙY[���][K�ݘ]\ȏOOH��Tӓ�Q�Ȉ��]]�[��][K�ݘ]\ȏOOH�TӒTԑQ�Ȉ��]]�[��][K�ݘ]\ȏOOH�VՔё�Ȉ��]]�[���Y[݈�H��ڝ[K�ݘ]\ȟ�Г�QUH�Oܜ[��ٚ]���ڝ[K�]�Y[�و��ș]�Y[�و�Xۜ�Y��O܏�ۘ[�ڝ[K�ٝ�\�]O˛]�[�U�SH�OܛX[�؜�XۙO�
K��ڛ���B��	ϙ]�ۘ\܏H�ݘ[�\�˙[\H���Ȝݘ[�\�Ȝ�]�Y]Ț\ݛܞH�܈\Ț[�ܙXݚ[ۈٙZˏٚ]��΂�B�ۛ�݈؜��[�ȏH�[�[^�YȘ�[�[^�Y	ۙ]ȑ]JYٜ�Y؝K��[�[^�Y]
K�ӛؘ[Tݜ�[�ʊ_K�\ݛܚX؛ۘ\ڛ݈\Ȝ�XY[ۛK��Yٜ�Y؝K�]�Y[�ٓ[Z]][ۈȘ�[�[^�][ۈ�\]Z\�\ȉՑQRӖWѕ�QS�їՒ�TғӑIH]�Y[�و۝�\�Yً�ݜ��[�]�Y[�و\ț[Z]Y����ٝ^
�ٙZ۞K]؜��[�ȋ؜��[�ʎۛ�݈�[�[^�P�]ۈH؝[Y[��ٝ[[Y[��RY
��[�[^�K]ٙZȊN�[�[^�P�]ۋ�\ؘ�YH�[�[^�YYٜ�Y؝K�]�Y[�ِ۝�\�YوёRӖWѕ�QS�їՒ�Tғӑ�[�[^�P�]ۋ�^ۛ�[�H�[�[^�YȈ�[�ܙXݚ[ۈ�[�[^�Y����[�[^�H[�ܙXݚ[ۈ��[�[^�P�]ۋ�ٝ]�X�]J�\�XKY\ؘ�Y��[�[^�P�]ۋ�\ؘ�YȈ��YH����[و�Nۛ�݈�[�[^�R[�H؝[Y[��ٝ[[Y[��RY
�ٙZ۞KY�[�[^�KZ[��NY�
�[�[^�R[�
H�[�[^�R[��^ۛ�[�H�[�[^�YȈ�\Ț[�ܙXݚ[ۈ\ș�[�[^�Y[��XY[ۛK����[�[^�Tݘ]K��XYۛSY\ܘYَ؝[Y[��ٝ[[Y[��RY
�ٙZ۞KZ[�ܙXݚ[ۈ�K�]\ٝ��[�[^�YH�[�[^�YȈ��YH����[و��[�\�ۛ[X[�ٛ�\�ݙ\��Y]ʙZ[Tݘ]Hș]�[X]T�XY[�\܊Z[Tݘ]JH��[Yٜ�Y؝JN�[�\�ݘ[�\�ԙXݚ[ۊ
NB��\ޛ�ș�[�ݚ[ۈؙٙZ۞R[�ܙXݚ[ۊ
Hۛ�݈ٛXݙY]HH؝[Y[��ٝ[[Y[��RY
�ٙZ۞KY]H�K��[YH٘^RTӑ]J
Nۛ�݈�[�وHٝ[�ܙXݚ[ەٙZԘ[�يٛXݙY]JNٝ^
�ٙZ۞K]؜��[�ȋ�؛ݛ][�ȝٙZ۞H]�Y[�ٸ�)��N�Hۛ�݈ݜX�\وH]ؚ]ٝۚY[�

Nۛ�݈ș]N�؝�Y\��܎�[�ܙXݚ[ۑ\��܈HH]ؚ]ݜX�\ً���ۊ�ٙZ۞Wڛ�ܙXݚ[ۜȊK�ٛX݊���K�\J�\ٜ�ڙ�ٜܚ[ۋ�\ٜ��Y
K�\J�ٙZלݘ\�٘]H��[�ً�ٙZԝ\�]JK�X^X�Tڛ�ۙJ
NY�
[�ܙXݚ[ۑ\��܊H�݈[�ܙXݚ[ۑ\��܎Y�
؝�Y˙�[�[^�Y؝
H�[�\�ٙZ۞R[�ܙXݚ[ۊYٜ�Y؝Q��۔ݛܙY[�ܙXݚ[ۊ؝�Y
K�ՔP�Tш�N�]\��B�ۛ�݈ș]N��Xۜ�ˈ\��܎��Xۜ�ќ��܈HH]ؚ]ݜX�\ً���ۊ�Z[W؛ۜX[�و�K�ٛX݊ӓTPS�їГӕSS�ʋ�\J�\ٜ�ڙ�ٜܚ[ۋ�\ٜ��Y
K�ݙJ�ۛ\X[�ٗ٘]H��[�ً�ٙZԝ\�]JK�J�ۛ\X[�ٗ٘]H��[�ً�ٙZћ�]JNY�
�Xۜ�ќ��܊H�݈�Xۜ�ќ��܎ٙZ۞QZ[T�Xۜ�ȏH�Xۜ�ȟ׎ۛ�݈Yٜ�Y؝HHYٜ�Y؝UٙZ۞Pۛ\X[�يٙZ۞QZ[T�Xۜ�ˈ�[�ً�ٙZԝ\�]JNYٜ�Y؝K�]\ԙ\ܝHٛ�\�]UٙZ۞PY�\�Xݚ[۔�\ܝ
Yٜ�Y؝JNۛ�݈^[ؙHٙZ۞T\�ڜݙ[�ٔ^[ؙ
Yٜ�Y؝JNۛ�݈ș\��܎��Y�\��܈HH]ؚ]ݜX�\ً���ۊ�ٙZ۞Wڛ�ܙXݚ[ۜȊK�\ٜ�
^[ؙțېۛ��Xݎ��\ٜ�ڙٙZלݘ\�٘]H�JNY�
�Y�\��܊H�݈�Y�\��܎�[�\�ٙZ۞R[�ܙXݚ[ۊYٜ�Y؝K�ՔP�Tш�NH؝ڈ
\��܊Hۛ�݈؝�YHؙؘ[ٙZ۞R[�ܙXݚ[ۊ�[�ً�ٙZԝ\�]JNY�
؝�Y˙�[�[^�Y؝
Hٝ^
�ٙZ۞K]؜��[�ȋ�[[ݙHٙZ۞H[�ܙXݚ[ۈ]H۝[�݈�HؙY
	ٜ��܏˛Y\ܘYو�[�ۛݛ�\��܈�JK�ڛݚ[�ȝH�[�[^�Yؘ[ۘ\ڛ݋�
N�[�\�ٙZ۞R[�ܙXݚ[ۊYٜ�Y؝Q��۔ݛܙY[�ܙXݚ[ۊ؝�Y
K�АS�N�]\��B�ٙZ۞QZ[T�Xۜ�ȏHؙؘ[ٙZԙXۜ�ʜ�[�يNۛ�݈Yٜ�Y؝HHYٜ�Y؝UٙZ۞Pۛ\X[�يٙZ۞QZ[T�Xۜ�ˈ�[�ً�ٙZԝ\�]JNYٜ�Y؝K�]\ԙ\ܝHٛ�\�]UٙZ۞PY�\�Xݚ[۔�\ܝ
Yٜ�Y؝JN؝�Sؘ[ٙZ۞R[�ܙXݚ[ۊٙZ۞T\�ڜݙ[�ٔ^[ؙ
Yٜ�Y؝JJNۛ�݈Y\ܘYوHٙZ۞QZ[T�Xۜ�˛[�ݚ�Ș�[[ݙHٙZ۞H[�ܙXݚ[ۈ]H۝[�݈�HؙY
	ٜ��܏˛Y\ܘYو�[�ۛݛ�\��܈�JK�ڛݚ[�țؘ[�[�Xڋ����[[ݙHٙZ۞H[�ܙXݚ[ۈ]H۝[�݈�HؙY
	ٜ��܏˛Y\ܘYو�[�ۛݛ�\��܈�JK��țؘ[�[�Xڈ�ݜȝٜ�H�ݛ��ٝ^
�ٙZ۞K]؜��[�ȋY\ܘYيN�[�\�ٙZ۞R[�ܙXݚ[ۊYٜ�Y؝K�АS�NB�B��\ޛ�ș�[�ݚ[ۈ�[�[^�UٙZ۞R[�ܙXݚ[ۊ
HY�
]ٙZ۞R[�ܙXݚ[ۊH�]\��ۛ�݈�[�[^�Tݘ]HH\�]�Q�[�[^�Pۛ��\�X][۔ݘ]J�ۛX[�ٙZ۞R[�ܙXݚ[ۋ��[�[^�Y]
KٙZ۞R[�ܙXݚ[ۋ�]�Y[�ِ۝�\�YيNY�
Y�[�[^�Tݘ]K�؛��[�[^�JHٝ^
�ٙZ۞K]؜��[�ȋ��[�[^�][ۈ�\]Z\�\Ȝݙ��Xڙ[�]�Y[�و۝�\�Yً��N�]\��B�ۛ�݈ۛ��\�YYHڛ�݋�ۛ��\�J	ٚ[�[^�Tݘ]K��XYۛSY\ܘYٟW���[�[^�H\Ț[�ܙXݚ[ۈ�ݏ؊NY�
Xۛ��\�YY
H�]\��ۛ�݈�]ۈH؝[Y[��ٝ[[Y[��RY
��[�[^�K]ٙZȊN�]ۋ�\ؘ�YH�YN�Hۛ�݈�[�[^�YH�[�[^�UٙZ۞R[�ܙXݚ[۔ۘ\ڛ݊ٙZ۞R[�ܙXݚ[ۊNۛ�݈^[ؙHٙZ۞T\�ڜݙ[�ٔ^[ؙ
�[�[^�Y�[�[^�Y��[�[^�Y]
N�Hۛ�݈ݜX�\وH]ؚ]ٝۚY[�

Nۛ�݈ș]K\��܈HH]ؚ]ݜX�\ً���ۊ�ٙZ۞Wڛ�ܙXݚ[ۜȊK�\ٜ�
^[ؙțېۛ��Xݎ��\ٜ�ڙٙZלݘ\�٘]H�JK�ٛX݊���K�ڛ�ۙJ
NY�
\��܊H�݈\��܎�[�\�ٙZ۞R[�ܙXݚ[ۊYٜ�Y؝Q��۔ݛܙY[�ܙXݚ[ۊ]JK�ՔP�Tш�NH؝ڈ
ʈ؝�Sؘ[ٙZ۞R[�ܙXݚ[ۊ^[ؙ
N�[�\�ٙZ۞R[�ܙXݚ[ۊ�[�[^�Y�АS�NB�]ؚ]ؙ�[�Л�[]X܊
NH؝ڈ
\��܊Hٝ^
�ٙZ۞K]؜��[�ȋ\��܋�Y\ܘYيN�]ۋ�\ؘ�YH�[َB�B���[�ݚ[ۈؙؘ[[�[]Xܒ\ݛܞJ
Hۛ�݈\ٜ�Hٜܚ[ۏ˝\ٜ�˚Y�ؘ[�ۛ�݈Z[T�Y�^HۘXڋYۚ[�[ێ�Z[KXۛ\X[�َ�ݜٜ�N�ۛ�݈ٙZ۞T�Y�^HۘXڋYۚ[�[ێ�ٙZ۞KZ[�ܙXݚ[ێ�ݜٜ�N�ۛ�݈Z[T�Xۜ�ȏH׎ۛ�݈[�ܙXݚ[ۜȏH׎�H�܈
][�^HȚ[�^ڛ�݋�ؘ[ݛܘYً�[�ݚȚ[�^
ψJHۛ�݈ٞHHڛ�݋�ؘ[ݛܘYً�ٞJ[�^
NY�
ZٞJHۛ�[�YNۛ�݈\�ٙH�ӓ��\�يڛ�݋�ؘ[ݛܘYً�ٝ][JٞJJNY�
ٞK�ݘ\�՚]
Z[T�Y�^
JHZ[T�Xۜ�˜\ڊ\�ٙ
NY�
ٞK�ݘ\�՚]
ٙZ۞T�Y�^
JH[�ܙXݚ[ۜ˜\ڊ\�ٙ
NB�H؝ڈ
ʈ�]\��șZ[T�Xۜ�ˈ[�ܙXݚ[ۜȟNB��]\��șZ[T�Xۜ�ˈ[�ܙXݚ[ۜȟNB���[�ݚ[ۈڙۙY\ܛ^J�[YKݙ��^H�H�HY�
S�[X�\��\њ[�]J�[X�\��[YJJJH�]\����%�ۛ�݈�ݛ�YHX]��ݛ�
�[X�\��[YJJN�]\��	ܛݛ�Y�Ȉ�Ȉ���Iܛݛ�YIܝY��^XB���[�ݚ[ۈ�[�\��[�ژ\�
[[Y[�Yٜ�Y\ˈ�[YRٞKX�[
Hۛ�݈[[Y[�H؝[Y[��ٝ[[Y[��RY
[[Y[�Y
Nۛ�݈ڛ�ȏHٜ�Y\˙�[\�
][JHO�\њ[�]SY]�Xʚ][Vݘ[YRٞWJJNY�
\ڛ�˛[�ݚ
H[[Y[��[��\�SH]�ۘ\܏H�ژ\�Y[\H���ȉۘX�[�ӛݙ\�؜ي
_H]H]�Z[X�K�ٚ]���]\��B�ۛ�݈ڙHڛ�݋�[��\�ڙ�Ȍ̌��ۛ�݈ZYڝHڛ�݋�[��\�ڙ�Ȍ�L��̎ۛ�݈Y�H�ۛ�݈�YڝHNۛ�݈܈HNۛ�݈�ݝۈHۛ�݈H
[�^
HO�ڛ�˛[�ݚOOHHȝڙȌ��Y�
Ț[�^
�

ڙHY�H�Yڝ
HȊڛ�˛[�ݚHJJNۛ�݈HH
�[YJHO�܈
ȊLHX]�X^
X]�Z[�L�[X�\��[YJJJJHȌL
�
ZYڝH܈H�ݝۊNۛ�݈�[�[^�YHڛ�˙�[\�
][JHO�][K�ڛ�OOH��S�SV�Q�Nۛ�݈�[�[^�Yۛܙ[�]\ȏH�[�[^�Y�X\

][JHO�	ފڛ�˚[�^ي][JJ_K	ފ][Vݘ[YRٞWJ_X
K��ڛ���Nۛ�݈�ݚ\ڛۘ[Hڛ�˙�[�

][JHO�][K�ڛ�OOH��ՒTғӐS�Nۛ�݈�[܈H�ݚ\ڛۘ[Ȝڛ�˜ۚXيڛ�˚[�^ي�ݚ\ڛۘ[
JK�]
LJH��[ۛ�݈�ݚ\ڛۘ[[�HH�ݚ\ڛۘ[	���[܈Ș[�Hۘ\܏H�ژ\�[[�Hژ\�\�ݚ\ڛۘ[[[�H�OH�ފڛ�˚[�^ي�[܊J_H�LOH�ފ�[ܖݘ[YRٞWJ_H��H�ފڛ�˚[�^ي�ݚ\ڛۘ[
J_H�L�H�ފ�ݚ\ڛۘ[ݘ[YRٞWJ_H��ۚ[�O����ۛ�݈ܚYH̋�KL͋LK�X\

�[YJHO�[�Hۘ\܏H�ژ\�YܚY[�H�OH�ۙY�H�LOH�ފ�[YJ_H��H�ݚYH�YڝH�L�H�ފ�[YJ_H��ۚ[�O�^ۘ\܏H�ژ\�[X�[�H��OH�ފ�[YJH
ȍH��ݘ[Y_Oݙ^�
K��ڛ���Nۛ�݈X\�܈Hڛ�˛X\

][K[�^
HO�ۛ�݈٘Zѝ�Y[�وH�[YRٞHOOH�؛ܙH�	���[X�\�][K�]�Y[�ِ۝�\�YيH�S�ѕ�QS�їՒ�Tғӑ�]\��ڜ�ۙHۘ\܏H�ژ\�\ڛ�	ڝ[K�ڛ�OOH��ՒTғӐS�Ȉ��ݚ\ڛۘ[����H	ݙXZѝ�Y[�وȈ�٘Z˙]�Y[�و����H�ޏH�ފ[�^
_H�ޏH�ފ][Vݘ[YRٞWJ_H��H�H��]O�ڝ[K�ٙZԝ\�]_N�	ڝ[Vݘ[YRٞW_IH	ڝ[K�ڛ��ӛݙ\�؜ي
_IݙXZѝ�Y[�وȈ�ț[Z]Y]�Y[�و����Oݚ]O�ؚ\�ۙO�^ۘ\܏H�ژ\�[X�[�^X[�ڛ܏H�ZYH�H�ފ[�^
_H�OH�ڙZYڝH�_H��ڝ[K�ٙZԝ\�]K�ۚXيJ_Oݙ^�^ۘ\܏H�ژ\�[X�[�^X[�ڛ܏H�ZYH�H�ފ[�^
_H�OH�ފ][Vݘ[YRٞWJHH_H��Ә]��ݛ�
][Vݘ[YRٞWJ_Oݙ^�JK��ڛ���Nۛ�݈\]Z]�[[�Hڛ�˛X\

][JHO�	ڝ[K�ٙZԝ\�]_N�	ڝ[Vݘ[YRٞW_IH
	ڝ[K�ڛ��ӛݙ\�؜ي
_Iݘ[YRٞHOOH�؛ܙH�	���[X�\�][K�]�Y[�ِ۝�\�YيH�S�ѕ�QS�їՒ�TғӑȈ�[Z]Y]�Y[�و����JX
K��ڛ��Ȉ�N[[Y[��[��\�SHݙȝ�Y]ЛޏH�	ݚYH	ڙZYڝH��ۙOH�[YȈ\�XK[X�[H�ۘX�[K��^Y^\ș��ۈ�\�ȝțۙH[��Y\�ٛ����ٜ�YIٚ[�[^�Yۛܙ[�]\ȏȘ۞[[�Hۘ\܏H�ژ\�[[�H�ڛ�ψ�ٚ[�[^�Yۛܙ[�]\߈��ܛ۞[[�O����Iܜ�ݚ\ڛۘ[[�_Iۘ\�ܟOܝ�Ϗۘ\܏H�ژ\�Y\]Z]�[[���ٜ]Z]�[[�O܏�B���[�ݚ[ۈ�[�\��[�Л�[]X܊[�ܙXݚ[ۜˈZ[T�Xۜ�ˈݛܘYٓ[ٙJHۛ�݈ݜ��[��[�وHٝ[�ܙXݚ[ەٙZԘ[�ي٘^RTӑ]J
JNۛ�݈ݜ��[�Yٜ�Y؝HHYٜ�Y؝UٙZ۞Pۛ\X[�يZ[T�Xۜ�ˈݜ��[��[�ً�ٙZԝ\�]JNۛ�݈\њ[�[^�Yݜ��[�ٙZȏHۜ�[�ܙXݚ[ے\ݛܞJ[�ܙXݚ[ۜʋ�ۛYJ
][JHO�][K�ٙZԝ\�]HOOHݜ��[��[�ً�ٙZԝ\�]H	��][K��[�[^�Y]
Nۛ�݈�ݚ\ڛۘ[Hݜ��[�Yٜ�Y؝K�۝[�˘\ܙ\ܙY؜ٜ��][ۜȏ�	��Z\њ[�[^�Yݜ��[�ٙZȏȘݜ��[�Yٜ�Y؝H��[ۛ�݈�Z�XݛܞHH\�]�U�Z�XݛܞTݘ]J[�ܙXݚ[ۜʎۛ�݈ۘZ[��[�ȏH؛ݛ]QۘZ[��[�ʚ[�ܙXݚ[ۜʎۛ�݈ݜ�XZ܈H؛ݛ]Pۛ\X[�ٔݜ�XZ܊Z[T�Xۜ�ˈ٘^RTӑ]J
JNۛ�݈ݛ[X\�HHݛ[X\�^�R[�ܙXݚ[ے\ݛܞJ[�ܙXݚ[ۜʎۛ�݈ژ\�ٜ�Y\ȏH�Z[ژ\�ٜ�Y\ʚ[�ܙXݚ[ۜˈ�ݚ\ڛۘ[
Nۛ�݈�\ܝHٛ�\�]P]\՜�[��\ܝ
ȝ�Z�XݛܞKۘZ[��[�ˈݜ�XZ܋ݛ[X\�Kژ\�ٜ�Y\ȟJNٝ^
��Z�XݛܞK\ݘ]\ȋ�Z�XݛܞK�ݘ]JN؝[Y[��ٝ[[Y[��RY
��Z�XݛܞK\ݘ]\ȊK�ۘ\ܓ�[YHHݘ]K\[	ݜ�Z�XݛܞK�ݘ]HOOH�ST�ՒS�ȈȈ�ܙY[����Z�XݛܞK�ݘ]HOOH�PӒS�S�ȈȈ��Y���Z�XݛܞK�ݘ]HOOH�SRUQU�QS�ш�Ȉ�Y[݈����]]�[�Xٝ^
�[�[]X܋\ݛܘYو�	ܝܘYٓ[ٙ_HS�SUPԈ8�%\�]�Y�݈ݛܙY
Nٝ^
��[�\ݛ[X\�K]�Z�XݛܞH��Z�XݛܞK�ݘ]H�S�Ց��PґS�TՓԖH�Nٝ^
��[�\ݛ[X\�K\؛ܙKXژ[�و�ڙۙY\ܛ^Jݛ[X\�K�؛ܙPژ[�يJNٝ^
��[�\ݛ[X\�KY]�Y[�و��Z�XݛܞK�]�\�Yّ]�Y[�وOOH�[Ȉ��%��	Ә]��ݛ�
�Z�XݛܞK�]�\�Yّ]�Y[�ي_IX
Nۛ�݈ۘZ[�]�\ڈH�\ܝ�ۘZ[�]�\ڈOOH��șXۚ[�[�șۘZ[�\ݘX�\ڙY��Ȉ��%���\ܝ�ۘZ[�]�\ڎٝ^
��[�\ݛ[X\�KYۘZ[��ۘZ[�]�\ڊNٝ^
��[�\ݛ[X\�KXۛ�ڜݙ[�ވ��\ܝ�ۛ�ڜݙ[�ވ��%�Nۛ�݈ڛ�ݑ]\ȏH�Z�XݛܞK�ڛ�݋�X\

][JHO�][K�ٙZԝ\�]JNٝ^
��[�]ڛ�݈�ڛ�ݑ]\˛[�ݚȘ�[�[^�Y�[�ڛ�ݎ�	ݚ[�ݑ]\֌_H�ݙڈ	ݚ[�ݑ]\˘]
LJ_H
	ݚ[�ݑ]\˛[�ݚH؛ܙYٙZ܊K����ș�[�[^�Y؛ܙY�[�ڛ�݈]�Z[X�K��Nٝ^
��[�[]\݋\؛ܙH�ݛ[X\�K�[ܝ�Xٛ��[�[^�Yș�ܛX]\ؚ\[�T؛ܙJݛ[X\�K�[ܝ�Xٛ��[�[^�Y�؛ܙJH��S�ГԑQ�Nٝ^
��[�X]�\�Yً\؛ܙH��ܛX]\ؚ\[�T؛ܙJݛ[X\�K��Xٛ�]�\�Yٔ؛ܙJJNٝ^
��[�\؛ܙKXژ[�و�ڙۙY\ܛ^Jݛ[X\�K�؛ܙPژ[�يJNٝ^
��[�Y]�Y[�ًXژ[�و�ڙۙY\ܛ^Jݛ[X\�K�]�Y[�ِژ[�يJNٝ^
��[�X�\݋]ٙZȋݛ[X\�K��\ݕٙZȏȘ	ܝ[[X\�K��\ݕٙZ˝ٙZԝ\�]_Hˈ	ٛܛX]\ؚ\[�T؛ܙJݛ[X\�K��\ݕٙZ˜؛ܙJ_X���%�Nٝ^
��[�[ݙ\݋]ٙZȋݛ[X\�K�ݙ\ݕٙZȏȘ	ܝ[[X\�K�ݙ\ݕٙZ˝ٙZԝ\�]_Hˈ	ٛܛX]\ؚ\[�T؛ܙJݛ[X\�K�ݙ\ݕٙZ˜؛ܙJ_X���%�Nٝ^
��[�Y�[�[^�YX۝[��ݛ[X\�K��[�[^�Y۝[�
Nٝ^
��[�Xۛ\][ۋ\�]H��[X�\��\њ[�]Jݛ[X\�K��Xٛ�[�ܙXݚ[ېۛ\][۔�]JHȘ	Ә]��ݛ�
ݛ[X\�K��Xٛ�[�ܙXݚ[ېۛ\][۔�]J_IX���%�Nٝ^
�ݜ��[�X\ܙ\ܙY\ݜ�XZȋ	ܝ�XZ܋�ݜ��[�\ܙ\ܙY^Tݜ�XZ߈^\؊Nٝ^
�ݜ��[�Y�[\ݜ�XZȋ	ܝ�XZ܋�ݜ��[��[P\ܙ\ܙY^Tݜ�XZ߈^\؊Nٝ^
�ٜۙ݋X\ܙ\ܙY\ݜ�XZȋ	ܝ�XZ܋�ٜۙݐ\ܙ\ܙY^Tݜ�XZ߈^\؊N؝[Y[��ٝ[[Y[��RY
��[�YۘZ[�YܚY�K�[��\�SHӓTPS�їѓӐRS�˛X\

ٞJHO�]�ۘ\܏H��[�YۘZ[�X؜�	ٛۘZ[��[�֚ٞWK�\�Xݚ[ۋ�ӛݙ\�؜ي
K��\Xِ[
���H�_H��ܘ[��ГӔPS�їѓӐRS�ӐP�S֚ٞW_Oܜ[��ݜ�ۙωٛۘZ[��[�֚ٞWK�\�Xݚ[۟Oܝ�ۙϏۘ[�ٛۘZ[��[�֚ٞWK�ۛܙHOOH�[Ȉ��Ȝ�[XX�HۛܙH��	ٛۘZ[��[�֚ٞWK�ۛܙK�њ^Y
�_H˝ٙZ؟OܛX[�ٚ]��
K��ڛ���N�[�\��[�ژ\�
�\ؚ\[�K]�[�Xژ\��ژ\�ٜ�Y\ˈ�؛ܙH��ٙZ۞H\ؚ\[�H؛ܙH�N�[�\��[�ژ\�
�]�Y[�ً]�[�Xژ\��ژ\�ٜ�Y\ˈ�]�Y[�ِ۝�\�Yو��ٙZ۞H]�Y[�و۝�\�Yو�Nٝ^
�]\˝�[�\�\ܝ��\ܝ�^
N�[�\�ۛ[X[�ٛ�\�ݙ\��Y]ʙZ[Tݘ]Hș]�[X]T�XY[�\܊Z[Tݘ]JH��[ٙZ۞R[�ܙXݚ[ۈߋ�Z�XݛܞK�ݘ]JN�[�\��[�ԙXݚ[ۊ
NB��\ޛ�ș�[�ݚ[ۈؙ�[�Л�[]X܊
H�Hۛ�݈ݜX�\وH]ؚ]ٝۚY[�

Nۛ�݈�\ݛȏH]ؚ]�ۚ\ً�[
ݜX�\ً���ۊ�ٙZ۞Wڛ�ܙXݚ[ۜȊK�ٛX݊�ٙZלݘ\�٘]KٙZי[�٘]KٙZ۞Wٚ\ؚ\[�Wܘۜ�K]�Y[�ٗ؛ݙ\�YًۘZ[�ܘۜ�\˚[�ܙXݚ[ۗܝ]\˙�[�[^�Y؝�K�\J�\ٜ�ڙ�ٜܚ[ۋ�\ٜ��Y
K�ܙ\��ٙZלݘ\�٘]H�Ș\ؙ[�[�Έ�YHJK�ݜX�\ً���ۊ�Z[W؛ۜX[�و�K�ٛX݊ӓTPS�їГӕSS�ʋ�\J�\ٜ�ڙ�ٜܚ[ۋ�\ٜ��Y
K�J�ۛ\X[�ٗ٘]H�٘^RTӑ]J
JK�ܙ\��ۛ\X[�ٗ٘]H�Ș\ؙ[�[�Έ�YHJB�JNY�
�\ݛ֌K�\��܊H�݈�\ݛ֌K�\��܎Y�
�\ݛ֌WK�\��܊H�݈�\ݛ֌WK�\��܎�[�\��[�Л�[]X܊�\ݛ֌K�]H׋�\ݛ֌WK�]H׋�ՔP�Tш�NH؝ڈ
ʈۛ�݈ؘ[Hؙؘ[[�[]Xܒ\ݛܞJ
N�[�\��[�Л�[]X܊ؘ[�[�ܙXݚ[ۜˈؘ[�Z[T�Xۜ�ˈ�АS�S�P҈�NB�B