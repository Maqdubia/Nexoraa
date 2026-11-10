from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def get_role(user):
    """admin = superuser, hr = member of the HR group, otherwise student."""
    if user.is_superuser:
        return "admin"

    if user.groups.filter(name="HR").exists():
        return "hr"

    return "student"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    profile = getattr(user, "profile", None)
    full_name = (getattr(profile, "full_name", "") or "").strip()

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": full_name or user.get_full_name().strip() or user.username,
            "role": get_role(user),
        }
    )
