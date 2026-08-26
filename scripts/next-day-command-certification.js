const { scenarios } = require("./next-day-command-scenarios.js");

let failures = 0;
Object.entries(scenarios).forEach(([name, run]) => {
  const passed = run() === true;
  process.stdout.write(`[030T ${passed ? "PASS" : "FAIL"}] ${name}\n`);
  if (!passed) failures += 1;
});
if (failures) process.exit(1);
process.stdout.write(`[030T CERTIFIED] ${Object.keys(scenarios).length} next-day handoff scenarios passed.\n`);
