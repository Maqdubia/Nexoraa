from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0003_recruiter_job_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="responsibilities",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="job",
            name="requirements",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="job",
            name="benefits",
            field=models.TextField(blank=True, default=""),
        ),
    ]
