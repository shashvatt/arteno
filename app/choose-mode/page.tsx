"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

const THINK_FEATURES = ["Blueprint Generator", "Investor Roadmap", "Feasibility Score", "Pitch Deck Prompts"];
const EXECUTE_FEATURES = ["Founder Agent", "Sales Agent", "Marketing Agent", "Hacker Agent", "Build My Startup"];

export default function ChooseModePage() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const w = useWindowWidth();
    const isMobile = w > 0 && w < 768;

    const [selected, setSelected] = useState<"think" | "execute" | null>(null);
    const [activeCard, setActiveCard] = useState<0 | 1>(0); // 0=think, 1=execute
    const [loading, setLoading] = useState(false);
    const [hovering, setHovering] = useState<"think" | "execute" | null>(null);
    const [mounted, setMounted] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const isDragHoriz = useRef<boolean | null>(null);

    useEffect(() => {
        setMounted(true);
        const checkExistingMode = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/sign-in"); return; }
            const { data } = await supabase
                .from("user_preferences")
                .select("mode")
                .eq("user_id", user.id)
                .single();
            if (data?.mode) router.push("/dashboard");
        };
        checkExistingMode();
    }, []);

    const handleContinue = async () => {
        if (!selected) return;
        setLoading(true);
        setSaveError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/sign-in"); return; }
            const { error } = await supabase
                .from("user_preferences")
                .upsert(
                    { user_id: user.id, mode: selected, updated_at: new Date().toISOString() },
                    { onConflict: "user_id" }
                );
            if (error) { setSaveError("Failed to save your mode. Please try again."); return; }
            router.refresh();
            router.push("/dashboard");
        } catch {
            setSaveError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Touch handlers ──
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isDragHoriz.current = null;
        setDragging(true);
        setDragOffset(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;

        if (isDragHoriz.current === null) {
            isDragHoriz.current = Math.abs(dx) > Math.abs(dy);
        }
        if (!isDragHoriz.current) return;

        // Resist at edges
        if ((activeCard === 0 && dx > 0) || (activeCard === 1 && dx < 0)) {
            setDragOffset(dx * 0.18);
        } else {
            setDragOffset(dx);
        }
    };

    const onTouchEnd = () => {
        setDragging(false);
        if (!isDragHoriz.current) { setDragOffset(0); return; }
        const threshold = w * 0.28;
        if (dragOffset < -threshold && activeCard === 0) {
            setActiveCard(1);
        } else if (dragOffset > threshold && activeCard === 1) {
            setActiveCard(0);
        }
        setDragOffset(0);
    };

    const currentMode = activeCard === 0 ? "think" : "execute";

    if (!mounted) return null;

    const thinkActive = hovering === "think" || selected === "think";
    const executeActive = hovering === "execute" || selected === "execute";

    // ────────────────────────────────────────────
    // MOBILE LAYOUT
    // ────────────────────────────────────────────
    if (isMobile) {
        const isThink = activeCard === 0;
        const accentColor = isThink ? "#8b5cf6" : "#fb923c";
        const accentGlow = isThink ? "rgba(139,92,246,0.22)" : "rgba(251,146,60,0.18)";
        const accentBorder = isThink ? "rgba(139,92,246,0.3)" : "rgba(251,146,60,0.28)";
        const accentBg = isThink ? "rgba(139,92,246,0.08)" : "rgba(251,146,60,0.07)";
        const titleColor = isThink ? "#e2d9f3" : "#fde8d4";
        const features = isThink ? THINK_FEATURES : EXECUTE_FEATURES;
        const cardMode = isThink ? "think" : "execute";
        const modeLabel = isThink ? "Mode 01" : "Mode 02";
        const modeTitle = isThink ? "Think" : "Execute";
        const modeDesc = isThink
            ? "Your AI co-founder. Deep strategic thinking — turns your raw idea into a complete venture blueprint."
            : "Deploy your full agent team. Specialists that write, sell, build, and ship — working in parallel.";

        // Translate for swipe
        const translateX = -activeCard * 100 + (dragOffset / w) * 100;

        return (
            <div style={{
                minHeight: "100vh", maxHeight: "100dvh",
                background: "#080808",
                display: "flex", flexDirection: "column",
                overflow: "hidden", position: "relative",
                fontFamily: "'Syne', sans-serif",
            }}>
                <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />

                {/* Ambient glow — transitions with card */}
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                    transition: "opacity 0.8s ease",
                }}>
                    <div style={{
                        position: "absolute", top: "-20%", left: "-20%", width: "140%", height: "70%",
                        borderRadius: "50%", filter: "blur(90px)",
                        background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
                        transition: "background 0.8s ease",
                    }} />
                </div>

                {/* Top bar */}
                <div style={{ position: "relative", zIndex: 10, padding: "52px 24px 0", textAlign: "center", animation: "fadeUp 0.7s ease 0.05s both" }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, fontWeight: 300, letterSpacing: 6, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Arteno</p>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,8vw,38px)", fontWeight: 300, color: "#fff", lineHeight: 1.15, letterSpacing: -0.5 }}>
                        How do you want<br />
                        <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.45)" }}>to work today?</em>
                    </h1>
                    <p style={{ marginTop: 10, fontSize: 11, fontWeight: 400, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                        Swipe to switch modes
                    </p>
                </div>

                {/* Swipe container */}
                <div
                    style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 5, overflow: "hidden", marginTop: 28 }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Cards track */}
                    <div style={{
                        display: "flex", flex: 1,
                        transform: `translateX(${translateX}%)`,
                        transition: dragging ? "none" : "transform 0.45s cubic-bezier(0.25,1,0.5,1)",
                        willChange: "transform",
                    }}>
                        {/* THINK card */}
                        <div style={{ minWidth: "100%", padding: "0 20px 20px", display: "flex", flexDirection: "column" }}>
                            <div
                                onClick={() => setSelected("think")}
                                style={{
                                    flex: 1, borderRadius: 24, padding: "36px 28px 32px",
                                    background: selected === "think" ? "rgba(139,92,246,0.10)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${selected === "think" ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.08)"}`,
                                    position: "relative", overflow: "hidden", cursor: "pointer",
                                    transition: "border-color 0.3s, background 0.3s",
                                    display: "flex", flexDirection: "column",
                                }}>
                                {/* Inner glow */}
                                <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.14) 0%, transparent 65%)", opacity: selected === "think" ? 1 : 0.5, transition: "opacity 0.4s", pointerEvents: "none" }} />

                                {/* Checkmark */}
                                <div style={{ position: "absolute", top: 20, right: 20, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", opacity: selected === "think" ? 1 : 0, transform: selected === "think" ? "scale(1)" : "scale(0.5)", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>

                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "rgba(139,92,246,0.75)", position: "relative" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", animation: "modePulse 2s ease-in-out infinite" }} />
                                    Mode 01
                                </div>

                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(56px,16vw,80px)", fontWeight: 300, lineHeight: 0.85, letterSpacing: -3, marginBottom: 20, color: "#e2d9f3", position: "relative" }}>
                                    Think
                                </div>

                                <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: 28, position: "relative" }}>
                                    Your AI co-founder. Deep strategic thinking — turns your raw idea into a complete venture blueprint.
                                </p>

                                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, position: "relative", flex: 1 }}>
                                    {THINK_FEATURES.map((f, fi) => (
                                        <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: selected === "think" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)", textTransform: "uppercase", transition: "color 0.3s", animation: `featureIn 0.4s ease ${fi * 50 + 100}ms both` }}>
                                            <span style={{ width: 18, height: 1, background: "rgba(139,92,246,0.6)", flexShrink: 0 }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* Tap to select hint */}
                                {selected !== "think" && (
                                    <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center" }}>
                                        Tap to select
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* EXECUTE card */}
                        <div style={{ minWidth: "100%", padding: "0 20px 20px", display: "flex", flexDirection: "column" }}>
                            <div
                                onClick={() => setSelected("execute")}
                                style={{
                                    flex: 1, borderRadius: 24, padding: "36px 28px 32px",
                                    background: selected === "execute" ? "rgba(251,146,60,0.08)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${selected === "execute" ? "rgba(251,146,60,0.32)" : "rgba(255,255,255,0.08)"}`,
                                    position: "relative", overflow: "hidden", cursor: "pointer",
                                    transition: "border-color 0.3s, background 0.3s",
                                    display: "flex", flexDirection: "column",
                                }}>
                                <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "radial-gradient(ellipse at 70% 20%, rgba(251,146,60,0.12) 0%, transparent 65%)", opacity: selected === "execute" ? 1 : 0.5, transition: "opacity 0.4s", pointerEvents: "none" }} />

                                <div style={{ position: "absolute", top: 20, right: 20, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.38)", opacity: selected === "execute" ? 1 : 0, transform: selected === "execute" ? "scale(1)" : "scale(0.5)", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>

                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "rgba(251,146,60,0.75)", position: "relative" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fb923c", animation: "modePulse 2s ease-in-out infinite 0.5s" }} />
                                    Mode 02
                                </div>

                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(52px,14vw,76px)", fontWeight: 300, lineHeight: 0.85, letterSpacing: -2, marginBottom: 20, color: "#fde8d4", position: "relative" }}>
                                    Execute
                                </div>

                                <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: 28, position: "relative" }}>
                                    Deploy your full agent team. Specialists that write, sell, build, and ship — working in parallel.
                                </p>

                                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, position: "relative", flex: 1 }}>
                                    {EXECUTE_FEATURES.map((f, fi) => (
                                        <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: selected === "execute" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)", textTransform: "uppercase", transition: "color 0.3s", animation: `featureIn 0.4s ease ${fi * 50 + 100}ms both` }}>
                                            <span style={{ width: 18, height: 1, background: "rgba(251,146,60,0.6)", flexShrink: 0 }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {selected !== "execute" && (
                                    <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center" }}>
                                        Tap to select
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom dock — dots + CTA */}
                <div style={{ position: "relative", zIndex: 10, padding: "16px 24px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, background: "linear-gradient(0deg,#080808 60%,transparent)" }}>

                    {/* Dot indicators */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {[0, 1].map(i => (
                            <button key={i} onClick={() => setActiveCard(i as 0 | 1)}
                                style={{ width: activeCard === i ? 24 : 6, height: 6, borderRadius: 100, border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)", background: activeCard === i ? (i === 0 ? "#8b5cf6" : "#fb923c") : "rgba(255,255,255,0.15)" }} />
                        ))}
                    </div>

                    {/* Mode label */}
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: activeCard === 0 ? "rgba(139,92,246,0.6)" : "rgba(251,146,60,0.6)", transition: "color 0.4s" }}>
                        {activeCard === 0 ? "← Think Mode" : "Execute Mode →"}
                    </div>

                    {/* CTA button */}
                    <button
                        onClick={() => {
                            if (!selected) {
                                // Auto-select visible card and continue
                                setSelected(currentMode);
                                setTimeout(handleContinue, 50);
                            } else {
                                handleContinue();
                            }
                        }}
                        disabled={loading}
                        style={{
                            width: "100%", padding: "16px 0", borderRadius: 100, border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700,
                            letterSpacing: 2, textTransform: "uppercase",
                            transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                            background: selected
                                ? selected === "think"
                                    ? "linear-gradient(135deg,#7c3aed,#8b5cf6)"
                                    : "linear-gradient(135deg,#c2410c,#fb923c)"
                                : activeCard === 0
                                    ? "linear-gradient(135deg,#7c3aed,#8b5cf6)"
                                    : "linear-gradient(135deg,#c2410c,#fb923c)",
                            color: "#fff",
                            boxShadow: (selected || true)
                                ? activeCard === 0
                                    ? "0 0 32px rgba(139,92,246,0.35), 0 6px 24px rgba(0,0,0,0.5)"
                                    : "0 0 32px rgba(251,146,60,0.3), 0 6px 24px rgba(0,0,0,0.5)"
                                : "none",
                        }}
                    >
                        {loading ? "Entering..." : selected
                            ? `Enter ${selected === "think" ? "Think" : "Execute"} Mode →`
                            : `Select ${activeCard === 0 ? "Think" : "Execute"} Mode →`}
                    </button>

                    {saveError && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>⚠ {saveError}</p>}

                    {selected && (
                        <p style={{ fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>
                            {selected === "think" ? "Strategic mode — Co-Founder AI awaits" : "Execution mode — Your agents are ready"}
                        </p>
                    )}
                </div>

                <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
          @keyframes modePulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(1.5);} }
          @keyframes featureIn { from{opacity:0;transform:translateX(-8px);} to{opacity:1;transform:translateX(0);} }
        `}</style>
            </div>
        );
    }

    // ────────────────────────────────────────────
    // DESKTOP LAYOUT — exactly as original
    // ────────────────────────────────────────────
    return (
        <div style={{
            minHeight: "100vh", background: "#080808",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden", fontFamily: "'Syne', sans-serif",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />

            {/* Ambient orbs */}
            <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none", width: 600, height: 600, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", left: -100, top: -100, opacity: thinkActive ? 1 : 0.5, transform: thinkActive ? "scale(1.4)" : "scale(1)", transition: "all 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
            <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none", width: 600, height: 600, background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)", right: -100, bottom: -100, opacity: executeActive ? 1 : 0.5, transform: executeActive ? "scale(1.4)" : "scale(1)", transition: "all 1.2s cubic-bezier(0.16,1,0.3,1)" }} />

            {/* Header */}
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", marginBottom: 64, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 300, letterSpacing: 6, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 32 }}>Arteno</p>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 300, color: "#fff", lineHeight: 1.1, letterSpacing: -0.5 }}>
                    How do you want<br />
                    <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)" }}>to work today?</em>
                </h1>
                <p style={{ marginTop: 14, fontSize: 13, fontWeight: 400, letterSpacing: 1, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Choose your mode — you can switch anytime</p>
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: "min(900px, 90vw)", position: "relative", zIndex: 10, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}>
                {/* THINK */}
                <div onClick={() => setSelected("think")} onMouseEnter={() => setHovering("think")} onMouseLeave={() => setHovering(null)}
                    style={{ position: "relative", padding: "52px 48px 44px", cursor: "pointer", overflow: "hidden", borderRadius: "24px 0 0 24px", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)", background: selected === "think" ? "rgba(139,92,246,0.08)" : hovering === "think" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${selected === "think" ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`, borderRight: "none" }}>
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", background: "radial-gradient(ellipse at 30% 30%, rgba(139,92,246,0.12) 0%, transparent 60%)", opacity: selected === "think" || hovering === "think" ? 1 : 0, transition: "opacity 0.6s ease" }} />
                    <div style={{ position: "absolute", top: 28, right: 28, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", opacity: selected === "think" ? 1 : 0, transform: selected === "think" ? "scale(1)" : "scale(0.6)", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, color: "rgba(139,92,246,0.7)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0 }} />Mode 01
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(42px,6vw,72px)", fontWeight: 300, lineHeight: 0.9, letterSpacing: -2, marginBottom: 28, color: "#e2d9f3" }}>Think</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", marginBottom: 36, maxWidth: 280 }}>Your AI co-founder. Deep strategic thinking — turns your raw idea into a complete venture blueprint.</p>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                        {THINK_FEATURES.map(f => (
                            <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: selected === "think" || hovering === "think" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)", textTransform: "uppercase", transition: "color 0.3s ease" }}>
                                <span style={{ width: 20, height: 1, background: "rgba(139,92,246,0.5)", flexShrink: 0 }} />{f}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* EXECUTE */}
                <div onClick={() => setSelected("execute")} onMouseEnter={() => setHovering("execute")} onMouseLeave={() => setHovering(null)}
                    style={{ position: "relative", padding: "52px 48px 44px", cursor: "pointer", overflow: "hidden", borderRadius: "0 24px 24px 0", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)", background: selected === "execute" ? "rgba(251,146,60,0.06)" : hovering === "execute" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${selected === "execute" ? "rgba(251,146,60,0.25)" : "rgba(255,255,255,0.06)"}`, borderLeft: "none" }}>
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", background: "radial-gradient(ellipse at 70% 30%, rgba(251,146,60,0.10) 0%, transparent 60%)", opacity: selected === "execute" || hovering === "execute" ? 1 : 0, transition: "opacity 0.6s ease" }} />
                    <div style={{ position: "absolute", top: 28, right: 28, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.35)", opacity: selected === "execute" ? 1 : 0, transform: selected === "execute" ? "scale(1)" : "scale(0.6)", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, color: "rgba(251,146,60,0.7)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fb923c", flexShrink: 0 }} />Mode 02
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(42px,6vw,72px)", fontWeight: 300, lineHeight: 0.9, letterSpacing: -2, marginBottom: 28, color: "#fde8d4" }}>Execute</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", marginBottom: 36, maxWidth: 280 }}>Deploy your full agent team. Specialists that write, sell, build, and ship — working in parallel.</p>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                        {EXECUTE_FEATURES.map(f => (
                            <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: selected === "execute" || hovering === "execute" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)", textTransform: "uppercase", transition: "color 0.3s ease" }}>
                                <span style={{ width: 20, height: 1, background: "rgba(251,146,60,0.5)", flexShrink: 0 }} />{f}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: 36, position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}>
                <button onClick={handleContinue} disabled={!selected || loading}
                    style={{ padding: "16px 52px", borderRadius: 100, border: "none", cursor: selected && !loading ? "pointer" : "not-allowed", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", opacity: !selected ? 0.25 : 1, background: !selected ? "rgba(255,255,255,0.08)" : selected === "think" ? "linear-gradient(135deg,#7c3aed,#8b5cf6)" : "linear-gradient(135deg,#c2410c,#fb923c)", color: !selected ? "rgba(255,255,255,0.4)" : "#fff", boxShadow: selected === "think" ? "0 0 40px rgba(139,92,246,0.35),0 8px 32px rgba(0,0,0,0.4)" : selected === "execute" ? "0 0 40px rgba(251,146,60,0.3),0 8px 32px rgba(0,0,0,0.4)" : "none" }}>
                    {loading ? "Entering..." : selected ? `Enter ${selected === "think" ? "Think" : "Execute"} Mode` : "Select a Mode"}
                </button>
                {saveError && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center", maxWidth: 340 }}>⚠ {saveError}</p>}
                {selected && !saveError && (
                    <p style={{ fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>
                        {selected === "think" ? "Strategic mode — Co-Founder AI awaits" : "Execution mode — Your agents are ready"}
                    </p>
                )}
            </div>

            <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes modePulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(1.5);} }
        @keyframes featureIn { from{opacity:0;transform:translateX(-8px);} to{opacity:1;transform:translateX(0);} }
      `}</style>
        </div>
    );
}