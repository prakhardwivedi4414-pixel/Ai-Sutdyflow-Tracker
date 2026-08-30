import express from "express";
import { generatePlan } from "../controllers/plannerController.js";
import { explainNotes } from "../controllers/explainerController.js";
import { generateFlashcards } from "../controllers/flashcardController.js";
import { generateQuiz } from "../controllers/quizController.js";

const router = express.Router();

// Health check route
router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "AI-StudyFlow Academic Suite API",
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// Planner endpoint
router.post("/plan", generatePlan);

// Explainer & Cornell Notes endpoint
router.post("/explain", explainNotes);

// Flashcards endpoint
router.post("/flashcards", generateFlashcards);

// Mock Exam & Quiz endpoint
router.post("/quiz", generateQuiz);

export default router;
