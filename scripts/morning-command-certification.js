"use strict";

const { scenarios } = require("./morning-command-scenarios.js");

let failures = 0;
Object.entries(scenarios).forEach(([name, run]) => {
  const passed = run() === true;
  process.stdout.write(`[030U ${passed ? "PASS" : "FAIL"}] ${name}\n`);
  if (!passed) failures += 1;
});
if (failures) process.exit(1);
process.stdout.write(`[030U CERTIFIED] ${Object.keys(scenarios).length} morning activation scenarios passed.\n`);
