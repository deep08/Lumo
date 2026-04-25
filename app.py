from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
import anthropic
import os
from datetime import datetime

app = Flask(__name__)

# ==============================
# CONFIGURATION — FILL THESE IN
# ==============================
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
COOK_NUMBER = os.environ.get("COOK_NUMBER", "whatsapp:+91XXXXXXXXXX")

# ==============================
# LUMO'S MEMORY (simple for now)
# We'll connect Supabase on Day 3
# ==============================
meal_history = []  # Stores confirmed meals this week

# ==============================
# LUMO'S PERSONALITY & BRAIN
# ==============================
SYSTEM_PROMPT = """
Tu Lumo hai — ek friendly meal assistant jo Indian households ko decide karne mein help karta hai ki aaj raat kya banana hai.

Tera style:
- Hinglish mein baat kar (Hindi + English mix) — jaise real log karte hain
- Short aur warm reh — ek message mein ek suggestion
- Confident reh — ek meal suggest kar, 5 options mat de
- Friendly tone — jaise ek close friend suggest kar raha ho

Jab user message kare:
1. Ek dinner suggest kar based on:
   - Is week kya already ban chuka hai (history dekh)
   - Weekday hai toh light aur quick meal prefer kar
   - Weekend hai toh thoda elaborate suggest kar sakta hai
   - Season aur common Indian ingredients dhyan mein rakh

2. Format hamesha aisa ho:
   "Aaj raat ke liye: [MEAL NAME] 🍽️
   [Ek line reason — why this meal]
   
   Banani hai? Yes bolo ya kuch aur chahiye toh batao!"

3. Agar user "yes" bole:
   - Recipe steps Hinglish mein do (cook ke liye simple)
   - Format: "Perfect! Yeh steps Priya ko bhej raha hoon:
     1. [step]
     2. [step]
     3. [step]"

4. Agar user "no" ya "kuch aur" bole:
   - Ek alag suggestion do, same format mein

5. Agar user preferences bataye jaise "aaj light khaana chahiye" ya "no paneer":
   - Us hisaab se suggest kar

Is week ki history: {meal_history}
Aaj ka din: {day_of_week}
"""

# ==============================
# CONVERSATION MEMORY
# ==============================
conversations = {}  # Stores chat history per user

def get_ai_response(user_message, user_number):
    """Send message to Claude and get Lumo's response"""
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    # Get or create conversation history for this user
    if user_number not in conversations:
        conversations[user_number] = []
    
    # Add user message to history
    conversations[user_number].append({
        "role": "user",
        "content": user_message
    })
    
    # Keep only last 10 messages to save tokens
    recent_history = conversations[user_number][-10:]
    
    # Build system prompt with current context
    system = SYSTEM_PROMPT.format(
        meal_history=meal_history if meal_history else "Abhi tak kuch confirm nahi hua",
        day_of_week=datetime.now().strftime("%A")
    )
    
    # Call Claude API
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        system=system,
        messages=recent_history
    )
    
    ai_reply = response.content[0].text
    
    # Add AI response to history
    conversations[user_number].append({
        "role": "assistant",
        "content": ai_reply
    })
    
    # If user said yes — save meal to history
    if any(word in user_message.lower() for word in ["yes", "haan", "ha", "theek", "okay", "ok", "bilkul"]):
        if meal_history:
            pass  # Meal already noted, steps being sent
        print(f"✅ Meal confirmed by {user_number}")
    
    return ai_reply

def send_to_cook(recipe_text, from_number):
    """Forward recipe to cook via WhatsApp"""
    from twilio.rest import Client
    
    # You'll add your Twilio credentials here
    TWILIO_SID = "your_twilio_account_sid"
    TWILIO_TOKEN = "your_twilio_auth_token"
    TWILIO_NUMBER = "whatsapp:+14155238886"  # Your Twilio sandbox number
    
    client = Client(TWILIO_SID, TWILIO_TOKEN)
    
    cook_message = f"🍳 Lumo se recipe:\n\n{recipe_text}"
    
    client.messages.create(
        from_=TWILIO_NUMBER,
        to=COOK_NUMBER,
        body=cook_message
    )
    print(f"📤 Recipe sent to cook!")

# ==============================
# MAIN WEBHOOK — Twilio calls this
# ==============================
@app.route("/webhook", methods=["POST"])
def webhook():
    """Receives WhatsApp messages from Twilio"""
    
    # Get the incoming message
    incoming_message = request.form.get("Body", "").strip()
    user_number = request.form.get("From", "")
    
    print(f"📩 Message from {user_number}: {incoming_message}")
    
    # Get Lumo's response
    lumo_reply = get_ai_response(incoming_message, user_number)
    
    print(f"🤖 Lumo replies: {lumo_reply}")
    
    # Send reply back via Twilio
    response = MessagingResponse()
    response.message(lumo_reply)
    
    return str(response)

# ==============================
# HEALTH CHECK
# ==============================
@app.route("/", methods=["GET"])
def home():
    return "Lumo is alive! 🍽️"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
