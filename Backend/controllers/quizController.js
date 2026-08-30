import { runGemini } from "../utils/geminiClient.js";
import { generatePseudoQuiz } from "../utils/pseudoAI.js";

export async function generateQuiz(req, res) {
    try {
        const { topic, notes, difficulty = "AP / College Level", count = 5 } = req.body;
        const studyContent = notes || topic;

        if (!studyContent || !studyContent.trim()) {
            return res.status(400).json({ error: "Please provide a topic or notes to generate a quiz." });
        }

        const systemInstruction = `You are a university exam professor creating an interactive Multiple Choice Exam for students.
Create ${count} challenging, insightful, and pedagogical questions at the ${difficulty} difficulty level.
Each question MUST have exactly 4 options.
Always return your response as a valid JSON array of question objects with keys:
- "id": number (1, 2, ...)
- "question": string
- "options": array of 4 distinct strings
- "answerIndex": integer (0, 1, 2, or 3 representing the index of the correct option)
- "explanation": string (in-depth explanation of why the correct answer is right and why others are wrong)
- "hint": string (a subtle clue to guide the student without giving away the answer)
Return ONLY the raw JSON array with no markdown wrappers or commentary.`;

        const prompt = `Generate a ${count}-question exam for:
"${studyContent}"

Difficulty: ${difficulty}

Format as raw JSON array:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "explanation": "Detailed explanation...",
    "hint": "Helpful hint..."
  }
]`;

        const aiResult = await runGemini(prompt, systemInstruction);

        if (aiResult) {
            try {
                const cleaned = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
                const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
                const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return res.json({ quiz: parsed, ai: "gemini" });
                }
            } catch (jsonErr) {
                console.warn("⚠️ JSON parse failed on Gemini quiz, using fallback parser:", jsonErr.message);
            }
        }

        console.log("⚠️ Using structured fallback quiz");
        const fallback = generatePseudoQuiz(topic || notes);
        return res.json({ quiz: fallback, ai: "fallback" });

    } catch (err) {
        console.error("❌ Quiz controller error:", err);
        const fallback = generatePseudoQuiz(req.body?.topic || req.body?.notes);
        return res.json({ quiz: fallback, ai: "fallback-error" });
    }
}
