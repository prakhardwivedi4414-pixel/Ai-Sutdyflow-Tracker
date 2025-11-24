import { runGemini } from "../utils/geminiClient.js";
import { generatePseudoPlan } from "../utils/pseudoAI.js";

export async function generatePlan(req, res) {
    try {
        const { subjects, hours } = req.body;

        // Try real AI first
        const result = await runGemini(
            `Create a clear 14-day study schedule for: ${subjects.join(", ")}`
        );

        if (!result || result.includes("AI Error")) {
            console.log("⚠️ Using fallback pseudo AI");
            const fallback = generatePseudoPlan(subjects, hours);
            return res.json({ output: fallback, ai: "fallback" });
        }

        res.json({ output: result, ai: "gemini" });

    } catch (err) {
        console.log("❌ Total AI failure, using fallback");
        const fallback = generatePseudoPlan(req.body.subjects, req.body.hours);
        res.json({ output: fallback, ai: "fallback-error" });
    }
}
