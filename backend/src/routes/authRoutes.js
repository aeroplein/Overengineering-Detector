import express from "express";

import {
    registerController,
    loginController,
    logoutController
} from "../controllers/authController.js";

const router = express.Router();

router.post("/auth/register", registerController);
router.post("/auth/login", loginController);
router.post("/auth/logout", logoutController);

export default router;