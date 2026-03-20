// lib/startupContext.ts
// Matches your existing createClient + SUPABASE_SERVICE_ROLE_KEY pattern.

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type StartupContext = {
  company_name?: string;
  tagline?: string;
  stage?: string;
  industry?: string;
  icp?: string;
  usp?: string;
  tam?: string;
  problem?: string;
  primary_motion?: string;
  average_deal_size?: string;
  sales_cycle_length?: string;
  key_channels?: string[];
  positioning?: string;
  brand_voice?: string;
  primary_keywords?: string[];
  tech_stack?: string[];
  mvp_scope?: string;
  architecture?: string;
  founder_snapshot?: Record<string, unknown>;
  sales_snapshot?: Record<string, unknown>;
  marketing_snapshot?: Record<string, unknown>;
  hacker_snapshot?: Record<string, unknown>;
};

export async function getStartupContext(userId: string): Promise<StartupContext | null> {
  const { data, error } = await getSupabase()
    .from("startup_context")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) { console.error("[ctx] read:", error.message); return null; }
  return data ?? null;
}

export async function saveStartupContext(
  userId: string,
  patch: Partial<StartupContext>
): Promise<void> {
  const { error } = await getSupabase()
    .from("startup_context")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });

  if (error) console.error("[ctx] write:", error.message);
}

export function buildContextBlock(
  ctx: StartupContext | null,
  callingAgent: "founder" | "sales" | "marketing" | "hacker"
): string {
  if (!ctx) return "";

  const lines: string[] = [
    "=== SHARED STARTUP CONTEXT ===",
    "Use the following known information about this startup.",
    "Do NOT ask the user to repeat any of it.",
    "",
  ];

  if (ctx.company_name) lines.push(`Company: ${ctx.company_name}`);
  if (ctx.tagline)      lines.push(`Tagline: ${ctx.tagline}`);
  if (ctx.stage)        lines.push(`Stage: ${ctx.stage}`);
  if (ctx.industry)     lines.push(`Industry: ${ctx.industry}`);
  if (ctx.icp)          lines.push(`Ideal customer profile: ${ctx.icp}`);
  if (ctx.usp)          lines.push(`Unfair advantage: ${ctx.usp}`);
  if (ctx.tam)          lines.push(`TAM: ${ctx.tam}`);
  if (ctx.problem)      lines.push(`Core problem: ${ctx.problem}`);

  if (callingAgent !== "sales") {
    if (ctx.primary_motion)       lines.push(`Sales motion: ${ctx.primary_motion}`);
    if (ctx.average_deal_size)    lines.push(`Avg deal size: ${ctx.average_deal_size}`);
    if (ctx.key_channels?.length) lines.push(`Sales channels: ${ctx.key_channels.join(", ")}`);
  }

  if (callingAgent !== "marketing") {
    if (ctx.positioning)              lines.push(`Brand positioning: ${ctx.positioning}`);
    if (ctx.brand_voice)              lines.push(`Brand voice: ${ctx.brand_voice}`);
    if (ctx.primary_keywords?.length) lines.push(`SEO keywords: ${ctx.primary_keywords.join(", ")}`);
  }

  if (callingAgent !== "hacker") {
    if (ctx.tech_stack?.length) lines.push(`Tech stack: ${ctx.tech_stack.join(", ")}`);
    if (ctx.mvp_scope)          lines.push(`MVP scope: ${ctx.mvp_scope}`);
    if (ctx.architecture)       lines.push(`Architecture: ${ctx.architecture}`);
  }

  lines.push("", "=== END CONTEXT ===", "");
  return lines.join("\n");
}