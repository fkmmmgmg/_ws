import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { bcrypt } from "https://deno.land/x/bcryptjs/mod.ts";
import { jwt } from "https://deno.land/x/djwt/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import * as dotenv from "https://deno.land/x/dotenv/mod.ts";

dotenv.config();

const app = new Application();
const router = new Router();
const db = new DB("chat.db");

// 註冊用戶 API
router.post("/api/register", async (context) => {
  const { username, password } = await context.request.body().value;

  // 檢查用戶是否已經存在
  const result = db.query("SELECT * FROM users WHERE username = ?", [username]);
  if (result.length > 0) {
    context.response.status = 400;
    context.response.body = { message: "使用者名稱已經存在" };
    return;
  }

  const hashedPassword = await bcrypt.hash(password);
  try {
    db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
    context.response.status = 201;
    context.response.body = { message: "註冊成功" };
  } catch (e) {
    console.error(e);
    context.response.status = 500;
    context.response.body = { message: "註冊失敗" };
  }
});

// 登入用戶 API
router.post("/api/login", async (context) => {
  const { username, password } = await context.request.body().value;
  const result = db.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = result[0];

  if (user && await bcrypt.compare(password, user.password)) {
    const payload = { username };
    const token = await jwt.create({ alg: "HS256", key: Deno.env.get("JWT_SECRET")! }, payload);
    context.response.body = { token };
  } else {
    context.response.status = 401;
    context.response.body = { message: "無效的帳號或密碼" };
  }
});

// 聊天訊息 API
router.post("/api/chat", async (context) => {
  if (!context.request.hasBody) {
    context.response.status = 400;
    context.response.body = { message: "沒有輸入訊息" };
    return;
  }

  const { userMessage } = await context.request.body().value;

  // 假設AI回應邏輯
  const aiResponse = `AI回應: ${userMessage}`;

  // 儲存聊天記錄
  db.query("INSERT INTO chats (userMessage, aiMessage) VALUES (?, ?)", [userMessage, aiResponse]);

  context.response.body = { reply: aiResponse };
});

// 查詢聊天記錄 API
router.get("/api/chats", async (context) => {
  const chats = db.query("SELECT * FROM chats");
  context.response.body = chats.map(([id, userMessage, aiMessage]) => ({
    userMessage,
    aiMessage,
  }));
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("伺服器正在運行...");
await app.listen({ port: 8000 });
