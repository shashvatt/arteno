"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type FounderData = {
  companyName: string; tagline: string; executiveSummary: string;
  problemStatement: { problem: string; whyNowTiming: string };
  solution: { coreProduct: string; unfairAdvantage: string };
  marketAnalysis: { tam: string; sam: string; som: string; growthRate: string; keyTrends: string[] };
  targetAudience: { icp: string; psychographics: string[] };
  businessModel: { primaryRevenue: string; pricingStrategy: string; unitEconomics: { ltv: string; cac: string; ltvCacRatio: string; paybackPeriod: string } };
  goToMarket: { phase1: string; phase2: string; phase3: string; acquisitionChannels: string[]; launchStrategy: string };
  competitorAnalysis: { name: string; weakness: string; howWeWin: string }[];
  fundingStrategy: { stage: string; askAmount: string; useOfFunds: string[]; keyMilestones: string[]; targetInvestors: string[] };
  pitchDeckOutline: { slide: number; title: string; content: string }[];
  risks: { risk: string; mitigation: string }[];
  investorEmail: string;
  nextSteps: string[];
};

type HistoryItem = {
  id: string;
  input_prompt: string;
  output_data: FounderData;
  created_at: string;
};

function useInjectStyles() {
  useEffect(() => {
    const id = "founder-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes fa-spin { to { transform: rotate(360deg); } }
      @keyframes fa-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      .fa-tab:hover { background: #faf5ff !important; color: #7c3aed !important; }
      .fa-card:hover { border-color: #ddd6fe !important; }
      .history-item:hover { background: #faf5ff !important; border-color: #ddd6fe !important; }
      ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#a1a1aa", marginBottom: 6 }}>{children}</div>;
}
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="fa-card" style={{ background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, padding: "20px 22px", transition: "all 0.2s", ...style }}>{children}</div>;
}
function Tag({ children, color = "#7c3aed" }: { children: React.ReactNode; color?: string }) {
  return <span style={{ display: "inline-block", fontSize: 11.5, padding: "3px 10px", borderRadius: 20, background: `${color}12`, color, border: `1px solid ${color}22`, fontWeight: 500 }}>{children}</span>;
}
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ padding: "4px 10px", background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 11.5, color: "#71717a", cursor: "pointer", fontFamily: "inherit" }}>{copied ? "✓ Copied" : "Copy"}</button>;
}

const TABS = [
  { key: "overview", label: "Overview" }, { key: "market", label: "Market" },
  { key: "business", label: "Business Model" }, { key: "gtm", label: "Go-to-Market" },
  { key: "funding", label: "Funding" }, { key: "pitch", label: "Pitch Deck" },
  { key: "outreach", label: "Investor Email" },
];

export default function FounderPage() {
  useInjectStyles();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [data, setData] = useState<FounderData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const getToken = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? null;
  };

  // ── Load history on mount, auto-load last run ──
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("/api/founder", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setHistory(json.data);
          // Auto-load the most recent run
          const latest = json.data[0];
          setData(latest.output_data);
          setActiveHistoryId(latest.id);
          setActiveTab("overview");
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setError(""); setData(null); setActiveHistoryId(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("You must be logged in to use this feature.");

      const res = await fetch("/api/founder", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idea }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data);
      setActiveTab("overview");
      setActiveHistoryId(json.outputId ?? null);

      // Refresh history list
      const histRes = await fetch("/api/founder", { headers: { Authorization: `Bearer ${token}` } });
      const histJson = await histRes.json();
      if (histJson.data) setHistory(histJson.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setData(item.output_data);
    setActiveHistoryId(item.id);
    setActiveTab("overview");
    setError("");
    setShowHistory(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'DM Sans', sans-serif", color: "#0a0a0a" }}>
      <header style={{ height: 54, borderBottom: "1px solid #f4f4f5", background: "rgba(255,255,255,0.95)", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ fontSize: 12.5, color: "#a1a1aa", textDecoration: "none" }}>← Dashboard</Link>
          <div style={{ width: 1, height: 14, background: "#f4f4f5" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚀</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#09090b", lineHeight: 1.2 }}>Founder Agent</div>
              <div style={{ fontSize: 10.5, color: "#a1a1aa" }}>Startup strategist & venture architect</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* History toggle */}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(o => !o)}
              style={{ padding: "7px 14px", background: showHistory ? "#f5f3ff" : "#fff", border: `1px solid ${showHistory ? "#ddd6fe" : "#e4e4e7"}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: showHistory ? "#7c3aed" : "#71717a", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              History ({history.length})
            </button>
          )}
          <Link href="/build-startup" style={{ padding: "7px 14px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>✦ Build My Startup</Link>
        </div>
      </header>

      {/* History dropdown panel */}
      {showHistory && history.length > 0 && (
        <div style={{ position: "fixed", top: 54, right: 24, width: 320, background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f5", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
            Past Runs — Founder Agent
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {history.map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() => loadHistoryItem(item)}
                style={{
                  padding: "12px 16px", cursor: "pointer", transition: "all 0.15s",
                  background: activeHistoryId === item.id ? "#faf5ff" : "#fff",
                  borderBottom: "1px solid #f9f9f9",
                  borderLeft: activeHistoryId === item.id ? "3px solid #7c3aed" : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#09090b", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.output_data?.companyName ?? item.input_prompt?.slice(0, 40)}
                </div>
                <div style={{ fontSize: 11.5, color: "#a1a1aa", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{item.input_prompt?.slice(0, 50)}...</span>
                  <span style={{ flexShrink: 0, marginLeft: 8 }}>{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f4f4f5" }}>
            <button
              onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); setShowHistory(false); }}
              style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              + New Generation
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for history panel */}
      {showHistory && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowHistory(false)} />}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px" }}>

        {/* Loading history skeleton */}
        {loadingHistory && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f5f3ff", border: "2px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "fa-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Loading your past runs...</div>
          </div>
        )}

        {/* Empty state — no history, show input */}
        {!loadingHistory && !data && !loading && (
          <div style={{ textAlign: "center", marginBottom: 48, animation: "fa-up 0.4s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>🚀</div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 12, color: "#09090b" }}>Turn your idea into a startup blueprint</h1>
            <p style={{ fontSize: 16, color: "#71717a", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>Investor-ready business plan, pitch deck, market analysis, and funding strategy in seconds.</p>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe your startup idea..." rows={4}
                style={{ width: "100%", padding: "16px 18px", border: "1.5px solid #e4e4e7", borderRadius: 14, fontSize: 14.5, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", color: "#09090b", background: "#fff", transition: "border-color 0.2s", lineHeight: 1.65, boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
              <button onClick={generate} disabled={!idea.trim()} style={{ marginTop: 12, width: "100%", padding: "13px 0", background: idea.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                Generate Startup Blueprint →
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f5f3ff", border: "2px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "fa-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#09090b", marginBottom: 8 }}>Building your startup blueprint...</div>
            <div style={{ fontSize: 13.5, color: "#a1a1aa" }}>Analysing market, designing business model, writing pitch deck...</div>
          </div>
        )}

        {error && <div style={{ textAlign: "center", padding: 24, color: "#dc2626", fontSize: 14, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 24 }}>{error}</div>}

        {data && !loading && (
          <div style={{ animation: "fa-up 0.4s ease" }}>
            {/* Header with new idea input bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", marginBottom: 6 }}>{data.companyName}</h2>
                  <p style={{ fontSize: 15.5, color: "#52525b", maxWidth: 560 }}>{data.tagline}</p>
                </div>
                <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); }} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 9, fontSize: 13, color: "#71717a", cursor: "pointer", whiteSpace: "nowrap" }}>+ New Idea</button>
              </div>

              {/* Inline new idea bar */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={idea}
                  onChange={e => setIdea(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && idea.trim()) generate(); }}
                  placeholder="Generate for a different idea..."
                  style={{ flex: 1, padding: "10px 14px", border: "1px solid #e4e4e7", borderRadius: 10, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#09090b", background: "#fff", transition: "border-color 0.2s" }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa"}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"}
                />
                <button
                  onClick={generate}
                  disabled={!idea.trim()}
                  style={{ padding: "10px 20px", background: idea.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                  Regenerate →
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #f4f4f5", marginBottom: 28, overflowX: "auto" }}>
              {TABS.map(t => (
                <button key={t.key} className="fa-tab" onClick={() => setActiveTab(t.key)}
                  style={{ padding: "9px 16px", border: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, color: activeTab === t.key ? "#7c3aed" : "#71717a", borderBottom: `2px solid ${activeTab === t.key ? "#7c3aed" : "transparent"}`, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", marginBottom: -1 }}>{t.label}</button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card style={{ gridColumn: "1/-1" }}><Label>Executive Summary</Label><p style={{ fontSize: 14.5, lineHeight: 1.8, color: "#27272a" }}>{data.executiveSummary}</p></Card>
                <Card><Label>Problem</Label><p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#3f3f46", marginBottom: 12 }}>{data.problemStatement?.problem}</p><Label>Why Now</Label><p style={{ fontSize: 13, color: "#71717a" }}>{data.problemStatement?.whyNowTiming}</p></Card>
                <Card><Label>Solution & Unfair Advantage</Label><p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#3f3f46", marginBottom: 12 }}>{data.solution?.coreProduct}</p><p style={{ fontSize: 13, color: "#71717a" }}>{data.solution?.unfairAdvantage}</p></Card>
                <Card><Label>Target Audience</Label><p style={{ fontSize: 13.5, color: "#3f3f46", marginBottom: 10 }}>{data.targetAudience?.icp}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{data.targetAudience?.psychographics?.map((p, i) => <Tag key={i}>{p}</Tag>)}</div></Card>
                <Card><Label>Next Steps</Label>{data.nextSteps?.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3f3f46", marginBottom: 8 }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>{s}</div>)}</Card>
                <Card style={{ gridColumn: "1/-1" }}><Label>Key Risks & Mitigations</Label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>{data.risks?.map((r, i) => <div key={i} style={{ padding: "12px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #f4f4f5" }}><div style={{ fontSize: 12.5, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>⚠ {r.risk}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.65 }}>{r.mitigation}</div></div>)}</div></Card>
              </div>
            )}

            {activeTab === "market" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[{ label: "TAM", value: data.marketAnalysis?.tam, color: "#7c3aed" }, { label: "SAM", value: data.marketAnalysis?.sam, color: "#0891b2" }, { label: "SOM", value: data.marketAnalysis?.som, color: "#059669" }].map(m => (
                  <Card key={m.label} style={{ textAlign: "center", padding: "28px 22px" }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: m.color, marginBottom: 10 }}>{m.label}</div><div style={{ fontSize: 22, fontWeight: 700, color: "#09090b" }}>{m.value}</div></Card>
                ))}
                <Card style={{ gridColumn: "1/-1" }}><Label>Growth Rate</Label><p style={{ fontSize: 14, color: "#3f3f46", marginBottom: 16 }}>{data.marketAnalysis?.growthRate}</p><Label>Key Trends</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{data.marketAnalysis?.keyTrends?.map((t, i) => <Tag key={i} color="#0891b2">{t}</Tag>)}</div></Card>
                <Card style={{ gridColumn: "1/-1" }}><Label>Competitor Analysis</Label>{data.competitorAnalysis?.map((c, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: 16, padding: "14px 16px", background: "#fafafa", borderRadius: 10, border: "1px solid #f4f4f5", marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div><div><div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 3, textTransform: "uppercase" as const }}>Weakness</div><div style={{ fontSize: 12.5, color: "#71717a" }}>{c.weakness}</div></div><div><div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 3, textTransform: "uppercase" as const }}>How We Win</div><div style={{ fontSize: 12.5, color: "#71717a" }}>{c.howWeWin}</div></div></div>)}</Card>
              </div>
            )}

            {activeTab === "business" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card><Label>Primary Revenue</Label><p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.7 }}>{data.businessModel?.primaryRevenue}</p></Card>
                <Card><Label>Pricing Strategy</Label><p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.7 }}>{data.businessModel?.pricingStrategy}</p></Card>
                <Card style={{ gridColumn: "1/-1" }}><Label>Unit Economics</Label><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 8 }}>{[{ label: "LTV", value: data.businessModel?.unitEconomics?.ltv }, { label: "CAC", value: data.businessModel?.unitEconomics?.cac }, { label: "LTV:CAC", value: data.businessModel?.unitEconomics?.ltvCacRatio }, { label: "Payback", value: data.businessModel?.unitEconomics?.paybackPeriod }].map(u => <div key={u.label} style={{ padding: 16, background: "#fafafa", border: "1px solid #f4f4f5", borderRadius: 10, textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 6 }}>{u.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed" }}>{u.value}</div></div>)}</div></Card>
              </div>
            )}

            {activeTab === "gtm" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[{ label: "Phase 1 — 0-3 Months", value: data.goToMarket?.phase1, color: "#7c3aed" }, { label: "Phase 2 — 3-12 Months", value: data.goToMarket?.phase2, color: "#0891b2" }, { label: "Phase 3 — 12-24 Months", value: data.goToMarket?.phase3, color: "#059669" }].map(p => (
                    <Card key={p.label}><div style={{ fontSize: 10.5, fontWeight: 700, color: p.color, textTransform: "uppercase" as const, marginBottom: 8 }}>{p.label}</div><p style={{ fontSize: 13.5, color: "#3f3f46", lineHeight: 1.7 }}>{p.value}</p></Card>
                  ))}
                </div>
                <Card><Label>Launch Strategy</Label><p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75, marginBottom: 16 }}>{data.goToMarket?.launchStrategy}</p><Label>Acquisition Channels</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{data.goToMarket?.acquisitionChannels?.map((c, i) => <Tag key={i} color="#059669">{c}</Tag>)}</div></Card>
              </div>
            )}

            {activeTab === "funding" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card><Label>Funding Stage</Label><div style={{ fontSize: 28, fontWeight: 700, color: "#7c3aed", marginBottom: 8 }}>{data.fundingStrategy?.stage}</div><Label>Ask Amount</Label><div style={{ fontSize: 24, fontWeight: 700, color: "#09090b" }}>{data.fundingStrategy?.askAmount}</div></Card>
                <Card><Label>Use of Funds</Label>{data.fundingStrategy?.useOfFunds?.map((f, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3f3f46", marginBottom: 7 }}><span style={{ color: "#7c3aed" }}>→</span>{f}</div>)}</Card>
                <Card><Label>Key Milestones</Label>{data.fundingStrategy?.keyMilestones?.map((m, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3f3f46", marginBottom: 7 }}><span style={{ width: 18, height: 18, borderRadius: "50%", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>{m}</div>)}</Card>
                <Card><Label>Target Investors</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{data.fundingStrategy?.targetInvestors?.map((inv, i) => <Tag key={i}>{inv}</Tag>)}</div></Card>
              </div>
            )}

            {activeTab === "pitch" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.pitchDeckOutline?.map((slide, i) => (
                  <Card key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#7c3aed", flexShrink: 0 }}>{slide.slide}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: "#09090b", marginBottom: 5 }}>{slide.title}</div><div style={{ fontSize: 13.5, color: "#71717a", lineHeight: 1.7 }}>{slide.content}</div></div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "outreach" && (
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <Label>Cold Investor Outreach Email</Label>
                  <CopyButton text={data.investorEmail ?? ""} />
                </div>
                <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.85, color: "#27272a", whiteSpace: "pre-wrap", background: "#fafafa", padding: "20px 22px", borderRadius: 10, border: "1px solid #f4f4f5", margin: 0 }}>{data.investorEmail}</pre>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}