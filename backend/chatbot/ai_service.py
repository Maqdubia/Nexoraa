
import os
import google.generativeai as genai

API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)

SYSTEM_INSTRUCTION = """
You are Nexora's official website support assistant.

Your purpose is ONLY to help users understand and troubleshoot
the Nexora career platform.

You can help with:
- Account registration and login
- OTP and email verification
- Resume uploads and ATS analysis
- Job discovery and applications
- AI interview practice and feedback
- Profile and account settings
- Website navigation and technical problems

Rules:
1. Only answer questions related to Nexora.
2. Do not act as a general-purpose assistant or career advisor.
3. Never invent features, buttons, settings, or troubleshooting steps.
4. If you do not know the answer, say so honestly and offer
   to create a support ticket.
5. Never request passwords, OTPs, or API keys.
6. Keep instructions clear and easy to follow.
7. Politely redirect unrelated questions to Nexora support.

Answer the user's Nexora-related question using only
reliable information provided in the conversation.
"""

def get_chatbot_response(message):
    if not API_KEY:
        return "Support chat is temporarily unavailable. Please create a support ticket."

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_INSTRUCTION,
        )

        response = model.generate_content(message)
        return response.text

    except Exception:
        return "I'm unable to process your request right now. Please try again or create a support ticket."
