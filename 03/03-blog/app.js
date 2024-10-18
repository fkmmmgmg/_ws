import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as render from './render.js'
import { DB } from "https://deno.land/x/sqlite/mod.ts";

const db = new DB("D:/My/WebsiteDesign-2/_ws/03/03-blog/sql.db");
db.query(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    user TEXT, 
    title TEXT, 
    body TEXT, 
    created_at TEXT
  )
`);
// 以 user 作為鍵，為每個用戶儲存貼文列表
const posts = {
  ccc: [],
  snoopy: []
};

/*// 插入每個用戶的貼文
for (const user in posts) {
  const userPosts = posts[user];
  
  userPosts.forEach(post => {
    const createdAt = post.created_at.toISOString();
    
    db.query("INSERT INTO posts (user, title, body, created_at) VALUES (?, ?, ?, ?)", 
      [user, post.title, post.body, createdAt]);
  });
}*/

const router = new Router();

router
  .get('/', userList) // 根據不同用戶顯示貼文列表
  .get('/:user/', list) // 根據不同用戶顯示貼文列表
  .get('/:user/post/new', add) // 顯示新增貼文的表單
  .get('/:user/post/:id', show) // 顯示特定 id 的貼文
  .post('/:user/post', create); // 提交新貼文

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

// 顯示某個用戶的貼文列表
async function userList(ctx) {
  const users = Object.keys(posts);
  ctx.response.body = await render.userList(users);
}

/*function query(sql) {
  let list = []
  for (const [id, title, body] of db.query(sql)) {
    list.push({id, title, body})
  }
  return list
}*/

/*async function list(ctx) {
  let posts = query("SELECT id, title, body FROM posts")
  console.log('list:posts=', posts)
  ctx.response.body = await render.list(posts);
}*/

// 顯示特定用戶的貼文
/*async function list(ctx) {
  const user = ctx.params.user;

  // 從數據庫查詢該用戶的貼文
  const userPosts = query(`SELECT id, title, body, created_at FROM posts WHERE user=?`, [user]);

  // 如果沒有查詢到任何貼文，將用戶的貼文初始化為空陣列
  const posts = userPosts.length > 0 ? userPosts : [];

  // 傳遞用戶名和貼文列表給渲染函數
  ctx.response.body = await render.list(user,posts);
}*/


/*async function list(ctx) {
  const user = ctx.params.user; // 取得路由參數中的 user
  console.log('user=', user)
  console.log('posts[user]=', posts[user])
  if (!posts[user]) {
    posts[user] = []; // 若用戶的貼文列表不存在，則初始化為空陣列
  }
  console.log('posts[user]=', posts[user])
  ctx.response.body = await render.list(user, posts[user]); // 顯示該用戶的貼文
}*/

async function list(ctx) {
  const user = ctx.params.user;

  // 從資料庫查詢該用戶的貼文
  const posts = [...db.query("SELECT id, title, body, created_at FROM posts WHERE user=?", [user])].map(([id, title, body, created_at]) => ({ id, title, body, created_at }));

  ctx.response.body = await render.list(user, posts); // 顯示該用戶的貼文
}

/*async function add(ctx) {
  const user = ctx.params.user; // 取得路由中的 user
  console.log('add:user=', user);

  // 確認用戶存在於數據庫（可選）
  const userExists = db.query(`SELECT COUNT(*) FROM posts WHERE user=?`, [user])[0][0] > 0;

  if (!userExists) {
    ctx.throw(404, 'User not found'); // 如果用戶不存在，拋出 404 錯誤
  }

  ctx.response.body = await render.newPost(); // 顯示新增貼文表單
}*/

async function add(ctx) {
  const user = ctx.params.user; // 取得路由中的 user
  console.log('add:user=', user)
  ctx.response.body = await render.newPost(user); // 顯示新增貼文表單
}

/*async function show(ctx) {
  const pid = ctx.params.id;
  let posts = query(`SELECT id, title, body FROM posts WHERE id=${pid}`)
  let post = posts[0]
  console.log('show:post=', post)
  if (!post) ctx.throw(404, 'invalid post id');
  ctx.response.body = await render.show(post);
}*/

/*async function create(ctx) {
  const body = ctx.request.body
  if (body.type() === "form") {
    const pairs = await body.form()
    const post = {}
    for (const [key, value] of pairs) {
      post[key] = value
    }
    console.log('create:post=', post)
    db.query("INSERT INTO posts (title, body) VALUES (?, ?)", [post.title, post.body]);
    ctx.response.redirect('/');
  }
}*/

/*// 處理新增貼文的表單提交
async function create(ctx) {
  const body = await ctx.request.body().value;
  const user = ctx.params.user;
  const { title, body: postBody } = body;

  // 插入新貼文到數據庫
  db.query("INSERT INTO posts (user, title, body, created_at) VALUES (?, ?, ?, ?)", 
    [user, title, postBody, new Date().toISOString()]);

  // 重定向到用戶的貼文列表
  ctx.response.redirect(`/${user}/`);
}*/

/*async function show(ctx) {
  const user = ctx.params.user; // 取得路由中的 user
  const id = ctx.params.id; // 取得路由中的 id

  // 從數據庫查詢特定用戶和特定 id 的貼文
  const post = db.query(`SELECT id, title, body FROM posts WHERE user=? AND id=?`, [user, id])[0];

  if (!post || post.length === 0) {
    ctx.throw(404, 'invalid post id'); // 若找不到貼文，拋出 404 錯誤
  }

  ctx.response.body = await render.show(post[0]); // 顯示貼文內容
}*/

/*async function show(ctx) {
  const user = ctx.params.user; // 取得路由中的 user
  const id = ctx.params.id; // 取得路由中的 id
  const userPosts = posts[user]; // 獲取該用戶的貼文列表
  const post = userPosts ? userPosts[id] : null; // 找到對應 id 的貼文
  if (!post) ctx.throw(404, 'invalid post id'); // 若找不到貼文，拋出 404 錯誤
  ctx.response.body = await render.show(user, post); // 顯示貼文內容
}*/

async function show(ctx) {
  const user = ctx.params.user;
  const id = ctx.params.id;

  // 從資料庫查詢該用戶特定 id 的貼文
  const post = db.query("SELECT id, title, body, created_at FROM posts WHERE user=? AND id=?", [user, id])[0];

  if (!post) {
    ctx.throw(404, 'Post not found');
  }

  const [postId, title, body, createdAt] = post;
  ctx.response.body = await render.show({ id: postId, title, body, created_at: createdAt });
}


/*// 提交新貼文
async function create(ctx) {
  const user = ctx.params.user; // 取得路由中的 user
  const body = ctx.request.body;

  if (body.type() === "form") {
    const pairs = await body.form(); // 解析表單數據
    const post = {};
    
    for (const [key, value] of pairs) {
      post[key] = value; // 將表單數據填入貼文物件
    }

    post.created_at = new Date().toISOString(); // 設定貼文的建立時間
    console.log('post=', post);

    // 插入新貼文到數據庫
    db.query("INSERT INTO posts (user, title, body, created_at) VALUES (?, ?, ?, ?)", 
      [user, post.title, post.body, post.created_at]);

    ctx.response.redirect(`/${user}/`); // 新增貼文後重定向回該用戶的首頁
  }
}*/

// 提交新貼文
async function create(ctx) {
  const user = ctx.params.user; // 取得路由中的 user
  const body = ctx.request.body;
  if (body.type() === "form") {
    const pairs = await body.form(); // 解析表單數據
    const post = {};
    for (const [key, value] of pairs) {
      post[key] = value; // 將表單數據填入貼文物件
    }
    /*console.log('post=', post);
    if (!posts[user]) {
      posts[user] = []; // 若用戶的貼文列表不存在，則初始化為空陣列
    }
    const id = posts[user].push(post) - 1; // 新增貼文到該用戶的貼文列表
    post.created_at = new Date(); // 設定貼文的建立時間
    post.id = id; // 設定貼文的 id*/

    const createdAt = new Date().toISOString(); // 設定貼文的建立時間
    console.log('create:post=', post);

    // 將貼文插入到 SQLite 資料庫中
    db.query("INSERT INTO posts (user, title, body, created_at) VALUES (?, ?, ?, ?)", 
      [user, post.title, post.body, createdAt]);

    ctx.response.redirect(`/${user}/`); // 新增貼文後重定向回該用戶的首頁
  }
}



console.log('Server run at http://127.0.0.1:8001')
await app.listen({ port: 8001 });