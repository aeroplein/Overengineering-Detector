import pool from "../config/db.js";

import {
    calculateScores,
    generateEvaluation,
    generateFlags,
    generateRecommendations
} from "./scoringService.js";
import { generateAiExplanation } from "./aiExplanationService.js";

export const analyzeProject = async (projectId, userId) => {
    const projectResult = await pool.query(
        `SELECT *
         FROM projects
         WHERE id = $1 AND user_id = $2`,
        [projectId, userId]
    );
    const project = projectResult.rows[0];

    if (!project) {
        return null;
    }

    const technologiesResult = await pool.query(
        `SELECT t.id, t.name, t.category, t.complexity_weight
         FROM project_technologies pt
         JOIN technologies t ON pt.technology_id = t.id
         WHERE pt.project_id = $1`,
        [projectId]
    );
    const technologies = technologiesResult.rows;

    const scores = calculateScores(project, technologies);
    const evaluation = generateEvaluation(scores);
    const flags = generateFlags(project, technologies, scores);
    const recommendations = generateRecommendations(flags);
    const ai_explanation = generateAiExplanation({
        project,
        technologies,
        scores,
        flags,
        recommendations
    });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const analysisResult = await client.query(
            `INSERT INTO analysis_results
             (project_id, total_score, frontend_score, backend_score, infrastructure_score, evaluation)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                projectId,
                scores.total_score,
                scores.frontend_score,
                scores.backend_score,
                scores.infrastructure_score,
                evaluation
            ]
        );

        const analysis = analysisResult.rows[0];
        analysis.ai_explanation = analysis.ai_explanation || ai_explanation;

        for (const flag of flags) {
            await client.query(
                `INSERT INTO analysis_flags (analysis_id, flag_name, severity)
                VALUES ($1, $2, $3)`,
                [analysis.id, flag.flag_name, flag.severity]
            );
        }

        for (const recommendation of recommendations) {
            await client.query(
                `INSERT INTO recommendations (analysis_id, recommendation_text)
                 VALUES ($1, $2)`,
                [analysis.id, recommendation]
            );
        }

        await client.query('COMMIT');

        return {
            analysis,
            scores,
            technologies,
            flags,
            recommendations,
            ai_explanation
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getAnalysisHistory = async (projectId, userId) => {
    const projectResult = await pool.query(
        `SELECT id
         FROM projects
         WHERE id = $1 AND user_id = $2`,
        [projectId, userId]
    );

    if (!projectResult.rows[0]) {
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
