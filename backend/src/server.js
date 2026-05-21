import express from "express";
import "./config/env.js";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./config/db.js";
import projectRoutes from "./routes/projectRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import technologyRoutes from "./routes/technologyRoutes.js";
import { openApiSpec } from "./docs/openapiSpec.js";
import authRoutes from "./routes/authRoutes.js";
import swaggerUiDist from "swagger-ui-dist";


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../../frontend");
const swaggerUiPath = swaggerUiDist.getAbsoluteFSPath();

app.use(express.json());
app.use(express.static(frontendPath));
app.use("/api-docs/assets", express.static(swaggerUiPath));

app.get("/api-docs", (req, res) => {
    res.send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Overengineering Detector API Docs</title>
    <link rel="stylesheet" href="/api-docs/assets/swagger-ui.css" />
    <style>body { margin: 0; }</style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="/api-docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api-docs/assets/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: "/openapi.json",
                dom_id: "#swagger-ui",
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout",
                persistAuthorization: true
            });
        };
    </script>
</body>
</html>`);
});

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

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});

process.on("exit", (code) => {
    console.log("Process is exiting with code:", code);
});

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

export default server;

