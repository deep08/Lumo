from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client as TwilioClient
import anthropic
import os
from datetime import datetime, date
from supabase import create_client

app = Flask(__name__)
conversations = {}
processed_messages = set()
# Store preferences per user
user_preferences = {}

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

def send_to_cook(recipe_text, user_number):
    """Send recipe to cook — only if cook number is set and different from user"""
    cook_number = os.environ.get("COOK_NUMBER", "")
    if not cook_number or "XXXXXXXXXX" in cook_number:
        return
    if cook_number == user_number:
        return
    try:
        client = TwilioClient(
            os.environ.get("TWILIO_SID"),
            os.environ.get("TWILIO_TOKEN")
        )
        client.messages.create(
            from_="whatsapp:+14155238886",
            to=cook_number,
            body=f"Lumo se aaj ka recipe:\n\n{recipe_text}"
        )
        print(f"Recipe sent to cook: {cook_number}")
    except Exception as e:
        print(f"Error sending to cook: {e}")

def is_yes(message):
    msg = message.lower().strip()
    yes_words = ["yes", "haan", "theek hai", "okay", "ok",
                 "bilkul", "perfect", "bana lo", "bana do", "haan ji"]
    return msg in yes_words

def is_reset(message):
    msg = message.lower().strip()
    return any(word in msg for word in ["reset", "naya shuru", "start fresh"])

def is_preference(message):
    """Detect if user is setting a preference"""
    msg = message.lower()
    preference_triggers = ["no ", "nahi ", "avoid", "mat banana", 
                          "allergic", "don't", "dont", "pasand nahi",
                          "always ", "hamesha ", "prefer", "light ",
                          "heavy nahi", "vegetarian", "vegan"]
    return any(trigger in msg for trigger in preference_triggers)

def get_ai_response(user_message, user_number):
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    if user_number not in conversations:
        conversations[user_number] = []

    # Handle reset
    if is_reset(user_message):
        conversations[user_number] = []
        return "Fresh start! 🌟 Batao aaj raat kya banana chahte ho?"

    # Handle preference setting
    if is_preference(user_message):
        if user_number not in user_preferences:
            user_preferences[user_number] = []
        user_preferences[user_number].append(user_message)
        print(f"Preference saved for {user_number}: {user_message}")

    meal_history = get_meal_history(user_number)
    preferences = user_preferences.get(user_number, [])
    preferences_text = ", ".join(preferences) if preferences else "Koi specific preference nahi"

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
- Friendly tone — jaise ek close friend

Suggestion logic:
- Is week jo already ban chuka hai woh KABHI mat suggest karo: {meal_history}
- User ki preferences hamesha follow karo: {preferences_text}
- Protein, vegetables aur carbs ka balance maintain kar across the week
- Weekday = quick aur light (30 min se kam)
- Weekend = thoda elaborate chalega
- Health benefit reason mein naturally embed kar — never say "yeh healthy hai"

Agar user preference set kare jaise "no paneer" ya "light khana chahiye":
- Acknowledge karo warmly
- Confirm karo ki yaad rakhoge
- Phir suggestion do accordingly

Format hamesha aisa ho:
"Aaj raat ke liye: [MEAL NAME] 🍽️
[Ek line reason]

Banani hai? Yes bolo ya kuch aur chahiye toh batao!"

Agar user "yes" bole TABHI recipe steps do cook ke liye. Pehle sirf suggestion do.
Agar no: ek alag suggest karo.

Aaj ka din: {datetime.now().strftime("%A")}
Is week ka meal history: {meal_history}
User preferences: {preferences_text}"""

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

    # Save meal and send to cook on exact yes
    if is_yes(user_message):
        last_suggestion = None
        for msg in reversed(conversations[user_number]):
            if msg["role"] == "assistant" and "Aaj raat ke liye:" in msg["content"]:
                last_suggestion = msg["content"]
                break
        if last_suggestion:
            meal_name = extract_meal_name(last_suggestion)
            save_meal(user_number, meal_name)
            send_to_cook(ai_reply, user_number)
            print(f"Meal confirmed: {meal_name}")

    return ai_reply

@app.route("/webhook", methods=["POST"])
def webhook():
    incoming_message = request.form.get("Body", "").strip()
    user_number = request.form.get("From", "")
    message_sid = request.form.get("MessageSid", "")

    print(f"Received: {message_sid} from {user_number}: {incoming_message}")

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
