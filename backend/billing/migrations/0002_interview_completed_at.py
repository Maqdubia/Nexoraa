
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interviews", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="interview",
            name="completed_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
            ),
        ),
    ]
