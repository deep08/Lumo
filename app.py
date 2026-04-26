from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
import anthropic
import os
from datetime import datetime, date
from supabase import create_client

app = Flask(__name__)

# ==============================
# CONVERSATION MEMORY
# ==============================
conversations = {}

# ==============================
# SUPABASE — connect when needed
# ==============================
def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

# ==============================
# GET THIS WEEK'S MEALS FROM DB
# ==============================
def get_meal_history(user_number):
    try:
        today = date.today()
        week_start = today.strftime("%Y-%m-%d")
        db = get_supabase()
        result = db.table("meals")\
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

# ==============================
# SAVE CONFIRMED MEAL TO DB
# ==============================
def save_meal(user_number, meal_name):
    try:
        db = get_supabase()
        db.table("meals").insert({
            "user_number": user_number,
            "meal_name": meal_name,
            "cooked_date": date.today().strftime("%Y-%m-%d"),
            "accepted": True
        }).execute()
        print(f"Saved meal: {meal_name}")
    except Exception as e:
        print(f"Error saving meal: {e}")

# ==============================
# EXTRACT MEAL NAME
# ==============================
def extract_meal_name(ai_reply):
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
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    if user_number not in conversations:
        conversations[user_number] = []

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
- Health benefit naturally embed kar

Format:
"Aaj raat ke liye: [MEAL NAME] 🍽️
[Ek line reason]

Banani hai? Yes bolo ya kuch aur chahiye toh batao!"

Agar yes: recipe steps do aur "cook ke liye bhej raha hoon" kaho.
Agar no: alag suggest karo.

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
    cook_number = os.environ.get("COOK_NUMBER")
    if not cook_number or cook_number == "whatsapp:+91XXXXXXXXXX":
        return
    try:
        from twilio.rest import Client
        client = Client(
            os.environ.get("TWILIO_SID"),
            os.environ.get("TWILIO_TOKEN")
        )
        client.messages.create(
            from_="whatsapp:+14155238886",
            to=cook_number,
            body=f"Lumo se aaj ka recipe:\n\n{recipe_text}"
        )
        print("Recipe sent to cook!")
    except Exception as e:
        print(f"Error sending to cook: {e}")

# ==============================
# MAIN WEBHOOK
# ==============================
@app.route("/webhook", methods=["POST"])
def webhook():
    incoming_message = request.form.get("Body", "").strip()
    user_number = request.form.get("From", "")
    
    # Respond to Twilio immediately to prevent retries
    response = MessagingResponse()
    
    print(f"Message from {user_number}: {incoming_message}")
    lumo_reply = get_ai_response(incoming_message, user_number)
    print(f"Lumo replies: {lumo_reply}")
    
    response.message(lumo_reply)
    return str(response), 200, {"Content-Type": "text/xml"}

@app.route("/", methods=["GET"])
def home():
    return "Lumo is alive!"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
