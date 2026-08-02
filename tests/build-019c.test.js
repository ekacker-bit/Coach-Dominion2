const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const id of [
  "daily-ritual",
  "daily-ritual-eyebrow",
  "daily-ritual-heading",
  "daily-ritual-detail",
  "daily-ritual-state",
  "daily-ritual-milestones",
  "daily-ritual-evidence",
  "daily-ritual-confidence",
  "daily-ritual-total",
  "daily-ritual-streak",
  "daily-ritual-rank",
  "daily-ritual-action",
  "daily-ritual-feedback"
]) assert.match(html, new RegExp(`id="${id}"`), `missing 019C ritual surface: ${id}`);

assert.match(html, /CLOSE THE DAY/);
assert.match(html, /data-daily-ritual-step="execute"/);
assert.match(html, /data-closed-loop-action="continue_execution"/);
assert.match(html, /src="\/assets\/js\/daily-ritual\.js\?v=021n"/);
assert.ok(html.indexOf("daily-ritual.js") < html.indexOf("app.js"), "daily ritual engine must load before app integration");
assert.doesNotMatch(html, /id="onboarding"/);
assert.doesNotMatch(html, /help-onboarding|dismiss-onboarding/);

assert.match(app, /function renderDailyRitual/);
assert.match(app, /DominionDailyRitual\.buildDailyRitual/);
assert.match(app, /readClosedLoopHistory\(\)/);
assert.match(app, /renderDailyRitual\(queue\)/);
assert.match(app, /button\[data-closed-loop-action\]/);
assert.doesNotMatch(app, /onboardingDismissed|renderOnboarding|openOnboarding/);

assert.match(styles, /Build 019C: Daily Seal ceremony/);
assert.match(styles, /\.daily-ritual-seal/);
assert.match(styles, /\.daily-ritual-milestones/);
assert.match(styles, /\.daily-ritual\.is-sealed/);
assert.match(styles, /@keyframes daily-seal-in/);
assert.match(styles, /prefers-reduced-motion: reduce/);

assert.match(worker, /coach-dominion-[0-9]{3}[a-z]-v\d+/i);
assert.match(worker, /\/assets\/js\/daily-ritual\.js/);
assert.match(packageJson, /node tests\/daily-ritual\.test\.js/);
assert.match(packageJson, /node tests\/build-019c\.test\.js/);

console.log("Build 019C Daily Seal integration passed.");

