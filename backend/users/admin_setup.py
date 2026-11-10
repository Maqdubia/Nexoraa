
import hmac
import os

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import UserProfile


ADMIN_EMAIL = "nexora.job.app@gmail.com"


@api_view(["POST"])
@permission_classes([AllowAny])
def initial_admin_setup(request):
    setup_key = os.getenv("NEXORA_ADMIN_SETUP_KEY", "").strip()

    if not setup_key:
        return Response(
            {"detail": "Admin setup is currently disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    supplied_key = str(request.data.get("setup_key", ""))

    if not hmac.compare_digest(supplied_key, setup_key):
        return Response(
            {"detail": "Invalid setup credentials."},
            status=status.HTTP_403_FORBIDDEN,
        )

    email = str(request.data.get("email", "")).strip().lower()
    full_name = str(request.data.get("full_name", "")).strip()
    password = request.data.get("password", "")

    if email != ADMIN_EMAIL:
        return Response(
            {"detail": "This email is not authorized for initial Admin setup."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not full_name or not password:
        return Response(
            {"detail": "Full name and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    username = email.split("@", 1)[0]

    try:
        validate_password(password)
    except ValidationError as exc:
        return Response(
            {"detail": list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        if User.objects.filter(is_superuser=True).exists():
            return Response(
                {"detail": "Initial Admin setup has already been completed."},
                status=status.HTTP_409_CONFLICT,
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "An account already exists for this Admin email."},
                status=status.HTTP_409_CONFLICT,
            )

        if User.objects.filter(username__iexact=username).exists():
            return Response(
                {"detail": "The Admin username is already in use."},
                status=status.HTTP_409_CONFLICT,
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=full_name[:150],
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )

        UserProfile.objects.create(
            user=user,
            full_name=full_name[:150],
        )

    return Response(
        {
            "detail": "Initial Admin account created successfully. You can now sign in.",
            "email": user.email,
            "role": "admin",
        },
        status=status.HTTP_201_CREATED,
    )
