"use strict";

const { scenarios } = require("./command-completion-scenarios.js");

let failures = 0;
Object.entries(scenarios).forEach(([name, run]) => {
  const passed = run() === true;
  process.stdout.write(`[030V ${passed ? "PASS" : "FAIL"}] ${name}\n`);
  if (!passed) failures += 1;
});
if (failures) process.exit(1);
process.stdout.write(`[030V CERTIFIED] ${Object.keys(scenarios).length} completion scenarios passed.\n`);
