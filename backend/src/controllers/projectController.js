import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addTechnologiesToProject
} from "../services/projectService.js";

export const createProjectController = async (req, res) => {
    try {
        const project = await createProject({
            ...req.body,
            user_id: req.user.id
        });
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

export const getProjectByIdController = async (req, res) => {
    try {
        const id = req.params.id;
        const project = await getProjectById(id);
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
        const project = await updateProject(id, req.body);
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
        const deleted = await deleteProject(id);
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
        if (!Array.isArray(technologyIds)) {
            return res.status(400).json({ error: "Technologies must be an array." })
        }
        const result = await addTechnologiesToProject(projectId, technologyIds);
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add technologies to project." })
    };
}