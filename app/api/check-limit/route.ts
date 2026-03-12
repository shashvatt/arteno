import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FREE_LIMIT = 5;
const RESET_HOURS = 24;

async function getUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("plan, generations_count, generations_reset_at, plan_expires_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      await supabase.from("users").upsert({
        id: userId,
        plan: "free",
        generations_count: 0,
        generations_reset_at: new Date().toISOString(),
      });
      return NextResponse.json({ canGenerate: true, remaining: FREE_LIMIT, plan: "free" });
    }

    const isPaid = user.plan === "pro" || user.plan === "team";
    const planExpired = user.plan_expires_at && new Date(user.plan_expires_at) < new Date();

    if (isPaid && !planExpired) {
      return NextResponse.json({ canGenerate: true, remaining: null, plan: user.plan });
    }

    const resetAt = new Date(user.generations_reset_at);
    const hoursSinceReset = (Date.now() - resetAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= RESET_HOURS) {
      await supabase.from("users").update({
        generations_count: 0,
        generations_reset_at: new Date().toISOString(),
      }).eq("id", userId);
      return NextResponse.json({ canGenerate: true, remaining: FREE_LIMIT, plan: "free" });
    }

    const remaining = Math.max(0, FREE_LIMIT - (user.generations_count ?? 0));
    const resetTime = new Date(resetAt.getTime() + RESET_HOURS * 60 * 60 * 1000);

    return NextResponse.json({
      canGenerate: remaining > 0,
      remaining,
      plan: "free",
      resetAt: resetTime.toISOString(),
    });
  } catch (err) {
    console.error("Limit check error:", err);
    return NextResponse.json({ canGenerate: true, remaining: FREE_LIMIT, plan: "free" });
  }
}

export async function POST() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.rpc("increment_generations", { user_id: userId });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Increment error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}