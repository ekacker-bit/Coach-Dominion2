(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasDailyCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025O.1";
  const BLOCKING_STATES = new Set(["CONTRACT_REQUIRED", "SIGNATURE_REQUIRED", "PLANS_REQUIRED", "WEEK_REQUIRED", "CONFLICT"]);
  const COMPLETION_STATES = new Set(["EVIDENCE_REQUIRED", "REVIEW_REQUIRED", "ADAPTATION_REQUIRED"]);
  const TERMINAL_STATES = new Set(["SECURED"]);
  const CHOICES = Object.freeze([
    {
      id: "REDUCE_TODAY",
      label: "Shorten today",
      detail: "Reduce today’s training dose by about 25%. The approved program stays intact.",
      result: "Today’s training is shortened. Atlas will keep the main intent and trim the dose."
    },
    {
      id: "MOVE_LATER",
      label: "Move it later",
      detail: "Keep the prescription and move today’s execution window. No future date changes.",
      result: "The order remains active and is marked for later today."
    },
    {
      id: "RECOVERY_ONLY",
      label: "I need recovery",
      detail: "Replace today’s loaded work with recovery. Pain still belongs in Roll Call.",
      result: "Recovery now governs today. The base week remains protected."
    }
  ]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function whole(value = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
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

  function statePriority(state = "") {
    const code = upper(state);
    if (code === "EXECUTION_REQUIRED") return 90;
    if (code === "CONFLICT") return 88;
    if (BLOCKING_STATES.has(code)) return 86;
    if (code === "ROLL_CALL_REQUIRED") return 82;
    if (code === "AUTHORIZATION_REQUIRED") return 78;
    if (code === "EVIDENCE_REQUIRED") return 70;
    if (code === "REVIEW_REQUIRED") return 62;
    if (code === "ADAPTATION_REQUIRED") return 54;
    if (code === "SECURED") return 10;
    return 40;
  }

  function primaryVerb(truth = {}) {
    const state = upper(truth.state);
    const active = (truth.modules || []).find((item) => upper(item.status) === "IN_PROGRESS");
    if (active) return "RESUME";
    if (BLOCKING_STATES.has(state)) return "FIX";
    if (state === "ROLL_CALL_REQUIRED") return "CHECK IN";
    if (state === "AUTHORIZATION_REQUIRED") return "APPROVE";
    if (COMPLETION_STATES.has(state)) return "COMPLETE";
    if (TERMINAL_STATES.has(state)) return "VIEW";
    if (state === "EXECUTION_REQUIRED") return "START";
    return "OPEN";
  }

  function relevantActivity(day = {}, moduleId = null) {
    const activities = Array.isArray(day.activities) ? day.activities : [];
    const moduleCode = upper(moduleId);
    return activities.find((item) => upper(item.module) === moduleCode && !item.tertiary)
      || activities.find((item) => upper(item.module) === moduleCode)
      || activities.find((item) => !item.tertiary)
      || activities[0]
      || null;
  }

  function durationFor(truth = {}, day = {}) {
    const state = upper(truth.state);
    if (BLOCKING_STATES.has(state)) return { minutes: 3, label: "About 3 min", open: false };
    if (state === "ROLL_CALL_REQUIRED") return { minutes: 1, label: "About 1 min", open: false };
    if (["AUTHORIZATION_REQUIRED", "EVIDENCE_REQUIRED", "REVIEW_REQUIRED", "ADAPTATION_REQUIRED"].includes(state)) {
      return { minutes: 2, label: "About 2 min", open: false };
    }
    if (state === "SECURED") return { minutes: 0, label: "Complete", open: false };
    const activity = relevantActivity(day, truth.action?.module);
    const longRun = Boolean(day.longRunUncapped && upper(activity?.module) === "RUNNING");
    if (longRun) return { minutes: null, label: "Open duration", open: true };
    const minutes = whole(activity?.estimatedMinutes || day.estimatedMinutes || 0);
    return { minutes, label: minutes ? `${minutes} min` : "Open duration", open: !minutes };
  }

  function windowFor(truth = {}, day = {}) {
    const activity = relevantActivity(day, truth.action?.module);
    if (activity?.sessionWindow) return String(activity.sessionWindow).toUpperCase();
    if (day.twoADay) return "AM / PM";
    if ((day.activities || []).length) return "TODAY";
    return upper(truth.state) === "SECURED" ? "CLOSED" : "NOW";
  }

  function confidenceFor(truth = {}, options = {}) {
    const stages = Array.isArray(truth.stages) ? truth.stages : [];
    const completed = new Set(stages.filter((item) => item.complete).map((item) => item.id));
    const contradictions = Array.isArray(truth.contradictions) ? truth.contradictions : [];
    const blocking = contradictions.filter((item) => upper(item.severity) === "BLOCKING").length;
    let score = 20;
    if (completed.has("contract")) score += 18;
    if (completed.has("plans")) score += 18;
    if (completed.has("week")) score += 18;
    if (options.readinessComplete) score += 14;
    if (options.continuityCurrent !== false) score += 8;
    if (!blocking) score += 4;
    if (BLOCKING_STATES.has(upper(truth.state))) score = Math.max(score, 82);
    score = Math.max(0, Math.min(100, Math.round(score)));
    return {
      score,
      label: score >= 80 ? "HIGH" : score >= 55 ? "MODERATE" : "LOW",
      sourceCount: completed.size + (options.readinessComplete ? 1 : 0) + (options.continuityCurrent !== false ? 1 : 0),
      blockerCount: blocking
    };
  }

  function reasonFor(truth = {}, activity = null) {
    const state = upper(truth.state);
    if (state === "EXECUTION_REQUIRED" && activity) {
      return `${activity.title || truth.action?.module || "The next assignment"} is the highest-priority unfinished order in the approved week.`;
    }
    if (BLOCKING_STATES.has(state)) return "Program integrity comes before execution. Atlas found the first issue that blocks a trustworthy day.";
    if (state === "ROLL_CALL_REQUIRED") return "Current readiness is required before Atlas can safely authorize the approved schedule.";
    if (state === "AUTHORIZATION_REQUIRED") return "The schedule is ready. Your approval fixes the exact order Atlas will verify.";
    if (state === "EVIDENCE_REQUIRED") return "The work is not closed until the execution record proves what happened.";
    if (state === "REVIEW_REQUIRED") return "Every assigned domain is reconciled. Seal the day so the evidence can inform the next exposure.";
    if (state === "ADAPTATION_REQUIRED") return "Today’s lesson is ready for a deliberate, bounded decision.";
    if (state === "SECURED") return "Execution, evidence, and review agree. No further action is required today.";
    return truth.detail || "Atlas ranked the next unfinished requirement in the operating chain.";
  }

  function canAdjust(truth = {}) {
    if (upper(truth.state) !== "EXECUTION_REQUIRED") return false;
    const moduleId = upper(truth.action?.module);
    if (!["STRENGTH", "RUNNING", "CORE"].includes(moduleId)) return false;
    return !(truth.modules || []).some((item) => upper(item.status) === "IN_PROGRESS");
  }

  function responseApplies(response = null, context = {}) {
    if (!response || response.status !== "ACTIVE") return false;
    if (context.date && response.date !== context.date) return false;
    if (context.contractRevision && Number(response.contractRevision || 0) !== Number(context.contractRevision)) return false;
    if (context.weekRevision && Number(response.weekRevision || 0) !== Number(context.weekRevision)) return false;
    return true;
  }

  function responseDirective(response = null, context = {}) {
    if (!responseApplies(response, context) || !response.directive) return null;
    return JSON.parse(JSON.stringify(response.directive));
  }

  function applyResponse(command = {}, response = null, context = {}) {
    if (!responseApplies(response, context)) return command;
    const choice = CHOICES.find((item) => item.id === response.choiceId);
    if (!choice) return command;
    const adjusted = {
      ...command,
      response,
      title: response.choiceId === "RECOVERY_ONLY"
        ? "Recovery governs today"
        : response.choiceId === "REDUCE_TODAY"
          ? `Shortened: ${command.title}`
          : command.title,
      detail: choice.result,
      reason: `${choice.result} This is a day-only adjustment; the approved program and future calendar remain unchanged.`,
      adjustment: { ...command.adjustment, active: true, label: choice.label, result: choice.result }
    };
    if (response.choiceId === "REDUCE_TODAY" && Number(command.duration?.minutes) > 0) {
      const minutes = Math.max(10, Math.round(command.duration.minutes * 0.75 / 5) * 5);
      adjusted.duration = { minutes, label: `${minutes} min`, open: false };
    }
    if (response.choiceId === "MOVE_LATER") adjusted.window = "LATER TODAY";
    if (response.choiceId === "RECOVERY_ONLY") {
      adjusted.window = "RECOVERY";
      adjusted.duration = { minutes: 20, label: "20 min", open: false };
      adjusted.primary = { action: "MODULE", label: "Open Recovery", section: "today", module: "recovery" };
    }
    return adjusted;
  }

  function buildDailyCommand(input = {}) {
    const truth = input.truth || {};
    const base = input.model || {};
    const day = input.day || {};
    const activity = relevantActivity(day, truth.action?.module);
    const confidence = confidenceFor(truth, input);
    const duration = durationFor(truth, day);
    const window = windowFor(truth, day);
    const verb = primaryVerb(truth);
    const actionLabel = base.primary?.label || truth.action?.label || "Open Today";
    const command = {
      ...base,
      version: VERSION,
      priority: statePriority(truth.state),
      verb,
      title: base.title || truth.title || "Atlas is choosing the next order",
      detail: base.detail || truth.detail || "Reconciling the approved program.",
      primary: {
        ...(base.primary || truth.action || {}),
        label: `${verb} · ${actionLabel.replace(/^(Start|Open|Resume|Complete|Fix|Approve|View)\s+/i, "")}`
      },
      reason: reasonFor(truth, activity),
      decision: `${truth.title || "This order"} outranks the remaining open actions for today.`,
      duration,
      window,
      confidence,
      facts: {
        duration: duration.label,
        window,
        confidence: `${confidence.label} · ${confidence.score}%`
      },
      adjustment: {
        available: canAdjust(truth),
        active: false,
        label: null,
        choices: canAdjust(truth) ? CHOICES.map((item) => ({ ...item })) : []
      },
      orderFingerprint: stableHash({
        date: truth.date || input.date || null,
        state: truth.state || null,
        action: truth.action || null,
        activity: activity ? { id: activity.id, module: activity.module, title: activity.title, minutes: activity.estimatedMinutes } : null,
        contractRevision: input.contractRevision || 0,
        weekRevision: input.weekRevision || 0
      })
    };
    return applyResponse(command, input.response, {
      date: truth.date || input.date,
      contractRevision: input.contractRevision,
      weekRevision: input.weekRevision
    });
  }

  function directiveForChoice(choiceId, date, fingerprint) {
    if (choiceId === "MOVE_LATER") return null;
    const recovery = choiceId === "RECOVERY_ONLY";
    const changes = recovery
      ? [
          ["STRENGTH", "RECOVERY_ONLY", "Remove loaded strength", "Use recovery work only today.", -100, 0],
          ["RUNNING", "RECOVERY_ONLY", "Remove running intensity", "No hard or long running today.", -100, 0],
          ["CORE", "RECOVERY_ONLY", "Use pain-free recovery work", "Remove loaded or provocative core work today.", -100, 0],
          ["FUELING", "HOLD_TARGETS", "Protect the fueling baseline", "Do not compensate by restricting food.", 0, 0],
          ["RECOVERY", "PRIORITIZE", "Prioritize recovery", "Reassess readiness tomorrow.", 0, 0]
        ]
      : [
          ["STRENGTH", "REDUCE_VOLUME", "Reduce strength demand", "Cut work sets by about 25% and load by no more than 10%.", -25, -10],
          ["RUNNING", "REDUCE_VOLUME", "Keep running easy", "Reduce distance by about 20% and remove hard intensity.", -20, 0],
          ["CORE", "REDUCE_VOLUME", "Trim core volume", "Remove one set where possible.", -25, 0],
          ["FUELING", "HOLD_TARGETS", "Hold the fueling baseline", "A shorter session does not authorize calorie restriction.", 0, 0],
          ["RECOVERY", "ADD_WINDOW", "Add recovery margin", "Protect sleep and the next low-demand window.", 0, 0]
        ];
    return {
      version: VERSION,
      id: `atlas-day-${date}-${fingerprint}-${choiceId.toLowerCase()}`,
      status: "APPROVED",
      code: recovery ? "PROTECT" : "DELOAD",
      effectiveDate: date,
      reviewDate: date,
      planChangesApproved: true,
      changes: changes.map(([domain, action, label, detail, volumeDeltaPercent, loadDeltaPercent]) => ({
        domain,
        action,
        label,
        detail,
        volumeDeltaPercent,
        loadDeltaPercent,
        requiresPlanApproval: false
      }))
    };
  }

  function createResponse(command = {}, choiceId, context = {}) {
    if (!command.adjustment?.available) throw new Error("This order cannot be changed after execution begins.");
    const choice = CHOICES.find((item) => item.id === choiceId);
    if (!choice) throw new Error("Choose one bounded adjustment.");
    const date = String(context.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("A current operating date is required.");
    const now = context.createdAt || new Date().toISOString();
    const fingerprint = command.orderFingerprint || stableHash({ date, state: command.state, title: command.title });
    return {
      version: VERSION,
      id: `atlas-command-response-${date}-${fingerprint}-${choiceId.toLowerCase()}`,
      status: "ACTIVE",
      date,
      choiceId,
      label: choice.label,
      result: choice.result,
      note: String(context.note || "").trim().slice(0, 180),
      commandFingerprint: fingerprint,
      contractId: context.contractId || null,
      contractRevision: whole(context.contractRevision),
      weekId: context.weekId || null,
      weekRevision: whole(context.weekRevision),
      createdAt: now,
      updatedAt: now,
      calendarOverride: {
        status: "DAY_OVERRIDE",
        date,
        label: choice.label,
        detail: choice.result,
        window: choiceId === "MOVE_LATER" ? "LATER" : choiceId === "RECOVERY_ONLY" ? "RECOVERY" : "CURRENT",
        baseWeekId: context.weekId || null,
        baseWeekRevision: whole(context.weekRevision),
        futureWeekChanged: false
      },
      directive: directiveForChoice(choiceId, date, fingerprint)
    };
  }

  function createEvent(command = {}, eventType, context = {}) {
    const occurredAt = context.occurredAt || new Date().toISOString();
    const safeType = upper(eventType || "COMMAND_VIEWED");
    return {
      version: VERSION,
      id: `atlas-command-event-${stableHash({ occurredAt, safeType, fingerprint: command.orderFingerprint || null })}`,
      date: context.date || null,
      eventType: safeType,
      commandState: command.state || null,
      commandFingerprint: command.orderFingerprint || null,
      action: context.action || command.primary?.action || null,
      choiceId: context.choiceId || null,
      occurredAt
    };
  }

  return Object.freeze({
    VERSION,
    BLOCKING_STATES: [...BLOCKING_STATES],
    COMPLETION_STATES: [...COMPLETION_STATES],
    CHOICES: CHOICES.map((item) => ({ ...item })),
    stableHash,
    statePriority,
    primaryVerb,
    relevantActivity,
    durationFor,
    windowFor,
    confidenceFor,
    responseApplies,
    responseDirective,
    buildDailyCommand,
    createResponse,
    createEvent
  });
});
