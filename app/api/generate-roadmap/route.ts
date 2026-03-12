import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateRoadmap } from "@/services/llm/gemini";

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

    const body = await req.json();
    const idea: string = body?.idea ?? "";

    if (!idea || idea.trim().length < 10) return NextResponse.json({ error: "Idea must be at least 10 characters" }, { status: 400 });
    if (idea.length > 2000) return NextResponse.json({ error: "Idea must be under 2000 characters" }, { status: 400 });

    const roadmap = await generateRoadmap(idea.trim());
    return NextResponse.json({ data: roadmap });
  } catch (err) {
    console.error("Roadmap error:", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}