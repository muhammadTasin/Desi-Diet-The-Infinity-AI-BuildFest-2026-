import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerAllWebMCPTools,
  isWebMCPSupportedInBrowser,
  isWebMCPFeatureEnabled,
  ALL_WEBMCP_TOOLS,
  type WebMCPRegistrationResult,
} from "./registerTools";
import type { RegisteredToolInfo } from "./types";

interface WebMCPContextValue {
  isSupported: boolean;
  isEnabled: boolean;
  isRegistered: boolean;
  canonicalSource: "document.modelContext" | "navigator.modelContext" | "none";
  registeredTools: RegisteredToolInfo[];
  errors: Array<{ tool: string; error: string }>;
  reRegister: () => void;
}

const WebMCPContext = createContext<WebMCPContextValue>({
  isSupported: false,
  isEnabled: true,
  isRegistered: false,
  canonicalSource: "none",
  registeredTools: [],
  errors: [],
  reRegister: () => {},
});

export function WebMCPProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WebMCPRegistrationResult>(() => ({
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
  }));

  const performRegistration = (signal?: AbortSignal) => {
    if (typeof window === "undefined") return () => {};
    const result = registerAllWebMCPTools(signal);
    setState(result);
    return result.cleanup;
  };

  useEffect(() => {
    const controller = new AbortController();
    const cleanup = performRegistration(controller.signal);
    return () => {
      controller.abort();
      cleanup();
    };
  }, []);

  const value: WebMCPContextValue = {
    isSupported: state.supported,
    isEnabled: state.enabled,
    isRegistered: state.supported && state.registeredTools.length > 0 && state.errors.length === 0,
    canonicalSource: state.canonicalSource,
    registeredTools: state.registeredTools,
    errors: state.errors,
    reRegister: () => {
      state.cleanup();
      const controller = new AbortController();
      performRegistration(controller.signal);
    },
  };

  return <WebMCPContext.Provider value={value}>{children}</WebMCPContext.Provider>;
}

export function useWebMCP() {
  const context = useContext(WebMCPContext);
  return context;
}
