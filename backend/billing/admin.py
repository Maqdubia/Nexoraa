from django.contrib import admin

from .models import (
    RazorpayPlan,
    Subscription,
    SubscriptionPayment,
    SubscriptionWebhookEvent,
    FeatureUsage,
)


@admin.register(RazorpayPlan)
class RazorpayPlanAdmin(admin.ModelAdmin):
    list_display = (
        "target_role",
        "display_name",
        "plan",
        "billing_cycle",
        "amount",
        "currency",
        "razorpay_plan_id",
        "is_active",
    )

    list_filter = (
        "target_role",
        "plan",
        "billing_cycle",
        "is_active",
    )

    search_fields = (
        "display_name",
        "razorpay_plan_id",
    )

    readonly_fields = ("created_at",)

    ordering = (
        "target_role",
        "plan",
        "billing_cycle",
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "target_role",
        "plan",
        "billing_cycle",
        "amount",
        "currency",
        "status",
        "is_active",
        "created_at",
    )

    list_filter = (
        "target_role",
        "plan",
        "billing_cycle",
        "status",
        "currency",
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
        "last_provider_event_at",
    )

    ordering = ("-created_at",)


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "razorpay_payment_id",
        "subscription",
        "amount",
        "currency",
        "method",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "currency",
        "method",
    )

    search_fields = (
        "razorpay_payment_id",
        "invoice_id",
        "subscription__user__email",
    )

    readonly_fields = (
        "subscription",
        "razorpay_payment_id",
        "invoice_id",
        "amount",
        "currency",
        "method",
        "status",
        "raw_payload",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


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

    readonly_fields = ("updated_at",)

    ordering = ("-period_start",)
