import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Database,
  Users,
  Eye,
  Camera,
  MessageCircle,
  Sparkles,
  Info,
  Clock,
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Server Function ─────────────────────────────────────────────────────────

/**
 * Fetches activity records securely from the database.
 * Enforces admin email allowlist check on the server side.
 */
export const getAdminActivityData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { claims } = context;
    const email = claims?.email as string | undefined;

    // Check admin allowlist (server side)
    const allowedEmails = (
      process.env.ADMIN_EMAILS ||
      process.env.VITE_ADMIN_EMAILS ||
      "admin@deshidigest.com,tasin@deshidigest.com"
    )
      .split(",")
      .map((e: string) => e.trim().toLowerCase());

    if (!email || !allowedEmails.includes(email.toLowerCase())) {
      throw new Error("Forbidden: You do not have permission to access administration activity logs.");
    }

    // Fetch up to 1500 records to show in dashboard
    const { data: events, error } = await (supabaseAdmin as any)
      .from("app_activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1500);

    if (error) {
      throw new Error(`Database fetch error: ${error.message}`);
    }

    return {
      events: events || [],
      adminEmail: email,
    };
  });

// ─── Route Definition ────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/activity")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        throw redirect({ to: "/login" });
      }

      // Quick client-side check against allowlist
      const email = data.session.user.email;
      const allowedEmails = (
        import.meta.env.VITE_ADMIN_EMAILS || "admin@deshidigest.com,tasin@deshidigest.com"
      )
        .split(",")
        .map((e: string) => e.trim().toLowerCase());

      if (!email || !allowedEmails.includes(email.toLowerCase())) {
        toast.error("Access Denied: Admin role required.");
        throw redirect({ to: "/dashboard" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Admin Analytics Logs — Deshi Digest" }] }),
  component: AdminActivityDashboard,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id: string;
  user_id: string | null;
  session_id: string;
  mode: "logged_in" | "guest";
  event_name: string;
  page: string | null;
  feature: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

// ─── Dashboard Component ─────────────────────────────────────────────────────

function AdminActivityDashboard() {
  const fetchLogs = useServerFn(getAdminActivityData);

  // Filters
  const [timeFilter, setTimeFilter] = useState<"today" | "24h" | "7d" | "all">("24h");
  const [modeFilter, setModeFilter] = useState<"all" | "logged_in" | "guest">("all");
  const [featureFilter, setFeatureFilter] = useState<"all" | "plate_analyzer" | "chat" | "manual_meal" | "health_signals" | "care_companion">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const logsQuery = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: () => fetchLogs(),
    refetchInterval: 15000, // Autorefresh every 15s for hackathon monitoring
  });

  const rawEvents = (logsQuery.data?.events || []) as any as ActivityEvent[];

  // Filter logic
  const filteredEvents = useMemo(() => {
    let list = [...rawEvents];

    // 1. Time Filter
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    list = list.filter((e) => {
      const eventTime = new Date(e.created_at);
      if (timeFilter === "today") return eventTime >= startOfToday;
      if (timeFilter === "24h") return eventTime >= past24h;
      if (timeFilter === "7d") return eventTime >= past7d;
      return true;
    });

    // 2. Mode Filter
    if (modeFilter !== "all") {
      list = list.filter((e) => e.mode === modeFilter);
    }

    // 3. Feature Filter
    if (featureFilter !== "all") {
      list = list.filter((e) => e.feature === featureFilter);
    }

    // 4. Search Filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter((e) => 
        e.event_name.toLowerCase().includes(query) ||
        (e.page && e.page.toLowerCase().includes(query)) ||
        (e.feature && e.feature.toLowerCase().includes(query)) ||
        (e.session_id && e.session_id.toLowerCase().includes(query))
      );
    }

    return list;
  }, [rawEvents, timeFilter, modeFilter, featureFilter, searchTerm]);

  // Aggregated summary cards metrics
  const metrics = useMemo(() => {
    const events = filteredEvents;
    const totalEvents = events.length;

    // Unique Sessions
    const sessions = new Set(events.map(e => e.session_id));
    const totalVisits = sessions.size;

    // Logged in user count
    const loggedInUsers = new Set(
      events.filter(e => e.mode === "logged_in" && e.user_id).map(e => e.user_id)
    ).size;

    // Guest sessions count
    const guestSessions = new Set(
      events.filter(e => e.mode === "guest").map(e => e.session_id)
    ).size;

    // New accounts (estimate via signup events)
    const newAccounts = events.filter(e => e.event_name === "signup_started").length;

    // Plate Analyzer Uses
    const plateUses = events.filter(e => e.event_name === "plate_analysis_started").length;

    // Chat Opens
    const chatOpens = events.filter(e => e.event_name === "chat_opened").length;

    // Demo Mode Starts
    const demoStarts = events.filter(e => 
      e.event_name === "guest_mode_started" || e.event_name === "demo_mode_started"
    ).length;

    // Last activity time
    const lastActivity = events.length > 0 ? events[0].created_at : null;

    return {
      totalEvents,
      totalVisits,
      loggedInUsers,
      guestSessions,
      newAccounts,
      plateUses,
      chatOpens,
      demoStarts,
      lastActivity
    };
  }, [filteredEvents]);

  // Grouped sessions summary table data
  const sessionSummaries = useMemo(() => {
    const map = new Map<string, {
      sessionId: string;
      mode: "logged_in" | "guest";
      eventCount: number;
      firstActive: string;
      lastActive: string;
      pagesVisited: Set<string>;
    }>();

    // Work on rawEvents to see complete session flow
    rawEvents.forEach((e) => {
      const existing = map.get(e.session_id);
      const pageName = e.page || "index";
      
      if (!existing) {
        map.set(e.session_id, {
          sessionId: e.session_id,
          mode: e.mode,
          eventCount: 1,
          firstActive: e.created_at,
          lastActive: e.created_at,
          pagesVisited: new Set([pageName])
        });
      } else {
        existing.eventCount += 1;
        existing.pagesVisited.add(pageName);
        if (new Date(e.created_at) < new Date(existing.firstActive)) {
          existing.firstActive = e.created_at;
        }
        if (new Date(e.created_at) > new Date(existing.lastActive)) {
          existing.lastActive = e.created_at;
        }
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
      .slice(0, 50); // Show top 50 active sessions
  }, [rawEvents]);

  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Judge Visits & Usage Tracking
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Internal analytics console. Logged in as: <span className="font-semibold text-foreground">{logsQuery.data?.adminEmail}</span>
            </p>
          </div>
          
          <Button onClick={() => logsQuery.refetch()} disabled={logsQuery.isFetching} className="self-start shadow-warm">
            <RefreshCw className={cn("mr-2 h-4 w-4", logsQuery.isFetching && "animate-spin")} />
            {logsQuery.isFetching ? "Refreshing..." : "Refresh data"}
          </Button>
        </div>

        {/* Safe Tracking Information Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-foreground/80">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Privacy-Preserving Tracking Active</p>
            <p>Guest activity is tracked only as anonymous product usage events. We do not store meal photos, chat text, or health values in analytics.</p>
            <p className="font-semibold text-amber-700">Check Supabase Dashboard → Authentication → Users for exact account verification.</p>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          
          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Total visits</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-foreground">{metrics.totalVisits}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Unique session IDs in current filter</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Logged-in Users</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <p className="text-3xl font-extrabold text-foreground">{metrics.loggedInUsers}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Distinct authenticated user accounts</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Guest Sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-foreground">{metrics.guestSessions}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Sessions using guest/demo bypass</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">New Accounts</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-foreground">{metrics.newAccounts}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Estimate from signup submission events</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Plate Analyzer Uses</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-3xl font-extrabold text-foreground">{metrics.plateUses}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Plate photos / estimations requested</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Chat opens</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-sky-500 shrink-0" />
                <p className="text-3xl font-extrabold text-foreground">{metrics.chatOpens}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Nanumoni chat layout interactions</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Demo Mode Starts</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-3xl font-extrabold text-foreground">{metrics.demoStarts}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Judge demo triggers logged</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Last Activity</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold truncate leading-none">
                  {metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleTimeString() : "No events"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 truncate">
                {metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleDateString() : ""}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* ── Filtering Panel ── */}
        <Card className="rounded-3xl border border-border/60 bg-card/50 p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4 font-semibold text-sm">
            <Filter className="h-4 w-4 text-primary" /> Filter Logs
          </div>
          
          <div className="grid gap-4 sm:grid-cols-4">
            
            {/* Time Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time Window</label>
              <select
                value={timeFilter}
                onChange={(e: any) => setTimeFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="today">Today (start of day)</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Mode</label>
              <select
                value={modeFilter}
                onChange={(e: any) => setModeFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="all">All modes</option>
                <option value="logged_in">Logged in</option>
                <option value="guest">Guest / Anon</option>
              </select>
            </div>

            {/* Feature Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feature Module</label>
              <select
                value={featureFilter}
                onChange={(e: any) => setFeatureFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="all">All features</option>
                <option value="plate_analyzer">Plate Analyzer</option>
                <option value="chat">Nanumoni Chat</option>
                <option value="manual_meal">Manual Meal log</option>
                <option value="health_signals">IoT Health signals</option>
                <option value="care_companion">Care Companion</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search term</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Event, page, session ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs"
                />
              </div>
            </div>

          </div>
        </Card>

        {/* ── Main Logs Tables ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Table 1: Recent activity events (Left 2 cols) */}
          <Card className="lg:col-span-2 rounded-3xl border border-border/60 bg-card overflow-hidden shadow-soft">
            <CardHeader className="border-b border-border/40 p-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Recent activity events ({filteredEvents.length})</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-muted/95 border-b font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Page</th>
                    <th className="p-3">Feature</th>
                    <th className="p-3">Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">No events match the filters.</td>
                    </tr>
                  ) : (
                    filteredEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            e.mode === "logged_in" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                          )}>
                            {e.mode.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-foreground truncate max-w-[130px]" title={e.event_name}>
                          {e.event_name.replace(/_/g, " ")}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">{e.page || "—"}</td>
                        <td className="p-3 text-muted-foreground font-mono">{e.feature || "—"}</td>
                        <td className="p-3 max-w-[150px] truncate font-mono text-[10px] text-muted-foreground" title={JSON.stringify(e.metadata)}>
                          {e.metadata ? JSON.stringify(e.metadata) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Table 2: Guest Sessions Summary (Right 1 col) */}
          <Card className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-soft">
            <CardHeader className="border-b border-border/40 p-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Guest Sessions Summary ({sessionSummaries.length})</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-muted/95 border-b font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Session ID</th>
                    <th className="p-3">Events</th>
                    <th className="p-3">Pages Vist</th>
                    <th className="p-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessionSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">No sessions registered.</td>
                    </tr>
                  ) : (
                    sessionSummaries.map((s) => (
                      <tr key={s.sessionId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-[10px] text-foreground truncate max-w-[90px]" title={s.sessionId}>
                          {s.sessionId.slice(0, 8)}...
                        </td>
                        <td className="p-3 font-bold text-center">{s.eventCount}</td>
                        <td className="p-3">
                          <span className="text-[10px] bg-secondary/80 px-1.5 py-0.5 rounded text-muted-foreground">
                            {s.pagesVisited.size}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
