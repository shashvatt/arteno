// components/ContextBanner.tsx
// ─────────────────────────────────────────────
// Drop this inside any agent page, above the textarea.
// Shows only when shared context exists for this user.
// ─────────────────────────────────────────────
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type ContextSummary = {
  company_name?: string;
  stage?: string;
  icp?: string;
  has_sales?: boolean;
  has_marketing?: boolean;
  has_hacker?: boolean;
};

type Props = {
  accentColor?: string;       // e.g. "#16a34a" for Sales, "#7c3aed" for Founder
  accentBg?: string;          // e.g. "#f0fdf4"
  accentBorder?: string;      // e.g. "#bbf7d0"
  onContextLoaded?: (ctx: ContextSummary) => void;
};

export function ContextBanner({
  accentColor = "#7c3aed",
  accentBg = "#faf5ff",
  accentBorder = "#ddd6fe",
  onContextLoaded,
}: Props) {
  const [ctx, setCtx] = useState<ContextSummary | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("startup_context")
        .select("company_name, stage, icp, sales_snapshot, marketing_snapshot, hacker_snapshot")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!data?.company_name) return; // no context yet

      const summary: ContextSummary = {
        company_name: data.company_name,
        stage:        data.stage,
        icp:          data.icp,
        has_sales:    !!data.sales_snapshot,
        has_marketing: !!data.marketing_snapshot,
        has_hacker:   !!data.hacker_snapshot,
      };
      setCtx(summary);
      onContextLoaded?.(summary);
    };
    load();
  }, []);

  if (!ctx || dismissed) return null;

  const agentsRun = [
    ctx.has_sales     && "Sales",
    ctx.has_marketing && "Marketing",
    ctx.has_hacker    && "Hacker",
  ].filter(Boolean) as string[];

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "12px 16px",
      background: accentBg,
      border: `1px solid ${accentBorder}`,
      borderRadius: 12,
      marginBottom: 20,
      animation: "fa-up 0.3s ease",
    }}>
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: accentColor + "18",
        border: `1px solid ${accentBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0,
      }}>⚡</div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: accentColor, marginBottom: 3 }}>
          Using context from your Founder agent
        </div>
        <div style={{ fontSize: 12.5, color: "#52525b", lineHeight: 1.6 }}>
          <strong style={{ color: "#09090b" }}>{ctx.company_name}</strong>
          {ctx.stage && ` · ${ctx.stage}`}
          {ctx.icp && ` · ICP: ${ctx.icp.slice(0, 60)}${ctx.icp.length > 60 ? "…" : ""}`}
        </div>
        {agentsRun.length > 0 && (
          <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 4 }}>
            Also loaded: {agentsRun.join(", ")} agent data
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", fontSize: 16, lineHeight: 1, padding: 2 }}
      >×</button>
    </div>
  );
}