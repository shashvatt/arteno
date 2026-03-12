import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const FOUNDER_PROMPT = `
You are the Founder Agent — an elite startup strategist and venture architect with 20+ years 
of experience founding, investing in, and advising billion-dollar startups.
Respond ONLY with valid JSON.
{
  "companyName": "string", "tagline": "string", "executiveSummary": "string",
  "problemStatement": { "problem": "string", "whyNowTiming": "string" },
  "solution": { "coreProduct": "string", "unfairAdvantage": "string" },
  "marketAnalysis": { "tam": "string", "sam": "string", "som": "string", "growthRate": "string", "keyTrends": ["string"] },
  "targetAudience": { "icp": "string", "psychographics": ["string"] },
  "businessModel": { "primaryRevenue": "string", "pricingStrategy": "string", "unitEconomics": { "ltv": "string", "cac": "string", "ltvCacRatio": "string", "paybackPeriod": "string" } },
  "goToMarket": { "phase1": "string", "phase2": "string", "phase3": "string", "acquisitionChannels": ["string"], "launchStrategy": "string" },
  "competitorAnalysis": [{ "name": "string", "weakness": "string", "howWeWin": "string" }],
  "fundingStrategy": { "stage": "string", "askAmount": "string", "useOfFunds": ["string"], "keyMilestones": ["string"], "targetInvestors": ["string"] },
  "pitchDeckOutline": [{ "slide": 1, "title": "string", "content": "string" }],
  "risks": [{ "risk": "string", "mitigation": "string" }],
  "investorEmail": "string", "nextSteps": ["string"]
}`.trim();

const SALES_PROMPT = `
You are the Sales Agent — a world-class B2B sales strategist.
Respond ONLY with valid JSON.
{
  "salesStrategy": { "approach": "string", "primaryMotion": "string", "averageDealSize": "string", "salesCycleLength": "string" },
  "idealCustomerProfile": { "companySize": "string", "industry": "string", "decisionMaker": "string", "buyingTriggers": ["string"] },
  "crmPipeline": [{ "stage": "string", "entryTrigger": "string", "exitCriteria": "string", "tasks": ["string"], "averageDaysInStage": 0 }],
  "emailTemplates": [{ "type": "string", "subject": "string", "body": "string", "whenToUse": "string" }],
  "salesScript": { "coldCallOpener": "string", "discoveryQuestions": ["string"], "valueProposition": "string", "commonObjections": [{ "objection": "string", "response": "string" }], "closingTechnique": "string" },
  "followUpSequence": [{ "day": 0, "channel": "string", "message": "string" }],
  "revenueProjections": { "month3": "string", "month6": "string", "month12": "string", "assumptions": ["string"] },
  "toolStack": ["string"]
}`.trim();

const MARKETING_PROMPT = `
You are the Marketing Agent — a world-class growth marketer and brand strategist.
Respond ONLY with valid JSON.
{
  "marketingStrategy": { "positioning": "string", "messagingPillar": "string", "brandVoice": "string", "targetEmotion": "string" },
  "launchStrategy": { "preLaunchWeeks": "string", "launchDay": "string", "postLaunchMonth": "string" },
  "socialMediaCampaign": { "twitter": { "threadIdea": "string", "posts": ["string"] }, "linkedin": { "posts": ["string"] }, "productHunt": { "tagline": "string", "description": "string", "firstComment": "string" } },
  "emailCampaign": [{ "type": "string", "subject": "string", "previewText": "string", "body": "string" }],
  "adCopy": [{ "platform": "string", "headline": "string", "body": "string", "cta": "string" }],
  "seoStrategy": { "primaryKeywords": ["string"], "longTailKeywords": ["string"], "contentClusters": ["string"], "estimatedTrafficMonth6": "string" },
  "growthHacks": ["string"],
  "kpis": [{ "metric": "string", "month1Target": "string", "month3Target": "string", "month6Target": "string" }],
  "budget": { "total": "string", "breakdown": [{ "category": "string", "amount": "string", "percentage": "string" }] }
}`.trim();

const ORCHESTRATOR_PROMPT = `
You are the Arteno Startup Orchestrator. Given a startup idea, synthesise all agents into a unified launch plan.
Respond ONLY with valid JSON.
{
  "startupName": "string", "tagline": "string",
  "founderSummary": "string", "hackerSummary": "string", "marketingSummary": "string", "salesSummary": "string",
  "weekByWeekPlan": [{ "week": 1, "focus": "string", "founderTask": "string", "hackerTask": "string", "marketingTask": "string", "salesTask": "string" }],
  "totalBudget": "string", "timeToRevenue": "string", "successMetrics": ["string"]
}`.trim();

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

async function runAgent(model: any, systemPrompt: string, idea: string) {
  const result = await model.generateContent(
    `${systemPrompt}\n\nSTARTUP IDEA: ${idea}\n\nRespond with valid JSON only.`
  );
  return JSON.parse(result.response.text());
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // ✅ Accept both "idea" and "prompt" — handles old + new page versions
  const idea = body.idea || body.prompt;
  const projectId = body.projectId ?? null;

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

    // ✅ Run all 4 agents in parallel
    const [founder, sales, marketing, orchestrator] = await Promise.all([
      runAgent(model, FOUNDER_PROMPT, idea),
      runAgent(model, SALES_PROMPT, idea),
      runAgent(model, MARKETING_PROMPT, idea),
      runAgent(model, ORCHESTRATOR_PROMPT, idea),
    ]);

    const data = { idea, founder, sales, marketing, orchestrator };

    const supabase = getSupabase();
    const { data: saved, error } = await supabase
      .from("agent_outputs")
      .insert({
        user_id: userId,
        agent_type: "build-startup",
        input_prompt: idea,
        output_data: data,
        project_id: projectId,
        status: "done",
      })
      .select()
      .single();

    if (error) console.error("Supabase save error:", error);
    return NextResponse.json({ data, outputId: saved?.id });
  } catch (e: any) {
    console.error("Build startup agent error:", e);
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
    .eq("agent_type", "build-startup")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}