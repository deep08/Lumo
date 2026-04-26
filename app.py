from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
import anthropic
import os
from datetime import datetime, date
from supabase import create_client, Client

app = Flask(__name__)

# ==============================
# CONFIGURATION
# ==============================
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
TWILIO_SID = os.environ.get("TWILIO_SID")
TWILIO_TOKEN = os.environ.get("TWILIO_TOKEN")
TWILIO_NUMBER = "whatsapp:+14155238886"
COOK_NUMBER = os.environ.get("COOK_NUMBER")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# ==============================
# SUPABASE CLIENT
# ==============================
def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

# ==============================
# CONVERSATION MEMORY
# ==============================
conversations = {}

# ==============================
# GET THIS WEEK'S MEALS FROM DB
# ==============================
def get_meal_history(user_number):
    """Get meals cooked this week for this user"""
    try:
        today = date.today()
        week_start = today.strftime("%Y-%m-%d")

        result = get_supabase.table("meals")\
            .select("meal_name, cooked_date")\
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

# ==============================
# SAVE CONFIRMED MEAL TO DB
# ==============================
def save_meal(user_number, meal_name):
    """Save confirmed meal to Supabase"""
    try:
        get_supabase.table("meals").insert({
            "user_number": user_number,
            "meal_name": meal_name,
            "cooked_date": date.today().strftime("%Y-%m-%d"),
            "accepted": True
        }).execute()
        print(f"Saved meal: {meal_name} for {user_number}")
    except Exception as e:
        print(f"Error saving meal: {e}")

# ==============================
# EXTRACT MEAL NAME FROM AI REPLY
# ==============================
def extract_meal_name(ai_reply):
    """Extract meal name from Lumo's suggestion"""
    try:
        if "Aaj raat ke liye:" in ai_reply:
            part = ai_reply.split("Aaj raat ke liye:")[1]
            meal = part.split("🍽️")[0].strip()
            return meal
        return "Unknown meal"
    except:
        return "Unknown meal"

# ==============================
# LUMO'S AI BRAIN
# ==============================
def get_ai_response(user_message, user_number):
    """Send message to Claude and get Lumo's response"""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    if user_number not in conversations:
        conversations[user_number] = []

    meal_history = get_meal_history(user_number)

    conversations[user_number].append({
        "role": "user",
        "content": user_message
    })

    recent_history = conversations[user_number][-10:]

    system = f"""Tu Lumo hai — ek friendly meal assistant jo Indian households ko decide karne mein help karta hai ki aaj raat kya banana hai.

Tera core goal: Healthy eating ko easiest choice banana — bina health lecture diye. Balanced meals suggest kar jo tasty bhi ho aur nutritious bhi, lekin kabhi "yeh healthy hai" mat bol. Bas naturally suggest kar.

Tera style:
- Hinglish mein baat kar — jaise real log karte hain
- Short aur warm reh
- Confident reh — ek meal suggest kar, 5 options mat de
- Friendly tone — jaise ek close friend suggest kar raha ho

Suggestion logic:
- Is week jo already ban chuka hai woh KABHI mat suggest karo: {meal_history}
- Protein, vegetables aur carbs ka balance maintain kar across the week
- Weekday = quick aur light (30 min se kam)
- Weekend = thoda elaborate chalega
- Heavy meal ke baad light suggest kar
- Health benefit reason mein naturally embed kar — jaise "palak dal light hai aur energy deta hai" — never say "yeh healthy hai"

Jab user message kare:
Ek dinner suggest kar is format mein:
"Aaj raat ke liye: [MEAL NAME] 🍽️
[Ek line reason — why this meal, with natural health benefit]

Banani hai? Yes bolo ya kuch aur chahiye toh batao!"

Agar user "yes" bole:
"Perfect! Yeh steps cook ke liye bhej raha hoon:
1. [step]
2. [step]
3. [step]
4. [step]

Kal ke liye bhi soch ke rakhunga! 😊"

Agar user "no" ya "kuch aur" bole:
Ek alag suggestion do — different protein aur vegetables ke saath.

Agar user mood/energy bataye jaise "thak gayi hoon" ya "kuch light chahiye":
Us hisaab se suggest kar — tiredness ke liye fastest meal.

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

    yes_words = ["yes", "haan", "ha", "theek", "okay", "ok",
                 "bilkul", "haan ji", "perfect", "bana lo", "bana do"]
    if any(word in user_message.lower() for word in yes_words):
        for msg in reversed(conversations[user_number]):
            if msg["role"] == "assistant" and "Aaj raat ke liye:" in msg["content"]:
                meal_name = extract_meal_name(msg["content"])
                save_meal(user_number, meal_name)
                send_to_cook(ai_reply, user_number)
                break

    return ai_reply

# ==============================
# SEND RECIPE TO COOK
# ==============================
def send_to_cook(recipe_text, from_number):
    """Forward recipe to cook via WhatsApp"""
    if not COOK_NUMBER or COOK_NUMBER == "whatsapp:+91XXXXXXXXXX":
        print("Cook number not set")
        return

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        cook_message = f"Lumo se aaj ka recipe:\n\n{recipe_text}"
        client.messages.create(
            from_=TWILIO_NUMBER,
            to=COOK_NUMBER,
            body=cook_message
        )
        print(f"Recipe sent to cook!")
    except Exception as e:
        print(f"Error sending to cook: {e}")

# ==============================
# MAIN WEBHOOK
# ==============================
@app.route("/webhook", methods=["POST"])
def webhook():
    incoming_message = request.form.get("Body", "").strip()
    user_number = request.form.get("From", "")

    print(f"Message from {user_number}: {incoming_message}")

    lumo_reply = get_ai_response(incoming_message, user_number)

    print(f"Lumo replies: {lumo_reply}")

    response = MessagingResponse()
    response.message(lumo_reply)

    return str(response)

# ==============================
# HEALTH CHECK
# ==============================
@app.route("/", methods=["GET"])
def home():
    return "Lumo is alive!"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
