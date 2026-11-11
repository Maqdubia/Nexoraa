
import secrets
from datetime import timedelta

from django.contrib.auth.models import Group, User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle

from .models import EmailVerificationOTP, UserProfile
from .views import send_brevo_email, EmailDeliveryError


class RecruiterRegistrationThrottle(AnonRateThrottle):
    rate = "5/hour"
    scope = "recruiter_registration"


class RecruiterRegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    company = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=10,
        trim_whitespace=False,
    )

    def validate_email(self, value):
        email = value.strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages)

        return value


class PublicRecruiterRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RecruiterRegistrationThrottle]

    def post(self, request):
        serializer = RecruiterRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data["email"]
        full_name = data["full_name"].strip()
        company = data["company"].strip()

        if not full_name or not company:
            return Response(
                {"detail": "Full name and company are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = "recruiter_" + secrets.token_hex(12)
        otp = f"{secrets.randbelow(1000000):06d}"

        try:
            with transaction.atomic():
                if User.objects.filter(email__iexact=email).exists():
                    return Response(
                        {"detail": "An account with this email already exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=data["password"],
                    first_name=full_name,
                    is_active=False,
                    is_staff=False,
                    is_superuser=False,
                )

                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.full_name = full_name
                profile.company = company
                profile.save(update_fields=["full_name", "company"])

                recruiter_group, _ = Group.objects.get_or_create(name="HR")
                user.groups.add(recruiter_group)

                EmailVerificationOTP.objects.create(
                    user=user,
                    otp_hash=make_password(otp),
                    expires_at=timezone.now() + timedelta(minutes=10),
                )

        except Exception:
            return Response(
                {"detail": "Registration could not be completed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            send_brevo_email(
                to_email=email,
                to_name=full_name,
                subject="Verify your Nexora Recruiter Account",
                text_content=(
                    f"Hello {full_name},\n\n"
                    f"Your Nexora recruiter verification code is: {otp}\n\n"
                    "This code expires in 10 minutes.\n"
                    "Once verified, your recruiter account will be activated.\n\n"
                    "If you did not register, ignore this email."
                ),
            )
        except EmailDeliveryError:
            user.delete()
            return Response(
                {"detail": "Verification email could not be sent. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "detail": "Check your email for your six-digit verification code.",
                "email": email,
                "verification_required": True,
            },
            status=status.HTTP_201_CREATED,
        )
