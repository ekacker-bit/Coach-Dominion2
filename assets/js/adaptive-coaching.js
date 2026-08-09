(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAdaptiveCoaching = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "018I.1";
  const DOMAIN_ORDER = ["STRENGTH", "RUNNING", "CORE", "FUELING", "RECOVERY"];
  const ACTIONABLE_CODES = new Set(["PROTECT", "DELOAD", "REBALANCE", "PROGRESS"]);

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
  }

  function addDays(date, days = 1) {
    const value = new Date(`${dateIso(date)}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function average(values = []) {
    const usable = values.map(Number).filter(Number.isFinite);
    if (!usable.length) return null;
    return Math.round((usable.reduce((sum, value) => sum + value, 0) / usable.length) * 10) / 10;
  }

  function inferredReadiness(item = {}) {
    const supplied = String(item.state || "").toUpperCase();
    if (["GREEN", "YELLOW", "RED"].includes(supplied)) return supplied;
    if (item.pain === true || Number(item.energy) <= 3 || Number(item.soreness) >= 9) return "RED";
    if (Number(item.energy) <= 5 || Number(item.soreness) >= 7) return "YELLOW";
    return "GREEN";
  }

  function normalizeReadiness(history = [], today = new Date().toISOString().slice(0, 10)) {
    const date = dateIso(today);
    const days = (Array.isArray(history) ? history : [])
      .filter((item) => dateIso(item?.date) && item.date <= date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(-7)
      .map((item) => ({ ...item, state: inferredReadiness(item) }));
    const recent = days.slice(-3);
    const prior = days.slice(-6, -3);
    const recentRhr = average(recent.map((item) => item.resting_heart_rate));
    const priorRhr = average(prior.map((item) => item.resting_heart_rate));
    const recentHrv = average(recent.map((item) => item.heart_rate_variability));
    const priorHrv = average(prior.map((item) => item.heart_rate_variability));
    const rhrDelta = recentRhr !== null && priorRhr !== null ? Math.round((recentRhr - priorRhr) * 10) / 10 : null;
    const hrvDeltaPercent = recentHrv !== null && priorHrv
      ? Math.round(((recentHrv - priorHrv) / priorHrv) * 100)
      : null;
    return {
      days: days.length,
      averageEnergy: average(days.map((item) => item.energy)),
      averageSoreness: average(days.map((item) => item.soreness)),
      greenDays: days.filter((item) => item.state === "GREEN").length,
      yellowDays: days.filter((item) => item.state === "YELLOW").length,
      redDays: days.filter((item) => item.state === "RED").length,
      painDays: days.filter((item) => item.pain === true).length,
      rhrDelta,
      hrvDeltaPercent,
      strainFlag: (rhrDelta !== null && rhrDelta >= 5) || (hrvDeltaPercent !== null && hrvDeltaPercent <= -12)
    };
  }

  function normalizeEvidence(evidence = {}) {
    const domains = {};
    DOMAIN_ORDER.slice(0, 4).forEach((domain) => {
      const source = evidence[domain] || evidence[domain.toLowerCase()] || {};
      const planned = Math.max(0, Number(source.planned || 0));
      const completed = planned
        ? Math.max(0, Math.min(planned, Number(source.completed || 0)))
        : 0;
      domains[domain] = {
        planned,
        completed,
        sourceCount: Math.max(0, Number(source.sourceCount ?? source.completed ?? 0)),
        percent: planned ? Math.round((completed / planned) * 100) : null
      };
    });
    const planned = Object.values(domains).reduce((sum, item) => sum + item.planned, 0);
    const completed = Object.values(domains).reduce((sum, item) => sum + item.completed, 0);
    const sourceCount = Object.values(domains).reduce((sum, item) => sum + item.sourceCount, 0);
    return {
      domains,
      planned,
      completed,
      sourceCount,
      adherencePercent: planned ? Math.round((completed / planned) * 100) : null
    };
  }

  function confidenceFor(readiness, evidence) {
    const coverage = readiness.days + Math.min(7, evidence.sourceCount);
    if (readiness.days >= 4 && evidence.sourceCount >= 4 && coverage >= 9) return "HIGH";
    if (readiness.days >= 2 && evidence.sourceCount >= 2) return "MODERATE";
    return "LOW";
  }

  function proposalDefinition(code) {
    return ({
      SETUP_REQUIRED: ["Finish the operating plan", "Approve the Recruit Contract and core module plans before Atlas adapts training demand.", "SETUP REQUIRED"],
      OBSERVATION_REQUIRED: ["Establish a readiness baseline", "Complete Roll Call before Atlas changes the next exposure.", "MONITORING"],
      COLLECT_EVIDENCE: ["Hold while evidence builds", "The signal is too thin for a responsible plan change. Keep logging readiness and completed work.", "MONITORING"],
      PROTECT: ["Protect the next exposure", "Pain or repeated RED readiness blocks progression and carries recovery protection forward.", "PROPOSED"],
      DELOAD: ["Run a bounded deload", "Accumulated fatigue signals support a short reduction in load, volume, and intensity.", "PROPOSED"],
      REBALANCE: ["Rebalance the weekly demand", "Execution is below the committed dose. Reduce friction before increasing demand.", "PROPOSED"],
      PROGRESS: ["Stage a conservative progression", "Readiness and verified execution support a small next-cycle increase.", "PROPOSED"],
      HOLD: ["Repeat the current prescription", "The current dose is executable, but the evidence does not justify a change yet.", "CURRENT"]
    })[code] || ["Repeat the current prescription", "Keep executing the approved plan.", "CURRENT"];
  }

  function makeChange(domain, action, label, detail, volumeDeltaPercent = 0, loadDeltaPercent = 0, requiresPlanApproval = true) {
    return { domain, action, label, detail, volumeDeltaPercent, loadDeltaPercent, requiresPlanApproval };
  }

  function changesFor(code) {
    const definitions = {
      PROTECT: [
        makeChange("STRENGTH", "RECOVERY_ONLY", "Remove loaded strength", "Use recovery work only until pain-free readiness returns.", -100, 0, false),
        makeChange("RUNNING", "RECOVERY_ONLY", "Remove running intensity", "No hard or long running during the protection window.", -100, 0, false),
        makeChange("CORE", "RECOVERY_ONLY", "Use pain-free recovery work", "Remove loaded or provocative core work.", -100, 0, false),
        makeChange("FUELING", "HOLD_TARGETS", "Protect the fueling baseline", "Do not create a calorie deficit from a recovery signal."),
        makeChange("RECOVERY", "PRIORITIZE", "Prioritize recovery", "Reassess readiness tomorrow before restoring demand.", 0, 0, false)
      ],
      DELOAD: [
        makeChange("STRENGTH", "REDUCE_VOLUME", "Reduce strength demand", "Cut work sets by about 25% and load by no more than 10%.", -25, -10, false),
        makeChange("RUNNING", "REDUCE_VOLUME", "Keep running easy", "Reduce distance by about 20% and remove hard intensity.", -20, 0, false),
        makeChange("CORE", "REDUCE_VOLUME", "Trim core volume", "Remove one set where possible and keep technique controlled.", -25, 0, false),
        makeChange("FUELING", "HOLD_TARGETS", "Hold the fueling baseline", "Recovery signals do not authorize a calorie reduction."),
        makeChange("RECOVERY", "ADD_WINDOW", "Add recovery margin", "Protect sleep and the next low-demand window.", 0, 0, false)
      ],
      REBALANCE: [
        makeChange("STRENGTH", "HOLD_LOAD", "Hold strength progression", "Keep load stable and simplify the next session before adding work."),
        makeChange("RUNNING", "EASY_ONLY", "Limit hard running", "Keep the next run easy until the committed week becomes executable."),
        makeChange("CORE", "HOLD_VOLUME", "Hold core volume", "Preserve the current dose and remove optional finishers."),
        makeChange("FUELING", "LOG_FIRST", "Close the fuel evidence gap", "Log the day before changing calorie or macro targets."),
        makeChange("RECOVERY", "PROTECT_DAY", "Preserve the recovery day", "Do not use recovery days to repay missed volume.", 0, 0, false)
      ],
      PROGRESS: [
        makeChange("STRENGTH", "STAGE_PROGRESS", "Stage a small load increase", "Offer the smallest available load step, capped at 2.5%.", 3, 3),
        makeChange("RUNNING", "STAGE_PROGRESS", "Stage a small volume increase", "Offer up to 5% more weekly distance with intensity unchanged.", 5),
        makeChange("CORE", "STAGE_PROGRESS", "Stage one bounded progression", "Add one set or a small duration increase, never both.", 5),
        makeChange("FUELING", "TRAINING_SUPPORT", "Support added work", "Offer 20–25 g additional carbohydrate around the progressed session."),
        makeChange("RECOVERY", "HOLD_WINDOW", "Keep recovery unchanged", "Progression cannot consume the protected recovery day.")
      ]
    };
    return definitions[code] || DOMAIN_ORDER.map((domain) =>
      makeChange(domain, code === "COLLECT_EVIDENCE" ? "OBSERVE" : "HOLD", code === "COLLECT_EVIDENCE" ? `Observe ${domain.toLowerCase()}` : `Hold ${domain.toLowerCase()}`, code === "COLLECT_EVIDENCE" ? "No change until current evidence is complete." : "Continue the approved prescription and collect another exposure.")
    );
  }

  function deriveCode(input, readiness, evidence, confidence) {
    if (!input.contractApproved || Number(input.planCoverage || 0) < 3) return "SETUP_REQUIRED";
    if (!readiness.days) return "OBSERVATION_REQUIRED";
    if (readiness.painDays > 0 || readiness.redDays >= 2) return "PROTECT";
    if (readiness.strainFlag || Number(readiness.averageEnergy || 10) <= 4.5 || Number(readiness.averageSoreness || 0) >= 7) return "DELOAD";
    if (evidence.planned >= 3 && evidence.adherencePercent !== null && evidence.adherencePercent < 60) return "REBALANCE";
    if (confidence === "HIGH"
      && Number(evidence.adherencePercent || 0) >= 85
      && Number(readiness.averageEnergy || 0) >= 7
      && Number(readiness.averageSoreness || 10) <= 4
      && readiness.redDays === 0) return "PROGRESS";
    if (confidence === "LOW") return "COLLECT_EVIDENCE";
    return "HOLD";
  }

  function buildProposal(input = {}) {
    const date = dateIso(input.date) || new Date().toISOString().slice(0, 10);
    const readiness = normalizeReadiness(input.readinessHistory, date);
    const evidence = normalizeEvidence(input.evidence);
    const confidence = confidenceFor(readiness, evidence);
    const code = deriveCode(input, readiness, evidence, confidence);
    const [label, reason, status] = proposalDefinition(code);
    const fingerprint = stableHash({
      date,
      contractId: input.contractId || null,
      contractRevision: input.contractRevision || null,
      planCoverage: Number(input.planCoverage || 0),
      readiness,
      evidence,
      code
    });
    const prior = input.priorProposal || null;
    if (prior?.status === "APPROVED" && directiveForDate(prior, date)) return JSON.parse(JSON.stringify(prior));
    if (prior?.fingerprint === fingerprint && ["APPROVED", "HELD"].includes(prior.status)) return JSON.parse(JSON.stringify(prior));
    if (prior?.fingerprint === fingerprint && prior?.status === "PROPOSED" && prior?.atlasIntervention?.response) {
      return JSON.parse(JSON.stringify(prior));
    }
    return {
      version: VERSION,
      id: `adaptive-${date}-${fingerprint}`,
      date,
      effectiveDate: addDays(date, 1),
      reviewDate: addDays(date, code === "PROTECT" ? 1 : 7),
      generatedAt: input.generatedAt || new Date().toISOString(),
      approvedAt: null,
      heldAt: null,
      status,
      code,
      label,
      reason,
      confidence,
      fingerprint,
      contractId: input.contractId || null,
      contractRevision: input.contractRevision || null,
      planCoverage: Number(input.planCoverage || 0),
      signals: { readiness, evidence },
      changes: ["SETUP_REQUIRED", "OBSERVATION_REQUIRED"].includes(code) ? [] : changesFor(code),
      bounds: {
        automaticPlanMutation: false,
        approvalRequired: ACTIONABLE_CODES.has(code),
        painBlocksProgression: true,
        maximumLoadIncreasePercent: code === "PROGRESS" ? 3 : 0,
        maximumVolumeIncreasePercent: code === "PROGRESS" ? 5 : 0
      }
    };
  }

  function approveProposal(proposal = {}, approvedAt = new Date().toISOString(), effectiveDate = null) {
    if (proposal.status !== "PROPOSED" || !ACTIONABLE_CODES.has(proposal.code)) return null;
    const start = dateIso(effectiveDate) || proposal.effectiveDate;
    return JSON.parse(JSON.stringify({
      ...proposal,
      status: "APPROVED",
      approvedAt,
      effectiveDate: start,
      reviewDate: proposal.code === "PROTECT" ? start : proposal.reviewDate
    }));
  }

  function holdProposal(proposal = {}, heldAt = new Date().toISOString()) {
    if (!proposal.id || !["PROPOSED", "APPROVED"].includes(proposal.status)) return null;
    return JSON.parse(JSON.stringify({ ...proposal, status: "HELD", heldAt, approvedAt: null }));
  }

  function directiveForDate(proposal = null, date = new Date().toISOString().slice(0, 10)) {
    if (!proposal || proposal.status !== "APPROVED") return null;
    const target = dateIso(date);
    if (!target || target < dateIso(proposal.effectiveDate)) return null;
    if (dateIso(proposal.reviewDate) && target > proposal.reviewDate) return null;
    return proposal;
  }

  function domainChange(directive, domain) {
    return (directive?.changes || []).find((item) => item.domain === domain) || null;
  }

  function adaptStrengthAssignment(assignment = null, directive = null, date = null) {
    if (!assignment || !directiveForDate(directive, date || assignment.date) || assignment.state === "COMPLETE") return assignment;
    const change = domainChange(directive, "STRENGTH");
    if (!change || (change.requiresPlanApproval && directive.planChangesApproved !== true)) return { ...assignment, adaptiveCoaching: change || null };
    if (change.action === "RECOVERY_ONLY") {
      return {
        ...assignment,
        state: "RECOVERY ONLY",
        title: "Adaptive recovery protocol",
        exercises: [],
        estimatedMinutes: 20,
        readinessDelta: { code: "ADAPTIVE_PROTECTION", detail: change.detail },
        adaptiveCoaching: change
      };
    }
    if (change.action === "REDUCE_VOLUME") {
      const exercises = (assignment.exercises || []).map((exercise) => ({
        ...exercise,
        sets: Math.max(1, Math.floor(Number(exercise.sets || 1) * (1 + change.volumeDeltaPercent / 100))),
        load: Math.max(0, Math.round(Number(exercise.load || 0) * (1 + change.loadDeltaPercent / 100) * 2) / 2)
      }));
      return {
        ...assignment,
        exercises,
        estimatedMinutes: Math.max(20, Math.round(Number(assignment.estimatedMinutes || 30) * 0.8 / 5) * 5),
        readinessDelta: { code: "ADAPTIVE_DELOAD", detail: change.detail },
        adaptiveCoaching: change
      };
    }
    if (change.action === "STAGE_PROGRESS") {
      const exercises = (assignment.exercises || []).map((exercise) => ({
        ...exercise,
        load: Number(exercise.load || 0) > 0
          ? Math.round((Number(exercise.load) * 1.025) * 2) / 2
          : Number(exercise.load || 0)
      }));
      return {
        ...assignment,
        exercises,
        readinessDelta: { code: "ADAPTIVE_PROGRESS", detail: change.detail },
        adaptiveCoaching: change
      };
    }
    return { ...assignment, adaptiveCoaching: change };
  }

  function adaptRunningPrescription(prescription = null, directive = null, date = null) {
    if (!prescription || !directiveForDate(directive, date || prescription.date) || !prescription.session) return prescription;
    const change = domainChange(directive, "RUNNING");
    if (!change || (change.requiresPlanApproval && directive.planChangesApproved !== true)) return { ...prescription, adaptiveCoaching: change || null };
    if (change.action === "RECOVERY_ONLY") {
      return { ...prescription, status: "ADAPTIVE_HOLD", session: null, message: change.detail, adaptiveCoaching: change };
    }
    if (change.action === "REDUCE_VOLUME") {
      const distance = Math.max(0, Math.round(Number(prescription.session.distance || 0) * (1 + change.volumeDeltaPercent / 100) * 10) / 10);
      return {
        ...prescription,
        status: "ADAPTIVE_DELOAD",
        session: { ...prescription.session, distance, type: "EASY" },
        message: change.detail,
        adaptiveCoaching: change
      };
    }
    if (change.action === "EASY_ONLY") {
      return {
        ...prescription,
        status: "ADAPTIVE_REBALANCE",
        session: { ...prescription.session, type: "EASY" },
        message: change.detail,
        adaptiveCoaching: change
      };
    }
    if (change.action === "STAGE_PROGRESS") {
      const distance = Math.max(0, Math.round(Number(prescription.session.distance || 0) * 1.05 * 10) / 10);
      return {
        ...prescription,
        status: "ADAPTIVE_PROGRESS",
        session: { ...prescription.session, distance },
        message: change.detail,
        adaptiveCoaching: change
      };
    }
    return { ...prescription, adaptiveCoaching: change };
  }

  function adaptCorePrescription(prescription = null, directive = null, date = null) {
    if (!prescription || !directiveForDate(directive, date || prescription.date) || !prescription.session) return prescription;
    const change = domainChange(directive, "CORE");
    if (!change || (change.requiresPlanApproval && directive.planChangesApproved !== true)) return { ...prescription, adaptiveCoaching: change || null };
    if (change.action === "RECOVERY_ONLY") {
      return { ...prescription, status: "SAFETY_HOLD", session: null, exercises: [], message: change.detail, adaptiveCoaching: change };
    }
    if (change.action === "REDUCE_VOLUME") {
      const exercises = (prescription.exercises || []).map((exercise) => ({
        ...exercise,
        sets: Math.max(1, Math.floor(Number(exercise.sets || 1) * (1 + change.volumeDeltaPercent / 100)))
      }));
      return {
        ...prescription,
        status: "ADAPTIVE_DELOAD",
        exercises,
        session: {
          ...prescription.session,
          estimatedMinutes: Math.max(8, Math.round(Number(prescription.session.estimatedMinutes || 15) * 0.75))
        },
        message: change.detail,
        adaptiveCoaching: change
      };
    }
    if (change.action === "STAGE_PROGRESS") {
      const exercises = (prescription.exercises || []).map((exercise, index) => ({
        ...exercise,
        sets: Math.max(1, Number(exercise.sets || 1) + (index === 0 ? 1 : 0))
      }));
      return {
        ...prescription,
        status: "ADAPTIVE_PROGRESS",
        exercises,
        message: change.detail,
        adaptiveCoaching: change
      };
    }
    return { ...prescription, adaptiveCoaching: change };
  }

  return Object.freeze({
    VERSION,
    DOMAIN_ORDER: [...DOMAIN_ORDER],
    ACTIONABLE_CODES,
    stableHash,
    normalizeReadiness,
    normalizeEvidence,
    confidenceFor,
    proposalDefinition,
    changesFor,
    buildProposal,
    approveProposal,
    holdProposal,
    directiveForDate,
    domainChange,
    adaptStrengthAssignment,
    adaptRunningPrescription,
    adaptCorePrescription
  });
});
