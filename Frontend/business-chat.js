const chatForm = document.getElementById("chatForm");
const chatArea = document.getElementById("chatArea");

const scoreValue = document.getElementById("scoreValue");
const riskValue = document.getElementById("riskValue");
const reportSummary = document.getElementById("reportSummary");

function addUserMessage(text) {
  const div = document.createElement("div");
  div.className = "message user";
  div.innerHTML = `<div class="bubble">${text}</div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addAiMessage(text) {
  const div = document.createElement("div");
  div.className = "message ai";
  div.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">${text}</div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

/* =========================
   CALL BACKEND
========================= */
async function sendToBackend(payload) {
  const res = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return await res.json();
}

/* =========================
   MAIN FLOW
========================= */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 👉 ดึงค่าจาก form
  const payload = {
    business_type: document.getElementById("business_type").value,
    country: document.getElementById("country").value,
    city: document.getElementById("city").value,
    budget: Number(document.getElementById("budget").value) || 100000,
    target_customer: document.getElementById("target_customer").value,
    competitor_level: document.getElementById("competitor_level").value
  };

  addUserMessage(`Analyze: ${payload.business_type} in ${payload.city}`);

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">Analyzing...</div>
  `;
  chatArea.appendChild(loading);

  try {
    const data = await sendToBackend(payload);
    loading.remove();

    addAiMessage(data.message || "Analysis completed");

    // update dashboard
    scoreValue.textContent = data.score ?? "--";
    riskValue.textContent = data.risk ?? "--";
    reportSummary.textContent = data.summary ?? "No summary";

    // save report
    localStorage.setItem("synthiqReport", JSON.stringify(data));

    addAiMessage(`
      📊 Score: ${data.score} <br>
      ⚠ Risk: ${data.risk}
    `);

  } catch (err) {
    loading.remove();
    addAiMessage("❌ Error connecting to backend");
  }
});