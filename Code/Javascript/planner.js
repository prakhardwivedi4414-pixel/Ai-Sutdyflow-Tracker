// =============================
// CALL BACKEND AI
// =============================
async function generatePlanBackend(subjects, hours) {
    try {
        const response = await fetch("http://localhost:5000/api/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjects, hours })
        });

        const data = await response.json();
        return data.output;
    } catch (err) {
        console.error("Backend error:", err);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    // ====================================
    // ADD SUBJECT + DEADLINE
    // ====================================
    document.getElementById("add-deadline-btn").addEventListener("click", () => {
        const subject = document.getElementById("subject-input").value.trim();
        const date = document.getElementById("date-input").value;
        const list = document.getElementById("deadline-list");

        if (!subject || !date) {
            alert("Please enter both subject and deadline!");
            return;
        }

        const li = document.createElement("li");
        li.innerHTML = `
            <span class="sub-text">${subject} — ${date}</span>
            <button class="remove-btn">❌</button>
        `;

        li.querySelector(".remove-btn").addEventListener("click", () => li.remove());
        list.appendChild(li);

        document.getElementById("subject-input").value = "";
        document.getElementById("date-input").value = "";
    });

    // ====================================
    // GENERATE PLAN (BACKEND)
    // ====================================
    document.getElementById("gen-plan").addEventListener("click", async () => {
        const listItems = document.querySelectorAll("#deadline-list li");
        let subjects = [];

        listItems.forEach(li => {
            const text = li.querySelector(".sub-text").innerText;
            const [subject, date] = text.split(" — ");
            subjects.push({ subject, deadline: date });
        });

        if (subjects.length === 0) {
            alert("Add at least one subject.");
            return;
        }

        const hours = document.getElementById("hours").value;
        const output = document.getElementById("plan-output");
        const downloadBtn = document.getElementById("download-btn");

        output.innerText = "⏳ Generating your study plan using AI...";

        // Call backend
        const plan = await generatePlanBackend(subjects, hours);

        if (!plan) {
            output.innerText = "⚠ Api is not Fetching...Server Error";
            return;
        }

        output.innerText = plan;
        window.generatedPlan = plan;
        downloadBtn.style.display = "block";
    });

    // ====================================
    // DOWNLOAD PLAN
    // ====================================
    document.getElementById("download-btn").addEventListener("click", () => {
        const text = window.generatedPlan;
        if (!text) return alert("Generate a plan first!");

        const choice = prompt("Download as: PDF or DOC (type: pdf / doc)");
        if (!choice) return;

        if (choice.toLowerCase() === "pdf") {
            downloadPDF(text);
        } else if (choice.toLowerCase() === "doc") {
            downloadDOC(text);
        } else {
            alert("Invalid choice! Type pdf or doc");
        }
    });

});

// ==========================================
// PDF Download
// ==========================================
function downloadPDF(text) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(text, 180);
    pdf.text(lines, 10, 10);
    pdf.save("Study-Plan.pdf");
}

// ==========================================
// DOC Download
// ==========================================
function downloadDOC(text) {
    const blob = new Blob([text], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Study-Plan.doc";
    link.click();
}
