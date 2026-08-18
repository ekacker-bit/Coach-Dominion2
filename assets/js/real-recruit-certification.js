(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRealRecruitCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030A.1";

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
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

  function values(value) {
    return Array.isArray(value) ? value : value === undefined ? [] : [value];
  }

  function evidenceIds(input = {}) {
    return [...new Set(values(input.evidence?.ids).map(clean).filter(Boolean))].sort();
  }

  function containsAll(current = [], expected = []) {
    const available = new Set(current);
    return expected.every((item) => available.has(item));
  }

  function expectationFailures(step = {}, result = {}, receipt = null, records = new Map()) {
    const expect = step.expect || {};
    const failures = [];
    const acceptedStates = values(expect.state);
    if (acceptedStates.length && !acceptedStates.includes(result.state)) failures.push(`state ${result.state || "missing"}; expected ${acceptedStates.join(" or ")}`);
    if (expect.certified !== undefined && result.certified !== expect.certified) failures.push(`certified=${Boolean(result.certified)}; expected ${Boolean(expect.certified)}`);
    if (expect.firstProblemCode !== undefined && clean(result.firstProblem?.code) !== clean(expect.firstProblemCode)) failures.push(`first problem ${result.firstProblem?.code || "none"}; expected ${expect.firstProblemCode || "none"}`);
    if (expect.primaryActionCode !== undefined && clean(result.primaryAction?.code) !== clean(expect.primaryActionCode)) failures.push(`primary action ${result.primaryAction?.code || "none"}; expected ${expect.primaryActionCode || "none"}`);
    Object.entries(expect.stageStates || {}).forEach(([stageId, state]) => {
      const actual = result.stages?.find((item) => item.id === stageId)?.state;
      if (actual !== state) failures.push(`${stageId} stage ${actual || "missing"}; expected ${state}`);
    });
    if (expect.receipt === true && !receipt) failures.push("certification receipt missing");
    if (expect.receipt === false && receipt) failures.push("unexpected certification receipt");
    if (expect.sameReceiptAs) {
      const prior = records.get(expect.sameReceiptAs);
      if (!prior?.receipt?.id || prior.receipt.id !== receipt?.id) failures.push(`receipt differs from ${expect.sameReceiptAs}`);
    }
    if (expect.preserveEvidenceFrom) {
      const prior = records.get(expect.preserveEvidenceFrom);
      if (!prior || !containsAll(evidenceIds(step.input), prior.evidenceIds)) failures.push(`evidence from ${expect.preserveEvidenceFrom} was not preserved`);
    }
    return failures;
  }

  function runScenario(scenario = {}, dependencies = {}) {
    if (!clean(scenario.id)) throw new Error("A scenario id is required.");
    if (!Array.isArray(scenario.steps) || !scenario.steps.length) throw new Error(`${scenario.id} has no checkpoints.`);
    if (typeof dependencies.evaluate !== "function" || typeof dependencies.certificationReceipt !== "function") throw new Error("Journey evaluation dependencies are required.");
    const records = new Map();
    const failures = [];
    const checkpoints = scenario.steps.map((step, index) => {
      const id = clean(step.id || `step-${index + 1}`);
      const result = dependencies.evaluate(step.input || {});
      const receipt = dependencies.certificationReceipt(result, { certifiedAt: step.certifiedAt || `2026-08-18T${String(index).padStart(2, "0")}:00:00.000Z` });
      const record = { id, result, receipt, evidenceIds: evidenceIds(step.input) };
      const stepFailures = expectationFailures(step, result, receipt, records);
      records.set(id, record);
      stepFailures.forEach((detail) => failures.push({ checkpoint: id, detail }));
      return Object.freeze({ id, state: result.state, certified: result.certified, receiptId: receipt?.id || null, failureCount: stepFailures.length });
    });
    const fingerprint = stableHash({ id: scenario.id, checkpoints: checkpoints.map((item) => [item.id, item.state, item.receiptId]) });
    return Object.freeze({
      id: scenario.id,
      label: scenario.label || scenario.id,
      status: failures.length ? "FAILED" : "PASSED",
      passed: failures.length === 0,
      checkpointCount: checkpoints.length,
      checkpoints: Object.freeze(checkpoints),
      failures: Object.freeze(failures),
      fingerprint
    });
  }

  function runSuite(scenarios = [], dependencies = {}) {
    const reports = values(scenarios).map((scenario) => runScenario(scenario, dependencies));
    const failures = reports.flatMap((report) => report.failures.map((failure) => ({ scenario: report.id, ...failure })));
    const checkpointCount = reports.reduce((sum, report) => sum + report.checkpointCount, 0);
    const fingerprint = stableHash(reports.map((report) => [report.id, report.status, report.fingerprint]));
    return Object.freeze({
      version: VERSION,
      status: failures.length ? "FAILED" : "CERTIFIED",
      certified: failures.length === 0 && reports.length > 0,
      scenarioCount: reports.length,
      checkpointCount,
      passedScenarioCount: reports.filter((report) => report.passed).length,
      reports: Object.freeze(reports),
      failures: Object.freeze(failures),
      fingerprint,
      receipt: failures.length ? null : Object.freeze({
        id: `real-recruit-${fingerprint}`,
        type: "REAL_RECRUIT_CERTIFICATION",
        schemaVersion: VERSION,
        scenarioCount: reports.length,
        checkpointCount,
        fingerprint
      })
    });
  }

  return Object.freeze({ VERSION, stableHash, evidenceIds, runScenario, runSuite });
});
