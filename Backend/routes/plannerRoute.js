import express from "express";
import { generatePlan } from "../controllers/plannerController.js";

const router = express.Router();

router.post("/plan", generatePlan);

export default router;
