import type { WebMCPToolDefinition, WebMCPToolResult } from "../types";
import { CompareFoodsInputSchema, type CompareFoodsInput } from "../schemas";
import { compareFoodsAdapter, type FoodComparisonResult } from "../adapters/nutritionAdapter";

export const compareFoodsTool: WebMCPToolDefinition<CompareFoodsInput, WebMCPToolResult<FoodComparisonResult>> = {
  name: "compare_foods",
  description:
    "Compare 2 to 4 Bangladeshi foods side-by-side on calories, protein, carbs, fat, fiber, and health context with normalized per-100g and per-portion comparisons.",
  readOnlyHint: true,
  parameters: {
    type: "object",
    properties: {
      foods: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of 2 to 4 food names to compare (e.g. ['khichuri', 'kacchi biryani'], ['ilish-mach', 'rohu-mach', 'pabda-mach']).",
      },
    },
    required: ["foods"],
    additionalProperties: false,
  },
  execute: async (rawInput) => {
    const timestamp = new Date().toISOString();
    try {
      const parsed = CompareFoodsInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: parsed.error.issues.map((i) => i.message).join("; "),
            details: parsed.error.format(),
          },
          meta: {
            tool: "compare_foods",
            timestamp,
            source: "deshi_digest_nutrition_engine",
            readOnly: true,
          },
        };
      }

      const comparison = compareFoodsAdapter(parsed.data.foods);

      return {
        success: true,
        data: comparison,
        meta: {
          tool: "compare_foods",
          timestamp,
          source: "deshi_digest_nutrition_engine",
          readOnly: true,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: err.message || "Failed to compare foods",
        },
        meta: {
          tool: "compare_foods",
          timestamp,
          source: "deshi_digest_nutrition_engine",
          readOnly: true,
        },
      };
    }
  },
};
