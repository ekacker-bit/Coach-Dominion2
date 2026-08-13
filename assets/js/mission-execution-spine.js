(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionMissionExecutionSpine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026B.1";
  const ACTIVE_STATES = new Set(["IN_PROGRESS", "PAUSED", "EVIDENCE_REQUIRED"]);
  const TERMINAL_STATES = new Set(["SECURED", "PARTIAL", "HELD"]);
  const COMMAND_BLOCKERS = new Set([
    "ASSEMBLING",
    "CONTRACT_REQUIRED",
    "SIGNATURE_REQUIRED",
    "PLANS_REQUIRED",
    "WEEK_REQUIRED",
    "CONFLICT",
    "ROLL_CALL_REQUIRED",
    "AUTHORIZATION_REQUIRED"
  ]);

  function text(value = "") {
    return String(value || "").trim();
  }

  function upper(value = "") {
    return text(value).toUpperCase().replaceAll(" ", "_");
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

  function moduleCode(value = "") {
    const code = upper(value);
    if (["RUN", "CARDIO"].includes(code)) return "RUNNING";
    if (code === "ABS") return "CORE";
    if (["NUTRITION", "FUELING"].includes(code)) return "FUEL";
    return code;
  }

  function canonicalState(record = {}, fallback = "READY") {
    if (record?.painReported === true) return "HELD";
    const state = upper(record?.state || record?.status || fallback);
    if (["COMPLETE", "COMPLETED", "VERIFIED", "CLOSED", "SEALED"].includes(state)) return "SECURED";
    if (state === "PARTIAL") return "PARTIAL";
    if (["PAIN_HOLD", "SAFETY_HOLD", "RECOVERY_ONLY", "STOPPED", "HELD"].includes(state)) return "HELD";
    if (["REVIEW", "VERIFY", "EVIDENCE_REQUIRED"].includes(state)) return "EVIDENCE_REQUIRED";
    if (state === "PAUSED") return "PAUSED";
    if (state === "IN_PROGRESS") return "IN_PROGRESS";
    if (["BLOCKED", "LOCKED"].includes(state)) return "BLOCKED";
    return "READY";
  }

  function assignmentId(item = {}, index = 0) {
    const module = moduleCode(item.module || item.type || "MISSION");
    return text(item.id) || `${module.toLowerCase()}-${index + 1}`;
  }

  function normalizeAssignment(item = {}, index = 0, saved = null) {
    const id = assignmentId(item, index);
    const module = moduleCode(item.module || item.type || "MISSION");
    const record = item.record || {};
    const canonical = canonicalState(record, item.complete ? "SECURED" : item.state || "READY");
    const savedState = saved && saved.id === id ? canonicalState(saved, saved.state) : "READY";
    const state = canonical !== "READY" ? canonical : savedState;
    const blocked = Boolean(item.blocked || item.blockedBy || state === "BLOCKED");
    return {
      id,
      module,
      kind: upper(item.kind || (['FUEL', 'RECOVERY'].includes(module) ? "SUPPORT" : "TRAINING")),
      title: text(item.title || item.label) || `${module.charAt(0)}${module.slice(1).toLowerCase()} assignment`,
      detail: text(item.detail),
      action: text(item.action),
      actionLabel: text(item.actionLabel),
      windowLabel: text(item.windowLabel || item.sessionLabel || item.sessionWindow) || "TODAY",
      estimatedMinutes: Math.max(0, Number(item.estimatedMinutes || 0)),
      order: Math.max(1, Number(item.order || item.sessionOrder || index + 1)),
      state: blocked ? "BLOCKED" : state,
      blocked,
      blockedBy: text(item.blockedBy),
      active: ACTIVE_STATES.has(state),
      terminal: TERMINAL_STATES.has(state),
      secured: ["SECURED", "PARTIAL"].includes(state),
      held: state === "HELD",
      outcome: state === "PARTIAL" ? "PARTIAL" : state === "HELD" ? "PROTECTED" : state === "SECURED" ? "SECURED" : null,
      updatedAt: record.updatedAt || record.completedAt || saved?.updatedAt || null,
      record
    };
  }

  function nextAssignment(assignments = []) {
    return assignments.find((item) => item.state === "IN_PROGRESS")
      || assignments.find((item) => item.state === "PAUSED")
      || assignments.find((item) => item.state === "EVIDENCE_REQUIRED")
      || assignments.find((item) => !item.terminal && !item.blocked)
      || assignments.find((item) => !item.terminal)
      || null;
  }

  function primaryAction(model = {}) {
    const current = model.current;
    if (!current) {
      return model.complete
        ? { code: "COMPLETE", label: "Mission secured", detail: "Every assigned action has durable evidence." }
        : { code: "NONE", label: "No executable order", detail: "Atlas could not find a valid action for today." };
    }
    if (current.blocked) return { code: "BLOCKED", module: current.module, label: "Resolve blocker", detail: current.blockedBy || "Complete the prior action first." };
    if (current.state === "PAUSED") return { code: "RESUME", module: current.module, label: `Resume ${current.module === "RUNNING" ? "cardio" : current.title}`, detail: "Your active work is preserved." };
    if (current.state === "IN_PROGRESS") return { code: "OPEN", module: current.module, label: "Continue mission", detail: "Your live progress is saved." };
    if (current.state === "EVIDENCE_REQUIRED") return { code: "VERIFY", module: current.module, label: "Secure evidence", detail: "Review the completed work once, then advance." };
    if (current.state === "HELD") return { code: "SAFETY", module: current.module, label: "Review safety order", detail: "Safety holds the next loaded action." };
    return { code: "START", module: current.module, label: `Start ${current.title}`, detail: current.detail || `${current.title} is next.` };
  }

  function buildSpine(input = {}) {
    const savedEntries = Array.isArray(input.saved?.entries) ? input.saved.entries : [];
    const assignments = (input.assignments || [])
      .map((item, index) => normalizeAssignment(item, index, savedEntries.find((saved) => saved.id === assignmentId(item, index))))
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
    const secured = assignments.filter((item) => item.secured).length;
    const protectedCount = assignments.filter((item) => item.held).length;
    const current = nextAssignment(assignments);
    const complete = assignments.length > 0 && assignments.every((item) => item.terminal);
    const state = protectedCount ? "PROTECTED" : complete ? "COMPLETE" : current?.active ? "IN_PROGRESS" : assignments.length ? "READY" : "EMPTY";
    const model = {
      version: VERSION,
      date: input.date || new Date().toISOString().slice(0, 10),
      assignments,
      current,
      secured,
      protected: protectedCount,
      total: assignments.length,
      percent: assignments.length ? Math.round(secured / assignments.length * 100) : 0,
      complete,
      state,
      lastSavedAt: input.saved?.updatedAt || null,
      fingerprint: stableHash(assignments.map((item) => ({ id: item.id, state: item.state, updatedAt: item.updatedAt })))
    };
    return { ...model, primary: primaryAction(model) };
  }

  function transition(checkpoint = {}, assignment = {}, action = "OPEN", at = new Date().toISOString()) {
    const code = upper(action);
    const states = { START: "IN_PROGRESS", RESUME: "IN_PROGRESS", PAUSE: "PAUSED", FINISH: "EVIDENCE_REQUIRED", VERIFY: "SECURED", SECURE: "SECURED", HOLD: "HELD", RESTORE: "READY" };
    const nextState = states[code];
    if (!nextState) return checkpoint;
    const id = text(assignment.id);
    if (!id) throw new Error("A mission assignment is required.");
    const entries = Array.isArray(checkpoint.entries) ? [...checkpoint.entries] : [];
    const index = entries.findIndex((item) => item.id === id);
    const previous = index >= 0 ? entries[index] : {};
    const next = {
      ...previous,
      id,
      module: moduleCode(assignment.module),
      title: text(assignment.title),
      state: nextState,
      startedAt: ["START", "RESUME"].includes(code) ? previous.startedAt || at : previous.startedAt || null,
      pausedAt: code === "PAUSE" ? at : previous.pausedAt || null,
      completedAt: ["VERIFY", "SECURE", "HOLD"].includes(code) ? at : previous.completedAt || null,
      updatedAt: at
    };
    if (index >= 0) entries[index] = next;
    else entries.push(next);
    return { ...checkpoint, version: VERSION, date: checkpoint.date || assignment.date, entries, updatedAt: at };
  }

  function buildCheckpoint(spine = {}, previous = null, at = new Date().toISOString()) {
    return {
      version: VERSION,
      id: `mission-spine:${spine.date}`,
      date: spine.date,
      fingerprint: spine.fingerprint,
      state: spine.state,
      currentId: spine.current?.id || null,
      secured: spine.secured,
      total: spine.total,
      entries: spine.assignments.map((item) => ({
        id: item.id,
        module: item.module,
        title: item.title,
        state: item.state,
        startedAt: previous?.entries?.find((saved) => saved.id === item.id)?.startedAt || null,
        completedAt: item.terminal ? item.updatedAt || previous?.entries?.find((saved) => saved.id === item.id)?.completedAt || at : null,
        updatedAt: item.updatedAt || at
      })),
      updatedAt: at
    };
  }

  function applyToCommand(command = {}, spine = null) {
    if (!spine || !spine.current || COMMAND_BLOCKERS.has(upper(command.state)) || command.blocker) return command;
    if (!['EXECUTION_REQUIRED', 'READY', 'IN_PROGRESS'].includes(upper(command.state))) return command;
    const current = spine.current;
    const verb = current.state === "PAUSED" ? "RESUME" : current.state === "IN_PROGRESS" ? "CONTINUE" : current.state === "EVIDENCE_REQUIRED" ? "VERIFY" : "START";
    return {
      ...command,
      verb,
      title: current.title,
      detail: current.detail || spine.primary.detail,
      reason: `${current.title} is the next unfinished action in today\'s approved sequence.`,
      primary: {
        action: "MISSION_SPINE",
        label: `${verb} - ${current.module === "RUNNING" ? "Cardio" : current.module.charAt(0) + current.module.slice(1).toLowerCase()}`,
        section: "today",
        module: current.module.toLowerCase(),
        assignmentId: current.id
      },
      progressLabel: `${spine.secured} of ${spine.total} secured`,
      missionSpine: spine
    };
  }

  return Object.freeze({
    VERSION,
    ACTIVE_STATES,
    TERMINAL_STATES,
    COMMAND_BLOCKERS,
    stableHash,
    moduleCode,
    canonicalState,
    normalizeAssignment,
    buildSpine,
    transition,
    buildCheckpoint,
    applyToCommand
  });
});
