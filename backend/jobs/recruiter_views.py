
import secrets

from datetime import timedelta

from django.contrib.auth.models import User, Group
from django.core.files.storage import default_storage
from django.db import transaction
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

from .models import Job, JobApplication, ApplicationStatusHistory
from .permissions import IsHR, IsAdminUser
from .scoring import (
    ats_score,
    clamp_score,
    match_skills,
    normalize_skills,
    score_band,
)
from .serializers import JobSerializer


VALID_STATUSES = [
    choice[0] for choice in JobApplication.STATUS_CHOICES
]


# ========================================
# RECRUITER ACCOUNT MANAGEMENT
# ========================================

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


# ========================================
# RECRUITER JOB MANAGEMENT
# ========================================

class RecruiterJobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        return Job.objects.filter(
            created_by=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            source="recruiter",
        )


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        return Job.objects.filter(
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()

        has_applications = job.applications.exists()

        if has_applications:
            job.is_archived = True
            job.is_published = False
            job.save(
                update_fields=[
                    "is_archived",
                    "is_published",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "message": (
                        "This job has existing applications. "
                        "It has been archived instead of deleted."
                    ),
                    "archived": True,
                    "job_id": job.id,
                },
                status=status.HTTP_200_OK,
            )

        job.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


# ========================================
# CANDIDATE HELPERS
# ========================================

def _latest_resume(user):
    return user.resumes.order_by("-uploaded_at").first()


def _display_name(user):
    profile = getattr(user, "profile", None)
    full_name = (
        getattr(profile, "full_name", "") or ""
    ).strip()

    return (
        full_name
        or user.get_full_name().strip()
        or user.username
    )


def _application_resume_data(application):
    """
    Return the resume submitted with the application.

    Older applications without snapshots fall back to
    the candidate's latest resume.
    """

    user = application.user

    if application.resume_snapshot_title or application.resume_snapshot_file:
        file_name = application.resume_snapshot_file or ""
        resume_url = ""

        if file_name:
            try:
                resume_url = default_storage.url(file_name)
            except Exception:
                resume_url = ""

        return {
            "resume_title": application.resume_snapshot_title,
            "resume_url": resume_url,
            "resume_text": (
                application.resume_snapshot_text or ""
            )[:4000],
            "resume_score": application.resume_snapshot_score,
            "resume_skills": (
                application.resume_snapshot_skills or []
            ),
            "resume_analysis": (
                application.resume_snapshot_analysis or {}
            ),
            "has_resume": bool(file_name),
        }

    # Backward compatibility for applications created before snapshots.
    resume = _latest_resume(user)

    if not resume:
        return {
            "resume_title": "",
            "resume_url": "",
            "resume_text": "",
            "resume_score": None,
            "resume_skills": [],
            "resume_analysis": {},
            "has_resume": False,
        }

    resume_url = ""

    try:
        resume_url = resume.resume_file.url
    except Exception:
        resume_url = ""

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

    return {
        "resume_title": resume.title or "",
        "resume_url": resume_url,
        "resume_text": (resume.resume_text or "")[:4000],
        "resume_score": resume.resume_score,
        "resume_skills": resume.extracted_skills or [],
        "resume_analysis": analysis_snapshot,
        "has_resume": bool(resume.resume_file),
    }


def _candidate_summary(application):
    """Compact candidate information for the recruiter candidates table."""

    user = application.user
    job = application.job
    profile = getattr(user, "profile", None)

    resume_data = _application_resume_data(application)

    profile_skills = [
        skill.name for skill in user.skills.all()
    ]

    resume_skills = normalize_skills(
        resume_data["resume_skills"]
    )

    candidate_skills = normalize_skills(
        profile_skills + resume_skills
    )

    matched, missing, skill_match = match_skills(
        job.required_skills,
        candidate_skills,
    )

    resume_score = (
        clamp_score(resume_data["resume_score"])
        if resume_data["resume_score"] is not None
        else None
    )

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
        "has_resume": resume_data["has_resume"],
        "ats_score": score,
        "ats_band": score_band(score),
    }


def _owned_applications(user):
    return (
        JobApplication.objects
        .filter(job__created_by=user)
        .select_related(
            "user",
            "user__profile",
            "job",
        )
        .prefetch_related(
            "user__skills",
            "user__resumes",
        )
    )


def _status_history(application):
    return [
        {
            "id": item.id,
            "previous_status": item.previous_status,
            "new_status": item.new_status,
            "changed_by": (
                item.changed_by.get_full_name()
                or item.changed_by.username
                if item.changed_by
                else "System"
            ),
            "note": item.note,
            "changed_at": item.changed_at,
        }
        for item in application.status_history.select_related(
            "changed_by"
        ).all()
    ]


# ========================================
# RECRUITER APPLICATION LIST
# ========================================

class RecruiterApplicationsView(APIView):
    """All applications received for the logged-in recruiter's jobs."""

    permission_classes = [IsHR]

    def get(self, request):
        applications = _owned_applications(
            request.user
        ).order_by("-applied_at")

        job_id = request.query_params.get("job")

        if job_id and job_id.isdigit():
            applications = applications.filter(
                job_id=int(job_id)
            )

        return Response([
            _candidate_summary(item)
            for item in applications
        ])


# ========================================
# RECRUITER APPLICATION DETAILS
# ========================================

class RecruiterApplicationDetailView(APIView):
    """Full candidate details and application status changes."""

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

        resume_data = _application_resume_data(application)

        data.update({
            "bio": getattr(profile, "bio", "") or "",
            "resume_title": resume_data["resume_title"],
            "resume_url": resume_data["resume_url"],
            "resume_text": resume_data["resume_text"],
            "resume_sections": (
                resume_data["resume_analysis"].get(
                    "sections_found", []
                )
            ),
            "resume_analysis": resume_data["resume_analysis"],
            "status_history": _status_history(application),
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
                {
                    "detail": (
                        "Status must be one of: "
                        + ", ".join(VALID_STATUSES)
                        + "."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get("note", "")

        if not isinstance(note, str):
            return Response(
                {"detail": "Note must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = application.status

        if previous_status != new_status:
            with transaction.atomic():
                application.status = new_status
                application.save(
                    update_fields=["status", "updated_at"]
                )

                ApplicationStatusHistory.objects.create(
                    application=application,
                    previous_status=previous_status,
                    new_status=new_status,
                    changed_by=request.user,
                    note=note.strip(),
                )

        return Response(_candidate_summary(application))


# ========================================
# BULK APPLICATION STATUS MANAGEMENT
# ========================================

class RecruiterBulkStatusView(APIView):
    """Shortlist, reject, or select multiple candidates."""

    permission_classes = [IsHR]

    def post(self, request):
        ids = request.data.get("ids")
        new_status = request.data.get("status")
        note = request.data.get("note", "")

        if new_status not in VALID_STATUSES:
            return Response(
                {
                    "detail": (
                        "Status must be one of: "
                        + ", ".join(VALID_STATUSES)
                        + "."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "Select at least one candidate."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(note, str):
            return Response(
                {"detail": "Note must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clean_ids = list({
            item for item in ids
            if isinstance(item, int) and not isinstance(item, bool)
        })

        if not clean_ids:
            return Response(
                {"detail": "No valid application IDs were supplied."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = 0

        with transaction.atomic():
            applications = list(
                JobApplication.objects.select_for_update().filter(
                    id__in=clean_ids,
                    job__created_by=request.user,
                )
            )

            for application in applications:
                previous_status = application.status

                if previous_status == new_status:
                    continue

                application.status = new_status
                application.save(
                    update_fields=["status", "updated_at"]
                )

                ApplicationStatusHistory.objects.create(
                    application=application,
                    previous_status=previous_status,
                    new_status=new_status,
                    changed_by=request.user,
                    note=note.strip(),
                )

                updated += 1

        return Response({
            "updated": updated,
            "status": new_status,
        })


# ========================================
# RECRUITER DASHBOARD STATISTICS
# ========================================

class RecruiterStatsView(APIView):
    """Numbers for the recruiter dashboard."""

    permission_classes = [IsHR]

    def get(self, request):
        jobs = Job.objects.filter(
            created_by=request.user
        )

        applications = JobApplication.objects.filter(
            job__created_by=request.user
        )

        by_status = {
            name: 0 for name in VALID_STATUSES
        }

        for row in applications.values(
            "status"
        ).annotate(total=Count("id")):
            by_status[row["status"]] = row["total"]

        week_ago = timezone.now() - timedelta(days=7)

        top_jobs = (
            jobs.annotate(
                total=Count("applications")
            )
            .order_by("-total", "-created_at")[:5]
        )

        recent = (
            _owned_applications(request.user)
            .order_by("-applied_at")[:5]
        )

        return Response({
            "total_jobs": jobs.count(),
            "published_jobs": jobs.filter(
                is_published=True,
                is_archived=False,
            ).count(),
            "archived_jobs": jobs.filter(
                is_archived=True,
            ).count(),
            "total_applications": applications.count(),
            "new_this_week": applications.filter(
                applied_at__gte=week_ago
            ).count(),
            "by_status": by_status,
            "top_jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "location": job.location,
                    "applications": job.total,
                    "is_published": job.is_published,
                    "is_archived": job.is_archived,
                }
                for job in top_jobs
            ],
            "recent_applications": [
                _candidate_summary(item)
                for item in recent
            ],
        })
