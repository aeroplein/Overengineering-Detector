import pool from "../config/db.js";

import {
    calculateScores,
    generateBadge,
    generateEvaluation,
    generateFlags,
    generateRadar,
    generateRecommendations
} from "./scoringService.js";
import { generateAiExplanation } from "./aiExplanationService.js";

const getOwnedProject = async (projectId, userId) => {
    const result = await pool.query(
        `SELECT *
         FROM projects
         WHERE id = $1 AND user_id = $2`,
        [projectId, userId]
    );

    return result.rows[0];
};

const getProjectTechnologiesForAnalysis = async (projectId) => {
    const result = await pool.query(
        `SELECT t.id, t.name, t.category, t.complexity_weight, COALESCE(t.alternatives, '') AS alternatives
         FROM project_technologies pt
         JOIN technologies t ON pt.technology_id = t.id
         WHERE pt.project_id = $1`,
        [projectId]
    );

    return result.rows;
};

const getTechnologiesByIds = async (technologyIds) => {
    if (technologyIds.length === 0) {
        return [];
    }

    const result = await pool.query(
        `SELECT id, name, category, complexity_weight, COALESCE(alternatives, '') AS alternatives
         FROM technologies
         WHERE id = ANY($1::int[])
           AND COALESCE(is_active, TRUE) = TRUE`,
        [technologyIds]
    );

    return result.rows;
};

export const generateSuggestions = (project, technologies, flags) => {
    const flagNames = new Set(flags.map((flag) => flag.flag_name));
    const suggestions = [];

    for (const technology of technologies) {
        if (technology.alternatives) {
            suggestions.push({
                technology: technology.name,
                suggestion: `Consider ${technology.alternatives} if it better fits the current project scale.`
            });
        }
    }

    if (flagNames.has("PREMATURE_OPTIMIZATION")) {
        suggestions.push({
            technology: "Infrastructure",
            suggestion: "Delay heavy infrastructure until traffic or reliability needs justify it."
        });
    }

    if (flagNames.has("UNDERENGINEERED_FOR_SCALE") || flagNames.has("THIN_STACK_FOR_SCALE")) {
        suggestions.push({
            technology: "Core stack",
            suggestion: "Add the minimum backend, database, and deployment support expected for this scale."
        });
    }

    if (project.scale === "Personal" && technologies.length > 6) {
        suggestions.push({
            technology: "Project scope",
            suggestion: "Remove nonessential tools until the project has a proven need for them."
        });
    }

    return suggestions.length > 0 ? suggestions : [{
        technology: "Current stack",
        suggestion: "No major alternatives needed for the selected context."
    }];
};

const buildAnalysisPayload = (project, technologies) => {
    const scores = calculateScores(project, technologies);
    const evaluation = generateEvaluation(scores);
    const flags = generateFlags(project, technologies, scores);
    const recommendations = generateRecommendations(flags);
    const suggestions = generateSuggestions(project, technologies, flags);
    const ai_explanation = generateAiExplanation({
        project,
        technologies,
        scores,
        flags,
        recommendations
    });

    return {
        scores,
        evaluation,
        flags,
        recommendations,
        suggestions,
        badge: generateBadge(scores, flags),
        radar: generateRadar(scores),
        ai_explanation
    };
};

export const analyzeProject = async (projectId, userId) => {
    const project = await getOwnedProject(projectId, userId);

    if (!project) {
        return null;
    }

    const technologies = await getProjectTechnologiesForAnalysis(projectId);
    const payload = buildAnalysisPayload(project, technologies);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const analysisResult = await client.query(
            `INSERT INTO analysis_results
             (project_id, total_score, frontend_score, backend_score, infrastructure_score, evaluation)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                projectId,
                payload.scores.total_score,
                payload.scores.frontend_score,
                payload.scores.backend_score,
                payload.scores.infrastructure_score,
                payload.evaluation
            ]
        );

        const analysis = analysisResult.rows[0];
        analysis.ai_explanation = payload.ai_explanation;

        for (const flag of payload.flags) {
            await client.query(
                `INSERT INTO analysis_flags (analysis_id, flag_name, severity)
                 VALUES ($1, $2, $3)`,
                [analysis.id, flag.flag_name, flag.severity]
            );
        }

        for (const recommendation of payload.recommendations) {
            await client.query(
                `INSERT INTO recommendations (analysis_id, recommendation_text)
                 VALUES ($1, $2)`,
                [analysis.id, recommendation]
            );
        }

        await client.query("COMMIT");

        return {
            analysis,
            scores: payload.scores,
            technologies,
            flags: payload.flags,
            recommendations: payload.recommendations,
            suggestions: payload.suggestions,
            badge: payload.badge,
            radar: payload.radar,
            ai_explanation: payload.ai_explanation
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const runWhatIfAnalysis = async (projectId, userId, requestPayload) => {
    const project = await getOwnedProject(projectId, userId);

    if (!project) {
        return null;
    }

    const simulatedProject = {
        ...project,
        name: requestPayload.name || project.name,
        daily_users: requestPayload.daily_users !== undefined ? Number(requestPayload.daily_users) : project.daily_users,
        scale: requestPayload.scale || project.scale,
        visibility: requestPayload.visibility || project.visibility
    };
    const technologyIds = Array.isArray(requestPayload.technologyIds)
        ? requestPayload.technologyIds.map((id) => Number(id))
        : [];
    const technologies = await getTechnologiesByIds(technologyIds);
    const payload = buildAnalysisPayload(simulatedProject, technologies);

    return {
        project: simulatedProject,
        technologies,
        analysis: {
            evaluation: payload.evaluation
        },
        scores: payload.scores,
        flags: payload.flags,
        recommendations: payload.recommendations,
        suggestions: payload.suggestions,
        badge: payload.badge,
        radar: payload.radar,
        ai_explanation: payload.ai_explanation
    };
};

export const getAnalysisHistory = async (projectId, userId) => {
    const project = await getOwnedProject(projectId, userId);

    if (!project) {
        return null;
    }

    const result = await pool.query(
        `SELECT ar.*,
                COALESCE(
                    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('flag_name', af.flag_name, 'severity', af.severity))
                    FILTER (WHERE af.id IS NOT NULL),
                    '[]'
                ) AS flags,
                COALESCE(
                    JSON_AGG(DISTINCT r.recommendation_text)
                    FILTER (WHERE r.id IS NOT NULL),
                    '[]'
                ) AS recommendations
         FROM analysis_results ar
         LEFT JOIN analysis_flags af ON af.analysis_id = ar.id
         LEFT JOIN recommendations r ON r.analysis_id = ar.id
         WHERE ar.project_id = $1
         GROUP BY ar.id
         ORDER BY ar.created_at DESC`,
        [projectId]
    );

    return result.rows;
};

const getLatestAnalysisWithDetails = async (projectId) => {
    const result = await pool.query(
        `SELECT ar.*,
                COALESCE(
                    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('flag_name', af.flag_name, 'severity', af.severity))
                    FILTER (WHERE af.id IS NOT NULL),
                    '[]'
                ) AS flags,
                COALESCE(
                    JSON_AGG(DISTINCT r.recommendation_text)
                    FILTER (WHERE r.id IS NOT NULL),
                    '[]'
                ) AS recommendations
         FROM analysis_results ar
         LEFT JOIN analysis_flags af ON af.analysis_id = ar.id
         LEFT JOIN recommendations r ON r.analysis_id = ar.id
         WHERE ar.project_id = $1
         GROUP BY ar.id
         ORDER BY ar.created_at DESC
         LIMIT 1`,
        [projectId]
    );

    return result.rows[0] || null;
};

export const getAnalysisDashboard = async (projectId, userId) => {
    const project = await getOwnedProject(projectId, userId);

    if (!project) {
        return null;
    }

    const technologies = await getProjectTechnologiesForAnalysis(projectId);
    const current = buildAnalysisPayload(project, technologies);
    const history = await getAnalysisHistory(projectId, userId);

    return {
        project,
        technologies,
        latestAnalysis: await getLatestAnalysisWithDetails(projectId),
        radar: current.radar,
        timeline: history.map((item) => ({
            id: item.id,
            created_at: item.created_at,
            total_score: item.total_score,
            frontend_score: item.frontend_score,
            backend_score: item.backend_score,
            infrastructure_score: item.infrastructure_score,
            evaluation: item.evaluation
        })),
        suggestions: current.suggestions,
        badge: current.badge
    };
};

export const compareProjects = async (leftProjectId, rightProjectId, userId) => {
    const [leftProject, rightProject] = await Promise.all([
        getOwnedProject(leftProjectId, userId),
        getOwnedProject(rightProjectId, userId)
    ]);

    if (!leftProject || !rightProject) {
        return null;
    }

    const [leftTechnologies, rightTechnologies] = await Promise.all([
        getProjectTechnologiesForAnalysis(leftProjectId),
        getProjectTechnologiesForAnalysis(rightProjectId)
    ]);
    const left = buildAnalysisPayload(leftProject, leftTechnologies);
    const right = buildAnalysisPayload(rightProject, rightTechnologies);

    return {
        left: {
            project: leftProject,
            technologies: leftTechnologies,
            scores: left.scores,
            badge: left.badge,
            evaluation: left.evaluation
        },
        right: {
            project: rightProject,
            technologies: rightTechnologies,
            scores: right.scores,
            badge: right.badge,
            evaluation: right.evaluation
        },
        delta: {
            total_score: right.scores.total_score - left.scores.total_score,
            overengineering: right.scores.penalty_score - left.scores.penalty_score,
            underengineering: right.scores.underengineering_score - left.scores.underengineering_score
        }
    };
};
