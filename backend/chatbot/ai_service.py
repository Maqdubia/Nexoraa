import os
import logging

from groq import Groq
from google import genai
from google.genai import types


logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GROQ_MODEL = "openai/gpt-oss-20b"
GEMINI_MODEL = "gemini-3.8-flash"


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
4. If reliable information is unavailable, offer a support ticket.
5. Never request passwords, OTPs, or API keys.
6. Keep answers clear, concise, and step-by-step.
7. Politely redirect unrelated questions to Nexora support.
"""


def generate_groq_response(message):

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    client = Groq(
        api_key=GROQ_API_KEY,
        timeout=12.0,
        max_retries=0,
    )

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_INSTRUCTION,
            },
            {
                "role": "user",
                "content": message,
            },
        ],
        max_completion_tokens=512,
        reasoning_effort="low",
    )

    answer = response.choices[0].message.content

    if not answer:
        raise RuntimeError("Groq returned an empty response.")

    return answer.strip()


def generate_gemini_response(message):

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=10000,
            retry_options=types.HttpRetryOptions(
                attempts=1,
            ),
        ),
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            max_output_tokens=512,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return response.text


def get_chatbot_response(message):

    if GROQ_API_KEY:
        try:
            logger.info("Trying Groq as primary chatbot provider.")
            return generate_groq_response(message)

        except Exception:
            logger.exception(
                "Groq failed. Switching to Gemini."
            )

    if GEMINI_API_KEY:
        try:
            logger.info("Trying Gemini as backup chatbot provider.")
            return generate_gemini_response(message)

        except Exception:
            logger.exception("Gemini backup failed.")

    raise RuntimeError(
        "All configured chatbot providers are unavailable."
    )
