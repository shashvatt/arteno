"use client";

/**
 * DownloadPDFButton — Drop-in button for Think & Execute dashboards
 * Place at: components/DownloadPDFButton.tsx
 *
 * Usage examples:
 *
 * // Think mode (all 4 tabs):
 * <DownloadPDFButton mode="think" results={results} idea={ideaInput} />
 *
 * // Execute mode — single agent page:
 * <DownloadPDFButton mode="execute" agentKey="sales" agentData={salesData} idea={idea} />
 */

import { useState } from "react";
import { downloadThinkPDF, downloadExecutePDF } from "@/lib/DownloadPDF";
import type { ThinkResults, ExecuteAgentData } from "@/lib/DownloadPDF";

type AgentKey = "founder" | "sales" | "marketing" | "hacker";

type ThinkProps = {
  mode: "think";
  results: ThinkResults;
  idea: string;
  agentKey?: never;
  agentData?: never;
};

type ExecuteProps = {
  mode: "execute";
  agentKey: AgentKey;
  agentData: ExecuteAgentData;
  idea: string;
  results?: never;
};

type Props = (ThinkProps | ExecuteProps) & {
  /** Optional size override. Defaults to "md". */
  size?: "sm" | "md" | "lg";
  /** Optional className for outer wrapper */
  className?: string;
};

const AGENT_COLORS: Record<AgentKey, string> = {
  founder: "#a78bfa",
  sales: "#34d399",
  marketing: "#fb923c",
  hacker: "#38bdf8",
};

export default function DownloadPDFButton(props: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (props.mode === "think") {
        await downloadThinkPDF(props.results, props.idea);
      } else {
        await downloadExecutePDF(props.agentKey, props.agentData, props.idea);
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const accentColor =
    props.mode === "execute" ? AGENT_COLORS[props.agentKey] : "#8b5cf6";

  const sizes = {
    sm: { padding: "5px 12px", fontSize: 11, iconSize: 12 },
    md: { padding: "8px 16px", fontSize: 12.5, iconSize: 14 },
    lg: { padding: "11px 22px", fontSize: 14, iconSize: 16 },
  };
  const sz = sizes[props.size || "md"];

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: sz.padding,
        borderRadius: 8,
        border: `1px solid ${done ? "rgba(34,197,94,0.35)" : "var(--border, rgba(255,255,255,0.1))"}`,
        background: done
          ? "rgba(34,197,94,0.08)"
          : loading
          ? "var(--surface, rgba(255,255,255,0.06))"
          : "var(--surface, rgba(255,255,255,0.06))",
        color: done ? "#22c55e" : loading ? "var(--text-4, rgba(255,255,255,0.35))" : "var(--text-3, rgba(255,255,255,0.65))",
        fontSize: sz.fontSize,
        fontWeight: 600,
        fontFamily: "var(--font, system-ui)",
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!loading && !done) {
          (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}55`;
          (e.currentTarget as HTMLElement).style.color = accentColor;
          (e.currentTarget as HTMLElement).style.background = `${accentColor}10`;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading && !done) {
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--border, rgba(255,255,255,0.1))";
          (e.currentTarget as HTMLElement).style.color =
            "var(--text-3, rgba(255,255,255,0.65))";
          (e.currentTarget as HTMLElement).style.background =
            "var(--surface, rgba(255,255,255,0.06))";
        }
      }}
    >
      {/* Icon */}
      {loading ? (
        <SpinnerIcon size={sz.iconSize} />
      ) : done ? (
        <CheckIcon size={sz.iconSize} />
      ) : (
        <DownloadIcon size={sz.iconSize} />
      )}

      {/* Label */}
      {loading ? "Generating PDF..." : done ? "Downloaded!" : "Download PDF"}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon({ size }: { size: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: "2px solid rgba(255,255,255,0.15)",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        animation: "arteno-pdf-spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}