const chatForm = document.getElementById("chatForm");
const chatArea = document.getElementById("chatArea");

const scoreValue = document.getElementById("scoreValue");
const riskValue = document.getElementById("riskValue");
const reportSummary = document.getElementById("reportSummary");

const resetBtn = document.getElementById("resetBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const promptButtons = document.querySelectorAll(".prompt-btn");
const formShell = document.getElementById("formShell");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const toggleFormText = document.getElementById("toggleFormText");

if (formShell && toggleFormBtn && toggleFormText) {
  toggleFormBtn.addEventListener("click", () => {
    formShell.classList.toggle("collapsed");

    if (formShell.classList.contains("collapsed")) {
      toggleFormText.textContent = "Show Form";
    } else {
      toggleFormText.textContent = "Hide Form";
    }
  });
}

function addUserMessage(text) {
  const div = document.createElement("div");
  div.className = "message user";
  text = text.replace(/\n/g, "<br>");
  div.innerHTML = `<div class="bubble">${text}</div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}


function formatMoney(num) {
  return "$" + Number(num).toLocaleString();
}

function formatAiText(text) {
  if (!text) return "No response available.";

  return text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- /gm, "• ")
    .replace(/• /g, "<br>• ")
    .replace(/(<br>\s*){2,}/g, "<br><br>");
}

function addAiMessage(text, type = "normal") {
  const div = document.createElement("div");
  div.className = `message ai ${type === "highlight" ? "highlight-message" : ""}`;
  div.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">${formatAiText(text)}</div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function setLoadingState(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeBtn.textContent = isLoading ? "Analyzing..." : "Analyze Business";
}

async function sendToBackend(payload) {
  const res = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return await res.json();
}

function getPayloadFromForm() {
  return {
    business_type: document.getElementById("business_type").value,
    country: document.getElementById("country").value,
    city: document.getElementById("city").value,
    budget: Number(document.getElementById("budget").value) || 100000,
    target_customer: document.getElementById("target_customer").value,
    competitor_level: document.getElementById("competitor_level").value
  };
}

function resetForm() {
  chatForm.reset();
  scoreValue.textContent = "--";
  riskValue.textContent = "--";
  reportSummary.textContent =
    "The AI-generated business summary will appear here and can later be expanded in the report page.";
}

function fillPreset(type) {
  const presets = {
    starter: {
      business_type: "restaurant",
      country: "Thailand",
      city: "Bangkok",
      budget: 150000,
      target_customer: "young professionals",
      competitor_level: "medium"
    },
    coffee: {
      business_type: "coffee shop",
      country: "Thailand",
      city: "Chiang Mai",
      budget: 120000,
      target_customer: "students",
      competitor_level: "high"
    },
    fashion: {
      business_type: "fashion",
      country: "Vietnam",
      city: "Ho Chi Minh City",
      budget: 200000,
      target_customer: "young professionals",
      competitor_level: "medium"
    },
    bubble: {
      business_type: "bubble tea",
      country: "Singapore",
      city: "Bangkok",
      budget: 90000,
      target_customer: "students",
      competitor_level: "high"
    }
  };

  const preset = presets[type];
  if (!preset) return;

  document.getElementById("business_type").value = preset.business_type;
  document.getElementById("country").value = preset.country;
  document.getElementById("city").value = preset.city;
  document.getElementById("budget").value = preset.budget;
  document.getElementById("target_customer").value = preset.target_customer;
  document.getElementById("competitor_level").value = preset.competitor_level;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = getPayloadFromForm();

  addUserMessage(`
📌 Business: ${payload.business_type}
🌍 Location: ${payload.city}, ${payload.country}
💰 Budget: ${formatMoney(payload.budget)}
🎯 Target: ${payload.target_customer}
⚔ Competition: ${payload.competitor_level}
`);

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble loading-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  chatArea.appendChild(loading);
  chatArea.scrollTop = chatArea.scrollHeight;

  setLoadingState(true);

  try {
    const data = await sendToBackend(payload);

    loading.remove();
    setLoadingState(false);

    addAiMessage(`
📊 Investment Analysis Result

${data.message}
`);

    scoreValue.textContent = data.score ?? "--";
    scoreValue.style.transform = "scale(1.1)";
    setTimeout(() => {
      scoreValue.style.transform = "scale(1)";
    }, 200);
    riskValue.textContent = data.risk ?? "--";

    riskValue.style.background =
      data.risk === "Low" ? "#00c853" :
        data.risk === "Medium" ? "#ffab00" :
          "#d50000";
    riskValue.style.color = "#000";
riskValue.style.fontWeight = "700";
riskValue.style.padding = "6px 12px";
riskValue.style.borderRadius = "20px";
    reportSummary.textContent = data.summary ?? "No summary available.";

    localStorage.setItem(
      "synthiqReport",
      JSON.stringify({
        ...data,
        input: payload,
        timestamp: new Date().toLocaleString()
      })
    );

    addAiMessage(
      `**Analysis Updated**
- Score: ${data.score ?? "--"}
- Risk: ${data.risk ?? "--"}
- Summary: ${data.summary ?? "No summary available."}`,
      "highlight"
    );
  } catch (err) {
    loading.remove();
    setLoadingState(false);
    console.error(err);
    addAiMessage(
      `**Connection Error**
- Unable to connect to backend
- Please make sure FastAPI is running
- Check that the API URL is correct`
    );
  }
});

resetBtn.addEventListener("click", () => {
  resetForm();
  addAiMessage("Form has been reset. You can enter a new business idea now.");
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    fillPreset(button.dataset.fill);
  });
});