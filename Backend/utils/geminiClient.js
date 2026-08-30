import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Loaded GEMINI_API_KEY exists?", !!apiKey);

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Available candidate models in order of priority
const CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest"
];

export async function runGemini(prompt, systemInstruction = "") {
    if (!genAI || !apiKey) {
        console.warn("⚠️ No GEMINI_API_KEY provided in .env");
        return null;
    }

    const fullPrompt = systemInstruction 
        ? `[INSTRUCTIONS]: ${systemInstruction}\n\n[PROMPT]: ${prompt}`
        : prompt;

    for (const modelName of CANDIDATE_MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            if (text && text.trim()) {
                return text.trim();
            }
        } catch (err) {
            console.warn(`Gemini Model ${modelName} error:`, err.message || err);
            // Try next candidate model
        }
    }

    return null;
}
