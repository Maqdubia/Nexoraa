
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


def _is_nexora_admin(user):
    return bool(user and user.is_authenticated and user.is_superuser)


def _user_role(user):
    if user.is_superuser:
        return "admin"
    if user.groups.filter(name="HR").exists():
        return "recruiter"
    return "student"


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_nexora_admin(request.user):
            return Response(
                {"detail": "Administrator access is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        users = User.objects.exclude(is_superuser=True).select_related(
            "profile"
        ).order_by("id")

        results = []
        for user in users:
            profile = getattr(user, "profile", None)
            results.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": profile.full_name if profile else "",
                "company": profile.company if profile else "",
                "role": _user_role(user),
                "is_active": user.is_active,
                "date_joined": user.date_joined,
            })

        return Response(results, status=status.HTTP_200_OK)


class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if not _is_nexora_admin(request.user):
            return Response(
                {"detail": "Administrator access is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_superuser or user.pk == request.user.pk:
            return Response(
                {"detail": "Administrator accounts cannot be deleted here."},
                status=status.HTTP_403_FORBIDDEN,
            )

        deleted_email = user.email
        user.delete()

        return Response(
            {
                "detail": "Account permanently deleted.",
                "email": deleted_email,
            },
            status=status.HTTP_200_OK,
        )
