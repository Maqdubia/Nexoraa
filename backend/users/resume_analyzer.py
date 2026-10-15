



import re

from pypdf import PdfReader
from docx import Document


# =========================
# PDF TEXT EXTRACTION
# =========================

def extract_pdf_text(file_path):
    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    return text


# =========================
# DOCX TEXT EXTRACTION
# =========================

def extract_docx_text(file_path):
    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


# =========================
# RESUME TEXT EXTRACTION
# =========================

def extract_resume_text(file_path):

    if file_path.lower().endswith(".pdf"):
        return extract_pdf_text(file_path)

    elif file_path.lower().endswith(".docx"):
        return extract_docx_text(file_path)

    return ""


# =========================
# EMAIL EXTRACTION
# =========================

def find_email(text):

    match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    )

    if match:
        return match.group()

    return None


# =========================
# PHONE EXTRACTION
# =========================

def find_phone(text):

    match = re.search(
        r"\b[6-9]\d{9}\b",
        text
    )

    if match:
        return match.group()

    return None


# =========================
# SKILL EXTRACTION
# =========================

def find_skills(text):

    skills = [
        "Python",
        "Java",
        "JavaScript",
        "React",
        "Django",
        "FastAPI",
        "SQL",
        "MySQL",
        "HTML",
        "CSS",
        "Git",
        "GitHub",
        "Machine Learning",
        "AI",
        "Data Analysis",
        "Excel",
    ]

    found_skills = []

    text_lower = text.lower()

    for skill in skills:

        if skill.lower() in text_lower:
            found_skills.append(skill)

    return found_skills


# =========================
# RESUME ANALYSIS
# =========================
def analyze_resume(file_path):

    text = extract_resume_text(file_path)

    email = find_email(text)

    phone = find_phone(text)

    skills = find_skills(text)

    score = 0

    if email:
        score += 20

    if phone:
        score += 20

    if skills:
        score += 40

    if len(text.strip()) > 500:
        score += 20

    return {
        "email": email,
        "phone": phone,
        "skills": skills,
        "score": score,
        "text_length": len(text),
        "text": text,
    }