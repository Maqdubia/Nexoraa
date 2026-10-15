from django.urls import path

from .views import (
    ResumeListCreateView,
    ResumeDetailView,
    ResumeAnalysisView,
)


urlpatterns = [

    path(
        "",
        ResumeListCreateView.as_view(),
        name="resume-list-create"
    ),

    path(
        "<int:pk>/",
        ResumeDetailView.as_view(),
        name="resume-detail"
    ),

    path(
        "<int:pk>/analysis/",
        ResumeAnalysisView.as_view(),
        name="resume-analysis"
    ),
]