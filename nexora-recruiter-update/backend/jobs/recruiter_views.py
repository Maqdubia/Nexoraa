import secrets

from datetime import timedelta

from django.contrib.auth.models import User, Group
from django.db.models import Count
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.serializers import (
    Serializer,
    CharField,
    EmailField,
    ValidationError,
)

from .models import Job, JobApplication
from .permissions import IsHR, IsAdminUser
from .scoring import ats_score, clamp_score, match_skills, normalize_skills, score_band
from .serializers import JobSerializer

VALID_STATUSES = [choice[0] for choice in JobApplication.STATUS_CHOICES]


class HRCreateSerializer(Serializer):
    email = EmailField()
    password = CharField(write_only=True, min_length=10)
    full_name = CharField(required=False, allow_blank=True)
    company = CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise ValidationError(
                "An account with this email already exists."
            )

        return value

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        full_name = validated_data.get("full_name", "").strip()

        # Generate a unique username for Django's User model.
        base_username = email.split("@")[0][:120]
        username = base_username

        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{secrets.token_hex(3)}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=full_name[:150],
            is_active=True,
        )

        group, _ = Group.objects.get_or_create(name="HR")
        user.groups.add(group)

        return user


class HRAccountCreateView(generics.CreateAPIView):
    serializer_class = HRCreateSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "id": user.id,
                "email": user.email,
                "name": user.first_name,
                "role": "hr",
            },
            status=status.HTTP_201_CREATED,
        )


class RecruiterJobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        return Job.objects.filter(
            created_by=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        # A recruiter can only see and change their own jobs.
        return Job.objects.filter(created_by=self.request.user)


# ---------------------------------------------------------------
# Candidate helpers
# ---------------------------------------------------------------

def _latest_resume(user):
    return user.resumes.order_by("-uploaded_at").first()


def _display_name(user):
    profile = getattr(user, "profile", None)
    full_name = (getattr(profile, "full_name", "") or "").strip()

    return (
        full_name
        or user.get_full_name().strip()
        or user.username
    )


def _candidate_summary(application):
    """Compact candidate data shown in the candidates table."""
    user = application.user
    job = application.job
    profile = getattr(user, "profile", None)
    resume = _latest_resume(user)

    profile_skills = [skill.name for skill in user.skills.all()]
    resume_skills = normalize_skills(
        resume.extracted_skills if resume else []
    )
    candidate_skills = normalize_skills(profile_skills + resume_skills)

    matched, missing, skill_match = match_skills(
        job.required_skills, candidate_skills
    )

    resume_score = clamp_score(resume.resume_score) if resume else None
    score = ats_score(skill_match, resume_score)

    return {
        "id": application.id,
        "user_id": user.id,
        "candidate": _display_name(user),
        "email": user.email,
        "phone": getattr(profile, "phone", "") or "",
        "location": getattr(profile, "location", "") or "",
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        "status": application.status,
        "applied_at": application.applied_at,
        "cover_letter": application.cover_letter,
        "skills": candidate_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "skill_match": skill_match,
        "resume_score": resume_score,
        "has_resume": resume is not None,
        "ats_score": score,
        "ats_band": score_band(score),
    }


def _owned_applications(user):
    return (
        JobApplication.objects
        .filter(job__created_by=user)
        .select_related("user", "user__profile", "job")
        .prefetch_related("user__skills", "user__resumes")
    )


class RecruiterApplicationsView(APIView):
    """All applications received for the logged-in recruiter's jobs."""

    permission_classes = [IsHR]

    def get(self, request):
        applications = _owned_applications(request.user).order_by("-applied_at")

        job_id = request.query_params.get("job")

        if job_id and job_id.isdigit():
            applications = applications.filter(job_id=int(job_id))

        return Response([_candidate_summary(item) for item in applications])


class RecruiterApplicationDetailView(APIView):
    """Full candidate details, and status changes for one application."""

    permission_classes = [IsHR]

    def _get_application(self, request, pk):
        return (
            _owned_applications(request.user)
            .filter(pk=pk)
            .first()
        )

    def get(self, request, pk):
        application = self._get_application(request, pk)

        if not application:
            return Response(
                {"detail": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = _candidate_summary(application)
        user = application.user
        profile = getattr(user, "profile", None)
        resume = _latest_resume(user)

        resume_url = ""
        resume_text = ""
        resume_sections = []

        if resume:
            resume_text = (resume.resume_text or "")[:4000]

            analysis = getattr(resume, "analysis", None)

            if analysis:
                resume_sections = list(analysis.sections_found or [])

            try:
                resume_url = request.build_absolute_uri(resume.resume_file.url)
            except Exception:
                resume_url = ""

        data.update({
            "bio": getattr(profile, "bio", "") or "",
            "resume_title": resume.title if resume else "",
            "resume_url": resume_url,
            "resume_text": resume_text,
            "resume_sections": resume_sections,
            "education": [
                {
                    "institution": item.institution,
                    "degree": item.degree,
                    "field_of_study": item.field_of_study,
                    "start_year": item.start_year,
                    "end_year": item.end_year,
                }
                for item in user.education.all()
            ],
            "experience": [
                {
                    "company": item.company,
                    "job_title": item.job_title,
                    "start_date": item.start_date,
                    "end_date": item.end_date,
                    "currently_working": item.currently_working,
                    "description": item.description,
                }
                for item in user.experience.all()
            ],
        })

        return Response(data)

    def patch(self, request, pk):
        application = self._get_application(request, pk)

        if not application:
            return Response(
                {"detail": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        if new_status not in VALID_STATUSES:
            return Response(
                {"detail": "Status must be one of: " + ", ".join(VALID_STATUSES) + "."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = new_status
        application.save(update_fields=["status", "updated_at"])

        return Response(_candidate_summary(application))


class RecruiterBulkStatusView(APIView):
    """Shortlist / reject / select many candidates at once."""

    permission_classes = [IsHR]

    def post(self, request):
        ids = request.data.get("ids")
        new_status = request.data.get("status")

        if new_status not in VALID_STATUSES:
            return Response(
                {"detail": "Status must be one of: " + ", ".join(VALID_STATUSES) + "."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "Select at least one candidate."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clean_ids = [i for i in ids if isinstance(i, int)]

        # Only applications for this recruiter's own jobs can be changed.
        queryset = JobApplication.objects.filter(
            id__in=clean_ids,
            job__created_by=request.user,
        )
        updated = queryset.update(status=new_status, updated_at=timezone.now())

        return Response({"updated": updated, "status": new_status})


class RecruiterStatsView(APIView):
    """Numbers for the recruiter dashboard."""

    permission_classes = [IsHR]

    def get(self, request):
        jobs = Job.objects.filter(created_by=request.user)
        applications = JobApplication.objects.filter(job__created_by=request.user)

        by_status = {name: 0 for name in VALID_STATUSES}

        for row in applications.values("status").annotate(total=Count("id")):
            by_status[row["status"]] = row["total"]

        week_ago = timezone.now() - timedelta(days=7)

        top_jobs = (
            jobs.annotate(total=Count("applications"))
            .order_by("-total", "-created_at")[:5]
        )

        recent = (
            _owned_applications(request.user)
            .order_by("-applied_at")[:5]
        )

        return Response({
            "total_jobs": jobs.count(),
            "published_jobs": jobs.filter(is_published=True).count(),
            "total_applications": applications.count(),
            "new_this_week": applications.filter(applied_at__gte=week_ago).count(),
            "by_status": by_status,
            "top_jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "location": job.location,
                    "applications": job.total,
                    "is_published": job.is_published,
                }
                for job in top_jobs
            ],
            "recent_applications": [
                _candidate_summary(item) for item in recent
            ],
        })
