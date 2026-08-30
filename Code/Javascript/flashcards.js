// AI StudyFlow - Flashcards Logic (flashcards.js)

let activeDeck = [];
let currentIndex = 0;
let cardRatings = {}; // cardId/index -> rating ('again', 'hard', 'good', 'easy')
let isFlipped = false;

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("deck-topic");
    const countSelect = document.getElementById("card-count");
    const notesInput = document.getElementById("deck-notes");
    const toggleNotesBtn = document.getElementById("toggle-notes-btn");
    const generateBtn = document.getElementById("generate-deck-btn");
    const deckArea = document.getElementById("deck-area");
    const flashcard = document.getElementById("flashcard");
    const prevBtn = document.getElementById("prev-card-btn");
    const nextBtn = document.getElementById("next-card-btn");
    const flipBtn = document.getElementById("flip-card-btn");
    const exportAnkiBtn = document.getElementById("export-anki-btn");
    const shuffleBtn = document.getElementById("shuffle-deck-btn");

    // Toggle custom notes input
    if (toggleNotesBtn && notesInput) {
        toggleNotesBtn.addEventListener("click", () => {
            if (notesInput.style.display === "none") {
                notesInput.style.display = "block";
                toggleNotesBtn.innerText = "- Hide Custom Notes";
            } else {
                notesInput.style.display = "none";
                toggleNotesBtn.innerText = "+ Paste Custom Lecture Notes / Excerpt (Optional)";
            }
        });
    }

    // ==========================================
    // GENERATE FLASHCARD DECK
    // ==========================================
    async function generateDeck() {
        const topic = topicInput.value.trim();
        const notes = notesInput.value.trim();
        const count = countSelect ? parseInt(countSelect.value) || 8 : 8;

        if (!topic && !notes) {
            window.showToast("Please enter a topic or paste notes!", "warning");
            topicInput.focus();
            return;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span>⏳ Generating AI Flashcards...</span>`;

        try {
            const result = await window.apiFetch("flashcards", {
                topic: topic || "Core Academic Concepts",
                notes: notes,
                count: count
            });

            if (Array.isArray(result) && result.length > 0) {
                activeDeck = result;
                currentIndex = 0;
                cardRatings = {};
                isFlipped = false;

                const titleEl = document.getElementById("active-deck-title");
                if (titleEl) titleEl.innerText = topic || "Custom Notes Deck";

                deckArea.style.display = "block";
                renderCard();
                updateProgress();
                window.showToast(`Generated ${activeDeck.length} flashcards!`, "success");

                deckArea.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                throw new Error("No flashcards returned");
            }
        } catch (err) {
            console.error("Flashcard generation error:", err);
            window.showToast("Failed to generate deck. Using offline sample deck.", "warning");
            loadStarterDeck();
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `🚀 Generate Interactive Flashcard Deck`;
        }
    }

    if (generateBtn) {
        generateBtn.addEventListener("click", generateDeck);
    }

    if (topicInput) {
        topicInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") generateDeck();
        });
    }

    // ==========================================
    // CARD RENDERING & FLIP
    // ==========================================
    function renderCard() {
        if (!activeDeck || activeDeck.length === 0) return;

        const currentCard = activeDeck[currentIndex];
        const frontText = document.getElementById("card-front-text");
        const backText = document.getElementById("card-back-text");
        const tagBadge = document.getElementById("card-tag-badge");
        const counterLabel = document.getElementById("card-counter-label");

        if (frontText) frontText.innerText = currentCard.front || "No front text";
        if (backText) backText.innerText = currentCard.back || "No back text";
        if (tagBadge) tagBadge.innerText = currentCard.tag || "Concept";
        if (counterLabel) counterLabel.innerText = `Card ${currentIndex + 1} of ${activeDeck.length}`;

        // Reset flip state
        isFlipped = false;
        if (flashcard) flashcard.classList.remove("flipped");

        // Update button states
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === activeDeck.length - 1;
    }

    function toggleFlip() {
        isFlipped = !isFlipped;
        if (flashcard) flashcard.classList.toggle("flipped", isFlipped);
    }

    if (flashcard) {
        flashcard.addEventListener("click", toggleFlip);
    }

    if (flipBtn) {
        flipBtn.addEventListener("click", toggleFlip);
    }

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderCard();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentIndex < activeDeck.length - 1) {
                currentIndex++;
                renderCard();
            }
        });
    }

    // Shuffle Deck
    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", () => {
            if (activeDeck.length < 2) return;
            activeDeck.sort(() => Math.random() - 0.5);
            currentIndex = 0;
            renderCard();
            window.showToast("Deck shuffled!", "info");
        });
    }

    // Export Anki CSV
    if (exportAnkiBtn) {
        exportAnkiBtn.addEventListener("click", () => {
            if (!activeDeck || activeDeck.length === 0) return;

            let csvContent = "Front\tBack\tTag\n";
            activeDeck.forEach(c => {
                const frontClean = (c.front || "").replace(/\t/g, " ").replace(/\n/g, "<br>");
                const backClean = (c.back || "").replace(/\t/g, " ").replace(/\n/g, "<br>");
                const tagClean = c.tag || "StudyFlow";
                csvContent += `"${frontClean}"\t"${backClean}"\t"${tagClean}"\n`;
            });

            const blob = new Blob([csvContent], { type: "text/tab-separated-values;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Anki-Deck-${(topicInput.value || "StudyFlow").replace(/\s+/g, "_")}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.showToast("Exported Anki-compatible TSV file!", "success");
        });
    }

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
        // Only trigger if not focused on an input/textarea
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

        if (e.code === "Space") {
            e.preventDefault();
            toggleFlip();
        } else if (e.key === "ArrowLeft") {
            if (prevBtn && !prevBtn.disabled) prevBtn.click();
        } else if (e.key === "ArrowRight") {
            if (nextBtn && !nextBtn.disabled) nextBtn.click();
        } else if (e.key === "1") {
            rateCard("again");
        } else if (e.key === "2") {
            rateCard("hard");
        } else if (e.key === "3") {
            rateCard("good");
        } else if (e.key === "4") {
            rateCard("easy");
        }
    });

    // Auto-load starter deck for immediate preview
    loadStarterDeck();
});

// Preset selection
function setPreset(topicName) {
    const topicInput = document.getElementById("deck-topic");
    if (topicInput) {
        topicInput.value = topicName;
        window.showToast(`Selected preset: ${topicName}`, "info");
    }
}

// Spaced Repetition Rating
function rateCard(rating) {
    if (!activeDeck || activeDeck.length === 0) return;

    cardRatings[currentIndex] = rating;
    updateProgress();

    const ratingNames = { again: "Needs Review", hard: "Hard Recall", good: "Good Retention", easy: "Mastered!" };
    window.showToast(`Rated: ${ratingNames[rating]}`, rating === "again" ? "warning" : "success");

    // Auto-advance to next card if not at end
    if (currentIndex < activeDeck.length - 1) {
        setTimeout(() => {
            currentIndex++;
            const frontText = document.getElementById("card-front-text");
            const backText = document.getElementById("card-back-text");
            const tagBadge = document.getElementById("card-tag-badge");
            const counterLabel = document.getElementById("card-counter-label");
            const prevBtn = document.getElementById("prev-card-btn");
            const nextBtn = document.getElementById("next-card-btn");
            const flashcard = document.getElementById("flashcard");

            const currentCard = activeDeck[currentIndex];
            if (frontText) frontText.innerText = currentCard.front;
            if (backText) backText.innerText = currentCard.back;
            if (tagBadge) tagBadge.innerText = currentCard.tag;
            if (counterLabel) counterLabel.innerText = `Card ${currentIndex + 1} of ${activeDeck.length}`;

            isFlipped = false;
            if (flashcard) flashcard.classList.remove("flipped");

            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex === activeDeck.length - 1;
        }, 300);
    }
}

function updateProgress() {
    if (!activeDeck || activeDeck.length === 0) return;

    const total = activeDeck.length;
    let masteredCount = 0;

    for (let i = 0; i < total; i++) {
        const r = cardRatings[i];
        if (r === "good" || r === "easy") {
            masteredCount++;
        }
    }

    const pct = Math.round((masteredCount / total) * 100);
    const progressBar = document.getElementById("deck-progress-bar");
    const masteryLabel = document.getElementById("mastery-pct-label");

    if (progressBar) progressBar.style.width = `${pct}%`;
    if (masteryLabel) masteryLabel.innerText = `${pct}% Mastered (${masteredCount}/${total})`;
}

// Starter Deck for immediate rich preview
function loadStarterDeck() {
    activeDeck = [
        {
            front: "What is the time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black Tree)?",
            back: "O(log n) worst-case and average-case because the tree maintains a strict height balance factor of O(log n).",
            tag: "Algorithms"
        },
        {
            front: "What is the primary function of ATP Synthase in the inner mitochondrial membrane?",
            back: "It utilizes the electrochemical proton gradient across the inner membrane to synthesize ATP from ADP and inorganic phosphate.",
            tag: "Biology"
        },
        {
            front: "State the Fundamental Theorem of Calculus (Part 1).",
            back: "If f is continuous on [a, b], then the function g(x) = ∫[a to x] f(t)dt is continuous, differentiable, and g'(x) = f(x).",
            tag: "Calculus"
        },
        {
            front: "What is the Second Law of Thermodynamics regarding entropy?",
            back: "In any spontaneous cyclic or isolated process, the total entropy of the universe always increases (ΔS_universe ≥ 0).",
            tag: "Physics"
        }
    ];

    currentIndex = 0;
    cardRatings = {};
    const deckArea = document.getElementById("deck-area");
    if (deckArea) deckArea.style.display = "block";

    const frontText = document.getElementById("card-front-text");
    const backText = document.getElementById("card-back-text");
    const tagBadge = document.getElementById("card-tag-badge");
    const counterLabel = document.getElementById("card-counter-label");

    if (frontText) frontText.innerText = activeDeck[0].front;
    if (backText) backText.innerText = activeDeck[0].back;
    if (tagBadge) tagBadge.innerText = activeDeck[0].tag;
    if (counterLabel) counterLabel.innerText = `Card 1 of ${activeDeck.length}`;

    updateProgress();
}

window.setPreset = setPreset;
window.rateCard = rateCard;
