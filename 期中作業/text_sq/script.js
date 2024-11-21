let token = localStorage.getItem("token"); // 初始化從 localStorage 檢查 token

// 初始化事件監聽
document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("register-form").addEventListener("submit", handleRegister);
document.getElementById("send-btn").addEventListener("click", handleChat);

// 頁面載入時根據登入狀態顯示對應頁面
window.addEventListener("load", () => {
  if (token) {
    loadChatPage(); // 如果已登入，直接載入聊天頁面
  } else {
    loadLoginPage(); // 否則顯示登入頁面
  }
});

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
      loadChatPage(); // 登入成功，載入聊天頁面
    } else if (response.status === 404) {
      alert("帳號未註冊，請先進行註冊！");
      loadLoginPage();
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
      loadLoginPage();
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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        userMessage: userInput,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      addMessage(data.reply, "ai");
      loadChatHistory(); // 更新側邊欄的聊天歷史
    } else {
      addMessage("Error: 無法回應", "ai");
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
  sidebar.innerHTML = "";

  chats.forEach((chat) => {
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.innerText = chat.userMessage;
    sidebar.appendChild(chatItem); // 這裡要將 chatItem 加入到 sidebar 中
  });
}

// 顯示聊天頁面
function loadChatPage() {
  document.getElementById("chat-page").style.display = "block";
  document.getElementById("login-page").style.display = "none";
}

// 顯示登入頁面
function loadLoginPage() {
  document.getElementById("chat-page").style.display = "none";
  document.getElementById("login-page").style.display = "block";
}
