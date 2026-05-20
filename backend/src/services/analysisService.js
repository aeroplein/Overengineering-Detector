import pool from "../config/db.js";

import {
    calculateScores,
    generateEvaluation,
    generateFlags,
    generateRecommendations
} from "./scoringService.js";

export const analyzeProject = async (projectId) => {
    const projectResult = await pool.query(
        `SELECT *
         FROM projects
         WHERE id = $1`,
        [projectId]
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
    const evaluation = generateEvaluation(scores.total_score);
    const flags = generateFlags(project, technologies, scores);
    const recommendations = generateRecommendations(flags);

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
            recommendations
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getAnalysisHistory = async (projectId) => {
    const result = await pool.query(
        `SELECT *
         FROM analysis_results
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId]
    );

    return result.rows;
};