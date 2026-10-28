/**
 * EcoScanAI - PrepBench Component
 * 
 * Interactive prep bench rendering the reactive SVG, part state indicators,
 * available/disabled action chips with feedback, and instructions.
 */

import PlasticBottleSvg from "../svg/plastic_bottle.jsx";
import GlassJarSvg from "../svg/glass_jar.jsx";
import PizzaBoxSvg from "../svg/pizza_box.jsx";

const SVG_COMPONENTS = {
  plastic_bottle: PlasticBottleSvg,
  glass_jar: GlassJarSvg,
  pizza_box: PizzaBoxSvg
};

export default function PrepBench({
  itemData,
  currentParts,
  availableActions = [],
  onApplyAction,
  lastFeedback = null,
  isDragging = false
}) {
  if (!itemData) return null;

  const SvgComponent = SVG_COMPONENTS[itemData.id] || PlasticBottleSvg;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Item Headline */}
      <div className="w-full text-center mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-block mb-1">
          Prep Station
        </span>
        <h2 className="text-white text-xl font-bold tracking-tight">{itemData.title}</h2>
      </div>

      {/* Interactive Visual Stage */}
      <div className={`relative w-full max-w-xs bg-white/5 border rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 ${
        isDragging ? "border-emerald-400 bg-emerald-500/10 scale-95" : "border-white/10 hover:border-white/20"
      }`}>
        <div className="cursor-grab active:cursor-grabbing">
          <SvgComponent parts={currentParts} />
        </div>
        <p className="text-white/30 text-[11px] mt-1 flex items-center gap-1">
          <span>👆</span> Tap actions below, or drag item to a bin
        </p>
      </div>

      {/* Part State Chips */}
      <div className="w-full mt-3 flex flex-wrap gap-1.5 justify-center">
        {Object.entries(currentParts).map(([partKey, partVal]) => (
          <span
            key={partKey}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
              partVal === "empty" || partVal === "removed" || partVal === "split"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-white/5 text-white/70 border-white/10"
            }`}
          >
            <span className="text-white/40 capitalize">{partKey}:</span> {partVal}
          </span>
        ))}
      </div>

      {/* Action Chips */}
      <div className="w-full mt-4 space-y-2">
        <p className="text-white/50 text-xs uppercase tracking-wider text-center font-semibold">
          Decontamination Actions
        </p>
        <div className="flex flex-col gap-2">
          {availableActions.map((action) => {
            const isEnabled = action.enabled;

            return (
              <div key={action.id} className="w-full flex flex-col">
                <button
                  type="button"
                  disabled={!isEnabled}
                  onClick={() => onApplyAction(action.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98] ${
                    isEnabled
                      ? action.required
                        ? "bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                        : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30"
                      : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{isEnabled ? "✨" : "🔒"}</span>
                    {action.label}
                  </span>
                  {action.informational && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      Optional
                    </span>
                  )}
                  {action.required && isEnabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                      Required
                    </span>
                  )}
                </button>

                {/* Disabled Reason hint */}
                {!isEnabled && action.disabledReason && (
                  <span className="text-white/40 text-[10px] px-2 py-0.5 text-left italic">
                    ℹ️ {action.disabledReason}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Feedback Line */}
      {lastFeedback && (
        <div className="w-full mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-fadeIn">
          <p className="text-emerald-300 text-xs leading-relaxed flex items-start gap-1.5">
            <span className="text-sm">💡</span>
            <span>{lastFeedback}</span>
          </p>
        </div>
      )}
    </div>
  );
}
