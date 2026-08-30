import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/apiRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Mount API routes
app.use("/api", apiRoutes);

// Serve static frontend files from Code directory
const codeDir = path.resolve(__dirname, "../Code");
app.use(express.static(codeDir));

// Serve root by redirecting to Html/index.html
app.get("/", (req, res) => {
    res.redirect("/Html/index.html");
});

app.listen(PORT, () => {
    console.log(`✨ AI StudyFlow Server running at http://localhost:${PORT}`);
    console.log(`🚀 Open web app at: http://localhost:${PORT}/Html/index.html`);
});
