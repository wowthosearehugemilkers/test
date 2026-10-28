/**
 * EcoScanAI - Live Class Mapping for Teachable Machine
 * 
 * Maps Teachable Machine predicted labels to display titles and optional prep item IDs.
 * Reuses mapLabelToCategory and getCategoryData to eliminate duplicate category definitions.
 */

import { mapLabelToCategory } from "../../../services/classifierAdapter.js";
import { getCategoryData } from "../../../data/wasteCategories.js";

/**
 * Item & display configuration for all 19 Teachable Machine labels.
 * Only "Plastic" (plastic_bottle) and "Cardboard" (pizza_box) map to prep items.
 * Glasses is intentionally set to null per specification.
 */
export const LIVE_CLASS_CONFIG = {
  "Plastic": { displayName: "Plastic Bottle", itemId: "plastic_bottle" },
  "Glasses": { displayName: "Glasses", itemId: null },
  "Trash": { displayName: "General Trash", itemId: null },
  "Shoes": { displayName: "Shoes / Footwear", itemId: null },
  "Paper": { displayName: "Paper", itemId: null },
  "Metal": { displayName: "Metal", itemId: null },
  "Clothes": { displayName: "Clothes / Textiles", itemId: null },
  "Cardboard": { displayName: "Cardboard / pizza box", itemId: "pizza_box" },
  "Food Waste": { displayName: "Food Waste", itemId: null },
  "Battery": { displayName: "Battery", itemId: null },
  "Mobile": { displayName: "Mobile Phone", itemId: null },
  "Keyboard": { displayName: "Keyboard (Electronics)", itemId: null },
  "Mouse": { displayName: "Mouse (Electronics)", itemId: null },
  "TV": { displayName: "Television (Electronics)", itemId: null },
  "PCB": { displayName: "Circuit Board (Electronics)", itemId: null },
  "Leaf": { displayName: "Leaves / Yard Waste", itemId: null },
  "Wood Waste": { displayName: "Wood & Plant Waste", itemId: null },
  "Plastic bags": { displayName: "Plastic Bag / Film", itemId: null },
  "Leather": { displayName: "Leather Goods", itemId: null }
};

/**
 * Resolves complete domain, category, and prep item info for a given model label.
 * 
 * @param {string} tmClass 
 * @returns {object}
 */
export function getLiveItemInfo(tmClass) {
  const config = LIVE_CLASS_CONFIG[tmClass] || {
    displayName: tmClass || "Waste Item",
    itemId: null
  };

  // Resolve category by checking both raw class and displayName through classifierAdapter
  let categoryId = mapLabelToCategory(tmClass);
  if (categoryId === "hazardous" && config.displayName) {
    const refinedCategory = mapLabelToCategory(config.displayName);
    if (refinedCategory !== "hazardous") {
      categoryId = refinedCategory;
    }
  }
  const categoryData = getCategoryData(categoryId);

  // Carbon savings strictly from impactFactors (no invented figures)
  const co2Factor = categoryData.impactFactors?.co2SavedKg;
  let carbonText = null;
  let hasNumericEstimate = false;

  if (typeof co2Factor === "number" && co2Factor > 0) {
    carbonText = `~${co2Factor.toFixed(2)} kg CO₂`;
    hasNumericEstimate = true;
  } else if (categoryData.fact) {
    carbonText = categoryData.fact;
  } else if (categoryData.learnMore?.impact) {
    carbonText = categoryData.learnMore.impact;
  } else {
    carbonText = "No estimate for this item";
  }

  return {
    rawClass: tmClass,
    displayName: config.displayName,
    itemId: config.itemId,
    canPrep: Boolean(config.itemId),
    categoryId,
    categoryData,
    binColor: categoryData.binColor || "Blue",
    binDisposal: categoryData.disposal || "Recycling Bin",
    tip: categoryData.tips?.[0] || categoryData.disposal || "Check local guidance.",
    carbonText,
    hasNumericEstimate
  };
}

// Log model labels to console on load and warn about unmapped labels
if (typeof window !== "undefined") {
  fetch("/tm-model/metadata.json")
    .then((res) => res.json())
    .then((meta) => {
      const labels = meta.labels || [];
      console.log("[LiveCam] Loaded model labels from metadata.json:", labels);
      for (const label of labels) {
        if (!LIVE_CLASS_CONFIG[label]) {
          console.warn(`[LiveCam] Unmapped model label detected in metadata: "${label}".`);
        }
      }
    })
    .catch((err) => {
      console.warn("[LiveCam] Could not verify /tm-model/metadata.json labels:", err);
    });
}
