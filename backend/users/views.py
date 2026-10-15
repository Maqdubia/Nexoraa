

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import (
    UserProfile,
    Education,
    Skill,
    Experience,
    SkillGap,
)

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    EducationSerializer,
    SkillSerializer,
    ExperienceSerializer,
    SkillGapSerializer,
)


# =========================================
# REGISTER
# =========================================

class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer


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


class EducationDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Education.objects.filter(
            user=self.request.user
        )


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


class SkillDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Skill.objects.filter(
            user=self.request.user
        )


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

class ExperienceDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Experience.objects.filter(
            user=self.request.user
        )


# =========================================
# SKILL GAP
# =========================================

class SkillGapView(generics.CreateAPIView):

    serializer_class = SkillGapSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        resume = serializer.validated_data["resume"]

        required_skills = serializer.validated_data[
            "required_skills"
        ]

        # Get skills extracted from the resume
        user_skills = resume.extracted_skills or []

        # Convert user skills to lowercase
        user_skills_lower = [
            skill.lower()
            for skill in user_skills
        ]

        # Find missing skills
        missing_skills = []

        for skill in required_skills:

            if skill.lower() not in user_skills_lower:
                missing_skills.append(skill)

        # Calculate match percentage
        if len(required_skills) > 0:

            matched_skills = (
                len(required_skills)
                - len(missing_skills)
            )

            match_percentage = (
                matched_skills
                / len(required_skills)
            ) * 100

        else:

            match_percentage = 0

        # Save Skill Gap
        serializer.save(
            user=self.request.user,
            user_skills=user_skills,
            missing_skills=missing_skills,
            match_percentage=round(
                match_percentage,
                2
            ),
        )
