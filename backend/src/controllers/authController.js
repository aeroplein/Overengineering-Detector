import {
    registerUser,
    loginUser
} from "../services/authService.js";
import {
    normalizeAuthPayload,
    validateAuthPayload
} from "../utils/validators.js";

export const registerController = async (req, res) => {
    try {
        const validationError = validateAuthPayload(req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const user = await registerUser(normalizeAuthPayload(req.body));

        if (!user) {
            return res.status(409).json({ error: "Email is already registered." });
        }

        res.status(201).json({
            message: "User registered successfully.",
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to register user." });
    }
};

export const loginController = async (req, res) => {
    try {
        const validationError = validateAuthPayload(req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const result = await loginUser(normalizeAuthPayload(req.body));

        if (!result) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isProd = process.env.NODE_ENV === "production";

        res.cookie("token", result.token, {
            httpOnly: true,
            sameSite: "lax",
            secure: isProd,
            maxAge: 24 * 60 * 60 * 1000   // 1 day
        });

        res.status(200).json({ user: result.user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to login." });
    }
};

export const logoutController = (req, res) => {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    res.status(200).json({ message: "Signed out." });
};
