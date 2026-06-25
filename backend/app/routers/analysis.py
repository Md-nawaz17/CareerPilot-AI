from __future__ import annotations

from typing import List


TECH_SKILLS = [
    'python', 'fastapi', 'react', 'typescript', 'aws', 'docker', 'postgresql', 'kubernetes',
    'machine learning', 'data engineering', 'rest api', 'microservices', 'ci/cd'
]

SECTION_HINTS = ['experience', 'education', 'skills', 'projects', 'certifications', 'summary']


def _normalize(text: str) -> str:
    return ' '.join(text.lower().split())


def _extract_keywords(text: str) -> List[str]:
    normalized = _normalize(text)
    found = [skill for skill in TECH_SKILLS if skill in normalized]
    return found


def _score_resume(text: str) -> dict:
    normalized = _normalize(text)
    keywords = _extract_keywords(normalized)
    sections_present = [section for section in SECTION_HINTS if section in normalized]
    has_contact = any(token in normalized for token in ['@', 'linkedin', 'github'])
    has_action_verbs = any(token in normalized for token in ['built', 'led', 'ship', 'delivered', 'developed', 'designed'])
    has_metrics = any(char.isdigit() for char in normalized)
    has_projects = 'project' in normalized or 'projects' in normalized

    score = 45
    breakdown = []

    if keywords:
        score += min(25, len(keywords) * 3)
        breakdown.append({'name': 'Skills', 'points': min(25, len(keywords) * 3), 'reason': 'Industry-relevant technologies are present.'})
    else:
        breakdown.append({'name': 'Skills', 'points': 0, 'reason': 'No major technical keywords were detected.'})

    if sections_present:
        score += min(12, len(sections_present) * 2)
        breakdown.append({'name': 'Resume structure', 'points': min(12, len(sections_present) * 2), 'reason': 'Standard resume sections increase ATS readability.'})
    else:
        breakdown.append({'name': 'Resume structure', 'points': 0, 'reason': 'Add clear sections such as Experience, Skills, and Education.'})

    if has_contact:
        score += 8
        breakdown.append({'name': 'Contact details', 'points': 8, 'reason': 'Contact and professional links improve recruiter usability.'})
    else:
        breakdown.append({'name': 'Contact details', 'points': 0, 'reason': 'Add email, LinkedIn, or GitHub details.'})

    if has_action_verbs:
        score += 5
        breakdown.append({'name': 'Action verbs', 'points': 5, 'reason': 'Strong verbs show impact and ownership.'})
    else:
        breakdown.append({'name': 'Action verbs', 'points': 0, 'reason': 'Use verbs like built, led, shipped, and improved.'})

    if has_metrics:
        score += 5
        breakdown.append({'name': 'Quantified impact', 'points': 5, 'reason': 'Numbers make achievements more credible.'})
    else:
        breakdown.append({'name': 'Quantified impact', 'points': 0, 'reason': 'Add metrics such as performance gains or scale.'})

    if has_projects:
        score += 5
        breakdown.append({'name': 'Projects', 'points': 5, 'reason': 'Projects show applied experience and depth.'})
    else:
        breakdown.append({'name': 'Projects', 'points': 0, 'reason': 'Highlight projects to demonstrate hands-on work.'})

    score = min(100, score)
    return {'score': score, 'breakdown': breakdown, 'keywords': keywords}


def analyze_resume(payload: object) -> dict:
    text = getattr(payload, 'resume_text', None) or getattr(payload, 'text', '') or ''
    normalized = _normalize(text)
    score_data = _score_resume(normalized)

    missing_skills = [skill for skill in TECH_SKILLS if skill not in normalized][:5]
    strengths = []
    if 'python' in normalized:
        strengths.append('Python proficiency is clearly present')
    if 'react' in normalized or 'typescript' in normalized:
        strengths.append('Frontend or full-stack exposure is visible')
    if 'aws' in normalized or 'docker' in normalized:
        strengths.append('Cloud and delivery tooling experience is evident')

    summary = (
        'This resume demonstrates solid technical depth and is competitive for modern product and engineering roles.'
        if score_data['score'] >= 70 else
        'This resume has a promising base but would benefit from clearer keyword alignment and stronger evidence of impact.'
    )

    suggestions = [
        'Add measurable impact statements for each role.',
        'Include role-specific keywords from the target position.',
        'Standardize the format with clear section headings and contact details.'
    ]

    return {
        'ats_score': score_data['score'],
        'skills': score_data['keywords'] or ['python', 'backend development'],
        'summary': summary,
        'suggestions': suggestions,
        'breakdown': score_data['breakdown'],
        'missing_skills': missing_skills,
        'strengths': strengths or ['Clear technical intent'],
        'weaknesses': ['Quantified impact is not yet fully visible'] if score_data['score'] < 80 else ['Opportunities remain to refine keyword targeting'],
    }
