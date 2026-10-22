
from rest_framework import serializers

from .models import Resume, ResumeAnalysis


# =========================================
# RESUME
# =========================================

class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume

        fields = [
            "id",
            "title",
            "resume_file",
            "uploaded_at",
            "updated_at",
            "resume_text",
            "resume_score",
            "extracted_skills",
        ]

        read_only_fields = [
            "id",
            "uploaded_at",
            "updated_at",
            "resume_text",
            "resume_score",
            "extracted_skills",
        ]


# =========================================
# RESUME ANALYSIS
# =========================================

class ResumeAnalysisSerializer(serializers.ModelSerializer):

    class Meta:
        model = ResumeAnalysis

        fields = [
            "id",
            "resume",
            "email",
            "phone",
            "skills",
            "score",
            "text_length",
            "education",
            "certifications",
            "sections_found",
            "section_text",
            "score_details",
            "content_analysis",
            "recommendations",
            "analyzed_at",
        ]

        read_only_fields = [
            "id",
            "analyzed_at",
        ]
