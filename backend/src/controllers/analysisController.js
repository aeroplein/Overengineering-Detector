import {
    analyzeProject,
    compareProjects,
    getAnalysisDashboard,
    getAnalysisHistory,
    runWhatIfAnalysis
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

export const getAnalysisDashboardController = async (req, res) => {
    try {
        const dashboard = await getAnalysisDashboard(req.params.projectId, req.user.id);

        if (!dashboard) {
            return res.status(404).json({ error: "Project not found." });
        }

        res.status(200).json(dashboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch analysis dashboard." });
    }
};

export const runWhatIfAnalysisController = async (req, res) => {
    try {
        const result = await runWhatIfAnalysis(req.params.projectId, req.user.id, req.body || {});

        if (!result) {
            return res.status(404).json({ error: "Project not found." });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to run what-if analysis." });
    }
};

export const compareProjectsController = async (req, res) => {
    try {
        const { leftProjectId, rightProjectId } = req.query;

        if (!leftProjectId || !rightProjectId) {
            return res.status(400).json({ error: "leftProjectId and rightProjectId are required." });
        }

        const comparison = await compareProjects(leftProjectId, rightProjectId, req.user.id);

        if (!comparison) {
            return res.status(404).json({ error: "One or both projects were not found." });
        }

        res.status(200).json(comparison);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to compare projects." });
    }
};
