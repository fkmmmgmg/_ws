import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Application, Router, send } from "https://deno.land/x/oak@v10.0.0/mod.ts";
import { askGroqAI } from "file:///D:/My/WebsiteDesign-2/_ws/期中作業/test.b/groqApi.js";

// 初始化應用程式和環境變數
const app = new Application();
const router = new Router();
const env = config();

// 啟用 CORS
app.use(oakCors({ origin: "*" }));

// 靜態文件處理
router.get("/:path*", async (ctx) => {
  await send(ctx, ctx.params.path || "app_2.html", {
    root: "./", // 確保靜態文件放在同目錄下
  });
});

// 初始化資料庫
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

// 註冊 API
router.post("/api/register", async (ctx) => {
  const body = ctx.request.body();
  if (body.type === "json") {
    try {
      const post = await body.value;
      const { username, password } = post;

      // 檢查是否已經存在此用戶
      const existingUser = await db.query("SELECT * FROM users WHERE username = ?", [username]);
      if (existingUser.length > 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "帳號已存在！" }; // 明確定義返回的訊息
        return;
      }

      const hashedPassword = await bcrypt.hash(password);
      await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);

      ctx.response.status = 201;
      ctx.response.body = { message: "註冊成功！" }; // 明確定義返回的訊息
    } catch (error) {
      console.error("註冊失敗:", error);
      ctx.response.status = 400;
      ctx.response.body = { message: "註冊失敗，請稍後再試！" }; // 明確定義返回的訊息
    }
  } else {
    ctx.response.status = 400;
    ctx.response.body = { message: "請使用 JSON 格式傳送資料！" }; // 明確定義返回的訊息
  }
});

// 登入 API
router.post("/api/login", async (ctx) => {
  const body = ctx.request.body();
  const DB_ENUMS =  {
    number: 0,
    account: 1,
    password: 2,
    email: 3,
  };
  if (body.type === 'json') {
    try {
      const post = await body.value;
      const { username, password } = post;

      const users = await db.query("SELECT * FROM users WHERE username = ?", [username]);
      ctx.response.body = { message: users };
      if (users.length === 0) {
        ctx.response.status = 401;
        ctx.response.body = { message: "登入失敗，帳號或密碼錯誤" }; // 明確定義返回的訊息
        return;
      }

      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user[DB_ENUMS.password]);
      if (!passwordMatch) {
        ctx.response.status = 401;
        ctx.response.body = { message: "登入失敗，帳號或密碼錯誤" }; // 明確定義返回的訊息
        return;
      }

      // 檢查用戶數據
      console.log("用戶數據:", user);

      // 直接返回用戶資料（不再使用 Token）
      ctx.response.status = 200;
      ctx.response.body = { message: "登入成功！", userId: user[DB_ENUMS.number], username: user[DB_ENUMS.account] };
    } catch (error) {
      console.error("登入失敗:", error);
      ctx.response.status = 400;
      ctx.response.body = { message: "登入失敗，請稍後再試！" };
    }
  } else {
    ctx.response.status = 400;
    ctx.response.body = { message: "請使用 JSON 格式傳送資料！" };
  }
});

// 聊天 API
router.post("/api/chat", async (ctx) => {
  const body = ctx.request.body();
  if (body.type === "json") {
    try {
      const { question } = await body.value;
      if (!question) {
        ctx.response.status = 400;
        ctx.response.body = { message: "請提供問題！" };
        return;
      }

      // 呼叫 groqApi.js 的 askQuestion 函數
      const answer = await askGroqAI(question);
      ctx.response.status = 200;
      ctx.response.body = { answer };
    } catch (error) {
      console.error("AI 聊天失敗:", error);
      ctx.response.status = 500;
      ctx.response.body = { message: "AI 聊天失敗，請稍後再試！" };
    }
  } else {
    ctx.response.status = 400;
    ctx.response.body = { message: "請使用 JSON 格式傳送資料！" };
  }
});

const PORT = 8001;
console.log(`伺服器正在運行於 http://127.0.0.1:${PORT}`);
app.use(router.routes());
app.use(router.allowedMethods());
await app.listen({ port: PORT });
