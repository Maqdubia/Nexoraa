
from django.urls import path

from .views import (
    generate_question,
    evaluate_answer,
    interview_history,
    start_interview,
)

urlpatterns = [
    path(
        "generate-question/",
        generate_question,
        name="generate-interview-question",
    ),
    path(
        "evaluate-answer/",
        evaluate_answer,
        name="evaluate-interview-answer",
    ),
    path(
        "history/",
        interview_history,
        name="interview-history",
    ),
    path("start/", start_interview, name="start-interview"),
]