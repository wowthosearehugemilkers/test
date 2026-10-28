/**
 * EcoScanAI - Environmental Impact & Streak Calculator
 * 
 * Computes scientific environmental savings (CO2, water, energy)
 * and true consecutive calendar-day streaks from scan history.
 */

import { getCategoryData } from "../data/wasteCategories.js";

/**
 * Formats a Date object into a YYYY-MM-DD calendar date string.
 * Uses local time so users get accurate timezone-aware streaks.
 * 
 * @param {Date} date 
 * @returns {string} YYYY-MM-DD
 */
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Computes calendar-day streak from scan history timestamps.
 * 
 * A streak is maintained if the user scanned today or yesterday.
 * Consecutive past days are checked sequentially.
 * 
 * @param {Array<object>} scans 
 * @returns {number} Consecutive streak in days
 */
export function calculateStreakDays(scans = []) {
  if (!Array.isArray(scans) || scans.length === 0) {
    return 0;
  }

  // Create a Set of unique local calendar date strings when scans occurred
  const activeDates = new Set(
    scans
      .filter((s) => s.timestamp)
      .map((s) => toLocalDateKey(new Date(s.timestamp)))
  );

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  // Check yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);

  let currentCheckDate;

  if (activeDates.has(todayKey)) {
    // Active today
    currentCheckDate = today;
  } else if (activeDates.has(yesterdayKey)) {
    // Active yesterday, streak still alive for today
    currentCheckDate = yesterday;
  } else {
    // Streak broken
    return 0;
  }

  let streak = 0;
  const cursor = new Date(currentCheckDate);

  while (activeDates.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Computes comprehensive environmental impact statistics from scan history.
 * 
 * @param {Array<object>} scans
 * @returns {object} Calculated stats object
 */
export function calculateEcoStats(scans = []) {
  if (!Array.isArray(scans) || scans.length === 0) {
    return {
      totalScans: 0,
      todayScans: 0,
      co2SavedKg: 0,
      waterSavedLiters: 0,
      energySavedKwh: 0,
      streakDays: 0,
      scannedCategories: [],
      categoryBreakdown: {
        organic: 0,
        plastic: 0,
        glass: 0,
        metal: 0,
        paper: 0,
        hazardous: 0
      }
    };
  }

  const todayKey = toLocalDateKey(new Date());
  let todayCount = 0;
  let totalCo2 = 0;
  let totalWater = 0;
  let totalEnergy = 0;

  const categoryCounts = {
    organic: 0,
    plastic: 0,
    glass: 0,
    metal: 0,
    paper: 0,
    hazardous: 0
  };

  const uniqueCategories = new Set();

  for (const scan of scans) {
    const res = scan.result || {};
    const cat = res.type || "hazardous";

    // Track category breakdown
    if (Object.prototype.hasOwnProperty.call(categoryCounts, cat)) {
      categoryCounts[cat] += 1;
      uniqueCategories.add(cat);
    }

    // Check if scan occurred today
    if (scan.timestamp && toLocalDateKey(new Date(scan.timestamp)) === todayKey) {
      todayCount += 1;
    }

    // Environmental savings
    const impact = res.impactSavings || getCategoryData(cat).impactFactors || {};
    totalCo2 += Number(impact.co2Kg || 0.3);
    totalWater += Number(impact.waterLiters || 2.0);
    totalEnergy += Number(impact.energyKwh || 0.5);
  }

  const streakDays = calculateStreakDays(scans);

  return {
    totalScans: scans.length,
    todayScans: todayCount,
    co2SavedKg: Number(totalCo2.toFixed(1)),
    waterSavedLiters: Number(totalWater.toFixed(1)),
    energySavedKwh: Number(totalEnergy.toFixed(1)),
    streakDays,
    scannedCategories: Array.from(uniqueCategories),
    categoryBreakdown: categoryCounts
  };
}
