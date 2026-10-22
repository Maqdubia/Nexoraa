
from pathlib import Path

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import Http404


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/resumes/", include("resumes.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/interviews/", include("interviews.url")),
]

# Serve uploaded media files during local development.
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

# Serve React's built static assets.
FRONTEND_DIST = Path(settings.BASE_DIR).parent / "frontend" / "dist"


def serve_frontend_asset(request, path):
    asset_path = FRONTEND_DIST / path

    if not asset_path.is_file():
        raise Http404("Frontend asset not found")

    return serve(
        request,
        path,
        document_root=str(FRONTEND_DIST),
    )


urlpatterns += [
    re_path(
        r"^assets/(?P<path>.*)$",
        serve_frontend_asset,
    ),
    re_path(
        r"^(?!api/|admin/|media/|static/|assets/).*?$",
        TemplateView.as_view(template_name="index.html"),
    ),
]
