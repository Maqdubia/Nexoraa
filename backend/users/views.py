import logging
import os
import secrets
from datetime import timedelta

import requests
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
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
# BREVO EMAIL HELPER (used by registration AND forgot-password)
# =========================================

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


class EmailDeliveryError(Exception):
    """Raised when an email could not be sent through Brevo."""


def _demo_otp_mode():
    return os.getenv("DEMO_OTP_MODE", "").strip().lower() in ("true", "1", "yes")


def send_brevo_email(to_email, to_name, subject, text_content):
    """Send one plain-text email through Brevo.

    Reads BREVO_API_KEY and BREVO_SENDER_EMAIL from the environment.
    Raises EmailDeliveryError on any failure. Never logs the API key,
    the message body or the OTP.
    """
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "").strip()

    if not api_key or not sender_email:
        logger.error("Brevo is not configured: BREVO_API_KEY or BREVO_SENDER_EMAIL is missing.")
        raise EmailDeliveryError("Email service is not configured.")

    try:
        response = requests.post(
            BREVO_URL,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "accept": "application/json",
            },
            json={
                "sender": {"name": "Nexora", "email": sender_email},
                "to": [{"email": to_email, "name": to_name or to_email}],
                "subject": subject,
                "textContent": text_content,
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.error("Brevo request failed: %s", exc.__class__.__name__)
        raise EmailDeliveryError("Could not reach the email service.") from exc

    if response.status_code >= 400:
        # Brevo's error text explains the cause (e.g. sender not verified).
        # It never contains our API key or the OTP.
        logger.error(
            "Brevo rejected the email: status=%s reason=%s",
            response.status_code,
            response.text[:300],
        )
        raise EmailDeliveryError("The email service rejected the message.")

    logger.info("Brevo accepted an email (status=%s).", response.status_code)


# =========================================
# REGISTER
# =========================================


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = str(request.data.get("email", "")).strip().lower()
        username = str(request.data.get("username", "")).strip()

        # Remove earlier unverified sign-ups so the person can try again.
        if email:
            User.objects.filter(email__iexact=email, is_active=False).delete()
        if username:
            User.objects.filter(username__iexact=username, is_active=False).delete()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp = f"{secrets.randbelow(1000000):06d}"

        # User + OTP are saved together: both or neither.
        with transaction.atomic():
            user = serializer.save()  # is_active=False
            EmailVerificationOTP.objects.create(
                user=user,
                otp_hash=make_password(otp),
                expires_at=timezone.now() + timedelta(minutes=10),
            )

        success = Response(
            {
                "detail": "Registration received. Check your email for the verification code.",
                "email": user.email,
                "verification_required": True,
            },
            status=status.HTTP_201_CREATED,
        )

        try:
            send_brevo_email(
                to_email=user.email,
                to_name=user.username,
                subject="Verify your Nexora email",
                text_content=(
                    f"Hello {user.username},\n\n"
                    f"Your Nexora email verification code is: {otp}\n\n"
                    "This code expires in 10 minutes.\n"
                    "If you did not create this account, you can ignore this email."
                ),
            )
        except EmailDeliveryError:
            if _demo_otp_mode():
                # Demo only: the OTP is shown in the server log.
                logger.warning("DEMO_OTP_MODE: email failed. OTP for %s is %s", user.email, otp)
                return success

            # Do not leave an unusable, unverified account behind.
            user.delete()  # also deletes the OTP record (CASCADE)
            return Response(
                {
                    "detail": (
                        "We couldn't send the verification email. "
                        "Please try registering again later."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return success


# =========================================
# VERIFY REGISTRATION EMAIL OTP
# =========================================

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email_otp(request):
    email = request.data.get("email", "").strip().lower()
    otp = str(request.data.get("otp", "")).strip()

    if not email or len(otp) != 6 or not otp.isdigit():
        return Response(
            {"detail": "Enter a valid email and six-digit OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()

    if not user:
        return Response(
            {"detail": "Invalid or expired verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.is_active:
        return Response(
            {"detail": "This email has already been verified. You can log in."},
            status=status.HTTP_200_OK,
        )

    try:
        record = user.email_verification_otp
    except EmailVerificationOTP.DoesNotExist:
        return Response(
            {"detail": "Invalid or expired verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.expires_at <= timezone.now():
        record.delete()
        return Response(
            {"detail": "Verification code expired. Please register again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.attempts >= 5:
        return Response(
            {"detail": "Too many attempts. Please register again."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not check_password(otp, record.otp_hash):
        record.attempts += 1
        record.save(update_fields=["attempts"])

        return Response(
            {"detail": "Invalid or expired verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_active = True
    user.save(update_fields=["is_active"])
    record.delete()

    return Response(
        {
            "detail": "Email verified successfully. log in.",
            "verified": True,
        },
        status=status.HTTP_200_OK,
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
        send_brevo_email(
            to_email=user.email,
            to_name=user.username,
            subject="Nexora Password Reset OTP",
            text_content=(
                f"Hello {user.username},\n\n"
                f"Your Nexora password reset OTP is: {otp}\n\n"
                "This OTP expires in 5 minutes.\n"
                "Do not share this code with anyone."
            ),
        )
    except EmailDeliveryError:
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
