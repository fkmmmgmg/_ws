import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const app = new Application();
const router = new Router();

// 啟用 CORS
app.use(oakCors({ origin: "*" }));

// 靜態文件服務
router.get("/:path*", async (ctx) => {
  await send(ctx, ctx.params.path || "app_2.html", {
    root: "./", // 確保靜態文件放在同目錄下
  });
});

// 範例 API 路由
router.post("/api/login", async (ctx) => {
  const { username, password } = await ctx.request.body({ type: "json" }).value;

  // 驗證邏輯（簡化版）
  if (username === "test" && password === "1234") {
    ctx.response.status = 200;
    ctx.response.body = { message: "登入成功！", token: "sample_token" };
  } else {
    ctx.response.status = 401;
    ctx.response.body = { message: "帳號或密碼錯誤！" };
  }
});

router.post("/api/register", async (ctx) => {
  const { username, password } = await ctx.request.body({ type: "json" }).value;

  // 註冊邏輯（簡化版）
  ctx.response.status = 201;
  ctx.response.body = { message: "註冊成功！" };
});

// 啟動伺服器
const PORT = 8000;
console.log(`伺服器正在運行於 http://localhost:${PORT}`);
app.use(router.routes());
app.use(router.allowedMethods());
await app.listen({ port: PORT });
