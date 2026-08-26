import type { WebMCPToolDefinition, RegisteredToolInfo, WebMCPModelContext } from "./types";
import { searchFoodsTool } from "./tools/searchFoods";
import { getFoodDetailsTool } from "./tools/getFoodDetails";
import { compareFoodsTool } from "./tools/compareFoods";
import { findBudgetMealTool } from "./tools/findBudgetMeal";

/**
 * Curated list of all WebMCP Phase 1 tools.
 * All tools declare readOnlyHint: true for 100% read-only safety.
 */
export const ALL_WEBMCP_TOOLS: WebMCPToolDefinition[] = [
  searchFoodsTool,
  getFoodDetailsTool,
  compareFoodsTool,
  findBudgetMealTool,
];

/**
 * Feature flag checker for WebMCP.
 * Can be explicitly disabled via VITE_WEBMCP_ENABLED=false in .env.
 */
export function isWebMCPFeatureEnabled(): boolean {
  // If in pure SSR without window, return false
  if (typeof window === "undefined" && typeof globalThis !== "undefined" && !(globalThis as any).window) {
    return false;
  }

  let envVal: string | undefined;
  try {
    if (typeof import.meta !== "undefined" && import.meta && import.meta.env) {
      envVal = import.meta.env.VITE_WEBMCP_ENABLED;
    }
  } catch (e) {
    // Ignore in non-Vite environments
  }

  if (envVal === undefined && typeof process !== "undefined" && process && process.env) {
    envVal = process.env.VITE_WEBMCP_ENABLED;
  }

  if (envVal === "false" || envVal === "0") return false;
  return true;
}

/**
 * Canonical WebMCP Context Detection:
 * Primary / Canonical: document.modelContext (Modern WebMCP standard)
 * Fallback (Legacy): navigator.modelContext (Early experimental drafts only if document.modelContext absent)
 */
export function getModelContext(): WebMCPModelContext | null {
  if (typeof window === "undefined" && typeof globalThis !== "undefined" && !(globalThis as any).window) {
    return null;
  }

  // 1. Canonical: document.modelContext
  if (
    typeof document !== "undefined" &&
    "modelContext" in document &&
    (document as any).modelContext &&
    typeof (document as any).modelContext.registerTool === "function"
  ) {
    return (document as any).modelContext;
  }

  // 2. Legacy fallback: navigator.modelContext
  if (
    typeof navigator !== "undefined" &&
    "modelContext" in navigator &&
    (navigator as any).modelContext &&
    typeof (navigator as any).modelContext.registerTool === "function"
  ) {
    return (navigator as any).modelContext;
  }

  return null;
}

export function isWebMCPSupportedInBrowser(): boolean {
  return getModelContext() !== null;
}

export interface WebMCPRegistrationResult {
  supported: boolean;
  enabled: boolean;
  canonicalSource: "document.modelContext" | "navigator.modelContext" | "none";
  registeredTools: RegisteredToolInfo[];
  errors: Array<{ tool: string; error: string }>;
  cleanup: () => void;
}

/**
 * Imperatively registers all Deshi Digest WebMCP tools to document.modelContext.
 * Supports AbortSignal / AbortController cleanup and lifecycle unregistration.
 */
export function registerAllWebMCPTools(signal?: AbortSignal): WebMCPRegistrationResult {
  const enabled = isWebMCPFeatureEnabled();
  const context = getModelContext();
  const registeredTools: RegisteredToolInfo[] = [];
  const errors: Array<{ tool: string; error: string }> = [];
  const cleanupFns: Array<() => void> = [];

  let canonicalSource: "document.modelContext" | "navigator.modelContext" | "none" = "none";
  if (typeof document !== "undefined" && "modelContext" in document && (document as any).modelContext) {
    canonicalSource = "document.modelContext";
  } else if (typeof navigator !== "undefined" && "modelContext" in navigator && (navigator as any).modelContext) {
    canonicalSource = "navigator.modelContext";
  }

  if (!enabled) {
    return {
      supported: context !== null,
      enabled: false,
      canonicalSource,
      registeredTools: [],
      errors: [],
      cleanup: () => {},
    };
  }

  if (!context || typeof context.registerTool !== "function") {
    // Unsupported browser — return graceful no-op result
    return {
      supported: false,
      enabled: true,
      canonicalSource: "none",
      registeredTools: ALL_WEBMCP_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        readOnly: !!t.readOnlyHint,
        parameterKeys: Object.keys(t.parameters.properties || {}),
      })),
      errors: [],
      cleanup: () => {},
    };
  }

  for (const tool of ALL_WEBMCP_TOOLS) {
    try {
      // Pass signal in options if supported by implementation
      const result = (context.registerTool as any)(tool, { signal });

      registeredTools.push({
        name: tool.name,
        description: tool.description,
        readOnly: !!tool.readOnlyHint,
        parameterKeys: Object.keys(tool.parameters.properties || {}),
      });

      if (typeof result === "function") {
        cleanupFns.push(result);
      } else if (typeof context.unregisterTool === "function") {
        cleanupFns.push(() => {
          try {
            context.unregisterTool?.(tool.name);
          } catch (e) {
            console.warn(`[WebMCP] Failed to unregister tool ${tool.name}:`, e);
          }
        });
      }
    } catch (err: any) {
      console.error(`[WebMCP] Failed to register tool ${tool.name}:`, err);
      errors.push({
        tool: tool.name,
        error: err.message || String(err),
      });
    }
  }

  const cleanup = () => {
    for (const fn of cleanupFns) {
      try {
        fn();
      } catch (e) {
        // Swallowed during unmount
      }
    }
  };

  if (signal) {
    signal.addEventListener("abort", cleanup, { once: true });
  }

  return {
    supported: true,
    enabled: true,
    canonicalSource,
    registeredTools,
    errors,
    cleanup,
  };
}
