from django.test import SimpleTestCase

from .screening import extract_job_keywords, score_resume_against_job


class ResumeScreeningScoringTests(SimpleTestCase):
    def test_keyword_extraction_uses_job_description_terms(self):
        keywords = extract_job_keywords(
            "Python developer with SQL and data analysis experience. "
            "Build machine learning pipelines with Python and SQL."
        )

        self.assertIn("python", keywords)
        self.assertTrue(any("data" in item or "analysis" in item for item in keywords))

    def test_score_returns_explainable_skill_and_keyword_evidence(self):
        result = score_resume_against_job(
            job_text="Python developer using SQL and machine learning",
            required_skills=["Python", "SQL", "Machine Learning"],
            job_keywords=["python", "machine learning", "data pipelines"],
            resume_text="Built Python and SQL data pipelines for a machine learning project.",
            resume_skills=["Python", "SQL"],
            text_similarity=72.5,
        )

        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)
        self.assertEqual(result["matched_skills"], ["Python", "SQL"])
        self.assertEqual(result["missing_skills"], ["Machine Learning"])
        self.assertEqual(result["score_breakdown"]["skill_match"], 67)
        self.assertIn("python", result["matched_keywords"])

    def test_no_required_skills_renormalizes_available_components(self):
        result = score_resume_against_job(
            job_text="Operations analyst with reporting and process improvement",
            required_skills=[],
            job_keywords=["operations analyst", "reporting"],
            resume_text="Operations analyst focused on reporting.",
            resume_skills=[],
            text_similarity=60,
        )

        self.assertIsNone(result["score_breakdown"]["skill_match"])
        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)
