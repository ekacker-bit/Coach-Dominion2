const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const size = (file) => fs.statSync(path.join(root, file)).size;

const html = read("app.html");
const css = read("assets/styles.css");
const app = read("assets/js/app.js");
const worker = read("sw.js");
const failures = [];

function check(label, condition, detail) {
  if (!condition) failures.push(`${label}: ${detail}`);
}

check("app shell", size("app.html") >= 110000, `app.html is only ${size("app.html")} bytes`);
check("application", size("assets/js/app.js") >= 900000, `app.js is only ${size("assets/js/app.js")} bytes`);
check("stylesheet", size("assets/styles.css") >= 255000, `styles.css is only ${size("assets/styles.css")} bytes`);
check("stylesheet lines", css.split("\n").length >= 5500, "responsive stylesheet appears incomplete");
check("responsive rules", css.includes("@media (max-width: 720px)"), "phone breakpoint is missing");
check("brand proportions", css.includes(".dominion-brand-mark") && css.includes("object-fit: contain"), "brand sizing guardrails are missing");
check("product polish", app.includes('document.body.dataset.productPolish = "021O"'), "021O word-diet layer is missing");
check("copy observer", app.includes("startProductPolishObserver"), "dynamic copy cleanup is missing");
check("Atlas intervention", html.includes('id="adaptive-coaching"') && app.includes("DominionAtlasIntervention.buildIntervention"), "022A coaching call is missing");
check("intervention engine", size("assets/js/atlas-intervention.js") >= 7000, "022A intervention engine appears incomplete");
check("stylesheet version", html.includes('/assets/styles.css?v=022a'), "app.html is not using the 022A stylesheet");
check("application version", html.includes('/assets/js/app.js?v=022a'), "app.html is not using the 022A application");
check("cache version", worker.includes('coach-dominion-022a-v1'), "service-worker cache was not rotated");
check("cached stylesheet", worker.includes('/assets/styles.css?v=022a'), "service worker is caching the wrong stylesheet");
check("cached application", worker.includes('/assets/js/app.js?v=022a'), "service worker is caching the wrong application");
check("cached intervention", worker.includes('/assets/js/atlas-intervention.js?v=022a'), "service worker is not caching the intervention engine");

if (failures.length) {
  console.error("Release integrity failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Release integrity passed: ${size("app.html")}B HTML, ${size("assets/js/app.js")}B JS, ${size("assets/styles.css")}B CSS.`);
