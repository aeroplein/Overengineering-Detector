import {
    createProject,
    getAllProjects,
    getAllTechnologies,
    getProjectTechnologies,
    getProjectById,
    updateProject,
    deleteProject,
    addTechnologiesToProject
} from "../services/projectService.js";
import {
    normalizeProjectPayload,
    normalizeTechnologyIds,
    validateProjectPayload,
    validateTechnologyIds
} from "../utils/validators.js";

export const createProjectController = async (req, res) => {
    try {
        const validationError = validateProjectPayload(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const project = await createProject(normalizeProjectPayload(req.body), req.user.id);
        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "failed to create project." });
    }
};

export const getAllProjectsController = async (req, res) => {
    try {
        const projects = await getAllProjects(req.user.id);
        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch projects." })
    }
};

export const getAllTechnologiesController = async (req, res) => {
    try {
        const technologies = await getAllTechnologies();
        res.status(200).json(technologies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch technologies." });
    }
};

export const getProjectByIdController = async (req, res) => {
    try {
        const id = req.params.id;
        const project = await getProjectById(id, req.user.id);
        if (!project) {
            return res.status(404).json({ error: "Project not found." });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch project." })
    }
};

export const updateProjectController = async (req, res) => {
    try {
        const id = req.params.id;
        const validationError = validateProjectPayload(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const project = await updateProject(id, normalizeProjectPayload(req.body), req.user.id);
        if (!project) {
            return res.status(404).json({ error: "Project not found." });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update project." })
    };
};

export const deleteProjectController = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await deleteProject(id, req.user.id);
        if (!deleted) {
            return res.status(404).json({ error: "Project not found." });
        }
        res.status(204).send(); //this means 204: No content yani delete worked nothing to return
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete project." })
    };
};

export const addTechnologiesToProjectController = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { technologyIds } = req.body || {};
        const validationError = validateTechnologyIds(technologyIds);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }
        const result = await addTechnologiesToProject(projectId, normalizeTechnologyIds(technologyIds), req.user.id);
        if (!result) {
            return res.status(404).json({ error: "Project not found." });
        }
        if (result.unknownTechnologyIds.length > 0) {
            return res.status(400).json({
                error: "One or more technology ids do not exist.",
                unknownTechnologyIds: result.unknownTechnologyIds
            });
        }
        res.status(200).json(result.technologies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add technologies to project." })
    };
};

export const getProjectTechnologiesController = async (req, res) => {
    try {
        const projectId = req.params.id;
        const result = await getProjectTechnologies(projectId, req.user.id);
        if (!result) {
            return res.status(404).json({ error: "Project not found." });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch project technologies." });
    }
};
