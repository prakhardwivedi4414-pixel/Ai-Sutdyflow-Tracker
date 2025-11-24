import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import plannerRoutes from "./routes/plannerRoute.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend running!"));

app.use("/api", plannerRoutes);

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running at http://localhost:5000");
});
