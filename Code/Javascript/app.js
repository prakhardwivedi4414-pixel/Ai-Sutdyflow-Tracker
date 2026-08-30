// AI StudyFlow - Global Academic Suite Utility (app.js)

// Determine API base URL dynamically
const API_BASE_URL = (function() {
    if (window.location.protocol.startsWith('http')) {
        if (window.location.port === '5000') {
            return window.location.origin;
        }
    }
    return "http://localhost:5000";
})();

console.log("🔗 AI StudyFlow Academic Suite connected to:", API_BASE_URL);

/**
 * Universal backend API fetch helper
 */
async function apiFetch(endpoint, payload) {
    try {
        const url = `${API_BASE_URL}/api/${endpoint.replace(/^\//, '')}`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        return data.output || data.flashcards || data.quiz || data;
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        throw err;
    }
}

/**
 * Convert Markdown, Tables, and Math formulas to clean semantic HTML
 */
function renderMarkdown(md) {
    if (!md) return "";
    let html = String(md);

    // Escape raw HTML tags
    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Allow safe line breaks that were escaped
    html = html.replace(/&lt;br\s*\/?&gt;/gi, "<br>");

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');

    // Blockquotes
    html = html.replace(/^&gt;\s+(.*$)/gim, '<blockquote>$1</blockquote>');

    // Headers
    html = html.replace(/^#### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="md-divider" />');

    // Clean Tables: Remove markdown separator rows like | :--- | :--- |
    html = html.replace(/\|(\s*:?-{2,}:?\s*\|)+/gim, "");

    // Process table rows
    html = html.replace(/\|(.+)\|/gim, (match) => {
        const cells = match.split('|').filter(c => c.trim() !== '');
        // Ignore lines that are only dashes or colons
        if (cells.every(c => /^[\s\-:]+$/.test(c))) return '';
        return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>(\r?\n)?)+/g, '<div class="table-responsive"><table class="md-table">$&</table></div>');

    // Bold and Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Display Math $$formula$$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (m, p1) => {
        const cleaned = formatMathSymbols(p1.trim());
        return `<div class="display-math-block"><code>${cleaned}</code></div>`;
    });

    // Inline Math $formula$
    html = html.replace(/\$(.*?)\$/g, (m, p1) => {
        const cleaned = formatMathSymbols(p1.trim());
        return `<code class="inline-math">${cleaned}</code>`;
    });

    // Task checkboxes
    html = html.replace(/\[ \]\s+(.*$)/gim, '<div class="task-item"><label><input type="checkbox" /> <span>$1</span></label></div>');
    html = html.replace(/\[x\]\s+(.*$)/gim, '<div class="task-item completed"><label><input type="checkbox" checked /> <span>$1</span></label></div>');

    // Bullet lists
    html = html.replace(/^\s*[-•]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>(\r?\n)?)+/g, '<ul class="md-list">$&</ul>');

    // Numbered lists
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li>$2</li>');

    // Paragraphs
    html = html.replace(/\n\n+/g, '<br/><br/>');

    return html;
}

/**
 * Format common LaTeX symbols into clean readable unicode/ASCII
 */
function formatMathSymbols(str) {
    return str
        .replace(/\\nabla/g, "∇")
        .replace(/\\cdot/g, "·")
        .replace(/\\times/g, "×")
        .replace(/\\Delta/g, "Δ")
        .replace(/\\partial/g, "∂")
        .replace(/\\int/g, "∫")
        .replace(/\\sum/g, "∑")
        .replace(/\\infty/g, "∞")
        .replace(/\\approx/g, "≈")
        .replace(/\\neq/g, "≠")
        .replace(/\\le/g, "≤")
        .replace(/\\ge/g, "≥")
        .replace(/\\rho/g, "ρ")
        .replace(/\\epsilon_0/g, "ε₀")
        .replace(/\\epsilon/g, "ε")
        .replace(/\\mu_0/g, "μ₀")
        .replace(/\\mu/g, "μ")
        .replace(/\\sigma/g, "σ")
        .replace(/\\pi/g, "π")
        .replace(/\\mathbf\{([A-Za-z0-9_]+)\}/g, "<strong>$1</strong>")
        .replace(/\\text\{([A-Za-z0-9_ ]+)\}/g, "$1")
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");
}

/**
 * Global UI Notification Toast
 */
function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const bgColors = {
        success: "linear-gradient(135deg, #10b981, #059669)",
        error: "linear-gradient(135deg, #ef4444, #dc2626)",
        info: "linear-gradient(135deg, #0284c7, #0369a1)",
        warning: "linear-gradient(135deg, #f59e0b, #d97706)"
    };

    toast.style.cssText = `
        padding: 12px 20px;
        border-radius: 12px;
        background: ${bgColors[type] || bgColors.info};
        color: white;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const icon = type === "success" ? "✅" : (type === "error" ? "❌" : (type === "warning" ? "⚠️" : "ℹ️"));
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

/**
 * Study Streak Management
 */
function recordStudyActivity() {
    try {
        const today = new Date().toISOString().split("T")[0];
        const lastDate = localStorage.getItem("lastStudyDate");
        let streak = parseInt(localStorage.getItem("studyStreak") || "1");

        if (lastDate) {
            const last = new Date(lastDate);
            const now = new Date(today);
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak += 1;
                localStorage.setItem("studyStreak", streak);
            } else if (diffDays > 1) {
                streak = 1;
                localStorage.setItem("studyStreak", streak);
            }
        } else {
            localStorage.setItem("studyStreak", "1");
        }
        localStorage.setItem("lastStudyDate", today);
        updateStreakPill();
    } catch (e) {}
}

function updateStreakPill() {
    const pill = document.getElementById("streak-pill");
    const streak = localStorage.getItem("studyStreak") || "1";
    if (pill) {
        pill.innerHTML = `🔥 ${streak} Day Streak`;
    }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
    recordStudyActivity();
    updateStreakPill();
});

// Expose globals
window.API_BASE_URL = API_BASE_URL;
window.apiFetch = apiFetch;
window.renderMarkdown = renderMarkdown;
window.showToast = showToast;
window.recordStudyActivity = recordStudyActivity;
