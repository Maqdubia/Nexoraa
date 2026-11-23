
from django.contrib import admin

from .models import SupportTicket
from .notifications import notify_ticket_reply


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
        "admin_response",
    )

    readonly_fields = (
        "reference_id",
        "created_at",
        "updated_at",
    )

    list_editable = ("status",)

    def save_model(self, request, obj, form, change):
        previous_response = ""

        if obj.pk:
            previous_response = (
                SupportTicket.objects
                .filter(pk=obj.pk)
                .values_list("admin_response", flat=True)
                .first()
                or ""
            )

        super().save_model(request, obj, form, change)

        current_response = (obj.admin_response or "").strip()

        if (
            current_response
            and current_response != previous_response.strip()
        ):
            notify_ticket_reply(obj)
