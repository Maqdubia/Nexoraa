
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Resume, ResumeAnalysis
from .serializers import (
    ResumeSerializer,
    ResumeAnalysisSerializer,
)

from users.resume_analyzer import analyze_resume


# =========================================
# RESUME
# =========================================

class ResumeListCreateView(generics.ListCreateAPIView):

    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(
            user=self.request.user
        ).order_by("-uploaded_at")

    def perform_create(self, serializer):

        resume = serializer.save(
            user=self.request.user
        )

        # Analyze uploaded resume
        analysis = analyze_resume(
            resume.resume_file.path
        )

        # Save analysis data inside Resume
        resume.resume_text = analysis["text"]
        resume.resume_score = analysis["score"]
        resume.extracted_skills = analysis["skills"]

        resume.save()

        # Create ResumeAnalysis record
        ResumeAnalysis.objects.create(
            resume=resume,
            email=analysis["email"],
            phone=analysis["phone"],
            skills=analysis["skills"],
            score=analysis["score"],
            text_length=analysis["text_length"]
        )


# =========================================
# RESUME DETAIL
# =========================================

class ResumeDetailView(generics.RetrieveDestroyAPIView):

    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(
            user=self.request.user
        )


# =========================================
# RESUME ANALYSIS
# =========================================

class ResumeAnalysisView(generics.RetrieveAPIView):

    serializer_class = ResumeAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):

        return ResumeAnalysis.objects.get(
            resume__id=self.kwargs["pk"],
            resume__user=self.request.user
        )
