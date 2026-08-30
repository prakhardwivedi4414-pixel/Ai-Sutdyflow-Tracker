import { runGemini } from "../utils/geminiClient.js";
import { generatePseudoExplain } from "../utils/pseudoAI.js";

export async function explainNotes(req, res) {
    try {
        const { text, type = "explain" } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: "Please provide notes or text to analyze." });
        }

        const systemInstruction = `You are an expert academic tutor and pedagogical specialist.
Your goal is to help students learn deeply, retain concepts rapidly, and master exams.
Always use clean Markdown formatting, bold headers, structured tables where appropriate, and crisp bullet points.`;

        let modePrompt = "";
        switch (type.toLowerCase()) {
            case "cornell":
                modePrompt = `Format the following study notes strictly according to the Cornell Note-Taking System:
1. Markdown Table containing two columns: "🔍 Cues & Keywords" (left column) and "📖 Main Notes & Key Concepts" (right column).
2. "💡 Executive Summary & Synthesis" section at the bottom summarizing the entire material in 3-4 dense, memorable sentences.
Notes:
\n${text}`;
                break;

            case "cheatsheet":
                modePrompt = `Create a high-density, ultimate 1-page Academic Exam Cheat Sheet from these notes:
1. 📌 Core Definitions & Axioms.
2. 📐 Master Formulas & Conservation Laws (use clean equations / LaTeX).
3. ⚠️ Top 3 Exam Traps & Common Calculation Mistakes.
4. 🧠 Quick-Reference Concept Map / Flow.
Notes:
\n${text}`;
                break;

            case "solve":
                modePrompt = `Provide an exhaustive Step-by-Step Problem Solving Breakdown of the concept or problem in these notes:
1. 🎯 Given Information & System Constraints.
2. 📐 Governing Equations & First Principles.
3. 🔬 Step-by-Step Analytical Derivation / Workflow.
4. ✅ Verification & Sanity Check (dimensional analysis and boundary conditions).
Notes:
\n${text}`;
                break;

            case "simplify":
                modePrompt = `Explain the following study material in the simplest possible terms (ELI5 style). Use vivid real-world analogies, break down complicated jargon into intuitive words, and highlight the single most important rule to remember:\n\n${text}`;
                break;

            case "summarize":
                modePrompt = `Create a high-impact, executive structured summary of the following notes. Extract key takeaways, core mechanisms, and critical exam points in clean bullet points:\n\n${text}`;
                break;

            case "questions":
                modePrompt = `Generate 5 high-yield self-assessment exam questions based on these notes (ranging from conceptual understanding to application problems). Include brief answer hints for active recall:\n\n${text}`;
                break;

            case "examples":
                modePrompt = `Provide 3 vivid real-world examples and intuitive analogies that clearly demonstrate how the principles in these notes work in actual practice:\n\n${text}`;
                break;

            default:
                modePrompt = `Provide a comprehensive, crystal-clear conceptual explanation of the following study notes. Break down complex points step-by-step, include bulleted principles, and summarize key takeaways:\n\n${text}`;
                break;
        }

        const aiResult = await runGemini(modePrompt, systemInstruction);

        if (aiResult) {
            return res.json({ output: aiResult, ai: "gemini" });
        }

        console.log("⚠️ Using fallback pseudo AI for explainer");
        const fallback = generatePseudoExplain(text, type);
        return res.json({ output: fallback, ai: "fallback" });

    } catch (err) {
        console.error("❌ Explainer error:", err);
        const fallback = generatePseudoExplain(req.body?.text, req.body?.type);
        return res.json({ output: fallback, ai: "fallback-error" });
    }
}
