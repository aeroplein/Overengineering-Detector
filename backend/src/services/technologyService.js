import pool from "../config/db.js";

const technologyFields = `
    id,
    name,
    category,
    complexity_weight,
    COALESCE(description, '') AS description,
    COALESCE(best_for, '') AS best_for,
    COALESCE(risk_notes, '') AS risk_notes,
    COALESCE(alternatives, '') AS alternatives,
    COALESCE(docs_url, '') AS docs_url,
    COALESCE(is_active, TRUE) AS is_active
`;

export const getActiveTechnologies = async () => {
    const result = await pool.query(
        `SELECT ${technologyFields}
         FROM technologies
         WHERE COALESCE(is_active, TRUE) = TRUE
         ORDER BY category ASC, name ASC`
    );

    return result.rows;
};

export const getAllTechnologiesForAdmin = async () => {
    const result = await pool.query(
        `SELECT ${technologyFields}
         FROM technologies
         ORDER BY is_active DESC, category ASC, name ASC`
    );

    return result.rows;
};

export const getTechnologyById = async (id, includeInactive = false) => {
    const result = await pool.query(
        `SELECT ${technologyFields}
         FROM technologies
         WHERE id = $1
           AND ($2::boolean = TRUE OR COALESCE(is_active, TRUE) = TRUE)`,
        [id, includeInactive]
    );

    return result.rows[0];
};

export const createTechnology = async (technology) => {
    const result = await pool.query(
        `INSERT INTO technologies
         (name, category, complexity_weight, description, best_for, risk_notes, alternatives, docs_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${technologyFields}`,
        [
            technology.name,
            technology.category,
            technology.complexity_weight,
            technology.description,
            technology.best_for,
            technology.risk_notes,
            technology.alternatives,
            technology.docs_url,
            technology.is_active
        ]
    );

    return result.rows[0];
};

export const updateTechnology = async (id, technology) => {
    const result = await pool.query(
        `UPDATE technologies
         SET name = $1,
             category = $2,
             complexity_weight = $3,
             description = $4,
             best_for = $5,
             risk_notes = $6,
             alternatives = $7,
             docs_url = $8,
             is_active = $9
         WHERE id = $10
         RETURNING ${technologyFields}`,
        [
            technology.name,
            technology.category,
            technology.complexity_weight,
            technology.description,
            technology.best_for,
            technology.risk_notes,
            technology.alternatives,
            technology.docs_url,
            technology.is_active,
            id
        ]
    );

    return result.rows[0];
};

export const softDeleteTechnology = async (id) => {
    const result = await pool.query(
        `UPDATE technologies
         SET is_active = FALSE
         WHERE id = $1
         RETURNING ${technologyFields}`,
        [id]
    );

    return result.rows[0];
};
