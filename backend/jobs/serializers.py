
from rest_framework import serializers
from .models import Job, JobApplication


class JobSerializer(serializers.ModelSerializer):

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company",
            "location",
            "description",
            "required_skills",
            "salary",
            "job_type",
            "experience",
            "application_url",
            "created_at",
            "updated_at",
        ]


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

        if JobApplication.objects.filter(
            user=user,
            job=value
        ).exists():
            raise serializers.ValidationError(
                "You have already applied for this job."
            )

        return value
