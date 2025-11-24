import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

console.log("Loaded GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-pro-vision"
});

export async function runGemini(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = await response.text();
        return text;

    } catch (err) {
        console.error("Gemini Error:", err);
        return "AI Error: " + JSON.stringify(err);
    }
}
