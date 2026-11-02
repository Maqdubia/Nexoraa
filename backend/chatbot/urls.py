
from django.urls import path

from .views import (
    SupportCategoriesView,
    SupportTicketCreateView,
)

urlpatterns = [
    path(
        "categories/",
        SupportCategoriesView.as_view(),
        name="support-categories",
    ),

    path(
        "tickets/",
        SupportTicketCreateView.as_view(),
        name="support-ticket-create",
    ),
]

