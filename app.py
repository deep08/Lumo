from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
import anthropic
import os
from datetime import datetime, date
from supabase import create_client

app = Flask(__name__)
conversations = {}
processed_messages = set()

def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

def get_meal_history(user_number):
    try:
        today = date.today()
        week_start = today.strftime("%Y-%m-%d")
        db = get_supabase()
        result = db.table("Meals")\
            .select("meal_name")\
            .eq("user_number", user_number)\
            .eq("accepted", True)\
            .gte("cooked_date", week_start)\
            .execute()
        if result.data:
            meals = [row["meal_name"] for row in result.data]
            return ", ".join(meals)
        return "Abhi tak kuch nahi"
    except Exception as e:
        print(f"Error getting meal history: {e}")
        return "Abhi tak kuch nahi"

def save_meal(user_number, meal_name):
    try:
        db = get_supabase()
        db.table("Meals").insert({
            "user_number": user_number,
            "meal_name": meal_name,
            "cooked_date": date.today().strftime("%Y-%m-%d"),
            "accepted": True
        }).execute()
        print(f"Saved meal: {meal_name}")
    except Exception as e:
        print(f"Error saving meal: {e}")

def extract_meal_name(ai_reply):
    try:
        if "Aaj raat ke liye:" in ai_reply:
            part = ai_reply.split("Aaj raat ke liye:")[1]
            meal = part.split("🍽️")[0].strip()
            return meal
        return "Unknown meal"
    except:
        return "Unknown meal"

def is_yes(message):
    """Strict yes detection — exact word match only"""
    msg = message.lower().strip()
    yes_words = ["yes", "haan", "theek hai", "okay", "ok",
                 "bilkul", "perfect", "bana lo", "bana do", "haan ji"]
    return msg in yes_words

def is_reset(message):
    """Detect reset request"""
    msg = message.lower().strip()
    return any(word in msg for word in ["reset", "naya shuru", "start fresh"])

def get_ai_response(user_message, user_number):
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    if user_number not in conversations:
        conversations[user_number] = []

    # Handle reset
    if is_reset(user_message):
        conversations[user_number] = []
        return "Fresh start! 🌟 Batao aaj raat kya banana chahte ho?"

    meal_history = get_meal_history(user_number)

    conversations[user_number].append({
        "role": "user",
        "content": user_message
    })

    recent_history = conversations[user_number][-10:]

    system = f"""Tu Lumo hai — ek friendly meal assistant jo Indian households ko decide karne mein help karta hai ki aaj raat kya banana hai.

Tera core goal: Healthy eating ko easiest choice banana — bina health lecture diye. Balanced meals suggest kar jo tasty bhi ho aur nutritious bhi, lekin kabhi "yeh healthy hai" mat bol.

Tera style:
- Hinglish mein baat kar
- Short aur warm reh
- Ek meal suggest kar, 5 options mat de
- Friendly tone

Suggestion logic:
- Is week jo already ban chuka hai woh KABHI mat suggest karo: {meal_history}
- Protein, vegetables aur carbs ka balance maintain kar
- Weekday = quick aur light
- Weekend = thoda elaborate
- Health benefit naturally embed kar reason mein

Format hamesha aisa ho:
"Aaj raat ke liye: [MEAL NAME] 🍽️
[Ek line reason]

Banani hai? Yes bolo ya kuch aur chahiye toh batao!"

Agar user "yes" bole TABHI recipe steps do. Pehle sirf suggestion do aur wait karo.
Agar no: ek alag suggest karo.

Aaj ka din: {datetime.now().strftime("%A")}
Is week ka meal history: {meal_history}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        system=system,
        messages=recent_history
    )

    ai_reply = response.content[0].text

    conversations[user_number].append({
        "role": "assistant",
        "content": ai_reply
    })

    # Save meal only on exact yes
    if is_yes(user_message):
        last_suggestion = None
        for msg in reversed(conversations[user_number]):
            if msg["role"] == "assistant" and "Aaj raat ke liye:" in msg["content"]:
                last_suggestion = msg["content"]
                break
        if last_suggestion:
            meal_name = extract_meal_name(last_suggestion)
            save_meal(user_number, meal_name)
            print(f"Meal confirmed: {meal_name}")

    return ai_reply

@app.route("/webhook", methods=["POST"])
def webhook():
    incoming_message = request.form.get("Body", "").strip()
    user_number = request.form.get("From", "")
    message_sid = request.form.get("MessageSid", "")

    print(f"Received: {message_sid} from {user_number}: {incoming_message}")

    # Deduplicate
    if message_sid in processed_messages:
        print(f"Duplicate ignored: {message_sid}")
        resp = MessagingResponse()
        return str(resp)

    processed_messages.add(message_sid)
    if len(processed_messages) > 100:
        processed_messages.clear()

    lumo_reply = get_ai_response(incoming_message, user_number)
    print(f"Lumo replies: {lumo_reply}")

    resp = MessagingResponse()
    resp.message(lumo_reply)
    return str(resp)

@app.route("/", methods=["GET"])
def home():
    return "Lumo is alive!"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
