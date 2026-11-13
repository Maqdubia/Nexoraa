# Generated for Nexora billing models.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RazorpayPlan",
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
                ("plan", models.CharField(
                    choices=[("starter", "Starter"), ("pro", "Pro")],
                    max_length=20,
                )),
                ("billing_cycle", models.CharField(
                    choices=[("monthly", "Monthly"), ("annual", "Annual")],
                    max_length=20,
                )),
                ("amount", models.PositiveIntegerField(
                    help_text="Amount in INR paise.",
                )),
                ("currency", models.CharField(default="INR", max_length=3)),
                ("razorpay_plan_id", models.CharField(
                    max_length=100,
                    unique=True,
                )),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["plan", "billing_cycle"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("plan", "billing_cycle"),
                        name="unique_razorpay_plan_cycle",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="Subscription",
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
                ("plan", models.CharField(
                    choices=[
                        ("free", "Free"),
                        ("starter", "Starter"),
                        ("pro", "Pro"),
                    ],
                    default="free",
                    max_length=20,
                )),
                ("billing_cycle", models.CharField(
                    choices=[("monthly", "Monthly"), ("annual", "Annual")],
                    default="monthly",
                    max_length=20,
                )),
                ("amount", models.PositiveIntegerField(
                    default=0,
                    help_text="Subscription amount in INR paise.",
                )),
                ("currency", models.CharField(default="INR", max_length=3)),
                ("status", models.CharField(
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
                    ],
                    db_index=True,
                    default="created",
                    max_length=20,
                )),
                ("razorpay_plan_id", models.CharField(
                    blank=True,
                    max_length=100,
                )),
                ("razorpay_subscription_id", models.CharField(
                    blank=True,
                    max_length=100,
                    null=True,
                    unique=True,
                )),
                ("razorpay_payment_id", models.CharField(
                    blank=True,
                    max_length=100,
                )),
                ("current_start", models.DateTimeField(
                    blank=True,
                    null=True,
                )),
                ("current_end", models.DateTimeField(
                    blank=True,
                    null=True,
                )),
                ("cancel_at_cycle_end", models.BooleanField(default=False)),
                ("cancelled_at", models.DateTimeField(
                    blank=True,
                    null=True,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="subscriptions",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["user", "status"],
                        name="billing_user_status_idx",
                    ),
                    models.Index(
                        fields=["razorpay_subscription_id"],
                        name="billing_razor_sub_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="SubscriptionWebhookEvent",
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
                ("event_id", models.CharField(
                    max_length=150,
                    unique=True,
                )),
                ("event_type", models.CharField(max_length=100)),
                ("payload", models.JSONField(default=dict)),
                ("processed", models.BooleanField(default=False)),
                ("received_at", models.DateTimeField(auto_now_add=True)),
                ("processed_at", models.DateTimeField(
                    blank=True,
                    null=True,
                )),
            ],
            options={
                "ordering": ["-received_at"],
            },
        ),
        migrations.CreateModel(
            name="FeatureUsage",
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
                ("feature", models.CharField(
                    choices=[
                        ("ats_generation", "ATS Resume Generation"),
                        ("ats_download", "ATS Resume Download"),
                    ],
                    max_length=40,
                )),
                ("period_start", models.DateField()),
                ("usage_count", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="feature_usage",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "ordering": ["-period_start"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("user", "feature", "period_start"),
                        name="unique_user_feature_period",
                    ),
                ],
            },
        ),
    ]
