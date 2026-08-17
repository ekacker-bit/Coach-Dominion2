const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const index = read("index.html");
const html = read("app.html");
const app = read("assets/js/app.js");
const daily = read("assets/js/daily-coaching.js");
const ritual = read("assets/js/daily-ritual.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const accountEntry = read("assets/js/account-entry.js");

test("entry offers deliberate sign in and account creation paths", () => {
  assert.match(index, /data-entry-mode="signin"/);
  assert.match(index, /data-entry-mode="signup"/);
  assert.match(index, /id="signup-form"/);
  assert.match(index, /supabase\.auth\.signUp/);
  assert.match(index, /shouldCreateUser: false/);
  assert.match(accountEntry, /\/app#contract/);
});

test("future monetization cannot be self-granted from recruit metadata", () => {
  assert.match(index, /account-entry\.js\?v=029a/);
  assert.match(html, /account-entry\.js\?v=029a/);
  assert.match(app, /DominionAccountEntry\.accountAccess\(session\.user\)/);
  assert.match(css, /\.entry-enrollment-note/);
});

test("Daily Closeout is the final commitment in the Today queue", () => {
  assert.match(daily, /id: "closeout"/);
  assert.match(daily, /action: "open_closeout"/);
  assert.match(daily, /closeoutReady/);
  assert.match(app, /closeoutComplete: readDailyCloseout\(\)\?\.status === "SEALED"/);
  assert.match(app, /if \(action === "open_closeout"\)/);
  assert.match(ritual, /queue\.closeoutReady && !closeoutSealed/);
});

test("new account and Closeout assets are versioned for offline refresh", () => {
  assert.match(worker, /coach-dominion-029a-account-entry-closeout/);
  assert.match(worker, /account-entry\.js\?v=029a/);
  assert.match(worker, /app\.js\?v=[^"\n]*029a/);
});
