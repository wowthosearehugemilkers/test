/**
 * EcoScanAI - ConsequenceStrip Component
 * 
 * Renders disposal consequence results color-coded by result:
 * - accepted: Emerald / Green
 * - contaminated: Amber / Orange
 * - wasted: Rose / Red
 * 
 * Displays outcome title, text, missed actions ("You skipped: ..."),
 * takeaway, and guidance note.
 */

const RESULT_STYLES = {
  accepted: {
    bg: "from-emerald-900/40 to-green-950/60 border-emerald-500/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "✅",
    glow: "shadow-emerald-500/20",
    label: "Accepted"
  },
  contaminated: {
    bg: "from-amber-900/40 to-yellow-950/60 border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "⚠️",
    glow: "shadow-amber-500/20",
    label: "Contaminated"
  },
  wasted: {
    bg: "from-rose-900/40 to-red-950/60 border-rose-500/40",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: "❌",
    glow: "shadow-rose-500/20",
    label: "Wasted"
  }
};

export default function ConsequenceStrip({
  outcome,
  guidanceNote = null,
  onNext,
  onRetry,
  isLastItem = false
}) {
  if (!outcome) return null;

  const style = RESULT_STYLES[outcome.result] || RESULT_STYLES.wasted;
  const missedActions = outcome.missedActions || [];

  return (
    <div className="w-full animate-fadeIn">
      {/* Result Card */}
      <div
        className={`rounded-2xl border bg-gradient-to-br p-5 shadow-2xl backdrop-blur-xl ${style.bg} ${style.glow}`}
      >
        {/* Header pill */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${style.badge}`}>
            {style.icon} {style.label}
          </span>
          {outcome.needsFactCheck && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              Needs Fact Check
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-white text-lg font-bold tracking-tight mb-1.5">
          {outcome.title}
        </h3>
        <p className="text-white/70 text-xs leading-relaxed mb-3">
          {outcome.text}
        </p>

        {/* Skipped actions callout */}
        {missedActions.length > 0 && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <p className="text-amber-200 text-xs font-semibold flex items-center gap-1.5 mb-1">
              <span>⚠️</span>
              <span>You skipped required prep:</span>
            </p>
            <ul className="list-disc list-inside text-amber-300/80 text-[11px] space-y-0.5 ml-1">
              {missedActions.map((a) => (
                <li key={a.id}>{a.label}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Takeaway */}
        {outcome.takeaway && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-3">
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              💡 Key Takeaway
            </p>
            <p className="text-white/90 text-xs font-medium leading-relaxed">
              {outcome.takeaway}
            </p>
          </div>
        )}

        {/* App Guidance Note */}
        {guidanceNote && (
          <p className="text-white/40 text-[10px] italic border-t border-white/10 pt-2.5">
            📖 {guidanceNote}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-all active:scale-95"
        >
          ↩ Try Again
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          {isLastItem ? "🏆 Finish Session" : "Next Item ➔"}
        </button>
      </div>
    </div>
  );
}
