function getChats() {
    return JSON.parse(localStorage.getItem("synthiq_chat_sessions")) || [];
  }
  
  function setCurrentChat(id) {
    localStorage.setItem("synthiq_current_chat_id", id);
  }
  
  function renderHistory() {
    const list = document.getElementById("chatHistoryList");
    const empty = document.getElementById("emptyState");
  
    const chats = getChats().sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  
    if (chats.length === 0) {
      empty.style.display = "flex";
      list.innerHTML = "";
      return;
    }
  
    empty.style.display = "none";
  
    list.innerHTML = chats.map(chat => {
      const lastMsg = chat.messages?.length
        ? chat.messages[chat.messages.length - 1].text
        : "No messages yet";
  
      return `
        <div class="chat-card" data-id="${chat.id}">
          <div class="chat-title">${chat.title || "Untitled"}</div>
          <div class="chat-preview">${lastMsg.slice(0, 80)}</div>
          <div class="chat-date">${new Date(chat.updatedAt).toLocaleString()}</div>
        </div>
      `;
    }).join("");
  
    document.querySelectorAll(".chat-card").forEach(card => {
      card.onclick = () => {
        setCurrentChat(card.dataset.id);
        window.location.href = "business-chat.html";
      };
    });
  }
  
  renderHistory();