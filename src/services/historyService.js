/**
 * EcoScanAI - Scan History Persistence Service
 * 
 * Manages client-side persistence of classification scans in localStorage.
 * Includes FIFO capacity enforcement, safe quota handling, and query helpers.
 */

const STORAGE_KEY = "ecoscan_history_v1";
const MAX_HISTORY_ITEMS = 50;

/**
 * Safely reads all stored scan records from localStorage.
 * 
 * @returns {Array<object>} Array of scan objects ordered newest to oldest
 */
export function getStoredScans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("EcoScanAI: Failed to read scan history from localStorage", err);
    return [];
  }
}

/**
 * Saves a new scan entry to localStorage.
 * 
 * @param {object} params
 * @param {object} params.result - Normalized StandardScanResult
 * @param {string} [params.previewUrl] - Optional image preview (base64 or object URL)
 * @returns {object} The stored scan entry with id and timestamp
 */
export function saveScanEntry({ result, previewUrl = null }) {
  try {
    const existing = getStoredScans();

    const newEntry = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      result: { ...result },
      // Cap preview string length to protect localStorage quota
      previewUrl: previewUrl && previewUrl.length < 500000 ? previewUrl : null
    };

    // Prepend newest item, then enforce capacity cap
    const updated = [newEntry, ...existing].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  } catch (err) {
    console.warn("EcoScanAI: Failed to save scan to localStorage", err);
    // If storage quota exceeded, clear older half of scans and retry once
    try {
      const existing = getStoredScans();
      if (existing.length > 5) {
        const pruned = existing.slice(0, Math.floor(existing.length / 2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      }
    } catch {
      // Ignore fallback error
    }
    return null;
  }
}

/**
 * Deletes a single scan record by ID.
 * 
 * @param {string} id 
 * @returns {Array<object>} Updated list of scans
 */
export function deleteScanEntry(id) {
  try {
    const existing = getStoredScans();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("EcoScanAI: Failed to delete scan from localStorage", err);
    return getStoredScans();
  }
}

/**
 * Clears all scan history from localStorage.
 */
export function clearAllScans() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.warn("EcoScanAI: Failed to clear scan history", err);
    return [];
  }
}
