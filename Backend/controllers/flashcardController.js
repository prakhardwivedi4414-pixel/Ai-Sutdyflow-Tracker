import { runGemini } from "../utils/geminiClient.js";
import { generatePseudoFlashcards } from "../utils/pseudoAI.js";

export async function generateFlashcards(req, res) {
    try {
        const { topic, notes, count = 8 } = req.body;
        const studyContent = notes || topic;

        if (!studyContent || !studyContent.trim()) {
            return res.status(400).json({ error: "Please provide a topic or notes to generate flashcards." });
        }

        const systemInstruction = `You are an elite academic flashcard creator specializing in Spaced Repetition (Anki style).
Generate high-yield, punchy, clear Q&A flashcards designed for maximum active recall and conceptual retention.
Always return your response as a valid JSON array of objects with keys: "front" (Question/Prompt), "back" (Clear, concise answer), "tag" (Short 1-word category like Definition, Mechanism, Formula, Trap, Application).
Return ONLY the raw JSON array with no markdown backticks or commentary.`;

        const prompt = `Create ${count} high-yield study flashcards for active recall based on:
"${studyContent}"

Format as JSON array:
[
  { "front": "Question/Prompt", "back": "Answer", "tag": "Category" }
]`;

        const aiResult = await runGemini(prompt, systemInstruction);

        if (aiResult) {
            try {
                // Clean potential markdown wrappers
                const cleaned = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
                const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
                const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return res.json({ flashcards: parsed, ai: "gemini" });
                }
            } catch (jsonErr) {
                console.warn("⚠️ JSON parse failed on Gemini flashcards, using fallback parser:", jsonErr.message);
            }
        }

        console.log("⚠️ Using structured fallback flashcards");
        const fallback = generatePseudoFlashcards(topic || notes, count);
        return res.json({ flashcards: fallback, ai: "fallback" });

    } catch (err) {
        console.error("❌ Flashcard controller error:", err);
        const fallback = generatePseudoFlashcards(req.body?.topic || req.body?.notes, 6);
        return res.json({ flashcards: fallback, ai: "fallback-error" });
    }
}
