
import json
import re
import requests

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Interview, InterviewAnswer
from .serializers import InterviewSerializer


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "llama3.2"


def ask_ollama(prompt):
    """
    Send a prompt to the local Ollama model.
    The model is asked to return JSON.
    """
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=120,
        )

        response.raise_for_status()
        result = response.json()
        content = result.get("response", "").strip()

        # Remove optional Markdown fences if the model adds them.
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        return json.loads(content)

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Ollama is not running. Start Ollama and try again."
        )
    except requests.exceptions.Timeout:
        raise RuntimeError(
            "The AI request timed out. Please try again."
        )
    except requests.exceptions.RequestException:
        raise RuntimeError(
            "Could not connect to the AI service."
        )
    except (ValueError, json.JSONDecodeError):
        raise RuntimeError(
            "The AI returned an invalid response. Please try again."
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_question(request):
    role = str(request.data.get("role", "")).strip()
    level = str(request.data.get("level", "Fresher")).strip()
    interview_type = str(
        request.data.get("interview_type", "Technical")
    ).strip()

    previous_questions = request.data.get("previous_questions", [])

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
        str(question)[:500] for question in previous_questions[-10:]
    ) or "None"

    prompt = f"""
You are an interview coach for a career platform.

Generate exactly one useful interview question.

Target role: {role}
Experience level: {level}
Interview type: {interview_type}

Previously asked questions:
{previous_text}

Do not repeat any previously asked question.

Return only a JSON object with these keys:
{{
  "question": "The interview question",
  "tip": "A short hint to help the candidate prepare"
}}

Keep the question appropriate for the stated experience level.
"""

    try:
        result = ask_ollama(prompt)

        question = result.get("question")
        tip = result.get("tip")

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
    role = str(request.data.get("role", "Software Developer"))
    level = str(request.data.get("level", "Fresher"))

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
    Evaluate this mock interview answer for a {level} candidate
    applying for {role}.

    Question: {question}
    Candidate answer: {answer}

    Return ONLY valid JSON in this format:
    {{
        "score": 7,
        "strengths": ["Good explanation"],
        "improvements": ["Add a practical example"],
        "sample_answer": "A clear example answer"
    }}

    Score must be a number from 0 to 10.
    """

    try:
        result = ask_ollama(prompt)

        if isinstance(result, str):
            match = re.search(r"\{.*\}", result, re.DOTALL)

            if not match:
                raise ValueError("AI response is not valid JSON.")

            result = json.loads(match.group(0))

        score = int(round(float(result.get("score", 0))))
        score = max(0, min(10, score))

        strengths = result.get("strengths", [])
        improvements = result.get("improvements", [])
        sample_answer = str(result.get("sample_answer", ""))

        if not isinstance(strengths, list):
            strengths = [str(strengths)]

        if not isinstance(improvements, list):
            improvements = [str(improvements)]

        feedback = (
            "Strengths: " + "; ".join(map(str, strengths))
            + "\nImprovements: " + "; ".join(map(str, improvements))
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

    except (ValueError, TypeError, KeyError):
        return Response(
            {"error": "Could not process the AI evaluation. Please try again."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception:
        return Response(
            {"error": "Interview evaluation failed. Check that Ollama is running."},
            status=status.HTTP_502_BAD_GATEWAY,
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