
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.filters import SearchFilter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Job, JobApplication
from .serializers import JobSerializer, JobApplicationSerializer



# Display all jobs and allow users to search
class JobListView(generics.ListAPIView):

    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

    filter_backends = [SearchFilter]

    search_fields = [
        "title",
        "company",
        "location",
        "description",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        skill = self.request.query_params.get("skill")

        if skill:
            matching_jobs = []

            for job in queryset:
                skills = job.required_skills or []

                if isinstance(skills, list):
                    if any(
                        skill.lower() in str(item).lower()
                        for item in skills
                    ):
                        matching_jobs.append(job.pk)

            queryset = queryset.filter(pk__in=matching_jobs)

        return queryset


# Display details of one job
class JobDetailView(generics.RetrieveAPIView):

    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [AllowAny]



# ========================================
# JOB MATCHING AND SKILL GAP ANALYSIS
# ========================================

class JobMatchView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Get the logged-in user's saved skills
        user_skills = request.user.skills.values_list(
            "name", flat=True
        )

        # Normalize skill names for comparison
        user_skill_map = {
            skill.strip().casefold(): skill.strip()
            for skill in user_skills
            if skill.strip()
        }

        results = []

        # Compare the user's skills with every job
        for job in Job.objects.all().order_by("-created_at"):

            required_skills = job.required_skills or []

            if not isinstance(required_skills, list):
                required_skills = []

            # Remove duplicate required skills
            required_map = {}

            for skill in required_skills:
                if isinstance(skill, str) and skill.strip():
                    required_map.setdefault(
                        skill.strip().casefold(),
                        skill.strip()
                    )

            required = list(required_map.values())

            matched_skills = [
                user_skill_map[skill.casefold()]
                for skill in required
                if skill.casefold() in user_skill_map
            ]

            missing_skills = [
                skill for skill in required
                if skill.casefold() not in user_skill_map
            ]

            # Calculate the match percentage
            if required:
                match_percentage = round(
                    len(matched_skills) / len(required) * 100
                )
            else:
                match_percentage = 0

            results.append({
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "description": job.description,
                "required_skills": required,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "match_percentage": match_percentage,
                "salary": job.salary,
                "job_type": job.job_type,
                "experience": job.experience,
            })

        # Show the strongest matches first
        results.sort(
            key=lambda item: item["match_percentage"],
            reverse=True
        )

        return Response(results)




# ========================================
# STEP 7: IMPROVEMENT RECOMMENDATIONS
# ========================================

class ImprovementRecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    RECOMMENDATIONS = {
        "python": {
            "priority": "High",
            "reason": "Python is useful for backend development, automation, and data analysis.",
            "steps": [
                "Practice functions, lists, dictionaries, and exception handling.",
                "Learn modules, virtual environments, and working with APIs.",
                "Write unit tests for your Python code.",
            ],
            "project": "Python Task Manager",
            "project_description": "Build a task manager that stores tasks and supports CRUD operations.",
            "resource": "Python Official Tutorial",
            "url": "https://docs.python.org/3/tutorial/",
        },
        "sql": {
            "priority": "High",
            "reason": "SQL helps you retrieve, filter, join, and analyze database records.",
            "steps": [
                "Practice SELECT, WHERE, ORDER BY, and GROUP BY.",
                "Learn JOINs, subqueries, and aggregate functions.",
                "Practice database design and query optimization.",
            ],
            "project": "Job Analytics Database",
            "project_description": "Analyze job listings by company, location, skills, and salary.",
            "resource": "MySQL Documentation",
            "url": "https://dev.mysql.com/doc/",
        },
        "react": {
            "priority": "High",
            "reason": "React helps you build interactive frontend applications.",
            "steps": [
                "Practice components, props, and state.",
                "Learn hooks, forms, and API integration.",
                "Practice routing and loading or error states.",
            ],
            "project": "Job Search Dashboard",
            "project_description": "Build a searchable job dashboard with filters and saved jobs.",
            "resource": "React Official Documentation",
            "url": "https://react.dev/learn",
        },
        "django": {
            "priority": "High",
            "reason": "Django is useful for building database-backed web applications.",
            "steps": [
                "Practice models, migrations, and the Django ORM.",
                "Learn views, URLs, and authentication.",
                "Build CRUD operations and validate user input.",
            ],
            "project": "Career Profile API",
            "project_description": "Build an API for profiles, education, skills, and experience.",
            "resource": "Django Documentation",
            "url": "https://docs.djangoproject.com/en/stable/",
        },
        "django rest framework": {
            "priority": "High",
            "reason": "DRF allows Django applications to expose REST APIs to frontend clients.",
            "steps": [
                "Learn serializers and API views.",
                "Practice permissions, authentication, and validation.",
                "Test endpoints using the browser or an API client.",
            ],
            "project": "Job Application REST API",
            "project_description": "Create authenticated endpoints for applying to jobs and tracking status.",
            "resource": "DRF Documentation",
            "url": "https://www.django-rest-framework.org/",
        },
        "fastapi": {
            "priority": "Medium",
            "reason": "FastAPI is useful for creating Python APIs.",
            "steps": [
                "Learn routes, request parameters, and Pydantic models.",
                "Practice validation and error handling.",
                "Connect the API to a database.",
            ],
            "project": "Skills Assessment API",
            "project_description": "Create an API that accepts skills and returns a structured assessment.",
            "resource": "FastAPI Documentation",
            "url": "https://fastapi.tiangolo.com/",
        },
        "docker": {
            "priority": "Medium",
            "reason": "Docker helps package applications and their dependencies.",
            "steps": [
                "Learn images, containers, and Dockerfiles.",
                "Containerize a simple Python application.",
                "Practice running an application with a database using Compose.",
            ],
            "project": "Containerized Nexora",
            "project_description": "Package the frontend and backend for consistent local development.",
            "resource": "Docker Get Started",
            "url": "https://docs.docker.com/get-started/",
        },
        "javascript": {
            "priority": "High",
            "reason": "JavaScript is essential for interactive web development.",
            "steps": [
                "Practice arrays, objects, functions, and ES modules.",
                "Learn promises, async/await, and fetch.",
                "Practice DOM events and debugging.",
            ],
            "project": "Interactive Quiz App",
            "project_description": "Build a quiz with scoring, validation, and a results screen.",
            "resource": "MDN JavaScript Guide",
            "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        },
        "git": {
            "priority": "Medium",
            "reason": "Git helps track changes and collaborate safely on code.",
            "steps": [
                "Practice add, commit, status, and log.",
                "Learn branches, merges, and resolving conflicts.",
                "Create a feature branch and submit a pull request.",
            ],
            "project": "Team Development Workflow",
            "project_description": "Practice branches, commits, code review, and pull requests on a project.",
            "resource": "Git Book",
            "url": "https://git-scm.com/book/en/v2",
        },
        "power bi": {
            "priority": "Medium",
            "reason": "Power BI helps turn datasets into interactive reports.",
            "steps": [
                "Import and clean a dataset.",
                "Build relationships and learn basic DAX measures.",
                "Create charts, filters, and a dashboard.",
            ],
            "project": "Job Market Dashboard",
            "project_description": "Visualize job counts by role, location, salary, and required skills.",
            "resource": "Power BI Learning",
            "url": "https://learn.microsoft.com/en-us/power-bi/",
        },
    }

    def post(self, request):
        missing_skills = request.data.get("missing_skills", [])

        if not isinstance(missing_skills, list):
            return Response(
                {"detail": "missing_skills must be a list."},
                status=400,
            )

        recommendations = []
        seen = set()

        for item in missing_skills:
            if not isinstance(item, str) or not item.strip():
                continue

            skill = item.strip()
            key = skill.casefold()

            if key in seen:
                continue

            seen.add(key)

            recommendation = self.RECOMMENDATIONS.get(key)

            if recommendation:
                details = recommendation
            else:
                details = {
                    "priority": "Medium",
                    "reason": (
                        f"Learning {skill} may help you address "
                        "a skill gap for your target role."
                    ),
                    "steps": [
                        f"Learn the fundamentals of {skill}.",
                        f"Complete a beginner tutorial using {skill}.",
                        f"Practice {skill} in a small working application.",
                    ],
                    "project": f"{skill} Practice Project",
                    "project_description": (
                        f"Build a small portfolio project that demonstrates "
                        f"your ability to use {skill}."
                    ),
                    "resource": f"Search for {skill} documentation",
                    "url": "",
                }

            recommendations.append({
                "skill": skill,
                **details,
            })

        return Response({
            "count": len(recommendations),
            "recommendations": recommendations,
        })


# ========================================
# STEP 8: JOB APPLICATIONS
# ========================================

class JobApplicationCreateView(generics.CreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MyApplicationsView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(
            user=self.request.user
        ).select_related("job").order_by("-applied_at")
