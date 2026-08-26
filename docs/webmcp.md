# Deshi Digest — WebMCP Agent Integration (Phase 1)

This document provides a comprehensive audit trail and technical specification for the **Web Context Protocol (WebMCP)** integration added to **Deshi Digest**.

---

## 1. Project Background & Context

### Before the WebMCP Challenge
Deshi Digest was built as a culturally intelligent Bangladeshi nutrition and food wellness web application. The platform already included:
- Rich Bangladeshi food and nutrition datasets (82+ curated items, 1900+ lines of food knowledge and cultural rules).
- Plate Analyzer with multimodal AI vision.
- Nanumoni Care Companion powered by Google Gemini API.
- Profile and dietary goal tracking.
- Predefined raw grocery food baskets and affordable meal concepts.

### Added During the WebMCP Challenge
To enable autonomous AI agents (such as browser-based coding assistants, research agents, and AI nutrition bots) to safely access verified Bangladeshi nutrition intelligence, we added a **zero-regression, read-only WebMCP adapter layer**:
1. **Isolated WebMCP Architecture (`src/webmcp/`)**:
   - `src/webmcp/types.ts`: Type definitions for tools, parameters, and structured JSON results.
   - `src/webmcp/schemas.ts`: Strict Zod input validation schemas.
   - `src/webmcp/adapters/foodAdapter.ts`: Adapter interfacing existing food datasets (`FOODS`, `BANGLADESHI_FOODS`).
   - `src/webmcp/adapters/nutritionAdapter.ts`: Adapter computing normalized nutrient comparisons and tradeoffs.
   - `src/webmcp/adapters/budgetAdapter.ts`: Adapter generating authentic, affordable Bangladeshi meal plates under target BDT budgets.
   - `src/webmcp/tools/searchFoods.ts`: Tool definition for `search_foods`.
   - `src/webmcp/tools/getFoodDetails.ts`: Tool definition for `get_food_details`.
   - `src/webmcp/tools/compareFoods.ts`: Tool definition for `compare_foods`.
   - `src/webmcp/tools/findBudgetMeal.ts`: Tool definition for `find_budget_meal`.
   - `src/webmcp/registerTools.ts`: Core registration engine with feature detection and cleanup.
   - `src/webmcp/WebMCPProvider.tsx`: SSR-safe React context provider.
   - `src/webmcp/WebMCPStatus.tsx`: Visual status component and interactive testing playground.
2. **Dedicated Agent Route (`/webmcp`)**:
   - Lightweight public route hosting the WebMCP runtime and interactive test playground for judges and evaluators.
3. **Automated Test Suite (`scripts/test-webmcp.ts` / `npm run test:webmcp`)**:
   - 44 automated tests verifying schema validation, tool execution, edge cases, error boundaries, and context registration.

---

## 2. Architecture & Design Principles

```text
                     DESHI DIGEST
┌──────────────────────────────────────────────────────────┐
│                                                          │
│ Existing Human Application                               │
│ (Landing, Care Companion, Plate Analysis, Dashboard)     │
│                                                          │
│ Existing Knowledge Datasets & Functions                  │
│ • FOODS (82 curated items with full nutrition)           │
│ • BANGLADESHI_FOODS (1900+ lines knowledge base)         │
│ • buildPlan & raw-food-baskets                           │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ (100% reused read-only)
                             ▼
              ┌──────────────────────────────┐
              │   NEW WEBMCP ADAPTER LAYER   │
              │                              │
              │ • Strict Zod Validation      │
              │ • Normalized JSON Payloads   │
              │ • 100% Read-Only Safety      │
              │ • Feature Flag Control       │
              └──────────────┬───────────────┘
                             │
                             ▼
                 document.modelContext /
                 navigator.modelContext
                             │
                             ▼
                    WebMCP-Capable Agent
```

### Key Architectural Constraints Followed:
- **WebMCP → Adapter → Existing Deshi Digest Logic**: No duplicated mock food catalog or fake database.
- **Strictly Read-Only (Phase 1)**: Zero database writes, zero Supabase auth mutations, zero file modifications.
- **SSR-Safe**: Feature detection guards against server execution during SSR hydration.
- **Graceful Fallback**: In standard browsers without native WebMCP, the application operates normally and provides an interactive emulation playground at `/webmcp`.

---

## 3. Initial Tool Set (Phase 1)

### Tool 1: `search_foods`
- **Purpose**: Search Bangladeshi foods by name, alias, Bengali script, or category.
- **Annotations**: `readOnlyHint: true`
- **Parameters**:
  - `query` (*string, required*): Search term (e.g. `'ilish'`, `'khichuri'`, `'ডাল'`).
  - `limit` (*integer, optional*): Max results (1 to 20, default 6).
  - `category` (*string, optional*): Category filter (e.g. `'Fish'`, `'Dals'`, `'Greens'`).
- **Example Usage**:
  ```json
  { "query": "ilish", "limit": 3 }
  ```

### Tool 2: `get_food_details`
- **Purpose**: Retrieve verified nutritional values (calories, protein, carbs, fat, fiber, iron, sodium), typical portion sizes in grams, glycemic impact, and cultural advice.
- **Annotations**: `readOnlyHint: true`
- **Parameters**:
  - `food` (*string, required*): Name or ID of the food (e.g. `'pui-shak'`, `'khichuri'`).
- **Example Usage**:
  ```json
  { "food": "pui-shak" }
  ```

### Tool 3: `compare_foods`
- **Purpose**: Compare 2 to 4 foods side-by-side with normalized per-100g and per-portion metrics and tradeoff summaries.
- **Annotations**: `readOnlyHint: true`
- **Parameters**:
  - `foods` (*array of strings, required*): 2 to 4 food names (e.g. `["khichuri", "kacchi biryani"]`).
- **Example Usage**:
  ```json
  { "foods": ["khichuri", "kacchi biryani"] }
  ```

### Tool 4: `find_budget_meal`
- **Purpose**: Generate culturally authentic, balanced Bangladeshi meal plates matching a specific budget in BDT (Bangladeshi Taka).
- **Annotations**: `readOnlyHint: true`
- **Parameters**:
  - `budget_bdt` (*number, required*): Target single-meal budget in BDT (e.g. `50`, `120`, `250`).
  - `meal_type` (*string, optional*): `'breakfast'`, `'lunch'`, `'dinner'`, or `'snack'` (default `'lunch'`).
  - `preferences` (*string, optional*): Dietary preference (e.g. `'vegetarian'`).
- **Example Usage**:
  ```json
  { "budget_bdt": 120, "meal_type": "lunch" }
  ```

---

## 4. How to Run & Test WebMCP

### 1. Run the Automated Test Suite
```bash
npm run test:webmcp
```
Executes all 44 unit and integration tests across schemas, adapters, tool executors, and browser context registration.

### 2. Run the Web Application Locally
```bash
npm run dev
```
Navigate to:
- `http://localhost:3000/webmcp` (WebMCP Agent Mode & Playground)
- `http://localhost:3000/docs` (Documentation)
- `http://localhost:3000/` (Main Application)

### 3. Testing with a WebMCP-Enabled Agent
In a browser with WebMCP support (e.g., Chrome with Model Context Protocol enabled or an agent extension), the agent will automatically discover tools registered on `document.modelContext`.

Example agent prompts:
- *"Use Deshi Digest to search for high-protein fish dishes."*
- *"What is the nutritional profile of Pui Shak according to Deshi Digest?"*
- *"Compare khichuri and kacchi biryani for calories and protein."*
- *"I have 120 BDT. Find me a balanced Bangladeshi lunch plate."*

---

## 5. Security & Safety Boundary

- **No State-Changing Actions**: All tools are pure read operations.
- **No Private Data Access**: Tools only access public, curated Bangladeshi food composition data. No user profiles, chat histories, or sensitive health logs are exposed.
- **Zod Validation**: All tool parameters are validated before adapter execution. Malformed inputs immediately return structured errors without crashing.
- **Feature Flagging**: WebMCP can be disabled globally via `VITE_WEBMCP_ENABLED=false` without impacting any human-facing feature.

---

## 6. Known Limitations & Phase 2 Roadmap

- **Phase 1 Boundary**: Grocery routing, external grocery store stock queries, and order creation are intentionally excluded from Phase 1 to ensure zero-risk safety.
- **Phase 2 (Future Exploration)**: Adding safe read-only local store discovery (`find_grocery_options`) using `NEARBY_SHOPS` data once audited.
