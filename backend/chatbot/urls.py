
from django.urls import path
from .views import (
    SupportCategoriesView,
    SupportTicketCreateView,
    ChatbotMessageView,
)
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
    path("chat/", ChatbotMessageView.as_view(), name="chatbot-message"),

    path(
        "tickets/",
        SupportTicketCreateView.as_view(),
        name="support-ticket-create",
    ),
]

