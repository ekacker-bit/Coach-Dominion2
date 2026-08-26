"use strict";

const certification = require("../assets/js/daily-loop-certification");
const { scenarios } = require("./real-daily-loop-scenarios");

let failed = false;
for (const scenario of scenarios) {
  const result = certification.evaluate(scenario.build(certification));
  const checks = [
    ["state", result.state, scenario.expect.state],
    ["certified", result.certified, scenario.expect.certified],
    ...(scenario.expect.partial === undefined ? [] : [["partial", result.counts.PARTIAL, scenario.expect.partial]]),
    ...(scenario.expect.missed === undefined ? [] : [["missed", result.counts.MISSED, scenario.expect.missed]])
  ];
  const errors = checks.filter(([, actual, expected]) => actual !== expected);
  if (errors.length) {
    failed = true;
    console.error(`[030S FAIL] ${scenario.id}`, errors.map(([label, actual, expected]) => `${label}: ${actual} != ${expected}`).join("; "));
  } else {
    console.log(`[030S PASS] ${scenario.id}`);
  }
}

if (failed) process.exitCode = 1;
else console.log(`[030S CERTIFIED] ${scenarios.length} daily-loop scenarios passed.`);
