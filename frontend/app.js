let parsedUser = null;
try {
    parsedUser = JSON.parse(localStorage.getItem("user") || "null");
} catch (error) {
    console.error("Failed to parse user from localStorage:", error);
    localStorage.removeItem("user");
}

const state = {
    token: Boolean(parsedUser),   // cookie managed server-side; mirror sign-in state from persisted user
    user: parsedUser,
    projects: [],
    technologies: [],
    adminTechnologies: [],
    knowledgeTechnologies: [],
    selectedProjectId: null,
    editingProjectId: null,
    pendingDeleteProject: null,
    lastAnalysis: null,
    lastDashboard: null
};

const els = {
    authView: document.querySelector("#authView"),
    appView: document.querySelector("#appView"),
    loginForm: document.querySelector("#loginForm"),
    registerForm: document.querySelector("#registerForm"),
    showLoginButton: document.querySelector("#showLoginButton"),
    showRegisterButton: document.querySelector("#showRegisterButton"),
    projectForm: document.querySelector("#projectForm"),
    projectFormTitle: document.querySelector("#projectFormTitle"),
    projectSubmitButton: document.querySelector("#projectSubmitButton"),
    cancelEditButton: document.querySelector("#cancelEditButton"),
    projectList: document.querySelector("#projectList"),
    technologyList: document.querySelector("#technologyList"),
    adminPanel: document.querySelector("#adminPanel"),
    technologyAdminForm: document.querySelector("#technologyAdminForm"),
    resetTechnologyAdminButton: document.querySelector("#resetTechnologyAdminButton"),
    adminTechnologyList: document.querySelector("#adminTechnologyList"),
    refreshKnowledgeButton: document.querySelector("#refreshKnowledgeButton"),
    knowledgeList: document.querySelector("#knowledgeList"),
    scoreDashboard: document.querySelector("#scoreDashboard"),
    overallScore: document.querySelector("#overallScore"),
    necessaryComplexity: document.querySelector("#necessaryComplexity"),
    complexityGapLabel: document.querySelector("#complexityGapLabel"),
    overengineeringPercent: document.querySelector("#overengineeringPercent"),
    riskLevel: document.querySelector("#riskLevel"),
    scoreBreakdownFrame: document.querySelector("#scoreBreakdownFrame"),
    overengineeringFrame: document.querySelector("#overengineeringFrame"),
    analysisResult: document.querySelector("#analysisResult"),
    dashboardDetails: document.querySelector("#dashboardDetails"),
    badgeBox: document.querySelector("#badgeBox"),
    suggestionList: document.querySelector("#suggestionList"),
    timelineList: document.querySelector("#timelineList"),
    whatIfForm: document.querySelector("#whatIfForm"),
    whatIfResult: document.querySelector("#whatIfResult"),
    comparisonForm: document.querySelector("#comparisonForm"),
    comparisonResult: document.querySelector("#comparisonResult"),
    exportReportButton: document.querySelector("#exportReportButton"),
    analysisHistory: document.querySelector("#analysisHistory"),
    message: document.querySelector("#message"),
    session: document.querySelector(".session"),
    sessionEmail: document.querySelector("#sessionEmail"),
    logoutButton: document.querySelector("#logoutButton"),
    refreshProjectsButton: document.querySelector("#refreshProjectsButton"),
    saveTechnologiesButton: document.querySelector("#saveTechnologiesButton"),
    analyzeButton: document.querySelector("#analyzeButton")
};

els.deleteDialog = document.querySelector("#deleteDialog");
els.deleteDialogText = document.querySelector("#deleteDialogText");
els.cancelDeleteButton = document.querySelector("#cancelDeleteButton");
els.confirmDeleteButton = document.querySelector("#confirmDeleteButton");

const setMessage = (message, isError = true) => {
    els.message.textContent = message;
    els.message.classList.toggle("success", !isError);
    els.message.classList.toggle("error", isError);
};

const withBusyButton = async (button, busyText, action) => {
    const originalText = button.textContent;
    button.disabled = true;
    button.classList.add("isBusy");
    button.textContent = busyText;

    try {
        return await action();
    } finally {
        button.disabled = false;
        button.classList.remove("isBusy");
        button.textContent = originalText;
    }
};

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const api = async (path, options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const response = await fetch(path, {
        ...options,
        headers,
        credentials: "same-origin"   // always send the HttpOnly cookie
    });

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
};

const saveSession = (result) => {
    state.token = true;
    state.user = result.user;
    localStorage.setItem("user", JSON.stringify(result.user));
};

const clearSession = () => {
    state.token = false;
    state.user = null;
    state.projects = [];
    state.technologies = [];
    state.adminTechnologies = [];
    state.knowledgeTechnologies = [];
    state.selectedProjectId = null;
    state.editingProjectId = null;
    state.pendingDeleteProject = null;
    state.lastAnalysis = null;
    state.lastDashboard = null;
    localStorage.removeItem("user");
    resetAnalysisView();
};

const renderSession = () => {
    const signedIn = Boolean(state.token);
    const isAdmin = state.user?.role === "admin";
    els.authView.classList.toggle("hidden", signedIn);
    els.appView.classList.toggle("hidden", !signedIn);
    els.appView.classList.toggle("adminMode", isAdmin);
    els.session.classList.toggle("hidden", !signedIn);
    els.logoutButton.classList.toggle("hidden", !signedIn);
    els.adminPanel.classList.toggle("hidden", !isAdmin);
    els.sessionEmail.textContent = state.user?.email || "";
};

const showAuthMode = (mode) => {
    const isLogin = mode === "login";
    els.loginForm.classList.toggle("hidden", !isLogin);
    els.registerForm.classList.toggle("hidden", isLogin);
    els.showLoginButton.classList.toggle("active", isLogin);
    els.showRegisterButton.classList.toggle("active", !isLogin);
    setMessage("", false);
};

const setProjectFormMode = (project = null) => {
    state.editingProjectId = project?.id || null;
    els.projectFormTitle.textContent = project ? "Update project" : "Create project";
    els.projectSubmitButton.textContent = project ? "Update project" : "Create project";
    els.cancelEditButton.classList.toggle("hidden", !project);

    if (!project) {
        els.projectForm.reset();
        return;
    }

    els.projectForm.elements.name.value = project.name;
    els.projectForm.elements.daily_users.value = project.daily_users;
    els.projectForm.elements.scale.value = project.scale;
    els.projectForm.elements.visibility.value = project.visibility;
};

const openDeleteDialog = (project) => {
    state.pendingDeleteProject = project;
    els.deleteDialogText.textContent = `This will permanently delete "${project.name}".`;
    els.deleteDialog.classList.remove("hidden");
    els.confirmDeleteButton.focus();
};

const closeDeleteDialog = () => {
    state.pendingDeleteProject = null;
    els.deleteDialog.classList.add("hidden");
};

const renderProjects = () => {
    if (state.projects.length === 0) {
        els.projectList.innerHTML = `<p class="muted">No projects yet.</p>`;
        return;
    }

    els.projectList.innerHTML = state.projects.map((project) => {
        const technologies = project.technologies || [];
        const techStack = technologies.length
            ? technologies.map((technology) => technology.name).join(", ")
            : "No technologies selected";

        return `
        <article class="projectCard ${project.id === state.selectedProjectId ? "active" : ""}">
            <button class="projectButton" data-project-id="${project.id}" type="button">
                <strong>${escapeHtml(project.name)}</strong>
                <span class="projectMeta">${escapeHtml(project.scale)} / ${escapeHtml(project.daily_users)} daily users / ${escapeHtml(project.visibility)}</span>
                <span class="projectTechStack">${escapeHtml(techStack)}</span>
            </button>
            <div class="projectActions">
                <button class="miniButton" data-action="edit" data-project-id="${project.id}" type="button">Edit</button>
                <button class="miniButton danger" data-action="delete" data-project-id="${project.id}" type="button">Delete</button>
            </div>
        </article>
    `;
    }).join("");
};

const renderTechnologies = () => {
    if (state.technologies.length === 0) {
        els.technologyList.innerHTML = `<p class="muted">No technologies found.</p>`;
        return;
    }

    els.technologyList.innerHTML = state.technologies.map((technology) => `
        <label class="techOption">
            <input type="checkbox" value="${technology.id}">
            <span>
                ${escapeHtml(technology.name)}
                <span class="techMeta">${escapeHtml(technology.category)} / weight ${escapeHtml(technology.complexity_weight)}</span>
            </span>
        </label>
    `).join("");
};

const renderAdminTechnologies = () => {
    if (state.user?.role !== "admin") {
        return;
    }

    if (state.adminTechnologies.length === 0) {
        els.adminTechnologyList.innerHTML = `<p class="muted">No technologies found.</p>`;
        return;
    }

    els.adminTechnologyList.innerHTML = state.adminTechnologies.map((technology) => `
        <article class="adminTechCard ${technology.is_active ? "" : "inactive"}">
            <div>
                <strong>${escapeHtml(technology.name)}</strong>
                <span>${escapeHtml(technology.category)} / weight ${escapeHtml(technology.complexity_weight)} / ${technology.is_active ? "active" : "inactive"}</span>
            </div>
            <div class="projectActions">
                <button class="miniButton" data-admin-action="edit" data-technology-id="${technology.id}" type="button">Edit</button>
                <button class="miniButton danger" data-admin-action="delete" data-technology-id="${technology.id}" type="button">Soft delete</button>
            </div>
        </article>
    `).join("");
};

const renderKnowledgeBase = () => {
    const uniqueTechnologies = [...new Map(
        state.knowledgeTechnologies.map((technology) => [
            `${technology.name.toLowerCase()}-${technology.category.toLowerCase()}`,
            technology
        ])
    ).values()];

    if (uniqueTechnologies.length === 0) {
        els.knowledgeList.innerHTML = `<p class="muted">No knowledge entries yet.</p>`;
        return;
    }

    els.knowledgeList.innerHTML = uniqueTechnologies.map((technology) => `
        <details class="knowledgeCard">
            <summary>
                <strong>${escapeHtml(technology.name)}</strong>
                <span>${escapeHtml(technology.category)} / weight ${escapeHtml(technology.complexity_weight)}</span>
            </summary>
            <div class="knowledgeDetails">
                <p>${escapeHtml(technology.description || "No description added yet.")}</p>
                <p><b>Best for:</b> ${escapeHtml(technology.best_for || "Not specified.")}</p>
                <p><b>Risks:</b> ${escapeHtml(technology.risk_notes || "No risk notes.")}</p>
                <p><b>Alternatives:</b> ${escapeHtml(technology.alternatives || "No alternatives listed.")}</p>
                ${technology.docs_url ? `<a href="${escapeHtml(technology.docs_url)}" target="_blank" rel="noreferrer">Docs</a>` : ""}
            </div>
        </details>
    `).join("");
};

const loadAdminTechnologies = async () => {
    if (state.user?.role !== "admin") {
        return;
    }

    state.adminTechnologies = await api("/admin/technologies");
    renderAdminTechnologies();
};

const loadKnowledgeBase = async () => {
    state.knowledgeTechnologies = await api("/knowledge/technologies");
    renderKnowledgeBase();
};

const resetTechnologyAdminForm = () => {
    els.technologyAdminForm.reset();
    els.technologyAdminForm.elements.id.value = "";
    els.technologyAdminForm.elements.is_active.checked = true;
};

const setTechnologyAdminForm = (technology) => {
    els.technologyAdminForm.elements.id.value = technology.id;
    els.technologyAdminForm.elements.name.value = technology.name;
    els.technologyAdminForm.elements.category.value = technology.category;
    els.technologyAdminForm.elements.complexity_weight.value = technology.complexity_weight;
    els.technologyAdminForm.elements.docs_url.value = technology.docs_url || "";
    els.technologyAdminForm.elements.description.value = technology.description || "";
    els.technologyAdminForm.elements.best_for.value = technology.best_for || "";
    els.technologyAdminForm.elements.risk_notes.value = technology.risk_notes || "";
    els.technologyAdminForm.elements.alternatives.value = technology.alternatives || "";
    els.technologyAdminForm.elements.is_active.checked = Boolean(technology.is_active);
};

const setTechnologySelection = (selectedTechnologies) => {
    const selectedIds = new Set(selectedTechnologies.map((technology) => Number(technology.id)));
    els.technologyList.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = selectedIds.has(Number(input.value));
    });
};

const getCheckedTechnologyIds = () => [...els.technologyList.querySelectorAll("input:checked")]
    .map((input) => Number(input.value));

const updateSelectedProjectTechnologies = (technologies) => {
    state.projects = state.projects.map((project) => {
        if (project.id !== state.selectedProjectId) {
            return project;
        }

        return {
            ...project,
            technologies
        };
    });
    renderProjects();
    setTechnologySelection(technologies);
};

const saveSelectedTechnologies = async () => {
    const technologyIds = getCheckedTechnologyIds();
    const technologies = await api(`/projects/${state.selectedProjectId}/technologies`, {
        method: "POST",
        body: JSON.stringify({ technologyIds })
    });

    updateSelectedProjectTechnologies(technologies);
    return technologies;
};

const getRiskLevel = ({ total_score }, flags) => {
    if (flags.some((flag) => flag.severity === "HIGH") || total_score >= 55) {
        return "High";
    }

    if (flags.some((flag) => flag.severity === "MEDIUM") || total_score >= 35) {
        return "Medium";
    }

    return "Low";
};

const calculateDashboardMetrics = (result) => {
    const scores = result.scores;
    const penalty = Number(scores.penalty_score || 0);
    const underengineering = Number(scores.underengineering_score || 0);
    const total = Number(scores.total_score || 0);
    const implemented = Number(scores.stack_score || Math.max(total - penalty - underengineering, 0));
    const necessary = Number(scores.necessary_complexity || Math.max(total - penalty, 0));
    const direction = scores.complexity_direction || (underengineering > penalty ? "underengineering" : "overengineering");
    const gapScore = direction === "underengineering" ? underengineering : penalty;
    const denominator = Math.max(necessary, total, gapScore, 1);
    const gapPercent = Math.round((gapScore / denominator) * 100);

    return {
        total,
        implemented,
        necessary,
        penalty,
        underengineering,
        gapScore,
        gapPercent,
        direction,
        riskLevel: getRiskLevel(scores, result.flags)
    };
};

const renderCharts = (result, metrics) => {
    els.scoreBreakdownFrame.classList.toggle("emptyChart", metrics.total === 0 && metrics.gapScore === 0);
    els.overengineeringFrame.classList.toggle("emptyChart", metrics.total === 0 && metrics.gapScore === 0);

    if (metrics.total === 0 && metrics.gapScore === 0) {
        els.scoreBreakdownFrame.innerHTML = "";
        els.overengineeringFrame.innerHTML = "";
        return;
    }

    const values = [
        result.scores.frontend_score,
        result.scores.backend_score,
        result.scores.infrastructure_score,
        metrics.direction === "underengineering" ? metrics.underengineering : metrics.penalty
    ];
    const labels = [
        "Frontend",
        "Backend",
        "Infra",
        metrics.direction === "underengineering" ? "Under" : "Over"
    ];
    const colors = ["#4f7f8f", "#7d6ab3", "#b48a4c", "#b85b5b"];
    const maxValue = Math.max(...values, 1);
    const implemented = metrics.implemented;
    const gap = metrics.gapScore;
    const gapDegrees = Math.round((gap / Math.max(implemented + gap, 1)) * 360);

    els.scoreBreakdownFrame.innerHTML = `
        <div class="barChart" role="img" aria-label="Score breakdown">
            ${values.map((value, index) => `
                <div class="barItem">
                    <strong>${escapeHtml(value)}</strong>
                    <div class="barTrack">
                        <span style="height: ${Math.max((value / maxValue) * 100, value > 0 ? 6 : 0)}%; background: ${colors[index]}"></span>
                    </div>
                    <small>${escapeHtml(labels[index])}</small>
                </div>
            `).join("")}
        </div>
    `;

    els.overengineeringFrame.innerHTML = `
        <div class="ringChart" style="--gap-deg: ${gapDegrees}deg" role="img" aria-label="Complexity gap">
            <div class="ringCenter">
                <strong>${escapeHtml(metrics.gapPercent)}%</strong>
                <span>${escapeHtml(metrics.direction === "underengineering" ? "Under" : "Over")}</span>
            </div>
        </div>
        <div class="ringLegend">
            <span><i class="implementedKey"></i>Implemented ${escapeHtml(implemented)}</span>
            <span><i class="gapKey"></i>${escapeHtml(metrics.direction === "underengineering" ? "Underengineering" : "Overengineering")} ${escapeHtml(gap)}</span>
        </div>
    `;
};

const renderDashboard = (result) => {
    const metrics = calculateDashboardMetrics(result);

    els.scoreDashboard.classList.remove("hidden");
    els.overallScore.textContent = metrics.total;
    els.necessaryComplexity.textContent = metrics.necessary;
    els.complexityGapLabel.textContent =
        metrics.direction === "underengineering" ? "Underengineering" : "Overengineering";
    els.overengineeringPercent.textContent = `${metrics.gapPercent}%`;
    els.riskLevel.textContent = metrics.riskLevel;
    els.riskLevel.dataset.risk = metrics.riskLevel.toLowerCase();

    renderCharts(result, metrics);
};

const renderDashboardDetails = (dashboard) => {
    state.lastDashboard = dashboard;
    els.dashboardDetails.classList.remove("hidden");
    const badge = dashboard.badge || {};
    els.badgeBox.innerHTML = `
        <strong class="complexityBadge ${escapeHtml(badge.tone || "balanced")}">${escapeHtml(badge.label || "No badge")}</strong>
        <p>${escapeHtml(badge.description || "Run analysis to generate a badge.")}</p>
    `;
    els.suggestionList.innerHTML = (dashboard.suggestions || []).map((item) => `
        <article class="miniInfo">
            <strong>${escapeHtml(item.technology)}</strong>
            <p>${escapeHtml(item.suggestion)}</p>
        </article>
    `).join("") || `<p class="muted">No suggestions yet.</p>`;
    els.timelineList.innerHTML = (dashboard.timeline || []).slice(0, 6).map((item) => `
        <article class="timelineItem">
            <strong>${escapeHtml(item.total_score)}</strong>
            <span>${escapeHtml(new Date(item.created_at).toLocaleString())} / ${escapeHtml(item.evaluation)}</span>
        </article>
    `).join("") || `<p class="muted">No timeline yet.</p>`;
};

const loadDashboardDetails = async () => {
    if (!state.selectedProjectId) {
        return null;
    }

    const dashboard = await api(`/analysis/${state.selectedProjectId}/dashboard`);
    renderDashboardDetails(dashboard);
    return dashboard;
};

const resetAnalysisView = (message = "Select a project and run analysis.") => {
    els.scoreDashboard.classList.add("hidden");
    els.analysisResult.classList.add("muted");
    els.analysisResult.textContent = message;
    els.scoreBreakdownFrame.innerHTML = "";
    els.overengineeringFrame.innerHTML = "";
    els.dashboardDetails.classList.add("hidden");
    state.lastAnalysis = null;
    state.lastDashboard = null;
};

const renderAnalysis = (result) => {
    state.lastAnalysis = result;
    renderDashboard(result);
    els.analysisResult.classList.remove("muted");
    els.analysisResult.innerHTML = `
        <strong>${escapeHtml(result.analysis.evaluation)}</strong>
        <div class="scoreGrid">
            <div class="scoreBox"><span>Total</span><strong>${escapeHtml(result.scores.total_score)}</strong></div>
            <div class="scoreBox"><span>Frontend</span><strong>${escapeHtml(result.scores.frontend_score)}</strong></div>
            <div class="scoreBox"><span>Backend</span><strong>${escapeHtml(result.scores.backend_score)}</strong></div>
            <div class="scoreBox"><span>Infra</span><strong>${escapeHtml(result.scores.infrastructure_score)}</strong></div>
        </div>
        <p class="aiExplanation">${escapeHtml(result.ai_explanation || result.analysis.ai_explanation || "No explanation available.")}</p>
        <div class="pillList">
            ${result.flags.map((flag) => `<span class="pill">${escapeHtml(flag.flag_name)} / ${escapeHtml(flag.severity)}</span>`).join("") || `<span class="pill">NO_FLAGS</span>`}
        </div>
        <ul>
            ${result.recommendations.map((recommendation) => `<li>${escapeHtml(recommendation)}</li>`).join("")}
        </ul>
    `;
};

const explainWhatIfResult = (result) => {
    const direction = result.scores.complexity_direction === "underengineering"
        ? "underengineered"
        : "overengineered";

    if (result.scores.underengineering_score > 0) {
        return `This simulation is ${direction}: the stack is missing about ${result.scores.underengineering_score} complexity points compared with the selected scale and user count.`;
    }

    if (result.scores.penalty_score > 0) {
        return `This simulation adds ${result.scores.penalty_score} overengineering penalty points, meaning some selected tools may be heavier than the project currently needs.`;
    }

    return "This simulation looks balanced for the selected scale, user count, and technologies.";
};

const explainComparison = (result) => {
    const totalDelta = result.delta.total_score;
    const overDelta = result.delta.overengineering;
    const underDelta = result.delta.underengineering;
    const targetName = result.right.project.name;

    const totalMeaning = totalDelta > 0
        ? `${targetName} has ${totalDelta} more total risk points.`
        : totalDelta < 0
            ? `${targetName} has ${Math.abs(totalDelta)} fewer total risk points.`
            : "Both projects have the same total risk score.";

    const overMeaning = overDelta > 0
        ? `It is ${overDelta} points more overengineered.`
        : overDelta < 0
            ? `It is ${Math.abs(overDelta)} points less overengineered.`
            : "Its overengineering penalty is the same.";

    const underMeaning = underDelta > 0
        ? `It is ${underDelta} points more underengineered, so its stack may be too thin for its context.`
        : underDelta < 0
            ? `It is ${Math.abs(underDelta)} points less underengineered, so it better covers its required complexity.`
            : "Its underengineering gap is the same.";

    return `${totalMeaning} ${overMeaning} ${underMeaning}`;
};

const renderAnalysisHistory = (history) => {
    if (!history.length) {
        els.analysisHistory.classList.add("muted");
        els.analysisHistory.textContent = "No analysis history yet.";
        return;
    }

    els.analysisHistory.classList.remove("muted");
    els.analysisHistory.innerHTML = history.map((item) => `
        <article class="historyItem">
            <strong>${escapeHtml(item.evaluation)}</strong>
            <span>${escapeHtml(new Date(item.created_at).toLocaleString())} / score ${escapeHtml(item.total_score)}</span>
            <p>${escapeHtml(item.ai_explanation || "No explanation saved for this run.")}</p>
        </article>
    `).join("");
};

const loadProjects = async () => {
    state.projects = await api("/projects");
    if (!state.selectedProjectId && state.projects[0]) {
        state.selectedProjectId = state.projects[0].id;
    }
    renderProjects();
    renderComparisonOptions();
};

const loadTechnologies = async () => {
    state.technologies = await api("/technologies");
    renderTechnologies();
    renderComparisonOptions();
};

const renderComparisonOptions = () => {
    const select = els.comparisonForm.elements.rightProjectId;
    const options = state.projects
        .filter((project) => project.id !== state.selectedProjectId)
        .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`);
    select.innerHTML = options.join("");
};

const loadSelectedProjectDetails = async () => {
    if (!state.selectedProjectId) {
        setTechnologySelection([]);
        els.analysisHistory.classList.add("muted");
        els.analysisHistory.textContent = "No analysis loaded.";
        resetAnalysisView();
        return;
    }

    const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
    if (selectedProject?.technologies) {
        setTechnologySelection(selectedProject.technologies);
    }

    const [selectedTechnologies, history] = await Promise.all([
        api(`/projects/${state.selectedProjectId}/technologies`),
        api(`/analysis/${state.selectedProjectId}/history`)
    ]);
    setTechnologySelection(selectedTechnologies);
    updateSelectedProjectTechnologies(selectedTechnologies);
    renderAnalysisHistory(history);
    renderComparisonOptions();
    await loadDashboardDetails();
};

const bootstrapApp = async () => {
    renderSession();

    if (!state.token) {
        return;
    }

    const isAdmin = state.user?.role === "admin";

    try {
        if (isAdmin) {
            await Promise.all([loadKnowledgeBase(), loadAdminTechnologies()]);
        } else {
            await Promise.all([loadProjects(), loadTechnologies()]);
            await loadKnowledgeBase();
            await loadSelectedProjectDetails();
        }
        setMessage("", false);
    } catch (error) {
        clearSession();
        renderSession();
        setMessage(error.message);
    }
};

const submitAuth = async (event, path) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    await withBusyButton(submitButton, "Signing in...", async () => {
        const result = await api(path, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        saveSession(result);
        form.reset();
        await bootstrapApp();
        setMessage("Signed in.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
};

els.loginForm.addEventListener("submit", (event) => submitAuth(event, "/auth/login"));

els.showLoginButton.addEventListener("click", () => showAuthMode("login"));

els.showRegisterButton.addEventListener("click", () => showAuthMode("register"));

els.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    await withBusyButton(submitButton, "Creating account...", async () => {
        await api("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const result = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        saveSession(result);
        form.reset();
        await bootstrapApp();
        setMessage("Account created.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
});

els.logoutButton.addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    clearSession();
    renderSession();
    setMessage("Signed out.", false);
});

els.refreshProjectsButton.addEventListener("click", async () => {
    await withBusyButton(els.refreshProjectsButton, "Refreshing...", async () => {
        await loadProjects();
        setMessage("Projects refreshed.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
});

els.refreshKnowledgeButton.addEventListener("click", async () => {
    await loadKnowledgeBase()
        .then(() => setMessage("Knowledge base refreshed.", false))
        .catch((error) => setMessage(error.message));
});

els.resetTechnologyAdminButton.addEventListener("click", resetTechnologyAdminForm);

els.technologyAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const id = formData.get("id");
    const payload = {
        name: formData.get("name"),
        category: formData.get("category"),
        complexity_weight: Number(formData.get("complexity_weight")),
        docs_url: formData.get("docs_url"),
        description: formData.get("description"),
        best_for: formData.get("best_for"),
        risk_notes: formData.get("risk_notes"),
        alternatives: formData.get("alternatives"),
        is_active: formData.get("is_active") === "on"
    };

    const path = id ? `/admin/technologies/${id}` : "/admin/technologies";
    const method = id ? "PUT" : "POST";

    await api(path, {
        method,
        body: JSON.stringify(payload)
    }).then(async () => {
        resetTechnologyAdminForm();
        await Promise.all([loadTechnologies(), loadAdminTechnologies(), loadKnowledgeBase()]);
        setMessage("Technology saved.", false);
    }).catch((error) => setMessage(error.message));
});

els.adminTechnologyList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-action]");
    if (!button) {
        return;
    }

    const technology = state.adminTechnologies.find((item) => item.id === Number(button.dataset.technologyId));
    if (!technology) {
        return;
    }

    if (button.dataset.adminAction === "edit") {
        setTechnologyAdminForm(technology);
        setMessage("Editing technology.", false);
        return;
    }

    await api(`/admin/technologies/${technology.id}`, {
        method: "DELETE"
    }).then(async () => {
        await Promise.all([loadTechnologies(), loadAdminTechnologies(), loadKnowledgeBase()]);
        setMessage("Technology soft deleted.", false);
    }).catch((error) => setMessage(error.message));
});

els.projectList.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action) {
        const projectId = Number(action.dataset.projectId);
        const project = state.projects.find((item) => item.id === projectId);

        if (action.dataset.action === "edit" && project) {
            state.selectedProjectId = projectId;
            setProjectFormMode(project);
            renderProjects();
            loadSelectedProjectDetails().catch((error) => setMessage(error.message));
            setMessage("Editing selected project.", false);
            return;
        }

        if (action.dataset.action === "delete" && project) {
            openDeleteDialog(project);
            return;
        }
    }

    const button = event.target.closest("[data-project-id]");
    if (!button) {
        return;
    }
    state.selectedProjectId = Number(button.dataset.projectId);
    renderProjects();
    resetAnalysisView("Project selected. Run analysis to update the dashboard.");
    loadSelectedProjectDetails().catch((error) => setMessage(error.message));
});

const deleteProject = async () => {
    const project = state.pendingDeleteProject;
    if (!project) {
        return;
    }

    await withBusyButton(els.confirmDeleteButton, "Deleting...", async () => {
        await api(`/projects/${project.id}`, {
            method: "DELETE"
        });

        if (state.selectedProjectId === project.id) {
            state.selectedProjectId = null;
        }
        if (state.editingProjectId === project.id) {
            setProjectFormMode();
        }

        await loadProjects();
        await loadSelectedProjectDetails();
        closeDeleteDialog();
        setMessage("Project deleted.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
};

els.projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = {
        name: formData.get("name"),
        daily_users: Number(formData.get("daily_users")),
        scale: formData.get("scale"),
        visibility: formData.get("visibility")
    };

    const isEditing = Boolean(state.editingProjectId);
    const path = isEditing ? `/projects/${state.editingProjectId}` : "/projects";
    const method = isEditing ? "PUT" : "POST";

    await withBusyButton(submitButton, isEditing ? "Updating project..." : "Creating project...", async () => {
        const project = await api(path, {
            method,
            body: JSON.stringify(payload)
        });
        state.selectedProjectId = project.id;
        setProjectFormMode();
        await loadProjects();
        await loadSelectedProjectDetails();
        setMessage(isEditing ? "Project updated." : "Project created.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
});

els.cancelEditButton.addEventListener("click", () => {
    setProjectFormMode();
    setMessage("Edit cancelled.", false);
});

els.cancelDeleteButton.addEventListener("click", closeDeleteDialog);

els.confirmDeleteButton.addEventListener("click", deleteProject);

els.deleteDialog.addEventListener("click", (event) => {
    if (event.target === els.deleteDialog) {
        closeDeleteDialog();
    }
});

els.saveTechnologiesButton.addEventListener("click", async () => {
    if (!state.selectedProjectId) {
        setMessage("Select a project first.");
        return;
    }

    await withBusyButton(els.saveTechnologiesButton, "Saving...", async () => {
        await saveSelectedTechnologies();
        setMessage("Technologies saved.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
});

els.analyzeButton.addEventListener("click", async () => {
    if (!state.selectedProjectId) {
        setMessage("Select a project first.");
        return;
    }

    await withBusyButton(els.analyzeButton, "Analyzing...", async () => {
        await saveSelectedTechnologies();
        const result = await api(`/analysis/${state.selectedProjectId}`, {
            method: "POST"
        });

        renderAnalysis(result);
        await loadDashboardDetails();
        const history = await api(`/analysis/${state.selectedProjectId}/history`);
        renderAnalysisHistory(history);
        setMessage("Analysis complete.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
});

els.whatIfForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) {
        setMessage("Select a project first.");
        return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
        daily_users: Number(formData.get("daily_users")),
        scale: formData.get("scale"),
        technologyIds: getCheckedTechnologyIds()
    };

    await api(`/analysis/${state.selectedProjectId}/what-if`, {
        method: "POST",
        body: JSON.stringify(payload)
    }).then((result) => {
        els.whatIfResult.classList.remove("muted");
        els.whatIfResult.innerHTML = `
            <strong>${escapeHtml(result.analysis.evaluation)}</strong>
            <p class="plainExplanation">${escapeHtml(explainWhatIfResult(result))}</p>
            <div class="scoreGrid">
                <div class="scoreBox"><span>Total</span><strong>${escapeHtml(result.scores.total_score)}</strong></div>
                <div class="scoreBox"><span>Under</span><strong>${escapeHtml(result.scores.underengineering_score)}</strong></div>
                <div class="scoreBox"><span>Over</span><strong>${escapeHtml(result.scores.penalty_score)}</strong></div>
                <div class="scoreBox"><span>Badge</span><strong>${escapeHtml(result.badge.label)}</strong></div>
            </div>
        `;
        setMessage("What-if complete. Saved project was not changed.", false);
    }).catch((error) => setMessage(error.message));
});

els.comparisonForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rightProjectId = event.currentTarget.elements.rightProjectId.value;

    if (!state.selectedProjectId || !rightProjectId) {
        setMessage("Select two projects to compare.");
        return;
    }

    await api(`/analysis/compare?leftProjectId=${state.selectedProjectId}&rightProjectId=${rightProjectId}`)
        .then((result) => {
            els.comparisonResult.classList.remove("muted");
            els.comparisonResult.innerHTML = `
                <p class="plainExplanation">${escapeHtml(explainComparison(result))}</p>
                <div class="scoreGrid">
                    <div class="scoreBox"><span>${escapeHtml(result.left.project.name)}</span><strong>${escapeHtml(result.left.scores.total_score)}</strong></div>
                    <div class="scoreBox"><span>${escapeHtml(result.right.project.name)}</span><strong>${escapeHtml(result.right.scores.total_score)}</strong></div>
                    <div class="scoreBox"><span>Total delta</span><strong>${escapeHtml(result.delta.total_score)}</strong></div>
                    <div class="scoreBox"><span>Overengineering delta</span><strong>${escapeHtml(result.delta.overengineering)}</strong></div>
                </div>
                <p class="deltaLegend">
                    Total delta compares overall risk score. Negative means the compared project has less total risk; positive means more total risk.
                    Risk delta compares only overengineering penalty. Underengineering differences are explained above.
                </p>
            `;
            setMessage("Comparison complete.", false);
        }).catch((error) => setMessage(error.message));
});

els.exportReportButton.addEventListener("click", () => {
    if (!state.lastAnalysis) {
        setMessage("Run analysis before exporting.");
        return;
    }

    const project = state.projects.find((item) => item.id === state.selectedProjectId);
    const reportWindow = window.open("", "_blank");
    reportWindow.document.write(`
        <!doctype html>
        <html>
        <head>
            <title>Architecture Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 32px; color: #241f2f; }
                section { border: 1px solid #ddd; padding: 16px; margin-bottom: 16px; }
                h1, h2 { margin-top: 0; }
                li { margin-bottom: 6px; }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(project?.name || "Project")} Architecture Report</h1>
            <section>
                <h2>Summary</h2>
                <p>${escapeHtml(state.lastAnalysis.analysis.evaluation)}</p>
                <p>Total score: ${escapeHtml(state.lastAnalysis.scores.total_score)}</p>
                <p>Badge: ${escapeHtml(state.lastAnalysis.badge?.label || "N/A")}</p>
            </section>
            <section>
                <h2>Technology stack</h2>
                <p>${escapeHtml((project?.technologies || []).map((technology) => technology.name).join(", ") || "None")}</p>
            </section>
            <section>
                <h2>Recommendations</h2>
                <ul>${state.lastAnalysis.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </section>
            <section>
                <h2>Suggestions</h2>
                <ul>${(state.lastDashboard?.suggestions || state.lastAnalysis.suggestions || []).map((item) => `<li>${escapeHtml(item.technology)}: ${escapeHtml(item.suggestion)}</li>`).join("")}</ul>
            </section>
            <script>window.print();</script>
        </body>
        </html>
    `);
    reportWindow.document.close();
});

bootstrapApp();
