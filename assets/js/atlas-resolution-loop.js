(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasResolutionLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025X.1";
  const PROMPTS = Object.freeze({
    TIMING: Object.freeze({
      question: "When should this call fit?",
      options: Object.freeze([
        { code: "LATER_TODAY", label: "Later today", detail: "Review the same source later today.", outcome: "OPEN_SOURCE" },
        { code: "NEXT_WINDOW", label: "Next available window", detail: "Record a schedule constraint before source review.", outcome: "OPEN_SOURCE", constraintType: "SCHEDULE" },
        { code: "KEEP_CURRENT", label: "Keep current prescription", detail: "Review the source and preserve the approved plan.", outcome: "OPEN_SOURCE" }
      ])
    }),
    CONSTRAINT: Object.freeze({
      question: "What constraint is Atlas missing?",
      options: Object.freeze([
        { code: "SCHEDULE", label: "Schedule", detail: "Available days, time, or training window.", outcome: "OPEN_SOURCE", constraintType: "SCHEDULE" },
        { code: "EQUIPMENT", label: "Equipment", detail: "The required setup is unavailable.", outcome: "OPEN_SOURCE", constraintType: "EQUIPMENT" },
        { code: "RECOVERY", label: "Recovery", detail: "Fatigue or recovery capacity changes the fit.", outcome: "OPEN_SOURCE", constraintType: "RECOVERY" },
        { code: "INJURY", label: "Injury or pain", detail: "A safety constraint requires source review.", outcome: "OPEN_SOURCE", constraintType: "INJURY" },
        { code: "FOOD", label: "Food or fueling", detail: "Access, preference, or timing changes the fit.", outcome: "OPEN_SOURCE", constraintType: "FOOD" }
      ])
    }),
    EVIDENCE_DISPUTED: Object.freeze({
      question: "Which source evidence looks wrong?",
      options: Object.freeze([
        { code: "RESULT", label: "Workout or result", detail: "Review recorded execution evidence.", outcome: "OPEN_SOURCE" },
        { code: "PROGRAM", label: "Active program", detail: "Review the approved plan revision.", outcome: "OPEN_SOURCE" },
        { code: "PROFILE", label: "Recruit profile", detail: "Review Contract and profile evidence.", outcome: "OPEN_SOURCE" }
      ])
    }),
    PREFER_HOLD: Object.freeze({
      question: "What should Atlas protect?",
      options: Object.freeze([
        { code: "CONFIRM_HOLD", label: "Hold the current plan", detail: "Keep the approved prescription unchanged.", outcome: "OPEN_SOURCE" },
        { code: "REVIEW_FIRST", label: "Review the source first", detail: "Open the canonical source before deciding.", outcome: "OPEN_SOURCE" }
      ])
    })
  });

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function buildPrompt(feedback = {}, decision = {}) {
    const reason = String(feedback.reasonCode || "").toUpperCase();
    const template = PROMPTS[reason];
    if (!template || !feedback.id || !decision.fingerprint) throw new Error("Recorded feedback and its open decision are required.");
    return {
      version: VERSION,
      id: `atlas-resolution-prompt-${stableHash(`${feedback.id}:${decision.fingerprint}`)}`,
      type: "ATLAS_RESOLUTION_PROMPT",
      status: "AWAITING_RESPONSE",
      feedbackId: feedback.id,
      decisionId: decision.id,
      decisionFingerprint: decision.fingerprint,
      reasonCode: reason,
      question: template.question,
      options: template.options.map((item) => ({ ...item })),
      safeguard: "Your answer records context only. The open decision and approved program remain unchanged."
    };
  }

  function resolvePrompt(prompt = {}, answerCode = "", options = {}) {
    if (prompt.status !== "AWAITING_RESPONSE" || !prompt.decisionFingerprint) throw new Error("An open Atlas resolution prompt is required.");
    const answer = (prompt.options || []).find((item) => item.code === String(answerCode || "").toUpperCase());
    if (!answer) throw new Error("Choose one response before continuing.");
    const recordedAt = options.recordedAt || new Date().toISOString();
    const note = String(options.note || "").replace(/\s+/g, " ").trim().slice(0, 240);
    return {
      version: VERSION,
      id: `atlas-resolution-${stableHash(`${prompt.id}:${answer.code}:${recordedAt}`)}`,
      type: "ATLAS_RESOLUTION",
      status: "RESOLVED",
      promptId: prompt.id,
      feedbackId: prompt.feedbackId,
      decisionId: prompt.decisionId,
      decisionFingerprint: prompt.decisionFingerprint,
      answerCode: answer.code,
      answerLabel: answer.label,
      outcome: answer.outcome,
      detail: answer.detail,
      constraintDraft: answer.constraintType ? { type: answer.constraintType, note: note || `${answer.label} constraint for ${prompt.decisionId}`, sourceFeedbackId: prompt.feedbackId, decisionId: prompt.decisionId } : null,
      recordedAt,
      userId: options.userId || null,
      safeguard: "Atlas recorded the response and will open the canonical source. No approved plan was changed."
    };
  }

  return Object.freeze({ VERSION, PROMPTS, buildPrompt, resolvePrompt, stableHash });
});
