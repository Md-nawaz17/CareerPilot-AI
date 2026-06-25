from app.main import app


def test_health_check():
    response = app.health_check()
    assert response['status'] == 'ok'


def test_resume_analysis_endpoint():
    payload = type('Payload', (), {'text': 'Experienced software engineer with Python, FastAPI, React, and AWS experience.'})()
    response = app.routes[1][2](payload)
    data = response.dict()
    assert data['ats_score'] >= 0
    assert 'skills' in data
    assert 'summary' in data


def test_job_match_endpoint():
    payload = type('Payload', (), {
        'job_description': 'Seeking a senior Python backend engineer with FastAPI experience.',
        'resume_text': 'Software engineer with Python, FastAPI, REST APIs, and PostgreSQL.'
    })()
    response = app.routes[2][2](payload)
    data = response.dict()
    assert 0 <= data['match_percentage'] <= 100
    assert 'missing_skills' in data
