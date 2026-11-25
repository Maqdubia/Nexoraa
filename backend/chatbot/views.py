import logging

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .ai_service import get_chatbot_response
from .models import SupportTicket, ChatbotFeedback
from .serializers import (
    SupportTicketSerializer,
    ChatbotFeedbackSerializer,
)
from .catalog import SUPPORT_CATEGORIES
from .notifications import notify_ticket_created


class SupportCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "message": "Select a category to continue.",
            "categories": SUPPORT_CATEGORIES,
        })


class SupportTicketCreateView(generics.CreateAPIView):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user

        if user and user.is_authenticated:
            ticket = serializer.save(user=user)
        else:
            ticket = serializer.save()

        notify_ticket_created(ticket)


class ChatbotFeedbackCreateView(generics.CreateAPIView):
    queryset = ChatbotFeedback.objects.all()
    serializer_class = ChatbotFeedbackSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user

        if user and user.is_authenticated:
            serializer.save(user=user)
        else:
            serializer.save()


class ChatbotMessageView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "")

        if not isinstance(message, str) or not message.strip():
            return Response(
                {"error": "Please enter a message."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(message) > 2000:
            return Response(
                {"error": "Message must be 2000 characters or fewer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reply = get_chatbot_response(message.strip())

            return Response({
                "reply": reply
            })

        except Exception:
            logging.getLogger(__name__).exception(
                "Nexora chatbot Gemini request failed"
            )

            return Response(
                {
                    "error": (
                        "The support assistant is temporarily unavailable. "
                        "Please try again or create a support ticket."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
