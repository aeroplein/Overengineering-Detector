const severityRank = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
};

const labelFlags = (flags) => {
    if (flags.length === 0) {
        return "no major risk flags";
    }

    return flags
        .slice()
        .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))
        .slice(0, 3)
        .map((flag) => flag.flag_name.replaceAll("_", " ").toLowerCase())
        .join(", ");
};

export const generateAiExplanation = ({ project, technologies, scores, flags, recommendations }) => {
    try {
        const techCount = technologies.length;
        const topRecommendation = recommendations[0] || "Keep the current stack focused on what the project needs now.";
        const gapSummary = scores.complexity_direction === "underengineering"
            ? `underengineering gap ${scores.underengineering_score}`
            : `overengineering penalty ${scores.penalty_score}`;

        return [
            `${project.name} is a ${project.scale.toLowerCase()} project with ${project.daily_users} expected daily users and ${techCount} selected technologies.`,
            `The deterministic risk score is ${scores.total_score}, driven by frontend ${scores.frontend_score}, backend ${scores.backend_score}, infrastructure ${scores.infrastructure_score}, and ${gapSummary}.`,
            `Main simplification signal: ${labelFlags(flags)}.`,
            `Suggestion: ${topRecommendation}`
        ].join(" ");
    } catch (error) {
        return "AI-style explanation is unavailable, but the deterministic score, flags, and recommendations are still valid.";
    }
};
