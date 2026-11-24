from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("chatbot", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ChatbotFeedback",
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
                    "rating",
                    models.CharField(
                        max_length=10,
                        choices=[
                            ("positive", "Positive"),
                            ("negative", "Negative"),
                        ],
                    ),
                ),
                (
                    "reason",
                    models.CharField(
                        max_length=20,
                        choices=[
                            ("helpful", "Helpful"),
                            ("clear", "Clear"),
                            ("accurate", "Accurate"),
                            ("solved_issue", "Solved my issue"),
                            ("incorrect", "Incorrect"),
                            ("not_relevant", "Not relevant"),
                            ("incomplete", "Incomplete"),
                            ("unclear", "Unclear"),
                        ],
                    ),
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
                        blank=True,
                        default="",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "user",
                    models.ForeignKey(
                        to=settings.AUTH_USER_MODEL,
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="chatbot_feedback_entries",
                    ),
                ),
            ],
            options={
                "verbose_name": "Chatbot Feedback",
                "verbose_name_plural": "Chatbot Feedback",
                "ordering": ["-created_at"],
            },
        ),
    ]
