from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv
from google import genai
import os
import uuid
import threading
import webbrowser
import time


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY was not found in your .env file."
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=API_KEY
)


# ============================================================
# MODELS
# ============================================================
#
# Nova will try these in order.
# If one is temporarily unavailable (503),
# it will automatically try the next one.
#

MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
]


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

app.secret_key = "nova-ai-secret-key"


# ============================================================
# CHAT STORAGE
# ============================================================

chat_sessions = {}


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return render_template("index.html")


# ============================================================
# CHAT
# ============================================================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "reply": "Please try sending your message again."
        }), 400


    user_message = data.get(
        "message",
        ""
    ).strip()


    if not user_message:

        return jsonify({
            "success": False,
            "reply": "Please type a message first."
        }), 400


    # --------------------------------------------------------
    # CHAT ID
    # --------------------------------------------------------

    if "chat_id" not in session:

        session["chat_id"] = str(
            uuid.uuid4()
        )


    chat_id = session["chat_id"]


    # --------------------------------------------------------
    # SEND MESSAGE
    # --------------------------------------------------------

    last_error = None


    for model in MODELS:

        try:

            print()
            print("=" * 60)
            print("Nova AI")
            print("Trying model:", model)
            print("User:", user_message)
            print("=" * 60)


            # ------------------------------------------------
            # CREATE CHAT FOR THIS MODEL
            # ------------------------------------------------

            chat_key = f"{chat_id}_{model}"


            if chat_key not in chat_sessions:

                print(
                    "Creating Gemini conversation..."
                )

                chat_sessions[chat_key] = (
                    client.chats.create(
                        model=model
                    )
                )


            chat = chat_sessions[chat_key]


            # ------------------------------------------------
            # SEND MESSAGE
            # ------------------------------------------------

            print(
                "Sending request..."
            )


            response = chat.send_message(
                message=user_message
            )


            # ------------------------------------------------
            # RESPONSE
            # ------------------------------------------------

            reply = response.text


            if reply:

                print()
                print(
                    "Gemini responded successfully! ✅"
                )
                print(
                    "Model used:",
                    model
                )
                print()


                return jsonify({
                    "success": True,
                    "reply": reply,
                    "model": model
                })


        except Exception as error:

            last_error = str(error)


            print()
            print(
                "Model failed:",
                model
            )
            print(
                "Error:",
                last_error
            )


            # ------------------------------------------------
            # TEMPORARY SERVER OVERLOAD
            # ------------------------------------------------

            if "503" in last_error:

                print(
                    "Model is temporarily unavailable."
                )

                print(
                    "Trying next model..."
                )

                time.sleep(1)

                continue


            # ------------------------------------------------
            # RATE LIMIT
            # ------------------------------------------------

            if "429" in last_error:

                print(
                    "Rate limit reached."
                )

                continue


            # ------------------------------------------------
            # OTHER ERROR
            # ------------------------------------------------

            break


    # ========================================================
    # ALL MODELS FAILED
    # ========================================================

    print()
    print("=" * 60)
    print("❌ ALL GEMINI MODELS FAILED")
    print("=" * 60)
    print(last_error)
    print("=" * 60)
    print()


    return jsonify({
        "success": False,
        "reply": (
            "Nova is temporarily unable to reach the AI service. "
            "Please try again in a moment."
        )
    }), 503


# ============================================================
# NEW CHAT
# ============================================================

@app.route("/new-chat", methods=["POST"])
def new_chat():

    old_chat_id = session.get(
        "chat_id"
    )


    if old_chat_id:

        keys_to_delete = [
            key
            for key in chat_sessions
            if key.startswith(old_chat_id)
        ]


        for key in keys_to_delete:

            chat_sessions.pop(
                key,
                None
            )


    session["chat_id"] = str(
        uuid.uuid4()
    )


    return jsonify({
        "success": True
    })


# ============================================================
# CLEAR CHAT
# ============================================================

@app.route("/clear-chat", methods=["POST"])
def clear_chat():

    old_chat_id = session.get(
        "chat_id"
    )


    if old_chat_id:

        keys_to_delete = [
            key
            for key in chat_sessions
            if key.startswith(old_chat_id)
        ]


        for key in keys_to_delete:

            chat_sessions.pop(
                key,
                None
            )


    session["chat_id"] = str(
        uuid.uuid4()
    )


    return jsonify({
        "success": True
    })


# ============================================================
# OPEN BROWSER
# ============================================================

def open_browser():

    webbrowser.open(
        "http://127.0.0.1:5000"
    )


# ============================================================
# START NOVA AI
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("             ✨ NOVA AI CHATBOT ✨")
    print("=" * 60)
    print()
    print("Starting Nova AI...")
    print()
    print("Available Gemini models:")

    for model in MODELS:

        print(
            " •",
            model
        )

    print()
    print(
        "Website: http://127.0.0.1:5000"
    )
    print()
    print(
        "Keep this terminal running."
    )
    print()
    print("=" * 60)


    threading.Timer(
        1.5,
        open_browser
    ).start()


    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )