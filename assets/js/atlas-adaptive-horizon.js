(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasAdaptiveHorizon = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026G.1";
  const WINDOW_DAYS = 3;
  const DECISIONS = new Set(["ACCEPT", "KEEP", "NOT_FIT", "ACKNOWLEDGE"]);
  const TERMINAL_EXECUTION = new Set(["COMPLETE", "COMPLETED", "SECURED", "PARTIAL", "STOPPED", "PAIN_HOLD", "HELD"]);

  function text(value = "") {
    return String(value || "").trim();
  }

  function upper(value = "") {
    return text(value).toUpperCase().replaceAll(" ", "_");
  }

  function dateIso(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function addDays(value, count = 0) {
    const source = dateIso(value);
    if (!source) return null;
    const next = new Date(`${source}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + Number(count || 0));
    return next.toISOString().slice(0, 10);
  }

  function stableHash(value = "") {
    const source = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readinessState(item = {}) {
    const supplied = upper(item.state || item.classification);
    if (["GREEN", "YELLOW", "RED"].includes(supplied)) return supplied;
    if (item.pain === true || Number(item.energy) <= 3 || Number(item.soreness) >= 9) return "RED";
    if (Number(item.energy) <= 5 || Number(item.soreness) >= 7) return "YELLOW";
    return "GREEN";
  }

  function normalizeReadiness(history = [], sourceDate = "") {
    const source = dateIso(sourceDate);
    const recent = (Array.isArray(history) ? history : [])
      .filter((item) => dateIso(item?.date) && (!source || item.date <= source))
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))
      .slice(-3)
      .map((item) => ({
        date: dateIso(item.date),
        state: readinessState(item),
        energy: Number.isFinite(Number(item.energy)) ? Number(item.energy) : null,
        soreness: Number.isFinite(Number(item.soreness)) ? Number(item.soreness) : null,
        pain: item.pain === true,
        restingHeartRate: Number.isFinite(Number(item.resting_heart_rate ?? item.restingHeartRate)) ? Number(item.resting_heart_rate ?? item.restingHeartRate) : null,
        hrv: Number.isFinite(Number(item.heart_rate_variability ?? item.hrv)) ? Number(item.heart_rate_variability ?? item.hrv) : null
      }));
    const latest = recent.at(-1) || null;
    return {
      complete: Boolean(latest && latest.date === source),
      latest,
      days: recent.length,
      yellowDays: recent.filter((item) => item.state === "YELLOW").length,
      redDays: recent.filter((item) => item.state === "RED").length,
      painDays: recent.filter((item) => item.pain).length
    };
  }

  function normalizeExecution(input = {}) {
    const receipts = (Array.isArray(input.receipts) ? input.receipts : []).map((item) => ({
      id: text(item.id),
      module: upper(item.module),
      state: upper(item.state),
      painReported: item.painReported === true,
      completedAt: item.completedAt || item.updatedAt || null
    }));
    const planned = Math.max(0, Number(input.plannedTraining || input.sourceDay?.activities?.length || 0));
    const terminal = receipts.filter((item) => TERMINAL_EXECUTION.has(item.state));
    const held = receipts.some((item) => item.painReported || ["PAIN_HOLD", "HELD"].includes(item.state));
    const partial = receipts.some((item) => ["PARTIAL", "STOPPED"].includes(item.state));
    const complete = input.missionComplete === true
      || (planned === 0 ? input.closeoutSealed === true : terminal.length >= planned && !held);
    return {
      planned,
      receipts: receipts.length,
      terminal: terminal.length,
      complete,
      partial,
      held,
      closeoutSealed: input.closeoutSealed === true,
      latestAt: terminal.map((item) => item.completedAt).filter(Boolean).sort().at(-1) || null
    };
  }

  function change(domain, action, label, detail, volumeDeltaPercent = 0, loadDeltaPercent = 0) {
    return { domain, action, label, detail, volumeDeltaPercent, loadDeltaPercent, requiresPlanApproval: false };
  }

  function changesFor(code = "CURRENT") {
    if (["PROTECT", "RECOVER"].includes(code)) return [
      change("STRENGTH", "RECOVERY_ONLY", "Remove loaded strength", "Recovery replaces loaded strength for this day.", -100),
      change("RUNNING", "RECOVERY_ONLY", "Remove running demand", "No hard or long running during this recovery day.", -100),
      change("CORE", "RECOVERY_ONLY", "Use recovery only", "Remove loaded or provocative Core work.", -100),
      change("FUELING", "HOLD_TARGETS", "Protect Fuel targets", "Recovery never authorizes compensatory restriction."),
      change("RECOVERY", "PRIORITIZE", "Prioritize recovery", "Reassess in the next Roll Call.")
    ];
    if (code === "DELOAD") return [
      change("STRENGTH", "REDUCE_VOLUME", "Reduce strength demand", "Cut work sets about 25% and load no more than 10%.", -25, -10),
      change("RUNNING", "REDUCE_VOLUME", "Keep running easy", "Reduce non-long-run distance about 20% and remove hard intensity.", -20),
      change("CORE", "REDUCE_VOLUME", "Trim Core volume", "Remove one set where possible.", -25),
      change("FUELING", "HOLD_TARGETS", "Hold Fuel targets", "Training reduction does not change the approved Fuel baseline."),
      change("RECOVERY", "ADD_WINDOW", "Add recovery margin", "Protect sleep and the next low-demand window.")
    ];
    return [];
  }

  function decisionCopy(code) {
    return ({
      SETUP_REQUIRED: ["Commit the next three days", "Atlas needs a committed calendar before it can protect tomorrow."],
      WAITING: ["Finish today first", "Verified execution and Roll Call unlock the next 72-hour call."],
      PROTECT: ["Protection carries into tomorrow", "Pain or a safety hold makes the next exposure recovery-only until a fresh Roll Call clears it."],
      RECOVER: ["Recover before reloading", "Today ended partial or stopped. Preserve the evidence and recover before the next loaded exposure."],
      DELOAD: ["Reduce the next 48 hours", "Readiness is below the approved assumption. Reduce demand briefly, then return to plan."],
      CURRENT: ["Keep the next 72 hours", "Verified execution and readiness support the committed plan without adding demand."]
    })[code] || ["Keep the current plan", "No bounded change is justified."];
  }

  function projectionCode(code, index, hasTraining) {
    if (!hasTraining) return "RECOVERY";
    if (code === "PROTECT") return index === 0 ? "PROTECT" : "REASSESS";
    if (code === "RECOVER") return index === 0 ? "RECOVER" : "CURRENT";
    if (code === "DELOAD") return index < 2 ? "DELOAD" : "CURRENT";
    if (code === "WAITING") return "WAITING";
    return "CURRENT";
  }

  function dayCopy(projection, day = {}) {
    const titles = (day.activities || []).map((item) => text(item.title || item.module)).filter(Boolean);
    const work = titles.length ? titles.slice(0, 2).join(" + ") : "Recovery day";
    if (projection === "PROTECT") return ["Recovery only", "Fresh pain-free readiness is required before loaded work returns."];
    if (projection === "RECOVER") return ["Recovery first", "Keep today’s evidence; do not repay missed volume."];
    if (projection === "DELOAD") return [day.longRunUncapped ? "Easy long run" : `Reduced: ${work}`, day.longRunUncapped ? "Intensity comes down; duration stays open." : "Volume comes down without changing the plan."];
    if (projection === "REASSESS") return ["Reassess in Roll Call", work];
    if (projection === "WAITING") return ["Pending today’s evidence", work];
    if (projection === "RECOVERY") return ["Recovery stays protected", "No training is added."];
    return [work, "As committed."];
  }

  function projectDays(input = {}, code = "WAITING") {
    const sourceDate = dateIso(input.sourceDate);
    const committed = Array.isArray(input.committedDays) ? input.committedDays : [];
    return Array.from({ length: WINDOW_DAYS }, (_, index) => {
      const date = addDays(sourceDate, index + 1);
      const day = committed.find((item) => dateIso(item?.date) === date) || { date, activities: [] };
      const committedDay = Boolean(day.weekId || day.committed === true || (day.activities || []).length || day.recoveryDay === true);
      if (!committedDay) return { date, status: "UNCOMMITTED", label: "Calendar not committed", detail: "Commit this day before Atlas can apply an adjustment.", activities: [], weekId: null, weekRevision: 0, directiveCode: null };
      const hasTraining = (day.activities || []).length > 0;
      const status = projectionCode(code, index, hasTraining);
      const [label, detail] = dayCopy(status, day);
      return {
        date,
        status,
        label,
        detail,
        activities: (day.activities || []).map((item) => ({ id: item.id || null, module: upper(item.module), title: text(item.title), estimatedMinutes: Number(item.estimatedMinutes || 0) })),
        weekId: day.weekId || null,
        weekRevision: Number(day.weekRevision || 0),
        longRunUncapped: Boolean(day.longRunUncapped),
        directiveCode: ["PROTECT", "RECOVER", "DELOAD"].includes(status) ? status : null
      };
    });
  }

  function deriveCode(readiness, execution, setupReady) {
    if (!setupReady) return "SETUP_REQUIRED";
    if (readiness.latest?.pain || readiness.latest?.state === "RED" || execution.held) return "PROTECT";
    if (!readiness.complete) return "WAITING";
    if (execution.partial) return "RECOVER";
    if (!execution.complete) return "WAITING";
    if (readiness.latest?.state === "YELLOW" || Number(readiness.latest?.energy || 10) <= 4 || Number(readiness.latest?.soreness || 0) >= 7 || readiness.yellowDays >= 2) return "DELOAD";
    return "CURRENT";
  }

  function confidenceFor(readiness, execution) {
    if (readiness.complete && execution.terminal > 0 && execution.closeoutSealed) return "HIGH";
    if (readiness.complete && (execution.terminal > 0 || execution.planned === 0)) return "MODERATE";
    return "LOW";
  }

  function buildProposal(input = {}) {
    const sourceDate = dateIso(input.sourceDate || input.date);
    if (!sourceDate) return null;
    const readiness = normalizeReadiness(input.readinessHistory, sourceDate);
    const execution = normalizeExecution(input);
    const setupReady = Boolean(input.contractId && Number(input.contractRevision || 0) > 0 && input.sourceWeekId && (input.committedDays || []).some((item) => item?.weekId));
    const code = deriveCode(readiness, execution, setupReady);
    const [headline, reason] = decisionCopy(code);
    const days = projectDays({ ...input, sourceDate }, code);
    const status = code === "PROTECT" ? "AUTO_PROTECTED" : ["RECOVER", "DELOAD"].includes(code) ? "PROPOSED" : code === "CURRENT" ? "CURRENT" : code;
    const fingerprint = stableHash({
      sourceDate,
      contractId: input.contractId,
      contractRevision: Number(input.contractRevision || 0),
      sourceWeekId: input.sourceWeekId,
      sourceWeekRevision: Number(input.sourceWeekRevision || 0),
      readiness,
      execution,
      code,
      days: days.map((day) => ({ date: day.date, status: day.status, weekId: day.weekId, weekRevision: day.weekRevision, activities: day.activities }))
    });
    const prior = input.priorProposal || null;
    if (prior?.fingerprint === fingerprint && ["APPROVED", "HELD", "NEEDS_CONTEXT", "AUTO_PROTECTED"].includes(prior.status)) return clone(prior);
    const now = input.generatedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `atlas-horizon:${sourceDate}:${fingerprint}`,
      scope: "HORIZON",
      sourceDate,
      effectiveDate: addDays(sourceDate, 1),
      reviewDate: addDays(sourceDate, WINDOW_DAYS),
      status,
      code,
      tone: code === "PROTECT" ? "red" : ["RECOVER", "DELOAD"].includes(code) ? "yellow" : code === "CURRENT" ? "green" : "neutral",
      headline,
      reason,
      confidence: confidenceFor(readiness, execution),
      fingerprint,
      contractId: input.contractId || null,
      contractRevision: Number(input.contractRevision || 0),
      sourceWeekId: input.sourceWeekId || null,
      sourceWeekRevision: Number(input.sourceWeekRevision || 0),
      readiness,
      execution,
      days,
      changes: changesFor(code),
      planChangesApproved: code === "PROTECT",
      approvalRequired: ["RECOVER", "DELOAD"].includes(code),
      bounds: {
        automaticPlanMutation: false,
        sessionsAdded: 0,
        fuelTargetsChanged: false,
        longRunsCapped: false,
        expiresAfterDays: WINDOW_DAYS
      },
      generatedAt: now,
      updatedAt: now
    };
  }

  function resolveProposal(proposal = {}, decision = "KEEP", context = {}) {
    const choice = upper(decision);
    if (!DECISIONS.has(choice)) throw new Error("Choose Accept, Keep plan, or This does not fit.");
    const now = context.resolvedAt || new Date().toISOString();
    if (proposal.status === "AUTO_PROTECTED") {
      if (choice === "KEEP") throw new Error("Safety protection can only be cleared by a fresh pain-free Roll Call.");
      return {
        ...proposal,
        responseReason: choice === "NOT_FIT" ? upper(context.reason || "MISSING_CONTEXT") : proposal.responseReason || null,
        note: choice === "NOT_FIT" ? text(context.note).slice(0, 240) : proposal.note || null,
        acknowledgedAt: now,
        updatedAt: now
      };
    }
    if (choice === "NOT_FIT") return {
      ...proposal,
      status: "NEEDS_CONTEXT",
      responseReason: upper(context.reason || "MISSING_CONTEXT"),
      note: text(context.note).slice(0, 240),
      resolvedAt: now,
      updatedAt: now
    };
    if (choice === "KEEP") return { ...proposal, status: "HELD", planChangesApproved: false, approvedAt: null, heldAt: now, resolvedAt: now, updatedAt: now };
    if (choice === "ACKNOWLEDGE") return { ...proposal, acknowledgedAt: now, updatedAt: now };
    if (!["PROPOSED", "NEEDS_CONTEXT"].includes(proposal.status)) return proposal;
    return { ...proposal, status: "APPROVED", planChangesApproved: true, approvedAt: now, resolvedAt: now, updatedAt: now };
  }

  function proposalApplies(proposal = null, context = {}) {
    if (!proposal || proposal.scope !== "HORIZON" || !["APPROVED", "AUTO_PROTECTED"].includes(proposal.status)) return false;
    if (context.contractRevision && Number(context.contractRevision) !== Number(proposal.contractRevision || 0)) return false;
    const date = dateIso(context.date);
    if (!date || date < proposal.effectiveDate || date > proposal.reviewDate) return false;
    const day = (proposal.days || []).find((item) => item.date === date);
    if (!day || !day.directiveCode) return false;
    if (context.weekId && day.weekId && context.weekId !== day.weekId) return false;
    if (context.weekRevision && day.weekRevision && Number(context.weekRevision) !== Number(day.weekRevision)) return false;
    return true;
  }

  function directiveForDate(proposal = null, date = "", context = {}) {
    const target = dateIso(date);
    const applies = proposalApplies(proposal, { ...context, date: target });
    if (!applies) return null;
    if (proposal.code === "PROTECT" && context.readinessComplete === true && context.pain !== true && upper(context.readinessState) === "GREEN") return null;
    const day = proposal.days.find((item) => item.date === target);
    const code = day.directiveCode === "RECOVER" ? "RECOVER" : day.directiveCode;
    return {
      version: VERSION,
      id: `${proposal.id}:${target}`,
      status: "APPROVED",
      scope: "DAY",
      code,
      effectiveDate: target,
      reviewDate: target,
      planChangesApproved: true,
      changes: changesFor(code),
      sourceDecisionId: proposal.id,
      sourceDate: proposal.sourceDate,
      headline: day.label,
      detail: day.detail,
      confidence: proposal.confidence,
      bounds: proposal.bounds
    };
  }

  function calendarOverrideForDate(proposal = null, date = "", context = {}) {
    const directive = directiveForDate(proposal, date, context);
    if (!directive) return null;
    const recovery = ["PROTECT", "RECOVER"].includes(directive.code);
    return {
      status: "ATLAS_HORIZON_OVERRIDE",
      date: dateIso(date),
      label: directive.headline,
      detail: directive.detail,
      window: recovery ? "RECOVERY" : "CURRENT",
      futureWeekChanged: false,
      sourceProposalId: proposal.id
    };
  }

  function activityChange(directive, module) {
    return (directive?.changes || []).find((item) => item.domain === upper(module)) || null;
  }

  function reduceActivity(activity = {}, directive = {}, day = {}) {
    const change = activityChange(directive, activity.module);
    if (!change || change.action !== "REDUCE_VOLUME") return { ...activity };
    const openLongRun = Boolean(day.longRunUncapped && upper(activity.module) === "RUNNING");
    const minutes = Number(activity.estimatedMinutes || 0);
    return {
      ...activity,
      title: text(activity.title).startsWith("Reduced:") ? activity.title : `${openLongRun ? "Easy" : "Reduced"}: ${text(activity.title || activity.module)}`,
      type: upper(activity.module) === "RUNNING" ? "EASY" : activity.type,
      estimatedMinutes: openLongRun || !minutes ? minutes : Math.max(10, Math.round(minutes * (1 + Number(change.volumeDeltaPercent || 0) / 100) / 5) * 5),
      adaptiveHorizon: { code: directive.code, action: change.action, detail: change.detail, durationOpen: openLongRun }
    };
  }

  function applyToDay(day = null, proposal = null, context = {}) {
    if (!day) return day;
    const date = dateIso(context.date || day.date);
    const directive = directiveForDate(proposal, date, context);
    if (!directive) return { ...day };
    const recovery = ["PROTECT", "RECOVER"].includes(directive.code);
    if (recovery) return {
      ...day,
      activities: [],
      sessionSequence: [],
      sessionCount: 0,
      estimatedMinutes: 0,
      load: "RECOVERY",
      recoveryDay: true,
      twoADay: false,
      adaptiveHorizon: { decisionId: proposal.id, directiveId: directive.id, code: directive.code, originalActivities: (day.activities || []).length, longRunProtected: Boolean(day.longRunUncapped) }
    };
    const activities = (day.activities || []).map((activity) => reduceActivity(activity, directive, day));
    const byId = new Map(activities.map((activity) => [activity.id, activity]));
    const sequence = (day.sessionSequence || []).map((activity) => byId.get(activity.id) || reduceActivity(activity, directive, day));
    return {
      ...day,
      activities,
      sessionSequence: sequence,
      estimatedMinutes: activities.reduce((total, item) => total + Number(item.estimatedMinutes || 0), 0),
      adaptiveHorizon: { decisionId: proposal.id, directiveId: directive.id, code: directive.code, longRunUncapped: Boolean(day.longRunUncapped) }
    };
  }

  function applyToCommand(command = {}, proposal = null, context = {}) {
    if (command.blocker) return command;
    const directive = directiveForDate(proposal, context.date, context);
    if (!directive) return command;
    const recovery = ["PROTECT", "RECOVER"].includes(directive.code);
    if (recovery) return {
      ...command,
      title: directive.headline,
      detail: directive.detail,
      reason: `${proposal.reason} This 72-hour decision does not rewrite the signed program.`,
      window: "RECOVERY",
      duration: { minutes: 20, label: "20 min", open: false },
      primary: { action: "MODULE", label: "OPEN - Recovery", section: "today", module: "recovery" },
      adaptiveHorizon: proposal
    };
    const minutes = Number(command.duration?.minutes || 0);
    const open = command.duration?.open === true;
    const reduced = !minutes || open ? command.duration : { minutes: Math.max(10, Math.round(minutes * 0.75 / 5) * 5), label: `${Math.max(10, Math.round(minutes * 0.75 / 5) * 5)} min`, open: false };
    return {
      ...command,
      title: text(command.title).startsWith("Reduced:") ? command.title : `Reduced: ${command.title}`,
      detail: directive.detail,
      reason: `${proposal.reason} The committed plan remains intact after this bounded window.`,
      duration: reduced,
      adaptiveHorizon: proposal
    };
  }

  function installExperience(doc) {
    if (!doc || doc.documentElement?.dataset.adaptiveHorizonUx === VERSION) return false;
    const section = doc.getElementById("atlas-adaptive-horizon");
    const ritual = doc.getElementById("daily-ritual");
    if (!section || !ritual) return false;
    doc.documentElement.dataset.adaptiveHorizonUx = VERSION;
    ritual.insertAdjacentElement("afterend", section);
    const why = doc.getElementById("one-command-context");
    if (why) section.insertAdjacentElement("afterend", why);
    return true;
  }

  return Object.freeze({
    VERSION,
    WINDOW_DAYS,
    DECISIONS,
    addDays,
    stableHash,
    normalizeReadiness,
    normalizeExecution,
    changesFor,
    buildProposal,
    resolveProposal,
    proposalApplies,
    directiveForDate,
    calendarOverrideForDate,
    applyToDay,
    applyToCommand,
    installExperience
  });
});
