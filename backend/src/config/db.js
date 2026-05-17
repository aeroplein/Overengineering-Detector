import pg from "pg";
const { Pool } = pg;

//here pool is the db connection manager.
//feature work could include resuing pools instead of creating new one every time.
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "overengineering_detector",
    password: "password",
    port: 5432
});

export default pool;