import express from "express";

import {
    analyzeProjectController,
    compareProjectsController,
    getAnalysisDashboardController,
    getAnalysisHistoryController,
    runWhatIfAnalysisController
} from "../controllers/analysisController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/analysis/compare", authenticateToken, compareProjectsController);
router.post("/analysis/:projectId", authenticateToken, analyzeProjectController);
router.get("/analysis/:projectId/dashboard", authenticateToken, getAnalysisDashboardController);
router.get("/analysis/:projectId/history", authenticateToken, getAnalysisHistoryController);
router.post("/analysis/:projectId/what-if", authenticateToken, runWhatIfAnalysisController);

export default router;
