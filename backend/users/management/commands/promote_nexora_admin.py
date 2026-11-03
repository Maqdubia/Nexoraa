import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Promote the existing Nexora account configured "
        "by NEXORA_ADMIN_EMAIL to superuser."
    )

    def handle(self, *args, **options):
        email = os.getenv(
            "NEXORA_ADMIN_EMAIL", ""
        ).strip().lower()

        if not email:
            raise CommandError(
                "Set NEXORA_ADMIN_EMAIL before running this command."
            )

        user = User.objects.filter(
            email__iexact=email
        ).first()

        if not user:
            raise CommandError(
                f"No account found for {email}. "
                "Register and verify this account first."
            )

        user.is_active = True
        user.is_staff = True
        user.is_superuser = True

        user.save(
            update_fields=[
                "is_active",
                "is_staff",
                "is_superuser",
            ]
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"{email} now has Nexora admin access. "
                "Existing password unchanged."
            )
        )
