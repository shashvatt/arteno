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

type SalesData = {
  salesStrategy: { approach: string; primaryMotion: string; averageDealSize: string; salesCycleLength: string; quotaPerRep: string };
  idealCustomerProfile: { companySize: string; industry: string; decisionMaker: string; buyingTriggers: string[]; disqualifiers: string[] };
  crmPipeline: { stage: string; entryTrigger: string; exitCriteria: string; tasks: string[]; averageDaysInStage: number }[];
  prospectingStrategy: { channels: string[]; dailyActivities: string[]; weeklyTargets: { outboundEmails: number; coldCalls: number; linkedinMessages: number; meetingsBooked: number } };
  emailTemplates: { type: string; subject: string; body: string; whenToUse: string }[];
  salesScript: { coldCallOpener: string; discoveryQuestions: string[]; valueProposition: string; commonObjections: { objection: string; response: string }[]; closingTechnique: string };
  proposalTemplate: { structure: string[]; keyValuePoints: string[]; pricingPresentation: string };
  followUpSequence: { day: number; channel: string; message: string }[];
  leadQualificationFramework: { scoringCriteria: string[]; mqlThreshold: string; sqlThreshold: string; disqualificationRules: string[] };
  revenueProjections: { month3: string; month6: string; month12: string; assumptions: string[] };
  toolStack: string[];
};

type HistoryItem = { id: string; input_prompt: string; output_data: SalesData; created_at: string };

function useWindowWidth() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function useStyles() {
  useEffect(() => {
    const id = "sales-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes sl-spin { to { transform: rotate(360deg); } }
      @keyframes sl-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes arteno-pdf-spin { to { transform: rotate(360deg); } }
      .sl-tab:hover { background: #f0fdf4 !important; color: #16a34a !important; }
      .sl-card:hover { border-color: #bbf7d0 !important; }
      .sl-history:hover { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
      ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

// ─────────────────────────────────────────────
// SALES CANVAS — rising bar chart particles (green)
// ─────────────────────────────────────────────
function SalesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number; let t = 0;

    type Bar = { x: number; targetH: number; currentH: number; w: number; speed: number; alpha: number; color: string };
    const COLORS = ["rgba(5,150,105,", "rgba(16,185,129,", "rgba(52,211,153,", "rgba(110,231,183,"];
    let bars: Bar[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
      const count = Math.floor(W / 28);
      bars = Array.from({ length: count }, (_, i) => ({
        x: (i / count) * W + Math.random() * 12,
        targetH: 40 + Math.random() * (H * 0.55),
        currentH: 0,
        w: 6 + Math.random() * 8,
        speed: 0.4 + Math.random() * 0.6,
        alpha: 0.07 + Math.random() * 0.13,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    resize(); window.addEventListener("resize", resize);

    type Dot = { x: number; y: number; vx: number; vy: number; r: number; alpha: number };
    const dots: Dot[] = Array.from({ length: 28 }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, r: 0, alpha: 0,
    }));
    const initDots = () => dots.forEach(d => {
      d.x = Math.random() * (canvas.width || 800);
      d.y = Math.random() * (canvas.height || 600);
      d.vx = (Math.random() - 0.5) * 0.25;
      d.vy = -0.15 - Math.random() * 0.25;
      d.r = 1.5 + Math.random() * 2;
      d.alpha = 0.08 + Math.random() * 0.18;
    });
    initDots();

    const draw = () => {
      t += 0.012;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      bars.forEach(b => {
        const pulse = 0.85 + 0.15 * Math.sin(t * 1.2 + b.x * 0.03);
        b.currentH = b.currentH + (b.targetH * pulse - b.currentH) * b.speed * 0.04;
        ctx.beginPath();
        ctx.roundRect(b.x, H - b.currentH, b.w, b.currentH, [3, 3, 0, 0]);
        ctx.fillStyle = b.color + b.alpha + ")";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, H - b.currentH, b.w * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = b.color + (b.alpha * 1.8) + ")";
        ctx.fill();
      });

      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        const fade = Math.max(0, 1 - (H - d.y) / H);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5,150,105,${d.alpha * fade})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, background: "#fafafa" }} />;
}

function SalesMobileBg() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(180deg,#dcfce7 0%,#f0fdf4 55%,transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(5,150,105,0.15) 1px,transparent 1px)", backgroundSize: "22px 22px", maskImage: "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 45%,transparent 70%)", WebkitMaskImage: "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 45%,transparent 70%)" }} />
      <div style={{ position: "absolute", top: "-8%", left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(5,150,105,0.12) 0%,transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", top: "30%", right: "-10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.09) 0%,transparent 70%)", filter: "blur(30px)" }} />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#a1a1aa", marginBottom: 6 }}>{children}</div>;
}
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="sl-card" style={{ background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, padding: "20px 22px", transition: "all 0.2s", ...style }}>{children}</div>;
}
function Tag({ children, color = "#16a34a" }: { children: React.ReactNode; color?: string }) {
  return <span style={{ display: "inline-block", fontSize: 11.5, padding: "3px 10px", borderRadius: 20, background: `${color}12`, color, border: `1px solid ${color}22`, fontWeight: 500 }}>{children}</span>;
}
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ padding: "4px 10px", background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 11.5, color: "#71717a", cursor: "pointer", fontFamily: "inherit" }}>{copied ? "✓ Copied" : "Copy"}</button>;
}

const TABS = [
  { key: "strategy", label: "Strategy" },
  { key: "icp", label: "ICP" },
  { key: "pipeline", label: "Pipeline" },
  { key: "prospecting", label: "Prospect" },
  { key: "emails", label: "Emails" },
  { key: "script", label: "Script" },
  { key: "followup", label: "Follow-up" },
  { key: "revenue", label: "Revenue" },
];

export default function SalesPage() {
  useStyles();
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 768;

  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [data, setData] = useState<SalesData | null>(null);
  const [activeTab, setActiveTab] = useState("strategy");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [founderCtx, setFounderCtx] = useState<{ company_name?: string; icp?: string; stage?: string; tagline?: string } | null>(null);
  const [ctxBannerDismissed, setCtxBannerDismissed] = useState(false);

  const getToken = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? null;
  };

  useEffect(() => {
    const loadCtx = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("startup_context")
        .select("company_name, icp, stage, tagline")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data?.company_name) {
        setFounderCtx(data);
        setIdea(prev => prev || data.company_name || "");
      }
    };
    loadCtx();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("/api/sales", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setHistory(json.data);
          const latest = json.data[0];
          setData(latest.output_data);
          setActiveHistoryId(latest.id);
          setActiveTab("strategy");
        }
      } catch (e) { console.error("Failed to load history:", e); }
      finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, []);

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setError(""); setData(null); setActiveHistoryId(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("You must be logged in.");
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idea }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data);
      setActiveTab("strategy");
      setActiveHistoryId(json.outputId ?? null);
      const histRes = await fetch("/api/sales", { headers: { Authorization: `Bearer ${token}` } });
      const histJson = await histRes.json();
      if (histJson.data) setHistory(histJson.data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setData(item.output_data); setActiveHistoryId(item.id);
    setActiveTab("strategy"); setError(""); setShowHistory(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const renderTabContent = () => {
    if (!data) return null;
    return (
      <>
        {activeTab === "strategy" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card>
              <Label>Sales Approach</Label>
              <p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75, marginBottom: 12 }}>{data.salesStrategy?.approach}</p>
              <Label>Primary Motion</Label>
              <Tag>{data.salesStrategy?.primaryMotion}</Tag>
            </Card>
            <Card>
              <Label>Key Metrics</Label>
              {[
                { label: "Avg Deal Size", value: data.salesStrategy?.averageDealSize },
                { label: "Sales Cycle", value: data.salesStrategy?.salesCycleLength },
                { label: "Quota Per Rep", value: data.salesStrategy?.quotaPerRep },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fafafa", borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#71717a" }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{m.value}</span>
                </div>
              ))}
            </Card>
            <Card style={{ gridColumn: isMobile ? "1" : "1/-1" }}>
              <Label>Tool Stack</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {data.toolStack?.map((t, i) => <Tag key={i} color="#0891b2">{t}</Tag>)}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "icp" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card>
              <Label>Company Profile</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Company Size", value: data.idealCustomerProfile?.companySize },
                  { label: "Industry", value: data.idealCustomerProfile?.industry },
                  { label: "Decision Maker", value: data.idealCustomerProfile?.decisionMaker },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "8px 12px", background: "#fafafa", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: 13.5, color: "#27272a", fontWeight: 500 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Label>Buying Triggers</Label>
              {data.idealCustomerProfile?.buyingTriggers?.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#3f3f46", marginBottom: 8, lineHeight: 1.6 }}>
                  <span style={{ color: "#16a34a", flexShrink: 0 }}>✓</span>{t}
                </div>
              ))}
            </Card>
            <Card style={{ gridColumn: isMobile ? "1" : "1/-1" }}>
              <Label>Disqualifiers</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {data.idealCustomerProfile?.disqualifiers?.map((d, i) => <Tag key={i} color="#dc2626">{d}</Tag>)}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.crmPipeline?.map((stage, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#09090b" }}>{stage.stage}</span>
                  </div>
                  <Tag color="#16a34a">{stage.averageDaysInStage} days</Tag>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 4 }}>Entry Trigger</div>
                    <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6, margin: 0 }}>{stage.entryTrigger}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 4 }}>Exit Criteria</div>
                    <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6, margin: 0 }}>{stage.exitCriteria}</p>
                  </div>
                </div>
                <Label>Tasks</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {stage.tasks?.map((t, j) => <Tag key={j} color="#7c3aed">{t}</Tag>)}
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "prospecting" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card>
              <Label>Channels</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                {data.prospectingStrategy?.channels?.map((c, i) => <Tag key={i}>{c}</Tag>)}
              </div>
              <Label>Daily Activities</Label>
              {data.prospectingStrategy?.dailyActivities?.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#3f3f46", marginBottom: 8 }}>
                  <span style={{ color: "#16a34a" }}>→</span>{a}
                </div>
              ))}
            </Card>
            <Card>
              <Label>Weekly Targets</Label>
              {[
                { label: "Outbound Emails", value: data.prospectingStrategy?.weeklyTargets?.outboundEmails },
                { label: "Cold Calls", value: data.prospectingStrategy?.weeklyTargets?.coldCalls },
                { label: "LinkedIn Messages", value: data.prospectingStrategy?.weeklyTargets?.linkedinMessages },
                { label: "Meetings Booked", value: data.prospectingStrategy?.weeklyTargets?.meetingsBooked },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#fafafa", borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#52525b" }}>{m.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{m.value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {activeTab === "emails" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.emailTemplates?.map((email, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <Tag color="#16a34a">{email.type}</Tag>
                  <CopyButton text={email.body} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#09090b", marginBottom: 4 }}>Subject: {email.subject}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 12 }}>When to use: {email.whenToUse}</div>
                <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.85, color: "#27272a", whiteSpace: "pre-wrap", background: "#fafafa", padding: "16px 18px", borderRadius: 10, border: "1px solid #f4f4f5", margin: 0 }}>{email.body}</pre>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "script" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <Label>Cold Call Opener</Label>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>"{data.salesScript?.coldCallOpener}"</p>
              </div>
              <Label>Value Proposition</Label>
              <p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75, marginBottom: 16 }}>{data.salesScript?.valueProposition}</p>
              <Label>Closing Technique</Label>
              <p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.75 }}>{data.salesScript?.closingTechnique}</p>
            </Card>
            <Card>
              <Label>Discovery Questions</Label>
              {data.salesScript?.discoveryQuestions?.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "#3f3f46", marginBottom: 10, lineHeight: 1.65 }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>Q{i + 1}.</span>{q}
                </div>
              ))}
            </Card>
            <Card>
              <Label>Objection Handling</Label>
              {data.salesScript?.commonObjections?.map((o, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#fafafa", borderRadius: 10, marginBottom: 10, border: "1px solid #f4f4f5" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>⚠ "{o.objection}"</div>
                  <div style={{ fontSize: 13, color: "#3f3f46", lineHeight: 1.65 }}>✓ {o.response}</div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {activeTab === "followup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.followUpSequence?.map((f, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#059669,#34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>D{f.day}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Tag color="#0891b2">{f.channel}</Tag>
                    </div>
                    <p style={{ fontSize: 13.5, color: "#3f3f46", lineHeight: 1.7, margin: 0 }}>{f.message}</p>
                  </div>
                  <CopyButton text={f.message} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "revenue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
              {[
                { label: "Month 3", value: data.revenueProjections?.month3, color: "#7c3aed" },
                { label: "Month 6", value: data.revenueProjections?.month6, color: "#16a34a" },
                { label: "Month 12", value: data.revenueProjections?.month12, color: "#0891b2" },
              ].map((m, i) => (
                <Card key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" as const, marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
                </Card>
              ))}
            </div>
            <Card>
              <Label>Assumptions</Label>
              {data.revenueProjections?.assumptions?.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#3f3f46", marginBottom: 8, lineHeight: 1.6 }}>
                  <span style={{ color: "#16a34a", flexShrink: 0 }}>→</span>{a}
                </div>
              ))}
            </Card>
            <Card>
              <Label>Lead Qualification</Label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" as const, marginBottom: 4 }}>MQL Threshold</div>
                  <div style={{ fontSize: 13, color: "#166534" }}>{data.leadQualificationFramework?.mqlThreshold}</div>
                </div>
                <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" as const, marginBottom: 4 }}>SQL Threshold</div>
                  <div style={{ fontSize: 13, color: "#1e40af" }}>{data.leadQualificationFramework?.sqlThreshold}</div>
                </div>
              </div>
              <Label>Scoring Criteria</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {data.leadQualificationFramework?.scoringCriteria?.map((c, i) => <Tag key={i} color="#7c3aed">{c}</Tag>)}
              </div>
            </Card>
          </div>
        )}
      </>
    );
  };

  // ─────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'DM Sans', sans-serif", color: "#0a0a0a" }}>
        <header style={{ height: 52, borderBottom: "1px solid #f4f4f5", background: "rgba(255,255,255,0.97)", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: "#a1a1aa", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* PDF download — mobile */}
            {data && !loading && (
              <DownloadPDFButton mode="execute" agentKey="sales" agentData={data} idea={idea} size="sm" />
            )}
            {history.length > 0 && (
              <button onClick={() => setShowHistory(o => !o)} style={{ width: 30, height: 30, borderRadius: 8, background: showHistory ? "#f0fdf4" : "transparent", border: `1px solid ${showHistory ? "#bbf7d0" : "#e4e4e7"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={showHistory ? "#16a34a" : "#71717a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "5px 10px 5px 7px" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#059669,#34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>💰</div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#16a34a", whiteSpace: "nowrap" }}>Sales Agent</span>
            </div>
          </div>
        </header>

        {showHistory && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.3)" }} onClick={() => setShowHistory(false)} />
            <div style={{ position: "fixed", top: 52, left: 0, right: 0, background: "#fff", zIndex: 99, borderBottom: "1px solid #f4f4f5", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", maxHeight: "65vh", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#a1a1aa" }}>Past Runs</span>
                <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); setShowHistory(false); }} style={{ padding: "5px 12px", background: "linear-gradient(135deg,#059669,#34d399)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ New</button>
              </div>
              <div style={{ overflowY: "auto" }}>
                {history.map(item => (
                  <div key={item.id} onClick={() => loadHistoryItem(item)} style={{ padding: "12px 16px", cursor: "pointer", background: activeHistoryId === item.id ? "#f0fdf4" : "#fff", borderBottom: "1px solid #f9f9f9", borderLeft: activeHistoryId === item.id ? "3px solid #16a34a" : "3px solid transparent" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#09090b", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.input_prompt?.slice(0, 40)}</div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa" }}>{formatDate(item.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ padding: "20px 16px", paddingBottom: 100, position: "relative" }}>
          {!loadingHistory && !data && !loading && <SalesMobileBg />}

          {loadingHistory && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sl-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 12 }}>Loading your past runs...</div>
            </div>
          )}

          {!loadingHistory && !data && !loading && (
            <div style={{ animation: "sl-up 0.4s ease", position: "relative", zIndex: 1 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>💰</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.8px", marginBottom: 10, color: "#09090b", lineHeight: 1.2 }}>Build your sales machine</h1>
                <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.7 }}>CRM pipelines, cold email sequences, sales scripts & revenue projections — all in one shot.</p>
              </div>
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe your startup or product..." rows={5}
                style={{ width: "100%", padding: "14px 16px", border: "1.5px solid #e4e4e7", borderRadius: 14, fontSize: 14.5, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", color: "#09090b", background: "#fff", lineHeight: 1.65, boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#86efac"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
              <button onClick={generate} disabled={!idea.trim()} style={{ marginTop: 12, width: "100%", padding: "14px 0", background: idea.trim() ? "linear-gradient(135deg,#059669,#34d399)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                Build Sales System →
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sl-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#09090b", marginTop: 16, marginBottom: 8 }}>Building your sales system...</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Creating pipelines, email templates, scripts...</div>
            </div>
          )}

          {error && <div style={{ padding: 16, color: "#dc2626", fontSize: 13.5, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 16 }}>{error}</div>}

          {founderCtx && !ctxBannerDismissed && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, marginBottom:16, position:"relative", zIndex:1 }}>
              <div style={{ fontSize:15, flexShrink:0 }}>⚡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:"#16a34a", marginBottom:2 }}>Founder context loaded — <strong style={{ color:"#09090b" }}>{founderCtx.company_name}</strong></div>
                <div style={{ fontSize:11.5, color:"#a1a1aa" }}>Generate to use Founder data</div>
              </div>
              <button onClick={() => setCtxBannerDismissed(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#a1a1aa", fontSize:18, lineHeight:1 }}>×</button>
            </div>
          )}

          {data && !loading && (
            <div style={{ animation: "sl-up 0.4s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.8px", color: "#09090b" }}>Sales System</h2>
                  <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); }} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 12, color: "#71717a", cursor: "pointer", whiteSpace: "nowrap" }}>+ New</button>
                </div>
                <p style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.5, marginBottom: 14 }}>{data.salesStrategy?.approach}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={idea} onChange={e => setIdea(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && idea.trim()) generate(); }} placeholder="Try a different idea..." style={{ flex: 1, padding: "10px 12px", border: "1px solid #e4e4e7", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#09090b", background: "#fff", minWidth: 0 }}
                    onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#86efac"}
                    onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
                  <button onClick={generate} disabled={!idea.trim()} style={{ padding: "10px 14px", background: idea.trim() ? "linear-gradient(135deg,#059669,#34d399)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>Go →</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid #f4f4f5", marginBottom: 18, scrollbarWidth: "none" }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{ padding: "9px 12px", border: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: activeTab === t.key ? "#16a34a" : "#71717a", borderBottom: `2px solid ${activeTab === t.key ? "#16a34a" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", marginBottom: -1, flexShrink: 0 }}>{t.label}</button>
                ))}
              </div>
              {renderTabContent()}
            </div>
          )}
        </div>

        {!loadingHistory && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "rgba(255,255,255,0.97)", borderTop: "1px solid #f4f4f5", zIndex: 40 }}>
            <Link href="/build-startup" style={{ display: "block", padding: "13px 0", background: "linear-gradient(135deg,#059669,#34d399)", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>✦ Build My Startup</Link>
          </div>
        )}

        <style>{`@keyframes sl-spin { to { transform: rotate(360deg); } } @keyframes sl-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } @keyframes arteno-pdf-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // DESKTOP LAYOUT
  // ─────────────────────────────────────────────
  const showCanvas = !loadingHistory && !data && !loading;
  return (
    <div style={{ minHeight: "100vh", background: showCanvas ? "transparent" : "#fafafa", fontFamily: "'DM Sans', sans-serif", color: "#0a0a0a" }}>

      {showCanvas && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <SalesCanvas />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 20%,rgba(5,150,105,0.05) 0%,transparent 70%)" }} />
        </div>
      )}

      <header style={{ height: 54, borderBottom: "1px solid #f4f4f5", background: "rgba(255,255,255,0.95)", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ fontSize: 12.5, color: "#a1a1aa", textDecoration: "none" }}>← Dashboard</Link>
          <div style={{ width: 1, height: 14, background: "#f4f4f5" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#059669,#34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💰</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#09090b", lineHeight: 1.2 }}>Sales Agent</div>
              <div style={{ fontSize: 10.5, color: "#a1a1aa" }}>CRM, pipelines & revenue systems</div>
            </div>
          </div>
        </div>

        {/* Desktop header right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* PDF download — desktop, only when data is loaded */}
          {data && !loading && (
            <DownloadPDFButton mode="execute" agentKey="sales" agentData={data} idea={idea} size="sm" />
          )}
          {history.length > 0 && (
            <button onClick={() => setShowHistory(o => !o)} style={{ padding: "7px 14px", background: showHistory ? "#f0fdf4" : "#fff", border: `1px solid ${showHistory ? "#bbf7d0" : "#e4e4e7"}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: showHistory ? "#16a34a" : "#71717a", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              History ({history.length})
            </button>
          )}
          <Link href="/build-startup" style={{ padding: "7px 14px", background: "linear-gradient(135deg,#059669,#34d399)", color: "#fff", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>✦ Build My Startup</Link>
        </div>
      </header>

      {showHistory && history.length > 0 && (
        <div style={{ position: "fixed", top: 54, right: 24, width: 320, background: "#fff", border: "1px solid #f4f4f5", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f5", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#a1a1aa" }}>Past Runs — Sales Agent</div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {history.map(item => (
              <div key={item.id} className="sl-history" onClick={() => loadHistoryItem(item)} style={{ padding: "12px 16px", cursor: "pointer", transition: "all 0.15s", background: activeHistoryId === item.id ? "#f0fdf4" : "#fff", borderBottom: "1px solid #f9f9f9", borderLeft: activeHistoryId === item.id ? "3px solid #16a34a" : "3px solid transparent" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#09090b", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.input_prompt?.slice(0, 40)}</div>
                <div style={{ fontSize: 11.5, color: "#a1a1aa" }}>{formatDate(item.created_at)}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f4f4f5" }}>
            <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); setShowHistory(false); }} style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg,#059669,#34d399)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New Generation</button>
          </div>
        </div>
      )}
      {showHistory && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowHistory(false)} />}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px", position: "relative", zIndex: 1 }}>

        {loadingHistory && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sl-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Loading your past runs...</div>
          </div>
        )}

        {!loadingHistory && !data && !loading && (
          <div style={{ textAlign: "center", marginBottom: 48, animation: "sl-up 0.4s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>💰</div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 12, color: "#09090b" }}>Build your sales machine</h1>
            <p style={{ fontSize: 16, color: "#71717a", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>CRM pipelines, cold email sequences, sales scripts, objection handling & revenue projections — all in one shot.</p>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe your startup or product..." rows={4}
                style={{ width: "100%", padding: "16px 18px", border: "1.5px solid #e4e4e7", borderRadius: 14, fontSize: 14.5, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", color: "#09090b", background: "#fff", transition: "border-color 0.2s", lineHeight: 1.65, boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#86efac"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
              <button onClick={generate} disabled={!idea.trim()} style={{ marginTop: 12, width: "100%", padding: "13px 0", background: idea.trim() ? "linear-gradient(135deg,#059669,#34d399)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>Build Sales System →</button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sl-spin 0.75s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity="0.15" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#09090b", marginBottom: 8 }}>Building your sales system...</div>
            <div style={{ fontSize: 13.5, color: "#a1a1aa" }}>Creating CRM pipeline, email templates, scripts & revenue projections...</div>
          </div>
        )}

        {error && <div style={{ textAlign: "center", padding: 24, color: "#dc2626", fontSize: 14, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 24 }}>{error}</div>}

        {founderCtx && !ctxBannerDismissed && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, marginBottom:20, animation:"sl-up 0.3s ease" }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"#dcfce7", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>⚡</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#16a34a", marginBottom:3 }}>Founder context loaded</div>
              <div style={{ fontSize:12.5, color:"#52525b", lineHeight:1.6 }}>
                <strong style={{ color:"#09090b" }}>{founderCtx.company_name}</strong>
                {founderCtx.stage && ` · ${founderCtx.stage}`}
                {founderCtx.icp && ` · ICP: ${founderCtx.icp.slice(0,60)}${(founderCtx.icp?.length??0)>60?"…":""}`}
              </div>
              <div style={{ fontSize:11.5, color:"#a1a1aa", marginTop:4 }}>Generate a new sales system to use this context →</div>
            </div>
            <button onClick={() => setCtxBannerDismissed(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#a1a1aa", fontSize:18, lineHeight:1, padding:2 }}>×</button>
          </div>
        )}

        {data && !loading && (
          <div style={{ animation: "sl-up 0.4s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", marginBottom: 6 }}>Sales System</h2>
                  <p style={{ fontSize: 15, color: "#52525b", maxWidth: 560 }}>{data.salesStrategy?.approach}</p>
                </div>
                <button onClick={() => { setData(null); setIdea(""); setActiveHistoryId(null); }} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 9, fontSize: 13, color: "#71717a", cursor: "pointer", whiteSpace: "nowrap" }}>+ New Idea</button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={idea} onChange={e => setIdea(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && idea.trim()) generate(); }} placeholder="Generate for a different idea..." style={{ flex: 1, padding: "10px 14px", border: "1px solid #e4e4e7", borderRadius: 10, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#09090b", background: "#fff", transition: "border-color 0.2s" }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#86efac"}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e7"} />
                <button onClick={generate} disabled={!idea.trim()} style={{ padding: "10px 20px", background: idea.trim() ? "linear-gradient(135deg,#059669,#34d399)" : "#f4f4f5", color: idea.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: idea.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>Regenerate →</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #f4f4f5", marginBottom: 28, overflowX: "auto" }}>
              {TABS.map(t => (
                <button key={t.key} className="sl-tab" onClick={() => setActiveTab(t.key)} style={{ padding: "9px 16px", border: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, color: activeTab === t.key ? "#16a34a" : "#71717a", borderBottom: `2px solid ${activeTab === t.key ? "#16a34a" : "transparent"}`, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", marginBottom: -1 }}>{t.label}</button>
              ))}
            </div>
            {renderTabContent()}
          </div>
        )}

      </div>
    </div>
  );
}