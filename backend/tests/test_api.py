import logging
import sys
import types

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_ats_scoring_endpoint_returns_weighted_breakdown():
    payload = {
        "resume_text": "John Doe\nSoftware Engineer\nEmail: john@example.com\nPhone: 123-456-7890\nSkills: Python, FastAPI, React, SQL\nExperience: Built APIs and dashboards for 5 years.\nEducation: B.S. Computer Science\nProjects: Developed analytics platform.\nCertifications: AWS Certified Developer\nSummary: Experienced software engineer with strong backend and frontend skills."
    }
    response = client.post("/api/analyze/ats", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["score"] >= 0
    assert body["score"] <= 100
    assert body["breakdown"]["contact_info"]["score"] >= 0
    assert body["breakdown"]["skills_match"]["score"] >= 0
    assert body["breakdown"]["work_experience"]["score"] >= 0


def test_job_match_endpoint_returns_similarity_and_keywords():
    payload = {
        "resume_text": "Python FastAPI React SQL AWS",
        "job_description": "Looking for Python FastAPI SQL Azure backend engineer"
    }
    response = client.post("/api/analyze/job-match", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["match_percentage"] >= 0
    assert body["match_percentage"] <= 100
    assert isinstance(body["missing_keywords"], list)
    assert isinstance(body["present_keywords"], list)
    assert isinstance(body["recruiter_suggestions"], list)


def test_job_match_strips_stopwords_and_matches_word_variants():
    payload = {
        "resume_text": "Python FastAPI React TypeScript engineering",
        "job_description": "Looking for a Python engineer with FastAPI, React, and TypeScript."
    }
    response = client.post("/api/analyze/job-match", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["match_percentage"] >= 80
    assert "python" in body["present_keywords"]
    assert "engineer" in body["present_keywords"]
    assert "with" not in body["present_keywords"]
    assert "and" not in body["present_keywords"]
    assert body["missing_keywords"] == []


def test_cover_letter_endpoint_returns_safe_fallback(monkeypatch):
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    payload = {
        "resume_text": (
            "MOHAMMED NAWAZ\n"
            "Shivamogga Karnataka India +91 8088576284 mdjob1712@gmail.com\n"
            "Skills: Python, FastAPI, React\n"
            "Experience: Built API integrations and dashboards."
        ),
        "job_description": (
            "Job Title: Backend Engineer\n"
            "This is a 3-month contract with possible extension."
        ),
    }
    response = client.post("/api/analyze/cover-letter", json=payload)
    assert response.status_code == 200
    body = response.json()
    letter = body["cover_letter"]
    assert body["generation_source"] == "fallback"
    assert "Dear Hiring Manager" in letter
    assert "Mohammed Nawaz" in letter
    assert "Python, FastAPI, and React" in letter
    assert "Backend Engineer" in letter
    assert "Your Name" not in letter
    assert "Shivamogga Karnataka India" not in letter
    assert "3-month contract with possible extension" not in letter


def test_cover_letter_endpoint_uses_nvidia_provider_when_configured(monkeypatch):
    payload = {
        "resume_text": "Experienced Python developer with FastAPI and React.",
        "job_description": "Backend engineer with Python and API experience."
    }
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")

    class FakeCompletions:
        def create(self, **kwargs):
            return types.SimpleNamespace(
                choices=[types.SimpleNamespace(message=types.SimpleNamespace(content="NVIDIA cover letter"))]
            )

    class FakeClient:
        def __init__(self, *args, **kwargs):
            self.chat = types.SimpleNamespace(completions=FakeCompletions())

    monkeypatch.setitem(sys.modules, "openai", types.SimpleNamespace(OpenAI=FakeClient))

    response = client.post("/api/analyze/cover-letter", json=payload)
    assert response.status_code == 200
    assert response.json()["cover_letter"] == "NVIDIA cover letter"
    assert response.json()["generation_source"] == "nvidia"


def test_cover_letter_logs_nvidia_failure_and_uses_safe_fallback(monkeypatch, caplog):
    payload = {
        "resume_text": "JANE DOE\nSkills: Python, FastAPI, Docker",
        "job_description": "Job Title: Platform Engineer",
    }
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    class FailingCompletions:
        def create(self, **kwargs):
            raise RuntimeError("provider request failed")

    class FakeClient:
        def __init__(self, *args, **kwargs):
            self.chat = types.SimpleNamespace(completions=FailingCompletions())

    monkeypatch.setitem(sys.modules, "openai", types.SimpleNamespace(OpenAI=FakeClient))

    with caplog.at_level(logging.ERROR, logger="backend.app.routers.cover_letter"):
        response = client.post("/api/analyze/cover-letter", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["generation_source"] == "fallback"
    assert "JANE DOE" not in body["cover_letter"]
    assert "Jane Doe" in body["cover_letter"]
    assert "NVIDIA cover-letter generation failed" in caplog.text
    assert "RuntimeError: provider request failed" in caplog.text
