
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="featureusage",
            name="feature",
            field=models.CharField(
                choices=[
                    ("ats_generation", "ATS Resume Generation"),
                    ("ats_download", "ATS Resume Download"),
                    ("text_interview", "Completed Text Interview"),
                ],
                max_length=40,
            ),
        ),
    ]
