/**
 * EcoScanAI - Test Suite for Confidence Gate with Hysteresis
 * 
 * Tests locking after 5 stable frames, flicker resistance (1-7 bad frames),
 * lock release after 8 bad frames, margin thresholding, and idle state.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createConfidenceGate,
  MIN_CONFIDENCE,
  MIN_MARGIN,
  LOCK_FRAMES,
  RELEASE_FRAMES,
  IDLE_THRESHOLD
} from "./confidenceGate.js";

test("Confidence Gate - Constants verification", () => {
  assert.equal(MIN_CONFIDENCE, 0.8);
  assert.equal(MIN_MARGIN, 0.2);
  assert.equal(LOCK_FRAMES, 5);
  assert.equal(RELEASE_FRAMES, 8);
  assert.equal(IDLE_THRESHOLD, 0.45);
});

test("Confidence Gate - Locks after exactly 5 stable frames", () => {
  const gate = createConfidenceGate();
  const framePlastic = [
    { className: "Plastic", probability: 0.92 },
    { className: "Trash", probability: 0.05 }
  ];

  // Frames 1 through 4: uncertain accumulation
  for (let i = 1; i <= 4; i++) {
    const res = gate.processFrame(framePlastic);
    assert.equal(res.status, "uncertain", `Frame ${i} should be uncertain`);
    assert.equal(res.confirmedClass, null);
  }

  // Frame 5: locks
  const lockRes = gate.processFrame(framePlastic);
  assert.equal(lockRes.status, "locked");
  assert.equal(lockRes.confirmedClass, "Plastic");
  assert.equal(lockRes.confidence, 0.92);
});

test("Confidence Gate - Hysteresis prevents flickering (1-7 bad frames hold lock)", () => {
  const gate = createConfidenceGate();
  const goodFrame = [
    { className: "Plastic", probability: 0.90 },
    { className: "Trash", probability: 0.05 }
  ];
  const noisyFrame = [
    { className: "Shoes", probability: 0.50 },
    { className: "Plastic", probability: 0.40 }
  ];

  // Lock first with 5 good frames
  for (let i = 0; i < 5; i++) {
    gate.processFrame(goodFrame);
  }
  assert.equal(gate.getLockedClass(), "Plastic");

  // Feed 7 noisy frames: lock must hold without flickering
  for (let i = 1; i <= 7; i++) {
    const res = gate.processFrame(noisyFrame);
    assert.equal(res.status, "locked", `Frame ${i} under release threshold must remain locked`);
    assert.equal(res.confirmedClass, "Plastic");
    assert.equal(res.isReleasing, true);
  }

  // If a good frame arrives on frame 8, the release counter resets and lock persists
  const recoverRes = gate.processFrame(goodFrame);
  assert.equal(recoverRes.status, "locked");
  assert.equal(recoverRes.isReleasing, undefined);
});

test("Confidence Gate - Releases lock after 8 consecutive unmatching frames", () => {
  const gate = createConfidenceGate();
  const goodFrame = [
    { className: "Plastic", probability: 0.90 },
    { className: "Trash", probability: 0.05 }
  ];
  const unmatchingFrame = [
    { className: "Shoes", probability: 0.85 },
    { className: "Trash", probability: 0.10 }
  ];

  // Lock onto Plastic
  for (let i = 0; i < 5; i++) {
    gate.processFrame(goodFrame);
  }
  assert.equal(gate.getLockedClass(), "Plastic");

  // Feed 8 consecutive frames of Shoes
  for (let i = 1; i <= 7; i++) {
    const res = gate.processFrame(unmatchingFrame);
    assert.equal(res.status, "locked", `Frame ${i} must hold lock`);
  }

  // 8th unmatching frame triggers release
  const released = gate.processFrame(unmatchingFrame);
  assert.notEqual(released.confirmedClass, "Plastic");
  assert.equal(gate.getLockedClass(), null);
});

test("Confidence Gate - Rejects insufficient margin (top2 too close to top1)", () => {
  const gate = createConfidenceGate();
  // Probability is high (0.85), but margin is 0.85 - 0.75 = 0.10 (< 0.20 required)
  const closeMarginFrame = [
    { className: "Plastic", probability: 0.85 },
    { className: "Glass", probability: 0.75 }
  ];

  for (let i = 0; i < 10; i++) {
    const res = gate.processFrame(closeMarginFrame);
    assert.equal(res.status, "uncertain");
    assert.equal(res.confirmedClass, null);
  }
  assert.equal(gate.getLockedClass(), null);
});

test("Confidence Gate - Idle state when top class is below idle threshold", () => {
  const gate = createConfidenceGate();
  const lowFrame = [
    { className: "Plastic", probability: 0.30 },
    { className: "Trash", probability: 0.25 }
  ];

  const res = gate.processFrame(lowFrame);
  assert.equal(res.status, "idle");
  assert.equal(res.message, "Show me an item");
});
