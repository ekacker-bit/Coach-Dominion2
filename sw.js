const CACHE_NAME = "coach-dominion-025c-v1";
const APP_SHELL = [
  "/",
  "/app",
  "/app.html",
  "/manifest.webmanifest",
  "/assets/styles.css?v=025c3",
  "/assets/icons/dominion-mark.svg",
  "/assets/js/connected.js",
  "/assets/js/nutrition-feed.js",
  "/assets/js/programming.js",
  "/assets/js/strength-training.js?v=025g",
  "/assets/js/strength-schedule.js",
  "/assets/js/strength-week-review.js",
  "/assets/js/strength-intelligence.js",
  "/assets/js/strength-block.js",
  "/assets/js/recovery.js",
  "/assets/js/daily-coaching.js",
  "/assets/js/daily-assignment.js",
  "/assets/js/readiness-baselines.js",
  "/assets/js/weekly-plan.js",
  "/assets/js/nutrition-command.js",
  "/assets/js/adaptive-fueling.js",
  "/assets/js/nutrition-intelligence.js",
  "/assets/js/body-progress.js?v=022b",
  "/assets/js/body-composition.js?v=022b",
  "/assets/js/progress-review.js?v=022c",
  "/assets/js/plan-command.js?v=022d",
  "/assets/js/observation-verdict.js?v=022e",
  "/assets/js/daily-closeout.js?v=022f",
  "/assets/js/nutrition-baseline.js",
  "/assets/js/nutrition-review.js",
  "/assets/js/meal-coaching.js",
  "/assets/js/intermittent-fasting.js?v=023d",
  "/assets/js/fasting-execution.js?v=023d",
  "/assets/js/fuel-calendar.js?v=023b",
  "/assets/js/today-nutrition.js",
  "/assets/js/meal-execution.js?v=023f",
  "/assets/js/fuel-closed-loop.js?v=023f",
  "/assets/js/fuel-command.js?v=023f",
  "/assets/js/running-command.js",
  "/assets/js/core-programming.js?v=013c2",
  "/assets/js/closed-loop.js",
  "/assets/js/adaptive-coaching.js?v=025a",
  "/assets/js/atlas-intervention.js?v=022a",
  "/assets/js/recruit-contract.js?v=024a",
  "/assets/js/contract-experience.js",
  "/assets/js/weekly-orchestrator.js?v=024d",
  "/assets/js/split-day-command.js",
  "/assets/js/contract-activation.js?v=024a",
  "/assets/js/atlas-program.js?v=024f2",
  "/assets/js/atlas-activation.js?v=024m",
  "/assets/js/atlas-program-repair.js?v=024f",
  "/assets/js/program-command.js?v=024c",
  "/assets/js/atlas-adaptive-week.js?v=025a2",
  "/assets/js/atlas-week-autopilot.js?v=024n",
  "/assets/js/mission-execution.js?v=025b",
  "/assets/js/mission-debrief.js?v=025c",
  "/assets/js/mission-recovery.js?v=025d",
  "/assets/js/morning-verification.js?v=025e",
  "/assets/js/contract-integrity.js",
  "/assets/js/contract-autosave.js",
  "/assets/js/mobile-command.js?v=022g",
  "/assets/js/experience-shell.js",
  "/assets/js/daily-ritual.js?v=022f",
  "/assets/js/operating-truth.js",
  "/assets/js/activation-repair.js?v=024f",
  "/assets/js/one-command.js",
  "/assets/js/dominion-continuity.js?v=025f",
  "/assets/js/first-week-orientation.js",
  "/assets/js/app.js?v=025c7"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("coach-dominion-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/app.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const refreshed = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || refreshed;
    })
  );
});
