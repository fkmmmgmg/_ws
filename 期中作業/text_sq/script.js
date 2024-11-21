// script.js


  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // 防止表單預設行為
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            // 如果狀態碼不是 200-299，則表示有錯誤
            const error = await response.json();
            alert(`Error: ${error.message || "Something went wrong."}`);
            return;
        }

        const data = await response.json();
        if (data.success) {
            alert("Login successful!");
            // 跳轉到主頁或執行其他操作
            globalThis.location.href = "/home";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Unable to connect to the server.");
    }
});


  if (response.ok) {
      document.getElementById("auth-container").classList.add("hidden");
      document.getElementById("chat-container").classList.remove("hidden");
      loadQuestions();
  } else {
      alert("Authentication failed!");
  }


document.getElementById("chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const userInput = document.getElementById("user-input").value;
  const chatLog = document.getElementById("chat-log");

  const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userInput })
  });

  const data = await response.json();

  chatLog.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;
  chatLog.innerHTML += `<div><strong>AI:</strong> ${data.answer}</div>`;
  document.getElementById("user-input").value = "";
  loadQuestions();
});

async function loadQuestions() {
  const response = await fetch("/questions");
  const data = await response.json();

  const questionList = document.getElementById("question-list");
  questionList.innerHTML = "";
  data.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = q;
      questionList.appendChild(li);
  });
}
