import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const getJwtSecret = () => process.env.JWT_SECRET;

const getRoleForEmail = (email, existingRole = "user") => {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    return adminEmail && email.toLowerCase() === adminEmail ? "admin" : existingRole;
};

export const registerUser = async ({ email, password }) => {
    const existingUser = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
    );

    if (existingUser.rows[0]) {
        return null;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
        [email, passwordHash, getRoleForEmail(email)]
    );

    return result.rows[0];
};

export const loginUser = async ({ email, password }) => {
    const result = await pool.query(
        `SELECT *
         FROM users
         WHERE email = $1`,
        [email]
    );

    const user = result.rows[0];

    if (!user) {
        return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
        return null;
    }

    const role = getRoleForEmail(user.email, user.role || "user");

    if (role !== user.role) {
        await pool.query(
            `UPDATE users
             SET role = $1
             WHERE id = $2`,
            [role, user.id]
        );
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role
        },
        getJwtSecret(),
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role
        }
    };
};

export const verifyToken = (token) => {
    return jwt.verify(token, getJwtSecret());
};
