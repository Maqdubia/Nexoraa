
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0004_job_details"),
        ("resumes", "0002_resumeanalysis_certifications_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="source",
            field=models.CharField(
                choices=[
                    ("recruiter", "Recruiter"),
                    ("adzuna", "Adzuna"),
                    ("legacy", "Legacy"),
                ],
                db_index=True,
                default="legacy",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="is_archived",
            field=models.BooleanField(
                db_index=True,
                default=False,
            ),
        ),
        migrations.AlterField(
            model_name="jobapplication",
            name="job",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="applications",
                to="jobs.job",
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_snapshot_title",
            field=models.CharField(
                blank=True,
                default="",
                max_length=200,
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_snapshot_file",
            field=models.CharField(
                blank=True,
                default="",
                max_length=500,
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_snapshot_text",
            field=models.TextField(
                blank=True,
                default="",
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_snapshot_score",
            field=models.FloatField(
                blank=True,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_snapshot_skills",
            field=models.JSONField(
                blank=True,
                default=list,
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_snapshot_analysis",
            field=models.JSONField(
                blank=True,
                default=dict,
            ),
        ),
        migrations.CreateModel(
            name="ApplicationStatusHistory",
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
                    "previous_status",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("Applied", "Applied"),
                            ("Shortlisted", "Shortlisted"),
                            ("Rejected", "Rejected"),
                            ("Selected", "Selected"),
                        ],
                        default="",
                        max_length=20,
                    ),
                ),
                (
                    "new_status",
                    models.CharField(
                        choices=[
                            ("Applied", "Applied"),
                            ("Shortlisted", "Shortlisted"),
                            ("Rejected", "Rejected"),
                            ("Selected", "Selected"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "note",
                    models.TextField(
                        blank=True,
                        default="",
                    ),
                ),
                (
                    "changed_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "application",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_history",
                        to="jobs.jobapplication",
                    ),
                ),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="application_status_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-changed_at"],
            },
        ),
    ]
