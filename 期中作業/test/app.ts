import { Application, Router, Context } from "https://deno.land/x/oak/mod.ts";
import { hash, compare } from "https://deno.land/x/bcrypt/mod.ts";
import {
  create,
  verify,
  getNumericDate,
} from "https://deno.land/x/djwt@v2.8/mod.ts";
import type { Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

config(); // 載入環境變數

const app = new Application();
const router = new Router();

// 連接到 SQLite 資料庫
const db = new DB("chat.db");

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

// JWT 秘密金鑰
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your_jwt_secret_key";

// 中間件：處理 JWT 認證
app.use(async (context: Context, next) => {
  const authorization = context.request.headers.get("Authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme === "Bearer" && token) {
      try {
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(JWT_SECRET),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"],
        );
        const payload = await verify(token, key, "HS256");
        context.state.userId = payload.userId;
      } catch (err) {
        context.response.status = 401;
        context.response.body = { message: "無效的令牌" };
        return;
      }
    }
  }
  await next();
});

// 註冊 API
router.post("/api/register", async (context) => {
  const { username, password, email } = await context.request.body({ type: "json" }).value;

  if (!username || !password || !email) {
    context.response.status = 400;
    context.response.body = { message: "請提供完整的註冊資訊" };
    return;
  }

  try {
    const hashedPassword = await hash(password);
    db.query("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [
      username,
      hashedPassword,
      email,
    ]);
    context.response.status = 201;
    context.response.body = { message: "註冊成功" };
  } catch (error) {
    context.response.status = 400;
    context.response.body = { message: "註冊失敗，可能是用戶名已存在" };
  }
});

// 登入 API
router.post("/api/login", async (context) => {
  const { username, password } = await context.request.body({ type: "json" }).value;

  if (!username || !password) {
    context.response.status = 400;
    context.response.body = { message: "請提供用戶名和密碼" };
    return;
  }

  const users = [
    ...db.query("SELECT id, password FROM users WHERE username = ?", [username]),
  ];

  if (users.length === 0) {
    context.response.status = 404;
    context.response.body = { message: "用戶不存在" };
    return;
  }

  const [id, hashedPassword] = users[0];
  const isPasswordValid = await compare(password, hashedPassword);

  if (isPasswordValid) {
    const payload: Payload = {
      userId: id,
      exp: getNumericDate(60 * 60), // 1小時後過期
    };

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    context.response.body = { token };
  } else {
    context.response.status = 400;
    context.response.body = { message: "密碼錯誤" };
  }
});

// AI 聊天 API
router.post("/api/chat", async (context) => {
  const { userMessage } = await context.request.body({ type: "json" }).value;
  const userId = context.state.userId;

  if (!userId) {
    context.response.status = 401;
    context.response.body = { message: "未經授權" };
    return;
  }

  if (!userMessage) {
    context.response.status = 400;
    context.response.body = { message: "請提供聊天訊息" };
    return;
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const openaiApiUrl = "https://api.openai.com/v1/chat/completions";

  try {
    const response = await fetch(openaiApiUrl, {
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
   }

    if (response.ok) {
      const data = await response.json();
      const aiReply = data.choices[0].message.content;

    }

      // 儲存聊天記錄
      db.query(
        "INSERT INTO chats (user_id, userMessage, aiReply) VALUES (?, ?, ?)")