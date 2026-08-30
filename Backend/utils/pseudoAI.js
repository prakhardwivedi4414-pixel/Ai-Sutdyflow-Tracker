// Backend/utils/pseudoAI.js
// High quality structured fallbacks for all academic modules

export function generatePseudoPlan(rawSubjects, hours = 3) {
    let subjects = [];
    if (Array.isArray(rawSubjects)) {
        subjects = rawSubjects.map(item => {
            if (typeof item === "string") return { name: item, deadline: "Upcoming" };
            if (item && typeof item === "object") {
                return { name: item.subject || item.name || "Core Subject", deadline: item.deadline || "Upcoming" };
            }
            return { name: "General Study", deadline: "Upcoming" };
        });
    } else if (typeof rawSubjects === "string") {
        subjects = rawSubjects.split(",").map(s => ({ name: s.trim(), deadline: "Upcoming" }));
    }

    if (subjects.length === 0) {
        subjects = [{ name: "Core Syllabus", deadline: "Upcoming" }];
    }

    const totalDays = 14;
    let output = `# 🎯 14-Day Accelerated Academic Masterplan\n\n`;
    output += `**Daily Target:** ${hours} Hours / Day\n`;
    output += `**Enrolled Subjects:** ${subjects.map(s => `${s.name} (${s.deadline})`).join(" • ")}\n\n`;
    output += `---\n\n`;

    output += `### 📅 Daily Milestones & Task Breakdown\n\n`;

    for (let i = 1; i <= totalDays; i++) {
        const sub = subjects[(i - 1) % subjects.length];
        const phase = i <= 4 ? "Phase 1: Conceptual Foundation & Reading" : (i <= 10 ? "Phase 2: Intensive Problem Solving & Active Recall" : "Phase 3: Mock Testing & High-Yield Revision");
        
        output += `#### 🗓️ Day ${i} — **${sub.name}**\n`;
        output += `- **Focus Phase:** ${phase}\n`;
        output += `- **Target Duration:** ${hours} hours (Recommended: 3 × 50-minute focused blocks)\n`;
        output += `- **Key Task:** Deep dive into key chapters in ${sub.name}, formulate summary flashcards, and solve 10-15 targeted exercises.\n`;
        output += `- **💡 Pro Tip:** ${sampleTip(i)}\n\n`;
    }

    output += `---\n\n`;
    output += `### 🚀 Golden Principles for High Retention\n`;
    output += `1. **Active Recall:** Self-test before looking at textbook solutions.\n`;
    output += `2. **Spaced Intervals:** Review Day 1 and Day 3 notes on Day 7 to cement long-term memory.\n`;
    output += `3. **Cognitive Health:** Ensure 7-8 hours of sleep for synaptic consolidation.\n`;

    return output;
}

export function generatePseudoExplain(input = "", type = "explain") {
    const textSnippet = input.slice(0, 100);
    switch (type.toLowerCase()) {
        case "cornell":
            return `# 📝 Cornell Note-Taking Format\n\n` +
                `| 🔍 Cues & Keywords | 📖 Notes & Explanations |\n` +
                `| :--- | :--- |\n` +
                `| **Core Concept** | ${input.slice(0, 120)}... Represents the foundational mechanism and baseline assumption. |\n` +
                `| **Key Mechanism** | Step 1: Input ingestion and condition validation.<br>Step 2: Processing through fundamental equations.<br>Step 3: Output generation and stability check. |\n` +
                `| **Critical Rules** | Always verify initial boundary conditions before calculation. |\n` +
                `| **Exam Trap** | Confusing secondary variables with independent drivers. |\n\n` +
                `### 💡 Summary & Synthesis\n` +
                `This topic establishes the mathematical and conceptual groundwork for subsequent advanced modules. Master the core relationship first before deriving edge cases.`;

        case "cheatsheet":
            return `# ⚡ High-Yield Exam Cheat Sheet\n\n` +
                `### 📌 Core Definitions & Axioms\n` +
                `- **Primary Axiom:** ${input.slice(0, 100)}...\n` +
                `- **Scope & Domain:** Standard continuous/discrete space under baseline constraints.\n\n` +
                `### 📐 Key Formulas & Principles\n` +
                `- $\\text{Primary Equation}: \\Delta E = \\int F \\cdot dr$\n` +
                `- $\\text{Conservation Law}: \\sum \\text{Inputs} = \\sum \\text{Outputs} + \\text{Losses}$\n` +
                `- $\\text{Efficiency Index}: \\eta = \\frac{\\text{Useful Work}}{\\text{Total Energy}} \\times 100\\%$\n\n` +
                `### ⚠️ Top 3 Mistakes on Exams\n` +
                `1. Skipping unit conversions in the final step.\n` +
                `2. Neglecting sign conventions during vector operations.\n` +
                `3. Forgetting edge-case boundary conditions.`;

        case "solve":
            return `# 🔬 Step-by-Step Solution Breakdown\n\n` +
                `### 1. Problem Identification & Given Data\n` +
                `- **Input Context:** ${input.slice(0, 140)}...\n` +
                `- **Objective:** Derive the analytical result and state underlying assumptions.\n\n` +
                `### 2. Step-by-Step Derivation\n` +
                `- **Step 1:** State the governing equation and boundary limits.\n` +
                `- **Step 2:** Substitute known parameters into the primary relation.\n` +
                `- **Step 3:** Perform algebraic reduction and simplify terms.\n` +
                `- **Step 4:** Verify dimensional homogeneity and physical validity.\n\n` +
                `### 3. Final Conclusion\n` +
                `The result confirms steady-state equilibrium under the given conditions.`;

        case "simplify":
            return `### 💡 Simplified Core Concept (ELI5 Mode)\n\n` +
                `Imagine this concept like a simple real-world system:\n\n` +
                `1. **The Big Picture:** At its heart, ${input.slice(0, 100)}... is just about how one action triggers a predictable reaction.\n` +
                `2. **Plain English Breakdown:**\n` +
                `   - **The Engine:** What powers the process.\n` +
                `   - **The Pipeline:** How information or energy flows.\n` +
                `   - **The Output:** What you end up with at the end.\n\n` +
                `3. **Mental Model:** If you double the input while keeping resistance constant, the output doubles proportionally!`;

        case "summarize":
            return `### 📝 Executive Academic Summary\n\n` +
                `• **Primary Topic:** Synthesis of submitted lecture materials.\n` +
                `• **Pillar 1:** Foundational definitions and operational premises.\n` +
                `• **Pillar 2:** Analytical mechanisms and workflow diagrams.\n` +
                `• **Pillar 3:** Practical implications and exam-targeted checkpoints.\n\n` +
                `**Key Rule:** *"Master the mechanism first, refine specific edge cases second."*`;

        default:
            return `### 🧠 AI Comprehensive Explanation\n\n` +
                `**Overview:**\n` +
                `The notes you provided represent fundamental concepts in this subject.\n\n` +
                `**Key Points Explained:**\n` +
                `1. **Definition & Context:** Establishing what the principle covers and why it is critical.\n` +
                `2. **Step-by-Step Flow:** Tracing the progression from raw input parameters to final results.\n` +
                `3. **Exam Application:** How questions on this topic are typically structured on exams.\n\n` +
                `**Action Plan:** Review these points and test your retention using the Flashcards or Quiz tabs!`;
    }
}

export function generatePseudoFlashcards(topic = "General Subject", count = 6) {
    const cleanTopic = topic.trim() || "Core Concepts";
    return [
        {
            front: `What is the core definition and purpose of ${cleanTopic}?`,
            back: `It is the foundational system/principle that governs relationships and mechanisms within this academic domain.`,
            tag: "Definition"
        },
        {
            front: `What is the primary governing formula or rule in ${cleanTopic}?`,
            back: `The standard equation relating input parameters to output behavior under steady-state conditions.`,
            tag: "Formula"
        },
        {
            front: `What is the most common misconception or exam trap in ${cleanTopic}?`,
            back: `Assuming ideal conditions without verifying boundary limits or dimensional units.`,
            tag: "Exam Trap"
        },
        {
            front: `How does ${cleanTopic} apply in practical, real-world engineering or science?`,
            back: `It provides the predictive framework used to model stability, optimize performance, and prevent failure.`,
            tag: "Application"
        },
        {
            front: `What are the necessary preconditions required for ${cleanTopic} to hold true?`,
            back: `Linearity, continuity, and adherence to standard conservation principles within the closed system.`,
            tag: "Conditions"
        },
        {
            front: `What is the step-by-step procedure to solve a problem involving ${cleanTopic}?`,
            back: `1. Identify given variables 2. Select matching formula 3. Substitute values with units 4. Perform sanity check.`,
            tag: "Methodology"
        }
    ];
}

export function generatePseudoQuiz(topic = "General Subject") {
    const cleanTopic = topic.trim() || "Academic Subject";
    return [
        {
            id: 1,
            question: `What is the fundamental premise underlying ${cleanTopic}?`,
            options: [
                `Systems naturally seek equilibrium while conserving energy and mass`,
                `Outputs are always independent of initial boundary conditions`,
                `All variables operate exclusively in continuous logarithmic scales`,
                `Entropy decreases unconditionally in unconstrained environments`
            ],
            answerIndex: 0,
            explanation: `Conservation laws and equilibrium are the foundational pillars of physical and analytical systems in ${cleanTopic}.`,
            hint: `Think about fundamental conservation principles.`
        },
        {
            id: 2,
            question: `When applying ${cleanTopic} to standard problem solving, what is the critical first step?`,
            options: [
                `Multiply all values by a scalar constant`,
                `Define the system boundaries and verify known initial conditions`,
                `Assume steady-state without reading the problem statement`,
                `Convert all variables to arbitrary percentages`
            ],
            answerIndex: 1,
            explanation: `Proper problem definition and boundary condition verification prevent cascading calculation errors.`,
            hint: `Establishing reference coordinates and constraints is always required first.`
        },
        {
            id: 3,
            question: `Which of the following would cause a failure in the standard model of ${cleanTopic}?`,
            options: [
                `Operating within linear ranges`,
                `Exceeding boundary limits or violating conservation constraints`,
                `Maintaining constant ambient temperature`,
                `Using standard metric units`
            ],
            answerIndex: 1,
            explanation: `When boundary limits are breached, nonlinearities or secondary breakdown phenomena occur.`,
            hint: `Look for extreme or unconstrained conditions.`
        },
        {
            id: 4,
            question: `How does doubling the primary driving parameter typically affect the output in ${cleanTopic}?`,
            options: [
                `It doubles the proportional output under linear steady-state conditions`,
                `It reduces the output to zero instantly`,
                `It causes an immediate phase inversion regardless of resistance`,
                `It has zero measurable impact on the system`
            ],
            answerIndex: 0,
            explanation: `In standard linear models, response is directly proportional to the applied stimulus.`,
            hint: `Recall direct proportionality in first-order systems.`
        },
        {
            id: 5,
            question: `What is the primary advantage of active recall over passive reading in mastering ${cleanTopic}?`,
            options: [
                `It requires zero effort or cognitive focus`,
                `It strengthens neural pathways and dramatically improves exam retrieval speed`,
                `It eliminates the need to understand underlying theory`,
                `It guarantees 100% memorization in a single pass`
            ],
            answerIndex: 1,
            explanation: `Cognitive science proves that testing your memory actively consolidates neural memory traces much faster than re-reading.`,
            hint: `Think about testing yourself from memory.`
        }
    ];
}

function sampleTip(dayIndex) {
    const tips = [
        "Take a 5-minute break every 25 minutes (Pomodoro technique) to reset cognitive bandwidth.",
        "Revise yesterday's flashcard deck for 10 minutes before starting new chapters.",
        "Synthesize notes in your own words — teaching a concept reveals hidden gaps.",
        "Single-task with zero phone notifications; multitasking decreases retention by up to 40%.",
        "Solve 3 practice exam questions without looking at hints first.",
        "Hydrate and stretch; physical movement increases cerebral blood flow and alertness."
    ];
    return tips[(dayIndex - 1) % tips.length];
}
