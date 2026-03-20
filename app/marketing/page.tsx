"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import DownloadPDFButton from "@/components/DownloadPDFButton";

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type MarketingData = {
  marketingStrategy: { positioning: string; messagingPillar: string; brandVoice: string; targetEmotion: string };
  launchStrategy: { preLaunchWeeks: string; launchDay: string; postLaunchMonth: string };
  channels: { channel: string; priority: string; strategy: string; budget: string; kpi: string }[];
  socialMediaCampaign: { twitter: { threadIdea: string; posts: string[] }; linkedin: { posts: string[] }; productHunt: { tagline: string; description: string; firstComment: string } };
  emailCampaign: { type: string; subject: string; previewText: string; body: string }[];
  adCopy: { platform: string; format: string; headline: string; body: string; cta: string; targetAudience: string }[];
  seoStrategy: { primaryKeywords: string[]; longTailKeywords: string[]; contentClusters: string[]; backlinkStrategy: string; estimatedTrafficMonth6: string };
  contentCalendar: { week: number; theme: string; posts: { day: string; platform: string; topic: string; format: string }[] }[];
  growthHacks: string[];
  kpis: { metric: string; month1Target: string; month3Target: string; month6Target: string }[];
};

function useWindowWidth() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function useInjectStyles() {
  useEffect(() => {
    const id = "mkt-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
      @keyframes mk-spin { to { transform: rotate(360deg); } }
      @keyframes mk-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes mk-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.2)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
      @keyframes arteno-pdf-spin { to { transform: rotate(360deg); } }
      .mk-tab:hover { background: #fff1f2 !important; color: #e11d48 !important; }
      .mk-card:hover { border-color: #fecdd3 !important; }
      .mk-copy:hover { background: #fff1f2 !important; color: #e11d48 !important; }
      ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

function MarketingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number; let t = 0;
    type Ring = { x: number; y: number; r: number; maxR: number; alpha: number; speed: number; color: string };
    const COLORS = ["rgba(225,29,72,", "rgba(244,63,94,", "rgba(251,113,133,", "rgba(253,164,175,"];
    let rings: Ring[] = [];
    const spawnRing = (W: number, H: number) => {
      rings.push({ x: 0.2 * W + Math.random() * 0.6 * W, y: 0.2 * H + Math.random() * 0.6 * H, r: 0, maxR: 80 + Math.random() * 120, alpha: 0.18 + Math.random() * 0.18, speed: 0.5 + Math.random() * 0.8, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    };
    type P = { x: number; y: number; vx: number; vy: number; r: number; alpha: number };
    let particles: P[] = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: 36 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: 1.2 + Math.random() * 2, alpha: 0.06 + Math.random() * 0.14 }));
    };
    resize(); window.addEventListener("resize", resize);
    let frameCount = 0;
    const draw = () => {
      t += 0.008; frameCount++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      if (frameCount % 90 === 0) spawnRing(W, H);
      if (rings.length === 0) { spawnRing(W, H); spawnRing(W, H); spawnRing(W, H); }
      rings = rings.filter(ring => ring.alpha > 0.005);
      rings.forEach(ring => {
        ring.r += ring.speed; ring.alpha *= 0.988;
        for (let s = 0; s < 3; s++) {
          const sr = ring.r - s * 14; if (sr < 0) continue;
          ctx.beginPath(); ctx.arc(ring.x, ring.y, sr, 0, Math.PI * 2);
          ctx.strokeStyle = ring.color + (ring.alpha * (1 - s * 0.28)) + ")"; ctx.lineWidth = 1.2 - s * 0.3; ctx.stroke();
        }
        if (ring.r < 20) { ctx.beginPath(); ctx.arc(ring.x, ring.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = ring.color + (ring.alpha * 2.5) + ")"; ctx.fill(); }
      });
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + p.x * 0.01);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(225,29,72,${p.alpha * pulse})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, background: "#fafafa" }} />;
}

function MarketingMobileBg() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(180deg,#ffe4e6 0%,#fff1f2 55%,transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(225,29,72,0.15) 1px,transparent 1px)", backgroundSize: "22px 22px", maskImage: "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 45%,transparent 70%)", WebkitMaskImage: "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 45%,transparent 70%)" }} />
      <div style={{ position: "absolute", top: "-8%", left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(225,29,72,0.11) 0%,transparent 70%)", filter: "blur(40px)" }} />
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return <button className="mk-copy" onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1500); }} style={{ padding: "4px 10px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 6, fontSize: 11.5, color: "#e11d48", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", flexShrink: 0 }}>{c ? "✓ Copied" : "Copy"}</button>;
}
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="mk-card" style={{ background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, padding: "20px 22px", transition: "all 0.2s", ...style }}>{children}</div>;
}
function L({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#a1a1aa", marginBottom: 7 }}>{children}</div>;
}
function Tag({ children, color = "#e11d48" }: { children: React.ReactNode; color?: string }) {
  return <span style={{ display: "inline-block", fontSize: 11.5, padding: "3px 10px", borderRadius: 20, background: `${color}12`, color, border: `1px solid ${color}30`, fontWeight: 500 }}>{children}</span>;
}

const TABS = [
  { key: "strategy", label: "Strategy" },
  { key: "launch", label: "Launch" },
  { key: "social", label: "Social" },
  { key: "email", label: "Email" },
  { key: "ads", label: "Ads" },
  { key: "seo", label: "SEO" },
  { key: "calendar", label: "Calendar" },
  { key: "kpis", label: "KPIs" },
];

export default function MarketingPage() {
  useInjectStyles();
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 768;

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [data, setData] = useState<MarketingData | null>(null);
  const [tab, setTab] = useState("strategy");
  const [error, setError] = useState("");
  const [founderCtx, setFounderCtx] = useState<{ company_name?: string; icp?: string; stage?: string } | null>(null);
  const [ctxBannerDismissed, setCtxBannerDismissed] = useState(false);

  useEffect(() => {
    const loadCtx = async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("startup_context").select("company_name, icp, stage, tagline").eq("user_id", session.user.id).maybeSingle();
      if (data?.company_name) { setFounderCtx(data); setPrompt(prev => prev || data.company_name || ""); }
    };
    loadCtx();
  }, []);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(""); setData(null);
    try {
      const supabase = getSupabaseClient();
      let token: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) { token = session.access_token; }
      else { const { data: refreshed } = await supabase.auth.refreshSession(); if (refreshed.session?.access_token) token = refreshed.session.access_token; }
      if (!token) throw new Error("You must be logged in to use this feature.");
      const res = await fetch("/api/marketing", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ idea: prompt }) });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data); setTab("strategy");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const renderTabContent = () => {
    if (!data) return null;
    return (
      <>
        {tab === "strategy" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card><L>Positioning</L><p style={{ fontSize: 14, color: "#27272a", lineHeight: 1.75, margin: 0 }}>{data.marketingStrategy?.positioning}</p></Card>
            <Card><L>Core Message</L><p style={{ fontSize: 14, color: "#27272a", lineHeight: 1.75, margin: 0 }}>{data.marketingStrategy?.messagingPillar}</p></Card>
            <Card><L>Brand Voice</L><p style={{ fontSize: 14, color: "#27272a", lineHeight: 1.75, margin: 0 }}>{data.marketingStrategy?.brandVoice}</p></Card>
            <Card><L>Target Emotion</L><p style={{ fontSize: 14, color: "#27272a", lineHeight: 1.75, margin: 0 }}>{data.marketingStrategy?.targetEmotion}</p></Card>
            <Card style={{ gridColumn: isMobile ? "1" : "1/-1" }}>
              <L>Channel Strategy</L>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.channels?.map((c, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "160px 80px 1fr 80px 1fr", gap: isMobile ? 4 : 16, padding: "12px 16px", background: "#fafafa", borderRadius: 10, border: "1px solid #f4f4f5", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#09090b" }}>{c.channel}</div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: c.priority === "High" ? "#fff1f2" : c.priority === "Medium" ? "#fffbeb" : "#f8fafc", color: c.priority === "High" ? "#e11d48" : c.priority === "Medium" ? "#d97706" : "#64748b", border: `1px solid ${c.priority === "High" ? "#fecdd3" : c.priority === "Medium" ? "#fde68a" : "#e2e8f0"}`, fontWeight: 600, textAlign: "center" as const, display: "inline-block" }}>{c.priority}</span>
                    <div style={{ fontSize: 12.5, color: "#52525b" }}>{c.strategy}</div>
                    <div style={{ fontSize: 12.5, color: "#e11d48", fontWeight: 600 }}>{c.budget}</div>
                    <div style={{ fontSize: 12, color: "#a1a1aa" }}>KPI: {c.kpi}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ gridColumn: isMobile ? "1" : "1/-1" }}>
              <L>Growth Hacks</L>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                {data.growthHacks?.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3f3f46", padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f4f4f5" }}>
                    <span style={{ color: "#e11d48", flexShrink: 0 }}>⚡</span>{g}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        {tab === "launch" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[{ label: "Pre-Launch — 2 Weeks Before", value: data.launchStrategy?.preLaunchWeeks, color: "#7c3aed" }, { label: "Launch Day", value: data.launchStrategy?.launchDay, color: "#e11d48" }, { label: "Post-Launch — First 30 Days", value: data.launchStrategy?.postLaunchMonth, color: "#059669" }].map(p => (
              <Card key={p.label}><div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>{p.label}</div><p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.8, margin: 0 }}>{p.value}</p></Card>
            ))}
          </div>
        )}
        {tab === "social" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <L>𝕏 / Twitter Thread Idea</L>
              <p style={{ fontSize: 13.5, color: "#3f3f46", marginBottom: 16, fontStyle: "italic" }}>{data.socialMediaCampaign?.twitter?.threadIdea}</p>
              <L>Ready-to-Post Tweets</L>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.socialMediaCampaign?.twitter?.posts?.map((p, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: "#fafafa", borderRadius: 10, border: "1px solid #f4f4f5", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <p style={{ fontSize: 13.5, color: "#27272a", lineHeight: 1.75, margin: 0, flex: 1 }}>{p}</p><CopyBtn text={p} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <L>LinkedIn Posts</L>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.socialMediaCampaign?.linkedin?.posts?.map((p, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: "#fafafa", borderRadius: 10, border: "1px solid #f4f4f5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                      <pre style={{ fontFamily: "inherit", fontSize: 13.5, color: "#27272a", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap", flex: 1 }}>{p}</pre><CopyBtn text={p} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <L>Product Hunt Launch</L>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[{ label: "Tagline", value: data.socialMediaCampaign?.productHunt?.tagline }, { label: "Description", value: data.socialMediaCampaign?.productHunt?.description }, { label: "First Comment (Founder)", value: data.socialMediaCampaign?.productHunt?.firstComment }].map(f => (
                  <div key={f.label}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><L>{f.label}</L><CopyBtn text={f.value ?? ""} /></div><p style={{ fontSize: 13.5, color: "#3f3f46", lineHeight: 1.75, margin: 0 }}>{f.value}</p></div>
                ))}
              </div>
            </Card>
          </div>
        )}
        {tab === "email" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.emailCampaign?.map((em, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, padding: "3px 10px", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: 20, fontWeight: 600 }}>{em.type}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#09090b" }}>Subject: {em.subject}</span>
                  </div>
                  <CopyBtn text={em.body} />
                </div>
                <div style={{ fontSize: 11.5, color: "#a1a1aa", marginBottom: 12 }}>Preview: {em.previewText}</div>
                <pre style={{ fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.85, color: "#27272a", whiteSpace: "pre-wrap", background: "#fafafa", padding: "16px 18px", borderRadius: 10, border: "1px solid #f4f4f5", margin: 0 }}>{em.body}</pre>
              </Card>
            ))}
          </div>
        )}
        {tab === "ads" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {data.adCopy?.map((ad, i) => (
              <Card key={i}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}><Tag color="#e11d48">{ad.platform}</Tag><Tag color="#7c3aed">{ad.format}</Tag></div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#09090b", marginBottom: 8, lineHeight: 1.4 }}>{ad.headline}</div>
                <p style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.75, marginBottom: 12 }}>{ad.body}</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, padding: "5px 12px", background: "#e11d48", color: "#fff", borderRadius: 7, fontWeight: 600 }}>{ad.cta}</span>
                  <span style={{ fontSize: 11, color: "#a1a1aa" }}>Target: {ad.targetAudience}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === "seo" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card><L>Primary Keywords</L><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{data.seoStrategy?.primaryKeywords?.map((k, i) => <Tag key={i} color="#e11d48">{k}</Tag>)}</div></Card>
            <Card><L>Long-tail Keywords</L><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{data.seoStrategy?.longTailKeywords?.map((k, i) => <Tag key={i} color="#7c3aed">{k}</Tag>)}</div></Card>
            <Card><L>Content Clusters</L><div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{data.seoStrategy?.contentClusters?.map((c, i) => <div key={i} style={{ display: "flex", gap: 7, fontSize: 13.5, color: "#3f3f46" }}><span style={{ color: "#e11d48" }}>›</span>{c}</div>)}</div></Card>
            <Card>
              <L>Estimated Traffic — Month 6</L>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#e11d48", marginBottom: 10 }}>{data.seoStrategy?.estimatedTrafficMonth6}</div>
              <L>Backlink Strategy</L>
              <p style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.7, margin: 0 }}>{data.seoStrategy?.backlinkStrategy}</p>
            </Card>
          </div>
        )}
        {tab === "calendar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.contentCalendar?.map((week, i) => (
              <Card key={i}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#fff1f2,#fecdd3)", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#e11d48" }}>W{week.week}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#09090b" }}>{week.theme}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
                  {week.posts?.map((p, j) => (
                    <div key={j} style={{ padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f4f4f5" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{p.day} · {p.platform}</div>
                      <div style={{ fontSize: 12.5, color: "#3f3f46", lineHeight: 1.6, marginBottom: 5 }}>{p.topic}</div>
                      <span style={{ fontSize: 10.5, padding: "1px 7px", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: 10 }}>{p.format}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === "kpis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1.5fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr", gap: 0, background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, overflow: "hidden" }}>
              {["Metric", "Mo. 1", "Mo. 3", "Mo. 6"].map(h => (
                <div key={h} style={{ padding: "10px 12px", background: "#fafafa", borderBottom: "1px solid #f4f4f5", fontSize: 10.5, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{h}</div>
              ))}
              {data.kpis?.map((k, i) => (
                <>
                  <div key={`m-${i}`} style={{ padding: "12px", borderBottom: "1px solid #f9f9f9", fontSize: 13, color: "#27272a", fontWeight: 500 }}>{k.metric}</div>
                  {[k.month1Target, k.month3Target, k.month6Target].map((v, j) => (
                    <div key={`v-${i}-${j}`} style={{ padding: "12px", borderBottom: "1px solid #f9f9f9", fontSize: 13, color: "#e11d48", fontWeight: 700 }}>{v}</div>
                  ))}
                </>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // ── MOBILE ──
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Inter', sans-serif", color: "#0a0a0a" }}>
        <header style={{ height: 52, borderBottom: "1px solid #f4f4f5", background: "rgba(255,255,255,0.97)", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: "#a1a1aa", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* PDF download — mobile */}
            {data && !loading && (
              <DownloadPDFButton mode="execute" agentKey="marketing" agentData={data} idea={prompt} size="sm" />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "5px 10px 5px 7px" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#e11d48,#f87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>📣</div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#e11d48", whiteSpace: "nowrap" }}>Marketing Agent</span>
            </div>
          </div>
        </header>

        <div style={{ padding: "20px 16px", paddingBottom: 100, position: "relative" }}>
          {!data && !loading && <MarketingMobileBg />}
          {!data && !loading && (
            <div style={{ animation: "mk-up 0.4s ease", position: "relative", zIndex: 1 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#fff1f2,#ffe4e6)", border: "1px solid #fecdd3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>📣</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 10, color: "#09090b", lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>Launch your <span style={{ color: "#e11d48" }}>marketing campaign</span></h1>
                <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.7 }}>Social content, email campaigns, ad copy, SEO strategy & content calendars — all in one shot.</p>
              </div>
              {founderCtx && !ctxBannerDismissed && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 14, flexShrink: 0 }}>⚡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#e11d48", marginBottom: 2 }}>Founder context: <strong style={{ color: "#09090b" }}>{founderCtx.company_name}</strong></div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa" }}>Generate to use Founder data</div>
                  </div>
                  <button onClick={() => setCtxBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              )}
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. 'Create a launch campaign for an AI startup tool targeting indie developers'" rows={5}
                style={{ width: "100%", padding: "14px 16px", border: "1.5px solid #e4e4e7", borderRadius: 14, fontSize: 14.5, fontFamily: "'Inter', sans-serif", outline: "none", resize: "none", color: "#09090b", background: "#fff", lineHeight: 1.65, boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
              <button onClick={generate} disabled={!prompt.trim()} style={{ marginTop: 12, width: "100%", padding: "14px 0", background: prompt.trim() ? "linear-gradient(135deg,#e11d48,#f87171)" : "#f4f4f5", color: prompt.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: prompt.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif" }}>
                Generate Marketing Campaign →
              </button>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff1f2", border: "2px solid #fecdd3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "mk-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#09090b", marginBottom: 8 }}>Building your campaign...</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Writing posts, emails, ad copy, content calendar...</div>
            </div>
          )}
          {error && <div style={{ padding: 16, color: "#dc2626", fontSize: 13.5, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 16 }}>{error}</div>}
          {data && !loading && (
            <div style={{ animation: "mk-up 0.4s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.8px", color: "#09090b", fontFamily: "'Syne', sans-serif" }}>Marketing Campaign</h2>
                  <button onClick={() => { setData(null); setPrompt(""); }} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 12, color: "#71717a", cursor: "pointer", whiteSpace: "nowrap" }}>+ New</button>
                </div>
                <p style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.5 }}>{data.marketingStrategy?.positioning}</p>
              </div>
              <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid #f4f4f5", marginBottom: 18, scrollbarWidth: "none" }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "9px 12px", border: "none", background: "transparent", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: tab === t.key ? "#e11d48" : "#71717a", borderBottom: `2px solid ${tab === t.key ? "#e11d48" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", marginBottom: -1, flexShrink: 0 }}>{t.label}</button>
                ))}
              </div>
              {renderTabContent()}
            </div>
          )}
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "rgba(255,255,255,0.97)", borderTop: "1px solid #f4f4f5", zIndex: 40 }}>
          <Link href="/build-startup" style={{ display: "block", padding: "13px 0", background: "linear-gradient(135deg,#e11d48,#f87171)", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>✦ Build My Startup</Link>
        </div>
        <style>{`@keyframes mk-spin { to { transform: rotate(360deg); } } @keyframes mk-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } @keyframes arteno-pdf-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── DESKTOP ──
  const showCanvas = !loadingHistory && !data && !loading;
  return (
    <div style={{ minHeight: "100vh", background: showCanvas ? "transparent" : "#fafafa", fontFamily: "'Inter', sans-serif", color: "#0a0a0a" }}>
      {showCanvas && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <MarketingCanvas />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 30%,rgba(225,29,72,0.05) 0%,transparent 70%)" }} />
        </div>
      )}
      <header style={{ height: 54, borderBottom: "1px solid #f4f4f5", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ fontSize: 12.5, color: "#a1a1aa", textDecoration: "none" }}>← Dashboard</Link>
          <div style={{ width: 1, height: 14, background: "#f4f4f5" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#e11d48,#f87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 2px 8px rgba(225,29,72,0.35)" }}>📣</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#09090b", lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>Marketing Agent</div>
              <div style={{ fontSize: 10.5, color: "#a1a1aa" }}>Growth marketer & brand strategist</div>
            </div>
          </div>
        </div>
        {/* Desktop header right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* PDF download — desktop */}
          {data && !loading && (
            <DownloadPDFButton mode="execute" agentKey="marketing" agentData={data} idea={prompt} size="sm" />
          )}
          <Link href="/build-startup" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg,#e11d48,#f87171)", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 10px rgba(225,29,72,0.3)" }}>✦ Build My Startup</Link>
        </div>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px", position: "relative", zIndex: 1 }}>
        {!data && !loading && (
          <div style={{ textAlign: "center", marginBottom: 48, animation: "mk-up 0.4s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#fff1f2,#fecdd3)", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24, boxShadow: "0 8px 28px rgba(225,29,72,0.12)" }}>📣</div>
            <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 12, color: "#09090b", fontFamily: "'Syne', sans-serif" }}>Launch your <span style={{ color: "#e11d48" }}>marketing campaign</span></h1>
            <p style={{ fontSize: 15.5, color: "#71717a", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>Get ready-to-post social content, email campaigns, ad copy, SEO strategy, and full content calendars.</p>
            {founderCtx && !ctxBannerDismissed && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12, marginBottom: 20, maxWidth: 600, margin: "0 auto 20px" }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>⚡</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e11d48", marginBottom: 2 }}>Founder context loaded</div>
                  <div style={{ fontSize: 12.5, color: "#52525b", lineHeight: 1.6 }}><strong style={{ color: "#09090b" }}>{founderCtx.company_name}</strong>{founderCtx.stage && ` · ${founderCtx.stage}`}{founderCtx.icp && ` · ${founderCtx.icp.slice(0, 55)}…`}</div>
                </div>
                <button onClick={() => setCtxBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
              </div>
            )}
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. 'Create a launch marketing campaign for an AI startup tool targeting indie developers'" rows={4}
                style={{ width: "100%", padding: "16px 18px", border: "1.5px solid #e4e4e7", borderRadius: 14, fontSize: 14.5, fontFamily: "'Inter', sans-serif", outline: "none", resize: "none", color: "#09090b", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", transition: "border-color 0.2s", lineHeight: 1.65, boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
              <button onClick={generate} disabled={!prompt.trim()} style={{ marginTop: 12, width: "100%", padding: "13px 0", background: prompt.trim() ? "linear-gradient(135deg,#e11d48,#f87171)" : "#f4f4f5", color: prompt.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: prompt.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", boxShadow: prompt.trim() ? "0 4px 16px rgba(225,29,72,0.35)" : "none", transition: "all 0.2s" }}>Generate Marketing Campaign →</button>
            </div>
            <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["Launch campaign for an AI startup tool", "Social media strategy for a SaaS product", "Product Hunt launch plan for a developer app"].map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)} style={{ padding: "6px 14px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 20, fontSize: 12.5, color: "#71717a", cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"; (e.currentTarget as HTMLElement).style.color = "#e11d48"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"; (e.currentTarget as HTMLElement).style.color = "#71717a"; }}>{ex}</button>
              ))}
            </div>
          </div>
        )}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff1f2", border: "2px solid #fecdd3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "mk-pulse 2s ease-in-out infinite" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "mk-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#09090b", marginBottom: 8 }}>Building your campaign...</div>
            <div style={{ fontSize: 13.5, color: "#a1a1aa" }}>Writing social posts, email sequences, ad copy, content calendar...</div>
          </div>
        )}
        {error && <div style={{ textAlign: "center", padding: 24, color: "#dc2626", fontSize: 14, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca" }}>{error}</div>}
        {data && !loading && (
          <div style={{ animation: "mk-up 0.4s ease" }}>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>Marketing Campaign</h2>
                <p style={{ fontSize: 13.5, color: "#71717a" }}>{data.marketingStrategy?.positioning}</p>
              </div>
              <button onClick={() => { setData(null); setPrompt(""); }} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 9, fontSize: 13, color: "#71717a", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>New Campaign</button>
            </div>
            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #f4f4f5", marginBottom: 28, overflowX: "auto" }}>
              {TABS.map(t => <button key={t.key} className="mk-tab" onClick={() => setTab(t.key)} style={{ padding: "9px 14px", border: "none", background: "transparent", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: tab === t.key ? "#e11d48" : "#71717a", borderBottom: `2px solid ${tab === t.key ? "#e11d48" : "transparent"}`, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", marginBottom: -1 }}>{t.label}</button>)}
            </div>
            {renderTabContent()}
          </div>
        )}
      </div>
    </div>
  );
}