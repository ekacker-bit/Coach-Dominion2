(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionProgramLifecycle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031A.1";
  const STATE = Object.freeze({
    DRAFT: "DRAFT",
    READY_TO_COMMIT: "READY_TO_COMMIT",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    SUPERSEDED: "SUPERSEDED"
  });
  const LABEL = Object.freeze({
    [STATE.DRAFT]: "DRAFT",
    [STATE.READY_TO_COMMIT]: "READY TO COMMIT",
    [STATE.ACTIVE]: "ACTIVE",
    [STATE.COMPLETED]: "COMPLETED",
    [STATE.SUPERSEDED]: "SUPERSEDED"
  });
  const TONE = Object.freeze({
    [STATE.DRAFT]: "neutral",
    [STATE.READY_TO_COMMIT]: "yellow",
    [STATE.ACTIVE]: "green",
    [STATE.COMPLETED]: "green",
    [STATE.SUPERSEDED]: "neutral"
  });
  const NEXT_WEEK_STATE = Object.freeze({
    NOT_GENERATED: "NOT_GENERATED",
    DRAFT: "DRAFT",
    READY_TO_COMMIT: "READY_TO_COMMIT",
    COMMITTED: "COMMITTED",
    ACTIVE: "ACTIVE",
    FINALIZED: "FINALIZED"
  });

  function normalizedStatus(value) {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function validDraftWeek(draft = {}) {
    draft = draft || {};
    return Array.isArray(draft.days) && draft.days.length === 7 && draft.approvalBlocked !== true;
  }

  function derive(input = {}) {
    const receiptStatus = normalizedStatus(input.receiptStatus);
    const canonicalState = normalizedStatus(input.canonicalState || input.canonical?.lifecycle?.program);
    const weekEnd = Date.parse(input.weekEnd || input.committedWeek?.end || input.committedWeek?.weekEnd || "");
    const today = Date.parse(input.today || new Date().toISOString().slice(0, 10));
    const superseded = ["REPLACED", "SUPERSEDED"].includes(receiptStatus)
      || ["REPLACED", "SUPERSEDED"].includes(canonicalState);
    const completed = !superseded && (
      [receiptStatus, canonicalState].includes("COMPLETED")
      || (Number.isFinite(weekEnd) && Number.isFinite(today) && weekEnd < today)
    );
    const active = !superseded && !completed && Boolean(
      input.contractApproved && (input.committedWeek || canonicalState === "ACTIVE")
    );
    const ready = !superseded && !completed && !active && Boolean(
      input.contractApproved && input.plansApproved && validDraftWeek(input.draftWeek) && input.blocked !== true
    );
    const state = superseded
      ? STATE.SUPERSEDED
      : completed
        ? STATE.COMPLETED
        : active
          ? STATE.ACTIVE
          : ready
            ? STATE.READY_TO_COMMIT
            : STATE.DRAFT;
    const attention = input.conflict === true
      ? "CHOICE REQUIRED"
      : input.repairRequired === true
        ? "REPAIR REQUIRED"
        : active && input.amendmentDraft === true
          ? "AMENDMENT DRAFT"
          : null;
    return Object.freeze({ state, label: LABEL[state], tone: TONE[state], attention });
  }

  function view(snapshot = {}, surface = "program") {
    const state = snapshot.state || STATE.DRAFT;
    const route = {
      [STATE.DRAFT]: { label: "Continue setup", section: "contract" },
      [STATE.READY_TO_COMMIT]: { label: "Commit coordinated week", section: "calendar" },
      [STATE.ACTIVE]: { label: "Open Today", section: "today" },
      [STATE.COMPLETED]: { label: "Review results", section: "inspection" },
      [STATE.SUPERSEDED]: { label: "Open current program", section: "program" }
    }[state];
    return Object.freeze({
      surface,
      state,
      label: LABEL[state] || LABEL[STATE.DRAFT],
      tone: TONE[state] || TONE[STATE.DRAFT],
      attention: snapshot.attention || null,
      action: route
    });
  }

  function consistent(snapshots = []) {
    const states = (Array.isArray(snapshots) ? snapshots : []).map((item) => item?.state).filter(Boolean);
    return states.length < 2 || new Set(states).size === 1;
  }

  function deriveNextWeek(input = {}) {
    const draft = input.draftWeek || null;
    const committed = input.committedWeek || null;
    const today = String(input.today || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const status = normalizedStatus(committed?.status || input.receiptStatus);
    const active = Boolean(committed?.weekStart && committed?.weekEnd && committed.weekStart <= today && today <= committed.weekEnd && status !== "REPLACED");
    const finalized = Boolean(input.finalized === true || ["FINALIZED", "COMPLETED"].includes(status));
    const state = finalized ? NEXT_WEEK_STATE.FINALIZED
      : active ? NEXT_WEEK_STATE.ACTIVE
        : committed ? NEXT_WEEK_STATE.COMMITTED
          : validDraftWeek(draft) && draft.approvalBlocked !== true ? NEXT_WEEK_STATE.READY_TO_COMMIT
            : draft ? NEXT_WEEK_STATE.DRAFT
              : NEXT_WEEK_STATE.NOT_GENERATED;
    return Object.freeze({ state, label: state.replaceAll("_", " "), actionable: state === NEXT_WEEK_STATE.READY_TO_COMMIT });
  }

  return Object.freeze({
    VERSION,
    STATE,
    LABEL,
    TONE,
    NEXT_WEEK_STATE,
    normalizedStatus,
    validDraftWeek,
    derive,
    view,
    consistent,
    deriveNextWeek
  });
});
