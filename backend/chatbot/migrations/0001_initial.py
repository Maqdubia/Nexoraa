
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SupportTicket",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "reference_id",
                    models.CharField(
                        max_length=20,
                        unique=True,
                        editable=False,
                    ),
                ),
                (
                    "customer_name",
                    models.CharField(max_length=150, blank=True),
                ),
                (
                    "email",
                    models.EmailField(max_length=254, blank=True),
                ),
                (
                    "category",
                    models.CharField(
                        max_length=30,
                        choices=[
                            ("account", "Account & Login"),
                            ("verification", "OTP & Verification"),
                            ("resume", "Resume & ATS"),
                            ("jobs", "Jobs & Applications"),
                            ("interview", "Interview Practice"),
                            ("profile", "Profile & Settings"),
                            ("technical", "Technical Issues"),
                            ("other", "Other Issues"),
                        ],
                    ),
                ),
                (
                    "issue",
                    models.CharField(max_length=200),
                ),
                (
                    "description",
                    models.TextField(),
                ),
                (
                    "status",
                    models.CharField(
                        max_length=20,
                        choices=[
                            ("open", "Open"),
                            ("in_progress", "In Progress"),
                            ("resolved", "Resolved"),
                            ("closed", "Closed"),
                        ],
                        default="open",
                    ),
                ),
                (
                    "admin_response",
                    models.TextField(blank=True),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True),
                ),
                (
                    "user",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL,
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="support_tickets",
                    ),
                ),
            ],
            options={
                "verbose_name": "Support Ticket",
                "verbose_name_plural": "Support Tickets",
                "ordering": ["-created_at"],
            },
        ),
    ]
