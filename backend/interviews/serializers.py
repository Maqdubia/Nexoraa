
from rest_framework import serializers
from .models import Interview, InterviewAnswer


class InterviewAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAnswer
        fields = [
            "id",
            "question",
            "answer",
            "score",
            "feedback",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "score",
            "feedback",
            "created_at",
        ]


class InterviewSerializer(serializers.ModelSerializer):
    answers = InterviewAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Interview
        fields = [
            "id",
            "interview_type",
            "total_questions",
            "total_score",
            "feedback",
            "created_at",
            "answers",
        ]
        read_only_fields = [
            "id",
            "total_score",
            "feedback",
            "created_at",
            "answers",
        ]
