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
  "dominion-mission-rail",
  "shell-section-context",
  "shell-rank-badge",
  "shell-mission-phase",
  "shell-mission-heading",
  "shell-mission-detail",
  "shell-mission-action",
  "shell-journey"
]) assert.match(html, new RegExp(`id="${id}"`), `missing 019B shell surface: ${id}`);

assert.match(html, /data-product-shell="019B"/);
assert.match(html, /BUILD 019[BD] \/\//);
assert.match(html, /Coach Dominion home/);
assert.doesNotMatch(html, />War Room<\/h1>/);
assert.doesNotMatch(html, /<h2>Training assignment<\/h2>/);
assert.match(html, /src="\/assets\/js\/experience-shell\.js"/);
assert.ok(html.indexOf("experience-shell.js") < html.indexOf("app.js"), "experience shell must load before app integration");

assert.match(app, /function renderDominionExperienceShell/);
assert.match(app, /DominionExperienceShell\.buildMissionState/);
assert.match(app, /DominionExperienceShell\.cleanBuildKicker/);
assert.match(app, /document\.body\.dataset\.dominionPhase/);
assert.match(app, /renderMobileCommand\(\)[\s\S]*renderDominionExperienceShell\(\)/);

assert.match(styles, /Build 019B: Dominion experience shell/);
assert.match(styles, /\.dominion-mission-rail/);
assert.match(styles, /\.shell-journey/);
assert.match(styles, /\.dominion-brand-mark/);
assert.match(styles, /--dominion-gold/);
assert.match(styles, /prefers-reduced-motion: reduce/);

assert.match(worker, /coach-dominion-019[a-z]-v\d+/);
assert.match(worker, /\/assets\/js\/experience-shell\.js/);
assert.match(packageJson, /node tests\/experience-shell\.test\.js/);
assert.match(packageJson, /node tests\/build-019b\.test\.js/);

console.log("Build 019B Dominion experience shell integration passed.");
