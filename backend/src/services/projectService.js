import pool from "../config/db.js";

export const createProject = async (projectData, userId) => {
    const { name, daily_users, scale, visibility = "private" } = projectData;

    const result = await pool.query(
        `INSERT INTO projects (user_id, name, daily_users, scale, visibility)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, name, daily_users, scale, visibility]
    );

    return result.rows[0];
};

export const getAllProjects = async (userId) => {
    const result = await pool.query(
        `SELECT *
         FROM projects
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
};

export const getAllTechnologies = async () => {
    const result = await pool.query(
        `SELECT MIN(id) AS id, name, category, complexity_weight
         FROM technologies
         GROUP BY LOWER(name), LOWER(category), name, category, complexity_weight
         ORDER BY category ASC, name ASC`
    );

    return result.rows;
};

export const getProjectById = async (id, userId) => {
    const result = await pool.query(
        `SELECT *
         FROM projects
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return result.rows[0];
};

export const updateProject = async (id, projectData, userId) => {
    const { name, daily_users, scale, visibility } = projectData;
    //extracts values from the incoming payload so they can be secureşy mapped to the placeholder arrays.
    /**
     * postgresql client library pg parses db network packets and constructs a standard response obj
     * {
        command: 'SELECT', // or 'INSERT', 'UPDATE'
        rowCount: 1,       // number of rows affected/returned
        oid: null,
        rows: [            // ALWAYS an array of objects
            { id: 1, name: "Detector", ... }
        ],
        fields: [...]      // Column metadata
        }

        why do we get the first index of the returning row bcs we searched for a specific sheet the folder comes back containing exaclty one that sheet
        instead of handing the entire folder to the client, we reach inside, grab the single sheet rows[0] and return just that sheet.
        PostgreSQL Database
       ↓ (returns a set of matching rows)
        [ Row 1 ]  ← result.rows array
            ↓
        result.rows[0] (Extracts the single object)
            ↓
        { id: 1, name: "Overengineering Detector" }

     */
    const result = await pool.query(
        `UPDATE projects
         SET name = $1, daily_users = $2, scale = $3, visibility = $4
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [name, daily_users, scale, visibility, id, userId]
    );
    return result.rows[0];
};

export const deleteProject = async (id, userId) => {
    const result = await pool.query(
        `DELETE FROM projects
          WHERE id = $1 AND user_id = $2
          RETURNING *`,
        [id, userId]
    );
    return result.rows[0];
};

export const addTechnologiesToProject = async (projectId, technologyIds, userId) => {
    const project = await getProjectById(projectId, userId);
    if (!project) {
        return null;
    }

    const existingTechnologies = await pool.query(
        `SELECT id
         FROM technologies
         WHERE id = ANY($1::int[])`,
        [technologyIds]
    );
    const existingTechnologyIds = new Set(existingTechnologies.rows.map((technology) => technology.id));
    const unknownTechnologyIds = technologyIds.filter((technologyId) => !existingTechnologyIds.has(technologyId));

    if (unknownTechnologyIds.length > 0) {
        return {
            technologies: [],
            unknownTechnologyIds
        };
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `DELETE FROM project_technologies
             WHERE project_id = $1`,
            [projectId]
        );

        if (technologyIds.length > 0) {
            const placeholders = technologyIds.map((_, i) => `($1, $${i + 2})`).join(", ");
            await client.query(
                `INSERT INTO project_technologies (project_id, technology_id)
                 VALUES ${placeholders}`,
                [projectId, ...technologyIds]
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return {
        technologies: await getProjectTechnologies(projectId, userId),
        unknownTechnologyIds: []
    };
};

export const getProjectTechnologies = async (projectId, userId) => {
    const project = await getProjectById(projectId, userId);
    if (!project) {
        return null;
    }

    const result = await pool.query(
        `SELECT t.* 
         FROM technologies t
         JOIN project_technologies pt ON t.id = pt.technology_id
         WHERE pt.project_id = $1
         ORDER BY t.category ASC, t.name ASC`,
        [projectId]
    );
    return result.rows;
};
