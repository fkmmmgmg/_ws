// script.js
document.getElementById("send-btn").addEventListener("click", async () => {
    const userInput = document.getElementById("user-input").value;
    if (!userInput.trim()) return;
  
    // 顯示用戶的輸入
    addMessage(userInput, "user");
    document.getElementById("user-input").value = "";
  
    // 呼叫 GroqChat API
    try {
      const response = await fetch("https://api.groqchat.com/your-endpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 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",
        },
        body: JSON.stringify({ message: userInput }),
      });
  
      if (response.ok) {
        const data = await response.json();
        addMessage(data.reply, "ai");
        saveChatRecord(userInput, data.reply); // 保存聊天記錄
      } else {
        addMessage("Error: Unable to get a response from AI.", "ai");
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage("Error: Network issue occurred.", "ai");
    }
  });
  
  function addMessage(text, role) {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${role}`;
    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  
  // 保存聊天記錄到後端
  async function saveChatRecord(userMessage, aiReply) {
    try {
      await fetch("/api/save-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userMessage, aiReply }),
      });
    } catch (error) {
      console.error("Error saving chat record:", error);
    }
  }
  