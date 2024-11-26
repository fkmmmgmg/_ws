// script.js

// 全域變數
let token = null;

// 初始化事件監聽
document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("register-form").addEventListener("submit", handleRegister);
document.getElementById("send-btn").addEventListener("click", handleChat);

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      token = data.token;
      localStorage.setItem("token", token); // 保存 Token
      loadChatPage(); // 成功登入後載入聊天頁面
    } else if (response.status === 404) {
      // 若帳號不存在，自動進行註冊
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (registerResponse.ok) {
        alert("帳號未註冊，已自動完成註冊。請稍後登入！");
        handleLogin(event); // 再次嘗試登入
      } else {
        alert("自動註冊失敗，請重試！");
      }
    } else {
      alert("登入失敗，請檢查帳號或密碼！");
    }
  } catch (error) {
    console.error("Login error:", error);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      alert("註冊成功！請登入。");
    } else {
      alert("註冊失敗，請嘗試更換帳號！");
    }
  } catch (error) {
    console.error("Register error:", error);
  }
}

async function handleChat() {
  const userInput = document.getElementById("user-input").value;
  if (!userInput.trim()) return;

  addMessage(userInput, "user");
  document.getElementById("user-input").value = "";

  try {
    const response = await fetch("/api/save-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ userMessage: userInput, aiReply: "AI response placeholder" }),
    });

    if (response.ok) {
      const data = await response.json();
      addMessage(data.reply, "ai");
      loadChatHistory(); // 更新側欄記錄
    } else {
      addMessage("Error: Unable to save chat.", "ai");
    }
  } catch (error) {
    console.error("Chat error:", error);
  }
}

async function loadChatHistory() {
  try {
    const response = await fetch("/api/chats", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (response.ok) {
      const chats = await response.json();
      updateSidebar(chats);
    }
  } catch (error) {
    console.error("Error loading chat history:", error);
  }
}

function addMessage(text, role) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role}`;
  messageDiv.innerText = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateSidebar(chats) {
  const sidebar = document.getElementById("chat-sidebar");
  sidebar.innerHTML = ""; // 清空現有內容

  chats.forEach((chat) => {
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.innerText = chat.userMessage;
    sidebar.appendChild(chatItem);
  });
}

function loadChatPage() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("chat-container").style.display = "flex";
  loadChatHistory();
}
