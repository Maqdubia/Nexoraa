
from rest_framework import serializers
from .models import SupportTicket
from .catalog import SUPPORT_CATEGORIES


class SupportTicketSerializer(serializers.ModelSerializer):

    class Meta:
        model = SupportTicket
        fields = [
            "reference_id",
            "customer_name",
            "email",
            "category",
            "issue",
            "description",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "reference_id",
            "status",
            "created_at",
        ]

    def validate_category(self, value):
        valid_categories = [
            category["id"]
            for category in SUPPORT_CATEGORIES
        ]

        if value not in valid_categories:
            raise serializers.ValidationError(
                "Please select a valid support category."
            )

        return value

    def validate(self, attrs):
        category_id = attrs.get("category")
        issue = attrs.get("issue", "").strip()
        description = attrs.get("description", "").strip()

        selected_category = next(
            (
                category
                for category in SUPPORT_CATEGORIES
                if category["id"] == category_id
            ),
            None,
        )

        if not selected_category:
            raise serializers.ValidationError(
                "Invalid support category."
            )

        allowed_issues = selected_category["issues"]

        if issue not in allowed_issues and issue != "Other":
            raise serializers.ValidationError({
                "issue": "Please select an available issue or choose Other."
            })

        if not description:
            raise serializers.ValidationError({
                "description": "Please describe your issue."
            })

        if not attrs.get("email"):
            raise serializers.ValidationError({
                "email": "Please provide an email address for support follow-up."
            })

        return attrs

