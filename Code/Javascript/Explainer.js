const aura = document.getElementById("exp-aura");
const output = document.getElementById("output-card");
const historyList = document.getElementById("history-list");

/* Aura Pulse On Use */
function pulseAura() {
  aura.style.transition = "0.4s";
  aura.style.transform = "translateX(-50%) scale(1.15)";
  setTimeout(() => aura.style.transform = "translateX(-50%) scale(1)", 300);
}

/* Save history */
function saveHistory(text) {
  let list = JSON.parse(localStorage.getItem("expHistory") || "[]");
  list.unshift(text.slice(0, 80) + "...");
  if (list.length > 5) list.pop();
  localStorage.setItem("expHistory", JSON.stringify(list));
}

function updateHistory() {
  let list = JSON.parse(localStorage.getItem("expHistory") || "[]");
  historyList.innerHTML = list.length ? list.map(i => `<div>• ${i}</div>`).join("") : "None yet.";
}
updateHistory();

/* AI Handler */
async function runExplain(type) {

  let input = document.getElementById("note-input").value.trim();
  if (!input) {
    output.innerText = "Please paste your notes first.";
    return;
  }

  pulseAura();
  output.innerText = "Thinking…";
  setTimeout(() => {
    output.innerText = "API Error: Cannot reach server right now.";
}, 2000);


  const prompt = `
You are an AI study explainer.

Task: ${type}

User notes:
${input}

Return with:
• Clear structure  
• Easy language  
• Bullet points  
• Examples (if needed)
`;

  const result = await geminiRequest(prompt);

  output.innerText = result;
  saveHistory(input);
  updateHistory();
}




