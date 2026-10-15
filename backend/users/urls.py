


from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    RegisterView,
    ProfileView,
    EducationListCreateView,
    EducationDetailView,
    SkillListCreateView,
    SkillDetailView,
    ExperienceListCreateView,
    ExperienceDetailView,
    SkillGapView,
)


urlpatterns = [

    # =========================================
    # AUTHENTICATION
    # =========================================

    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="refresh",
    ),


    # =========================================
    # PROFILE
    # =========================================

    path(
        "profile/",
        ProfileView.as_view(),
        name="profile",
    ),


    # =========================================
    # EDUCATION
    # =========================================

    path(
        "education/",
        EducationListCreateView.as_view(),
        name="education-list-create",
    ),

    path(
        "education/<int:pk>/",
        EducationDetailView.as_view(),
        name="education-detail",
    ),


    # =========================================
    # SKILLS
    # =========================================

    path(
        "skills/",
        SkillListCreateView.as_view(),
        name="skill-list-create",
    ),

    path(
        "skills/<int:pk>/",
        SkillDetailView.as_view(),
        name="skill-detail",
    ),


    # =========================================
    # EXPERIENCE
    # =========================================

    path(
        "experience/",
        ExperienceListCreateView.as_view(),
        name="experience-list-create",
    ),

    path(
        "experience/<int:pk>/",
        ExperienceDetailView.as_view(),
        name="experience-detail",
    ),


    # =========================================
    # SKILL GAP
    # =========================================

    path(
        "skill-gap/",
        SkillGapView.as_view(),
        name="skill-gap",
    ),
]
