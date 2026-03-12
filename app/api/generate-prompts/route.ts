import { NextResponse } from "next/server";
import { generatePromptPack } from "@/services/llm/gemini";

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();

    const result = await generatePromptPack(idea);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Generate prompts error:", error);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
