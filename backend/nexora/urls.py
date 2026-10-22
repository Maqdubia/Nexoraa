
from pathlib import Path
import mimetypes

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import FileResponse, Http404


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

# Location of the built React frontend.
FRONTEND_DIST = Path(settings.BASE_DIR).parent / "frontend" / "dist"


# Serve React JavaScript, CSS, and other assets.
def serve_frontend_asset(request, path):
    asset_path = (FRONTEND_DIST / path).resolve()

    # Prevent access to files outside the frontend build directory.
    try:
        asset_path.relative_to(FRONTEND_DIST.resolve())
    except ValueError:
        raise Http404("Frontend asset not found")

    if not asset_path.is_file():
        raise Http404("Frontend asset not found")

    content_type, _ = mimetypes.guess_type(str(asset_path))

    return FileResponse(
        asset_path.open("rb"),
        content_type=content_type or "application/octet-stream",
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
