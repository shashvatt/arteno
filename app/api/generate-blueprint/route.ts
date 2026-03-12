import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBlueprint } from "@/services/llm/gemini";

const FREE_LIMIT = 5;

async function getUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user } = await supabase
      .from("users")
      .select("plan, generations_count, plan_expires_at")
      .eq("id", userId)
      .single();

    const isPaid = user?.plan === "pro" || user?.plan === "team";
    const count = user?.generations_count ?? 0;

    if (isPaid && user?.plan_expires_at) {
      const expired = new Date(user.plan_expires_at) < new Date();
      if (expired) {
        await supabase.from("users").update({ plan: "free", updated_at: new Date().toISOString() }).eq("id", userId);
        if (count >= FREE_LIMIT) return NextResponse.json({ error: "Generation limit reached. Please upgrade." }, { status: 403 });
      }
    }

    if (!isPaid && count >= FREE_LIMIT) {
      return NextResponse.json({ error: "Generation limit reached. Please upgrade." }, { status: 403 });
    }

    const body = await req.json();
    const idea: string = body?.idea ?? "";

    if (!idea || idea.trim().length < 10) return NextResponse.json({ error: "Idea must be at least 10 characters" }, { status: 400 });
    if (idea.length > 2000) return NextResponse.json({ error: "Idea must be under 2000 characters" }, { status: 400 });

    const blueprint = await generateBlueprint(idea.trim());

    if (!isPaid) {
      await supabase.rpc("increment_generations", { user_id: userId });
    }

    return NextResponse.json({ data: blueprint });
  } catch (err) {
    console.error("Blueprint error:", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
