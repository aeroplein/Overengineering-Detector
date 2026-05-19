import express from "express";
import pool from "./config/db.js";
import projectRoutes from "./routes/projectRoutes.js";
const app = express();
app.use(express.json());

app.use("/", projectRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Server is running"
    });
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

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

