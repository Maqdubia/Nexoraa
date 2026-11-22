"""Explainable, job-specific resume screening for recruiter-owned jobs.

The screening score uses resume content only:
- 45% required-skill coverage
- 40% TF-IDF cosine similarity to the job description
- 15% coverage of keywords extracted from the job description

When a job has no explicit required skills, the remaining components are
renormalized. Candidate personal attributes are not used in the score.
"""

import re

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import Job, JobApplication
from .permissions import IsHR
from .recruiter_views import _application_resume_data, _display_name
from .scoring import normalize_skills, match_skills
from users.resume_analyzer import find_skills


TOKEN_PATTERN = r"(?u)(?<![A-Za-z0-9])[A-Za-z][A-Za-z0-9+#]*(?:\.[A-Za-z0-9+#]+)*(?![A-Za-z0-9])"


def _clean_text(value):
    """Normalize a value to bounded, plain text for vectorization."""
    if value is None:
        return ""
    text = str(value).replace("\x00", " ")
    text = re.sub(r"\s+", " ", text).strip()
    # Contact details should not contribute to similarity scores.
    text = re.sub(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        " ",
        text,
    )
    text = re.sub(
        r"(?<!\d)(?:\+?91[\s().-]*)?(?:0[\s().-]*)?[6-9](?:[\s().-]*\d){9}(?!\d)",
        " ",
        text,
    )
    return text[:20000]


def _job_text(job):
    required = normalize_skills(job.required_skills)
    return _clean_text(" ".join([
        job.title,
        job.description,
        job.responsibilities,
        job.requirements,
        " ".join(required),
    ]))


def extract_job_keywords(job_text, limit=20):
    """Return high-signal unigram/bigram keywords from a job description."""
    source = _clean_text(job_text)
    if not source:
        return []

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=500,
            token_pattern=TOKEN_PATTERN,
            sublinear_tf=True,
        )
        matrix = vectorizer.fit_transform([source])
        names = vectorizer.get_feature_names_out()
        weights = matrix.toarray()[0]
    except ValueError:
        return []

    ranked_indices = sorted(
        range(len(names)),
        key=lambda index: (-weights[index], names[index]),
    )

    keywords = []
    for index in ranked_indices:
        keyword = names[index].strip()
        if not keyword or keyword in keywords:
            continue
        # Avoid very short fragments and terms consisting only of digits.
        if len(keyword) < 3 or not re.search(r"[a-zA-Z]", keyword):
            continue
        keywords.append(keyword)
        if len(keywords) >= limit:
            break

    return keywords


def _term_present(term, text):
    """Match a keyword as a phrase, not as an arbitrary substring."""
    escaped = re.escape(str(term).casefold())
    pattern = r"(?<![a-z0-9])" + escaped + r"(?![a-z0-9])"
    return bool(re.search(pattern, text.casefold()))


def _text_similarity_scores(job_text, resume_texts):
    """Compute cosine similarity between one JD and all submitted resumes."""
    if not resume_texts:
        return []

    documents = [_clean_text(job_text)] + [
        _clean_text(text) for text in resume_texts
    ]

    if not documents[0]:
        return [0.0] * len(resume_texts)

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=6000,
            token_pattern=TOKEN_PATTERN,
            sublinear_tf=True,
        )
        matrix = vectorizer.fit_transform(documents)
        similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        return [round(float(value) * 100, 1) for value in similarities]
    except ValueError:
        # For short or non-text resumes, keep the result explainable and safe.
        return [0.0] * len(resume_texts)


def score_resume_against_job(
    job_text,
    required_skills,
    job_keywords,
    resume_text,
    resume_skills,
    text_similarity,
):
    """Return component scores and evidence for one candidate."""
    normalized_resume = _clean_text(resume_text)
    skills = normalize_skills(resume_skills)
    required = normalize_skills(required_skills)

    matched_skills, missing_skills, skill_score = match_skills(
        required,
        skills,
    )

    matched_keywords = [
        keyword for keyword in job_keywords
        if _term_present(keyword, normalized_resume)
        or any(_term_present(keyword, skill) for skill in skills)
    ]
    missing_keywords = [
        keyword for keyword in job_keywords
        if keyword not in matched_keywords
    ]

    keyword_score = (
        round(len(matched_keywords) / len(job_keywords) * 100, 1)
        if job_keywords else None
    )

    components = [(float(text_similarity), 0.40)]
    if skill_score is not None:
        components.append((float(skill_score), 0.45))
    if keyword_score is not None:
        components.append((float(keyword_score), 0.15))

    weight_total = sum(weight for _, weight in components)
    overall = (
        round(sum(value * weight for value, weight in components) / weight_total)
        if weight_total else 0
    )

    return {
        "score": overall,
        "score_breakdown": {
            "skill_match": skill_score,
            "text_similarity": round(float(text_similarity), 1),
            "keyword_coverage": keyword_score,
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
    }


def _resume_entities(application, resume_data, resume_skills):
    """Use the existing resume parser's structured fields as entity output."""
    analysis = resume_data.get("resume_analysis") or {}
    user = application.user

    education_entities = analysis.get("education") or [
        {
            "degree": item.degree,
            "field_of_study": item.field_of_study,
            "institution": item.institution,
            "start_year": item.start_year,
            "end_year": item.end_year,
        }
        for item in user.education.all()
    ]

    certification_entities = analysis.get("certifications") or []

    work_entities = [
        {
            "role": item.job_title,
            "organization": item.company,
            "start_date": item.start_date,
            "end_date": item.end_date,
            "currently_working": item.currently_working,
        }
        for item in user.experience.all()
    ]

    parsed_skills = normalize_skills(
        analysis.get("skills") or resume_skills
    )

    return {
        "skills": parsed_skills,
        "education": education_entities,
        "certifications": certification_entities,
        "work_history": work_entities,
        "sections_found": analysis.get("sections_found") or [],
    }


class RecruiterResumeScreeningView(APIView):
    """Rank applicants against one job owned by the authenticated recruiter."""

    permission_classes = [IsHR]

    def get(self, request):
        raw_job_id = request.query_params.get("job")
        if not raw_job_id or not str(raw_job_id).isdigit():
            return Response(
                {"detail": "Select a valid job to screen candidates."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = get_object_or_404(
            Job,
            pk=int(raw_job_id),
            created_by=request.user,
        )

        applications = list(
            JobApplication.objects.filter(job=job)
            .select_related("user", "user__profile", "job")
            .prefetch_related(
                "user__skills",
                "user__education",
                "user__experience",
                "user__resumes",
            )
            .order_by("-applied_at")
        )

        resume_data = [
            _application_resume_data(application)
            for application in applications
        ]
        resume_texts = [item.get("resume_text") or "" for item in resume_data]
        job_description = _job_text(job)
        job_keywords = extract_job_keywords(job_description)
        required_skills = normalize_skills(job.required_skills)

        # Do not attempt to score absent resumes. The parser's extracted
        # skills are preferred; a lightweight alias dictionary is used only
        # when a submitted resume has readable text but no stored skill list.
        candidate_skills = []
        for data, text in zip(resume_data, resume_texts):
            skills = normalize_skills(data.get("resume_skills") or [])
            if not skills and text:
                try:
                    skills = normalize_skills(find_skills(text))
                except Exception:
                    skills = []
            candidate_skills.append(skills)

        similarities = _text_similarity_scores(
            job_description,
            resume_texts,
        )

        candidates = []
        resumes_found = 0
        for index, application in enumerate(applications):
            data = resume_data[index]
            resume_text = resume_texts[index]
            has_resume = bool(data.get("has_resume") or resume_text.strip())
            if has_resume:
                resumes_found += 1

            if has_resume:
                score_data = score_resume_against_job(
                    job_description,
                    required_skills,
                    job_keywords,
                    resume_text,
                    candidate_skills[index],
                    similarities[index],
                )
                score = score_data["score"]
                breakdown = score_data["score_breakdown"]
            else:
                score = None
                breakdown = {
                    "skill_match": None,
                    "text_similarity": None,
                    "keyword_coverage": None,
                }
                score_data = {
                    "matched_skills": [],
                    "missing_skills": required_skills,
                    "matched_keywords": [],
                    "missing_keywords": job_keywords,
                }

            entities = _resume_entities(
                application,
                data,
                candidate_skills[index],
            )

            candidates.append({
                "application_id": application.id,
                "candidate_name": _display_name(application.user),
                "email": application.user.email,
                "application_status": application.status,
                "applied_at": application.applied_at,
                "has_resume": has_resume,
                "resume_title": data.get("resume_title") or "",
                "resume_url": data.get("resume_url") or "",
                "score": score,
                "score_breakdown": breakdown,
                "matched_skills": score_data["matched_skills"],
                "missing_skills": score_data["missing_skills"],
                "matched_keywords": score_data["matched_keywords"],
                "missing_keywords": score_data["missing_keywords"],
                "entities": entities,
            })

        candidates.sort(
            key=lambda item: (
                item["score"] is None,
                -(item["score"] or 0),
                item["candidate_name"].casefold(),
            )
        )
        for rank, candidate in enumerate(candidates, start=1):
            candidate["rank"] = rank

        return Response({
            "job": {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "description": job.description,
                "required_skills": required_skills,
            },
            "total_applications": len(applications),
            "resumes_found": resumes_found,
            "resumes_missing": len(applications) - resumes_found,
            "keywords_used": job_keywords,
            "ranking_method": {
                "skill_match_weight": 45,
                "text_similarity_weight": 40,
                "keyword_coverage_weight": 15,
                "note": (
                    "Scores are decision-support signals only. Review each "
                    "resume and make hiring decisions using human judgment."
                ),
            },
            "candidates": candidates,
        })
