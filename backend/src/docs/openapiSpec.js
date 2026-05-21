const errorResponse = {
    type: "object",
    properties: {
        error: { type: "string", example: "Validation error message." }
    }
};

const authPayload = {
    type: "object",
    required: ["email", "password"],
    properties: {
        email: { type: "string", format: "email", example: "student@example.com" },
        password: { type: "string", minLength: 6, example: "secret123" }
    }
};

const projectPayload = {
    type: "object",
    required: ["name", "daily_users", "scale"],
    properties: {
        name: { type: "string", example: "Campus Notes API" },
        daily_users: { type: "integer", minimum: 0, example: 250 },
        scale: { type: "string", enum: ["Personal", "Startup", "Enterprise"], example: "Startup" },
        visibility: { type: "string", enum: ["private", "public"], default: "private", example: "private" }
    }
};

const technologyPayload = {
    type: "object",
    required: ["name", "category", "complexity_weight"],
    properties: {
        name: { type: "string", example: "PostgreSQL" },
        category: { type: "string", example: "Database" },
        complexity_weight: { type: "integer", minimum: 1, maximum: 10, example: 4 },
        description: { type: "string", example: "Relational database for structured application data." },
        best_for: { type: "string", example: "Apps needing relational integrity and SQL querying." },
        risk_notes: { type: "string", example: "May be unnecessary for tiny static projects." },
        alternatives: { type: "string", example: "SQLite, Supabase, Firebase" },
        docs_url: { type: "string", format: "uri", example: "https://www.postgresql.org/docs/" },
        is_active: { type: "boolean", example: true }
    }
};

const idParam = (name = "id", description = "Resource id") => ({
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "integer", minimum: 1 }
});

const jsonBody = (schema) => ({
    required: true,
    content: {
        "application/json": { schema }
    }
});

const jsonResponse = (description, schema) => ({
    description,
    content: {
        "application/json": { schema }
    }
});

export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Overengineering Detector API",
        version: "1.0.0",
        description: "JWT-protected Express API for project stack scoring, analysis history, what-if analysis, comparison, and admin technology management. Login sets an HTTP-only cookie; Swagger also supports Authorization: Bearer tokens for API clients."
    },
    servers: [
        { url: "http://localhost:3000", description: "Local default" },
        { url: "http://localhost:3001", description: "Alternative local port" }
    ],
    tags: [
        { name: "Auth" },
        { name: "Projects" },
        { name: "Technologies" },
        { name: "Admin Technologies" },
        { name: "Analysis" },
        { name: "System" }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            Error: errorResponse,
            AuthPayload: authPayload,
            User: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    email: { type: "string", format: "email", example: "student@example.com" },
                    role: { type: "string", enum: ["user", "admin"], example: "user" }
                }
            },
            ProjectPayload: projectPayload,
            Project: {
                allOf: [
                    projectPayload,
                    {
                        type: "object",
                        properties: {
                            id: { type: "integer", example: 1 },
                            user_id: { type: "integer", example: 1 },
                            created_at: { type: "string", format: "date-time" },
                            updated_at: { type: "string", format: "date-time" }
                        }
                    }
                ]
            },
            TechnologyPayload: technologyPayload,
            Technology: {
                allOf: [
                    technologyPayload,
                    {
                        type: "object",
                        properties: {
                            id: { type: "integer", example: 3 },
                            duplicate_count: { type: "integer", example: 1 }
                        }
                    }
                ]
            },
            TechnologySelectionPayload: {
                type: "object",
                required: ["technologyIds"],
                properties: {
                    technologyIds: {
                        type: "array",
                        items: { type: "integer", minimum: 1 },
                        example: [1, 2, 5]
                    }
                }
            },
            Scores: {
                type: "object",
                properties: {
                    frontend_score: { type: "number", example: 6 },
                    backend_score: { type: "number", example: 5 },
                    infrastructure_score: { type: "number", example: 10 },
                    penalty_score: { type: "number", example: 8 },
                    necessary_complexity: { type: "number", example: 10 },
                    underengineering_score: { type: "number", example: 0 },
                    total_score: { type: "number", example: 29 },
                    complexity_direction: { type: "string", example: "overengineering" }
                }
            },
            Analysis: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 10 },
                    project_id: { type: "integer", example: 1 },
                    evaluation: { type: "string", example: "Moderately complex but acceptable." },
                    scores: { $ref: "#/components/schemas/Scores" },
                    flags: { type: "array", items: { type: "object" } },
                    recommendations: { type: "array", items: { type: "string" } },
                    created_at: { type: "string", format: "date-time" }
                }
            },
            WhatIfPayload: {
                type: "object",
                properties: {
                    daily_users: { type: "integer", minimum: 0, example: 1000 },
                    scale: { type: "string", enum: ["Personal", "Startup", "Enterprise"], example: "Startup" },
                    technologyIds: { type: "array", items: { type: "integer" }, example: [1, 4, 6] }
                }
            }
        },
        responses: {
            BadRequest: jsonResponse("Bad request", { $ref: "#/components/schemas/Error" }),
            Unauthorized: jsonResponse("Authorization token is required", { $ref: "#/components/schemas/Error" }),
            Forbidden: jsonResponse("Invalid token or insufficient permission", { $ref: "#/components/schemas/Error" }),
            NotFound: jsonResponse("Resource not found", { $ref: "#/components/schemas/Error" }),
            ServerError: jsonResponse("Internal server error", { $ref: "#/components/schemas/Error" })
        }
    },
    paths: {
        "/health": {
            get: {
                tags: ["System"],
                summary: "Check server health",
                responses: {
                    200: jsonResponse("Server is running", {
                        type: "object",
                        properties: {
                            status: { type: "string", example: "ok" },
                            message: { type: "string", example: "Server is running" }
                        }
                    })
                }
            }
        },
        "/db-test": {
            get: {
                tags: ["System"],
                summary: "Check PostgreSQL connection",
                responses: {
                    200: jsonResponse("Database timestamp", { type: "array", items: { type: "object" } }),
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/openapi.json": {
            get: {
                tags: ["System"],
                summary: "Return the OpenAPI document",
                responses: { 200: jsonResponse("OpenAPI specification", { type: "object" }) }
            }
        },
        "/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register a user",
                requestBody: jsonBody({ $ref: "#/components/schemas/AuthPayload" }),
                responses: {
                    201: jsonResponse("User registered", {
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            user: { $ref: "#/components/schemas/User" }
                        }
                    }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    409: jsonResponse("Email already registered", { $ref: "#/components/schemas/Error" }),
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Log in and set the JWT cookie",
                requestBody: jsonBody({ $ref: "#/components/schemas/AuthPayload" }),
                responses: {
                    200: jsonResponse("Logged in", { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Clear the JWT cookie",
                responses: { 200: jsonResponse("Signed out", { type: "object", properties: { message: { type: "string" } } }) }
            }
        },
        "/projects": {
            get: {
                tags: ["Projects"],
                summary: "List projects for the logged-in user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: jsonResponse("Project list", { type: "array", items: { $ref: "#/components/schemas/Project" } }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            },
            post: {
                tags: ["Projects"],
                summary: "Create a project for the logged-in user",
                security: [{ bearerAuth: [] }],
                requestBody: jsonBody({ $ref: "#/components/schemas/ProjectPayload" }),
                responses: {
                    201: jsonResponse("Created project", { $ref: "#/components/schemas/Project" }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/projects/{id}": {
            get: {
                tags: ["Projects"],
                summary: "Get one owned project",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Project id")],
                responses: {
                    200: jsonResponse("Project", { $ref: "#/components/schemas/Project" }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            },
            put: {
                tags: ["Projects"],
                summary: "Update one owned project",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Project id")],
                requestBody: jsonBody({ $ref: "#/components/schemas/ProjectPayload" }),
                responses: {
                    200: jsonResponse("Updated project", { $ref: "#/components/schemas/Project" }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            },
            delete: {
                tags: ["Projects"],
                summary: "Delete one owned project",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Project id")],
                responses: {
                    204: { description: "Project deleted" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/projects/{id}/technologies": {
            get: {
                tags: ["Projects"],
                summary: "List technologies attached to an owned project",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Project id")],
                responses: {
                    200: jsonResponse("Project technology list", { type: "array", items: { $ref: "#/components/schemas/Technology" } }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            },
            post: {
                tags: ["Projects"],
                summary: "Replace the technology selection for an owned project",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Project id")],
                requestBody: jsonBody({ $ref: "#/components/schemas/TechnologySelectionPayload" }),
                responses: {
                    200: jsonResponse("Updated technology selection", { type: "array", items: { $ref: "#/components/schemas/Technology" } }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/technologies": {
            get: {
                tags: ["Technologies"],
                summary: "List active technologies selectable by users",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: jsonResponse("Technology list", { type: "array", items: { $ref: "#/components/schemas/Technology" } }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/technologies/{id}": {
            get: {
                tags: ["Technologies"],
                summary: "Get technology knowledge details",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Technology id")],
                responses: {
                    200: jsonResponse("Technology details", { $ref: "#/components/schemas/Technology" }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/knowledge/technologies": {
            get: {
                tags: ["Technologies"],
                summary: "List technology knowledge base entries",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: jsonResponse("Knowledge base entries", { type: "array", items: { $ref: "#/components/schemas/Technology" } }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/admin/technologies": {
            get: {
                tags: ["Admin Technologies"],
                summary: "Admin list of active and inactive technologies",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: jsonResponse("Admin technology list", { type: "array", items: { $ref: "#/components/schemas/Technology" } }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            },
            post: {
                tags: ["Admin Technologies"],
                summary: "Admin create technology",
                security: [{ bearerAuth: [] }],
                requestBody: jsonBody({ $ref: "#/components/schemas/TechnologyPayload" }),
                responses: {
                    201: jsonResponse("Created technology", { $ref: "#/components/schemas/Technology" }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/admin/technologies/{id}": {
            put: {
                tags: ["Admin Technologies"],
                summary: "Admin update technology",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Technology id")],
                requestBody: jsonBody({ $ref: "#/components/schemas/TechnologyPayload" }),
                responses: {
                    200: jsonResponse("Updated technology", { $ref: "#/components/schemas/Technology" }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            },
            delete: {
                tags: ["Admin Technologies"],
                summary: "Admin soft-delete technology by setting is_active false",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Technology id")],
                responses: {
                    200: jsonResponse("Soft-deleted technology", { $ref: "#/components/schemas/Technology" }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/analysis/{projectId}": {
            post: {
                tags: ["Analysis"],
                summary: "Run deterministic project analysis",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("projectId", "Project id")],
                responses: {
                    201: jsonResponse("Created analysis result", { $ref: "#/components/schemas/Analysis" }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/analysis/{projectId}/dashboard": {
            get: {
                tags: ["Analysis"],
                summary: "Get latest analysis dashboard data",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("projectId", "Project id")],
                responses: {
                    200: jsonResponse("Dashboard data", { type: "object" }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/analysis/{projectId}/history": {
            get: {
                tags: ["Analysis"],
                summary: "List analysis history for an owned project",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("projectId", "Project id")],
                responses: {
                    200: jsonResponse("Analysis history", { type: "array", items: { $ref: "#/components/schemas/Analysis" } }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/analysis/{projectId}/what-if": {
            post: {
                tags: ["Analysis"],
                summary: "Run a non-persisted what-if analysis",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("projectId", "Project id")],
                requestBody: jsonBody({ $ref: "#/components/schemas/WhatIfPayload" }),
                responses: {
                    200: jsonResponse("What-if result", { type: "object" }),
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        },
        "/analysis/compare": {
            get: {
                tags: ["Analysis"],
                summary: "Compare two owned projects",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "leftProjectId", in: "query", required: true, schema: { type: "integer", minimum: 1 } },
                    { name: "rightProjectId", in: "query", required: true, schema: { type: "integer", minimum: 1 } }
                ],
                responses: {
                    200: jsonResponse("Project comparison", { type: "object" }),
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    500: { $ref: "#/components/responses/ServerError" }
                }
            }
        }
    }
};
