import express from "express";

import {
    createProjectController,
    getAllProjectsController,
    getProjectByIdController,
    updateProjectController,
    deleteProjectController,
    addTechnologiesToProjectController
} from "../controllers/projectController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/projects", authenticateToken, createProjectController);
router.get("/projects", authenticateToken, getAllProjectsController);
router.get("/projects/:id", authenticateToken, getProjectByIdController);
router.put("/projects/:id", authenticateToken, updateProjectController);
router.delete("/projects/:id", authenticateToken, deleteProjectController);
router.post("/projects/:id/technologies", authenticateToken, addTechnologiesToProjectController);

export default router;