const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const id of [
  "mobile-command",
  "mobile-sync-state",
  "mobile-command-next",
  "mobile-command-modules",
  "mobile-roll-call-form",
  "mobile-nutrition-form",
  "mobile-install-card",
  "mobile-command-dock"
]) assert.match(html, new RegExp(`id="${id}"`), `missing 018H surface: ${id}`);

assert.match(html, /BUILD 018H \/\/ MOBILE COMMAND/);
assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
assert.match(html, /src="\/assets\/js\/mobile-command\.js"/);
assert.ok(html.indexOf("mobile-command.js") < html.indexOf("app.js"), "mobile engine must load before app integration");

for (const marker of [
  "function renderMobileCommand",
  "function launchMobileModule",
  "function enqueueMobileWrite",
  "async function flushMobilePendingWrites",
  "async function saveMorningRollCallPayload",
  "function registerMobileServiceWorker",
  "beforeinstallprompt"
]) assert.match(app, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(styles, /Build 018H: thumb-first Mobile Command/);
assert.match(styles, /\.mobile-command-modules/);
assert.match(styles, /min-height: 48px/);
assert.match(styles, /env\(safe-area-inset-bottom\)/);

assert.equal(manifest.start_url, "/app#today");
assert.equal(manifest.display, "standalone");
assert.ok(manifest.icons.some((icon) => icon.purpose.includes("maskable")));
assert.match(worker, /coach-dominion-[0-9]{3}[a-z]-v\d+/i);
assert.match(worker, /caches\.open\(CACHE_NAME\)/);
assert.match(worker, /request\.mode === "navigate"/);
assert.match(packageJson, /node tests\/mobile-command\.test\.js/);
assert.match(packageJson, /node tests\/build-018h\.test\.js/);

console.log("Build 018H integration tests passed.");
