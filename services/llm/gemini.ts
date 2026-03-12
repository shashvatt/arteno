import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BLUEPRINT_PROMPT,
  ROADMAP_PROMPT,
  PROMPTS_PROMPT,
  FEASIBILITY_PROMPT,
} from "./promptTemplates";

async function callGemini(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("KEY:", apiKey?.slice(0, 12));

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
   model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export async function generateBlueprint(idea: string) {
  return callGemini(BLUEPRINT_PROMPT(idea));
}

export async function generateRoadmap(idea: string) {
  return callGemini(ROADMAP_PROMPT(idea));
}

export async function generatePromptPack(idea: string) {
  return callGemini(PROMPTS_PROMPT(idea));
}

export async function scoreFeasibility(idea: string) {
  return callGemini(FEASIBILITY_PROMPT(idea));
}
