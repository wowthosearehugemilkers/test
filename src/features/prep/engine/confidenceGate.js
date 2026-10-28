/**
 * EcoScanAI - Confidence Gate Engine with Hysteresis
 * 
 * Provides debounce & hysteresis stabilization for live video stream classification.
 * Prevents HUD flickering by enforcing minimum confidence, minimum margin between top-2
 * classes, 5-frame locking requirement, and 8-frame release threshold.
 */

export const MIN_CONFIDENCE = 0.8;
export const MIN_MARGIN = 0.2;
export const LOCK_FRAMES = 5;
export const RELEASE_FRAMES = 8;
export const IDLE_THRESHOLD = 0.45;

/**
 * Creates a stateful confidence gate with hysteresis.
 * 
 * @param {object} [customThresholds] Optional overrides for tuning
 * @returns {object} Gate instance with `processFrame(predictions)` and `reset()`
 */
export function createConfidenceGate(customThresholds = {}) {
  const minConfidence = customThresholds.minConfidence ?? MIN_CONFIDENCE;
  const minMargin = customThresholds.minMargin ?? MIN_MARGIN;
  const lockFrames = customThresholds.lockFrames ?? LOCK_FRAMES;
  const releaseFramesThreshold = customThresholds.releaseFrames ?? RELEASE_FRAMES;
  const idleThreshold = customThresholds.idleThreshold ?? IDLE_THRESHOLD;

  let lockedClass = null;
  let lockedConfidence = null;
  let candidateClass = null;
  let candidateFrames = 0;
  let releaseFrames = 0;

  function reset() {
    lockedClass = null;
    lockedConfidence = null;
    candidateClass = null;
    candidateFrames = 0;
    releaseFrames = 0;
  }

  function processFrame(predictions = []) {
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return {
        status: "idle",
        confirmedClass: null,
        confidence: 0,
        message: "Show me an item"
      };
    }

    // Sort descending by probability
    const sorted = [...predictions].sort((a, b) => (b.probability || 0) - (a.probability || 0));
    const top1 = sorted[0];
    const top2 = sorted[1] || { className: "None", probability: 0 };
    const margin = (top1.probability || 0) - (top2.probability || 0);

    // Per-frame console telemetry for threshold tuning
    if (typeof console !== "undefined" && console.log) {
      console.log(
        `[Gate] #1: ${top1.className} (${((top1.probability || 0) * 100).toFixed(1)}%), ` +
        `#2: ${top2.className} (${((top2.probability || 0) * 100).toFixed(1)}%), ` +
        `margin: ${(margin * 100).toFixed(1)}%, streak: ${candidateFrames}, rel: ${releaseFrames}`
      );
    }

    // ─── STATE A: CURRENTLY LOCKED (HYSTERESIS ACTIVE) ───────────────
    if (lockedClass !== null) {
      // Frame still matches locked class with sufficient confidence
      if (top1.className === lockedClass && top1.probability >= minConfidence) {
        releaseFrames = 0;
        lockedConfidence = top1.probability;
        return {
          status: "locked",
          confirmedClass: lockedClass,
          confidence: lockedConfidence,
          top1,
          top2,
          margin
        };
      }

      // Frame does not match or dropped below minConfidence
      releaseFrames += 1;

      // Hysteresis: Hold the lock until release threshold is crossed
      if (releaseFrames < releaseFramesThreshold) {
        return {
          status: "locked",
          confirmedClass: lockedClass,
          confidence: lockedConfidence,
          top1,
          top2,
          margin,
          isReleasing: true,
          releaseFramesRemaining: releaseFramesThreshold - releaseFrames
        };
      }

      // Release the lock after consecutive bad frames
      lockedClass = null;
      lockedConfidence = null;
      releaseFrames = 0;
      candidateFrames = 0;
    }

    // ─── STATE B: UNLOCKED (ACCUMULATING STABLE CANDIDATE) ────────────
    const meetsLockCriteria = top1.probability >= minConfidence && margin >= minMargin;

    if (meetsLockCriteria) {
      if (top1.className === candidateClass) {
        candidateFrames += 1;
        if (candidateFrames >= lockFrames) {
          lockedClass = candidateClass;
          lockedConfidence = top1.probability;
          candidateFrames = 0;
          releaseFrames = 0;
          return {
            status: "locked",
            confirmedClass: lockedClass,
            confidence: lockedConfidence,
            top1,
            top2,
            margin
          };
        }
      } else {
        candidateClass = top1.className;
        candidateFrames = 1;
      }

      return {
        status: "uncertain",
        confirmedClass: null,
        confidence: top1.probability,
        candidateClass,
        candidateFrames,
        top1,
        top2,
        margin,
        message: "Not sure, move closer or change angle"
      };
    }

    // Below idle threshold
    if (top1.probability < idleThreshold) {
      candidateClass = null;
      candidateFrames = 0;
      return {
        status: "idle",
        confirmedClass: null,
        confidence: top1.probability,
        top1,
        top2,
        margin,
        message: "Show me an item"
      };
    }

    // Moderate reading but fails confidence or margin
    candidateClass = null;
    candidateFrames = 0;
    return {
      status: "uncertain",
      confirmedClass: null,
      confidence: top1.probability,
      top1,
      top2,
      margin,
      message: "Not sure, move closer or change angle"
    };
  }

  return {
    processFrame,
    reset,
    getLockedClass: () => lockedClass
  };
}
