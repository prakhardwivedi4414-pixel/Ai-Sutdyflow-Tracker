// AI StudyFlow - Mood Coach Logic (mood.js)

const aura = document.getElementById("mood-aura");
const graph = document.getElementById("graph-container");
const historyBox = document.getElementById("mood-history");
const moodOutput = document.getElementById("mood-output");
const video = document.getElementById("webcam");
const overlay = document.getElementById("overlay");
const startCamBtn = document.getElementById("start-cam-btn");
const stopCamBtn = document.getElementById("stop-cam-btn");
const camStatus = document.getElementById("cam-status");

let currentMood = "Neutral";
let stream = null;
let detectInterval = null;
let modelLoaded = false;
let lastDetectedMood = null;
let lastDetectedTime = 0;

/* Mood color mapping */
const moodAuraColors = {
    Happy: "rgba(255, 215, 0, 0.65)",
    Calm: "rgba(16, 185, 129, 0.65)",
    Tired: "rgba(249, 115, 22, 0.65)",
    Stressed: "rgba(239, 68, 68, 0.65)",
    Sad: "rgba(139, 92, 246, 0.65)",
    Neutral: "rgba(59, 130, 246, 0.65)",
};

/* Mood graph metrics */
const moodGraphs = {
    Happy: { focus: 90, motivation: 95, energy: 85, calm: 70, stress: 15 },
    Calm: { focus: 85, motivation: 75, energy: 65, calm: 95, stress: 20 },
    Tired: { focus: 40, motivation: 50, energy: 25, calm: 55, stress: 35 },
    Stressed: { focus: 55, motivation: 45, energy: 75, calm: 20, stress: 90 },
    Sad: { focus: 45, motivation: 35, energy: 30, calm: 40, stress: 60 },
    Neutral: { focus: 70, motivation: 65, energy: 60, calm: 60, stress: 40 }
};

/* Pomodoro presets based on mood (in minutes) */
const moodTimers = {
    Happy: { work: 50, break: 10, label: "Deep Flow 50/10" },
    Calm: { work: 45, break: 10, label: "Mindful Study 45/10" },
    Neutral: { work: 25, break: 5, label: "Classic Pomodoro 25/5" },
    Tired: { work: 20, break: 5, label: "Micro-Burst 20/5" },
    Stressed: { work: 15, break: 5, label: "De-stress Burst 15/5" },
    Sad: { work: 25, break: 10, label: "Gentle Pace 25/10" }
};

/* Main Mood Selector */
async function selectMood(mood, emoji = "🙂") {
    currentMood = mood;
    applyAura(mood);
    drawGraph(mood);
    saveHistory(emoji, mood);
    updateHistory();
    setupMoodTimer(mood);

    // Highlight active mood button
    document.querySelectorAll(".mood-btn").forEach(btn => {
        if (btn.innerText.toLowerCase().includes(mood.toLowerCase())) {
            btn.classList.add("active-mood-btn");
        } else {
            btn.classList.remove("active-mood-btn");
        }
    });

    // Request AI guidance
    if (moodOutput) {
        moodOutput.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p class="loading-text">AI Coach is designing a customized strategy for your <strong>${mood}</strong> state...</p>
            </div>
        `;

        try {
            const result = await window.apiFetch("mood", { mood: mood });
            moodOutput.innerHTML = window.renderMarkdown(result);
            window.showToast(`Coach adapted to ${mood} state`, "success");
        } catch (err) {
            console.error("Mood API error:", err);
            moodOutput.innerHTML = `
                <div class="error-box">
                    <h3>⚠️ Could not fetch AI coach advice</h3>
                    <p>${err.message || "Please check backend connection."}</p>
                    <button class="mini-btn" onclick="selectMood('${mood}', '${emoji}')">🔄 Retry</button>
                </div>
            `;
        }
    }
}

/* Aura effect */
function applyAura(mood) {
    if (!aura) return;
    aura.style.background = moodAuraColors[mood] || moodAuraColors.Neutral;
    aura.style.opacity = "0.7";
}

/* Mood graph animation */
function drawGraph(mood) {
    if (!graph) return;
    const data = moodGraphs[mood] || moodGraphs.Neutral;
    graph.innerHTML = "";

    for (let key in data) {
        const val = data[key];
        const row = document.createElement("div");
        row.className = "graph-row";
        row.innerHTML = `
            <div class="graph-label-row">
                <span class="graph-metric-name">${key.toUpperCase()}</span>
                <span class="graph-metric-val">${val}%</span>
            </div>
            <div class="graph-bar">
                <div class="graph-bar-fill" style="width: 0%;" data-width="${val}%"></div>
            </div>
        `;
        graph.appendChild(row);
    }

    // Animate widths
    requestAnimationFrame(() => {
        document.querySelectorAll(".graph-bar-fill").forEach(bar => {
            bar.style.width = bar.getAttribute("data-width");
        });
    });
}

/* History */
function saveHistory(emoji, mood) {
    try {
        let history = JSON.parse(localStorage.getItem("moodHistoryData") || "[]");
        history.unshift({ emoji, mood, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        if (history.length > 6) history.pop();
        localStorage.setItem("moodHistoryData", JSON.stringify(history));
    } catch (e) {}
}

function updateHistory() {
    if (!historyBox) return;
    try {
        let history = JSON.parse(localStorage.getItem("moodHistoryData") || "[]");
        if (history.length === 0) {
            historyBox.innerHTML = "<span class='empty-history'>Select your mood above to begin!</span>";
            return;
        }

        historyBox.innerHTML = history.map(h => `
            <span class="history-mood-chip" title="${h.mood} at ${h.time}">
                ${h.emoji} <small>${h.mood}</small>
            </span>
        `).join(" ");
    } catch (e) {}
}

// ==========================================
// MOOD-ADAPTIVE POMODORO TIMER
// ==========================================
let timerInterval = null;
let timerSecondsLeft = 25 * 60;
let timerTotalSeconds = 25 * 60;
let isTimerRunning = false;

function setupMoodTimer(mood) {
    const config = moodTimers[mood] || moodTimers.Neutral;
    const timerLabel = document.getElementById("timer-mode-label");
    const timerDisplay = document.getElementById("timer-display");
    const timerProgress = document.getElementById("timer-progress");

    if (timerLabel) timerLabel.innerText = `Recommended: ${config.label}`;

    // If timer not actively running, set to recommended time
    if (!isTimerRunning) {
        timerTotalSeconds = config.work * 60;
        timerSecondsLeft = timerTotalSeconds;
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timer-display");
    const timerProgress = document.getElementById("timer-progress");

    const minutes = Math.floor(timerSecondsLeft / 60);
    const seconds = timerSecondsLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (timerDisplay) timerDisplay.innerText = formatted;

    if (timerProgress && timerTotalSeconds > 0) {
        const pct = ((timerTotalSeconds - timerSecondsLeft) / timerTotalSeconds) * 100;
        timerProgress.style.width = `${pct}%`;
    }
}

function toggleTimer() {
    const toggleBtn = document.getElementById("timer-toggle-btn");
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (toggleBtn) toggleBtn.innerText = "▶️ Start Focus Timer";
        window.showToast("Timer paused", "info");
    } else {
        isTimerRunning = true;
        if (toggleBtn) toggleBtn.innerText = "⏸️ Pause Timer";
        window.showToast("Focus session started! Stay in flow.", "success");

        timerInterval = setInterval(() => {
            if (timerSecondsLeft > 0) {
                timerSecondsLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                if (toggleBtn) toggleBtn.innerText = "▶️ Start Next Cycle";
                window.showToast("🎉 Great job! Study session complete. Take a break!", "success");
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    const config = moodTimers[currentMood] || moodTimers.Neutral;
    timerTotalSeconds = config.work * 60;
    timerSecondsLeft = timerTotalSeconds;
    updateTimerDisplay();
    const toggleBtn = document.getElementById("timer-toggle-btn");
    if (toggleBtn) toggleBtn.innerText = "▶️ Start Focus Timer";
    window.showToast("Timer reset", "info");
}

// ==========================================
// FACE-API WEBCAM EMOTION DETECTION
// ==========================================
function mapExpressionsToMood(expressions) {
    if (!expressions) return "Neutral";
    const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
    const top = sorted[0][0];

    if (top === "happy") return "Happy";
    if (top === "sad") return "Sad";
    if (top === "angry" || top === "fearful" || top === "disgusted") return "Stressed";
    if (top === "surprised" || top === "neutral") return "Neutral";
    return "Neutral";
}

const moodEmojiMap = {
    Happy: "🙂",
    Calm: "😌",
    Tired: "😴",
    Stressed: "😫",
    Sad: "😔",
    Neutral: "😐"
};

async function loadModels() {
    if (!camStatus) return;
    camStatus.innerText = "Loading AI Vision models... (may take 2-4 seconds)";
    const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/models/";
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        modelLoaded = true;
        camStatus.innerText = "AI Models loaded. Ready to start camera.";
    } catch (e) {
        console.error("Failed to load face-api models:", e);
        camStatus.innerText = "Could not load camera vision models. You can still use manual selection.";
    }
}

async function startCamera() {
    if (typeof faceapi === "undefined") {
        window.showToast("Vision library loading... Please wait a moment.", "warning");
        return;
    }

    if (!modelLoaded) {
        await loadModels();
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
        });
        video.srcObject = stream;

        video.addEventListener("loadedmetadata", () => {
            const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
            overlay.width = displaySize.width;
            overlay.height = displaySize.height;
        });

        if (startCamBtn) startCamBtn.style.display = "none";
        if (stopCamBtn) stopCamBtn.style.display = "inline-block";
        if (camStatus) camStatus.innerText = "Camera active — detecting emotion...";

        detectInterval = setInterval(async () => {
            if (!video || video.paused || video.ended) return;

            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
            const result = await faceapi.detectSingleFace(video, options).withFaceExpressions();
            const ctx = overlay.getContext("2d");
            ctx.clearRect(0, 0, overlay.width, overlay.height);

            if (result) {
                const box = result.detection.box;
                ctx.strokeStyle = "#00B4D8";
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                const sorted = Object.entries(result.expressions).sort((a, b) => b[1] - a[1]);
                const topExpr = sorted[0];

                ctx.fillStyle = "rgba(0,0,0,0.65)";
                ctx.fillRect(box.x, box.y - 28, 200, 26);
                ctx.fillStyle = "#ffffff";
                ctx.font = "14px Inter, sans-serif";
                ctx.fillText(`${topExpr[0]} (${(topExpr[1] * 100).toFixed(0)}%)`, box.x + 8, box.y - 10);

                const detectedMood = mapExpressionsToMood(result.expressions);

                // Debounce mood updates (at least 6 seconds apart unless changed)
                const now = Date.now();
                if (detectedMood !== lastDetectedMood && (now - lastDetectedTime > 5000)) {
                    lastDetectedMood = detectedMood;
                    lastDetectedTime = now;
                    const emoji = moodEmojiMap[detectedMood] || "🙂";
                    selectMood(detectedMood, emoji);
                    if (camStatus) camStatus.innerText = `Detected Expression: ${topExpr[0]} → Mood: ${detectedMood}`;
                }
            } else {
                if (camStatus) camStatus.innerText = "Face not detected — please look at the camera.";
            }
        }, 800);

    } catch (err) {
        console.error("Camera access error:", err);
        if (camStatus) camStatus.innerText = "Camera permission denied or camera not available.";
        if (startCamBtn) startCamBtn.style.display = "inline-block";
        if (stopCamBtn) stopCamBtn.style.display = "none";
    }
}

function stopCamera() {
    if (detectInterval) {
        clearInterval(detectInterval);
        detectInterval = null;
    }
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
    if (video) video.srcObject = null;
    if (camStatus) camStatus.innerText = "Camera stopped";
    if (startCamBtn) startCamBtn.style.display = "inline-block";
    if (stopCamBtn) stopCamBtn.style.display = "none";
    if (overlay) {
        const ctx = overlay.getContext("2d");
        ctx && ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
}

// Global button hooks
if (startCamBtn) startCamBtn.addEventListener("click", startCamera);
if (stopCamBtn) stopCamBtn.addEventListener("click", stopCamera);

const timerToggleBtn = document.getElementById("timer-toggle-btn");
const timerResetBtn = document.getElementById("timer-reset-btn");
if (timerToggleBtn) timerToggleBtn.addEventListener("click", toggleTimer);
if (timerResetBtn) timerResetBtn.addEventListener("click", resetTimer);

// Make selectMood available globally
window.selectMood = selectMood;

// Setup FaceAPI library lazy load
(function initFaceApi() {
    if (typeof faceapi === "undefined") {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
        s.onload = () => {
            console.log("face-api library loaded successfully");
        };
        s.onerror = () => {
            console.warn("Could not load face-api from CDN");
        };
        document.head.appendChild(s);
    }
})();

// Page init
document.addEventListener("DOMContentLoaded", () => {
    drawGraph("Neutral");
    updateHistory();
    updateTimerDisplay();
});