"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import dynamic from "next/dynamic";
import ExecuteDashboard from "@/components/ExecuteDashboard";

const ThinkDashboardInner = dynamic(
  () => import("./ThinkDashboardInner").then(mod => mod.default),
  { ssr: false, loading: () => null }
);

type Mode = "think" | "execute";

function useWindowWidth() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

export default function DashboardPage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchMode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/sign-in"; return; }
      const { data } = await supabase
        .from("user_preferences")
        .select("mode")
        .eq("user_id", user.id)
        .single();
      if (!data?.mode) { window.location.href = "/choose-mode"; return; }
      setMode(data.mode as Mode);
      setLoading(false);
    };
    fetchMode();
  }, []);

  const switchMode = async (newMode: Mode) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_preferences").upsert(
      { user_id: user.id, mode: newMode, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setMode(newMode);
  };

  if (loading || !mode) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <ModePill current={mode} onSwitch={switchMode} />
      {mode === "think" ? <ThinkDashboardInner /> : <ExecuteDashboard />}
    </>
  );
}

// ── Mode switcher pill + dropdown ──────────────────────────
function ModePill({ current, onSwitch }: { current: Mode; onSwitch: (m: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 900;

  const modeConfig = {
    think: {
      color: "#8b5cf6",
      border: "rgba(139,92,246,0.35)",
      glow: "rgba(139,92,246,0.7)",
      gradient: "linear-gradient(135deg,#7c3aed,#6366f1)",
      bg: "rgba(139,92,246,0.08)",
      activeBorder: "rgba(139,92,246,0.3)",
      icon: "🧠",
      label: "Think",
      tagline: "Blueprint & Strategy",
      desc: "Turn your idea into a complete startup blueprint — market analysis, roadmap, pitch deck & feasibility score.",
      features: ["Product Blueprint", "Execution Roadmap", "AI Prompt Packs", "Feasibility Score"],
    },
    execute: {
      color: "#fb923c",
      border: "rgba(251,146,60,0.3)",
      glow: "rgba(251,146,60,0.7)",
      gradient: "linear-gradient(135deg,#ea580c,#fb923c)",
      bg: "rgba(251,146,60,0.06)",
      activeBorder: "rgba(251,146,60,0.3)",
      icon: "⚡",
      label: "Execute",
      tagline: "Build & Ship",
      desc: "Deploy 4 specialist AI agents — Founder, Sales, Marketing & Hacker — working together on your startup.",
      features: ["Founder Agent", "Sales Agent", "Marketing Agent", "Hacker Agent"],
    },
  };

  const cfg = modeConfig[current];

  return (
    <>
      <style>{`
        @keyframes pillDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mode-card {
          transition: all 0.18s ease;
          cursor: pointer;
        }
        .mode-card:hover {
          transform: translateY(-1px);
        }
      `}</style>

      {/* Wrapper — right on mobile, centered on desktop */}
      <div style={{
        position: "fixed",
        top: isMobile ? 7 : 16,
        zIndex: 9999,
        ...(isMobile ? { right: 12 } : { left: "50%", transform: "translateX(-50%)" }),
      }}>

        {/* Pill trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: isMobile ? 6 : 8,
            padding: isMobile ? "6px 10px 6px 8px" : "7px 14px 7px 10px",
            borderRadius: 100,
            background: open ? "rgba(15,15,15,0.98)" : "rgba(10,10,10,0.88)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${open ? cfg.color + "60" : cfg.border}`,
            cursor: "pointer",
            boxShadow: open
              ? `0 4px 24px rgba(0,0,0,0.5), 0 0 0 3px ${cfg.color}18`
              : "0 4px 20px rgba(0,0,0,0.4)",
            transition: "all 0.2s ease",
            outline: "none",
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.glow}`,
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "#fff" }}>
            {cfg.label}
          </span>
          <svg
            width="11" height="11" viewBox="0 0 12 12" fill="none"
            style={{
              color: "rgba(255,255,255,0.35)",
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.22s ease",
              marginLeft: 2,
            }}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dropdown — anchored to right edge of pill, not screen center */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: -1 }}
              onClick={() => setOpen(false)}
            />

            <div style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              width: isMobile ? "calc(100vw - 24px)" : 340,
              ...(isMobile
                ? { right: 0 }
                : { left: "50%", transform: "translateX(-50%)" }),
              background: "rgba(10,10,12,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset",
              animation: "pillDropIn 0.22s cubic-bezier(0.16,1,0.3,1)",
            }}>

              {/* Header */}
              <div style={{
                padding: "14px 18px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>
                  Switch Mode
                </span>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 18, lineHeight: 1, padding: 0, display: "flex" }}
                >×</button>
              </div>

              {/* Mode cards */}
              <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                {(["think", "execute"] as Mode[]).map(m => {
                  const mc = modeConfig[m];
                  const isActive = current === m;
                  return (
                    <div
                      key={m}
                      className="mode-card"
                      onClick={() => { if (!isActive) { onSwitch(m); setOpen(false); } }}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: isActive ? mc.bg : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isActive ? mc.activeBorder : "rgba(255,255,255,0.07)"}`,
                        position: "relative",
                        overflow: "hidden",
                        cursor: isActive ? "default" : "pointer",
                      }}
                    >
                      {/* Active glow line */}
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, height: 2,
                          background: mc.gradient,
                        }} />
                      )}

                      {/* Top row: icon + label + badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: isActive ? mc.gradient : "rgba(255,255,255,0.05)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18,
                            boxShadow: isActive ? `0 4px 14px ${mc.color}40` : "none",
                            transition: "all 0.2s",
                          }}>
                            {mc.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#fff" : "rgba(255,255,255,0.6)", letterSpacing: "-0.2px" }}>
                              {mc.label}
                            </div>
                            <div style={{ fontSize: 11, color: isActive ? mc.color : "rgba(255,255,255,0.25)", marginTop: 1, fontWeight: 500 }}>
                              {mc.tagline}
                            </div>
                          </div>
                        </div>
                        {isActive ? (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
                            textTransform: "uppercase" as const,
                            padding: "3px 9px", borderRadius: 100,
                            background: mc.bg,
                            color: mc.color,
                            border: `1px solid ${mc.activeBorder}`,
                          }}>Active</span>
                        ) : (
                          <span style={{
                            fontSize: 11, color: "rgba(255,255,255,0.3)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 100, padding: "3px 10px", fontWeight: 500,
                          }}>Switch →</span>
                        )}
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: 12, color: isActive ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)",
                        lineHeight: 1.6, margin: "0 0 12px",
                      }}>
                        {mc.desc}
                      </p>

                      {/* Feature pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {mc.features.map(f => (
                          <span key={f} style={{
                            fontSize: 10.5, padding: "3px 9px", borderRadius: 6,
                            background: isActive ? `${mc.color}12` : "rgba(255,255,255,0.04)",
                            color: isActive ? mc.color : "rgba(255,255,255,0.25)",
                            border: `1px solid ${isActive ? mc.color + "25" : "rgba(255,255,255,0.07)"}`,
                            fontWeight: 500,
                          }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{
                padding: "8px 18px 12px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                fontSize: 10.5, color: "rgba(255,255,255,0.18)", textAlign: "center" as const,
              }}>
                Your preference is saved automatically
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}