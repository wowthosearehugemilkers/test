/**
 * EcoScanAI - useLiveClassifier Hook
 * 
 * Provides live video frame classification using Teachable Machine (TensorFlow.js)
 * with center-crop preprocessing (224x224, normalized to [-1, 1]), leak-free tf.tidy(),
 * cadence of ~250ms, frame skipping, confidence gate with hysteresis, and mock fallback.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createConfidenceGate } from "../engine/confidenceGate.js";
import { getLiveItemInfo, LIVE_CLASS_CONFIG } from "../live/liveClassMap.js";

const PREDICTION_INTERVAL_MS = 250;

export function useLiveClassifier({ enabled = true } = {}) {
  const [source, setSource] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mock") === "1") return "mock";
    }
    return "tm";
  });

  const [mockClass, setMockClass] = useState("Plastic");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [labels, setLabels] = useState(() => Object.keys(LIVE_CLASS_CONFIG));
  const [gateResult, setGateResult] = useState({
    status: "idle",
    confirmedClass: null,
    confidence: 0,
    message: "Show me an item"
  });

  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const tfRef = useRef(null);
  const labelsRef = useRef(Object.keys(LIVE_CLASS_CONFIG));
  const isPredictingRef = useRef(false);
  const intervalRef = useRef(null);

  // Initialize Confidence Gate with useMemo for pure, leak-free stability
  const gate = useMemo(() => createConfidenceGate(), []);

  // ─── 1. LAZY LOAD TENSORFLOW.JS & MODEL ───────────────────────────
  useEffect(() => {
    if (source !== "tm") return;

    let isCancelled = false;

    async function loadModel() {
      setIsModelLoading(true);
      setModelError(null);

      try {
        // Fetch metadata.json for labels with fallback to canonical config
        let loadedLabels = Object.keys(LIVE_CLASS_CONFIG);
        try {
          const metaResp = await fetch("/tm-model/metadata.json");
          if (metaResp.ok) {
            const metadata = await metaResp.json();
            if (Array.isArray(metadata.labels) && metadata.labels.length > 0) {
              loadedLabels = metadata.labels;
            }
          }
        } catch (metaErr) {
          console.warn("[LiveClassifier] Using default labels fallback:", metaErr);
        }

        labelsRef.current = loadedLabels;
        if (!isCancelled) setLabels(loadedLabels);

        // Dynamically import @tensorflow/tfjs so initial bundle is not burdened
        const tf = await import("@tensorflow/tfjs");
        tfRef.current = tf;

        // Ensure safe backend for mobile Safari WebGL / WebGPU
        try {
          if (tf.getBackend() !== "webgl") {
            await tf.setBackend("webgl");
          }
        } catch (e) {
          console.warn("[LiveClassifier] WebGL setBackend fallback:", e);
        }

        try {
          tf.env().set("WEBGPU_IMPORT_EXTERNAL_TEXTURE", false);
        } catch {
          // ignore
        }

        await tf.ready();

        // Load Teachable Machine layers model
        const model = await tf.loadLayersModel("/tm-model/model.json");
        if (!isCancelled) {
          modelRef.current = model;
          setIsModelLoading(false);
          console.log("[LiveClassifier] Model loaded successfully with", loadedLabels.length, "labels");
        }
      } catch (err) {
        console.warn("[LiveClassifier] Failed to load TM model, falling back to mock mode:", err);
        if (!isCancelled) {
          setModelError(err.message || "Model load failed");
          setIsModelLoading(false);
          setSource("mock");
        }
      }
    }

    loadModel();

    return () => {
      isCancelled = true;
      if (modelRef.current) {
        try {
          modelRef.current.dispose();
          modelRef.current = null;
        } catch {
          // Ignore disposal errors
        }
      }
    };
  }, [source]);

  // ─── 2. INFERENCE LOOP (cadence ~250ms with frame-skipping) ───────
  const runPrediction = useCallback(async () => {
    // If mock mode is active
    if (source === "mock") {
      const mockPredictions = Object.keys(LIVE_CLASS_CONFIG).map((name) => ({
        className: name,
        probability: name === mockClass ? 0.95 : 0.01
      }));
      const result = gate.processFrame(mockPredictions);
      setGateResult(result);
      return;
    }

    // TM mode: verify video is ready, dimensions exist, and inference is not busy
    const video = videoRef.current;
    const model = modelRef.current;
    const tf = tfRef.current;

    if (
      !video ||
      !model ||
      !tf ||
      isPredictingRef.current ||
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    isPredictingRef.current = true;

    try {
      // Center-crop video frame to square, resize to 224x224, normalize to [-1, 1], expand dims
      const tensor = tf.tidy(() => {
        const pixels = tf.browser.fromPixels(video);
        const [h, w] = [pixels.shape[0], pixels.shape[1]];
        const size = Math.min(h, w);
        const startY = Math.floor((h - size) / 2);
        const startX = Math.floor((w - size) / 2);

        const cropped = pixels.slice([startY, startX, 0], [size, size, 3]);
        const resized = tf.image.resizeBilinear(cropped, [224, 224]);
        const normalized = resized.div(127.5).sub(1);
        return normalized.expandDims(0);
      });

      const prediction = model.predict(tensor);
      const probabilities = await prediction.data();

      // Clean up tensors
      tensor.dispose();
      prediction.dispose();

      // Map probabilities to label names using ref to avoid stale closures
      const currentLabels = labelsRef.current.length > 0 ? labelsRef.current : labels;
      const predictions = currentLabels.map((labelName, i) => ({
        className: labelName,
        probability: probabilities[i] || 0
      }));

      // Pass through confidence gate
      const result = gate.processFrame(predictions);
      setGateResult(result);
    } catch (err) {
      console.warn("[LiveClassifier] Prediction error:", err);
    } finally {
      isPredictingRef.current = false;
    }
  }, [source, mockClass, labels, gate]);

  // Start/stop interval based on enabled flag or mock mode
  useEffect(() => {
    const isRunning = enabled || source === "mock";
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(runPrediction, PREDICTION_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, source, runPrediction]);

  // Reset gate when source or mock class changes
  useEffect(() => {
    gate.reset();
  }, [source, mockClass, gate]);

  const activeConfirmedClass = gateResult.status === "locked" ? gateResult.confirmedClass : null;
  const itemInfo = activeConfirmedClass ? getLiveItemInfo(activeConfirmedClass) : null;

  return {
    videoRef,
    source,
    setSource,
    mockClass,
    setMockClass,
    availableMockClasses: Object.keys(LIVE_CLASS_CONFIG),
    gateResult,
    itemInfo,
    isModelLoading,
    modelError
  };
}
