import type { WebMCPToolDefinition, WebMCPToolResult } from "../types";
import { SearchFoodsInputSchema, type SearchFoodsInput } from "../schemas";
import { searchFoodsAdapter, type NormalizedFoodResult } from "../adapters/foodAdapter";

export const searchFoodsTool: WebMCPToolDefinition<SearchFoodsInput, WebMCPToolResult<{ foods: NormalizedFoodResult[]; total: number }>> = {
  name: "search_foods",
  description:
    "Search Deshi Digest's curated Bangladeshi food database for dishes, staples, dals, fishes, meats, greens, and street snacks with cultural context and nutritional totals.",
  readOnlyHint: true,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search term for Bangladeshi food (e.g., 'chicken', 'hilsa', 'khichuri', 'ডাল', 'ilish').",
      },
      limit: {
        type: "integer",
        description: "Maximum number of results to return (1 to 20, default is 6).",
        default: 6,
      },
      category: {
        type: "string",
        description: "Optional category filter (e.g., 'Fish', 'Dals', 'Meat', 'Greens', 'Bhorta', 'Staples').",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  execute: async (rawInput) => {
    const timestamp = new Date().toISOString();
    try {
      const parsed = SearchFoodsInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: parsed.error.issues.map((i) => i.message).join("; "),
            details: parsed.error.format(),
          },
          meta: {
            tool: "search_foods",
            timestamp,
            source: "deshi_digest_knowledge_base",
            readOnly: true,
          },
        };
      }

      const results = searchFoodsAdapter(parsed.data.query, parsed.data.limit ?? 6, parsed.data.category);

      return {
        success: true,
        data: {
          foods: results,
          total: results.length,
        },
        meta: {
          tool: "search_foods",
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
          message: err.message || "Failed to search Bangladeshi foods",
        },
        meta: {
          tool: "search_foods",
          timestamp,
          source: "deshi_digest_knowledge_base",
          readOnly: true,
        },
      };
    }
  },
};
