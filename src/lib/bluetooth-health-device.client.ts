import { type HealthSignal, type HealthSignalKind } from "./health-signals";

// Ensure Web Bluetooth API types are recognized
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: any): Promise<any>;
    };
  }
}

export function isWebBluetoothSupported(): boolean {
  if (typeof window === "undefined") return false;
  return navigator && "bluetooth" in navigator;
}

export async function requestBluetoothHealthDevice() {
  if (!isWebBluetoothSupported()) {
    throw new Error("Bluetooth is not supported on this browser.");
  }

  try {
    // We request the standard Heart Rate service (0x180D)
    // and Battery Service (0x180F) optionally.
    const device = await navigator.bluetooth!.requestDevice({
      filters: [
        { services: ["heart_rate"] }
      ],
      optionalServices: ["battery_service", "device_information"]
    });

    if (!device) {
      throw new Error("No device selected.");
    }

    return device;
  } catch (error: any) {
    if (error.name === "NotFoundError") {
      throw new Error("No device selected or permission denied.");
    }
    if (error.name === "SecurityError") {
      throw new Error("Security error: Check if the site is served over HTTPS.");
    }
    throw new Error(error.message || "Failed to request Bluetooth device.");
  }
}

export async function parseBluetoothHealthSignal(device: any): Promise<HealthSignal[]> {
  const signals: HealthSignal[] = [];

  if (!device || !device.gatt) {
    throw new Error("Invalid Bluetooth device or GATT not available.");
  }

  try {
    const server = await device.gatt.connect();

    // Try to get Heart Rate Measurement (0x2A37)
    try {
      const hrService = await server.getPrimaryService("heart_rate");
      const hrCharacteristic = await hrService.getCharacteristic("heart_rate_measurement");
      const hrValue = await hrCharacteristic.readValue();
      
      const hr = parseHeartRate(hrValue);
      if (hr !== null) {
        signals.push({
          kind: "heart_rate",
          value: hr,
          unit: "bpm",
          source: "bluetooth",
          recordedAt: new Date().toISOString(),
          confidence: "high",
          deviceName: device.name || "Bluetooth Device",
          consentNote: "User explicitly granted Bluetooth access."
        });
      }
    } catch (e) {
      console.warn("Could not read heart rate service:", e);
    }

    // You could also read Battery Level (0x2A19) if needed, but it's not a health signal per se.

    return signals;
  } catch (error: any) {
    throw new Error("Failed to connect to device or read services: " + error.message);
  }
}

function parseHeartRate(value: DataView): number | null {
  // Heart Rate Measurement characteristic
  // 1st bit of flags indicates if format is UINT8 (0) or UINT16 (1)
  const flags = value.getUint8(0);
  const isUint16 = flags & 0x01;
  if (isUint16) {
    return value.getUint16(1, true); // little-endian
  } else {
    return value.getUint8(1);
  }
}

export async function disconnectBluetoothDevice(device: any) {
  if (device && device.gatt && device.gatt.connected) {
    device.gatt.disconnect();
  }
}
