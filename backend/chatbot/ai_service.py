import os
import logging

from google import genai
from google.genai import errors, types
from groq import Groq


logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

PRIMARY_MODEL = "gemini-3.8-flash"
FALLBACK_MODEL = "gemini-3.5-flash-lite"
GROQ_MODEL = "llama-3.1-8b-instant"


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
6. Keep answers clear and concise.
7. Politely redirect unrelated questions to Nexora support.
"""


def generate_gemini_response(client, model, message):

    response = client.models.generate_content(
        model=model,
        contents=message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            max_output_tokens=512,
        ),
    )

    if response.text:
        return response.text

    raise RuntimeError(f"{model} returned an empty response.")


def generate_groq_response(message):

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    client = Groq(
        api_key=GROQ_API_KEY,
        timeout=20.0,
        max_retries=1,
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
        max_tokens=512,
        temperature=0.3,
    )

    answer = response.choices[0].message.content

    if not answer:
        raise RuntimeError("Groq returned an empty response.")

    return answer.strip()


def get_chatbot_response(message):

    if GEMINI_API_KEY:

        retry_options = types.HttpRetryOptions(
            attempts=2,
            initial_delay=1.0,
            max_delay=3.0,
            exp_base=2.0,
            http_status_codes=[503],
        )

        client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(
                timeout=15000,
                retry_options=retry_options,
            ),
        )

        for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
            try:
                return generate_gemini_response(
                    client,
                    model,
                    message,
                )

            except Exception:
                logger.exception(
                    "Gemini model %s failed. Checking next provider.",
                    model,
                )

    logger.warning("Switching Nexora chatbot to Groq.")

    return generate_groq_response(message)
