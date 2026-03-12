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

type MarketingData = {
  marketingStrategy: { positioning: string; messagingPillar: string; brandVoice: string; targetEmotion: string };
  launchStrategy: { preLaunchWeeks: string; launchDay: string; postLaunchMonth: string };
  socialMediaCampaign: {
    twitter: { threadIdea: string; posts: string[] };
    linkedin: { posts: string[] };
    productHunt: { tagline: string; description: string; firstComment: string };
  };
  emailCampaign: { type: string; subject: string; previewText: string; body: string }[];
  adCopy: { platform: string; headline: string; body: string; cta: string }[];
  seoStrategy: { primaryKeywords: string[]; longTailKeywords: string[]; contentClusters: string[]; estimatedTrafficMonth6: string };
  growthHacks: string[];
  kpis: { metric: string; month1Target: string; month3Target: string; month6Target: string }[];
  budget: { total: string; breakdown: { category: string; amount: string; percentage: string }[] };
};

type HistoryItem = {
  id: string;
  input_prompt: string;
  output_data: MarketingData;
  created_at: string;
};

function useStyles() {
  useEffect(() => {
    const id = "marketing-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes mk-spin { to { transform: rotate(360deg); } }
      @keyframes mk-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      .mk-tab:hover { background: #fff1f2 !important; color: #dc2626 !important; }
      .mk-card:hover { border-color: #fecaca !important; }
      .mk-history:hover { background: #fff1f2 !important; border-color: #fecaca !important; }
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
  return <div className="mk-card" style={{ background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, padding: "20px 22px", transition: "all 0.2s", ...style }}>{children}</div>;
}
function Tag({ children, color = "#dc2626" }: { children: React.ReactNode; color?: string }) {
  return <span style={{ display: "inline-block", fontSize: 11.5, padding: "3px 10px", borderRadius: 20, background: `${color}12`, color, border: `1px solid ${color}22`, fontWeight: 500 }}>{children}</span>;
}
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ padding: "4px 10px", background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 11.5, color: "#71717a", cursor: "pointer", fontFamily: "inherit" }}>{copied ? "✓ Copied" : "Copy"}</button>;
}

const TABS = [
  { key: "strategy", label: "Strategy" },
  { key: "launch", label: "Launch Plan" },
  { key: "social", label: "Social Media" },
  { key: "email", label: "Email Campaigns" },
  { key: "ads", label: "Ad Copy" },
  { key: "seo", label: "SEO" },
  { key: "growth", label: "Growth & KPIs" },
];

export default function MarketingPage() {
  useStyles();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [data, setData] = useState<MarketingData | null>(null);
  const [activeTab, setActiveTab] = useState("strategy");
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

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("/api/marketing", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setHistory(json.data);
          const latest = json.data[0];
          setData(latest.output_data);
          setActiveHistoryId(latest.id);
          setActiveTab("strategy");
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
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: idea }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data);
      setActiveTab("strategy");
      setActiveHistoryId(json.outputId ?? null);
      const histRes = await fetch("/api/marketing", { headers: { Authorization: `Bearer ${token}` } });
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
    setActiveTab("strategy");
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
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #dc2626, #f87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📣</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#09090b", lineHeight: 1.2 }}>Marketing Agent</div>
              <div style={{ fontSize: 10.5, color: "#a1a1aa" }}>Growth, content & brand strategist</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(o => !o)}
              style={{ padding: "7px 14px", background: showHistory ? "#fff1f2" : "#fff", border: `1px solid ${showHistory ? "#fecaca" : "#e4e4e7"}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: showHistory ? "#dc2626" : "#71717a", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              History ({history.length})
            </button>
          )}
          <Link href="/build-startup" style={{ padding: "7px 14px", background: "linear-gradient(135deg, #dc2626, #f87171)", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>✦ Build My Startup</Link>
        </div>
      </header>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div style={{ position: "fixed", top: 54, right: 24, width: 320, background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f5", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>Past Runs — Marketing Agent</div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {history.map(item => (
              <div key={item.id} className="mk-history" onClick={() => loadHistoryItem(item)}
                style={{ padding: "12px 16px", cursor: "pointer", transition: "all 0.15s", background: activeHistoryId === item.id ? "#fff1f2" : "#fff", borderBottom: "1px solid #f9f9f9", borderLeft: activeHistoryId === item.id ? "3px solid #dc2626" : "3px solid transparent" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#09090b", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.input_prompt?.slice(0, 40)}</div>
                <div style={{ fontSize: 11.5, color: "#a1a1aa", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{item.input_prompt?.slice(0, 50)}...</span>
                  <span style={{ flexShrink: 0, marginLeft: 8 }}>{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f4f4f5" }}>
            <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); setShowHistory(false); }}
              style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg, #dc2626, #f87171)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + New Generation
            </button>
          </div>
        </div>
      )}
      {showHistory && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowHistory(false)} />}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px" }}>

        {loadingHistory && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff1f2", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "mk-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Loading your past runs...</div>
          </div>
        )}

        {!loadingHistory && !data && !loading && (
          <div style={{ textAlign: "center", marginBottom: 48, animation: "mk-up 0.4s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #fff1f2, #fee2e2)", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>📣</div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 12, color: "#09090b" }}>Launch your marketing engine</h1>
            <p style={{ fontSize: 16, color: "#71717a", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>Social campaigns, email sequences, ad copy, SEO strategy and growth hacks — all in one shot.</p>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe your startup or product..." rows={4}
                style={{ width: "100%", padding: "16px 18px", border: "1.5px solid #e4e4e7", borderRadius: 14, fontSize: 14.5, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", color: "#09090b", background: "#fff", transition: "border-color 0.2s", lineHeight: 1.65, boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
              <button onClick={generate} disabled={!idea.trim()} style={{ marginTop: 12, width: "100%", padding: "13px 0", background: idea.trim() ? "linear-gradient(135deg, #dc2626, #f87171)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                Launch Marketing Engine →
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff1f2", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "mk-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#09090b", marginBottom: 8 }}>Building your marketing engine...</div>
            <div style={{ fontSize: 13.5, color: "#a1a1aa" }}>Writing social posts, email sequences, ad copy, SEO strategy...</div>
          </div>
        )}

        {error && <div style={{ textAlign: "center", padding: 24, color: "#dc2626", fontSize: 14, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 24 }}>{error}</div>}

        {data && !loading && (
          <div style={{ animation: "mk-up 0.4s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", marginBottom: 6 }}>Marketing Strategy</h2>
                  <p style={{ fontSize: 15, color: "#52525b", maxWidth: 560 }}>{data.marketingStrategy?.positioning}</p>
                </div>
                <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); }} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 9, fontSize: 13, color: "#71717a", cursor: "pointer", whiteSpace: "nowrap" }}>+ New Idea</button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={idea} onChange={e => setIdea(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && idea.trim()) generate(); }}
                  placeholder="Generate for a different idea..."
                  style={{ flex: 1, padding: "10px 14px", border: "1px solid #e4e4e7", borderRadius: 10, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#09090b", background: "#fff", transition: "border-color 0.2s" }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
                <button onClick={generate} disabled={!idea.trim()} style={{ padding: "10px 20px", background: idea.trim() ? "linear-gradient(135deg, #dc2626, #f87171)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                  Regenerate →
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #f4f4f5", marginBottom: 28, overflowX: "auto" }}>
              {TABS.map(t => (
                <button key={t.key} className="mk-tab" onClick={() => setActiveTab(t.key)}
                  style={{ padding: "9px 16px", border: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, color: activeTab === t.key ? "#dc2626" : "#71717a", borderBottom: `2px solid ${activeTab === t.key ? "#dc2626" : "transparent"}`, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", marginBottom: -1 }}>{t.label}</button>
              ))}
            </div>

            {activeTab === "strategy" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card><Label>Positioning</Label><p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75 }}>{data.marketingStrategy?.positioning}</p></Card>
                <Card><Label>Brand Voice</Label><p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75, marginBottom: 12 }}>{data.marketingStrategy?.brandVoice}</p><Label>Target Emotion</Label><p style={{ fontSize: 13.5, color: "#71717a" }}>{data.marketingStrategy?.targetEmotion}</p></Card>
                <Card style={{ gridColumn: "1/-1" }}><Label>Messaging Pillar</Label><p style={{ fontSize: 14.5, color: "#27272a", lineHeight: 1.8 }}>{data.marketingStrategy?.messagingPillar}</p></Card>
                <Card>
                  <Label>Budget Overview</Label>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#dc2626", marginBottom: 16 }}>{data.budget?.total}</div>
                  {data.budget?.breakdown?.map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fafafa", borderRadius: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#3f3f46" }}>{b.category}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#a1a1aa" }}>{b.percentage}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{b.amount}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {activeTab === "launch" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[{ label: "Pre-Launch (Weeks Before)", value: data.launchStrategy?.preLaunchWeeks, color: "#7c3aed" }, { label: "Launch Day", value: data.launchStrategy?.launchDay, color: "#dc2626" }, { label: "Post-Launch (Month 1)", value: data.launchStrategy?.postLaunchMonth, color: "#059669" }].map(p => (
                  <Card key={p.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>{p.label}</div>
                    <p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.8, margin: 0 }}>{p.value}</p>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "social" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card>
                  <Label>Twitter / X — Thread Idea</Label>
                  <p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75, marginBottom: 16 }}>{data.socialMediaCampaign?.twitter?.threadIdea}</p>
                  <Label>Ready-to-Post Tweets</Label>
                  {data.socialMediaCampaign?.twitter?.posts?.map((p, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "#fafafa", borderRadius: 9, border: "1px solid #f4f4f5", marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <p style={{ fontSize: 13.5, color: "#27272a", lineHeight: 1.7, margin: 0, flex: 1 }}>{p}</p>
                      <CopyButton text={p} />
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>LinkedIn Posts</Label>
                  {data.socialMediaCampaign?.linkedin?.posts?.map((p, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "#fafafa", borderRadius: 9, border: "1px solid #f4f4f5", marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <p style={{ fontSize: 13.5, color: "#27272a", lineHeight: 1.7, margin: 0, flex: 1 }}>{p}</p>
                      <CopyButton text={p} />
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>Product Hunt Launch</Label>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 4 }}>Tagline</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#09090b", margin: 0 }}>{data.socialMediaCampaign?.productHunt?.tagline}</p>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 4 }}>Description</div>
                    <p style={{ fontSize: 13.5, color: "#3f3f46", lineHeight: 1.7, margin: 0 }}>{data.socialMediaCampaign?.productHunt?.description}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 4 }}>First Comment</div>
                    <p style={{ fontSize: 13.5, color: "#3f3f46", lineHeight: 1.7, margin: 0 }}>{data.socialMediaCampaign?.productHunt?.firstComment}</p>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.emailCampaign?.map((email, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <Tag color="#dc2626">{email.type}</Tag>
                      <CopyButton text={email.body} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#09090b", marginBottom: 4 }}>Subject: {email.subject}</div>
                    <div style={{ fontSize: 12.5, color: "#a1a1aa", marginBottom: 12 }}>Preview: {email.previewText}</div>
                    <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.85, color: "#27272a", whiteSpace: "pre-wrap", background: "#fafafa", padding: "16px 18px", borderRadius: 10, border: "1px solid #f4f4f5", margin: 0 }}>{email.body}</pre>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "ads" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {data.adCopy?.map((ad, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <Tag color="#7c3aed">{ad.platform}</Tag>
                      <CopyButton text={`${ad.headline}\n${ad.body}\n${ad.cta}`} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#09090b", marginBottom: 8 }}>{ad.headline}</div>
                    <p style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.7, marginBottom: 12 }}>{ad.body}</p>
                    <div style={{ display: "inline-block", padding: "6px 16px", background: "#dc262612", color: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{ad.cta}</div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "seo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card>
                    <Label>Primary Keywords</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{data.seoStrategy?.primaryKeywords?.map((k, i) => <Tag key={i}>{k}</Tag>)}</div>
                  </Card>
                  <Card>
                    <Label>Long-tail Keywords</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{data.seoStrategy?.longTailKeywords?.map((k, i) => <Tag key={i} color="#7c3aed">{k}</Tag>)}</div>
                  </Card>
                </div>
                <Card>
                  <Label>Content Clusters</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>{data.seoStrategy?.contentClusters?.map((c, i) => <Tag key={i} color="#0891b2">{c}</Tag>)}</div>
                  <Label>Estimated Traffic — Month 6</Label>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{data.seoStrategy?.estimatedTrafficMonth6}</div>
                </Card>
              </div>
            )}

            {activeTab === "growth" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card>
                  <Label>Growth Hacks</Label>
                  {data.growthHacks?.map((g, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3f3f46", marginBottom: 10, lineHeight: 1.65 }}>
                      <span style={{ color: "#dc2626", flexShrink: 0 }}>⚡</span>{g}
                    </div>
                  ))}
                </Card>
                <Card>
                  <Label>KPI Targets</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const }}>Metric</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, textAlign: "center" as const }}>M1</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, textAlign: "center" as const }}>M3</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, textAlign: "center" as const }}>M6</div>
                  </div>
                  {data.kpis?.map((k, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 8, padding: "9px 10px", background: i % 2 === 0 ? "#fafafa" : "#fff", borderRadius: 8, marginBottom: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#3f3f46", fontWeight: 500 }}>{k.metric}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#dc2626", textAlign: "center" as const }}>{k.month1Target}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#059669", textAlign: "center" as const }}>{k.month3Target}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7c3aed", textAlign: "center" as const }}>{k.month6Target}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}