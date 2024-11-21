const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.json());

// 初始化 SQLite 資料庫
const db = new sqlite3.Database("./users.db");
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, 
        username TEXT UNIQUE, 
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY, 
        user_id INTEGER, 
        question TEXT, 
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// 註冊/登入 API
app.post("/auth", async (req, res) => {
    const { username, password } = req.body;

    // 驗證帳號與密碼格式
    if (!username || username.length < 4 || !password || password.length < 6) {
        return res
            .status(400)
            .send("Username must be at least 4 characters and password at least 6 characters.");
    }

    db.get("SELECT id, password FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) return res.status(500).send("Database error.");
        if (row) {
            // 使用者已存在，檢查密碼是否正確
            const match = await bcrypt.compare(password, row.password);
            if (match) {
                return res.json({ success: true, userId: row.id });
            } else {
                return res.status(401).send("Authentication failed!");
            }
        } else {
            // 新使用者，註冊
            const hashedPassword = await bcrypt.hash(password, 10); // 加密密碼
            db.run(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [username, hashedPassword],
                function (err) {
                    if (err) return res.status(500).send("Error creating user.");
                    res.json({ success: true, userId: this.lastID });
                }
            );
        }
    });
});

// 問答 API
app.post("/chat", (req, res) => {
    const { userId, question } = req.body;

    if (!userId || !question) {
        return res.status(400).send("User ID and question are required.");
    }

    // 模擬 AI 回應
    const answer = `This is a response to: "${question}"`;

    db.run(
        "INSERT INTO questions (user_id, question) VALUES (?, ?)",
        [userId, question],
        (err) => {
            if (err) return res.status(500).send("Error saving question.");
            res.json({ answer });
        }
    );
});

// 過往問題 API
app.get("/questions", (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).send("User ID is required.");
    }

    db.all(
        "SELECT question FROM questions WHERE user_id = ?",
        [userId],
        (err, rows) => {
            if (err) return res.status(500).send("Error fetching questions.");
            res.json(rows.map((row) => row.question));
        }
    );
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
