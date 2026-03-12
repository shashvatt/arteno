import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/agentPrompts";

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

export async function POST(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt, projectId } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            },
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

        const fullPrompt = `${systemPrompt}\n\nSTARTUP IDEA: ${prompt}\n\nGenerate the complete technical plan. Respond with valid JSON only.`;

        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        const data = JSON.parse(text);

        const supabase = getSupabase();
        const { data: saved, error } = await supabase
            .from("agent_outputs")
            .insert({
                user_id: userId,
                agent_type: "hacker",
                input_prompt: prompt,
                output_data: data,
                project_id: projectId ?? null,
                status: "done",
            })
            .select()
            .single();

        if (error) console.error("Supabase save error:", error);
        return NextResponse.json({ data, outputId: saved?.id });
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
        .from("agent_outputs")
        .select("*")
        .eq("user_id", userId)
        .eq("agent_type", "hacker")
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}