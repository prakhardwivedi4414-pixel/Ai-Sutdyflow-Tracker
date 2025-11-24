const API_KEY = "AIzaSyDX9sOPzCn8RIE2Fr126rjwFF-s1wDCjEg";

async function geminiRequest(prompt) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// STUDY PLANNER
async function generatePlan() {
  const input = document.getElementById("plan-input").value;
  document.getElementById("plan-output").innerText = "Generating plan...";
  
  const prompt = `Create a detailed, clear study plan for: ${input}`;
  const result = await geminiRequest(prompt);

  document.getElementById("plan-output").innerText = result;
}

// NOTE EXPLAINER
async function explainNotes() {
  const input = document.getElementById("note-input").value;
  document.getElementById("note-output").innerText = "Explaining notes...";

  const prompt = `Explain these notes in simple language with examples:\n${input}`;
  const result = await geminiRequest(prompt);

  document.getElementById("note-output").innerText = result;
}

// MOOD COACH
async function moodCoach(mood) {
  document.getElementById("mood-output").innerText = "Analysing mood...";

  const prompt = `Give study suggestions for someone feeling ${mood}.`;
  const result = await geminiRequest(prompt);

  document.getElementById("mood-output").innerText = result;
}

// IMPORTANT – Attach functions globally
window.generatePlan = generatePlan;
window.explainNotes = explainNotes;
window.moodCoach = moodCoach;
