
import logging
import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import (
    UserProfile,
    Education,
    Skill,
    Experience,
    SkillGap,
    PasswordResetOTP,
    EmailVerificationOTP,
)

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    EducationSerializer,
    SkillSerializer,
    ExperienceSerializer,
    SkillGapSerializer,
)


logger = logging.getLogger(__name__)


# =========================================
# REGISTER
# =========================================


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        otp = f"{secrets.randbelow(1000000):06d}"
        now = timezone.now()

        record = EmailVerificationOTP.objects.create(
            user=user,
            otp_hash=make_password(otp),
            expires_at=now + timedelta(minutes=10),
        )

        try:
            import os
            import requests as http

            api_key = os.getenv("RESEND_API_KEY", "")

            if not api_key:
                raise RuntimeError("Email service is not configured.")

            mail = http.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "Nexora <onboarding@resend.dev>",
                    "to": [user.email],
                    "subject": "Verify your Nexora email",
                    "text": (
                        f"Hello {user.username},\n\n"
                        f"Your Nexora email verification code is: {otp}\n\n"
                        "This code expires in 10 minutes.\n"
                        "If you did not create this account, you can ignore this email."
                    ),
                },
                timeout=15,
            )
            mail.raise_for_status()

        except Exception:
            logger.exception("Failed to send Nexora verification email.")
            record.delete()
            user.delete()

            return Response(
                {
                    "detail": (
                        "We couldn't send the verification email. "
                        "Please try registering again later."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "detail": (
                    "Registration received. Check your email for "
                    "the verification code."
                ),
                "email": user.email,
                "verification_required": True,
            },
            status=status.HTTP_201_CREATED,
        )

# =========================================
# USER PROFILE
# =========================================

class ProfileView(generics.RetrieveUpdateAPIView):

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):

        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user
        )

        return profile


# =========================================
# EDUCATION
# =========================================

class EducationListCreateView(generics.ListCreateAPIView):

    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EducationDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)


# =========================================
# SKILLS
# =========================================

class SkillListCreateView(generics.ListCreateAPIView):

    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Skill.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SkillDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Skill.objects.filter(user=self.request.user)


# =========================================
# EXPERIENCE
# =========================================

class ExperienceListCreateView(generics.ListCreateAPIView):

    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)


# =========================================
# SKILL GAP
# =========================================

class SkillGapView(generics.CreateAPIView):

    serializer_class = SkillGapSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        resume = serializer.validated_data["resume"]
        required_skills = serializer.validated_data["required_skills"]

        user_skills = resume.extracted_skills or []

        user_skills_lower = [
            skill.lower()
            for skill in user_skills
        ]

        missing_skills = [
            skill
            for skill in required_skills
            if skill.lower() not in user_skills_lower
        ]

        if required_skills:
            matched_skills = len(required_skills) - len(missing_skills)
            match_percentage = (
                matched_skills / len(required_skills)
            ) * 100
        else:
            match_percentage = 0

        serializer.save(
            user=self.request.user,
            user_skills=user_skills,
            missing_skills=missing_skills,
            match_percentage=round(match_percentage, 2),
        )


# =========================================
# FORGOT PASSWORD - SEND OTP EMAIL
# =========================================

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):

    email = request.data.get("email", "").strip()

    if not email:
        return Response(
            {"detail": "Email address is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()

    # Use the same response whether the email exists or not.
    generic_response = {
        "detail": "If an account exists for this email, an OTP will be sent."
    }

    if not user:
        return Response(generic_response, status=status.HTTP_200_OK)

    otp = f"{secrets.randbelow(1000000):06d}"
    now = timezone.now()

    # Save only a hash of the OTP.
    record, created = PasswordResetOTP.objects.get_or_create(
        user=user,
        defaults={
            "otp_hash": make_password(otp),
            "expires_at": now + timedelta(minutes=5),
        },
    )

    record.otp_hash = make_password(otp)
    record.expires_at = now + timedelta(minutes=5)
    record.attempts = 0
    record.reset_token_hash = ""
    record.reset_token_expires_at = None
    record.save()

    try:
        import os
        import requests as http

        mail = http.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": "Bearer " + os.getenv("RESEND_API_KEY", ""),
                "Content-Type": "application/json",
            },
            json={
                "from": "Nexora <onboarding@resend.dev>",
                "to": [user.email],
                "subject": "Nexora Password Reset OTP",
                "text": (
                    f"Hello {user.username},\n\n"
                    f"Your Nexora password reset OTP is: {otp}\n\n"
                    "This OTP expires in 5 minutes.\n"
                    "Do not share this code with anyone."
                ),
            },
            timeout=15,
        )
        mail.raise_for_status()

    except Exception:
        logger.exception("Failed to send Nexora password reset email.")

        # Invalidate the OTP if email delivery failed.
        record.delete()

        return Response(
            {"detail": "Email delivery failed. Please try again later."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(generic_response, status=status.HTTP_200_OK)


# =========================================
# VERIFY PASSWORD RESET OTP
# =========================================

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_reset_otp(request):

    email = request.data.get("email", "").strip()
    otp = str(request.data.get("otp", "")).strip()

    if not email or len(otp) != 6 or not otp.isdigit():
        return Response(
            {"detail": "Enter a valid six-digit OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()

    if not user:
        return Response(
            {"detail": "Invalid or expired OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        record = user.password_reset_otp
    except PasswordResetOTP.DoesNotExist:
        return Response(
            {"detail": "Invalid or expired OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.expires_at <= timezone.now():
        record.delete()
        return Response(
            {"detail": "OTP expired. Please request a new OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.attempts >= 5:
        return Response(
            {"detail": "Too many attempts. Please request a new OTP."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not check_password(otp, record.otp_hash):
        record.attempts += 1
        record.save(update_fields=["attempts"])

        return Response(
            {"detail": "Invalid or expired OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # OTP is valid. Create a temporary reset token.
    reset_token = secrets.token_urlsafe(32)

    record.reset_token_hash = make_password(reset_token)
    record.reset_token_expires_at = timezone.now() + timedelta(minutes=10)
    record.otp_hash = ""
    record.save(
        update_fields=[
            "reset_token_hash",
            "reset_token_expires_at",
            "otp_hash",
        ]
    )

    return Response(
        {
            "detail": "OTP verified successfully.",
            "reset_token": reset_token,
        },
        status=status.HTTP_200_OK,
    )


# =========================================
# RESET PASSWORD
# =========================================

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):

    email = request.data.get("email", "").strip()
    reset_token = request.data.get("reset_token", "")
    new_password = request.data.get("new_password", "")

    if not email or not reset_token or not new_password:
        return Response(
            {"detail": "Email, reset token, and new password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()

    if not user:
        return Response(
            {"detail": "Invalid or expired password reset session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        record = user.password_reset_otp
    except PasswordResetOTP.DoesNotExist:
        return Response(
            {"detail": "Invalid or expired password reset session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        not record.reset_token_hash
        or not record.reset_token_expires_at
        or record.reset_token_expires_at <= timezone.now()
        or not check_password(reset_token, record.reset_token_hash)
    ):
        return Response(
            {"detail": "Invalid or expired password reset session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(new_password, user=user)
    except ValidationError as exc:
        return Response(
            {"detail": list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save(update_fields=["password"])

    # Invalidate the reset token after a successful password change.
    record.delete()

    return Response(
        {
            "detail": "Password reset successful. Please log in with your new password."
        },
        status=status.HTTP_200_OK,
    )
