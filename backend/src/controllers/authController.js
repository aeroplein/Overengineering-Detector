import {
    registerUser,
    loginUser
} from "../services/authService.js";

export const registerController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await registerUser({ email, password });

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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const result = await loginUser({ email, password });

        if (!result) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to login." });
    }
};