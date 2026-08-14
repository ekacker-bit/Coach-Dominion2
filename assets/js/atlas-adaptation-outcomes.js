(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasAdaptationOutcomes = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026H.1";
  const RESPONSES = new Set(["KEEP_LESSON", "CHALLENGE"]);
  const TERMINAL = new Set(["COMPLETE", "COMPLETED", "SECURED", "PARTIAL", "STOPPED", "PAIN_HOLD", "HELD"]);
  const SUCCESS = new Set(["COMPLETE", "COMPLETED", "SECURED"]);

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

  function stableHash(value = "") {
    const source = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function readinessState(item = {}) {
    const supplied = upper(item.state || item.classification);
    if (["GREEN", "YELLOW", "RED"].includes(supplied)) return supplied;
    if (item.pain === true || Number(item.energy) <= 3 || Number(item.soreness) >= 9) return "RED";
    if (Number(item.energy) <= 5 || Number(item.soreness) >= 7) return "YELLOW";
    return "GREEN";
  }

  function readinessScore(state = "") {
    return ({ RED: 1, YELLOW: 2, GREEN: 3 })[upper(state)] || 0;
  }

  function normalizeReadiness(history = [], proposal = {}) {
    const effectiveDate = dateIso(proposal.effectiveDate);
    const reviewDate = dateIso(proposal.reviewDate);
    const days = (Array.isArray(history) ? history : [])
      .filter((item) => dateIso(item?.date) && item.date >= effectiveDate && item.date <= reviewDate)
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))
      .map((item) => ({
        date: dateIso(item.date),
        state: readinessState(item),
        energy: Number.isFinite(Number(item.energy)) ? Number(item.energy) : null,
        soreness: Number.isFinite(Number(item.soreness)) ? Number(item.soreness) : null,
        pain: item.pain === true
      }));
    const baseline = proposal.readiness?.latest || null;
    const latest = days.at(-1) || null;
    const baselineState = baseline ? readinessState(baseline) : null;
    return {
      baseline: baseline ? { ...baseline, state: baselineState } : null,
      latest,
      days: days.length,
      greenDays: days.filter((item) => item.state === "GREEN").length,
      redDays: days.filter((item) => item.state === "RED").length,
      painDays: days.filter((item) => item.pain).length,
      delta: latest && baselineState ? readinessScore(latest.state) - readinessScore(baselineState) : null
    };
  }

  function normalizeExecution(evidenceByDate = [], proposal = {}) {
    const records = (Array.isArray(evidenceByDate) ? evidenceByDate : []).map((record) => {
      const day = (proposal.days || []).find((item) => item.date === dateIso(record.date)) || {};
      const recoveryOnly = ["PROTECT", "RECOVER"].includes(upper(day.directiveCode));
      const expected = recoveryOnly ? 0 : (day.activities || []).length;
      const receipts = (Array.isArray(record.receipts) ? record.receipts : []).map((item) => ({
        state: upper(item.state),
        painReported: item.painReported === true
      }));
      return {
        date: dateIso(record.date),
        expected,
        terminal: receipts.filter((item) => TERMINAL.has(item.state)).length,
        successful: receipts.filter((item) => SUCCESS.has(item.state)).length,
        held: receipts.filter((item) => item.painReported || ["PAIN_HOLD", "HELD", "STOPPED"].includes(item.state)).length,
        closeoutSealed: upper(record.closeout?.status) === "SEALED" || Boolean(record.closeout?.sealedAt || record.closeout?.updatedAt)
      };
    });
    const expected = records.reduce((total, item) => total + item.expected, 0);
    const successful = records.reduce((total, item) => total + item.successful, 0);
    const terminal = records.reduce((total, item) => total + item.terminal, 0);
    return {
      days: records.length,
      expected,
      successful,
      terminal,
      held: records.reduce((total, item) => total + item.held, 0),
      closeouts: records.filter((item) => item.closeoutSealed).length,
      rate: expected ? Math.min(1, successful / expected) : null,
      records
    };
  }

  function confidenceFor(readiness, execution) {
    const independentSignals = (readiness.days ? 1 : 0) + (execution.terminal ? 1 : 0) + (execution.closeouts ? 1 : 0);
    if (readiness.days >= 2 && independentSignals >= 2) return "HIGH";
    if (readiness.days >= 1 && independentSignals >= 2) return "MODERATE";
    return "LOW";
  }

  function verdictFor(proposal, readiness, execution) {
    const applied = ["APPROVED", "AUTO_PROTECTED", "CURRENT"].includes(upper(proposal.status));
    if (!applied) return "NOT_APPLIED";
    if (!readiness.days && !execution.terminal && !execution.closeouts) return "INSUFFICIENT_EVIDENCE";
    const afterWorse = readiness.delta !== null && readiness.delta < 0;
    const unresolvedSafety = readiness.latest?.pain || readiness.latest?.state === "RED" || execution.held > 0;
    if (unresolvedSafety || afterWorse) return "NEEDS_REVIEW";
    const recovered = readiness.delta !== null && readiness.delta > 0;
    const stableGreen = readiness.baseline?.state === "GREEN" && readiness.latest?.state === "GREEN";
    const executionHeld = execution.rate !== null && execution.rate >= 0.67;
    if (upper(proposal.code) === "CURRENT" && stableGreen && executionHeld) return "HELD_STANDARD";
    if (recovered || (["DELOAD", "RECOVER", "PROTECT"].includes(upper(proposal.code)) && readiness.latest?.state === "GREEN")) return "HELPED";
    if (readiness.days >= 1 && (executionHeld || execution.expected === 0) && readiness.delta !== null && readiness.delta >= 0) return "HELPED";
    return "INCONCLUSIVE";
  }

  function copyFor(code, proposal, readiness, execution) {
    const decision = upper(proposal.code);
    if (code === "HELPED") return {
      tone: "green",
      headline: decision === "DELOAD" ? "The short reduction worked" : decision === "PROTECT" ? "Protection did its job" : "The adjustment helped",
      detail: `${readiness.latest?.state || "Updated"} readiness followed the window${execution.successful ? ` with ${execution.successful} secured session${execution.successful === 1 ? "" : "s"}` : ""}.`,
      lesson: decision === "DELOAD" ? "A short reduction can restore readiness without rewriting the plan." : "Use this bounded response again only when the same evidence returns.",
      calibrationTag: decision === "DELOAD" ? "SHORT_REDUCTION_EFFECTIVE" : `${decision}_RESPONSE_EFFECTIVE`
    };
    if (code === "HELD_STANDARD") return {
      tone: "green",
      headline: "Holding the plan was right",
      detail: `Readiness stayed GREEN and ${execution.successful} of ${execution.expected} scheduled sessions were secured.`,
      lesson: "Do not reduce demand when readiness and execution remain stable.",
      calibrationTag: "CURRENT_PLAN_TOLERATED"
    };
    if (code === "NEEDS_REVIEW") return {
      tone: "red",
      headline: "The issue is not resolved",
      detail: readiness.latest?.pain || readiness.latest?.state === "RED" ? "The window ended with a RED or pain signal." : "Readiness or execution worsened during the window.",
      lesson: "Do not repeat this response automatically. Review the next exposure first.",
      calibrationTag: "REVIEW_BEFORE_REPEAT"
    };
    if (code === "NOT_APPLIED") return {
      tone: "neutral",
      headline: "No change was applied",
      detail: "The committed plan stayed in force, so Atlas has no adjustment to judge.",
      lesson: "No coaching lesson recorded.",
      calibrationTag: null
    };
    if (code === "INCONCLUSIVE") return {
      tone: "yellow",
      headline: "The result is not clear yet",
      detail: "Some evidence arrived, but it does not show whether the adjustment helped.",
      lesson: "Collect the next Roll Call and finish the execution record before adapting again.",
      calibrationTag: null
    };
    return {
      tone: "neutral",
      headline: "More evidence is needed",
      detail: "No post-window Roll Call, execution receipt, or closeout can verify the result.",
      lesson: "Missing evidence is not failure, but it cannot become coaching memory.",
      calibrationTag: null
    };
  }

  function buildOutcome(input = {}) {
    const proposal = input.proposal || null;
    if (!proposal?.id || !dateIso(proposal.reviewDate)) return null;
    const evaluatedDate = dateIso(input.evaluatedAt || input.date || new Date().toISOString());
    const closed = input.windowClosed === true || Boolean(evaluatedDate && evaluatedDate > proposal.reviewDate);
    if (!closed) return {
      version: VERSION,
      id: `atlas-outcome:${proposal.id}`,
      proposalId: proposal.id,
      sourceDate: proposal.sourceDate,
      effectiveDate: proposal.effectiveDate,
      reviewDate: proposal.reviewDate,
      status: "WAITING",
      code: "WAITING",
      tone: "neutral",
      headline: "Outcome pending",
      detail: `Atlas will close this decision after ${proposal.reviewDate}.`,
      lesson: "No lesson recorded yet.",
      verified: false,
      calibrationEligible: false,
      updatedAt: input.evaluatedAt || new Date().toISOString()
    };
    const readiness = normalizeReadiness(input.readinessHistory, proposal);
    const execution = normalizeExecution(input.evidenceByDate, proposal);
    const code = verdictFor(proposal, readiness, execution);
    const confidence = confidenceFor(readiness, execution);
    const copy = copyFor(code, proposal, readiness, execution);
    const verified = ["HELPED", "HELD_STANDARD", "NEEDS_REVIEW"].includes(code) && confidence !== "LOW";
    const fingerprint = stableHash({ proposalId: proposal.id, code, readiness, execution });
    const prior = input.priorOutcome || null;
    const preservedStatus = prior?.fingerprint === fingerprint && ["ACKNOWLEDGED", "CHALLENGED"].includes(prior.status) ? prior.status : "READY";
    const now = input.evaluatedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `atlas-outcome:${proposal.id}`,
      proposalId: proposal.id,
      sourceDate: proposal.sourceDate,
      effectiveDate: proposal.effectiveDate,
      reviewDate: proposal.reviewDate,
      status: preservedStatus,
      code,
      tone: copy.tone,
      headline: copy.headline,
      detail: copy.detail,
      lesson: copy.lesson,
      calibrationTag: copy.calibrationTag,
      confidence,
      verified,
      calibrationEligible: verified && Boolean(copy.calibrationTag),
      readiness,
      execution,
      evidenceSummary: `${readiness.days} Roll Call${readiness.days === 1 ? "" : "s"} | ${execution.terminal} execution receipt${execution.terminal === 1 ? "" : "s"} | ${execution.closeouts} closeout${execution.closeouts === 1 ? "" : "s"}`,
      fingerprint,
      generatedAt: prior?.generatedAt || now,
      updatedAt: prior?.fingerprint === fingerprint ? prior.updatedAt || now : now,
      acknowledgedAt: preservedStatus === "ACKNOWLEDGED" ? prior.acknowledgedAt : null,
      challengedAt: preservedStatus === "CHALLENGED" ? prior.challengedAt : null,
      challengeReason: preservedStatus === "CHALLENGED" ? prior.challengeReason : null,
      challengeNote: preservedStatus === "CHALLENGED" ? prior.challengeNote : null
    };
  }

  function resolveOutcome(outcome = {}, response = "KEEP_LESSON", context = {}) {
    const choice = upper(response);
    if (!RESPONSES.has(choice)) throw new Error("Choose Keep lesson or This feels wrong.");
    if (outcome.status === "WAITING") throw new Error("This outcome is not ready yet.");
    const now = context.resolvedAt || new Date().toISOString();
    if (choice === "CHALLENGE") return {
      ...outcome,
      status: "CHALLENGED",
      calibrationEligible: false,
      challengedAt: now,
      challengeReason: upper(context.reason || "OUTCOME_MISMATCH"),
      challengeNote: text(context.note).slice(0, 240),
      updatedAt: now
    };
    if (!outcome.verified || !outcome.calibrationTag) throw new Error("Atlas needs a verified result before keeping a lesson.");
    return { ...outcome, status: "ACKNOWLEDGED", acknowledgedAt: now, updatedAt: now };
  }

  function calibrationMemory(history = []) {
    const remembered = (Array.isArray(history) ? history : [])
      .filter((item) => item.status === "ACKNOWLEDGED" && item.verified === true && item.calibrationEligible === true && item.calibrationTag)
      .sort((left, right) => String(right.acknowledgedAt || right.updatedAt || "").localeCompare(String(left.acknowledgedAt || left.updatedAt || "")));
    const unique = [];
    remembered.forEach((item) => {
      if (!unique.some((saved) => saved.calibrationTag === item.calibrationTag)) unique.push(item);
    });
    return unique.slice(0, 8).map((item) => ({
      tag: item.calibrationTag,
      lesson: item.lesson,
      sourceOutcomeId: item.id,
      verifiedAt: item.acknowledgedAt
    }));
  }

  function installExperience(doc) {
    if (!doc || doc.documentElement?.dataset.adaptationOutcomesUx === VERSION) return false;
    const outcome = doc.getElementById("atlas-adaptation-outcome");
    const horizon = doc.getElementById("atlas-adaptive-horizon");
    if (!outcome || !horizon) return false;
    doc.documentElement.dataset.adaptationOutcomesUx = VERSION;
    horizon.insertAdjacentElement("afterend", outcome);
    return true;
  }

  return Object.freeze({
    VERSION,
    RESPONSES,
    stableHash,
    normalizeReadiness,
    normalizeExecution,
    buildOutcome,
    resolveOutcome,
    calibrationMemory,
    installExperience
  });
});
