(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyDecisionIntegrity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "027F.1";
  const TRAINING_DOMAINS = Object.freeze(["strength", "running", "core"]);
  const ALL_DOMAINS = Object.freeze([...TRAINING_DOMAINS, "nutrition", "recovery"]);
  const COMPLETE_STATES = new Set(["COMPLETE", "COMPLETED", "SECURED", "FINALIZED", "DONE"]);
  const ACTIVE_STATES = new Set(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const GLOBAL_BLOCKERS = new Set(["CONTRACT_REQUIRED", "SIGNATURE_REQUIRED", "CONFLICT", "CONTRACT_CONFLICT", "PAIN_SAFETY_HOLD"]);
  const MOBILE_DESTINATIONS = Object.freeze({
    today: { section: "today" },
    train: { section: "performance", performanceView: "today_training" },
    fuel: { section: "nutrition" },
    review: { section: "inspection" },
    more: { dialog: "mobile-more-dialog" }
  });

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function domainName(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    if (["cardio", "run"].includes(normalized)) return "running";
    if (["fuel", "nutrition_plan"].includes(normalized)) return "nutrition";
    if (["abs", "abs/core"].includes(normalized)) return "core";
    return normalized;
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

  function isComplete(value) {
    return COMPLETE_STATES.has(upper(value?.state || value?.status || value));
  }

  function normalizePlans(plans = []) {
    return (Array.isArray(plans) ? plans : [])
      .filter((plan) => plan && plan.included !== false)
      .map((plan) => {
        const domain = domainName(plan.id || plan.module);
        return {
          id: domain,
          domain,
          label: String(plan.label || `${domain} plan`),
          complete: plan.complete === true || ["ACTIVE", "APPROVED", "COMPLETE"].includes(upper(plan.status)),
          status: upper(plan.status || (plan.complete ? "APPROVED" : "MISSING")),
          section: plan.section || (domain === "nutrition" ? "nutrition" : "performance")
        };
      })
      .filter((plan) => ALL_DOMAINS.includes(plan.domain));
  }

  function completionIndex(input = {}) {
    const index = new Map();
    const add = (key, value) => {
      if (!key || !value) return;
      const normalized = String(key).toLowerCase();
      const existing = index.get(normalized);
      if (!existing || isComplete(value) || !isComplete(existing)) index.set(normalized, value);
    };
    Object.entries(input.executions || {}).forEach(([key, value]) => add(domainName(key), value));
    (input.completedSessions || []).forEach((value) => {
      add(value.id, value);
      add(domainName(value.module), value);
    });
    (input.queue?.steps || []).forEach((value) => {
      add(value.id, value);
      if (value.module) add(domainName(value.module), value);
    });
    return index;
  }

  function scheduleModel(day = null, input = {}) {
    const completion = completionIndex(input);
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    const sessions = activities.map((item, index) => {
      const module = domainName(item.module || item.domain || "training");
      const id = item.id || `${module}-${index + 1}`;
      const candidates = [completion.get(String(id).toLowerCase()), completion.get(module)].filter(Boolean);
      const evidence = candidates.find((candidate) => isComplete(candidate)) || candidates[0] || null;
      const state = upper(evidence?.state || evidence?.status || item.state || "READY");
      return {
        id,
        module,
        title: item.title || item.label || `${module} session`,
        window: String(item.sessionWindow || item.sessionLabel || (day?.twoADay ? index ? "PM" : "AM" : "TODAY")).toUpperCase(),
        estimatedMinutes: Number(item.estimatedMinutes || 0) || null,
        longRunUncapped: Boolean(day?.longRunUncapped && module === "running"),
        state,
        complete: isComplete(state),
        active: ACTIVE_STATES.has(state),
        completedAt: evidence?.completedAt || evidence?.finalizedAt || null
      };
    });
    return {
      available: Boolean(day),
      operatingDate: day?.date || input.operatingDate || null,
      recoveryDay: Boolean(day) && sessions.length === 0,
      twoADay: Boolean(day?.twoADay),
      sessions,
      scheduledDomains: [...new Set(sessions.map((session) => session.module))],
      completedSessions: sessions.filter((session) => session.complete),
      estimatedMinutes: Number(day?.estimatedMinutes || sessions.reduce((sum, session) => sum + Number(session.estimatedMinutes || 0), 0)) || 0,
      longRunUncapped: Boolean(day?.longRunUncapped)
    };
  }

  function planBlockers(plans = [], options = {}) {
    const allOrNothing = options.allOrNothingTraining === true;
    return normalizePlans(plans).filter((plan) => !plan.complete).map((plan) => ({
      code: `MISSING_${upper(plan.domain)}_PLAN`,
      domain: plan.domain,
      title: `Link the ${plan.domain === "nutrition" ? "Fuel" : plan.domain === "running" ? "Running" : plan.domain[0].toUpperCase() + plan.domain.slice(1)} plan`,
      detail: `${plan.label} is not linked to the signed Contract. ${allOrNothing && TRAINING_DOMAINS.includes(plan.domain) ? "The Contract requires the full training program before execution." : `Only ${plan.domain === "nutrition" ? "Fuel" : plan.domain} is held; other approved work remains available.`}`,
      reason: "Today follows the signed Contract and the approved plan for each domain.",
      affectedDomains: allOrNothing && TRAINING_DOMAINS.includes(plan.domain) ? [...TRAINING_DOMAINS] : [plan.domain],
      action: { action: "PLAN", label: `Link ${plan.domain === "nutrition" ? "Fuel" : plan.domain === "running" ? "Running" : plan.domain[0].toUpperCase() + plan.domain.slice(1)}`, section: plan.section, module: plan.domain },
      priority: plan.domain === "core" ? 55 : 60
    }));
  }

  function normalizeContinuityBlocker(blocker = null, schedule = {}, options = {}) {
    if (!blocker) return null;
    const code = upper(blocker.code || blocker.state || "CONFLICT");
    const inferredDomain = domainName(blocker.domain || code.match(/^MISSING_(.+)_PLAN$/)?.[1] || "");
    if (code.startsWith("MISSING_") && code.endsWith("_PLAN") && inferredDomain) {
      if (planBlockers(options.plans, options).some((item) => item.code === code)) return null;
      return {
        code,
        domain: inferredDomain,
        title: blocker.title || `Link the ${inferredDomain} plan`,
        detail: blocker.detail || `Only ${inferredDomain} is held until its approved plan is linked.`,
        reason: blocker.reason || "Domain authorization requires its own approved plan.",
        affectedDomains: options.allOrNothingTraining ? [...TRAINING_DOMAINS] : [inferredDomain],
        action: { ...(blocker.primary || blocker.action || {}), label: blocker.primary?.label || blocker.action?.label || `Link ${inferredDomain}`, module: inferredDomain },
        priority: 65
      };
    }
    const affected = Array.isArray(blocker.affectedDomains) && blocker.affectedDomains.length
      ? blocker.affectedDomains.map(domainName)
      : GLOBAL_BLOCKERS.has(code)
        ? [...TRAINING_DOMAINS]
        : schedule.scheduledDomains?.length ? [...schedule.scheduledDomains] : [...TRAINING_DOMAINS];
    return {
      code,
      domain: inferredDomain || "program",
      title: blocker.title || "Resolve the saved program",
      detail: blocker.detail || "Choose the approved program that should govern every surface.",
      reason: blocker.reason || "One approved source must govern today.",
      affectedDomains: affected,
      action: { ...(blocker.primary || blocker.action || {}), label: blocker.primary?.label || blocker.action?.label || "Resolve program", section: blocker.primary?.section || blocker.action?.section || "today" },
      priority: Number(blocker.priority || (code === "CONTRACT_CONFLICT" ? 200 : 90))
    };
  }

  function nutritionEvidence(input = {}, operatingDate) {
    const source = input.nutritionEvidence || input.fuelEvidence || {};
    const record = source.record || source.actual || null;
    const date = source.date || record?.date || null;
    const updatedAt = source.updatedAt || record?.updatedAt || source.sourceRecordedAt || null;
    const current = Boolean(record && date === operatingDate);
    const stale = Boolean(record && date && date !== operatingDate);
    return {
      state: current ? "CURRENT" : stale ? "STALE" : "MISSING",
      current,
      stale,
      date,
      updatedAt,
      source: source.source || record?.source || "NONE"
    };
  }

  function evidenceModel(input = {}, schedule = {}, operatingDate = "") {
    const steps = Array.isArray(input.queue?.steps) ? input.queue.steps : [];
    const completed = Number(input.queue?.completed ?? steps.filter((step) => isComplete(step)).length);
    const total = Number(input.queue?.total ?? steps.length);
    const required = steps.filter((step) => !isComplete(step)).map((step) => ({
      id: step.id,
      module: domainName(step.module || step.id),
      label: step.label || step.id,
      actionLabel: step.actionLabel || "Record evidence"
    }));
    const fuel = nutritionEvidence(input, operatingDate);
    return {
      completed,
      total,
      coverage: total ? Math.round((completed / total) * 100) : 0,
      required,
      freshness: fuel.state,
      fuel,
      completedSessions: schedule.completedSessions.length
    };
  }

  function authorizationModel(schedule, blockers, readiness, input = {}) {
    const byDomain = {};
    ALL_DOMAINS.forEach((domain) => {
      const sessions = schedule.sessions.filter((session) => session.module === domain);
      const domainBlockers = blockers.filter((blocker) => blocker.affectedDomains.includes(domain));
      const complete = sessions.length > 0 && sessions.every((session) => session.complete);
      const scheduled = sessions.length > 0;
      const readinessHold = TRAINING_DOMAINS.includes(domain) && scheduled && !complete && !readiness.complete;
      const blocked = domainBlockers.length > 0 || readinessHold;
      const recoveryRest = schedule.recoveryDay && TRAINING_DOMAINS.includes(domain);
      const reason = domainBlockers[0]?.detail || (readinessHold ? "Complete Roll Call before starting this session." : complete ? "Completion evidence is preserved." : scheduled ? "Approved and scheduled today." : domain === "nutrition" ? "Fuel remains available every day." : domain === "recovery" ? "Recovery remains available every day." : "Not scheduled today.");
      byDomain[domain] = {
        domain,
        scheduled,
        complete,
        blocked,
        applicable: !recoveryRest && (scheduled || domain === "nutrition" || domain === "recovery"),
        authorized: !recoveryRest && !blocked && (domain === "nutrition" || domain === "recovery" || (scheduled && !complete)),
        executable: !recoveryRest && !blocked && (domain === "nutrition" || domain === "recovery" || (scheduled && !complete)),
        progressionAllowed: TRAINING_DOMAINS.includes(domain) && scheduled && !complete && !blocked && !readiness.pain,
        state: recoveryRest ? "REST" : complete ? "COMPLETED" : blocked ? "BLOCKED" : scheduled ? "AUTHORIZED" : domain === "nutrition" || domain === "recovery" ? "AVAILABLE" : "NOT_SCHEDULED",
        reason,
        blockers: domainBlockers.map((blocker) => blocker.code),
        sessions
      };
    });
    return byDomain;
  }

  function repairAction(blocker) {
    return blocker?.action || { action: "TODAY", label: "Open Today", section: "today", module: "" };
  }

  function sessionAction(session) {
    return {
      action: session.active ? "RESUME" : "START",
      label: `${session.active ? "Resume" : "Start"} ${session.title}`,
      section: "today",
      module: session.module,
      sessionId: session.id
    };
  }

  function selectActions({ schedule, authorization, blockers, readiness, evidence, recoveryDay }) {
    const secondary = [];
    const contractConflict = blockers.find((blocker) => blocker.code === "CONTRACT_CONFLICT");
    if (contractConflict) return { primary: repairAction(contractConflict), secondary: [] };
    const blockedScheduled = blockers.filter((blocker) => blocker.affectedDomains.some((domain) => schedule.scheduledDomains.includes(domain)));
    const executableSessions = schedule.sessions.filter((session) => !session.complete && authorization[session.module]?.authorized);
    if (!readiness.complete && schedule.sessions.some((session) => !session.complete)) {
      blockedScheduled.forEach((blocker) => secondary.push(repairAction(blocker)));
      return { primary: { action: "ROLL_CALL", label: "Complete Roll Call", section: "today", module: "roll_call" }, secondary };
    }
    if (executableSessions.length) {
      blockedScheduled.forEach((blocker) => secondary.push(repairAction(blocker)));
      return { primary: sessionAction(executableSessions[0]), secondary };
    }
    if ((schedule.sessions.length || schedule.completedSessions.length) && !evidence.fuel.current) {
      blockedScheduled.forEach((blocker) => secondary.push(repairAction(blocker)));
      return { primary: { action: "FUEL", label: evidence.fuel.stale ? "Update today's Fuel" : "Log today's Fuel", section: "nutrition", module: "nutrition" }, secondary };
    }
    if (blockedScheduled.length) {
      const [first, ...rest] = blockedScheduled;
      rest.forEach((blocker) => secondary.push(repairAction(blocker)));
      return { primary: repairAction(first), secondary };
    }
    if (!schedule.available) return { primary: { action: "CALENDAR", label: "Open Calendar", section: "calendar", module: "" }, secondary };
    if (recoveryDay) return { primary: { action: "RECOVERY", label: "Open recovery plan", section: "today", module: "recovery" }, secondary };
    if (evidence.required.length) return { primary: { action: "EVIDENCE", label: evidence.required[0].actionLabel, section: "today", module: evidence.required[0].module }, secondary };
    return { primary: { action: "CLOSEOUT", label: "Close today", section: "today", module: "closeout" }, secondary };
  }

  function fuelContext(schedule, evidence) {
    const trainingDay = schedule.sessions.length > 0 || schedule.completedSessions.length > 0;
    if (trainingDay) {
      return {
        type: schedule.completedSessions.length ? "POST_TRAINING" : "TRAINING_DAY",
        trainingDay: true,
        headline: schedule.twoADay ? "Fuel both training windows" : schedule.completedSessions.length ? "Refuel the work you completed" : "Fuel today's training",
        detail: evidence.fuel.current ? "Today's totals are recorded against the training day." : evidence.fuel.stale ? "Older Fuel evidence exists. Update today's calories and macros." : "Log today's calories and macros; unrelated plan holds do not turn this into a recovery day.",
        evidenceState: evidence.fuel.state
      };
    }
    return {
      type: schedule.available ? "RECOVERY_DAY" : "SCHEDULE_REQUIRED",
      trainingDay: false,
      headline: schedule.available ? "Recovery-day fuel" : "Commit the calendar",
      detail: schedule.available ? "Use the approved recovery targets and preserve protein and hydration." : "Fuel remains available while the operating day is committed.",
      evidenceState: evidence.fuel.state
    };
  }

  function resolve(input = {}) {
    const startedAt = Date.now();
    const canonical = input.canonicalDailyCommand || null;
    const canonicalDay = canonical ? (canonical.day?.committed ? canonical.day.source : null) : input.day || null;
    const operatingDate = input.operatingDate || input.truth?.date || canonical?.date || canonicalDay?.date || new Date().toISOString().slice(0, 10);
    const schedule = scheduleModel(canonicalDay, { ...input, operatingDate });
    const readinessSource = input.readiness || {};
    const readiness = {
      complete: input.readinessComplete === true,
      classification: input.readinessComplete === true ? upper(readinessSource.classification || readinessSource.state || "RECORDED") : "ROLL_CALL_REQUIRED",
      confidence: Math.max(0, Math.min(100, Number(readinessSource.confidence?.score ?? readinessSource.confidence ?? input.command?.confidence?.score ?? 0) || 0)),
      pain: readinessSource.pain === true,
      energy: Number.isFinite(Number(readinessSource.energy)) ? Number(readinessSource.energy) : null,
      soreness: Number.isFinite(Number(readinessSource.soreness)) ? Number(readinessSource.soreness) : null
    };
    const allOrNothingTraining = input.allOrNothingTraining === true || input.contract?.allOrNothingTraining === true;
    const blockers = planBlockers(input.plans, { allOrNothingTraining });
    const continuity = normalizeContinuityBlocker(input.continuityBlocker, schedule, { plans: input.plans, allOrNothingTraining });
    if (continuity && !blockers.some((blocker) => blocker.code === continuity.code)) blockers.push(continuity);
    if (canonical?.blocked && canonical.blocker && !blockers.some((blocker) => blocker.code === canonical.blocker.code)) {
      blockers.unshift({
        ...canonical.blocker,
        affectedDomains: Array.isArray(canonical.blocker.affectedDomains) ? canonical.blocker.affectedDomains.map(domainName) : [...TRAINING_DOMAINS, "recovery"],
        action: { ...canonical.primaryAction },
        priority: Number(canonical.blocker.priority || 130)
      });
    }
    if (readiness.pain) blockers.unshift({
      code: "PAIN_SAFETY_HOLD",
      domain: "training",
      title: "Protect today from pain",
      detail: "Loaded training is held. Review Roll Call and use only the recovery action that is explicitly cleared.",
      reason: "Pain overrides normal training authorization.",
      affectedDomains: [...TRAINING_DOMAINS],
      action: { action: "ROLL_CALL", label: "Review Roll Call", section: "today", module: "roll_call" },
      priority: 120
    });
    if (input.staleData === true || input.truth?.stale === true || input.command?.stale === true) blockers.unshift({
      code: "STALE_DAILY_EVIDENCE",
      domain: "program",
      title: "Refresh today's order",
      detail: "The last complete decision remains visible, but new training waits for current evidence.",
      reason: "Coach Dominion does not authorize new work from stale evidence.",
      affectedDomains: schedule.sessions.filter((session) => !session.complete).map((session) => session.module),
      action: { action: "REFRESH", label: "Refresh today's order", section: "today", module: "" },
      priority: 110
    });
    blockers.sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0));
    const authorization = authorizationModel(schedule, blockers, readiness, input);
    const evidence = evidenceModel(input, schedule, operatingDate);
    const recoveryDay = canonical ? Boolean(canonical.day?.recoveryDay) : schedule.recoveryDay;
    const selectedActions = selectActions({ schedule, authorization, blockers, readiness, evidence, recoveryDay });
    const actions = canonical?.blocked
      ? { primary: { ...canonical.primaryAction }, secondary: [] }
      : selectedActions;
    const scheduledTraining = schedule.sessions.filter((session) => TRAINING_DOMAINS.includes(session.module));
    const incompleteTraining = scheduledTraining.filter((session) => !session.complete);
    const authorizedTraining = incompleteTraining.some((session) => authorization[session.module]?.authorized);
    const allTrainingBlocked = incompleteTraining.length > 0 && incompleteTraining.every((session) => authorization[session.module]?.blocked);
    const loading = input.loading === true;
    const failed = input.failed === true;
    const stale = blockers.some((blocker) => blocker.code === "STALE_DAILY_EVIDENCE");
    const status = loading ? "LOADING" : failed ? "FAILED" : stale ? "STALE" : canonical?.blocked ? "BLOCKED" : recoveryDay ? "RECOVERY_DAY" : !schedule.available ? "EMPTY" : !readiness.complete && incompleteTraining.length ? "READINESS_REQUIRED" : scheduledTraining.length && scheduledTraining.every((session) => session.complete) ? "COMPLETED" : allTrainingBlocked ? "BLOCKED" : blockers.length ? "PARTIALLY_BLOCKED" : authorizedTraining ? "TRAINING_AUTHORIZED" : "READY";
    const decidedAt = input.decidedAt || new Date().toISOString();
    const nutritionContext = canonical?.fuelContext
      ? { ...canonical.fuelContext, evidenceState: evidence.fuel.state }
      : fuelContext(schedule, evidence);
    const decision = {
      version: VERSION,
      operatingDate,
      overallState: status,
      status,
      loadingState: loading ? "LOADING" : failed ? "FAILED" : stale ? "STALE" : "CURRENT",
      authorizedTraining,
      recoveryDay,
      blockers,
      blocker: blockers[0] || null,
      authorization,
      authorizedDomains: ALL_DOMAINS.filter((domain) => authorization[domain].authorized),
      blockedDomains: ALL_DOMAINS.filter((domain) => authorization[domain].blocked),
      readiness,
      schedule,
      completedSessions: schedule.completedSessions,
      requiredEvidence: evidence.required,
      evidence,
      nutritionContext,
      primaryAction: actions.primary,
      secondaryActions: actions.secondary,
      nextAction: actions.primary,
      decisionAt: decidedAt,
      decisionVersion: VERSION,
      sourceState: input.truth?.state || input.command?.state || null,
      canonicalDailyCommandId: canonical?.id || null,
      lifecycle: canonical?.lifecycle || null,
      timing: { assembledMs: Math.max(0, Date.now() - startedAt) }
    };
    decision.id = `daily-decision-${operatingDate}-${stableHash({
      version: VERSION,
      status,
      schedule: schedule.sessions.map((session) => [session.id, session.state]),
      blockers: blockers.map((blocker) => blocker.code),
      action: actions.primary,
      fuel: evidence.fuel.state,
      canonical: canonical?.id || null
    })}`;
    return decision;
  }

  function moduleState(decision = null, domain = "training") {
    const normalized = domainName(domain === "training" ? "strength" : domain);
    if (!decision) return { status: "LOADING", executable: false, progressionAllowed: false, detail: "Checking today's order." };
    const state = decision.authorization?.[normalized];
    if (!state) return { status: "UNAVAILABLE", executable: false, progressionAllowed: false, detail: "This module is not part of today's decision." };
    return {
      status: state.state.replaceAll("_", " "),
      executable: state.executable,
      progressionAllowed: state.progressionAllowed,
      detail: state.reason,
      action: state.blocked ? repairAction(decision.blockers.find((blocker) => blocker.affectedDomains.includes(normalized))) : decision.primaryAction,
      complete: state.complete,
      scheduled: state.scheduled
    };
  }

  function applyToCommand(command = {}, decision = null) {
    if (!decision) return command;
    const fullyBlocked = decision.status === "BLOCKED" || decision.status === "STALE" || decision.status === "FAILED";
    return {
      ...command,
      dailyDecision: decision,
      state: fullyBlocked ? "BLOCKED" : decision.status === "COMPLETED" ? "COMPLETED" : command.state,
      stateLabel: fullyBlocked ? "ACTION REQUIRED" : command.stateLabel,
      title: fullyBlocked ? decision.blocker?.title : command.title,
      detail: fullyBlocked ? decision.blocker?.detail : command.detail,
      primary: { ...decision.primaryAction },
      secondary: decision.secondaryActions
    };
  }

  function reviewSummary(aggregate = {}) {
    const elapsedDays = Math.max(0, Number(aggregate.elapsedDayCount ?? aggregate.elapsedDays ?? 0));
    const assessedDays = Math.max(0, Number(aggregate.counts?.assessedDays ?? aggregate.assessedDays ?? 0));
    const unscoredDays = Math.max(0, Number(aggregate.counts?.unscoredDays ?? Math.max(0, elapsedDays - assessedDays)));
    const normalizedCoverage = typeof DominionReleaseStabilization !== "undefined"
      ? DominionReleaseStabilization.percentValue(aggregate.evidenceCoverage)
      : Number(aggregate.evidenceCoverage || 0);
    const normalizedScore = typeof DominionReleaseStabilization !== "undefined"
      ? DominionReleaseStabilization.percentValue(aggregate.score)
      : Number(aggregate.score);
    const coverage = Math.max(0, Math.min(100, Math.round(normalizedCoverage || 0)));
    const score = Number.isFinite(normalizedScore) ? normalizedScore : null;
    const thinEvidence = assessedDays < 2 || coverage < 50;
    return {
      elapsedDays,
      assessedDays,
      unscoredDays,
      coverage,
      score,
      thinEvidence,
      headline: `${assessedDays} of ${elapsedDays} elapsed day${elapsedDays === 1 ? "" : "s"} assessed`,
      scoreText: score === null ? "Unscored" : `${Math.round(score)}% of assessed observations`,
      scoreEmphasis: !thinEvidence,
      strongest: thinEvidence ? null : aggregate.strongestDomains || [],
      weakest: thinEvidence ? null : aggregate.weakestDomains || []
    };
  }

  function contractMode({ signed = false, draft = null } = {}) {
    return signed ? draft ? "AMENDMENT" : "FINALIZED" : "SETUP";
  }

  function connectionState(input = {}, now = new Date()) {
    if (typeof DominionReleaseStabilization !== "undefined") {
      return DominionReleaseStabilization.connectionState(input, { now: now.toISOString() });
    }
    const status = upper(input.status || input.connectionStatus || "NOT_CONNECTED");
    const lastAt = input.lastSuccessfulAt || input.lastSyncAt || input.updatedAt || null;
    const ageDays = lastAt ? Math.floor((now.getTime() - new Date(lastAt).getTime()) / 86400000) : null;
    if (input.failed || ["FAILED", "ERROR"].includes(status)) return { state: "IMPORT_FAILED", label: "Import failed", action: "Review error" };
    if (input.isSimulated) return { state: "DEMO", label: "Demo only", action: "Replace demo" };
    if (["NOT_CONNECTED", "DISCONNECTED"].includes(status)) return { state: "SETUP_REQUIRED", label: "Setup required", action: "Set up" };
    if (ageDays !== null && ageDays >= 7) return { state: "STALE", label: `Stale · ${ageDays} days`, action: "Repair connection" };
    if (["COMING_SOON", "PLANNED"].includes(status)) return { state: "COMING_SOON", label: "Coming soon", action: null };
    return { state: "CURRENT", label: "Current", action: "Review" };
  }

  function resolveMobileDestination(action = "today") {
    return MOBILE_DESTINATIONS[String(action || "today").toLowerCase()] || MOBILE_DESTINATIONS.today;
  }

  function mobileNavForSection(section = "today") {
    const normalized = String(section || "today").toLowerCase();
    if (normalized === "performance") return "train";
    if (normalized === "nutrition") return "fuel";
    if (normalized === "inspection") return "review";
    if (["program", "calendar", "contract", "trends", "standards", "rank", "record", "connected"].includes(normalized)) return "more";
    return "today";
  }

  function consistencyReport(decision = {}) {
    const conflicts = [];
    if (decision.nutritionContext?.trainingDay && decision.nutritionContext?.headline?.toLowerCase().includes("recovery-day")) conflicts.push("Fuel contradicts the training day.");
    if (decision.completedSessions?.length && decision.status === "EMPTY") conflicts.push("Completed training cannot coexist with an empty day.");
    (decision.completedSessions || []).forEach((session) => {
      if (decision.authorization?.[session.module]?.state === "BLOCKED") conflicts.push(`${session.title} completion was overwritten by a blocker.`);
    });
    return { valid: conflicts.length === 0, conflicts };
  }

  function installExperience(doc) {
    if (!doc || doc.documentElement?.dataset.dailyDecisionIntegrity === VERSION) return false;
    doc.documentElement.dataset.dailyDecisionIntegrity = VERSION;
    const today = doc.getElementById("today");
    const command = doc.getElementById("one-command");
    if (today) today.dataset.decisionAuthority = "027F";
    if (command) command.dataset.primaryDecision = "true";
    const support = doc.getElementById("daily-decision-support");
    if (support) {
      support.dataset.decisionSupport = "027F";
      support.setAttribute("aria-label", "Today's readiness, schedule, evidence, and next action");
    }
    return true;
  }

  return Object.freeze({
    VERSION,
    TRAINING_DOMAINS: [...TRAINING_DOMAINS],
    ALL_DOMAINS: [...ALL_DOMAINS],
    stableHash,
    normalizePlans,
    scheduleModel,
    planBlockers,
    nutritionEvidence,
    evidenceModel,
    resolve,
    buildDailyDecision: resolve,
    moduleState,
    applyToCommand,
    reviewSummary,
    contractMode,
    connectionState,
    resolveMobileDestination,
    mobileNavForSection,
    consistencyReport,
    installExperience
  });
});
