from django.db import models
from django.contrib.auth.models import User


# =========================================
# RESUME
# =========================================

class Resume(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="resumes"
    )

    title = models.CharField(
        max_length=200,
        default="My Resume"
    )

    resume_file = models.FileField(
        upload_to="resumes/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    resume_text = models.TextField(
        blank=True,
        null=True
    )

    resume_score = models.FloatField(
        blank=True,
        null=True
    )

    extracted_skills = models.JSONField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.title}"


# =========================================
# RESUME ANALYSIS
# =========================================

class ResumeAnalysis(models.Model):

    resume = models.OneToOneField(
        Resume,
        on_delete=models.CASCADE,
        related_name="analysis"
    )

    email = models.EmailField(
        blank=True,
        null=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    skills = models.JSONField(
        default=list
    )

    score = models.IntegerField(
        default=0
    )

    text_length = models.IntegerField(
        default=0
    )

    analyzed_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Analysis - {self.resume.title}"