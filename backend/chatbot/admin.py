
from django.contrib import admin
from .models import SupportTicket


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):

    list_display = (
        "reference_id",
        "customer_name",
        "email",
        "category",
        "issue",
        "status",
        "created_at",
    )

    list_filter = (
        "category",
        "status",
        "created_at",
    )

    search_fields = (
        "reference_id",
        "customer_name",
        "email",
        "issue",
        "description",
    )

    readonly_fields = (
        "reference_id",
        "created_at",
        "updated_at",
    )

    list_editable = ("status",)

