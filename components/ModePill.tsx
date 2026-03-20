"use client";

import { useState } from "react";

type Mode = "think" | "execute";

type Props = {
    current: Mode;
    onSwitch: (m: Mode) => void;
};

export default function ModePill({ current, onSwitch }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <style>{`
                @keyframes pillIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div style={{ position: "relative" }}>
                <button
                    onClick={() => setOpen(o => !o)}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 12px 6px 10px", borderRadius: 100,
                        background: "rgba(10,10,10,0.88)", backdropFilter: "blur(12px)",
                        border: `1px solid ${current === "think" ? "rgba(139,92,246,0.35)" : "rgba(251,146,60,0.3)"}`,
                        cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                        transition: "all 0.2s ease",
                    }}
                >
                    <span style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: current === "think" ? "#8b5cf6" : "#fb923c",
                        boxShadow: `0 0 6px ${current === "think" ? "rgba(139,92,246,0.7)" : "rgba(251,146,60,0.7)"}`,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: "#fff" }}>
                        {current === "think" ? "Think" : "Execute"}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                        style={{
                            color: "rgba(255,255,255,0.4)",
                            transform: open ? "rotate(180deg)" : "rotate(0)",
                            transition: "transform 0.2s",
                        }}>
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {open && (
                    <>
                        <div
                            style={{ position: "fixed", inset: 0, zIndex: -1 }}
                            onClick={() => setOpen(false)}
                        />
                        <div style={{
                            position: "absolute", top: "calc(100% + 8px)", right: 0,
                            background: "rgba(12,12,12,0.96)", backdropFilter: "blur(16px)",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
                            overflow: "hidden", minWidth: 210, zIndex: 9999,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                            animation: "pillIn 0.2s cubic-bezier(0.16,1,0.3,1)",
                        }}>
                            <div style={{
                                padding: "10px 14px 6px", fontSize: 9, fontWeight: 700,
                                letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                            }}>
                                Switch Mode
                            </div>

                            {(["think", "execute"] as Mode[]).map(m => (
                                <div
                                    key={m}
                                    onClick={() => { onSwitch(m); setOpen(false); }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "10px 14px", cursor: "pointer",
                                        background: current === m
                                            ? m === "think" ? "rgba(139,92,246,0.08)" : "rgba(251,146,60,0.06)"
                                            : "transparent",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => {
                                        if (current !== m)
                                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                                    }}
                                    onMouseLeave={e => {
                                        if (current !== m)
                                            (e.currentTarget as HTMLElement).style.background = "transparent";
                                    }}
                                >
                                    <span style={{
                                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                                        background: m === "think" ? "#8b5cf6" : "#fb923c",
                                        opacity: current === m ? 1 : 0.4,
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 700,
                                            color: current === m ? "#fff" : "rgba(255,255,255,0.5)",
                                        }}>
                                            {m === "think" ? "Think" : "Execute"}
                                        </div>
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
                                            {m === "think"
                                                ? "Co-Founder AI · Blueprint & Strategy"
                                                : "Agent Team · Build & Ship"}
                                        </div>
                                    </div>
                                    {current === m && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 700, letterSpacing: 1,
                                            textTransform: "uppercase", padding: "2px 7px",
                                            borderRadius: 100,
                                            background: m === "think" ? "rgba(139,92,246,0.15)" : "rgba(251,146,60,0.12)",
                                            color: m === "think" ? "#a78bfa" : "#fb923c",
                                            border: `1px solid ${m === "think" ? "rgba(139,92,246,0.2)" : "rgba(251,146,60,0.2)"}`,
                                        }}>
                                            Active
                                        </span>
                                    )}
                                </div>
                            ))}

                            <div style={{
                                margin: "6px 14px 10px", padding: "8px 12px", borderRadius: 10,
                                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                            }}>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
                                    Your preference is saved automatically.
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}