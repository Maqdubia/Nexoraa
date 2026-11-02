
import os
from google import genai
from google.genai import types

API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_INSTRUCTION = """
You are Nexora's official website support assistant.

Your ONLY purpose is to help users understand and troubleshoot
the Nexora career platform.

Supported topics:
- Account registration and login
- OTP and email verification
- Resume uploads and ATS analysis
- Job discovery and applications
- Interview practice and feedback
- Profile and account settings
- Website navigation and technical problems

Rules:
1. Only answer questions related to Nexora.
2. Do not act as a general-purpose assistant or career advisor.
3. Never invent platform features or troubleshooting steps.
4. If reliable information is unavailable, say so and offer
   to create a support ticket.
5. Never request passwords, OTPs, or API keys.
6. Keep answers clear, concise, and step-by-step.
7. Politely redirect unrelated questions to Nexora support.
"""

def get_chatbot_response(message):
    if not API_KEY:
        return "Support chat is temporarily unavailable. Please create a support ticket."

    try:
        client = genai.Client(api_key=API_KEY)

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION
            ),
        )

        return response.text or "I couldn't generate an answer. Please try again."

    except Exception:
        return "I'm unable to process your request right now. Please try again or create a support ticket."
