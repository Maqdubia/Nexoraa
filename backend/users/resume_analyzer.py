
import re
from pathlib import Path

from pypdf import PdfReader
from docx import Document


# =========================
# SKILL DATABASE
# =========================

SKILL_ALIASES = {
    "Python": ["python"],
    "Java": ["java"],
    "JavaScript": ["javascript"],
    "TypeScript": ["typescript"],
    "React": ["react", "react.js", "reactjs"],
    "Angular": ["angular"],
    "Node.js": ["node.js", "nodejs"],
    "Django": ["django"],
    "Django REST Framework": ["django rest framework", "drf"],
    "FastAPI": ["fastapi", "fast api"],
    "Flask": ["flask"],
    "REST API": ["rest api", "restful api"],
    "SQL": ["sql"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MongoDB": ["mongodb"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "Git": ["git"],
    "GitHub": ["github"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Linux": ["linux"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "microsoft azure"],
    "Machine Learning": ["machine learning"],
    "Artificial Intelligence": ["artificial intelligence"],
    "Data Analysis": ["data analysis", "data analytics"],
    "Excel": ["excel"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Power BI": ["power bi"],
    "Tableau": ["tableau"],
    "Data Structures": ["data structures", "dsa"],
    "Algorithms": ["algorithms"],
    "Unit Testing": ["unit testing", "pytest"],
    "CI/CD": ["ci/cd", "continuous integration", "continuous delivery"],
}

SECTION_ALIASES = {
    "summary": [
        "summary", "professional summary", "career objective",
        "objective", "profile", "about me"
    ],
    "skills": [
        "skills", "technical skills", "core competencies",
        "technologies"
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "internship"
    ],
    "education": [
        "education", "academic background", "qualifications"
    ],
    "projects": [
        "projects", "personal projects", "academic projects"
    ],
    "certifications": [
        "certifications", "certificates", "courses"
    ],
}


# =========================
# PDF TEXT EXTRACTION
# =========================

def extract_pdf_text(file_path):
    reader = PdfReader(str(file_path))

    return "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )


# =========================
# DOCX TEXT EXTRACTION
# =========================

def extract_docx_text(file_path):
    document = Document(str(file_path))
    parts = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            parts.append(paragraph.text)

    # Many resume templates store information in tables.
    for table in document.tables:
        for row in table.rows:
            values = [
                cell.text.strip()
                for cell in row.cells
                if cell.text.strip()
            ]
            if values:
                parts.append(" | ".join(values))

    return "\n".join(parts)


# =========================
# RESUME TEXT EXTRACTION
# =========================

def extract_resume_text(file_path):
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError("Resume file not found.")

    if file_path.suffix.lower() not in {".pdf", ".docx"}:
        raise ValueError("Only PDF and DOCX resume files are allowed.")

    if file_path.suffix.lower() == ".pdf":
        text = extract_pdf_text(str(file_path))
    else:
        text = extract_docx_text(str(file_path))

    if not text or not text.strip():
        raise ValueError("No readable text found in the resume.")

    return text


# =========================
# TEXT MATCHING HELPER
# =========================

def _contains_term(text, term):
    pattern = (
        r"(?<![a-z0-9+#.])"
        + re.escape(term.lower())
        + r"(?![a-z0-9+#.])"
    )
    return bool(re.search(pattern, text.lower()))


# =========================
# EMAIL EXTRACTION
# =========================

def find_email(text):
    match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text,
    )
    return match.group(0) if match else None


# =========================
# PHONE EXTRACTION
# =========================

def find_phone(text):
    match = re.search(
        r"(?<!\d)(?:(?:\+?91|0)[\s-]?)?[6-9]\d{9}(?!\d)",
        text,
    )

    if not match:
        return None

    digits = re.sub(r"\D", "", match.group(0))
    return digits[-10:]


# =========================
# SKILL EXTRACTION
# =========================

def find_skills(text):
    found = []

    for skill, aliases in SKILL_ALIASES.items():
        if any(_contains_term(text, alias) for alias in aliases):
            found.append(skill)

    return found


# =========================
# SECTION DETECTION
# =========================

def extract_sections(text):
    lookup = {
        alias.lower(): section
        for section, aliases in SECTION_ALIASES.items()
        for alias in aliases
    }

    sections = {}
    current = "other"

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        heading = re.sub(r"^[\s:|•\-]+", "", line.lower())
        heading = re.sub(r"[\s:|•\-.,]+$", "", heading).strip()

        if heading in lookup:
            current = lookup[heading]
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line)

    return {
        name: "\n".join(lines)
        for name, lines in sections.items()
    }


# =========================
# EDUCATION EXTRACTION
# =========================

def find_education(text):
    patterns = (
        r"\bbachelor\b", r"\bmaster\b", r"\bb\.tech\b",
        r"\bm\.tech\b", r"\bb\.sc\b", r"\bm\.sc\b",
        r"\bb\.com\b", r"\bmca\b", r"\bbca\b", r"\bmba\b",
        r"\buniversity\b", r"\bcollege\b", r"\bdiploma\b",
        r"\bintermediate\b", r"\bssc\b",
    )

    return [
        line.strip()
        for line in text.splitlines()
        if any(re.search(pattern, line, re.I) for pattern in patterns)
    ][:15]


# =========================
# EXPERIENCE AND ACHIEVEMENTS
# =========================

def analyze_content(text, sections):
    action_verbs = [
        "built", "developed", "created", "designed", "implemented",
        "automated", "improved", "optimized", "delivered", "deployed",
        "integrated", "reduced", "increased", "maintained", "tested",
        "analyzed", "resolved", "managed", "launched",
    ]

    action_count = sum(
        len(re.findall(r"\b" + re.escape(verb) + r"\b", text, re.I))
        for verb in action_verbs
    )

    quantified_count = len(re.findall(
        r"\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:users|projects|"
        r"customers|records|hours|days|months|years)\b|\b\d+x\b",
        text,
        re.I,
    ))

    years = sorted(set(re.findall(r"\b(?:19|20)\d{2}\b", text)))

    section_names = [
        name for name in SECTION_ALIASES
        if sections.get(name, "").strip()
    ]

    return {
        "sections_found": section_names,
        "section_count": len(section_names),
        "action_verb_count": action_count,
        "quantified_achievement_count": quantified_count,
        "date_years_found": years,
        "has_experience_terms": bool(re.search(
            r"\b(experience|internship|intern|developer|engineer)\b",
            text,
            re.I,
        )),
    }


# =========================
# RESUME SCORE
# =========================

def calculate_resume_score(email, phone, skills, sections, content):
    breakdown = {
        "contact_information": (
            (10 if email else 0) + (10 if phone else 0)
        ),
        "technical_skills": min(20, len(skills) * 2),
        "resume_sections": min(20, content["section_count"] * 4),
        "experience_and_projects": (
            (8 if content["has_experience_terms"] else 0)
            + (6 if sections.get("projects", "").strip() else 0)
            + (6 if content["date_years_found"] else 0)
        ),
        "achievement_quality": (
            min(10, content["action_verb_count"])
            + min(10, content["quantified_achievement_count"] * 2)
        ),
        "readable_content": 10,
    }

    # Normalize the weighted checklist to a maximum of 100.
    raw_maximum = 10 + 20 + 20 + 20 + 20 + 10
    score = round(sum(breakdown.values()) / raw_maximum * 100)

    return {
        "overall": min(100, score),
        "max": 100,
        "breakdown": breakdown,
        "note": (
            "This is a rule-based estimate, not an official ATS score "
            "or a guarantee of job selection."
        ),
    }


# =========================
# IMPROVEMENT RECOMMENDATIONS
# =========================

def generate_recommendations(
    email, phone, skills, sections, content, text
):
    recommendations = []
    text = text or ""
    sections = sections or {}
    skills = skills or []

    def add(priority, area, advice):
        recommendations.append({
            "priority": priority,
            "area": area,
            "advice": advice,
        })

    def lines_for(section_name):
        return [
            line.strip(" \t•-*")
            for line in sections.get(section_name, "").splitlines()
            if line.strip()
        ]

    # Contact
    if not email:
        add(
            "High",
            "Contact",
            "No email address was detected in the extracted resume text. "
            "Check that your email is visible and selectable in the PDF or DOCX."
        )

    if not phone:
        add(
            "High",
            "Contact",
            "No supported phone number was detected. Verify the number and "
            "check whether text extraction preserved it correctly."
        )

    # Skills
    skill_lines = lines_for("skills")

    if not skill_lines:
        add(
            "High",
            "Skills",
            "No clearly labelled Skills section was detected. Add a "
            "Technical Skills section if your skills are currently scattered "
            "throughout the resume."
        )
    elif not skills:
        add(
            "Medium",
            "Skills",
            "A Skills section exists, but no skills from the current "
            "recognition dictionary were detected. Review the extracted "
            "text and expand the dictionary for relevant technologies."
        )
    elif len(skills) < 5:
        add(
            "Low",
            "Skills",
            "The analyzer recognized only "
            + ", ".join(skills)
            + ". Verify whether other skills already present in your resume "
            "were missed. Do not add skills you do not possess."
        )

    # Projects
    project_lines = lines_for("projects")

    if not project_lines:
        add(
            "High",
            "Projects",
            "No Projects section was detected. If you have academic, personal, "
            "or professional projects, describe the problem, your contribution, "
            "the technologies used, and the outcome."
        )
    else:
        short_projects = [
            line for line in project_lines
            if len(line.split()) < 5
        ]

        if short_projects:
            add(
                "Medium",
                "Projects",
                "These project entries may need more detail: "
                + "; ".join(short_projects[:2])
                + ". Explain what you implemented and what the project achieved."
            )

    # Experience
    experience_lines = lines_for("experience")

    if not experience_lines and not content.get("has_experience_terms"):
        add(
            "Medium",
            "Experience",
            "No Experience section or common experience terms were detected. "
            "If applicable, include internships, training, employment, or "
            "relevant practical work. Freshers can emphasize projects instead."
        )

    action_pattern = re.compile(
        r"\b(built|developed|created|designed|implemented|automated|"
        r"improved|optimized|delivered|deployed|integrated|reduced|"
        r"increased|maintained|tested|analyzed|resolved|managed|launched)\b",
        re.I,
    )

    weak_lines = [
        line for line in experience_lines
        if len(line.split()) >= 5 and not action_pattern.search(line)
    ]

    if weak_lines:
        add(
            "Medium",
            "Experience",
            "Consider rewriting these lines to make your contribution clearer: "
            + "; ".join(weak_lines[:2])
            + ". Use an accurate action verb and explain the outcome."
        )

    # Education
    education_lines = lines_for("education")

    if not education_lines:
        add(
            "Medium",
            "Education",
            "No Education section was detected. Check the heading and ensure "
            "your qualification and institution are represented in selectable text."
        )

    # Achievements
    if content.get("quantified_achievement_count", 0) == 0:
        add(
            "Low",
            "Achievements",
            "No measurable achievement was detected by the current rules. "
            "Where truthful, add project outcomes, scale, or verified results. "
            "Do not invent metrics."
        )

    if content.get("action_verb_count", 0) < 3:
        add(
            "Low",
            "Bullet points",
            "The analyzer found few recognized action verbs. Review your "
            "project and experience descriptions to make your own contributions "
            "clear and specific."
        )

    if len(text.strip()) < 700:
        add(
            "Medium",
            "Text extraction",
            "Only "
            + str(len(text.strip()))
            + " characters were extracted. Compare this with the original "
            "resume to check whether PDF or DOCX content was missed."
        )

    if not recommendations:
        add(
            "Low",
            "Final review",
            "No issues were identified by these basic checks. Compare the resume "
            "with your target job description to identify role-specific gaps."
        )

    return recommendations

# =========================
# MAIN RESUME ANALYSIS
# =========================

def analyze_resume(file_path):
    text = extract_resume_text(file_path)

    email = find_email(text)
    phone = find_phone(text)
    skills = find_skills(text)
    sections = extract_sections(text)
    content = analyze_content(text, sections)

    score_details = calculate_resume_score(
        email, phone, skills, sections, content
    )

    certifications = [
        line.strip(" •-\t")
        for line in sections.get("certifications", "").splitlines()
        if line.strip()
    ][:15]

    return {
        # Preserve the original return keys.
        "email": email,
        "phone": phone,
        "skills": skills,
        "score": score_details["overall"],
        "text_length": len(text),
        "text": text,

        # Additional analysis fields.
        "score_details": score_details,
        "sections_found": content["sections_found"],
        "section_text": sections,
        "education": find_education(text),
        "certifications": certifications,
        "content_analysis": content,
        "recommendations": generate_recommendations(
            email, phone, skills, sections, content, text
        ),
    }


# =========================
# JOB MATCHING
# =========================

def match_resume_to_jobs(resume_report, jobs, min_match_percentage=0):
    resume_skills = set(resume_report.get("skills", []))
    resume_text = resume_report.get("text", "").lower()
    results = []

    for job in jobs:
        description = str(job.get("description", ""))
        required_skills = (
            job.get("required_skills") or find_skills(description)
        )
        required_skills = list(dict.fromkeys(required_skills))
        required_set = set(required_skills)

        matched = sorted(resume_skills & required_set)
        missing = sorted(required_set - resume_skills)

        skill_score = (
            len(matched) / len(required_set) * 100
            if required_set else 0
        )

        title = str(job.get("title", ""))
        title_words = set(re.findall(
            r"[A-Za-z][A-Za-z+#.]{2,}", title.lower()
        ))

        title_hits = sum(
            1 for word in title_words
            if _contains_term(resume_text, word)
        )

        title_score = (
            title_hits / len(title_words) * 100
            if title_words else 0
        )

        match_percentage = (
            round(skill_score * 0.85 + title_score * 0.15)
            if required_set else round(title_score)
        )

        if match_percentage < min_match_percentage:
            continue

        results.append({
            "title": title,
            "company": job.get("company"),
            "location": job.get("location"),
            "salary": job.get("salary"),
            "job_type": job.get("job_type"),
            "application_url": job.get("application_url"),
            "match_percentage": match_percentage,
            "matched_skills": matched,
            "missing_skills": missing,
            "required_skills": required_skills,
        })

    return sorted(
        results,
        key=lambda item: item["match_percentage"],
        reverse=True,
    )
