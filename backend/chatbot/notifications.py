
import logging
import os

import requests


logger = logging.getLogger(__name__)

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def get_support_recipients():
    """
    Read the company support inbox from SUPPORT_EMAIL.
    Fall back to the verified Brevo sender if no support inbox is configured.
    Multiple recipients can be separated by commas or semicolons.
    """
    configured = (
        os.getenv("SUPPORT_EMAIL", "").strip()
        or os.getenv("BREVO_SENDER_EMAIL", "").strip()
    )

    return [
        email.strip()
        for email in configured.replace(";", ",").split(",")
        if email.strip()
    ]


def send_support_email(
    recipients,
    subject,
    message,
    reply_to_email=None,
    reply_to_name=None,
):
    """Send a support email through the existing Brevo account."""

    api_key = os.getenv("BREVO_API_KEY", "").strip()
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "").strip()

    recipients = [
        email.strip()
        for email in recipients
        if email and email.strip()
    ]

    if not api_key or not sender_email:
        logger.error(
            "Support email not sent: Brevo credentials are not configured."
        )
        return False

    if not recipients:
        logger.warning(
            "Support email not sent: no recipient was configured."
        )
        return False

    payload = {
        "sender": {
            "name": "Nexora Support",
            "email": sender_email,
        },
        "to": [{"email": email} for email in recipients],
        "subject": subject,
        "textContent": message,
    }

    if reply_to_email:
        payload["replyTo"] = {
            "email": reply_to_email,
            "name": reply_to_name or reply_to_email,
        }

    try:
        response = requests.post(
            BREVO_URL,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "accept": "application/json",
            },
            json=payload,
            timeout=15,
        )

        if response.status_code >= 400:
            logger.error(
                "Brevo rejected a support email. HTTP status: %s",
                response.status_code,
            )
            return False

        logger.info(
            "Brevo accepted a support email. Recipients: %s",
            len(recipients),
        )
        return True

    except requests.RequestException as exc:
        logger.error(
            "Support email delivery failed: %s",
            exc.__class__.__name__,
        )
        return False


def notify_ticket_created(ticket):
    """Notify the company and acknowledge the ticket to the customer."""

    support_recipients = get_support_recipients()

    site_url = os.getenv(
        "NEXORA_PUBLIC_URL",
        "https://nexoraa-1.onrender.com",
    ).rstrip("/")

    admin_url = (
        f"{site_url}/admin/chatbot/supportticket/{ticket.pk}/change/"
    )

    category = ticket.get_category_display()

    # 1. Notify the company support team.
    company_message = f"""
A new support ticket has been submitted through Nexora.

Ticket Reference: {ticket.reference_id}

Customer Name: {ticket.customer_name}
Customer Email: {ticket.email}

Category: {category}
Issue: {ticket.issue}

Description:
{ticket.description}

Current Status: {ticket.get_status_display()}

View this ticket in the Nexora Admin Panel:
{admin_url}
""".strip()

    send_support_email(
        recipients=support_recipients,
        subject=f"[NEXORA SUPPORT] New Ticket {ticket.reference_id}",
        message=company_message,
        reply_to_email=ticket.email,
        reply_to_name=ticket.customer_name,
    )

    # 2. Send a confirmation to the student or recruiter.
    customer_message = f"""
Hello {ticket.customer_name or "there"},

We have successfully received your support request.

Your ticket details:

Reference ID: {ticket.reference_id}
Category: {category}
Issue: {ticket.issue}

Description:
{ticket.description}

Our support team will review your request.

Please keep your reference ID for future communication.
You can reply to this email if you need to provide additional information.

Regards,
Nexora Support Team
""".strip()

    reply_to = support_recipients[0] if support_recipients else None

    send_support_email(
        recipients=[ticket.email],
        subject=f"Nexora Support Ticket Received - {ticket.reference_id}",
        message=customer_message,
        reply_to_email=reply_to,
        reply_to_name="Nexora Support",
    )


def notify_ticket_reply(ticket):
    """Email the customer when an administrator changes the response."""

    if not ticket.email or not (ticket.admin_response or "").strip():
        return

    support_recipients = get_support_recipients()
    reply_to = support_recipients[0] if support_recipients else None

    customer_message = f"""
Hello {ticket.customer_name or "there"},

Our support team has updated your Nexora support ticket.

Reference ID: {ticket.reference_id}
Issue: {ticket.issue}
Current Status: {ticket.get_status_display()}

Administrator's Response:

{ticket.admin_response.strip()}

You can reply to this email if you need further assistance.

Regards,
Nexora Support Team
""".strip()

    send_support_email(
        recipients=[ticket.email],
        subject=f"Nexora Support Update - {ticket.reference_id}",
        message=customer_message,
        reply_to_email=reply_to,
        reply_to_name="Nexora Support",
    )
