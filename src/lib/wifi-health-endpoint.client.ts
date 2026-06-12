import { type HealthSignal, type HealthSignalKind } from "./health-signals";

export function validateHealthEndpointUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    return false;
  }
}

export async function fetchHealthSignalsFromEndpoint(url: string): Promise<any> {
  if (!validateHealthEndpointUrl(url)) {
    throw new Error("Invalid endpoint URL.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Connection timed out.");
    }
    throw new Error(error.message || "Failed to connect to endpoint.");
  }
}

export function normalizeEndpointSignals(raw: any, endpointUrl: string): HealthSignal[] {
  if (!raw || !Array.isArray(raw.signals)) {
    throw new Error("Invalid response format. Expected { signals: [...] }");
  }

  const validKinds: HealthSignalKind[] = [
    "steps", "water_glasses", "sleep_hours", "heart_rate", "weight_kg", "blood_pressure", "blood_glucose", "activity_minutes"
  ];

  const normalized: HealthSignal[] = [];

  for (const item of raw.signals) {
    if (item && item.kind && validKinds.includes(item.kind) && item.value !== undefined) {
      normalized.push({
        kind: item.kind as HealthSignalKind,
        value: Number(item.value),
        unit: item.unit || "",
        source: "wifi_endpoint",
        recordedAt: item.recordedAt || new Date().toISOString(),
        confidence: "medium", // We can't fully trust arbitrary endpoints
        deviceName: item.deviceName || new URL(endpointUrl).hostname,
        consentNote: "User manually configured and triggered WiFi/API sync."
      });
    }
  }

  return normalized;
}
