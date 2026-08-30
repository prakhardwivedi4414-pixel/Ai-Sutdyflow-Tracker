// AI StudyFlow - Mock Exam & Quiz Logic (quiz.js)

let activeQuiz = [];
let userAnswers = {}; // questionIndex -> selectedOptionIndex
let currentQuestionIndex = 0;
let examSecondsRemaining = 600;
let examTimerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("quiz-topic");
    const diffSelect = document.getElementById("quiz-difficulty");
    const countSelect = document.getElementById("quiz-count");
    const notesInput = document.getElementById("quiz-custom-notes");
    const toggleNotesBtn = document.getElementById("toggle-quiz-notes");
    const startBtn = document.getElementById("start-exam-btn");

    const setupCard = document.getElementById("quiz-setup-card");
    const runnerArea = document.getElementById("exam-runner");
    const resultsArea = document.getElementById("exam-results");

    const prevQBtn = document.getElementById("prev-q-btn");
    const nextQBtn = document.getElementById("next-q-btn");
    const submitExamBtn = document.getElementById("submit-exam-btn");
    const hintToggleBtn = document.getElementById("hint-toggle-btn");
    const retakeBtn = document.getElementById("retake-quiz-btn");
    const newQuizBtn = document.getElementById("new-quiz-btn");

    // Toggle custom notes input
    if (toggleNotesBtn && notesInput) {
        toggleNotesBtn.addEventListener("click", () => {
            if (notesInput.style.display === "none") {
                notesInput.style.display = "block";
                toggleNotesBtn.innerText = "- Hide Custom Notes";
            } else {
                notesInput.style.display = "none";
                toggleNotesBtn.innerText = "+ Paste Custom Syllabus / Lecture Notes (Optional)";
            }
        });
    }

    // ==========================================
    // GENERATE & START EXAM
    // ==========================================
    async function startExam() {
        const topic = topicInput.value.trim();
        const notes = notesInput.value.trim();
        const difficulty = diffSelect ? diffSelect.value : "AP / College Level";
        const count = countSelect ? parseInt(countSelect.value) || 5 : 5;

        if (!topic && !notes) {
            window.showToast("Please enter an exam topic or paste notes!", "warning");
            topicInput.focus();
            return;
        }

        startBtn.disabled = true;
        startBtn.innerHTML = `<span>⏳ Formulating University Exam Questions...</span>`;

        try {
            const result = await window.apiFetch("quiz", {
                topic: topic || "General Academic Exam",
                notes: notes,
                difficulty: difficulty,
                count: count
            });

            if (Array.isArray(result) && result.length > 0) {
                activeQuiz = result;
                userAnswers = {};
                currentQuestionIndex = 0;

                // Setup timer based on question count (2 minutes per question)
                examSecondsRemaining = activeQuiz.length * 120;

                setupCard.style.display = "none";
                resultsArea.style.display = "none";
                runnerArea.style.display = "block";

                const titleDisplay = document.getElementById("exam-title-display");
                const diffBadge = document.getElementById("exam-diff-badge");
                if (titleDisplay) titleDisplay.innerText = topic || "Custom Mock Exam";
                if (diffBadge) diffBadge.innerText = difficulty;

                renderQuestionNav();
                renderCurrentQuestion();
                startExamTimer();

                window.showToast(`Exam started! ${activeQuiz.length} questions loaded.`, "success");
                runnerArea.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                throw new Error("Invalid quiz data format");
            }
        } catch (err) {
            console.error("Quiz generation error:", err);
            window.showToast("Failed to generate exam. Loading sample exam deck.", "warning");
            loadStarterQuiz();
        } finally {
            startBtn.disabled = false;
            startBtn.innerHTML = `🚀 Generate & Start Mock Exam`;
        }
    }

    if (startBtn) {
        startBtn.addEventListener("click", startExam);
    }

    // ==========================================
    // QUESTION RENDERING
    // ==========================================
    function renderQuestionNav() {
        const navContainer = document.getElementById("question-nav-chips");
        if (!navContainer) return;
        navContainer.innerHTML = "";

        activeQuiz.forEach((q, idx) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = `q-chip ${idx === currentQuestionIndex ? "active" : ""} ${userAnswers[idx] !== undefined ? "answered" : ""}`;
            chip.innerText = `Q${idx + 1}`;
            chip.addEventListener("click", () => {
                currentQuestionIndex = idx;
                renderQuestionNav();
                renderCurrentQuestion();
            });
            navContainer.appendChild(chip);
        });
    }

    function renderCurrentQuestion() {
        if (!activeQuiz || activeQuiz.length === 0) return;

        const q = activeQuiz[currentQuestionIndex];
        const qBadge = document.getElementById("q-number-badge");
        const qText = document.getElementById("q-text");
        const optionsGrid = document.getElementById("options-grid");
        const hintText = document.getElementById("hint-text");

        if (qBadge) qBadge.innerText = `Question ${currentQuestionIndex + 1} of ${activeQuiz.length}`;
        if (qText) qText.innerText = q.question;

        // Hint reset
        if (hintText) {
            hintText.innerText = q.hint || "Analyze the core governing principle stated in the question.";
            hintText.style.display = "none";
        }
        if (hintToggleBtn) hintToggleBtn.innerText = "💡 Need a Hint?";

        // Render 4 options
        if (optionsGrid) {
            optionsGrid.innerHTML = "";
            const letters = ["A", "B", "C", "D"];

            (q.options || []).forEach((opt, optIdx) => {
                const optBtn = document.createElement("button");
                optBtn.type = "button";
                const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                optBtn.className = `option-btn ${isSelected ? "selected" : ""}`;
                optBtn.innerHTML = `
                    <span class="option-letter">${letters[optIdx]}</span>
                    <span class="option-text">${opt}</span>
                `;

                optBtn.addEventListener("click", () => {
                    userAnswers[currentQuestionIndex] = optIdx;
                    renderQuestionNav();
                    renderCurrentQuestion();
                });

                optionsGrid.appendChild(optBtn);
            });
        }

        // Navigation button states
        if (prevQBtn) prevQBtn.disabled = currentQuestionIndex === 0;
        if (nextQBtn) nextQBtn.disabled = currentQuestionIndex === activeQuiz.length - 1;
    }

    // Hint toggle
    if (hintToggleBtn) {
        hintToggleBtn.addEventListener("click", () => {
            const hintText = document.getElementById("hint-text");
            if (!hintText) return;
            if (hintText.style.display === "none") {
                hintText.style.display = "block";
                hintToggleBtn.innerText = "💡 Hide Hint";
            } else {
                hintText.style.display = "none";
                hintToggleBtn.innerText = "💡 Need a Hint?";
            }
        });
    }

    // Navigation buttons
    if (prevQBtn) {
        prevQBtn.addEventListener("click", () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuestionNav();
                renderCurrentQuestion();
            }
        });
    }

    if (nextQBtn) {
        nextQBtn.addEventListener("click", () => {
            if (currentQuestionIndex < activeQuiz.length - 1) {
                currentQuestionIndex++;
                renderQuestionNav();
                renderCurrentQuestion();
            }
        });
    }

    // ==========================================
    // EXAM TIMER
    // ==========================================
    function startExamTimer() {
        clearInterval(examTimerInterval);
        updateTimerDisplay();

        examTimerInterval = setInterval(() => {
            if (examSecondsRemaining > 0) {
                examSecondsRemaining--;
                updateTimerDisplay();
            } else {
                clearInterval(examTimerInterval);
                window.showToast("⏰ Time is up! Submitting exam...", "warning");
                submitExam();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const timerEl = document.getElementById("exam-timer");
        if (!timerEl) return;
        const mins = Math.floor(examSecondsRemaining / 60);
        const secs = examSecondsRemaining % 60;
        timerEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (examSecondsRemaining < 120) {
            timerEl.classList.add("timer-urgent");
        } else {
            timerEl.classList.remove("timer-urgent");
        }
    }

    // ==========================================
    // SUBMIT & REVIEW EXAM
    // ==========================================
    function submitExam() {
        clearInterval(examTimerInterval);

        const total = activeQuiz.length;
        let correctCount = 0;

        activeQuiz.forEach((q, idx) => {
            if (userAnswers[idx] === q.answerIndex) {
                correctCount++;
            }
        });

        const pct = Math.round((correctCount / total) * 100);

        runnerArea.style.display = "none";
        resultsArea.style.display = "block";

        const scorePct = document.getElementById("score-pct-text");
        const scoreFraction = document.getElementById("score-fraction-text");
        const verdictEl = document.getElementById("score-verdict");
        const feedbackEl = document.getElementById("score-feedback");
        const circleEl = document.getElementById("score-badge-circle");

        if (scorePct) scorePct.innerText = `${pct}%`;
        if (scoreFraction) scoreFraction.innerText = `${correctCount}/${total}`;

        if (pct >= 85) {
            if (verdictEl) verdictEl.innerText = "🏆 Outstanding Mastery!";
            if (feedbackEl) feedbackEl.innerText = "Exceptional conceptual depth and analytical accuracy. You are ready for high-stakes exams!";
            if (circleEl) circleEl.className = "score-circle score-high";
        } else if (pct >= 60) {
            if (verdictEl) verdictEl.innerText = "👍 Solid Conceptual Grasp";
            if (feedbackEl) feedbackEl.innerText = "Good performance! Review the questions you missed below to bridge remaining knowledge gaps.";
            if (circleEl) circleEl.className = "score-circle score-med";
        } else {
            if (verdictEl) verdictEl.innerText = "📚 Target Revision Needed";
            if (feedbackEl) feedbackEl.innerText = "Focus on the foundational mechanisms and equations detailed in the answer breakdowns below.";
            if (circleEl) circleEl.className = "score-circle score-low";
        }

        renderReviewList();
        resultsArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (submitExamBtn) {
        submitExamBtn.addEventListener("click", () => {
            const answeredCount = Object.keys(userAnswers).length;
            const total = activeQuiz.length;
            if (answeredCount < total) {
                if (!confirm(`You have answered ${answeredCount} of ${total} questions. Are you sure you want to submit?`)) {
                    return;
                }
            }
            submitExam();
        });
    }

    function renderReviewList() {
        const reviewList = document.getElementById("review-list");
        if (!reviewList) return;
        reviewList.innerHTML = "";

        const letters = ["A", "B", "C", "D"];

        activeQuiz.forEach((q, idx) => {
            const userChoice = userAnswers[idx];
            const isCorrect = userChoice === q.answerIndex;

            const reviewCard = document.createElement("div");
            reviewCard.className = `review-item-card ${isCorrect ? "correct-card" : "wrong-card"}`;

            const userChoiceText = userChoice !== undefined ? `${letters[userChoice]}: ${q.options[userChoice]}` : "None Selected";
            const correctChoiceText = `${letters[q.answerIndex]}: ${q.options[q.answerIndex]}`;

            reviewCard.innerHTML = `
                <div class="review-card-header">
                    <span class="review-status-badge ${isCorrect ? "status-correct" : "status-wrong"}">
                        ${isCorrect ? "✅ Correct" : "❌ Incorrect"}
                    </span>
                    <span class="review-q-num">Question ${idx + 1}</span>
                </div>
                <h4 class="review-q-text">${q.question}</h4>
                <div class="review-answers-grid">
                    <div class="review-choice-box user-choice ${isCorrect ? "choice-right" : "choice-wrong"}">
                        <span class="choice-label">Your Answer:</span>
                        <p>${userChoiceText}</p>
                    </div>
                    ${!isCorrect ? `
                    <div class="review-choice-box correct-choice">
                        <span class="choice-label">Correct Answer:</span>
                        <p>${correctChoiceText}</p>
                    </div>` : ""}
                </div>
                <div class="review-explanation-box">
                    <strong>💡 Concept Explanation:</strong>
                    <p>${q.explanation || "No explanation provided."}</p>
                </div>
            `;

            reviewList.appendChild(reviewCard);
        });
    }

    // Retake Exam
    if (retakeBtn) {
        retakeBtn.addEventListener("click", () => {
            userAnswers = {};
            currentQuestionIndex = 0;
            examSecondsRemaining = activeQuiz.length * 120;
            resultsArea.style.display = "none";
            runnerArea.style.display = "block";
            renderQuestionNav();
            renderCurrentQuestion();
            startExamTimer();
            runnerArea.scrollIntoView({ behavior: "smooth" });
        });
    }

    // New Subject
    if (newQuizBtn) {
        newQuizBtn.addEventListener("click", () => {
            resultsArea.style.display = "none";
            runnerArea.style.display = "none";
            setupCard.style.display = "block";
            setupCard.scrollIntoView({ behavior: "smooth" });
        });
    }
});

// Preset selection
function setQuizPreset(topicName) {
    const topicInput = document.getElementById("quiz-topic");
    if (topicInput) {
        topicInput.value = topicName;
        window.showToast(`Selected exam preset: ${topicName}`, "info");
    }
}

// Starter Quiz for preview
function loadStarterQuiz() {
    activeQuiz = [
        {
            id: 1,
            question: "In relational databases, which ACID property guarantees that all database transactions will either completely execute or rollback entirely with no partial state?",
            options: [
                "Atomicity",
                "Consistency",
                "Isolation",
                "Durability"
            ],
            answerIndex: 0,
            explanation: "Atomicity ensures 'all-or-nothing' execution. If any operation within a transaction fails, the entire transaction is rolled back.",
            hint: "Think about the 'A' in ACID."
        },
        {
            id: 2,
            question: "What is the primary role of Virtual Memory in modern operating systems?",
            options: [
                "To increase physical GPU clock speeds",
                "To provide an illusion of contiguous large memory space and protect processes from interfering with each other",
                "To eliminate CPU cache misses completely",
                "To bypass RAM and write directly to magnetic tape"
            ],
            answerIndex: 1,
            explanation: "Virtual memory maps virtual addresses to physical pages, enabling memory protection, process isolation, and paging to disk.",
            hint: "Focus on process isolation and memory mapping."
        },
        {
            id: 3,
            question: "Which data structure is typically used to implement Breadth-First Search (BFS) on a graph?",
            options: [
                "LIFO Stack",
                "FIFO Queue",
                "Max Heap",
                "Disjoint Set Union"
            ],
            answerIndex: 1,
            explanation: "BFS explores vertices level by level in First-In-First-Out order, making a FIFO Queue the fundamental data structure.",
            hint: "Level-by-level exploration requires FIFO processing."
        }
    ];

    userAnswers = {};
    currentQuestionIndex = 0;
    examSecondsRemaining = 360;

    const setupCard = document.getElementById("quiz-setup-card");
    const runnerArea = document.getElementById("exam-runner");
    const resultsArea = document.getElementById("exam-results");

    if (setupCard) setupCard.style.display = "none";
    if (resultsArea) resultsArea.style.display = "none";
    if (runnerArea) runnerArea.style.display = "block";

    const titleDisplay = document.getElementById("exam-title-display");
    if (titleDisplay) titleDisplay.innerText = "Computer Science Fundamentals Exam";

    const navContainer = document.getElementById("question-nav-chips");
    if (navContainer) {
        navContainer.innerHTML = "";
        activeQuiz.forEach((q, idx) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = `q-chip ${idx === 0 ? "active" : ""}`;
            chip.innerText = `Q${idx + 1}`;
            navContainer.appendChild(chip);
        });
    }

    const qBadge = document.getElementById("q-number-badge");
    const qText = document.getElementById("q-text");
    const optionsGrid = document.getElementById("options-grid");
    const letters = ["A", "B", "C", "D"];

    if (qBadge) qBadge.innerText = `Question 1 of ${activeQuiz.length}`;
    if (qText) qText.innerText = activeQuiz[0].question;

    if (optionsGrid) {
        optionsGrid.innerHTML = "";
        activeQuiz[0].options.forEach((opt, optIdx) => {
            const optBtn = document.createElement("button");
            optBtn.type = "button";
            optBtn.className = "option-btn";
            optBtn.innerHTML = `<span class="option-letter">${letters[optIdx]}</span> <span class="option-text">${opt}</span>`;
            optionsGrid.appendChild(optBtn);
        });
    }
}

window.setQuizPreset = setQuizPreset;
