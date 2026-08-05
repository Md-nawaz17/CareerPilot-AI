(function () {
  const storageKey = "careerpilot-theme";
  const modeKey = "careerpilot-analysis-mode";
  const root = document.documentElement;
  let selectedMode = sessionStorage.getItem(modeKey) || "";
  let choicePanel = null;
  let previewPanel = null;
  let jdPanel = null;
  let recruiterPanel = null;
  let metricsPanel = null;
  let observer = null;
  let isRendering = false;

  function preferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function setTheme(theme) {
    root.dataset.careerpilotTheme = theme;
    localStorage.setItem(storageKey, theme);
    const button = findThemeButton();
    if (button) {
      const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }
  }

  function findThemeButton() {
    const header = document.querySelector("header");
    return header ? header.querySelector("button") : null;
  }

  function textOf(node) {
    return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function getAnalyzerSection() {
    return document.getElementById("get-started");
  }

  function getResultsPanel() {
    return document.getElementById("results");
  }

  function hasParsedResume() {
    const result = getResultsPanel();
    const pageText = textOf(document.body);
    return Boolean(result && (pageText.includes("Analysis complete") || pageText.includes("ATS score") || pageText.includes("Resume intelligence")));
  }

  function getResumeText() {
    const result = getResultsPanel();
    if (!result) return "";
    const previewLabel = Array.from(result.querySelectorAll("p")).find((p) => textOf(p).toLowerCase() === "preview");
    const previewText = previewLabel && previewLabel.parentElement ? previewLabel.parentElement.querySelector("p:last-child") : null;
    return textOf(previewText) || "Resume parsed successfully. Select an analysis path to continue.";
  }

  function getScore() {
    const result = getResultsPanel();
    const match = result ? textOf(result).match(/(\d{2,3})%/) : null;
    return match ? Math.min(100, Number(match[1])) : 72;
  }

  function enhanceUploadCopy() {
    const optional = Array.from(document.querySelectorAll("label")).find((label) => textOf(label).toLowerCase() === "optional job description");
    if (optional && optional.parentElement) {
      optional.textContent = "Job description is requested after you choose a comparison analysis";
      const textarea = optional.parentElement.querySelector("textarea");
      if (textarea) {
        textarea.placeholder = "Choose Resume + Job Description Analysis after upload to compare against a target role.";
        textarea.disabled = selectedMode !== "jd";
      }
    }
  }

  function createProgress() {
    const stages = [
      ["Upload", "Resume file received"],
      ["Preview", "Parsed resume preview"],
      ["Choose", "Select analysis type"],
      ["Report", "Generate recruiter dashboard"],
    ];
    return `<div class="cp-progress">${stages.map(([title, detail], index) => {
      const isDone = hasParsedResume() && index < (selectedMode ? 4 : 2);
      const isActive = hasParsedResume() && index === (selectedMode ? 3 : 2);
      return `<div class="cp-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}"><strong>${title}</strong><span>${detail}</span></div>`;
    }).join("")}</div>`;
  }

  function ensureChoicePanel() {
    const section = getAnalyzerSection();
    if (!section || !hasParsedResume()) return;
    if (!choicePanel) {
      choicePanel = document.createElement("div");
      choicePanel.className = "cp-enhancement-panel";
      const firstPanel = section.children[0];
      section.insertBefore(choicePanel, firstPanel ? firstPanel.nextSibling : null);
    }
    choicePanel.innerHTML = `${createProgress()}<div class="cp-panel-title">What would you like to do?</div>
      <p class="cp-panel-copy">Your resume has been parsed successfully. Choose the next step explicitly so the report matches how recruiters review candidates.</p>
      <div class="cp-choice-grid">
        <button class="cp-choice-button" type="button" data-cp-mode="resume"><strong>Resume Analysis Only</strong><span>Review quality, formatting, completeness, readability, skills, projects, achievements, ATS compatibility, and recruiter summary without job comparison.</span></button>
        <button class="cp-choice-button" type="button" data-cp-mode="jd"><strong>Resume + Job Description Analysis</strong><span>Paste or upload a job description before generating ATS match, missing skills, keyword coverage, hiring recommendation, and interview readiness.</span></button>
      </div>`;
    choicePanel.querySelectorAll("[data-cp-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedMode = button.dataset.cpMode;
        sessionStorage.setItem(modeKey, selectedMode);
        renderWorkflow();
      });
    });
  }

  function ensurePreviewPanel() {
    const section = getAnalyzerSection();
    if (!section || !hasParsedResume()) return;
    if (!previewPanel) {
      previewPanel = document.createElement("div");
      previewPanel.className = "cp-resume-preview";
      section.insertBefore(previewPanel, getResultsPanel());
    }
    previewPanel.innerHTML = `<div class="cp-panel-title">Resume successfully parsed</div>
      <p class="cp-panel-copy">Review the extracted preview, then choose whether you want a resume-only audit or a role-specific comparison.</p>
      <p class="cp-preview-text">${escapeHtml(getResumeText())}</p>`;
  }

  function ensureJdPanel() {
    const section = getAnalyzerSection();
    if (!section || selectedMode !== "jd") {
      if (jdPanel) jdPanel.remove();
      jdPanel = null;
      return;
    }
    if (!jdPanel) {
      jdPanel = document.createElement("div");
      jdPanel.className = "cp-jd-panel";
      section.insertBefore(jdPanel, getResultsPanel());
    }
    jdPanel.innerHTML = `<div class="cp-panel-title">Add the target job description</div>
      <p class="cp-panel-copy">Paste the role text or upload a plain text job description. The comparison report stays locked until this is submitted.</p>
      <textarea id="cp-jd-text" placeholder="Paste the job description here...">${escapeHtml(sessionStorage.getItem("careerpilot-jd") || "")}</textarea>
      <div class="cp-jd-actions">
        <label class="cp-action-button cp-secondary" for="cp-jd-file"><strong>Upload JD TXT</strong><span>Use a plain text job description file.</span></label>
        <input id="cp-jd-file" type="file" accept=".txt" hidden>
        <button class="cp-action-button cp-primary" type="button" id="cp-run-jd"><strong>Generate JD Match Report</strong><span>Unlock ATS match, keyword coverage, and hiring recommendation.</span></button>
        <button class="cp-action-button cp-secondary" type="button" id="cp-back-choice"><strong>Change Analysis Type</strong><span>Return to the explicit choice step.</span></button>
      </div>`;
    jdPanel.querySelector("#cp-jd-text").addEventListener("input", (event) => sessionStorage.setItem("careerpilot-jd", event.target.value));
    jdPanel.querySelector("#cp-jd-file").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      sessionStorage.setItem("careerpilot-jd", await file.text());
      renderWorkflow();
    });
    jdPanel.querySelector("#cp-run-jd").addEventListener("click", () => {
      const value = jdPanel.querySelector("#cp-jd-text").value.trim();
      if (!value) {
        jdPanel.querySelector("#cp-jd-text").focus();
        return;
      }
      sessionStorage.setItem("careerpilot-jd", value);
      selectedMode = "jd-complete";
      sessionStorage.setItem(modeKey, selectedMode);
      renderWorkflow();
    });
    jdPanel.querySelector("#cp-back-choice").addEventListener("click", () => {
      selectedMode = "";
      sessionStorage.removeItem(modeKey);
      renderWorkflow();
    });
  }

  function appendRecruiterPanel() {
    const result = getResultsPanel();
    if (!result || !selectedMode || selectedMode === "jd") {
      if (recruiterPanel) recruiterPanel.remove();
      recruiterPanel = null;
      return;
    }
    if (!recruiterPanel) {
      recruiterPanel = document.createElement("div");
      recruiterPanel.className = "cp-recruiter-panel";
      result.appendChild(recruiterPanel);
    }
    const score = getScore();
    const isJd = selectedMode === "jd-complete";
    const confidence = score >= 80 ? "High" : score >= 65 ? "Moderate" : "Needs work";
    recruiterPanel.innerHTML = `<div class="cp-panel-title">Recruiter mode</div>
      <p class="cp-panel-copy">${isJd ? "This view compares the resume against the submitted job description and explains the hiring signal." : "This view reviews resume quality only. No job description comparison is included."}</p>
      <div class="cp-recruiter-grid">
        <div class="cp-note"><span>Would this pass ATS?</span><strong>${score >= 70 ? "Likely, with refinements" : "Not yet"}</strong></div>
        <div class="cp-note"><span>Shortlist confidence</span><strong>${confidence}</strong></div>
        <div class="cp-note"><span>Interview recommendation</span><strong>${score >= 75 ? "Proceed to screen" : "Improve before outreach"}</strong></div>
      </div>`;
  }

  function appendMetricsPanel() {
    const result = getResultsPanel();
    if (!result || !selectedMode || selectedMode === "jd") {
      if (metricsPanel) metricsPanel.remove();
      metricsPanel = null;
      return;
    }
    if (!metricsPanel) {
      metricsPanel = document.createElement("div");
      metricsPanel.className = "cp-recruiter-panel";
      result.insertBefore(metricsPanel, result.firstChild ? result.firstChild.nextSibling : null);
    }
    const score = getScore();
    const jdText = (sessionStorage.getItem("careerpilot-jd") || "").toLowerCase();
    const resumeText = getResumeText().toLowerCase();
    const required = ["docker", "kubernetes", "graphql", "jest", "redis", "aws", "react", "typescript", "python"];
    const matched = required.filter((skill) => jdText.includes(skill));
    const missing = required.filter((skill) => jdText.includes(skill) && !resumeText.includes(skill));
    const keywordCoverage = jdText ? Math.max(35, Math.min(96, Math.round(((matched.length - missing.length / 2) / Math.max(matched.length, 1)) * 100))) : Math.max(50, score - 8);
    metricsPanel.innerHTML = `<div class="cp-panel-title">${selectedMode === "jd-complete" ? "Role match dashboard" : "Resume health dashboard"}</div>
      <div class="cp-metric-row">
        <div class="cp-metric"><span>${selectedMode === "jd-complete" ? "ATS Match" : "Resume Health"}</span><strong>${selectedMode === "jd-complete" ? keywordCoverage : score}%</strong></div>
        <div class="cp-metric"><span>Keyword Coverage</span><strong>${keywordCoverage}%</strong></div>
        <div class="cp-metric"><span>Interview Readiness</span><strong>${Math.max(45, Math.min(95, score - 4))}%</strong></div>
        <div class="cp-metric"><span>Hiring Confidence</span><strong>${score >= 80 ? "High" : score >= 65 ? "Med" : "Low"}</strong></div>
      </div>
      ${selectedMode === "jd-complete" ? `<p class="cp-panel-copy">Missing technologies detected from the job description: ${missing.length ? missing.join(", ") : "none from the tracked keyword set"}. Recommendation priority: ${missing.length > 2 ? "High" : "Medium"}.</p>` : `<p class="cp-panel-copy">Problem: resume sections need clear evidence. Reason: recruiters scan for impact, tools, and outcomes. Recommended fix: add measurable results to weak sections. Estimated impact: higher ATS clarity and recruiter confidence.</p>`}`;
  }

  function renameReportForMode() {
    const result = getResultsPanel();
    if (!result || !selectedMode) return;
    result.querySelectorAll("p,h3").forEach((node) => {
      if (selectedMode === "resume" && textOf(node) === "ATS score") node.textContent = "Resume health score";
      if (selectedMode === "resume" && textOf(node) === "Analysis result") node.textContent = "Resume analysis only";
      if (selectedMode === "resume" && textOf(node) === "Resume intelligence") node.textContent = "Resume quality dashboard";
      if (selectedMode === "jd-complete" && textOf(node) === "Analysis result") node.textContent = "Resume + job description analysis";
      if (selectedMode === "jd-complete" && textOf(node) === "Resume intelligence") node.textContent = "ATS match dashboard";
    });
  }

  function updateReportVisibility() {
    const result = getResultsPanel();
    if (!result) return;
    const shouldShow = selectedMode === "resume" || selectedMode === "jd-complete";
    result.classList.toggle("cp-hidden-report", hasParsedResume() && !shouldShow);
  }

  function renderWorkflow() {
    if (isRendering) return;
    isRendering = true;
    if (observer) observer.disconnect();
    enhanceUploadCopy();
    ensurePreviewPanel();
    ensureChoicePanel();
    ensureJdPanel();
    updateReportVisibility();
    renameReportForMode();
    appendMetricsPanel();
    appendRecruiterPanel();
    isRendering = false;
    if (observer) observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  setTheme(preferredTheme());
  document.addEventListener("click", (event) => {
    const themeButton = findThemeButton();
    if (!themeButton || !themeButton.contains(event.target)) return;
    setTimeout(() => setTheme(root.dataset.careerpilotTheme === "dark" ? "light" : "dark"), 0);
  }, true);

  observer = new MutationObserver(renderWorkflow);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("storage", () => setTheme(preferredTheme()));
  window.addEventListener("load", renderWorkflow);
  renderWorkflow();
})();
