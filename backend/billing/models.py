
from django.db import models
from django.conf import settings
from django.utils import timezone


class RazorpayPlan(models.Model):
    PLAN_CHOICES = [
        ("starter", "Starter"),
        ("pro", "Pro"),
    ]

    BILLING_CYCLE_CHOICES = [
        ("monthly", "Monthly"),
        ("annual", "Annual"),
    ]

    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
    )
    amount = models.PositiveIntegerField(
        help_text="Amount in INR paise."
    )
    currency = models.CharField(max_length=3, default="INR")
    razorpay_plan_id = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["plan", "billing_cycle"]
        constraints = [
            models.UniqueConstraint(
                fields=("plan", "billing_cycle"),
                name="unique_razorpay_plan_cycle",
            ),
        ]

    def __str__(self):
        return f"{self.plan} - {self.billing_cycle}"


class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", "Free"),
        ("starter", "Starter"),
        ("pro", "Pro"),
    ]

    BILLING_CYCLE_CHOICES = [
        ("monthly", "Monthly"),
        ("annual", "Annual"),
    ]

    STATUS_CHOICES = [
        ("created", "Created"),
        ("authenticated", "Authenticated"),
        ("active", "Active"),
        ("pending", "Pending"),
        ("halted", "Halted"),
        ("paused", "Paused"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("expired", "Expired"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES,
        default="free",
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
        default="monthly",
    )
    amount = models.PositiveIntegerField(
        default=0,
        help_text="Subscription amount in INR paise.",
    )
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="created",
        db_index=True,
    )
    razorpay_plan_id = models.CharField(max_length=100, blank=True)
    razorpay_subscription_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
    )
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    current_start = models.DateTimeField(null=True, blank=True)
    current_end = models.DateTimeField(null=True, blank=True)
    cancel_at_cycle_end = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "status"],
                name="billing_user_status_idx",
            ),
            models.Index(
                fields=["razorpay_subscription_id"],
                name="billing_razor_sub_idx",
            ),
        ]

    @property
    def is_active(self):
        return (
            self.status == "active"
            and (
                self.current_end is None
                or self.current_end > timezone.now()
            )
        )

    def __str__(self):
        return f"{self.user} - {self.plan} ({self.status})"


class SubscriptionWebhookEvent(models.Model):
    event_id = models.CharField(max_length=150, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    processed = models.BooleanField(default=False)
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-received_at"]

    def __str__(self):
        return f"{self.event_type} - {self.event_id}"


class FeatureUsage(models.Model):
    FEATURE_CHOICES = [
        ("ats_generation", "ATS Resume Generation"),
        ("ats_download", "ATS Resume Download"),
        ("text_interview", "Completed Text Interview"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feature_usage",
    )
    feature = models.CharField(
        max_length=40,
        choices=FEATURE_CHOICES,
    )
    period_start = models.DateField()
    usage_count = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period_start"]
        constraints = [
            models.UniqueConstraint(
                fields=("user", "feature", "period_start"),
                name="unique_user_feature_period",
            ),
        ]

    def __str__(self):
        return (
            f"{self.user} - {self.feature} - "
            f"{self.period_start}: {self.usage_count}"
        )
