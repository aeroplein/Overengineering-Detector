import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./config/db.js";
import projectRoutes from "./routes/projectRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import technologyRoutes from "./routes/technologyRoutes.js";
import { openApiSpec } from "./docs/openapiSpec.js";
import authRoutes from "./routes/authRoutes.js";


import dotenv from "dotenv";
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../../frontend");

app.use(express.json());
app.use(express.static(frontendPath));

app.use("/", authRoutes);
app.use("/", projectRoutes);
app.use("/", analysisRoutes);
app.use("/", technologyRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Server is running"
    });
});

app.get("/openapi.json", (req, res) => {
    res.json(openApiSpec);
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

