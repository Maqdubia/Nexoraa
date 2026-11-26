import json
import logging
import os
import re

from groq import Groq

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Interview, InterviewAnswer
from .serializers import InterviewSerializer


logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-20b"


def ask_ai(prompt):
    """
    Generate structured interview content using Groq.
    This works with the deployed Django service without local Ollama.
    """

    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is missing from the Render environment."
        )

    try:
        client = Groq(
            api_key=GROQ_API_KEY,
            timeout=25.0,
            max_retries=0,
        )

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Nexora's professional AI interview coach. "
                        "Generate accurate, role-specific interview content. "
                        "Return only a valid JSON object without Markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=1000,
            reasoning_effort="low",
            include_reasoning=False,
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError("The AI returned an empty response.")

        content = content.strip()
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)

            if not match:
                raise RuntimeError(
                    "The AI returned an invalid JSON response."
                )

            result = json.loads(match.group(0))

        if not isinstance(result, dict):
            raise RuntimeError("The AI returned an invalid response.")

        return result

    except RuntimeError:
        raise

    except Exception as error:
        logger.exception("Groq interview request failed.")
        raise RuntimeError(
            "The AI interview service is currently unavailable. "
            "Please try again."
        ) from error


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_question(request):

    role = str(request.data.get("role", "")).strip()
    level = str(request.data.get("level", "Fresher")).strip()
    interview_type = str(
        request.data.get("interview_type", "Technical")
    ).strip()

    previous_questions = request.data.get(
        "previous_questions", []
    )

    if not role:
        return Response(
            {"error": "Please provide a target job role."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if interview_type not in ["Technical", "HR", "Behavioral"]:
        return Response(
            {"error": "Invalid interview type."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(previous_questions, list):
        return Response(
            {"error": "previous_questions must be a list."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    previous_text = "\n".join(
        str(question)[:500]
        for question in previous_questions[-10:]
    ) or "None"

    prompt = f"""
Generate exactly ONE useful interview question.

Target job role: {role}
Experience level: {level}
Interview type: {interview_type}

Previously asked questions:
{previous_text}

Do not repeat previously asked questions.

Return this JSON structure:
{{
    "question": "The interview question",
    "tip": "A short preparation hint"
}}

Keep the question relevant to the role and experience level.
"""

    try:
        result = ask_ai(prompt)

        question = result.get("question")
        tip = result.get("tip", "")

        if not isinstance(question, str) or not question.strip():
            return Response(
                {"error": "The AI did not generate a valid question."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            "question": question.strip(),
            "tip": tip.strip() if isinstance(tip, str) else "",
        })

    except RuntimeError as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def evaluate_answer(request):

    interview_id = request.data.get("interview_id")
    question = str(request.data.get("question", "")).strip()
    answer = str(request.data.get("answer", "")).strip()

    role = str(
        request.data.get("role", "Software Developer")
    ).strip()

    level = str(
        request.data.get("level", "Fresher")
    ).strip()

    interview_type = str(
        request.data.get("interview_type", "Technical")
    ).strip()

    if not interview_id:
        return Response(
            {"error": "Interview ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not question or not answer:
        return Response(
            {"error": "Question and answer are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        interview = Interview.objects.get(
            id=interview_id,
            user=request.user,
        )
    except Interview.DoesNotExist:
        return Response(
            {"error": "Interview not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    prompt = f"""
Evaluate the candidate's interview answer professionally.

Target role: {role}
Experience level: {level}
Interview type: {interview_type}

Interview question:
{question}

Candidate's answer:
{answer}

Evaluate accuracy, relevance, clarity and completeness.

Return ONLY this JSON structure:
{{
    "score": 7,
    "strengths": [
        "A strength demonstrated by the candidate"
    ],
    "improvements": [
        "A practical area to improve"
    ],
    "sample_answer": "A strong example answer"
}}

Rules:
- Score must be between 0 and 10.
- Be constructive and fair.
- Do not give a high score to an incorrect answer.
- Keep feedback specific to the candidate's answer.
"""

    try:
        result = ask_ai(prompt)

        try:
            score = int(round(float(result.get("score", 0))))
        except (TypeError, ValueError):
            raise ValueError("Invalid evaluation score.")

        score = max(0, min(10, score))

        strengths = result.get("strengths", [])
        improvements = result.get("improvements", [])
        sample_answer = str(result.get("sample_answer", ""))

        if not isinstance(strengths, list):
            strengths = [str(strengths)]

        if not isinstance(improvements, list):
            improvements = [str(improvements)]

        feedback = (
            "Strengths: "
            + "; ".join(map(str, strengths))
            + "\nImprovements: "
            + "; ".join(map(str, improvements))
        )

        InterviewAnswer.objects.create(
            interview=interview,
            question=question,
            answer=answer,
            score=score,
            feedback=feedback,
        )

        interview.total_score = sum(
            interview.answers.values_list("score", flat=True)
        )

        interview.save(update_fields=["total_score"])

        return Response({
            "score": score,
            "strengths": strengths,
            "improvements": improvements,
            "sample_answer": sample_answer,
            "saved": True,
            "total_score": interview.total_score,
            "answers_saved": interview.answers.count(),
        })

    except RuntimeError as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    except (ValueError, TypeError, KeyError):
        logger.exception("Interview evaluation response was invalid.")

        return Response(
            {"error": "Could not process the AI evaluation."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    except Exception:
        logger.exception("Interview evaluation failed.")

        return Response(
            {"error": "Interview evaluation failed. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def interview_history(request):

    interviews = Interview.objects.filter(
        user=request.user
    ).order_by("-created_at")

    serializer = InterviewSerializer(interviews, many=True)

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_interview(request):

    interview_type = str(
        request.data.get("interview_type", "Python")
    ).strip()

    total_questions = request.data.get("total_questions", 5)

    allowed_types = ["Python", "React", "SQL", "HR"]

    if interview_type not in allowed_types:
        return Response(
            {"error": "Choose Python, React, SQL, or HR."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        total_questions = int(total_questions)
    except (TypeError, ValueError):
        return Response(
            {"error": "total_questions must be a number."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not 1 <= total_questions <= 20:
        return Response(
            {"error": "Choose between 1 and 20 questions."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    interview = Interview.objects.create(
        user=request.user,
        interview_type=interview_type,
        total_questions=total_questions,
    )

    return Response(
        {
            "id": interview.id,
            "interview_type": interview.interview_type,
            "total_questions": interview.total_questions,
            "message": "Interview started successfully.",
        },
        status=status.HTTP_201_CREATED,
    )
