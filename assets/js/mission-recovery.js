(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionMissionRecovery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025D.1";
  const COMPLETE = "COMPLETE";

  function text(value = "") {
    return String(value ?? "").trim();
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
    return (hash >>> 0).toString(36);
  }

  function routeForRequirement(requirement = "") {
    const value = text(requirement).toLowerCase();
    if (/pain|roll call/.test(value)) return "ROLL_CALL";
    if (/checkpoint|recheck/.test(value)) return "CHECKPOINT";
    if (/fuel|refuel|protein|meal/.test(value)) return "FUEL";
    if (/sleep|close the day/.test(value)) return "CLOSEOUT";
    if (/next order|continue/.test(value)) return "NEXT";
    return "NONE";
  }

  function normalizedRequirements(decision = {}) {
    const seen = new Set();
    return (Array.isArray(decision.requirements) ? decision.requirements : [])
      .map(text)
      .filter((requirement) => {
        const key = requirement.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }

  function taskKey(label = "") {
    return text(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "recovery";
  }

  function nextTask(order = {}) {
    return (order.tasks || []).find((task) => upper(task.status) !== COMPLETE) || null;
  }

  function progress(order = {}) {
    const tasks = Array.isArray(order.tasks) ? order.tasks : [];
    const completed = tasks.filter((task) => upper(task.status) === COMPLETE).length;
    return {
      completed,
      total: tasks.length,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 100,
      complete: tasks.length === 0 || completed === tasks.length
    };
  }

  function orderStatus(order = {}) {
    const state = progress(order);
    if (state.complete) return COMPLETE;
    if (order.safetyHold === true) return "SAFETY_HOLD";
    return state.completed ? "IN_PROGRESS" : "ACTIVE";
  }

  function buildOrder(input = {}) {
    const debrief = input.debrief || {};
    const decision = input.decision || debrief.coachingDecision || {};
    if (!debrief.id) throw new Error("A secured Mission debrief is required.");
    const requirements = normalizedRequirements(decision);
    if (!requirements.length) throw new Error("Atlas did not issue a recovery requirement.");
    const now = input.now || new Date().toISOString();
    const previous = input.previous?.debriefId === debrief.id ? input.previous : null;
    const fingerprint = stableHash({
      debrief: debrief.fingerprint || debrief.id,
      decision: decision.code,
      requirements
    });
    if (previous?.fingerprint === fingerprint) return previous;
    const previousByKey = new Map((previous?.tasks || []).map((task) => [task.key, task]));
    const id = `mission-recovery:${debrief.id}`;
    const tasks = requirements.map((label, index) => {
      const key = taskKey(label);
      const saved = previousByKey.get(key);
      return saved ? { ...saved, order: index + 1, label, routeAction: routeForRequirement(label) } : {
        id: `${id}:task:${index + 1}:${key}`,
        key,
        order: index + 1,
        label,
        routeAction: routeForRequirement(label),
        status: "PENDING",
        completedAt: null,
        evidence: null
      };
    });
    const order = {
      version: VERSION,
      id,
      type: "MISSION_RECOVERY_ORDER",
      date: debrief.date,
      windowId: debrief.windowId || null,
      windowLabel: debrief.windowLabel || "TODAY",
      debriefId: debrief.id,
      debriefFingerprint: debrief.fingerprint || null,
      coachingCode: decision.code || "RECOVER_COMPLETE",
      headline: decision.headline || "Complete recovery",
      detail: decision.detail || "Secure the recovery order before the next demand.",
      safetyHold: decision.code === "SAFETY_HOLD" || debrief.painReported === true,
      atlasReviewRequired: decision.atlasReviewRequired === true,
      actionAfterComplete: decision.action || "NEXT",
      actionLabelAfterComplete: decision.actionLabel || "Continue",
      tasks,
      fingerprint,
      revision: Math.max(1, Number(previous?.revision || 0) + 1),
      startedAt: previous?.startedAt || now,
      updatedAt: now,
      completedAt: null
    };
    order.status = orderStatus(order);
    if (order.status === COMPLETE) order.completedAt = previous?.completedAt || now;
    return order;
  }

  function completeTask(order = {}, taskId = "", evidence = {}, nowValue = null) {
    if (!order?.id) throw new Error("Recovery order is unavailable.");
    const current = nextTask(order);
    if (!current) return order;
    if (current.id !== taskId) throw new Error("Complete the current recovery action first.");
    const now = nowValue || new Date().toISOString();
    const tasks = (order.tasks || []).map((task) => task.id === taskId ? {
      ...task,
      status: COMPLETE,
      completedAt: task.completedAt || now,
      evidence: {
        type: text(evidence.type) || "RECRUIT_CONFIRMED",
        source: text(evidence.source) || "COACH_DOMINION",
        note: text(evidence.note).slice(0, 160) || null,
        recordedAt: now
      }
    } : task);
    const next = { ...order, tasks, revision: Number(order.revision || 0) + 1, updatedAt: now };
    next.status = orderStatus(next);
    next.completedAt = next.status === COMPLETE ? (order.completedAt || now) : null;
    return next;
  }

  function reopenTask(order = {}, taskId = "", nowValue = null) {
    if (!order?.id) throw new Error("Recovery order is unavailable.");
    const index = (order.tasks || []).findIndex((task) => task.id === taskId);
    if (index < 0) return order;
    const now = nowValue || new Date().toISOString();
    const tasks = order.tasks.map((task, taskIndex) => taskIndex < index ? task : {
      ...task,
      status: "PENDING",
      completedAt: null,
      evidence: null
    });
    const next = { ...order, tasks, revision: Number(order.revision || 0) + 1, updatedAt: now, completedAt: null };
    next.status = orderStatus(next);
    return next;
  }

  function latestRelevant(history = [], today = "") {
    const records = (Array.isArray(history) ? history : [])
      .filter((order) => order?.id && (!today || !order.date || order.date <= today))
      .sort((left, right) => String(right.updatedAt || right.startedAt || "").localeCompare(String(left.updatedAt || left.startedAt || "")));
    const todayOrder = records.find((order) => order.date === today);
    if (todayOrder) return todayOrder;
    return records.find((order) => upper(order.status) !== COMPLETE) || null;
  }

  function upsert(items = [], order = {}, limit = 180) {
    if (!order?.id) return Array.isArray(items) ? items : [];
    return [order, ...(Array.isArray(items) ? items : []).filter((item) => item.id !== order.id)]
      .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))
      .slice(0, limit);
  }

  function summarizeForAtlas(history = [], start = "", end = "") {
    const orders = (Array.isArray(history) ? history : []).filter((order) => (
      order?.date && (!start || order.date >= start) && (!end || order.date <= end)
    ));
    const completed = orders.filter((order) => upper(order.status) === COMPLETE).length;
    return {
      orders: orders.length,
      completed,
      unresolved: Math.max(0, orders.length - completed),
      adherencePercent: orders.length ? Math.round((completed / orders.length) * 100) : null,
      safetyHolds: orders.filter((order) => order.safetyHold === true).length
    };
  }

  return Object.freeze({
    VERSION,
    stableHash,
    routeForRequirement,
    nextTask,
    progress,
    orderStatus,
    buildOrder,
    completeTask,
    reopenTask,
    latestRelevant,
    upsert,
    summarizeForAtlas
  });
});
