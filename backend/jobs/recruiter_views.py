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
from .serializers import JobSerializer


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
                "role": "recruiter",
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
        serializer.save(
            created_by=self.request.user,
            is_published=True,
        )


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        return Job.objects.filter(created_by=self.request.user)


class RecruiterApplicationsView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        jobs = Job.objects.filter(created_by=request.user)

        applications = (
            JobApplication.objects
            .filter(job__in=jobs)
            .select_related("user", "job")
            .order_by("-applied_at")
        )

        return Response([
            {
                "id": item.id,
                "candidate": (
                    item.user.get_full_name()
                    or item.user.username
                ),
                "email": item.user.email,
                "job_title": item.job.title,
                "company": item.job.company,
                "status": item.status,
                "applied_at": item.applied_at,
                "cover_letter": item.cover_letter,
            }
            for item in applications
        ])


class RecruiterStatsView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        jobs = Job.objects.filter(created_by=request.user)
        applications = JobApplication.objects.filter(job__in=jobs).select_related("user", "job")
        status_counts = {key: applications.filter(status=key).count() for key, _ in JobApplication.STATUS_CHOICES}
        week_ago = timezone.now() - timedelta(days=7)
        recent = applications.order_by("-applied_at")[:6]
        top_jobs = jobs.annotate(application_count=Count("applications")).order_by("-application_count", "-created_at")[:6]
        return Response({
            "total_jobs": jobs.count(),
            "published_jobs": jobs.filter(is_published=True).count(),
            "total_applications": applications.count(),
            "new_this_week": applications.filter(applied_at__gte=week_ago).count(),
            "by_status": status_counts,
            "recent_applications": [{
                "id": item.id,
                "candidate": item.user.get_full_name() or item.user.username,
                "job_title": item.job.title,
                "applied_at": item.applied_at,
                "status": item.status,
                "ats_score": 0,
            } for item in recent],
            "top_jobs": [{
                "id": job.id,
                "title": job.title,
                "location": job.location,
                "applications": job.application_count,
                "is_published": job.is_published,
            } for job in top_jobs],
        })
