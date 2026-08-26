import { getFoodDetailsAdapter, type NormalizedFoodResult } from "./foodAdapter";

export interface FoodComparisonItem {
  food_id: string;
  name_en: string;
  name_bn: string;
  category: string;
  typical_portion_grams: number;
  per_portion: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    iron_mg?: number;
    sodium_mg?: number;
  };
  per_100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  glycemic_impact?: "low" | "medium" | "high";
  budget_friendly?: boolean;
  health_tags: string[];
  better_prep?: string;
  worse_prep?: string;
}

export interface FoodComparisonResult {
  items: FoodComparisonItem[];
  unresolved_foods: string[];
  summary: {
    highest_protein: { name: string; protein_g: number };
    lowest_calorie_per_100g: { name: string; calories: number };
    highest_fiber: { name: string; fiber_g: number };
    lowest_fat: { name: string; fat_g: number };
  };
  nanumoni_comparison_verdict: string;
}

function calculatePer100g(item: NormalizedFoodResult) {
  const ratio = 100 / (item.typical_portion_grams || 100);
  return {
    calories: Math.round(item.calories * ratio),
    protein_g: Number((item.protein_g * ratio).toFixed(1)),
    carbs_g: Number((item.carbs_g * ratio).toFixed(1)),
    fat_g: Number((item.fat_g * ratio).toFixed(1)),
    fiber_g: Number((item.fiber_g * ratio).toFixed(1)),
  };
}

export function compareFoodsAdapter(foodNames: string[]): FoodComparisonResult {
  const items: FoodComparisonItem[] = [];
  const unresolved: string[] = [];

  for (const name of foodNames) {
    const details = getFoodDetailsAdapter(name);
    if (!details) {
      unresolved.push(name);
      continue;
    }

    const per100g = calculatePer100g(details);

    items.push({
      food_id: details.food_id,
      name_en: details.name_en,
      name_bn: details.name_bn,
      category: details.category,
      typical_portion_grams: details.typical_portion_grams,
      per_portion: {
        calories: details.calories,
        protein_g: details.protein_g,
        carbs_g: details.carbs_g,
        fat_g: details.fat_g,
        fiber_g: details.fiber_g,
        iron_mg: details.iron_mg,
        sodium_mg: details.sodium_mg,
      },
      per_100g: per100g,
      glycemic_impact: details.glycemic_impact,
      budget_friendly: details.budget_friendly,
      health_tags: details.health_tags,
      better_prep: details.better_prep,
      worse_prep: details.worse_prep,
    });
  }

  if (items.length === 0) {
    return {
      items: [],
      unresolved_foods: unresolved,
      summary: {
        highest_protein: { name: "N/A", protein_g: 0 },
        lowest_calorie_per_100g: { name: "N/A", calories: 0 },
        highest_fiber: { name: "N/A", fiber_g: 0 },
        lowest_fat: { name: "N/A", fat_g: 0 },
      },
      nanumoni_comparison_verdict: "None of the requested foods could be resolved in the database.",
    };
  }

  // Compute extremes
  const highestProtein = [...items].sort((a, b) => b.per_100g.protein_g - a.per_100g.protein_g)[0];
  const lowestCalorie = [...items].sort((a, b) => a.per_100g.calories - b.per_100g.calories)[0];
  const highestFiber = [...items].sort((a, b) => b.per_100g.fiber_g - a.per_100g.fiber_g)[0];
  const lowestFat = [...items].sort((a, b) => a.per_100g.fat_g - b.per_100g.fat_g)[0];

  const verdictParts: string[] = [];
  verdictParts.push(
    `For protein density, **${highestProtein.name_en}** leads with ${highestProtein.per_100g.protein_g}g protein per 100g.`
  );
  if (lowestCalorie.food_id !== highestProtein.food_id) {
    verdictParts.push(
      `For lighter calorie management, **${lowestCalorie.name_en}** is lower at ${lowestCalorie.per_100g.calories} kcal per 100g.`
    );
  }
  if (highestFiber.per_100g.fiber_g > 2) {
    verdictParts.push(
      `**${highestFiber.name_en}** provides the highest dietary fiber (${highestFiber.per_100g.fiber_g}g / 100g), aiding slower digestion.`
    );
  }

  return {
    items,
    unresolved_foods: unresolved,
    summary: {
      highest_protein: { name: highestProtein.name_en, protein_g: highestProtein.per_100g.protein_g },
      lowest_calorie_per_100g: { name: lowestCalorie.name_en, calories: lowestCalorie.per_100g.calories },
      highest_fiber: { name: highestFiber.name_en, fiber_g: highestFiber.per_100g.fiber_g },
      lowest_fat: { name: lowestFat.name_en, fat_g: lowestFat.per_100g.fat_g },
    },
    nanumoni_comparison_verdict: verdictParts.join(" "),
  };
}
