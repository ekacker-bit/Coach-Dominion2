(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionWeeklyAdvancement = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "030M.1";
  const CLOSED_STANDARD_STATES = new Set(["RESOLVED", "DISMISSED", "EXCUSED"]);

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function percent(value) {
    const number = finite(value);
    return number === null ? null : Math.round(number);
  }

  function requirementRatio(requirement = {}) {
    if (requirement.passed) return 1;
    const key = String(requirement.requirement || "");
    if (["unresolved_confirmed_violations", "unresolved_level_two_or_three_violations", "corrective_period"].includes(key)) return 0;
    const actual = finite(requirement.actual);
    const target = finite(requirement.target);
    if (actual === null || target === null) return 0;
    if (target <= 0) return requirement.passed ? 1 : 0;
    return clamp(actual / target, 0, 1);
  }

  function friendlyRequirement(key = "") {
    return ({
      finalized_inspections: "Finalized weeks",
      average_discipline_score: "Weekly execution",
      average_evidence_coverage: "Trusted evidence",
      consecutive_qualifying_weeks: "Qualifying streak",
      mission_domain_score: "Mission execution",
      unresolved_confirmed_violations: "Standards record",
      unresolved_level_two_or_three_violations: "Serious standards record",
      corrective_period: "Corrective period"
    })[key] || String(key).replaceAll("_", " ");
  }

  function buildPromotionGates(eligibility = {}) {
    const requirements = Array.isArray(eligibility.requirements) ? eligibility.requirements : [];
    const byKey = Object.fromEntries(requirements.map((item) => [item.requirement, item]));
    const executionParts = ["average_discipline_score", "mission_domain_score", "consecutive_qualifying_weeks"].map((key) => byKey[key]).filter(Boolean);
    const standardsParts = ["unresolved_confirmed_violations", "unresolved_level_two_or_three_violations", "corrective_period"].map((key) => byKey[key]).filter(Boolean);
    const gate = (id, label, parts) => {
      const present = parts.filter(Boolean);
      const passed = present.length > 0 && present.every((item) => item.passed);
      const progress = present.length ? Math.round(present.reduce((sum, item) => sum + requirementRatio(item), 0) / present.length * 100) : 0;
      const firstFailure = present.find((item) => !item.passed) || null;
      return { id, label, passed, progress, firstFailure, passedCount: present.filter((item) => item.passed).length, totalCount: present.length };
    };
    return [
      gate("HISTORY", "Inspection history", [byKey.finalized_inspections]),
      gate("EXECUTION", "Execution standard", executionParts),
      gate("EVIDENCE", "Evidence standard", [byKey.average_evidence_coverage]),
      gate("STANDARDS", "Standards record", standardsParts)
    ];
  }

  function weeklyPhase(inspection = {}) {
    if (inspection.finalizedAt || inspection.finalized_at) return "FINALIZED";
    if (inspection.canFinalize) return "READY";
    if (inspection.weekComplete === false || inspection.scoreIsProvisional) return "IN_PROGRESS";
    return "INCOMPLETE";
  }

  function buildWeeklyJudgment(input = {}) {
    const inspection = input.inspection || {};
    const eligibility = input.eligibility || {};
    const standards = Array.isArray(input.standards) ? input.standards : [];
    const currentRank = input.currentRank || eligibility.currentRank || "RECRUIT";
    const nextRank = input.nextRank || eligibility.nextRank || null;
    const disciplineTarget = finite(eligibility.target?.minimumAverageDisciplineScore) ?? 0;
    const evidenceTarget = finite(eligibility.target?.minimumAverageEvidenceCoverage) ?? 0;
    const discipline = finite(inspection.score);
    const evidence = finite(inspection.evidenceCoverage);
    const unresolvedStandards = standards.filter((item) => !CLOSED_STANDARD_STATES.has(String(item?.status || "CANDIDATE").toUpperCase())).length;
    const phase = weeklyPhase(inspection);
    const executionPass = discipline !== null && discipline >= disciplineTarget;
    const evidencePass = evidence !== null && evidence >= evidenceTarget;
    const standardsPass = unresolvedStandards === 0;
    const qualifying = phase === "FINALIZED" && executionPass && evidencePass && standardsPass;
    const gates = buildPromotionGates(eligibility);
    const progress = gates.length ? Math.round(gates.reduce((sum, item) => sum + item.progress, 0) / gates.length) : 0;
    const firstGate = gates.find((item) => !item.passed) || null;
    const eligible = eligibility.status === "ELIGIBLE";
    let state = "BUILDING";
    let headline = "The week is still being earned";
    let detail = "Complete the week and record enough evidence for a trustworthy judgment.";
    if (phase === "READY") {
      state = "READY";
      headline = "The week is ready for judgment";
      detail = "Evidence is sufficient. Finalize the week to make the result count toward advancement.";
    } else if (phase === "FINALIZED" && qualifying) {
      state = "EARNED";
      headline = "Qualifying week earned";
      detail = eligible ? `The standard for ${nextRank || "the next rank"} is complete.` : "This week advances the record. Sustained execution earns the next rank.";
    } else if (phase === "FINALIZED") {
      state = "NOT_EARNED";
      headline = "The week did not earn advancement";
      detail = !standardsPass ? "An unresolved standards issue blocks advancement." : !evidencePass ? "The evidence was not strong enough to trust the result." : "Execution finished below the required standard.";
    } else if (phase === "INCOMPLETE") {
      state = "INCOMPLETE";
      headline = "The record is incomplete";
      detail = "Missing evidence is not failure, but it cannot earn advancement.";
    }
    const nextAction = eligible
      ? { code: "PROMOTE", label: `Earn ${nextRank || "next rank"}`, detail: "All promotion gates are complete. Authorize the single-rank advancement.", section: "inspection" }
      : phase === "READY"
        ? { code: "FINALIZE", label: "Finalize the week", detail: "Lock the evidence and make this week count.", section: "inspection" }
        : !standardsPass
          ? { code: "STANDARDS", label: "Resolve the standards issue", detail: "Advancement resumes when the open case is resolved.", section: "standards" }
          : { code: "EXECUTE", label: phase === "FINALIZED" ? "Return to Today" : "Complete the record", detail: firstGate?.firstFailure ? `${friendlyRequirement(firstGate.firstFailure.requirement)} is the first promotion gap.` : "Keep executing the approved program and recording evidence.", section: phase === "FINALIZED" ? "today" : "record" };
    return {
      version: VERSION,
      phase,
      state,
      headline,
      detail,
      qualifying,
      currentRank,
      nextRank,
      promotionStatus: eligibility.status || "BUILDING EVIDENCE",
      promotionProgress: clamp(progress),
      promotionConditions: { passed: gates.filter((item) => item.passed).length, total: gates.length },
      primaryBlocker: firstGate ? firstGate.label : null,
      gates,
      nextAction,
      proof: [
        { id: "EXECUTION", label: "Execution", actual: percent(discipline), target: percent(disciplineTarget), passed: executionPass, pending: discipline === null },
        { id: "EVIDENCE", label: "Evidence", actual: percent(evidence), target: percent(evidenceTarget), passed: evidencePass, pending: evidence === null },
        { id: "STANDARDS", label: "Standards", actual: unresolvedStandards, target: 0, passed: standardsPass, pending: false }
      ]
    };
  }

  function installExperience(documentRef) {
    const doc = documentRef;
    const section = doc?.getElementById?.("inspection");
    if (!section || section.dataset.weeklyAdvancement === VERSION) return false;
    section.className = "card weekly-inspection weekly-judgment scroll-anchor";
    section.setAttribute("aria-labelledby", "weekly-inspection-heading");
    section.dataset.weeklyAdvancement = VERSION;
    section.innerHTML = `
      <header class="weekly-judgment-header">
        <div><span>WEEKLY JUDGMENT</span><h2 id="weekly-inspection-heading">Did you earn the week?</h2><p>Execution. Evidence. Standards. Nothing else counts.</p></div>
        <span id="weekly-status" class="state-pill neutral">CHECKING</span>
      </header>
      <div class="weekly-judgment-controls"><label>Week containing <input id="weekly-date" type="date"></label><button id="inspect-week" type="button" class="ghost">Check week</button></div>
      <p id="weekly-warning" class="status" aria-live="polite"></p>
      <section id="atlas-weekly-reconciliation" class="atlas-weekly-reconciliation" data-weekly-tone="neutral" aria-labelledby="atlas-weekly-reconciliation-heading" aria-live="polite">
        <header><div><span>ATLAS WEEKLY RESULT</span><h3 id="atlas-weekly-reconciliation-heading">The week is still being earned</h3></div><strong>CHECKING</strong></header>
        <p>Atlas is reconciling execution, evidence, standards, and coaching outcomes.</p>
      </section>
      <section class="weekly-verdict" aria-live="polite"><div><span id="weekly-range">&mdash;</span><h3 id="weekly-judgment-headline">Building the judgment</h3><p id="weekly-judgment-detail">Checking this week&rsquo;s evidence.</p></div><strong id="weekly-judgment-state">BUILDING</strong></section>
      <section id="week-execution-certification" class="week-execution-certification-host" aria-label="Week execution certification" aria-live="polite"></section>
      <div id="weekly-proof-grid" class="weekly-proof-grid" aria-label="Weekly proof">
        <article><span>EXECUTION</span><strong id="weekly-score">NOT EVALUATED</strong><small id="weekly-execution-proof">Waiting for evidence</small></article>
        <article><span>EVIDENCE</span><strong id="weekly-coverage">COVERAGE INCOMPLETE</strong><small id="weekly-evidence-proof">Waiting for evidence</small></article>
        <article><span>STANDARDS</span><strong id="weekly-standards-state">CHECKING</strong><small id="weekly-standards-proof">Open cases block advancement</small></article>
      </div>
      <section class="weekly-advancement" aria-labelledby="weekly-advancement-heading">
        <header><div><span>ADVANCEMENT</span><h3 id="weekly-advancement-heading"><strong id="rank-current">RECRUIT</strong><i aria-hidden="true">&rarr;</i><strong id="rank-next">CADET</strong></h3></div><span id="rank-state" class="state-pill neutral">BUILDING EVIDENCE</span></header>
        <div class="weekly-advancement-meter" aria-hidden="true"><span id="weekly-advancement-meter"></span></div>
        <div class="weekly-advancement-copy"><strong id="weekly-advancement-percent">0 of 4 conditions met</strong><p id="weekly-advancement-detail">Finalize trustworthy weeks to begin advancement.</p></div>
        <div id="rank-requirements" class="weekly-advancement-gates"></div>
      </section>
      <section id="dominion-campaign-review" class="dominion-campaign-review" data-campaign-tone="neutral" aria-labelledby="dominion-campaign-review-heading" aria-live="polite">
        <div><span id="dominion-campaign-review-phase">CAMPAIGN // CHECKING</span><h3 id="dominion-campaign-review-heading">Twelve-week campaign</h3><p id="dominion-campaign-review-detail">Atlas is connecting this judgment to the declared outcome.</p></div>
        <div class="dominion-campaign-review-read"><strong id="dominion-campaign-review-forecast">CHECKING</strong><small id="dominion-campaign-review-progress">Campaign not started</small><a href="#program" data-section="program">Open campaign</a></div>
      </section>
      <aside id="weekly-next-action" class="weekly-next-action"><div><span>NEXT ORDER</span><h3 id="weekly-next-action-title">Complete the record</h3><p id="weekly-next-action-detail">Record the week before asking it to prove anything.</p></div><a id="weekly-next-action-link" href="#record" data-section="record">Open Record</a></aside>
      <div class="weekly-judgment-actions"><button id="finalize-week" type="button">Finalize week</button><button id="finalize-promotion" type="button" hidden>Authorize promotion</button><p id="rank-promotion-feedback" role="status" aria-live="polite"></p></div>
      <details class="weekly-proof-detail"><summary>Inspect the proof</summary><div class="weekly-proof-meta"><span>Saved as <strong id="weekly-storage">NOT LOADED</strong></span><span>Evidence through <strong id="weekly-evidence-through">&mdash;</strong></span></div><div id="weekly-domain-scores" class="weekly-domain-scores"></div><div id="weekly-evidence" class="evidence-list"></div><div id="rank-blockers" class="weekly-proof-blockers"></div></details>
      <details id="weekly-closeout-evidence" class="weekly-closeout-evidence"><summary>Daily closeout evidence</summary><div class="weekly-closeout-metrics"><div><span>Days sealed</span><strong id="weekly-closeout-days">0</strong></div><div><span>Average steps</span><strong id="weekly-closeout-steps">&mdash;</strong></div><div><span>Answers captured</span><strong id="weekly-closeout-coverage">0%</strong></div><div><span>Observed adherence</span><strong id="weekly-closeout-adherence">UNSCORED</strong></div></div><div id="weekly-closeout-days-list" class="weekly-closeout-days-list"><span>No daily closeouts in this week.</span></div></details>
      <details class="weekly-promotion-history"><summary>Promotion history</summary><ul id="rank-history" class="feed"><li class="feed-empty">No promotions yet.</li></ul></details>`;
    doc.getElementById("rank")?.remove();
    doc.querySelectorAll('a[data-section="rank"], a[href="#rank"]').forEach((link) => link.remove());
    return true;
  }

  return { VERSION, buildWeeklyJudgment, buildPromotionGates, friendlyRequirement, installExperience };
}));
