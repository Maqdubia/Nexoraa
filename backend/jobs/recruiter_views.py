from django.contrib.auth.models import User, Group
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
        full_name = validated_data.pop("full_name", "")
        validated_data.pop("company", "")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            **validated_data,
            password=password,
            is_active=True,
        )

        group, _ = Group.objects.get_or_create(name="HR")
        user.groups.add(group)

        user.first_name = full_name[:150]
        user.save(update_fields=["first_name"])

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
        if self.request.user.is_superuser:
            return Job.objects.filter(
                created_by__isnull=False
            ).order_by("-created_at")

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
        if self.request.user.is_superuser:
            return Job.objects.filter(created_by__isnull=False)

        return Job.objects.filter(created_by=self.request.user)


class RecruiterApplicationsView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        jobs = Job.objects.filter(created_by=request.user)

        if request.user.is_superuser:
            jobs = Job.objects.filter(created_by__isnull=False)

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
