"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const features = [
  "Product Blueprint in seconds",
  "4-phase Execution Roadmap",
  "AI Prompt Packs for every tool",
  "Feasibility Score & risk analysis",
];

function useWindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

function PanelParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    interface P { x: number; y: number; vx: number; vy: number; r: number; o: number; phase: number; }
    let pts: P[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    const init = () => {
      pts = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4, o: Math.random() * 0.32 + 0.08,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.012;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        const a = p.o * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,225,255,${a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(200,215,255,${(1 - d / 100) * 0.13})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    const ro = new ResizeObserver(() => { resize(); init(); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />;
}

function PanelOrbs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", top: "-100px", left: "-100px", filter: "blur(30px)", animation: "panelOrb1 16s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", bottom: "40px", right: "-80px", filter: "blur(28px)", animation: "panelOrb2 20s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", top: "50%", left: "50%", filter: "blur(24px)", animation: "panelOrb3 24s ease-in-out infinite" }} />
      <style>{`
        @keyframes panelOrb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(25px,18px)} }
        @keyframes panelOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,-25px)} }
        @keyframes panelOrb3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,15px)} }
      `}</style>
    </div>
  );
}

export default function SignInPage() {
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 768;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/choose-mode");
  }

  async function handleOAuth(provider: "google" | "github") {
    setError("");
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    border: "1px solid var(--border)", borderRadius: 8,
    fontSize: 13, fontFamily: "var(--font)", color: "var(--text)",
    background: "var(--bg)", outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500,
    color: "var(--text)", marginBottom: 4,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row", fontFamily: "var(--font)", background: "var(--bg)" }}>
      <div style={{
        ...(isMobile ? { width: "100%", padding: "28px 24px 32px", minHeight: 200 } : { width: 400, flexShrink: 0, padding: "44px 44px 40px", minHeight: "100vh" }),
        background: "linear-gradient(155deg, #060d1a 0%, #0b172a 45%, #121f3a 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: isMobile ? "flex-start" : "space-between",
        gap: isMobile ? 18 : 0,
        position: "relative", overflow: "hidden",
        animation: "fadein 0.5s ease both",
      }}>
        <PanelOrbs />
        <PanelParticles />
        <div style={{ position: "relative", zIndex: 2, flex: isMobile ? "unset" : 1, display: "flex", flexDirection: "column", justifyContent: "center", ...(isMobile ? {} : { paddingTop: 40, paddingBottom: 40 }) }}>
          <h2 style={{ fontSize: isMobile ? 21 : 27, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1.2, color: "#fff", marginBottom: 10, animation: "fadeup 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
            Turn ideas into<br />full product plans.
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.7, marginBottom: isMobile ? 14 : 26, animation: "fadeup 0.5s 0.17s cubic-bezier(0.16,1,0.3,1) both" }}>
            Sign in to access your projects and keep building.
          </p>
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? "8px 16px" : 11 }}>
            {features.map((f, i) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, animation: `fadeup 0.4s ${0.22 + i * 0.06}s cubic-bezier(0.16,1,0.3,1) both` }}>
                <div style={{ width: 17, height: 17, borderRadius: "50%", background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <span style={{ fontSize: isMobile ? 11.5 : 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        {!isMobile && <div style={{ position: "relative", zIndex: 2, fontSize: 11.5, color: "rgba(255,255,255,0.22)" }}>© {new Date().getFullYear()} Arteno</div>}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 20px 48px" : "40px 32px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 360, animation: "fadeup 0.5s 0.08s cubic-bezier(0.16,1,0.3,1) both" }}>
          <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 4, color: "var(--text)" }}>Welcome back</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>Sign in to continue building</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <button onClick={() => handleOAuth("google")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 38, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)", color: "#333" }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("github")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 38, border: "1px solid var(--border)", borderRadius: 8, background: "#24292e", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)", color: "#fff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
              Continue with GitHub
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none" }}>Forgot password?</Link>
            </div>
            {error && <div style={{ fontSize: 12.5, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ height: 38, borderRadius: 8, background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "var(--font)" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-3)", marginTop: 20 }}>
            No account?{" "}<Link href="/sign-up" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Create one free</Link>
          </div>
          {isMobile && <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "var(--text-4)" }}>© {new Date().getFullYear()} Arteno</div>}
        </div>
      </div>
    </div>
  );
}