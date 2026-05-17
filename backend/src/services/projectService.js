const projects = [];
//project data is the data passed in.
//meaning req.body
export const createProject = (projectData) => {
    const newProject = {
        id: Date.now(),
        ...projectData
    };

    projects.push(newProject);
    return newProject;
};

export const getAllProjects = () => {
    return projects;
};

export const getProjectById = (id) => {
    return projects.find(p => p.id === id)
};

export const updateProject = (id, data) => {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    projects[index] = {
        ...projects[index],
        ...data
    };
    return projects[index];

};

export const deleteProject = (id) => {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects.splice(index, 1);
    return true;
};

