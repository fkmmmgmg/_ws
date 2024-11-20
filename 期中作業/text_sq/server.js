import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { bcrypt } from "https://deno.land/x/bcryptjs/mod.ts";
import { jwt } from "https://deno.land/x/djwt/mod.ts";
import { Client } from "https://deno.land/x/sqlite/mod.ts";
import * as dotenv from "https://deno.land/x/dotenv/mod.ts";

dotenv.config();

const app = new Application();
const router = new Router();

// 初始化資料庫
const db = new Client("./chat.db");

// 建立資料表
await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT
  )
`);

await db.query(`
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
router.post("/api/register", async (context) => {
  const { username, password } = await context.request.body().value;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);
    context.response.status = 201;
    context.response.body = "註冊成功！";
  } catch (error) {
    context.response.status = 400;
    context.response.body = "註冊失敗，請嘗試更換帳號！";
  }
});

// 登入 API
router.post("/api/login", async (context) => {
  const { username, password } = await context.request.body().value;

  const user = db.query("SELECT * FROM users WHERE username = ?", [username]);
  if (!user || user.length === 0) {
    context.response.status = 404;
    context.response.body = "帳號不存在";
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user[0].password);
  if (isPasswordValid) {
    const token = await jwt.sign({ userId: user[0].id }, "your_secret_key", {
      expiresIn: "1h",
    });
    context.response.body = { token };
  } else {
    context.response.status = 400;
    context.response.body = "密碼錯誤";
  }
});

// 處理 Groq API 請求
router.post("/api/chat", async (context) => {
  const { userMessage } = await context.request.body().value;

  const apiKey = "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";
  const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(groqApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ userMessage }),
    });

    if (1) {
      const data = await response.json();
      context.response.body = { reply: data.reply };
    } else {
      context.response.status = 500;
      context.response.body = "無法從 Groq API 獲取回應";
    }
  } catch (error) {
    console.error("發送 Groq API 請求時出錯:", error);
    context.response.status = 500;
    context.response.body = "伺服器錯誤";
  }
});

// 儲存聊天記錄 API
router.post("/api/save-chat", async (context) => {
  const { userMessage, aiReply } = await context.request.body().value;
  const userId = context.state.userId; // 假設這裡有驗證過的用戶 ID

  db.query("INSERT INTO chats (user_id, userMessage, aiReply) VALUES (?, ?, ?)", [
    userId,
    userMessage,
    aiReply,
  ]);

  context.response.status = 201;
  context.response.body = { reply: aiReply };
});

// 取得聊天記錄 API
router.get("/api/chats", async (context) => {
  const userId = context.state.userId;

  const chats = db.query("SELECT * FROM chats WHERE user_id = ?", [userId]);
  context.response.body = chats;
});

// 使用路由器
app.use(router.routes());
app.use(router.allowedMethods());

// 啟動伺服器
const PORT = 5000;
console.log(`伺服器正在運行在端口 ${PORT}`);
await app.listen({ port: PORT });
