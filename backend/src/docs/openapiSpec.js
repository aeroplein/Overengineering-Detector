export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Overengineer Detector API",
        version: "1.0.0",
        description: "JWT-protected Express API for project stack scoring."
    },
    servers: [
        {
            url: "http://localhost:3000"
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        }
    },
    paths: {
        "/auth/register": {
            post: {
                summary: "Register a user"
            }
        },
        "/auth/login": {
            post: {
                summary: "Log in and receive a JWT"
            }
        },
        "/projects": {
            get: {
                summary: "List projects for the logged-in user",
                security: [{ bearerAuth: [] }]
            },
            post: {
                summary: "Create a project for the logged-in user",
                security: [{ bearerAuth: [] }]
            }
        },
        "/projects/{id}": {
            get: {
                summary: "Get one owned project",
                security: [{ bearerAuth: [] }]
            },
            put: {
                summary: "Update one owned project",
                security: [{ bearerAuth: [] }]
            },
            delete: {
                summary: "Delete one owned project",
                security: [{ bearerAuth: [] }]
            }
        },
        "/projects/{id}/technologies": {
            get: {
                summary: "List technologies attached to an owned project",
                security: [{ bearerAuth: [] }]
            },
            post: {
                summary: "Replace the technology selection for an owned project",
                security: [{ bearerAuth: [] }]
            }
        },
        "/technologies": {
            get: {
                summary: "List available technologies",
                security: [{ bearerAuth: [] }]
            }
        },
        "/analysis/{projectId}": {
            post: {
                summary: "Run deterministic project analysis",
                security: [{ bearerAuth: [] }]
            }
        },
        "/analysis/{projectId}/history": {
            get: {
                summary: "List analysis history for an owned project",
                security: [{ bearerAuth: [] }]
            }
        }
    }
};
