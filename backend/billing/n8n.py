
import logging
import requests

from django.conf import settings
from django.utils import timezone


logger = logging.getLogger(__name__)


def notify_n8n_payment_verified(
    subscription,
    payment_data,
    event_type,
):
    """
    Send a verified successful Razorpay subscription payment to n8n.
    """

    webhook_url = getattr(
        settings,
        "N8N_PAYMENT_VERIFIED_WEBHOOK_URL",
        "",
    ).strip()

    webhook_secret = getattr(
        settings,
        "N8N_WEBHOOK_SECRET",
        "",
    ).strip()

    if not webhook_url or not webhook_secret:
        logger.warning(
            "N8N payment webhook is not configured."
        )
        return

    payment_status = str(
        payment_data.get("status", "")
    ).strip().lower()

    if payment_status not in ("captured", "paid"):
        logger.info(
            "Skipping unconfirmed Razorpay payment."
        )
        return

    user_email = (
        subscription.user.email or ""
    ).strip().lower()

    subscription_id = (
        subscription.razorpay_subscription_id or ""
    ).strip()

    if not user_email or not subscription_id:
        logger.warning(
            "Missing customer email or subscription ID."
        )
        return

    try:
        amount_paise = int(
            payment_data.get("amount")
            or subscription.amount
            or 0
        )
    except (TypeError, ValueError):
        amount_paise = int(subscription.amount or 0)

    payload = {
        "verified": True,
        "payment_status": payment_status,
        "user_email": user_email,
        "subscription_id": subscription_id,
        "plan": subscription.plan,
        "amount": round(amount_paise / 100, 2),
        "event_date": timezone.now().isoformat(),
        "event_type": event_type,
    }

    try:
        response = requests.post(
            webhook_url,
            json=payload,
            headers={
                "X-Nexora-Webhook-Secret": webhook_secret,
            },
            timeout=(3.05, 10),
        )

        response.raise_for_status()

        logger.info(
            "N8N received verified payment for subscription %s.",
            subscription.pk,
        )

    except requests.RequestException as exc:
        logger.warning(
            "N8N payment notification failed: %s",
            type(exc).__name__,
        )
