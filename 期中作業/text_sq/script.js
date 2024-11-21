// script.js
document.getElementById("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
  });

  if (response.ok) {
      document.getElementById("auth-container").classList.add("hidden");
      document.getElementById("chat-container").classList.remove("hidden");
      loadQuestions();
  } else {
      alert("Authentication failed!");
  }
});

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
