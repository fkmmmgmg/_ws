//引入所需的模組
import { Application, Router } from "https://deno.land/x/oak/mod.ts"; //是 Oak 框架的核心部分，用於處理 HTTP 請求和路由。
import * as render from '../05/render.js'; //渲染頁面（應該包含視圖層的內容，如註冊頁面或登入頁面等）
import { DB } from "https://deno.land/x/sqlite/mod.ts"; //用於和 SQLite 資料庫進行互動
import { Session } from "https://deno.land/x/oak_sessions/mod.ts"; //用於和 SQLite 資料庫進行互動

//建立資料庫及資料表
const db = new DB("D:/My/WebsiteDesign-2/_ws/05/blog.db"); //採用指定路徑建立一個資料庫檔案 blog.db
db.query("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, title TEXT, body TEXT)"); //表存儲帖子的 id, username, title, 和 body
db.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT)"); //表存儲用戶的 id, username, password, 和 email

const router = new Router(); //用於將路由應用到應用程式中

//定義路由
router.get('/', list) //顯示所有帖子
  .get('/signup', signupUi) //顯示註冊頁面
  .post('/signup', signup) //處理註冊表單提交
  .get('/login', loginUi) //顯示登入頁面
  .post('/login', login) //處理登入表單提交
  .get('/logout', logout) //用戶登出
  .get('/post/new', add) //顯示新建帖子的頁面
  .get('/post/:id', show) //顯示單個帖子的詳細內容
  .post('/post', create) //新增一篇帖子
   //初始化應用程序和中介軟體
const app = new Application() //創建 Oak 應用程式實例
app.use(Session.initMiddleware()) //始化會話中介軟體，用於處理會話狀態
app.use(router.routes()); //用於將路由應用到應用程式中
app.use(router.allowedMethods()); //用於將路由應用到應用程式中

//SQL 查詢輔助函數
function sqlcmd(sql, arg1) { //sqlcmd通用的 SQL 查詢函數，執行 SQL 指令並返回結果，並在控制台輸出查詢過程
  console.log('sql:', sql)  // 在控制台中打印出要執行的 SQL 語句
  try {
    var results = db.query(sql, arg1) // 使用 SQLite 的 `query` 方法來執行 SQL 語句
    console.log('sqlcmd: results=', results) // 在控制台中打印出查詢結果，讓開發者能夠檢查結果是否符合預期
    return results //返回結果
  } catch (error) { //捕捉錯誤訊息
    console.log('sqlcmd error: ', error) //會將錯誤抛出，這樣調用 sqlcmd 的代碼可以對錯誤進行處理（如顯示錯誤訊息或回滾事務）
    throw error //會將錯誤抛出，這樣調用 sqlcmd 的代碼可以對錯誤進行處理（如顯示錯誤訊息或回滾事務）
  }
}
//sql: 這是 SQL 語句，可能是一個 SELECT, INSERT, UPDATE, DELETE 或其他 SQL 操作語句。
//arg1: 這是 SQL 語句中的參數，用於處理佔位符 ? 的情況，例如 INSERT INTO users (username, password) VALUES (?, ?)。這樣的方式防止 SQL 注入攻擊。


function postQuery(sql) { //查詢 posts 的函數，將查詢結果存入列表並返回
  let list = [] //初始化空陣列
  for (const [id, username, title, body] of sqlcmd(sql)) { // 從 sqlcmd 函數中獲取每一條記錄
    //for (const [id, username, title, body] of sqlcmd(sql))這是一個迴圈，用來遍歷 sqlcmd 函數返回的每一條查詢記錄。假設 sqlcmd(sql) 返回的結果是數據庫中每一個 post 的記錄，記錄的欄位按照 id, username, title, body 這四個屬性排列。
    list.push({id, username, title, body}) //將每一條記錄的屬性存入列表中，形成一個對象
  }
  console.log('postQuery: list=', list) // 打印完整的結果列表
  return list // 返回查詢到的所有記錄組成的列表
}

function userQuery(sql) { //查詢  users 表的函數，將查詢結果存入列表並返回
  let list = []
  for (const [id, username, password, email] of sqlcmd(sql)) { // sqlcmd 函數執行傳入的 SQL 查詢，並返回查詢結果。
    list.push({id, username, password, email})
  }
  console.log('userQuery: list=', list) // 打印完整的結果列表
  return list // 返回查詢到的所有記錄組成的列表
}

//表單解析輔助函數
async function parseFormBody(body) {
  const pairs = await body.form()
  //使用 await 等待 body.form() 的執行結果，這個方法是 Deno 的一部分，用於解析請求體中的表單數據
  //返回一個 Promise，解析後結果是表單數據的鍵值對（key-value pairs）。這些鍵值對通常是以 FormData 形式返回的，包含用戶在表單中輸入的所有數據。
  const obj = {} ////初始化一個空對象 obj，用來存儲解析出的表單數據。最終，這個對象將包含所有表單欄位的名稱作為鍵（key），對應的輸入值作為值（value）
  for (const [key, value] of pairs) { 
    obj[key] = value //key 代表表單欄位的名稱（例如：username, email），value 代表用戶在該欄位中輸入的值。
    //例如，如果表單中有欄位 username 和 email，那麼 obj 最終會是 { username: '用戶名', email: '用戶郵箱' }
  }
  return obj ////返回最終生成的 obj 對象
}

//註冊與登入相關的業務邏輯
//顯示註冊頁面
async function signupUi(ctx) {
  ctx.response.body = await render.signupUi(); ////使用 render.signupUi() 渲染
}
//ctx 是用於處理請求的上下文對象，包含請求和響應的相關信息
//ctx.response.body 是用於設置響應內容的屬性，將生成的內容發送回客戶端。這使得在處理 HTTP 請求時，可以靈活地返回所需的響應內容


async function signup(ctx) { //檢查用戶名是否已存在。如果不存在則插入新用戶數據，否則返回註冊失敗提示
  const body = ctx.request.body //從 ctx 中提取請求的 body，這通常包含用戶提交的表單數據。body 是一個用於訪問請求內容的對象
  if (body.type() === "form") { //檢查 body 的類型是否為 "form"，即確認用戶是否通過表單提交了數據。如果是表單數據，則執行下一步
    var user = await parseFormBody(body) //調用 parseFormBody 函數來解析表單數據，並等待其結果。這將返回一個對象 user，其中包含用戶在表單中輸入的數據（如用戶名、密碼和電子郵件等）
    console.log('user=', user) //將解析出的用戶對象輸出到控制台，以便在開發過程中進行調試和檢查
    var dbUsers = userQuery(`SELECT id, username, password, email FROM users WHERE username='${user.username}'`)
    console.log('dbUsers=', dbUsers) //使用 userQuery 函數查詢數據庫，以檢查用戶名是否已存在。這裡使用了一個 SQL 查詢，選取所有用戶名為 user.username 的用戶記錄。如果查詢返回的結果不為空，則表示該用戶名已存在
    if (dbUsers.length === 0) { //檢查 dbUsers 的長度。如果 dbUsers 長度為 0，則表示沒有找到任何用戶，即用戶名尚未被註冊
      sqlcmd("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [user.username, user.password, user.email]);
      ctx.response.body = render.success() //表示用戶已成功註冊
    } else 
      ctx.response.body = render.fail() //內容為註冊失敗的響應，這通常是一個錯誤提示，告訴用戶該用戶名已被使用
  }
}

async function loginUi(ctx) { //顯示登入頁面
  ctx.response.body = await render.loginUi(); //渲染
}

async function login(ctx) { //login 處理用戶登入邏輯，檢查用戶名和密碼是否匹配。如果成功，將用戶資訊存入會話狀態，並重定向至首頁
  const body = ctx.request.body
  if (body.type() === "form") {
    var user = await parseFormBody(body) //使用 parseFormBody(body) 函數解析表單數據，並等待其完成，返回一個包含用戶名和密碼的對象 user
    var dbUsers = userQuery(`SELECT id, username, password, email FROM users WHERE username='${user.username}'`) // userMap[user.username]執行 SQL 查詢，檢查數據庫中是否存在該用戶名，並返回與該用戶名相關的用戶信息
    var dbUser = dbUsers[0] //取出第一個符合條件的用戶數據，賦值給 dbUser
    if (dbUser.password === user.password) { //檢查數據庫中的用戶密碼是否與表單中提交的密碼匹配。如果匹配，說明登錄成功
      ctx.state.session.set('user', user) //將當前登錄的用戶信息保存到會話狀態（session）中
      console.log('session.user=', await ctx.state.session.get('user')) //調試輸出當前會話中的用戶信息
      ctx.response.redirect('/'); //重定向到首頁
    } else {
      ctx.response.body = render.fail() //如果密碼不匹配，則返回失敗的提示信息
    }
  }
}

async function logout(ctx) { //logout 用於登出，清空會話中的用戶資料並重定向到首頁
   ctx.state.session.set('user', null) //將會話中的用戶信息清空，表示用戶已經登出
   ctx.response.redirect('/') //登出後，重定向用戶到首頁
}

async function list(ctx) { //定義 list 函數，用於列出所有帖子
  let posts = postQuery("SELECT id, username, title, body FROM posts") //使用 postQuery 函數從數據庫中查詢所有帖子，返回結果
  console.log('list:posts=', posts) //輸出帖子列表以供調試
  ctx.response.body = await render.list(posts, await ctx.state.session.get('user')); //調用渲染函數，將帖子列表和當前會話中的用戶信息作為參數，生成頁面並返回給客戶端
}

async function add(ctx) { //定義 add 函數，用於顯示新增帖子表單
  var user = await ctx.state.session.get('user') //從會話中獲取當前登錄的用戶
  if (user != null) { //檢查用戶是否已登錄。如果已登錄，顯示新增帖子表單
    ctx.response.body = await render.newPost(); //渲染新增帖子表單頁面
  } else {
    ctx.response.body = render.fail() //用戶未登錄，則返回失敗提示
  }
}


//貼文顯示與添加
async function show(ctx) { //顯示特定帖子的內容
  const pid = ctx.params.id; //從 URL 參數中提取帖子的 ID
  let posts = postQuery(`SELECT id, username, title, body FROM posts WHERE id=${pid}`) //SQL 查詢從數據庫中獲取對應 ID 的帖子
  let post = posts[0] //取出查詢結果中的第一條數據，即該帖子
  console.log('show:post=', post) //輸出該帖子的詳細信息以供調試
  if (!post) ctx.throw(404, 'invalid post id'); //沒找到，拋出 404 錯誤，表示該帖子 ID 無效
  ctx.response.body = await render.show(post); //渲染帖子詳細頁面
}

async function create(ctx) { //定義 create 函數，用於創建新帖子
  const body = ctx.request.body //從請求中提取表單數據
  if (body.type() === "form") { //檢查請求體是否是表單數據
    var post = await parseFormBody(body) //返回帖子內容
    console.log('create:post=', post) //輸出新帖子的內容以供調試
    var user = await ctx.state.session.get('user') //獲取當前登錄的用戶信息
    if (user != null) { //如果用戶已登錄，則執行下一步
      console.log('user=', user) //輸出當前用戶信息
      sqlcmd("INSERT INTO posts (username, title, body) VALUES (?, ?, ?)", [user.username, post.title, post.body]);
      //執行 SQL 插入語句，將新帖子的內容存入數據庫
    } else {
      ctx.throw(404, 'not login yet!');
    }
    ctx.response.redirect('/'); //帖子創建完成後，重定向到首頁
  }
}

console.log('Server run at http://127.0.0.1:8000')
await app.listen({ port: 8000 });
//輸出服務器運行信息，並讓應用在 8000 端口上監聽請求