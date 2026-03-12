"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, delay = 0, stretch = false }: { children: React.ReactNode; delay?: number; stretch?: boolean }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`, ...(stretch ? { height: "100%", display: "flex", flexDirection: "column" as const } : {}) }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCROLL PROGRESS BAR
// ─────────────────────────────────────────────
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
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 200 }}>
      <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa,#6366f1)", transition: "width 0.1s linear", borderRadius: "0 2px 2px 0" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// CUSTOM CURSOR
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// TYPEWRITER
// ─────────────────────────────────────────────
const TYPEWRITER_WORDS = ["a startup", "a product", "an MVP", "your vision"];
function Typewriter() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) { const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 1800); return () => clearTimeout(t); }
    const word = TYPEWRITER_WORDS[wordIdx];
    if (!deleting) {
      if (displayed.length < word.length) { const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 72); return () => clearTimeout(t); }
      else setPaused(true);
    } else {
      if (displayed.length > 0) { const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 38); return () => clearTimeout(t); }
      else { setDeleting(false); setWordIdx(i => (i + 1) % TYPEWRITER_WORDS.length); }
    }
  }, [displayed, deleting, paused, wordIdx]);
  return (
    <span style={{ color: "#a78bfa", position: "relative", display: "inline-block", minWidth: "4ch" }}>
      {displayed}
      <span style={{ display: "inline-block", width: 2, height: "0.85em", background: "#a78bfa", marginLeft: 3, verticalAlign: "middle", animation: "cursorBlink 1s step-end infinite", borderRadius: 2 }} />
    </span>
  );
}

// ─────────────────────────────────────────────
// COUNT-UP NUMBER
// ─────────────────────────────────────────────
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { ref, inView } = useInView(0.5);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const dur = 1400; const step = 16;
    const inc = target / (dur / step);
    const t = setInterval(() => {
      current += inc;
      if (current >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(current));
    }, step);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─────────────────────────────────────────────
// SHIMMER BADGE
// ─────────────────────────────────────────────
function ShimmerBadge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, fontSize: 12.5, fontWeight: 600, color: "#374151", background: "rgba(249,250,251,0.85)", border: "1px solid #e5e7eb", padding: "6px 14px 6px 10px", borderRadius: 100, backdropFilter: "blur(8px)", animation: "fadeUp 0.5s ease 0.05s both", position: "relative", overflow: "hidden" }}>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(167,139,250,0.25) 50%,transparent 70%)", animation: "shimmerSlide 3.5s ease-in-out infinite", borderRadius: 100, pointerEvents: "none" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SPOTLIGHT CARD
// ─────────────────────────────────────────────
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
      {spot && <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", left: spot.x - 150, top: spot.y - 150, pointerEvents: "none", zIndex: 0 }} />}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GRID CANVAS (CTA) with shooting stars
// ─────────────────────────────────────────────
function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number; let t = 0;
    const stars: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];
    const spawnStar = (W: number, H: number) => stars.push({ x: Math.random() * W * 0.5, y: Math.random() * H * 0.35, vx: 3 + Math.random() * 3, vy: 1.5 + Math.random() * 2, life: 0, maxLife: 50 + Math.random() * 40 });
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    let starTimer = 0;
    const draw = () => {
      t += 0.008; starTimer++;
      if (starTimer > 130) { starTimer = 0; spawnStar(canvas.width, canvas.height); }
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const COLS = 18, ROWS = 10, cellW = W / COLS, cellH = H / ROWS, cx = W / 2, cy = H / 2;
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const x = c * cellW, y = r * cellH, dx = (x - cx) / W, dy = (y - cy) / H;
          const dist = Math.sqrt(dx * dx + dy * dy), pulse = 0.5 + 0.5 * Math.sin(t * 2 - dist * 10);
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167,139,250,${pulse * 0.28 * (1 - dist * 0.8)})`; ctx.fill();
        }
      }
      for (let r = 0; r <= ROWS; r++) { const y = r * cellH; const dy = (y - cy) / H; const a = (0.5 + 0.5 * Math.sin(t - Math.abs(dy) * 8)) * 0.06; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.strokeStyle = `rgba(167,139,250,${a})`; ctx.lineWidth = 1; ctx.stroke(); }
      for (let c = 0; c <= COLS; c++) { const x = c * cellW; const dx = (x - cx) / W; const a = (0.5 + 0.5 * Math.sin(t - Math.abs(dx) * 8)) * 0.06; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.strokeStyle = `rgba(167,139,250,${a})`; ctx.lineWidth = 1; ctx.stroke(); }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.42);
      g.addColorStop(0, `rgba(124,58,237,${0.22 + 0.07 * Math.sin(t)})`);
      g.addColorStop(0.5, `rgba(79,70,229,${0.08 + 0.03 * Math.sin(t + 1)})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]; s.x += s.vx; s.y += s.vy; s.life++;
        const progress = s.life / s.maxLife;
        const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const gStar = ctx.createLinearGradient(s.x - s.vx * 8, s.y - s.vy * 8, s.x, s.y);
        gStar.addColorStop(0, "rgba(255,255,255,0)"); gStar.addColorStop(1, `rgba(200,180,255,${alpha * 0.8})`);
        ctx.beginPath(); ctx.moveTo(s.x - s.vx * 6, s.y - s.vy * 6); ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = gStar; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,200,255,${alpha * 0.9})`; ctx.fill();
        if (s.life >= s.maxLife || s.x > W || s.y > H) stars.splice(i, 1);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─────────────────────────────────────────────
// FLOATING WORDS (CTA)
// ─────────────────────────────────────────────
const FLOAT_WORDS = ["Blueprint", "Funded", "Shipped", "Roadmap", "Live", "Launched", "₹1Cr ARR", "Series A"];
function FloatingWords() {
  const [words, setWords] = useState<{ id: number; word: string; x: number; opacity: number; y: number }[]>([]);
  const counter = useRef(0);
  useEffect(() => {
    const spawn = () => {
      const id = counter.current++;
      const word = FLOAT_WORDS[Math.floor(Math.random() * FLOAT_WORDS.length)];
      const x = 8 + Math.random() * 84;
      setWords(w => [...w.slice(-8), { id, word, x, opacity: 0, y: 82 + Math.random() * 12 }]);
      setTimeout(() => setWords(w => w.map(p => p.id === id ? { ...p, opacity: 0.16, y: 25 + Math.random() * 20 } : p)), 60);
      setTimeout(() => setWords(w => w.map(p => p.id === id ? { ...p, opacity: 0 } : p)), 2300);
      setTimeout(() => setWords(w => w.filter(p => p.id !== id)), 2900);
    };
    const interval = setInterval(spawn, 1500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {words.map(w => (
        <span key={w.id} style={{ position: "absolute", left: `${w.x}%`, top: `${w.y}%`, opacity: w.opacity, fontSize: 10.5, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(167,139,250,1)", transition: "opacity 0.6s ease, top 2.2s ease", whiteSpace: "nowrap" }}>
          {w.word}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// HERO CANVAS BACKGROUND
// ─────────────────────────────────────────────
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number; let t = 0;

    // Particles
    const PARTICLE_COUNT = 55;
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string };
    const COLORS = ["rgba(139,92,246,", "rgba(99,102,241,", "rgba(167,139,250,", "rgba(147,197,253,", "rgba(196,181,253,"];
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.5 + Math.random() * 2.5,
        alpha: 0.15 + Math.random() * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.004;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Draw connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "rgba(139,92,246," + alpha + ")";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw and move particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + p.x * 0.01);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + (p.alpha * pulse) + ")";
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ─────────────────────────────────────────────
// MOUSE-TRACKING BLOBS
// ─────────────────────────────────────────────
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
      <div ref={blob1} style={{ position: "absolute", top: 0, left: 0, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.065) 0%,transparent 70%)", filter: "blur(40px)", willChange: "transform" }} />
      <div ref={blob2} style={{ position: "absolute", top: 0, left: 0, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.04) 0%,transparent 70%)", filter: "blur(60px)", willChange: "transform" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// 3D TILT WRAPPER
// ─────────────────────────────────────────────
function TiltWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (ref.current) ref.current.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg) scale(1.015)`;
  };
  const handleLeave = () => { if (ref.current) ref.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)"; };
  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ transition: "transform 0.4s ease", willChange: "transform" }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// PRO GLOW
// ─────────────────────────────────────────────
function ProGlow() {
  return <div style={{ position: "absolute", inset: -2, borderRadius: 18, zIndex: -1, animation: "proGlowPulse 3s ease-in-out infinite", pointerEvents: "none" }} />;
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const AGENTS = [
  { icon: "🚀", label: "Founder Agent", desc: "Blueprints, pitch decks, market analysis & funding strategy.", bg: "#f5f3ff" },
  { icon: "💰", label: "Sales Agent", desc: "CRM pipelines, cold email sequences & revenue projections.", bg: "#f0fdf4" },
  { icon: "📣", label: "Marketing Agent", desc: "Launch campaigns, ad copy, SEO strategy & content calendars.", bg: "#fff1f2" },
  { icon: "⚡", label: "Hacker Agent", desc: "Architecture, stack decisions, MVP scope & dev task breakdown.", bg: "#f0f9ff" },
];
const OUTPUTS = [
  { icon: "📐", label: "Blueprint", desc: "Product vision, core features & recommended tech stack" },
  { icon: "🗺", label: "Roadmap", desc: "Phase-by-phase execution plan with milestones & deliverables" },
  { icon: "⚡", label: "Prompt Packs", desc: "Ready-to-use AI prompts for every stage of your build" },
  { icon: "📊", label: "Feasibility Score", desc: "Strengths, risks & market opportunities with a confidence score" },
];
const STEPS = [
  { n: "1", title: "Describe your idea", body: "Plain English. Just tell Arteno what you want to build — no jargon needed.", icon: "✏️" },
  { n: "2", title: "Choose your mode", body: "Think for deep strategy and blueprints. Execute to deploy specialist agents. Switch anytime.", icon: "⚙️" },
  { n: "3", title: "Build immediately", body: "Your complete plan is ready. Pitch investors, hand it off to devs, or start shipping.", icon: "🚀" },
];
const PLANS = [
  { name: "Free", price: "₹0", note: "5 generations / month", cta: "Get started free", href: "/sign-up", features: ["Product Blueprint", "Execution Roadmap", "AI Prompt Packs", "Feasibility Score", "Save up to 5 projects"] },
  { name: "Pro", price: "₹1,699", note: "per month", cta: "Upgrade to Pro", href: "/sign-up", badge: "Most popular", features: ["Everything in Free", "Unlimited generations", "Priority AI generation", "Unlimited saved projects", "Early access to new features"] },
  { name: "Team", price: "₹2,499", note: "per month", cta: "Start team plan", href: "/sign-up", features: ["Everything in Pro", "Team collaboration workspace", "Admin & member controls", "Pooled generation credits"] },
];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function LandingPage() {
  const w = useWindowWidth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = w > 0 && w < 768;

  useEffect(() => {
    setMounted(true);
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ background: "#fff", color: "#111", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      <ScrollProgressBar />
      {!isMobile && <MouseBlobs />}

      {/* ── NAVBAR ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 18px" : "0 48px", background: scrolled ? "rgba(255,255,255,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent", transition: "all 0.3s ease" }}>
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <img src="/arteno.png" alt="Arteno" style={{ height: isMobile ? 24 : 27, width: "auto", maxWidth: 100, objectFit: "contain", display: "block" }} />
        </Link>
        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: 2, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <Link key={label} href={href} style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", textDecoration: "none", padding: "8px 14px", borderRadius: 8, transition: "all 0.15s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#111"; el.style.background = "#f5f5f5"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#6b7280"; el.style.background = "transparent"; }}>
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
          {!isMobile && (
            <Link href="/sign-in" style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", textDecoration: "none", padding: "8px 16px", borderRadius: 8, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#111"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
              Sign in
            </Link>
          )}
          <Link href="/sign-up" style={{ fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none", padding: "9px 20px", borderRadius: 100, background: "#0b172a", transition: "background 0.2s", whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#1a2d4a"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#0b172a"}>
            Get started
          </Link>
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "#111", marginLeft: 4, display: "flex", alignItems: "center" }}>
              {menuOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>}
            </button>
          )}
        </div>
      </header>

      {menuOpen && isMobile && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 99, background: "#fff", padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"], ["/sign-in", "Sign in"]].map(([href, label]) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ fontSize: 17, fontWeight: 500, color: "#374151", textDecoration: "none", padding: "16px 0", borderBottom: "1px solid #f3f4f6", display: "block" }}>{label}</Link>
          ))}
          <Link href="/sign-up" onClick={() => setMenuOpen(false)} style={{ marginTop: 24, padding: "14px 0", textAlign: "center", background: "#0b172a", color: "#fff", borderRadius: 100, fontSize: 15, fontWeight: 600, textDecoration: "none", display: "block" }}>Get started free →</Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ position: "relative", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#fafbff" }}>

        {/* ── DESKTOP: canvas + gradient mesh orbs ── */}
        {!isMobile && (
          <>
            <HeroCanvas />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
              <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.10) 40%, transparent 70%)", filter: "blur(60px)", animation: "blobDrift1 16s ease-in-out infinite" }} />
              <div style={{ position: "absolute", top: "-5%", right: "-12%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(67,56,202,0.08) 40%, transparent 70%)", filter: "blur(70px)", animation: "blobDrift2 20s ease-in-out infinite" }} />
              <div style={{ position: "absolute", bottom: "5%", left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(147,197,253,0.16) 0%, rgba(96,165,250,0.07) 40%, transparent 70%)", filter: "blur(80px)", animation: "blobDrift3 24s ease-in-out infinite" }} />
              <div style={{ position: "absolute", bottom: "-10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,121,249,0.12) 0%, transparent 70%)", filter: "blur(70px)", animation: "blobDrift1 19s ease-in-out infinite reverse" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.10) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 100% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03, pointerEvents: "none" }}>
                <filter id="heroNoise"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
                <rect width="100%" height="100%" filter="url(#heroNoise)" />
              </svg>
            </div>
          </>
        )}

        {/* ── MOBILE: accent strip + dot grid ── */}
        {isMobile && (
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
            {/* Top accent strip — lavender tint covering ~45% */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, #ede9fe 0%, #f5f3ff 60%, transparent 100%)" }} />
            {/* Curved wave divider SVG */}
            <svg viewBox="0 0 390 60" preserveAspectRatio="none" style={{ position: "absolute", top: "calc(45% - 59px)", left: 0, width: "100%", height: 60, display: "block" }}>
              <path d="M0,0 C100,60 290,0 390,40 L390,60 L0,60 Z" fill="#f5f3ff" opacity="0.6" />
              <path d="M0,20 C120,70 270,10 390,50 L390,60 L0,60 Z" fill="white" />
            </svg>
            {/* CSS dot grid — pure CSS, zero canvas cost */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.18) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
              WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
            }} />
            {/* Soft violet glow center-top */}
            <div style={{ position: "absolute", top: "-5%", left: "50%", transform: "translateX(-50%)", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)", filter: "blur(40px)" }} />
          </div>
        )}

        {/* HERO TEXT CONTENT */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 860, padding: isMobile ? "110px 24px 56px" : "60px 48px 0", width: "100%" }}>
          <ShimmerBadge>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulseGreen 2s ease-in-out infinite" }} />
            AI Startup Operating System
          </ShimmerBadge>

          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(40px,10vw,54px)" : "clamp(56px,6vw,84px)", fontWeight: 400, lineHeight: 1.04, letterSpacing: "-2px", color: "#0b0f1a", maxWidth: 860, marginBottom: 24, animation: "fadeUp 0.55s ease 0.1s both" }}>
            Turn your idea into{" "}<Typewriter /><br />— in seconds.
          </h1>

          <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 400, lineHeight: 1.75, color: "#4b5563", maxWidth: 480, marginBottom: 40, animation: "fadeUp 0.55s ease 0.18s both" }}>
            Arteno is an AI co-founder that generates investor-ready blueprints, execution roadmaps, and deploys specialist agents — from a single prompt.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 24, animation: "fadeUp 0.55s ease 0.25s both" }}>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "#0b172a", color: "#fff", borderRadius: 100, fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 24px rgba(11,23,42,0.28)", transition: "all 0.25s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 10px 32px rgba(11,23,42,0.32),0 0 0 4px rgba(139,92,246,0.15)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 4px 24px rgba(11,23,42,0.28)"; }}>
              Start building free →
            </Link>
            <Link href="/sign-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", background: "rgba(255,255,255,0.75)", color: "#374151", borderRadius: 100, fontSize: 15, fontWeight: 500, textDecoration: "none", border: "1px solid rgba(0,0,0,0.09)", backdropFilter: "blur(12px)", transition: "all 0.2s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.95)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.75)"; }}>
              Sign in
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.55s ease 0.32s both" }}>
            {["Free plan included", "No credit card required", "Ready in 30 seconds"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* FLOATING DASHBOARD + CARDS */}
        {!isMobile && (
          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1100, padding: "48px 48px 80px", animation: "fadeUp 0.7s ease 0.45s both" }}>
            <TiltWrapper>
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 32px 100px rgba(0,0,0,0.10), 0 8px 32px rgba(139,92,246,0.08)", background: "#fff" }}>
                <div style={{ height: 46, background: "linear-gradient(180deg,#f9fafb,#f3f4f6)", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 18px", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>{["#f87171", "#fbbf24", "#34d399"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}</div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7, padding: "4px 24px", fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      arteno.in/dashboard
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", height: 400 }}>
                  <div style={{ width: 230, borderRight: "1px solid #f3f4f6", background: "linear-gradient(180deg,#fafafa,#faf8ff)", padding: "22px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#c4b5fd", marginBottom: 12, padding: "0 8px" }}>Think Mode</div>
                    {[["Dashboard", true], ["Projects", false], ["Blueprint", false], ["Roadmap", false]].map(([lbl, active]) => (
                      <div key={String(lbl)} style={{ padding: "9px 12px", borderRadius: 9, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#111" : "#9ca3af", background: active ? "#fff" : "transparent", border: "1px solid " + (active ? "#ede9fe" : "transparent"), boxShadow: active ? "0 1px 4px rgba(124,58,237,0.08)" : "none", display: "flex", alignItems: "center", gap: 8 }}>
                        {String(lbl)}
                      </div>
                    ))}
                    <div style={{ marginTop: "auto", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>Pro plan</div>
                      <div style={{ fontSize: 11, color: "#a78bfa" }}>Unlimited generations</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: "28px 36px", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 6px rgba(124,58,237,0.6)" }} />
                          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#7c3aed" }}>Think Mode Active</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#0b0f1a", letterSpacing: "-0.5px" }}>What are we building today?</div>
                      </div>
                      <div style={{ padding: "6px 14px", borderRadius: 100, background: "#f5f3ff", border: "1px solid #ede9fe", fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>New idea +</div>
                    </div>
                    <div style={{ padding: "14px 18px", borderRadius: 12, border: "1px solid #e5e7eb", background: "linear-gradient(135deg,#fafafa,#f9f8ff)", marginBottom: 22, fontSize: 13.5, color: "#6b7280", fontStyle: "italic" }}>
                      "I want to build an AI-powered support agent for SaaS companies..."
                    </div>
                    <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #f0f0f0", marginBottom: 22 }}>
                      {["Blueprint", "Roadmap", "Prompts", "Feasibility"].map((tab, ti) => (
                        <div key={tab} style={{ padding: "8px 16px", fontSize: 13, fontWeight: ti === 0 ? 600 : 400, color: ti === 0 ? "#7c3aed" : "#9ca3af", borderBottom: ti === 0 ? "2px solid #7c3aed" : "2px solid transparent", marginBottom: -2 }}>{tab}</div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[["Product Vision", "72%", "#7c3aed"], ["Core Features", "58%", "#6366f1"], ["Market Analysis", "85%", "#059669"], ["Tech Stack", "44%", "#ea580c"]].map(([lbl, pct, col]) => (
                        <div key={String(lbl)} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ fontSize: 12, color: "#6b7280", width: 110, flexShrink: 0, fontWeight: 500 }}>{String(lbl)}</div>
                          <div style={{ flex: 1, height: 7, background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ width: pct, height: "100%", background: "linear-gradient(90deg," + col + "," + col + "88)", borderRadius: 10 }} />
                          </div>
                          <div style={{ fontSize: 12, color: col, width: 36, textAlign: "right", fontWeight: 700 }}>{pct}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TiltWrapper>

            {/* Floating mini cards */}
            <div style={{ position: "absolute", top: 28, left: 8, animation: "floatCard1 6s ease-in-out infinite", zIndex: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 14, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📐</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>Blueprint ready</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Generated in 18s</div>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", top: 56, right: 8, animation: "floatCard2 7s ease-in-out infinite", zIndex: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#059669,#34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚀</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>4 agents deployed</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Execute mode active</div>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: 60, left: 56, animation: "floatCard1 8s ease-in-out infinite 1.2s", zIndex: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", border: "1px solid rgba(234,88,12,0.15)", borderRadius: 14, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18 }}>📊</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>Feasibility: 87%</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Strong market fit</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2, animation: "fadeUp 0.55s ease 0.6s both" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#c4b5fd" }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: "linear-gradient(180deg,#c4b5fd,transparent)", animation: "scrollPulse 1.8s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
        <Reveal>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "32px 24px" : "40px 48px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 28 : 0 }}>
            {[
              { val: 500, suf: "+", label: "Ideas built" },
              { val: 4, suf: "", label: "Outputs per idea" },
              { val: 30, suf: "s", label: "Generation time" },
              { val: null, label: "To get started" },
            ].map(({ val, suf, label }, i) => (
              <div key={label} style={{ textAlign: "center", padding: isMobile ? 0 : "0 24px", borderRight: !isMobile && i < 3 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 34 : 44, fontWeight: 400, color: "#111", lineHeight: 1, marginBottom: 6 }}>
                  {val !== null ? <CountUp target={val} suffix={suf} /> : "Free"}
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── MODES ── */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "72px 24px" : "96px 48px" }}>
        <Reveal>
          <div style={{ marginBottom: isMobile ? 48 : 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>Two modes</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(30px,7vw,42px)" : "clamp(36px,3.8vw,52px)", fontWeight: 400, letterSpacing: "-1px", color: "#111", lineHeight: 1.1, marginBottom: 14, maxWidth: 560 }}>
              Think it. <em style={{ color: "#9ca3af" }}>Then build it.</em>
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, maxWidth: 480 }}>Strategy and execution, unified. Start with a deep blueprint, then deploy your agent team to execute it.</p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, alignItems: "stretch" }}>
          <Reveal delay={0} stretch>
            <SpotlightCard style={{ padding: isMobile ? "32px 24px" : "40px 36px", borderRadius: 16, border: "1px solid #e5e7eb", background: "#fafafa", height: "100%", transition: "box-shadow 0.25s, border-color 0.25s" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 100, background: "#f5f3ff", border: "1px solid #ede9fe", marginBottom: 24, alignSelf: "flex-start" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>Think Mode</span>
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 34, fontWeight: 400, letterSpacing: "-0.7px", color: "#111", marginBottom: 10, lineHeight: 1.1 }}>Your AI co-founder.</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>Turns raw ideas into investor-ready blueprints, roadmaps, and pitch decks. Deep strategy, fast.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, flex: 1 }}>
                {OUTPUTS.map(o => (
                  <div key={o.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #f3f4f6", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.15)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#f3f4f6"}>
                    <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{o.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>{o.label}</div>
                      <div style={{ fontSize: 12.5, color: "#9ca3af", lineHeight: 1.5 }}>{o.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 100, background: "#7c3aed", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#6d28d9"; el.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#7c3aed"; el.style.transform = "translateY(0)"; }}>
                Start thinking →
              </Link>
            </SpotlightCard>
          </Reveal>

          <Reveal delay={80} stretch>
            <SpotlightCard style={{ padding: isMobile ? "32px 24px" : "40px 36px", borderRadius: 16, border: "1px solid #e5e7eb", background: "#fafafa", height: "100%", transition: "box-shadow 0.25s, border-color 0.25s" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 100, background: "#fff7ed", border: "1px solid #fed7aa", marginBottom: 24, alignSelf: "flex-start" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ea580c" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ea580c" }}>Execute Mode</span>
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 34, fontWeight: 400, letterSpacing: "-0.7px", color: "#111", marginBottom: 10, lineHeight: 1.1 }}>Your full agent team.</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>Four specialist agents deploy simultaneously — writing, selling, marketing, and building in parallel.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32, flex: 1, alignContent: "start" }}>
                {AGENTS.map((a, ai) => (
                  <div key={a.label} style={{ padding: "16px 14px", borderRadius: 12, background: "#fff", border: "1px solid #f3f4f6", transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px) scale(1.02)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0) scale(1)"; el.style.boxShadow = "none"; }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10, animation: `iconBounce 0.5s ease ${ai * 120 + 200}ms both` }}>{a.icon}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111", marginBottom: 4 }}>{a.label}</div>
                    <div style={{ fontSize: 11.5, color: "#9ca3af", lineHeight: 1.5 }}>{a.desc}</div>
                  </div>
                ))}
              </div>
              <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 100, background: "#ea580c", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#c2410c"; el.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#ea580c"; el.style.transform = "translateY(0)"; }}>
                Deploy agents →
              </Link>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "#fafafa", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "72px 24px" : "96px 48px" }}>
          <Reveal>
            <div style={{ marginBottom: isMobile ? 48 : 60 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>How it works</p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(30px,7vw,42px)" : "clamp(36px,3.8vw,52px)", fontWeight: 400, letterSpacing: "-1px", color: "#111", lineHeight: 1.1, maxWidth: 440 }}>
                Three steps to your first version.
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, alignItems: "stretch", position: "relative" }}>
            {/* Animated connecting dashes */}
            {!isMobile && (
              <div style={{ position: "absolute", top: "50%", left: "calc(33.33% + 8px)", right: "calc(33.33% + 8px)", height: 1, zIndex: 0, overflow: "hidden" }}>
                <div style={{ height: "100%", backgroundImage: "linear-gradient(90deg,#d1d5db 50%,transparent 50%)", backgroundSize: "12px 1px", animation: "dashMove 1.2s linear infinite", opacity: 0.7 }} />
              </div>
            )}
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100} stretch>
                <div style={{ padding: isMobile ? "28px 24px" : "32px 28px", borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", position: "relative", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", transition: "transform 0.25s, box-shadow 0.25s", zIndex: 1 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 16px 48px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>
                  <div style={{ position: "absolute", top: 14, right: 16, fontFamily: "'DM Serif Display', serif", fontSize: 80, fontWeight: 400, color: "rgba(124,58,237,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>{s.n}</div>
                  <div style={{ fontSize: 30, marginBottom: 18 }}>{s.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8, letterSpacing: "-0.2px" }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, flex: 1 }}>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "72px 24px" : "96px 48px" }}>
        <Reveal>
          <div style={{ marginBottom: isMobile ? 48 : 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>Pricing</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(30px,7vw,42px)" : "clamp(36px,3.8vw,52px)", fontWeight: 400, letterSpacing: "-1px", color: "#111", lineHeight: 1.1, marginBottom: 12, maxWidth: 400 }}>
              Start free. Scale when ready.
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7 }}>No credit card required to get started.</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, alignItems: "stretch" }}>
          {PLANS.map((plan, i) => {
            const isPro = plan.name === "Pro";
            return (
              <Reveal key={plan.name} delay={i * 80} stretch>
                <div style={{ padding: isMobile ? "28px 24px" : "36px 32px", borderRadius: 16, border: isPro ? "2px solid #0b172a" : "1px solid #e5e7eb", background: isPro ? "#0b172a" : "#fff", position: "relative", display: "flex", flexDirection: "column", height: "100%", transition: "transform 0.25s, box-shadow 0.25s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = isPro ? "0 20px 60px rgba(11,23,42,0.3),0 0 0 1px rgba(139,92,246,0.2)" : "0 12px 40px rgba(0,0,0,0.07)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>
                  {isPro && <ProGlow />}
                  {plan.badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#0b172a", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap" }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: isPro ? "rgba(255,255,255,0.45)" : "#9ca3af", marginBottom: 20 }}>{plan.name}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, fontWeight: 400, color: isPro ? "#fff" : "#111", lineHeight: 1, marginBottom: 4 }}>{plan.price}</div>
                  <div style={{ fontSize: 13, color: isPro ? "rgba(255,255,255,0.35)" : "#9ca3af", marginBottom: 28 }}>{plan.note}</div>
                  <Link href={plan.href} style={{ display: "block", textAlign: "center", padding: "12px 0", borderRadius: 100, textDecoration: "none", marginBottom: 28, fontSize: 14, fontWeight: 700, background: isPro ? "#fff" : "#0b172a", color: isPro ? "#0b172a" : "#fff", transition: "opacity 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                    {plan.cta}
                  </Link>
                  <div style={{ height: 1, background: isPro ? "rgba(255,255,255,0.08)" : "#f3f4f6", marginBottom: 24 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>
                    {plan.features.map((f, fi) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0, animation: `featureStagger 0.4s ease ${fi * 60 + 100}ms forwards` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isPro ? "rgba(255,255,255,0.4)" : "#22c55e"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <span style={{ fontSize: 13.5, color: isPro ? "rgba(255,255,255,0.65)" : "#374151" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: "#0b172a", position: "relative", overflow: "hidden" }}>
        <GridCanvas />
        <FloatingWords />
        <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none", zIndex: 1 }}>
          <filter id="ctaNoise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#ctaNoise)" />
        </svg>
        <Reveal>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "72px 24px" : "96px 48px", textAlign: "center", position: "relative", zIndex: 2 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? "clamp(32px,8vw,48px)" : "clamp(40px,4.5vw,60px)", fontWeight: 400, letterSpacing: "-1.5px", color: "#fff", lineHeight: 1.06, marginBottom: 16 }}>
              Your startup is one prompt away.
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 36, maxWidth: 380, margin: "0 auto 36px" }}>
              Join builders already using Arteno to plan and launch faster.
            </p>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 36px", background: "#fff", color: "#0b172a", borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", transition: "all 0.2s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.35)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)"; }}>
              Start building for free →
            </Link>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", marginTop: 14 }}>No credit card required</p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #f3f4f6", padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "#051329ff" }}>© {new Date().getFullYear()} Arteno. Built with ❤️</p>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobDrift1 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(40px,-30px) scale(1.06);} 66%{transform:translate(-20px,20px) scale(0.96);} }
        @keyframes blobDrift2 { 0%,100%{transform:translate(0,0) scale(1);} 40%{transform:translate(-50px,30px) scale(1.08);} 70%{transform:translate(30px,-20px) scale(0.94);} }
        @keyframes blobDrift3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(20px,-40px) scale(1.05);} }
        @keyframes cursorBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4);} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0);} }
        @keyframes shimmerSlide { 0%{transform:translateX(-120%);} 60%,100%{transform:translateX(120%);} }
        @keyframes scrollPulse { 0%,100%{opacity:0.3; transform:scaleY(1);} 50%{opacity:1; transform:scaleY(1.25);} }
        @keyframes iconBounce { 0%{opacity:0; transform:translateY(8px) scale(0.8);} 60%{transform:translateY(-3px) scale(1.1);} 100%{opacity:1; transform:translateY(0) scale(1);} }
        @keyframes dashMove { from{background-position:0 0;} to{background-position:24px 0;} }
        @keyframes featureStagger { from{opacity:0; transform:translateX(-6px);} to{opacity:1; transform:translateX(0);} }
        @keyframes proGlowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0);} 50%{box-shadow:0 0 28px 6px rgba(139,92,246,0.18);} }
        @keyframes floatCard1 { 0%,100%{transform:translateY(0px) rotate(-0.5deg);} 50%{transform:translateY(-10px) rotate(0.5deg);} }
        @keyframes floatCard2 { 0%,100%{transform:translateY(0px) rotate(0.5deg);} 50%{transform:translateY(-14px) rotate(-0.5deg);} }
        @keyframes barGrow { from{width:0;} }
      `}</style>
    </div>
  );
}