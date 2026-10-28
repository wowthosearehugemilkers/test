/**
 * EcoScanAI - Gamification Badges & Achievement System
 * 
 * Defines all unlockable achievements, criteria predicates, and formatting.
 */

export const BADGES_CONFIG = [
  {
    id: "first_scan",
    title: "First Step",
    icon: "🌱",
    color: "#2ECC71",
    description: "Completed your first AI waste scan.",
    isUnlocked: (stats) => (stats?.totalScans || 0) >= 1
  },
  {
    id: "habit_builder",
    title: "Habit Builder",
    icon: "🔥",
    color: "#F39C12",
    description: "Maintained a 3-day waste sorting streak.",
    isUnlocked: (stats) => (stats?.streakDays || 0) >= 3
  },
  {
    id: "eco_warrior",
    title: "Eco Warrior",
    icon: "⚡",
    color: "#E67E22",
    description: "Maintained a 7-day waste sorting streak.",
    isUnlocked: (stats) => (stats?.streakDays || 0) >= 7
  },
  {
    id: "ten_scans",
    title: "Waste Watcher",
    icon: "🔍",
    color: "#3498DB",
    description: "Classified and disposed of 10 waste items.",
    isUnlocked: (stats) => (stats?.totalScans || 0) >= 10
  },
  {
    id: "planet_protector",
    title: "Planet Protector",
    icon: "🌍",
    color: "#16A085",
    description: "Classified 25 waste items.",
    isUnlocked: (stats) => (stats?.totalScans || 0) >= 25
  },
  {
    id: "carbon_cutter",
    title: "Carbon Cutter",
    icon: "🌿",
    color: "#27AE60",
    description: "Diverted over 5.0 kg of CO₂ equivalent.",
    isUnlocked: (stats) => (stats?.co2SavedKg || 0) >= 5.0
  },
  {
    id: "water_guardian",
    title: "Water Guardian",
    icon: "💧",
    color: "#2980B9",
    description: "Conserved 50+ liters of water through proper recycling.",
    isUnlocked: (stats) => (stats?.waterSavedLiters || 0) >= 50.0
  },
  {
    id: "category_master",
    title: "Category Master",
    icon: "🏆",
    color: "#9B59B6",
    description: "Successfully scanned items in all 6 waste categories.",
    isUnlocked: (stats) => (stats?.scannedCategories?.length || 0) >= 6
  }
];

/**
 * Evaluates which badges are currently unlocked given the user's aggregate stats.
 * 
 * @param {object} stats
 * @param {number} stats.totalScans
 * @param {number} stats.streakDays
 * @param {number} stats.co2SavedKg
 * @param {number} stats.waterSavedLiters
 * @param {string[]} stats.scannedCategories
 * @returns {Array<object>} List of badge objects with boolean `unlocked` property
 */
export function evaluateBadges(stats = {}) {
  return BADGES_CONFIG.map((badge) => {
    const unlocked = Boolean(badge.isUnlocked(stats));
    return {
      id: badge.id,
      title: badge.title,
      icon: badge.icon,
      color: badge.color,
      description: badge.description,
      unlocked
    };
  });
}
