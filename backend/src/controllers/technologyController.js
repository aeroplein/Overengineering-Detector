import {
    createTechnology,
    getActiveTechnologies,
    getAllTechnologiesForAdmin,
    getTechnologyById,
    softDeleteTechnology,
    updateTechnology
} from "../services/technologyService.js";
import {
    normalizeTechnologyPayload,
    validateTechnologyPayload
} from "../utils/validators.js";

export const getKnowledgeTechnologiesController = async (req, res) => {
    try {
        res.json(await getActiveTechnologies());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch technology knowledge base." });
    }
};

export const getTechnologyByIdController = async (req, res) => {
    try {
        const technology = await getTechnologyById(req.params.id);
        if (!technology) {
            return res.status(404).json({ error: "Technology not found." });
        }
        res.json(technology);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch technology." });
    }
};

export const getAdminTechnologiesController = async (req, res) => {
    try {
        res.json(await getAllTechnologiesForAdmin());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch admin technologies." });
    }
};

export const createTechnologyController = async (req, res) => {
    try {
        const validationError = validateTechnologyPayload(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        res.status(201).json(await createTechnology(normalizeTechnologyPayload(req.body)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create technology." });
    }
};

export const updateTechnologyController = async (req, res) => {
    try {
        const validationError = validateTechnologyPayload(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const technology = await updateTechnology(req.params.id, normalizeTechnologyPayload(req.body));
        if (!technology) {
            return res.status(404).json({ error: "Technology not found." });
        }
        res.json(technology);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update technology." });
    }
};

export const softDeleteTechnologyController = async (req, res) => {
    try {
        const technology = await softDeleteTechnology(req.params.id);
        if (!technology) {
            return res.status(404).json({ error: "Technology not found." });
        }
        res.json(technology);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete technology." });
    }
};
