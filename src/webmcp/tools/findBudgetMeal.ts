import type { WebMCPToolDefinition, WebMCPToolResult } from "../types";
import { FindBudgetMealInputSchema, type FindBudgetMealInput } from "../schemas";
import { findBudgetMealAdapter, type BudgetMealPlanResult } from "../adapters/budgetAdapter";

export const findBudgetMealTool: WebMCPToolDefinition<FindBudgetMealInput, WebMCPToolResult<BudgetMealPlanResult>> = {
  name: "find_budget_meal",
  description:
    "Find an affordable, nutritious Bangladeshi meal combination (breakfast, lunch, dinner, or snack) matching a budget in BDT (Bangladeshi Taka). Returns estimated cost, full macro breakdown, portion sizes, swap ideas, and Nanumoni's guidance.",
  readOnlyHint: true,
  parameters: {
    type: "object",
    properties: {
      budget_bdt: {
        type: "number",
        description: "Target budget in Bangladeshi Taka (e.g. 50, 100, 150, 250).",
      },
      meal_type: {
        type: "string",
        enum: ["breakfast", "lunch", "dinner", "snack"],
        description: "The type of meal needed (default is 'lunch').",
        default: "lunch",
      },
      preferences: {
        type: "string",
        description: "Optional dietary or preparation preferences (e.g., 'vegetarian', 'easy to cook', 'high protein').",
      },
    },
    required: ["budget_bdt"],
    additionalProperties: false,
  },
  execute: async (rawInput) => {
    const timestamp = new Date().toISOString();
    try {
      const parsed = FindBudgetMealInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: parsed.error.issues.map((i) => i.message).join("; "),
            details: parsed.error.format(),
          },
          meta: {
            tool: "find_budget_meal",
            timestamp,
            source: "deshi_digest_budget_engine",
            readOnly: true,
          },
        };
      }

      const mealPlan = findBudgetMealAdapter(
        parsed.data.budget_bdt,
        parsed.data.meal_type ?? "lunch",
        parsed.data.preferences
      );

      return {
        success: true,
        data: mealPlan,
        meta: {
          tool: "find_budget_meal",
          timestamp,
          source: "deshi_digest_budget_engine",
          readOnly: true,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: err.message || "Failed to generate budget meal plan",
        },
        meta: {
          tool: "find_budget_meal",
          timestamp,
          source: "deshi_digest_budget_engine",
          readOnly: true,
        },
      };
    }
  },
};
