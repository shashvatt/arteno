"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import IdeaInput from "@/components/IdeaInput";
import Link from "next/link";

type Tab = "blueprint" | "roadmap" | "prompts" | "feasibility";

// ── Hooks ────────────────────────────────────────────────

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

function useTypewriter(text: string, speed = 60, enabled = true) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    const rafRef = useRef<number | null>(null);
    const indexRef = useRef(0);
    const lastTimeRef = useRef(0);
    useEffect(() => {
        if (!enabled || !text) { setDisplayed(text ?? ""); setDone(true); return; }
        setDisplayed(""); setDone(false); indexRef.current = 0;
        const interval = 1000 / speed;
        const tick = (now: number) => {
            if (now - lastTimeRef.current >= interval) {
                lastTimeRef.current = now;
                indexRef.current = Math.min(indexRef.current + Math.max(1, Math.floor(speed / 40)), text.length);
                setDisplayed(text.slice(0, indexRef.current));
                if (indexRef.current >= text.length) { setDone(true); return; }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [text, speed, enabled]);
    return { displayed, done };
}

// ── Small UI primitives ──────────────────────────────────

function Cursor({ visible }: { visible: boolean }) {
    const [blink, setBlink] = useState(true);
    useEffect(() => {
        if (!visible) return;
        const t = setInterval(() => setBlink(b => !b), 530);
        return () => clearInterval(t);
    }, [visible]);
    if (!visible) return null;
    return (
        <span style={{
            display: "inline-block", width: 2, height: "1em",
            background: "var(--text)", marginLeft: 2, verticalAlign: "text-bottom",
            opacity: blink ? 1 : 0, transition: "opacity 0.1s",
        }} />
    );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
    return (
        <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>{children}</div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                color: copied ? "#22c55e" : "var(--text-4)", background: "transparent",
                border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px",
                cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
            }}>
            {copied ? "✓ Copied!" : "Copy"}
        </button>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 8,
        }}>{children}</div>
    );
}

function GeneratingIndicator({ activeTab }: { activeTab: Tab }) {
    const labels: Record<Tab, string> = {
        blueprint: "Building your product blueprint",
        roadmap: "Planning your execution roadmap",
        prompts: "Crafting AI prompt packs",
        feasibility: "Analysing feasibility",
    };
    const [dots, setDots] = useState("");
    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
        return () => clearInterval(t);
    }, []);
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
            border: "1px solid var(--border)", borderRadius: "var(--r)",
            background: "var(--surface)", marginBottom: 16,
        }}>
            <div style={{
                width: 7, height: 7, borderRadius: "50%", background: "var(--primary)",
                animation: "think-pulse 1.2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 13.5, color: "var(--text-3)", fontWeight: 500 }}>
                {labels[activeTab]}{dots}
            </span>
        </div>
    );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div style={{
            padding: "12px 16px", background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--r)",
            marginBottom: 16, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12,
        }}>
            <span style={{ fontSize: 13, color: "#dc2626" }}>⚠ {message}</span>
            <button onClick={onDismiss} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#dc2626", fontSize: 16, lineHeight: 1, padding: 0,
            }}>×</button>
        </div>
    );
}

// ── Sidebar panel shown when results are visible ─────────

function InsightPanel({ data }: { data: any }) {
    if (!data) return null;
    const score = data.feasibility?.score;
    const revenueModel = data.blueprint?.revenueModel;
    const marketSize = data.blueprint?.marketSize;
    const timeToMarket = data.feasibility?.timeToMarket;
    const topCompetitors = data.feasibility?.topCompetitors;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {revenueModel && (
                <div style={{
                    background: "var(--primary)", borderRadius: "var(--r-lg)", padding: "20px 22px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: "rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Revenue Strategy</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.65 }}>{revenueModel}</p>
                    {marketSize && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Market Size</div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{marketSize}</p>
                        </div>
                    )}
                </div>
            )}

            {score !== undefined && (
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <SectionLabel>Feasibility Score</SectionLabel>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 10 }}>
                        <span style={{
                            fontSize: 44, fontWeight: 700, letterSpacing: "-2px", lineHeight: 1,
                            color: score >= 70 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#dc2626",
                        }}>{score}</span>
                        <span style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 6 }}>/100</span>
                    </div>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{
                            width: `${score}%`, height: "100%", borderRadius: 10, transition: "width 1s ease",
                            background: score >= 70 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#dc2626",
                        }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-4)", textTransform: "capitalize" }}>
                        {data.feasibility?.confidence} confidence
                    </div>
                    {timeToMarket && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-3)" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-2)" }}>Time to market: </span>{timeToMarket}
                        </div>
                    )}
                </div>
            )}

            {data.blueprint?.techStack?.length > 0 && (
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <SectionLabel>Tech Stack</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {data.blueprint.techStack.map((t: any, i: number) => {
                            const label = typeof t === "string" ? t : t?.name ?? JSON.stringify(t);
                            return (
                                <span key={i} style={{
                                    fontSize: 11.5, padding: "3px 10px",
                                    border: "1px solid var(--primary-border)", borderRadius: 20,
                                    color: "var(--primary)", background: "var(--primary-soft)",
                                }}>{label}</span>
                            );
                        })}
                    </div>
                </div>
            )}

            {topCompetitors?.length > 0 && (
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <SectionLabel>Top Competitors</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {topCompetitors.map((c: string, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-2)" }}>
                                <span style={{
                                    width: 18, height: 18, borderRadius: "50%",
                                    background: "var(--surface-2)", border: "1px solid var(--border)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10, fontWeight: 700, color: "var(--text-4)", flexShrink: 0,
                                }}>{i + 1}</span>
                                {c}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                <SectionLabel>Export Options</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[{ label: "Download PDF", icon: "↓" }, { label: "Copy Blueprint", icon: "⎘" }, { label: "Share Link", icon: "↗" }].map((opt) => (
                        <button key={opt.label} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: "var(--r)", fontSize: 13, color: "var(--text-2)", cursor: "pointer",
                            fontFamily: "var(--font)", fontWeight: 500, transition: "border-color 0.12s, background 0.12s",
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)"; (e.currentTarget as HTMLElement).style.background = "var(--primary-soft)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}>
                            <span>{opt.label}</span>
                            <span style={{ color: "var(--text-4)" }}>{opt.icon}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Result tab content components ────────────────────────

function StreamingBlueprint({ data, isStreaming }: { data: any; isStreaming: boolean }) {
    const { displayed: tagline, done: taglineDone } = useTypewriter(data?.tagline ?? "", 60, isStreaming);
    const { displayed: problemSolved, done: problemDone } = useTypewriter(data?.problemSolved ?? "", 50, isStreaming && taglineDone);
    const { displayed: coreValue, done: coreDone } = useTypewriter(data?.coreValueProposition ?? "", 45, isStreaming && problemDone);
    const { displayed: competitive, done: competitiveDone } = useTypewriter(data?.competitiveEdge ?? "", 40, isStreaming && coreDone);

    const features = (data?.coreFeatures ?? []).map((f: any) =>
        typeof f === "string" ? { name: f, description: "", priority: "Medium" } : f
    );
    const techStack = (data?.techStack ?? []).map((t: any) =>
        typeof t === "string" ? t : t?.name ?? JSON.stringify(t)
    );

    return (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24 }}>
            <FadeIn>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>{data?.productName}</h2>
                <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
                    {tagline}<Cursor visible={isStreaming && !taglineDone} />
                </p>
            </FadeIn>

            {(taglineDone || !isStreaming) && (
                <FadeIn delay={100}>
                    <div style={{ marginBottom: 20 }}>
                        <SectionLabel>Problem Solved</SectionLabel>
                        <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>
                            {problemSolved}<Cursor visible={isStreaming && taglineDone && !problemDone} />
                        </p>
                    </div>
                </FadeIn>
            )}
            {(problemDone || !isStreaming) && (
                <FadeIn delay={100}>
                    <div style={{ marginBottom: 20 }}>
                        <SectionLabel>Core Value Proposition</SectionLabel>
                        <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>
                            {coreValue}<Cursor visible={isStreaming && problemDone && !coreDone} />
                        </p>
                    </div>
                </FadeIn>
            )}
            {(coreDone || !isStreaming) && (
                <FadeIn delay={100}>
                    {data?.targetAudience?.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <SectionLabel>Target Audience</SectionLabel>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {data.targetAudience.map((a: any, i: number) => {
                                    const label = typeof a === "string" ? a : a?.name ?? JSON.stringify(a);
                                    return (
                                        <FadeIn key={i} delay={i * 80}>
                                            <span style={{ fontSize: 12.5, padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text-2)", background: "var(--surface)" }}>{label}</span>
                                        </FadeIn>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {features.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <SectionLabel>Core Features</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {features.map((f: any, i: number) => (
                                    <FadeIn key={i} delay={i * 100}>
                                        <div style={{
                                            padding: "12px 16px", border: "1px solid var(--border)",
                                            borderRadius: "var(--r)", background: "var(--surface)",
                                            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{f.name}</div>
                                                {f.description && <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{f.description}</div>}
                                            </div>
                                            {f.priority && (
                                                <span style={{
                                                    fontSize: 10.5, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const, flexShrink: 0,
                                                    border: `1px solid ${f.priority === "High" || f.priority === "high" ? "rgba(220,38,38,0.25)" : f.priority === "Medium" || f.priority === "medium" ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
                                                    color: f.priority === "High" || f.priority === "high" ? "#dc2626" : f.priority === "Medium" || f.priority === "medium" ? "#d97706" : "var(--text-4)",
                                                    background: f.priority === "High" || f.priority === "high" ? "rgba(220,38,38,0.06)" : f.priority === "Medium" || f.priority === "medium" ? "rgba(245,158,11,0.06)" : "transparent",
                                                }}>{f.priority}</span>
                                            )}
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    )}
                    {techStack.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <SectionLabel>Tech Stack</SectionLabel>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {techStack.map((t: string, i: number) => (
                                    <FadeIn key={i} delay={i * 60}>
                                        <span style={{ fontSize: 12.5, padding: "4px 12px", border: "1px solid var(--primary-border)", borderRadius: 20, color: "var(--primary)", background: "var(--primary-soft)" }}>{t}</span>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    )}
                    {data?.competitiveEdge && (
                        <FadeIn delay={100}>
                            <div style={{ marginBottom: 20 }}>
                                <SectionLabel>Competitive Edge</SectionLabel>
                                <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>
                                    {competitive}<Cursor visible={isStreaming && coreDone && !competitiveDone} />
                                </p>
                            </div>
                        </FadeIn>
                    )}
                </FadeIn>
            )}
        </div>
    );
}

function StreamingRoadmap({ data, isStreaming }: { data: any; isStreaming: boolean }) {
    const [expandedPhase, setExpandedPhase] = useState<number>(1);
    return (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24 }}>
            <FadeIn><h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, letterSpacing: "-0.3px" }}>Execution Roadmap</h2></FadeIn>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data?.phases?.map((phase: any, i: number) => {
                    const isOpen = expandedPhase === phase.phase;
                    return (
                        <FadeIn key={phase.phase} delay={i * 150}>
                            <div style={{
                                border: `1px solid ${isOpen ? "var(--primary-border)" : "var(--border)"}`,
                                borderRadius: "var(--r)",
                                background: isOpen ? "var(--primary-soft)" : "var(--surface)",
                                transition: "all 0.2s",
                            }}>
                                <div onClick={() => setExpandedPhase(isOpen ? 0 : phase.phase)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer" }}>
                                    <span style={{
                                        width: 26, height: 26, borderRadius: "50%",
                                        background: isOpen ? "var(--primary)" : "var(--border)",
                                        color: isOpen ? "#fff" : "var(--text-4)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, flexShrink: 0, transition: "all 0.2s",
                                    }}>{phase.phase}</span>
                                    <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: "var(--text)" }}>{phase.title}</span>
                                    <span style={{ fontSize: 11.5, color: "var(--text-4)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 20, background: "var(--bg)", whiteSpace: "nowrap" as const }}>{phase.duration}</span>
                                    <span style={{ fontSize: 14, color: "var(--text-4)", marginLeft: 4, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>›</span>
                                </div>
                                {isOpen && (
                                    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                                        {phase.goals?.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--primary)", marginBottom: 6 }}>Goals</div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                                    {phase.goals.map((g: string, j: number) => (
                                                        <div key={j} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                                                            <span style={{ color: "#16a34a", flexShrink: 0, marginTop: 1 }}>✓</span>{g}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {phase.milestones?.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 6 }}>Milestones</div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                                    {phase.milestones.map((m: string, j: number) => (
                                                        <div key={j} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-3)" }}>
                                                            <span style={{ flexShrink: 0, marginTop: 2 }}>→</span>{m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {phase.deliverables?.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 6 }}>Deliverables</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                    {phase.deliverables.map((d: string, j: number) => (
                                                        <span key={j} style={{ fontSize: 11.5, padding: "3px 10px", border: "1px solid var(--primary-border)", borderRadius: 20, color: "var(--primary)", background: "var(--primary-soft)" }}>{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {phase.teamRequired?.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 6 }}>Team Required</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                    {phase.teamRequired.map((t: string, j: number) => (
                                                        <span key={j} style={{ fontSize: 11.5, padding: "3px 10px", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text-3)", background: "var(--bg)" }}>{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    );
                })}
            </div>
        </div>
    );
}

function StreamingPrompts({ data, isStreaming }: { data: any; isStreaming: boolean }) {
    return (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24 }}>
            <FadeIn><h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, letterSpacing: "-0.3px" }}>AI Prompt Packs</h2></FadeIn>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {data?.packs?.map((pack: any, i: number) => (
                    <FadeIn key={i} delay={i * 120}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 20, background: "var(--primary)", color: "#fff" }}>{pack.phase}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-4)" }}>{pack.category}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {pack.prompts?.map((p: any, j: number) => (
                                    <FadeIn key={j} delay={j * 80}>
                                        <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", transition: "border-color 0.12s" }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)"}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8, flexWrap: "wrap" as const }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.title}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ fontSize: 11, color: "var(--primary)", border: "1px solid var(--primary-border)", background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>{p.tool}</span>
                                                    <CopyButton text={p.prompt} />
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>{p.prompt}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </div>
    );
}

function StreamingFeasibility({ data, isStreaming, isMobile }: { data: any; isStreaming: boolean; isMobile: boolean }) {
    const { displayed: recommendation, done: recDone } = useTypewriter(data?.recommendation ?? "", 45, isStreaming);
    const score = data?.score ?? 0;
    const scoreColor = score >= 70 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#dc2626";
    return (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24 }}>
            <FadeIn>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, letterSpacing: "-0.3px" }}>Feasibility Analysis</h2>
                <div style={{ padding: 20, border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6" />
                            <circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor} strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 30}`}
                                strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
                                strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: scoreColor }}>{score}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor, letterSpacing: "-0.5px", marginBottom: 3 }}>
                            {score >= 75 ? "Strong Idea" : score >= 60 ? "Viable Idea" : score >= 45 ? "Needs Work" : "High Risk"}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-3)", textTransform: "capitalize" as const }}>{data?.confidence} confidence · Score {score}/100</div>
                        {data?.timeToMarket && <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4 }}>⏱ {data.timeToMarket}</div>}
                    </div>
                </div>
            </FadeIn>
            <FadeIn delay={200}>
                <div style={{ marginBottom: 20 }}>
                    <SectionLabel>Recommendation</SectionLabel>
                    <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75 }}>
                        {recommendation}<Cursor visible={isStreaming && !recDone} />
                    </p>
                </div>
            </FadeIn>
            {(recDone || !isStreaming) && (
                <FadeIn delay={100}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div style={{ padding: 16, border: "1px solid rgba(22,163,74,0.2)", borderRadius: "var(--r)", background: "rgba(22,163,74,0.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#16a34a", marginBottom: 10 }}>Strengths</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {data?.strengths?.map((s: string, i: number) => (
                                    <FadeIn key={i} delay={i * 80}>
                                        <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                                            <span style={{ flexShrink: 0, color: "#16a34a", marginTop: 1 }}>✓</span>{s}
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: 16, border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--r)", background: "rgba(220,38,38,0.03)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#dc2626", marginBottom: 10 }}>Risks</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {data?.risks?.map((r: string, i: number) => (
                                    <FadeIn key={i} delay={i * 80}>
                                        <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                                            <span style={{ flexShrink: 0, color: "#dc2626", marginTop: 1 }}>⚠</span>{r}
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </div>
                    {data?.opportunities?.length > 0 && (
                        <FadeIn delay={200}>
                            <div style={{ padding: 16, border: "1px solid rgba(59,130,246,0.2)", borderRadius: "var(--r)", background: "rgba(59,130,246,0.03)", marginBottom: 16 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#3b82f6", marginBottom: 10 }}>Opportunities</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                    {data.opportunities.map((o: string, i: number) => (
                                        <FadeIn key={i} delay={i * 80}>
                                            <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                                                <span style={{ flexShrink: 0, color: "#3b82f6", marginTop: 1 }}>↗</span>{o}
                                            </div>
                                        </FadeIn>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    )}
                    {data?.topCompetitors?.length > 0 && (
                        <FadeIn delay={300}>
                            <div>
                                <SectionLabel>Top Competitors</SectionLabel>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {data.topCompetitors.map((c: string, i: number) => (
                                        <span key={i} style={{ fontSize: 12, padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text-3)", background: "var(--surface)" }}>{c}</span>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    )}
                </FadeIn>
            )}
        </div>
    );
}

// ── Limit wall ───────────────────────────────────────────

function CountdownTimer({ resetAt }: { resetAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        const update = () => {
            const diff = new Date(resetAt).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft("Refreshing..."); return; }
            const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [resetAt]);
    return <span style={{ fontWeight: 600, color: "var(--text)" }}>{timeLeft}</span>;
}

function LimitWall({ resetAt, onUpgrade }: { resetAt?: string; onUpgrade: () => void }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", textAlign: "center", padding: "0 16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", marginBottom: 8 }}>You've used all 5 free generations</h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, maxWidth: 380, marginBottom: 28 }}>Upgrade to Pro for unlimited generations, or wait for your free plan to reset.</p>
            {resetAt && (
                <div style={{ padding: "12px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text-3)", marginBottom: 24 }}>
                    Free plan resets in: <CountdownTimer resetAt={resetAt} />
                </div>
            )}
            <button onClick={onUpgrade} style={{ padding: "11px 28px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
                Upgrade to Pro →
            </button>
        </div>
    );
}

// ── Project card ─────────────────────────────────────────

function ProjectCard({ project, onClick, onDelete }: { project: any; onClick: () => void; onDelete: () => void }) {
    const [hovered, setHovered] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const tagline = project.blueprint?.tagline ?? "";
    const date = new Date(project.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const outputs = ["blueprint", "roadmap", "prompts", "feasibility"];
    const completed = outputs.filter(k => project[k] !== null && project[k] !== undefined).length;
    const progress = Math.round((completed / outputs.length) * 100);
    const initials = project.title?.slice(0, 2).toUpperCase() ?? "??";
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#14213d"];
    const color = colors[project.title?.charCodeAt(0) % colors.length] ?? colors[0];

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
            style={{
                padding: "18px 20px",
                border: `1px solid ${hovered ? "var(--primary-border)" : "var(--border)"}`,
                borderRadius: "var(--r-lg)", background: "var(--bg)", cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s", position: "relative",
                boxShadow: hovered ? "0 4px 16px rgba(20,33,61,0.08)" : "none",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 3, paddingRight: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{project.title}</div>
                    {tagline && <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{tagline}</div>}
                </div>
                <div style={{
                    position: "absolute", top: 18, right: 18, fontSize: 10.5, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const,
                    background: progress === 100 ? "rgba(22,163,74,0.1)" : "rgba(20,33,61,0.06)",
                    color: progress === 100 ? "#16a34a" : "var(--primary)",
                    border: `1px solid ${progress === 100 ? "rgba(22,163,74,0.2)" : "var(--primary-border)"}`,
                }}>
                    {progress === 100 ? "Complete" : "In Progress"}
                </div>
            </div>
            <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        {outputs.map(k => (
                            <div key={k} style={{ width: 8, height: 8, borderRadius: "50%", background: project[k] ? "var(--primary)" : "var(--border)", transition: "background 0.2s" }} />
                        ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 500 }}>{progress}% Done</span>
                </div>
                <div style={{ height: 4, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", borderRadius: 10, transition: "width 0.6s ease" }} />
                </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{date}</div>

            {hovered && !confirmDelete && (
                <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                    style={{ position: "absolute", bottom: 16, right: 16, fontSize: 11.5, color: "var(--text-4)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.4)"; (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}>
                    Delete
                </button>
            )}
            {confirmDelete && (
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 16, right: 16, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: "#dc2626", fontWeight: 500 }}>Delete?</span>
                    <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ fontSize: 11.5, padding: "3px 8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>Yes</button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} style={{ fontSize: 11.5, padding: "3px 8px", background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}>No</button>
                </div>
            )}
        </div>
    );
}

// ── Mobile nav bar ───────────────────────────────────────

function MobileNavBar({ currentView, onHome, onProjects, onSettings, showResults, activeTab, setActiveTab, displayResults, isStreaming }: any) {
    const router = useRouter();
    const resultTabs = [
        { key: "blueprint", label: "Blueprint", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
        { key: "roadmap", label: "Roadmap", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 4 4-6 4 10" /></svg> },
        { key: "prompts", label: "Prompts", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> },
        { key: "feasibility", label: "Score", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
    ];
    const homeTabs = [
        { key: "home", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, action: onHome },
        { key: "projects", label: "Projects", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>, action: onProjects },
        { key: "roadmaps", label: "Roadmaps", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>, action: onHome },
        { key: "settings", label: "Settings", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>, action: () => router.push("/settings") },
    ];
    const tabs = showResults ? resultTabs : homeTabs;
    return (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 80, background: "var(--sidebar-bg)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}>
            {tabs.map((t: any) => {
                const isActive = showResults ? activeTab === t.key : currentView === t.key;
                const isDisabled = showResults && isStreaming && !displayResults?.[t.key];
                return (
                    <button key={t.key}
                        onClick={() => showResults ? setActiveTab(t.key) : t.action?.()}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", position: "relative", color: isActive ? "#fff" : "rgba(255,255,255,0.45)", opacity: isDisabled ? 0.3 : 1, transition: "color 0.15s, opacity 0.2s" }}>
                        {t.icon}
                        <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: "0.02em" }}>{t.label}</span>
                        {isActive && <div style={{ position: "absolute", bottom: 0, width: 32, height: 2, background: "var(--primary)", borderRadius: "2px 2px 0 0" }} />}
                    </button>
                );
            })}
        </div>
    );
}

// ── Main Think Dashboard ─────────────────────────────────

export default function ThinkDashboard() {
    const router = useRouter();
    const w = useWindowWidth();
    const isMobile = w > 0 && w < 768;

    const [activeTab, setActiveTab] = useState<Tab>("blueprint");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [tabErrors, setTabErrors] = useState<Partial<Record<Tab, string>>>({});
    const [results, setResults] = useState<any>(null);
    const [streamingResults, setStreamingResults] = useState<any>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [view, setView] = useState<"home" | "generate" | "project">("home");
    const [mobileView, setMobileView] = useState<"home" | "projects">("home");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [limitData, setLimitData] = useState<{ canGenerate: boolean; remaining: number | null; plan: string; resetAt?: string }>({ canGenerate: true, remaining: 5, plan: "free" });
    const [searchQuery, setSearchQuery] = useState("");

    const fetchLimit = useCallback(async () => {
        try { const res = await fetch("/api/check-limit"); setLimitData(await res.json()); } catch { }
    }, []);

    const fetchProjects = useCallback(async () => {
        setLoadingProjects(true);
        try { const res = await fetch("/api/projects"); const json = await res.json(); setProjects(json.data ?? []); }
        catch { } finally { setLoadingProjects(false); }
    }, []);

    useEffect(() => { fetchLimit(); fetchProjects(); }, [fetchLimit, fetchProjects]);

    const goHome = () => {
        setResults(null); setStreamingResults(null); setIsStreaming(false);
        setView("home"); setError(""); setTabErrors({}); setCurrentProjectId(null);
    };

    const handleDeleteProject = async (projectId: string) => {
        setDeletingId(projectId);
        try {
            await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
            setProjects(prev => prev.filter(p => p.id !== projectId));
            if (currentProjectId === projectId) goHome();
            window.dispatchEvent(new Event("forge:project-saved"));
        } catch { } finally { setDeletingId(null); }
    };

    const saveProject = async (data: any, submittedIdea: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.blueprint?.productName ?? submittedIdea.slice(0, 60),
                    description: submittedIdea,
                    input_prompt: submittedIdea,
                    mode: "think",
                    status: "complete",
                }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setCurrentProjectId(json.data.id);
            fetchProjects();
            window.dispatchEvent(new Event("forge:project-saved"));
            fetchLimit();
        } catch (e) { console.error("Save project error:", e); }
        finally { setSaving(false); }
    };

    const handleGenerate = async (submittedIdea: string) => {
        const res = await fetch("/api/check-limit");
        const limit = await res.json();
        setLimitData(limit);
        if (!limit.canGenerate) return;

        setLoading(true); setIsStreaming(true); setError(""); setTabErrors({});
        setResults(null); setStreamingResults({}); setCurrentProjectId(null);
        setView("generate"); setActiveTab("blueprint");

        try {
            const [blueprintRes, roadmapRes, promptsRes, feasibilityRes] = await Promise.all([
                fetch("/api/generate-blueprint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: submittedIdea }) }),
                fetch("/api/generate-roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: submittedIdea }) }),
                fetch("/api/generate-prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: submittedIdea }) }),
                fetch("/api/feasibility-score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: submittedIdea }) }),
            ]);

            const [blueprint, roadmap, prompts, feasibility] = await Promise.all([
                blueprintRes.json(), roadmapRes.json(), promptsRes.json(), feasibilityRes.json(),
            ]);

            const newTabErrors: Partial<Record<Tab, string>> = {};
            if (!blueprint.data) newTabErrors.blueprint = blueprint.error ?? "Failed to generate blueprint";
            if (!roadmap.data) newTabErrors.roadmap = roadmap.error ?? "Failed to generate roadmap";
            if (!prompts.data) newTabErrors.prompts = prompts.error ?? "Failed to generate prompts";
            if (!feasibility.data) newTabErrors.feasibility = feasibility.error ?? "Failed to generate feasibility";
            if (Object.keys(newTabErrors).length > 0) setTabErrors(newTabErrors);

            const newResults = {
                blueprint: blueprint.data ?? null,
                roadmap: roadmap.data ?? null,
                prompts: prompts.data ?? null,
                feasibility: feasibility.data ?? null,
            };

            setStreamingResults({ blueprint: newResults.blueprint });
            setTimeout(() => setStreamingResults((p: any) => ({ ...p, roadmap: newResults.roadmap })), 500);
            setTimeout(() => setStreamingResults((p: any) => ({ ...p, prompts: newResults.prompts })), 1000);
            setTimeout(() => setStreamingResults((p: any) => ({ ...p, feasibility: newResults.feasibility })), 1500);
            setTimeout(() => { setResults(newResults); setIsStreaming(false); }, 2000);

            if (newResults.blueprint) await saveProject(newResults, submittedIdea);
        } catch (e: any) {
            setError("Something went wrong. Please try again.");
            setIsStreaming(false);
        } finally { setLoading(false); }
    };

    const handleLoadProject = async (project: any) => {
        try {
            const res = await fetch(`/api/projects/${project.id}`);
            const json = await res.json();
            const p = json.data ?? project;
            setResults({ blueprint: p.blueprint, roadmap: p.roadmap, prompts: p.prompts, feasibility: p.feasibility });
            setStreamingResults(null); setIsStreaming(false); setTabErrors({});
            setCurrentProjectId(p.id); setActiveTab("blueprint"); setView("project");
        } catch {
            setResults({ blueprint: project.blueprint, roadmap: project.roadmap, prompts: project.prompts, feasibility: project.feasibility });
            setStreamingResults(null); setIsStreaming(false); setTabErrors({});
            setCurrentProjectId(project.id); setActiveTab("blueprint"); setView("project");
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "blueprint", label: "Blueprint" },
        { key: "roadmap", label: "Roadmap" },
        { key: "prompts", label: "Prompt Packs" },
        { key: "feasibility", label: "Feasibility" },
    ];

    const displayResults = isStreaming ? streamingResults : results;
    const showResults = displayResults && (view === "generate" || view === "project");
    const filteredProjects = projects.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.blueprint?.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            {!isMobile && <Sidebar onLoadProject={handleLoadProject} />}

            <div className="main-area">

                {/* ── Topbar ── */}
                <div className="main-topbar" style={{ padding: isMobile ? "0 16px" : "0 26px", gap: 12 }}>

                    {/* Left: breadcrumb + title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {showResults && (
                            <>
                                <button onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 13, fontFamily: "var(--font)", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                                    Home
                                </button>
                                <span style={{ color: "var(--text-4)", fontSize: 13 }}>›</span>
                            </>
                        )}

                        {/* Think mode badge — only on home */}
                        {!showResults && (
                            <div style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: 3,
                                textTransform: "uppercase", color: "rgba(99,102,241,0.8)",
                                display: "flex", alignItems: "center", gap: 6,
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: "50%", background: "#6366f1",
                                    display: "inline-block", boxShadow: "0 0 6px rgba(99,102,241,0.6)",
                                }} />
                                Think Mode
                            </div>
                        )}

                        <span className="main-topbar-title" style={{ fontSize: isMobile ? 13.5 : 14 }}>
                            {showResults ? (displayResults?.blueprint?.productName ?? "Generating...") : "Project Generator"}
                        </span>
                    </div>

                    {/* Centre: search bar */}
                    {!isMobile && !showResults && (
                        <div style={{ flex: 1, maxWidth: 320, position: "relative" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }}>
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 34, border: "1px solid var(--border)", borderRadius: 20, fontSize: 13, color: "var(--text)", background: "var(--surface)", outline: "none", fontFamily: "var(--font)", transition: "border-color 0.12s" }}
                                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)"}
                                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
                            />
                        </div>
                    )}

                    {/* Right: status indicators */}
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexShrink: 0, marginLeft: "auto" }}>
                        {limitData.plan === "free" && limitData.remaining !== null && !showResults && (
                            <span style={{ fontSize: isMobile ? 11 : 12, color: "var(--text-4)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 20, background: "var(--surface)", whiteSpace: "nowrap" as const }}>
                                {limitData.remaining}/5 left
                            </span>
                        )}
                        {saving && <span style={{ fontSize: 12, color: "var(--text-4)" }}>Saving...</span>}
                        {currentProjectId && !saving && !isStreaming && (
                            <span style={{ fontSize: 12, color: "#22c55e" }}>✓ Saved</span>
                        )}
                        {!isMobile && (
                            <button style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-3)" }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </button>
                        )}
                        {isMobile && showResults && (
                            <button onClick={goHome} style={{ fontSize: 11.5, padding: "5px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-3)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 500 }}>← Back</button>
                        )}
                    </div>
                </div>

                {/* ── Content ── */}
                <div style={{ flex: 1, padding: isMobile ? "20px 16px" : "32px", overflowY: "auto", paddingBottom: isMobile ? "80px" : "32px" }}>

                    {/* Home view */}
                    {!showResults && (
                        <div>
                            {(!isMobile || mobileView === "home") && (
                                <div style={{ maxWidth: 860, margin: "0 auto", marginBottom: 40 }}>

                                    {/* Page header */}
                                    <div style={{ marginBottom: 32 }}>
                                        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: "-0.8px", marginBottom: 6, color: "var(--text)" }}>
                                            What are we building today?
                                        </h1>
                                        <p style={{ fontSize: isMobile ? 13.5 : 14, color: "var(--text-3)", lineHeight: 1.6 }}>
                                            Turn your vague concept into a concrete, executable product roadmap in seconds.
                                        </p>
                                    </div>

                                    {/* Idea input or limit wall */}
                                    {!limitData.canGenerate ? (
                                        <LimitWall resetAt={limitData.resetAt} onUpgrade={() => router.push("/upgrade")} />
                                    ) : (
                                        <>
                                            <IdeaInput onGenerate={handleGenerate} loading={loading} />
                                            {error && <p style={{ marginTop: 12, fontSize: 13, color: "#dc2626", textAlign: "center" }}>{error}</p>}
                                        </>
                                    )}

                                    {/* What you'll get — 4 output cards */}
                                    {limitData.canGenerate && (
                                        <div style={{ marginTop: 32 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--text-4)", marginBottom: 14 }}>
                                                What you'll get
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
                                                {[
                                                    { key: "blueprint", label: "Blueprint", icon: "📐", desc: "Product vision, features & stack", color: "#6366f1" },
                                                    { key: "roadmap", label: "Roadmap", icon: "🗺", desc: "Phase-by-phase execution plan", color: "var(--primary)" },
                                                    { key: "prompts", label: "Prompt Packs", icon: "⚡", desc: "Ready-to-use AI prompts", color: "#f59e0b" },
                                                    { key: "feasibility", label: "Feasibility", icon: "📊", desc: "Score, risks & opportunities", color: "#10b981" },
                                                ].map(item => (
                                                    <div key={item.key} style={{
                                                        padding: "14px 16px", borderRadius: 12,
                                                        border: "1px solid var(--border)", background: "var(--bg)",
                                                        display: "flex", flexDirection: "column", gap: 8,
                                                    }}>
                                                        <div style={{ fontSize: 20 }}>{item.icon}</div>
                                                        <div>
                                                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{item.label}</div>
                                                            <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Projects list */}
                            {(!isMobile || mobileView === "projects") && (
                                <div style={{ maxWidth: 860, margin: "0 auto" }}>
                                    {isMobile && (
                                        <div style={{ position: "relative", marginBottom: 16 }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }}>
                                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            </svg>
                                            <input
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search projects..."
                                                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 38, border: "1px solid var(--border)", borderRadius: 20, fontSize: 13, color: "var(--text)", background: "var(--surface)", outline: "none", fontFamily: "var(--font)" }}
                                            />
                                        </div>
                                    )}

                                    {loadingProjects ? (
                                        <div style={{ fontSize: 13, color: "var(--text-4)", textAlign: "center", padding: 32 }}>Loading projects...</div>
                                    ) : filteredProjects.length > 0 ? (
                                        <>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--text-4)" }}>
                                                    Recent Projects{searchQuery && ` · ${filteredProjects.length} results`}
                                                </div>
                                                {limitData.plan === "free" && (
                                                    <Link href="/upgrade" style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
                                                        Upgrade for unlimited →
                                                    </Link>
                                                )}
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                                                {filteredProjects.map(p => (
                                                    <div key={p.id} style={{ opacity: deletingId === p.id ? 0.4 : 1, transition: "opacity 0.2s", pointerEvents: deletingId === p.id ? "none" : "auto" }}>
                                                        <ProjectCard project={p} onClick={() => handleLoadProject(p)} onDelete={() => handleDeleteProject(p.id)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : projects.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-4)", fontSize: 14 }}>
                                            No projects yet — generate your first idea above!
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--text-4)", fontSize: 14 }}>
                                            No projects match "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results view */}
                    {showResults && (
                        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 1200, margin: "0 auto" }}>

                            {/* Main content */}
                            <div style={{ flex: 1, minWidth: 0 }}>

                                {/* Desktop tab bar */}
                                {!isMobile && (
                                    <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
                                        {tabs.map(t => (
                                            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                                                padding: "8px 16px", border: "none", background: "transparent",
                                                fontFamily: "var(--font)", fontSize: 13.5, fontWeight: 500,
                                                color: activeTab === t.key ? "var(--primary)" : "var(--text-3)",
                                                borderBottom: activeTab === t.key ? "2px solid var(--primary)" : "2px solid transparent",
                                                cursor: "pointer", marginBottom: -1,
                                                transition: "color 0.12s, opacity 0.2s",
                                                opacity: isStreaming && !displayResults?.[t.key] ? 0.35 : 1,
                                            }}>{t.label}</button>
                                        ))}
                                    </div>
                                )}

                                {isMobile && (
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
                                            {displayResults?.blueprint?.productName ?? "Generating..."}
                                        </div>
                                    </div>
                                )}

                                {tabErrors[activeTab] && (
                                    <ErrorBanner message={tabErrors[activeTab]!} onDismiss={() => setTabErrors(p => ({ ...p, [activeTab]: undefined }))} />
                                )}
                                {isStreaming && !displayResults?.[activeTab] && <GeneratingIndicator activeTab={activeTab} />}

                                {activeTab === "blueprint" && displayResults?.blueprint && <StreamingBlueprint data={displayResults.blueprint} isStreaming={isStreaming} />}
                                {activeTab === "roadmap" && displayResults?.roadmap && <StreamingRoadmap data={displayResults.roadmap} isStreaming={isStreaming} />}
                                {activeTab === "prompts" && displayResults?.prompts && <StreamingPrompts data={displayResults.prompts} isStreaming={isStreaming} />}
                                {activeTab === "feasibility" && displayResults?.feasibility && <StreamingFeasibility data={displayResults.feasibility} isStreaming={isStreaming} isMobile={isMobile} />}

                                {!isStreaming && activeTab === "blueprint" && !displayResults?.blueprint && tabErrors.blueprint && (
                                    <div style={{ padding: 24, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>Blueprint generation failed. Try regenerating.</div>
                                )}
                                {!isStreaming && activeTab === "feasibility" && !displayResults?.feasibility && tabErrors.feasibility && (
                                    <div style={{ padding: 24, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>Feasibility analysis failed. Try regenerating.</div>
                                )}
                            </div>

                            {/* Right insight panel — desktop only */}
                            {!isMobile && (
                                <div style={{ width: 280, flexShrink: 0, position: "sticky", top: 0 }}>
                                    <InsightPanel data={displayResults} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile nav bar */}
            {isMobile && (
                <MobileNavBar
                    currentView={mobileView}
                    onHome={() => { setMobileView("home"); if (showResults) goHome(); }}
                    onProjects={() => { setMobileView("projects"); if (showResults) goHome(); }}
                    onSettings={() => router.push("/settings")}
                    showResults={showResults}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    displayResults={displayResults}
                    isStreaming={isStreaming}
                />
            )}

            <style>{`
                @keyframes think-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                }
                input::placeholder { color: var(--text-4); }
            `}</style>
        </div>
    );
}