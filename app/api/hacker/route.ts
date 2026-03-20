import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/agentPrompts";
import { getStartupContext, saveStartupContext, buildContextBlock } from "@/lib/startupContext";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user?.id ?? null;
}

async function checkAndIncrementLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt?: string }> {
  const FREE_LIMIT = 2;
  const RESET_HOURS = 24;
  const supabase = getSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("plan, generations_count, generations_reset_at, plan_expires_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    await supabase.from("users").upsert({
      id: userId, plan: "free", generations_count: 1,
      generations_reset_at: new Date().toISOString(),
    });
    return { allowed: true, remaining: FREE_LIMIT - 1 };
  }

  const isPaid = user.plan === "pro" || user.plan === "team";
  const planExpired = user.plan_expires_at && new Date(user.plan_expires_at) < new Date();
  if (isPaid && !planExpired) {
    await supabase.rpc("increment_generations", { user_id: userId });
    return { allowed: true, remaining: Infinity };
  }

  const resetAt = new Date(user.generations_reset_at);
  const hoursSinceReset = (Date.now() - resetAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= RESET_HOURS) {
    await supabase.from("users").update({
      generations_count: 1,
      generations_reset_at: new Date().toISOString(),
    }).eq("id", userId);
    return { allowed: true, remaining: FREE_LIMIT - 1 };
  }

  const count = user.generations_count ?? 0;
  if (count >= FREE_LIMIT) {
    const resetTime = new Date(resetAt.getTime() + RESET_HOURS * 60 * 60 * 1000);
    return { allowed: false, remaining: 0, resetAt: resetTime.toISOString() };
  }

  await supabase.rpc("increment_generations", { user_id: userId });
  return { allowed: true, remaining: FREE_LIMIT - (count + 1) };
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, projectId } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

  // ── Generation limit check ──
  const limit = await checkAndIncrementLimit(userId);
  if (!limit.allowed) {
    return NextResponse.json({
      error: "Generation limit reached",
      limitReached: true,
      remaining: 0,
      resetAt: limit.resetAt,
    }, { status: 429 });
  }

  try {
    const ctx = await getStartupContext(userId);
    const contextBlock = buildContextBlock(ctx, "hacker");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.6, maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const systemPrompt = `You are an expert technical architect and senior developer. Given a startup idea, generate a comprehensive technical plan.

Return ONLY valid JSON with this structure:
{
  "architecture": {
    "overview": "High-level system description",
    "components": [{ "name": "...", "type": "Frontend|Backend|Database|Service", "description": "..." }],
    "dataFlow": "How data moves through the system",
    "scalingStrategy": "How to scale this system"
  },
  "techStack": {
    "rationale": "Why this stack was chosen",
    "categories": [
      {
        "name": "Frontend",
        "technologies": [{ "name": "Next.js", "reason": "SSR + great DX" }]
      }
    ],
    "alternatives": [{ "tool": "...", "reason": "why not chosen" }]
  },
  "mvp": {
    "summary": "What the MVP delivers",
    "timeline": "X weeks",
    "features": [{ "name": "...", "description": "...", "priority": "High|Medium|Low" }],
    "outOfScope": ["feature1", "feature2"]
  },
  "devTasks": {
    "sprints": [
      {
        "name": "Sprint 1 — Foundation",
        "duration": "Week 1-2",
        "tasks": [{ "task": "...", "estimate": "2h" }]
      }
    ]
  }
}`;

    const fullPrompt = `${contextBlock}${systemPrompt}\n\nSTARTUP IDEA: ${prompt}\n\nGenerate the complete technical plan. Respond with valid JSON only.`;

    const result = await model.generateContent(fullPrompt);
    const data = JSON.parse(result.response.text());

    const supabase = getSupabase();
    const { data: saved, error } = await supabase
      .from("agent_outputs")
      .insert({
        user_id: userId, agent_type: "hacker",
        input_prompt: prompt, output_data: data,
        project_id: projectId ?? null, status: "done",
      })
      .select().single();

    if (error) console.error("Supabase save error:", error);

    const techNames = data.techStack?.categories
      ?.flatMap((c: any) => c.technologies?.map((t: any) => t.name) ?? []) ?? [];

    await saveStartupContext(userId, {
      tech_stack:      techNames,
      mvp_scope:       data.mvp?.summary,
      architecture:    data.architecture?.overview,
      hacker_snapshot: data,
    });

    return NextResponse.json({ data, outputId: saved?.id, remaining: limit.remaining });
  } catch (e: any) {
    console.error("Hacker agent error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("agent_outputs").select("*")
    .eq("user_id", userId).eq("agent_type", "hacker")
    .order("created_at", { ascending: false }).limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}