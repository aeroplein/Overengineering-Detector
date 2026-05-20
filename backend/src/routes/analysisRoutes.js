import express from "express";

import {
    analyzeProjectController,
    getAnalysisHistoryController
} from "../controllers/analysisController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analysis/:projectId", authenticateToken, analyzeProjectController);
router.get("/analysis/:projectId/history", authenticateToken, getAnalysisHistoryController);

export default router;
