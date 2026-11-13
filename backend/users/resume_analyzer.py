
import re
from pathlib import Path

from pypdf import PdfReader
from docx import Document


# =====================================================
# SKILL DATABASE
# =====================================================

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
    "Scikit-learn": ["scikit-learn", "sklearn"],
    "Matplotlib": ["matplotlib"],
    "Seaborn": ["seaborn"],
    "Streamlit": ["streamlit"],
    "Statistics": ["statistics", "statistical analysis"],
    "Data Visualization": ["data visualization", "data visualisation"],
    "Deep Learning": ["deep learning"],
    "NLP": ["natural language processing", "nlp"],
    "Generative AI": ["generative ai", "genai"],
}

SECTION_ALIASES = {
    "summary": [
        "professional summary", "career objective",
        "summary", "objective", "profile", "about me",
    ],
    "skills": [
        "technical skills", "core competencies",
        "technical expertise", "skills", "technologies",
    ],
    "experience": [
        "professional experience", "work experience",
        "internship experience", "internships",
        "employment history", "work history", "experience",
    ],
    "projects": [
        "project experience", "personal projects",
        "academic projects", "key projects", "projects",
    ],
    "education": [
        "educational background", "academic background",
        "qualifications", "education",
    ],
    "certifications": [
        "licenses and certifications",
        "certifications", "certificates", "courses",
    ],
    "achievements": [
        "achievements", "awards and achievements",
        "awards", "accomplishments",
    ],
}


# =====================================================
# TEXT EXTRACTION
# =====================================================

def extract_pdf_text(file_path):
    reader = PdfReader(str(file_path))
    pages = []

    for page in reader.pages:
        pages.append(page.extract_text() or "")

    return "\n".join(pages)


def extract_docx_text(file_path):
    document = Document(str(file_path))
    parts = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            parts.append(paragraph.text)

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


def normalize_resume_text(text):
    if not text:
        return ""

    text = text.replace("\x00", " ")
    text = text.replace("\u00a0", " ")
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Normalize repeated whitespace without destroying line breaks.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]*\n+", "\n", text)

    # PDF extraction sometimes joins uppercase section headings
    # to the previous paragraph. Separate recognizable headings.
    inline_headings = [
        "PROFESSIONAL SUMMARY",
        "CAREER OBJECTIVE",
        "TECHNICAL SKILLS",
        "CORE COMPETENCIES",
        "PROJECT EXPERIENCE",
        "INTERNSHIP EXPERIENCE",
        "WORK EXPERIENCE",
        "PROFESSIONAL EXPERIENCE",
        "EDUCATION",
        "CERTIFICATIONS",
        "ACHIEVEMENTS",
        "PROJECTS",
        "EXPERIENCE",
        "SKILLS",
    ]

    for heading in sorted(inline_headings, key=len, reverse=True):
        pattern = (
            r"(?<![A-Za-z])"
            + re.escape(heading)
            + r"(?=\s*[:•]?\s+[A-Z0-9])"
        )

        text = re.sub(
            pattern,
            lambda match: "\n" + match.group(0),
            text,
        )

    return "\n".join(
        line.strip()
        for line in text.splitlines()
        if line.strip()
    )


def extract_resume_text(file_path):
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError("Resume file not found.")

    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        text = extract_pdf_text(file_path)
    elif suffix == ".docx":
        text = extract_docx_text(file_path)
    else:
        raise ValueError("Only PDF and DOCX resume files are supported.")

    text = normalize_resume_text(text)

    if not text:
        raise ValueError(
            "No readable text found. The PDF may be scanned or image-based."
        )

    return text


# =====================================================
# CONTACT EXTRACTION
# =====================================================

def find_email(text):
    match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text,
    )
    return match.group(0) if match else None


def find_phone(text):
    # Supports Indian mobile numbers with spaces, hyphens,
    # optional +91 / 91 / 0 prefixes.
    pattern = (
        r"(?<!\d)"
        r"(?:(?:\+?91|0)[\s().-]*)?"
        r"[6-9]\d{2,4}[\s().-]*\d{3,5}[\s().-]*\d{3,5}"
        r"(?!\d)"
    )

    for match in re.finditer(pattern, text):
        digits = re.sub(r"\D", "", match.group(0))

        if len(digits) == 10 and digits[0] in "6789":
            return digits

        if len(digits) == 12 and digits.startswith("91"):
            number = digits[-10:]
            if number[0] in "6789":
                return number

        if len(digits) == 11 and digits.startswith("0"):
            number = digits[-10:]
            if number[0] in "6789":
                return number

    return None


# =====================================================
# SKILL EXTRACTION
# =====================================================

def contains_term(text, term):
    pattern = (
        r"(?<![a-z0-9+#.])"
        + re.escape(term.lower())
        + r"(?![a-z0-9+#.])"
    )
    return bool(re.search(pattern, text.lower()))


def find_skills(text):
    found = []

    for skill, aliases in SKILL_ALIASES.items():
        if any(contains_term(text, alias) for alias in aliases):
            found.append(skill)

    return found


# =====================================================
# SECTION DETECTION
# =====================================================

def normalize_heading(line):
    line = line.strip().lower()
    line = re.sub(r"^[\s:|•\-*]+", "", line)
    line = re.sub(r"[\s:|•\-*.,]+$", "", line)
    return line.strip()


def extract_sections(text):
    lookup = {
        normalize_heading(alias): section
        for section, aliases in SECTION_ALIASES.items()
        for alias in aliases
    }

    sections = {}
    current = "other"

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        heading = normalize_heading(line)

        if heading in lookup:
            current = lookup[heading]
            sections.setdefault(current, [])
            continue

        # Handle headings followed by content on the same line.
        matched_heading = None
        matched_section = None
        remaining_text = line

        for alias, section in sorted(
            lookup.items(),
            key=lambda item: len(item[0]),
            reverse=True,
        ):
            pattern = (
                r"^\s*"
                + re.escape(alias)
                + r"\s*[:|•\-]\s*(.*)$"
            )
            match = re.match(pattern, line, re.I)

            if match:
                matched_heading = alias
                matched_section = section
                remaining_text = match.group(1).strip()
                break

        if matched_heading:
            current = matched_section
            sections.setdefault(current, [])

            if remaining_text:
                sections[current].append(remaining_text)
        else:
            sections.setdefault(current, []).append(line)

    return {
        name: "\n".join(lines).strip()
        for name, lines in sections.items()
    }


def get_section_lines(sections, name):
    value = sections.get(name, "")

    if isinstance(value, list):
        lines = value
    else:
        lines = str(value or "").splitlines()

    return [
        line.strip(" \t•-*")
        for line in lines
        if line.strip()
    ]


# =====================================================
# EDUCATION AND CERTIFICATIONS
# =====================================================

def find_education(text, sections):
    education_lines = get_section_lines(sections, "education")

    if education_lines:
        return education_lines[:15]

    # Fallback only when no Education heading was detected.
    patterns = (
        r"\bbachelor\b",
        r"\bmaster\b",
        r"\bb\.tech\b",
        r"\bm\.tech\b",
        r"\bb\.sc\b",
        r"\bm\.sc\b",
        r"\bb\.com\b",
        r"\bmca\b",
        r"\bbca\b",
        r"\bmba\b",
        r"\buniversity\b",
        r"\bcollege\b",
        r"\bdiploma\b",
        r"\bintermediate\b",
        r"\bssc\b",
    )

    matches = [
        line.strip()
        for line in text.splitlines()
        if any(re.search(pattern, line, re.I) for pattern in patterns)
    ]

    return matches[:10]


def find_certifications(sections):
    return get_section_lines(sections, "certifications")[:15]


# =====================================================
# CONTENT ANALYSIS
# =====================================================

def analyze_content(text, sections):
    action_verbs = [
        "built", "developed", "created", "designed",
        "implemented", "automated", "improved",
        "optimized", "delivered", "deployed",
        "integrated", "reduced", "increased",
        "maintained", "tested", "analyzed",
        "resolved", "managed", "launched",
    ]

    action_count = sum(
        len(re.findall(
            r"\b" + re.escape(verb) + r"\b",
            text,
            re.I,
        ))
        for verb in action_verbs
    )

    quantified_count = len(re.findall(
        r"\b\d+(?:\.\d+)?\s*%"
        r"|\b\d+\s*(?:users|projects|customers|records|hours|days|months|years)\b"
        r"|\b\d+x\b",
        text,
        re.I,
    ))

    years = sorted(set(re.findall(r"\b(?:19|20)\d{2}\b", text)))

    section_names = [
        name
        for name in SECTION_ALIASES
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


# =====================================================
# RESUME SCORE
# =====================================================

def calculate_resume_score(email, phone, skills, sections, content):
    breakdown = {
        "contact_information": (
            (5 if email else 0) + (5 if phone else 0)
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

    score = round(sum(breakdown.values()))

    return {
        "overall": min(100, score),
        "max": 100,
        "breakdown": breakdown,
        "note": (
            "This is a rule-based resume checklist, not an official "
            "ATS score or a guarantee of job selection."
        ),
    }


# =====================================================
# RECOMMENDATIONS
# =====================================================

def generate_recommendations(
    email, phone, skills, sections, content, text
):
    recommendations = []

    def add(priority, area, advice):
        recommendations.append({
            "priority": priority,
            "area": area,
            "advice": advice,
        })

    def excerpt(line, limit=160):
        line = re.sub(r"\s+", " ", line).strip()
        if len(line) > limit:
            return line[:limit - 3].rstrip() + "..."
        return line

    if not email:
        add(
            "High",
            "Contact",
            "No email address was detected. Check the contact details "
            "and confirm the email is selectable text.",
        )

    if not phone:
        add(
            "High",
            "Contact",
            "No supported phone number was detected. Check the number "
            "and verify PDF/DOCX extraction preserved it correctly.",
        )

    skill_lines = get_section_lines(sections, "skills")

    if not skill_lines:
        add(
            "High",
            "Skills",
            "No clearly labelled Skills section was detected. "
            "Use a clear Technical Skills heading.",
        )
    elif not skills:
        add(
            "Medium",
            "Skills",
            "A Skills section was found, but no supported skills were "
            "recognized. Review the extracted text.",
        )
    elif len(skills) < 5:
        add(
            "Low",
            "Skills",
            "The analyzer recognized: " + ", ".join(skills)
            + ". Check whether other genuine skills were missed.",
        )

    project_lines = get_section_lines(sections, "projects")

    if not project_lines:
        add(
            "High",
            "Projects",
            "No Projects section was detected. If relevant, describe "
            "the problem, your contribution, technologies and results.",
        )

    experience_lines = get_section_lines(sections, "experience")

    if not experience_lines and not content["has_experience_terms"]:
        add(
            "Medium",
            "Experience",
            "No Experience section or common experience terms were "
            "detected. Freshers can highlight internships and projects.",
        )

    education_lines = get_section_lines(sections, "education")

    if not education_lines:
        add(
            "Medium",
            "Education",
            "No Education section was detected. Check its heading and "
            "ensure your qualification and institution are selectable text.",
        )

    if not get_section_lines(sections, "certifications"):
        if re.search(r"\b(certification|certificate|certified)\b", text, re.I):
            add(
                "Low",
                "Certifications",
                "Certification-related text exists, but a separate "
                "Certifications section was not detected. Check its heading.",
            )

    if content["quantified_achievement_count"] == 0:
        add(
            "Low",
            "Achievements",
            "No supported measurable result was detected. Where truthful, "
            "include verified outcomes, scale or impact. Do not invent numbers.",
        )

    if len(text.strip()) < 700:
        add(
            "Medium",
            "Text extraction",
            "Only " + str(len(text.strip()))
            + " characters were extracted. Compare the extracted text "
            "with the original file to check for missing content.",
        )

    if not recommendations:
        recommendations.append({
            "priority": "Low",
            "area": "Final review",
            "advice": (
                "No obvious issues were identified by these basic checks. "
                "Compare your resume with the target job description."
            ),
        })

    return recommendations


# =====================================================
# MAIN RESUME ANALYSIS
# =====================================================

def analyze_resume(file_path):
    text = extract_resume_text(file_path)

    email = find_email(text)
    phone = find_phone(text)
    skills = find_skills(text)
    sections = extract_sections(text)

    content = analyze_content(text, sections)

    score_details = calculate_resume_score(
        email,
        phone,
        skills,
        sections,
        content,
    )

    return {
        "email": email,
        "phone": phone,
        "skills": skills,
        "score": score_details["overall"],
        "text_length": len(text),
        "text": text,
        "score_details": score_details,
        "sections_found": content["sections_found"],
        "section_text": sections,
        "education": find_education(text, sections),
        "certifications": find_certifications(sections),
        "content_analysis": content,
        "recommendations": generate_recommendations(
            email,
            phone,
            skills,
            sections,
            content,
            text,
        ),
    }


# =====================================================
# JOB MATCHING
# =====================================================

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
            r"[A-Za-z][A-Za-z+#.]{2,}",
            title.lower(),
        ))

        title_hits = sum(
            1 for word in title_words
            if contains_term(resume_text, word)
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
