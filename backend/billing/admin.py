
from django.contrib import admin

from .models import (
    Subscription,
    SubscriptionWebhookEvent,
    FeatureUsage,
)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "plan",
        "billing_cycle",
        "amount",
        "currency",
        "status",
        "is_active",
        "created_at",
    )

    list_filter = (
        "plan",
        "billing_cycle",
        "status",
        "currency",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "razorpay_subscription_id",
        "razorpay_payment_id",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "razorpay_subscription_id",
        "razorpay_payment_id",
    )

    ordering = ("-created_at",)


@admin.register(SubscriptionWebhookEvent)
class SubscriptionWebhookEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_id",
        "event_type",
        "processed",
        "received_at",
        "processed_at",
    )

    list_filter = (
        "event_type",
        "processed",
        "received_at",
    )

    search_fields = (
        "event_id",
        "event_type",
    )

    readonly_fields = (
        "event_id",
        "event_type",
        "payload",
        "processed",
        "received_at",
        "processed_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FeatureUsage)
class FeatureUsageAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "feature",
        "period_start",
        "usage_count",
        "updated_at",
    )

    list_filter = (
        "feature",
        "period_start",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "updated_at",
    )

    ordering = ("-period_start",)
