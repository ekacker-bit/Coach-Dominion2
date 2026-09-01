(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionReviewYesterday = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031F.1";

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function isoDate(value = "") {
    const candidate = clean(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }

  function friendlyDate(value = "") {
    const date = isoDate(value);
    if (!date) return "Prior day";
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function hasNumber(value) {
    return value !== null && value !== undefined && clean(value) !== "" && Number.isFinite(Number(value));
  }

  function field(id, label, value, options = {}) {
    const known = options.known === true;
    return Object.freeze({
      id,
      label,
      required: options.required === true,
      known,
      state: known ? "KNOWN" : options.conflict ? "CONFLICT" : options.required ? "MISSING" : "UNKNOWN",
      display: known ? clean(options.display == null ? value : options.display) : ""
    });
  }

  function closeoutFields(closeout = null, connectedSteps = null) {
    const discipline = closeout?.discipline || {};
    const processedKnown = ["NONE", "LISTED"].includes(clean(discipline.processedFoodStatus).toUpperCase());
    const fields = [
      field("steps", "Self-reported steps", closeout?.steps?.selfReported, {
        required: true,
        known: hasNumber(closeout?.steps?.selfReported),
        display: hasNumber(closeout?.steps?.selfReported) ? Number(closeout.steps.selfReported).toLocaleString("en-US") : ""
      }),
      field("alcohol", "Alcohol-free", discipline.alcoholAbstained, {
        known: typeof discipline.alcoholAbstained === "boolean",
        display: discipline.alcoholAbstained === true ? "Yes" : discipline.alcoholAbstained === false ? "No" : ""
      }),
      field("masturbation", "Masturbation count", discipline.masturbationCount, {
        known: hasNumber(discipline.masturbationCount)
      }),
      field("fried_food", "Avoided fried food", discipline.friedFoodAvoided, {
        known: typeof discipline.friedFoodAvoided === "boolean",
        display: discipline.friedFoodAvoided === true ? "Yes" : discipline.friedFoodAvoided === false ? "No" : ""
      }),
      field("dessert", "Declined dessert", discipline.dessertDeclined, {
        known: typeof discipline.dessertDeclined === "boolean" || discipline.dessertNotApplicable === true,
        display: discipline.dessertNotApplicable === true ? "Not offered" : discipline.dessertDeclined === true ? "Yes" : discipline.dessertDeclined === false ? "No" : ""
      }),
      field("processed_food", "Processed food", discipline.processedFoodStatus, {
        known: processedKnown,
        display: discipline.processedFoodStatus === "NONE"
          ? "None"
          : (discipline.processedFoods || []).join(", ") || "Listed"
      })
    ];
    const known = fields.filter((item) => item.known);
    const missing = fields.filter((item) => item.state === "MISSING");
    const unknown = fields.filter((item) => item.state === "UNKNOWN");
    const connected = hasNumber(connectedSteps) ? Number(connectedSteps) : null;
    return Object.freeze({
      fields: Object.freeze(fields),
      known: Object.freeze(known),
      missing: Object.freeze(missing),
      unknown: Object.freeze(unknown),
      connectedSteps: connected,
      connectedDetail: connected === null ? null : `${connected.toLocaleString("en-US")} connected steps preserved`
    });
  }

  function journeyBlocker(report = null) {
    const problem = report?.firstProblem
      || (report?.stages || []).find((item) => ["authority", "assignments", "execution", "fuel"].includes(item?.id) && ["ACTION_REQUIRED", "OPEN"].includes(item?.state))
      || null;
    if (!problem) return null;
    return Object.freeze({
      code: clean(problem.code || problem.id || "DAILY_PROOF_BLOCKED"),
      detail: clean(problem.detail || report?.detail || "This day still needs review."),
      action: problem.action || report?.primaryAction || null
    });
  }

  function presentation(input = {}) {
    const date = isoDate(input.date);
    const today = isoDate(input.today);
    if (!date || !today || date >= today) {
      return Object.freeze({
        version: VERSION,
        state: "BLOCKED",
        date,
        dateLabel: friendlyDate(date),
        headline: "Prior-day review unavailable",
        detail: "Choose an elapsed day before today.",
        saveLabel: "Save Yesterday",
        canSave: false,
        fields: closeoutFields(null, null),
        blocker: Object.freeze({ code: "INVALID_REVIEW_DATE", detail: "Choose an elapsed day before today.", action: null })
      });
    }

    const report = input.journey || null;
    const fields = closeoutFields(input.closeout, input.connectedSteps);
    const blocker = journeyBlocker(report);
    const closeoutConfirmed = Boolean(input.closeout?.accountConfirmedAt)
      || input.closeout?.accountConfirmed === true
      || ["VERIFIED", "ACCOUNT_CONFIRMED"].includes(clean(input.closeout?.verificationStatus).toUpperCase());
    const receiptId = clean(report?.candidate?.id);
    let state = "NEEDS_INPUT";
    let headline = `Finish ${friendlyDate(date)}`;
    let detail = fields.missing.length
      ? `${fields.missing.map((item) => item.label).join(", ")} required. Optional unknowns stay unscored.`
      : "Known evidence is loaded. Optional unknowns stay unscored.";
    let canSave = true;

    if (report?.state === "VERIFIED") {
      state = "SAVED";
      headline = `${friendlyDate(date)} is secure`;
      detail = "The exact daily proof is confirmed by this account.";
      canSave = false;
    } else if (report?.state === "PROTECTED") {
      const retryable = Boolean(report.candidate && report.localExact && Number(report.pendingWrites || 0) === 0 && input.online !== false);
      state = retryable ? "READY" : "SAVING";
      headline = retryable ? `Secure ${friendlyDate(date)}` : `${friendlyDate(date)} is protected`;
      detail = retryable
        ? "The proof is saved here but still needs account confirmation. Save once to retry it now."
        : clean(report.detail || "Waiting for account confirmation.");
      canSave = retryable;
    } else if (blocker) {
      state = "BLOCKED";
      headline = `${friendlyDate(date)} needs one repair`;
      detail = blocker.detail;
      canSave = false;
    } else if (fields.missing.length) {
      state = "NEEDS_INPUT";
    } else if (report?.state === "READY_TO_SAVE" || (input.closeout && closeoutConfirmed && receiptId)) {
      state = "READY";
      headline = `Secure ${friendlyDate(date)}`;
      detail = "Everything required is present. One save will confirm the daily proof and refresh the week.";
    } else if (input.closeout) {
      state = "READY";
      headline = `Secure ${friendlyDate(date)}`;
      detail = "Known evidence is loaded. One save will reconcile the account receipt.";
    }

    return Object.freeze({
      version: VERSION,
      state,
      date,
      dateLabel: friendlyDate(date),
      headline,
      detail,
      saveLabel: state === "SAVED" ? "Yesterday Saved" : "Save Yesterday",
      canSave,
      receiptId: receiptId || null,
      fields,
      blocker: state === "BLOCKED" ? blocker : null
    });
  }

  return Object.freeze({ VERSION, isoDate, friendlyDate, closeoutFields, journeyBlocker, presentation });
});
