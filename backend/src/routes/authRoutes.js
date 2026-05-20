import express from "express";

import {
    registerController,
    loginController
} from "../controllers/authController.js";

const router = express.Router();

router.post("/auth/register", registerController);
router.post("/auth/login", loginController);

export default router;