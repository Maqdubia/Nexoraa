
import logging
import os
import requests

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job, JobApplication
from .permissions import IsStudent


logger = logging.getLogger(__name__)


def build_application_key(user, job):
    """
    Create one stable key shared by Started and Applied events.
    """

    return f"nexora-user-{user.pk}-job-{job.pk}"


class JobApplicationStartView(APIView):
    """
    Record that a student opened an employer's application link.
    """

    permission_classes = [IsStudent]

    def post(self, request):
        try:
            job_id = int(request.data.get("job_id"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "A valid job ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = Job.objects.filter(
            pk=job_id,
            is_published=True,
            is_archived=False,
        ).first()

        if not job:
            return Response(
                {"detail": "This job is unavailable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            job.application_deadline
            and job.application_deadline < timezone.localdate()
        ):
            return Response(
                {"detail": "The application deadline has passed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not job.application_url:
            return Response(
                {"detail": "This job has no external application link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        # Do not mark an already submitted application as Started.
        existing_application = JobApplication.objects.filter(
            user=user,
            job=job,
        ).first()

        if existing_application:
            return Response({
                "success": True,
                "message": "This application has already been submitted.",
                "status": "Applied",
                "application_key": build_application_key(user, job),
            })

        candidate_email = (user.email or "").strip().lower()

        if not candidate_email:
            return Response(
                {"detail": "Your account does not have an email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            profile = user.profile
        except ObjectDoesNotExist:
            profile = None

        candidate_name = (
            (getattr(profile, "full_name", "") or "").strip()
            or user.get_full_name().strip()
            or user.username
        )

        webhook_url = os.getenv(
            "N8N_APPLICATION_STARTED_WEBHOOK_URL",
            "",
        ).strip()

        webhook_secret = getattr(
            settings,
            "N8N_WEBHOOK_SECRET",
            "",
        ).strip()

        if not webhook_url or not webhook_secret:
            logger.error(
                "N8N Application Started webhook is not configured."
            )

            return Response(
                {"detail": "Application tracking is temporarily unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        application_key = build_application_key(user, job)

        payload = {
            "application_key": application_key,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "job_id": str(job.pk),
            "job_title": job.title,
            "company": job.company,
            "application_url": job.application_url,
        }

        try:
            response = requests.post(
                webhook_url,
                json=payload,
                headers={
                    "X-Nexora-Webhook-Secret": webhook_secret,
                },
                timeout=(3.05, 10),
            )

            response.raise_for_status()

            logger.info(
                "N8N received Started event for user %s and job %s.",
                user.pk,
                job.pk,
            )

            return Response({
                "success": True,
                "message": "Started application recorded.",
                "application_key": application_key,
                "status": "Started",
            })

        except requests.RequestException as exc:
            logger.warning(
                "N8N Application Started request failed: %s",
                type(exc).__name__,
            )

            return Response(
                {"detail": "Could not record the application start."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
