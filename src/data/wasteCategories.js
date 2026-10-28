/**
 * EcoScanAI - Comprehensive Waste Categories & Domain Rules
 * 
 * Provides structured metadata, UI styling tokens, environmental impact multipliers,
 * disposal protocols, and keyword mappings for classifier integration.
 * Fully backwards-compatible with existing UI components.
 */

export const WASTE_CATEGORIES = {
  organic: {
    id: "organic",
    label: "Organic Waste",
    emoji: "🌿",
    category: "Wet Waste",
    color: "#2ECC71",
    bg: "from-emerald-900/60 to-green-800/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    ring: "#2ECC71",
    binColor: "Green",
    disposal: "Dispose in the Green Compost Bin",
    fact: "Composting organic waste reduces landfill methane emissions by up to 50%.",
    mapsQuery: "composting facility near me",
    impactFactors: {
      co2SavedKg: 0.25,     // Direct methane avoidance per item diverted
      waterSavedLiters: 1.5, // Soil moisture retention & reduced synthetic inputs
      energySavedKwh: 0.10
    },
    acceptedKeywords: [
      "organic", "food", "fruit", "vegetable", "banana", "apple", "orange",
      "peel", "scraps", "compost", "leaves", "bread", "eggshell", "plant",
      "coffee grounds", "tea bag", "biodegradable"
    ],
    tips: [
      "Keep meat, dairy, and oils out of standard backyard compost bins.",
      "Chop larger vegetable scraps to accelerate decomposition.",
      "Remove any non-compostable packaging or stickers before disposing."
    ],
    contaminationWarnings: "Never mix plastic bags, pet waste, or chemically treated wood into organic bins.",
    learnMore: {
      what: "Organic waste includes food scraps, yard trimmings, and biodegradable materials that decompose naturally.",
      impact: "When sent to landfills, organic waste produces methane — a greenhouse gas 25× more potent than CO₂.",
      disposal: "Use green bins for collection, or home-compost to create rich soil amendments.",
      benefit: "Composting returns nutrients to soil, reduces fertilizer needs, and cuts waste costs."
    }
  },

  plastic: {
    id: "plastic",
    label: "Plastic Waste",
    emoji: "♻️",
    category: "Dry / Recyclable",
    color: "#3498DB",
    bg: "from-blue-900/60 to-sky-800/40",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    glow: "shadow-blue-500/20",
    ring: "#3498DB",
    binColor: "Blue",
    disposal: "Rinse & place in Blue Recycling Bin",
    fact: "Only 9% of all plastic ever produced has been recycled globally.",
    mapsQuery: "plastic recycling center near me",
    impactFactors: {
      co2SavedKg: 0.40,     // Avoided virgin petrochemical synthesis
      waterSavedLiters: 6.0, // Water saved in polymer processing
      energySavedKwh: 1.20
    },
    acceptedKeywords: [
      "plastic", "bottle", "container", "jug", "cup", "pet", "hdpe",
      "pvc", "ldpe", "polyethylene", "packaging", "polyester", "tub", "tray"
    ],
    tips: [
      "Rinse containers to eliminate food residue and prevent recycling stream contamination.",
      "Check resin identification codes (1 through 7) for local municipal acceptance.",
      "Flatten bottles and screw plastic caps back on before recycling."
    ],
    contaminationWarnings: "Plastic bags and soft cling films jam sorting machinery; return them to grocery drop-off points.",
    learnMore: {
      what: "Plastic waste includes bottles, bags, packaging, and synthetic materials that take 400–1000 years to degrade.",
      impact: "Plastics contaminate oceans, harm wildlife, and release toxic chemicals as they break down into microplastics.",
      disposal: "Rinse containers, check resin codes (1–7), and place in designated recycling bins.",
      benefit: "Recycling 1 ton of plastic saves 7.4 cubic yards of landfill space and 16.3 barrels of oil."
    }
  },

  glass: {
    id: "glass",
    label: "Glass Waste",
    emoji: "🔵",
    category: "Recyclable",
    color: "#00BCD4",
    bg: "from-cyan-900/60 to-teal-800/40",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    ring: "#00BCD4",
    binColor: "Cyan / Teal",
    disposal: "Place in Cyan Glass Recycling Bin",
    fact: "Glass can be recycled endlessly without any loss in quality or purity.",
    mapsQuery: "glass recycling drop off near me",
    impactFactors: {
      co2SavedKg: 0.30,     // Reduced kiln furnace melting emissions
      waterSavedLiters: 2.5,
      energySavedKwh: 0.85
    },
    acceptedKeywords: [
      "glass", "jar", "glass bottle", "beverage bottle", "wine bottle",
      "cullet", "mason jar", "flint glass", "amber glass", "green glass"
    ],
    tips: [
      "Empty and quickly rinse all liquids before recycling.",
      "Separate metal lids and plastic caps from glass jars.",
      "Sort by color (clear, green, brown) if your local recycling drop-off requires it."
    ],
    contaminationWarnings: "Window glass, Pyrex cookware, lightbulbs, and mirrors have different melting temperatures and cannot be mixed with container glass.",
    learnMore: {
      what: "Glass waste includes bottles, jars, and broken glassware made from silica sand melted at high temperatures.",
      impact: "Glass takes over 1 million years to decompose in a landfill, and produces toxic fumes if incinerated.",
      disposal: "Separate by color (clear, green, brown), rinse, and drop at glass collection points.",
      benefit: "Recycling glass reduces energy use by 30% and cuts CO₂ emissions significantly."
    }
  },

  metal: {
    id: "metal",
    label: "Metal / E-Waste",
    emoji: "⚙️",
    category: "Hazardous / Recyclable",
    color: "#FF5722",
    bg: "from-orange-900/60 to-red-900/40",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    glow: "shadow-orange-500/20",
    ring: "#FF5722",
    binColor: "Orange / Grey",
    disposal: "Drop at certified E-Waste collection center",
    fact: "A ton of e-waste contains more gold than a ton of gold ore.",
    mapsQuery: "e-waste recycling center near me",
    impactFactors: {
      co2SavedKg: 0.85,     // Aluminium and precious metal extraction energy avoidance
      waterSavedLiters: 12.0,
      energySavedKwh: 2.50
    },
    acceptedKeywords: [
      "metal", "can", "tin", "aluminium", "aluminum", "foil", "wire", "steel",
      "copper", "electronics", "circuit", "cable", "appliance", "phone", "hardware"
    ],
    tips: [
      "Separate clean aluminium food cans and drink tins from electronic waste.",
      "Keep electronics dry and do not attempt to puncture internal batteries.",
      "Wipe clean food residue from tins before placing them in metal recycling."
    ],
    contaminationWarnings: "Never dispose of lithium-ion batteries or cracked circuit boards in household recycling bins; they are serious fire hazards.",
    learnMore: {
      what: "E-waste includes electronics, batteries, circuit boards, and metal components with hazardous materials.",
      impact: "Improper disposal leaches lead, mercury, and cadmium into soil and groundwater.",
      disposal: "Never bin e-waste. Take to certified collection centers or manufacturer take-back programs.",
      benefit: "Recovering metals from e-waste uses 95% less energy than mining virgin materials."
    }
  },

  paper: {
    id: "paper",
    label: "Paper Waste",
    emoji: "📄",
    category: "Dry / Recyclable",
    color: "#8BC34A",
    bg: "from-lime-900/60 to-green-900/40",
    badge: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    glow: "shadow-lime-500/20",
    ring: "#8BC34A",
    binColor: "Lime / Blue",
    disposal: "Bundle & place in Paper Recycling Bin",
    fact: "Recycling 1 ton of paper saves 17 trees and 7,000 gallons of water.",
    mapsQuery: "paper recycling near me",
    impactFactors: {
      co2SavedKg: 0.35,     // Preserving forest biomass & reduced pulping
      waterSavedLiters: 18.0, // Paper mills are intensely water-dependent
      energySavedKwh: 0.90
    },
    acceptedKeywords: [
      "paper", "cardboard", "box", "newspaper", "magazine", "book", "carton",
      "envelope", "paperboard", "kraft", "notebook", "office paper", "flyer"
    ],
    tips: [
      "Flatten cardboard boxes to maximize bin capacity.",
      "Keep all paper dry; wet fibers degrade and cannot be remilled.",
      "Remove sticky packaging tape and large plastic shipping sleeves."
    ],
    contaminationWarnings: "Greasy pizza boxes, used paper towels, napkins, and wax-lined coffee cups contaminate paper pulp and must be composted or binned.",
    learnMore: {
      what: "Paper waste includes newspapers, cardboard, office paper, and packaging materials made from wood pulp.",
      impact: "Paper production is the 3rd largest industrial polluter, consuming vast water and chemical resources.",
      disposal: "Keep paper dry, remove tape/staples, and flatten cardboard before recycling.",
      benefit: "Paper can be recycled 5–7 times before fibers become too short, saving forests globally."
    }
  },

  hazardous: {
    id: "hazardous",
    label: "Hazardous Waste",
    emoji: "⚠️",
    category: "Hazardous",
    color: "#E53935",
    bg: "from-red-950/70 to-rose-900/40",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    glow: "shadow-red-500/20",
    ring: "#E53935",
    binColor: "Red",
    disposal: "Take to Hazardous Waste Facility ONLY",
    fact: "Improper disposal of hazardous waste can contaminate groundwater for decades.",
    mapsQuery: "hazardous waste disposal facility near me",
    impactFactors: {
      co2SavedKg: 0.20,
      waterSavedLiters: 30.0, // Water table pollution protection
      energySavedKwh: 0.40
    },
    acceptedKeywords: [
      "hazardous", "battery", "chemical", "paint", "pesticide", "solvent",
      "syringe", "needle", "medicine", "pharmaceutical", "oil", "bleach", "aerosol"
    ],
    tips: [
      "Keep in original labeled containers whenever possible.",
      "Never mix different chemical products or household cleaners.",
      "Deliver directly to authorized community hazardous collection drop-offs."
    ],
    contaminationWarnings: "Never pour chemicals down domestic drains, sinks, or storm drains; they poison water systems.",
    learnMore: {
      what: "Hazardous waste includes chemicals, batteries, paints, pesticides, and medical waste with toxic properties.",
      impact: "Can cause severe environmental contamination, health issues, and long-term ecosystem damage.",
      disposal: "Never pour down drains. Use municipal hazardous waste collection events or certified facilities.",
      benefit: "Proper disposal prevents billions in environmental cleanup costs and protects public health."
    }
  }
};

/**
 * List of canonical waste category identifiers
 */
export const VALID_CATEGORIES = Object.keys(WASTE_CATEGORIES);

/**
 * Fallback category when classification is ambiguous or unknown
 */
export const DEFAULT_CATEGORY = "hazardous";

/**
 * Helper to retrieve category data with safe fallback
 * @param {string} categoryKey 
 * @returns {object} Category metadata
 */
export function getCategoryData(categoryKey) {
  const normalizedKey = (categoryKey || "").toString().trim().toLowerCase();
  return WASTE_CATEGORIES[normalizedKey] || WASTE_CATEGORIES[DEFAULT_CATEGORY];
}

/**
 * Checks whether a given string is a supported category key
 * @param {string} categoryKey 
 * @returns {boolean}
 */
export function isValidCategory(categoryKey) {
  if (!categoryKey) return false;
  return Object.prototype.hasOwnProperty.call(WASTE_CATEGORIES, categoryKey.toLowerCase().trim());
}
