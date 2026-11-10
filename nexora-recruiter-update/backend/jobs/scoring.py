"""Candidate scoring helpers for the recruiter portal.

Pure Python (no Django imports) so the logic is easy to test.

ATS score (0-100), shown to recruiters:
  - skill match = % of the job's required skills that the candidate has
    (skills come from the candidate's Skills page + skills found in the resume)
  - resume score = Nexora's resume analysis score (0-100)
  - if both exist:  ATS = 60% skill match + 40% resume score
  - if only one exists, ATS uses that one
  - if neither exists, ATS = 0
"""


def _clean(value):
    return str(value).strip() if value is not None else ""


def normalize_skills(values):
    """Return a de-duplicated list of skill names (original spelling kept)."""
    if not values:
        return []

    if isinstance(values, str):
        values = values.split(",")

    seen = {}

    for item in values:
        if isinstance(item, dict):
            item = item.get("name") or item.get("skill") or ""

        text = _clean(item)

        if text:
            seen.setdefault(text.casefold(), text)

    return list(seen.values())


def match_skills(required, candidate):
    """Compare required skills with candidate skills.

    Returns (matched, missing, percent). percent is None when the job lists
    no required skills.
    """
    required = normalize_skills(required)
    candidate_keys = {s.casefold() for s in normalize_skills(candidate)}

    matched = [s for s in required if s.casefold() in candidate_keys]
    missing = [s for s in required if s.casefold() not in candidate_keys]

    percent = round(len(matched) / len(required) * 100) if required else None

    return matched, missing, percent


def clamp_score(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    return max(0, min(100, round(number)))


def ats_score(skill_match, resume_score):
    skill_match = clamp_score(skill_match)
    resume_score = clamp_score(resume_score)

    if skill_match is not None and resume_score is not None:
        return round(skill_match * 0.6 + resume_score * 0.4)

    if skill_match is not None:
        return skill_match

    if resume_score is not None:
        return resume_score

    return 0


def score_band(score):
    if score >= 75:
        return "strong"
    if score >= 50:
        return "good"
    return "low"
