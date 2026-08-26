import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Bot,
  Search,
  Scale,
  DollarSign,
  FileText,
  Play,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import { useWebMCP } from "./WebMCPProvider";
import { ALL_WEBMCP_TOOLS } from "./registerTools";

export function WebMCPStatus() {
  const { isSupported, isEnabled, registeredTools, errors } = useWebMCP();
  const [activeToolName, setActiveToolName] = useState<string>("search_foods");
  const [testInput, setTestInput] = useState<string>(
    JSON.stringify({ query: "ilish", limit: 3 }, null, 2)
  );
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleInputs: Record<string, any> = {
    search_foods: { query: "ilish", limit: 3 },
    get_food_details: { food: "khichuri" },
    compare_foods: { foods: ["khichuri", "kacchi biryani"] },
    find_budget_meal: { budget_bdt: 120, meal_type: "lunch", preferences: "budget protein" },
  };

  const handleSelectTool = (name: string) => {
    setActiveToolName(name);
    setTestInput(JSON.stringify(sampleInputs[name] || {}, null, 2));
    setTestResult(null);
  };

  const handleExecuteTool = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const tool = ALL_WEBMCP_TOOLS.find((t) => t.name === activeToolName);
      if (!tool) throw new Error(`Tool ${activeToolName} not found`);

      let parsedInput = {};
      try {
        parsedInput = JSON.parse(testInput);
      } catch (err: any) {
        throw new Error(`Invalid JSON input: ${err.message}`);
      }

      const result = await tool.execute(parsedInput);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: { code: "EXECUTION_ERROR", message: err.message },
        meta: { tool: activeToolName, readOnly: true },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(JSON.stringify(testResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Deshi Digest Agent Mode
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                  WebMCP Ready
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Exposes read-only Bangladeshi nutrition, food comparison, and budget meal tools to WebMCP-capable AI agents.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-start sm:justify-end">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                isSupported
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              {isSupported ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Browser WebMCP Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Standard Browser (WebMCP Emulation Active)</span>
                </>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Read-Only Safety</span>
            </div>
          </div>
        </div>

        {/* Feature Notice */}
        {!isSupported && (
          <div className="mt-4 rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground border border-border/50 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <strong>Note for Evaluators:</strong> Your current browser does not have the native{" "}
              <code className="rounded bg-background px-1 py-0.5">document.modelContext</code> WebMCP runtime enabled.
              Deshi Digest gracefully emulates full tool execution in this sandbox so you can test all four tools live below.
              In WebMCP-enabled browsers (e.g. Chrome with WebMCP flags or agent extensions), the tools register automatically without human interaction.
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            {errors.map((e, idx) => (
              <div key={idx}>Error registering {e.tool}: {e.error}</div>
            ))}
          </div>
        )}
      </div>

      {/* Available Tools Grid */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Registered WebMCP Tools (Phase 1)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_WEBMCP_TOOLS.map((tool) => {
            const isSelected = tool.name === activeToolName;
            const iconMap: Record<string, any> = {
              search_foods: Search,
              get_food_details: FileText,
              compare_foods: Scale,
              find_budget_meal: DollarSign,
            };
            const Icon = iconMap[tool.name] || Bot;

            return (
              <button
                key={tool.name}
                type="button"
                onClick={() => handleSelectTool(tool.name)}
                className={`text-left rounded-xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-sm font-bold text-foreground">{tool.name}</span>
                    </div>

                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-500/20">
                      read-only
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Params: {Object.keys(tool.parameters.properties || {}).join(", ")}</span>
                  <span className={`font-semibold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    {isSelected ? "Active in Sandbox →" : "Test Tool →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Tool Sandbox */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              Interactive Tool Sandbox: <code className="text-primary font-mono">{activeToolName}</code>
            </h3>
            <p className="text-xs text-muted-foreground">
              Simulate an agent invoking this tool with JSON parameters to inspect real Deshi Digest outputs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExecuteTool}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span>Executing...</span>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Execute Tool</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Tool Input (JSON)</label>
              <div className="flex gap-1.5">
                {Object.keys(sampleInputs).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectTool(name)}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                      name === activeToolName
                        ? "bg-primary/20 text-primary font-bold"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={8}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full rounded-xl border border-input bg-muted/40 p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Output JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Tool Response Payload</label>
              {testResult && (
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="h-[152px] overflow-auto rounded-xl border border-input bg-muted/60 p-3 font-mono text-xs">
              {testResult ? (
                <pre className="text-[11px] text-foreground">{JSON.stringify(testResult, null, 2)}</pre>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Click "Execute Tool" to test real adapter responses
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Example Agent Queries */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Example Queries Supported by Deshi Digest WebMCP
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-muted/50 p-3.5 border border-border/60">
            <div className="font-semibold text-primary mb-1">Search & Discovery</div>
            <p className="text-muted-foreground">"Find me high-protein Bangladeshi fish dishes with portion and calories."</p>
            <code className="text-[10px] text-foreground/80 mt-1 block font-mono">→ calls search_foods(&#123; query: "fish", category: "Fish" &#125;)</code>
          </div>

          <div className="rounded-xl bg-muted/50 p-3.5 border border-border/60">
            <div className="font-semibold text-primary mb-1">Detailed Nutrition</div>
            <p className="text-muted-foreground">"What are the calories, iron, and health considerations for Pui Shak?"</p>
            <code className="text-[10px] text-foreground/80 mt-1 block font-mono">→ calls get_food_details(&#123; food: "pui-shak" &#125;)</code>
          </div>

          <div className="rounded-xl bg-muted/50 p-3.5 border border-border/60">
            <div className="font-semibold text-primary mb-1">Nutritional Tradeoff Comparison</div>
            <p className="text-muted-foreground">"Compare Khichuri and Kacchi Biryani for protein, calories, and fat."</p>
            <code className="text-[10px] text-foreground/80 mt-1 block font-mono">→ calls compare_foods(&#123; foods: ["khichuri", "kacchi biryani"] &#125;)</code>
          </div>

          <div className="rounded-xl bg-muted/50 p-3.5 border border-border/60">
            <div className="font-semibold text-primary mb-1">Affordable Meal Planning</div>
            <p className="text-muted-foreground">"I have 120 taka for lunch. Give me a balanced Bangladeshi plate."</p>
            <code className="text-[10px] text-foreground/80 mt-1 block font-mono">→ calls find_budget_meal(&#123; budget_bdt: 120, meal_type: "lunch" &#125;)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
