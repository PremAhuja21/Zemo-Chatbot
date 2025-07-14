import pymongo
import json
from sklearn.feature_extraction.text import TfidfVectorizer

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["chatbot"]
collection = db["conversations"]

conversations = list(collection.find({}, {"_id": 0, "user_input": 1, "bot_reply": 1}))
cleaned = [(c["user_input"], c["bot_reply"]) for c in conversations if c.get("user_input") and c.get("bot_reply")]

if not cleaned:
    print("No valid data in MongoDB.")
    exit()

questions, answers = zip(*cleaned)
vectorizer = TfidfVectorizer().fit(questions)
vectors = vectorizer.transform(questions).toarray()

model = {
    "questions": questions,
    "answers": answers,
    "tfidf_matrix": vectors.tolist(),
    "vocab": vectorizer.vocabulary_
}

with open("learned_model.json", "w", encoding="utf-8") as f:
    json.dump(model, f, indent=2)

print("✅ Model saved to learned_model.json")
