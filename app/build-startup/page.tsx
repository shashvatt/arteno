"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type BuildData = {
  idea: string;
  founder: {
    companyName: string; tagline: string; executiveSummary: string;
    marketAnalysis: { tam: string; sam: string; growthRate: string };
    businessModel: { primaryRevenue: string; unitEconomics: { ltv: string; cac: string } };
    fundingStrategy: { stage: string; askAmount: string };
    pitchDeckOutline: { slide: number; title: string; content: string }[];
    goToMarket: { phase1: string; phase2: string; phase3: string };
    competitorAnalysis: { name: string; weakness: string; howWeWin: string }[];
    nextSteps: string[];
  };
  sales: {
    salesStrategy: { approach: string; averageDealSize: string; salesCycleLength: string };
    crmPipeline: { stage: string; averageDaysInStage: number }[];
    emailTemplates: { type: string; subject: string; body: string }[];
    revenueProjections: { month3: string; month6: string; month12: string };
    salesScript: { coldCallOpener: string; commonObjections: { objection: string; response: string }[] };
  };
  marketing: {
    marketingStrategy: { positioning: string; brandVoice: string };
    launchStrategy: { preLaunchWeeks: string; launchDay: string; postLaunchMonth: string };
    socialMediaCampaign: {
      twitter: { posts: string[] };
      linkedin: { posts: string[] };
      productHunt: { tagline: string; description: string };
    };
    growthHacks: string[];
    kpis: { metric: string; month1Target: string; month3Target: string }[];
  };
  orchestrator: {
    startupName: string; tagline: string;
    founderSummary: string; hackerSummary: string;
    marketingSummary: string; salesSummary: string;
    weekByWeekPlan: { week: number; focus: string; founderTask: string; hackerTask: string; marketingTask: string; salesTask: string }[];
    totalBudget: string; timeToRevenue: string; successMetrics: string[];
  };
};

type HistoryItem = {
  id: string;
  input_prompt: string;
  output_data: BuildData;
  created_at: string;
};

const AGENTS = [
  { key: "founder", label: "Founder", icon: "🚀", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "hacker", label: "Hacker", icon: "⚡", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { key: "marketing", label: "Marketing", icon: "📣", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
  { key: "sales", label: "Sales", icon: "💰", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
];

const STEPS = [
  "Analysing your idea...",
  "Founder Agent — building business plan & pitch deck...",
  "Marketing Agent — creating launch campaign & content...",
  "Sales Agent — designing CRM pipeline & email sequences...",
  "Synthesising all agents into your startup OS...",
];

function useStyles() {
  useEffect(() => {
    const id = "bs2-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=DM+Mono:wght@400;500&display=swap');
      @keyframes bs2-spin { to { transform: rotate(360deg); } }
      @keyframes bs2-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      @keyframes bs2-glow { 0%,100%{box-shadow:0 0 24px rgba(37,99,235,0.18)} 50%{box-shadow:0 0 48px rgba(124,58,237,0.32)} }
      @keyframes bs2-bar { from{width:0%} to{width:100%} }
      .bs2-tab:hover { background: #f0f7ff !important; color: #2563eb !important; }
      .bs2-card { transition: all 0.2s ease; }
      .bs2-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.07) !important; }
      .bs2-agent-link:hover { background: #f0f7ff !important; border-color: #bfdbfe !important; }
      .bs2-history:hover { background: #f0f7ff !important; }
      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

function Spinner({ size = 24, color = "#2563eb" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "bs2-spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.12" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="bs2-card" style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", ...style }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>{children}</div>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ padding: "4px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11.5, color: "#64748b", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function BuildStartupInner() {
  useStyles();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [data, setData] = useState<BuildData | null>(null);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const hasAutoTriggered = useRef(false);

  const getToken = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? null;
  };

  useEffect(() => {
    const urlIdea = searchParams.get("idea");
    if (urlIdea && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      const decoded = decodeURIComponent(urlIdea);
      setIdea(decoded);
      setLoadingHistory(false);
      runGeneration(decoded);
      return;
    }

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("/api/build-startup", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setHistory(json.data);
          const latest = json.data[0];
          setData(latest.output_data);
          setActiveHistoryId(latest.id);
          setTab("overview");
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [searchParams]);

  const runGeneration = async (inputIdea: string) => {
    if (!inputIdea.trim()) return;
    setLoading(true); setError(""); setData(null); setLoadStep(0); setActiveHistoryId(null);

    const interval = setInterval(() => {
      setLoadStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 3500);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not logged in. Please sign in and try again.");

      const res = await fetch("/api/build-startup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ idea: inputIdea }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data);
      setTab("overview");
      setActiveHistoryId(json.outputId ?? null);

      // Refresh history list
      const histRes = await fetch("/api/build-startup", { headers: { Authorization: `Bearer ${token}` } });
      const histJson = await histRes.json();
      if (histJson.data) setHistory(histJson.data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setData(item.output_data);
    setActiveHistoryId(item.id);
    setTab("overview");
    setError("");
    setShowHistory(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleSubmit = () => { if (idea.trim()) runGeneration(idea); };

  const name = data?.orchestrator?.startupName ?? data?.founder?.companyName ?? "";
  const tagline = data?.orchestrator?.tagline ?? data?.founder?.tagline ?? "";

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "roadmap", label: "Week-by-Week" },
    { key: "founder", label: "🚀 Business Plan" },
    { key: "marketing", label: "📣 Marketing" },
    { key: "sales", label: "💰 Sales" },
    { key: "hacker", label: "⚡ MVP" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Mono', monospace", color: "#0f172a" }}>

      {/* HEADER */}
      <header style={{ height: 54, borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#2563eb"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#94a3b8"}>
            ← back
          </button>
          <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}>✦</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.2 }}>Build My Startup</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>4 agents · parallel</div>
            </div>
          </div>
          {data && name && (
            <>
              <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(o => !o)}
              style={{ padding: "5px 12px", background: showHistory ? "#eff6ff" : "#fff", border: `1px solid ${showHistory ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: 7, fontSize: 11, fontWeight: 600, color: showHistory ? "#2563eb" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              History ({history.length})
            </button>
          )}
          {AGENTS.map(a => (
            <Link key={a.key} href={`/${a.key}`} className="bs2-agent-link"
              style={{ fontSize: 11, padding: "5px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </header>

      {/* History dropdown */}
      {showHistory && history.length > 0 && (
        <div style={{ position: "fixed", top: 54, right: 24, width: 340, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
            Past Runs — Build My Startup
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {history.map(item => {
              const startupName = item.output_data?.orchestrator?.startupName ?? item.output_data?.founder?.companyName ?? item.input_prompt?.slice(0, 30);
              return (
                <div key={item.id} className="bs2-history" onClick={() => loadHistoryItem(item)}
                  style={{ padding: "12px 16px", cursor: "pointer", transition: "all 0.15s", background: activeHistoryId === item.id ? "#eff6ff" : "#fff", borderBottom: "1px solid #f9f9f9", borderLeft: activeHistoryId === item.id ? "3px solid #2563eb" : "3px solid transparent" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{startupName}</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{item.input_prompt?.slice(0, 50)}...</span>
                    <span style={{ flexShrink: 0, marginLeft: 8 }}>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); setShowHistory(false); }}
              style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + New Generation
            </button>
          </div>
        </div>
      )}
      {showHistory && <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowHistory(false)} />}

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 24px" }}>

        {/* Loading history */}
        {loadingHistory && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", border: "2px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Spinner size={26} color="#4f46e5" />
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Loading your past runs...</div>
          </div>
        )}

        {/* INPUT STATE */}
        {!loadingHistory && !data && !loading && (
          <div style={{ animation: "bs2-up 0.4s ease", textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28, animation: "bs2-glow 3s ease-in-out infinite" }}>✦</div>
            <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-2px", marginBottom: 12, lineHeight: 1.1, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Build My Startup</h1>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, maxWidth: 500, margin: "0 auto 20px" }}>Enter one idea. All 4 agents run simultaneously and return your complete startup operating system.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
              {AGENTS.map(a => (
                <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: `1px solid ${a.border}`, borderRadius: 20, background: a.bg }}>
                  <span style={{ fontSize: 13 }}>{a.icon}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: a.color }}>{a.label} Agent</span>
                </div>
              ))}
            </div>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <textarea value={idea} onChange={e => setIdea(e.target.value)} rows={4}
                placeholder="Describe your startup idea..."
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
                style={{ width: "100%", padding: "16px 20px", border: "1.5px solid #e2e8f0", borderRadius: 14, fontSize: 14, fontFamily: "'DM Mono', monospace", outline: "none", resize: "none", color: "#0f172a", background: "#fff", lineHeight: 1.7, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box" }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#818cf8"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(37,99,235,0.1)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)"; }} />
              <button onClick={handleSubmit} disabled={!idea.trim()}
                style={{ marginTop: 12, width: "100%", padding: "14px 0", background: idea.trim() ? "linear-gradient(135deg,#1d4ed8,#7c3aed)" : "#f1f5f9", color: idea.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'Cabinet Grotesk', sans-serif", boxShadow: idea.trim() ? "0 6px 24px rgba(37,99,235,0.35)" : "none", transition: "all 0.2s" }}>
                ✦ Run All 4 Agents →
              </button>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {["AI esports talent platform", "B2B SaaS for restaurant ops", "No-code builder for SMBs", "Mental health app for teams"].map(ex => (
                <button key={ex} onClick={() => setIdea(ex)}
                  style={{ padding: "6px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "'DM Mono', monospace", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#c7d2fe"; (e.currentTarget as HTMLElement).style.color = "#4f46e5"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", animation: "bs2-up 0.3s ease" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", border: "2px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "bs2-glow 2s ease-in-out infinite" }}>
              <Spinner size={28} color="#4f46e5" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 10, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Running 4 agents in parallel...</div>
            <div style={{ fontSize: 13, color: "#6366f1", marginBottom: 40, minHeight: 20 }}>{STEPS[loadStep]}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, maxWidth: 640, margin: "0 auto" }}>
              {AGENTS.map((a, i) => (
                <div key={a.key} style={{ padding: "16px 14px", background: "#fff", border: `1px solid ${a.border}`, borderRadius: 12, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 8 }}>{a.label}</div>
                  <div style={{ height: 3, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: `linear-gradient(90deg,${a.color},${a.color}88)`, borderRadius: 3, animation: `bs2-bar ${3 + i}s ease-out forwards`, animationDelay: `${i * 0.4}s`, width: "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: "28px", color: "#dc2626", fontSize: 13, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 20 }}>
            ⚠ {error}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => runGeneration(idea)} style={{ padding: "8px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Retry</button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {data && !loading && (
          <div style={{ animation: "bs2-up 0.4s ease" }}>
            <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 6, fontFamily: "'Cabinet Grotesk', sans-serif", lineHeight: 1.1 }}>{name}</h2>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 560 }}>{tagline}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => { setData(null); setIdea(""); router.push("/dashboard"); }}
                  style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>← Dashboard</button>
                <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); }}
                  style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>New Idea</button>
              </div>
            </div>

            {/* Inline re-run bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input value={idea} onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && idea.trim()) runGeneration(idea); }}
                placeholder="Run for a different idea..."
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none", color: "#0f172a", background: "#fff", transition: "border-color 0.2s" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#818cf8"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"} />
              <button onClick={() => runGeneration(idea)} disabled={!idea.trim()}
                style={{ padding: "10px 20px", background: idea.trim() ? "linear-gradient(135deg,#1d4ed8,#7c3aed)" : "#f1f5f9", color: idea.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'Cabinet Grotesk', sans-serif", whiteSpace: "nowrap" }}>
                Regenerate →
              </button>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { label: "TAM", value: data.founder?.marketAnalysis?.tam, color: "#7c3aed" },
                { label: "Funding Stage", value: data.founder?.fundingStrategy?.stage, color: "#2563eb" },
                { label: "Time to Revenue", value: data.orchestrator?.timeToRevenue, color: "#059669" },
                { label: "12-Month ARR", value: data.sales?.revenueProjections?.month12, color: "#dc2626" },
              ].map(s => (
                <Card key={s.label} style={{ padding: "16px 18px" }}>
                  <Label>{s.label}</Label>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: "-0.5px", fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value ?? "—"}</div>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #f1f5f9", marginBottom: 28, overflowX: "auto" }}>
              {TABS.map(t => (
                <button key={t.key} className="bs2-tab" onClick={() => setTab(t.key)}
                  style={{ padding: "9px 15px", border: "none", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 12.5, fontWeight: 500, color: tab === t.key ? "#2563eb" : "#94a3b8", borderBottom: `2px solid ${tab === t.key ? "#2563eb" : "transparent"}`, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", marginBottom: -1 }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {AGENTS.map(a => {
                  const summaries: Record<string, string | undefined> = {
                    founder: data.orchestrator?.founderSummary,
                    hacker: data.orchestrator?.hackerSummary,
                    marketing: data.orchestrator?.marketingSummary,
                    sales: data.orchestrator?.salesSummary,
                  };
                  return (
                    <Link key={a.key} href={`/${a.key}`} className="bs2-agent-link"
                      style={{ display: "block", textDecoration: "none", background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "20px 22px", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: a.bg, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{a.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "'Cabinet Grotesk', sans-serif" }}>{a.label} Agent</div>
                          <div style={{ fontSize: 10.5, color: a.color }}>Open full report →</div>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.75, margin: 0 }}>{summaries[a.key] ?? "Ready. Click to open full report."}</p>
                    </Link>
                  );
                })}
                <Card style={{ gridColumn: "1/-1" }}>
                  <Label>Success Metrics</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {data.orchestrator?.successMetrics?.map((m, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#334155", padding: "9px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                        <span style={{ color: "#2563eb", flexShrink: 0 }}>✓</span>{m}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {tab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.orchestrator?.weekByWeekPlan?.map((w, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#4f46e5", flexShrink: 0 }}>W{w.week}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "'Cabinet Grotesk', sans-serif" }}>{w.focus}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Founder", icon: "🚀", color: "#7c3aed", task: w.founderTask },
                        { label: "Hacker", icon: "⚡", color: "#2563eb", task: w.hackerTask },
                        { label: "Marketing", icon: "📣", color: "#dc2626", task: w.marketingTask },
                        { label: "Sales", icon: "💰", color: "#059669", task: w.salesTask },
                      ].map(a => (
                        <div key={a.label} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 9, border: `1px solid ${a.color}18` }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: a.color, marginBottom: 5 }}>{a.icon} {a.label}</div>
                          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>{a.task}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {tab === "founder" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card style={{ gridColumn: "1/-1" }}>
                  <Label>Executive Summary</Label>
                  <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.85, margin: 0 }}>{data.founder?.executiveSummary}</p>
                </Card>
                <Card>
                  <Label>Market Size</Label>
                  {[{ label: "TAM", value: data.founder?.marketAnalysis?.tam, color: "#7c3aed" }, { label: "SAM", value: data.founder?.marketAnalysis?.sam, color: "#2563eb" }].map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 9, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{m.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: m.color, fontFamily: "'Cabinet Grotesk', sans-serif" }}>{m.value}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>Growth: {data.founder?.marketAnalysis?.growthRate}</div>
                </Card>
                <Card>
                  <Label>Go-to-Market Phases</Label>
                  {[{ label: "Phase 1", value: data.founder?.goToMarket?.phase1, color: "#7c3aed" }, { label: "Phase 2", value: data.founder?.goToMarket?.phase2, color: "#2563eb" }, { label: "Phase 3", value: data.founder?.goToMarket?.phase3, color: "#059669" }].map(p => (
                    <div key={p.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{p.label}</div>
                      <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65 }}>{p.value}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>Competitor Analysis</Label>
                  {data.founder?.competitorAnalysis?.map((c, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 9, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: "#dc2626", marginBottom: 2 }}>⚠ {c.weakness}</div>
                      <div style={{ fontSize: 11.5, color: "#059669" }}>✓ {c.howWeWin}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>Next Steps</Label>
                  {data.founder?.nextSteps?.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#334155", marginBottom: 7 }}>
                      <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{s}
                    </div>
                  ))}
                </Card>
                <Link href="/founder" style={{ gridColumn: "1/-1", background: "linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius: 14, padding: "22px 24px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Open Full Founder Report</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Investor email, funding strategy, market deep-dive →</div>
                  </div>
                  <span style={{ fontSize: 26 }}>🚀</span>
                </Link>
              </div>
            )}

            {tab === "marketing" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card style={{ gridColumn: "1/-1" }}>
                  <Label>Launch Day Plan</Label>
                  <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.85, margin: 0 }}>{data.marketing?.launchStrategy?.launchDay}</p>
                </Card>
                <Card>
                  <Label>Twitter / X Posts</Label>
                  {data.marketing?.socialMediaCampaign?.twitter?.posts?.slice(0, 3).map((p, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                      <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, margin: 0, flex: 1 }}>{p}</p>
                      <CopyBtn text={p} />
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>Growth Hacks</Label>
                  {data.marketing?.growthHacks?.map((g, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, fontSize: 13, color: "#334155", marginBottom: 7, lineHeight: 1.65 }}>
                      <span style={{ color: "#dc2626", flexShrink: 0 }}>⚡</span>{g}
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>Product Hunt</Label>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Tagline</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>{data.marketing?.socialMediaCampaign?.productHunt?.tagline}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>{data.marketing?.socialMediaCampaign?.productHunt?.description}</p>
                  </div>
                </Card>
                <Card>
                  <Label>KPIs</Label>
                  {data.marketing?.kpis?.slice(0, 4).map((k, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 12, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: "#334155", fontWeight: 500 }}>{k.metric}</span>
                      <span style={{ color: "#dc2626", fontWeight: 700, textAlign: "center" }}>M1: {k.month1Target}</span>
                      <span style={{ color: "#059669", fontWeight: 700, textAlign: "center" }}>M3: {k.month3Target}</span>
                    </div>
                  ))}
                </Card>
                <Link href="/marketing" style={{ gridColumn: "1/-1", background: "linear-gradient(135deg,#dc2626,#f87171)", borderRadius: 14, padding: "22px 24px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Open Full Marketing Report</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Email campaigns, ad copy, SEO, full content calendar →</div>
                  </div>
                  <span style={{ fontSize: 26 }}>📣</span>
                </Link>
              </div>
            )}

            {tab === "sales" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card>
                  <Label>Revenue Projections</Label>
                  {[{ label: "Month 3", value: data.sales?.revenueProjections?.month3, color: "#059669" }, { label: "Month 6", value: data.sales?.revenueProjections?.month6, color: "#2563eb" }, { label: "Month 12", value: data.sales?.revenueProjections?.month12, color: "#7c3aed" }].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 9, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: r.color, fontFamily: "'Cabinet Grotesk', sans-serif" }}>{r.value}</span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>CRM Pipeline Stages</Label>
                  {data.sales?.crmPipeline?.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 9 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f0fdf4", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#059669", flexShrink: 0 }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.stage}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>~{s.averageDaysInStage} days</div>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <Label>First Cold Email Template</Label>
                    {data.sales?.emailTemplates?.[0] && <CopyBtn text={data.sales.emailTemplates[0].body} />}
                  </div>
                  {data.sales?.emailTemplates?.[0] && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>Subject: {data.sales.emailTemplates[0].subject}</div>
                      <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#334155", lineHeight: 1.85, whiteSpace: "pre-wrap", background: "#f8fafc", padding: "16px 18px", borderRadius: 10, border: "1px solid #f1f5f9", margin: 0 }}>{data.sales.emailTemplates[0].body}</pre>
                    </>
                  )}
                </Card>
                <Link href="/sales" style={{ gridColumn: "1/-1", background: "linear-gradient(135deg,#059669,#34d399)", borderRadius: 14, padding: "22px 24px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Open Full Sales Report</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>All email sequences, objection handling, follow-up cadence →</div>
                  </div>
                  <span style={{ fontSize: 26 }}>💰</span>
                </Link>
              </div>
            )}

            {tab === "hacker" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card style={{ gridColumn: "1/-1" }}>
                  <Label>MVP Architecture</Label>
                  <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.85, margin: 0 }}>{data.orchestrator?.hackerSummary ?? "Analyse the business plan above and use the Hacker Agent to generate your full codebase."}</p>
                </Card>
                <Link href="/build" style={{ gridColumn: "1/-1", background: "linear-gradient(135deg,#1d4ed8,#2563eb)", borderRadius: 14, padding: "28px 24px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 6, fontFamily: "'Cabinet Grotesk', sans-serif" }}>⚡ Build MVP with Hacker Agent</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>Generate the full codebase from your blueprint and download as ZIP →</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuildStartupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#94a3b8", fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "bs2-spin 0.8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Loading...
        </div>
      </div>
    }>
      <BuildStartupInner />
    </Suspense>
  );
}