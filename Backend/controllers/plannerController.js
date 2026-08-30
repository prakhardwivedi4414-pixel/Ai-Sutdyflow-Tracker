import { runGemini } from "../utils/geminiClient.js";
import { generatePseudoPlan } from "../utils/pseudoAI.js";

export async function generatePlan(req, res) {
    try {
        const { subjects, hours = 3 } = req.body;

        if (!subjects || (Array.isArray(subjects) && subjects.length === 0)) {
            return res.status(400).json({ error: "Please provide at least one subject." });
        }

        // Format subjects cleanly for prompt
        let formattedSubjects = "";
        if (Array.isArray(subjects)) {
            formattedSubjects = subjects.map(item => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                    return `${item.subject || item.name || "Subject"}${item.deadline ? ` (Target: ${item.deadline})` : ""}`;
                }
                return String(item);
            }).join(", ");
        } else {
            formattedSubjects = String(subjects);
        }

        const systemInstruction = "You are an elite academic tutor and study planner. Format study schedules clearly with Markdown headers, bullet points, day-by-day actionable tasks, and Pomodoro break recommendations. Be realistic, highly organized, and motivating.";

        const prompt = `Create a realistic, highly structured 14-day study plan for a student.
Target Daily Study Time: ${hours} hours/day.
Subjects & Deadlines: ${formattedSubjects}.

Structure your response with:
1. Executive Plan Overview (Goals & Strategy).
2. 14-Day Breakdown (Grouped logically or Day 1 to Day 14 with specific topics, subtopics, and time allocations).
3. Active Recall & Revision Milestones.
4. Top 3 Golden Study Tips for this specific combination of subjects.`;

        const aiResult = await runGemini(prompt, systemInstruction);

        if (aiResult) {
            return res.json({ output: aiResult, ai: "gemini" });
        }

        console.log("⚠️ Using fallback pseudo AI for study plan");
        const fallback = generatePseudoPlan(subjects, hours);
        return res.json({ output: fallback, ai: "fallback" });

    } catch (err) {
        console.error("❌ Planner error:", err);
        const fallback = generatePseudoPlan(req.body.subjects, req.body.hours);
        return res.json({ output: fallback, ai: "fallback-error" });
    }
}
