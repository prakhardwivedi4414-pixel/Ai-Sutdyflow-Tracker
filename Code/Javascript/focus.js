// AI StudyFlow - Focus Hub & Ambient Sound Synthesizer (focus.js)

// ==========================================
// 1. TIMER STATE & LOGIC
// ==========================================
let focusWorkMins = 25;
let focusBreakMins = 5;
let isBreakPhase = false;
let timerSecondsLeft = 25 * 60;
let timerTotalSeconds = 25 * 60;
let isTimerActive = false;
let timerInterval = null;
let completedPomodoros = parseInt(localStorage.getItem("completedPomsToday") || "2");

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-focus-btn");
    const resetBtn = document.getElementById("reset-focus-btn");
    const skipBtn = document.getElementById("skip-focus-btn");
    const masterVolSlider = document.getElementById("master-volume");
    const addGoalBtn = document.getElementById("add-goal-btn");
    const newGoalInput = document.getElementById("new-goal-input");

    updateTimerDisplay();
    renderSessionDots();
    renderGoals();

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            if (isTimerActive) {
                pauseTimer();
            } else {
                startTimer();
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", resetTimer);
    }

    if (skipBtn) {
        skipBtn.addEventListener("click", () => {
            switchPhase(!isBreakPhase);
        });
    }

    if (masterVolSlider) {
        masterVolSlider.addEventListener("input", (e) => {
            setMasterVolume(parseFloat(e.target.value));
        });
    }

    if (addGoalBtn && newGoalInput) {
        addGoalBtn.addEventListener("click", () => addGoal());
        newGoalInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") addGoal();
        });
    }
});

function setTimerMode(workMins, breakMins, label) {
    pauseTimer();
    focusWorkMins = workMins;
    focusBreakMins = breakMins;
    isBreakPhase = false;
    timerTotalSeconds = workMins * 60;
    timerSecondsLeft = timerTotalSeconds;

    document.querySelectorAll(".mode-pill").forEach(btn => {
        if (btn.innerText.includes(`${workMins}m`)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const stateTag = document.getElementById("timer-state-label");
    if (stateTag) stateTag.innerText = "FOCUS SESSION";

    updateTimerDisplay();
    window.showToast(`Set timer to ${label}`, "info");
}

function startTimer() {
    isTimerActive = true;
    const toggleBtn = document.getElementById("toggle-focus-btn");
    if (toggleBtn) toggleBtn.innerHTML = `⏸️ Pause Focus`;

    // Ensure audio context is ready on user gesture
    getAudioContext();

    timerInterval = setInterval(() => {
        if (timerSecondsLeft > 0) {
            timerSecondsLeft--;
            updateTimerDisplay();
        } else {
            // Phase complete
            playCompletionBell();
            if (!isBreakPhase) {
                completedPomodoros++;
                localStorage.setItem("completedPomsToday", completedPomodoros);
                renderSessionDots();
                window.recordStudyActivity();
                window.showToast("🎉 Great focus session! Time for a short break.", "success");
                switchPhase(true);
            } else {
                window.showToast("⚡ Break finished! Ready for next focus block?", "info");
                switchPhase(false);
            }
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isTimerActive = false;
    const toggleBtn = document.getElementById("toggle-focus-btn");
    if (toggleBtn) toggleBtn.innerHTML = `▶️ Start Focus`;
}

function resetTimer() {
    pauseTimer();
    timerTotalSeconds = (isBreakPhase ? focusBreakMins : focusWorkMins) * 60;
    timerSecondsLeft = timerTotalSeconds;
    updateTimerDisplay();
    window.showToast("Timer reset", "info");
}

function switchPhase(toBreak) {
    pauseTimer();
    isBreakPhase = toBreak;
    timerTotalSeconds = (isBreakPhase ? focusBreakMins : focusWorkMins) * 60;
    timerSecondsLeft = timerTotalSeconds;

    const stateTag = document.getElementById("timer-state-label");
    if (stateTag) {
        stateTag.innerText = isBreakPhase ? "🌿 REFRESH BREAK" : "FOCUS SESSION";
        stateTag.style.color = isBreakPhase ? "#059669" : "#0284c7";
    }

    updateTimerDisplay();
}

function updateTimerDisplay() {
    const clock = document.getElementById("focus-clock");
    const fill = document.getElementById("timer-progress-fill");

    const mins = Math.floor(timerSecondsLeft / 60);
    const secs = timerSecondsLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (clock) clock.innerText = formatted;

    if (fill && timerTotalSeconds > 0) {
        const pct = ((timerTotalSeconds - timerSecondsLeft) / timerTotalSeconds) * 100;
        fill.style.width = `${pct}%`;
    }
}

function renderSessionDots() {
    const container = document.getElementById("session-dots");
    if (!container) return;
    container.innerHTML = "";

    const totalToShow = Math.max(4, completedPomodoros + 1);
    for (let i = 0; i < totalToShow; i++) {
        const span = document.createElement("span");
        if (i < completedPomodoros) {
            span.className = "dot-completed";
            span.innerText = "🍅";
        } else {
            span.className = "dot-empty";
            span.innerText = "⭕";
        }
        container.appendChild(span);
    }
}

// ==========================================
// 2. PROCEDURAL WEB AUDIO AMBIENT SYNTHESIZER
// ==========================================
let audioCtx = null;
let masterGain = null;
const activeSoundNodes = {}; // soundName -> { gainNode, sourceNode, etc }

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

function setMasterVolume(vol) {
    if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
    }
}

function toggleSound(soundType) {
    const ctx = getAudioContext();
    const channelCard = document.querySelector(`.sound-channel[data-sound="${soundType}"]`);
    const btn = channelCard ? channelCard.querySelector(".sound-toggle-btn") : null;

    if (activeSoundNodes[soundType]) {
        // Stop sound
        stopSound(soundType);
        if (channelCard) channelCard.classList.remove("sound-active");
        if (btn) btn.innerText = "Play";
        window.showToast(`Stopped ${soundType} sound`, "info");
    } else {
        // Start sound
        playSound(soundType);
        if (channelCard) channelCard.classList.add("sound-active");
        if (btn) btn.innerText = "Pause";
        window.showToast(`Playing ${soundType} sound`, "success");
    }
}

function playSound(type) {
    const ctx = getAudioContext();

    switch (type) {
        case "rain": {
            // Rain: Pink/White noise through bandpass & lowpass filter with slow modulation
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;
            noiseNode.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(1000, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.4, ctx.currentTime);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            noiseNode.start();
            activeSoundNodes.rain = { node: noiseNode, gain: gain };
            break;
        }

        case "binaural": {
            // 40Hz Gamma Binaural Beat (200Hz Left / 240Hz Right)
            const oscL = ctx.createOscillator();
            const oscR = ctx.createOscillator();
            oscL.type = "sine";
            oscR.type = "sine";
            oscL.frequency.setValueAtTime(200, ctx.currentTime);
            oscR.frequency.setValueAtTime(240, ctx.currentTime);

            const merger = ctx.createChannelMerger(2);
            oscL.connect(merger, 0, 0);
            oscR.connect(merger, 0, 1);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.25, ctx.currentTime);

            merger.connect(gain);
            gain.connect(masterGain);

            oscL.start();
            oscR.start();
            activeSoundNodes.binaural = { oscL, oscR, gain, node: oscL };
            break;
        }

        case "white": {
            // Brown noise: Smooth deep low-passed noise
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // Gain compensation
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;
            noiseNode.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(450, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.4, ctx.currentTime);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            noiseNode.start();
            activeSoundNodes.white = { node: noiseNode, gain: gain };
            break;
        }

        case "cafe": {
            // Cafe: Filtered warm resonance
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.15;
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;
            noiseNode.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(650, ctx.currentTime);
            filter.Q.setValueAtTime(1.5, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.35, ctx.currentTime);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            noiseNode.start();
            activeSoundNodes.cafe = { node: noiseNode, gain: gain };
            break;
        }
    }
}

function stopSound(type) {
    const s = activeSoundNodes[type];
    if (s) {
        try {
            if (s.node && s.node.stop) s.node.stop();
            if (s.oscR && s.oscR.stop) s.oscR.stop();
        } catch (e) {}
        delete activeSoundNodes[type];
    }
}

function playCompletionBell() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
}

// ==========================================
// 3. SESSION GOALS SCRATCHPAD
// ==========================================
function getGoals() {
    try {
        return JSON.parse(localStorage.getItem("focusGoalsList") || "[]");
    } catch (e) {
        return [];
    }
}

function saveGoals(list) {
    localStorage.setItem("focusGoalsList", JSON.stringify(list));
    renderGoals();
}

function addGoal() {
    const input = document.getElementById("new-goal-input");
    const text = input ? input.value.trim() : "";
    if (!text) return;

    const list = getGoals();
    list.push({ id: Date.now(), text: text, done: false });
    saveGoals(list);
    input.value = "";
    input.focus();
    window.showToast("Goal added!", "success");
}

function toggleGoal(id) {
    const list = getGoals();
    const g = list.find(item => item.id === id);
    if (g) {
        g.done = !g.done;
        saveGoals(list);
    }
}

function removeGoal(id) {
    const list = getGoals().filter(item => item.id !== id);
    saveGoals(list);
}

function renderGoals() {
    const listEl = document.getElementById("goals-list");
    if (!listEl) return;
    const goals = getGoals();

    if (goals.length === 0) {
        listEl.innerHTML = `<li class="empty-goals-notice">No focus goals added for this session yet. Add a target above!</li>`;
        return;
    }

    listEl.innerHTML = "";
    goals.forEach(g => {
        const li = document.createElement("li");
        li.className = `goal-item ${g.done ? "goal-done" : ""}`;
        li.innerHTML = `
            <label class="goal-label">
                <input type="checkbox" ${g.done ? "checked" : ""} />
                <span>${g.text}</span>
            </label>
            <button class="remove-btn" title="Delete goal">❌</button>
        `;

        li.querySelector("input").addEventListener("change", () => toggleGoal(g.id));
        li.querySelector(".remove-btn").addEventListener("click", () => removeGoal(g.id));
        listEl.appendChild(li);
    });
}

// Add default sample goals if empty
if (getGoals().length === 0) {
    saveGoals([
        { id: 1, text: "Read Chapter 4 & write Cornell summary", done: false },
        { id: 2, text: "Master 8 Flashcards on Binary Trees", done: false }
    ]);
}

window.setTimerMode = setTimerMode;
window.toggleSound = toggleSound;
