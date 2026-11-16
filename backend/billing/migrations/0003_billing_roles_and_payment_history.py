
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0002_featureusage_text_interview"),
    ]

    operations = [
        migrations.AddField(
            model_name="razorpayplan",
            name="target_role",
            field=models.CharField(
                choices=[
                    ("student", "Student"),
                    ("recruiter", "Recruiter"),
                ],
                default="student",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="razorpayplan",
            name="display_name",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="subscription",
            name="target_role",
            field=models.CharField(
                choices=[
                    ("student", "Student"),
                    ("recruiter", "Recruiter"),
                ],
                default="student",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="subscription",
            name="last_provider_event_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="subscription",
            name="status",
            field=models.CharField(
                choices=[
                    ("created", "Created"),
                    ("authenticated", "Authenticated"),
                    ("active", "Active"),
                    ("pending", "Pending"),
                    ("halted", "Halted"),
                    ("paused", "Paused"),
                    ("cancelled", "Cancelled"),
                    ("completed", "Completed"),
                    ("expired", "Expired"),
                    ("failed", "Failed"),
                ],
                db_index=True,
                default="created",
                max_length=20,
            ),
        ),
        migrations.RemoveConstraint(
            model_name="razorpayplan",
            name="unique_razorpay_plan_cycle",
        ),
        migrations.AddConstraint(
            model_name="razorpayplan",
            constraint=models.UniqueConstraint(
                fields=("target_role", "plan", "billing_cycle"),
                name="unique_razorpay_plan_audience_cycle",
            ),
        ),
        migrations.CreateModel(
            name="SubscriptionPayment",
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
                    "razorpay_payment_id",
                    models.CharField(max_length=100, unique=True),
                ),
                (
                    "invoice_id",
                    models.CharField(blank=True, max_length=100),
                ),
                (
                    "amount",
                    models.PositiveIntegerField(default=0),
                ),
                (
                    "currency",
                    models.CharField(default="INR", max_length=3),
                ),
                (
                    "method",
                    models.CharField(blank=True, max_length=40),
                ),
                (
                    "status",
                    models.CharField(default="captured", max_length=30),
                ),
                (
                    "raw_payload",
                    models.JSONField(blank=True, default=dict),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "subscription",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments",
                        to="billing.subscription",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AlterModelOptions(
            name="razorpayplan",
            options={
                "ordering": [
                    "target_role",
                    "plan",
                    "billing_cycle",
                ],
            },
        ),
    ]
