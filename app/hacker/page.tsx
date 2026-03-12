"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

type Tab = "architecture" | "stack" | "mvp" | "tasks";

const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "architecture", label: "Architecture", icon: "◈" },
    { key: "stack", label: "Tech Stack", icon: "◆" },
    { key: "mvp", label: "MVP Scope", icon: "◉" },
    { key: "tasks", label: "Dev Tasks", icon: "◇" },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: copied ? "#22c55e" : "var(--text-4)", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font)" }}
        >{copied ? "✓ Copied" : "Copy"}</button>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 10 }}>{children}</div>;
}

function SkeletonBlock({ width = "100%", height = 14 }: { width?: string; height?: number }) {
    return <div style={{ width, height, borderRadius: 6, background: "var(--surface)", animation: "pulse-soft 1.4s ease infinite" }} />;
}

function LoadingSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "28px 32px" }}>
            <SkeletonBlock width="60%" height={20} />
            <SkeletonBlock width="90%" />
            <SkeletonBlock width="80%" />
            <SkeletonBlock width="70%" />
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }}>
                        <SkeletonBlock width="40%" height={13} />
                        <div style={{ marginTop: 8 }}><SkeletonBlock width="85%" /></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ArchitectureTab({ data }: { data: any }) {
    if (!data) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {data.overview && (
                <div>
                    <SectionLabel>System Overview</SectionLabel>
                    <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.overview}</p>
                </div>
            )}
            {data.components?.length > 0 && (
                <div>
                    <SectionLabel>Core Components</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.components.map((c: any, i: number) => (
                            <div key={i} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{c.name ?? c.component}</div>
                                        <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{c.description ?? c.responsibility}</div>
                                    </div>
                                    {c.type && <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 20, border: "1px solid var(--primary-border)", color: "var(--primary)", background: "var(--primary-soft)", whiteSpace: "nowrap", flexShrink: 0 }}>{c.type}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {data.dataFlow && (
                <div>
                    <SectionLabel>Data Flow</SectionLabel>
                    <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.dataFlow}</p>
                </div>
            )}
            {data.scalingStrategy && (
                <div>
                    <SectionLabel>Scaling Strategy</SectionLabel>
                    <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.scalingStrategy}</p>
                </div>
            )}
        </div>
    );
}

function StackTab({ data }: { data: any }) {
    if (!data) return null;
    const categories = data.categories ?? data.layers ?? [];
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {data.rationale && (
                <div style={{ padding: "14px 18px", border: "1px solid var(--primary-border)", borderRadius: "var(--r)", background: "var(--primary-soft)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginBottom: 6 }}>Stack Rationale</div>
                    <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{data.rationale}</p>
                </div>
            )}
            {categories.map((cat: any, i: number) => (
                <div key={i}>
                    <SectionLabel>{cat.name ?? cat.layer ?? cat.category}</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {(cat.technologies ?? cat.tools ?? cat.items ?? []).map((tech: any, j: number) => {
                            const label = typeof tech === "string" ? tech : tech.name;
                            const reason = typeof tech === "object" ? tech.reason ?? tech.description : null;
                            return (
                                <div key={j} style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 3 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</span>
                                    {reason && <span style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.4 }}>{reason}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            {data.alternatives?.length > 0 && (
                <div>
                    <SectionLabel>Alternatives Considered</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {data.alternatives.map((a: any, i: number) => (
                            <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-3)" }}>
                                <span style={{ color: "var(--text-4)", flexShrink: 0 }}>→</span>
                                <span><strong style={{ color: "var(--text-2)" }}>{a.tool ?? a.name}</strong>{a.reason ? ` — ${a.reason}` : ""}</span>
                            </div>
                        ))}
                    </div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {data.summary && (
                <div>
                    <SectionLabel>MVP Summary</SectionLabel>
                    <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>{data.summary}</p>
                </div>
            )}
            {data.timeline && (
                <div style={{ padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>⏱</span>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 2 }}>Estimated Timeline</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{data.timeline}</div>
                    </div>
                </div>
            )}
            {features.length > 0 && (
                <div>
                    <SectionLabel>In Scope — MVP Features</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {features.map((f: any, i: number) => {
                            const name = typeof f === "string" ? f : f.name ?? f.feature;
                            const desc = typeof f === "object" ? f.description ?? f.details : null;
                            const priority = typeof f === "object" ? f.priority : null;
                            return (
                                <div key={i} style={{ padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: desc ? 4 : 0 }}>{name}</div>
                                        {desc && <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{desc}</div>}
                                    </div>
                                    {priority && (
                                        <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${priority === "High" || priority === "high" ? "rgba(220,38,38,0.25)" : priority === "Medium" || priority === "medium" ? "rgba(245,158,11,0.25)" : "var(--border)"}`, color: priority === "High" || priority === "high" ? "#dc2626" : priority === "Medium" || priority === "medium" ? "#d97706" : "var(--text-4)", background: priority === "High" || priority === "high" ? "rgba(220,38,38,0.06)" : priority === "Medium" || priority === "medium" ? "rgba(245,158,11,0.06)" : "transparent" }}>{priority}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {outOfScope.length > 0 && (
                <div>
                    <SectionLabel>Out of Scope — Post-MVP</SectionLabel>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {sprints.map((sprint: any, i: number) => (
                    <div key={i}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
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
                                    <div key={j} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                            <span style={{ color: "var(--text-4)", flexShrink: 0, marginTop: 1 }}>→</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map((task: any, i: number) => {
                const label = typeof task === "string" ? task : task.task ?? task.name ?? task.title;
                const estimate = typeof task === "object" ? task.estimate ?? task.hours : null;
                const category = typeof task === "object" ? task.category ?? task.type : null;
                return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ color: "var(--text-4)", flexShrink: 0, marginTop: 2 }}>→</span>
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
    const [idea, setIdea] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<Tab>("architecture");

    const getToken = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token;
    };

    const handleGenerate = async () => {
        if (!idea.trim() || loading) return;
        setLoading(true); setResult(null); setError("");
        try {
            const token = await getToken();
            const res = await fetch("/api/hacker", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ prompt: idea }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Generation failed");
            setResult(json.data);
            setActiveTab("architecture");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const tabData: Record<Tab, any> = {
        architecture: result?.architecture ?? result?.systemArchitecture ?? null,
        stack: result?.techStack ?? result?.stack ?? null,
        mvp: result?.mvp ?? result?.mvpScope ?? null,
        tasks: result?.devTasks ?? result?.tasks ?? result?.sprintPlan ?? null,
    };

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            <div className="main-area">
                {/* Topbar */}
                <div className="main-topbar" style={{ padding: "0 26px", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 13, fontFamily: "var(--font)", padding: 0 }}>Dashboard</button>
                        <span style={{ color: "var(--text-4)", fontSize: 13 }}>›</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>⚡</span>
                            <span className="main-topbar-title">Hacker Agent</span>
                        </span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", background: "rgba(56,189,248,0.06)", fontWeight: 600, letterSpacing: 0.5 }}>Execute Mode</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
                    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>

                        {/* Header */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "rgba(56,189,248,0.7)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", display: "inline-block", boxShadow: "0 0 6px rgba(56,189,248,0.7)" }} />
                                Agent 04
                            </div>
                            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px", color: "var(--text)", marginBottom: 6 }}>Hacker Agent</h1>
                            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>Technical architecture, stack decisions, MVP scope & developer task breakdown.</p>
                        </div>

                        {/* Input */}
                        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "24px 28px" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 12 }}>Describe your product</div>
                            <textarea
                                value={idea}
                                onChange={e => setIdea(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                                placeholder="e.g. A marketplace for freelance developers to find short-term contracts with pre-vetted startups..."
                                rows={3}
                                style={{ width: "100%", padding: "14px 16px", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, lineHeight: 1.65, outline: "none", resize: "vertical", fontFamily: "var(--font)", transition: "border-color 0.15s", boxSizing: "border-box" }}
                                onFocus={e => (e.target.style.borderColor = "var(--primary-border)")}
                                onBlur={e => (e.target.style.borderColor = "var(--border)")}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>{idea.length}/2000 · ⌘Enter to generate</span>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!idea.trim() || loading}
                                    style={{ padding: "10px 24px", borderRadius: "var(--r)", border: "none", cursor: idea.trim() && !loading ? "pointer" : "not-allowed", background: idea.trim() && !loading ? "linear-gradient(135deg, #0ea5e9, #38bdf8)" : "var(--surface)", color: idea.trim() && !loading ? "#fff" : "var(--text-4)", fontSize: 13, fontWeight: 600, fontFamily: "var(--font)", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8, boxShadow: idea.trim() && !loading ? "0 4px 16px rgba(56,189,248,0.3)" : "none" }}
                                >
                                    {loading && <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
                                    {loading ? "Analysing..." : "Generate ⚡"}
                                </button>
                            </div>
                            {error && <p style={{ marginTop: 10, fontSize: 13, color: "#dc2626" }}>⚠ {error}</p>}
                        </div>

                        {/* Results */}
                        {loading && !result && (
                            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                                    {TABS.map(t => <div key={t.key} style={{ flex: 1, height: 44, background: "var(--surface)" }} />)}
                                </div>
                                <LoadingSkeleton />
                            </div>
                        )}

                        {result && (
                            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                                {/* Tabs */}
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                                    {TABS.map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => setActiveTab(t.key)}
                                            style={{ flex: 1, padding: "12px 0", border: "none", cursor: "pointer", background: activeTab === t.key ? "rgba(56,189,248,0.06)" : "transparent", color: activeTab === t.key ? "#38bdf8" : "var(--text-4)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, fontFamily: "var(--font)", transition: "all 0.15s", borderBottom: activeTab === t.key ? "2px solid #38bdf8" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                        >
                                            <span style={{ fontSize: 11 }}>{t.icon}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab content */}
                                <div style={{ padding: "28px 32px" }}>
                                    {activeTab === "architecture" && <ArchitectureTab data={tabData.architecture} />}
                                    {activeTab === "stack" && <StackTab data={tabData.stack} />}
                                    {activeTab === "mvp" && <MvpTab data={tabData.mvp} />}
                                    {activeTab === "tasks" && <TasksTab data={tabData.tasks} />}
                                    {!tabData[activeTab] && (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-4)", fontSize: 13 }}>
                                            No {activeTab} data returned — try regenerating.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: var(--text-4); }
      `}</style>
        </div>
    );
}