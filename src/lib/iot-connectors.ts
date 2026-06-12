import { type HealthSignalKind } from "./health-signals";

export type IoTConnectorStatus =
| "not_connected"
| "manual_entry"
| "demo_connected"
| "bluetooth_available"
| "bluetooth_connected"
| "wifi_endpoint_configured"
| "future_integration"
| "unsupported";

export type IoTConnectorType =
| "manual"
| "demo"
| "web_bluetooth"
| "wifi_endpoint"
| "future_google_fit"
| "future_apple_health"
| "future_fitbit"
| "future_clinical_device";

export type IoTConnector = {
  id: IoTConnectorType;
  name: string;
  status: IoTConnectorStatus;
  description: string;
  supportedSignals: HealthSignalKind[];
};

export function getAvailableIoTConnectors(): IoTConnector[] {
  return [
    {
      id: "manual",
      name: "Manual Health Signals",
      status: "manual_entry",
      description: "Log your health signals manually.",
      supportedSignals: ["steps", "water_glasses", "sleep_hours", "weight_kg", "blood_pressure", "blood_glucose"]
    },
    {
      id: "web_bluetooth",
      name: "Bluetooth Health Device",
      status: "not_connected",
      description: "Experimental. Connect nearby Bluetooth health devices. Requires browser permission.",
      supportedSignals: ["heart_rate"]
    },
    {
      id: "wifi_endpoint",
      name: "WiFi/API Endpoint",
      status: "not_connected",
      description: "Requires a compatible local device endpoint (e.g., http://192.168.x.x/signals).",
      supportedSignals: ["steps", "water_glasses", "sleep_hours", "heart_rate", "weight_kg", "activity_minutes"]
    },
    {
      id: "demo",
      name: "Demo Wearable Sample",
      status: "demo_connected",
      description: "Sample demo data only.",
      supportedSignals: ["steps", "water_glasses", "sleep_hours", "activity_minutes"]
    },
    {
      id: "future_google_fit",
      name: "Google Fit",
      status: "future_integration",
      description: "Coming soon. Future integrations are not active yet.",
      supportedSignals: ["steps", "heart_rate", "activity_minutes", "sleep_hours"]
    },
    {
      id: "future_apple_health",
      name: "Apple Health",
      status: "future_integration",
      description: "Coming soon. Future integrations are not active yet.",
      supportedSignals: ["steps", "heart_rate", "activity_minutes", "sleep_hours"]
    },
    {
      id: "future_fitbit",
      name: "Fitbit",
      status: "future_integration",
      description: "Coming soon. Future integrations are not active yet.",
      supportedSignals: ["steps", "heart_rate", "activity_minutes", "sleep_hours"]
    },
    {
      id: "future_clinical_device",
      name: "Glucose/BP Clinical Connect",
      status: "future_integration",
      description: "Coming soon. Future integrations are not active yet.",
      supportedSignals: ["blood_glucose", "blood_pressure"]
    }
  ];
}

export function getConnectorPrivacyText(): string {
  return "Desi Digest does not secretly collect device data. Cookies are only used for login/session. Device signals are imported only after your action and are used as optional context for nudges and Care Companion.";
}

export function getMealDataSourceExplanation(): string {
  return "Meals are based on what you log or scan: Photo scan, Manual meal log, Chat-confirmed meal, or Saved meal history.";
}
