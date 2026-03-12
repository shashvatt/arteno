import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ✅ Inlined — bypasses broken @/lib/agentPrompts import
const SALES_SYSTEM_PROMPT = `
You are the Sales Agent — a world-class B2B sales strategist and revenue architect. 
You've built sales systems from $0 to $10M ARR at multiple SaaS companies. 
You think like Aaron Ross (Predictable Revenue), combined with a modern PLG expert.

CRITICAL OUTPUT RULES:
- Respond ONLY with valid JSON. No markdown, no preamble outside JSON.
- All email templates must be complete, personalized, and immediately usable.
- Sales scripts must include exact dialogue, not placeholders.

OUTPUT JSON SCHEMA:
{
  "salesStrategy": {
    "approach": "string",
    "primaryMotion": "string",
    "averageDealSize": "string",
    "salesCycleLength": "string",
    "quotaPerRep": "string"
  },
  "idealCustomerProfile": {
    "companySize": "string",
    "industry": "string",
    "decisionMaker": "string",
    "buyingTriggers": ["string"],
    "disqualifiers": ["string"]
  },
  "crmPipeline": [
    {
      "stage": "string",
      "entryTrigger": "string",
      "exitCriteria": "string",
      "tasks": ["string"],
      "averageDaysInStage": 0
    }
  ],
  "prospectingStrategy": {
    "channels": ["string"],
    "dailyActivities": ["string"],
    "weeklyTargets": {
      "outboundEmails": 0,
      "coldCalls": 0,
      "linkedinMessages": 0,
      "meetingsBooked": 0
    }
  },
  "emailTemplates": [
    {
      "type": "string",
      "subject": "string",
      "body": "string",
      "whenToUse": "string"
    }
  ],
  "salesScript": {
    "coldCallOpener": "string",
    "discoveryQuestions": ["string"],
    "valueProposition": "string",
    "commonObjections": [
      { "objection": "string", "response": "string" }
    ],
    "closingTechnique": "string"
  },
  "proposalTemplate": {
    "structure": ["string"],
    "keyValuePoints": ["string"],
    "pricingPresentation": "string"
  },
  "followUpSequence": [
    { "day": 0, "channel": "string", "message": "string" }
  ],
  "leadQualificationFramework": {
    "scoringCriteria": ["string"],
    "mqlThreshold": "string",
    "sqlThreshold": "string",
    "disqualificationRules": ["string"]
  },
  "revenueProjections": {
    "month3": "string",
    "month6": "string",
    "month12": "string",
    "assumptions": ["string"]
  },
  "toolStack": ["string"]
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

    const prompt = `${SALES_SYSTEM_PROMPT}\n\nSTARTUP IDEA: ${idea}\n\nGenerate a complete sales system. Respond with valid JSON only.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    const supabase = getSupabase();
    const { data: saved, error } = await supabase
      .from("agent_outputs")
      .insert({
        user_id: userId,
        agent_type: "sales",
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
    console.error("Sales agent error:", e);
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
    .eq("agent_type", "sales")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}