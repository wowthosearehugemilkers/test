/**
 * EcoScanAI - Test Suite for Prep Engine
 * 
 * Tests every item x every bin x prepped/unprepped states,
 * action validation, immutability, available actions & disabled reasons.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  initItem,
  getAvailableActions,
  getMissedActions,
  applyAction,
  evaluateOutcome
} from "../engine/index.js";

import {
  BACKGROUND_CLASS,
  CLASS_MAP,
  ITEMS_BY_ID,
  getItemIdByClass,
  getItemDataByClass
} from "../data/classMap.js";

import plasticBottleData from "../data/items/plastic_bottle.json" with { type: "json" };
import glassJarData from "../data/items/glass_jar.json" with { type: "json" };
import pizzaBoxData from "../data/items/pizza_box.json" with { type: "json" };

const ALL_ITEMS = [plasticBottleData, glassJarData, pizzaBoxData];
const ALL_BINS = ["recycling", "general", "compost"];

test("Class Map & Background Configuration", () => {
  assert.equal(BACKGROUND_CLASS, "Background");
  assert.equal(CLASS_MAP["Plastic Bottle"], "plastic_bottle");
  assert.equal(CLASS_MAP["Glass Jar"], "glass_jar");
  assert.equal(CLASS_MAP["Pizza Box"], "pizza_box");

  assert.equal(getItemIdByClass("Plastic Bottle"), "plastic_bottle");
  assert.equal(getItemIdByClass("Glass Jar"), "glass_jar");
  assert.equal(getItemIdByClass("Pizza Box"), "pizza_box");
  assert.equal(getItemIdByClass("Unknown Object"), null);

  assert.equal(getItemDataByClass("Plastic Bottle").id, "plastic_bottle");
  assert.equal(getItemDataByClass("Glass Jar").id, "glass_jar");
  assert.equal(getItemDataByClass("Pizza Box").id, "pizza_box");
  assert.equal(getItemDataByClass("Unknown"), null);
});

test("Pure Engine - Immutability & Action Execution", () => {
  for (const item of ALL_ITEMS) {
    const initial = initItem(item);
    const frozenState = Object.freeze({ ...initial });

    // Available actions
    const available = getAvailableActions(item, frozenState);
    assert.ok(Array.isArray(available));
    assert.ok(available.length > 0);

    // Apply first valid action
    const firstAction = available.find((a) => a.enabled);
    assert.ok(firstAction, `Expected at least one enabled action for ${item.id}`);

    const result = applyAction(item, frozenState, firstAction.id);
    assert.notEqual(result.currentParts, frozenState);
    assert.equal(result.action.id, firstAction.id);
    assert.ok(typeof result.feedback === "string" && result.feedback.length > 0);

    // Ensure original state was untouched
    assert.deepEqual(frozenState, initial);
  }
});

test("Invalid Action Handling", () => {
  const item = plasticBottleData;
  const initial = initItem(item);

  // 1. Non-existent action
  assert.throws(() => {
    applyAction(item, initial, "fake_action_123");
  }, /not found/);

  // 2. Unmet precondition
  const prepped = applyAction(item, initial, "rinse_empty").currentParts;
  assert.equal(prepped.contents, "empty");

  // Attempting to rinse again should fail because requires contents="residue"
  assert.throws(() => {
    applyAction(item, prepped, "rinse_empty");
  }, /cannot be applied: requires contents="residue"/);
});

test("getAvailableActions and getMissedActions Behavior", () => {
  const item = plasticBottleData;
  const initial = initItem(item);

  // Missed actions before prep
  const missedBefore = getMissedActions(item, initial);
  assert.equal(missedBefore.length, 1);
  assert.equal(missedBefore[0].id, "rinse_empty");

  // After rinse, missed actions should be 0 (cap is informational so it is never a missed action)
  const prepped = applyAction(item, initial, "rinse_empty").currentParts;
  const missedAfter = getMissedActions(item, prepped);
  assert.equal(missedAfter.length, 0);

  // Initially rinse_empty is enabled
  const actions1 = getAvailableActions(item, initial);
  const rinseAction1 = actions1.find((a) => a.id === "rinse_empty");
  assert.equal(rinseAction1.enabled, true);
  assert.equal(rinseAction1.disabledReason, null);

  // After rinse, rinse_empty is disabled with reason
  const actions2 = getAvailableActions(item, prepped);
  const rinseAction2 = actions2.find((a) => a.id === "rinse_empty");
  assert.equal(rinseAction2.enabled, false);
  assert.match(rinseAction2.disabledReason, /Requires contents to be "residue"/);
});

test("Plastic Bottle - Outcomes across All Bins x Prepped/Unprepped", () => {
  const item = plasticBottleData;
  const unprepped = initItem(item);
  assert.equal(unprepped.contents, "residue");

  // Prepped: rinsed/empty
  const prepped = applyAction(item, unprepped, "rinse_empty").currentParts;
  assert.equal(prepped.contents, "empty");

  // Informational action: cap removed
  const preppedWithCapRemoved = applyAction(item, prepped, "remove_cap").currentParts;
  assert.equal(preppedWithCapRemoved.cap, "removed");

  // --- RECYCLING BIN ---
  // Unprepped -> Contaminated
  const unprepRecycle = evaluateOutcome(item, unprepped, "recycling");
  assert.equal(unprepRecycle.result, "contaminated");
  assert.equal(unprepRecycle.missedActions.length, 1);
  assert.equal(unprepRecycle.missedActions[0].id, "rinse_empty");

  // Prepped -> Accepted
  const prepRecycle = evaluateOutcome(item, prepped, "recycling");
  assert.equal(prepRecycle.result, "accepted");
  assert.equal(prepRecycle.missedActions.length, 0);

  // Prepped with cap removed -> Still Accepted (never penalized!)
  const prepCapOffRecycle = evaluateOutcome(item, preppedWithCapRemoved, "recycling");
  assert.equal(prepCapOffRecycle.result, "accepted");
  assert.equal(prepCapOffRecycle.missedActions.length, 0);

  // --- GENERAL WASTE BIN ---
  const unprepGeneral = evaluateOutcome(item, unprepped, "general");
  assert.equal(unprepGeneral.result, "wasted");

  const prepGeneral = evaluateOutcome(item, prepped, "general");
  assert.equal(prepGeneral.result, "wasted");

  // --- COMPOST BIN ---
  const unprepCompost = evaluateOutcome(item, unprepped, "compost");
  assert.equal(unprepCompost.result, "wasted");

  const prepCompost = evaluateOutcome(item, prepped, "compost");
  assert.equal(prepCompost.result, "wasted");
});

test("Glass Jar - Outcomes across All Bins x Prepped/Unprepped", () => {
  const item = glassJarData;
  const unprepped = initItem(item);
  assert.equal(unprepped.contents, "residue");

  // Prepped: rinsed/empty
  const prepped = applyAction(item, unprepped, "rinse_empty").currentParts;
  assert.equal(prepped.contents, "empty");

  // Informational action: lid removed
  const preppedWithLidRemoved = applyAction(item, prepped, "remove_lid").currentParts;
  assert.equal(preppedWithLidRemoved.lid, "removed");

  // --- RECYCLING BIN ---
  // Unprepped -> Contaminated
  const unprepRecycle = evaluateOutcome(item, unprepped, "recycling");
  assert.equal(unprepRecycle.result, "contaminated");
  assert.equal(unprepRecycle.missedActions.length, 1);
  assert.equal(unprepRecycle.missedActions[0].id, "rinse_empty");

  // Prepped -> Accepted
  const prepRecycle = evaluateOutcome(item, prepped, "recycling");
  assert.equal(prepRecycle.result, "accepted");
  assert.equal(prepRecycle.missedActions.length, 0);

  // Prepped with lid removed -> Still Accepted (never penalized!)
  const prepLidOffRecycle = evaluateOutcome(item, preppedWithLidRemoved, "recycling");
  assert.equal(prepLidOffRecycle.result, "accepted");
  assert.equal(prepLidOffRecycle.missedActions.length, 0);

  // --- GENERAL WASTE BIN ---
  const unprepGeneral = evaluateOutcome(item, unprepped, "general");
  assert.equal(unprepGeneral.result, "wasted");

  const prepGeneral = evaluateOutcome(item, prepped, "general");
  assert.equal(prepGeneral.result, "wasted");

  // --- COMPOST BIN ---
  const unprepCompost = evaluateOutcome(item, unprepped, "compost");
  assert.equal(unprepCompost.result, "wasted");

  const prepCompost = evaluateOutcome(item, prepped, "compost");
  assert.equal(prepCompost.result, "wasted");
});

test("Pizza Box - Outcomes across All Bins x Prepped/Unprepped", () => {
  const item = pizzaBoxData;
  const unprepped = initItem(item);
  assert.equal(unprepped.box, "whole");

  // Prepped: clean part torn
  const prepped = applyAction(item, unprepped, "tear_clean_part").currentParts;
  assert.equal(prepped.box, "split");

  // --- RECYCLING BIN ---
  // Unprepped (whole) -> Contaminated (grease ruins paper pulp)
  const unprepRecycle = evaluateOutcome(item, unprepped, "recycling");
  assert.equal(unprepRecycle.result, "contaminated");
  assert.equal(unprepRecycle.missedActions.length, 1);
  assert.equal(unprepRecycle.missedActions[0].id, "tear_clean_part");

  // Prepped (split) -> Accepted (clean lid accepted)
  const prepRecycle = evaluateOutcome(item, prepped, "recycling");
  assert.equal(prepRecycle.result, "accepted");
  assert.equal(prepRecycle.missedActions.length, 0);

  // --- COMPOST BIN ---
  // Both whole and split are accepted in compost (with needsFactCheck: true)
  const unprepCompost = evaluateOutcome(item, unprepped, "compost");
  assert.equal(unprepCompost.result, "accepted");
  assert.equal(unprepCompost.needsFactCheck, true);

  const prepCompost = evaluateOutcome(item, prepped, "compost");
  assert.equal(prepCompost.result, "accepted");
  assert.equal(prepCompost.needsFactCheck, true);

  // --- GENERAL WASTE BIN ---
  const unprepGeneral = evaluateOutcome(item, unprepped, "general");
  assert.equal(unprepGeneral.result, "wasted");

  const prepGeneral = evaluateOutcome(item, prepped, "general");
  assert.equal(prepGeneral.result, "wasted");
});

test("Comprehensive Matrix: Every Item x Every Bin x Prepped/Unprepped Exists", () => {
  for (const item of ALL_ITEMS) {
    const unprepped = initItem(item);
    
    // Find required action
    const reqAction = item.actions.find((a) => a.required);
    assert.ok(reqAction, `Item ${item.id} must have a required action.`);

    const prepped = applyAction(item, unprepped, reqAction.id).currentParts;

    for (const bin of ALL_BINS) {
      const outcomeUnprepped = evaluateOutcome(item, unprepped, bin);
      assert.ok(outcomeUnprepped, `Missing unprepped outcome for ${item.id} in ${bin}`);
      assert.ok(["accepted", "contaminated", "wasted"].includes(outcomeUnprepped.result));
      assert.ok(outcomeUnprepped.title && outcomeUnprepped.title.length > 0);
      assert.ok(outcomeUnprepped.text && outcomeUnprepped.text.length > 0);
      assert.ok(outcomeUnprepped.takeaway && outcomeUnprepped.takeaway.length > 0);

      const outcomePrepped = evaluateOutcome(item, prepped, bin);
      assert.ok(outcomePrepped, `Missing prepped outcome for ${item.id} in ${bin}`);
      assert.ok(["accepted", "contaminated", "wasted"].includes(outcomePrepped.result));
      assert.ok(outcomePrepped.title && outcomePrepped.title.length > 0);
      assert.ok(outcomePrepped.text && outcomePrepped.text.length > 0);
      assert.ok(outcomePrepped.takeaway && outcomePrepped.takeaway.length > 0);
    }
  }
});
