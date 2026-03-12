"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Sidebar from "@/components/Sidebar";

interface Project {
    id: string;
    title: string;
    created_at: string;
    status: string;
}

const AGENTS = [
    {
        key: "founder", label: "Founder Agent", number: "01",
        desc: "Investor-ready startup blueprints, pitch decks, market analysis & funding strategy.",
        accent: "#a78bfa", accentBg: "rgba(139,92,246,0.08)", accentBorder: "rgba(139,92,246,0.2)",
        href: "/founder", icon: "🚀",
        gradient: "linear-gradient(135deg,#7c3aed,#a855f7)",
    },
    {
        key: "sales", label: "Sales Agent", number: "02",
        desc: "Complete CRM pipelines, cold email sequences, sales scripts & revenue projections.",
        accent: "#34d399", accentBg: "rgba(52,211,153,0.06)", accentBorder: "rgba(52,211,153,0.15)",
        href: "/sales", icon: "💰",
        gradient: "linear-gradient(135deg,#059669,#34d399)",
    },
    {
        key: "marketing", label: "Marketing Agent", number: "03",
        desc: "Launch campaigns, social posts, ad copy, SEO strategy & full content calendars.",
        accent: "#fb923c", accentBg: "rgba(251,146,60,0.06)", accentBorder: "rgba(251,146,60,0.15)",
        href: "/marketing", icon: "📣",
        gradient: "linear-gradient(135deg,#dc2626,#f87171)",
    },
    {
        key: "hacker", label: "Hacker Agent", number: "04",
        desc: "Technical architecture, stack decisions, MVP scope & developer task breakdown.",
        accent: "#38bdf8", accentBg: "rgba(56,189,248,0.06)", accentBorder: "rgba(56,189,248,0.15)",
        href: "/hacker", icon: "⚡",
        gradient: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
    },
];

// Moved outside component so useEffect can reference it stably
const supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getToken(): Promise<string | undefined> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token;
}

export default function ExecuteDashboard() {
    const router = useRouter();
    const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
    const [buildIdea, setBuildIdea] = useState("");
    const [building, setBuilding] = useState(false);
    const [buildDone, setBuildDone] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // ── Fetch projects on mount ──────────────────────────
    useEffect(() => {
        const loadProjects = async () => {
            setLoadingProjects(true);
            try {
                const token = await getToken();
                const res = await fetch("/api/projects", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json.data) setProjects(json.data);
            } catch (e) {
                console.error("Failed to load projects:", e);
            } finally {
                setLoadingProjects(false);
            }
        };
        loadProjects();
    }, []);

    const handleBuildAll = async () => {
        if (!buildIdea.trim() || building) return;
        router.push(`/build-startup?idea=${encodeURIComponent(buildIdea.trim())}`);
    };

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            {/* Sidebar — matches Think mode layout */}
            <Sidebar onLoadProject={() => { }} />

            <div className="main-area">
                {/* Topbar */}
                <div className="main-topbar" style={{ padding: "0 26px" }}>
                    <span className="main-topbar-title">Agent Suite</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
                    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

                        {/* Header */}
                        <div>
                            <div style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: 4,
                                textTransform: "uppercase", color: "rgba(251,146,60,0.7)",
                                marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: "50%", background: "#fb923c",
                                    display: "inline-block", boxShadow: "0 0 6px rgba(251,146,60,0.6)",
                                }} />
                                Execute Mode
                            </div>
                            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.8px", color: "var(--text)", marginBottom: 6 }}>
                                Your agent team is ready.
                            </h1>
                            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
                                Deploy specialists that write, sell, build, and ship — each focused on their domain.
                            </p>
                        </div>

                        {/* Agent grid */}
                        <div>
                            <div style={{
                                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "0.07em", color: "var(--text-4)", marginBottom: 14,
                            }}>
                                Product Suite
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                {AGENTS.map(agent => (
                                    <div
                                        key={agent.key}
                                        onMouseEnter={() => setHoveredAgent(agent.key)}
                                        onMouseLeave={() => setHoveredAgent(null)}
                                        onClick={() => router.push(agent.href)}
                                        style={{
                                            padding: "20px 20px 18px", borderRadius: 14, cursor: "pointer",
                                            transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                                            background: hoveredAgent === agent.key ? agent.accentBg : "var(--bg)",
                                            border: `1px solid ${hoveredAgent === agent.key ? agent.accentBorder : "var(--border)"}`,
                                            transform: hoveredAgent === agent.key ? "translateY(-2px)" : "translateY(0)",
                                            boxShadow: hoveredAgent === agent.key ? `0 8px 24px ${agent.accentBorder}` : "none",
                                            display: "flex", flexDirection: "column", gap: 12,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                            <div style={{
                                                width: 38, height: 38, borderRadius: 10,
                                                background: agent.gradient, display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                fontSize: 18, boxShadow: `0 3px 10px ${agent.accentBorder}`,
                                            }}>
                                                {agent.icon}
                                            </div>
                                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "var(--text-4)" }}>
                                                {agent.number}
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 5, letterSpacing: "-0.2px" }}>
                                                {agent.label}
                                            </div>
                                            <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.6, margin: 0 }}>
                                                {agent.desc}
                                            </p>
                                        </div>
                                        <div style={{
                                            fontSize: 12, color: agent.accent, fontWeight: 600,
                                            display: "flex", alignItems: "center", gap: 4,
                                            transition: "gap 0.2s",
                                        }}>
                                            Open
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                                                style={{
                                                    transform: hoveredAgent === agent.key ? "translateX(3px)" : "translateX(0)",
                                                    transition: "transform 0.2s ease",
                                                }}>
                                                <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Build My Startup orchestrator */}
                        <div style={{
                            padding: "28px 32px", borderRadius: 16,
                            background: "var(--bg)", border: "1px solid var(--border)",
                            position: "relative", overflow: "hidden",
                        }}>
                            {/* Gradient decoration */}
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.04) 100%)",
                                pointerEvents: "none",
                            }} />

                            <div style={{ position: "relative", zIndex: 1 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                                    <div>
                                        <div style={{
                                            fontSize: 10, fontWeight: 700, letterSpacing: 3,
                                            textTransform: "uppercase", color: "var(--text-4)", marginBottom: 6,
                                        }}>
                                            Orchestrator
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginBottom: 4 }}>
                                            Build My Startup
                                        </div>
                                        <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6, margin: 0, maxWidth: 400 }}>
                                            All 4 agents run in parallel — get your complete startup operating system in one shot.
                                        </p>
                                    </div>
                                    {/* Stacked agent avatars */}
                                    <div style={{ display: "flex" }}>
                                        {AGENTS.map((a, i) => (
                                            <div key={a.key} style={{
                                                width: 30, height: 30, borderRadius: "50%",
                                                border: "2px solid var(--bg)", background: a.gradient,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 13, marginLeft: i === 0 ? 0 : -8,
                                                zIndex: AGENTS.length - i, position: "relative",
                                            }}>
                                                {a.icon}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 10 }}>
                                    <input
                                        value={buildIdea}
                                        onChange={e => setBuildIdea(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") handleBuildAll(); }}
                                        placeholder="Describe your startup idea..."
                                        style={{
                                            flex: 1, padding: "11px 16px", borderRadius: 10,
                                            border: "1px solid var(--border)", background: "var(--surface)",
                                            color: "var(--text)", fontSize: 13, outline: "none",
                                            fontFamily: "var(--font)", transition: "border-color 0.15s",
                                        }}
                                        onFocus={e => (e.target.style.borderColor = "var(--primary-border)")}
                                        onBlur={e => (e.target.style.borderColor = "var(--border)")}
                                    />
                                    <button
                                        onClick={handleBuildAll}
                                        disabled={!buildIdea.trim() || building}
                                        style={{
                                            padding: "11px 22px", borderRadius: 10, border: "none",
                                            cursor: buildIdea.trim() && !building ? "pointer" : "not-allowed",
                                            background: buildIdea.trim() && !building
                                                ? "linear-gradient(135deg, #1d4ed8, #7c3aed)"
                                                : "var(--surface)",
                                            color: buildIdea.trim() && !building ? "#fff" : "var(--text-4)",
                                            fontSize: 13, fontWeight: 600, fontFamily: "var(--font)",
                                            transition: "all 0.2s", whiteSpace: "nowrap",
                                            display: "flex", alignItems: "center", gap: 8,
                                            boxShadow: buildIdea.trim() && !building ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
                                        }}
                                    >
                                        {building && (
                                            <span style={{
                                                width: 12, height: 12,
                                                border: "2px solid rgba(255,255,255,0.3)",
                                                borderTopColor: "#fff", borderRadius: "50%",
                                                animation: "spin 0.7s linear infinite",
                                                display: "inline-block",
                                            }} />
                                        )}
                                        {building ? "Building..." : buildDone ? "✓ Done" : "Run All Agents ✦"}
                                    </button>
                                </div>

                                {buildDone && (
                                    <div style={{ marginTop: 12, fontSize: 12.5, color: "#22c55e", display: "flex", alignItems: "center", gap: 6 }}>
                                        ✓ All agents completed successfully
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Projects */}
                        <div>
                            <div style={{
                                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "0.07em", color: "var(--text-4)", marginBottom: 14,
                            }}>
                                Recent Projects
                            </div>

                            {loadingProjects ? (
                                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-4)", fontSize: 13 }}>
                                    Loading projects...
                                </div>
                            ) : projects.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {projects.slice(0, 5).map(p => (
                                        <div
                                            key={p.id}
                                            style={{
                                                padding: "14px 18px", borderRadius: 12,
                                                border: "1px solid var(--border)", background: "var(--bg)",
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                cursor: "pointer", transition: "border-color 0.15s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary-border)")}
                                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                        >
                                            <div>
                                                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                                                    {p.title}
                                                </div>
                                                <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                                                    {new Date(p.created_at).toLocaleDateString("en-US", {
                                                        month: "short", day: "numeric", year: "numeric",
                                                    })}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100,
                                                background: p.status === "complete" ? "rgba(22,163,74,0.1)" : "rgba(20,33,61,0.06)",
                                                color: p.status === "complete" ? "#16a34a" : "var(--primary)",
                                                border: `1px solid ${p.status === "complete" ? "rgba(22,163,74,0.2)" : "var(--primary-border)"}`,
                                            }}>
                                                {p.status === "complete" ? "Complete" : "In Progress"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-4)", fontSize: 14 }}>
                                    No projects yet — run your first agent above.
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: var(--text-4); }
            `}</style>
        </div>
    );
}