"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Project = {
  id: string;
  name?: string;
  title?: string;
  created_at: string;
  blueprint: any;
  roadmap: any;
  prompts: any;
  feasibility: any;
};
type Props = {
  onLoadProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
};

const DOT_COLORS = ["#a78bfa", "#34d399", "#60a5fa", "#fb923c", "#f472b6"];

// ── Icons ────────────────────────────────────────────────
const Ic = {
  search:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  think:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5.5-4 7v2H8v-2C5.5 15.5 4 13 4 10a8 8 0 0 1 8-8z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>,
  execute:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  file:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  grid:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  settings: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  x:        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  user:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  menu:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  star:     <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  upgrade:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>,
};

// ── Animated orb canvas ─────────────────────────────────
function SidebarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number, t = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; phase: number };
    let pts: P[] = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      pts = Array.from({ length: 22 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        r: 0.8 + Math.random() * 1.4, a: 0.06 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    const draw = () => {
      t += 0.004;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      [[0.3, 0.2, 100, "rgba(139,92,246,"], [0.7, 0.8, 80, "rgba(99,102,241,"]].forEach(([rx, ry, rad, col]) => {
        const x = (rx as number) * W + Math.sin(t * 0.5) * W * 0.12;
        const y = (ry as number) * H + Math.cos(t * 0.4) * H * 0.08;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad as number);
        g.addColorStop(0, `${col}0.09)`); g.addColorStop(1, `${col}0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.01;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.a * (0.5 + 0.5 * Math.sin(p.phase))})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx*dx+dy*dy);
        if (d < 60) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(139,92,246,${(1-d/60)*0.06})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ── Sidebar content ─────────────────────────────────────
function SidebarContent({ onLoadProject, onDeleteProject, onClose }: Props & { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // true when rendered inside the mobile drawer
  const isMobile = !!onClose;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) { setIsSignedIn(true); setUserEmail(user.email ?? ""); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) { setIsSignedIn(true); setUserEmail(s.user.email ?? ""); }
      else { setIsSignedIn(false); setUserEmail(""); setProjects([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try { const r = await fetch("/api/projects"); const j = await r.json(); setProjects(j.data ?? []); }
    catch (e) { console.error(e); } finally { setLoadingProjects(false); }
  };

  useEffect(() => { if (isSignedIn) loadProjects(); }, [isSignedIn]);
  useEffect(() => {
    const h = () => loadProjects();
    window.addEventListener("forge:project-saved", h);
    return () => window.removeEventListener("forge:project-saved", h);
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/sign-in"); };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setDeletingId(id); setConfirmDeleteId(null);
    try { await fetch(`/api/projects/${id}`, { method: "DELETE" }); setProjects(p => p.filter(x => x.id !== id)); onDeleteProject?.(id); }
    catch (e) { console.error(e); } finally { setDeletingId(null); }
  };

  const avatar = userEmail ? userEmail[0].toUpperCase() : "?";
  const filtered = projects.filter(p => (p.title ?? p.name ?? "").toLowerCase().includes(searchVal.toLowerCase()));
  const visible = showAll ? filtered : filtered.slice(0, 6);

  const navItem = (href: string, icon: React.ReactNode, label: string, accent?: string, badge?: string) => {
    const active = pathname === href;
    return (
      <Link href={href} onClick={onClose} style={{
        display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9,
        fontSize: 13, fontWeight: active ? 600 : 400,
        color: active ? "#fff" : "rgba(255,255,255,0.45)",
        background: active ? `linear-gradient(135deg, ${accent ?? "rgba(139,92,246,0.2)"}, rgba(99,102,241,0.08))` : "transparent",
        textDecoration: "none", transition: "all 0.15s",
        border: active ? `1px solid ${accent ? accent + "40" : "rgba(139,92,246,0.25)"}` : "1px solid transparent",
        position: "relative", zIndex: 1,
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; } }}>
        <span style={{ display: "flex", opacity: active ? 1 : 0.6, color: active && accent ? accent : "currentColor" }}>{icon}</span>
        <span style={{ flex: 1, letterSpacing: "-0.1px" }}>{label}</span>
        {badge && <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.2)" }}>{badge}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* ── Header ── */}
      <div style={{ padding: "18px 14px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.4px", lineHeight: 1.2 }}>Arteno</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em", marginTop: 2 }}>AI Startup Suite</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {isSignedIn && (
            <button onClick={() => { router.push("/dashboard?new=1"); onClose?.(); }} title="New project"
              style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "rgba(255,255,255,0.4)", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.15)"; (e.currentTarget as HTMLElement).style.color = "#a78bfa"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
              {Ic.plus}
            </button>
          )}
          {onClose && (
            <button onClick={onClose}
              style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "rgba(255,255,255,0.4)", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
              {Ic.close}
            </button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: "10px 12px 6px", position: "relative", zIndex: 1, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 10, background: searchFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)", border: `1px solid ${searchFocused ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}>
          <span style={{ color: "rgba(255,255,255,0.25)", display: "flex", flexShrink: 0 }}>{Ic.search}</span>
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
            placeholder="Search projects..."
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontFamily: "inherit" }} />
          {searchVal && (
            <button onClick={() => setSearchVal("")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", padding: 0 }}>{Ic.x}</button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="sb-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 10px 10px", display: "flex", flexDirection: "column", gap: 0, position: "relative", zIndex: 1 }}>

        {isSignedIn ? (
          <>
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px 7px" }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>Projects</span>
                <button onClick={() => { router.push("/dashboard?new=1"); onClose?.(); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#a78bfa"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"}>
                  {Ic.plus} New
                </button>
              </div>

              {loadingProjects && (
                <div style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[65, 80, 50].map((w, i) => (
                    <div key={i} style={{ height: 8, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: `sb-shimmer ${1.3 + i * 0.15}s ease-in-out infinite` }} />
                  ))}
                </div>
              )}

              {!loadingProjects && filtered.length === 0 && (
                <div style={{ padding: "10px 10px", fontSize: 12, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 7, fontStyle: "italic" }}>
                  {Ic.file} {searchVal ? "No matches" : "No projects yet"}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {!loadingProjects && visible.map((project, idx) => {
                  const name = project.title ?? project.name ?? "Untitled";
                  const isHovered = hoveredId === project.id;
                  const isDeleting = deletingId === project.id;
                  const isConfirming = confirmDeleteId === project.id;

                  // Show delete button: always on mobile (touch), hover-only on desktop
                  const showDelete = (isHovered || isMobile) && !isDeleting;

                  if (isConfirming) return (
                    <div key={project.id} style={{ padding: "9px 10px", borderRadius: 9, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "1px 0" }}>
                      <span style={{ fontSize: 11.5, color: "#f87171", fontWeight: 500 }}>Delete?</span>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={e => handleDelete(e, project.id)} style={{ fontSize: 11, padding: "3px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Yes</button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }} style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>No</button>
                      </div>
                    </div>
                  );

                  return (
                    <div key={project.id} style={{ position: "relative", animation: "sb-in 0.2s ease both", animationDelay: `${idx * 20}ms` }}
                      onMouseEnter={() => setHoveredId(project.id)}
                      onMouseLeave={() => setHoveredId(null)}>
                      <button
                        onClick={() => { onLoadProject?.(project); onClose?.(); }}
                        disabled={isDeleting}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "8px 10px", paddingRight: showDelete ? 32 : 10,
                          borderRadius: 9, border: "1px solid transparent",
                          background: isHovered ? "rgba(255,255,255,0.05)" : "transparent",
                          cursor: isDeleting ? "default" : "pointer",
                          opacity: isDeleting ? 0.4 : 1,
                          fontFamily: "inherit", transition: "all 0.12s",
                          borderColor: isHovered ? "rgba(255,255,255,0.06)" : "transparent",
                        }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: DOT_COLORS[idx % DOT_COLORS.length], opacity: 0.7 }} />
                        <span style={{
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontSize: 12.5, color: isHovered ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.42)",
                          flex: 1, textAlign: "left", letterSpacing: "-0.1px", transition: "color 0.12s",
                        }}>
                          {isDeleting ? "Deleting..." : name}
                        </span>
                      </button>

                      {/* Delete button — hover on desktop, always visible on mobile */}
                      {showDelete && (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDeleteId(project.id); }}
                          style={{
                            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 18, height: 18, borderRadius: 5,
                            color: isMobile ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.25)",
                            cursor: "pointer", border: "none",
                            background: isMobile ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.06)",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.12)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isMobile ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLElement).style.background = isMobile ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.06)"; }}>
                          {Ic.x}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!loadingProjects && filtered.length > 6 && (
                <button onClick={() => setShowAll(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "6px 10px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 11.5, color: "rgba(255,255,255,0.25)", fontFamily: "inherit", transition: "color 0.12s", marginTop: 2 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"}>
                  <span style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "flex" }}>{Ic.chevron}</span>
                  {showAll ? "Show less" : `${filtered.length - 6} more projects`}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, padding: "0 2px" }}>
            <Link href="/sign-in" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "all 0.15s", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}>
              <span style={{ opacity: 0.6 }}>{Ic.user}</span> Sign in
            </Link>
            <Link href="/sign-up" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "#a78bfa", textDecoration: "none", background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))", border: "1px solid rgba(139,92,246,0.2)", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.1))"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))"; }}>
              <span>{Ic.plus}</span> Create free account
            </Link>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {isSignedIn && (
        <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1, flexShrink: 0 }}>

          {navItem("/settings", Ic.settings, "Settings")}

          <Link href="/upgrade" onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 12, marginBottom: 8,
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.08))",
            border: "1px solid rgba(124,58,237,0.22)", textDecoration: "none", transition: "all 0.2s",
            position: "relative", overflow: "hidden",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.14))"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.08))"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.22)"; }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(167,139,250,0.1) 50%, transparent 60%)", animation: "sb-shimmer-slide 3s ease-in-out infinite", pointerEvents: "none" }} />
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fbbf24" }}>{Ic.star}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#c4b5fd", lineHeight: 1.2, letterSpacing: "-0.2px" }}>Upgrade to Pro</div>
              <div style={{ fontSize: 10.5, color: "rgba(167,139,250,0.45)", marginTop: 1 }}>Unlimited generations</div>
            </div>
            <span style={{ fontSize: 13, color: "rgba(167,139,250,0.4)" }}>→</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#3730a3,#1e3a5f)", border: "1.5px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
                {avatar}
              </div>
              <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1.5px solid #0c0c0d" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.1px" }}>{userEmail}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>Free plan</div>
            </div>
            <button onClick={handleSignOut} title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", display: "flex", padding: 5, borderRadius: 7, flexShrink: 0, transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {Ic.logout}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main export ─────────────────────────────────────────
export default function Sidebar({ onLoadProject, onDeleteProject }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const shell: React.CSSProperties = {
    display: "flex", flexDirection: "column",
    background: "linear-gradient(180deg, #0e0b1a 0%, #0a0a12 100%)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden", fontFamily: "'Inter', sans-serif", position: "relative",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .sb-scroll::-webkit-scrollbar { width: 3px; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        .sb-input-search::placeholder { color: rgba(255,255,255,0.2); font-size: 12.5px; }
        @keyframes sb-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sb-shimmer { 0%,100%{opacity:0.35} 50%{opacity:0.65} }
        @keyframes sb-slide { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes fadein { from{opacity:0} to{opacity:1} }
        @keyframes sb-shimmer-slide { 0%{transform:translateX(-100%)} 60%,100%{transform:translateX(200%)} }

        .sb-desktop {
          width: 248px !important; flex-shrink: 0 !important;
          height: 100vh !important; position: sticky !important;
          top: 0 !important; display: flex !important;
        }
        .sb-hamburger { display: none !important; }

        @media (max-width: 900px) {
          .sb-desktop {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            pointer-events: none !important;
          }
          .sb-hamburger { display: flex !important; }
        }
      `}</style>

      {/* Desktop */}
      <aside className="sb-desktop" style={shell}>
        <SidebarCanvas />
        <SidebarContent onLoadProject={onLoadProject} onDeleteProject={onDeleteProject} />
      </aside>

      {/* Mobile hamburger */}
      <button className="sb-hamburger" onClick={() => setMobileOpen(true)}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 45, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#64748b", transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#0f172a"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#64748b"}>
        {Ic.menu}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 160, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", animation: "fadein 0.2s ease" }} />
          <aside style={{ ...shell, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 170, width: 275, maxWidth: "85vw", animation: "sb-slide 0.28s cubic-bezier(0.16,1,0.3,1) both", boxShadow: "8px 0 48px rgba(0,0,0,0.7)" }}>
            <SidebarCanvas />
            <SidebarContent onLoadProject={onLoadProject} onDeleteProject={onDeleteProject} onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}