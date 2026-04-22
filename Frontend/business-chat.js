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
const newChatBtn = document.getElementById("newChatBtn");

const WELCOME_MESSAGE = `👋 Welcome to Synthiq AI

Fill in your business details below and I will generate:
• Investment Score
• Risk Level
• Business Summary
• Actionable Recommendations`;

if (formShell && toggleFormBtn && toggleFormText) {
  toggleFormBtn.addEventListener("click", () => {
    formShell.classList.toggle("collapsed");
    toggleFormText.textContent = formShell.classList.contains("collapsed")
      ? "Show Form"
      : "Hide Form";
  });
}

function getChats() {
  return JSON.parse(localStorage.getItem("synthiq_chat_sessions")) || [];
}

function saveChats(chats) {
  localStorage.setItem("synthiq_chat_sessions", JSON.stringify(chats));
}

function getCurrentChatId() {
  return localStorage.getItem("synthiq_current_chat_id");
}

function setCurrentChatId(id) {
  localStorage.setItem("synthiq_current_chat_id", id);
}

function createNewChatData() {
  const now = new Date().toISOString();
  return {
    id: "chat_" + Date.now(),
    title: "New Chat",
    messages: [
      {
        sender: "ai",
        text: WELCOME_MESSAGE,
        time: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}

function getCurrentChat() {
  const chats = getChats();
  const currentId = getCurrentChatId();
  let chat = chats.find((c) => c.id === currentId);

  if (!chat) {
    chat = createNewChatData();
    chats.unshift(chat);
    saveChats(chats);
    setCurrentChatId(chat.id);
  }

  return chat;
}

function cleanChatTitle(text) {
  return text
    .replace(/\n/g, " ")
    .replace(/[▪•]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40) || "New Chat";
}

function addMessageToCurrentChat(sender, text) {
  const chats = getChats();
  let currentId = getCurrentChatId();
  let chat = chats.find((c) => c.id === currentId);

  if (!chat) {
    chat = createNewChatData();
    chats.unshift(chat);
    setCurrentChatId(chat.id);
    currentId = chat.id;
  }

  if ((!chat.title || chat.title === "New Chat") && sender === "user") {
    chat.title = cleanChatTitle(text);
  }

  chat.messages.push({
    sender,
    text,
    time: new Date().toISOString()
  });

  chat.updatedAt = new Date().toISOString();
  saveChats(chats);
  renderRecentChats();
}

function addUserMessage(text, shouldSave = true) {
  const div = document.createElement("div");
  div.className = "message user";
  div.innerHTML = `<div class="bubble">${text.replace(/\n/g, "<br>")}</div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  if (shouldSave) {
    addMessageToCurrentChat("user", text);
  }
}

function addAiMessage(text, variant = "", shouldSave = true) {
  const div = document.createElement("div");
  div.className = "message ai";

  if (variant) {
    div.classList.add(variant);
  }

  div.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">${text.replace(/\n/g, "<br>")}</div>
  `;

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  if (shouldSave) {
    addMessageToCurrentChat("ai", text);
  }
}

function renderSavedMessages() {
  const chat = getCurrentChat();
  if (!chatArea) return;

  chatArea.innerHTML = "";

  chat.messages.forEach((msg) => {
    if (msg.sender === "user") {
      addUserMessage(msg.text, false);
    } else {
      addAiMessage(msg.text, "", false);
    }
  });

  chatArea.scrollTop = chatArea.scrollHeight;
}

function renderRecentChats() {
  const recentList = document.querySelector(".recent-list");
  if (!recentList) return;

  const chats = getChats().sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  if (!chats.length) {
    recentList.innerHTML = `<div class="menu-item recent-item disabled">No saved chats</div>`;
    return;
  }

  recentList.innerHTML = chats
    .slice(0, 5)
    .map((chat) => {
      const isActive = chat.id === getCurrentChatId() ? " active" : "";
      return `
        <a href="#" class="menu-item recent-item${isActive}" data-chat-id="${chat.id}">
          ${chat.title || "New Chat"}
        </a>
      `;
    })
    .join("");

  recentList.querySelectorAll(".recent-item[data-chat-id]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      setCurrentChatId(item.dataset.chatId);
      renderSavedMessages();
      renderRecentChats();
    });
  });
}

function formatMoney(num) {
  return "$" + Number(num).toLocaleString();
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
    budget: Number(document.getElementById("budget").value),
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
      city: "tier1",
      budget: 150000,
      target_customer: "young professionals",
      competitor_level: "medium"
    },
    coffee: {
      business_type: "coffee shop",
      country: "Thailand",
      city: "tier2",
      budget: 120000,
      target_customer: "students",
      competitor_level: "high"
    },
    fashion: {
      business_type: "fashion",
      country: "Vietnam",
      city: "tier1",
      budget: 200000,
      target_customer: "young professionals",
      competitor_level: "medium"
    },
    bubble: {
      business_type: "bubble tea",
      country: "Singapore",
      city: "tier1",
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

function createNewChat() {
  const chats = getChats();
  const newChat = createNewChatData();

  chats.unshift(newChat);
  saveChats(chats);
  setCurrentChatId(newChat.id);

  renderSavedMessages();
  renderRecentChats();
  resetForm();

  if (riskValue) {
    riskValue.style.background = "";
    riskValue.style.color = "";
    riskValue.style.fontWeight = "";
    riskValue.style.padding = "";
    riskValue.style.borderRadius = "";
  }
}

if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = getPayloadFromForm();

    const userText = `
    ▪ Business: ${payload.business_type}
    ▪ Location: ${payload.city}, ${payload.country}
    ▪ Budget: ${formatMoney(payload.budget)}
    ▪ Target: ${payload.target_customer}
    ▪ Competition: ${payload.competitor_level}`;

    addUserMessage(userText);

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

      addAiMessage(`📊 Investment Analysis Result

${data.message}`);

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
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    resetForm();
    addAiMessage("Form has been reset. You can enter a new business idea now.", "", false);
  });
}

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    fillPreset(button.dataset.fill);
  });
});

if (newChatBtn) {
  newChatBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createNewChat();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSavedMessages();
  renderRecentChats();
});