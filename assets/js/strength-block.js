(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DominionStrengthBlock = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "017G.1";
  const MIN_WEEKS = 4;
  const MAX_WEEKS = 6;
  const PHASES = Object.freeze({
    FOUNDATION: Object.freeze({
      code: "FOUNDATION",
      label: "Foundation",
      detail: "Establish repeatable technique, honest work-set baselines, and a sustainable weekly rhythm.",
      setPolicy: "HOLD",
      setTargetPercent: 100,
      effortCeiling: 7,
      loadRule: "Hold approved working loads. Establish technique-first baselines where load evidence is missing."
    }),
    ACCUMULATION: Object.freeze({
      code: "ACCUMULATION",
      label: "Accumulation",
      detail: "Repeat the approved sessions and accumulate high-quality work without adding unscheduled volume.",
      setPolicy: "HOLD",
      setTargetPercent: 100,
      effortCeiling: 8,
      loadRule: "Hold the approved prescription. Exercise-level progression still requires its separate evidence review."
    }),
    CONSOLIDATION: Object.freeze({
      code: "CONSOLIDATION",
      label: "Consolidation",
      detail: "Reduce one work set per exercise and preserve movement quality before the deload.",
      setPolicy: "REDUCE_ONE",
      setTargetPercent: 80,
      effortCeiling: 7,
      loadRule: "Do not raise load while volume is reduced."
    }),
    DELOAD: Object.freeze({
      code: "DELOAD",
      label: "Deload",
      detail: "Reduce work sets, lower effort, and arrive at the next block recovered rather than detrained.",
      setPolicy: "REDUCE_40_PERCENT",
      setTargetPercent: 60,
      effortCeiling: 6,
      loadRule: "Use the approved load only when it remains comfortably below the effort ceiling; otherwise reduce it."
    })
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function addDays(date, amount) {
    const parsed = dateIso(date);
    if (!parsed) return null;
    const result = new Date(`${parsed}T00:00:00.000Z`);
    result.setUTCDate(result.getUTCDate() + Number(amount || 0));
    return result.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const parsed = dateIso(value);
    if (!parsed) return null;
    const date = new Date(`${parsed}T00:00:00.000Z`);
    const offset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  }

  function normalizeBlockLength(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 5;
    return Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, parsed));
  }

  function phaseCodes(lengthWeeks = 5) {
    const length = normalizeBlockLength(lengthWeeks);
    if (length === 4) return ["FOUNDATION", "ACCUMULATION", "CONSOLIDATION", "DELOAD"];
    if (length === 6) return ["FOUNDATION", "ACCUMULATION", "ACCUMULATION", "ACCUMULATION", "CONSOLIDATION", "DELOAD"];
    return ["FOUNDATION", "ACCUMULATION", "ACCUMULATION", "CONSOLIDATION", "DELOAD"];
  }

  function reviewSignal(intelligence = {}) {
    const fatigueCode = String(intelligence.fatigue?.code || "").toUpperCase();
    const postureCode = String(intelligence.posture?.code || intelligence.status || "BASELINE_REQUIRED").toUpperCase();
    if (fatigueCode === "SAFETY_HOLD" || postureCode === "SAFETY_HOLD") {
      return {
        code: "SAFETY_HOLD",
        label: "Resolve pain hold",
        tone: "red",
        approvalBlocked: true,
        detail: "Recent pain evidence blocks activation of a loaded training block. The draft is preserved for review."
      };
    }
    if (fatigueCode === "DELOAD_REVIEW" || postureCode === "DELOAD_REVIEW") {
      return {
        code: "DELOAD_REVIEW",
        label: "Deload review",
        tone: "yellow",
        approvalBlocked: false,
        detail: "Fatigue evidence supports reviewing recovery before activation. The planned deload remains explicit and no prescription changes automatically."
      };
    }
    if (postureCode === "PLATEAU_REVIEW") {
      return {
        code: "PLATEAU_REVIEW",
        label: "Plateau review",
        tone: "yellow",
        approvalBlocked: false,
        detail: "Stable exercise evidence supports a block review, not an automatic load or volume increase."
      };
    }
    if (postureCode === "BASELINE_REQUIRED" || !Number(intelligence.summary?.workSets || 0)) {
      return {
        code: "BASELINE_REQUIRED",
        label: "Baseline block",
        tone: "neutral",
        approvalBlocked: false,
        detail: "The block will establish work-set baselines. Missing evidence remains neutral."
      };
    }
    return {
      code: "STAY_COURSE",
      label: "Ready to structure",
      tone: "green",
      approvalBlocked: false,
      detail: "Current evidence supports a structured block while all existing progression safeguards remain active."
    };
  }

  function buildWeeks(startDate, lengthWeeks, plan = {}) {
    const start = weekStartIso(startDate);
    const sessionTarget = Math.max(2, Math.min(6, Number(plan.profile?.daysPerWeek || plan.sessions?.length || 3)));
    return phaseCodes(lengthWeeks).map((code, index) => {
      const phase = PHASES[code];
      const weekStart = addDays(start, index * 7);
      return {
        index: index + 1,
        weekStart,
        weekEnd: addDays(weekStart, 6),
        plannedSessions: sessionTarget,
        phase: clone(phase),
        objective: phase.detail,
        setTargetPercent: phase.setTargetPercent,
        effortCeiling: phase.effortCeiling,
        loadRule: phase.loadRule
      };
    });
  }

  function planRequiredDraft(options = {}) {
    return {
      version: VERSION,
      status: "PLAN_REQUIRED",
      createdAt: options.createdAt || new Date().toISOString(),
      startDate: weekStartIso(options.startDate || options.today || new Date().toISOString().slice(0, 10)),
      lengthWeeks: normalizeBlockLength(options.lengthWeeks),
      weeks: [],
      approvalBlocked: true,
      message: "Approve a strength program before creating a training block."
    };
  }

  function buildBlockDraft(plan = {}, intelligence = {}, options = {}) {
    if (String(plan.status || "").toUpperCase() !== "APPROVED" || !plan.id || !Array.isArray(plan.sessions) || !plan.sessions.length) {
      return planRequiredDraft(options);
    }
    const lengthWeeks = normalizeBlockLength(options.lengthWeeks);
    const startDate = weekStartIso(options.startDate || options.today || new Date().toISOString().slice(0, 10));
    const signal = reviewSignal(intelligence);
    const revision = Math.max(1, Number(options.revision || 1));
    const weeks = buildWeeks(startDate, lengthWeeks, plan);
    return {
      version: VERSION,
      id: `strength-block:${plan.id}:${startDate}:r${revision}`,
      status: "DRAFT",
      revision,
      planId: plan.id,
      planRevision: Number(plan.revision || 1),
      createdAt: options.createdAt || new Date().toISOString(),
      startDate,
      endDate: weeks.at(-1).weekEnd,
      lengthWeeks,
      weeks,
      signal,
      approvalBlocked: signal.approvalBlocked,
      sourceIntelligenceVersion: intelligence.version || null,
      sourcePosture: intelligence.posture?.code || intelligence.status || "BASELINE_REQUIRED",
      sourceBlockId: options.sourceBlockId || null,
      message: signal.approvalBlocked
        ? "Draft preserved, but pain evidence must be resolved before activation."
        : `${lengthWeeks}-week block ready for explicit approval.`,
      safeguards: [
        "The approved exercise program is never rewritten by block planning.",
        "No block phase raises load or adds sets automatically.",
        "Consolidation and deload weeks may only reduce prescribed work.",
        "Running and core plans remain independent sources of truth.",
        "The next block is always a draft until explicitly approved."
      ]
    };
  }

  function approveBlock(draft = {}, plan = {}, approvedAt = new Date().toISOString()) {
    if (draft.status !== "DRAFT" || !draft.weeks?.length) throw new Error("A complete strength block draft is required before approval.");
    if (draft.approvalBlocked) throw new Error("Resolve the pain safety hold before activating a loaded strength block.");
    if (plan.status !== "APPROVED" || draft.planId !== plan.id || Number(draft.planRevision || 1) !== Number(plan.revision || 1)) {
      throw new Error("The strength program changed. Rebuild the block against the current approved revision.");
    }
    return clone({
      ...draft,
      status: "ACTIVE",
      approvedAt,
      activatedPlanRevision: Number(plan.revision || 1)
    });
  }

  function reviseBlock(draft = {}, plan = {}, intelligence = {}, changes = {}, changedAt = new Date().toISOString()) {
    if (draft.status !== "DRAFT") throw new Error("Only a draft block can be revised.");
    return buildBlockDraft(plan, intelligence, {
      lengthWeeks: changes.lengthWeeks ?? draft.lengthWeeks,
      startDate: changes.startDate || draft.startDate,
      revision: Number(draft.revision || 1) + 1,
      sourceBlockId: draft.sourceBlockId,
      createdAt: changedAt
    });
  }

  function blockWeekForDate(block = {}, value) {
    const date = dateIso(value);
    if (block.status !== "ACTIVE" || !date || !block.startDate || !block.endDate) {
      return { status: "BLOCK_REQUIRED", week: null, weekIndex: null, label: "No active block" };
    }
    if (date < block.startDate) {
      return { status: "UPCOMING", week: null, weekIndex: null, label: `Starts ${block.startDate}` };
    }
    if (date > block.endDate) {
      return { status: "COMPLETE", week: null, weekIndex: block.lengthWeeks, label: `Block complete ${block.endDate}` };
    }
    const dayOffset = Math.floor((Date.parse(`${date}T00:00:00.000Z`) - Date.parse(`${block.startDate}T00:00:00.000Z`)) / 86400000);
    const weekIndex = Math.floor(dayOffset / 7) + 1;
    const week = block.weeks.find((item) => item.index === weekIndex) || null;
    return {
      status: "ACTIVE",
      week: clone(week),
      weekIndex,
      label: week ? `Week ${weekIndex} of ${block.lengthWeeks} - ${week.phase.label}` : `Week ${weekIndex} of ${block.lengthWeeks}`
    };
  }

  function reducedSets(plannedSets, setPolicy) {
    const sets = Math.max(0, Number(plannedSets || 0));
    if (!sets) return 0;
    if (setPolicy === "REDUCE_ONE") return Math.max(1, sets - 1);
    if (setPolicy === "REDUCE_40_PERCENT") return Math.max(1, Math.ceil(sets * 0.6));
    return sets;
  }

  function applyBlockToPrescription(prescription = {}, block = {}, value) {
    const source = clone(prescription || {});
    const context = blockWeekForDate(block, value || source.date);
    if (context.status !== "ACTIVE" || !context.week) return { ...source, block: context };
    const phase = context.week.phase;
    const exercises = (source.exercises || []).map((item) => {
      const originalSets = Number(item.recommendedSets ?? item.sets ?? 0);
      const recommendedSets = reducedSets(originalSets, phase.setPolicy);
      return {
        ...item,
        recommendedSets,
        blockAdjustment: {
          blockId: block.id,
          weekIndex: context.weekIndex,
          phase: phase.code,
          originalSets,
          recommendedSets,
          loadChanged: false,
          reason: phase.detail
        },
        rationale: `${item.rationale || "Follow the approved prescription."} ${phase.label}: ${phase.detail}`
      };
    });
    return {
      ...source,
      exercises,
      block: {
        ...context,
        blockId: block.id,
        blockRevision: block.revision,
        phase: clone(phase),
        effortCeiling: context.week.effortCeiling,
        loadRule: context.week.loadRule
      }
    };
  }

  function coordinateSchedule(schedule = {}, block = {}) {
    const source = clone(schedule || {});
    return {
      ...source,
      blockId: block.status === "ACTIVE" ? block.id : null,
      assignments: (source.assignments || []).map((assignment) => {
        const context = blockWeekForDate(block, assignment.date);
        return {
          ...assignment,
          blockWeek: context.status === "ACTIVE" ? context.weekIndex : null,
          blockPhase: context.week?.phase?.code || null,
          blockLabel: context.status === "ACTIVE" ? context.label : null
        };
      })
    };
  }

  function endBlock(block = {}, endedAt = new Date().toISOString(), reason = "Block closed by the athlete.") {
    if (block.status !== "ACTIVE") throw new Error("Only an active strength block can be ended.");
    const endedDate = dateIso(endedAt);
    return clone({
      ...block,
      status: "ENDED",
      endedAt,
      outcome: endedDate && block.endDate && endedDate >= block.endDate ? "COMPLETED" : "ENDED_EARLY",
      endReason: reason
    });
  }

  function buildNextBlockDraft(endedBlock = {}, plan = {}, intelligence = {}, options = {}) {
    if (endedBlock.status !== "ENDED") throw new Error("End the current block before drafting the next one.");
    const naturalStart = weekStartIso(addDays(endedBlock.endDate || dateIso(endedBlock.endedAt), 7));
    return buildBlockDraft(plan, intelligence, {
      lengthWeeks: options.lengthWeeks || endedBlock.lengthWeeks,
      startDate: options.startDate || naturalStart,
      revision: 1,
      sourceBlockId: endedBlock.id,
      createdAt: options.createdAt || new Date().toISOString()
    });
  }

  return Object.freeze({
    VERSION,
    MIN_WEEKS,
    MAX_WEEKS,
    PHASES,
    dateIso,
    addDays,
    weekStartIso,
    normalizeBlockLength,
    phaseCodes,
    reviewSignal,
    buildWeeks,
    buildBlockDraft,
    approveBlock,
    reviseBlock,
    blockWeekForDate,
    reducedSets,
    applyBlockToPrescription,
    coordinateSchedule,
    endBlock,
    buildNextBlockDraft
  });
});
