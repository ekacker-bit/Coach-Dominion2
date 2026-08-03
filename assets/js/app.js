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
  { code: "CARDIO-01", category: "Running/Cardio Compliance", title: "Cardio completion target", description: "Assigned cardio work should be completed unless a protected exception applies.", evidenceRule: "A missed cardio t…243249 tokens truncated… = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#0a0a0a";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Photo processing failed.")), "image/jpeg", 0.86));
  return { blob, width, height };
}

async function uploadBodyProgressPhotos(form, date) {
  if (!form || typeof DominionBodyProgress === "undefined") return { count: 0, errors: [] };
  const selections = [...form.querySelectorAll("input[data-body-photo-angle]")]
    .map((input) => ({ angle: input.dataset.bodyPhotoAngle, file: input.files?.[0] || null }))
    .filter((item) => item.file);
  if (!selections.length) return { count: 0, errors: [] };
  if (!session?.user?.id) return { count: 0, errors: ["Sign in to save private progress photos."] };
  const supabase = await getClient();
  const saved = [];
  const errors = [];
  for (const selection of selections) {
    let path = null;
    try {
      const prepared = await prepareBodyProgressPhoto(selection.file);
      path = DominionBodyProgress.photoPath(session.user.id, date, selection.angle);
      const upload = await supabase.storage.from(DominionBodyProgress.BUCKET).upload(path, prepared.blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (upload.error) throw upload.error;
      const record = {
        user_id: session.user.id,
        performance_date: date,
        angle: selection.angle,
        storage_path: path,
        content_type: "image/jpeg",
        size_bytes: prepared.blob.size,
        width: prepared.width,
        height: prepared.height,
        capture_protocol: "STANDARD_WEEKLY",
        updated_at: new Date().toISOString()
      };
      const response = await supabase.from("body_progress_photos").upsert(record, { onConflict: "user_id,performance_date,angle" }).select("*").single();
      if (response.error) throw response.error;
      saved.push(DominionBodyProgress.normalizePhotoRecord(response.data));
    } catch (error) {
      if (path) await supabase.storage.from(DominionBodyProgress.BUCKET).remove([path]);
      errors.push(`${selection.angle.toLowerCase()}: ${error?.message || "upload failed"}`);
    }
  }
  if (saved.length) await loadBodyProgressPhotos();
  return { count: saved.length, errors };
}

async function deleteBodyProgressPhoto(photoId) {
  const record = bodyProgressPhotos.find((item) => String(item.id) === String(photoId));
  if (!record || !window.confirm(`Delete the ${record.angle.toLowerCase()} photo from ${record.date}?`)) return;
  const supabase = await getClient();
  const storage = await supabase.storage.from(DominionBodyProgress.BUCKET).remove([record.storagePath]);
  if (storage.error) throw storage.error;
  const metadata = await supabase.from("body_progress_photos").delete().eq("id", record.id).eq("user_id", session.user.id);
  if (metadata.error) throw metadata.error;
  bodyProgressPhotos = bodyProgressPhotos.filter((item) => item.id !== record.id);
  bodyPhotoUrls.delete(record.storagePath);
  renderBodyPhotoExperience();
  setText("body-photo-feedback", "Photo deleted.");
}

async function deleteBodyProgressPhotosForDate(date) {
  const rows = bodyProgressPhotos.filter((item) => item.date === date);
  if (!rows.length || !session?.user?.id) return;
  const supabase = await getClient();
  const paths = rows.map((item) => item.storagePath).filter(Boolean);
  if (paths.length) await supabase.storage.from(DominionBodyProgress.BUCKET).remove(paths);
  await supabase.from("body_progress_photos").delete().eq("user_id", session.user.id).eq("performance_date", date);
  bodyProgressPhotos = bodyProgressPhotos.filter((item) => item.date !== date);
  paths.forEach((path) => bodyPhotoUrls.delete(path));
  renderBodyPhotoExperience();
}

function bodyCheckInInput(formId = "body-checkin-form") {
  const form = typeof formId === "string" ? document.getElementById(formId) : formId;
  if (!form) return {};
  const values = Object.fromEntries(new FormData(form).entries());
  const manual = Number(values.body_fat);
  if (typeof DominionBodyProgress !== "undefined" && (!Number.isFinite(manual) || manual <= 0)) {
    const estimate = DominionBodyProgress.estimateBodyFat(values, recruitProfileForAtlas() || {});
    if (estimate.valid) {
      values.body_fat = estimate.value;
      values.body_fat_method = estimate.method;
      values.body_fat_estimated = true;
      values.body_fat_range_low = estimate.rangeLow;
      values.body_fat_range_high = estimate.rangeHigh;
    }
  } else if (Number.isFinite(manual) && manual > 0) {
    values.body_fat_method = "SELF_REPORTED";
    values.body_fat_estimated = false;
  }
  return values;
}

function bodyCheckInUuid() {
  return globalThis.crypto?.randomUUID?.() || null;
}

async function persistBodyCheckIn(form, feedbackId = "body-checkin-feedback") {
  if (typeof DominionBodyComposition === "undefined") return;
  const input = bodyCheckInInput(form);
  const existing = performanceEntries.find((entry) => entry.domain === "body_metrics" && entry.activityCode === "body_composition_checkin" && entry.performanceDate === input.date);
  const result = DominionBodyComposition.buildCheckInEntry(input, {
    today: todayISODate(),
    now: new Date().toISOString(),
    userId: session?.user?.id || null,
    existingId: existing?.id || bodyCheckInUuid(),
    createdAt: existing?.createdAt || null
  });
  if (!result.valid) {
    setText(feedbackId, result.errors[0]);
    return false;
  }
  const validation = validatePerformanceEntry(result.entry);
  if (!validation.valid) {
    setText(feedbackId, validation.errors[0]?.message || "That checkpoint could not be validated.");
    return false;
  }
  setText(feedbackId, "Saving checkpointâ€¦");
  const payload = buildPerformancePersistencePayload(validation.entry, session?.user?.id || null);
  let saved = hydratePerformanceEntry(payload);
  let storage = "LOCAL";
  try {
    const supabase = await getClient();
    const response = await supabase.from("performance_entries").upsert(payload, { onConflict: "id" }).select("*").single();
    if (response.error) throw response.error;
    saved = hydratePerformanceEntry(response.data || payload);
    storage = "SUPABASE";
  } catch (_) {}
  performanceEntries = [saved, ...performanceEntries.filter((entry) => entry.id !== saved.id && !(entry.domain === "body_metrics" && entry.activityCode === "body_composition_checkin" && entry.performanceDate === saved.performanceDate))];
  performanceStorageMode = storage;
  performanceSaveState = storage === "SUPABASE" ? "saved" : "locally saved";
  saveLocalPerformanceEntries(performanceEntries);
  renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  if (trendAnalyticsContext) renderTrendsAnalytics(trendAnalyticsContext.inspections, trendAnalyticsContext.dailyRecords, trendAnalyticsContext.storageMode);
  if (weeklyInspection) renderWeeklyBodyOutcome(weeklyInspection);
  const photoResult = await uploadBodyProgressPhotos(form, saved.performanceDate);
  const unit = input.unit || "in";
  form?.reset();
  resetBodyProgressPhotoPreviews(form);
  const dateInput = form?.querySelector('[name="date"]');
  const unitInput = form?.querySelector('[name="unit"]');
  if (dateInput) dateInput.value = todayISODate();
  if (unitInput) unitInput.value = unit;
  renderBodyFatEstimate(form);
  const outcome = buildCurrentBodyOutcomeModel();
  renderTodayBodyCheckpoint(outcome);
  if (outcome) renderBodyOutcome(outcome);
  const photoMessage = photoResult.count
    ? ` ${photoResult.count} private photo${photoResult.count === 1 ? "" : "s"} saved.`
    : photoResult.errors.length
      ? ` Measurements saved; photos need attention (${photoResult.errors[0]}).`
      : "";
  setText(feedbackId, (storage === "SUPABASE" ? "Checkpoint saved to your account. Atlas updated the outcome signal." : "Checkpoint saved on this device; account sync will retry.") + photoMessage);
  return true;
}

async function saveBodyCheckIn(event) {
  event?.preventDefault();
  return persistBodyCheckIn(event?.currentTarget || document.getElementById("body-checkin-form"), "body-checkin-feedback");
}

async function saveTodayBodyCheckIn(event) {
  event?.preventDefault();
  const saved = await persistBodyCheckIn(event?.currentTarget || document.getElementById("today-body-checkin-form"), "today-body-checkin-feedback");
  if (saved) {
    const capture = document.getElementById("today-body-capture");
    if (capture) capture.open = false;
  }
}

function editBodyCheckIn(entryId) {
  const entry = performanceEntries.find((item) => String(item.id) === String(entryId));
  if (!entry || typeof DominionBodyComposition === "undefined") return;
  const normalized = DominionBodyComposition.normalizeBodyEntry(entry);
  const form = document.getElementById("body-checkin-form");
  if (!form) return;
  form.elements.date.value = normalized.date || todayISODate();
  form.elements.unit.value = normalized.unit || "in";
  DominionBodyComposition.CIRCUMFERENCE_KEYS.forEach((key) => { form.elements[key].value = DominionBodyComposition.displayCircumference(normalized.values[key], normalized.unit) ?? ""; });
  form.elements.body_fat.value = normalized.values.body_fat ?? "";
  form.elements.notes.value = normalized.notes || "";
  form.closest("details").open = true;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  renderBodyFatEstimate(form);
  setText("body-checkin-feedback", `Editing ${normalized.date}. Saving will replace that dateâ€™s checkpoint.`);
}

async function deleteBodyCheckIn(entryId) {
  if (!entryId || !window.confirm("Delete this body checkpoint? This action cannot be undone.")) return;
  const removed = performanceEntries.find((entry) => String(entry.id) === String(entryId));
  const removedDate = removed?.performanceDate || removed?.performance_date || null;
  performanceEntries = performanceEntries.filter((entry) => String(entry.id) !== String(entryId));
  saveLocalPerformanceEntries(performanceEntries);
  try {
    const supabase = await getClient();
    const response = await supabase.from("performance_entries").delete().eq("id", entryId);
    if (response.error) throw response.error;
  } catch (_) {}
  if (removedDate) await deleteBodyProgressPhotosForDate(removedDate);
  renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  if (trendAnalyticsContext) renderTrendsAnalytics(trendAnalyticsContext.inspections, trendAnalyticsContext.dailyRecords, trendAnalyticsContext.storageMode);
  if (weeklyInspection) renderWeeklyBodyOutcome(weeklyInspection);
  renderTodayBodyCheckpoint();
  setText("body-checkin-feedback", "Checkpoint deleted.");
}

async function resolveBodyOutcomeReview(action) {
  if (typeof DominionBodyComposition === "undefined") return false;
  const outcome = buildCurrentBodyOutcomeModel();
  try {
    const record = DominionBodyComposition.resolveOutcomeReview(outcome?.review, action, {
      resolvedAt: new Date().toISOString(),
      userId: session?.user?.id || null
    });
    const synced = await saveBodyOutcomeReview(record);
    const next = buildCurrentBodyOutcomeModel();
    renderTodayBodyCheckpoint(next);
    renderBodyOutcome(next);
    const message = record.status === "AUTHORIZED"
      ? `Outcome review authorized${synced ? " and saved to your account" : " on this device"}. No plan or target changed.`
      : `Current plan held${synced ? " and saved to your account" : " on this device"}. Atlas will keep monitoring.`;
    setText("today-body-checkin-feedback", message);
    setText("body-checkin-feedback", message);
    return true;
  } catch (error) {
    setText("today-body-checkin-feedback", error?.message || "That outcome decision could not be saved.");
    setText("body-checkin-feedback", error?.message || "That outcome decision could not be saved.");
    return false;
  }
}

async function handleBodyOutcomeAction(event) {
  const action = event.target.closest("button[data-body-review-action]");
  if (action) {
    action.disabled = true;
    try { await resolveBodyOutcomeReview(action.dataset.bodyReviewAction); }
    finally { action.disabled = false; }
    return true;
  }
  const route = event.target.closest("button[data-body-review-route]");
  if (route) {
    const section = route.dataset.bodyReviewRoute || "trends";
    if (section === "trends") setTrendView("body");
    setActiveSection(section);
    window.history.replaceState(null, "", `#${section}`);
    return true;
  }
  return false;
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
  ].map(([label, value, unit]) => `<article><span>${label}</span><strong>${value}</strong><small>${unit} Â· ${model.rangeLabel}</small></article>`).join("");

  const readiness = model.readiness;
  document.getElementById("trend-recovery-grid").innerHTML = [
    ["Energy", trendMetricValue(readiness.value, "/10"), "latest 7d"],
    ["Sleep", trendMetricValue(readiness.sleepAverage, " hr"), "range average"],
    ["Resting HR", trendMetricValue(readiness.rhrAverage, " bpm"), "range average"],
    ["HRV", trendMetricValue(readiness.hrvAverage, " ms"), "range average"]
  ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");

  const bodyOutcome = model.bodyComposition || buildCurrentBodyOutcomeModel(model);
  renderBodyOutcome(bodyOutcome);
  renderTodayBodyCheckpoint(bodyOutcome);
  const windowDates = trajectory.window.map((item) => item.weekStartDate);
  setText("trend-window", windowDates.length ? `${windowDates[0]} â€” ${windowDates.at(-1)} Â· ${windowDates.length} finalized week${windowDates.length === 1 ? "" : "s"}` : "No finalized scored window yet.");
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
  const trendInputs = {
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
  };
  const baseModel = DominionTrends.buildProgramTrendModel(trendInputs);
  const bodyComposition = typeof DominionBodyComposition === "undefined" ? null : DominionBodyComposition.buildOutcomeModel({
    today: todayISODate(),
    rangeDays: trendRangeDays,
    performanceEntries,
    dailyStates: trendInputs.dailyStates,
    contract: readApprovedRecruitContract() || {},
    signals: {
      discipline: baseModel.discipline.value,
      nutrition: baseModel.nutrition.value,
      strengthSessions: baseModel.training.strengthSessions
    },
    priorReview: readBodyOutcomeReview()
  });
  const model = DominionTrends.buildProgramTrendModel({ ...trendInputs, bodyComposition });
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

