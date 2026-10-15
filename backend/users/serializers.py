
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    UserProfile,
    Education,
    Skill,
    Experience,
    SkillGap,
)




# =========================================
# REGISTER
# =========================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password"
        ]

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        return user


# =========================================
# USER PROFILE
# =========================================

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile

        fields = [
            "id",
            "full_name",
            "phone",
            "location",
            "date_of_birth",
            "bio",
            "profile_picture",
        ]


# =========================================
# EDUCATION
# =========================================

class EducationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Education

        fields = [
            "id",
            "institution",
            "degree",
            "field_of_study",
            "start_year",
            "end_year",
            "description",
        ]


# =========================================
# SKILL
# =========================================

class SkillSerializer(serializers.ModelSerializer):

    class Meta:
        model = Skill

        fields = [
            "id",
            "name",
            "level",
        ]


# =========================================
# EXPERIENCE
# =========================================

class ExperienceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Experience

        fields = [
            "id",
            "company",
            "job_title",
            "start_date",
            "end_date",
            "currently_working",
            "description",
        ]


# =========================================
# SKILL GAP SERIALIZER
# =========================================

class SkillGapSerializer(serializers.ModelSerializer):

    class Meta:
        model = SkillGap

        fields = [
            "id",
            "user",
            "resume",
            "required_skills",
            "user_skills",
            "missing_skills",
            "match_percentage",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "user_skills",
            "missing_skills",
            "match_percentage",
            "created_at",
        ]