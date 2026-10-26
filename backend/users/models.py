from django.db import models
from django.contrib.auth.models import User


# =========================================
# USER PROFILE
# =========================================

class UserProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    full_name = models.CharField(
        max_length=150,
        blank=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    location = models.CharField(
        max_length=150,
        blank=True
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    bio = models.TextField(
        blank=True
    )

    profile_picture = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.username


# =========================================
# EDUCATION
# =========================================

class Education(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="education"
    )

    institution = models.CharField(
        max_length=200
    )

    degree = models.CharField(
        max_length=150
    )

    field_of_study = models.CharField(
        max_length=150,
        blank=True
    )

    start_year = models.IntegerField()

    end_year = models.IntegerField(
        null=True,
        blank=True
    )

    description = models.TextField(
        blank=True
    )

    def __str__(self):
        return f"{self.degree} - {self.institution}"


# =========================================
# SKILL
# =========================================

class Skill(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="skills"
    )

    name = models.CharField(
        max_length=100
    )

    level = models.CharField(
        max_length=50,
        choices=[
            ("Beginner", "Beginner"),
            ("Intermediate", "Intermediate"),
            ("Advanced", "Advanced"),
        ],
        default="Beginner"
    )

    def __str__(self):
        return self.name


# =========================================
# EXPERIENCE
# =========================================

class Experience(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="experience"
    )

    company = models.CharField(
        max_length=200
    )

    job_title = models.CharField(
        max_length=150
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

    currently_working = models.BooleanField(
        default=False
    )

    description = models.TextField(
        blank=True
    )

    def __str__(self):
        return f"{self.job_title} - {self.company}"

# =========================================
# SKILL GAP
# =========================================

class SkillGap(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="skill_gaps"
    )

    resume = models.ForeignKey(
        "resumes.Resume",
        on_delete=models.CASCADE,
        related_name="skill_gaps"
    )

    required_skills = models.JSONField(
        default=list
    )

    user_skills = models.JSONField(
        default=list
    )

    missing_skills = models.JSONField(
        default=list
    )

    match_percentage = models.FloatField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Skill Gap - {self.user.username}"


# =========================================
# PASSWORD RESET OTP
# =========================================

class PasswordResetOTP(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_otp"
    )

    otp_hash = models.CharField(max_length=128)

    expires_at = models.DateTimeField()

    attempts = models.PositiveSmallIntegerField(default=0)

    reset_token_hash = models.CharField(
        max_length=128,
        blank=True,
        default=""
    )

    reset_token_expires_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Password reset for {self.user.username}"
# =========================================
# EMAIL VERIFICATION OTP
# =========================================

class EmailVerificationOTP(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification_otp"
    )

    otp_hash = models.CharField(max_length=128)

    expires_at = models.DateTimeField()

    attempts = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Email verification for {self.user.username}"
