import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
} from "../services/projectService.js";

export const createProjectController = async (req, res) => {
    try{
        const project = await createProject(req.body);
        res.status(201).json(project);
    }catch(error){
        console.error(error);
        res.status(500).json({error: "failed to create project."});
    }
};

export const getAllProjectsController = async (req, res) =>{
    try{
        const projects = await getAllProjects();
        res.json(projects);
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Failed to fecth projects."})
    }
};

export const getProjectByIdController = async (req, res) => {
    try{
        const id = req.params.id;
        const project = await getProjectById(id);
        if(!project){
            return res.status(404).json({error: "Project not found."});
        }
        res.status(200).json(project);
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Failed to fetch project."})
    }
};

export const updateProjectController = async (req,res) =>{
    try{
        const id = req.params.id;
        const project = await updateProject(id, req.body);
        if(!project){
            return res.status(404).json({error: "Project not found."});
        }
        res.status(200).json(project);
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Failed to update project."})
    };
};

export const deleteProjectController = async (req, res) => {
    try{
        const id = req.params.id;
        const deleted = await deleteProject(id);
        if(!deleted){
            return res.status(404).json({error: "Project not found."});
        }
        res.status(204).send(); //this means 204: No content yani delete worked nothing to return
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Failed to delete project."})
    };
}