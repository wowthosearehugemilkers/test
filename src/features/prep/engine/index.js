/**
 * EcoScanAI - Interactive Waste Prep Engine
 * 
 * Pure, deterministic engine modeling composite waste items,
 * stateful preparation actions, and bin disposal outcome evaluation.
 * Does not mutate inputs.
 */

/**
 * Initializes the parts state for a given item.
 * 
 * @param {object} itemData - Item configuration conforming to schema
 * @returns {object} Copy of initial parts state
 */
export function initItem(itemData) {
  if (!itemData || typeof itemData !== "object") {
    throw new Error("Invalid itemData provided to initItem.");
  }
  return { ...(itemData.initialParts || {}) };
}

/**
 * Evaluates which actions are currently available and enabled based on prerequisites.
 * 
 * @param {object} itemData - Item configuration
 * @param {object} currentParts - Current state of item parts
 * @returns {Array<object>} Actions with `enabled` (boolean) and `disabledReason` (string | null)
 */
export function getAvailableActions(itemData, currentParts = {}) {
  if (!itemData || !Array.isArray(itemData.actions)) {
    return [];
  }

  return itemData.actions.map((action) => {
    const requires = action.requires || {};
    const unmetRequirements = [];

    for (const [key, expectedValue] of Object.entries(requires)) {
      if (currentParts[key] !== expectedValue) {
        unmetRequirements.push(`${key} to be "${expectedValue}" (currently "${currentParts[key] || "unknown"}")`);
      }
    }

    const enabled = unmetRequirements.length === 0;
    const disabledReason = enabled
      ? null
      : `Requires ${unmetRequirements.join(", ")}`;

    return {
      ...action,
      enabled,
      disabledReason
    };
  });
}

/**
 * Returns a list of required actions that have not yet been applied to the item.
 * 
 * @param {object} itemData - Item configuration
 * @param {object} currentParts - Current state of item parts
 * @returns {Array<object>} List of unapplied required actions
 */
export function getMissedActions(itemData, currentParts = {}) {
  if (!itemData || !Array.isArray(itemData.actions)) {
    return [];
  }

  return itemData.actions.filter((action) => {
    if (!action.required) return false;
    const targets = action.set || {};

    // If any target state is not yet met, the action is considered missed
    const isSatisfied = Object.entries(targets).every(
      ([key, expectedValue]) => currentParts[key] === expectedValue
    );

    return !isSatisfied;
  });
}

/**
 * Purely applies an action to current parts and returns updated parts state and feedback.
 * 
 * @param {object} itemData - Item configuration
 * @param {object} currentParts - Current state of item parts (not mutated)
 * @param {string} actionId - Identifier of action to apply
 * @returns {object} { currentParts, action, feedback }
 */
export function applyAction(itemData, currentParts = {}, actionId) {
  if (!itemData || !Array.isArray(itemData.actions)) {
    throw new Error("Invalid itemData provided to applyAction.");
  }

  const action = itemData.actions.find((a) => a.id === actionId);
  if (!action) {
    throw new Error(`Action "${actionId}" not found for item "${itemData.id || "unknown"}".`);
  }

  const requires = action.requires || {};
  for (const [key, expectedValue] of Object.entries(requires)) {
    if (currentParts[key] !== expectedValue) {
      throw new Error(
        `Action "${actionId}" cannot be applied: requires ${key}="${expectedValue}", but current state is ${key}="${currentParts[key] || "unknown"}".`
      );
    }
  }

  // Pure state update
  const newParts = {
    ...currentParts,
    ...(action.set || {})
  };

  return {
    currentParts: newParts,
    action: { ...action },
    feedback: action.feedback || ""
  };
}

/**
 * Evaluates the disposal outcome when an item is placed in a given bin.
 * 
 * @param {object} itemData - Item configuration
 * @param {object} currentParts - Current state of item parts
 * @param {string} bin - Target bin ("recycling" | "general" | "compost")
 * @returns {object} Matching outcome with attached `missedActions`
 */
export function evaluateOutcome(itemData, currentParts = {}, bin) {
  if (!itemData || !Array.isArray(itemData.outcomes)) {
    throw new Error("Invalid itemData provided to evaluateOutcome.");
  }

  const candidateOutcomes = itemData.outcomes.filter((o) => o.bin === bin);
  if (candidateOutcomes.length === 0) {
    throw new Error(`No outcomes defined for bin "${bin}" in item "${itemData.id || "unknown"}".`);
  }

  // 1. Look for a specific matching condition
  let matchedOutcome = candidateOutcomes.find((outcome) => {
    if (!outcome.when || typeof outcome.when !== "object") return false;
    return Object.entries(outcome.when).every(
      ([key, expectedValue]) => currentParts[key] === expectedValue
    );
  });

  // 2. Fallback to default (when === null) for this bin
  if (!matchedOutcome) {
    matchedOutcome = candidateOutcomes.find((outcome) => outcome.when === null);
  }

  if (!matchedOutcome) {
    throw new Error(
      `No matching outcome found for bin "${bin}" under current state ${JSON.stringify(currentParts)}.`
    );
  }

  const missedActions = getMissedActions(itemData, currentParts);

  return {
    ...matchedOutcome,
    missedActions
  };
}
