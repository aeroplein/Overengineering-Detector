import {
    analyzeProject,
    getAnalysisHistory
} from "../services/analysisService.js";

export const analyzeProjectController = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        const result = await analyzeProject(projectId, req.user.id);

        if (!result) {
            return res.status(404).json({ error: "Project not found." });
        }

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to analyze project." });
    }
};

export const getAnalysisHistoryController = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        const history = await getAnalysisHistory(projectId, req.user.id);

        if (!history) {
            return res.status(404).json({ error: "Project not found." });
        }

        res.status(200).json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch analysis history." });
    }
};
