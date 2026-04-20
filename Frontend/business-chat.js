const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
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
   🔥 CALL FASTAPI BACKEND
========================= */
async function getAIResponse(message) {
  try {
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message
      })
    });

    const data = await res.json();
    console.log("AI RESPONSE:", data);

    return data;

  } catch (err) {
    console.error("API ERROR:", err);
    return null;
  }
}

/* =========================
   🔥 MAIN FLOW
========================= */
async function handleSendMessage(message) {
  addUserMessage(message);

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">Thinking...</div>
  `;
  chatArea.appendChild(loading);

  const bubble = loading.querySelector(".bubble");

  const data = await getAIResponse(message);

  if (data) {
    bubble.textContent = data.message;

    // update dashboard
    scoreValue.textContent = data.score;
    riskValue.textContent = data.risk;
    reportSummary.textContent = data.summary;

    addAiMessage(`Score: ${data.score} | Risk: ${data.risk}`);
  } else {
    bubble.textContent = "❌ Error connecting to backend";
  }
}

/* =========================
   🔥 EVENTS
========================= */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const msg = userInput.value.trim();
  if (!msg) return;

  handleSendMessage(msg);
  userInput.value = "";
});