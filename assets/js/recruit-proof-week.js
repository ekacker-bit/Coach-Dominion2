(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitProofWeek = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031C.1";
  const RECEIPT_TYPE = "RECRUIT_PROOF_WEEK";
  const DAILY_RECEIPT_TYPE = "REAL_ACCOUNT_JOURNEY";
  const DAY_MS = 86400000;

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function isoDate(value = "") {
    const candidate = clean(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }

  function ordinal(value = "") {
    const date = isoDate(value);
    if (!date) return null;
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / DAY_MS;
  }

  function addDays(value, amount = 0) {
    const day = ordinal(value);
    if (day === null) return null;
    return new Date((day + Number(amount || 0)) * DAY_MS).toISOString().slice(0, 10);
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function values(value) {
    return Array.isArray(value) ? value : value == null ? [] : [value];
  }

  function receiptTime(receipt = {}) {
    const parsed = Date.parse(receipt.accountConfirmedAt || receipt.observedAt || receipt.updatedAt || receipt.createdAt || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function appendReceipt(receipts = [], receipt = null, limit = 120) {
    const merged = new Map();
    [...values(receipts), receipt].filter((item) => item?.id).forEach((item) => {
      const current = merged.get(item.id);
      if (!current || receiptTime(item) > receiptTime(current)) merged.set(item.id, item);
    });
    return [...merged.values()]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || clean(left.id).localeCompare(clean(right.id)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  function authority(input = {}) {
    return Object.freeze({
      contractRevision: Number(input.contractRevision || 0),
      programId: clean(input.programId),
      weekId: clean(input.weekId),
      weekStartDate: isoDate(input.weekStartDate || input.weekStart),
      weekEndDate: isoDate(input.weekEndDate || input.weekEnd)
    });
  }

  function authorityMatches(receipt = {}, expected = {}) {
    const actual = receipt.authority || {};
    return Number(actual.contractRevision || 0) === Number(expected.contractRevision || 0)
      && clean(actual.programId) === clean(expected.programId)
      && clean(actual.weekId) === clean(expected.weekId);
  }

  function dailyReceiptFor(receipts = [], date, expected = {}) {
    return values(receipts)
      .filter((item) => item?.type === DAILY_RECEIPT_TYPE)
      .filter((item) => isoDate(item?.authority?.date) === date)
      .filter((item) => authorityMatches(item, expected))
      .sort((left, right) => receiptTime(right) - receiptTime(left))[0] || null;
  }

  function weekReceiptFor(receipts = [], id = "") {
    return values(receipts).find((item) => item?.type === RECEIPT_TYPE && item.id === id) || null;
  }

  function weekDates(expected = {}) {
    const start = ordinal(expected.weekStartDate);
    const end = ordinal(expected.weekEndDate);
    if (start === null || end === null || end - start !== 6) throw new TypeError("Recruit Proof Week requires an exact seven-day week.");
    return Array.from({ length: 7 }, (_, index) => addDays(expected.weekStartDate, index));
  }

  function weekNumber(input = {}, expected = {}) {
    const explicit = Number(input.weekNumber || 0);
    if (explicit > 0) return explicit;
    const start = ordinal(expected.weekStartDate);
    const contractStart = ordinal(input.contractStartDate);
    if (start === null || contractStart === null) return 1;
    return Math.max(1, Math.floor((start - contractStart) / 7) + 1);
  }

  function friendlyDate(value) {
    const date = isoDate(value);
    if (!date) return "the day";
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function buildReceipt(input = {}) {
    const expected = authority(input.authority);
    const dates = weekDates(expected);
    const dailyReceipts = values(input.dailyReceipts).filter(Boolean);
    const dailyReceiptIds = dates.map((date) => dailyReceiptFor(dailyReceipts, date, expected)?.id || null);
    if (dailyReceiptIds.some((id) => !id)) return null;
    const proof = { authority: expected, dailyReceiptIds };
    const fingerprint = stableHash(proof);
    return Object.freeze({
      id: `recruit-proof-week:${expected.weekStartDate}:${fingerprint}`,
      type: RECEIPT_TYPE,
      schemaVersion: VERSION,
      fingerprint,
      authority: expected,
      dailyReceiptIds: Object.freeze(dailyReceiptIds),
      observedAt: clean(input.observedAt || new Date().toISOString())
    });
  }

  function evaluate(input = {}) {
    const expected = authority(input.authority);
    const dates = weekDates(expected);
    const asOfDate = isoDate(input.asOfDate) || expected.weekEndDate;
    const asOf = ordinal(asOfDate);
    const end = ordinal(expected.weekEndDate);
    const localReceipts = values(input.localReceipts);
    const accountReceipts = values(input.accountReceipts);
    const account = input.account || {};
    const pendingWrites = Math.max(0, Number(account.pendingWrites || input.pendingWrites || 0));
    const liveDate = isoDate(input.liveDaily?.date || asOfDate);
    const liveReport = input.liveDaily?.report || null;
    const yesterday = addDays(asOfDate, -1);
    const days = dates.map((date) => {
      const period = ordinal(date) > asOf ? "FUTURE" : "ELAPSED";
      if (period === "FUTURE") return Object.freeze({ date, period, state: "FUTURE", receiptId: null });
      const local = dailyReceiptFor(localReceipts, date, expected);
      const accountReceipt = dailyReceiptFor(accountReceipts, date, expected);
      let state = accountReceipt ? "SECURE" : local ? "PROTECTED" : date === asOfDate ? "OPEN" : "ACTION_REQUIRED";
      let issue = null;
      if (date === liveDate && liveReport?.state === "ACTION_REQUIRED") {
        state = "ACTION_REQUIRED";
        issue = liveReport.firstProblem?.code || "DAILY_PROOF_MISMATCH";
      } else if (date === liveDate && ["PROTECTED", "READY_TO_SAVE"].includes(liveReport?.state)) {
        state = "PROTECTED";
      } else if (date === liveDate && liveReport?.state === "VERIFIED" && accountReceipt) {
        state = "SECURE";
      }
      return Object.freeze({
        date,
        period,
        state,
        issue,
        receiptId: accountReceipt?.id || local?.id || null,
        accountConfirmed: Boolean(accountReceipt)
      });
    });
    const elapsed = days.filter((day) => day.period === "ELAPSED");
    const secure = elapsed.filter((day) => day.state === "SECURE");
    const protectedDays = elapsed.filter((day) => day.state === "PROTECTED");
    const actionDays = elapsed.filter((day) => day.state === "ACTION_REQUIRED");
    const openDays = elapsed.filter((day) => day.state === "OPEN");
    const priorActionDays = actionDays.filter((day) => day.date < asOfDate);
    const priorProblem = priorActionDays.find((day) => day.date === yesterday) || priorActionDays[0] || null;
    const liveProblem = liveReport?.state === "ACTION_REQUIRED" ? liveReport.primaryAction : null;
    let repair = null;
    if (priorProblem) {
      repair = Object.freeze({
        code: "REVIEW_PRIOR_DAY",
        label: priorProblem.date === yesterday ? "Review yesterday" : `Review ${friendlyDate(priorProblem.date)}`,
        section: "today",
        operatingDate: priorProblem.date,
        detail: `${friendlyDate(priorProblem.date)} is missing its account-backed daily proof.`
      });
    } else if (liveProblem) {
      repair = Object.freeze({ ...liveProblem, detail: liveReport.detail || liveReport.firstProblem?.detail || "Today needs review." });
    }
    const weekComplete = asOf >= end;
    const allDaysSecure = secure.length === 7;
    const candidate = weekComplete && allDaysSecure ? buildReceipt({ authority: expected, dailyReceipts: accountReceipts, observedAt: input.observedAt }) : null;
    const localExact = Boolean(candidate && weekReceiptFor(localReceipts, candidate.id));
    const accountExact = Boolean(candidate && weekReceiptFor(accountReceipts, candidate.id));
    const serverConfirmed = account.serverConfirmed === true && Boolean(account.lastVerifiedAt || account.confirmedMutationId || account.confirmedFingerprint);
    let state = "IN_PROGRESS";
    let tone = "neutral";
    let label = "WEEK IN PROGRESS";
    let detail = `${secure.length} of 7 days are secure.`;
    let shouldSave = false;

    if (repair) {
      state = "ACTION_REQUIRED";
      tone = "red";
      label = "REVIEW NEEDED";
      detail = repair.detail;
    } else if (candidate && accountExact && serverConfirmed) {
      state = "VERIFIED";
      tone = "green";
      label = "WEEK SECURE";
      detail = "All seven daily receipts are confirmed by this account.";
    } else if (protectedDays.length || pendingWrites || account.online === false) {
      state = "PROTECTED";
      tone = "yellow";
      label = account.online === false ? "SAVED HERE" : "SECURING";
      detail = `${protectedDays.length || pendingWrites} day${(protectedDays.length || pendingWrites) === 1 ? " is" : "s are"} protected while the account confirms the proof.`;
    } else if (candidate && localExact) {
      state = "PROTECTED";
      tone = "yellow";
      label = "SECURING WEEK";
      detail = "The seven-day chain is protected while the account confirms it.";
    } else if (candidate) {
      state = "READY_TO_SAVE";
      tone = "yellow";
      label = "SECURING WEEK";
      detail = "The seven-day chain is ready for its final account receipt.";
      shouldSave = true;
    } else if (weekComplete && !allDaysSecure) {
      state = "INCOMPLETE";
      tone = "yellow";
      label = "WEEK INCOMPLETE";
      detail = `${secure.length} of 7 days are secure; unknown days remain unscored.`;
    } else if (openDays.length) {
      detail = `${secure.length} of 7 days are secure. Finish today to extend the chain.`;
    }

    return Object.freeze({
      version: VERSION,
      state,
      tone,
      label,
      detail,
      weekNumber: weekNumber(input, expected),
      weekLabel: `Week ${weekNumber(input, expected)}`,
      authority: expected,
      days: Object.freeze(days),
      counts: Object.freeze({
        elapsed: elapsed.length,
        secure: secure.length,
        protected: protectedDays.length,
        open: openDays.length,
        actionRequired: actionDays.length,
        unscored: elapsed.length - secure.length
      }),
      headline: `Week ${weekNumber(input, expected)} · ${secure.length} of 7 days secure`,
      weekComplete,
      allDaysSecure,
      verified: state === "VERIFIED",
      canFinalize: state === "VERIFIED",
      canAdvance: state === "VERIFIED",
      repair,
      candidate,
      shouldSave,
      localExact,
      accountExact,
      pendingWrites
    });
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    DAILY_RECEIPT_TYPE,
    isoDate,
    ordinal,
    addDays,
    stableSerialize,
    stableHash,
    appendReceipt,
    authority,
    authorityMatches,
    dailyReceiptFor,
    weekDates,
    weekNumber,
    friendlyDate,
    buildReceipt,
    evaluate
  });
});
