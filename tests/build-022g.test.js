const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const mobile = read("assets/js/mobile-command.js");
const css = read("assets/styles.css");
const worker = read("sw.js");

test("022G gives the mobile dock five useful destinations", () => {
  assert.match(html, /data-mobile-nav="today" href="#today"/);
  assert.match(html, /data-mobile-nav="train" href="#performance"/);
  assert.match(html, /data-mobile-nav="fuel" href="#nutrition"/);
  assert.match(html, /data-mobile-nav="review" href="#inspection"/);
  assert.match(html, /data-mobile-nav="more"[^>]+aria-controls="mobile-more-dialog"/);
  assert.doesNotMatch(html, /data-mobile-nav="train" href="#today"/);
});

test("022G makes Calendar and the deeper program surfaces reachable from More", () => {
  assert.match(html, /id="mobile-more-dialog"/);
  for (const section of ["calendar", "contract", "trends", "standards", "rank", "record", "connected"]) {
    assert.match(html, new RegExp(`href="#${section}" data-section="${section}"`));
  }
  assert.match(app, /DominionMobileCommand\.resolveMobileDestination\(action\)/);
  assert.match(app, /DominionMobileCommand\.mobileNavForSection\(normalized\)/);
  assert.match(mobile, /const VERSION = "022G\.1"/);
});

test("022G reveals the mobile shell after critical daily state is ready", () => {
  const reveal = app.indexOf("revealMobileShell();");
  const daily = app.indexOf("await loadDailyState();");
  const contract = app.indexOf("await loadRecruitContractState();");
  assert.ok(reveal > daily && reveal < contract, "mobile shell should reveal before secondary program data finishes");
  assert.match(app, /dataset\.mobileHydration = "progressive"/);
  assert.match(app, /dataset\.mobileHydration = "ready"/);
});

test("022G eliminates horizontal status scrolling and protects touch ergonomics", () => {
  assert.match(css, /Build 022G: mobile field app/);
  assert.match(css, /\.status-bar \{\s*display: grid !important;/);
  assert.match(css, /scroll-margin-top: 80px/);
  assert.match(css, /\.mobile-command-bar \[data-mobile-nav\][\s\S]*min-height: 48px/);
  assert.match(css, /input,[\s\S]*font-size: 16px/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test("022G rotates every mutable shell asset", () => {
  assert.match(html, /styles\.css\?v=(?:022g|(?:023[abcdef]|024[abc]))/);
  assert.match(html, /mobile-command\.js\?v=022g/);
  assert.match(html, /app\.js\?v=(?:022g|(?:023[abcdef]|024[abc]))/);
  assert.match(worker, /coach-dominion-(?:022g|(?:023[abcdef]|024[abc]))-v1/);
  assert.match(worker, /styles\.css\?v=(?:022g|(?:023[abcdef]|024[abc]))/);
  assert.match(worker, /mobile-command\.js\?v=022g/);
  assert.match(worker, /app\.js\?v=(?:022g|(?:023[abcdef]|024[abc]))/);
});

console.log("Build 022G Mobile Field App integration verified.");
