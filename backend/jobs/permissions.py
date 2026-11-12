
from rest_framework.permissions import BasePermission


class IsHR(BasePermission):
    message = "A recruiter account is required to manage job postings."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.groups.filter(name="HR").exists()
            )
        )


class IsAdminUser(BasePermission):
    message = "Only the Nexora administrator can manage recruiter accounts."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsStudent(BasePermission):
    message = "A student account is required to apply for jobs."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and not user.is_superuser
            and not user.groups.filter(name="HR").exists()
        )
