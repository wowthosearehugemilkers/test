/**
 * EcoScanAI - PrepPage Component
 * 
 * Interactive decontamination & pre-sorting experience.
 * Manages steps: 'scan' -> 'prep' -> 'result' -> 'completed'.
 * Uses a pure useReducer state machine and hooks/usePrepScanner.
 */

import { useReducer, useEffect, useState } from "react";
import { usePrepScanner } from "./hooks/usePrepScanner.js";
import PrepBench from "./components/PrepBench.jsx";
import BinTray from "./components/BinTray.jsx";
import ConsequenceStrip from "./components/ConsequenceStrip.jsx";
import LiveCamScreen from "./live/LiveCamScreen.jsx";
import {
  initItem,
  getAvailableActions,
  applyAction,
  evaluateOutcome
} from "./engine/index.js";

const TOTAL_SESSION_ITEMS = 3;

const initialState = {
  step: "scan", // "scan" | "prep" | "result" | "completed"
  itemData: null,
  currentParts: {},
  availableActions: [],
  lastFeedback: null,
  selectedBin: null,
  outcome: null,
  completedItems: []
};

function prepReducer(state, action) {
  switch (action.type) {
    case "SELECT_ITEM": {
      const itemData = action.payload.itemData;
      const currentParts = initItem(itemData);
      const availableActions = getAvailableActions(itemData, currentParts);

      return {
        ...state,
        step: "prep",
        itemData,
        currentParts,
        availableActions,
        lastFeedback: null,
        selectedBin: null,
        outcome: null
      };
    }

    case "APPLY_ACTION": {
      try {
        const result = applyAction(state.itemData, state.currentParts, action.payload.actionId);
        const availableActions = getAvailableActions(state.itemData, result.currentParts);

        return {
          ...state,
          currentParts: result.currentParts,
          availableActions,
          lastFeedback: result.feedback
        };
      } catch (err) {
        return {
          ...state,
          lastFeedback: `⚠️ ${err.message}`
        };
      }
    }

    case "SUBMIT_BIN": {
      try {
        const outcome = evaluateOutcome(state.itemData, state.currentParts, action.payload.bin);
        return {
          ...state,
          step: "result",
          selectedBin: action.payload.bin,
          outcome
        };
      } catch (err) {
        return {
          ...state,
          lastFeedback: `⚠️ ${err.message}`
        };
      }
    }

    case "RETRY_ITEM": {
      const currentParts = initItem(state.itemData);
      const availableActions = getAvailableActions(state.itemData, currentParts);

      return {
        ...state,
        step: "prep",
        currentParts,
        availableActions,
        lastFeedback: null,
        selectedBin: null,
        outcome: null
      };
    }

    case "NEXT_ITEM": {
      const updatedCompleted = [
        ...state.completedItems,
        {
          id: state.itemData.id,
          title: state.itemData.title,
          result: state.outcome?.result || "accepted"
        }
      ];

      if (updatedCompleted.length >= TOTAL_SESSION_ITEMS) {
        return {
          ...state,
          step: "completed",
          completedItems: updatedCompleted
        };
      }

      return {
        ...state,
        step: "scan",
        itemData: null,
        currentParts: {},
        availableActions: [],
        lastFeedback: null,
        selectedBin: null,
        outcome: null,
        completedItems: updatedCompleted
      };
    }

    case "RESTART_SESSION": {
      return {
        ...initialState
      };
    }

    default:
      return state;
  }
}

export default function PrepPage({ onBack }) {
  const [state, dispatch] = useReducer(prepReducer, initialState);
  const [showLiveCam, setShowLiveCam] = useState(false);
  const { availableClasses, selectItemByClass, selectItemById } = usePrepScanner();

  // Scroll to top on step transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  const handlePickMockClass = (tmClass) => {
    const itemData = selectItemByClass(tmClass);
    if (itemData) {
      dispatch({ type: "SELECT_ITEM", payload: { itemData } });
    }
  };

  const handleOpenPrepFromLiveCam = (itemId) => {
    setShowLiveCam(false);
    const itemData = selectItemById(itemId);
    if (itemData) {
      dispatch({ type: "SELECT_ITEM", payload: { itemData } });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fadeIn pb-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-white/50 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
        >
          <span>←</span> Back to Main
        </button>
        <span className="text-white/40 text-[11px] font-medium">
          Item {Math.min(state.completedItems.length + 1, TOTAL_SESSION_ITEMS)} of {TOTAL_SESSION_ITEMS}
        </span>
      </div>

      {/* Progress Dots */}
      <div className="flex gap-1.5 mb-5 justify-center">
        {Array.from({ length: TOTAL_SESSION_ITEMS }).map((_, idx) => {
          const completedItem = state.completedItems[idx];
          const isActive = idx === state.completedItems.length && state.step !== "completed";

          let dotClass = "bg-white/10";
          if (completedItem) {
            dotClass = completedItem.result === "accepted" ? "bg-emerald-400" : "bg-amber-400";
          } else if (isActive) {
            dotClass = "bg-emerald-400 ring-4 ring-emerald-500/20";
          }

          return (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive ? "w-8" : "w-4"
              } ${dotClass}`}
            />
          );
        })}
      </div>

      {/* ─── STEP 1: SCAN / MOCK SELECTION ─────────────────────────── */}
      {state.step === "scan" && (
        <div className="animate-fadeIn">
          <div className="text-center mb-5">
            <span className="text-3xl mb-1.5 inline-block">🧼</span>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Decontamination Lab
            </h1>
            <p className="text-white/50 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
              Scan with the live camera or choose a simulated item to decontaminate:
            </p>
          </div>

          {/* Primary Action: Open Full-Screen Live Cam */}
          <button
            type="button"
            onClick={() => setShowLiveCam(true)}
            className="w-full mb-4 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-teal-500/25 border border-emerald-500/50 hover:bg-emerald-500/40 text-emerald-200 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span className="text-base">📷</span>
            <span>Open Real-Time Live Cam Scanner</span>
          </button>

          <div className="relative flex py-2 items-center mb-3">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-white/30 text-[10px] uppercase font-bold tracking-widest">or pick sample item</span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <div className="space-y-3">
            {availableClasses.map((tmClass) => {
              const icons = {
                "Plastic Bottle": "🧴",
                "Glass Jar": "🥫",
                "Pizza Box": "🍕"
              };
              const subheadings = {
                "Plastic Bottle": "PET bottle with soda residue & cap",
                "Glass Jar": "Glass jar with pasta sauce & metal lid",
                "Pizza Box": "Cardboard box with cheese & oil stains"
              };

              return (
                <button
                  key={tmClass}
                  type="button"
                  onClick={() => handlePickMockClass(tmClass)}
                  className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-left transition-all active:scale-[0.98] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {icons[tmClass] || "📦"}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight group-hover:text-emerald-300 transition-colors">
                        {tmClass}
                      </h3>
                      <p className="text-white/40 text-xs mt-0.5">
                        {subheadings[tmClass] || "Simulated waste item"}
                      </p>
                    </div>
                  </div>
                  <span className="text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all text-sm font-bold">
                    ➔
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/40 text-[11px] text-center">
              💡 Mock Mode active. Ready for Teachable Machine model injection.
            </p>
          </div>
        </div>
      )}

      {/* ─── STEP 2: PREP BENCH & BIN TRAY ─────────────────────────── */}
      {state.step === "prep" && (
        <div className="animate-fadeIn">
          <PrepBench
            itemData={state.itemData}
            currentParts={state.currentParts}
            availableActions={state.availableActions}
            onApplyAction={(actionId) =>
              dispatch({ type: "APPLY_ACTION", payload: { actionId } })
            }
            lastFeedback={state.lastFeedback}
          />

          <BinTray
            isItemReady={true}
            onSelectBin={(bin) =>
              dispatch({ type: "SUBMIT_BIN", payload: { bin } })
            }
          />
        </div>
      )}

      {/* ─── STEP 3: RESULT & CONSEQUENCES ─────────────────────────── */}
      {state.step === "result" && (
        <div className="animate-fadeIn">
          <ConsequenceStrip
            outcome={state.outcome}
            guidanceNote={state.itemData?.guidanceNote}
            isLastItem={state.completedItems.length + 1 >= TOTAL_SESSION_ITEMS}
            onRetry={() => dispatch({ type: "RETRY_ITEM" })}
            onNext={() => dispatch({ type: "NEXT_ITEM" })}
          />
        </div>
      )}

      {/* ─── STEP 4: SESSION COMPLETED ─────────────────────────────── */}
      {state.step === "completed" && (
        <div className="animate-fadeIn text-center py-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-4xl mb-4 shadow-xl shadow-emerald-500/20">
            🏆
          </div>

          <h2 className="text-white text-2xl font-bold tracking-tight mb-2">
            Decontamination Complete!
          </h2>
          <p className="text-white/60 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
            You successfully navigated composite item preparation and prevented recycling batch contamination.
          </p>

          {/* Session Summary Breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-2 text-left">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">
              Items Processed ({state.completedItems.length})
            </p>
            {state.completedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0"
              >
                <span className="text-white text-xs font-medium">{item.title}</span>
                <span
                  className={`text-[11px] font-bold capitalize px-2 py-0.5 rounded-full ${
                    item.result === "accepted"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : item.result === "contaminated"
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-rose-400 bg-rose-500/10"
                  }`}
                >
                  {item.result}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "RESTART_SESSION" })}
              className="w-full py-3 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              🔄 Start New Prep Session
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs font-medium transition-all"
            >
              ← Return to Main Scanner
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Real-Time Live Cam */}
      {showLiveCam && (
        <LiveCamScreen
          onClose={() => setShowLiveCam(false)}
          onOpenPrep={handleOpenPrepFromLiveCam}
        />
      )}
    </div>
  );
}
