let conversationState = null;
let playerData = {};

let loggedInUser = {
  name: "Prem Ahuja",
  email: "prem@gmail.com",
  contact: "9876543210",
  location: "Mumbai",
  previousSport: "chess"
};

let learnedModel = null;

fetch("learned_model.json")
  .then((res) => res.json())
  .then((data) => {
    learnedModel = data;
    console.log("✅ Loaded learned model");
  })
  .catch(() => {
    console.warn("⚠️ No learned model found. Fallback to TF-IDF only.");
  });

// ----------- TOURNAMENT DATA (with location, date, time) -----------
const tournamentMap = {
  football: [
    { name: "Mumbai Super League", location: "Mumbai", date: "July 15", time: "4:00 PM" },
    { name: "Delhi Football Cup", location: "Delhi", date: "July 20", time: "5:30 PM" },
    { name: "Bangalore Premier Football", location: "Bangalore", date: "July 25", time: "6:00 PM" }
  ],
  cricket: [
    { name: "Pune Cricket Bash", location: "Pune", date: "July 18", time: "10:00 AM" },
    { name: "Chennai Super Tournament", location: "Chennai", date: "July 24", time: "2:00 PM" },
    { name: "Hyderabad Smash Cup", location: "Hyderabad", date: "July 29", time: "3:00 PM" }
  ],
  badminton: [
    { name: "Ahmedabad Badminton League", location: "Ahmedabad", date: "July 12", time: "9:00 AM" },
    { name: "Indore Smash Open", location: "Indore", date: "July 19", time: "10:30 AM" },
    { name: "Lucknow Racquet Clash", location: "Lucknow", date: "July 26", time: "11:00 AM" }
  ],
  chess: [
    { name: "Nagpur Grandmasters Meet", location: "Nagpur", date: "July 11", time: "3:00 PM" },
    { name: "Kolkata Checkmate Challenge", location: "Kolkata", date: "July 17", time: "4:30 PM" },
    { name: "Delhi Mind Masters", location: "Delhi", date: "July 22", time: "5:00 PM" }
  ],
  hockey: [
    { name: "Amritsar Hockey League", location: "Amritsar", date: "July 10", time: "9:00 AM" },
    { name: "Ranchi Stick Cup", location: "Ranchi", date: "July 15", time: "11:00 AM" },
    { name: "Bhubaneswar Blasters", location: "Bhubaneswar", date: "July 23", time: "3:00 PM" }
  ],
  snooker: [
    { name: "Surat Snooker Showdown", location: "Surat", date: "July 13", time: "2:00 PM" },
    { name: "Goa Cue Championship", location: "Goa", date: "July 20", time: "4:00 PM" },
    { name: "Jaipur Pot Masters", location: "Jaipur", date: "July 27", time: "5:00 PM" }
  ],
  pickleball: [
    { name: "Mumbai Pickleball Classic", location: "Mumbai", date: "July 16", time: "1:00 PM" },
    { name: "Delhi Smashdown", location: "Delhi", date: "July 21", time: "2:30 PM" },
    { name: "Hyderabad Paddle Cup", location: "Hyderabad", date: "July 28", time: "3:30 PM" }
  ],
  basketball: [
    { name: "Bangalore DunkFest", location: "Bangalore", date: "July 14", time: "6:00 PM" },
    { name: "Kolkata Hoop Wars", location: "Kolkata", date: "July 19", time: "7:00 PM" },
    { name: "Mumbai Slam Jam", location: "Mumbai", date: "July 30", time: "5:30 PM" }
  ]
};

function formatTournaments(sport) {
  const list = tournamentMap[sport];
  return {
    text: `Here are some upcoming ${sport} tournaments:\n\n` +
      list.map(t => `📌 ${t.name}\n📍 ${t.location} | 🗓 ${t.date} | ⏰ ${t.time}`).join("\n\n"),
    buttons: list.map(t => t.name)
  };
}

// ---------------- INTENTS ----------------
const intents = [
  ,
  {
    tag: "sports",
    keywords: ["available sports", "sports list", "what games", "what sports", "games available", "sports offered", "which sports", "event list"],
    text: "We currently host football, cricket, badminton, chess, hockey, snooker, pickleball, and basketball tournaments."
  },
  {
    tag: "location",
    keywords: ["where", "location", "venue", "places", "area", "city", "district", "region", "state", "country", "tournament location", "where is the match"],
    text: "We organize tournaments across all over India."
  },
  {
    tag: "fees",
    keywords: ["fees", "entry cost", "price", "charges", "cost to enter", "registration fee", "payment", "price to join", "how much to participate"],
    text: "Entry fees range from ₹500 to ₹1500 depending on the sport."
  },
  {
    tag: "contact",
    keywords: ["contact", "support", "email", "phone", "call", "reach", "get in touch", "help desk", "query", "question", "doubts", "customer service", "helpline"],
    text: "You can contact us at support@zemo.com or call +91-9082705182."
  },
  {
    tag: "schedule",
    keywords: ["schedule", "tournament date", "event timing", "when is it", "date of match", "calendar", "starting date", "match date", "match time", "event date"],
    text: "Schedules are posted 1 week before the tournament on our website."
  },
  {
    tag: "rules",
    keywords: ["rules", "regulations", "policies", "guidelines", "rule book", "what are the rules", "match rules", "event rules", "game rules", "instructions"],
    text: "Each sport follows official rules with minor event-specific adjustments. Check our rules page for details."
  },
  {
    tag: "prizes",
    keywords: ["prizes", "rewards", "cash prize", "winning amount", "trophies", "medals", "winner prize", "what will i get", "award", "reward amount", "prize money"],
    text: "Winners get trophies, medals, and up to ₹10,000 cash prize depending on the event."
  },
  {
    tag: "team",
    keywords: ["team size", "how many players", "players in team", "number of players", "team members", "squad size", "roster", "players count", "team count", "how big is a team"],
    text: "Team size depends on the sport: 11 for football, 7–11 for cricket, etc."
  }
];

// --------------- TF-IDF HELPER FUNCTIONS ----------------
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}
function termFreq(tokens) {
  const freq = {};
  tokens.forEach(token => freq[token] = (freq[token] || 0) + 1);
  return freq;
}
function computeTF(tokens) {
  const tf = {};
  const freq = termFreq(tokens);
  const len = tokens.length;
  for (const term in freq) tf[term] = freq[term] / len;
  return tf;
}
function computeIDF(docs) {
  const idf = {};
  const totalDocs = docs.length;
  docs.forEach(doc => {
    const seen = new Set(doc);
    seen.forEach(token => idf[token] = (idf[token] || 0) + 1);
  });
  for (const token in idf) idf[token] = Math.log(totalDocs / idf[token]);
  return idf;
}
function computeTFIDF(tf, idf) {
  const tfidf = {};
  for (const term in tf) tfidf[term] = tf[term] * (idf[term] || 0);
  return tfidf;
}
function cosineSimilarity(vecA, vecB) {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  allTerms.forEach(term => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

const docs = intents.map(i => tokenize([...i.keywords, i.text].join(" ")));
const idf = computeIDF(docs);
const tfidfDocs = docs.map(doc => computeTFIDF(computeTF(doc), idf));

// --------------- MAIN BOT LOGIC ---------------
function getBotResponse(message) {
  const input = message.trim().toLowerCase();

  if (conversationState === "awaiting_suggestion_confirmation") {
    if (input === "yes") {
      playerData = { ...loggedInUser, sport: loggedInUser.previousSport };
      const sport = playerData.sport.toLowerCase();
      if (tournamentMap[sport]) {
        conversationState = "awaiting_tournament_selection";
        return formatTournaments(sport);
      } else {
        conversationState = "awaiting_type";
        return { text: "Are you playing solo or as part of a team?", buttons: ["solo", "team"] };
      }
    } else if (input === "no") {
      loggedInUser.previousSport = null;
      conversationState = null;
      return { text: "Okay, what can I help you with today?" };
    } else {
      return { text: "Please reply with 'yes' or 'no'.", buttons: ["yes", "no"] };
    }
  }

  if (conversationState === "awaiting_sport") {
    playerData.sport = input;
    if (tournamentMap[input]) {
      conversationState = "awaiting_tournament_selection";
      return formatTournaments(input);
    } else {
      return { text: "Sorry, we don't have tournaments listed for that sport. Try another one." };
    }
  }

  if (conversationState === "awaiting_tournament_selection") {
    const allTournaments = Object.values(tournamentMap).flat();
    const names = allTournaments.map(t => t.name.toLowerCase());
    const match = names.find(n => input.includes(n));
    if (!match) {
      return { text: "Please select a valid tournament from the list above." };
    }
    const fullMatch = allTournaments.find(t => t.name.toLowerCase() === match);
    playerData.tournament = fullMatch.name;
    conversationState = "awaiting_type";
    return { text: "Are you playing solo or as part of a team?", buttons: ["solo", "team"] };
  }

  if (conversationState === "awaiting_type") {
    if (input !== "solo" && input !== "team") return { text: "Please type only 'solo' or 'team'.", buttons: ["solo", "team"] };
    playerData.playType = input;
    if (playerData.contact) {
      conversationState = null;
      sendDataToBackend(playerData);
      playerData = {};
      return { text: "Thank you! Your registration has been submitted." };
    } else {
      conversationState = "awaiting_contact";
      return { text: "Please provide your phone number or email." };
    }
  }

  if (conversationState === "awaiting_contact") {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const isPhone = /^[6-9]\d{9}$/.test(input);
    if (!isEmail && !isPhone) return { text: "Please enter a valid email or 10-digit Indian phone number." };
    playerData.contact = input;
    conversationState = null;
    sendDataToBackend(playerData);
    playerData = {};
    return { text: "Thank you! Your registration has been submitted." };
  }

  if (/register|signup|join/.test(input)) {
    playerData = { ...loggedInUser };
    if (loggedInUser.previousSport) {
      conversationState = "awaiting_suggestion_confirmation";
      return {
        text: `Hi ${loggedInUser.name}! Would you like to register for the ongoing ${loggedInUser.previousSport} tournament?`,
        buttons: ["yes", "no"]
      };
    } else {
      conversationState = "awaiting_sport";
      return { text: `Hi ${loggedInUser.name}! What sport would you like to register for?` };
    }
  }

  // Multi-intent response
  const inputTokens = tokenize(message);
  const inputTF = computeTF(inputTokens);
  const inputTFIDF = computeTFIDF(inputTF, idf);
  const responses = [];

  tfidfDocs.forEach((docVec, i) => {
    const sim = cosineSimilarity(inputTFIDF, docVec);
    if (sim > 0.15) {
      responses.push({ index: i, similarity: sim, text: intents[i].text });
    }
  });

  if (responses.length > 0) {
    const seen = new Set();
    const finalResponses = responses
      .sort((a, b) => b.similarity - a.similarity)
      .filter(match => {
        const tag = intents[match.index].tag;
        if (seen.has(tag)) return false;
        seen.add(tag);
        return true;
      })
      .map(match => match.text);
    return { text: finalResponses.join(" ") };
  }

  return { text: "Sorry, I didn't understand that." };
}

// --------------- API POST ----------------
function sendDataToBackend(data) {
  fetch("http://localhost:3000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

// --------------- UI LOGIC ----------------
function sendMessage(skipUserDisplay = false) {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  if (!skipUserDisplay) {
    appendMessage("user", message);
  }

  const response = getBotResponse(message);

  setTimeout(() => {
    appendMessage("bot", response.text, response.buttons || []);

    const skipStates = ["awaiting_suggestion_confirmation", "awaiting_type"];
    if (!skipStates.includes(conversationState)) {
      fetch("http://localhost:3000/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: message, bot_reply: response.text })
      });
    }
  }, 500);

  input.value = "";
}

function appendMessage(sender, text, buttons = []) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add(sender === "bot" ? "bot-message" : "user-message");
  messageDiv.innerText = text;

  if (buttons.length > 0) {
    const btnGroup = document.createElement("div");
    buttons.forEach((btnText) => {
      const btn = document.createElement("button");
      btn.innerText = btnText;
      btn.classList.add("chat-btn");
      btn.onclick = () => {
        document.getElementById("user-input").value = btnText;
        sendMessage(true);
      };
      btnGroup.appendChild(btn);
    });
    messageDiv.appendChild(document.createElement("br"));
    messageDiv.appendChild(btnGroup);
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

window.onload = function () {
  const inputBox = document.getElementById("user-input");
  inputBox.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });

  if (loggedInUser?.previousSport) {
    const sport = loggedInUser.previousSport;
    const msg = `Hi ${loggedInUser.name}! Would you like to register for the ongoing ${sport} tournament?`;
    appendMessage("bot", msg, ["yes", "no"]);
    conversationState = "awaiting_suggestion_confirmation";
  }
};
