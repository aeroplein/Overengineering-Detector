import pool from "../config/db.js";

export const createProject = async (projectData) => {
    const { user_id = null, name, daily_users, scale, visibility = "private" } = projectData;
    
    const result = await pool.query(
        `INSERT INTO projects (user_id, name, daily_users, scale, visibility)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, name, daily_users, scale, visibility]
    );

    return result.rows[0];
};

export const getAllProjects = async () => {
    const result = await pool.query(
        `SELECT *
         FROM projects
         ORDER BY created_at DESC`
    );
    return result.rows;
};

export const getProjectById = async (id) => {
    const result = await pool.query(
        `SELECT *
         FROM projects
         WHERE id = $1`,
        [id]
    );
    return result.rows[0];
};

export const updateProject = async (id, projectData) => {
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
         WHERE id = $5
         RETURNING *`,
        [name, daily_users, scale, visibility, id]
    );
    return result.rows[0];
};

export const deleteProject = async (id) => {
    const result = await pool.query(
         `DELETE FROM projects
          WHERE id = $1
          RETURNING *`,
        [id]
    );
    return result.rows[0];
};

 
