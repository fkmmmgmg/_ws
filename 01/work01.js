import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use((ctx) => {
  console.log('url=', ctx.request.url);
  const pathname  = ctx.request.url.pathname;

  // 根據不同路徑顯示對應內容
  if (pathname === '/') {
    ctx.response.body = `
    <html>
      <body>
        <h1>我的自我介紹</h1>
        <ol>
          <li><a href="/name">姓名</a></li>
          <li><a href="/age">年齡</a></li>
          <li><a href="/gender">性別</a></li>
          <li><a href="/hobby">愛好</a></li>
          <li><a href="/job">職業</a></li>
        </ol>
      </body>
    </html>
    `;
  } else if (pathname === '/name') {
    ctx.response.body = '林庭意';
  } else if (pathname === '/age') {
    ctx.response.body = '22 歲';
  } else if (pathname === '/gender') {
    ctx.response.body = '女性';
  } else if (pathname === '/hobby') {
    ctx.response.body = '喜歡畫畫與閱讀';
  } else if (pathname === '/job') {
    ctx.response.body = '學生';
  } else {
    // 當路徑不存在時返回 404
    ctx.response.status = 404;
    ctx.response.body = '404 Not Found';
  }
});

console.log('start at : http://127.0.0.1:8000');
await app.listen({ port: 8000 });
