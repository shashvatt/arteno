import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/agentPrompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const { idea, projectId } = await req.json();
  if (!idea) return NextResponse.json({ error: "Idea is required" }, { status: 400 });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const prompt = `${getSystemPrompt("founder")}\n\nSTARTUP IDEA: ${idea}\n\nGenerate a complete startup blueprint. Respond with valid JSON only.`;
    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    const userId = await getUserId(req);
    if (userId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from("agent_outputs").insert({
        user_id: userId, agent_type: "founder",
        input_prompt: idea, output_data: data,
        project_id: projectId ?? null, status: "done",
      });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error("Founder agent error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ data: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("agent_outputs").select("*")
    .eq("user_id", userId).eq("agent_type", "founder")
    .order("created_at", { ascending: false }).limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}