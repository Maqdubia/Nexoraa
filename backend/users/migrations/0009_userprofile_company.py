from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_emailverificationotp"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="company",
            field=models.CharField(max_length=150, blank=True),
        ),
    ]
