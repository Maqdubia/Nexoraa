from django.db import migrations


PLANS = [
    {
        "target_role": "student",
        "plan": "starter",
        "display_name": "Nexora Student Starter",
        "billing_cycle": "monthly",
        "amount": 49900,
        "razorpay_plan_id": "plan_U0zQPcmB2OrQTO",
    },
    {
        "target_role": "student",
        "plan": "pro",
        "display_name": "Nexora Student Pro",
        "billing_cycle": "annual",
        "amount": 573900,
        "razorpay_plan_id": "plan_U0zTZQ7JHzIP02",
    },
    {
        "target_role": "recruiter",
        "plan": "starter",
        "display_name": "Nexora Recruiter Starter",
        "billing_cycle": "monthly",
        "amount": 49900,
        "razorpay_plan_id": "plan_U1qOwrAVxUWY9X",
    },
    {
        "target_role": "recruiter",
        "plan": "pro",
        "display_name": "Nexora Recruiter Pro",
        "billing_cycle": "annual",
        "amount": 573900,
        "razorpay_plan_id": "plan_U1qQrR9AsRhw6z",
    },
]


def seed_plans(apps, schema_editor):
    RazorpayPlan = apps.get_model("billing", "RazorpayPlan")

    for plan_data in PLANS:
        plan_data = {
            **plan_data,
            "currency": "INR",
            "is_active": True,
        }

        RazorpayPlan.objects.update_or_create(
            target_role=plan_data["target_role"],
            plan=plan_data["plan"],
            billing_cycle=plan_data["billing_cycle"],
            defaults=plan_data,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0003_billing_roles_and_payment_history"),
    ]

    operations = [
        migrations.RunPython(
            seed_plans,
            migrations.RunPython.noop,
        ),
    ]
