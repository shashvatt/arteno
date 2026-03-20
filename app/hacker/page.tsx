"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import DownloadPDFButton from "@/components/DownloadPDFButton";

type Tab = "architecture" | "stack" | "mvp" | "tasks";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "architecture", label: "Architecture", icon: "◈" },
  { key: "stack", label: "Tech Stack", icon: "◆" },
  { key: "mvp", label: "MVP Scope", icon: "◉" },
  { key: "tasks", label: "Dev Tasks", icon: "◇" },
];

async function getToken() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.access_token ?? null;
}

function useWindowWidth() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function HackerCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number;
    type P = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; phase: number };
    let pts: P[] = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      pts = Array.from({ length: 48 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: 1 + Math.random() * 1.8, alpha: 0.07 + Math.random() * 0.14, phase: Math.random() * Math.PI * 2 }));
    };
    resize();
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.012;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(56,189,248,${a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(56,189,248,${(1 - d / 100) * 0.07})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, background: "var(--bg-page, #fafafa)" }} />;
}

function MobileBg() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(56,189,248,0.06) 0%,transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(56,189,248,0.12) 1px,transparent 1px)", backgroundSize: "24px 24px", maskImage: "linear-gradient(180deg,rgba(0,0,0,0.3) 0%,transparent 60%)", WebkitMaskImage: "linear-gradient(180deg,rgba(0,0,0,0.3) 0%,transparent 60%)" }} />
      <div style={{ position: "absolute", top: "-5%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.08) 0%,transparent 70%)", filter: "blur(40px)" }} />
    </div>
  );
}

function SL({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 10 }}>{children}</div>;
}
function Skel({ w = "100%", h = 14 }: { w?: string; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: "var(--surface)", animation: "pulse-soft 1.4s ease infinite" }} />;
}
function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 20px" }}>
      <Skel w="55%" h={20} /><Skel w="90%" /><Skel w="78%" /><Skel w="65%" />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }}>
          <Skel w="40%" h={13} /><div style={{ marginTop: 8 }}><Skel w="85%" /></div>
        </div>
      ))}
    </div>
  );
}

function ArchTab({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "hk-up 0.35s ease both" }}>
      {data.overview && <div><SL>System Overview</SL><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.overview}</p></div>}
      {data.components?.length > 0 && (
        <div><SL>Core Components</SL>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.components.map((c: any, i: number) => (
              <div key={i} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.3)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{c.name ?? c.component}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{c.description ?? c.responsibility}</div>
                  </div>
                  {c.type && <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", background: "rgba(56,189,248,0.06)", whiteSpace: "nowrap", flexShrink: 0 }}>{c.type}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.dataFlow && <div><SL>Data Flow</SL><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.dataFlow}</p></div>}
      {data.scalingStrategy && <div><SL>Scaling Strategy</SL><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.scalingStrategy}</p></div>}
    </div>
  );
}

function StackTab({ data }: { data: any }) {
  if (!data) return null;
  const categories = data.categories ?? data.layers ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "hk-up 0.35s ease both" }}>
      {data.rationale && (
        <div style={{ padding: "14px 18px", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "var(--r)", background: "rgba(56,189,248,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#38bdf8", marginBottom: 6 }}>Stack Rationale</div>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{data.rationale}</p>
        </div>
      )}
      {categories.map((cat: any, i: number) => (
        <div key={i}><SL>{cat.name ?? cat.layer ?? cat.category}</SL>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(cat.technologies ?? cat.tools ?? cat.items ?? []).map((tech: any, j: number) => {
              const label = typeof tech === "string" ? tech : tech.name;
              const reason = typeof tech === "object" ? tech.reason ?? tech.description : null;
              return (
                <div key={j} style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 3, transition: "border-color 0.2s, transform 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</span>
                  {reason && <span style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.4 }}>{reason}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {data.alternatives?.length > 0 && (
        <div><SL>Alternatives Considered</SL>
          {data.alternatives.map((a: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>
              <span style={{ color: "var(--text-4)", flexShrink: 0 }}>→</span>
              <span><strong style={{ color: "var(--text-2)" }}>{a.tool ?? a.name}</strong>{a.reason ? ` — ${a.reason}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MvpTab({ data }: { data: any }) {
  if (!data) return null;
  const features = data.features ?? data.coreFeatures ?? [];
  const outOfScope = data.outOfScope ?? data.excludedFeatures ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "hk-up 0.35s ease both" }}>
      {data.summary && <div><SL>MVP Summary</SL><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.summary}</p></div>}
      {data.timeline && (
        <div style={{ padding: "12px 16px", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "var(--r)", background: "rgba(56,189,248,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⏱</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#38bdf8", marginBottom: 2 }}>Estimated Timeline</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{data.timeline}</div>
          </div>
        </div>
      )}
      {features.length > 0 && (
        <div><SL>In Scope — MVP Features</SL>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {features.map((f: any, i: number) => {
              const name = typeof f === "string" ? f : f.name ?? f.feature;
              const desc = typeof f === "object" ? f.description ?? f.details : null;
              const priority = typeof f === "object" ? f.priority : null;
              const pColor = priority === "High" || priority === "high" ? "#dc2626" : priority === "Medium" || priority === "medium" ? "#d97706" : "var(--text-4)";
              return (
                <div key={i} style={{ padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.25)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: desc ? 4 : 0 }}>{name}</div>
                    {desc && <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{desc}</div>}
                  </div>
                  {priority && <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${pColor}40`, color: pColor, background: `${pColor}0a` }}>{priority}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {outOfScope.length > 0 && (
        <div><SL>Out of Scope — Post-MVP</SL>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {outOfScope.map((f: any, i: number) => (
              <span key={i} style={{ fontSize: 12, padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text-4)", background: "var(--surface)" }}>
                {typeof f === "string" ? f : f.name ?? f.feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TasksTab({ data }: { data: any }) {
  if (!data) return null;
  const sprints = data.sprints ?? data.phases ?? [];
  const tasks = data.tasks ?? [];
  if (sprints.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "hk-up 0.35s ease both" }}>
        {sprints.map((sprint: any, i: number) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 8px rgba(56,189,248,0.3)" }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{sprint.name ?? sprint.title ?? `Sprint ${i + 1}`}</div>
                {sprint.duration && <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{sprint.duration}</div>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 34 }}>
              {(sprint.tasks ?? sprint.items ?? []).map((task: any, j: number) => {
                const label = typeof task === "string" ? task : task.task ?? task.name ?? task.title;
                const estimate = typeof task === "object" ? task.estimate ?? task.hours ?? task.points : null;
                return (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.25)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#38bdf8", flexShrink: 0, marginTop: 1 }}>→</span>
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
                    </div>
                    {estimate && <span style={{ fontSize: 11, color: "var(--text-4)", whiteSpace: "nowrap", flexShrink: 0 }}>{estimate}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "hk-up 0.35s ease both" }}>
      {tasks.map((task: any, i: number) => {
        const label = typeof task === "string" ? task : task.task ?? task.name ?? task.title;
        const estimate = typeof task === "object" ? task.estimate ?? task.hours : null;
        const category = typeof task === "object" ? task.category ?? task.type : null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", transition: "border-color 0.2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.25)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
              <span style={{ color: "#38bdf8", flexShrink: 0, marginTop: 2 }}>→</span>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>{label}</div>
                {category && <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>{category}</div>}
              </div>
            </div>
            {estimate && <span style={{ fontSize: 11.5, color: "var(--text-4)", whiteSpace: "nowrap", flexShrink: 0, padding: "2px 8px", border: "1px solid var(--border)", borderRadius: 20 }}>{estimate}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function HackerPage() {
  const router = useRouter();
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 768;

  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("architecture");
  const [mounted, setMounted] = useState(false);
  const [founderCtx, setFounderCtx] = useState<{ company_name?: string; icp?: string; stage?: string; tech_stack?: string[] } | null>(null);
  const [ctxBannerDismissed, setCtxBannerDismissed] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const loadCtx = async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("startup_context").select("company_name, icp, stage, tech_stack, mvp_scope").eq("user_id", session.user.id).maybeSingle();
      if (data?.company_name) { setFounderCtx(data); setIdea(prev => prev || data.company_name || ""); }
    };
    loadCtx();
  }, []);

  const tabData: Record<Tab, any> = {
    architecture: result?.architecture ?? result?.systemArchitecture ?? null,
    stack: result?.techStack ?? result?.stack ?? null,
    mvp: result?.mvp ?? result?.mvpScope ?? null,
    tasks: result?.devTasks ?? result?.tasks ?? result?.sprintPlan ?? null,
  };

  const handleGenerate = async () => {
    if (!idea.trim() || loading) return;
    setLoading(true); setResult(null); setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/hacker", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ prompt: idea }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setResult(json.data); setActiveTab("architecture");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="app-shell" style={{ overflow: isMobile ? "auto" : "hidden", minHeight: "100vh", position: "relative" }}>
      <style>{`
        @keyframes hk-spin  { to { transform: rotate(360deg); } }
        @keyframes hk-up    { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes hk-scan  { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes hk-pulse { 0%,100%{opacity:1;box-shadow:0 0 6px rgba(56,189,248,0.6)} 50%{opacity:0.5;box-shadow:0 0 14px rgba(56,189,248,0.2)} }
        @keyframes pulse-soft { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes arteno-pdf-spin { to { transform: rotate(360deg); } }
        .hk-tab:hover  { color: #38bdf8 !important; }
        .hk-gen:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(56,189,248,0.45) !important; transform: translateY(-1px) !important; }
        .hk-ex:hover   { border-color: rgba(56,189,248,0.35) !important; color: #38bdf8 !important; }
        textarea::placeholder { color: var(--text-4); }
      `}</style>

      {!isMobile && !result && <HackerCanvas />}
      {!isMobile && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.05),transparent)", animation: "hk-scan 9s linear infinite" }} />
        </div>
      )}

      <div className="main-area" style={{ position: "relative", zIndex: 1 }}>
        {/* TOPBAR */}
        <div className="main-topbar" style={{ padding: isMobile ? "0 16px" : "0 26px", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 13, fontFamily: "var(--font)", padding: 0, flexShrink: 0 }}>
              {isMobile ? "←" : "Dashboard"}
            </button>
            {!isMobile && <span style={{ color: "var(--text-4)", fontSize: 13 }}>›</span>}
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <span className="main-topbar-title">Hacker Agent</span>
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* PDF download — both mobile and desktop */}
            {result && !loading && (
              <DownloadPDFButton mode="execute" agentKey="hacker" agentData={result} idea={idea} size="sm" />
            )}
            {!isMobile && (
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", background: "rgba(56,189,248,0.06)", fontWeight: 600, letterSpacing: 0.5 }}>Execute Mode</span>
            )}
            <Link href="/build-startup" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 2px 10px rgba(56,189,248,0.25)" }}>
              {isMobile ? "✦ Build" : "✦ Build My Startup"}
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 100px" : "32px", position: "relative" }}>
          {isMobile && !result && !loading && <MobileBg />}

          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobile ? 20 : 28, position: "relative", zIndex: 1 }}>

            {/* Header */}
            <div style={{ animation: "hk-up 0.4s ease both" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, color: "rgba(56,189,248,0.7)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8", display: "inline-block", animation: "hk-pulse 2.2s ease-in-out infinite" }} />
                Agent 04
              </div>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, letterSpacing: "-0.6px", color: "var(--text)", marginBottom: 6 }}>Hacker Agent</h1>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>Technical architecture, stack decisions, MVP scope & developer task breakdown.</p>
            </div>

            {/* Founder context banner */}
            {founderCtx && !ctxBannerDismissed && !result && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.22)", borderRadius: 12, animation: "hk-up 0.3s ease both" }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 3 }}>Founder context loaded</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--text)" }}>{founderCtx.company_name}</strong>
                    {founderCtx.stage && ` · ${founderCtx.stage}`}
                    {founderCtx.icp && ` · ${founderCtx.icp.slice(0, 55)}${(founderCtx.icp?.length ?? 0) > 55 ? "…" : ""}`}
                  </div>
                  {founderCtx.tech_stack?.length ? (
                    <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>Stack context: {founderCtx.tech_stack.slice(0, 5).join(", ")}{founderCtx.tech_stack.length > 5 ? ` +${founderCtx.tech_stack.length - 5} more` : ""}</div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>Generate to receive a tech plan aligned with your startup</div>
                  )}
                </div>
                <button onClick={() => setCtxBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
              </div>
            )}

            {/* Input panel */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", animation: "hk-up 0.45s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "rgba(56,189,248,0.03)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.65 }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(56,189,248,0.5)", fontFamily: "monospace" }}>hacker.agent — describe your product</span>
                </div>
                {!isMobile && <span style={{ fontSize: 10.5, color: "var(--text-4)", fontFamily: "monospace" }}>⌘↵ to run</span>}
              </div>
              <div style={{ padding: isMobile ? "14px" : "18px 20px" }}>
                <textarea value={idea} onChange={e => setIdea(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  placeholder="e.g. A marketplace for freelance developers..."
                  rows={isMobile ? 4 : 3}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, lineHeight: 1.7, outline: "none", resize: "vertical", transition: "border-color 0.15s", boxSizing: "border-box", fontFamily: "var(--font)" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(56,189,248,0.4)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  <span style={{ fontSize: 11.5, color: "var(--text-4)", fontFamily: "monospace", flexShrink: 0 }}>{idea.length}/2000 {!isMobile && "· ⌘↵ to generate"}</span>
                  <button className="hk-gen" onClick={handleGenerate} disabled={!idea.trim() || loading}
                    style={{ padding: "10px 26px", borderRadius: 10, border: "none", cursor: idea.trim() && !loading ? "pointer" : "not-allowed", background: idea.trim() && !loading ? "linear-gradient(135deg,#0ea5e9,#38bdf8)" : "var(--surface)", color: idea.trim() && !loading ? "#fff" : "var(--text-4)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font)", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: idea.trim() && !loading ? "0 4px 16px rgba(56,189,248,0.3)" : "none", width: isMobile ? "100%" : "auto" }}>
                    {loading ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "hk-spin 0.65s linear infinite", display: "inline-block", flexShrink: 0 }} />Analysing...</> : <>Generate ⚡</>}
                  </button>
                </div>
                {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>⚠ {error}</div>}
              </div>
            </div>

            {/* Quick examples */}
            {!result && !loading && !founderCtx && (
              <div style={{ display: "flex", flexWrap: "nowrap", gap: 8, overflowX: "auto", paddingBottom: 2, animation: "hk-up 0.5s ease both" }}>
                <span style={{ fontSize: 11.5, color: "var(--text-4)", alignSelf: "center", flexShrink: 0 }}>Try:</span>
                {["AI-powered SaaS for indie hackers", "Freelance marketplace with escrow", "Social app for book readers"].map(ex => (
                  <button key={ex} className="hk-ex" onClick={() => setIdea(ex)}
                    style={{ padding: "5px 13px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, color: "var(--text-4)", cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}>{ex}</button>
                ))}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && !result && (
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", animation: "hk-up 0.3s ease both" }}>
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>{TABS.map(t => <div key={t.key} style={{ flex: 1, height: 44, background: "var(--surface)" }} />)}</div>
                <LoadingSkeleton />
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", animation: "hk-up 0.4s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(56,189,248,0.03)", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 5 }}>{["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.65 }} />)}</div>
                    <span style={{ fontSize: 11, color: "rgba(56,189,248,0.55)", fontFamily: "monospace" }}>hacker.agent — output ready</span>
                  </div>
                  <button onClick={() => { setResult(null); setIdea(founderCtx?.company_name ?? ""); }}
                    style={{ padding: "5px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, fontSize: 12, color: "var(--text-4)", cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.3)"; (e.currentTarget as HTMLElement).style.color = "#38bdf8"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}>+ New</button>
                </div>
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
                  {TABS.map(t => (
                    <button key={t.key} className="hk-tab" onClick={() => setActiveTab(t.key)}
                      style={{ flex: isMobile ? "none" : 1, padding: isMobile ? "11px 16px" : "12px 0", border: "none", cursor: "pointer", whiteSpace: "nowrap", background: activeTab === t.key ? "rgba(56,189,248,0.06)" : "transparent", color: activeTab === t.key ? "#38bdf8" : "var(--text-4)", fontSize: 12, fontWeight: 700, letterSpacing: 0.3, fontFamily: "var(--font)", transition: "all 0.15s", borderBottom: activeTab === t.key ? "2px solid #38bdf8" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <span style={{ fontSize: 11 }}>{t.icon}</span>
                      {isMobile ? t.label.split(" ")[0] : t.label}
                    </button>
                  ))}
                </div>
                <div style={{ padding: isMobile ? "18px 16px" : "28px 32px" }}>
                  {activeTab === "architecture" && <ArchTab data={tabData.architecture} />}
                  {activeTab === "stack" && <StackTab data={tabData.stack} />}
                  {activeTab === "mvp" && <MvpTab data={tabData.mvp} />}
                  {activeTab === "tasks" && <TasksTab data={tabData.tasks} />}
                  {!tabData[activeTab] && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-4)", fontSize: 13 }}>No {activeTab} data returned — try regenerating.</div>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 16px", background: "rgba(255,255,255,0.97)", borderTop: "1px solid var(--border)", zIndex: 50, backdropFilter: "blur(12px)" }}>
          <Link href="/build-startup" style={{ display: "block", padding: "13px 0", background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>✦ Build My Startup</Link>
        </div>
      )}
    </div>
  );
}