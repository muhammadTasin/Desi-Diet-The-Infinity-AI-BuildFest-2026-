import { z } from "zod";

/**
 * Validation Schemas for WebMCP Tools
 *
 * All tool inputs are strictly validated before hitting business adapters.
 */

export const SearchFoodsInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "query cannot be empty")
    .max(200, "query is too long (max 200 chars)"),
  limit: z
    .number()
    .int("limit must be an integer")
    .min(1, "minimum limit is 1")
    .max(20, "maximum limit is 20")
    .default(6)
    .optional(),
  category: z
    .string()
    .trim()
    .max(50)
    .optional(),
});

export type SearchFoodsInput = z.infer<typeof SearchFoodsInputSchema>;

export const GetFoodDetailsInputSchema = z.object({
  food: z
    .string()
    .trim()
    .min(1, "food name cannot be empty")
    .max(150, "food name is too long"),
});

export type GetFoodDetailsInput = z.infer<typeof GetFoodDetailsInputSchema>;

export const CompareFoodsInputSchema = z.object({
  foods: z
    .array(
      z
        .string()
        .trim()
        .min(1, "food name cannot be empty")
        .max(150, "food name is too long")
    )
    .min(2, "At least 2 foods are required for comparison")
    .max(4, "A maximum of 4 foods can be compared at once"),
});

export type CompareFoodsInput = z.infer<typeof CompareFoodsInputSchema>;

export const FindBudgetMealInputSchema = z.object({
  budget_bdt: z
    .number()
    .min(20, "Minimum budget is 20 BDT")
    .max(2000, "Maximum single meal budget is 2000 BDT"),
  meal_type: z
    .enum(["breakfast", "lunch", "dinner", "snack"] as const)
    .default("lunch")
    .optional(),
  preferences: z
    .string()
    .trim()
    .max(200)
    .optional(),
});

export type FindBudgetMealInput = z.infer<typeof FindBudgetMealInputSchema>;
