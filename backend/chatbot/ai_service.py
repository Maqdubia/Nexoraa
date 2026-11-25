import os
import logging

from google import genai
from google.genai import errors, types


logger = logging.getLogger(__name__)

API_KEY = os.getenv("GEMINI_API_KEY")

PRIMARY_MODEL = "gemini-3.8-flash"
FALLBACK_MODEL = "gemini-3.5-flash-lite"


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
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    retry_options = types.HttpRetryOptions(
        attempts=2,
        initial_delay=1.0,
        max_delay=4.0,
        exp_base=2.0,
        jitter=0.5,
        http_status_codes=[503],
    )

    client = genai.Client(
        api_key=API_KEY,
        http_options=types.HttpOptions(
            timeout=45000,
            retry_options=retry_options,
        ),
    )

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        max_output_tokens=512,
    )

    try:
        response = client.models.generate_content(
            model=PRIMARY_MODEL,
            contents=message,
            config=config,
        )

        if response.text:
            return response.text

        raise RuntimeError("Primary model returned an empty response.")

    except errors.APIError as error:

        if error.code != 503:
            raise

        logger.warning(
            "%s is overloaded. Trying fallback model %s.",
            PRIMARY_MODEL,
            FALLBACK_MODEL,
        )

    response = client.models.generate_content(
        model=FALLBACK_MODEL,
        contents=message,
        config=config,
    )

    if not response.text:
        raise RuntimeError("Fallback model returned an empty response.")

    return response.text
