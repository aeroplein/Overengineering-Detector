import express from "express";

import {
    analyzeProjectController,
    getAnalysisHistoryController
} from "../controllers/analysisController.js";

const router = express.Router();

router.post("/analysis/:projectId", analyzeProjectController);
router.get("/analysis/:projectId/history", getAnalysisHistoryController);

export default router;