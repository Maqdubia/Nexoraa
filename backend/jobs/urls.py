from django.urls import path

from .recruiter_views import (
    HRAccountCreateView,
    RecruiterJobListCreateView,
    RecruiterJobDetailView,
    RecruiterApplicationsView,
    RecruiterApplicationDetailView,
    RecruiterBulkStatusView,
    RecruiterStatsView,
)

from .views import (
    JobListView,
    JobDetailView,
    JobMatchView,
    ImprovementRecommendationsView,
    JobApplicationCreateView,
    MyApplicationsView,
)

urlpatterns = [
    # HR and admin endpoints
    path(
        "hr/accounts/",
        HRAccountCreateView.as_view(),
        name="hr-account-create",
    ),
    path(
        "hr/jobs/",
        RecruiterJobListCreateView.as_view(),
        name="hr-job-list-create",
    ),
    path(
        "hr/jobs/<int:pk>/",
        RecruiterJobDetailView.as_view(),
        name="hr-job-detail",
    ),
    path(
        "hr/applications/",
        RecruiterApplicationsView.as_view(),
        name="hr-applications",
    ),
    path(
        "hr/applications/bulk-status/",
        RecruiterBulkStatusView.as_view(),
        name="hr-applications-bulk-status",
    ),
    path(
        "hr/applications/<int:pk>/",
        RecruiterApplicationDetailView.as_view(),
        name="hr-application-detail",
    ),
    path(
        "hr/stats/",
        RecruiterStatsView.as_view(),
        name="hr-stats",
    ),

    # Student job endpoints
    path("", JobListView.as_view(), name="job-list"),
    path("matches/", JobMatchView.as_view(), name="job-matches"),
    path(
        "recommendations/",
        ImprovementRecommendationsView.as_view(),
        name="job-recommendations",
    ),
    path(
        "apply/",
        JobApplicationCreateView.as_view(),
        name="job-apply",
    ),
    path(
        "my-applications/",
        MyApplicationsView.as_view(),
        name="my-applications",
    ),
    path("<int:pk>/", JobDetailView.as_view(), name="job-detail"),
]
