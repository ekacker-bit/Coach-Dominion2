(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionMealCoaching = api;
}(typeof self !== "undefined" ? self : this, function () {
  const WINDOWS = ["UNSCHEDULED", "MORNING", "MIDDAY", "EVENING"];
  const round5 = (value) => Math.round(Number(value) / 5) * 5;
  const distribute = (total, weights) => {
    if (!(Number(total) > 0)) return weights.map(() => null);
    const values = weights.map((weight) => round5(Number(total) * weight));
    const difference = Number(total) - values.reduce((sum, value) => sum + value, 0);
    values[values.length - 1] += difference;
    return values;
  };

  function slotDefinition(trainingDay, trainingWindow) {
    if (!trainingDay) return {
      labels: ["Breakfast", "Midday meal", "Afternoon anchor", "Evening meal"],
      notes: ["Start protein distribution.", "Continue steady fueling.", "Use if needed for consistency.", "Close the day without compensation."],
      calories: [.25, .3, .15, .3], carbs: [.25, .3, .15, .3], fat: [.25, .3, .15, .3]
    };
    const definitions = {
      MORNING: {
        labels: ["Pre-training fuel", "Post-training meal", "Midday meal", "Evening meal"],
        notes: ["Use familiar, tolerable carbohydrate and protein.", "Prioritize protein, carbohydrate, and fluids.", "Continue the approved target.", "Finish the day without restricting recovery fuel."],
        calories: [.2, .35, .25, .2], carbs: [.2, .4, .25, .15], fat: [.1, .2, .3, .4]
      },
      MIDDAY: {
        labels: ["Breakfast", "Pre-training meal", "Post-training meal", "Evening meal"],
        notes: ["Establish the first protein anchor.", "Use familiar fuel before training.", "Prioritize protein, carbohydrate, and fluids.", "Finish the approved daily target."],
        calories: [.2, .25, .35, .2], carbs: [.2, .25, .4, .15], fat: [.3, .15, .2, .35]
      },
      EVENING: {
        labels: ["Breakfast", "Midday meal", "Pre-training meal", "Post-training meal"],
        notes: ["Establish the first protein anchor.", "Maintain energy before the session.", "Use familiar fuel before training.", "Prioritize recovery fuel; do not skip because it is late."],
        calories: [.2, .25, .25, .3], carbs: [.2, .2, .25, .35], fat: [.3, .3, .15, .25]
      },
      UNSCHEDULED: {
        labels: ["Breakfast", "Midday meal", "Afternoon anchor", "Evening meal"],
        notes: ["Begin protein distribution.", "Keep fuel available for the session.", "Place near training when practical.", "Complete the approved target without compensation."],
        calories: [.25, .25, .2, .3], carbs: [.25, .25, .2, .3], fat: [.25, .25, .2, .3]
      }
    };
    return definitions[trainingWindow];
  }

  function buildMealCoachingPlan(input) {
    const value = input || {};
    const targets = value.targets || {};
    if (!["calories", "protein", "carbs", "fat"].every((key) => Number(targets[key]) > 0)) {
      return { status: "NEEDS TARGETS", reason: "Approve an 008D fueling baseline before building a meal-level map.", slots: [], meals: [], safeguards: safeguards() };
    }
    const trainingDay = Boolean(value.trainingDay);
    const trainingWindow = WINDOWS.includes(value.trainingWindow) ? value.trainingWindow : "UNSCHEDULED";
    const definition = slotDefinition(trainingDay, trainingWindow);
    const allocations = {
      calories: distribute(targets.calories, definition.calories),
      protein: distribute(targets.protein, [.25, .25, .25, .25]),
      carbs: distribute(targets.carbs, definition.carbs),
      fat: distribute(targets.fat, definition.fat)
    };
    const slots = definition.labels.map((label, index) => ({
      label,
      note: definition.notes[index],
      calories: allocations.calories[index],
      protein: allocations.protein[index],
      carbs: allocations.carbs[index],
      fat: allocations.fat[index]
    }));
    const meals = (value.meals || []).filter((meal) => Number(meal.calories) >= 0).map((meal) => ({
      name: meal.name || "Imported meal",
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fat: Number(meal.fat) || 0
    }));
    return {
      status: meals.length ? "MEAL EVIDENCE ACTIVE" : "FUELING MAP ACTIVE",
      date: value.date,
      trainingDay,
      trainingWindow,
      targets,
      slots,
      meals,
      evidenceMessage: meals.length
        ? `${meals.length} imported meal${meals.length === 1 ? "" : "s"} available for context.`
        : "No meal-level import is available for this date; the map remains a planning aid.",
      safeguards: safeguards()
    };
  }

  function safeguards() {
    return [
      "Meal timing is flexible guidance, not a compliance requirement.",
      "Daily totals and recovery needs matter more than perfect timing.",
      "No exact foods, supplements, or medical nutrition treatment are prescribed.",
      "Late training never authorizes skipping the post-training meal.",
      "Digestive symptoms or clinical needs require qualified professional guidance."
    ];
  }

  return { buildMealCoachingPlan };
}));
