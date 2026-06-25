class ResumeAnalysisRequest:
    def __init__(self, text: str):
        self.text = text


class ResumeAnalysisResponse:
    def __init__(self, ats_score: int, skills: list[str], summary: str, suggestions: list[str]):
        self.ats_score = ats_score
        self.skills = skills
        self.summary = summary
        self.suggestions = suggestions

    def dict(self):
        return {
            'ats_score': self.ats_score,
            'skills': self.skills,
            'summary': self.summary,
            'suggestions': self.suggestions,
        }


def analyze_resume(payload):
    text = payload.text.lower()
    skills = []
    for keyword in ['python', 'fastapi', 'react', 'aws', 'postgresql', 'docker']:
        if keyword in text:
            skills.append(keyword)

    ats_score = min(95, 60 + len(skills) * 8)
    suggestions = [
        'Add quantified achievements to your experience bullets.',
        'Include role-specific keywords from the target job description.',
        'Use a clean ATS-friendly format with standard section headings.'
    ]
    return ResumeAnalysisResponse(
        ats_score=ats_score,
        skills=skills or ['python', 'backend development'],
        summary='Resume shows strong technical depth with a clear product-oriented background.',
        suggestions=suggestions,
    )
