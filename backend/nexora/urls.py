
from pathlib import Path
import mimetypes

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import FileResponse, Http404


# Location of the built React frontend.
FRONTEND_DIST = (
    Path(settings.BASE_DIR).parent / "frontend" / "dist"
)


# Serve the service worker from the website root.
def serve_service_worker(request):
    service_worker_path = FRONTEND_DIST / "sw.js"

    if not service_worker_path.is_file():
        raise Http404("NEXORA service worker not found")

    response = FileResponse(
        service_worker_path.open("rb"),
        content_type="application/javascript",
    )

    # Allow the worker to control all Nexora routes.
    response["Service-Worker-Allowed"] = "/"

    # Let the browser check for worker updates.
    response["Cache-Control"] = "no-cache"

    return response


# Serve React JavaScript, CSS, and other frontend assets.
def serve_frontend_asset(request, path):
    asset_path = (
        FRONTEND_DIST / "assets" / path
    ).resolve()

    try:
        asset_path.relative_to(FRONTEND_DIST.resolve())
    except ValueError:
        raise Http404("Frontend asset not found")

    if not asset_path.is_file():
        raise Http404("Frontend asset not found")

    content_type, _ = mimetypes.guess_type(
        str(asset_path)
    )

    return FileResponse(
        asset_path.open("rb"),
        content_type=content_type or "application/octet-stream",
    )


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("users.urls")),
    path("api/resumes/", include("resumes.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/interviews/", include("interviews.url")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/billing/", include("billing.urls")),

    # Root-level service worker for the complete application.
    path(
        "service-worker.js",
        serve_service_worker,
        name="service_worker",
    ),
]


# Serve uploaded media files during local development.
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )


urlpatterns += [
    re_path(
        r"^assets/(?P<path>.*)$",
        serve_frontend_asset,
    ),

    # React application fallback.
    re_path(
        r"^(?!api/|admin/|media/|static/|assets/).*?$",
        TemplateView.as_view(
            template_name="index.html"
        ),
    ),
]
