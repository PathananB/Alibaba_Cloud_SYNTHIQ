const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const promptButtons = document.querySelectorAll(".prompt-btn");

const scoreValue = document.getElementById("scoreValue");
const riskValue = document.getElementById("riskValue");
const reportSummary = document.getElementById("reportSummary");

function addUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message user";
  wrapper.innerHTML = `<div class="bubble">${text}</div>`;
  chatArea.appendChild(wrapper);
  scrollToBottom();
}

function addAiMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message ai";
  wrapper.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">${text}</div>
  `;
  chatArea.appendChild(wrapper);
  scrollToBottom();
}

function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

/* ===== PLACEHOLDER FOR API INTEGRATION =====
   Replace generateMockResponse() with your real API call.

   Example:
   async function getAIResponse(prompt) {
     const response = await fetch("YOUR_API_ENDPOINT", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ message: prompt })
     });
     return await response.json();
   }
*/

function generateMockResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  let businessType = "business";
  let country = "target market";

  if (lowerPrompt.includes("clothing")) businessType = "online clothing business";
  if (lowerPrompt.includes("coffee")) businessType = "coffee shop";
  if (lowerPrompt.includes("restaurant")) businessType = "restaurant";
  if (lowerPrompt.includes("vietnam")) country = "Vietnam";
  if (lowerPrompt.includes("thailand")) country = "Thailand";
  if (lowerPrompt.includes("indonesia")) country = "Indonesia";

  return {
    message: `For a ${businessType} in ${country}, the market outlook appears promising. AI analysis suggests moderate to high growth potential, especially if you focus on digital marketing, customer retention, and a clear product positioning strategy.`,
    score: "8.4 / 10",
    risk: "Moderate",
    summary: `This idea shows good opportunity in ${country}. Key strengths include online demand potential, scalable digital channels, and room for brand differentiation. Main risks include competition, customer acquisition cost, and pricing pressure.`
  };
}

function updateInsightPanel(data) {
  scoreValue.textContent = data.score;
  riskValue.textContent = data.risk;
  reportSummary.textContent = data.summary;

  localStorage.setItem("synthiqReport", JSON.stringify(data));
}

async function handleSendMessage(message) {
  addUserMessage(message);

  addAiMessage("Analyzing your business idea...");

  setTimeout(() => {
    const aiMessages = chatArea.querySelectorAll(".message.ai .bubble");
    aiMessages[aiMessages.length - 1].textContent = "Generating investment outlook, risk estimate, and insight summary...";

    setTimeout(() => {
      const data = generateMockResponse(message);

      aiMessages[aiMessages.length - 1].textContent = data.message;
      updateInsightPanel(data);

      addAiMessage(`Investment Score: ${data.score} | Risk Level: ${data.risk}`);
      addAiMessage(`Insight Summary: ${data.summary}`);
    }, 900);
  }, 700);
}

chatForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  handleSendMessage(message);
  userInput.value = "";
});

promptButtons.forEach((button) => {
  button.addEventListener("click", function () {
    userInput.value = button.textContent;
    userInput.focus();
  });
});