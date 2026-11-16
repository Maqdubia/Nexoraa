
import hashlib
import hmac
import logging
import os
from datetime import datetime, timezone as datetime_timezone

import requests

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    RazorpayPlan,
    Subscription,
    SubscriptionPayment,
    SubscriptionWebhookEvent,
)


logger = logging.getLogger(__name__)

RAZORPAY_API_URL = "https://api.razorpay.com/v1"


def _current_role(user):
    if user.is_superuser:
        return "admin"

    if user.groups.filter(name="HR").exists():
        return "recruiter"

    return "student"


def _razorpay_is_configured():
    return bool(
        settings.RAZORPAY_KEY_ID
        and settings.RAZORPAY_KEY_SECRET
    )


def _razorpay_test_mode():
    return settings.RAZORPAY_KEY_ID.startswith("rzp_test_")


def _razorpay_request(method, endpoint, payload=None):
    if not _razorpay_is_configured():
        raise ValueError("Razorpay API credentials are not configured.")

    if not _razorpay_test_mode():
        raise ValueError("Only Razorpay Test Mode is allowed during setup.")

    try:
        response = requests.request(
            method=method,
            url=f"{RAZORPAY_API_URL}/{endpoint.lstrip('/')}",
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            ),
            json=payload,
            timeout=20,
        )
    except requests.RequestException as exc:
        logger.error("Razorpay API connection failed: %s", type(exc).__name__)
        raise ValueError("Unable to connect to Razorpay. Please try again.") from exc

    try:
        result = response.json()
    except ValueError:
        result = {}

    if not response.ok:
        error = result.get("error", {})
        message = error.get("description", "Razorpay request failed.")
        logger.warning("Razorpay API returned HTTP %s.", response.status_code)
        raise ValueError(message[:250])

    return result


def _from_razorpay_timestamp(value):
    if not value:
        return None

    try:
        return datetime.fromtimestamp(
            int(value),
            tz=datetime_timezone.utc,
        )
    except (TypeError, ValueError, OverflowError):
        return None


@api_view(["GET"])
@permission_classes([AllowAny])
def billing_config(request):
    key_id = settings.RAZORPAY_KEY_ID

    return Response({
        "configured": bool(key_id and settings.RAZORPAY_KEY_SECRET),
        "key_id": key_id if key_id.startswith("rzp_test_") else "",
        "test_mode": key_id.startswith("rzp_test_"),
        "currency": "INR",
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def billing_plans(request):
    target_role = request.query_params.get("role")

    if target_role and target_role not in ("student", "recruiter"):
        return Response(
            {"detail": "Invalid plan category."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    plans = RazorpayPlan.objects.filter(is_active=True)

    if target_role:
        plans = plans.filter(target_role=target_role)

    return Response([
        {
            "id": plan.id,
            "target_role": plan.target_role,
            "plan": plan.plan,
            "display_name": (
                plan.display_name or plan.plan.title()
            ),
            "billing_cycle": plan.billing_cycle,
            "amount": plan.amount,
            "currency": plan.currency,
        }
        for plan in plans
    ])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_subscription(request):
    role = _current_role(request.user)

    if role not in ("student", "recruiter"):
        return Response(
            {"detail": "Administrator accounts cannot purchase plans."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        local_plan_id = int(request.data.get("plan_id"))
    except (TypeError, ValueError):
        return Response(
            {"detail": "A valid plan ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    plan = RazorpayPlan.objects.filter(
        id=local_plan_id,
        target_role=role,
        is_active=True,
    ).first()

    if not plan:
        return Response(
            {"detail": "This plan is unavailable for your account."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        total_count = 120 if plan.billing_cycle == "monthly" else 10

        razorpay_data = _razorpay_request(
            "POST",
            "/subscriptions",
            {
                "plan_id": plan.razorpay_plan_id,
                "total_count": total_count,
                "quantity": 1,
                "customer_notify": True,
                "notes": {
                    "nexora_user_id": str(request.user.id),
                    "nexora_plan_id": str(plan.id),
                },
            },
        )

        remote_id = razorpay_data.get("id")

        if not remote_id:
            raise ValueError("Razorpay did not return a subscription ID.")

        subscription = Subscription.objects.create(
            user=request.user,
            target_role=role,
            plan=plan.plan,
            billing_cycle=plan.billing_cycle,
            amount=plan.amount,
            currency=plan.currency,
            status="created",
            razorpay_plan_id=plan.razorpay_plan_id,
            razorpay_subscription_id=remote_id,
        )

        return Response(
            {
                "local_subscription_id": subscription.id,
                "subscription_id": remote_id,
                "key_id": settings.RAZORPAY_KEY_ID,
                "name": "Nexora",
                "description": (
                    plan.display_name or plan.plan.title()
                ),
                "prefill": {
                    "name": request.user.get_full_name()
                    or request.user.username,
                    "email": request.user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except ValueError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_subscription(request):
    local_id = request.data.get("local_subscription_id")
    payment_id = str(
        request.data.get("razorpay_payment_id", "")
    ).strip()
    remote_id = str(
        request.data.get("razorpay_subscription_id", "")
    ).strip()
    received_signature = str(
        request.data.get("razorpay_signature", "")
    ).strip()

    if not all((local_id, payment_id, remote_id, received_signature)):
        return Response(
            {"detail": "All payment verification fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    subscription = Subscription.objects.filter(
        id=local_id,
        user=request.user,
    ).first()

    if not subscription:
        return Response(
            {"detail": "Subscription not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Always use the subscription ID stored on our server.
    if not hmac.compare_digest(
        subscription.razorpay_subscription_id or "",
        remote_id,
    ):
        return Response(
            {"detail": "Subscription ID mismatch."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.RAZORPAY_KEY_SECRET:
        return Response(
            {"detail": "Payment verification is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    message = (
        f"{payment_id}|{subscription.razorpay_subscription_id}"
    ).encode("utf-8")

    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        received_signature,
    ):
        return Response(
            {"detail": "Payment signature verification failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    subscription.razorpay_payment_id = payment_id
    subscription.status = "authenticated"
    subscription.save(
        update_fields=[
            "razorpay_payment_id",
            "status",
            "updated_at",
        ]
    )

    return Response({
        "verified": True,
        "status": "authenticated",
        "message": (
            "Authorization verified. Final activation will be "
            "confirmed by Razorpay webhook."
        ),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_subscriptions(request):
    subscriptions = Subscription.objects.filter(
        user=request.user
    )

    return Response([
        {
            "id": item.id,
            "target_role": item.target_role,
            "plan": item.plan,
            "billing_cycle": item.billing_cycle,
            "amount": item.amount,
            "currency": item.currency,
            "status": item.status,
            "is_active": item.is_active,
            "cancel_at_cycle_end": item.cancel_at_cycle_end,
            "current_start": item.current_start,
            "current_end": item.current_end,
            "created_at": item.created_at,
        }
        for item in subscriptions
    ])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    local_id = request.data.get("subscription_id")
    cancel_at_cycle_end = (
        request.data.get("cancel_at_cycle_end", True) is True
    )

    subscription = Subscription.objects.filter(
        id=local_id,
        user=request.user,
    ).first()

    if not subscription or not subscription.razorpay_subscription_id:
        return Response(
            {"detail": "Subscription not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if subscription.status in (
        "cancelled",
        "completed",
        "expired",
    ):
        return Response(
            {"detail": "This subscription has already ended."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = _razorpay_request(
            "POST",
            (
                f"/subscriptions/"
                f"{subscription.razorpay_subscription_id}/cancel"
            ),
            {
                "cancel_at_cycle_end": cancel_at_cycle_end,
            },
        )

        subscription.cancel_at_cycle_end = cancel_at_cycle_end

        provider_status = result.get("status")
        if provider_status in dict(Subscription.STATUS_CHOICES):
            subscription.status = provider_status

        if subscription.status == "cancelled":
            subscription.cancelled_at = timezone.now()

        subscription.save()

        return Response({
            "cancelled": True,
            "status": subscription.status,
            "cancel_at_cycle_end": subscription.cancel_at_cycle_end,
        })

    except ValueError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    if not webhook_secret:
        return Response(
            {"detail": "Webhook secret is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    raw_body = request.body
    received_signature = request.headers.get(
        "X-Razorpay-Signature", ""
    )
    event_id = request.headers.get(
        "X-Razorpay-Event-Id", ""
    )

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not received_signature or not hmac.compare_digest(
        expected_signature,
        received_signature,
    ):
        return Response(
            {"detail": "Invalid webhook signature."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not event_id:
        return Response(
            {"detail": "Missing Razorpay event ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        payload = __import__("json").loads(raw_body)
    except (ValueError, TypeError):
        return Response(
            {"detail": "Invalid webhook payload."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    event_type = str(payload.get("event", "unknown"))
    webhook_payload = payload.get("payload", {})

    subscription_data = (
        webhook_payload.get("subscription", {}).get("entity", {})
    )
    payment_data = (
        webhook_payload.get("payment", {}).get("entity", {})
    )

    remote_subscription_id = (
        subscription_data.get("id")
        or payment_data.get("subscription_id")
    )

    event_time = _from_razorpay_timestamp(
        payload.get("created_at")
    )

    status_map = {
        "subscription.authenticated": "authenticated",
        "subscription.activated": "active",
        "subscription.charged": "active",
        "subscription.pending": "pending",
        "subscription.halted": "halted",
        "subscription.paused": "paused",
        "subscription.resumed": "active",
        "subscription.cancelled": "cancelled",
        "subscription.completed": "completed",
        "subscription.expired": "expired",
        "payment.failed": "pending",
    }

    try:
        with transaction.atomic():
            event_record, created = (
                SubscriptionWebhookEvent.objects.get_or_create(
                    event_id=event_id,
                    defaults={
                        "event_type": event_type,
                        "payload": payload,
                    },
                )
            )

            if not created and event_record.processed:
                return Response({
                    "received": True,
                    "duplicate": True,
                })

            event_record.event_type = event_type
            event_record.payload = payload
            event_record.save(
                update_fields=["event_type", "payload"]
            )

            subscription = None

            if remote_subscription_id:
                subscription = (
                    Subscription.objects.select_for_update()
                    .filter(
                        razorpay_subscription_id=remote_subscription_id
                    )
                    .first()
                )

            if subscription:
                is_newer_event = (
                    subscription.last_provider_event_at is None
                    or event_time is None
                    or event_time >= subscription.last_provider_event_at
                )

                if is_newer_event:
                    new_status = status_map.get(event_type)

                    provider_status = subscription_data.get("status")
                    if (
                        event_type.startswith("subscription.")
                        and provider_status in dict(Subscription.STATUS_CHOICES)
                    ):
                        new_status = provider_status

                    if new_status:
                        subscription.status = new_status

                    if event_time:
                        subscription.last_provider_event_at = event_time

                    current_start = _from_razorpay_timestamp(
                        subscription_data.get("current_start")
                    )
                    current_end = _from_razorpay_timestamp(
                        subscription_data.get("current_end")
                    )

                    if current_start:
                        subscription.current_start = current_start

                    if current_end:
                        subscription.current_end = current_end

                    if subscription.status == "cancelled":
                        subscription.cancelled_at = event_time or timezone.now()

                    subscription.save()

                payment_id = payment_data.get("id")

                if payment_id:
                    SubscriptionPayment.objects.update_or_create(
                        razorpay_payment_id=payment_id,
                        defaults={
                            "subscription": subscription,
                            "invoice_id": payment_data.get("invoice_id", ""),
                            "amount": payment_data.get("amount") or 0,
                            "currency": payment_data.get("currency") or "INR",
                            "method": payment_data.get("method", ""),
                            "status": payment_data.get("status", "created"),
                            "raw_payload": payment_data,
                        },
                    )

            event_record.processed = True
            event_record.processed_at = timezone.now()
            event_record.save(
                update_fields=["processed", "processed_at"]
            )

    except Exception:
        logger.exception("Razorpay webhook processing failed.")
        return Response(
            {"detail": "Webhook processing failed. Please retry."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"received": True})
