/**
 * EcoScanAI - useEcoStats Hook
 * 
 * Computes reactive environmental metrics (CO2 saved, streak, scans today)
 * and evaluates unlockable gamification badges.
 */

import { useMemo } from "react";
import { calculateEcoStats } from "../services/impactCalculator.js";
import { evaluateBadges } from "../data/badges.js";
import { useScanHistory } from "./useScanHistory.js";

/**
 * Hook providing live stats and unlocked badges.
 * Can be used standalone or passed an existing history array.
 * 
 * @param {Array<object>} [customHistory] Optional scan history array
 * @returns {object} { stats, badges, recordScan, history, isInitialized }
 */
export function useEcoStats(customHistory = null) {
  const internalHistoryHook = useScanHistory();

  // If custom history array provided, prioritize it; otherwise use internal hook
  const history = customHistory !== null ? customHistory : internalHistoryHook.history;
  const isInitialized = customHistory !== null ? true : internalHistoryHook.isInitialized;

  const stats = useMemo(() => {
    return calculateEcoStats(history);
  }, [history]);

  const badges = useMemo(() => {
    return evaluateBadges(stats);
  }, [stats]);

  return {
    stats,
    badges,
    history,
    isInitialized,
    recordScan: internalHistoryHook.addScan,
    clearHistory: internalHistoryHook.clearHistory,
    removeScan: internalHistoryHook.removeScan
  };
}
