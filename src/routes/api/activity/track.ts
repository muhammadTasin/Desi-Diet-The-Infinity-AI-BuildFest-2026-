import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Validation schema for tracking payload
const TrackPayloadSchema = z.object({
  sessionId: z.string().max(100),
  mode: z.enum(["logged_in", "guest"]),
  eventName: z.enum([
    "app_opened",
    "login_page_viewed",
    "signup_started",
    "login_success",
    "guest_mode_started",
    "dashboard_viewed",
    "plate_analyzer_opened",
    "plate_analysis_started",
    "plate_analysis_completed",
    "manual_meal_opened",
    "manual_meal_saved",
    "chat_opened",
    "chat_message_sent",
    "iot_panel_viewed",
    "device_connect_clicked",
    "manual_signal_opened",
    "care_companion_opened",
    "demo_mode_started",
    "demo_feature_used"
  ]),
  page: z.string().max(100).nullable().optional(),
  feature: z.string().max(100).nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

export const Route = createFileRoute("/api/activity/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const parsed = TrackPayloadSchema.safeParse(body);
          
          if (!parsed.success) {
            return Response.json({ error: "Invalid payload format" }, { status: 400 });
          }

          const { sessionId, mode, eventName, page, feature, metadata } = parsed.data;

          // Verify authenticated user via Supabase token if provided
          let authenticatedUserId: string | null = null;
          const authHeader = request.headers.get("authorization");
          
          if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            const SUPABASE_URL = process.env.SUPABASE_URL;
            const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
            
            if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
              const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
                global: { headers: { Authorization: "Bearer " + token } },
                auth: { persistSession: false, autoRefreshToken: false },
              });
              
              const { data: claimsData } = await supabase.auth.getClaims(token);
              if (claimsData?.claims?.sub) {
                authenticatedUserId = claimsData.claims.sub;
              }
            }
          }

          // Sanitize metadata: block large sizes and enforce keys restrictions
          let sanitizedMetadata: Record<string, any> | null = null;
          if (metadata) {
            // Check size limits
            const serialized = JSON.stringify(metadata);
            if (serialized.length > 2000) {
              return Response.json({ error: "Metadata payload exceeds safety size limit" }, { status: 400 });
            }

            sanitizedMetadata = {};
            for (const [key, value] of Object.entries(metadata)) {
              const lowerKey = key.toLowerCase();
              
              // Skip keys matching sensitive concepts
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
              
              // Allow simple values only
              if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                sanitizedMetadata[key] = value;
              }
            }
          }

          // Insert directly bypassing RLS using the admin client
          const { error } = await (supabaseAdmin as any)
            .from("app_activity_events")
            .insert({
              user_id: mode === "logged_in" ? authenticatedUserId : null,
              session_id: sessionId,
              mode,
              event_name: eventName,
              page: page || null,
              feature: feature || null,
              metadata: sanitizedMetadata,
            });

          if (error) {
            console.error("[Track API] DB Insertion error:", error.message);
            return Response.json({ error: "Failed to persist event" }, { status: 500 });
          }

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("[Track API] Unhandled server error:", err.message || err);
          return Response.json({ error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
