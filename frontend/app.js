const state = {
    token: localStorage.getItem("token") || "",
    user: JSON.parse(localStorage.getItem("user") || "null"),
    projects: [],
    technologies: [],
    selectedProjectId: null,
    editingProjectId: null,
    pendingDeleteProject: null
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
    scoreDashboard: document.querySelector("#scoreDashboard"),
    overallScore: document.querySelector("#overallScore"),
    necessaryComplexity: document.querySelector("#necessaryComplexity"),
    complexityGapLabel: document.querySelector("#complexityGapLabel"),
    overengineeringPercent: document.querySelector("#overengineeringPercent"),
    riskLevel: document.querySelector("#riskLevel"),
    scoreBreakdownFrame: document.querySelector("#scoreBreakdownFrame"),
    overengineeringFrame: document.querySelector("#overengineeringFrame"),
    scoreBreakdownChart: document.querySelector("#scoreBreakdownChart"),
    overengineeringChart: document.querySelector("#overengineeringChart"),
    analysisResult: document.querySelector("#analysisResult"),
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

let scoreBreakdownChart = null;
let overengineeringChart = null;

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

    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(path, {
        ...options,
        headers
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
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
};

const clearSession = () => {
    state.token = "";
    state.user = null;
    state.projects = [];
    state.technologies = [];
    state.selectedProjectId = null;
    state.editingProjectId = null;
    state.pendingDeleteProject = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    resetAnalysisView();
};

const renderSession = () => {
    const signedIn = Boolean(state.token);
    els.authView.classList.toggle("hidden", signedIn);
    els.appView.classList.toggle("hidden", !signedIn);
    els.session.classList.toggle("hidden", !signedIn);
    els.logoutButton.classList.toggle("hidden", !signedIn);
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
    const necessary = Number(scores.necessary_complexity || Math.max(total - penalty, 0));
    const direction = scores.complexity_direction || (underengineering > penalty ? "underengineering" : "overengineering");
    const gapScore = direction === "underengineering" ? underengineering : penalty;
    const denominator = Math.max(necessary, total, gapScore, 1);
    const gapPercent = Math.round((gapScore / denominator) * 100);

    return {
        total,
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
    const Chart = window.Chart;

    scoreBreakdownChart?.destroy();
    overengineeringChart?.destroy();
    scoreBreakdownChart = null;
    overengineeringChart = null;
    els.scoreBreakdownFrame.classList.toggle("emptyChart", metrics.total === 0 && metrics.gapScore === 0);
    els.overengineeringFrame.classList.toggle("emptyChart", metrics.total === 0 && metrics.gapScore === 0);

    if (metrics.total === 0 && metrics.gapScore === 0) {
        return;
    }

    if (!Chart) {
        return;
    }

    scoreBreakdownChart = new Chart(els.scoreBreakdownChart, {
        type: "bar",
        data: {
            labels: [
                "Frontend",
                "Backend",
                "Infrastructure",
                metrics.direction === "underengineering" ? "Underengineering" : "Overengineering"
            ],
            datasets: [{
                label: "Score",
                data: [
                    result.scores.frontend_score,
                    result.scores.backend_score,
                    result.scores.infrastructure_score,
                    metrics.direction === "underengineering" ? metrics.underengineering : metrics.penalty
                ],
                backgroundColor: ["#4f7f8f", "#7d6ab3", "#b48a4c", "#b85b5b"],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });

    overengineeringChart = new Chart(els.overengineeringChart, {
        type: "doughnut",
        data: {
            labels: [
                "Implemented complexity",
                metrics.direction === "underengineering" ? "Underengineering" : "Overengineering"
            ],
            datasets: [{
                data: [
                    Math.max(metrics.total - metrics.penalty, 0),
                    metrics.gapScore
                ],
                backgroundColor: ["#4f7f8f", "#b85b5b"],
                borderColor: "#fffdfa",
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
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

const resetAnalysisView = (message = "Select a project and run analysis.") => {
    els.scoreDashboard.classList.add("hidden");
    els.analysisResult.classList.add("muted");
    els.analysisResult.textContent = message;
    scoreBreakdownChart?.destroy();
    overengineeringChart?.destroy();
    scoreBreakdownChart = null;
    overengineeringChart = null;
};

const renderAnalysis = (result) => {
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
};

const loadTechnologies = async () => {
    state.technologies = await api("/technologies");
    renderTechnologies();
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
};

const bootstrapApp = async () => {
    renderSession();

    if (!state.token) {
        return;
    }

    try {
        await Promise.all([loadProjects(), loadTechnologies()]);
        await loadSelectedProjectDetails();
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

els.logoutButton.addEventListener("click", () => {
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
        const history = await api(`/analysis/${state.selectedProjectId}/history`);
        renderAnalysisHistory(history);
        setMessage("Analysis complete.", false);
    }).catch((error) => {
        setMessage(error.message);
    });
});

bootstrapApp();
