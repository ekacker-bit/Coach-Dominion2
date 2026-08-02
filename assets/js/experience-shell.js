(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionExperienceShell = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021I.1";
  const SECTION_META = Object.freeze({
    today: { label: "Today", mode: "EXECUTE", title: "Command the day", description: "Readiness, orders, and the next action." },
    performance: { label: "Train", mode: "TRAIN", title: "Build capability", description: "Strength, running, core, and the evidence behind the plan." },
    nutrition: { label: "Fuel", mode: "FUEL", title: "Fuel the mission", description: "Targets, intake, and the adjustment that matters now." },
    contract: { label: "Contract", mode: "COMMIT", title: "Define the standard", description: "Your outcome, capacity, commitments, and coordinated week." },
    calendar: { label: "Calendar", mode: "COORDINATE", title: "Command the week", description: "Training windows, recovery, conflicts, and deliberate calendar edits." },
    inspection: { label: "Review", mode: "INSPECT", title: "Inspect the week", description: "Resolve exceptions, learn from the evidence, and decide what changes." },
    trends: { label: "Trends", mode: "LEARN", title: "Read the trajectory", description: "Use finalized evidence to see what is actually changing." },
    standards: { label: "Standards", mode: "CORRECT", title: "Close the loop", description: "Review evidence, decide deliberately, and complete corrective action." },
    rank: { label: "Rank", mode: "ADVANCE", title: "Earn advancement", description: "Promotion follows consistent execution and trusted evidence." },
    record: { label: "Record", mode: "RECORD", title: "Record the truth", description: "Capture what was completed, modified, excused, or missed." },
    connected: { label: "Connections", mode: "CONNECT", title: "Trust the evidence", description: "Bring training and nutrition data into one accountable record." }
  });

  function sectionMeta(section = "today") {
    return SECTION_META[section] || SECTION_META.today;
  }

  function cleanBuildKicker(value = "") {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    const cleaned = text.replace(/^BUILD\s+\d+[A-Z]?\s*\/\/\s*/i, "");
    if (!cleaned) return "DOMINION";
    if (/^DOMINION\s*\/\//i.test(cleaned)) return cleaned;
    return `DOMINION // ${cleaned}`;
  }

  function moduleSection(module = "") {
    return module === "nutrition" ? "nutrition" : ["strength", "running", "core"].includes(module) ? "performance" : "contract";
  }

  function journeyState(input = {}) {
    const signed = Boolean(input.hasApprovedContract && input.contractSigned);
    const activation = String(input.activationStatus || "CONTRACT_REQUIRED").toUpperCase();
    const plansComplete = signed && ["READY_TO_BUILD", "WEEK_READY", "ACTIVE"].includes(activation);
    const weekComplete = signed && activation === "ACTIVE";
    const todayComplete = weekComplete && Boolean(input.hasDailyState);
    const items = [
      { id: "contract", label: "Contract", complete: signed },
      { id: "plans", label: "Plans", complete: plansComplete },
      { id: "week", label: "Week", complete: weekComplete },
      { id: "today", label: "Today", complete: todayComplete }
    ];
    const currentIndex = Math.max(0, items.findIndex((item) => !item.complete));
    return items.map((item, index) => ({ ...item, current: index === currentIndex && !item.complete }));
  }

  function buildMissionState(input = {}) {
    const hasApprovedContract = Boolean(input.hasApprovedContract);
    const contractSigned = Boolean(input.contractSigned);
    const activationStatus = String(input.activationStatus || "CONTRACT_REQUIRED").toUpperCase();
    const readinessState = String(input.readinessState || "").toUpperCase();
    let mission;

    if (!hasApprovedContract || !contractSigned) {
      mission = {
        phase: "COMMIT",
        title: hasApprovedContract ? "Sign the commitment" : "Make the commitment",
        detail: hasApprovedContract ? "Turn the approved Contract into a signed operating vow." : "Define the outcome, the capacity, and the standard you will uphold.",
        actionLabel: hasApprovedContract ? "Sign Contract" : "Build Contract",
        actionSection: "contract"
      };
    } else if (activationStatus === "ACTION_REQUIRED") {
      const section = moduleSection(input.activationNextModule);
      mission = {
        phase: "LINK",
        title: "Finish plan setup",
        detail: "Connect every training and nutrition plan to the signed Contract.",
        actionLabel: section === "contract" ? "Prepare Plans" : `Open ${section === "nutrition" ? "Fuel" : "Training"}`,
        actionSection: section
      };
    } else if (activationStatus === "READY_TO_BUILD") {
      mission = { phase: "PLAN", title: "Build the coordinated week", detail: "The plans are aligned. Turn them into one deliberate seven-day order.", actionLabel: "Build Week", actionSection: "contract" };
    } else if (activationStatus === "WEEK_READY") {
      mission = { phase: "COMMIT", title: "Commit the week", detail: "Review the coordinated schedule, resolve conflicts, and put it into force.", actionLabel: "Commit Week", actionSection: "contract" };
    } else if (!input.hasDailyState) {
      mission = { phase: "REPORT", title: "Complete Morning Roll Call", detail: "Report energy, soreness, pain, and available recovery signals to unlock today.", actionLabel: "Report Now", actionSection: "today" };
    } else if (readinessState === "RED") {
      mission = { phase: "PROTECT", title: "Protect the mission", detail: "Pain or risk changed today’s orders. Follow the restriction before doing more.", actionLabel: "Review Orders", actionSection: "today" };
    } else {
      mission = { phase: "EXECUTE", title: "Execute today’s orders", detail: readinessState === "YELLOW" ? "The mission is active with deliberate reductions." : "The Contract, plans, week, and Daily State are aligned.", actionLabel: "Open Today", actionSection: "today" };
    }

    return {
      version: VERSION,
      ...mission,
      actionHref: `#${mission.actionSection}`,
      journey: journeyState(input)
    };
  }

  return { VERSION, SECTION_META, sectionMeta, cleanBuildKicker, journeyState, buildMissionState };
});
