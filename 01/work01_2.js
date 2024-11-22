import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

// HTML 渲染函數
function renderHomePage() {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e6f7ff; /* 淺藍色背景 */
            color: #003366; /* 深藍色字體 */
            margin: 0;
            padding: 5cm; /* 設置內邊距，距離邊界5公分 */
          }
          h1 {
            background-color: #0066cc; /* 藍色標題背景 */
            color: white;
            padding: 20px;
            margin: 0 0 20px 0;
            text-align: left; /* 標題靠左對齊 */
          }
          ol {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          ol li {
            margin: 10px 0;
            text-align: left; /* 列表文字靠左對齊 */
          }
          ol li a {
            text-decoration: none;
            color: #00509e; /* 中藍色連結 */
            font-size: 18px;
            font-weight: bold;
          }
          ol li a:hover {
            color: #003366; /* 深藍色連結 hover 效果 */
          }
          button {
            display: block;
            margin: 20px 0;
            background-color: #0066cc; /* 藍色按鈕背景 */
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            text-align: left; /* 按鈕文字靠左對齊 */
          }
          button:hover {
            background-color: #00509e; /* 深藍色按鈕 hover 效果 */
          }
        </style>
      </head>
      <body>
        <h1>我的自我介紹</h1>
        <ol>
          <li><a href="/name">姓名</a></li>
          <li><a href="/age">年齡</a></li>
          <li><a href="/gender">性別</a></li>
          <li><a href="/hobby">愛好</a></li>
          <li><a href="/job">職業</a></li>
        </ol>
        <button onclick="location.href='https://github.com/fkmmmgmg/_ws/tree/master/01'">Code</button>
      </body>
    </html>
  `;
}

app.use((ctx) => {
  console.log("url=", ctx.request.url);
  const pathname = ctx.request.url.pathname;

  // 根據不同路徑顯示對應內容
  if (pathname === "/") {
    ctx.response.body = renderHomePage(); // 使用渲染函數
  } else if (pathname === "/name") {
    ctx.response.body = "林庭意";
  } else if (pathname === "/age") {
    ctx.response.body = "22 歲";
  } else if (pathname === "/gender") {
    ctx.response.body = "女性";
  } else if (pathname === "/hobby") {
    ctx.response.body = "喜歡畫畫與閱讀";
  } else if (pathname === "/job") {
    ctx.response.body = "學生";
  } else {
    // 當路徑不存在時返回 404
    ctx.response.status = 404;
    ctx.response.body = "404 Not Found";
  }
});

console.log("start at : http://127.0.0.1:8000");
await app.listen({ port: 8000 });
