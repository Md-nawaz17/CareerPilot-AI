from __future__ import annotations

from typing import List

TARGET_SKILLS = ['python', 'fastapi', 'react', 'aws', 'docker', 'postgresql', 'typescript']


def _normalize(text: str) -> str:
    return ' '.join(text.lower().split())


def _overlap_skills(job_description: str, resume_text: str) -> tuple[List[str], List[str]]:
    normalized_jd = _normalize(job_description)
    normalized_resume = _normalize(resume_text)
    matching_skills = [skill for skill in TARGET_SKILLS if skill in normalized_jd and skill in normalized_resume]
    missing_skills = [skill for skill in TARGET_SKILLS if skill in normalized_jd and skill not in normalized_resume]
    return matching_skills, missing_skills


def job_match(payload: object) -> dict:
    job_description = getattr(payload, 'job_description', '') or ''
    resume_text = getattr(payload, 'resume_text', '') or ''
    matching_skills, missing_skills = _overlap_skills(job_description, resume_text)

    overlap_score = len(matching_skills) / max(1, len(TARGET_SKILLS))
    experience_score = 1 if 'experience' in _normalize(resume_text) or 'experienced' in _normalize(resume_text) else 0
    role_score = 1 if 'engineer' in _normalize(job_description).lower() and 'engineer' in _normalize(resume_text).lower() else 0
    match_percentage = int(min(100, round(45 + overlap_score * 35 + experience_score * 10 + role_score * 10)))

    recruiter_summary = (
        'Strong alignment with the role, especially on core backend and cloud keywords.'
        if match_percentage >= 75 else
        'The resume shows potential but would benefit from closer keyword alignment and clearer evidence of the target stack.'
    )

    return {
        'match_percentage': match_percentage,
        'missing_skills': missing_skills,
        'matching_skills': matching_skills,
        'recruiter_summary': recruiter_summary,
        'experience_match': min(100, 50 + experience_score * 50),
        'keyword_coverage': int(min(100, round(overlap_score * 100))),
    }
