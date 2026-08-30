// AI StudyFlow - Planner Logic (planner.js)

let activeSubjects = [];

document.addEventListener("DOMContentLoaded", () => {
    const subjectInput = document.getElementById("subject-input");
    const dateInput = document.getElementById("date-input");
    const addBtn = document.getElementById("add-deadline-btn");
    const deadlineList = document.getElementById("deadline-list");
    const hoursInput = document.getElementById("hours");
    const genBtn = document.getElementById("gen-plan");
    const outputBox = document.getElementById("plan-output");
    const downloadBtn = document.getElementById("download-btn");
    const downloadDocBtn = document.getElementById("download-doc-btn");
    const copyBtn = document.getElementById("copy-plan-btn");
    const actionsToolbar = document.getElementById("plan-actions");

    // Set minimum date for date picker to today
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.min = today;
    }

    // ====================================
    // ADD SUBJECT + DEADLINE
    // ====================================
    function addSubject() {
        const subject = subjectInput.value.trim();
        const date = dateInput.value;

        if (!subject) {
            window.showToast("Please enter a subject name!", "warning");
            subjectInput.focus();
            return;
        }

        const deadlineStr = date || "In 2 Weeks";
        const subjectObj = {
            id: Date.now(),
            subject: subject,
            deadline: deadlineStr
        };

        activeSubjects.push(subjectObj);
        renderSubjectList();

        subjectInput.value = "";
        dateInput.value = "";
        subjectInput.focus();
        window.showToast(`Added "${subject}"`, "success");
    }

    function renderSubjectList() {
        deadlineList.innerHTML = "";

        if (activeSubjects.length === 0) {
            deadlineList.innerHTML = `<li class="empty-notice">No subjects added yet. Add courses above or pick a quick bundle!</li>`;
            return;
        }

        activeSubjects.forEach((item) => {
            const li = document.createElement("li");
            li.className = "subject-item-card";

            let daysLeftBadge = "";
            if (item.deadline && item.deadline.includes("-")) {
                const target = new Date(item.deadline);
                const now = new Date();
                const diffTime = target - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0) {
                    daysLeftBadge = `<span class="badge days-badge">${diffDays} days left</span>`;
                }
            }

            li.innerHTML = `
                <div class="subject-info">
                    <span class="sub-name">📚 ${item.subject}</span>
                    <span class="sub-date">🎯 Target: ${item.deadline}</span>
                    ${daysLeftBadge}
                </div>
                <button class="remove-btn" type="button" title="Remove subject" data-id="${item.id}">❌</button>
            `;

            li.querySelector(".remove-btn").addEventListener("click", () => {
                activeSubjects = activeSubjects.filter(s => s.id !== item.id);
                renderSubjectList();
            });

            deadlineList.appendChild(li);
        });
    }

    if (addBtn) {
        addBtn.addEventListener("click", addSubject);
    }

    if (subjectInput) {
        subjectInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") addSubject();
        });
    }

    // Default subjects if empty
    if (activeSubjects.length === 0) {
        activeSubjects.push(
            { id: 1, subject: "Data Structures & Algorithms", deadline: "2026-09-15" },
            { id: 2, subject: "Computer Systems Architecture", deadline: "2026-09-22" }
        );
        renderSubjectList();
    }

    // ====================================
    // GENERATE STUDY PLAN
    // ====================================
    if (genBtn) {
        genBtn.addEventListener("click", async () => {
            if (activeSubjects.length === 0) {
                window.showToast("Please add at least one subject first!", "warning");
                return;
            }

            const hours = hoursInput ? parseInt(hoursInput.value) || 4 : 4;

            genBtn.disabled = true;
            genBtn.innerHTML = `<span>⏳ Synthesizing AI Masterplan...</span>`;
            outputBox.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p class="loading-text">Balancing cognitive workload and generating comprehensive 14-day study plan...</p>
                </div>
            `;
            if (actionsToolbar) actionsToolbar.style.display = "none";

            try {
                const subjectsPayload = activeSubjects.map(s => ({
                    subject: s.subject,
                    deadline: s.deadline
                }));

                const result = await window.apiFetch("plan", {
                    subjects: subjectsPayload,
                    hours: hours
                });

                window.currentPlanMarkdown = result;
                outputBox.innerHTML = window.renderMarkdown(result);

                if (actionsToolbar) actionsToolbar.style.display = "flex";
                window.showToast("Study masterplan generated successfully!", "success");
                window.recordStudyActivity();

                outputBox.scrollIntoView({ behavior: "smooth", block: "start" });

            } catch (err) {
                console.error("Plan generation error:", err);
                outputBox.innerHTML = `
                    <div class="error-box">
                        <h3>⚠️ Could not generate plan</h3>
                        <p>${err.message || "Failed to reach backend service."}</p>
                        <button id="retry-plan-btn" class="mini-btn" type="button">🔄 Retry</button>
                    </div>
                `;
                const retryBtn = document.getElementById("retry-plan-btn");
                if (retryBtn) retryBtn.addEventListener("click", () => genBtn.click());
                window.showToast("Failed to generate plan. Check server.", "error");
            } finally {
                genBtn.disabled = false;
                genBtn.innerHTML = `🚀 Generate 14-Day AI Masterplan`;
            }
        });
    }

    // ====================================
    // COPY & DOWNLOAD HANDLERS
    // ====================================
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            if (!window.currentPlanMarkdown) return;
            navigator.clipboard.writeText(window.currentPlanMarkdown).then(() => {
                window.showToast("Study plan copied to clipboard!", "success");
            }).catch(() => {
                window.showToast("Could not access clipboard", "error");
            });
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const text = window.currentPlanMarkdown;
            if (!text) return window.showToast("Please generate a plan first!", "warning");
            downloadPDF(text);
        });
    }

    if (downloadDocBtn) {
        downloadDocBtn.addEventListener("click", () => {
            const text = window.currentPlanMarkdown;
            if (!text) return window.showToast("Please generate a plan first!", "warning");
            downloadDOC(text);
        });
    }
});

function addPresetBundle(type) {
    const bundles = {
        CS: [
            { id: Date.now() + 1, subject: "Data Structures & Algorithms", deadline: "In 2 Weeks" },
            { id: Date.now() + 2, subject: "Operating Systems & Concurrency", deadline: "In 3 Weeks" },
            { id: Date.now() + 3, subject: "Database Management Systems", deadline: "In 4 Weeks" }
        ],
        PreMed: [
            { id: Date.now() + 1, subject: "Cellular Biology & Genetics", deadline: "In 2 Weeks" },
            { id: Date.now() + 2, subject: "Organic Chemistry II", deadline: "In 3 Weeks" },
            { id: Date.now() + 3, subject: "Human Physiology", deadline: "In 4 Weeks" }
        ],
        Engineering: [
            { id: Date.now() + 1, subject: "Multivariable Calculus III", deadline: "In 2 Weeks" },
            { id: Date.now() + 2, subject: "Thermodynamics & Heat Transfer", deadline: "In 3 Weeks" },
            { id: Date.now() + 3, subject: "Circuit Analysis & Electronics", deadline: "In 4 Weeks" }
        ]
    };

    activeSubjects = bundles[type] || [];
    const list = document.getElementById("deadline-list");
    if (list) {
        list.innerHTML = "";
        activeSubjects.forEach(item => {
            const li = document.createElement("li");
            li.className = "subject-item-card";
            li.innerHTML = `
                <div class="subject-info">
                    <span class="sub-name">📚 ${item.subject}</span>
                    <span class="sub-date">🎯 Target: ${item.deadline}</span>
                </div>
                <button class="remove-btn" type="button" title="Remove subject" data-id="${item.id}">❌</button>
            `;
            li.querySelector(".remove-btn").addEventListener("click", () => {
                activeSubjects = activeSubjects.filter(s => s.id !== item.id);
                li.remove();
            });
            list.appendChild(li);
        });
    }
    window.showToast(`Loaded ${type} subject bundle!`, "success");
}

function downloadPDF(markdownText) {
    try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            window.showToast("jsPDF library not ready. Downloading as Text file.", "warning");
            downloadTXT(markdownText);
            return;
        }

        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const plainText = markdownText.replace(/^#+\s+/gm, "").replace(/\*\*/g, "").replace(/\*/g, "");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(2, 132, 199);
        doc.text("AI StudyFlow — 14-Day Study Masterplan", 14, 20);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 27);

        doc.setDrawColor(200, 200, 200);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);

        const lines = doc.splitTextToSize(plainText, 180);
        let yPos = 38;

        for (let i = 0; i < lines.length; i++) {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(lines[i], 14, yPos);
            yPos += 6;
        }

        doc.save("AI-StudyFlow-Masterplan.pdf");
        window.showToast("Downloaded PDF successfully!", "success");
    } catch (err) {
        console.error("PDF download failed:", err);
        downloadTXT(markdownText);
    }
}

function downloadDOC(markdownText) {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>AI Study Plan</title>
    <style>body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #222; }</style>
    </head><body>`;
    const footer = `</body></html>`;
    const htmlContent = header + window.renderMarkdown(markdownText) + footer;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AI-StudyFlow-Masterplan.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast("Downloaded DOC successfully!", "success");
}

function downloadTXT(markdownText) {
    const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AI-StudyFlow-Masterplan.md";
    link.click();
}

window.addPresetBundle = addPresetBundle;
