// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/chat", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const chatSchema = new mongoose.Schema({
  userMessage: String,
  aiReply: String,
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

// Save chat record
app.post("/api/save-chat", async (req, res) => {
  const { userMessage, aiReply } = req.body;
  try {
    const chat = new Chat({ userMessage, aiReply });
    await chat.save();
    res.status(201).send("Chat record saved.");
  } catch (error) {
    console.error("Error saving chat record:", error);
    res.status(500).send("Failed to save chat record.");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
