let client;
let session;
let dailyState;
let dailyCompliance;
let weeklyInspection;
let weeklyDailyRecords = [];

const DAILY_STATE_COLUMNS = "date,energy,soreness,pain,sleep,weight,steps,resting_heart_rate,confidence,comments";
const COMPLIANCE_DOMAINS = ["mission", "strength", "cardio", "recovery", "nutrition"];
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
  const recordByDate = new Map(records
    .filter((record) => record && record.compliance_date >= range.weekStartDate && record.compliance_date <= range.weekEndDate)
    .map((record) => [record.compliance_date, record]));
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
  document.getElementById("status").textContent = message || "";
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
    await loadDailyState();
    await loadCommandFeed();
    await loadDailyCompliance();
    document.getElementById("weekly-date").value = todayISODate();
    await loadWeeklyInspection();
    await loadTrendsAnalytics();
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
  document.getElementById("compliance-form").addEventListener("input", () => renderComplianceScore(readComplianceForm()));
  document.getElementById("inspect-week").addEventListener("click", loadWeeklyInspection);
  document.getElementById("weekly-date").addEventListener("change", loadWeeklyInspection);
  document.getElementById("finalize-week").addEventListener("click", finalizeWeeklyInspection);
  document.getElementById("logout").addEventListener("click", async () => {
    const supabase = await getClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  });

  init();
}

if (typeof module !== "undefined") {
  module.exports = { evaluateReadiness, calculateConfidence, calculateReadiness, generateMission, generateMorningBrief, formatAtlasBriefVoice, normalizeComplianceStatus, scoreComplianceDomain, calculateDisciplineScore, formatDisciplineScore, buildComplianceExplanation, deriveDailyComplianceState, getInspectionWeekRange, calculateWeeklyDisciplineScore, calculateEvidenceCoverage, deriveInspectionStatus, identifyStrongestAndWeakestDomains, selectNextWeekPriority, aggregateWeeklyCompliance, generateWeeklyAfterActionReport, finalizeWeeklyInspectionSnapshot, sortInspectionHistory, selectTrendWindow, calculateLinearTrend, deriveTrajectoryState, calculateDomainTrends, calculateComplianceStreaks, summarizeInspectionHistory, identifyBestAndLowestWeeks, buildChartSeries, generateAtlasTrendReport, WEEKLY_EVIDENCE_THRESHOLD, TREND_WINDOW_SIZE, TREND_SLOPE_THRESHOLD, TREND_EVIDENCE_THRESHOLD, dailyIntelligence, buildCommandEvents, __setSessionForTests: (value) => { session = value; } };
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
      <legend>${COMPLIANCE_DOMAIN_LABELS[key]}</legend>
      <div class="compliance-domain-grid">
        <label>Assigned target
          <input name="${key}_target" maxlength="500" placeholder="What was assigned?">
        </label>
        <label>Completion status
          <select name="${key}_status">
            <option value="">NOT ASSESSED</option>
            <option value="completed">COMPLETE</option>
            <option value="partial">PARTIAL</option>
            <option value="missed">MISSED</option>
            <option value="excused">EXCUSED</option>
            <option value="not_applicable">N/A</option>
          </select>
        </label>
        <label>Actual result
          <input name="${key}_actual" maxlength="500" placeholder="What was completed or modified?">
        </label>
        <label>User note
          <input name="${key}_note" maxlength="500" placeholder="Optional execution context">
        </label>
        <label class="compliance-restriction">Restriction or approved modification
          <input name="${key}_restriction" maxlength="500" placeholder="Readiness, medical, or approved adjustment">
        </label>
        <label class="compliance-check"><input name="${key}_approved_modification" type="checkbox"> Approved modification</label>
      </div>
    </fieldset>`;
}

function initializeComplianceForm() {
  const container = document.getElementById("compliance-domains");
  container.innerHTML = COMPLIANCE_DOMAINS.map(complianceDomainRow).join("");
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

function renderComplianceRecord(record, storageMode = "SUPABASE") {
  const domains = applyMissionComplianceDefaults(complianceDomainsFromRecord(record));
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
  setText("compliance-date", record?.compliance_date || todayISODate());
  renderComplianceScore(domains);
  setText("compliance-storage", storageMode === "LOCAL" ? "LOCAL FALLBACK — Supabase record unavailable" : "SUPABASE RECORD");
  setText("compliance-updated", record?.updated_at ? `Last saved ${new Date(record.updated_at).toLocaleString()}` : "Not saved yet");
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
  } catch (_) {
    dailyCompliance = loadLocalCompliance();
    renderComplianceRecord(dailyCompliance, "LOCAL");
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
    renderComplianceRecord(data, "SUPABASE");
  } catch (_) {
    const localRecord = { ...payload, updated_at: new Date().toISOString() };
    dailyCompliance = localRecord;
    const saved = saveLocalCompliance(localRecord);
    renderComplianceRecord(localRecord, "LOCAL");
    if (!saved) setText("compliance-storage", "UNSAVED — local storage unavailable");
  } finally {
    button.disabled = false;
    button.textContent = "Save Dominion Record";
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
  document.getElementById("weekly-evidence").innerHTML = aggregate.dailyEvidence.map((day) => `<div class="evidence-row weekly-evidence-day ${day.assessedCount ? "neutral" : "missing"}"><strong>${day.date}</strong><span>${day.assessedCount}/5 ASSESSED</span><p>${day.includedCount} applicable scoring observations</p></div>`).join("");
  setText("weekly-report", (aggregate.atlasReport || generateWeeklyAfterActionReport(aggregate)).text);
  const warning = finalized ? `Finalized ${new Date(aggregate.finalizedAt).toLocaleString()}. Historical snapshot is read-only.` : aggregate.evidenceLimitation ? `Finalization requires ${WEEKLY_EVIDENCE_THRESHOLD}% evidence coverage. Current evidence is limited.` : "";
  setText("weekly-warning", warning);
  document.getElementById("finalize-week").disabled = finalized || aggregate.evidenceCoverage < WEEKLY_EVIDENCE_THRESHOLD;
  document.getElementById("finalize-week").textContent = finalized ? "Inspection Finalized" : "Finalize Inspection";
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
  } catch (_) {
    const saved = loadLocalWeeklyInspection(range.weekStartDate);
    if (saved?.finalized_at) {
      renderWeeklyInspection(aggregateFromStoredInspection(saved), "LOCAL");
      return;
    }
    weeklyDailyRecords = loadLocalWeekRecords(range);
    const aggregate = aggregateWeeklyCompliance(weeklyDailyRecords, range.weekStartDate);
    aggregate.atlasReport = generateWeeklyAfterActionReport(aggregate);
    saveLocalWeeklyInspection(weeklyPersistencePayload(aggregate));
    renderWeeklyInspection(aggregate, "LOCAL");
  }
}

async function finalizeWeeklyInspection() {
  if (!weeklyInspection) return;
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
  const width = 640;
  const height = 230;
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
