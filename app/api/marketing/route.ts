import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ✅ Inlined — bypasses broken @/lib/agentPrompts import
const MARKETING_SYSTEM_PROMPT = `
You are the Marketing Agent — a world-class growth marketer and brand strategist.
You've led growth at top-tier SaaS companies, managing $10M+ ad budgets and building 
campaigns that generated viral product launches.

CRITICAL OUTPUT RULES:
- Respond ONLY with valid JSON. No markdown, no preamble outside JSON.
- All social posts must be complete and immediately publishable.
- Content calendar must have specific topics, not placeholders.

OUTPUT JSON SCHEMA:
{
  "marketingStrategy": {
    "positioning": "string",
    "messagingPillar": "string",
    "brandVoice": "string",
    "targetEmotion": "string"
  },
  "launchStrategy": {
    "preLaunchWeeks": "string",
    "launchDay": "string",
    "postLaunchMonth": "string"
  },
  "channels": [
    {
      "channel": "string",
      "priority": "string",
      "strategy": "string",
      "budget": "string",
      "kpi": "string"
    }
  ],
  "socialMediaCampaign": {
    "twitter": {
      "threadIdea": "string",
      "posts": ["string"]
    },
    "linkedin": {
      "posts": ["string"]
    },
    "productHunt": {
      "tagline": "string",
      "description": "string",
      "firstComment": "string"
    }
  },
  "emailCampaign": [
    {
      "type": "string",
      "subject": "string",
      "previewText": "string",
      "body": "string"
    }
  ],
  "adCopy": [
    {
      "platform": "string",
      "format": "string",
      "headline": "string",
      "body": "string",
      "cta": "string",
      "targetAudience": "string"
    }
  ],
  "seoStrategy": {
    "primaryKeywords": ["string"],
    "longTailKeywords": ["string"],
    "contentClusters": ["string"],
    "backlinkStrategy": "string",
    "estimatedTrafficMonth6": "string"
  },
  "contentCalendar": [
    {
      "week": 1,
      "theme": "string",
      "posts": [
        { "day": "string", "platform": "string", "topic": "string", "format": "string" }
      ]
    }
  ],
  "growthHacks": ["string"],
  "influencerStrategy": {
    "tierFocus": "string",
    "outreachTemplate": "string",
    "compensationModel": "string"
  },
  "kpis": [
    { "metric": "string", "month1Target": "string", "month3Target": "string", "month6Target": "string" }
  ],
  "budget": {
    "total": "string",
    "breakdown": [
      { "category": "string", "amount": "string", "percentage": "string" }
    ]
  }
}
`.trim();

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

  const { idea, projectId } = await req.json();
  if (!idea) return NextResponse.json({ error: "Idea is required" }, { status: 400 });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const prompt = `${MARKETING_SYSTEM_PROMPT}\n\nSTARTUP IDEA: ${idea}\n\nGenerate a complete marketing campaign. Respond with valid JSON only.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    const supabase = getSupabase();
    const { data: saved, error } = await supabase
      .from("agent_outputs")
      .insert({
        user_id: userId,
        agent_type: "marketing",
        input_prompt: idea,
        output_data: data,
        project_id: projectId ?? null,
        status: "done",
      })
      .select()
      .single();

    if (error) console.error("Supabase save error:", error);
    return NextResponse.json({ data, outputId: saved?.id });
  } catch (e: any) {
    console.error("Marketing agent error:", e);
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
    .eq("agent_type", "marketing")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}