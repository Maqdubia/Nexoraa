
from django.utils import timezone
from rest_framework import serializers

from .models import Job, JobApplication
from .scoring import normalize_skills


class JobSerializer(serializers.ModelSerializer):
    applications_count = serializers.SerializerMethodField()
    already_applied = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company",
            "location",
            "description",
            "responsibilities",
            "requirements",
            "benefits",
            "required_skills",
            "salary",
            "job_type",
            "experience",
            "application_url",
            "created_at",
            "updated_at",
            "work_mode",
            "vacancies",
            "application_deadline",
            "is_published",
            "applications_count",
            "already_applied",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "applications_count",
            "already_applied",
        ]

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_already_applied(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            return False

        if hasattr(obj, "_already_applied_for_user"):
            return obj._already_applied_for_user

        return obj.applications.filter(user=user).exists()

    def validate_title(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Enter a job title (at least 3 characters)."
            )

        return value

    def validate_company(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Enter the company name.")

        return value

    def validate_description(self, value):
        value = value.strip()

        if len(value) < 20:
            raise serializers.ValidationError(
                "Write a short job description (at least 20 characters)."
            )

        return value

    def validate_vacancies(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Vacancies must be at least 1."
            )

        return value

    def validate_required_skills(self, value):
        return normalize_skills(value)

    def validate_application_deadline(self, value):
        unchanged = (
            self.instance is not None
            and self.instance.application_deadline == value
        )

        if value and not unchanged and value < timezone.localdate():
            raise serializers.ValidationError(
                "The application deadline cannot be in the past."
            )

        return value


class JobApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source="job", read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "job",
            "job_details",
            "status",
            "cover_letter",
            "applied_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "applied_at",
            "updated_at",
        ]

    def validate_job(self, value):
        user = self.context["request"].user

        if not value.is_published or value.is_archived:
            raise serializers.ValidationError(
                "This job is no longer accepting applications."
            )

        if (
            value.application_deadline
            and value.application_deadline < timezone.localdate()
        ):
            raise serializers.ValidationError(
                "The application deadline for this job has passed."
            )

        if value.created_by_id and value.created_by_id == user.id:
            raise serializers.ValidationError(
                "You cannot apply to a job you posted."
            )

        if JobApplication.objects.filter(user=user, job=value).exists():
            raise serializers.ValidationError(
                "You have already applied for this job."
            )

        return value

    def create(self, validated_data):
        user = validated_data["user"]

        application = super().create(validated_data)

        # Capture the latest resume at the exact time of application.
        resume = user.resumes.order_by("-uploaded_at").first()

        if not resume:
            return application

        analysis_snapshot = {}
        analysis = getattr(resume, "analysis", None)

        if analysis:
            analysis_snapshot = {
                "skills": analysis.skills or [],
                "score": analysis.score,
                "education": analysis.education or [],
                "certifications": analysis.certifications or [],
                "sections_found": analysis.sections_found or [],
                "section_text": analysis.section_text or {},
                "score_details": analysis.score_details or {},
                "content_analysis": analysis.content_analysis or {},
                "recommendations": analysis.recommendations or [],
            }

        application.resume_snapshot_title = resume.title or ""
        application.resume_snapshot_file = (
            resume.resume_file.name if resume.resume_file else ""
        )
        application.resume_snapshot_text = resume.resume_text or ""
        application.resume_snapshot_score = resume.resume_score
        application.resume_snapshot_skills = (
            resume.extracted_skills or []
        )
        application.resume_snapshot_analysis = analysis_snapshot

        application.save(
            update_fields=[
                "resume_snapshot_title",
                "resume_snapshot_file",
                "resume_snapshot_text",
                "resume_snapshot_score",
                "resume_snapshot_skills",
                "resume_snapshot_analysis",
            ]
        )

        return application
