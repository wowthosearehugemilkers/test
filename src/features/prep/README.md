# Interactive Waste Prep Engine (`src/features/prep`)

The Prep Engine is an interactive decontamination and pre-sorting system for **EcoScanAI**. It models waste items as composite objects with multiple parts, evaluates user-driven preparation actions (such as rinsing, separating caps/lids, or tearing greasy cardboard), and determines disposal outcomes across different waste bins.

---

## 1. Engine Functions Contract (`engine/index.js`)

All engine functions are **pure functions** that do not mutate input state or item definitions.

### `initItem(itemData)`
* **Input**: `itemData` (Object conforming to Item Schema)
* **Returns**: Copy of `itemData.initialParts` (`{ [partId: string]: string }`)

### `getAvailableActions(itemData, currentParts)`
* **Input**: `itemData` (Object), `currentParts` (Object)
* **Returns**: Array of action objects with added evaluation properties:
  * `enabled` (boolean): `true` if all key-value pairs in `action.requires` match `currentParts`.
  * `disabledReason` (string | null): Short explanation if `enabled` is `false` (e.g., `"Requires contents to be residue"`), or `null` if enabled.

### `getMissedActions(itemData, currentParts)`
* **Input**: `itemData` (Object), `currentParts` (Object)
* **Returns**: Array of required action objects (`action.required === true`) whose target states in `action.set` are not yet satisfied in `currentParts`.

### `applyAction(itemData, currentParts, actionId)`
* **Input**: `itemData` (Object), `currentParts` (Object), `actionId` (string)
* **Behavior**:
  * Finds action by `id`. If not found, throws `Error("Action not found: ...")`.
  * Verifies `action.requires`. If unmet, throws `Error("Action requirements not met: ...")`.
  * Purely computes new parts state: `{ ...currentParts, ...action.set }`.
* **Returns**:
  ```javascript
  {
    currentParts: { ... }, // Updated state
    action: { ... },       // Action executed
    feedback: string       // Human-readable feedback message
  }
  ```

### `evaluateOutcome(itemData, currentParts, bin)`
* **Input**: `itemData` (Object), `currentParts` (Object), `bin` (string: `"recycling"` | `"general"` | `"compost"`)
* **Behavior**:
  * Evaluates `itemData.outcomes` where `outcome.bin === bin`.
  * Specific match: Matches outcome where every key-value condition in `outcome.when` matches `currentParts`.
  * Fallback match: Matches outcome where `outcome.when === null` if no specific condition matched.
  * Attaches `missedActions` from `getMissedActions(itemData, currentParts)`.
* **Returns**: Matching outcome object extended with `missedActions: Action[]`.

---

## 2. Item Schema Specification (`data/items/*.json`)

```json
{
  "id": "string",
  "title": "string",
  "tmClass": "string",
  "parts": [
    { "id": "string", "name": "string", "material": "string" }
  ],
  "initialParts": {
    "partKey": "stateValue"
  },
  "actions": [
    {
      "id": "string",
      "label": "string",
      "targetPart": "string",
      "requires": { "partKey": "stateValue" },
      "set": { "partKey": "newStateValue" },
      "feedback": "string",
      "required": true,
      "informational": false
    }
  ],
  "outcomes": [
    {
      "bin": "recycling | general | compost",
      "when": { "partKey": "stateValue" } | null,
      "result": "accepted | contaminated | wasted",
      "title": "string",
      "text": "string",
      "takeaway": "string",
      "needsFactCheck": true // Optional
    }
  ],
  "guidanceNote": "string"
}
```

---

## 3. Teachable Machine Class Mapping (`data/classMap.js`)

Maps Teachable Machine classification labels to internal item identifiers.
* `BACKGROUND_CLASS`: `"Background"`
* `CLASS_MAP`:
  * `"Plastic Bottle"` $\rightarrow$ `"plastic_bottle"`
  * `"Glass Jar"` $\rightarrow$ `"glass_jar"`
  * `"Pizza Box"` $\rightarrow$ `"pizza_box"`
