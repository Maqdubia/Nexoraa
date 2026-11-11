from .admin_user_management import AdminUserListView, AdminUserDeleteView
from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .serializers import EmailTokenObtainPairSerializer

from .views import (
    RegisterView,
    verify_email_otp,
    ProfileView,
    EducationListCreateView,
    EducationDetailView,
    SkillListCreateView,
    SkillDetailView,
    ExperienceListCreateView,
    ExperienceDetailView,
    SkillGapView,
    forgot_password,
    verify_reset_otp,
    reset_password,
    google_auth_config,
    google_auth,
    current_user,
)

from .admin_setup import initial_admin_setup
from .recruiter_registration import PublicRecruiterRegistrationView


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


urlpatterns = [
    path("google/config/", google_auth_config, name="google-auth-config"),
    path("google/", google_auth, name="google-auth"),
    path("me/", current_user, name="current-user"),
    path("initial-admin-setup/", initial_admin_setup, name="initial-admin-setup"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:user_id>/", AdminUserDeleteView.as_view(), name="admin-user-delete"),
    path("register/", RegisterView.as_view(), name="register"),
    path(
        "recruiter/register/",
        PublicRecruiterRegistrationView.as_view(),
        name="recruiter-register",
    ),
    path("verify-email-otp/", verify_email_otp, name="verify-email-otp"),

    path("login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),

    path("forgot-password/", forgot_password, name="forgot-password"),
    path("verify-reset-otp/", verify_reset_otp, name="verify-reset-otp"),
    path("reset-password/", reset_password, name="reset-password"),

    path("profile/", ProfileView.as_view(), name="profile"),

    path("education/", EducationListCreateView.as_view(), name="education-list-create"),
    path("education/<int:pk>/", EducationDetailView.as_view(), name="education-detail"),

    path("skills/", SkillListCreateView.as_view(), name="skill-list-create"),
    path("skills/<int:pk>/", SkillDetailView.as_view(), name="skill-detail"),

    path("experience/", ExperienceListCreateView.as_view(), name="experience-list-create"),
    path("experience/<int:pk>/", ExperienceDetailView.as_view(), name="experience-detail"),

    path("skill-gap/", SkillGapView.as_view(), name="skill-gap"),
]
