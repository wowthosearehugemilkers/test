/**
 * EcoScanAI - usePrepScanner Hook
 * 
 * Provides an abstracted scanner interface for the prep feature.
 * Currently operates in MOCK MODE (allowing user to select an item from classMap),
 * while maintaining the exact same contract for future Teachable Machine integration.
 */

import { useState, useCallback } from "react";
import { CLASS_MAP, getItemDataByClass, ITEMS_BY_ID } from "../data/classMap.js";

export function usePrepScanner() {
  const [selectedItem, setSelectedItem] = useState(null);

  const availableClasses = Object.keys(CLASS_MAP);

  const selectItemByClass = useCallback((tmClass) => {
    const itemData = getItemDataByClass(tmClass);
    if (itemData) {
      setSelectedItem(itemData);
    }
    return itemData;
  }, []);

  const selectItemById = useCallback((itemId) => {
    const itemData = ITEMS_BY_ID[itemId];
    if (itemData) {
      setSelectedItem(itemData);
    }
    return itemData;
  }, []);

  const resetScanner = useCallback(() => {
    setSelectedItem(null);
  }, []);

  return {
    selectedItem,
    availableClasses,
    selectItemByClass,
    selectItemById,
    resetScanner
  };
}
