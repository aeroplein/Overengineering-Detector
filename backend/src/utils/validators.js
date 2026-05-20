const validScales = new Set(["Personal", "Startup", "Enterprise"]);
const validVisibilities = new Set(["private", "public"]);

export const isPositiveInteger = (value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
};

export const validateAuthPayload = ({ email, password } = {}) => {
    if (!email || !password) {
        return "Email and password are required.";
    }

    const normalizedEmail = String(email).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return "A valid email address is required.";
    }

    if (String(password).length < 6) {
        return "Password must be at least 6 characters.";
    }

    return null;
};

export const normalizeAuthPayload = ({ email, password }) => ({
    email: String(email).trim().toLowerCase(),
    password: String(password)
});

export const validateProjectPayload = ({
    name,
    daily_users,
    scale,
    visibility = "private"
} = {}) => {
    if (!name || String(name).trim().length < 2) {
        return "Project name must be at least 2 characters.";
    }

    const userCount = Number(daily_users);
    if (!Number.isInteger(userCount) || userCount < 0) {
        return "Daily users must be a whole number greater than or equal to 0.";
    }

    if (!validScales.has(scale)) {
        return "Scale must be Personal, Startup, or Enterprise.";
    }

    if (!validVisibilities.has(visibility)) {
        return "Visibility must be private or public.";
    }

    return null;
};

export const normalizeProjectPayload = ({
    name,
    daily_users,
    scale,
    visibility = "private"
}) => ({
    name: String(name).trim(),
    daily_users: Number(daily_users),
    scale,
    visibility
});

export const validateTechnologyIds = (technologyIds) => {
    if (!Array.isArray(technologyIds)) {
        return "technologyIds must be an array.";
    }

    const invalidId = technologyIds.some((id) => !isPositiveInteger(id));
    if (invalidId) {
        return "Each technology id must be a positive integer.";
    }

    const uniqueIds = new Set(technologyIds.map((id) => Number(id)));
    if (uniqueIds.size !== technologyIds.length) {
        return "technologyIds must not contain duplicates.";
    }

    return null;
};

export const normalizeTechnologyIds = (technologyIds) => technologyIds.map((id) => Number(id));

export const validateTechnologyPayload = ({
    name,
    category,
    complexity_weight,
    docs_url = ""
} = {}) => {
    if (!name || String(name).trim().length < 2) {
        return "Technology name must be at least 2 characters.";
    }

    if (!category || String(category).trim().length < 2) {
        return "Technology category must be at least 2 characters.";
    }

    const weight = Number(complexity_weight);
    if (!Number.isInteger(weight) || weight < 1 || weight > 10) {
        return "Complexity weight must be a whole number between 1 and 10.";
    }

    if (docs_url && !/^https?:\/\/\S+$/i.test(String(docs_url))) {
        return "Documentation URL must start with http:// or https://.";
    }

    return null;
};

export const normalizeTechnologyPayload = ({
    name,
    category,
    complexity_weight,
    description = "",
    best_for = "",
    risk_notes = "",
    alternatives = "",
    docs_url = "",
    is_active = true
}) => ({
    name: String(name).trim(),
    category: String(category).trim(),
    complexity_weight: Number(complexity_weight),
    description: String(description || "").trim(),
    best_for: String(best_for || "").trim(),
    risk_notes: String(risk_notes || "").trim(),
    alternatives: String(alternatives || "").trim(),
    docs_url: String(docs_url || "").trim(),
    is_active: Boolean(is_active)
});
