import express from "express";

import {
    createTechnologyController,
    getAdminTechnologiesController,
    getKnowledgeTechnologiesController,
    getTechnologyByIdController,
    softDeleteTechnologyController,
    updateTechnologyController
} from "../controllers/technologyController.js";
import {
    authenticateToken,
    authorizeAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/knowledge/technologies", authenticateToken, getKnowledgeTechnologiesController);
router.get("/technologies/:id", authenticateToken, getTechnologyByIdController);

router.get("/admin/technologies", authenticateToken, authorizeAdmin, getAdminTechnologiesController);
router.post("/admin/technologies", authenticateToken, authorizeAdmin, createTechnologyController);
router.put("/admin/technologies/:id", authenticateToken, authorizeAdmin, updateTechnologyController);
router.delete("/admin/technologies/:id", authenticateToken, authorizeAdmin, softDeleteTechnologyController);

export default router;
