from django.db import models
from django.conf import settings


class Job(models.Model):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recruiter_jobs",
    )
    is_published = models.BooleanField(default=True)
    work_mode = models.CharField(max_length=30, blank=True)
    vacancies = models.PositiveIntegerField(default=1)
    application_deadline = models.DateField(null=True, blank=True)

    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    description = models.TextField()
    responsibilities = models.TextField(blank=True, default="")
    requirements = models.TextField(blank=True, default="")
    benefits = models.TextField(blank=True, default="")
    required_skills = models.JSONField(default=list)
    salary = models.CharField(max_length=100, blank=True)
    job_type = models.CharField(max_length=100, default="Full Time")
    experience = models.CharField(max_length=100, blank=True)
    application_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.company}"


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ("Applied", "Applied"),
        ("Shortlisted", "Shortlisted"),
        ("Rejected", "Rejected"),
        ("Selected", "Selected"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Applied",
    )
    cover_letter = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "job"],
                name="unique_user_job_application",
            )
        ]
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.user} - {self.job.title} ({self.status})"
