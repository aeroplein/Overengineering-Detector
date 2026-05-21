import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET;

const extractToken = (req) => {
    try {
        // Prefer the HTTP-only cookie set by the login endpoint
        const cookieHeader = req?.headers?.cookie || "";
        const cookieToken = cookieHeader
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("token="))
            ?.slice("token=".length);

        if (cookieToken) {
            return cookieToken;
        }

        // Fall back to Authorization: Bearer <token> for API clients
        const authHeader = req?.headers?.authorization || "";
        const parts = authHeader.trim().split(/\s+/);
        if (parts.length === 2 && parts[0] === "Bearer") {
            return parts[1];
        }
    } catch (error) {
        console.error("Error extracting authentication token:", error);
    }

    return null;
};

export const authenticateToken = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ error: "Authorization token is required." });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

export const authorizeAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access is required." });
    }

    next();
};
