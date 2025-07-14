const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
require('dotenv').config();

// ---------- Connect to MongoDB ----------
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// ---------- Player Schema ----------
const playerSchema = new mongoose.Schema({
  name: String,
  sport: String,
  location: String,
  playType: String,
  contact: String
});
const Player = mongoose.model('Player', playerSchema);

// ---------- Conversation Schema (for learning) ----------
const conversationSchema = new mongoose.Schema({
  user_input: String,
  bot_reply: String,
  timestamp: { type: Date, default: Date.now }
});
const Conversation = mongoose.model('Conversation', conversationSchema);

// ---------- Register Player ----------
app.post('/api/register', async (req, res) => {
  try {
    const player = new Player(req.body);
    await player.save();
    res.status(200).send("Player registered");
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).send("Error saving player");
  }
});

// ---------- Save Conversation ----------
app.post('/api/conversation', async (req, res) => {
  try {
    const { user_input, bot_reply } = req.body;
    if (!user_input || !bot_reply) return res.status(400).send("Missing input or reply");

    const convo = new Conversation({ user_input, bot_reply });
    await convo.save();
    res.status(200).send("Conversation saved");
  } catch (err) {
    console.error("Conversation Error:", err);
    res.status(500).send("Error saving conversation");
  }
});

// ---------- Start Server ----------
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
