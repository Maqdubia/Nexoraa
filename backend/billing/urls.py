
from django.urls import path

from . import views


urlpatterns = [
    path("config/", views.billing_config, name="billing-config"),
    path("plans/", views.billing_plans, name="billing-plans"),

    path(
        "subscriptions/create/",
        views.create_subscription,
        name="create-subscription",
    ),
    path(
        "subscriptions/verify/",
        views.verify_subscription,
        name="verify-subscription",
    ),
    path(
        "subscriptions/me/",
        views.my_subscriptions,
        name="my-subscriptions",
    ),
    path(
        "subscriptions/cancel/",
        views.cancel_subscription,
        name="cancel-subscription",
    ),

    path(
        "webhook/",
        views.razorpay_webhook,
        name="razorpay-webhook",
    ),
]
