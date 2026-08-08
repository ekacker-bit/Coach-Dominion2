
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/js/body-progress.js"), "utf8");
const body = fs.readFileSync(path.join(root, "assets/js/body-composition.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/027_body_progress_photos.sql"), "utf8");

test("Build 022B makes photos part of the existing checkpoint and Trends flow", () => {
  assert.match(html, /data-body-photo-angle="FRONT"/);
  assert.match(html, /data-body-photo-angle="SIDE"/);
  assert.match(html, /data-body-photo-angle="BACK"/);
  assert.match(html, /id="body-photo-progress"/);
  assert.match(html, /id="body-photo-comparison"/);
  assert.match(html, /Only you can open or delete these photos/);
});

test("Build 022B provides a transparent measurement-based estimate", () => {
  assert.match(engine, /const VERSION = "022B\.1"/);
  assert.match(engine, /US_NAVY_CIRCUMFERENCE/);
  assert.match(engine, /Math\.log10/);
  assert.match(engine, /rangeLow/);
  assert.match(html, /Known body fat %/);
  assert.match(app, /Navy circumference method/);
  assert.match(body, /body_fat_estimated/);
  assert.match(body, /body_fat_range_low/);
});

test("Build 022B keeps photos private and account-owned", () => {
  assert.match(migration, /'body-progress-photos'[\s\S]+false/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  assert.match(app, /createSignedUrls\(paths, 3600\)/);
  assert.match(app, /canvas\.toBlob/);
  assert.match(app, /deleteBodyProgressPhoto/);
});

test("Build 022B is responsive and cache-busted", () => {
  assert.match(styles, /Build 022B: private progress photos and body-fat estimate/);
  assert.match(styles, /\.body-photo-comparison/);
  assert.match(styles, /@media \(max-width: 420px\)/);
  assert.match(html, /body-progress\.js\?v=022b/);
  assert.match(html, /body-composition\.js\?v=022b/);
  assert.match(html, /styles\.css\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghi]))/);
  assert.match(html, /app\.js\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghi]))/);
  assert.match(worker, /coach-dominion-(?:022[b-g]|(?:023[abcdef]|024[abcdefghi]))-v1/);
  assert.match(worker, /body-progress\.js\?v=022b/);
});

console.log("Build 022B integration tests passed.");