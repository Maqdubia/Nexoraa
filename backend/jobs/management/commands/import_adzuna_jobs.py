
import os
import re

import requests
from django.core.management.base import BaseCommand, CommandError

from jobs.models import Job


ADZUNA_API_URL = (
    "https://api.adzuna.com/v1/api/jobs/in/search/1"
)

# Searches are repeated for Hyderabad and India-wide listings.
SEARCH_TERMS = [
    "Python Developer",
    "React Developer",
    "Full Stack Developer",
    "Data Analyst",
]

LOCATIONS = [
    "Hyderabad",
    "India",
]

# Basic skill extraction for Nexora's existing required_skills field.
KNOWN_SKILLS = [
    "Python",
    "Django",
    "FastAPI",
    "React",
    "JavaScript",
    "HTML",
    "CSS",
    "SQL",
    "MySQL",
    "REST API",
    "Excel",
    "Power BI",
    "Java",
    "AWS",
    "Git",
    "Machine Learning",
    "TypeScript",
    "Node.js",
    "Angular",
    "Docker",
]


def extract_skills(title, description):
    text = f"{title} {description}".casefold()
    found = []

    for skill in KNOWN_SKILLS:
        # Avoid matching a skill inside an unrelated longer word.
        pattern = r"(?<!\w)" + re.escape(skill.casefold()) + r"(?!\w)"

        if re.search(pattern, text):
            found.append(skill)

    return found


def format_salary(job_data):
    minimum = job_data.get("salary_min")
    maximum = job_data.get("salary_max")

    if minimum is not None and maximum is not None:
        return f"₹{minimum:,.0f} - ₹{maximum:,.0f}"

    if minimum is not None:
        return f"From ₹{minimum:,.0f}"

    if maximum is not None:
        return f"Up to ₹{maximum:,.0f}"

    return ""


def clean_job_type(job_data):
    contract = (
        job_data.get("contract_time")
        or job_data.get("contract_type")
        or ""
    )

    if not contract:
        return "Full Time"

    return str(contract).replace("_", " ").title()


class Command(BaseCommand):
    help = "Import job listings from Adzuna into the existing Job table."

    def handle(self, *args, **options):
        app_id = os.getenv("ADZUNA_APP_ID")
        app_key = os.getenv("ADZUNA_APP_KEY")

        if not app_id or not app_key:
            raise CommandError(
                "Adzuna credentials are missing. "
                "Add ADZUNA_APP_ID and ADZUNA_APP_KEY "
                "to backend/.env."
            )

        imported = 0
        updated = 0
        skipped = 0

        for location in LOCATIONS:
            for search_term in SEARCH_TERMS:
                self.stdout.write(
                    f"Searching {search_term} in {location}..."
                )

                params = {
                    "app_id": app_id,
                    "app_key": app_key,
                    "what": search_term,
                    "where": location,
                    "results_per_page": 10,
                    "content-type": "application/json",
                }

                try:
                    response = requests.get(
                        ADZUNA_API_URL,
                        params=params,
                        timeout=25,
                    )
                    response.raise_for_status()
                    payload = response.json()

                except requests.RequestException as exc:
                    self.stderr.write(
                        self.style.WARNING(
                            f"Search failed for {search_term} "
                            f"in {location}: {exc}"
                        )
                    )
                    continue

                except ValueError:
                    self.stderr.write(
                        self.style.WARNING(
                            "Adzuna returned an invalid JSON response."
                        )
                    )
                    continue

                results = payload.get("results", [])

                for item in results:
                    title = (item.get("title") or "").strip()

                    company_data = item.get("company") or {}
                    company = (
                        company_data.get("display_name") or "Unknown Company"
                    ).strip()

                    location_data = item.get("location") or {}
                    job_location = (
                        location_data.get("display_name") or location
                    ).strip()

                    description = (
                        item.get("description") or ""
                    ).strip()

                    application_url = (
                        item.get("redirect_url") or ""
                    ).strip()

                    # Do not create records without essential information
                    # or a usable URL for duplicate detection.
                    if (
                        not title
                        or not application_url.startswith(("https://", "http://"))
                        or len(application_url) > 200
                    ):
                        skipped += 1
                        continue

                    defaults = {
                        "title": title[:200],
                        "company": company[:200],
                        "location": job_location[:200],
                        "description": description,
                        "required_skills": extract_skills(
                            title, description
                        ),
                        "salary": format_salary(item),
                        "job_type": clean_job_type(item)[:100],
                        "experience": "",
                    }

                    try:
                        job, created = Job.objects.update_or_create(
                            application_url=application_url,
                            defaults=defaults,
                        )

                        if created:
                            imported += 1
                        else:
                            updated += 1

                    except Exception as exc:
                        skipped += 1
                        self.stderr.write(
                            self.style.WARNING(
                                f"Could not save '{title}': {exc}"
                            )
                        )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Adzuna import finished. "
                f"New jobs: {imported}; "
                f"updated jobs: {updated}; "
                f"skipped jobs: {skipped}."
            )
        )