import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import * as dotenv from "https://deno.land/x/dotenv/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

// 先初始化 app
const app = new Application();
const router = new Router();

// 启用 CORS
app.use(oakCors());

// 加載環境變數
dotenv.config();

// 初始化資料庫
const db = new DB("D:/My/WebsiteDesign-2/_ws/期中作業/test.b/chat.db");

// 建立資料表
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    userMessage TEXT,
    aiReply TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

// JWT secret key
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "12345";

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

  const user = db.query("SELECT id, password FROM users WHERE username = ?", [username]);
  if (!user || user.length === 0) {
    context.response.status = 404;
    context.response.body = "帳號不存在";
    return;
  }

  const [userId, hashedPassword] = user[0];

  const isPasswordValid = await bcrypt.compare(password, hashedPassword);
  if (isPasswordValid) {
    const payload = { userId, exp: getNumericDate(60 * 60) }; // 1 hour expiration
    const token = await create({ alg: "HS256", typ: "JWT" }, payload, JWT_SECRET);

    context.response.body = { token };
  } else {
    context.response.status = 400;
    context.response.body = "密碼錯誤";
  }
});

// 驗證 Middleware
app.use(async (context, next) => {
  const authorization = context.request.headers.get("Authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme === "Bearer" && token) {
      try {
        const payload = await verify(token, JWT_SECRET, "HS256");
        context.state.userId = payload.userId;
      } catch {
        context.response.status = 401;
        context.response.body = "Invalid or expired token";
        return;
      }
    }
  }
  await next();
});

// Groq API 請求
router.post("/api/chat", async (context) => {
  const { userMessage } = await context.request.body().value;
  const userId = context.state.userId;

  if (!userId) {
    context.response.status = 401;
    context.response.body = "未經授權";
    return;
  }

  const apiKey = "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"; // 替換為實際的 Groq API 金鑰
  const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(groqApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiReply = data.choices[0].message.content;

      // 儲存聊天記錄
      db.query(
        "INSERT INTO chats (user_id, userMessage, aiReply) VALUES (?, ?, ?)",
        [userId, userMessage, aiReply],
      );

      context.response.body = { reply: aiReply };
    } else {
      const errorData = await response.json();
      context.response.status = 500;
      context.response.body = {
        message: "Error calling Groq API",
        error: errorData,
      };
    }
  } catch (error) {
    console.error("發送 Groq API 請求時出錯:", error);
    context.response.status = 500;
    context.response.body = "伺服器錯誤";
  }
});

// 使用路由器
app.use(router.routes());
app.use(router.allowedMethods());

// 啟動伺服器
const PORT = 5000;
console.log(`伺服器正在運行在端口 ${PORT}`);
await app.listen({ port: PORT });
