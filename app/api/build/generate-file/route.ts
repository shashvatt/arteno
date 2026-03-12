import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blueprint } = await req.json();
  if (!blueprint) return NextResponse.json({ error: "Blueprint required" }, { status: 400 });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
  });

  const prompt = `You are Hacker, an AI code agent. Given this product blueprint, generate a precise file tree for a Next.js 14 (App Router) + Tailwind CSS + Supabase project.

BLUEPRINT:
Product Name: ${blueprint.productName}
Problem: ${blueprint.problemStatement}
Target Audience: ${blueprint.targetAudience}
Core Features: ${blueprint.coreFeatures?.join(", ")}
Revenue Model: ${blueprint.revenueModel}

RULES:
- Always include these files: package.json, .env.example, README.md
- Always include: app/page.tsx (landing), app/dashboard/page.tsx, app/layout.tsx, app/globals.css
- Always include: app/api/[relevant routes based on features]
- Include Supabase: supabase/schema.sql
- Include: components/ (only components actually needed)
- Max 12 files total — be focused, not bloated
- Each file description must be specific to THIS product

Return ONLY valid JSON, no markdown:
{
  "files": [
    { "path": "package.json", "description": "Dependencies and scripts for [product name]" },
    { "path": "app/page.tsx", "description": "Landing page with hero, features, pricing for [product name]" }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch (e) {
    console.error("File tree generation error:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}