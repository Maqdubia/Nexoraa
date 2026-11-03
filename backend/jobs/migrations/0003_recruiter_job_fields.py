import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("jobs", "0002_jobapplication"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="recruiter_jobs",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="is_published",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="job",
            name="work_mode",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="job",
            name="vacancies",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="job",
            name="application_deadline",
            field=models.DateField(blank=True, null=True),
        ),
    ]
