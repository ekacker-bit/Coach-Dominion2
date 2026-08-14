(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyDecision = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026E.1";
  const TRAINING_DOMAINS = Object.freeze(["strength", "running", "core"]);
  const TERMINAL_STATES = new Set(["SECURED", "COMPLETE", "COMPLETED"]);
  const BLOCKING_STATES = new Set(["CONTRACT_REQUIRED", "SIGNATURE_REQUIRED", "PLANS_REQUIRED", "WEEK_REQUIRED", "CONFLICT"]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
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

  function normalizePlans(plans = []) {
    return (Array.isArray(plans) ? plans : [])
      .filter((item) => item && item.included !== false)
      .map((item) => ({
        id: String(item.id || item.module || "").toLowerCase(),
        label: String(item.label || item.id || item.module || "Plan"),
        complete: item.complete === true || ["ACTIVE", "APPROVED", "COMPLETE"].includes(upper(item.status)),
        status: upper(item.status || (item.complete ? "APPROVED" : "MISSING")),
        section: item.section || (String(item.id || item.module).toLowerCase() === "nutrition" ? "nutrition" : "performance")
      }))
      .filter((item) => item.id);
  }

  function missingPlanBlocker(plans = [], contractRevision = 0) {
    const pending = normalizePlans(plans).find((item) => !item.complete);
    if (!pending) return null;
    const domain = pending.id === "cardio" ? "running" : pending.id === "fuel" ? "nutrition" : pending.id;
    const label = pending.label.replace(/\s+plan$/i, "");
    return {
      code: `MISSING_${upper(domain)}_PLAN`,
      domain,
      title: `Repair the ${label} plan`,
      detail: `${pending.label} does not match the signed Contract${contractRevision ? ` revision ${contractRevision}` : ""}. Training stays protected until the complete program agrees.`,
      reason: `A complete Contract-to-program chain is required before today's training can be trusted.`,
      affectedDomains: [...TRAINING_DOMAINS],
      safeDomains: ["nutrition", "recovery"],
      action: {
        action: "PLAN",
        label: `Repair ${label}`,
        section: pending.section || "contract",
        module: domain
      }
    };
  }

  function continuityBlocker(blocker = null) {
    if (!blocker) return null;
    return {
      code: blocker.code || "CONTINUITY_CHOICE",
      domain: blocker.domain || "program",
      title: blocker.title || "Choose the saved program",
      detail: blocker.detail || "Choose the approved copy that should govern every surface.",
      reason: blocker.reason || "One saved program must govern Today, Training, Fuel, Recovery, and Calendar.",
      affectedDomains: [...TRAINING_DOMAINS],
      safeDomains: ["recovery"],
      action: { ...(blocker.primary || {}), label: blocker.primary?.label || "Choose saved program" }
    };
  }

  function readinessModel(input = {}) {
    const source = input.readiness || {};
    const complete = input.readinessComplete === true;
    const classification = complete ? upper(source.classification || source.state || "RECORDED") : "ROLL_CALL_REQUIRED";
    const rawConfidence = Number(source.confidence?.score ?? source.confidence ?? input.confidence?.score ?? 0);
    const confidence = Number.isFinite(rawConfidence) ? Math.max(0, Math.min(100, Math.round(rawConfidence))) : 0;
    return {
      complete,
      classification,
      confidence,
      pain: source.pain === true,
      energy: Number.isFinite(Number(source.energy)) ? Number(source.energy) : null,
      soreness: Number.isFinite(Number(source.soreness)) ? Number(source.soreness) : null
    };
  }

  function scheduleModel(day = null) {
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    const sessions = activities.map((item, index) => ({
      id: item.id || `${String(item.module || "session").toLowerCase()}-${index + 1}`,
      module: String(item.module || "training").toLowerCase(),
      title: item.title || item.label || String(item.module || "Training"),
      window: String(item.sessionWindow || item.sessionLabel || (day?.twoADay ? index ? "PM" : "AM" : "TODAY")).toUpperCase(),
      estimatedMinutes: Number(item.estimatedMinutes || 0) || null,
      longRunUncapped: Boolean(day?.longRunUncapped && upper(item.module) === "RUNNING")
    }));
    return {
      available: Boolean(day),
      operatingDate: day?.date || null,
      recoveryDay: Boolean(day) && sessions.length === 0,
      twoADay: Boolean(day?.twoADay),
      sessions,
      estimatedMinutes: Number(day?.estimatedMinutes || sessions.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0)) || 0,
      longRunUncapped: Boolean(day?.longRunUncapped)
    };
  }

  function evidenceModel(input = {}) {
    const queue = input.queue || {};
    const steps = Array.isArray(queue.steps) ? queue.steps : [];
    const required = steps
      .filter((item) => !["COMPLETE", "COMPLETED", "SECURED"].includes(upper(item.state || item.status)))
      .map((item) => ({ id: item.id, label: item.label || item.id, actionLabel: item.actionLabel || "Record evidence" }));
    return {
      completed: Number(queue.completed || 0),
      total: Number(queue.total || steps.length || 0),
      required
    };
  }

  function nutritionModel(blocker, schedule, input = {}) {
    if (blocker) {
      return {
        type: "PROGRAM_BLOCKED",
        trainingDay: false,
        headline: "Use recovery-day fuel until the program is repaired",
        detail: "Training-day timing and escalation are paused. Keep the approved recovery baseline; do not restrict food to compensate.",
        safe: true
      };
    }
    if (!schedule.available) {
      return {
        type: "SCHEDULE_REQUIRED",
        trainingDay: false,
        headline: "No committed schedule yet",
        detail: "Use the approved recovery baseline until the operating day is committed.",
        safe: true
      };
    }
    if (schedule.recoveryDay) {
      return {
        type: "RECOVERY_DAY",
        trainingDay: false,
        headline: "Recovery-day fuel",
        detail: "Use the approved recovery targets and preserve protein and hydration.",
        safe: true
      };
    }
    return {
      type: "TRAINING_DAY",
      trainingDay: true,
      headline: schedule.twoADay ? "Fuel both training windows" : "Fuel today's training",
      detail: schedule.twoADay ? "Use the approved training targets and refuel between sessions." : "Use the approved training-day targets and timing.",
      safe: true
    };
  }

  function baseDecisionStatus(command = {}, schedule = {}, readiness = {}) {
    const state = upper(command.state || "LOADING");
    if (!readiness.complete) return "READINESS_REQUIRED";
    if (TERMINAL_STATES.has(state)) return "COMPLETED";
    if (!schedule.available) return "EMPTY";
    if (schedule.recoveryDay) return "RECOVERY_DAY";
    if (["IN_PROGRESS", "EXECUTION_REQUIRED"].includes(state) || command.verb === "RESUME") return "TRAINING_AUTHORIZED";
    if (["EVIDENCE_REQUIRED", "REVIEW_REQUIRED", "ADAPTATION_REQUIRED"].includes(state)) return state;
    if (BLOCKING_STATES.has(state)) return "BLOCKED";
    return "READY";
  }

  function buildDailyDecision(input = {}) {
    const truth = input.truth || {};
    const command = input.command || {};
    const schedule = scheduleModel(input.day || null);
    const readiness = readinessModel({
      ...input,
      confidence: command.confidence,
      readinessComplete: input.readinessComplete
    });
    const loading = input.loading === true;
    const staleData = input.staleData === true || truth.stale === true || command.stale === true;
    const blocker = loading ? null : continuityBlocker(input.continuityBlocker)
      || missingPlanBlocker(input.plans, input.contractRevision)
      || (staleData ? {
        code: "STALE_DATA",
        domain: "program",
        title: "Refresh today's evidence",
        detail: "The saved program is current, but today's evidence is stale. Training stays protected until the command is refreshed.",
        reason: "Coach Dominion will not authorize training from stale evidence.",
        affectedDomains: [...TRAINING_DOMAINS],
        safeDomains: ["nutrition", "recovery"],
        action: { action: "REFRESH", label: "Refresh today's order", section: "today", module: "" }
      } : null)
      || (BLOCKING_STATES.has(upper(truth.state)) ? {
        code: upper(truth.state),
        domain: truth.action?.module || truth.phase || "program",
        title: truth.title || "Repair the program",
        detail: truth.detail || "The operating chain must be repaired before training.",
        reason: "Program integrity comes before execution.",
        affectedDomains: [...TRAINING_DOMAINS],
        safeDomains: ["recovery"],
        action: { ...(truth.action || {}) }
      } : null);
    const painHold = !blocker && readiness.pain ? {
      code: "PAIN_SAFETY_HOLD",
      domain: "training",
      title: "Protect today from pain",
      detail: "Loaded training is held. Review Roll Call and use only the recovery action that is explicitly cleared.",
      reason: "Pain overrides progression and normal training authorization.",
      affectedDomains: [...TRAINING_DOMAINS],
      safeDomains: ["nutrition", "recovery"],
      action: { action: "ROLL_CALL", label: "Review Roll Call", section: "today", module: "roll_call" }
    } : null;
    const activeBlocker = blocker || painHold;
    const evidence = evidenceModel(input);
    const status = loading ? "LOADING" : staleData ? "STALE" : activeBlocker ? "BLOCKED" : baseDecisionStatus(command, schedule, readiness);
    const trainingAuthorized = !activeBlocker && readiness.complete && !schedule.recoveryDay
      && !["LOADING", "EMPTY", "STALE", "READINESS_REQUIRED", "BLOCKED", "COMPLETED"].includes(status);
    const nextAction = loading
      ? { action: "REFRESH", label: "Check today's order", section: "today", module: "" }
      : status === "EMPTY"
        ? { action: "CALENDAR", label: "Open Calendar", section: "calendar", module: "" }
      : activeBlocker?.action || command.primary || truth.action || { action: "TODAY", label: "Open Today", section: "today" };
    const operatingDate = input.operatingDate || truth.date || schedule.operatingDate || new Date().toISOString().slice(0, 10);
    const decidedAt = input.decidedAt || new Date().toISOString();
    const nutritionContext = nutritionModel(activeBlocker, schedule, input);
    const decision = {
      version: VERSION,
      operatingDate,
      status,
      authorizedTraining: trainingAuthorized,
      recoveryDay: !activeBlocker && schedule.recoveryDay,
      blocker: activeBlocker,
      readiness,
      nutritionContext,
      requiredEvidence: evidence.required,
      evidence,
      nextAction: { ...nextAction },
      schedule,
      decisionAt: decidedAt,
      sourceState: truth.state || command.state || null
    };
    decision.id = `daily-decision-${operatingDate}-${stableHash({
      version: VERSION,
      status,
      blocker: activeBlocker?.code || null,
      readiness: readiness.classification,
      schedule: schedule.sessions.map((item) => ({ id: item.id, module: item.module, window: item.window })),
      action: decision.nextAction
    })}`;
    return decision;
  }

  function applyToCommand(command = {}, decision = null) {
    if (!decision?.blocker) return { ...command, dailyDecision: decision };
    const blocker = decision.blocker;
    return {
      ...command,
      dailyDecision: decision,
      state: "BLOCKED",
      stateLabel: "ACTION REQUIRED",
      mode: "FIX",
      secured: false,
      closeoutReady: false,
      priority: 110,
      title: blocker.title,
      detail: blocker.detail,
      reason: blocker.reason,
      decision: `${blocker.title} is the first requirement that must be cleared.`,
      after: "Training will unlock only after the complete program agrees.",
      primary: { ...decision.nextAction },
      adjustment: { available: false, active: false, choices: [] },
      facts: {
        duration: "About 3 min",
        window: "NOW",
        confidence: `${decision.readiness.confidence ? `${decision.readiness.confidence}%` : "PROGRAM"} CONFIDENCE`
      },
      context: {
        ...(command.context || {}),
        source: "Signed Contract and required plans",
        conflict: blocker.detail
      }
    };
  }

  function moduleState(decision = null, domain = "training") {
    const normalized = String(domain || "training").toLowerCase();
    if (!decision) return { status: "LOADING", executable: false, progressionAllowed: false, detail: "Checking today's order." };
    if (decision.status === "LOADING") return { status: "LOADING", executable: false, progressionAllowed: false, detail: "Checking today's order.", action: decision.nextAction };
    if (decision.status === "EMPTY") return { status: "NO SCHEDULE", executable: normalized === "nutrition" || normalized === "recovery", progressionAllowed: false, detail: "No operating day is committed yet.", action: decision.nextAction };
    if (decision.blocker && decision.blocker.affectedDomains.includes(normalized)) {
      return { status: "BLOCKED", executable: false, progressionAllowed: false, detail: decision.blocker.detail, action: decision.nextAction };
    }
    if (decision.blocker && normalized === "nutrition") {
      return { status: "PROGRAM BLOCKED", executable: true, progressionAllowed: false, detail: decision.nutritionContext.detail, action: decision.nextAction };
    }
    if (decision.blocker && normalized === "recovery") {
      return { status: "PROTECT", executable: true, progressionAllowed: false, detail: "Recovery remains available while training is protected.", action: decision.nextAction };
    }
    return {
      status: decision.recoveryDay ? "RECOVERY DAY" : decision.status.replaceAll("_", " "),
      executable: normalized === "recovery" || normalized === "nutrition" || decision.authorizedTraining,
      progressionAllowed: decision.authorizedTraining && !decision.readiness.pain,
      detail: decision.recoveryDay ? "No training is authorized today." : "This surface follows today's authoritative order.",
      action: decision.nextAction
    };
  }

  function installExperience(doc) {
    if (!doc || doc.documentElement?.dataset.dailyDecisionUx === VERSION) return false;
    const today = doc.getElementById("today");
    const command = doc.getElementById("one-command");
    if (!today || !command) return false;
    doc.documentElement.dataset.dailyDecisionUx = VERSION;
    const support = doc.createElement("section");
    support.id = "daily-decision-support";
    support.className = "daily-decision-support";
    support.setAttribute("aria-label", "Today's readiness, schedule, and execution");
    support.innerHTML = `
      <article id="daily-decision-readiness" class="daily-decision-brief" data-decision-surface="readiness">
        <span>Readiness</span><strong id="daily-decision-readiness-state">Checking</strong><small id="daily-decision-readiness-detail">Complete Roll Call for today's classification.</small>
      </article>
      <article id="daily-decision-schedule" class="daily-decision-brief" data-decision-surface="schedule">
        <span>Schedule</span><strong id="daily-decision-schedule-state">Checking</strong><small id="daily-decision-schedule-detail">Checking the committed week.</small>
      </article>
      <article id="daily-decision-execution" class="daily-decision-execution" data-decision-surface="execution">
        <div><span>Do or prove</span><strong id="daily-decision-execution-title">Checking today's work</strong><small id="daily-decision-execution-detail">The next evidence action will appear here.</small></div>
        <button type="button" class="ghost" id="daily-decision-execution-action" data-daily-decision-action="OPEN">Open</button>
      </article>`;
    command.insertAdjacentElement("afterend", support);

    const ritual = doc.getElementById("daily-ritual");
    if (ritual) support.insertAdjacentElement("afterend", ritual);
    const why = doc.getElementById("one-command-context");
    if (why) ritual?.insertAdjacentElement("afterend", why);
    const audit = doc.getElementById("today-mission-details");
    if (audit) {
      audit.querySelector("summary span")?.replaceChildren(doc.createTextNode("Technical details"));
      why?.insertAdjacentElement("afterend", audit);
    }
    const more = doc.getElementById("today-more-context");
    const stack = more?.querySelector(".today-more-context-stack");
    ["today-flow-map", "atlas-decision-center", "morning-verification", "adaptive-coaching", "mission-execution", "today-body-checkpoint"].forEach((id) => {
      const node = doc.getElementById(id);
      if (node && stack) stack.appendChild(node);
    });
    return true;
  }

  return Object.freeze({
    VERSION,
    TRAINING_DOMAINS: [...TRAINING_DOMAINS],
    stableHash,
    normalizePlans,
    missingPlanBlocker,
    scheduleModel,
    buildDailyDecision,
    applyToCommand,
    moduleState,
    installExperience
  });
});
