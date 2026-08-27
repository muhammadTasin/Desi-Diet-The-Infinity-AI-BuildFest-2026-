import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import { WebMCPStatus } from "@/webmcp/WebMCPStatus";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/webmcp")({
  head: () => ({
    meta: [
      { title: "Deshi Digest — WebMCP Agent Mode" },
      {
        name: "description",
        content:
          "WebMCP Agent Interface for Deshi Digest. Allows autonomous AI coding and research agents to query Bangladeshi food datasets, calculate nutrition comparisons, and generate affordable meal plans.",
      },
    ],
  }),
  component: WebMCPPage,
});

function WebMCPPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 transition hover:opacity-80">
              <img src={logoMark} alt="Deshi Digest" className="h-8 w-8 object-contain" />
              <span className="font-display text-lg font-bold text-foreground">Deshi Digest</span>
            </Link>
            <span className="hidden sm:inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              Agent Interface
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to App</span>
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span>Documentation</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            WebMCP Agent Runtime
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            This page hosts the isolated Model Context Protocol (WebMCP) adapter layer for Deshi Digest.
            AI agents running in WebMCP-enabled browsers automatically discover these tools in{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">document.modelContext</code> to query verified Bangladeshi nutrition data without human intervention.
          </p>
        </div>

        <WebMCPStatus />
      </main>

      <Footer />
    </div>
  );
}
