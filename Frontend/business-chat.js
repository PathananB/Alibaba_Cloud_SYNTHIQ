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
      body: JSON.stringify({ message: message })
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
    🔥 UPDATED MAIN FLOW (COMPLETE VERSION)
========================= */
async function handleSendMessage(message) {
  addUserMessage(message);

  // 1. สร้างสถานะ Loading
  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">Thinking...</div>
  `;
  chatArea.appendChild(loading);
  chatArea.scrollTop = chatArea.scrollHeight;

  // 2. เรียกข้อมูลจาก Backend
  const data = await getAIResponse(message);
  
  // 3. ลบสถานะ Loading ออก
  chatArea.removeChild(loading);

  if (data) {
    // 4. แสดงข้อความตอบกลับหลักจาก AI เสมอ [cite: 60]
    addAiMessage(data.message);

    // 5. เช็คว่ามีข้อมูลสำหรับการทำ Report หรือไม่ (Score > 10)
    // เพื่อให้คุยได้ต่อเนื่องโดยไม่แสดง Summary Card ทุกครั้งที่ข้อมูลยังไม่ครบ [cite: 47, 60]
    if (data.score && parseFloat(data.score) > 10) { 
        
        // อัปเดต UI Dashboard ด้านข้าง 
        if (scoreValue) scoreValue.textContent = data.score;
        if (riskValue) riskValue.textContent = data.risk;
        if (reportSummary) reportSummary.textContent = data.summary;

        // บันทึกข้อมูลลง localStorage เพื่อใช้ในหน้า report.html 
        const reportData = {
          message: data.message,
          score: data.score,
          risk: data.risk,
          summary: data.summary,
          timestamp: new Date().toLocaleString()
        };
        localStorage.setItem("synthiqReport", JSON.stringify(reportData));

        // แสดง Summary Card สั้นๆ เพื่อบอกว่าวิเคราะห์คืบหน้าไปถึงไหนแล้ว [cite: 47]
        addAiMessage(`
          📊 **Analysis Updated**
          <br>Current Investment Score: ${data.score} | Risk Level: ${data.risk}
          <br><br>
          *Check the Reports section for more details.*
        `);
    }
  } else {
    addAiMessage("❌ Error: Connection failed. Please try again.");
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