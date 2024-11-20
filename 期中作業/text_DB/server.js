const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB 連線
mongoose.connect("mongodb://localhost:27017/chatApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema 定義
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userMessage: String,
  aiReply: String,
  timestamp: { type: Date, default: Date.now },
});

// Model 定義
const User = mongoose.model("User", userSchema);
const Chat = mongoose.model("Chat", chatSchema);

// JWT Secret
const JWT_SECRET = "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"; // 替換為更安全的密鑰

// 註冊 API
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send("User registered successfully.");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Registration failed.");
  }
});

// 登入 API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send("User not found.");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).send("Invalid credentials.");

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Login failed.");
  }
});

// 驗證 JWT Middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Access denied.");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).send("Invalid token.");
  }
}

// 儲存聊天記錄 API
app.post("/api/save-chat", authenticateToken, async (req, res) => {
  const { userMessage, aiReply } = req.body;

  try {
    const chat = new Chat({ userId: req.userId, userMessage, aiReply });
    await chat.save();
    res.status(201).send("Chat record saved.");
  } catch (error) {
    console.error("Error saving chat record:", error);
    res.status(500).send("Failed to save chat record.");
  }
});

// 獲取用戶聊天記錄 API
app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort({ timestamp: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chat records:", error);
    res.status(500).send("Failed to fetch chat records.");
  }
});

// 啟動伺服器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));