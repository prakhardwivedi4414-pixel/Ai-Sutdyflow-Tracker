// Mood Coach logic using shared geminiRequest() from app.js
async function moodCoach(mood) {
  const box = document.getElementById("mood-output");
  box.innerHTML = `Analyzing your mood (${mood})…`;

  const prompt = `
You are an empathetic AI study coach. The student feels ${mood}.
Provide:
• 1-line recommended study style.
• Ideal focus/break pattern.
• 3 actionable steps.
• 1 motivational line.
Make it compact and student-friendly.
  `;

  const result = await geminiRequest(prompt);
  box.innerText = result;
}

const aura = document.getElementById("mood-aura");
const graph = document.getElementById("graph-container");
const historyBox = document.getElementById("mood-history");

/* Mood color mapping */
const moodAuraColors = {
  Happy: "rgba(255,220,80,0.7)",
  Calm: "rgba(0,200,160,0.7)",
  Tired: "rgba(255,160,70,0.7)",
  Stressed: "rgba(255,80,80,0.7)",
  Sad: "rgba(140,120,255,0.7)",
  Neutral: "rgba(120,170,255,0.7)",
};

/* Mood graph values */
const moodGraphs = {
  Happy: { focus: 85, stress: 20, motivation: 95, calm: 60, fatigue: 15 },
  Calm: { focus: 75, stress: 25, motivation: 70, calm: 90, fatigue: 20 },
  Tired: { focus: 40, stress: 30, motivation: 50, calm: 55, fatigue: 80 },
  Stressed:{ focus: 50, stress: 90, motivation: 45, calm: 20, fatigue: 60 },
  Sad:{ focus: 45, stress: 50, motivation: 30, calm: 40, fatigue: 55 },
  Neutral:{ focus: 65, stress: 40, motivation: 60, calm: 50, fatigue: 45 }
};

function selectMood(mood, emoji) {
  applyAura(mood);
  drawGraph(mood);
  moodCoach(mood);
  saveHistory(emoji);
  updateHistory();
}

/* Aura effect */
function applyAura(mood) {
  aura.style.background = moodAuraColors[mood];
}

/* Mood graph animation */
function drawGraph(mood) {
  const data = moodGraphs[mood];
  graph.innerHTML = "";

  for (let key in data) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div>${key.toUpperCase()}</div>
      <div class="graph-bar">
        <div class="graph-bar-fill" style="width:${data[key]}%"></div>
      </div>`;
    graph.appendChild(wrapper);
  }
}

/* History */
function saveHistory(emoji) {
  let history = JSON.parse(localStorage.getItem("moodHistory") || "[]");
  history.unshift(emoji);
  if (history.length > 5) history.pop();
  localStorage.setItem("moodHistory", JSON.stringify(history));
}

function updateHistory() {
  let history = JSON.parse(localStorage.getItem("moodHistory") || "[]");
  historyBox.innerHTML = history.length ? history.join(" ") : "No moods yet.";
}
updateHistory();

/* Gemini AI response */
async function moodCoach(mood) {
  const box = document.getElementById("mood-output");
  box.innerHTML = `Analyzing ${mood}…`;

  const prompt = `
You are an empathetic study coach. The student feels ${mood}.
Provide:
• 1-line study style
• Focus/break pattern
• 3 actionable steps
• Suggested music
• Motivation line
`;

  const result = await geminiRequest(prompt);
  box.innerText = result;
}
// mood_cam.js
// Requires face-api.min.js (we load via CDN below before this script).
// This script: starts webcam, runs face-api expression detection, maps to mood, calls selectMood()

const video = document.getElementById("webcam");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-cam-btn");
const stopBtn = document.getElementById("stop-cam-btn");
const status = document.getElementById("cam-status");

let stream = null;
let detectInterval = null;
let modelLoaded = false;
let displaySize = { width: 0, height: 0 };

// Map face-api expression labels to your mood categories (customize as needed)
function mapExpressionsToMood(expressions) {
  // expressions: object with scores e.g. { happy:0.8, sad:0.02, ... }
  // We pick the top expression and map
  const sorted = Object.entries(expressions).sort((a,b) => b[1] - a[1]);
  const top = sorted[0][0];

  // mapping decisions
  if (top === "happy") return "Happy";
  if (top === "sad") return "Sad";
  if (top === "angry") return "Angry";         // could map to 'Stressed'
  if (top === "fearful") return "Stressed";
  if (top === "disgusted") return "Stressed";
  if (top === "surprised") return "Neutral";
  if (top === "neutral") return "Neutral";
  // fallback
  return "Neutral";
}

// Load models (face-api)
async function loadModels() {
  status.innerText = "Loading ML models… (may take a few seconds)";
  const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/models/";
  // load models we need: tiny_face_detector + face_expression_model
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  // optional (for landmarks): await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  modelLoaded = true;
  status.innerText = "Models loaded. Click Start Camera.";
}

// Start webcam and detection
async function startCamera() {
  if (!modelLoaded) {
    await loadModels();
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio:false });
    video.srcObject = stream;

    // adjust overlay size when video metadata loaded
    video.addEventListener("loadedmetadata", () => {
      displaySize = { width: video.videoWidth, height: video.videoHeight };
      overlay.width = displaySize.width;
      overlay.height = displaySize.height;
      overlay.style.width = video.style.width || `${displaySize.width}px`;
      overlay.style.height = `${displaySize.height}px`;
      // place canvas exactly above video
      overlay.style.position = "relative";
      overlay.style.marginTop = `-${displaySize.height}px`;
      overlay.style.left = "50%";
      overlay.style.transform = "translateX(-50%)";
    });

    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    status.innerText = "Camera started — detecting mood…";

    // run detection at interval (reduce freq for slower machines)
    detectInterval = setInterval(async () => {
      if (video.paused || video.ended) return;
      // detect single face with expressions (fast)
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
      const result = await faceapi.detectSingleFace(video, options).withFaceExpressions();
      const ctx = overlay.getContext("2d");
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (result) {
        // draw box (optional)
        const box = result.detection.box;
        ctx.strokeStyle = "#00B4D8";
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // show top expressions
        const sorted = Object.entries(result.expressions).sort((a,b) => b[1]-a[1]);
        const topExpr = sorted[0];

        // draw text
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(box.x, box.y - 30, 220, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Poppins, sans-serif";
        ctx.fillText(`${topExpr[0]} (${(topExpr[1]*100).toFixed(0)}%)`, box.x+6, box.y - 10);

        // map to mood and call your existing function to update UI
        const mood = mapExpressionsToMood(result.expressions);
        // call the function you already used to set mood (selectMood)
        if (typeof selectMood === "function") {
          // pass an emoji too or reuse previous mapping
          selectMood(mood, topExpr[0]);
        } else {
          // fallback: update output text directly
          const out = document.getElementById("mood-output");
          if (out) out.innerText = `Detected: ${topExpr[0]} (${(topExpr[1]*100).toFixed(0)}%) → Mood: ${mood}`;
        }
      } else {
        // no face found
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0,0,overlay.width, overlay.height);
        const out = document.getElementById("mood-output");
        if (out) out.innerText = "No face detected — please center your face in the camera.";
      }
    }, 700); // run every 700ms (adjust lower for faster machines)
  } catch (err) {
    console.error("Camera error:", err);
    status.innerText = "Camera permission denied or not available.";
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
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
  video.srcObject = null;
  status.innerText = "Camera stopped";
  startBtn.style.display = "inline-block";
  stopBtn.style.display = "none";
  const ctx = overlay.getContext("2d");
  ctx && ctx.clearRect(0,0,overlay.width, overlay.height);
}

// Hook up buttons
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);

// lazy-load face-api script then initialize (so you only load when user opens camera)
(async function setupFaceApiLoader(){
  if (typeof faceapi === "undefined") {
    // load CDN script
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    s.onload = () => {
      console.log("face-api loaded");
      // models will be loaded when startCamera calls loadModels in mood_cam.js
      modelLoaded = false;
      // optionally pre-load models now:
      // loadModels(); // we'll load later to avoid immediate heavy requests
    };
    s.onerror = () => {
      status.innerText = "Failed to load ML library. Check internet connection.";
    };
    document.head.appendChild(s);
  } else {
    // already present
  }
})();