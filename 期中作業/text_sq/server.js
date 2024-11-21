// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// 初始化 SQLite 資料庫
const db = new sqlite3.Database("./users.db");
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, user_id INTEGER, question TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
});

// 註冊/登入 API
app.post("/auth", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT id FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (row) {
            res.json({ success: true, userId: row.id });
        } else {
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function (err) {
                if (err) return res.status(500).send("Error creating user.");
                res.json({ success: true, userId: this.lastID });
            });
        }
    });
});

// 問答 API
app.post("/chat", (req, res) => {
    const { question } = req.body;
    // 模擬 AI 回應
    const answer = `This is a response to: "${question}"`;
    db.run("INSERT INTO questions (user_id, question) VALUES (?, ?)", [1, question]); // 假設 user_id = 1
    res.json({ answer });
});

// 過往問題 API
app.get("/questions", (req, res) => {
    db.all("SELECT question FROM questions WHERE user_id = ?", [1], (err, rows) => { // 假設 user_id = 1
        if (err) return res.status(500).send("Error fetching questions.");
        res.json(rows.map((row) => row.question));
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
