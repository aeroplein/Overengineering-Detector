import "./env.js";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL");
    client.release();
} catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
}

export default pool;
