from django.urls import path

from .views import (
    SupportCategoriesView,
    SupportTicketCreateView,
    ChatbotMessageView,
    ChatbotFeedbackCreateView,
)

urlpatterns = [
    path(
        "categories/",
        SupportCategoriesView.as_view(),
        name="support-categories",
    ),
    path(
        "chat/",
        ChatbotMessageView.as_view(),
        name="chatbot-message",
    ),
    path(
        "tickets/",
        SupportTicketCreateView.as_view(),
        name="support-ticket-create",
    ),
    path(
        "feedback/",
        ChatbotFeedbackCreateView.as_view(),
        name="chatbot-feedback-create",
    ),
]
