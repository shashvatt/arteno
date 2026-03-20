"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function useWindowWidth() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

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
  { key: "founder",   label: "Founder",   icon: "🚀", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", gradient: "linear-gradient(135deg,#7c3aed,#a855f7)" },
  { key: "hacker",    label: "Hacker",    icon: "⚡", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", gradient: "linear-gradient(135deg,#1d4ed8,#2563eb)" },
  { key: "marketing", label: "Marketing", icon: "📣", color: "#dc2626", bg: "#fff1f2", border: "#fecaca", gradient: "linear-gradient(135deg,#dc2626,#f87171)" },
  { key: "sales",     label: "Sales",     icon: "💰", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", gradient: "linear-gradient(135deg,#059669,#34d399)" },
];

const LOAD_STEPS = [
  "Analysing your idea...",
  "Founder Agent — building business plan & pitch deck...",
  "Marketing Agent — creating launch campaign & content...",
  "Sales Agent — designing CRM pipeline & email sequences...",
  "Synthesising all agents into your startup OS...",
];

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      setProgress((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 300 }}>
      <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa,#6366f1)", transition: "width 0.1s linear", borderRadius: "0 2px 2px 0" }} />
    </div>
  );
}

function MouseBlobs() {
  const blob1 = useRef<HTMLDivElement>(null);
  const blob2 = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const cur1 = useRef({ x: 0, y: 0 });
  const cur2 = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", move);
    let raf: number;
    const tick = () => {
      cur1.current.x += (mouse.current.x - cur1.current.x) * 0.055;
      cur1.current.y += (mouse.current.y - cur1.current.y) * 0.055;
      cur2.current.x += (mouse.current.x - cur2.current.x) * 0.028;
      cur2.current.y += (mouse.current.y - cur2.current.y) * 0.028;
      if (blob1.current) blob1.current.style.transform = `translate(${cur1.current.x - 200}px,${cur1.current.y - 200}px)`;
      if (blob2.current) blob2.current.style.transform = `translate(${cur2.current.x - 250}px,${cur2.current.y - 250}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div ref={blob1} style={{ position: "absolute", top: 0, left: 0, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)", filter: "blur(40px)", willChange: "transform" }} />
      <div ref={blob2} style={{ position: "absolute", top: 0, left: 0, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.04) 0%,transparent 70%)", filter: "blur(60px)", willChange: "transform" }} />
    </div>
  );
}

function SpotlightCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  return (
    <div ref={cardRef} onMouseMove={handleMove} onMouseLeave={() => setSpot(null)} style={{ position: "relative", overflow: "hidden", ...style }}>
      {spot && <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)", left: spot.x - 150, top: spot.y - 150, pointerEvents: "none", zIndex: 0 }} />}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function Spinner({ size = 24, color = "#7c3aed" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "bms-spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.12" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#9ca3af", margin: 0 }}>{children}</p>;
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <SpotlightCard style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px", transition: "box-shadow 0.25s, border-color 0.25s", ...style }}>
      {children}
    </SpotlightCard>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 10 }}>{children}</div>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ padding: "5px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 100, fontSize: 11.5, color: "#6b7280", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function useGlobalStyles() {
  useEffect(() => {
    const id = "bms-global";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      @keyframes bms-spin    { to { transform: rotate(360deg); } }
      @keyframes bms-up      { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      @keyframes bms-bar     { from{width:0%} to{width:100%} }
      @keyframes bms-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.3);} 50%{box-shadow:0 0 0 8px rgba(124,58,237,0);} }
      @keyframes bms-shimmer { 0%{transform:translateX(-120%);} 60%,100%{transform:translateX(120%);} }
      @keyframes pulseGreen  { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4);} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0);} }
      @keyframes bms-float1  { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-8px);} }
      @keyframes bms-float2  { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-12px);} }
      .bms-tab:hover { color: #7c3aed !important; }
      .bms-agent-nav:hover { background: #f9f8ff !important; border-color: #ddd6fe !important; color: #7c3aed !important; }
      .bms-history-item:hover { background: #fafbff !important; }
      /* hide scrollbar on tab row */
      .bms-tabs::-webkit-scrollbar { display: none; }
      .bms-tabs { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

// ─── Main ───────────────────────────────────────────────
function BuildStartupInner() {
  useGlobalStyles();
  const searchParams = useSearchParams();
  const router = useRouter();
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 768;

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
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasAutoTriggered = useRef(false);

  useEffect(() => {
    setMounted(true);
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

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
        const res = await fetch("/api/build-startup", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.data?.length > 0) {
          setHistory(json.data);
          setData(json.data[0].output_data);
          setActiveHistoryId(json.data[0].id);
          setTab("overview");
        }
      } catch (e) { console.error(e); }
      finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, [searchParams]);

  const runGeneration = async (inputIdea: string) => {
    if (!inputIdea.trim()) return;
    setLoading(true); setError(""); setData(null); setLoadStep(0); setActiveHistoryId(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 3500);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not logged in. Please sign in and try again.");
      const res = await fetch("/api/build-startup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idea: inputIdea }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data); setTab("overview"); setActiveHistoryId(json.outputId ?? null);
      const histRes = await fetch("/api/build-startup", { headers: { Authorization: `Bearer ${token}` } });
      const histJson = await histRes.json();
      if (histJson.data) setHistory(histJson.data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally { setLoading(false); clearInterval(interval); }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setData(item.output_data); setActiveHistoryId(item.id); setTab("overview"); setError(""); setShowHistory(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const name    = data?.orchestrator?.startupName ?? data?.founder?.companyName ?? "";
  const tagline = data?.orchestrator?.tagline     ?? data?.founder?.tagline     ?? "";

  const TABS = [
    { key: "overview",   label: "Overview" },
    { key: "roadmap",    label: isMobile ? "Roadmap" : "Week-by-Week" },
    { key: "founder",    label: isMobile ? "🚀 Plan"  : "🚀 Business Plan" },
    { key: "marketing",  label: isMobile ? "📣 Mktg"  : "📣 Marketing" },
    { key: "sales",      label: "💰 Sales" },
    { key: "hacker",     label: "⚡ MVP" },
  ];

  // Shorthand responsive values
  const g2  = isMobile ? "1fr"        : "1fr 1fr";
  const px  = isMobile ? "14px"       : "32px";
  const gap = isMobile ? 10           : 16;

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#fafbff", fontFamily: "'DM Sans', sans-serif", color: "#0b0f1a", overflowX: "hidden" }}>
      <ScrollProgressBar />
      {!isMobile && <MouseBlobs />}

      {/* ── NAVBAR ── */}
      <header style={{
        height: isMobile ? 52 : 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 ${px}`,
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, minWidth: 0, flex: 1 }}>
          <button onClick={() => router.back()}
            style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, flexShrink: 0, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7c3aed"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}>
            ← {!isMobile && "back"}
          </button>
          <div style={{ width: 1, height: 16, background: "#e5e7eb", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✦</div>
            {!isMobile && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0b0f1a" }}>Build My Startup</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>4 agents · parallel</div>
              </div>
            )}
          </div>
          {data && name && !isMobile && (
            <>
              <div style={{ width: 1, height: 16, background: "#e5e7eb" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0, animation: "pulseGreen 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 12.5, color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{name}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexShrink: 0 }}>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(o => !o)}
              style={{ padding: isMobile ? "5px 9px" : "6px 13px", background: showHistory ? "#f5f3ff" : "#fff", border: `1px solid ${showHistory ? "#ddd6fe" : "#e5e7eb"}`, borderRadius: 100, fontSize: 11.5, fontWeight: 600, color: showHistory ? "#7c3aed" : "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {isMobile ? history.length : `History (${history.length})`}
            </button>
          )}
          {!isMobile && AGENTS.map(a => (
            <Link key={a.key} href={`/${a.key}`} className="bms-agent-nav"
              style={{ fontSize: 11.5, padding: "6px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 100, color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500, transition: "all 0.15s" }}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </header>

      {/* ── HISTORY DROPDOWN ── */}
      {showHistory && history.length > 0 && (
        <div style={{ position: "fixed", top: isMobile ? 52 : 68, right: isMobile ? 10 : 28, width: isMobile ? "calc(100vw - 20px)" : 360, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden", animation: "bms-up 0.2s ease" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionLabel>Past Runs</SectionLabel>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{history.length} builds</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {history.map(item => {
              const n = item.output_data?.orchestrator?.startupName ?? item.output_data?.founder?.companyName ?? item.input_prompt?.slice(0, 30);
              const active = activeHistoryId === item.id;
              return (
                <div key={item.id} className="bms-history-item" onClick={() => loadHistoryItem(item)}
                  style={{ padding: "12px 16px", cursor: "pointer", background: active ? "#fafbff" : "#fff", borderBottom: "1px solid #f9f9f9", borderLeft: `3px solid ${active ? "#7c3aed" : "transparent"}`, transition: "all 0.15s" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0b0f1a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.input_prompt?.slice(0, 40)}…</span>
                    <span style={{ flexShrink: 0 }}>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6" }}>
            <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); setShowHistory(false); }}
              style={{ width: "100%", padding: "10px 0", background: "#0b172a", color: "#fff", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + New Generation
            </button>
          </div>
        </div>
      )}
      {showHistory && <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowHistory(false)} />}

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: isMobile ? `24px ${px} 60px` : `48px ${px} 80px`, position: "relative", zIndex: 1 }}>

        {/* Loading */}
        {loadingHistory && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "bms-pulse 2s ease-in-out infinite" }}>
              <Spinner size={24} />
            </div>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Loading your past runs…</p>
          </div>
        )}

        {/* ── INPUT ── */}
        {!loadingHistory && !data && !loading && (
          <div style={{ animation: "bms-up 0.5s ease" }}>
            <div style={{ textAlign: "center", maxWidth: 580, margin: "0 auto", paddingBottom: isMobile ? 32 : 48 }}>
              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22, fontSize: 12, fontWeight: 600, color: "#374151", background: "rgba(249,250,251,0.9)", border: "1px solid #e5e7eb", padding: "6px 14px 6px 10px", borderRadius: 100, position: "relative", overflow: "hidden" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulseGreen 2s ease-in-out infinite" }} />
                AI Startup Operating System
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(167,139,250,0.2) 50%,transparent 70%)", animation: "bms-shimmer 3.5s ease-in-out infinite", borderRadius: 100, pointerEvents: "none" }} />
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(34px,9vw,52px)" : "clamp(44px,6vw,68px)", fontWeight: 400, letterSpacing: "-2px", lineHeight: 1.06, color: "#0b0f1a", marginBottom: 14 }}>
                Build My Startup
              </h1>
              <p style={{ fontSize: isMobile ? 14.5 : 17, color: "#4b5563", lineHeight: 1.75, maxWidth: 420, margin: "0 auto 28px" }}>
                Enter one idea. All 4 agents run simultaneously and return your complete startup OS.
              </p>
              <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", marginBottom: 0 }}>
                {AGENTS.map(a => (
                  <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: `1px solid ${a.border}`, borderRadius: 100, background: a.bg, fontSize: 12, fontWeight: 600, color: a.color }}>
                    {a.icon} {a.label}{!isMobile && " Agent"}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <SpotlightCard style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: isMobile ? "18px" : "26px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                <textarea value={idea} onChange={e => setIdea(e.target.value)} rows={isMobile ? 3 : 4}
                  placeholder="Describe your startup idea in plain English…"
                  onKeyDown={e => { if (e.key === "Enter" && e.metaKey && idea.trim()) runGeneration(idea); }}
                  style={{ width: "100%", padding: "12px 15px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", color: "#0b0f1a", background: "#fafbff", lineHeight: 1.7, transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(139,92,246,0.08)"; }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }} />
                <button onClick={() => { if (idea.trim()) runGeneration(idea); }} disabled={!idea.trim()}
                  style={{ marginTop: 10, width: "100%", padding: "13px 0", background: idea.trim() ? "#0b172a" : "#f3f4f6", color: idea.trim() ? "#fff" : "#9ca3af", border: "none", borderRadius: 100, fontSize: 14.5, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", boxShadow: idea.trim() ? "0 4px 18px rgba(11,23,42,0.2)" : "none", transition: "all 0.2s" }}>
                  ✦ Run All 4 Agents →
                </button>
              </SpotlightCard>

              <div style={{ marginTop: 14, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                {["AI esports talent platform", "B2B SaaS for restaurant ops", "No-code builder for SMBs", "Mental health app for teams"].map(ex => (
                  <button key={ex} onClick={() => setIdea(ex)}
                    style={{ padding: "6px 13px", background: "rgba(255,255,255,0.85)", border: "1px solid #e5e7eb", borderRadius: 100, fontSize: isMobile ? 11 : 12, color: "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#ddd6fe"; el.style.color = "#7c3aed"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e5e7eb"; el.style.color = "#6b7280"; }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: isMobile ? "56px 0" : "80px 0", animation: "bms-up 0.4s ease" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", animation: "bms-pulse 2s ease-in-out infinite" }}>
              <Spinner size={28} />
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 24 : 32, fontWeight: 400, color: "#0b0f1a", marginBottom: 8 }}>Running 4 agents…</h2>
            <p style={{ fontSize: 13, color: "#7c3aed", marginBottom: 36, fontWeight: 500 }}>{LOAD_STEPS[loadStep]}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: isMobile ? "100%" : 640, margin: "0 auto" }}>
              {AGENTS.map((a, i) => (
                <div key={a.key} style={{ padding: "14px 12px", background: "#fff", border: `1px solid ${a.border}`, borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 10 }}>{a.label}</div>
                  <div style={{ height: 3, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: a.gradient, borderRadius: 3, animation: `bms-bar ${3 + i}s ease-out forwards`, animationDelay: `${i * 0.4}s`, width: "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <div style={{ padding: "18px", color: "#dc2626", fontSize: 13.5, background: "#fff5f5", borderRadius: 14, border: "1px solid #fecaca", marginBottom: 20, animation: "bms-up 0.3s ease" }}>
            <div style={{ marginBottom: 12 }}>⚠ {error}</div>
            <button onClick={() => runGeneration(idea)} style={{ padding: "7px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Retry</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {data && !loading && (
          <div style={{ animation: "bms-up 0.5s ease" }}>

            {/* Header */}
            <div style={{ marginBottom: isMobile ? 18 : 26, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <SectionLabel>Your Startup OS</SectionLabel>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(26px,7vw,40px)" : "clamp(32px,4vw,48px)", fontWeight: 400, letterSpacing: "-1.5px", color: "#0b0f1a", lineHeight: 1.1, marginTop: 8, marginBottom: 6 }}>{name}</h2>
                <p style={{ fontSize: isMobile ? 13 : 15, color: "#4b5563", lineHeight: 1.7, maxWidth: 520 }}>{tagline}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 4 }}>
                {!isMobile && (
                  <button onClick={() => { setData(null); setIdea(""); router.push("/dashboard"); }}
                    style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 100, fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ← Dashboard
                  </button>
                )}
                <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); }}
                  style={{ padding: "8px 16px", background: "#0b172a", border: "none", borderRadius: 100, fontSize: 13, color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  New Idea
                </button>
              </div>
            </div>

            {/* Re-run */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: isMobile ? "8px 8px 8px 13px" : "9px 9px 9px 15px" }}>
              <input value={idea} onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && idea.trim()) runGeneration(idea); }}
                placeholder="Run for a different idea…"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", color: "#0b0f1a", background: "transparent", minWidth: 0 }} />
              <button onClick={() => runGeneration(idea)} disabled={!idea.trim()}
                style={{ padding: isMobile ? "7px 13px" : "8px 20px", background: idea.trim() ? "#0b172a" : "#f3f4f6", color: idea.trim() ? "#fff" : "#9ca3af", border: "none", borderRadius: 100, fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                {isMobile ? "Go →" : "Regenerate →"}
              </button>
            </div>

            {/* Stats — always 2×2 on mobile */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? 8 : 14, marginBottom: isMobile ? 18 : 26 }}>
              {[
                { label: "TAM",           value: data.founder?.marketAnalysis?.tam,       color: "#7c3aed" },
                { label: "Funding Stage", value: data.founder?.fundingStrategy?.stage,    color: "#2563eb" },
                { label: "Time to Rev.",  value: data.orchestrator?.timeToRevenue,         color: "#059669" },
                { label: "12-Mo ARR",     value: data.sales?.revenueProjections?.month12, color: "#dc2626" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: isMobile ? "12px" : "16px 18px", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 15 : 20, color: s.color, wordBreak: "break-word", lineHeight: 1.2 }}>{s.value ?? "—"}</div>
                </div>
              ))}
            </div>

            {/* Tabs — scrollable, no visible scrollbar */}
            <div className="bms-tabs" style={{ display: "flex", borderBottom: "1px solid #f3f4f6", marginBottom: isMobile ? 18 : 26, overflowX: "auto" }}>
              {TABS.map(t => (
                <button key={t.key} className="bms-tab" onClick={() => setTab(t.key)}
                  style={{ padding: isMobile ? "8px 11px" : "10px 17px", border: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 12 : 13.5, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? "#7c3aed" : "#9ca3af", borderBottom: `2px solid ${tab === t.key ? "#7c3aed" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, marginBottom: -1, transition: "color 0.15s" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: g2, gap }}>
                {AGENTS.map(a => {
                  const summaries: Record<string, string | undefined> = {
                    founder: data.orchestrator?.founderSummary,
                    hacker:  data.orchestrator?.hackerSummary,
                    marketing: data.orchestrator?.marketingSummary,
                    sales:   data.orchestrator?.salesSummary,
                  };
                  return (
                    <Link key={a.key} href={`/${a.key}`} style={{ textDecoration: "none" }}>
                      <SpotlightCard style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: isMobile ? "14px" : "20px", height: "100%", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: a.bg, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{a.icon}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0b0f1a" }}>{a.label} Agent</div>
                            <div style={{ fontSize: 10.5, color: a.color }}>Open full report →</div>
                          </div>
                        </div>
                        <p style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>{summaries[a.key] ?? "Ready. Click to open full report."}</p>
                      </SpotlightCard>
                    </Link>
                  );
                })}
                <Card style={{ gridColumn: "1/-1" }}>
                  <FieldLabel>Success Metrics</FieldLabel>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                    {data.orchestrator?.successMetrics?.map((m, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#374151", padding: "9px 11px", background: "#fafbff", borderRadius: 9, border: "1px solid #f3f4f6" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="20 6 9 17 4 12" /></svg>
                        {m}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── ROADMAP ── */}
            {tab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.orchestrator?.weekByWeekPlan?.map((w, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#7c3aed", flexShrink: 0 }}>W{w.week}</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 15 : 18, color: "#0b0f1a" }}>{w.focus}</div>
                    </div>
                    {/* 2×2 on mobile, 4-col on desktop */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Founder",   icon: "🚀", color: "#7c3aed", task: w.founderTask },
                        { label: "Hacker",    icon: "⚡", color: "#2563eb", task: w.hackerTask },
                        { label: "Marketing", icon: "📣", color: "#dc2626", task: w.marketingTask },
                        { label: "Sales",     icon: "💰", color: "#059669", task: w.salesTask },
                      ].map(a => (
                        <div key={a.label} style={{ padding: "10px 11px", background: "#fafbff", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: a.color, marginBottom: 4 }}>{a.icon} {a.label}</div>
                          <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.6 }}>{a.task}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* ── FOUNDER ── */}
            {tab === "founder" && (
              <div style={{ display: "grid", gridTemplateColumns: g2, gap }}>
                <Card style={{ gridColumn: "1/-1" }}>
                  <FieldLabel>Executive Summary</FieldLabel>
                  <p style={{ fontSize: 13.5, color: "#1e293b", lineHeight: 1.85, margin: 0 }}>{data.founder?.executiveSummary}</p>
                </Card>
                <Card>
                  <FieldLabel>Market Size</FieldLabel>
                  {[{ label: "TAM", value: data.founder?.marketAnalysis?.tam, color: "#7c3aed" }, { label: "SAM", value: data.founder?.marketAnalysis?.sam, color: "#2563eb" }].map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#fafbff", borderRadius: 9, marginBottom: 7, border: "1px solid #f3f4f6", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{m.label}</span>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 16 : 19, color: m.color, flexShrink: 0 }}>{m.value}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Growth: {data.founder?.marketAnalysis?.growthRate}</div>
                </Card>
                <Card>
                  <FieldLabel>Go-to-Market</FieldLabel>
                  {[
                    { label: "Phase 1", value: data.founder?.goToMarket?.phase1, color: "#7c3aed" },
                    { label: "Phase 2", value: data.founder?.goToMarket?.phase2, color: "#2563eb" },
                    { label: "Phase 3", value: data.founder?.goToMarket?.phase3, color: "#059669" },
                  ].map(p => (
                    <div key={p.label} style={{ marginBottom: 11 }}>
                      <div style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 100, background: p.color + "12", marginBottom: 4 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{p.label}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.6 }}>{p.value}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <FieldLabel>Competitor Analysis</FieldLabel>
                  {data.founder?.competitorAnalysis?.map((c, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#fafbff", borderRadius: 9, marginBottom: 8, border: "1px solid #f3f4f6" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0b0f1a", marginBottom: 4 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: "#dc2626", marginBottom: 2 }}>⚠ {c.weakness}</div>
                      <div style={{ fontSize: 11.5, color: "#059669" }}>✓ {c.howWeWin}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <FieldLabel>Next Steps</FieldLabel>
                  {data.founder?.nextSteps?.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#374151", marginBottom: 8, lineHeight: 1.6 }}>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#7c3aed", flexShrink: 0 }}>{i + 1}.</span>{s}
                    </div>
                  ))}
                </Card>
                <Link href="/founder" style={{ gridColumn: "1/-1", background: "#0b172a", borderRadius: 14, padding: isMobile ? "18px" : "22px 26px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 17 : 22, color: "#fff", marginBottom: 4 }}>Open Full Founder Report</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Investor email, funding strategy, market deep-dive →</div>
                  </div>
                  <span style={{ fontSize: 22, animation: "bms-float1 4s ease-in-out infinite", flexShrink: 0 }}>🚀</span>
                </Link>
              </div>
            )}

            {/* ── MARKETING ── */}
            {tab === "marketing" && (
              <div style={{ display: "grid", gridTemplateColumns: g2, gap }}>
                <Card style={{ gridColumn: "1/-1" }}>
                  <FieldLabel>Launch Day Plan</FieldLabel>
                  <p style={{ fontSize: 13.5, color: "#1e293b", lineHeight: 1.85, margin: 0 }}>{data.marketing?.launchStrategy?.launchDay}</p>
                </Card>
                <Card>
                  <FieldLabel>Twitter / X Posts</FieldLabel>
                  {data.marketing?.socialMediaCampaign?.twitter?.posts?.slice(0, 3).map((p, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#fafbff", borderRadius: 9, marginBottom: 8, border: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.7, margin: "0 0 7px" }}>{p}</p>
                      <CopyBtn text={p} />
                    </div>
                  ))}
                </Card>
                <Card>
                  <FieldLabel>Growth Hacks</FieldLabel>
                  {data.marketing?.growthHacks?.map((g, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, fontSize: 12.5, color: "#374151", marginBottom: 8, lineHeight: 1.6 }}>
                      <span style={{ color: "#dc2626", flexShrink: 0 }}>⚡</span>{g}
                    </div>
                  ))}
                </Card>
                <Card>
                  <FieldLabel>Product Hunt</FieldLabel>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Tagline</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0b0f1a", margin: 0 }}>{data.marketing?.socialMediaCampaign?.productHunt?.tagline}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Description</div>
                    <p style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>{data.marketing?.socialMediaCampaign?.productHunt?.description}</p>
                  </div>
                </Card>
                <Card>
                  <FieldLabel>KPIs</FieldLabel>
                  {data.marketing?.kpis?.slice(0, 4).map((k, i) => (
                    <div key={i} style={{ padding: "9px 11px", background: "#fafbff", borderRadius: 9, fontSize: 12, marginBottom: 6, border: "1px solid #f3f4f6" }}>
                      <div style={{ fontWeight: 500, color: "#374151", marginBottom: 4 }}>{k.metric}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>M1: {k.month1Target}</span>
                        <span style={{ color: "#d1d5db" }}>·</span>
                        <span style={{ color: "#059669", fontWeight: 700 }}>M3: {k.month3Target}</span>
                      </div>
                    </div>
                  ))}
                </Card>
                <Link href="/marketing" style={{ gridColumn: "1/-1", background: "#0b172a", borderRadius: 14, padding: isMobile ? "18px" : "22px 26px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 17 : 22, color: "#fff", marginBottom: 4 }}>Open Full Marketing Report</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Email campaigns, ad copy, SEO, full content calendar →</div>
                  </div>
                  <span style={{ fontSize: 22, animation: "bms-float2 4s ease-in-out infinite", flexShrink: 0 }}>📣</span>
                </Link>
              </div>
            )}

            {/* ── SALES ── */}
            {tab === "sales" && (
              <div style={{ display: "grid", gridTemplateColumns: g2, gap }}>
                <Card>
                  <FieldLabel>Revenue Projections</FieldLabel>
                  {[
                    { label: "Month 3",  value: data.sales?.revenueProjections?.month3,  color: "#059669" },
                    { label: "Month 6",  value: data.sales?.revenueProjections?.month6,  color: "#2563eb" },
                    { label: "Month 12", value: data.sales?.revenueProjections?.month12, color: "#7c3aed" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#fafbff", borderRadius: 9, marginBottom: 7, border: "1px solid #f3f4f6", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{r.label}</span>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 16 : 20, color: r.color, flexShrink: 0 }}>{r.value}</span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <FieldLabel>CRM Pipeline</FieldLabel>
                  {data.sales?.crmPipeline?.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f0fdf4", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#059669", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0b0f1a", wordBreak: "break-word" }}>{s.stage}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>~{s.averageDaysInStage} days</div>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
                    <FieldLabel>First Cold Email Template</FieldLabel>
                    {data.sales?.emailTemplates?.[0] && <CopyBtn text={data.sales.emailTemplates[0].body} />}
                  </div>
                  {data.sales?.emailTemplates?.[0] && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0b0f1a", marginBottom: 10, wordBreak: "break-word" }}>Subject: {data.sales.emailTemplates[0].subject}</div>
                      <pre style={{ fontFamily: "monospace", fontSize: isMobile ? 11.5 : 13, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#fafbff", padding: "14px", borderRadius: 10, border: "1px solid #f3f4f6", margin: 0, overflow: "hidden" }}>{data.sales.emailTemplates[0].body}</pre>
                    </>
                  )}
                </Card>
                <Link href="/sales" style={{ gridColumn: "1/-1", background: "#0b172a", borderRadius: 14, padding: isMobile ? "18px" : "22px 26px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 17 : 22, color: "#fff", marginBottom: 4 }}>Open Full Sales Report</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Email sequences, objection handling, follow-up cadence →</div>
                  </div>
                  <span style={{ fontSize: 22, animation: "bms-float1 5s ease-in-out infinite", flexShrink: 0 }}>💰</span>
                </Link>
              </div>
            )}

            {/* ── HACKER ── */}
            {tab === "hacker" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Card>
                  <FieldLabel>MVP Architecture</FieldLabel>
                  <p style={{ fontSize: 13.5, color: "#1e293b", lineHeight: 1.85, margin: 0 }}>
                    {data.orchestrator?.hackerSummary ?? "Analyse the business plan above and use the Hacker Agent to generate your full codebase."}
                  </p>
                </Card>
                <Link href="/build" style={{ background: "#0b172a", borderRadius: 14, padding: isMobile ? "22px 18px" : "30px 26px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", marginBottom: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulseGreen 2s ease-in-out infinite" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1 }}>HACKER AGENT</span>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 19 : 25, color: "#fff", marginBottom: 6 }}>⚡ Build MVP with Hacker Agent</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>Generate the full codebase and download as ZIP →</div>
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
      <div style={{ minHeight: "100vh", background: "#fafbff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9ca3af", fontSize: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "bms-spin 0.8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Loading…
        </div>
      </div>
    }>
      <BuildStartupInner />
    </Suspense>
  );
}