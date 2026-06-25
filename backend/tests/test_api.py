from app.main import app


def test_health_check():
    response = app.health_check()
    assert response['status'] == 'ok'


def test_resume_analysis_endpoint():
    payload = type('Payload', (), {
        'resume_text': 'Experienced software engineer with Python, FastAPI, React, AWS, and PostgreSQL experience. Built scalable APIs and shipped production services.',
        'job_description': 'Senior backend engineer with Python, FastAPI, AWS, and PostgreSQL experience.'
    })()
    response = app.routes[1][2](payload)
    data = response
    assert 0 <= data['ats_score'] <= 100
    assert 'skills' in data
    assert 'summary' in data
    assert 'breakdown' in data
    assert 'missing_skills' in data


def test_job_match_endpoint():
    payload = type('Payload', (), {
        'job_description': 'Seeking a senior Python backend engineer with FastAPI experience and AWS knowledge.',
        'resume_text': 'Software engineer with Python, FastAPI, REST APIs, and PostgreSQL. Built reliable backend systems and cloud services.'
    })()
    response = app.routes[2][2](payload)
    data = response
    assert 0 <= data['match_percentage'] <= 100
    assert 'missing_skills' in data
    assert 'recruiter_summary' in data
