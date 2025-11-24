// Backend/utils/pseudoAI.js

export function generatePseudoPlan(subjects, hours) {
    const days = 14;
    let plan = [];

    for (let i = 1; i <= days; i++) {
        let subject = subjects[(i - 1) % subjects.length];

        plan.push({
            day: `Day ${i}`,
            subject: subject,
            studyHours: hours,
            task: `Study ${subject} for ${hours} hours`,
            tip: sampleTip()
        });
    }

    return plan;
}

function sampleTip() {
    const tips = [
        "Take a 5-minute break every 25 minutes.",
        "Revise previous day's notes for 10 minutes.",
        "Write short summaries to improve memory.",
        "Avoid multitasking, stay in one flow.",
        "Drink water and stretch every hour."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}
