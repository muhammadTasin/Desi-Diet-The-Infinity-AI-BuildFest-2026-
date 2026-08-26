import { FOODS, type FoodSeed } from "@/lib/foods-dataset";
import { PREDEFINED_BASKETS } from "@/lib/raw-food-basket";

export interface BudgetMealItem {
  name_en: string;
  name_bn: string;
  category: string;
  portion_grams: number;
  portion_desc: string;
  est_cost_bdt: number;
  calories: number;
  protein_g: number;
}

export interface BudgetMealPlanResult {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  target_budget_bdt: number;
  total_est_cost_bdt: number;
  remaining_budget_bdt: number;
  meal_name: string;
  items: BudgetMealItem[];
  total_nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg: number;
  };
  reasoning: string;
  swap_options: string[];
  raw_grocery_basket_hint?: {
    basket_title: string;
    key_ingredients: string[];
  };
  nanumoni_advice: string;
}

// Helper to look up food items
function findFood(id: string): FoodSeed | undefined {
  return FOODS.find((f) => f.food_id === id);
}

// Estimated market retail costs per cooked portion in BDT
const ESTIMATED_PORTION_COST_BDT: Record<string, number> = {
  "bhat-steamed": 15,
  "masoor-dal": 25,
  "mung-dal": 30,
  "cholar-dal": 30,
  "pui-shak": 25,
  "lau-shak": 25,
  "begun-bhaji": 20,
  "aloo-bhorta": 20,
  "begun-bhorta": 25,
  "shutki-bhorta": 40,
  "rohu-mach": 65,
  "pabda-mach": 85,
  "mola-fish": 45,
  "koi-mach": 60,
  "chicken-curry": 75,
  "fuchka": 60,
  "chotpoti": 50,
  "jhal-muri": 30,
  "pitha": 40,
};

export function findBudgetMealAdapter(
  budgetBdt: number,
  mealType: "breakfast" | "lunch" | "dinner" | "snack" = "lunch",
  preferences?: string
): BudgetMealPlanResult {
  const normPref = (preferences || "").toLowerCase();

  // Curated templates based on real Deshi plate combinations and cost models
  let selectedFoodIds: string[] = [];
  let reasoning = "";
  let swapOptions: string[] = [];

  if (mealType === "breakfast") {
    if (budgetBdt <= 50) {
      selectedFoodIds = ["aloo-bhorta"];
      reasoning = "Tight budget breakfast: Mashed potato with green chili, onion and mustard oil.";
      swapOptions = ["Add a boiled egg (+15 BDT) if budget permits for high-quality protein."];
    } else if (budgetBdt <= 90) {
      selectedFoodIds = ["aloo-bhorta", "masoor-dal"];
      reasoning = "High protein student breakfast with lentils and mashed potatoes.";
      swapOptions = ["Swap dal with an egg bhuna for complete animal protein."];
    } else {
      selectedFoodIds = ["masoor-dal", "begun-bhaji", "aloo-bhorta"];
      reasoning = "Wholesome morning combination providing plant protein, fiber, and steady carbohydrates.";
      swapOptions = ["Add whole wheat ruti (homemade) for lower glycemic index."];
    }
  } else if (mealType === "snack") {
    if (budgetBdt <= 40) {
      selectedFoodIds = ["jhal-muri"];
      reasoning = "Light, traditional puffed rice snack with mustard oil and spices.";
      swapOptions = ["Add extra roasted chickpeas (chola) for more protein."];
    } else if (budgetBdt <= 80) {
      selectedFoodIds = ["chotpoti"];
      reasoning = "High-fiber chickpea and potato evening meal with tamarind dressing.";
      swapOptions = ["Swap with fuchka for a crispier treat."];
    } else {
      selectedFoodIds = ["chotpoti", "pitha"];
      reasoning = "Satisfying afternoon snack pairing protein-rich chotpoti with traditional rice cake.";
      swapOptions = ["Pair with sugar-free cha for a lighter calorie count."];
    }
  } else if (mealType === "dinner") {
    if (budgetBdt <= 80) {
      selectedFoodIds = ["bhat-steamed", "masoor-dal", "pui-shak"];
      reasoning = "Affordable plant-powered dinner: steamed rice, thick red lentils, and Malabar spinach.";
      swapOptions = ["Add 1 boiled egg for 15 BDT to reach 20g+ total protein."];
    } else if (budgetBdt <= 130) {
      selectedFoodIds = ["bhat-steamed", "masoor-dal", "mola-fish", "lau-shak"];
      reasoning = "Mineral-rich dinner with small indigenous fish (Mola) rich in calcium and vitamin A.";
      swapOptions = ["Swap Mola fish with Rohu fish depending on bazar availability."];
    } else {
      selectedFoodIds = ["bhat-steamed", "chicken-curry", "pui-shak", "masoor-dal"];
      reasoning = "Balanced dinner prioritizing lean poultry protein with leafy greens and lentils.";
      swapOptions = ["Reduce rice portion and increase dal for lower calorie intake."];
    }
  } else {
    // Lunch (default)
    if (budgetBdt <= 70) {
      selectedFoodIds = ["bhat-steamed", "masoor-dal", "aloo-bhorta", "pui-shak"];
      reasoning = "Classic Bangladeshi budget combo: Dal-Bhat with iron-rich shak and comforting bhorta.";
      swapOptions = ["Add a farm egg (+15 BDT) for extra 6g protein."];
    } else if (budgetBdt <= 120) {
      selectedFoodIds = ["bhat-steamed", "masoor-dal", "pui-shak", "mola-fish"];
      reasoning = "Affordable powerhouse lunch: rice, dal, leafy greens, and calcium-dense small fish.";
      swapOptions = ["Swap Mola fish with Rohu fish or Rui jhol."];
    } else if (budgetBdt <= 160) {
      selectedFoodIds = ["bhat-steamed", "masoor-dal", "rohu-mach", "pui-shak", "begun-bhaji"];
      reasoning = "Complete Deshi balanced plate: staple, lentil protein, freshwater fish, leafy greens, and fried eggplant.";
      swapOptions = ["Swap Rohu with Katla or Chicken curry."];
    } else {
      selectedFoodIds = ["bhat-steamed", "chicken-curry", "masoor-dal", "lau-shak", "begun-bhaji"];
      reasoning = "Generous balanced lunch with poultry protein, lentils, greens, and eggplant.";
      swapOptions = ["Swap chicken with Ilish or Mutton on special occasions."];
    }
  }

  // Adjust for vegetarian preference if requested
  if (normPref.includes("veg") && !normPref.includes("non-veg")) {
    selectedFoodIds = selectedFoodIds.filter(
      (id) => !["rohu-mach", "chicken-curry", "mola-fish", "pabda-mach", "koi-mach", "shutki-bhorta"].includes(id)
    );
    if (!selectedFoodIds.includes("masoor-dal")) selectedFoodIds.push("masoor-dal");
    if (!selectedFoodIds.includes("pui-shak")) selectedFoodIds.push("pui-shak");
    if (!selectedFoodIds.includes("begun-bhaji")) selectedFoodIds.push("begun-bhaji");
    reasoning = `Vegetarian ${mealType} configuration rich in plant protein and vitamins.`;
  }

  // Resolve items
  const items: BudgetMealItem[] = [];
  let totalCost = 0;
  let totalCal = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSodium = 0;

  for (const id of selectedFoodIds) {
    const food = findFood(id);
    if (!food) continue;
    const estCost = ESTIMATED_PORTION_COST_BDT[id] ?? 35;
    totalCost += estCost;
    totalCal += food.nutrition_per_portion.calories;
    totalProtein += food.nutrition_per_portion.protein_g;
    totalCarbs += food.nutrition_per_portion.carbs_g;
    totalFat += food.nutrition_per_portion.fat_g;
    totalFiber += food.nutrition_per_portion.fiber_g;
    totalSodium += food.nutrition_per_portion.sodium_mg;

    items.push({
      name_en: food.name_en,
      name_bn: food.name_bn,
      category: food.category,
      portion_grams: food.typical_portion_grams,
      portion_desc: `${Math.round(food.typical_portion_grams)}g ${food.name_bn}`,
      est_cost_bdt: estCost,
      calories: food.nutrition_per_portion.calories,
      protein_g: food.nutrition_per_portion.protein_g,
    });
  }

  // Link to raw food basket if relevant
  const budgetBasket = PREDEFINED_BASKETS.find((b) => b.id === "budget-protein") || PREDEFINED_BASKETS[0];

  return {
    meal_type: mealType,
    target_budget_bdt: budgetBdt,
    total_est_cost_bdt: totalCost,
    remaining_budget_bdt: Math.max(0, budgetBdt - totalCost),
    meal_name: items.map((i) => i.name_en).join(" + "),
    items,
    total_nutrition: {
      calories: totalCal,
      protein_g: Number(totalProtein.toFixed(1)),
      carbs_g: Number(totalCarbs.toFixed(1)),
      fat_g: Number(totalFat.toFixed(1)),
      fiber_g: Number(totalFiber.toFixed(1)),
      sodium_mg: totalSodium,
    },
    reasoning,
    swap_options: swapOptions,
    raw_grocery_basket_hint: {
      basket_title: budgetBasket.title,
      key_ingredients: budgetBasket.ingredients.map((ing) => ing.nameEn),
    },
    nanumoni_advice:
      "Nanumoni says: Even on a tight budget, combining dal with rice gives you complete amino acids, and local greens like Pui or Lal Shak give your body all the iron it needs!",
  };
}
