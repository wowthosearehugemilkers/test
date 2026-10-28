/**
 * EcoScanAI - BinTray Component
 * 
 * Renders the 3 disposal bins (recycling, compost, general).
 * Supports both touch-friendly HTML5 Pointer Event drag-and-drop
 * and tap-to-select fallback (no third-party drag libraries).
 */

import { useRef, useState, useCallback, useEffect } from "react";

const BINS = [
  {
    id: "recycling",
    label: "Recycling",
    emoji: "♻️",
    subtext: "Blue / Clean",
    color: "blue",
    borderClass: "border-blue-500/30 hover:border-blue-400 bg-blue-500/10 text-blue-300",
    activeClass: "border-blue-400 bg-blue-500/30 ring-2 ring-blue-400/50 scale-105"
  },
  {
    id: "compost",
    label: "Compost",
    emoji: "🌿",
    subtext: "Green / Organics",
    color: "emerald",
    borderClass: "border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/10 text-emerald-300",
    activeClass: "border-emerald-400 bg-emerald-500/30 ring-2 ring-emerald-400/50 scale-105"
  },
  {
    id: "general",
    label: "General",
    emoji: "🗑️",
    subtext: "Landfill / Trash",
    color: "stone",
    borderClass: "border-stone-500/30 hover:border-stone-400 bg-stone-500/10 text-stone-300",
    activeClass: "border-stone-400 bg-stone-500/30 ring-2 ring-stone-400/50 scale-105"
  }
];

export default function BinTray({ onSelectBin, activeBin = null, isItemReady = true }) {
  const binRefs = useRef({});
  const [hoveredBin, setHoveredBin] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const isDraggingRef = useRef(false);

  // Check which bin the pointer coordinates are hovering over
  const checkHitBin = useCallback((clientX, clientY) => {
    for (const bin of BINS) {
      const el = binRefs.current[bin.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return bin.id;
        }
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e) => {
    e.target.setPointerCapture?.(e.pointerId);
    isDraggingRef.current = true;
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
    const hit = checkHitBin(e.clientX, e.clientY);
    setHoveredBin(hit);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const finalBin = checkHitBin(e.clientX, e.clientY);
    setHoveredBin(null);
    setDragPosition(null);

    if (finalBin) {
      onSelectBin(finalBin);
    }
  };

  // Clean up if pointer is cancelled
  useEffect(() => {
    const handleGlobalUp = () => {
      isDraggingRef.current = false;
      setDragPosition(null);
      setHoveredBin(null);
    };
    window.addEventListener("pointerup", handleGlobalUp);
    return () => window.removeEventListener("pointerup", handleGlobalUp);
  }, []);

  return (
    <div className="w-full mt-4 select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">
          Select Target Bin
        </span>
        <span className="text-white/30 text-[11px]">Tap bin or drag handle</span>
      </div>

      {/* Touch Drag Grip / Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full py-2 mb-2.5 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-colors"
      >
        <span className="text-emerald-400 text-sm">⠿</span>
        <span className="text-white/60 text-xs font-medium">Drag into bin below</span>
      </div>

      {/* Floating Drag Avatar */}
      {dragPosition && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-emerald-500 text-black font-bold text-xs shadow-2xl flex items-center gap-1.5"
          style={{ left: `${dragPosition.x}px`, top: `${dragPosition.y}px` }}
        >
          <span>📦</span>
          <span>Sorting...</span>
        </div>
      )}

      {/* 3 Bins Grid */}
      <div className="grid grid-cols-3 gap-2">
        {BINS.map((bin) => {
          const isHighlighted = hoveredBin === bin.id || activeBin === bin.id;

          return (
            <button
              key={bin.id}
              ref={(el) => (binRefs.current[bin.id] = el)}
              type="button"
              disabled={!isItemReady}
              onClick={() => onSelectBin(bin.id)}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 ${
                isHighlighted ? bin.activeClass : bin.borderClass
              }`}
            >
              <span className="text-2xl mb-1">{bin.emoji}</span>
              <p className="text-white font-bold text-xs leading-tight">{bin.label}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{bin.subtext}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
