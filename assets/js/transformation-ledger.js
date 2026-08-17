(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionTransformationLedger = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "028E.1";
  const CLOSED_STANDARDS = new Set(["RESOLVED", "DISMISSED", "EXCUSED"]);
  const CONFIRMED_STANDARDS = new Set(["CONFIRMED", "ACTIVE", "CORRECTIVE ACTION"]);

  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 0) => value === null ? null : Number(value.toFixed(digits));
  const signed = (value, digits = 0, suffix = "") => {
    const numeric = finite(value);
    if (numeric === null) return null;
    const amount = Math.abs(numeric).toFixed(digits).replace(/\.0+$/, "");
    return `${numeric > 0 ? "+" : numeric < 0 ? "-" : ""}${amount}${suffix}`;
  };
  const upper = (value, fallback = "") => String(value || fallback).trim().toUpperCase();
  const plural = (count, singular, multiple = `${singular}s`) => `${count} ${count === 1 ? singular : multiple}`;

  function openStandards(items = []) {
    return (Array.isArray(items) ? items : []).filter((item) => !CLOSED_STANDARDS.has(upper(item?.status, "CANDIDATE")));
  }

  function photoCheckpoints(items = []) {
    return new Set((Array.isArray(items) ? items : []).map((item) => item?.date || item?.performanceDate || item?.performance_date).filter(Boolean)).size;
  }

  function metricBookend(id, label, series = [], unit = "", digits = 1) {
    const points = (Array.isArray(series) ? series : []).filter((item) => finite(item?.value) !== null).sort((left, right) => String(left.date || "").localeCompare(String(right.date || "")));
    const first = points[0] || null;
    const last = points.at(-1) || null;
    const comparable = Boolean(first && last && first.date !== last.date);
    const change = comparable ? finite(last.value) - finite(first.value) : null;
    return {
      id,
      label,
      from: first ? `${round(finite(first.value), digits)}${unit}` : "—",
      to: last ? `${round(finite(last.value), digits)}${unit}` : "—",
      change: change === null ? "Baseline building" : signed(change, digits, unit),
      comparable
    };
  }

  function signal(id, label, value, detail, evidence, tone, ready) {
    return { id, label, value, detail, evidence, tone, ready: Boolean(ready) };
  }

  function strongestChange(model = {}) {
    const waist = model.bodyComposition?.measurements?.summaries?.waist;
    if (waist?.observations >= 2 && finite(waist.change) !== null) {
      return { label: "Waist", headline: `${signed(waist.change, 1, " in")} from baseline`, detail: `${waist.observations} comparable checkpoints.` };
    }
    const weight = model.weight || {};
    if (weight.observations >= 2 && finite(weight.trendChange ?? weight.change) !== null) {
      return { label: "Weight", headline: `${signed(weight.trendChange ?? weight.change, 1, " lb")} across this window`, detail: `${weight.observations} weigh-ins.` };
    }
    const strength = model.training?.strength || {};
    if (strength.workSets > 0 && finite(strength.volumeDelta) !== null) {
      return { label: "Strength", headline: `${signed(strength.volumeDelta, 0, "%")} work volume`, detail: `${strength.workSets} verified work sets.` };
    }
    const running = model.training || {};
    if (running.runSessions > 0 && finite(running.runDelta) !== null) {
      return { label: "Running", headline: `${signed(running.runDelta, 0, "%")} distance`, detail: `${running.runMiles || 0} miles recorded.` };
    }
    const discipline = model.discipline || {};
    if (discipline.observations >= 2 && finite(discipline.delta) !== null) {
      return { label: "Discipline", headline: `${signed(discipline.delta, 0, " pts")} since the prior week`, detail: `${discipline.observations} finalized weeks.` };
    }
    return { label: "Evidence", headline: "The baseline is still forming", detail: "Keep logging before claiming a change." };
  }

  function nextOrder(model = {}, campaign = {}, standards = []) {
    const recovery = model.readiness || {};
    const strength = model.training?.strength || {};
    const open = openStandards(standards);
    const confirmed = open.filter((item) => CONFIRMED_STANDARDS.has(upper(item?.status)));
    if (campaign?.currentOrder?.label && ["CONTRACT_REQUIRED", "PROGRAM_REQUIRED"].includes(upper(campaign.status))) {
      return { headline: campaign.currentOrder.label, detail: campaign.currentOrder.detail || "Complete the campaign prerequisite.", section: campaign.currentOrder.section || "contract" };
    }
    if (recovery.state === "PROTECT" || strength.trajectory === "PROTECT") {
      return { headline: "Protect the next exposure", detail: recovery.state === "PROTECT" ? "Recovery crossed a guardrail." : "Pain or a stopped Strength session is present.", section: "today" };
    }
    if (confirmed.length) return { headline: "Close the standards action", detail: plural(confirmed.length, "confirmed case") + " remains open.", section: "standards" };
    if (model.discipline?.tone === "negative") return { headline: "Repair execution", detail: model.discipline.deltaLabel || "The weekly standard moved down.", section: "inspection" };
    if (model.nutrition?.state === "CONSTRAINT") return { headline: "Close the Fuel gap", detail: model.nutrition.deltaLabel || "Complete the approved Fuel target.", section: "nutrition" };
    if (model.bodyComposition?.decision?.code === "REVIEW_ADJUSTMENT") return { headline: "Review the body outcome", detail: model.bodyComposition.decision.detail, section: "trends", view: "body" };
    if (campaign?.currentOrder?.label) return { headline: campaign.currentOrder.label, detail: campaign.currentOrder.detail || "Execute the current campaign order.", section: campaign.currentOrder.section || "today" };
    return { headline: "Hold the approved plan", detail: "Keep producing comparable evidence.", section: "today" };
  }

  function buildLedger(input = {}) {
    const model = input.trendModel || {};
    const campaign = input.campaign || {};
    const standards = Array.isArray(input.standards) ? input.standards : [];
    const photos = Array.isArray(input.photos) ? input.photos : [];
    const weight = model.weight || {};
    const measurements = model.bodyComposition?.measurements || {};
    const waist = measurements.summaries?.waist || {};
    const strength = model.training?.strength || {};
    const training = model.training || {};
    const readiness = model.readiness || {};
    const discipline = model.discipline || {};
    const nutrition = model.nutrition || {};
    const open = openStandards(standards);
    const confirmed = open.filter((item) => CONFIRMED_STANDARDS.has(upper(item?.status)));
    const photoCount = photoCheckpoints(photos);
    const campaignProgress = finite(campaign.metrics?.campaignElapsed ?? campaign.progress);
    const campaignWeek = finite(campaign.currentWeek);
    const campaignTotal = finite(campaign.totalWeeks) || 12;
    const adherenceReady = discipline.observations >= 2 || nutrition.evidenceDays >= 3;
    const adherenceValue = discipline.value !== null && discipline.value !== undefined ? `${Math.round(discipline.value)}%` : nutrition.value !== null && nutrition.value !== undefined ? `${Math.round(nutrition.value)}%` : "—";
    const adherenceDetail = discipline.observations >= 2 && nutrition.evidenceDays >= 3
      ? `Fuel ${Math.round(nutrition.value)}% · discipline ${Math.round(discipline.value)}%`
      : discipline.observations >= 2 ? discipline.deltaLabel : nutrition.evidenceDays >= 3 ? nutrition.deltaLabel : "Comparable weeks needed";
    const signals = [
      signal("weight", "Weight", weight.value === null || weight.value === undefined ? "—" : `${weight.value} lb`, weight.changeLabel || "Baseline building", plural(weight.observations || 0, "weigh-in"), "neutral", weight.observations >= 2),
      signal("measurements", "Measurements", waist.latest === null || waist.latest === undefined ? "—" : `${waist.latest} in`, waist.change === null || waist.change === undefined ? "Waist baseline building" : `${signed(waist.change, 1, " in")} waist`, plural(measurements.count || 0, "checkpoint"), model.bodyComposition?.decision?.tone || "neutral", waist.observations >= 2),
      signal("photos", "Photos", photoCount ? plural(photoCount, "checkpoint") : "—", photoCount >= 2 ? "Comparison ready" : "Second checkpoint needed", plural(photos.length, "private photo"), "neutral", photoCount >= 2),
      signal("strength", "Strength", training.strengthSessions ? plural(training.strengthSessions, "session") : "—", finite(strength.volumeDelta) === null ? "Workload baseline building" : `${signed(strength.volumeDelta, 0, "%")} work volume`, plural(strength.workSets || 0, "work set"), strength.trajectory === "PROTECT" ? "negative" : strength.trajectory === "BUILDING" ? "positive" : "neutral", strength.workSets > 0),
      signal("running", "Running", training.runMiles ? `${training.runMiles} mi` : "—", finite(training.runDelta) === null ? plural(training.runSessions || 0, "recorded run") : `${signed(training.runDelta, 0, "%")} distance`, plural(training.runSessions || 0, "run day"), training.runSessions ? "positive" : "neutral", training.runSessions > 0),
      signal("adherence", "Adherence", adherenceValue, adherenceDetail, `${discipline.observations || 0} weeks · ${nutrition.evidenceDays || 0} Fuel days`, discipline.tone === "negative" || nutrition.state === "CONSTRAINT" ? "negative" : discipline.tone === "positive" || nutrition.state === "ON TARGET" ? "positive" : "neutral", adherenceReady),
      signal("recovery", "Recovery", readiness.state || "LEARNING", readiness.value === null || readiness.value === undefined ? "Energy baseline building" : `${readiness.value}/10 energy · ${readiness.deltaLabel || "comparison building"}`, plural(readiness.observations || 0, "Roll Call"), readiness.tone || "neutral", readiness.observations >= 3),
      signal("standards", "Standards", confirmed.length ? plural(confirmed.length, "open action") : open.length ? plural(open.length, "review") : "CLEAR", confirmed.length ? "Corrective action remains" : open.length ? "Evidence awaits review" : "No open case", plural(standards.length, "record"), confirmed.length ? "negative" : open.length ? "steady" : "positive", true),
      signal("campaign", "Campaign", campaignProgress === null ? "—" : `${campaignProgress}%`, campaignWeek === null ? "Not commissioned" : `Week ${campaignWeek} of ${campaignTotal} · ${campaign.forecast?.label || campaign.status || "building"}`, campaign.evidence?.rate === undefined ? "Campaign evidence building" : `${campaign.evidence.rate}% trusted proof`, campaign.forecast?.tone === "red" ? "negative" : campaign.forecast?.tone === "green" ? "positive" : "steady", Boolean(campaign.id))
    ];
    const sourceCount = signals.filter((item) => item.ready).length;
    const confidenceScore = Math.round(sourceCount / signals.length * 100);
    const confidence = {
      score: confidenceScore,
      label: confidenceScore >= 80 ? "STRONG" : confidenceScore >= 60 ? "USABLE" : confidenceScore >= 40 ? "LIMITED" : "BUILDING",
      sourceCount,
      possibleSources: signals.length
    };
    const status = readiness.state === "PROTECT" || strength.trajectory === "PROTECT"
      ? { label: "PROTECT", tone: "negative" }
      : confirmed.length
        ? { label: "CORRECT", tone: "warning" }
        : campaign.forecast?.code === "AT_RISK"
          ? { label: "AT RISK", tone: "negative" }
          : confidenceScore < 50
            ? { label: "BUILDING", tone: "neutral" }
            : campaign.forecast?.code === "ON_TRACK"
              ? { label: "ON TRACK", tone: "positive" }
              : { label: "HOLDING", tone: "steady" };
    const weightBookend = metricBookend("weight", "Weight", weight.series, " lb", 1);
    const waistBookend = metricBookend("waist", "Waist", waist.series, " in", 1);
    const campaignBookend = {
      id: "campaign",
      label: "Campaign",
      from: campaign.id ? "0%" : "—",
      to: campaignProgress === null ? "—" : `${Math.round(campaignProgress)}%`,
      change: campaignWeek === null ? "Not commissioned" : `Week ${campaignWeek} of ${campaignTotal}`,
      comparable: campaignProgress !== null
    };
    return {
      version: VERSION,
      rangeLabel: model.rangeLabel || "Current window",
      status,
      confidence,
      campaign: {
        progress: campaignProgress === null ? 0 : Math.max(0, Math.min(100, Math.round(campaignProgress))),
        week: campaignWeek,
        totalWeeks: campaignTotal,
        phase: campaign.phase?.label || "Campaign not commissioned",
        forecast: campaign.forecast?.label || "BUILDING"
      },
      bookends: [weightBookend, waistBookend, campaignBookend],
      signals,
      changed: strongestChange(model),
      next: nextOrder(model, campaign, standards)
    };
  }

  return { VERSION, openStandards, photoCheckpoints, metricBookend, strongestChange, nextOrder, buildLedger };
});
