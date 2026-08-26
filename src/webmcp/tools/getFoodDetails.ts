import type { WebMCPToolDefinition, WebMCPToolResult } from "../types";
import { GetFoodDetailsInputSchema, type GetFoodDetailsInput } from "../schemas";
import { getFoodDetailsAdapter, type NormalizedFoodResult } from "../adapters/foodAdapter";

export const getFoodDetailsTool: WebMCPToolDefinition<GetFoodDetailsInput, WebMCPToolResult<{ food: NormalizedFoodResult | null; found: boolean }>> = {
  name: "get_food_details",
  description:
    "Retrieve complete nutritional breakdown (calories, protein, carbs, fat, fiber, iron, sodium), typical portion size in grams, glycemic impact, and cultural advice for a specific Bangladeshi food.",
  readOnlyHint: true,
  parameters: {
    type: "object",
    properties: {
      food: {
        type: "string",
        description: "The name or ID of the food (e.g. 'khichuri', 'ilish-mach', 'pui-shak', 'bhat', 'shorshe ilish').",
      },
    },
    required: ["food"],
    additionalProperties: false,
  },
  execute: async (rawInput) => {
    const timestamp = new Date().toISOString();
    try {
      const parsed = GetFoodDetailsInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: parsed.error.issues.map((i) => i.message).join("; "),
            details: parsed.error.format(),
          },
          meta: {
            tool: "get_food_details",
            timestamp,
            source: "deshi_digest_knowledge_base",
            readOnly: true,
          },
        };
      }

      const result = getFoodDetailsAdapter(parsed.data.food);

      return {
        success: true,
        data: {
          food: result,
          found: result !== null,
        },
        meta: {
          tool: "get_food_details",
          timestamp,
          source: "deshi_digest_knowledge_base",
          readOnly: true,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: err.message || "Failed to retrieve food details",
        },
        meta: {
          tool: "get_food_details",
          timestamp,
          source: "deshi_digest_knowledge_base",
          readOnly: true,
        },
      };
    }
  },
};
