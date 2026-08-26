/**
 * WebMCP Type Definitions for Deshi Digest
 *
 * Provides type contracts for WebMCP tool registrations, schemas,
 * execution handlers, and standardized agent response payloads.
 */

export interface WebMCPToolParameterProperty {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: {
    type: string;
  };
  default?: any;
}

export interface WebMCPToolParametersSchema {
  type: "object";
  properties: Record<string, WebMCPToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface WebMCPToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  parameters: WebMCPToolParametersSchema;
  readOnlyHint?: boolean;
  execute: (params: TInput) => Promise<TOutput> | TOutput;
}

export interface WebMCPModelContext {
  registerTool?: (tool: WebMCPToolDefinition) => void | (() => void);
  unregisterTool?: (name: string) => void;
  tools?: Record<string, WebMCPToolDefinition>;
}

export interface WebMCPToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    tool: string;
    timestamp: string;
    source: string;
    readOnly: boolean;
  };
}

export interface RegisteredToolInfo {
  name: string;
  description: string;
  readOnly: boolean;
  parameterKeys: string[];
}
