from rest_framework import status
from .ai_service import get_chatbot_response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import generics

from .models import SupportTicket
from .serializers import SupportTicketSerializer
from .catalog import SUPPORT_CATEGORIES

# =========================================
# NEXORA SUPPORT ISSUE CATEGORIES
# =========================================

SUPPORT_CATEGORIES = [
    {
        "id": "account",
        "name": "Account & Login",
        "issues": [
            "Unable to create an account",
            "Unable to log in",
            "Account not found",
            "Incorrect password",
            "Account access problem",
        ],
    },
    {
        "id": "verification",
        "name": "OTP & Verification",
        "issues": [
            "OTP not received",
            "Invalid OTP",
            "OTP verification failed",
            "Verification link not working",
            "Email verification problem",
        ],
    },
    {
        "id": "resume",
        "name": "Resume & ATS",
        "issues": [
            "Unable to upload resume",
            "Resume upload failed",
            "ATS score not generating",
            "Resume analysis incorrect",
            "Missing skills not detected",
        ],
    },
    {
        "id": "jobs",
        "name": "Jobs & Applications",
        "issues": [
            "Jobs are not loading",
            "Unable to apply for a job",
            "Apply button not working",
            "Application status not updating",
            "Unable to view my applications",
        ],
    },
    {
        "id": "interview",
        "name": "Interview Practice",
        "issues": [
            "Unable to start an interview",
            "Questions are not generating",
            "Unable to submit an answer",
            "Interview feedback not showing",
            "Interview history not loading",
        ],
    },
    {
        "id": "profile",
        "name": "Profile & Settings",
        "issues": [
            "Unable to update profile",
            "Profile picture not uploading",
            "Education details not saving",
            "Skills not updating",
            "Experience details not saving",
        ],
    },
    {
        "id": "technical",
        "name": "Technical Issues",
        "issues": [
            "Website not loading",
            "Page displaying an error",
            "Button or feature not working",
            "Website running slowly",
            "Other technical problem",
        ],
    },
    {
        "id": "other",
        "name": "Other Issues",
        "issues": [
            "General website question",
            "Feature assistance",
            "Other issue not listed",
        ],
    },
]


# =========================================
# GET SUPPORT CATEGORIES
# =========================================

class SupportCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "message": "Select a category to continue.",
            "categories": SUPPORT_CATEGORIES,
        })


# =========================================
# CREATE SUPPORT TICKET
# =========================================

class SupportTicketCreateView(generics.CreateAPIView):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
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

        reply = get_chatbot_response(message.strip())

        return Response({
            "reply": reply
        })
