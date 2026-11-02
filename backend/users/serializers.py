from .serializers import EmailTokenObtainPairSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    UserProfile,
    Education,
    Skill,
    Experience,
    SkillGap,
)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


# =========================================
# REGISTER
# =========================================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value.strip()).exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value.strip()

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=False,
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



    def to_internal_value(self, data):
        data = data.copy()

        # Accept either an email field or username field.
        email = data.get("email")

        if email and not data.get(self.username_field):
            data[self.username_field] = email.strip()

        return super().to_internal_value(data)

    def validate(self, attrs):
        identifier = attrs.get(self.username_field)

        # Convert email into the corresponding Django username.
        user = User.objects.filter(
            email__iexact=identifier
        ).first()

        if user:
            attrs[self.username_field] = user.get_username()

        return super().validate(attrs)
