/**
 * EcoScanAI - Teachable Machine Class Mapping for Prep Feature
 * 
 * Maps Teachable Machine predicted labels to interactive item IDs.
 */

import plasticBottleData from "./items/plastic_bottle.json" with { type: "json" };
import glassJarData from "./items/glass_jar.json" with { type: "json" };
import pizzaBoxData from "./items/pizza_box.json" with { type: "json" };

/**
 * Standard background class output by Teachable Machine when no item is detected
 */
export const BACKGROUND_CLASS = "Background";

/**
 * Single mapping object connecting Teachable Machine class labels to itemId strings
 */
export const CLASS_MAP = {
  "Plastic Bottle": "plastic_bottle",
  "Glass Jar": "glass_jar",
  "Pizza Box": "pizza_box"
};

/**
 * Map of loaded item data by itemId
 */
export const ITEMS_BY_ID = {
  plastic_bottle: plasticBottleData,
  glass_jar: glassJarData,
  pizza_box: pizzaBoxData
};

/**
 * Resolves an item ID from a Teachable Machine class label.
 * 
 * @param {string} tmClass 
 * @returns {string|null}
 */
export function getItemIdByClass(tmClass) {
  if (!tmClass || typeof tmClass !== "string") return null;
  return CLASS_MAP[tmClass] || null;
}

/**
 * Resolves complete item data from a Teachable Machine class label.
 * 
 * @param {string} tmClass 
 * @returns {object|null}
 */
export function getItemDataByClass(tmClass) {
  const id = getItemIdByClass(tmClass);
  return id ? (ITEMS_BY_ID[id] || null) : null;
}
