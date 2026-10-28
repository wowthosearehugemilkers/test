/**
 * EcoScanAI - Classifier Adapter & Normalization Service
 * 
 * Harmonizes outputs across classification backends:
 * - Google Teachable Machine Image models (TensorFlow.js predictions)
 * - Groq Vision API serverless endpoint (/api/classify)
 * - Fallback / Mock classifiers
 * 
 * Ensures all classification results strictly conform to the StandardScanResult
 * contract required by the UI and Feature hooks.
 */

import {
  WASTE_CATEGORIES,
  VALID_CATEGORIES,
  DEFAULT_CATEGORY,
  getCategoryData
} from "../data/wasteCategories.js";

/**
 * Maps an arbitrary model class label (e.g. from Teachable Machine)
 * to one of the 6 canonical waste categories.
 * 
 * @param {string} rawLabel 
 * @returns {string} Canonical waste category key ('organic' | 'plastic' | etc.)
 */
export function mapLabelToCategory(rawLabel) {
  if (!rawLabel || typeof rawLabel !== "string") {
    return DEFAULT_CATEGORY;
  }

  const clean = rawLabel.trim().toLowerCase();

  // 1. Direct key match
  if (VALID_CATEGORIES.includes(clean)) {
    return clean;
  }

  // 2. Keyword & synonym lookup across category configs
  for (const [categoryKey, config] of Object.entries(WASTE_CATEGORIES)) {
    // Check if the label contains the category label or vice versa
    if (clean.includes(config.label.toLowerCase()) || config.label.toLowerCase().includes(clean)) {
      return categoryKey;
    }

    // Check against accepted keywords
    if (config.acceptedKeywords && Array.isArray(config.acceptedKeywords)) {
      const match = config.acceptedKeywords.some((kw) => {
        const kwClean = kw.toLowerCase();
        return clean.includes(kwClean) || kwClean.includes(clean);
      });
      if (match) {
        return categoryKey;
      }
    }
  }

  // Fallback to default category
  return DEFAULT_CATEGORY;
}

/**
 * Normalizes confidence scores into an integer percentage between 0 and 100.
 * Handles both float (0.0 - 1.0) and percentage (0 - 100) representations.
 * 
 * @param {number} value
 * @returns {number} Integer between 0 and 100
 */
export function normalizeConfidence(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return 75; // Sensible default
  }

  // If provided as a decimal probability (e.g. 0.945 from Teachable Machine)
  if (value > 0 && value <= 1.0) {
    return Math.min(100, Math.max(0, Math.round(value * 100)));
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Formats a raw label into a clean, human-readable item title.
 * E.g. "plastic_bottle" -> "Plastic Bottle"
 * 
 * @param {string} text 
 * @returns {string}
 */
export function formatItemTitle(text) {
  if (!text) return "Waste Item";
  return text
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Normalizes raw Google Teachable Machine prediction outputs.
 * 
 * Teachable Machine tfjs export format:
 * Array<{ className: string, probability: number }>
 * 
 * @param {Array<{ className: string, probability: number }>} predictions 
 * @returns {object} Standardized scan result
 */
export function normalizeTeachableMachine(predictions) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return createFallbackResult("Unknown Item", "No predictions returned from model.");
  }

  // Sort descending by probability
  const sorted = [...predictions].sort((a, b) => (b.probability || 0) - (a.probability || 0));
  const top = sorted[0];

  const rawLabel = top.className || "Unknown";
  const confidence = normalizeConfidence(top.probability);
  const categoryType = mapLabelToCategory(rawLabel);
  const categoryConfig = getCategoryData(categoryType);
  const isLowConfidence = confidence < 60;

  const itemName = formatItemTitle(rawLabel);
  const reason = isLowConfidence
    ? `Identified as possible ${categoryConfig.label}, but confidence is low (${confidence}%). Please double-check.`
    : `Identified as ${categoryConfig.label} with ${confidence}% confidence based on visual match.`;

  return {
    type: categoryType,
    confidence,
    rawLabel,
    itemName,
    reason,
    isScreenshot: 0,
    disposal: categoryConfig.disposal,
    tips: categoryConfig.tips || [],
    impactSavings: {
      co2Kg: categoryConfig.impactFactors?.co2SavedKg || 0.3,
      waterLiters: categoryConfig.impactFactors?.waterSavedLiters || 2.0,
      energyKwh: categoryConfig.impactFactors?.energySavedKwh || 0.5
    },
    isLowConfidence,
    allPredictions: sorted.slice(0, 3).map((p) => ({
      label: p.className,
      confidence: normalizeConfidence(p.probability),
      mappedCategory: mapLabelToCategory(p.className)
    }))
  };
}

/**
 * Normalizes Groq Vision API response payload.
 * 
 * Groq format:
 * { wasteType: string, confidence: number, itemName: string, reason: string, isScreenshot: number }
 * 
 * @param {object} data
 * @returns {object} Standardized scan result
 */
export function normalizeGroqResult(data) {
  if (!data || typeof data !== "object") {
    return createFallbackResult("Unknown Item", "Invalid response from AI server.");
  }

  const categoryType = mapLabelToCategory(data.wasteType || data.type);
  const categoryConfig = getCategoryData(categoryType);
  const confidence = normalizeConfidence(data.confidence);
  const isLowConfidence = confidence < 60;

  const rawLabel = data.rawLabel || data.itemName || categoryConfig.label;
  const itemName = data.itemName ? formatItemTitle(data.itemName) : formatItemTitle(rawLabel);
  const reason = data.reason || `Classified as ${categoryConfig.label}.`;
  const isScreenshot = typeof data.isScreenshot === "number" ? Math.max(0, Math.min(100, data.isScreenshot)) : 0;

  return {
    type: categoryType,
    confidence,
    rawLabel,
    itemName,
    reason,
    isScreenshot,
    disposal: categoryConfig.disposal,
    tips: categoryConfig.tips || [],
    impactSavings: {
      co2Kg: categoryConfig.impactFactors?.co2SavedKg || 0.3,
      waterLiters: categoryConfig.impactFactors?.waterSavedLiters || 2.0,
      energyKwh: categoryConfig.impactFactors?.energySavedKwh || 0.5
    },
    isLowConfidence
  };
}

/**
 * General-purpose dispatcher: automatically determines model source
 * (Teachable Machine array vs Groq object) and outputs standard result.
 * 
 * @param {any} rawOutput
 * @returns {object} Standardized scan result
 */
export function normalizeClassifierResult(rawOutput) {
  if (Array.isArray(rawOutput)) {
    return normalizeTeachableMachine(rawOutput);
  }
  return normalizeGroqResult(rawOutput);
}

/**
 * Generates a safe fallback result when classification fails completely.
 * 
 * @param {string} itemName
 * @param {string} reason
 * @returns {object} Standardized fallback scan result
 */
export function createFallbackResult(itemName = "Unidentified Item", reason = "Classification was unable to determine a specific category.") {
  const categoryConfig = getCategoryData(DEFAULT_CATEGORY);
  return {
    type: DEFAULT_CATEGORY,
    confidence: 50,
    rawLabel: "unidentified",
    itemName,
    reason,
    isScreenshot: 0,
    disposal: categoryConfig.disposal,
    tips: categoryConfig.tips || [],
    impactSavings: {
      co2Kg: categoryConfig.impactFactors?.co2SavedKg || 0.1,
      waterLiters: categoryConfig.impactFactors?.waterSavedLiters || 1.0,
      energyKwh: categoryConfig.impactFactors?.energySavedKwh || 0.1
    },
    isLowConfidence: true
  };
}
