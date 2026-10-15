
from django.urls import path
from .views import (
    JobListView,
    JobDetailView,
    JobMatchView,
    ImprovementRecommendationsView,
    JobApplicationCreateView,
    MyApplicationsView,
)

urlpatterns = [
    # Display and search jobs
    path("", JobListView.as_view(), name="job-list"),

    # Match jobs to user skills
    path(
        "matches/",
        JobMatchView.as_view(),
        name="job-matches",
    ),

    # Skill improvement recommendations
    path(
        "recommendations/",
        ImprovementRecommendationsView.as_view(),
        name="job-recommendations",
    ),

    # Apply for a job
    path(
        "apply/",
        JobApplicationCreateView.as_view(),
        name="job-apply",
    ),

    # View the logged-in user's applications
    path(
        "my-applications/",
        MyApplicationsView.as_view(),
        name="my-applications",
    ),

    # Display details of one job
    path(
        "<int:pk>/",
        JobDetailView.as_view(),
        name="job-detail",
    ),
]
