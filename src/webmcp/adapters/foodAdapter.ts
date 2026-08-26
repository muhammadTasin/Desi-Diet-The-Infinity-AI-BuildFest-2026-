import { FOODS, type FoodSeed } from "@/lib/foods-dataset";
import { BANGLADESHI_FOODS, type FoodItem } from "@/lib/bangladeshi-food-knowledge";

export interface NormalizedFoodResult {
  food_id: string;
  name_en: string;
  name_bn: string;
  category: string;
  typical_portion_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  iron_mg?: number;
  sodium_mg?: number;
  health_tags: string[];
  glycemic_impact?: "low" | "medium" | "high";
  budget_friendly?: boolean;
  nanumoni_note: string;
  common_combinations?: string;
  better_prep?: string;
  worse_prep?: string;
}

function normalizeString(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateMatchScore(query: string, item: FoodSeed | FoodItem): number {
  const q = normalizeString(query);
  if (!q) return 0;

  const names: string[] = [];
  if ("name_en" in item) {
    names.push(item.name_en, item.name_bn, item.category, item.food_id);
    if (item.health_tags) names.push(...item.health_tags);
    if (item.common_combinations) names.push(item.common_combinations);
  } else {
    names.push(item.canonicalName, item.banglaName, item.banglishName, item.category);
    if (item.aliases) names.push(...item.aliases);
  }

  const haystack = normalizeString(names.join(" "));

  if (haystack === q) return 1.0;
  if (haystack.startsWith(q)) return 0.95;
  if (haystack.includes(q)) return 0.85;

  const qTokens = q.split(" ").filter((t) => t.length > 1);
  if (!qTokens.length) return 0;

  const matchedTokens = qTokens.filter((token) => haystack.includes(token));
  if (matchedTokens.length === 0) return 0;

  return (matchedTokens.length / qTokens.length) * 0.75;
}

export function searchFoodsAdapter(
  query: string,
  limit: number = 6,
  categoryFilter?: string
): NormalizedFoodResult[] {
  const normCategory = categoryFilter ? normalizeString(categoryFilter) : null;

  // 1. Search in curated FOODS dataset
  const seedMatches = FOODS.map((food) => {
    const score = calculateMatchScore(query, food);
    return { food, score };
  })
    .filter(({ score, food }) => {
      if (score <= 0) return false;
      if (normCategory && !normalizeString(food.category).includes(normCategory)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  // 2. Also search in BANGLADESHI_FOODS knowledge base for additional matches
  const knowledgeMatches = BANGLADESHI_FOODS.map((food) => {
    const score = calculateMatchScore(query, food);
    return { food, score };
  })
    .filter(({ score, food }) => {
      if (score <= 0) return false;
      if (normCategory && !normalizeString(food.category).includes(normCategory)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const results: NormalizedFoodResult[] = [];
  const seenIds = new Set<string>();

  // Add top seed matches
  for (const { food } of seedMatches) {
    if (results.length >= limit) break;
    seenIds.add(food.food_id);
    seenIds.add(normalizeString(food.name_en));

    // Find supplementary knowledge if available
    const extra = BANGLADESHI_FOODS.find(
      (bf) =>
        normalizeString(bf.canonicalName).includes(normalizeString(food.name_en)) ||
        bf.aliases.some((al) => normalizeString(al) === normalizeString(food.name_en))
    );

    results.push({
      food_id: food.food_id,
      name_en: food.name_en,
      name_bn: food.name_bn,
      category: food.category,
      typical_portion_grams: food.typical_portion_grams,
      calories: food.nutrition_per_portion.calories,
      protein_g: food.nutrition_per_portion.protein_g,
      carbs_g: food.nutrition_per_portion.carbs_g,
      fat_g: food.nutrition_per_portion.fat_g,
      fiber_g: food.nutrition_per_portion.fiber_g,
      iron_mg: food.nutrition_per_portion.iron_mg,
      sodium_mg: food.nutrition_per_portion.sodium_mg,
      health_tags: food.health_tags,
      glycemic_impact: extra?.glycemicImpact,
      budget_friendly: extra?.studentBudgetFriendly ?? food.health_tags.includes("budget-friendly"),
      nanumoni_note: food.nanumoni_friendly_note,
      common_combinations: food.common_combinations,
      better_prep: extra?.betterPrep,
      worse_prep: extra?.worsePrep,
    });
  }

  // Add knowledge base matches if limit not reached
  for (const { food } of knowledgeMatches) {
    if (results.length >= limit) break;
    const normName = normalizeString(food.canonicalName);
    if (seenIds.has(normName) || seenIds.has(food.banglishName)) continue;
    seenIds.add(normName);

    results.push({
      food_id: food.banglishName.replace(/\s+/g, "-"),
      name_en: food.canonicalName,
      name_bn: food.banglaName,
      category: food.category,
      typical_portion_grams: 100, // Standard 100g base for knowledge items
      calories: food.nutrients.calories,
      protein_g: food.nutrients.protein,
      carbs_g: food.nutrients.carbs,
      fat_g: food.nutrients.fat,
      fiber_g: food.nutrients.fiber,
      iron_mg: food.nutrients.iron,
      sodium_mg: food.nutrients.sodium,
      health_tags: food.studentBudgetFriendly ? ["budget-friendly"] : [],
      glycemic_impact: food.glycemicImpact,
      budget_friendly: food.studentBudgetFriendly,
      nanumoni_note: food.healthNotes,
      better_prep: food.betterPrep,
      worse_prep: food.worsePrep,
    });
  }

  return results;
}

export function getFoodDetailsAdapter(foodQuery: string): NormalizedFoodResult | null {
  const norm = normalizeString(foodQuery);
  if (!norm) return null;

  // 1. Exact match in FOODS by food_id
  const exactIdMatch = FOODS.find(
    (f) => normalizeString(f.food_id) === norm || f.food_id.toLowerCase() === foodQuery.toLowerCase()
  );
  if (exactIdMatch) {
    const extra = BANGLADESHI_FOODS.find((bf) =>
      normalizeString(bf.canonicalName).includes(normalizeString(exactIdMatch.name_en))
    );
    return {
      food_id: exactIdMatch.food_id,
      name_en: exactIdMatch.name_en,
      name_bn: exactIdMatch.name_bn,
      category: exactIdMatch.category,
      typical_portion_grams: exactIdMatch.typical_portion_grams,
      calories: exactIdMatch.nutrition_per_portion.calories,
      protein_g: exactIdMatch.nutrition_per_portion.protein_g,
      carbs_g: exactIdMatch.nutrition_per_portion.carbs_g,
      fat_g: exactIdMatch.nutrition_per_portion.fat_g,
      fiber_g: exactIdMatch.nutrition_per_portion.fiber_g,
      iron_mg: exactIdMatch.nutrition_per_portion.iron_mg,
      sodium_mg: exactIdMatch.nutrition_per_portion.sodium_mg,
      health_tags: exactIdMatch.health_tags,
      glycemic_impact: extra?.glycemicImpact,
      budget_friendly: extra?.studentBudgetFriendly ?? exactIdMatch.health_tags.includes("budget-friendly"),
      nanumoni_note: exactIdMatch.nanumoni_friendly_note,
      common_combinations: exactIdMatch.common_combinations,
      better_prep: extra?.betterPrep,
      worse_prep: extra?.worsePrep,
    };
  }

  // 2. Best scored search
  const candidates = searchFoodsAdapter(foodQuery, 1);
  return candidates.length > 0 ? candidates[0] : null;
}
