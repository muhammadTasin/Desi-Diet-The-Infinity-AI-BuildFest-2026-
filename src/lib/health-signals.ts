export type HealthSignalSource =
| "manual"
| "demo"
| "bluetooth"
| "wifi_endpoint"
| "future_wearable"
| "not_connected";

export type HealthSignalKind =
| "steps"
| "water_glasses"
| "sleep_hours"
| "heart_rate"
| "weight_kg"
| "blood_pressure"
| "blood_glucose"
| "activity_minutes";

export type HealthSignal = {
  kind: HealthSignalKind;
  value: number | string;
  unit: string;
  source: HealthSignalSource;
  recordedAt: string;
  confidence: "high" | "medium" | "low";
  deviceName?: string;
  consentNote?: string;
};

export type HealthSignalSummary = {
  signals: HealthSignal[];
  summary: string;
  dataQualityNote: string;
  privacyNote: string;
  nudgeHints: string[];
  careCompanionQuestions: string[];
};

export function normalizeHealthSignals(input: any[]): HealthSignal[] {
  if (!Array.isArray(input)) return [];
  return input.filter(s => s && s.kind && s.value !== undefined) as HealthSignal[];
}

export function summarizeHealthSignals(signals: HealthSignal[], isDemo: boolean = false): HealthSignalSummary {
  const normalized = normalizeHealthSignals(signals);
  
  if (normalized.length === 0) {
    return {
      signals: [],
      summary: "No connected health signals yet.",
      dataQualityNote: "Meals are based solely on what you log or scan.",
      privacyNote: "Desi Digest does not secretly track meals. Cookies are only used for login/session.",
      nudgeHints: [],
      careCompanionQuestions: ["Limited health signal data available. This summary is mainly based on logged meals."]
    };
  }

  const nudgeHints: string[] = [];
  const careCompanionQuestions: string[] = [];

  const water = normalized.find(s => s.kind === "water_glasses");
  if (water && Number(water.value) < 6) {
    nudgeHints.push("low_water");
    careCompanionQuestions.push("Water intake looked low in the available signals. Ask whether increasing hydration is appropriate for your routine.");
  }

  const steps = normalized.find(s => s.kind === "steps");
  if (steps && Number(steps.value) < 5000) {
    nudgeHints.push("low_steps");
    careCompanionQuestions.push("Steps/activity signals are limited. Ask what activity target is safe for you.");
  }

  const sleep = normalized.find(s => s.kind === "sleep_hours");
  if (sleep && Number(sleep.value) < 7) {
    nudgeHints.push("low_sleep");
    careCompanionQuestions.push("Sleep signal was low. Ask whether sleep schedule may affect hunger or meal timing.");
  }

  return {
    signals: normalized,
    summary: `${normalized.length} health signals connected.`,
    dataQualityNote: isDemo ? "Source: Demo sample" : "Source: Manual entry",
    privacyNote: "Desi Digest does not secretly track meals. Cookies are only used for login/session. Food data comes from what you scan or log.",
    nudgeHints,
    careCompanionQuestions
  };
}

export function generateHealthSignalNudgeHints(signals: HealthSignal[]): string[] {
  return summarizeHealthSignals(signals).nudgeHints;
}

export function generateCareCompanionSignalQuestions(signals: HealthSignal[]): string[] {
  return summarizeHealthSignals(signals).careCompanionQuestions;
}

export function getDemoHealthSignals(): HealthSignal[] {
  return [
    {
      kind: "steps",
      value: 4200,
      unit: "steps",
      source: "demo",
      recordedAt: new Date().toISOString(),
      confidence: "high"
    },
    {
      kind: "water_glasses",
      value: 3,
      unit: "glasses",
      source: "demo",
      recordedAt: new Date().toISOString(),
      confidence: "high"
    },
    {
      kind: "sleep_hours",
      value: 6,
      unit: "hours",
      source: "demo",
      recordedAt: new Date().toISOString(),
      confidence: "medium"
    },
    {
      kind: "activity_minutes",
      value: 20,
      unit: "minutes",
      source: "demo",
      recordedAt: new Date().toISOString(),
      confidence: "medium"
    }
  ];
}

// Hackathon local storage only; production should use encrypted consent-based storage.
const STORAGE_KEY = "desi-digest:manual-health-signals:v1";

export function getStoredHealthSignals(): HealthSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function addStoredHealthSignal(signal: HealthSignal) {
  if (typeof window === "undefined") return;
  const existing = getStoredHealthSignals();
  const today = new Date().toISOString().split("T")[0];
  const filtered = existing.filter(s => {
    if (s.kind !== signal.kind) return true;
    return s.recordedAt.split("T")[0] !== today;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, signal]));
}
