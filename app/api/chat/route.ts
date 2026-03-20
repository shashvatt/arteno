import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Auth via bearer token — same pattern as your other routes
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, context, history } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    });

    const systemContext = `You are Arteno AI — a sharp startup advisor and co-founder assistant.
You are fully briefed on this specific project and must give advice tailored to it.

PROJECT CONTEXT:
${context?.blueprint ? `
BLUEPRINT:
- Product: ${context.blueprint.productName ?? ""}
- Tagline: ${context.blueprint.tagline ?? ""}
- Problem: ${context.blueprint.problemSolved ?? ""}
- Value Prop: ${context.blueprint.coreValueProposition ?? ""}
- Target Audience: ${JSON.stringify(context.blueprint.targetAudience ?? [])}
- Core Features: ${JSON.stringify((context.blueprint.coreFeatures ?? []).map((f: any) => typeof f === "string" ? f : f?.name))}
- Tech Stack: ${JSON.stringify((context.blueprint.techStack ?? []).map((t: any) => typeof t === "string" ? t : t?.name))}
- Revenue Model: ${context.blueprint.revenueModel ?? ""}
- Competitive Edge: ${context.blueprint.competitiveEdge ?? ""}
` : "No blueprint available."}
${context?.feasibility ? `
FEASIBILITY: ${context.feasibility.score ?? ""}/100 — ${context.feasibility.confidence ?? ""} confidence
Strengths: ${JSON.stringify(context.feasibility.strengths ?? [])}
Risks: ${JSON.stringify(context.feasibility.risks ?? [])}
Opportunities: ${JSON.stringify(context.feasibility.opportunities ?? [])}
Recommendation: ${context.feasibility.recommendation ?? ""}
` : ""}
${context?.roadmap?.phases?.length ? `
ROADMAP: ${context.roadmap.phases.length} phases — ${context.roadmap.phases.map((p: any) => `Phase ${p.phase}: ${p.title} (${p.duration})`).join(", ")}
` : ""}

RULES:
- Be concise and actionable — like a YC partner giving office hours advice
- Reference THIS project specifically, not generic advice
- Keep responses under 250 words unless depth is needed
- Use bullet points for lists
- Never reveal you are Gemini — you are Arteno AI
- If asked something unrelated, still help but note it's general advice`;

    const chatHistory = (history ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemContext }],
        },
        {
          role: "model",
          parts: [{ text: "Got it — I'm Arteno AI, fully briefed on this project. Ask me anything about strategy, validation, tech, go-to-market, or next steps." }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 500 });
  }
}