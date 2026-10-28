/**
 * EcoScanAI - useScanHistory Hook
 * 
 * Provides reactive access to persistent scan history with CRUD actions.
 */

import { useState, useCallback } from "react";
import {
  getStoredScans,
  saveScanEntry,
  deleteScanEntry,
  clearAllScans
} from "../services/historyService.js";

export function useScanHistory() {
  const [history, setHistory] = useState(() => getStoredScans());
  const [isInitialized] = useState(true);

  const addScan = useCallback((result, previewUrl = null) => {
    const saved = saveScanEntry({ result, previewUrl });
    if (saved) {
      setHistory((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)].slice(0, 50));
    }
    return saved;
  }, []);

  const removeScan = useCallback((id) => {
    const updated = deleteScanEntry(id);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    clearAllScans();
    setHistory([]);
  }, []);

  return {
    history,
    isInitialized,
    addScan,
    removeScan,
    clearHistory
  };
}
