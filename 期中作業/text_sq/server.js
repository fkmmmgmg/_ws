const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.json());

const fetch = require("node-fetch"); // 如果還沒安裝 fetch，請安裝它：npm install node-fetch

// 處理 Groq API 請求
app.post("/api/chat", async (req, res) => {
  const { userMessage } = req.body;
  
  const apiKey = "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"; // Groq API Key 隱藏在後端
  const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions"; // 替換為實際的 Groq API URL

  try {
    const response = await fetch(groqApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        userMessage: userMessage,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ reply: data.reply }); // 傳送 AI 回應到前端
    } else {
      res.status(500).send("無法從 Groq API 獲取回應");
    }
  } catch (error) {
    console.error("發送 Groq API 請求時出錯:", error);
    res.status(500).send("伺服器錯誤");
  }
});

// 初始化資料庫
const db = new sqlite3.Database("D:/My/WebsiteDesign-2/_ws/期中作業/chat.db", (err) => {
  if (err) {
    console.error('資料庫無法開啟', err.message);
  } else {
    console.log('資料庫已開啟');
  }
});

// 創建表格 (用戶和聊天記錄)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    userMessage TEXT,
    aiReply TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

// 註冊 API
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 加密密碼
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      function (err) {
        if (err) {
          console.error("註冊錯誤:", err.message);
          return res.status(400).send("註冊失敗，請嘗試更換帳號！");
        }
        res.status(201).send("註冊成功！");
      }
    );
  } catch (error) {
    console.error("註冊錯誤:", error);
    res.status(500).send("註冊錯誤，請稍後再試！");
  }
});

// 登入 API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        console.error("登入錯誤:", err.message);
        return res.status(500).send("伺服器錯誤");
      }
      if (!user) {
        return res.status(404).send("帳號不存在");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const token = jwt.sign({ userId: user.id }, "your_secret_key", { expiresIn: '1h' });
        res.json({ token });
      } else {
        res.status(400).send("密碼錯誤");
      }
    }
  );
});

// 儲存聊天記錄 API
app.post("/api/save-chat", (req, res) => {
  const { userMessage, aiReply } = req.body;
  const userId = req.userId;

  db.run(
    "INSERT INTO chats (user_id, userMessage, aiReply) VALUES (?, ?, ?)",
    [userId, userMessage, aiReply],
    function (err) {
      if (err) {
        console.error("儲存聊天記錄錯誤:", err.message);
        return res.status(500).send("聊天記錄保存失敗");
      }
      res.status(201).json({ reply: aiReply });
    }
  );
});

// 取得聊天記錄 API
app.get("/api/chats", (req, res) => {
  const userId = req.userId;

  db.all("SELECT * FROM chats WHERE user_id = ?", [userId], (err, chats) => {
    if (err) {
      console.error("讀取聊天記錄錯誤:", err.message);
      return res.status(500).send("讀取聊天記錄錯誤");
    }
    res.json(chats);
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`伺服器正在運行在端口 ${PORT}`));
