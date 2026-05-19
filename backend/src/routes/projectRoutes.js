import express from "express";
import{
    createProjectController,
    getAllProjectsController,
    getProjectByIdController,
    updateProjectController,
    deleteProjectController
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/projects", createProjectController);
router.get("/projects", getAllProjectsController);
router.get("/projects/:id", getProjectByIdController);
router.put("/projects/:id", updateProjectController);
router.delete("/projects/:id", deleteProjectController);

export default router;