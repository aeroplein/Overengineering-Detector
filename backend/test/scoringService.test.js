import assert from "node:assert/strict";
import test from "node:test";

import {
    calculateScores,
    generateBadge,
    generateEvaluation,
    generateFlags,
    generateRadar,
    generateRecommendations
} from "../src/services/scoringService.js";
import { generateSuggestions } from "../src/services/analysisService.js";

const personalProject = {
    name: "Tiny Portfolio",
    scale: "Personal",
    daily_users: 25
};

test("calculateScores adds category scores and context penalties", () => {
    const technologies = [
        { name: "React", category: "Frontend", complexity_weight: 6 },
        { name: "Express", category: "Backend", complexity_weight: 5 },
        { name: "Kubernetes", category: "DevOps", complexity_weight: 10 },
        { name: "AWS", category: "Cloud", complexity_weight: 9 }
    ];

    const scores = calculateScores(personalProject, technologies);

    assert.equal(scores.frontend_score, 6);
    assert.equal(scores.backend_score, 5);
    assert.equal(scores.infrastructure_score, 19);
    assert.equal(scores.penalty_score, 14);
    assert.equal(scores.total_score, 44);
});

test("generateEvaluation maps total score bands", () => {
    assert.equal(generateEvaluation(60), "Highly overengineered.");
    assert.equal(generateEvaluation(40), "Possibly overengineered.");
    assert.equal(generateEvaluation(25), "Moderately complex but acceptable.");
    assert.equal(generateEvaluation(10), "Reasonable stack.");
});

test("calculateScores identifies enterprise projects with too little stack as underengineered", () => {
    const scores = calculateScores({
        name: "Enterprise Portal",
        scale: "Enterprise",
        daily_users: 50
    }, []);

    assert.equal(scores.necessary_complexity, 25);
    assert.equal(scores.underengineering_score, 25);
    assert.equal(scores.complexity_direction, "underengineering");
    assert.equal(generateEvaluation(scores), "Underengineered for the project scale.");
});

test("generateFlags identifies high-risk small-project complexity", () => {
    const technologies = [
        { name: "React", category: "Frontend", complexity_weight: 6 },
        { name: "Vue", category: "Frontend", complexity_weight: 5 },
        { name: "Angular", category: "Frontend", complexity_weight: 7 },
        { name: "Kubernetes", category: "DevOps", complexity_weight: 10 },
        { name: "AWS", category: "Cloud", complexity_weight: 9 }
    ];
    const scores = calculateScores(personalProject, technologies);
    const flags = generateFlags(personalProject, technologies, scores);
    const flagNames = flags.map((flag) => flag.flag_name);

    assert.ok(flagNames.includes("MICROSERVICE_DELUSION"));
    assert.ok(flagNames.includes("PREMATURE_OPTIMIZATION"));
    assert.ok(flagNames.includes("FRONTEND_FRAMEWORK_OVERLOAD"));
    assert.ok(flagNames.includes("INFRASTRUCTURE_OVERLOAD"));
});

test("generateRecommendations returns default guidance when no flags exist", () => {
    assert.deepEqual(
        generateRecommendations([]),
        ["The selected stack looks reasonable for the current project profile."]
    );
});

test("generateRadar returns dashboard dimensions from scores", () => {
    const scores = calculateScores(personalProject, [
        { name: "React", category: "Frontend", complexity_weight: 6 },
        { name: "AWS", category: "Cloud", complexity_weight: 9 }
    ]);

    assert.deepEqual(generateRadar(scores), {
        frontend: 6,
        backend: 0,
        infrastructure: 9,
        overengineering: 10,
        underengineering: 0
    });
});

test("generateBadge labels underengineered and balanced stacks", () => {
    const underengineeredScores = calculateScores({
        name: "Enterprise Portal",
        scale: "Enterprise",
        daily_users: 50
    }, []);

    assert.equal(generateBadge(underengineeredScores, []).label, "Underengineered");

    const balancedScores = calculateScores({
        name: "Startup API",
        scale: "Startup",
        daily_users: 500
    }, [
        { name: "React", category: "Frontend", complexity_weight: 6 },
        { name: "Express", category: "Backend", complexity_weight: 5 },
        { name: "PostgreSQL", category: "Database", complexity_weight: 4 },
        { name: "Docker", category: "DevOps", complexity_weight: 6 }
    ]);

    assert.equal(generateBadge(balancedScores, []).label, "Balanced");
});

test("generateSuggestions returns alternatives and flag-driven guidance", () => {
    const suggestions = generateSuggestions(personalProject, [
        {
            name: "Kubernetes",
            category: "DevOps",
            complexity_weight: 10,
            alternatives: "simple platform hosting"
        }
    ], [
        { flag_name: "PREMATURE_OPTIMIZATION", severity: "HIGH" }
    ]);

    assert.ok(suggestions.some((item) => item.suggestion.includes("simple platform hosting")));
    assert.ok(suggestions.some((item) => item.technology === "Infrastructure"));
});
