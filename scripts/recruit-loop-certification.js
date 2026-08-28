"use strict";

const scenarios = require("./recruit-loop-scenarios.js");

let passed = true;
for (const [name, run] of Object.entries(scenarios)) {
  try {
    const result = run();
    const valid = name === "SECOND_DEVICE_RESTORES_SAME_CERTIFICATION" ? result.same === true : Boolean(result?.state);
    if (!valid) throw new Error("Scenario returned no certifiable state.");
    process.stdout.write(`[030W PASS] ${name}\n`);
  } catch (error) {
    passed = false;
    process.stderr.write(`[030W FAIL] ${name}: ${error.message}\n`);
  }
}
if (!passed) process.exitCode = 1;
else process.stdout.write(`[030W CERTIFIED] ${Object.keys(scenarios).length} recruit-loop scenarios passed.\n`);
