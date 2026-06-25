class JobMatchRequest:
    def __init__(self, job_description: str, resume_text: str):
        self.job_description = job_description
        self.resume_text = resume_text


class JobMatchResponse:
    def __init__(self, match_percentage: int, missing_skills: list[str], matching_skills: list[str]):
        self.match_percentage = match_percentage
        self.missing_skills = missing_skills
        self.matching_skills = matching_skills

    def dict(self):
        return {
            'match_percentage': self.match_percentage,
            'missing_skills': self.missing_skills,
            'matching_skills': self.matching_skills,
        }


def job_match(payload):
    jd = payload.job_description.lower()
    resume = payload.resume_text.lower()
    matching_skills = [skill for skill in ['python', 'fastapi', 'react', 'postgresql'] if skill in resume and skill in jd]
    missing_skills = [skill for skill in ['docker', 'aws'] if skill in jd and skill not in resume]
    match_percentage = min(100, 45 + len(matching_skills) * 15)
    return JobMatchResponse(
        match_percentage=match_percentage,
        missing_skills=missing_skills,
        matching_skills=matching_skills,
    )
