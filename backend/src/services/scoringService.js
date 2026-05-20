const frontendCategories = ["frontend", "mobile"];
const backendCategories = ["backend", "language", "database", "cache"];
const infrastructureCategories = ["devops", "cloud"];
const heavyInfrastructureTools = ["kubernetes", "aws", "gcp", "azure", "redis"];
const enterpriseTools = ["kubernetes", "spring boot", "nestjs", "aws", "gcp", "azure"];

export const calculateScores = (project, technologies) => {
    let frontend_score = 0;
    let backend_score = 0;
    let infrastructure_score = 0;
    let penalty_score = 0;

    const techNames = technologies.map((technology) => {
        return technology.name.toLowerCase();
    });

    for (const technology of technologies) {
        const category = technology.category.toLowerCase();

        if (frontendCategories.includes(category)) {
            frontend_score += technology.complexity_weight;
        } else if (backendCategories.includes(category)) {
            backend_score += technology.complexity_weight;
        } else if (infrastructureCategories.includes(category)) {
            infrastructure_score += technology.complexity_weight;
        }
    }

    if (project.scale === "Personal" && technologies.length > 6) {
        penalty_score += 5;
    }

    if (project.scale === "Startup" && technologies.length) {
        penalty_score += 4;
    }

    if (project.daily_users < 100) {
        for (const tool of heavyInfrastructureTools) {
            if (techNames.includes(tool)) {
                penalty_score += 4;
            }
        }
    }

    if (infrastructure_score > frontend_score + backend_score) {
        penalty_score += 6;
    }

    const total_score =
        frontend_score + backend_score + infrastructure_score + penalty_score;
    return {
        frontend_score,
        backend_score,
        infrastructure_score,
        penalty_score,
        total_score
    };

};

export const generateEvaluation = (total_score) => {
    if (total_score >= 55) {
        return "Highly overengineered.";
    }
    if (total_score >= 35) {
        return "Possibly overengineered.";
    }
    if (total_score >= 20) {
        return "Moderately complex but acceptable.";
    }
    return "Reasonable stack.";
};

export const generateFlags = (project, technologies, scores) => {
    const flags = [];

    const techNames = technologies.map((technology) => {
        return technology.name.toLowerCase();
    });

    const frontendCount = technologies.filter((technology) => {
        return frontendCategories.includes(technology.category.toLowerCase());
    }).length;
    const infrastructureCount = technologies.filter((technology) => {
        return infrastructureCategories.includes(technology.category.toLowerCase());
    }).length;

    if (project.scale === "Personal" && scores.infrastructure_score >= 10) {
        flags.push({
            flag_name: "MICROSERVICE_DELUSION",
            severity: "HIGH"
        });
    }
    if (technologies.length > 8) {
        flags.push({
            flag_name: "RESUME_DRIVEN_DEVELOPMENT",
            severity: "MEDIUM"
        });
    }
    if (scores.infrastructure_score > scores.frontend_score + scores.backend_score) {
        flags.push({
            flag_name: "CLOUD_OVERKILL",
            severity: "LOW"
        });
    }
    const heavyInfraSelected = heavyInfrastructureTools.some((tool) => {
        return techNames.includes(tool);
    });

    if (project.daily_users < 100 && heavyInfraSelected) {
        flags.push({
            flag_name: "PREMATURE_OPTIMIZATION",
            severity: "HIGH"
        });
    }
    if (frontendCount >= 3) {
        flags.push({
            flag_name: "FRONTEND_FRAMEWORK_OVERLOAD",
            severity: "MEDIUM"
        });
    }
    if (project.scale === "Personal" && infrastructureCount >= 2) {
        flags.push({
            flag_name: "INFRASTRUCTURE_OVERLOAD",
            severity: "HIGH"
        });
    }
    if (scores.penalty_score >= 10) {
        flags.push({
            flag_name: "CONTEXT_MISMATCH",
            severity: "HIGH"
        })
    }
    return flags;
};

const recommendationMessages = {
    MICROSERVICE_DELUSION: "Avoid distributed infrastructure for a personal-scale project.",
    RESUME_DRIVEN_DEVELOPMENT: "Reduce the number of technologies and keep only tools that solve current needs.",
    CLOUD_OVERKILL: "Prefer simpler hosting until infrastructure needs are clearly justified.",
    PREMATURE_OPTIMIZATION: "Delay Kubernetes, Redis, or cloud complexity until user traffic requires it.",
    FRONTEND_FRAMEWORK_OVERLOAD: "Avoid using multiple frontend frameworks in one small project.",
    INFRASTRUCTURE_OVERLOAD: "For personal projects, start with minimal deployment infrastructure.",
    CONTEXT_MISMATCH: "Reconsider whether the stack matches the project's current scale and user count."
};

export const generateRecommendations = (flags) => {
    const recommendations = flags
        .map((flag) => recommendationMessages[flag.flag_name])
        .filter(Boolean);

    if (recommendations.length === 0) {
        return ["The selected stack looks reasonable for the current project profile."];
    }

    return recommendations;
};