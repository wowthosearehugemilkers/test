/**
 * EcoScanAI - LiveCamScreen Component
 * 
 * Full-screen camera interface featuring real-time Teachable Machine classification,
 * zero-flicker HUD overlay with corner brackets, verified carbon emission estimates,
 * disposal guidance, safe-area padding, and direct "Prep It" interactive routing.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLiveClassifier } from "../hooks/useLiveClassifier.js";

export default function LiveCamScreen({ onClose, onOpenPrep }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasFallbackImage, setHasFallbackImage] = useState(false);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStartingRef = useRef(false);

  const {
    videoRef,
    source,
    setSource,
    mockClass,
    setMockClass,
    availableMockClasses,
    gateResult,
    itemInfo,
    isModelLoading,
    modelError,
    scanFrameWithGroq,
    isGroqScanning,
    groqError
  } = useLiveClassifier({ enabled: cameraActive || hasFallbackImage });

  // ─── CAMERA LIFECYCLE ─────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not accessible (requires HTTPS and supported browser).");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;
        video.srcObject = stream;

        // Try direct playback immediately
        try {
          await video.play();
          setCameraActive(true);
        } catch (playErr) {
          console.warn("[LiveCam] Direct video.play() note:", playErr);
        }

        // Additional listener safety for mobile browsers
        video.onloadeddata = () => setCameraActive(true);
        video.onplaying = () => setCameraActive(true);
        video.oncanplay = () => setCameraActive(true);
      }
    } catch (err) {
      console.warn("[LiveCam] Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device. You can test with Mock Mode or upload an image.");
      } else {
        setCameraError(`Unable to start camera: ${err.message || "Unknown error"}.`);
      }
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [videoRef]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Mount/unmount: starts camera once on mount, cleans up tracks on unmount
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle image upload fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      // Draw to a hidden canvas and assign to video element
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      if (videoRef.current) {
        // Create synthetic video stream from canvas
        const canvasStream = canvas.captureStream();
        videoRef.current.srcObject = canvasStream;
        videoRef.current.play().catch(() => {});
        setHasFallbackImage(true);
        setCameraActive(true);
      }
    };
  };

  const isLocked = gateResult.status === "locked" && itemInfo;
  const isUncertain = gateResult.status === "uncertain";
  const confidencePercent = Math.round((gateResult.confidence || 0) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none">
      {/* ─── FULL-SCREEN VIDEO FEED ──────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Initial Camera Connect Indicator & Manual Tap Fallback */}
        {!cameraActive && source !== "mock" && !hasFallbackImage && !cameraError && (
          <div
            onClick={startCamera}
            className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl mb-4 animate-pulse">
              📷
            </div>
            <h3 className="text-white text-base font-bold mb-1">Starting Camera...</h3>
            <p className="text-white/60 text-xs max-w-xs mb-4 leading-relaxed">
              If camera feed does not appear automatically, tap below to grant access.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
            >
              Enable Camera Feed
            </button>
          </div>
        )}

        {/* Model Loading Fallback Notice */}
        {modelError && (
          <div className="absolute top-16 left-4 right-4 z-40 bg-amber-500/20 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5 backdrop-blur-md shadow-lg">
            <span className="text-amber-300 text-base flex-shrink-0 mt-0.5">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 text-xs font-semibold">Vision Model Notice</p>
              <p className="text-amber-100/70 text-[11px] leading-snug">
                Could not load live TensorFlow.js model ({modelError}). Live Cam has switched to Mock Mode so you can still test interactions.
              </p>
            </div>
          </div>
        )}

        {/* Camera Permission / Error Banner */}
        {cameraError && (
          <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center z-40 max-w-sm mx-auto">
            <span className="text-4xl mb-3">📷</span>
            <h3 className="text-white text-lg font-bold mb-2">Camera Unavailable</h3>
            <p className="text-white/60 text-xs mb-6 leading-relaxed">{cameraError}</p>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => setSource("mock")}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
              >
                Switch to Mock Mode
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
              >
                Upload Test Image
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-2.5 rounded-xl border border-white/10 text-white/50 text-xs"
              >
                Retry Camera
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* ─── SCANNER TARGET BRACKETS ───────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* 4 Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />

            {/* Subtle animated scanning beam */}
            {cameraActive && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
                style={{ animation: "scan 2.2s ease-in-out infinite" }}
              />
            )}
          </div>
        </div>

        {/* ─── HUD OVERLAY WITH SAFE-AREA PADDING ─────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col justify-between pointer-events-none z-30"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            paddingLeft: "16px",
            paddingRight: "16px"
          }}
        >
          {/* Top Controls Bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>✕</span> Close
            </button>

            {/* Mode / Engine Selector */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-xl">
              <span className="text-white/40 text-[10px] font-semibold uppercase">Engine:</span>
              <select
                value={source === "mock" ? `mock:${mockClass}` : source}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "groq") {
                    setSource("groq");
                  } else if (val === "tm") {
                    setSource("tm");
                  } else if (val.startsWith("mock:")) {
                    setSource("mock");
                    setMockClass(val.replace("mock:", ""));
                  }
                }}
                className="bg-transparent text-emerald-300 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="groq" className="bg-neutral-900 text-white">
                  ⚡ Groq Cloud AI (High Accuracy)
                </option>
                <option value="tm" className="bg-neutral-900 text-white">
                  🧠 Teachable Machine (Local)
                </option>
                <optgroup label="Simulated Items" className="bg-neutral-900 text-white/70">
                  {availableMockClasses.map((cls) => (
                    <option key={cls} value={`mock:${cls}`} className="bg-neutral-900 text-white">
                      Mock: {cls}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Top Center: Item Name & Confidence Bar */}
          <div className="w-full flex flex-col items-center pointer-events-none mt-2">
            {isModelLoading ? (
              <div className="px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <span>Loading Vision Model...</span>
              </div>
            ) : isGroqScanning ? (
              <div className="px-4 py-2 rounded-full bg-teal-500/20 backdrop-blur-md border border-teal-500/40 text-teal-200 text-xs font-medium flex items-center gap-2 animate-pulse">
                <span className="w-3 h-3 rounded-full border-2 border-teal-300 border-t-transparent animate-spin" />
                <span>Analyzing frame with Groq AI...</span>
              </div>
            ) : isLocked ? (
              <div className="w-full max-w-xs px-4 py-3 rounded-2xl bg-black/75 backdrop-blur-md border border-emerald-500/40 shadow-xl shadow-emerald-500/10 flex flex-col items-center animate-fadeIn">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {source === "groq" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      GROQ AI
                    </span>
                  )}
                  {source === "tm" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TM MODEL
                    </span>
                  )}
                  <span className="text-white font-bold text-base tracking-tight text-center">
                    {itemInfo.displayName}
                  </span>
                </div>

                {/* Confidence Bar */}
                <div className="w-full mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-emerald-400/50"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <span className="text-emerald-300 text-xs font-bold tabular-nums">
                    {confidencePercent}%
                  </span>
                </div>
              </div>
            ) : isUncertain ? (
              <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 animate-fadeIn">
                <span>⚠️</span>
                <span>Not sure, move closer or change angle</span>
              </div>
            ) : source === "groq" ? (
              <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-teal-500/30 text-teal-300 text-xs font-medium flex items-center gap-1.5 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Aim camera at item & tap Snap</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white/70 text-xs font-medium flex items-center gap-1.5 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Show me an item</span>
              </div>
            )}
          </div>

          {/* Bottom Area: Action Button + Info Cards */}
          <div className="w-full flex flex-col gap-2.5 pointer-events-auto">
            {/* Groq Error Banner if any */}
            {groqError && (
              <div className="px-3.5 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center backdrop-blur-md shadow-lg">
                ⚠️ {groqError}
              </div>
            )}

            {/* "Prep It" Button (Shown ONLY when class maps to a prep item) */}
            {isLocked && itemInfo?.canPrep && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onOpenPrep(itemInfo.itemId);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-black font-black text-sm tracking-wide shadow-2xl shadow-emerald-500/40 flex items-center justify-center gap-2 transition-all"
              >
                <span>🧼</span>
                <span>Prep This {itemInfo.displayName.split(" ")[0]} Now ➔</span>
              </button>
            )}

            {/* Groq Snap / Analyze Shutter Button */}
            {source === "groq" && (
              <button
                type="button"
                disabled={isGroqScanning || (!cameraActive && !hasFallbackImage)}
                onClick={scanFrameWithGroq}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-500/90 hover:bg-teal-400 active:scale-95 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGroqScanning ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Analyzing Frame with Groq AI...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>{isLocked ? "Snap Again with Groq AI" : "Snap & Analyze with Groq AI"}</span>
                  </>
                )}
              </button>
            )}

            {/* Bottom Cards: Carbon Emission & Dispose In */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Bottom Left Card: Carbon Emission */}
              <div className="p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-left flex flex-col justify-between">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Carbon emission
                  </p>
                  <p className="text-white/60 text-[10px] mt-0.5">
                    Est. CO2 saved if recycled:
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-emerald-300 font-extrabold text-sm leading-tight">
                    {isLocked ? itemInfo.carbonText : "Point at item"}
                  </p>
                  <p className="text-white/30 text-[9px] mt-0.5">
                    {isLocked && itemInfo.hasNumericEstimate ? "(Estimate)" : ""}
                  </p>
                </div>
              </div>

              {/* Bottom Right Card: Dispose In */}
              <div className="p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-left flex flex-col justify-between">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    Dispose in
                  </p>
                  <div className="mt-1">
                    {isLocked ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 inline-block">
                        {itemInfo.binColor} Bin
                      </span>
                    ) : (
                      <span className="text-white/30 text-[11px]">Awaiting scan</span>
                    )}
                  </div>
                </div>
                <p className="text-white/60 text-[10px] mt-1.5 leading-snug line-clamp-2">
                  {isLocked ? itemInfo.tip : "Position within brackets"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 5%; }
          50% { top: 92%; }
        }
      `}</style>
    </div>
  );
}
