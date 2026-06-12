import { supabase } from "@/integrations/supabase/client";
import { isDemoSession } from "@/lib/demo-session";

export type ActivityMode = "logged_in" | "guest";

export type ActivityEventName =
  | "app_opened"
  | "login_page_viewed"
  | "signup_started"
  | "login_success"
  | "guest_mode_started"
  | "dashboard_viewed"
  | "plate_analyzer_opened"
  | "plate_analysis_started"
  | "plate_analysis_completed"
  | "manual_meal_opened"
  | "manual_meal_saved"
  | "chat_opened"
  | "chat_message_sent"
  | "iot_panel_viewed"
  | "device_connect_clicked"
  | "manual_signal_opened"
  | "care_companion_opened"
  | "demo_mode_started"
  | "demo_feature_used";

export interface TrackEventParams {
  eventName: ActivityEventName;
  page?: string;
  feature?: string;
  metadata?: Record<string, any>;
}

let inMemorySessionId: string | null = null;

/**
 * Gets the current session ID or creates a new one.
 * Uses localStorage to persist the session, falling back to an in-memory cache if localStorage is unavailable.
 */
export function getOrCreateActivitySessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }
  
  if (inMemorySessionId) {
    return inMemorySessionId;
  }
  
  try {
    const key = "desi-digest:activity-session-id";
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(key, sid);
    }
    inMemorySessionId = sid;
    return sid;
  } catch (e) {
    if (!inMemorySessionId) {
      inMemorySessionId = crypto.randomUUID();
    }
    return inMemorySessionId;
  }
}

/**
 * Tracks an application activity event asynchronously without blocking user actions.
 * Sanitizes metadata to enforce privacy rules (no sensitive content, exact health signals, or files).
 */
export async function trackActivityEvent({
  eventName,
  page,
  feature,
  metadata
}: TrackEventParams): Promise<void> {
  // Best effort tracking — do not block user or crash under any circumstances
  try {
    const sessionId = getOrCreateActivitySessionId();
    const isGuest = isDemoSession();
    
    let mode: ActivityMode = "guest";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (!isGuest) {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        mode = "logged_in";
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    }
    
    // Sanitize metadata
    const sanitizedMetadata: Record<string, any> = {};
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        const lowerKey = key.toLowerCase();
        
        // Strip keys matching sensitive terms
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("token") ||
          lowerKey.includes("key") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("photo") ||
          lowerKey.includes("image") ||
          lowerKey.includes("chat") ||
          lowerKey.includes("text") ||
          lowerKey.includes("message") ||
          lowerKey.includes("value") ||
          lowerKey.includes("signal") ||
          lowerKey.includes("meal") ||
          lowerKey.includes("food")
        ) {
          continue;
        }
        
        // Limit to simple primitives
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          sanitizedMetadata[key] = value;
        }
      }
    }
    
    const payload = {
      sessionId,
      mode,
      eventName,
      page: page || null,
      feature: feature || null,
      metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : null,
    };
    
    // Non-blocking fire and forget fetch
    fetch("/api/activity/track", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn("[Tracking] Dispatch failed:", err);
    });
  } catch (e) {
    console.warn("[Tracking] Failed to log event:", e);
  }
}
