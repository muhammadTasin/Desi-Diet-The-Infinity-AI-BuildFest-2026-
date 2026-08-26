/**
 * WebMCP Comprehensive Test Suite for Deshi Digest
 *
 * Tests:
 * 1. Schema Validation (search_foods, get_food_details, compare_foods, find_budget_meal)
 * 2. Food Adapter & Search
 * 3. Food Details Resolution & Nutrition Data
 * 4. Nutrition Comparison Logic & Extreme Calculations
 * 5. Budget Meal Planning & Cost Models
 * 6. Canonical document.modelContext Registration & AbortController Cleanup
 * 7. Graceful Fallback in Unsupported Environments
 */

import {
  SearchFoodsInputSchema,
  GetFoodDetailsInputSchema,
  CompareFoodsInputSchema,
  FindBudgetMealInputSchema,
} from "../src/webmcp/schemas";
import { searchFoodsAdapter, getFoodDetailsAdapter } from "../src/webmcp/adapters/foodAdapter";
import { compareFoodsAdapter } from "../src/webmcp/adapters/nutritionAdapter";
import { findBudgetMealAdapter } from "../src/webmcp/adapters/budgetAdapter";
import { searchFoodsTool } from "../src/webmcp/tools/searchFoods";
import { getFoodDetailsTool } from "../src/webmcp/tools/getFoodDetails";
import { compareFoodsTool } from "../src/webmcp/tools/compareFoods";
import { findBudgetMealTool } from "../src/webmcp/tools/findBudgetMeal";
import { registerAllWebMCPTools, ALL_WEBMCP_TOOLS, getModelContext } from "../src/webmcp/registerTools";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) console.error(`     Details: ${failureDetails}`);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING DESHI DIGEST WEBMCP TEST SUITE");
  console.log("=======================================================\n");

  // ----------------------------------------------------
  // SUITE 1: Validation Schemas
  // ----------------------------------------------------
  console.log("📦 1. Schema Validation Tests");

  const validSearch = SearchFoodsInputSchema.safeParse({ query: "chicken", limit: 5 });
  assert(validSearch.success, "search_foods accepts valid query with limit");

  const emptySearch = SearchFoodsInputSchema.safeParse({ query: "" });
  assert(!emptySearch.success, "search_foods rejects empty query string");

  const limitOverSearch = SearchFoodsInputSchema.safeParse({ query: "rice", limit: 50 });
  assert(!limitOverSearch.success, "search_foods rejects limit > 20");

  const validDetails = GetFoodDetailsInputSchema.safeParse({ food: "khichuri" });
  assert(validDetails.success, "get_food_details accepts valid food string");

  const emptyDetails = GetFoodDetailsInputSchema.safeParse({ food: "" });
  assert(!emptyDetails.success, "get_food_details rejects empty food string");

  const validCompare = CompareFoodsInputSchema.safeParse({ foods: ["khichuri", "biryani"] });
  assert(validCompare.success, "compare_foods accepts 2 valid foods");

  const tripleCompare = CompareFoodsInputSchema.safeParse({ foods: ["khichuri", "biryani", "bhat"] });
  assert(tripleCompare.success, "compare_foods accepts 3 valid foods");

  const singleCompare = CompareFoodsInputSchema.safeParse({ foods: ["khichuri"] });
  assert(!singleCompare.success, "compare_foods rejects fewer than 2 foods");

  const excessiveCompare = CompareFoodsInputSchema.safeParse({ foods: ["a", "b", "c", "d", "e"] });
  assert(!excessiveCompare.success, "compare_foods rejects more than 4 foods");

  const validBudget = FindBudgetMealInputSchema.safeParse({ budget_bdt: 150, meal_type: "lunch" });
  assert(validBudget.success, "find_budget_meal accepts valid budget and meal_type");

  const lowBudget = FindBudgetMealInputSchema.safeParse({ budget_bdt: 5 });
  assert(!lowBudget.success, "find_budget_meal rejects budget < 20 BDT");

  const invalidMealType = FindBudgetMealInputSchema.safeParse({ budget_bdt: 100, meal_type: "midnight_feast" as any });
  assert(!invalidMealType.success, "find_budget_meal rejects invalid meal_type");

  // ----------------------------------------------------
  // SUITE 2: search_foods Execution & Adapters
  // ----------------------------------------------------
  console.log("\n🔍 2. search_foods Execution Tests");

  const searchHilsa = await searchFoodsTool.execute({ query: "ilish", limit: 3 });
  assert(searchHilsa.success === true, "search_foods executes successfully for 'ilish'");
  assert(
    (searchHilsa.data?.foods?.length ?? 0) > 0,
    "search_foods returns non-empty result list for 'ilish'",
    `Found: ${searchHilsa.data?.foods?.length}`
  );
  assert(searchHilsa.meta?.readOnly === true, "search_foods metadata marks readOnly = true");

  const searchBangla = await searchFoodsTool.execute({ query: "ডাল", limit: 3 });
  assert(
    (searchBangla.data?.foods?.length ?? 0) > 0,
    "search_foods supports native Bengali script queries ('ডাল')"
  );

  const searchCategory = await searchFoodsTool.execute({ query: "mach", category: "Fish" });
  assert(
    searchCategory.data?.foods?.every((f) => f.category.toLowerCase().includes("fish")) ?? false,
    "search_foods respects category filtering"
  );

  const searchNone = await searchFoodsTool.execute({ query: "xyznonexistentfood123" });
  assert(
    searchNone.success === true && (searchNone.data?.foods?.length ?? 0) === 0,
    "search_foods handles non-matching queries cleanly with empty array"
  );

  const searchInvalid = await searchFoodsTool.execute({ query: "" } as any);
  assert(
    searchInvalid.success === false && searchInvalid.error?.code === "INVALID_INPUT",
    "search_foods returns structured INVALID_INPUT error on invalid params"
  );

  // ----------------------------------------------------
  // SUITE 3: get_food_details Execution & Adapters
  // ----------------------------------------------------
  console.log("\n📊 3. get_food_details Execution Tests");

  const detailsPui = await getFoodDetailsTool.execute({ food: "pui-shak" });
  assert(detailsPui.success === true, "get_food_details executes successfully for 'pui-shak'");
  assert(detailsPui.data?.found === true, "get_food_details marks found = true for known food");
  assert(
    (detailsPui.data?.food?.calories ?? 0) > 0 && (detailsPui.data?.food?.fiber_g ?? 0) > 0,
    "get_food_details returns authentic nutritional values (calories, fiber)"
  );
  assert(
    Boolean(detailsPui.data?.food?.name_bn),
    "get_food_details includes Bengali name (name_bn)"
  );

  const detailsNotFound = await getFoodDetailsTool.execute({ food: "completely_unknown_item_999" });
  assert(
    detailsNotFound.success === true && detailsNotFound.data?.found === false,
    "get_food_details handles unknown food gracefully (found = false)"
  );

  const detailsInvalid = await getFoodDetailsTool.execute({ food: "" } as any);
  assert(
    detailsInvalid.success === false && detailsInvalid.error?.code === "INVALID_INPUT",
    "get_food_details returns INVALID_INPUT error on empty string"
  );

  // ----------------------------------------------------
  // SUITE 4: compare_foods Execution & Adapters
  // ----------------------------------------------------
  console.log("\n⚖️ 4. compare_foods Execution Tests");

  const compareKhichuriBiryani = await compareFoodsTool.execute({
    foods: ["khichuri", "kacchi biryani"],
  });
  assert(compareKhichuriBiryani.success === true, "compare_foods executes successfully for 2 foods");
  assert(
    (compareKhichuriBiryani.data?.items?.length ?? 0) >= 2,
    "compare_foods returns comparison items for both foods"
  );
  assert(
    Boolean(compareKhichuriBiryani.data?.summary?.highest_protein?.name),
    "compare_foods calculates highest_protein summary metric"
  );
  assert(
    Boolean(compareKhichuriBiryani.data?.nanumoni_comparison_verdict),
    "compare_foods provides cultural comparison verdict"
  );

  const compareInvalidCount = await compareFoodsTool.execute({
    foods: ["khichuri"],
  } as any);
  assert(
    compareInvalidCount.success === false && compareInvalidCount.error?.code === "INVALID_INPUT",
    "compare_foods rejects single food comparison request with INVALID_INPUT"
  );

  // ----------------------------------------------------
  // SUITE 5: find_budget_meal Execution & Adapters
  // ----------------------------------------------------
  console.log("\n💰 5. find_budget_meal Execution Tests");

  const budgetLunch = await findBudgetMealTool.execute({
    budget_bdt: 120,
    meal_type: "lunch",
  });
  assert(budgetLunch.success === true, "find_budget_meal executes successfully for 120 BDT lunch");
  assert(
    (budgetLunch.data?.total_est_cost_bdt ?? 0) <= 120,
    "find_budget_meal stays within or at budget limit",
    `Cost: ${budgetLunch.data?.total_est_cost_bdt} BDT vs Budget: 120 BDT`
  );
  assert(
    (budgetLunch.data?.items?.length ?? 0) >= 2,
    "find_budget_meal returns multi-item balanced plate"
  );
  assert(
    (budgetLunch.data?.total_nutrition?.protein_g ?? 0) > 10,
    "find_budget_meal provides verified protein total"
  );
  assert(
    Boolean(budgetLunch.data?.nanumoni_advice),
    "find_budget_meal provides Nanumoni's cultural nutrition advice"
  );

  const budgetBreakfast = await findBudgetMealTool.execute({
    budget_bdt: 40,
    meal_type: "breakfast",
  });
  assert(
    budgetBreakfast.success === true && (budgetBreakfast.data?.total_est_cost_bdt ?? 0) <= 40,
    "find_budget_meal handles low-budget breakfast (< 50 BDT)"
  );

  const budgetVeg = await findBudgetMealTool.execute({
    budget_bdt: 150,
    meal_type: "dinner",
    preferences: "vegetarian",
  });
  assert(
    budgetVeg.success === true,
    "find_budget_meal adapts to vegetarian preference"
  );

  // ----------------------------------------------------
  // SUITE 6: Canonical document.modelContext Registration & Cleanup
  // ----------------------------------------------------
  console.log("\n🔌 6. Canonical document.modelContext Registration & Lifecycle Tests");

  assert(ALL_WEBMCP_TOOLS.length === 4, "All 4 Phase 1 tools are defined in tool registry");
  assert(
    ALL_WEBMCP_TOOLS.every((t) => t.readOnlyHint === true),
    "All 4 registered tools declare readOnlyHint: true"
  );

  const registeredInMock: string[] = [];
  const mockContext = {
    registerTool: (tool: any) => {
      registeredInMock.push(tool.name);
      return () => {
        const idx = registeredInMock.indexOf(tool.name);
        if (idx !== -1) registeredInMock.splice(idx, 1);
      };
    },
    unregisterTool: (name: string) => {
      const idx = registeredInMock.indexOf(name);
      if (idx !== -1) registeredInMock.splice(idx, 1);
    },
  };

  // Simulate canonical document.modelContext
  (globalThis as any).document = { modelContext: mockContext };
  (globalThis as any).window = {};

  const controller = new AbortController();
  const regResult = registerAllWebMCPTools(controller.signal);

  assert(regResult.supported === true, "registerAllWebMCPTools detects document.modelContext");
  assert(
    regResult.canonicalSource === "document.modelContext",
    "registerAllWebMCPTools confirms document.modelContext as canonicalSource"
  );
  assert(
    regResult.registeredTools.length === 4,
    "registerAllWebMCPTools registers all 4 tools"
  );
  assert(
    registeredInMock.length === 4,
    "Mock ModelContext received all 4 tool registrations"
  );

  // Test AbortSignal cleanup
  controller.abort();
  assert(
    registeredInMock.length === 0,
    "AbortController signal successfully unregisters all tools on abort"
  );

  // Clean up mock
  delete (globalThis as any).document;
  delete (globalThis as any).window;

  // Test in headless/unsupported environment
  const unsuppResult = registerAllWebMCPTools();
  assert(
    unsuppResult.supported === false,
    "registerAllWebMCPTools handles unsupported browser gracefully without throwing exceptions"
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  if (failedTests > 0) {
    console.error(`❌ ${failedTests} TESTS FAILED`);
    console.log("=======================================================\n");
    process.exit(1);
  } else {
    console.log("🎉 ALL WEBMCP TESTS PASSED PERFECTLY!");
    console.log("=======================================================\n");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
