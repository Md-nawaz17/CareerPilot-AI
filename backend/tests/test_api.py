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


def test_cover_letter_endpoint_returns_text():
    payload = {
        "resume_text": "Experienced Python developer with FastAPI and React.",
        "job_description": "Backend engineer with Python and API experience."
    }
    response = client.post("/api/analyze/cover-letter", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "Dear Hiring Manager" in body["cover_letter"]


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
