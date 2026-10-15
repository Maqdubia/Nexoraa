
from django.db import models
from django.conf import settings


class Interview(models.Model):
    INTERVIEW_TYPES = [
        ("Python", "Python"),
        ("React", "React"),
        ("SQL", "SQL"),
        ("HR", "HR"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews"
    )

    interview_type = models.CharField(
        max_length=50,
        choices=INTERVIEW_TYPES
    )

    total_questions = models.PositiveIntegerField(default=5)

    total_score = models.PositiveIntegerField(default=0)

    feedback = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.interview_type} Interview"


class InterviewAnswer(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="answers"
    )

    question = models.TextField()

    answer = models.TextField(blank=True)

    score = models.PositiveIntegerField(default=0)

    feedback = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.interview.interview_type} - Question {self.id}"
