import uuid

from django.conf import settings
from django.db import models


class SupportTicket(models.Model):

    CATEGORY_CHOICES = [
        ("account", "Account & Login"),
        ("verification", "OTP & Verification"),
        ("resume", "Resume & ATS"),
        ("jobs", "Jobs & Applications"),
        ("interview", "Interview Practice"),
        ("profile", "Profile & Settings"),
        ("technical", "Technical Issues"),
        ("other", "Other Issues"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    reference_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_tickets",
    )

    customer_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
    )

    issue = models.CharField(max_length=200)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open",
    )

    admin_response = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = f"NX-{uuid.uuid4().hex[:10].upper()}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_id} - {self.issue}"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"


class ChatbotFeedback(models.Model):

    RATING_CHOICES = [
        ("positive", "Positive"),
        ("negative", "Negative"),
    ]

    POSITIVE_REASONS = [
        ("helpful", "Helpful"),
        ("clear", "Clear"),
        ("accurate", "Accurate"),
        ("solved_issue", "Solved my issue"),
    ]

    NEGATIVE_REASONS = [
        ("incorrect", "Incorrect"),
        ("not_relevant", "Not relevant"),
        ("incomplete", "Incomplete"),
        ("unclear", "Unclear"),
    ]

    REASON_CHOICES = POSITIVE_REASONS + NEGATIVE_REASONS

    rating = models.CharField(
        max_length=10,
        choices=RATING_CHOICES,
    )

    reason = models.CharField(
        max_length=20,
        choices=REASON_CHOICES,
    )

    category = models.CharField(
        max_length=30,
        choices=SupportTicket.CATEGORY_CHOICES,
        blank=True,
        default="",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chatbot_feedback_entries",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_rating_display()} - {self.get_reason_display()}"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Chatbot Feedback"
        verbose_name_plural = "Chatbot Feedback"
