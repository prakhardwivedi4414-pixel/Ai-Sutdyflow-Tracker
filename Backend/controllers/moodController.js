import { runGemini } from "../utils/geminiClient.js";
import { generatePseudoMood } from "../utils/pseudoAI.js";

export async function coachMood(req, res) {
    try {
        const { mood = "Neutral", notes = "" } = req.body;

        const systemInstruction = `You are an empathetic, world-class AI cognitive performance and study coach.
Your job is to adapt the student's study methodology based on their exact emotional and physiological state.
Provide concise, highly motivating, structured guidance in Markdown format with bullet points and bold highlights.`;

        const prompt = `The student is currently feeling: **${mood}**.
${notes ? `Additional context from student: "${notes}"` : ""}

Provide a tailored, empathetic study plan containing:
1. 🎯 **Tailored Study Mode & Strategy** (How to study in this state).
2. ⏱️ **Recommended Focus / Break Rhythm** (e.g. Pomodoro 25/5, Deep Work 50/10, or Micro-bursts 15/5).
3. 🚀 **3 Immediate Actionable Steps for This Session**.
4. 🎧 **Recommended Study Soundtrack / Frequency** (e.g. Binaural Beats, Lo-Fi, Nature Sounds, Ambient Classical).
5. 💫 **One High-Impact Motivational Thought** to empower them right now.`;

        const aiResult = await runGemini(prompt, systemInstruction);

        if (aiResult) {
            return res.json({ output: aiResult, ai: "gemini" });
        }

        console.log("⚠️ Using fallback pseudo AI for mood coach");
        const fallback = generatePseudoMood(mood);
        return res.json({ output: fallback, ai: "fallback" });

    } catch (err) {
        console.error("❌ Mood coach error:", err);
        const fallback = generatePseudoMood(req.body?.mood);
        return res.json({ output: fallback, ai: "fallback-error" });
    }
}
