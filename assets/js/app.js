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

const SECTION_ORDER = ["today", "record", "inspection", "trends", "standards", "rank", "performance"];
const SECTION_LABELS = {
  today: "Today",
  record: "Record",
  inspection: "Inspection",
  trends: "Trends",
  standards: "Standards",
  rank: "Rank",
  performance: "Performance"
};

function normalizeSectionKey(section = "today") {
  if (typeof section !== "string") return "today";
  const normalized = section.trim().toLowerCase();
  if (SECTION_ORDER.includes(normalized)) return normalized;
  if (normalized === "weekly" || normalized === "inspection" || normalized === "weekly-inspection") return "inspection";
  if (normalized === "analytics" || normalized === "trend" || normalized === "trends") return "trends";
  if (normalized === "dominion" || normalized === "record" || normalized === "compliance") return "record";
  if (normalized === "performance" || normalized === "performance-log") return "performance";
  return "today";
}

function shouldWarnBeforeNavigation(section = "today", hasDirtyChanges = false) {
  return Boolean(hasDirtyChanges) && normalizeSectionKey(section) !== "today";
}

function deriveDirtyState(previousState = {}, currentState = {}) {
  return JSON.stringify(previousState) !== JSON.stringify(currentState);
}

function deriveFinalizeConfirmationState(isFinalized = false, evidenceCoverage = 0) {
  const hasEnoughEvidence = Number(evidenceCoverage) >= WEEKLY_EVIDENCE_THRESHOLD;
  return {
    confirmationRequired: hasEnoughEvidence,
    readOnlyMessage: "Finalization creates a read-only historical snapshot for the selected week.",
    canFinalize: hasEnoughEvidence && !isFinalized
  };
}

function isFinalizedReadOnlyInspection(inspection = {}) {
  return Boolean(inspection?.finalizedAt || inspection?.inspectionStatus === "INSPECTION COMPLETE");
}

function deriveOnboardingVisibility(hasViewed = false) {
  return {
    visible: Boolean(hasViewed),
    dismissLabel: "Dismiss onboarding"
  };
}

function getStatusMessage(state = "empty") {
  const messages = {
    loading: "Loading…",
    saving: "Saving…",
    saved: "Saved",
    "locally saved": "Locally saved",
    failed: "Failed",
    empty: "No data yet",
    "limited evidence": "Limited evidence",
    finalized: "Finalized / read-only",
    "authentication required": "Authentication required"
  };
  return messages[state] || messages.empty;
}

function deriveSaveState(state = "empty") {
  const tone = state === "saving" ? "saving" : state === "saved" ? "saved" : state === "locally saved" ? "locally-saved" : state === "failed" ? "failed" : "empty";
  return { label: getStatusMessage(state), tone };
}

function deriveInputImmutabilityState(isImmutable = false) {
  return { readOnly: Boolean(isImmutable), disabled: Boolean(isImmutable) };
}

function getStandardsCatalog() {
  return STANDARDS_CATALOG.map((standard) => ({ ...standard }));
}

function normalizeRankCode(rank = "RECRUIT") {
  if (typeof rank !== "string") return "RECRUIT";
  const normalized = rank.trim().toUpperCase();
  return normalized === "ASCENDANT" ? "ASCENDANT" : normalized === "DOMINION" ? "DOMINION" : normalized === "VANGUARD" ? "VANGUARD" : normalized === "OPERATOR" ? "OPERATOR" : normalized === "CADET" ? "CADET" : "RECRUIT";
}

function getRankCatalog() {
  return RANK_CATALOG.map((rank) => ({ ...rank }));
}

function getCurrentRankDefinition(rankCode = "RECRUIT") {
  const normalized = normalizeRankCode(rankCode);
  return getRankCatalog().find((rank) => rank.code === normalized) || getRankCatalog()[0];
}

function getNextRankDefinition(rankCode = "RECRUIT") {
  const current = getCurrentRankDefinition(rankCode);
  const catalog = getRankCatalog();
  const currentIndex = catalog.findIndex((rank) => rank.code === current.code);
  return catalog[currentIndex + 1] || null;
}

function validateRankTransition(fromRank = "RECRUIT", toRank = "CADET") {
  const from = getCurrentRankDefinition(fromRank);
  const to = getCurrentRankDefinition(toRank);
  const fromIndex = RANK_CATALOG.findIndex((rank) => rank.code === from.code);
  const toIndex = RANK_CATALOG.findIndex((rank) => rank.code === to.code);
  if (fromIndex < 0 || toIndex < 0) return { valid: false, reason: "Invalid rank selection." };
  const isSingleStep = toIndex === fromIndex + 1;
  return { valid: isSingleStep, reason: isSingleStep ? "Single-step rank advancement." : "Rank skipping is not allowed." };
}

function calculatePromotionMetrics(input = {}, targetRank = "CADET") {
  const catalog = getRankCatalog();
  const target = getCurrentRankDefinition(targetRank);
  const finalizedInspections = Number(input.finalizedInspections || input.finalized_inspections || 0);
  const recentAverageDisciplineScore = Number(input.recentAverageDisciplineScore || input.recent_average_discipline_score || 0);
  const recentAverageEvidenceCoverage = Number(input.recentAverageEvidenceCoverage || input.recent_average_evidence_coverage || 0);
  const consecutiveQualifyingWeeks = Number(input.consecutiveQualifyingWeeks || input.consecutive_qualifying_weeks || 0);
  const unresolvedConfirmedViolations = Number(input.unresolvedConfirmedViolations || input.unresolved_confirmed_violations || 0);
  const unresolvedLevelTwoViolations = Number(input.unresolvedLevelTwoViolations || input.unresolved_level_two_violations || 0);
  const unresolvedLevelThreeViolations = Number(input.unresolvedLevelThreeViolations || input.unresolved_level_three_violations || 0);
  const activeCorrectivePeriod = Boolean(input.activeCorrectivePeriod || input.active_corrective_period);
  const domainScores = input.domainScores || input.domain_scores || {};
  const missionDomainScore = Number(domainScores.mission || 0);
  const requirements = [
    { requirement: "finalized_inspections", target: target.minimumFinalizedInspections, actual: finalizedInspections, passed: finalizedInspections >= target.minimumFinalizedInspections },
    { requirement: "average_discipline_score", target: target.minimumAverageDisciplineScore, actual: recentAverageDisciplineScore, passed: recentAverageDisciplineScore >= target.minimumAverageDisciplineScore },
    { requirement: "average_evidence_coverage", target: target.minimumAverageEvidenceCoverage, actual: recentAverageEvidenceCoverage, passed: recentAverageEvidenceCoverage >= target.minimumAverageEvidenceCoverage },
    { requirement: "consecutive_qualifying_weeks", target: target.requiredConsecutiveQualifyingWeeks, actual: consecutiveQualifyingWeeks, passed: consecutiveQualifyingWeeks >= target.requiredConsecutiveQualifyingWeeks },
    { requirement: "mission_domain_score", target: target.minimumMissionDomainScore, actual: missionDomainScore, passed: missionDomainScore >= target.minimumMissionDomainScore },
    { requirement: "unresolved_confirmed_violations", target: target.maximumUnresolvedConfirmedViolations, actual: unresolvedConfirmedViolations, passed: unresolvedConfirmedViolations <= target.maximumUnresolvedConfirmedViolations },
    { requirement: "unresolved_level_two_or_three_violations", target: target.maximumLevelTwoOrLevelThreeViolations, actual: unresolvedLevelTwoViolations + unresolvedLevelThreeViolations, passed: unresolvedLevelTwoViolations + unresolvedLevelThreeViolations <= target.maximumLevelTwoOrLevelThreeViolations },
    { requirement: "corrective_period", target: target.correctivePeriodBlocksEligibility ? 0 : 1, actual: activeCorrectivePeriod ? 0 : 1, passed: !activeCorrectivePeriod || !target.correctivePeriodBlocksEligibility }
  ];
  const passed = requirements.every((requirement) => requirement.passed);
  const hasCriticalStandardsBlocker = requirements.some((requirement) => (requirement.requirement === "unresolved_confirmed_violations" || requirement.requirement === "unresolved_level_two_or_three_violations") && requirement.passed === false);
  const state = passed ? "ELIGIBLE" : hasCriticalStandardsBlocker ? "BLOCKED" : finalizedInspections >= target.minimumFinalizedInspections || recentAverageDisciplineScore >= target.minimumAverageDisciplineScore || recentAverageEvidenceCoverage >= target.minimumAverageEvidenceCoverage ? "PROGRESSING" : "NOT ELIGIBLE";
  return {
    currentRank: input.currentRank || "RECRUIT",
    nextRank: target.code,
    targetRank: target.code,
    finalizedInspectionsRequired: target.minimumFinalizedInspections,
    recentAverageDisciplineScoreRequired: target.minimumAverageDisciplineScore,
    recentAverageEvidenceCoverageRequired: target.minimumAverageEvidenceCoverage,
    consecutiveQualifyingWeeksRequired: target.requiredConsecutiveQualifyingWeeks,
    missionDomainScoreRequired: target.minimumMissionDomainScore,
    unresolvedConfirmedViolationsAllowed: target.maximumUnresolvedConfirmedViolations,
    unresolvedLevelTwoOrThreeViolationsAllowed: target.maximumLevelTwoOrLevelThreeViolations,
    requirements,
    passed,
    state,
    target,
    catalog
  };
}

function calculateConsecutiveQualifyingWeeks(weeks = [], thresholds = {}) {
  const rawWeeks = Array.isArray(weeks) ? weeks : [];
  const hasProvisionalEntry = rawWeeks.some((week) => {
    const finalized = Boolean(week.finalizedAt || week.finalized_at);
    const kind = String(week.kind || "FINALIZED").toUpperCase();
    return !finalized || kind === "PROVISIONAL";
  });
  if (hasProvisionalEntry) return 0;

  const qualifying = rawWeeks.filter((week) => {
    const finalized = Boolean(week.finalizedAt || week.finalized_at);
    const kind = String(week.kind || "FINALIZED").toUpperCase();
    const score = Number(week.score || week.weekly_discipline_score || 0);
    const evidence = Number(week.evidenceCoverage || week.evidence_coverage || 0);
    const minimumScore = Number(thresholds.minimumDisciplineScore || thresholds.minimum_average_discipline_score || 0);
    const minimumEvidence = Number(thresholds.minimumEvidenceCoverage || thresholds.minimum_average_evidence_coverage || 0);
    return finalized && kind !== "PROVISIONAL" && score >= minimumScore && evidence >= minimumEvidence && Number.isFinite(score) && Number.isFinite(evidence);
  });
  if (!qualifying.length) return 0;
  const sorted = qualifying.slice().sort((left, right) => (left.weekStartDate || "").localeCompare(right.weekStartDate || ""));
  let streak = 1;
  let previous = sorted[0].weekStartDate || sorted[0].week_start_date || null;
  for (let index = 1; index < sorted.length; index += 1) {
    const currentStart = sorted[index].weekStartDate || sorted[index].week_start_date || null;
    if (!currentStart) continue;
    const previousDate = new Date(`${previous}T00:00:00`);
    const currentDate = new Date(`${currentStart}T00:00:00`);
    const expected = new Date(previousDate);
    expected.setDate(expected.getDate() + 7);
    if (currentDate.getTime() === expected.getTime()) {
      streak += 1;
      previous = currentStart;
    } else {
      break;
    }
  }
  return streak;
}

function evaluatePromotionEligibility(input = {}, targetRank = "CADET") {
  const metrics = calculatePromotionMetrics(input, targetRank);
  const correctiveState = deriveCorrectivePeriodState(input);
  const blockers = [];
  if (metrics.requirements.find((item) => item.requirement === "finalized_inspections")?.passed === false) blockers.push("insufficient finalized inspections");
  if (metrics.requirements.find((item) => item.requirement === "average_discipline_score")?.passed === false) blockers.push("weak discipline score");
  if (metrics.requirements.find((item) => item.requirement === "average_evidence_coverage")?.passed === false) blockers.push("weak evidence");
  if (metrics.requirements.find((item) => item.requirement === "consecutive_qualifying_weeks")?.passed === false) blockers.push("insufficient consecutive qualifying weeks");
  if (metrics.requirements.find((item) => item.requirement === "mission_domain_score")?.passed === false) blockers.push("weak mission-domain execution");
  if (metrics.requirements.find((item) => item.requirement === "unresolved_confirmed_violations")?.passed === false) blockers.push("unresolved confirmed standards issue");
  if (metrics.requirements.find((item) => item.requirement === "unresolved_level_two_or_three_violations")?.passed === false) blockers.push("level II/III violation threshold exceeded");
  if (metrics.requirements.find((item) => item.requirement === "corrective_period")?.passed === false) blockers.push("active corrective period");
  let status = metrics.passed ? "ELIGIBLE" : metrics.state === "PROGRESSING" ? "PROGRESSING" : metrics.state === "BLOCKED" ? "BLOCKED" : "NOT ELIGIBLE";
  if (correctiveState.active) {
    status = "CORRECTIVE PERIOD";
  }
  return {
    ...metrics,
    status,
    blockers,
    remainingActions: blockers.map((blocker) => blocker),
    promotionState: status === "ELIGIBLE" ? "PROMOTION PENDING" : status === "PROGRESSING" ? "PROGRESSING" : status === "CORRECTIVE PERIOD" ? "CORRECTIVE PERIOD" : "NOT ELIGIBLE"
  };
}

function derivePromotionState(eligibility = {}) {
  const state = eligibility?.status || "NOT ELIGIBLE";
  return {
    state,
    label: state === "ELIGIBLE" ? "Eligible" : state === "PROGRESSING" ? "Progressing" : state === "BLOCKED" ? "Blocked" : state === "CORRECTIVE PERIOD" ? "Corrective period" : state === "PROMOTION PENDING" ? "Promotion pending" : "Not eligible"
  };
}

function buildPromotionEvidence(input = {}) {
  const targetRank = getCurrentRankDefinition(input.nextRank || input.targetRank || "CADET");
  const metrics = calculatePromotionMetrics(input, targetRank.code);
  const requirements = metrics.requirements.map((requirement) => ({
    requirement: requirement.requirement,
    target: requirement.target,
    actual: requirement.actual,
    passed: requirement.passed,
    source: requirement.requirement === "finalized_inspections" ? "Finalized weekly inspections" : requirement.requirement === "average_discipline_score" ? "Recent Weekly Discipline Score" : requirement.requirement === "average_evidence_coverage" ? "Evidence Coverage" : requirement.requirement === "consecutive_qualifying_weeks" ? "Consecutive qualifying weeks" : requirement.requirement === "mission_domain_score" ? "Mission-domain score" : requirement.requirement === "unresolved_confirmed_violations" ? "Standards & Violations" : requirement.requirement === "unresolved_level_two_or_three_violations" ? "Standards & Violations" : "Corrective-period status",
    blocker: requirement.passed ? null : requirement.requirement
  }));
  return {
    currentRank: input.currentRank || "RECRUIT",
    nextRank: targetRank.code,
    requirements,
    blockers: requirements.filter((requirement) => !requirement.passed).map((requirement) => requirement.requirement),
    status: metrics.passed ? "ELIGIBLE" : metrics.state
  };
}

function generateAtlasPromotionReview(input = {}) {
  const lines = [
    "ATLAS // PROMOTION REVIEW",
    "",
    `CURRENT RANK: ${input.currentRank || "RECRUIT"}`,
    `NEXT RANK: ${input.nextRank || "CADET"}`,
    `STATUS: ${input.status || "NOT ELIGIBLE"}`,
    "",
    "QUALIFYING HISTORY",
    input.qualifyingHistory || "Insufficient finalized history to confirm promotion.",
    "",
    "DISCIPLINE STANDARD",
    input.disciplineStandard || "Recent weekly discipline score must meet the target.",
    "",
    "EVIDENCE STANDARD",
    input.evidenceStandard || "Evidence coverage must meet the target without relying on provisional weeks.",
    "",
    "STANDARDS RECORD",
    input.standardsRecord || "Standards and violation history are reviewed before promotion.",
    "",
    "BLOCKERS",
    input.blockers && input.blockers.length ? input.blockers.join("; ") : "No blocking issues detected.",
    "",
    "REMAINING REQUIREMENTS",
    input.remainingActions && input.remainingActions.length ? input.remainingActions.join("; ") : "No additional requirements remain.",
    "",
    "PROMOTION ORDER",
    input.promotionOrder || "One rank at a time.",
    "",
    "COMMAND NOTE",
    input.commandNote || "Promotion is earned through sustained execution and a clean evidence trail."
  ];
  return { text: lines.join("\n"), status: input.status || "NOT ELIGIBLE" };
}

function finalizePromotionSnapshot(input = {}, promotionAuthorized = false) {
  const nextRankCode = input.nextRank || input.targetRank || "CADET";
  const transition = validateRankTransition(input.currentRank || "RECRUIT", nextRankCode);
  if (!transition.valid) return { ...input, promotionState: "BLOCKED", currentRank: input.currentRank || "RECRUIT", status: "BLOCKED" };
  if (!promotionAuthorized) return { ...input, promotionState: "ELIGIBLE", currentRank: input.currentRank || "RECRUIT", status: input.status || "ELIGIBLE" };
  return {
    ...input,
    currentRank: nextRankCode,
    priorRank: input.currentRank || "RECRUIT",
    promotionState: "PROMOTED",
    status: "PROMOTED",
    effectiveDate: input.effectiveDate || new Date().toISOString().slice(0, 10),
    finalizedAt: input.finalizedAt || new Date().toISOString(),
    promotionAuthorized: true,
    qualificationSnapshot: input.qualificationSnapshot || {}
  };
}

function buildRankStatusEvent(eventType = "status_changed", priorRank = "RECRUIT", newRank = "CADET", priorState = "ELIGIBLE", newState = "PROMOTED", eventMetadata = {}) {
  return { eventType, priorRank, newRank, priorState, newState, eventMetadata, createdAt: new Date().toISOString() };
}

function deriveCorrectivePeriodState(input = {}) {
  const active = Boolean(input.activeCorrectivePeriod || input.active_corrective_period || input.correctivePeriodActive);
  const reason = input.correctivePeriodReason || input.corrective_period_reason || "Corrective period active";
  const status = input.correctivePeriodStatus || input.corrective_period_status || "ACTIVE";
  return {
    active,
    reason,
    status,
    state: active ? "CORRECTIVE PERIOD" : "CLEAR",
    blocksPromotion: active
  };
}

function summarizePromotionHistory(items = []) {
  const promotions = (items || []).filter((item) => item && item.promotionState === "PROMOTED");
  return {
    totalPromotions: promotions.length,
    latestPromotion: promotions.length ? promotions[promotions.length - 1] : null
  };
}

function deriveRankStatusFromRecord(record = {}) {
  return {
    currentRank: record.current_rank || record.currentRank || "RECRUIT",
    promotionState: record.promotion_state || record.promotionState || "NOT ELIGIBLE",
    activeCorrectivePeriod: Boolean(record.active_corrective_period || record.activeCorrectivePeriod),
    correctivePeriodReason: record.corrective_period_reason || record.correctivePeriodReason || null,
    correctivePeriodStatus: record.corrective_period_status || record.correctivePeriodStatus || null,
    correctivePeriodStartedAt: record.corrective_period_started_at || record.correctivePeriodStartedAt || null,
    correctivePeriodReviewDate: record.corrective_period_review_date || record.correctivePeriodReviewDate || null,
    createdAt: record.created_at || record.createdAt || null,
    updatedAt: record.updated_at || record.updatedAt || null
  };
}

function formatPromotionMetric(value = 0, displayType = "score") {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "—";
  if (displayType === "score") {
    const rounded = Math.round((numeric + Number.EPSILON) * 100) / 100;
    return rounded.toFixed(2);
  }
  return `${Math.round(numeric)}%`;
}

function detectProtectedException(entry = {}) {
  const exception = entry?.protectedException || entry?.protected_exceptions || entry?.protected_exception || null;
  if (!exception) return null;
  if (typeof exception === "string") return exception;
  if (Array.isArray(exception)) return exception[0] || null;
  return null;
}

function dedupeViolationCandidates(entries = []) {
  const seen = new Set();
  return entries.reduce((results, entry) => {
    const key = [entry.sourceType || entry.source_type || "daily_compliance", entry.standardCode || entry.standard_code || entry.domain || "reporting", entry.sourceDate || entry.source_date || todayISODate(), entry.evidence || ""].join(":");
    if (seen.has(key)) return results;
    seen.add(key);
    return [...results, { ...entry }];
  }, []);
}

function deriveViolationCandidates(entries = [], previousCandidates = []) {
  const seen = new Set();
  return entries.reduce((results, entry) => {
    const protectedException = detectProtectedException(entry);
    const normalized = {
      id: entry.id || `${entry.sourceType || 'daily_compliance'}:${entry.domain || 'unknown'}:${entry.sourceDate || entry.source_date || todayISODate()}`,
      standardCode: entry.standardCode || entry.standard_code || null,
      domain: entry.domain || entry.standardCode || "reporting",
      category: entry.category || "Reporting and Evidence",
      title: entry.title || "Standards review candidate",
      sourceType: entry.sourceType || entry.source_type || "daily_compliance",
      sourceId: entry.sourceId || entry.source_id || null,
      sourceDate: entry.sourceDate || entry.source_date || todayISODate(),
      evidence: entry.evidence || entry.candidateReason || "",
      protectedException,
      status: "CANDIDATE",
      classification: "CANDIDATE",
      severity: { level: "LEVEL I", explanation: "Initial candidate requiring review." },
      correctiveAction: null,
      repeatCount: entry.repeatCount || entry.repeat_count || 0,
      deliberate: Boolean(entry.deliberate),
      safety: Boolean(entry.safety)
    };
    if (protectedException || !entry.evidence || entry.status === "excused" || entry.status === "not_applicable" || entry.status === "not_applicable" || entry.status === "approved_modification") {
      return results;
    }
    if (entry.status === "missed" && entry.domain && entry.evidence) {
      const candidateKey = `${normalized.sourceType}:${normalized.domain}:${normalized.sourceDate}:${normalized.evidence}`;
      if (seen.has(candidateKey)) return results;
      seen.add(candidateKey);
      return [...results, normalized];
    }
    if (entry.status === "missed" && !entry.domain && entry.evidence) {
      return [...results, normalized];
    }
    return results;
  }, previousCandidates.map((candidate) => ({ ...candidate })));
}

function calculateViolationSeverity(input = {}) {
  const repeatCount = Number(input.repeatCount || input.repeat_count || 0);
  const deliberate = Boolean(input.deliberate);
  const safety = Boolean(input.safety);
  const currentSeverity = input.currentSeverity || input.current_severity || "LEVEL I";
  if (deliberate && safety) return { level: "LEVEL III", explanation: "Deliberate safety breach." };
  if (deliberate) return { level: "LEVEL III", explanation: "Deliberate falsification or serious misconduct." };
  if (repeatCount >= 2 && currentSeverity === "LEVEL I") return { level: "LEVEL II", explanation: "Repeated behavior escalated to material severity." };
  if (safety) return { level: "LEVEL II", explanation: "Safety concern requires material review." };
  return { level: currentSeverity || "LEVEL I", explanation: currentSeverity === "LEVEL II" ? "Material severity applied." : "Initial severity applied." };
}

function classifyViolationCandidate(candidate = {}) {
  const protectedException = detectProtectedException(candidate);
  const severity = calculateViolationSeverity({
    currentSeverity: candidate.currentSeverity || candidate.current_severity || "LEVEL I",
    repeatCount: candidate.repeatCount || candidate.repeat_count || 0,
    deliberate: candidate.deliberate,
    safety: candidate.safety
  });
  return {
    ...candidate,
    classification: protectedException ? "EXCUSED" : candidate.status === "UNDER REVIEW" ? "UNDER REVIEW" : "CANDIDATE",
    severity,
    protectedException,
    correctiveAction: candidate.correctiveAction || selectCorrectiveAction({ classification: protectedException ? "EXCUSED" : "CANDIDATE", severity: severity.level, domain: candidate.domain })
  };
}

function validateViolationTransition(fromStatus = "CANDIDATE", toStatus = "CONFIRMED") {
  const allowed = {
    CANDIDATE: ["UNDER REVIEW", "DISMISSED", "EXCUSED"],
    "UNDER REVIEW": ["CONFIRMED", "DISMISSED", "EXCUSED", "CANDIDATE"],
    CONFIRMED: ["CORRECTED", "RESOLVED", "DISMISSED"],
    CORRECTED: ["RESOLVED", "DISMISSED"],
    RESOLVED: [],
    DISMISSED: ["UNDER REVIEW"],
    EXCUSED: []
  };
  if (fromStatus === "CANDIDATE" && toStatus === "CONFIRMED") {
    return { valid: true, fromStatus, toStatus };
  }
  const valid = allowed[fromStatus]?.includes(toStatus) || false;
  return { valid, fromStatus, toStatus };
}

function selectCorrectiveAction(input = {}) {
  const domain = input.domain || "reporting";
  const severity = input.severity || "LEVEL I";
  if (input.classification === "EXCUSED") return { type: "review_the_standard", description: "Protected exception preserved; no violation action required.", dueDate: null, completionNote: "Protected exception documented.", correctedAt: null, resolvedAt: null };
  if (severity === "LEVEL III") return { type: "review_the_standard", description: "Complete a written after-action note and review the applicable safety standard before resuming work.", dueDate: null, completionNote: "", correctedAt: null, resolvedAt: null };
  if (severity === "LEVEL II") return { type: "review_the_standard", description: `Review the applicable ${domain} standard and submit any missing evidence or clarification.`, dueDate: null, completionNote: "", correctedAt: null, resolvedAt: null };
  return { type: "submit_missing_evidence", description: "Submit the missing evidence and acknowledge the review requirement.", dueDate: null, completionNote: "", correctedAt: null, resolvedAt: null };
}

function generateAtlasStandardsReview(item = {}) {
  const risk = item.status === "CONFIRMED" ? "Execution failure" : item.status === "EXCUSED" ? "Approved exception" : item.status === "DISMISSED" ? "No violation established" : "Review required";
  const text = [
    "ATLAS // STANDARDS REVIEW",
    "",
    "STATUS",
    item.status || "CANDIDATE",
    "",
    "STANDARD",
    item.standardCode || "UNKNOWN",
    "",
    "EVIDENCE",
    item.evidence || "No evidence recorded.",
    "",
    "PROTECTED EXCEPTIONS",
    item.protectedException || "None",
    "",
    "CLASSIFICATION",
    item.classification || "CANDIDATE",
    "",
    "SEVERITY",
    item.severity?.level || "LEVEL I",
    "",
    "CORRECTIVE ACTION",
    item.correctiveAction?.description || "Review required.",
    "",
    "DUE STATUS",
    item.correctiveAction?.dueDate ? "Pending" : "No due date",
    "",
    "COMMAND NOTE",
    `${risk}; safety and evidence are reviewed before any correction is applied.`
  ].join("\n");
  return { text, status: item.status || "CANDIDATE", classification: item.classification || "CANDIDATE", severity: item.severity || { level: "LEVEL I", explanation: "Initial severity" } };
}

function buildViolationAuditEvent(violationId = "", priorStatus = "CANDIDATE", newStatus = "CONFIRMED", note = "") {
  return { violationId, priorStatus, newStatus, note, createdAt: new Date().toISOString(), eventType: "status_changed" };
}

function summarizeWeeklyViolationHistory(items = []) {
  const confirmedCount = items.filter((item) => item.status === "CONFIRMED").length;
  const resolvedCount = items.filter((item) => item.status === "RESOLVED").length;
  const dismissedCount = items.filter((item) => item.status === "DISMISSED").length;
  const excusedCount = items.filter((item) => item.status === "EXCUSED").length;
  return { confirmedCount, resolvedCount, dismissedCount, excusedCount };
}

function deriveStandardsState(item = {}, storageMode = "SUPABASE") {
  const stateLabel = item.status === "CONFIRMED" ? "Confirmed" : item.status === "RESOLVED" ? "Resolved" : item.status === "DISMISSED" ? "Dismissed" : item.status === "EXCUSED" ? "Excused" : item.status === "CORRECTED" ? "Corrected" : "Candidate";
  const normalizedStorageMode = String(storageMode || "SUPABASE").toUpperCase();
  return { stateLabel, storageLabel: normalizedStorageMode === "LOCAL" || normalizedStorageMode === "LOCAL FALLBACK" ? "LOCAL FALLBACK" : "SUPABASE" };
}

function buildStandardsReviewState(source = {}, sourceDate = todayISODate()) {
  const protectedException = detectProtectedException(source);
  const evidence = source.evidence || source.candidateReason || "";
  return [{
    id: source.id || `${source.sourceType || "daily_compliance"}:${source.domain || "reporting"}:${sourceDate}`,
    standardCode: source.standardCode || source.standard_code || null,
    domain: source.domain || source.standardCode || "reporting",
    category: source.category || "Reporting and Evidence",
    title: source.title || "Standards review candidate",
    sourceType: source.sourceType || source.source_type || "daily_compliance",
    sourceId: source.sourceId || source.source_id || null,
    sourceDate: source.sourceDate || source.source_date || sourceDate,
    evidence,
    protectedException,
    candidateReason: source.candidateReason || source.candidate_reason || null,
    classification: protectedException ? "EXCUSED" : "CANDIDATE",
    severity: { level: source.severity?.level || source.severity || "LEVEL I", explanation: source.severity?.explanation || "Initial severity applied." },
    status: source.status || "CANDIDATE",
    correctiveAction: source.correctiveAction || null,
    repeatCount: source.repeatCount || source.repeat_count || 0,
    deliberate: Boolean(source.deliberate),
    safety: Boolean(source.safety)
  }];
}

function deriveStandardsReviewStateFromRecord(record = {}, domain = "mission") {
  if (!record) return [];
  const status = normalizeComplianceStatus(record[`${domain}_status`]);
  const evidence = [record[`${domain}_actual`] || "", record[`${domain}_note`] || "", record[`${domain}_restriction`] || ""].filter(Boolean).join(" | ");
  if (!evidence || status !== "missed") return [];
  return buildStandardsReviewState({
    id: `${record.compliance_date || todayISODate()}:${domain}`,
    domain,
    category: COMPLIANCE_DOMAIN_LABELS[domain],
    title: `${COMPLIANCE_DOMAIN_LABELS[domain]} review`,
    sourceType: "daily_compliance",
    sourceDate: record.compliance_date || todayISODate(),
    evidence,
    status: "CANDIDATE",
    protectedException: record[`${domain}_approved_modification`] ? "approved_modification" : null,
    repeatCount: 1,
    deliberate: false,
    safety: false
  }, record.compliance_date || todayISODate());
}

function sanitizeStandardsReviewState(items = []) {
  return (items || []).map((item) => ({
    ...item,
    id: item.id || `${item.sourceType || "daily_compliance"}:${item.domain || "reporting"}:${item.sourceDate || todayISODate()}`,
    status: item.status || "CANDIDATE",
    classification: item.classification || "CANDIDATE",
    severity: item.severity && typeof item.severity === "object" ? item.severity : { level: item.severity || "LEVEL I", explanation: "Initial severity applied." },
    correctiveAction: item.correctiveAction || null,
    protectedException: item.protectedException || null,
    sourceDate: item.sourceDate || todayISODate()
  }));
}

function buildStandardsPersistencePayload(item = {}) {
  return {
    id: item.id || null,
    user_id: item.userId || item.user_id || null,
    standard_code: item.standardCode || item.standard_code || null,
    category: item.category || "Reporting and Evidence",
    title: item.title || "Standards review",
    source_type: item.sourceType || item.source_type || "daily_compliance",
    source_id: item.sourceId || item.source_id || null,
    source_date: item.sourceDate || item.source_date || null,
    domain: item.domain || null,
    evidence: item.evidence || null,
    protected_exceptions: item.protectedException || item.protected_exceptions || null,
    candidate_reason: item.candidateReason || item.candidate_reason || null,
    classification: item.classification || "CANDIDATE",
    severity: item.severity?.level || item.severity || "LEVEL I",
    status: item.status || "CANDIDATE",
    corrective_action_type: item.correctiveAction?.type || null,
    corrective_action_description: item.correctiveAction?.description || null,
    corrective_action_due_date: item.correctiveAction?.dueDate || null,
    correction_note: item.correctionNote || item.correction_note || null,
    confirmed_at: item.confirmedAt || item.confirmed_at || null,
    corrected_at: item.correctedAt || item.corrected_at || null,
    resolved_at: item.resolvedAt || item.resolved_at || null,
    dismissed_at: item.dismissedAt || item.dismissed_at || null,
    excused_at: item.excusedAt || item.excused_at || null,
    created_at: item.createdAt || item.created_at || null,
    updated_at: item.updatedAt || item.updated_at || null
  };
}

function todayISODate() {
  return new Date().toLocaleDateString("en-CA");
}

const READINESS_EVIDENCE_WEIGHTS = {
  energy: 0.20,
  soreness: 0.20,
  pain: 0.20,
  sleep: 0.15,
  resting_heart_rate: 0.15,
  weight: 0.05,
  steps: 0.05
};

const evidenceLabels = {
  energy: "Energy",
  soreness: "Soreness",
  pain: "Pain",
  sleep: "Sleep",
  resting_heart_rate: "Resting heart rate",
  weight: "Weight",
  steps: "Steps"
};

function isAvailable(value) {
  return value !== null && value !== undefined && value !== "";
}

function calculateConfidence(state) {
  if (!state) return 0;
  const total = Object.entries(READINESS_EVIDENCE_WEIGHTS).reduce((sum, [key, weight]) => {
    if (key === "pain") return sum + (typeof state.pain === "boolean" ? weight : 0);
    return sum + (isAvailable(state[key]) ? weight : 0);
  }, 0);
  return Math.max(0, Math.min(1, Number(total.toFixed(2))));
}

function evidenceValue(key, state) {
  if (!state || (key === "pain" && typeof state.pain !== "boolean") || (key !== "pain" && !isAvailable(state[key]))) {
    return "Not available";
  }
  if (key === "pain") return state.pain ? "Yes" : "No";
  if (key === "energy" || key === "soreness") return `${state[key]}/10`;
  if (key === "sleep") return `${state[key]}h`;
  if (key === "resting_heart_rate") return `${state[key]} bpm`;
  return String(state[key]);
}

function evaluateReadiness(state) {
  if (!state) {
    return {
      state: null,
      confidence: 0,
      headline: "Daily State not submitted.",
      rationale: ["Submit Energy, Soreness, and Pain to calculate readiness."],
      evidence: Object.keys(READINESS_EVIDENCE_WEIGHTS).map((key) => ({
        key,
        label: evidenceLabels[key],
        status: "missing",
        value: "Not available",
        impact: `Confidence reduced by ${Math.round(READINESS_EVIDENCE_WEIGHTS[key] * 100)}%.`
      })),
      missingEvidence: Object.keys(READINESS_EVIDENCE_WEIGHTS).map((key) => evidenceLabels[key]),
      primaryRisk: "Operating without current readiness.",
      instruction: "Complete Morning Roll Call.",
      restrictions: ["Awaiting roll call"]
    };
  }

  const painAvailable = typeof state.pain === "boolean";
  const energyAvailable = isAvailable(state.energy);
  const sorenessAvailable = isAvailable(state.soreness);
  const painReported = painAvailable && state.pain;
  const energyGreen = energyAvailable && Number(state.energy) >= 7;
  const sorenessGreen = sorenessAvailable && Number(state.soreness) <= 4;
  let readinessState = "YELLOW";

  if (painReported) readinessState = "RED";
  else if (energyGreen && sorenessGreen && painAvailable) readinessState = "GREEN";

  const copy = {
    GREEN: {
      headline: "Recovery capacity acceptable.",
      primaryRisk: "Unauthorized additional volume.",
      instruction: "Execute the prescribed mission exactly.",
      restrictions: ["No unplanned extra volume", "Do not add intensity outside the mission"]
    },
    YELLOW: {
      headline: "Readiness is reduced.",
      primaryRisk: "Excess intensity or volume.",
      instruction: "Complete primary work only.",
      restrictions: ["Remove optional intensity", "No additional volume", "Stop if symptoms worsen"]
    },
    RED: {
      headline: "Pain overrides performance goals.",
      primaryRisk: "Aggravating pain or injury.",
      instruction: "Execute recovery protocol.",
      restrictions: ["No hard training", "No testing pain", "Seek professional assessment if pain is significant, worsening, or persistent"]
    }
  }[readinessState];

  const rationale = [];
  if (readinessState === "RED") {
    rationale.push("Pain was reported.", "Hard training is not authorized.");
  } else {
    rationale.push("No pain reported.");
    if (energyGreen) rationale.push("Energy is at or above the GREEN threshold.");
    else rationale.push("Energy is below the GREEN threshold.");
    if (sorenessGreen) rationale.push("Soreness is at or below the GREEN ceiling.");
    else rationale.push("Soreness is above the GREEN ceiling.");
  }

  const evidence = Object.keys(READINESS_EVIDENCE_WEIGHTS).map((key) => {
    const missing = key === "pain" ? !painAvailable : !isAvailable(state[key]);
    if (missing) {
      return { key, label: evidenceLabels[key], status: "missing", value: "Not available", impact: `Confidence reduced by ${Math.round(READINESS_EVIDENCE_WEIGHTS[key] * 100)}%.` };
    }
    if (key === "energy") return { key, label: evidenceLabels[key], status: energyGreen ? "positive" : "negative", value: evidenceValue(key, state), impact: energyGreen ? "Meets GREEN threshold." : "Below GREEN threshold." };
    if (key === "soreness") return { key, label: evidenceLabels[key], status: sorenessGreen ? "positive" : "negative", value: evidenceValue(key, state), impact: sorenessGreen ? "Below GREEN ceiling." : "Above GREEN ceiling." };
    if (key === "pain") return { key, label: evidenceLabels[key], status: painReported ? "negative" : "positive", value: evidenceValue(key, state), impact: painReported ? "Pain override selected RED." : "No pain override." };
    return { key, label: evidenceLabels[key], status: "neutral", value: evidenceValue(key, state), impact: `Available; adds ${Math.round(READINESS_EVIDENCE_WEIGHTS[key] * 100)}% confidence only.` };
  });

  return {
    state: readinessState,
    confidence: calculateConfidence(state),
    headline: copy.headline,
    rationale,
    evidence,
    missingEvidence: evidence.filter((item) => item.status === "missing").map((item) => item.label),
    primaryRisk: copy.primaryRisk,
    instruction: copy.instruction,
    restrictions: copy.restrictions
  };
}

function calculateReadiness(state) {
  return evaluateReadiness(state).state;
}

function generateMission(readinessResultOrState) {
  const readiness = typeof readinessResultOrState === "string" ? readinessResultOrState : readinessResultOrState.state;
  if (readiness === "RED") {
    return {
      title: "Recovery mission",
      detail: "Remove hard training and protect recovery. Execute recovery protocol.",
      restrictions: "No hard training, no testing pain",
      generatedFromReadiness: readiness
    };
  }

  if (readiness === "YELLOW") {
    return {
      title: "Reduced mission",
      detail: "Complete primary work only and remove optional intensity.",
      restrictions: "No extra volume",
      generatedFromReadiness: readiness
    };
  }

  return {
    title: "Execute prescribed session",
    detail: "Proceed exactly as written. Execute the prescribed mission exactly.",
    restrictions: "No unauthorized volume",
    generatedFromReadiness: readiness
  };
}

function generateMorningBrief(readinessResult) {
  const result = readinessResult || evaluateReadiness(null);
  const commandState = result.state === "GREEN"
    ? "MISSION AUTHORIZED"
    : result.state === "YELLOW"
      ? "MISSION REDUCED"
      : result.state === "RED"
        ? "HARD TRAINING DENIED"
        : "ROLL CALL REQUIRED";
  const mission = result.state ? generateMission(result) : null;
  const missingEvidence = Array.isArray(result.missingEvidence) ? result.missingEvidence : [];
  const restrictions = Array.isArray(result.restrictions) ? result.restrictions : [];
  const primaryReason = Array.isArray(result.rationale) && result.rationale.length
    ? result.rationale[0]
    : result.headline;
  const authorization = result.state === "GREEN"
    ? "AUTHORIZED"
    : result.state === "YELLOW"
      ? "AUTHORIZED WITH REDUCTIONS"
      : "NOT AUTHORIZED";

  return {
    title: "ATLAS // MORNING BRIEF",
    commandState,
    authorization,
    readiness: result.state || "NOT ESTABLISHED",
    confidence: result.confidence || 0,
    primaryReason,
    risk: result.primaryRisk,
    missingEvidence,
    directive: result.instruction,
    commandNote: result.headline,
    orders: mission
      ? [mission.title, mission.detail]
      : ["Complete Morning Roll Call before mission generation."],
    restrictions,
    mission
  };
}

function formatAtlasBriefVoice(brief) {
  const confidence = `${Math.round(Number(brief.confidence || 0) * 100)}%`;
  const missing = brief.missingEvidence.length ? brief.missingEvidence.join(", ") : "None";
  const orders = brief.orders.map((order) => `- ${order}`).join("\n");
  const restrictions = brief.restrictions.map((restriction) => `- ${restriction}`).join("\n");

  return [
    brief.title,
    "",
    "STATUS",
    `${brief.commandState} // Mission: ${brief.authorization}`,
    `Readiness: ${brief.readiness} // Confidence: ${confidence}`,
    `Primary reason: ${brief.primaryReason}`,
    "",
    "DIRECTIVE",
    brief.directive,
    "",
    "COMMAND NOTE",
    `${brief.commandNote} Risk: ${brief.risk} Missing evidence: ${missing}.`,
    "",
    "ORDERS",
    orders,
    "",
    "RESTRICTIONS",
    restrictions || "- None"
  ].join("\n");
}

function normalizeComplianceStatus(status) {
  if (typeof status !== "string") return null;
  const normalized = status.trim().toLowerCase().replaceAll(" ", "_").replaceAll("n/a", "not_applicable");
  return Object.hasOwn(COMPLIANCE_STATUS_SCORES, normalized) || COMPLIANCE_EXCLUDED_STATUSES.has(normalized)
    ? normalized
    : null;
}

function scoreComplianceDomain(domain = {}) {
  const status = normalizeComplianceStatus(domain.status);
  if (status && Object.hasOwn(COMPLIANCE_STATUS_SCORES, status)) {
    return { status, included: true, score: COMPLIANCE_STATUS_SCORES[status], reason: "Included in equal-weight score." };
  }
  if (status === "excused") {
    return { status, included: false, score: null, reason: domain.restriction ? `Excused: ${domain.restriction}` : "Excused; excluded from score." };
  }
  if (status === "not_applicable") {
    return { status, included: false, score: null, reason: "Not applicable; excluded from score." };
  }
  return { status: null, included: false, score: null, reason: "Not assessed; no completion credit assigned." };
}

function calculateDisciplineScore(domains = {}) {
  const evidence = COMPLIANCE_DOMAINS.map((key) => {
    const domain = domains[key] || {};
    const weight = Number.isFinite(domain.weight) && domain.weight > 0 ? domain.weight : 1;
    return { key, label: COMPLIANCE_DOMAIN_LABELS[key], weight, ...scoreComplianceDomain(domain) };
  });
  const included = evidence.filter((item) => item.included);
  const totalWeight = included.reduce((total, item) => total + item.weight, 0);
  const score = included.length
    ? included.reduce((total, item) => total + (item.score * item.weight), 0) / totalWeight
    : null;
  return { score, includedCount: included.length, excludedCount: evidence.length - included.length, totalWeight, evidence };
}

function formatDisciplineScore(score) {
  return score === null || score === undefined ? "UNSCORED" : `${Math.round(score)}%`;
}

function buildComplianceExplanation(calculation) {
  const included = calculation.evidence
    .filter((item) => item.included)
    .map((item) => `${item.label}: ${item.status} (${item.score})`);
  const excluded = calculation.evidence
    .filter((item) => !item.included)
    .map((item) => `${item.label}: ${item.status || "not assessed"} — ${item.reason}`);
  const formula = included.length
    ? `Applicable weighted average (current weights are 1): (${calculation.evidence.filter((item) => item.included).map((item) => `${item.score} × ${item.weight}`).join(" + ")}) / ${calculation.totalWeight} = ${calculation.score}`
    : "No applicable assessed domains; no Discipline Score calculated.";
  return { formula, included, excluded };
}

function deriveDailyComplianceState(domains = {}) {
  const calculation = calculateDisciplineScore(domains);
  const complianceStatus = calculation.score === null
    ? "UNSCORED"
    : calculation.score === 100
      ? "FULL COMPLIANCE"
      : calculation.score === 0
        ? "NO RECORDED COMPLETION"
        : "PARTIAL COMPLIANCE";
  return {
    ...calculation,
    displayScore: formatDisciplineScore(calculation.score),
    complianceStatus,
    explanation: buildComplianceExplanation(calculation),
    violations: []
  };
}

function parseISODateUTC(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function normalizeComplianceDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatISODateUTC(parsed);
  }
  if (value instanceof Date) return formatISODateUTC(value);
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatISODateUTC(new Date(value));
  }
  return null;
}

function normalizeDailyComplianceRecord(record = {}) {
  if (!record || typeof record !== "object") return record;
  const normalized = { ...record };
  const normalizedDate = normalizeComplianceDate(record.compliance_date || record.complianceDate || record.date);
  if (normalizedDate) normalized.compliance_date = normalizedDate;
  if (record.domains && typeof record.domains === "object") {
    normalized.domains = Object.fromEntries(Object.entries(record.domains).map(([key, value]) => [key, value && typeof value === "object" ? { ...value } : value]));
  }
  return normalized;
}

function formatISODateUTC(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addUTCDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getInspectionWeekRange(value = todayISODate()) {
  const date = parseISODateUTC(value);
  if (!date) throw new TypeError("Inspection date must use YYYY-MM-DD.");
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const start = addUTCDays(date, -daysSinceMonday);
  const end = addUTCDays(start, 6);
  return { weekStartDate: formatISODateUTC(start), weekEndDate: formatISODateUTC(end) };
}

function domainsFromDailyRecord(record = {}) {
  if (record.domains && typeof record.domains === "object") return record.domains;
  return Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => [key, {
    status: record[`${key}_status`],
    target: record[`${key}_target`] || "",
    actual: record[`${key}_actual`] || "",
    note: record[`${key}_note`] || "",
    restriction: record[`${key}_restriction`] || "",
    approvedModification: Boolean(record[`${key}_approved_modification`])
  }]));
}

function calculateWeeklyDisciplineScore(observations = []) {
  const included = observations.filter((item) => item.included);
  return included.length ? included.reduce((sum, item) => sum + item.score, 0) / included.length : null;
}

function calculateEvidenceCoverage(observations = []) {
  const intentionalNA = observations.filter((item) => item.status === "not_applicable").length;
  const expected = observations.length - intentionalNA;
  const assessed = observations.filter((item) => item.status && item.status !== "not_applicable").length;
  return { expectedObservations: expected, assessedObservations: assessed, intentionalNACount: intentionalNA, percentage: expected === 0 ? 100 : assessed / expected * 100 };
}

function identifyStrongestAndWeakestDomains(domainScores = {}) {
  const scored = COMPLIANCE_DOMAINS.filter((key) => domainScores[key]?.score !== null && domainScores[key]?.score !== undefined);
  if (!scored.length) return { strongestDomains: [], weakestDomains: [], strongestDomain: null, weakestDomain: null };
  const maximum = Math.max(...scored.map((key) => domainScores[key].score));
  const minimum = Math.min(...scored.map((key) => domainScores[key].score));
  const strongestDomains = scored.filter((key) => domainScores[key].score === maximum);
  const weakestDomains = scored.filter((key) => domainScores[key].score === minimum);
  return { strongestDomains, weakestDomains, strongestDomain: strongestDomains[0], weakestDomain: weakestDomains[0] };
}

function deriveInspectionStatus(aggregate, finalized = false, threshold = WEEKLY_EVIDENCE_THRESHOLD) {
  if (finalized) return "INSPECTION COMPLETE";
  if (!aggregate || aggregate.counts.assessedObservations === 0) return "NOT READY";
  return aggregate.evidenceCoverage < threshold ? "LIMITED EVIDENCE" : "READY FOR INSPECTION";
}

function selectNextWeekPriority(analysis = {}) {
  if (analysis.recoveryRiskSignal) return { code: "RECOVERY_SAFETY", text: "Protect recovery. Follow restrictions and do not train through pain." };
  if (analysis.missedByDomain?.mission >= 2) return { code: "MISSION_EXECUTION", text: "Execute the assigned mission consistently; do not add compensatory work." };
  if (analysis.weakestDomain && (analysis.domainScores?.[analysis.weakestDomain]?.includedCount || 0) >= 2) {
    return { code: "WEAKEST_DOMAIN", domain: analysis.weakestDomain, text: `Raise ${COMPLIANCE_DOMAIN_LABELS[analysis.weakestDomain]} through consistent, authorized execution.` };
  }
  if (analysis.evidenceLimitation) return { code: "EVIDENCE_GAP", text: "Record all five domains daily so the next inspection is fully supported." };
  return { code: "MAINTAIN_STANDARD", text: "Maintain the current standard with complete daily evidence." };
}

function aggregateWeeklyCompliance(records = [], weekValue = todayISODate()) {
  const range = getInspectionWeekRange(weekValue);
  const normalizedRecords = (records || [])
    .map((record) => normalizeDailyComplianceRecord(record))
    .filter((record) => record && normalizeComplianceDate(record.compliance_date) && normalizeComplianceDate(record.compliance_date) >= range.weekStartDate && normalizeComplianceDate(record.compliance_date) <= range.weekEndDate);
  const recordByDate = new Map(normalizedRecords.map((record) => [normalizeComplianceDate(record.compliance_date), record]));
  const counts = { assessedDays: 0, fullyAssessedDays: 0, unscoredDays: 0, completed: 0, partial: 0, missed: 0, excused: 0, notApplicable: 0, approvedModifications: 0, assessedObservations: 0 };
  const observations = [];
  const dailyEvidence = [];
  const missedByDomain = Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => [key, 0]));

  for (let offset = 0; offset < 7; offset += 1) {
    const date = formatISODateUTC(addUTCDays(parseISODateUTC(range.weekStartDate), offset));
    const record = recordByDate.get(date) || null;
    const domains = domainsFromDailyRecord(record || {});
    const dayObservations = COMPLIANCE_DOMAINS.map((key) => {
      const domain = domains[key] || {};
      const scored = scoreComplianceDomain(domain);
      const approvedModification = Boolean(domain.approvedModification);
      const observation = { date, domain: key, label: COMPLIANCE_DOMAIN_LABELS[key], ...scored, target: domain.target || "", actual: domain.actual || "", note: domain.note || "", restriction: domain.restriction || "", approvedModification };
      if (scored.status === "completed") counts.completed += 1;
      if (scored.status === "partial") counts.partial += 1;
      if (scored.status === "missed") counts.missed += 1;
      if (scored.status === "excused") counts.excused += 1;
      if (scored.status === "not_applicable") counts.notApplicable += 1;
      if (approvedModification) counts.approvedModifications += 1;
      if (scored.status) counts.assessedObservations += 1;
      if (scored.status === "missed" && !approvedModification) missedByDomain[key] += 1;
      return observation;
    });
    const assessedCount = dayObservations.filter((item) => item.status).length;
    const includedCount = dayObservations.filter((item) => item.included).length;
    if (assessedCount > 0) counts.assessedDays += 1;
    if (assessedCount === COMPLIANCE_DOMAINS.length) counts.fullyAssessedDays += 1;
    if (includedCount === 0) counts.unscoredDays += 1;
    dailyEvidence.push({ date, recordPresent: Boolean(record), assessedCount, includedCount });
    observations.push(...dayObservations);
  }

  const coverage = calculateEvidenceCoverage(observations);
  const domainScores = Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => {
    const domainObservations = observations.filter((item) => item.domain === key);
    return [key, { score: calculateWeeklyDisciplineScore(domainObservations), includedCount: domainObservations.filter((item) => item.included).length, assessedCount: domainObservations.filter((item) => item.status).length }];
  }));
  const ranking = identifyStrongestAndWeakestDomains(domainScores);
  const missedMaximum = Math.max(0, ...Object.values(missedByDomain));
  const mostFrequentMissedDomains = missedMaximum ? COMPLIANCE_DOMAINS.filter((key) => missedByDomain[key] === missedMaximum) : [];
  const recoveryObservations = observations.filter((item) => item.domain === "recovery");
  const recoveryRiskSignal = missedByDomain.recovery >= 2 || recoveryObservations.some((item) => /pain|injur|medical|symptom/i.test(item.restriction) && item.status !== "excused");
  const approvedModificationCompliance = observations.filter((item) => item.approvedModification).map((item) => ({ date: item.date, domain: item.domain, followed: item.status !== "missed", status: item.status }));
  const aggregate = {
    ...range,
    score: calculateWeeklyDisciplineScore(observations),
    evidenceCoverage: coverage.percentage,
    coverage,
    counts,
    domainScores,
    ...ranking,
    missedByDomain,
    mostFrequentMissedDomains,
    recoveryRiskSignal,
    consistencySignal: counts.fullyAssessedDays === 7 ? "FULLY DOCUMENTED" : counts.assessedDays >= 5 ? "MOST DAYS ASSESSED" : "INCONSISTENT EVIDENCE",
    evidenceLimitation: coverage.percentage < WEEKLY_EVIDENCE_THRESHOLD,
    approvedModificationCompliance,
    missedRequirements: observations.filter((item) => item.status === "missed" && !item.approvedModification).map((item) => ({ date: item.date, domain: item.domain, target: item.target || "Requirement not specified" })),
    excusedConditions: observations.filter((item) => item.status === "excused").map((item) => ({ date: item.date, domain: item.domain, restriction: item.restriction || "Excused condition recorded" })),
    observations,
    dailyEvidence
  };
  aggregate.nextWeekPriority = selectNextWeekPriority(aggregate);
  aggregate.inspectionStatus = deriveInspectionStatus(aggregate);
  return aggregate;
}

function generateWeeklyAfterActionReport(aggregate) {
  const label = (key) => key ? COMPLIANCE_DOMAIN_LABELS[key] : "UNSCORED";
  const missed = aggregate.missedRequirements.length ? aggregate.missedRequirements.map((item) => `${item.date} ${label(item.domain)}: ${item.target}`).join("; ") : "None recorded.";
  const excused = aggregate.excusedConditions.length ? aggregate.excusedConditions.map((item) => `${item.date} ${label(item.domain)}: ${item.restriction}`).join("; ") : "None recorded.";
  const assessment = aggregate.score === null ? "No applicable execution observations were scored." : aggregate.evidenceLimitation ? "Execution score is provisional because evidence is limited." : aggregate.score >= 85 ? "Execution met a strong weekly standard." : aggregate.score >= 60 ? "Execution was mixed and requires tighter consistency." : "Execution fell below the required standard; the evidence is documented.";
  const report = {
    title: "ATLAS // WEEKLY INSPECTION",
    status: aggregate.inspectionStatus,
    weeklyDisciplineScore: formatDisciplineScore(aggregate.score),
    evidenceCoverage: `${Math.round(aggregate.evidenceCoverage)}%`,
    assessment,
    strength: aggregate.strongestDomains.length ? aggregate.strongestDomains.map(label).join(" / ") : "No scored domain.",
    deficiency: aggregate.weakestDomains.length ? aggregate.weakestDomains.map(label).join(" / ") : "Insufficient scored evidence.",
    missedRequirements: missed,
    excusedConditions: excused,
    nextWeekPriority: aggregate.nextWeekPriority.text,
    commandNote: aggregate.recoveryRiskSignal ? "Safety restrictions govern. Missed work does not authorize compensation." : aggregate.evidenceLimitation ? "Improve the record before drawing firm conclusions." : "Execute the priority and preserve complete evidence."
  };
  report.text = [report.title, "", "STATUS", report.status, "", "WEEKLY DISCIPLINE SCORE", report.weeklyDisciplineScore, "", "EVIDENCE COVERAGE", report.evidenceCoverage, "", "ASSESSMENT", report.assessment, "", "STRENGTH", report.strength, "", "DEFICIENCY", report.deficiency, "", "MISSED REQUIREMENTS", report.missedRequirements, "", "EXCUSED CONDITIONS", report.excusedConditions, "", "NEXT-WEEK PRIORITY", report.nextWeekPriority, "", "COMMAND NOTE", report.commandNote].join("\n");
  return report;
}

function finalizeWeeklyInspectionSnapshot(aggregate, finalizedAt = new Date().toISOString()) {
  if (aggregate.evidenceCoverage < WEEKLY_EVIDENCE_THRESHOLD) throw new Error(`Finalization requires at least ${WEEKLY_EVIDENCE_THRESHOLD}% evidence coverage.`);
  const snapshot = structuredClone(aggregate);
  snapshot.inspectionStatus = "INSPECTION COMPLETE";
  snapshot.finalizedAt = finalizedAt;
  snapshot.atlasReport = generateWeeklyAfterActionReport(snapshot);
  snapshot.atlasReport.status = "INSPECTION COMPLETE";
  snapshot.atlasReport.text = snapshot.atlasReport.text.replace(/STATUS\n[^\n]+/, "STATUS\nINSPECTION COMPLETE");
  return snapshot;
}

function inspectionValue(record, camel, snake) {
  return record?.[camel] ?? record?.[snake] ?? null;
}

function normalizeInspectionForAnalytics(record = {}) {
  const domainScores = inspectionValue(record, "domainScores", "domain_scores") || {};
  return {
    weekStartDate: inspectionValue(record, "weekStartDate", "week_start_date"),
    weekEndDate: inspectionValue(record, "weekEndDate", "week_end_date"),
    score: inspectionValue(record, "score", "weekly_discipline_score"),
    evidenceCoverage: inspectionValue(record, "evidenceCoverage", "evidence_coverage"),
    domainScores,
    finalizedAt: inspectionValue(record, "finalizedAt", "finalized_at"),
    inspectionStatus: inspectionValue(record, "inspectionStatus", "inspection_status")
  };
}

function sortInspectionHistory(records = []) {
  return records.map(normalizeInspectionForAnalytics).sort((a, b) => String(a.weekStartDate).localeCompare(String(b.weekStartDate)));
}

function isFiniteMetric(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function selectTrendWindow(records = [], size = TREND_WINDOW_SIZE) {
  return sortInspectionHistory(records).filter((item) => item.finalizedAt && isFiniteMetric(item.score)).slice(-size);
}

function calculateLinearTrend(points = []) {
  const usable = points.filter((point) => isFiniteMetric(point.value) && parseISODateUTC(point.date));
  if (usable.length < 2) return null;
  const origin = parseISODateUTC(usable[0].date);
  const coordinates = usable.map((point) => ({ x: (parseISODateUTC(point.date) - origin) / 604800000, y: Number(point.value) }));
  const meanX = coordinates.reduce((sum, point) => sum + point.x, 0) / coordinates.length;
  const meanY = coordinates.reduce((sum, point) => sum + point.y, 0) / coordinates.length;
  const denominator = coordinates.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  return denominator === 0 ? 0 : coordinates.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator;
}

function deriveTrajectoryState(records = [], options = {}) {
  const window = selectTrendWindow(records, options.windowSize || TREND_WINDOW_SIZE);
  if (window.length < 2) return { state: "INSUFFICIENT HISTORY", slope: null, averageEvidence: window.length ? Number(window[0].evidenceCoverage) : null, window };
  const averageEvidence = window.reduce((sum, item) => sum + Number(item.evidenceCoverage || 0), 0) / window.length;
  const slope = calculateLinearTrend(window.map((item) => ({ date: item.weekStartDate, value: item.score })));
  if (averageEvidence < (options.evidenceThreshold || TREND_EVIDENCE_THRESHOLD)) return { state: "LIMITED EVIDENCE", slope, averageEvidence, window };
  const threshold = options.slopeThreshold || TREND_SLOPE_THRESHOLD;
  return { state: slope >= threshold ? "IMPROVING" : slope <= -threshold ? "DECLINING" : "STABLE", slope, averageEvidence, window };
}

function domainScoreValue(inspection, key) {
  const entry = inspection.domainScores?.[key];
  return entry && typeof entry === "object" ? entry.score : entry;
}

function calculateDomainTrends(records = [], options = {}) {
  const window = selectTrendWindow(records, options.windowSize || TREND_WINDOW_SIZE);
  return Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => {
    const points = window.map((item) => ({ date: item.weekStartDate, value: domainScoreValue(item, key), evidence: Number(item.evidenceCoverage || 0) })).filter((item) => isFiniteMetric(item.value));
    if (!points.length) return [key, { direction: "NO DATA", slope: null, points }];
    const averageEvidence = points.reduce((sum, item) => sum + item.evidence, 0) / points.length;
    if (points.length < 2 || averageEvidence < (options.evidenceThreshold || TREND_EVIDENCE_THRESHOLD)) return [key, { direction: "LIMITED EVIDENCE", slope: null, averageEvidence, points }];
    const slope = calculateLinearTrend(points);
    const threshold = options.slopeThreshold || TREND_SLOPE_THRESHOLD;
    return [key, { direction: slope >= threshold ? "UP" : slope <= -threshold ? "DOWN" : "FLAT", slope, averageEvidence, points }];
  }));
}

function validDailyAssessment(record = {}) {
  const domains = domainsFromDailyRecord(record);
  const statuses = COMPLIANCE_DOMAINS.map((key) => normalizeComplianceStatus(domains[key]?.status));
  return { assessed: statuses.some(Boolean), fullyAssessed: statuses.every(Boolean) };
}

function calculateComplianceStreaks(records = [], today = todayISODate()) {
  const todayDate = parseISODateUTC(today);
  if (!todayDate) throw new TypeError("Streak reference date must use YYYY-MM-DD.");
  const byDate = new Map();
  records.forEach((record) => {
    const date = parseISODateUTC(record?.compliance_date);
    if (date && date <= todayDate) byDate.set(record.compliance_date, validDailyAssessment(record));
  });
  const assessedDates = [...byDate].filter(([, value]) => value.assessed).map(([date]) => date).sort();
  let longestAssessedDayStreak = 0;
  let running = 0;
  let previous = null;
  assessedDates.forEach((date) => {
    const current = parseISODateUTC(date);
    running = previous && (current - previous) === 86400000 ? running + 1 : 1;
    longestAssessedDayStreak = Math.max(longestAssessedDayStreak, running);
    previous = current;
  });
  const countBackward = (property) => {
    let count = 0;
    for (let date = todayDate; ; date = addUTCDays(date, -1)) {
      const value = byDate.get(formatISODateUTC(date));
      if (!value?.[property]) break;
      count += 1;
    }
    return count;
  };
  return { currentAssessedDayStreak: countBackward("assessed"), currentFullyAssessedDayStreak: countBackward("fullyAssessed"), longestAssessedDayStreak };
}

function identifyBestAndLowestWeeks(records = []) {
  const finalized = sortInspectionHistory(records).filter((item) => item.finalizedAt && isFiniteMetric(item.score));
  if (!finalized.length) return { bestWeek: null, lowestWeek: null };
  const byScoreThenDate = [...finalized].sort((a, b) => Number(b.score) - Number(a.score) || a.weekStartDate.localeCompare(b.weekStartDate));
  const lowest = [...finalized].sort((a, b) => Number(a.score) - Number(b.score) || a.weekStartDate.localeCompare(b.weekStartDate))[0];
  return { bestWeek: byScoreThenDate[0], lowestWeek: lowest };
}

function summarizeInspectionHistory(records = [], recentSize = TREND_WINDOW_SIZE) {
  const sorted = sortInspectionHistory(records);
  const finalized = sorted.filter((item) => item.finalizedAt);
  const scored = finalized.filter((item) => isFiniteMetric(item.score));
  const recent = scored.slice(-recentSize);
  const latest = scored.at(-1) || null;
  const prior = scored.at(-2) || null;
  const recentInspections = sorted.slice(-recentSize);
  return {
    finalizedCount: finalized.length,
    recentAverageScore: recent.length ? recent.reduce((sum, item) => sum + Number(item.score), 0) / recent.length : null,
    mostRecentFinalized: latest,
    scoreChange: latest && prior ? Number(latest.score) - Number(prior.score) : null,
    evidenceChange: latest && prior ? Number(latest.evidenceCoverage) - Number(prior.evidenceCoverage) : null,
    recentInspectionCompletionRate: recentInspections.length ? recentInspections.filter((item) => item.finalizedAt).length / recentInspections.length * 100 : null,
    ...identifyBestAndLowestWeeks(finalized)
  };
}

function buildChartSeries(records = [], provisional = null) {
  const finalized = sortInspectionHistory(records).filter((item) => item.finalizedAt).map((item) => ({ ...item, kind: "FINALIZED" }));
  const provisionalItem = provisional ? { ...normalizeInspectionForAnalytics(provisional), kind: "PROVISIONAL" } : null;
  return [...finalized, ...(provisionalItem && provisionalItem.weekStartDate ? [provisionalItem] : [])].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
}

function generateAtlasTrendReport(analytics) {
  const directions = analytics.domainTrends || {};
  const ranked = COMPLIANCE_DOMAINS.filter((key) => isFiniteMetric(directions[key]?.slope)).sort((a, b) => directions[b].slope - directions[a].slope || COMPLIANCE_DOMAINS.indexOf(a) - COMPLIANCE_DOMAINS.indexOf(b));
  const strongest = ranked[0] || null;
  const risk = [...ranked].reverse()[0] || null;
  const trajectory = analytics.trajectory.state;
  const evidenceText = trajectory === "LIMITED EVIDENCE" ? "Evidence is below the trend threshold; performance conclusions are constrained." : analytics.trajectory.averageEvidence === null ? "No finalized evidence window is available." : `Average finalized evidence coverage is ${Math.round(analytics.trajectory.averageEvidence)}%.`;
  const poorPerformance = analytics.summary.mostRecentFinalized && Number(analytics.summary.mostRecentFinalized.score) < 60;
  const priority = trajectory === "LIMITED EVIDENCE" || trajectory === "INSUFFICIENT HISTORY" ? "Build complete daily evidence before escalating conclusions." : risk && directions[risk].direction === "DOWN" ? `Stabilize ${COMPLIANCE_DOMAIN_LABELS[risk]} with authorized, consistent execution.` : trajectory === "DECLINING" ? "Restore consistent execution without compensatory training." : "Maintain the standard and preserve complete evidence.";
  const report = {
    title: "ATLAS // TREND REPORT",
    trajectory,
    disciplineTrend: analytics.trajectory.slope === null ? "No reliable score direction established." : `${analytics.trajectory.slope.toFixed(2)} score points per week across the finalized window.`,
    evidenceQuality: evidenceText,
    strongestTrend: strongest ? `${COMPLIANCE_DOMAIN_LABELS[strongest]}: ${directions[strongest].direction}.` : "No reliable domain trend.",
    domainAtRisk: risk && directions[risk].direction === "DOWN" ? `${COMPLIANCE_DOMAIN_LABELS[risk]} is trending down.` : "No declining domain established.",
    consistency: `${analytics.streaks.currentAssessedDayStreak}-day current assessed streak; ${analytics.streaks.longestAssessedDayStreak}-day longest streak.`,
    priority,
    commandNote: trajectory === "LIMITED EVIDENCE" ? "Weak evidence is not proof of strong or poor execution." : poorPerformance ? "Performance is below standard, but unsafe compensation is not authorized." : "Continue disciplined execution and complete reporting."
  };
  report.text = [report.title, "", "TRAJECTORY", report.trajectory, "", "DISCIPLINE TREND", report.disciplineTrend, "", "EVIDENCE QUALITY", report.evidenceQuality, "", "STRONGEST TREND", report.strongestTrend, "", "DOMAIN AT RISK", report.domainAtRisk, "", "CONSISTENCY", report.consistency, "", "PRIORITY", report.priority, "", "COMMAND NOTE", report.commandNote].join("\n");
  return report;
}

async function getClient() {
  if (client) return client;
  const response = await fetch("/api/config");
  const config = await response.json();
  if (!config.ok) throw new Error(config.error || "Configuration unavailable.");
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  return client;
}

function setStatus(message) {
  const statusElement = document.getElementById("status");
  statusElement.textContent = message || "";
  statusElement.setAttribute("aria-live", "polite");
}

function setLoading(isLoading) {
  document.getElementById("app-content").hidden = isLoading;
  document.getElementById("loading").hidden = !isLoading;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function confidencePercent(confidence) {
  return `${Math.round(Number(confidence || 0) * 100)}%`;
}

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function valueOrDash(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function setList(id, values, emptyText) {
  const list = document.getElementById(id);
  clearElement(list);
  const items = values.length ? values : [emptyText];
  items.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.appendChild(item);
  });
}

function setEvidenceTable(id, evidence) {
  const table = document.getElementById(id);
  clearElement(table);
  evidence.forEach((item) => {
    const row = document.createElement("div");
    const label = document.createElement("strong");
    const value = document.createElement("span");
    const status = document.createElement("span");
    const impact = document.createElement("p");
    row.className = `evidence-row ${item.status}`;
    label.textContent = item.label;
    value.textContent = item.value;
    status.textContent = item.status;
    impact.textContent = item.impact;
    row.append(label, value, status, impact);
    table.appendChild(row);
  });
}

function dailyIntelligence(readinessResult) {
  if (!readinessResult || !readinessResult.state) {
    return ["Awaiting signal", "Daily State not submitted", "Complete Morning Roll Call", "Operating without current readiness"];
  }
  return [
    `${readinessResult.state} protocol`,
    readinessResult.headline,
    readinessResult.instruction,
    readinessResult.primaryRisk
  ];
}

function deriveCommandCenterOverview(readinessResultOrState = null, weeklyInspectionAggregate = {}, trajectoryState = "INSUFFICIENT HISTORY") {
  const readiness = readinessResultOrState && typeof readinessResultOrState === "object" && Object.hasOwn(readinessResultOrState, "state")
    ? readinessResultOrState
    : evaluateReadiness(readinessResultOrState);
  const weeklyStatus = weeklyInspectionAggregate?.inspectionStatus || "NOT READY";
  const trendStatus = trajectoryState || "INSUFFICIENT HISTORY";
  const readinessLabel = readiness?.state || "NOT ESTABLISHED";

  let focus = "Morning roll call";
  let summary = "The command center is waiting for the first Daily State signal.";
  let action = "Submit Morning Roll Call to initialize the operating picture.";

  if (readinessLabel === "RED") {
    focus = "Recovery protocol";
    summary = "Pain overrides performance goals. Protect recovery and avoid any hard training.";
    action = "Execute recovery protocol and preserve the next recovery window.";
  } else if (readinessLabel === "YELLOW") {
    focus = "Primary work only";
    summary = "Readiness is reduced. Complete primary work only and remove optional intensity.";
    action = "Reduce volume and protect the standard.";
  } else if (readinessLabel === "GREEN") {
    focus = "Prescribed mission";
    summary = "Readiness is acceptable. Execute the assigned mission exactly.";
    action = "Maintain execution quality and complete the day's evidence.";
  }

  if (weeklyStatus === "INSPECTION COMPLETE") {
    action = `${action} The latest weekly inspection is finalized.`;
  } else if (weeklyStatus === "READY FOR INSPECTION") {
    action = `${action} The weekly review is ready for finalization.`;
  } else if (weeklyStatus === "LIMITED EVIDENCE") {
    action = `${action} Improve daily evidence coverage before drawing firm conclusions.`;
  }

  if (trendStatus === "DECLINING") {
    action = `${action} Trend signals are declining; tighten execution and preserve evidence.`;
  } else if (trendStatus === "IMPROVING") {
    action = `${action} Trend signals are improving; maintain the standard.`;
  }

  return {
    readinessLabel,
    weeklyLabel: weeklyStatus,
    trendLabel: trendStatus,
    focus,
    summary,
    action
  };
}

function toSnakeCase(value = "") {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .trim()
    .toLowerCase();
}

function sanitizePerformanceText(value = "", maxLength = 80) {
  const safeText = String(value ?? "")
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"']/g, "")
    .replace(/\s+/g, " ");
  return safeText.length > maxLength ? safeText.slice(0, maxLength) : safeText;
}

function normalizePerformanceDomain(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "strength") return "strength";
  if (normalized === "running") return "running";
  if (normalized === "core") return "core";
  if (normalized === "conditioning") return "conditioning";
  if (normalized === "fitness" || normalized === "fitness test" || normalized === "fitness_test") return "fitness_test";
  if (normalized === "body" || normalized === "body metrics" || normalized === "body_metrics") return "body_metrics";
  return null;
}

function normalizePerformanceEntryType(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replaceAll(" ", "_");
  const lookup = {
    TRAINING_SET: "TRAINING_SET",
    WORKOUT_SUMMARY: "WORKOUT_SUMMARY",
    BENCHMARK: "BENCHMARK",
    FORMAL_TEST: "FORMAL_TEST",
    RACE: "RACE",
    MEASUREMENT: "MEASUREMENT"
  };
  return lookup[normalized] || null;
}

function normalizePerformanceEvidenceStatus(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replaceAll(" ", "_");
  const lookup = {
    SELF_REPORTED: "SELF REPORTED",
    VERIFIED: "VERIFIED",
    ESTIMATED: "ESTIMATED",
    INCOMPLETE: "INCOMPLETE"
  };
  return lookup[normalized] || null;
}

function normalizePerformanceUnits(input = {}) {
  const metrics = input?.metrics && typeof input.metrics === "object" ? { ...input.metrics } : {};
  const normalizedMetrics = { ...metrics };
  if (normalizedMetrics.distanceUnit !== undefined && normalizedMetrics.distance_unit === undefined) normalizedMetrics.distance_unit = normalizedMetrics.distanceUnit;
  if (normalizedMetrics.weightUnit !== undefined && normalizedMetrics.weight_unit === undefined) normalizedMetrics.weight_unit = normalizedMetrics.weightUnit;
  if (normalizedMetrics.measurementUnit !== undefined && normalizedMetrics.measurement_unit === undefined) normalizedMetrics.measurement_unit = normalizedMetrics.measurementUnit;
  if (normalizedMetrics.measurementValue !== undefined && normalizedMetrics.measurement_value === undefined) normalizedMetrics.measurement_value = normalizedMetrics.measurementValue;
  if (normalizedMetrics.testProtocolName !== undefined && normalizedMetrics.test_protocol_name === undefined) normalizedMetrics.test_protocol_name = normalizedMetrics.testProtocolName;
  if (normalizedMetrics.eventResults !== undefined && normalizedMetrics.event_results === undefined) normalizedMetrics.event_results = normalizedMetrics.eventResults;
  if (normalizedMetrics.overallScore !== undefined && normalizedMetrics.overall_score === undefined) normalizedMetrics.overall_score = normalizedMetrics.overallScore;
  return { ...input, metrics: normalizedMetrics };
}

function stableSerializePerformanceValue(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerializePerformanceValue(item)).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerializePerformanceValue(value[key])}`).join(",")}}`;
  }
  return String(value);
}

function parsePerformanceNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePerformanceMetricValue(domain, key, value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const normalizedDomain = normalizePerformanceDomain(domain);
  if (normalizedDomain === "strength") {
    const allowedKeys = new Set(["sets", "repetitions", "weight", "weight_unit", "duration_seconds", "assistance", "bodyweight_added"]);
    if (!allowedKeys.has(key)) return undefined;
  }
  if (normalizedDomain === "running") {
    const allowedKeys = new Set(["distance", "distance_unit", "duration_seconds", "pace_seconds_per_unit", "elevation_gain", "route_type", "run_type", "race_name"]);
    if (!allowedKeys.has(key)) return undefined;
  }
  if (normalizedDomain === "core" || normalizedDomain === "conditioning") {
    const allowedKeys = new Set(["repetitions", "duration_seconds", "distance", "calories", "rounds", "work_interval_seconds", "rest_interval_seconds"]);
    if (!allowedKeys.has(key)) return undefined;
  }
  if (normalizedDomain === "fitness_test") {
    const allowedKeys = new Set(["test_protocol_name", "test_protocol_code", "event_results", "overall_score"]);
    if (!allowedKeys.has(key)) return undefined;
  }
  if (normalizedDomain === "body_metrics") {
    const allowedKeys = new Set(["measurement_value", "measurement_unit", "measurement_location"]);
    if (!allowedKeys.has(key)) return undefined;
  }
  if (key === "sets" || key === "repetitions" || key === "weight" || key === "distance" || key === "duration_seconds" || key === "measurement_value" || key === "overall_score") {
    return parsePerformanceNumber(value);
  }
  return value;
}

function buildPerformanceSignature(source = {}) {
  const rawMetrics = source.metrics && typeof source.metrics === "object" ? source.metrics : {};
  const metrics = {};
  const metricAliases = {
    sets: ["sets"],
    repetitions: ["repetitions", "reps"],
    weight: ["weight"],
    weight_unit: ["weightUnit", "weight_unit"],
    duration_seconds: ["durationSeconds", "duration_seconds", "duration"],
    distance: ["distance"],
    distance_unit: ["distanceUnit", "distance_unit"],
    pace_seconds_per_unit: ["paceSecondsPerUnit", "pace_seconds_per_unit"],
    elevation_gain: ["elevationGain", "elevation_gain"],
    route_type: ["routeType", "route_type"],
    run_type: ["runType", "run_type"],
    race_name: ["raceName", "race_name"],
    assistance: ["assistance"],
    bodyweight_added: ["bodyweightAdded", "bodyweight_added"],
    perceived_effort: ["perceivedEffort", "perceived_effort"],
    estimated_one_rep_max: ["estimatedOneRepMax", "estimated_one_rep_max"],
    measurement_value: ["measurementValue", "measurement_value"],
    measurement_unit: ["measurementUnit", "measurement_unit"],
    measurement_location: ["measurementLocation", "measurement_location"],
    test_protocol_code: ["testProtocolCode", "test_protocol_code"],
    test_protocol_name: ["testProtocolName", "test_protocol_name"],
    event_results: ["eventResults", "event_results"],
    overall_score: ["overallScore", "overall_score"],
    calories: ["calories"],
    rounds: ["rounds"],
    work_interval_seconds: ["workIntervalSeconds", "work_interval_seconds"],
    rest_interval_seconds: ["restIntervalSeconds", "rest_interval_seconds"]
  };
  const domain = normalizePerformanceDomain(source.domain);
  Object.entries(metricAliases).forEach(([targetKey, aliases]) => {
    const match = aliases.find((alias) => rawMetrics[alias] !== undefined);
    if (match) {
      const normalizedValue = normalizePerformanceMetricValue(domain, targetKey, rawMetrics[match]);
      if (normalizedValue !== undefined) metrics[targetKey] = normalizedValue;
    }
  });
  Object.entries(rawMetrics).forEach(([key, value]) => {
    if (value === undefined) return;
    const normalizedKey = toSnakeCase(key);
    if (Object.keys(metricAliases).includes(normalizedKey)) return;
    const normalizedValue = normalizePerformanceMetricValue(domain, normalizedKey, value);
    if (normalizedValue !== undefined) metrics[normalizedKey] = normalizedValue;
  });
  const activityCode = source.activityCode || source.activity_code || null;
  const activityName = sanitizePerformanceText(source.activityName || source.activity_name || (activityCode ? activityCode.replace(/_/g, " ") : ""), 80);
  const entryType = normalizePerformanceEntryType(source.entryType || source.entry_type);
  const evidenceStatus = normalizePerformanceEvidenceStatus(source.evidenceStatus || source.evidence_status);
  const sourceValue = typeof source.source === "string" && source.source.trim() ? source.source.trim().toUpperCase() : "MANUAL";
  const noteText = sanitizePerformanceText(source.notes || "", 500);
  return {
    id: source.id || null,
    userId: source.userId || source.user_id || null,
    performanceDate: source.performanceDate || source.performance_date || "",
    performanceTime: source.performanceTime || source.performance_time || null,
    domain,
    entryType,
    activityCode,
    activityName,
    sessionName: sanitizePerformanceText(source.sessionName || source.session_name || "", 80),
    source: sourceValue,
    notes: noteText,
    evidenceStatus,
    metrics,
    createdAt: source.createdAt || source.created_at || new Date().toISOString(),
    updatedAt: source.updatedAt || source.updated_at || new Date().toISOString()
  };
}

function createPerformanceStableId(source = {}) {
  const signature = stableSerializePerformanceValue({
    userId: source.userId || source.user_id || "",
    performanceDate: source.performanceDate || source.performance_date || "",
    performanceTime: source.performanceTime || source.performance_time || "",
    domain: normalizePerformanceDomain(source.domain),
    entryType: normalizePerformanceEntryType(source.entryType || source.entry_type),
    activityCode: source.activityCode || source.activity_code || "",
    activityName: sanitizePerformanceText(source.activityName || source.activity_name || "", 80),
    sessionName: sanitizePerformanceText(source.sessionName || source.session_name || "", 80),
    source: typeof source.source === "string" && source.source.trim() ? source.source.trim().toUpperCase() : "MANUAL",
    notes: sanitizePerformanceText(source.notes || "", 500),
    evidenceStatus: normalizePerformanceEvidenceStatus(source.evidenceStatus || source.evidence_status),
    metrics: buildPerformanceSignature(source).metrics
  });
  let hash = 2166136261;
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `perf-${(hash >>> 0).toString(16)}`;
}

function normalizePerformanceEntry(input = {}) {
  const source = input || {};
  const normalized = buildPerformanceSignature(source);
  const explicitId = typeof source.id === "string" ? source.id.trim() : source.id;
  const resolvedId = explicitId ? String(explicitId) : createPerformanceStableId(source);
  return normalizePerformanceUnits({
    ...normalized,
    id: resolvedId,
    performanceDate: normalized.performanceDate || todayISODate()
  });
}

function validatePerformanceEntry(input = {}) {
  const entry = normalizePerformanceEntry(input);
  const errors = [];
  if (!entry.performanceDate) errors.push({ field: "performance_date", message: "Performance date is required." });
  if (!entry.domain || !PERFORMANCE_DOMAINS.includes(entry.domain)) errors.push({ field: "domain", message: "Choose a valid performance domain." });
  if (!entry.entryType || !PERFORMANCE_ENTRY_TYPE_OPTIONS.some((item) => item.code === entry.entryType)) errors.push({ field: "entry_type", message: "Choose a valid entry type." });
  if (!entry.activityName) errors.push({ field: "activity_name", message: "Activity name is required." });
  if (entry.activityName && entry.activityName.length > 80) errors.push({ field: "activity_name", message: "Activity name must be 80 characters or fewer." });
  if (!entry.evidenceStatus || !PERFORMANCE_EVIDENCE_STATUS_OPTIONS.includes(entry.evidenceStatus)) errors.push({ field: "evidence_status", message: "Choose a valid evidence status." });
  if (entry.notes && entry.notes.length > 500) errors.push({ field: "notes", message: "Notes must be 500 characters or fewer." });
  if (entry.metrics && typeof entry.metrics !== "object") errors.push({ field: "metrics", message: "Metrics must be provided as an object." });
  const metrics = entry.metrics || {};
  if (entry.domain === "strength") {
    const sets = Number(metrics.sets);
    const repetitions = Number(metrics.repetitions);
    const weight = Number(metrics.weight);
    if (!Number.isFinite(sets) || sets <= 0) errors.push({ field: "metrics.sets", message: "Sets must be a positive number." });
    if (!Number.isFinite(repetitions) || repetitions <= 0) errors.push({ field: "metrics.repetitions", message: "Repetitions must be a positive number." });
    if (metrics.weight !== undefined && metrics.weight !== null && (!Number.isFinite(weight) || weight < 0)) errors.push({ field: "metrics.weight", message: "Weight must be a non-negative number." });
  }
  if (entry.domain === "running") {
    const distance = Number(metrics.distance);
    const durationSeconds = Number(metrics.duration_seconds);
    if (!Number.isFinite(distance) || distance <= 0) errors.push({ field: "metrics.distance", message: "Distance must be greater than zero." });
    if (metrics.duration_seconds !== undefined && metrics.duration_seconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds <= 0)) errors.push({ field: "metrics.duration_seconds", message: "Duration must be greater than zero." });
  }
  if (entry.domain === "core" || entry.domain === "conditioning") {
    if (metrics.repetitions !== undefined && metrics.repetitions !== null && (!Number.isInteger(Number(metrics.repetitions)) || Number(metrics.repetitions) <= 0)) errors.push({ field: "metrics.repetitions", message: "Repetitions must be a positive integer." });
    if (metrics.duration_seconds !== undefined && metrics.duration_seconds !== null && (!Number.isFinite(Number(metrics.duration_seconds)) || Number(metrics.duration_seconds) <= 0)) errors.push({ field: "metrics.duration_seconds", message: "Duration must be greater than zero." });
  }
  if (entry.domain === "body_metrics") {
    const measurementValue = Number(metrics.measurement_value);
    if (!Number.isFinite(measurementValue) || measurementValue < 0) errors.push({ field: "metrics.measurement_value", message: "Measurement value must be a non-negative number." });
  }
  if (entry.domain === "fitness_test") {
    if (!entry.metrics?.test_protocol_name && !entry.activityName) errors.push({ field: "metrics.test_protocol_name", message: "Formal tests need a protocol name." });
  }
  return { valid: errors.length === 0, errors, entry };
}

function calculateStrengthVolume(entry = {}) {
  const metrics = entry?.metrics || {};
  const sets = Number(metrics.sets);
  const repetitions = Number(metrics.repetitions);
  const weight = Number(metrics.weight);
  if (!Number.isFinite(sets) || !Number.isFinite(repetitions) || !Number.isFinite(weight) || sets <= 0 || repetitions <= 0 || weight < 0) return { value: null, unit: "", label: "volume" };
  return { value: sets * repetitions * weight, unit: "volume", label: "volume" };
}

function estimateOneRepMax(entry = {}) {
  const metrics = entry?.metrics || {};
  if (entry?.domain !== "strength") return null;
  const weight = Number(metrics.weight);
  const repetitions = Number(metrics.repetitions);
  if (!Number.isFinite(weight) || !Number.isFinite(repetitions) || repetitions <= 0 || weight < 0) return null;
  return { value: weight * (1 + repetitions / 30), label: "estimated" };
}

function calculateRunningPace(entry = {}) {
  const metrics = entry?.metrics || {};
  if (entry?.domain !== "running") return null;
  const distance = Number(metrics.distance);
  const durationSeconds = Number(metrics.duration_seconds);
  if (!Number.isFinite(distance) || !Number.isFinite(durationSeconds) || distance <= 0 || durationSeconds <= 0) return null;
  return { paceSecondsPerUnit: durationSeconds / distance, durationSeconds, distance, distanceUnit: metrics.distance_unit || metrics.distanceUnit || "mi" };
}

function getPerformanceDomainCatalog() {
  return PERFORMANCE_DOMAINS.map((code) => ({ code, label: PERFORMANCE_DOMAIN_LABELS[code] }));
}

function getPerformanceActivityCatalog(domain = "strength") {
  const normalized = normalizePerformanceDomain(domain) || "strength";
  return (PERFORMANCE_ACTIVITY_CATALOG[normalized] || []).map((activity) => ({ ...activity }));
}

function buildPerformancePersistencePayload(entry = {}, userId = null) {
  const normalized = normalizePerformanceEntry(entry);
  const resolvedUserId = userId || normalized.userId || null;
  return {
    id: normalized.id || null,
    user_id: resolvedUserId,
    performance_date: normalized.performanceDate,
    performance_time: normalized.performanceTime,
    domain: normalized.domain,
    entry_type: normalized.entryType,
    activity_code: normalized.activityCode,
    activity_name: normalized.activityName,
    session_name: normalized.sessionName || null,
    source: normalized.source,
    evidence_status: normalized.evidenceStatus,
    metrics: normalized.metrics || {},
    notes: normalized.notes || null,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt
  };
}

function hydratePerformanceEntry(row = {}) {
  return normalizePerformanceEntry({
    id: row.id,
    userId: row.user_id || row.userId,
    performanceDate: row.performance_date || row.performanceDate,
    performanceTime: row.performance_time || row.performanceTime,
    domain: row.domain,
    entryType: row.entry_type || row.entryType,
    activityCode: row.activity_code || row.activityCode,
    activityName: row.activity_name || row.activityName,
    sessionName: row.session_name || row.sessionName,
    source: row.source,
    notes: row.notes,
    evidenceStatus: row.evidence_status || row.evidenceStatus,
    metrics: row.metrics,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  });
}

function summarizeRecentPerformance(entries = []) {
  const normalizedEntries = (entries || []).map((entry) => normalizePerformanceEntry(entry));
  const referenceDate = parseISODateUTC(todayISODate()) || new Date();
  const weekStart = new Date(referenceDate);
  weekStart.setUTCDate(referenceDate.getUTCDate() - ((referenceDate.getUTCDay() + 6) % 7));
  const weekStartISO = formatISODateUTC(weekStart);
  const currentWeek = normalizedEntries.filter((entry) => entry.performanceDate >= weekStartISO && entry.performanceDate <= todayISODate());
  const strengthEntries = currentWeek.filter((entry) => entry.domain === "strength");
  const runEntries = currentWeek.filter((entry) => entry.domain === "running");
  const testEntries = currentWeek.filter((entry) => entry.entryType === "BENCHMARK" || entry.entryType === "FORMAL_TEST");
  return {
    entriesThisWeek: currentWeek.length,
    mostRecentStrengthEntry: strengthEntries.sort((a, b) => (a.performanceDate > b.performanceDate ? -1 : 1))[0] || null,
    mostRecentRun: runEntries.sort((a, b) => (a.performanceDate > b.performanceDate ? -1 : 1))[0] || null,
    mostRecentBenchmarkOrFormalTest: testEntries.sort((a, b) => (a.performanceDate > b.performanceDate ? -1 : 1))[0] || null,
    domainsRepresentedThisWeek: Array.from(new Set(currentWeek.map((entry) => entry.domain))).filter(Boolean)
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

function renderPerformanceSection(entries = performanceEntries, storageMode = performanceStorageMode, saveState = performanceSaveState) {
  const summary = summarizeRecentPerformance(entries);
  setText("performance-week-count", summary.entriesThisWeek);
  setText("performance-strength-last", summary.mostRecentStrengthEntry ? `${summary.mostRecentStrengthEntry.performanceDate} — ${summary.mostRecentStrengthEntry.activityName}` : "—");
  setText("performance-run-last", summary.mostRecentRun ? `${summary.mostRecentRun.performanceDate} — ${summary.mostRecentRun.activityName}` : "—");
  setText("performance-test-last", summary.mostRecentBenchmarkOrFormalTest ? `${summary.mostRecentBenchmarkOrFormalTest.performanceDate} — ${summary.mostRecentBenchmarkOrFormalTest.activityName}` : "—");
  setText("performance-domains-week", summary.domainsRepresentedThisWeek.length ? summary.domainsRepresentedThisWeek.map((key) => PERFORMANCE_DOMAIN_LABELS[key] || key).join(" / ") : "None yet");
  const storageLabel = storageMode === "SUPABASE" ? "REMOTE ACTIVE" : storageMode === "LOCAL" ? "LOCAL FALLBACK" : "LOADING";
  setText("performance-storage", storageLabel);
  const storageStateText = saveState === "saved" ? "Saved to remote store." : saveState === "locally saved" ? "Saved locally while remote sync is unavailable." : saveState === "failed" ? "Save failed." : saveState === "loading" ? "Loading entries…" : "No save yet.";
  setText("performance-save-state", saveState === "saving" ? "SAVING" : saveState === "saved" ? "SAVED" : saveState === "locally saved" ? "LOCAL" : saveState === "failed" ? "FAILED" : "READY");
  setText("performance-save-hint", storageStateText);
  const filteredEntries = filterPerformanceEntries(entries, performanceFilters);
  const entryList = document.getElementById("performance-entry-list");
  if (!entryList) return;
  if (!filteredEntries.length) {
    entryList.innerHTML = `<div class="performance-empty">${derivePerformanceEmptyState({ storageState: storageMode === "LOCAL" ? "local fallback" : "ready" }).message}</div>`;
    return;
  }
  entryList.innerHTML = filteredEntries.map((entry) => {
    const metricsSummary = [];
    if (entry.domain === "strength") {
      const volume = calculateStrengthVolume(entry);
      const oneRepMax = estimateOneRepMax(entry);
      metricsSummary.push(volume?.value !== null ? `volume ${volume.value}` : "volume pending");
      if (oneRepMax) metricsSummary.push(`e1rm ${oneRepMax.value.toFixed(1)}`);
    }
    if (entry.domain === "running") {
      const pace = calculateRunningPace(entry);
      metricsSummary.push(pace ? `pace ${pace.paceSecondsPerUnit.toFixed(1)} sec/unit` : "pace pending");
    }
    if (entry.domain === "fitness_test") {
      metricsSummary.push(entry.metrics?.overall_score ? `score ${entry.metrics.overall_score}` : "protocol logged");
    }
    if (entry.domain === "body_metrics") {
      metricsSummary.push(entry.metrics?.measurement_value ? `${entry.metrics.measurement_value} ${entry.metrics.measurement_unit || ""}`.trim() : "measurement logged");
    }
    return `<article class="performance-entry-card"><div class="performance-entry-header"><div><strong>${entry.activityName || "Entry"}</strong><p>${entry.performanceDate} • ${entry.entryType.replaceAll("_", " ")} • ${PERFORMANCE_DOMAIN_LABELS[entry.domain] || entry.domain}</p></div><span class="state-pill neutral">${entry.evidenceStatus || "SELF REPORTED"}</span></div><div class="performance-entry-meta"><span>${entry.notes || "No notes recorded."}</span><span>${metricsSummary.join(" • ") || "No metrics"}</span></div><div class="performance-entry-actions"><button type="button" class="ghost" data-action="edit" data-id="${entry.id || ""}">Edit</button><button type="button" data-action="delete" data-id="${entry.id || ""}">Delete</button></div></article>`;
  }).join("");
}

async function loadPerformanceEntries() {
  try {
    const supabase = await getClient();
    const { data, error } = await supabase.from("performance_entries").select("*").eq("user_id", session.user.id).order("performance_date", { ascending: false });
    if (error) throw error;
    performanceEntries = (data || []).map((row) => hydratePerformanceEntry(row));
    performanceStorageMode = "SUPABASE";
    performanceSaveState = "saved";
    renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  } catch (_) {
    performanceEntries = loadLocalPerformanceEntries().map((entry) => hydratePerformanceEntry(entry));
    performanceStorageMode = "LOCAL";
    performanceSaveState = "locally saved";
    renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  }
}

async function savePerformanceEntry(event) {
  if (event) event.preventDefault();
  const validation = validatePerformanceEntry(readPerformanceFormValues());
  if (!validation.valid) {
    const firstError = validation.errors[0];
    setText("performance-save-hint", firstError ? `${firstError.field}: ${firstError.message}` : "Validation failed.");
    return;
  }
  const payload = buildPerformancePersistencePayload(validation.entry, session?.user?.id || null);
  performanceSaveState = "saving";
  renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  try {
    const supabase = await getClient();
    const { data, error } = await supabase.from("performance_entries").upsert(payload, { onConflict: "id" }).select("*").single();
    if (error) throw error;
    const savedEntry = hydratePerformanceEntry(data || payload);
    if (performanceEditId) {
      performanceEntries = removePerformanceEntry(performanceEntries, performanceEditId);
    }
    performanceEntries = [savedEntry, ...performanceEntries];
    performanceStorageMode = "SUPABASE";
    performanceSaveState = "saved";
    renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
    saveLocalPerformanceEntries(performanceEntries);
    resetPerformanceForm();
  } catch (_) {
    const localEntries = [...performanceEntries];
    const localEntry = hydratePerformanceEntry(payload);
    if (performanceEditId) {
      const index = localEntries.findIndex((entry) => entry.id === performanceEditId);
      if (index >= 0) localEntries[index] = localEntry; else localEntries.unshift(localEntry);
    } else {
      localEntries.unshift(localEntry);
    }
    performanceEntries = localEntries;
    performanceStorageMode = "LOCAL";
    performanceSaveState = "locally saved";
    saveLocalPerformanceEntries(performanceEntries);
    renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
    resetPerformanceForm();
  }
}

function populatePerformanceForm(entry = null) {
  const normalized = normalizePerformanceEntry(entry || {});
  if (!normalized) return;
  performanceEditId = normalized.id || null;
  const form = document.getElementById("performance-form");
  if (!form) return;
  const domainSelect = document.getElementById("performance-domain");
  const entryTypeSelect = document.getElementById("performance-entry-type");
  const activityCodeSelect = document.getElementById("performance-activity-code");
  const activityNameInput = document.getElementById("performance-activity-name");
  const sourceSelect = document.getElementById("performance-source");
  const evidenceStatusSelect = document.getElementById("performance-evidence-status");
  if (domainSelect) domainSelect.value = normalized.domain || "strength";
  if (entryTypeSelect) entryTypeSelect.value = normalized.entryType || "TRAINING_SET";
  if (activityCodeSelect) { activityCodeSelect.value = normalized.activityCode || "custom"; }
  if (activityNameInput) activityNameInput.value = normalized.activityName || "";
  if (sourceSelect) sourceSelect.value = normalized.source || "MANUAL";
  if (evidenceStatusSelect) evidenceStatusSelect.value = normalized.evidenceStatus || "SELF REPORTED";
  document.getElementById("performance-date").value = normalized.performanceDate || todayISODate();
  document.getElementById("performance-time").value = normalized.performanceTime || "";
  document.getElementById("performance-session-name").value = normalized.sessionName || "";
  document.getElementById("performance-notes").value = normalized.notes || "";
  const metrics = normalized.metrics || {};
  document.getElementById("performance-strength-sets").value = metrics.sets ?? "";
  document.getElementById("performance-strength-repetitions").value = metrics.repetitions ?? "";
  document.getElementById("performance-strength-weight").value = metrics.weight ?? "";
  document.getElementById("performance-strength-weight-unit").value = metrics.weight_unit || "lb";
  document.getElementById("performance-strength-duration-seconds").value = metrics.duration_seconds ?? "";
  document.getElementById("performance-strength-assistance").value = metrics.assistance ?? "";
  document.getElementById("performance-strength-bodyweight-added").value = metrics.bodyweight_added ?? "";
  document.getElementById("performance-running-distance").value = metrics.distance ?? "";
  document.getElementById("performance-running-distance-unit").value = metrics.distance_unit || "mi";
  document.getElementById("performance-running-duration-seconds").value = metrics.duration_seconds ?? "";
  document.getElementById("performance-running-pace-seconds").value = metrics.pace_seconds_per_unit ?? "";
  document.getElementById("performance-running-elevation-gain").value = metrics.elevation_gain ?? "";
  document.getElementById("performance-running-route-type").value = metrics.route_type ?? "";
  document.getElementById("performance-running-run-type").value = metrics.run_type ?? "";
  document.getElementById("performance-running-race-name").value = metrics.race_name ?? "";
  document.getElementById("performance-core-repetitions").value = metrics.repetitions ?? "";
  document.getElementById("performance-core-duration-seconds").value = metrics.duration_seconds ?? "";
  document.getElementById("performance-core-distance").value = metrics.distance ?? "";
  document.getElementById("performance-core-calories").value = metrics.calories ?? "";
  document.getElementById("performance-core-rounds").value = metrics.rounds ?? "";
  document.getElementById("performance-core-work-interval-seconds").value = metrics.work_interval_seconds ?? "";
  document.getElementById("performance-core-rest-interval-seconds").value = metrics.rest_interval_seconds ?? "";
  document.getElementById("performance-fitness-protocol-name").value = metrics.test_protocol_name || "";
  document.getElementById("performance-fitness-protocol-code").value = metrics.test_protocol_code || "";
  document.getElementById("performance-fitness-event-results").value = Array.isArray(metrics.event_results) ? metrics.event_results.map((item) => `${item.name || "Event"},${item.score ?? ""}`).join("\n") : "";
  document.getElementById("performance-fitness-overall-score").value = metrics.overall_score ?? "";
  document.getElementById("performance-body-measurement-value").value = metrics.measurement_value ?? "";
  document.getElementById("performance-body-measurement-unit").value = metrics.measurement_unit || "kg";
  document.getElementById("performance-body-measurement-location").value = metrics.measurement_location || "";
  refreshPerformanceFieldVisibility();
  populatePerformanceActivityOptions(normalized.domain || "strength");
}

async function deletePerformanceEntry(entryId) {
  if (!entryId) return;
  const confirmed = window.confirm("Delete this performance entry? This does not affect finalized inspections or promotions.");
  if (!confirmed) return;
  const nextEntries = removePerformanceEntry(performanceEntries, entryId);
  performanceEntries = nextEntries;
  saveLocalPerformanceEntries(performanceEntries);
  performanceSaveState = "locally saved";
  renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  try {
    const supabase = await getClient();
    await supabase.from("performance_entries").delete().eq("id", entryId);
    performanceSaveState = "saved";
    renderPerformanceSection(performanceEntries, "SUPABASE", performanceSaveState);
  } catch (_) {
    performanceStorageMode = "LOCAL";
    performanceSaveState = "locally saved";
    renderPerformanceSection(performanceEntries, performanceStorageMode, performanceSaveState);
  }
}

function renderCommandCenterOverview(readinessResultOrState = null, weeklyInspectionAggregate = {}, trajectoryState = "INSUFFICIENT HISTORY") {
  const overview = deriveCommandCenterOverview(readinessResultOrState, weeklyInspectionAggregate, trajectoryState);
  setText("overview-readiness", overview.readinessLabel || "—");
  setText("overview-weekly", overview.weeklyLabel || "NOT READY");
  setText("overview-trend", overview.trendLabel || "INSUFFICIENT HISTORY");
  setText("overview-focus", overview.focus);
  setText("overview-summary", overview.summary);
  const stateElement = document.getElementById("command-center-overview-state");
  stateElement.textContent = overview.action;
  stateElement.className = `state-pill ${overview.readinessLabel === "GREEN" ? "green" : overview.readinessLabel === "RED" ? "red" : overview.readinessLabel === "YELLOW" ? "yellow" : "neutral"}`;
}

function renderStatusBar(state) {
  setText("status-sleep", state ? valueOrDash(state.sleep, "h") : "—");
  setText("status-weight", state ? valueOrDash(state.weight) : "—");
  setText("status-steps", state ? valueOrDash(state.steps) : "—");
  setText("status-rhr", state ? valueOrDash(state.resting_heart_rate, " bpm") : "—");
  setText("status-confidence", state ? confidencePercent(state.confidence) : "—");
}

function renderCommandFeed(events) {
  const feed = document.getElementById("command-feed");
  clearElement(feed);

  if (!events.length) {
    const item = document.createElement("li");
    item.className = "feed-empty";
    item.textContent = "No command events yet. Submit Morning Roll Call to initialize today’s feed.";
    feed.appendChild(item);
    return;
  }

  events.forEach((event) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    const type = document.createElement("strong");
    const severity = document.createElement("span");
    const message = document.createElement("p");
    const time = document.createElement("time");

    item.className = `feed-event ${String(event.severity).toLowerCase()}`;
    meta.className = "feed-meta";
    type.textContent = String(event.event_type || "EVENT").replaceAll("_", " ");
    severity.textContent = event.severity || "INFO";
    message.textContent = event.message;
    time.dateTime = event.occurred_at;
    time.textContent = new Date(event.occurred_at).toLocaleString();

    meta.appendChild(type);
    meta.appendChild(severity);
    item.appendChild(meta);
    item.appendChild(message);
    item.appendChild(time);
    feed.appendChild(item);
  });
}

async function loadCommandFeed() {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("command_feed")
    .select("occurred_at,event_type,severity,message,metadata")
    .eq("user_id", session.user.id)
    .order("occurred_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  renderCommandFeed(data || []);
}

function renderWarRoom(state) {
  const required = document.getElementById("roll-call-required");
  const summary = document.getElementById("daily-state-summary");
  const formCard = document.getElementById("roll-call-card");
  const readiness = document.getElementById("readiness");

  if (!state) {
    required.hidden = false;
    summary.hidden = true;
    formCard.hidden = false;
    readiness.textContent = "—";
    readiness.className = "metric";
    setText("readiness-detail", "Submit Energy, Soreness, and Pain to calculate readiness.");
    setText("confidence", "0%");
    setText("confidence-detail", "Confidence: Energy 20%, Soreness 20%, Pain 20%, Sleep 15%, Resting heart rate 15%, Weight 5%, Steps 5%.");
    setText("mission", "Morning Roll Call Required.");
    setText("mission-detail", "No mission will be generated until today's state is saved.");
    setText("mission-restrictions", "Restrictions: Awaiting roll call.");
    setText("summary-comments", "—");
    setText("mission-status", "PENDING");
    document.getElementById("mission-status").className = "state-pill neutral";
    setText("mission-source", "No Daily State evidence.");
    setText("mission-confidence", "—");
    setText("mission-context", "Generated/current-state context unavailable.");
    setText("readiness-energy", "—");
    setText("readiness-soreness", "—");
    setText("readiness-pain", "—");
    renderStatusBar(null);
    const readinessResult = evaluateReadiness(null);
    const morningBrief = generateMorningBrief(readinessResult);
    setText("atlas-brief-state", morningBrief.commandState);
    document.getElementById("atlas-brief-state").className = "state-pill neutral";
    setText("atlas-brief-output", formatAtlasBriefVoice(morningBrief));
    setList("readiness-rationale", readinessResult.rationale, "Awaiting Daily State.");
    setEvidenceTable("readiness-evidence", readinessResult.evidence);
    setList("evidence-missing", readinessResult.missingEvidence, "None.");
    setList("readiness-restrictions", readinessResult.restrictions, "None.");
    setText("readiness-risk", readinessResult.primaryRisk);
    setText("readiness-instruction", readinessResult.instruction);
    const intel = dailyIntelligence(readinessResult);
    setText("daily-intel-title", intel[0]);
    setText("daily-primary", intel[1]);
    setText("daily-instruction", intel[2]);
    setText("daily-risk", intel[3]);
    return;
  }

  const readinessResult = evaluateReadiness(state);
  const derivedReadiness = readinessResult.state;
  const mission = generateMission(readinessResult);
  const morningBrief = generateMorningBrief(readinessResult);

  required.hidden = true;
  summary.hidden = false;
  formCard.hidden = true;
  readiness.textContent = derivedReadiness;
  readiness.className = `metric ${readinessClass[derivedReadiness]}`;
  setText("readiness-detail", readinessResult.headline);
  setText("confidence", confidencePercent(readinessResult.confidence));
  setText("confidence-detail", "Confidence: Energy 20%, Soreness 20%, Pain 20%, Sleep 15%, Resting heart rate 15%, Weight 5%, Steps 5%.");
  setText("mission", mission.title);
  setText("mission-detail", mission.detail);
  setText("mission-restrictions", mission.restrictions);
  setText("mission-status", derivedReadiness);
  document.getElementById("mission-status").className = `state-pill ${readinessClass[derivedReadiness]}`;
  setText("mission-source", `Daily State: Energy ${state.energy}/10, Soreness ${state.soreness}/10, Pain ${state.pain ? "Yes" : "No"}`);
  setText("mission-confidence", confidencePercent(readinessResult.confidence));
  setText("mission-context", `${readinessResult.headline} ${readinessResult.instruction}`);
  setText("atlas-brief-state", morningBrief.commandState);
  document.getElementById("atlas-brief-state").className = `state-pill ${readinessClass[derivedReadiness]}`;
  setText("atlas-brief-output", formatAtlasBriefVoice(morningBrief));
  setText("readiness-energy", `${state.energy}/10`);
  setText("readiness-soreness", `${state.soreness}/10`);
  setText("readiness-pain", state.pain ? "Yes" : "No");
  renderStatusBar({ ...state, confidence: readinessResult.confidence });
  setList("readiness-rationale", readinessResult.rationale, "None.");
  setEvidenceTable("readiness-evidence", readinessResult.evidence);
  setList("evidence-missing", readinessResult.missingEvidence, "None.");
  setList("readiness-restrictions", readinessResult.restrictions, "None.");
  setText("readiness-risk", readinessResult.primaryRisk);
  setText("readiness-instruction", readinessResult.instruction);
  const intel = dailyIntelligence(readinessResult);
  setText("daily-intel-title", intel[0]);
  setText("daily-primary", intel[1]);
  setText("daily-instruction", intel[2]);
  setText("daily-risk", intel[3]);
  renderCommandCenterOverview(readinessResult, weeklyInspection || {}, "INSUFFICIENT HISTORY");

  setText("summary-date", state.date);
  setText("summary-energy", `${state.energy}/10`);
  setText("summary-soreness", `${state.soreness}/10`);
  setText("summary-pain", state.pain ? "Yes" : "No");
  setText("summary-confidence", confidencePercent(readinessResult.confidence));
  setText("summary-comments", state.comments || "—");
}

async function loadDailyState() {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("daily_state")
    .select(DAILY_STATE_COLUMNS)
    .eq("user_id", session.user.id)
    .eq("date", todayISODate())
    .maybeSingle();

  if (error) throw error;
  dailyState = data;
  renderWarRoom(dailyState);
}

function missionsMatch(previousMission, newMission) {
  return Boolean(previousMission)
    && previousMission.title === newMission.title
    && previousMission.detail === newMission.detail
    && previousMission.restrictions === newMission.restrictions
    && previousMission.generatedFromReadiness === newMission.generatedFromReadiness;
}

function buildCommandEvents(newState, previousState) {
  const newResult = evaluateReadiness(newState);
  const previousResult = previousState ? evaluateReadiness(previousState) : null;
  const newReadiness = newResult.state;
  const previousReadiness = previousResult ? previousResult.state : null;
  const newMission = generateMission(newResult);
  const previousMission = previousResult ? generateMission(previousResult) : null;
  const metadata = {
    date: newState.date,
    readiness: newReadiness,
    previousReadiness,
    missionTitle: newMission.title,
    previousMissionTitle: previousMission ? previousMission.title : null,
    confidence: newResult.confidence,
    rationaleSummary: newResult.rationale.join(" ")
  };
  const events = [
    {
      user_id: session.user.id,
      event_type: "ROLL_CALL_SUBMITTED",
      severity: "INFO",
      message: "Morning Roll Call submitted.",
      metadata
    }
  ];

  if (!previousReadiness || previousReadiness !== newReadiness) {
    events.push({
      user_id: session.user.id,
      event_type: "READINESS_UPDATED",
      severity: readinessSeverity[newReadiness],
      message: previousReadiness
        ? `Readiness changed: ${previousReadiness} → ${newReadiness}.`
        : `Readiness initialized: ${newReadiness}.`,
      metadata
    });
  }

  if (!missionsMatch(previousMission, newMission)) {
    events.push({
      user_id: session.user.id,
      event_type: "MISSION_GENERATED",
      severity: "INFO",
      message: previousMission
        ? `Mission changed: ${previousMission.title} → ${newMission.title}.`
        : `Mission initialized: ${newMission.title}.`,
      metadata: { ...metadata, restrictions: newMission.restrictions }
    });
  }

  return events;
}

async function writeCommandEvents(newState, previousState) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("command_feed")
    .insert(buildCommandEvents(newState, previousState));

  if (error) throw error;
}

async function saveMorningRollCall(event) {
  event.preventDefault();
  const button = document.getElementById("save-roll-call");
  button.disabled = true;
  button.textContent = "Saving…";
  setStatus("");

  try {
    const form = new FormData(event.currentTarget);
    const comments = String(form.get("comments") || "").trim();
    const payload = {
      user_id: session.user.id,
      date: todayISODate(),
      energy: Number(form.get("energy")),
      soreness: Number(form.get("soreness")),
      pain: form.get("pain") === "yes",
      comments: comments || null
    };
    payload.confidence = evaluateReadiness(payload).confidence;

    const previousState = dailyState;
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("daily_state")
      .upsert(payload, { onConflict: "user_id,date" })
      .select(DAILY_STATE_COLUMNS)
      .single();

    if (error) throw error;
    await writeCommandEvents(data, previousState);

    dailyState = data;
    renderWarRoom(dailyState);
    await loadCommandFeed();
    setStatus("Morning Roll Call saved.");
  } catch (error) {
    setStatus(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Submit Morning Roll Call";
  }
}

function setActiveSection(section = "today") {
  const normalized = normalizeSectionKey(section);
  activeSection = normalized;
  document.querySelectorAll(".nav-link").forEach((link) => {
    const isActive = link.dataset.section === normalized;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
  document.querySelectorAll(".scroll-anchor").forEach((element) => {
    const isMatch = element.id === normalized || element.dataset.section === normalized;
    element.classList.toggle("is-active", isMatch);
  });
  const target = document.getElementById(normalized) || document.querySelector(`[data-section="${normalized}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function restoreSectionFromHash() {
  const hash = window.location.hash ? window.location.hash.replace("#", "") : "";
  setActiveSection(hash || "today");
}

function persistOnboardingState() {
  window.localStorage.setItem("coach-dominion:onboarding-dismissed", onboardingDismissed ? "true" : "false");
}

function renderOnboarding() {
  const panel = document.getElementById("onboarding");
  if (!panel) return;
  panel.hidden = onboardingDismissed;
  panel.setAttribute("aria-hidden", onboardingDismissed ? "true" : "false");
}

function handleSectionNavigation(link) {
  const nextSection = link?.dataset?.section || normalizeSectionKey(link?.hash?.replace("#", ""));
  if (shouldWarnBeforeNavigation(nextSection, complianceDirtyState)) {
    const proceed = window.confirm("You have unsaved Dominion Record changes. Leave this section anyway?");
    if (!proceed) return false;
  }
  setActiveSection(nextSection);
  window.history.replaceState(null, "", `#${nextSection}`);
  return true;
}

async function init() {
  try {
    setLoading(true);
    const supabase = await getClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      window.location.replace("/");
      return;
    }
    session = data.session;
    setText("identity", "Signed in as " + session.user.email);
    onboardingDismissed = window.localStorage.getItem("coach-dominion:onboarding-dismissed") === "true";
    loadStandardsReviewState();
    loadRankStatus();
    loadPromotionHistory();
    renderOnboarding();
    restoreSectionFromHash();
    await loadDailyState();
    await loadCommandFeed();
    await loadDailyCompliance();
    document.getElementById("weekly-date").value = todayISODate();
    await loadWeeklyInspection();
    await loadTrendsAnalytics();
    await loadPerformanceEntries();
    renderRankSection();
    resetPerformanceForm();
  } catch (error) {
    setStatus(error.message);
  } finally {
    setLoading(false);
  }
}

if (typeof document !== "undefined") {
  initializeComplianceForm();
  document.getElementById("roll-call-form").addEventListener("submit", saveMorningRollCall);
  document.getElementById("compliance-form").addEventListener("submit", saveDailyCompliance);
  document.getElementById("compliance-form").addEventListener("input", () => {
    renderComplianceScore(readComplianceForm());
    setComplianceDirtyState(readComplianceForm());
    updateComplianceStatusMessage();
  });
  document.getElementById("inspect-week").addEventListener("click", loadWeeklyInspection);
  document.getElementById("weekly-date").addEventListener("change", loadWeeklyInspection);
  document.getElementById("finalize-week").addEventListener("click", finalizeWeeklyInspection);
  document.getElementById("performance-form").addEventListener("submit", savePerformanceEntry);
  document.getElementById("performance-reset").addEventListener("click", resetPerformanceForm);
  document.getElementById("performance-domain").addEventListener("change", () => { populatePerformanceActivityOptions(document.getElementById("performance-domain").value); refreshPerformanceFieldVisibility(); });
  document.getElementById("performance-entry-type").addEventListener("change", refreshPerformanceFieldVisibility);
  document.getElementById("performance-filter-date").addEventListener("change", (event) => { performanceFilters.date = event.target.value; renderPerformanceSection(); });
  document.getElementById("performance-filter-domain").addEventListener("change", (event) => { performanceFilters.domain = event.target.value; renderPerformanceSection(); });
  document.getElementById("performance-filter-activity").addEventListener("input", (event) => { performanceFilters.activity = event.target.value; renderPerformanceSection(); });
  document.getElementById("performance-filter-entry-type").addEventListener("change", (event) => { performanceFilters.entryType = event.target.value; renderPerformanceSection(); });
  document.getElementById("performance-entry-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const entryId = button.dataset.id;
    if (button.dataset.action === "edit") {
      const entry = performanceEntries.find((item) => String(item.id) === String(entryId));
      if (entry) populatePerformanceForm(entry);
    }
    if (button.dataset.action === "delete") {
      deletePerformanceEntry(entryId);
    }
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (handleSectionNavigation(link)) {
        window.location.hash = `#${normalizeSectionKey(link.dataset.section)}`;
      }
    });
  });
  document.getElementById("help-onboarding").addEventListener("click", () => {
    onboardingDismissed = false;
    persistOnboardingState();
    renderOnboarding();
    setActiveSection("today");
  });
  const reviewPromotionButton = document.getElementById("review-promotion");
  const finalizePromotionButton = document.getElementById("finalize-promotion");
  if (reviewPromotionButton) {
    reviewPromotionButton.addEventListener("click", () => {
      renderRankSection();
    });
  }
  if (finalizePromotionButton) {
    finalizePromotionButton.addEventListener("click", () => {
      const nextRank = getNextRankDefinition(rankStatus.currentRank || "RECRUIT");
      if (!nextRank) return;
      const snapshot = finalizePromotionSnapshot({
        currentRank: rankStatus.currentRank || "RECRUIT",
        nextRank: nextRank.code,
        status: "ELIGIBLE",
        effectiveDate: todayISODate(),
        promotionAuthorized: true,
        qualificationSnapshot: buildPromotionEvidence({
          currentRank: rankStatus.currentRank || "RECRUIT",
          nextRank: nextRank.code,
          finalizedInspections: weeklyInspection?.counts?.completed || 0,
          recentAverageDisciplineScore: weeklyInspection?.score || 0,
          recentAverageEvidenceCoverage: weeklyInspection?.evidenceCoverage || 0,
          consecutiveQualifyingWeeks: 0,
          unresolvedConfirmedViolations: 0,
          unresolvedLevelTwoViolations: 0,
          unresolvedLevelThreeViolations: 0,
          activeCorrectivePeriod: Boolean(rankStatus.activeCorrectivePeriod),
          domainScores: weeklyInspection?.domainScores || {}
        })
      }, true);
      rankStatus = {
        ...rankStatus,
        currentRank: snapshot.currentRank,
        promotionState: snapshot.promotionState,
        updatedAt: new Date().toISOString()
      };
      promotionHistory = [{ ...snapshot, createdAt: new Date().toISOString() }, ...promotionHistory];
      saveRankStatus();
      renderRankSection();
    });
  }
  const reviewStandardsButton = document.getElementById("review-standards-candidate");
  const confirmStandardsButton = document.getElementById("confirm-standards-candidate");
  if (reviewStandardsButton) {
    reviewStandardsButton.addEventListener("click", () => {
      const selected = mergeStandardsReviewItems(deriveStandardsReviewItems(dailyCompliance))[0];
      if (!selected) return;
      const updated = updateStandardsReviewItem(selected, "UNDER REVIEW");
      if (updated) renderStandardsSection();
    });
  }
  if (confirmStandardsButton) {
    confirmStandardsButton.addEventListener("click", () => {
      const selected = mergeStandardsReviewItems(deriveStandardsReviewItems(dailyCompliance))[0];
      if (!selected) return;
      const updated = updateStandardsReviewItem(selected, "CONFIRMED");
      if (updated) renderStandardsSection();
    });
  }
  document.getElementById("dismiss-onboarding").addEventListener("click", () => {
    onboardingDismissed = true;
    persistOnboardingState();
    renderOnboarding();
  });
  window.addEventListener("hashchange", restoreSectionFromHash);
  document.getElementById("logout").addEventListener("click", async () => {
    const supabase = await getClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  });

  init();
}

if (typeof module !== "undefined") {
  module.exports = {
    evaluateReadiness,
    calculateConfidence,
    calculateReadiness,
    generateMission,
    generateMorningBrief,
    formatAtlasBriefVoice,
    normalizeComplianceStatus,
    scoreComplianceDomain,
    calculateDisciplineScore,
    formatDisciplineScore,
    buildComplianceExplanation,
    deriveDailyComplianceState,
    getInspectionWeekRange,
    calculateWeeklyDisciplineScore,
    calculateEvidenceCoverage,
    deriveInspectionStatus,
    identifyStrongestAndWeakestDomains,
    selectNextWeekPriority,
    aggregateWeeklyCompliance,
    generateWeeklyAfterActionReport,
    finalizeWeeklyInspectionSnapshot,
    sortInspectionHistory,
    selectTrendWindow,
    calculateLinearTrend,
    deriveTrajectoryState,
    calculateDomainTrends,
    calculateComplianceStreaks,
    summarizeInspectionHistory,
    identifyBestAndLowestWeeks,
    buildChartSeries,
    generateAtlasTrendReport,
    deriveCommandCenterOverview,
    normalizeSectionKey,
    shouldWarnBeforeNavigation,
    deriveDirtyState,
    deriveFinalizeConfirmationState,
    isFinalizedReadOnlyInspection,
    deriveOnboardingVisibility,
    getStatusMessage,
    deriveSaveState,
    deriveInputImmutabilityState,
    getStandardsCatalog,
    normalizeRankCode,
    getRankCatalog,
    getCurrentRankDefinition,
    getNextRankDefinition,
    validateRankTransition,
    calculatePromotionMetrics,
    calculateConsecutiveQualifyingWeeks,
    evaluatePromotionEligibility,
    derivePromotionState,
    buildPromotionEvidence,
    generateAtlasPromotionReview,
    finalizePromotionSnapshot,
    buildRankStatusEvent,
    deriveCorrectivePeriodState,
    summarizePromotionHistory,
    deriveRankStatusFromRecord,
    formatPromotionMetric,
    dedupeViolationCandidates,
    deriveViolationCandidates,
    detectProtectedException,
    classifyViolationCandidate,
    calculateViolationSeverity,
    validateViolationTransition,
    selectCorrectiveAction,
    generateAtlasStandardsReview,
    buildViolationAuditEvent,
    summarizeWeeklyViolationHistory,
    deriveStandardsState,
    buildStandardsReviewState,
    deriveStandardsReviewStateFromRecord,
    sanitizeStandardsReviewState,
    buildStandardsPersistencePayload,
    getPerformanceDomainCatalog,
    getPerformanceActivityCatalog,
    normalizePerformanceEntry,
    validatePerformanceEntry,
    calculateStrengthVolume,
    estimateOneRepMax,
    calculateRunningPace,
    normalizePerformanceUnits,
    buildPerformancePersistencePayload,
    hydratePerformanceEntry,
    summarizeRecentPerformance,
    filterPerformanceEntries,
    removePerformanceEntry,
    derivePerformanceEmptyState,
    WEEKLY_EVIDENCE_THRESHOLD,
    TREND_WINDOW_SIZE,
    TREND_SLOPE_THRESHOLD,
    TREND_EVIDENCE_THRESHOLD,
    dailyIntelligence,
    buildCommandEvents,
    __setSessionForTests: (value) => { session = value; }
  };
}

function standardsStorageKey() {
  return `coach-dominion:standards:${session?.user?.id || "local"}`;
}

function standardsEventStorageKey() {
  return `coach-dominion:standards-events:${session?.user?.id || "local"}`;
}

function loadStandardsReviewState() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const stored = window.localStorage.getItem(standardsStorageKey());
    const parsed = stored ? JSON.parse(stored) : [];
    standardsReviewState = Array.isArray(parsed) ? parsed : [];
    return standardsReviewState;
  } catch (_) {
    standardsReviewState = [];
    return standardsReviewState;
  }
}

function saveStandardsReviewState(items = []) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    standardsReviewState = Array.isArray(items) ? items : [];
    window.localStorage.setItem(standardsStorageKey(), JSON.stringify(standardsReviewState));
  } catch (_) {
    standardsReviewState = [];
  }
}

function loadStandardsAuditEvents() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const stored = window.localStorage.getItem(standardsEventStorageKey());
    return stored ? JSON.parse(stored) : [];
  } catch (_) {
    return [];
  }
}

function saveStandardsAuditEvents(items = []) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(standardsEventStorageKey(), JSON.stringify(items));
  } catch (_) {
    // Ignore local persistence failure.
  }
}

function standardsDomainCode(domain = "reporting") {
  const mapping = {
    mission: "MISSION-EXECUTION-01",
    strength: "STRENGTH-01",
    cardio: "CARDIO-01",
    recovery: "RECOVERY-01",
    nutrition: "NUTRITION-01"
  };
  return mapping[domain] || "REPORTING-01";
}

function deriveStandardsReviewItems(record = null) {
  if (!record) return [];
  const entries = COMPLIANCE_DOMAINS.reduce((results, domain) => {
    const status = normalizeComplianceStatus(record[`${domain}_status`]);
    const evidence = [record[`${domain}_actual`] || "", record[`${domain}_note`] || "", record[`${domain}_restriction`] || ""].filter(Boolean).join(" | ");
    const protectedException = record[`${domain}_approved_modification`] ? "approved_modification" : (record[`${domain}_restriction`] ? "approved_modification" : null);
    if (status === "missed" && evidence && !protectedException) {
      results.push({
        id: `${record.compliance_date || todayISODate()}:${domain}`,
        standardCode: standardsDomainCode(domain),
        domain,
        category: COMPLIANCE_DOMAIN_LABELS[domain],
        title: `${COMPLIANCE_DOMAIN_LABELS[domain]} review`,
        sourceType: "daily_compliance",
        sourceDate: record.compliance_date || todayISODate(),
        evidence,
        status: "missed",
        repeatCount: 1,
        deliberate: false,
        safety: false
      });
    }
    return results;
  }, []);
  return deriveViolationCandidates(entries, []).map((candidate) => classifyViolationCandidate(candidate));
}

function mergeStandardsReviewItems(items = []) {
  const existing = loadStandardsReviewState();
  return items.map((item) => {
    const persisted = existing.find((record) => record.id === item.id);
    if (!persisted) return item;
    return {
      ...item,
      ...persisted,
      severity: persisted.severity || item.severity,
      correctiveAction: persisted.correctiveAction || item.correctiveAction,
      protectedException: persisted.protectedException || item.protectedException
    };
  });
}

function updateStandardsReviewItem(candidate, nextStatus) {
  const transition = validateViolationTransition(candidate.status || "CANDIDATE", nextStatus);
  if (!transition.valid) return null;
  const updated = {
    ...candidate,
    status: nextStatus,
    classification: nextStatus === "CONFIRMED" ? "CONFIRMED" : nextStatus === "DISMISSED" ? "DISMISSED" : nextStatus === "EXCUSED" ? "EXCUSED" : candidate.classification || "CANDIDATE",
    correctiveAction: candidate.correctiveAction || selectCorrectiveAction({ classification: nextStatus === "CONFIRMED" ? "CONFIRMED" : candidate.classification || "CANDIDATE", severity: candidate.severity?.level || "LEVEL I", domain: candidate.domain }),
    updatedAt: new Date().toISOString()
  };
  const existingIndex = standardsReviewState.findIndex((item) => item.id === candidate.id);
  if (existingIndex >= 0) {
    standardsReviewState[existingIndex] = updated;
  } else {
    standardsReviewState.push(updated);
  }
  const event = buildViolationAuditEvent(candidate.id, candidate.status || "CANDIDATE", nextStatus, `Reviewed via ${nextStatus.toLowerCase().replaceAll(" ", "_")}`);
  const events = loadStandardsAuditEvents();
  events.push({ ...event, violationId: candidate.id, userId: session?.user?.id || null, createdAt: new Date().toISOString() });
  saveStandardsAuditEvents(events);
  saveStandardsReviewState(standardsReviewState);
  return updated;
}

function composeStandardsPersistencePayload(candidate, storageMode = "SUPABASE") {
  return buildStandardsPersistencePayload({
    id: candidate.id,
    userId: session?.user?.id || null,
    standardCode: candidate.standardCode || candidate.standard_code || standardsDomainCode(candidate.domain),
    category: candidate.category || "Reporting and Evidence",
    title: candidate.title || "Standards review",
    sourceType: candidate.sourceType || candidate.source_type || "daily_compliance",
    sourceId: candidate.sourceId || candidate.source_id || null,
    sourceDate: candidate.sourceDate || candidate.source_date || todayISODate(),
    domain: candidate.domain || null,
    evidence: candidate.evidence || null,
    protectedException: candidate.protectedException || null,
    candidateReason: candidate.candidateReason || candidate.candidate_reason || null,
    classification: candidate.classification || "CANDIDATE",
    severity: candidate.severity?.level || candidate.severity || "LEVEL I",
    status: candidate.status || "CANDIDATE",
    correctiveAction: candidate.correctiveAction || null,
    correctionNote: candidate.correctionNote || candidate.correction_note || null,
    confirmedAt: candidate.confirmedAt || candidate.confirmed_at || null,
    correctedAt: candidate.correctedAt || candidate.corrected_at || null,
    resolvedAt: candidate.resolvedAt || candidate.resolved_at || null,
    dismissedAt: candidate.dismissedAt || candidate.dismissed_at || null,
    excusedAt: candidate.excusedAt || candidate.excused_at || null,
    createdAt: candidate.createdAt || candidate.created_at || null,
    updatedAt: candidate.updatedAt || candidate.updated_at || null,
    storageMode
  });
}

async function saveStandardsReviewStateToSupabase(items = []) {
  const supabase = await getClient();
  const payloads = sanitizeStandardsReviewState(items).map((item) => composeStandardsPersistencePayload(item, "SUPABASE"));
  const { error } = await supabase.from("standards_violations").upsert(payloads, { onConflict: "user_id,standard_code,source_type,source_date,domain" });
  if (error) throw error;
}

async function loadStandardsReviewStateFromSupabase() {
  const supabase = await getClient();
  const { data, error } = await supabase.from("standards_violations").select("*").eq("user_id", session.user.id).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

function rankStorageKey() {
  return `coach-dominion:rank:${session?.user?.id || "local"}`;
}

function promotionHistoryStorageKey() {
  return `coach-dominion:rank-history:${session?.user?.id || "local"}`;
}

function loadRankStatus() {
  if (typeof window === "undefined" || !window.localStorage) return rankStatus;
  try {
    const stored = window.localStorage.getItem(rankStorageKey());
    const parsed = stored ? JSON.parse(stored) : null;
    rankStatus = parsed ? { ...rankStatus, ...parsed } : rankStatus;
    return rankStatus;
  } catch (_) {
    return rankStatus;
  }
}

function saveRankStatus() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(rankStorageKey(), JSON.stringify(rankStatus));
  } catch (_) {
    // Ignore local persistence failure.
  }
}

function loadPromotionHistory() {
  if (typeof window === "undefined" || !window.localStorage) return promotionHistory;
  try {
    const stored = window.localStorage.getItem(promotionHistoryStorageKey());
    const parsed = stored ? JSON.parse(stored) : [];
    promotionHistory = Array.isArray(parsed) ? parsed : [];
    return promotionHistory;
  } catch (_) {
    return promotionHistory;
  }
}

function savePromotionHistory(items = []) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    promotionHistory = Array.isArray(items) ? items : [];
    window.localStorage.setItem(promotionHistoryStorageKey(), JSON.stringify(promotionHistory));
  } catch (_) {
    // Ignore local persistence failure.
  }
}

function renderRankSection() {
  if (typeof document === "undefined") return;
  const container = document.getElementById("rank");
  if (!container) return;
  const currentRank = rankStatus.currentRank || "RECRUIT";
  const nextRank = getNextRankDefinition(currentRank);
  const eligibility = evaluatePromotionEligibility({
    currentRank,
    finalizedInspections: weeklyInspection?.counts?.completed || 0,
    recentAverageDisciplineScore: weeklyInspection?.score || 0,
    recentAverageEvidenceCoverage: weeklyInspection?.evidenceCoverage || 0,
    consecutiveQualifyingWeeks: 0,
    unresolvedConfirmedViolations: 0,
    unresolvedLevelTwoViolations: 0,
    unresolvedLevelThreeViolations: 0,
    activeCorrectivePeriod: Boolean(rankStatus.activeCorrectivePeriod),
    domainScores: weeklyInspection?.domainScores || {},
    standardsHistory: standardsReviewState || []
  }, nextRank?.code || "CADET");
  const evidence = buildPromotionEvidence({
    currentRank,
    nextRank: nextRank?.code || "CADET",
    finalizedInspections: weeklyInspection?.counts?.completed || 0,
    recentAverageDisciplineScore: weeklyInspection?.score || 0,
    recentAverageEvidenceCoverage: weeklyInspection?.evidenceCoverage || 0,
    consecutiveQualifyingWeeks: 0,
    unresolvedConfirmedViolations: 0,
    unresolvedLevelTwoViolations: 0,
    unresolvedLevelThreeViolations: 0,
    activeCorrectivePeriod: Boolean(rankStatus.activeCorrectivePeriod),
    domainScores: weeklyInspection?.domainScores || {},
    standardsHistory: standardsReviewState || []
  });
  const review = generateAtlasPromotionReview({
    currentRank,
    nextRank: nextRank?.code || "CADET",
    status: eligibility.status,
    blockers: eligibility.blockers,
    remainingActions: eligibility.remainingActions,
    qualifyingHistory: `${weeklyInspection?.counts?.completed || 0} finalized inspections available`,
    disciplineStandard: `Recent weekly discipline score target is ${eligibility.target?.minimumAverageDisciplineScore || 0}`,
    evidenceStandard: `Evidence coverage target is ${eligibility.target?.minimumAverageEvidenceCoverage || 0}%`,
    standardsRecord: `Confirmed standards issues: ${eligibility.unresolvedConfirmedViolations || 0}`,
    promotionOrder: "One rank at a time.",
    commandNote: nextRank ? `${nextRank.promotionCommandNote}` : "No additional rank remains."
  });
  setText("rank-current", currentRank);
  setText("rank-next", nextRank?.displayName || "—");
  setText("rank-status", eligibility.status);
  setText("rank-qualifying-weeks", String(eligibility.consecutiveQualifyingWeeksRequired || 0));
  const rankStateBadge = document.getElementById("rank-state");
  if (rankStateBadge) {
    rankStateBadge.textContent = eligibility.status;
    rankStateBadge.className = `state-pill ${eligibility.status === "ELIGIBLE" ? "green" : eligibility.status === "PROMOTED" ? "green" : eligibility.status === "PROGRESSING" ? "yellow" : eligibility.status === "BLOCKED" ? "red" : "neutral"}`;
  }
  const requirements = document.getElementById("rank-requirements");
  if (requirements) {
    requirements.innerHTML = evidence.requirements.map((item) => `<li>${item.requirement.replaceAll("_", " ")} — target ${item.target}, actual ${item.actual} (${item.passed ? "PASS" : "FAIL"})</li>`).join("");
  }
  const blockers = document.getElementById("rank-blockers");
  if (blockers) {
    blockers.innerHTML = eligibility.blockers.length ? eligibility.blockers.map((item) => `<div class="standards-item"><p>${item}</p></div>`).join("") : '<div class="standards-empty">No blockers detected.</div>';
  }
  const reviewOutput = document.getElementById("rank-review-output");
  if (reviewOutput) reviewOutput.textContent = review.text;
  const history = document.getElementById("rank-history");
  if (history) {
    const items = promotionHistory.length ? promotionHistory.map((item) => `<li class="feed-event info"><div class="feed-meta"><strong>${item.priorRank || "RECRUIT"} → ${item.currentRank || "CADET"}</strong><span>${item.promotionState || "PROMOTED"}</span></div><p>${item.effectiveDate || ""}</p></li>`).join("") : '<li class="feed-empty">No finalized promotions yet.</li>';
    history.innerHTML = items;
  }
  const ladder = document.getElementById("rank-ladder");
  if (ladder) {
    ladder.innerHTML = getRankCatalog().map((rank) => `<div class="standards-item"><div class="standards-item-header"><strong>${rank.displayName}</strong><span class="state-pill ${rank.code === currentRank ? "green" : "neutral"}">${rank.code}</span></div><p>${rank.description}</p><small>Min inspections ${rank.minimumFinalizedInspections}; min score ${rank.minimumAverageDisciplineScore}; evidence ${rank.minimumAverageEvidenceCoverage}%</small></div>`).join("");
  }
}

function renderStandardsSection() {
  if (typeof document === "undefined") return;
  const container = document.getElementById("standards");
  if (!container) return;
  const catalog = getStandardsCatalog();
  const items = mergeStandardsReviewItems(deriveStandardsReviewItems(dailyCompliance));
  const openItems = items.filter((item) => !["RESOLVED", "DISMISSED", "EXCUSED"].includes(item.status));
  const selected = items[0] || null;
  const summaryState = openItems.length ? (openItems.some((item) => item.status === "CONFIRMED") ? "REVIEWING" : "MONITORING") : "CLEAR";
  setText("standards-catalog-count", catalog.length);
  setText("standards-candidate-count", openItems.length);
  setText("standards-confirmed-count", items.filter((item) => item.status === "CONFIRMED").length);
  setText("standards-resolved-count", items.filter((item) => item.status === "RESOLVED").length);
  const badge = document.getElementById("standards-state");
  if (badge) {
    badge.textContent = summaryState;
    badge.className = `state-pill ${summaryState === "REVIEWING" ? "yellow" : summaryState === "MONITORING" ? "neutral" : "green"}`;
  }
  const queue = document.getElementById("standards-queue");
  if (queue) {
    queue.innerHTML = items.length
      ? items.map((item) => {
        const pillClass = item.status === "CONFIRMED" ? "green" : item.status === "UNDER REVIEW" ? "yellow" : "neutral";
        return `<article class="standards-item"><div class="standards-item-header"><strong>${item.domain}</strong><span class="state-pill ${pillClass}">${item.status || "CANDIDATE"}</span></div><p>${item.evidence || "No evidence recorded."}</p><small>${item.severity?.level || "LEVEL I"}</small></article>`;
      }).join("")
      : '<div class="standards-empty">No standards review candidates detected for the current Dominion Record.</div>';
  }
  const output = document.getElementById("standards-review-output");
  if (output) {
    if (!selected) {
      output.textContent = "No standards review candidates yet. Save a Dominion Record with a missed domain to populate the queue.";
    } else {
      const review = generateAtlasStandardsReview({
        status: selected.status || "CANDIDATE",
        standardCode: selected.standardCode || standardsDomainCode(selected.domain),
        severity: selected.severity,
        evidence: selected.evidence || "No evidence recorded.",
        protectedException: selected.protectedException || "None",
        classification: selected.classification || "CANDIDATE",
        correctiveAction: selected.correctiveAction || selectCorrectiveAction({ classification: selected.classification || "CANDIDATE", severity: selected.severity?.level || "LEVEL I", domain: selected.domain })
      });
      output.textContent = review.text;
    }
  }
  const auditTrail = document.getElementById("standards-audit-trail");
  if (auditTrail) {
    const events = loadStandardsAuditEvents().slice().sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""));
    auditTrail.innerHTML = events.length
      ? events.map((event) => `<li class="feed-event info"><div class="feed-meta"><strong>${event.violationId || "Review"}</strong><span>${event.priorStatus} → ${event.newStatus}</span></div><p>${event.note || "Reviewed"}</p><time>${event.createdAt ? new Date(event.createdAt).toLocaleString() : "Pending"}</time></li>`).join("")
      : '<li class="feed-empty">Standards reviews are logged locally until a Supabase-backed audit table is applied.</li>';
  }
}

function emptyComplianceDomains() {
  return Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => [key, {
    status: null,
    target: "",
    actual: "",
    note: "",
    restriction: "",
    approvedModification: false
  }]));
}

function complianceDomainsFromRecord(record) {
  const domains = emptyComplianceDomains();
  if (!record) return domains;
  COMPLIANCE_DOMAINS.forEach((key) => {
    domains[key] = {
      status: normalizeComplianceStatus(record[`${key}_status`]),
      target: record[`${key}_target`] || "",
      actual: record[`${key}_actual`] || "",
      note: record[`${key}_note`] || "",
      restriction: record[`${key}_restriction`] || "",
      approvedModification: Boolean(record[`${key}_approved_modification`])
    };
  });
  return domains;
}

function complianceDomainRow(key) {
  return `
    <fieldset class="compliance-domain" data-domain="${key}">
      <legend><button class="domain-toggle" type="button" aria-expanded="true" data-domain-toggle="${key}">${COMPLIANCE_DOMAIN_LABELS[key]}</button></legend>
      <div class="compliance-domain-grid" data-domain-content="${key}">
        <label for="${key}_target">Assigned target
          <input id="${key}_target" name="${key}_target" maxlength="500" placeholder="What was assigned?">
        </label>
        <label for="${key}_status">Completion status
          <select id="${key}_status" name="${key}_status">
            <option value="">NOT ASSESSED</option>
            <option value="completed">COMPLETE</option>
            <option value="partial">PARTIAL</option>
            <option value="missed">MISSED</option>
            <option value="excused">EXCUSED</option>
            <option value="not_applicable">N/A</option>
          </select>
        </label>
        <label for="${key}_actual">Actual result
          <input id="${key}_actual" name="${key}_actual" maxlength="500" placeholder="What was completed or modified?">
        </label>
        <label for="${key}_note">User note
          <input id="${key}_note" name="${key}_note" maxlength="500" placeholder="Optional execution context">
        </label>
        <label class="compliance-restriction" for="${key}_restriction">Restriction or approved modification
          <input id="${key}_restriction" name="${key}_restriction" maxlength="500" placeholder="Readiness, medical, or approved adjustment">
        </label>
        <label class="compliance-check" for="${key}_approved_modification"><input id="${key}_approved_modification" name="${key}_approved_modification" type="checkbox"> Approved modification</label>
      </div>
    </fieldset>`;
}

function initializeComplianceForm() {
  const container = document.getElementById("compliance-domains");
  container.innerHTML = COMPLIANCE_DOMAINS.map(complianceDomainRow).join("");
  container.querySelectorAll(".domain-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const domain = button.dataset.domainToggle;
      const fieldset = container.querySelector(`[data-domain="${domain}"]`);
      const content = fieldset?.querySelector(`[data-domain-content="${domain}"]`);
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      fieldset?.classList.toggle("collapsed", expanded);
      if (content) content.hidden = expanded;
    });
  });
}

function applyMissionComplianceDefaults(domains) {
  if (!dailyState || domains.mission.target) return domains;
  const readinessResult = evaluateReadiness(dailyState);
  const mission = generateMission(readinessResult);
  domains.mission.target = `${mission.title}: ${mission.detail}`;
  domains.mission.restriction = readinessResult.restrictions.join("; ");
  domains.mission.approvedModification = readinessResult.state !== "GREEN";
  return domains;
}

function readComplianceForm() {
  const form = document.getElementById("compliance-form");
  const values = new FormData(form);
  return Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => [key, {
    status: normalizeComplianceStatus(values.get(`${key}_status`)),
    target: String(values.get(`${key}_target`) || "").trim(),
    actual: String(values.get(`${key}_actual`) || "").trim(),
    note: String(values.get(`${key}_note`) || "").trim(),
    restriction: String(values.get(`${key}_restriction`) || "").trim(),
    approvedModification: values.get(`${key}_approved_modification`) === "on"
  }]));
}

function renderComplianceScore(domains) {
  const state = deriveDailyComplianceState(domains);
  setText("discipline-score", state.displayScore);
  setText("compliance-status", state.complianceStatus);
  setText("compliance-formula", state.explanation.formula);
  setList("compliance-included", state.explanation.included, "No domains included.");
  setList("compliance-excluded", state.explanation.excluded, "No domains excluded.");
}

function updateComplianceStatusMessage() {
  const saveState = deriveSaveState(currentSaveState);
  const storageLabel = document.getElementById("compliance-storage");
  storageLabel.textContent = saveState.label.toUpperCase();
  storageLabel.className = `compliance-storage ${saveState.tone}`;
  const updatedLabel = document.getElementById("compliance-updated");
  updatedLabel.textContent = currentSaveState === "failed"
    ? "Save failed. Retry when connection is available."
    : currentSaveState === "locally saved"
      ? "Saved locally while remote sync is unavailable."
      : currentSaveState === "saving"
        ? "Saving record…"
        : currentSaveState === "saved"
          ? "Saved successfully."
          : "Not saved yet";
}

function setComplianceDirtyState(nextState = null) {
  const form = document.getElementById("compliance-form");
  if (!form) return;
  const values = nextState || readComplianceForm();
  complianceDirtyState = deriveDirtyState(compliancePreviousState || emptyComplianceDomains(), values);
  const saveButton = document.getElementById("save-compliance");
  if (saveButton) saveButton.disabled = !complianceDirtyState;
  form.dataset.dirty = complianceDirtyState ? "true" : "false";
}

function setComplianceDefaultsFromState(record) {
  const domains = applyMissionComplianceDefaults(complianceDomainsFromRecord(record));
  COMPLIANCE_DOMAINS.forEach((key) => {
    const fieldset = document.querySelector(`[data-domain="${key}"]`);
    if (fieldset) fieldset.classList.toggle("collapsed", false);
  });
  return domains;
}

function renderComplianceRecord(record, storageMode = "SUPABASE") {
  const domains = setComplianceDefaultsFromState(record);
  COMPLIANCE_DOMAINS.forEach((key) => {
    const domain = domains[key];
    const form = document.getElementById("compliance-form");
    form.elements[`${key}_status`].value = domain.status || "";
    form.elements[`${key}_target`].value = domain.target;
    form.elements[`${key}_actual`].value = domain.actual;
    form.elements[`${key}_note`].value = domain.note;
    form.elements[`${key}_restriction`].value = domain.restriction;
    form.elements[`${key}_approved_modification`].checked = domain.approvedModification;
  });
  compliancePreviousState = readComplianceForm();
  setComplianceDirtyState(compliancePreviousState);
  setText("compliance-date", record?.compliance_date || todayISODate());
  renderComplianceScore(domains);
  currentSaveState = storageMode === "LOCAL" ? "locally saved" : "saved";
  updateComplianceStatusMessage();
  lastSavedComplianceState = structuredClone(compliancePreviousState);
  renderStandardsSection();
}

function complianceStorageKey() {
  return `coach-dominion:daily-compliance:${session?.user?.id || "local"}:${todayISODate()}`;
}

function loadLocalCompliance() {
  try {
    const stored = window.localStorage.getItem(complianceStorageKey());
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    return null;
  }
}

function saveLocalCompliance(record) {
  try {
    window.localStorage.setItem(complianceStorageKey(), JSON.stringify(record));
    return true;
  } catch (_) {
    return false;
  }
}

async function loadDailyCompliance() {
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("daily_compliance")
      .select(COMPLIANCE_COLUMNS)
      .eq("user_id", session.user.id)
      .eq("compliance_date", todayISODate())
      .maybeSingle();
    if (error) throw error;
    dailyCompliance = data;
    renderComplianceRecord(dailyCompliance, "SUPABASE");
    try {
      const remoteStandards = await loadStandardsReviewStateFromSupabase();
      standardsReviewState = sanitizeStandardsReviewState(remoteStandards.map((item) => ({ ...item, status: item.status || "CANDIDATE", severity: item.severity ? { level: item.severity, explanation: "Loaded from Supabase" } : { level: "LEVEL I", explanation: "Loaded from Supabase" } })));
      saveStandardsReviewState(standardsReviewState);
      saveStandardsAuditEvents([]);
    } catch (_) {
      // No remote standards state available; fall back to local state.
    }
  } catch (_) {
    dailyCompliance = loadLocalCompliance();
    renderComplianceRecord(dailyCompliance, "LOCAL");
    standardsReviewState = loadStandardsReviewState();
  }
}

function compliancePayload(domains) {
  const state = deriveDailyComplianceState(domains);
  const payload = {
    user_id: session?.user?.id || null,
    compliance_date: todayISODate(),
    discipline_score: state.score,
    score_evidence: { evidence: state.evidence, explanation: state.explanation, complianceStatus: state.complianceStatus }
  };
  COMPLIANCE_DOMAINS.forEach((key) => {
    payload[`${key}_status`] = domains[key].status;
    payload[`${key}_target`] = domains[key].target || null;
    payload[`${key}_actual`] = domains[key].actual || null;
    payload[`${key}_note`] = domains[key].note || null;
    payload[`${key}_restriction`] = domains[key].restriction || null;
    payload[`${key}_approved_modification`] = domains[key].approvedModification;
  });
  return payload;
}

async function saveDailyCompliance(event) {
  event.preventDefault();
  const button = document.getElementById("save-compliance");
  button.disabled = true;
  button.textContent = "Saving…";
  currentSaveState = "saving";
  updateComplianceStatusMessage();
  const payload = compliancePayload(readComplianceForm());
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("daily_compliance")
      .upsert(payload, { onConflict: "user_id,compliance_date" })
      .select(COMPLIANCE_COLUMNS)
      .single();
    if (error) throw error;
    dailyCompliance = data;
    currentSaveState = "saved";
    renderComplianceRecord(data, "SUPABASE");
    try {
      await saveStandardsReviewStateToSupabase(standardsReviewState);
    } catch (_) {
      // Ignore remote standards persistence failure and continue with local fallback.
    }
  } catch (_) {
    const localRecord = { ...payload, updated_at: new Date().toISOString() };
    dailyCompliance = localRecord;
    const saved = saveLocalCompliance(localRecord);
    currentSaveState = saved ? "locally saved" : "failed";
    renderComplianceRecord(localRecord, "LOCAL");
    if (!saved) setText("compliance-storage", "UNSAVED — local storage unavailable");
  } finally {
    button.disabled = false;
    button.textContent = "Save Dominion Record";
    updateComplianceStatusMessage();
  }
  await loadTrendsAnalytics();
}

function weeklyInspectionStorageKey(weekStartDate) {
  return `coach-dominion:weekly-inspection:${session?.user?.id || "local"}:${weekStartDate}`;
}

function loadLocalWeeklyInspection(weekStartDate) {
  try {
    const stored = window.localStorage.getItem(weeklyInspectionStorageKey(weekStartDate));
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    return null;
  }
}

function saveLocalWeeklyInspection(record) {
  try {
    window.localStorage.setItem(weeklyInspectionStorageKey(record.week_start_date), JSON.stringify(record));
    return true;
  } catch (_) {
    return false;
  }
}

function loadLocalWeekRecords(range) {
  const records = [];
  try {
    for (let offset = 0; offset < 7; offset += 1) {
      const date = formatISODateUTC(addUTCDays(parseISODateUTC(range.weekStartDate), offset));
      const key = `coach-dominion:daily-compliance:${session?.user?.id || "local"}:${date}`;
      const stored = window.localStorage.getItem(key);
      if (stored) records.push(JSON.parse(stored));
    }
  } catch (_) {
    return records;
  }
  return records;
}

function weeklyPersistencePayload(aggregate, finalizedAt = null) {
  const report = aggregate.atlasReport || generateWeeklyAfterActionReport(aggregate);
  return {
    user_id: session?.user?.id || null,
    week_start_date: aggregate.weekStartDate,
    week_end_date: aggregate.weekEndDate,
    inspection_status: finalizedAt ? "inspection_complete" : aggregate.inspectionStatus.toLowerCase().replaceAll(" ", "_"),
    weekly_discipline_score: aggregate.score,
    evidence_coverage: aggregate.evidenceCoverage,
    domain_scores: aggregate.domainScores,
    aggregate_counts: aggregate.counts,
    strongest_domain: aggregate.strongestDomain,
    weakest_domain: aggregate.weakestDomain,
    next_week_priority: aggregate.nextWeekPriority,
    report_evidence: aggregate,
    atlas_report: report,
    finalized_at: finalizedAt
  };
}

function aggregateFromStoredInspection(record) {
  if (!record?.report_evidence) return null;
  const aggregate = structuredClone(record.report_evidence);
  aggregate.finalizedAt = record.finalized_at || aggregate.finalizedAt;
  aggregate.inspectionStatus = record.finalized_at ? "INSPECTION COMPLETE" : aggregate.inspectionStatus;
  aggregate.atlasReport = record.atlas_report || aggregate.atlasReport || generateWeeklyAfterActionReport(aggregate);
  return aggregate;
}

function renderWeeklyInspection(aggregate, storageMode) {
  weeklyInspection = aggregate;
  const finalized = Boolean(aggregate.finalizedAt);
  const finalizeState = deriveFinalizeConfirmationState(finalized, aggregate.evidenceCoverage);
  const label = (key) => key ? COMPLIANCE_DOMAIN_LABELS[key] : "UNSCORED";
  setText("weekly-status", aggregate.inspectionStatus);
  document.getElementById("weekly-status").className = `state-pill ${aggregate.inspectionStatus === "INSPECTION COMPLETE" ? "green" : aggregate.inspectionStatus === "READY FOR INSPECTION" ? "yellow" : "neutral"}`;
  setText("weekly-range", `${aggregate.weekStartDate} — ${aggregate.weekEndDate}`);
  setText("weekly-score", formatDisciplineScore(aggregate.score));
  setText("weekly-coverage", `${Math.round(aggregate.evidenceCoverage)}%`);
  setText("weekly-storage", storageMode === "SUPABASE" ? "SUPABASE" : "LOCAL FALLBACK");
  setText("weekly-assessed-days", `${aggregate.counts.assessedDays} / ${aggregate.counts.fullyAssessedDays}`);
  setText("weekly-unscored-days", aggregate.counts.unscoredDays);
  setText("weekly-result-counts", `${aggregate.counts.completed} / ${aggregate.counts.partial} / ${aggregate.counts.missed}`);
  setText("weekly-excluded-counts", `${aggregate.counts.excused} / ${aggregate.counts.notApplicable}`);
  setText("weekly-modification-count", aggregate.counts.approvedModifications);
  setText("weekly-strongest", aggregate.strongestDomains.length ? aggregate.strongestDomains.map(label).join(" / ") : "UNSCORED");
  setText("weekly-weakest", aggregate.weakestDomains.length ? aggregate.weakestDomains.map(label).join(" / ") : "UNSCORED");
  setText("weekly-missed", aggregate.missedRequirements.length ? aggregate.missedRequirements.map((item) => `${item.date} ${label(item.domain)}`).join("; ") : "None recorded.");
  setText("weekly-excused", aggregate.excusedConditions.length ? aggregate.excusedConditions.map((item) => `${item.date} ${label(item.domain)}: ${item.restriction}`).join("; ") : "None recorded.");
  document.getElementById("weekly-domain-scores").innerHTML = COMPLIANCE_DOMAINS.map((key) => `<div><span>${COMPLIANCE_DOMAIN_LABELS[key]}</span><strong>${formatDisciplineScore(aggregate.domainScores[key].score)}</strong></div>`).join("");
  document.getElementById("weekly-evidence").innerHTML = aggregate.dailyEvidence.map((day) => `<details class="weekly-evidence-day ${day.assessedCount ? "neutral" : "missing"}"><summary><strong>${day.date}</strong><span>${day.assessedCount}/5 ASSESSED</span></summary><p>${day.includedCount} applicable scoring observations</p></details>`).join("");
  setText("weekly-report", (aggregate.atlasReport || generateWeeklyAfterActionReport(aggregate)).text);
  const weeklyStandardsSummary = document.getElementById("weekly-standards-summary");
  const weeklyStandardsItems = standardsReviewState.filter((item) => item.sourceDate && item.sourceDate <= aggregate.weekEndDate && item.sourceDate >= aggregate.weekStartDate);
  if (weeklyStandardsSummary) {
    weeklyStandardsSummary.innerHTML = weeklyStandardsItems.length
      ? weeklyStandardsItems.map((item) => `<article class="standards-item"><div class="standards-item-header"><strong>${item.domain}</strong><span class="state-pill ${item.status === "CONFIRMED" ? "green" : item.status === "RESOLVED" ? "neutral" : item.status === "DISMISSED" ? "neutral" : item.status === "EXCUSED" ? "neutral" : "yellow"}">${item.status || "CANDIDATE"}</span></div><p>${item.evidence || "No evidence recorded."}</p><small>${item.severity?.level || "LEVEL I"}</small></article>`).join("")
      : '<div class="standards-empty">No standards review history for this inspection week.</div>';
  }
  const warning = finalized ? `Finalized ${new Date(aggregate.finalizedAt).toLocaleString()}. Historical snapshot is read-only.` : aggregate.evidenceLimitation ? `Finalization requires ${WEEKLY_EVIDENCE_THRESHOLD}% evidence coverage. Current evidence is limited.` : "";
  setText("weekly-warning", warning);
  const finalizeButton = document.getElementById("finalize-week");
  finalizeButton.disabled = finalized || aggregate.evidenceCoverage < WEEKLY_EVIDENCE_THRESHOLD;
  finalizeButton.textContent = finalized ? "Inspection Finalized" : "Finalize Inspection";
  finalizeButton.setAttribute("aria-disabled", finalizeButton.disabled ? "true" : "false");
  const finalizeHint = document.getElementById("weekly-finalize-hint");
  if (finalizeHint) finalizeHint.textContent = finalized ? "This inspection is finalized and read-only." : finalizeState.readOnlyMessage;
  document.getElementById("weekly-inspection").dataset.finalized = finalized ? "true" : "false";
  renderCommandCenterOverview(dailyState ? evaluateReadiness(dailyState) : null, aggregate);
  renderStandardsSection();
}

async function loadWeeklyInspection() {
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

async function finalizeWeeklyInspection() {
  if (!weeklyInspection) return;
  const finalizeState = deriveFinalizeConfirmationState(Boolean(weeklyInspection.finalizedAt), weeklyInspection.evidenceCoverage);
  if (!finalizeState.canFinalize) {
    setText("weekly-warning", "Finalization requires sufficient evidence coverage.");
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
  const currentRange = getInspectionWeekRange(todayISODate());
  const currentAggregate = aggregateWeeklyCompliance(dailyRecords, currentRange.weekStartDate);
  const hasFinalizedCurrentWeek = sortInspectionHistory(inspections).some((item) => item.weekStartDate === currentRange.weekStartDate && item.finalizedAt);
  const provisional = currentAggregate.counts.assessedObservations > 0 && !hasFinalizedCurrentWeek ? currentAggregate : null;
  const trajectory = deriveTrajectoryState(inspections);
  const domainTrends = calculateDomainTrends(inspections);
  const streaks = calculateComplianceStreaks(dailyRecords, todayISODate());
  const summary = summarizeInspectionHistory(inspections);
  const chartSeries = buildChartSeries(inspections, provisional);
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
