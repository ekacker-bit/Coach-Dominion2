(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCampaign = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026K.1";
  const STABILIZATION_VERSION = "029G.1";
  const CAMPAIGN_WEEKS = 12;
  const CAMPAIGN_DAYS = CAMPAIGN_WEEKS * 7;
  const EXECUTION_STANDARD = 85;
  const EVIDENCE_STANDARD = 80;
  const QUALIFYING_WEEK_TARGET = 9;
  const CLOSED_STANDARD_STATES = new Set(["RESOLVED", "DISMISSED", "EXCUSED", "CLOSED"]);
  const PROGRAM_DOMAINS = new Set(["strength", "running", "core", "nutrition"]);
  const PHASES = Object.freeze([
    { code: "FOUNDATION", label: "Foundation", startWeek: 1, endWeek: 3, order: "Establish the cadence. Complete the work and preserve every proof." },
    { code: "BUILD", label: "Build", startWeek: 4, endWeek: 6, order: "Progress the approved plan without trading away recovery or form." },
    { code: "PRESSURE", label: "Pressure", startWeek: 7, endWeek: 9, order: "Hold the standard while accumulated demand tests consistency." },
    { code: "PROVE", label: "Prove", startWeek: 10, endWeek: 12, order: "Convert twelve weeks of execution into a measurable outcome." }
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    return String(value === undefined || value === null ? fallback : value).trim();
  }

  function upper(value, fallback = "") {
    return text(value, fallback).toUpperCase().replace(/[\s-]+/g, "_");
  }

  function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function isoDate(value) {
    const direct = text(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
  }

  function addDays(value, days = 0) {
    const date = new Date(`${isoDate(value)}T12:00:00Z`);
    if (!Number.isFinite(date.getTime())) return null;
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function weekStart(value) {
    const date = new Date(`${isoDate(value)}T12:00:00Z`);
    if (!Number.isFinite(date.getTime())) return null;
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  }

  function dayDifference(left, right) {
    const start = Date.parse(`${isoDate(left)}T12:00:00Z`);
    const end = Date.parse(`${isoDate(right)}T12:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.floor((end - start) / 86400000);
  }

  function average(values = []) {
    const finite = values.map(Number).filter(Number.isFinite);
    return finite.length ? Math.round(finite.reduce((sum, value) => sum + value, 0) / finite.length) : null;
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function fingerprint(value) {
    const source = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `campaign-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function normalizeDomain(value) {
    const code = upper(value);
    if (["CARDIO", "RUN", "RUNNING"].includes(code)) return "running";
    if (["ABS", "ABS_CORE", "CORE"].includes(code)) return "core";
    if (["FUEL", "MEAL", "NUTRITION"].includes(code)) return "nutrition";
    if (["LIFT", "STRENGTH", "WORKOUT"].includes(code)) return "strength";
    return code.toLowerCase();
  }

  function contractIdentity(contract = {}) {
    return contract.id || contract.recruitContractId || contract.contractId || null;
  }

  function contractRevision(contract = {}) {
    return Number(contract.revision || contract.recruitContractRevision || contract.contractRevision || 0);
  }

  function programMatchesContract(receipt = {}, contract = {}) {
    if (!receipt || upper(receipt.status) !== "ACTIVE") return false;
    return (receipt.contractId || receipt.recruitContractId) === contractIdentity(contract)
      && Number(receipt.contractRevision || receipt.recruitContractRevision || 0) === contractRevision(contract);
  }

  function objective(contract = {}) {
    const target = text(contract.target || contract.goalStatement || contract.outcome, "Earn the standard");
    const goal = upper(contract.primaryGoal || contract.goal || "DOMINION").replaceAll("_", " ");
    return { target, goal, targetDate: isoDate(contract.targetDate || contract.target_date) };
  }

  function phaseForWeek(week = 1) {
    return clone(PHASES.find((item) => week >= item.startWeek && week <= item.endWeek) || PHASES.at(-1));
  }

  function campaignDates(contract = {}, receipt = {}, weeks = [], today) {
    const matchingWeek = weeks
      .filter((item) => item?.weekStart && item.status !== "REPLACED")
      .sort((left, right) => String(left.weekStart).localeCompare(String(right.weekStart)))[0];
    const anchor = receipt.weekStart || matchingWeek?.weekStart || contract.effectiveDate || today;
    const startDate = weekStart(anchor || today);
    return { startDate, endDate: addDays(startDate, CAMPAIGN_DAYS - 1) };
  }

  function campaignRequirements(weeks = [], startDate, endDate, today) {
    const requirements = [];
    weeks.filter((week) => week?.status !== "REPLACED").forEach((week) => {
      (week.days || []).forEach((day) => {
        const date = isoDate(day.date);
        if (!date || date < startDate || date > endDate || date > today) return;
        (day.activities || []).forEach((activity, index) => {
          const domain = normalizeDomain(activity.module || activity.domain || activity.type);
          if (!PROGRAM_DOMAINS.has(domain) || upper(activity.type) === "REST") return;
          requirements.push({
            id: text(activity.id || activity.activityId || `${date}:${domain}:${index}`),
            date,
            domain,
            label: text(activity.title || activity.name || activity.sessionName, domain),
            secured: false,
            evidenceStatus: "MISSING"
          });
        });
      });
    });
    return requirements.sort((left, right) => left.date.localeCompare(right.date) || left.domain.localeCompare(right.domain) || left.id.localeCompare(right.id));
  }

  function reconcileRequirements(requirements = [], receipts = []) {
    const available = receipts
      .filter((item) => item && item.date && PROGRAM_DOMAINS.has(normalizeDomain(item.domain)))
      .sort((left, right) => String(left.occurredAt || left.capturedAt || "").localeCompare(String(right.occurredAt || right.capturedAt || "")));
    const used = new Set();
    return requirements.map((requirement) => {
      const exact = available.findIndex((receipt, index) => !used.has(index)
        && receipt.date === requirement.date
        && normalizeDomain(receipt.domain) === requirement.domain
        && upper(receipt.status) !== "INCOMPLETE"
        && (receipt.sourceId === requirement.id || receipt.actionKey?.includes(requirement.id)));
      const fallback = exact >= 0 ? exact : available.findIndex((receipt, index) => !used.has(index)
        && receipt.date === requirement.date
        && normalizeDomain(receipt.domain) === requirement.domain
        && upper(receipt.status) !== "INCOMPLETE");
      if (fallback < 0) return requirement;
      used.add(fallback);
      return { ...requirement, secured: true, evidenceStatus: upper(available[fallback].status), receiptId: available[fallback].id || null };
    });
  }

  function canonicalInspections(inspections = [], startDate, endDate) {
    const byWeek = new Map();
    inspections.forEach((inspection) => {
      const start = isoDate(inspection?.weekStartDate || inspection?.week_start_date);
      const finalizedAt = inspection?.finalizedAt || inspection?.finalized_at;
      if (!start || !finalizedAt || start < startDate || start > endDate) return;
      const current = byWeek.get(start);
      if (!current || String(finalizedAt) > String(current.finalizedAt || current.finalized_at || "")) byWeek.set(start, inspection);
    });
    return [...byWeek.values()].sort((left, right) => String(left.weekStartDate || left.week_start_date).localeCompare(String(right.weekStartDate || right.week_start_date)));
  }

  function unresolvedStandards(standards = []) {
    return standards.filter((item) => !CLOSED_STANDARD_STATES.has(upper(item?.status || "CANDIDATE")));
  }

  function outcomeEvidence(outcome = {}) {
    const checkIns = outcome.measurements?.checkIns || outcome.checkIns || [];
    const latest = outcome.cadence?.latestDate || checkIns.at(-1)?.date || null;
    const baseline = checkIns[0]?.date || outcome.baselineDate || null;
    const confidence = Number(outcome.confidence || 0);
    return {
      baselineDate: isoDate(baseline),
      latestDate: isoDate(latest),
      checkpoints: checkIns.length,
      confidence: clamp(confidence),
      complete: checkIns.length >= 2 || Boolean(baseline && latest && baseline !== latest)
    };
  }

  function condition(id, label, actual, target, passed, detail) {
    const measurable = Number.isFinite(Number(actual));
    const progress = passed ? 100 : measurable && Number(target) > 0 ? clamp(Number(actual) / Number(target) * 100) : 0;
    return { id, label, actual, target, passed: Boolean(passed), progress: Math.round(progress), detail };
  }

  function currentOrder(input = {}, context = {}) {
    if (!input.contract) return { code: "CONTRACT", label: "Set the Contract", detail: "A campaign needs one declared outcome and a signed commitment.", section: "contract" };
    if (!context.programActive) return { code: "PROGRAM", label: "Commission the campaign", detail: "Verify the baseline, complete program, and opening Calendar under one launch order.", section: "contract" };
    const todayMissing = context.requirements.filter((item) => item.date === context.today && !item.secured);
    if (todayMissing.length) {
      const domains = [...new Set(todayMissing.map((item) => item.domain.toUpperCase()))].join(" + ");
      return { code: "EXECUTE", label: `Secure ${domains}`, detail: "Complete the assigned work. Evidence Autopilot will preserve the proof.", section: "today" };
    }
    if (input.currentInspection?.canFinalize && !(input.currentInspection.finalizedAt || input.currentInspection.finalized_at)) {
      return { code: "FINALIZE_WEEK", label: "Finalize the earned week", detail: "Lock the weekly judgment so the campaign record can advance.", section: "inspection" };
    }
    if (input.outcome?.cadence?.status === "DUE") return { code: "OUTCOME", label: "Capture the outcome checkpoint", detail: "Record comparable body evidence. It does not change the discipline score.", section: "trends" };
    if (!context.currentWeekScheduled) return { code: "CALENDAR", label: "Commit the current week", detail: "The campaign cannot execute a week that is not on the approved Calendar.", section: "calendar" };
    return { code: "HOLD_STANDARD", label: "Hold the standard", detail: context.phase.order, section: "today" };
  }

  function forecast(context = {}) {
    if (!context.programActive) return { code: "NOT_STARTED", label: "NOT STARTED", tone: "neutral", detail: "Activate the complete program to begin the campaign clock." };
    if (context.today < context.startDate) return { code: "STAGED", label: "STAGED", tone: "neutral", detail: `The campaign begins ${context.startDate}.` };
    if (context.today > context.endDate) {
      const won = context.executionRate >= EXECUTION_STANDARD
        && context.evidenceRate >= EVIDENCE_STANDARD
        && context.qualifyingWeeks >= QUALIFYING_WEEK_TARGET
        && context.openStandards === 0
        && context.outcomeComplete;
      return won
        ? { code: "WON", label: "CAMPAIGN WON", tone: "green", detail: "The outcome was supported by sustained execution, trusted proof, and a clear standards record." }
        : { code: "CLOSED_SHORT", label: "STANDARD NOT EARNED", tone: "red", detail: "The campaign closed without satisfying every declared win condition." };
    }
    if (!context.requirements.length || context.elapsedDays < 7) return { code: "LEARNING", label: "ESTABLISHING", tone: "neutral", detail: "Atlas is establishing the campaign baseline before forecasting the finish." };
    if (context.executionRate >= EXECUTION_STANDARD && context.evidenceRate >= EVIDENCE_STANDARD && (context.disciplineAverage === null || context.disciplineAverage >= 80) && context.openStandards === 0) {
      return { code: "ON_TRACK", label: "ON TRACK", tone: "green", detail: "Current execution supports the declared campaign outcome." };
    }
    if (context.executionRate >= 70 && context.evidenceRate >= 70 && (context.disciplineAverage === null || context.disciplineAverage >= 70)) {
      return { code: "WATCH", label: "WATCH", tone: "yellow", detail: "The campaign remains recoverable, but one weak week could move the finish off standard." };
    }
    return { code: "AT_RISK", label: "AT RISK", tone: "red", detail: "Execution or proof is below the pace required to earn the campaign." };
  }

  function buildCampaign(input = {}) {
    const today = isoDate(input.today || new Date().toISOString());
    const contract = input.contract || null;
    if (!contract) {
      return {
        version: VERSION,
        id: null,
        status: "CONTRACT_REQUIRED",
        forecast: forecast({ programActive: false }),
        objective: objective({}),
        currentOrder: currentOrder(input, {}),
        conditions: [],
        phases: clone(PHASES)
      };
    }
    const weeks = Array.isArray(input.weeks) ? input.weeks : [];
    const dates = campaignDates(contract, input.programReceipt || {}, weeks, today);
    const programActive = programMatchesContract(input.programReceipt, contract);
    const elapsedDays = clamp(dayDifference(dates.startDate, today) + 1, 0, CAMPAIGN_DAYS);
    const currentWeek = clamp(Math.floor(Math.max(0, elapsedDays - 1) / 7) + 1, 1, CAMPAIGN_WEEKS);
    const phase = phaseForWeek(currentWeek);
    const requirements = reconcileRequirements(
      campaignRequirements(weeks, dates.startDate, dates.endDate, today),
      Array.isArray(input.receipts) ? input.receipts : []
    );
    const secured = requirements.filter((item) => item.secured);
    const trusted = secured.filter((item) => ["VERIFIED", "SELF_REPORTED"].includes(item.evidenceStatus));
    const executionRate = requirements.length ? Math.round(secured.length / requirements.length * 100) : 0;
    const evidenceRate = requirements.length ? Math.round(trusted.length / requirements.length * 100) : 0;
    const inspections = canonicalInspections(input.inspections || [], dates.startDate, dates.endDate);
    const qualifyingWeeks = inspections.filter((item) => Number(item.score ?? item.weekly_discipline_score) >= 80 && Number(item.evidenceCoverage ?? item.evidence_coverage) >= EVIDENCE_STANDARD).length;
    const disciplineAverage = average(inspections.map((item) => item.score ?? item.weekly_discipline_score));
    const evidenceAverage = average(inspections.map((item) => item.evidenceCoverage ?? item.evidence_coverage));
    const openStandards = unresolvedStandards(input.standards || []);
    const outcome = outcomeEvidence(input.outcome || {});
    const currentWeekScheduled = weeks.some((week) => week?.status !== "REPLACED" && week.weekStart <= today && week.weekEnd >= today);
    const context = {
      today,
      ...dates,
      programActive,
      elapsedDays,
      currentWeek,
      phase,
      requirements,
      executionRate,
      evidenceRate,
      disciplineAverage,
      evidenceAverage,
      qualifyingWeeks,
      openStandards: openStandards.length,
      outcomeComplete: outcome.complete,
      currentWeekScheduled
    };
    const campaignForecast = forecast(context);
    const campaignObjective = objective(contract);
    const id = `dominion:${contractIdentity(contract)}:r${contractRevision(contract)}:${dates.startDate}`;
    const conditions = [
      condition("EXECUTION", "Assessed execution", disciplineAverage ?? 0, EXECUTION_STANDARD, inspections.length > 0 && Number(disciplineAverage) >= EXECUTION_STANDARD, inspections.length ? `${inspections.length} finalized week${inspections.length === 1 ? "" : "s"} assessed` : "No finalized weekly judgment yet"),
      condition("EVIDENCE", "Trusted proof", evidenceRate, EVIDENCE_STANDARD, evidenceRate >= EVIDENCE_STANDARD, `${trusted.length} scheduled actions carry usable proof`),
      condition("WEEKS", "Earned weeks", qualifyingWeeks, QUALIFYING_WEEK_TARGET, qualifyingWeeks >= QUALIFYING_WEEK_TARGET, `${qualifyingWeeks} finalized qualifying week${qualifyingWeeks === 1 ? "" : "s"}`),
      condition("OUTCOME", "Outcome evidence", outcome.complete ? 1 : 0, 1, outcome.complete, outcome.complete ? `${outcome.checkpoints} comparable checkpoints` : "Baseline and follow-up required"),
      condition("STANDARDS", "Standards record", openStandards.length, 0, openStandards.length === 0, openStandards.length ? `${openStandards.length} open standards case${openStandards.length === 1 ? "" : "s"}` : "Clear")
    ];
    const progress = Math.round((elapsedDays / CAMPAIGN_DAYS * 35)
      + (executionRate / 100 * 30)
      + (evidenceRate / 100 * 15)
      + (Math.min(qualifyingWeeks, QUALIFYING_WEEK_TARGET) / QUALIFYING_WEEK_TARGET * 10)
      + (outcome.complete ? 10 : 0));
    const metrics = {
      campaignElapsed: Math.round(elapsedDays / CAMPAIGN_DAYS * 100),
      evidenceCoverage: evidenceRate,
      assessedExecutionScore: inspections.length ? disciplineAverage : null,
      promotionRequirement: Math.round(Math.min(qualifyingWeeks, QUALIFYING_WEEK_TARGET) / QUALIFYING_WEEK_TARGET * 100),
      setupCompleteness: programActive ? 100 : 50,
      assessedWeeks: inspections.length,
      qualifyingWeeks,
      qualifyingWeekTarget: QUALIFYING_WEEK_TARGET
    };
    const previous = input.previous?.id === id ? input.previous : null;
    const updatedAt = input.updatedAt || new Date().toISOString();
    const result = {
      version: VERSION,
      stabilizationVersion: STABILIZATION_VERSION,
      id,
      contractId: contractIdentity(contract),
      contractRevision: contractRevision(contract),
      status: programActive ? campaignForecast.code === "WON" ? "WON" : campaignForecast.code === "CLOSED_SHORT" ? "CLOSED" : today < dates.startDate ? "STAGED" : "ACTIVE" : "PROGRAM_REQUIRED",
      objective: campaignObjective,
      startDate: dates.startDate,
      endDate: dates.endDate,
      currentWeek,
      totalWeeks: CAMPAIGN_WEEKS,
      elapsedDays,
      daysRemaining: Math.max(0, dayDifference(today, dates.endDate)),
      phase,
      phases: clone(PHASES),
      forecast: campaignForecast,
      progress: clamp(progress),
      metrics,
      execution: { scheduled: requirements.length, secured: secured.length, missing: requirements.filter((item) => !item.secured).length, rate: executionRate },
      evidence: { trusted: trusted.length, rate: evidenceRate, verified: secured.filter((item) => item.evidenceStatus === "VERIFIED").length, selfReported: secured.filter((item) => item.evidenceStatus === "SELF_REPORTED").length },
      weekly: { finalized: inspections.length, qualifying: qualifyingWeeks, disciplineAverage, evidenceAverage },
      outcome,
      standards: { open: openStandards.length },
      conditions,
      requirements,
      currentOrder: currentOrder(input, context),
      startedAt: previous?.startedAt || input.programReceipt?.activatedAt || input.programReceipt?.approvedAt || updatedAt,
      updatedAt
    };
    result.fingerprint = fingerprint({
      id: result.id,
      status: result.status,
      currentWeek: result.currentWeek,
      phase: result.phase.code,
      forecast: result.forecast.code,
      progress: result.progress,
      metrics: result.metrics,
      execution: result.execution,
      evidence: result.evidence,
      weekly: result.weekly,
      outcome: result.outcome,
      standards: result.standards,
      order: result.currentOrder.code
    });
    return result;
  }

  function historyEntry(campaign = {}) {
    if (!campaign?.id) return null;
    const transition = `${campaign.currentWeek || 0}:${campaign.phase?.code || "NONE"}:${campaign.forecast?.code || campaign.status}`;
    return {
      version: VERSION,
      id: fingerprint(`${campaign.id}:${transition}`),
      campaignId: campaign.id,
      contractId: campaign.contractId,
      contractRevision: campaign.contractRevision,
      date: isoDate(campaign.updatedAt),
      transition,
      week: campaign.currentWeek,
      phase: campaign.phase?.code || null,
      forecast: campaign.forecast?.code || null,
      progress: campaign.progress,
      executionRate: campaign.execution?.rate || 0,
      evidenceRate: campaign.evidence?.rate || 0,
      qualifyingWeeks: campaign.weekly?.qualifying || 0,
      currentOrder: clone(campaign.currentOrder),
      capturedAt: campaign.updatedAt
    };
  }

  function upsertHistory(history = [], campaign = {}, limit = 96) {
    const entry = historyEntry(campaign);
    if (!entry) return Array.isArray(history) ? clone(history) : [];
    return [entry, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== entry.id)]
      .sort((left, right) => String(right.capturedAt || "").localeCompare(String(left.capturedAt || "")))
      .slice(0, limit);
  }

  return {
    VERSION,
    STABILIZATION_VERSION,
    CAMPAIGN_WEEKS,
    PHASES,
    EXECUTION_STANDARD,
    EVIDENCE_STANDARD,
    QUALIFYING_WEEK_TARGET,
    addDays,
    weekStart,
    normalizeDomain,
    programMatchesContract,
    phaseForWeek,
    buildCampaign,
    historyEntry,
    upsertHistory
  };
});
