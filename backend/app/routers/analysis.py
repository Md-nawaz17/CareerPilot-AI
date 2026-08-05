import re
import string
from collections import Counter
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ATSRequest(BaseModel):
    resume_text: str


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


def _normalize(text: str) -> str:
    text = text.lower()
    text = text.replace("\n", " ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "been",
    "being",
    "by",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "his",
    "in",
    "is",
    "it",
    "its",
    "me",
    "more",
    "my",
    "no",
    "not",
    "of",
    "on",
    "or",
    "our",
    "s",
    "she",
    "so",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "was",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "will",
    "with",
    "would",
    "you",
    "your",
    "looking",
}


def _stem_token(token: str) -> str:
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    if token.endswith("ing") and len(token) > 5:
        return token[:-3]
    if token.endswith("ed") and len(token) > 4:
        return token[:-2]
    if token.endswith("ers") and len(token) > 4:
        return token[:-3] + "er"
    if token.endswith("s") and len(token) > 3:
        return token[:-1]
    return token


def _extract_keywords(text: str) -> List[str]:
    tokens = re.findall(r"[a-z0-9+#.]+", _normalize(text))
    return [token for token in tokens if len(token) > 1]


def _filter_keywords(tokens: List[str]) -> List[str]:
    return [
        _stem_token(token)
        for token in tokens
        if token not in STOPWORDS
    ]


def _extract_section(text: str, label: str) -> str:
    pattern = rf"{label}:?(.*)"
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""


def _format_candidate_name(value: str) -> str:
    words = re.findall(r"[A-Za-z][A-Za-z'.-]*", value)
    return " ".join(word.capitalize() if word.isupper() else word for word in words)


def _extract_candidate_name(resume_text: str) -> str:
    labelled_match = re.search(
        r"(?im)^\s*(?:candidate\s+)?name\s*[:\-]\s*([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,3})",
        resume_text,
    )
    if labelled_match:
        return _format_candidate_name(labelled_match.group(1))

    for line in resume_text.splitlines()[:12]:
        compact_line = " ".join(line.split())
        if not compact_line:
            continue

        uppercase_match = re.match(r"^([A-Z][A-Z'.-]*(?:\s+[A-Z][A-Z'.-]*){1,3})\b", compact_line)
        if uppercase_match:
            return _format_candidate_name(uppercase_match.group(1))

        title_case_match = re.match(r"^([A-Z][a-z'.-]*(?:\s+[A-Z][a-z'.-]*){1,2})\b", compact_line)
        if title_case_match:
            return _format_candidate_name(title_case_match.group(1))

    return ""


def _build_resume_profile(resume_text: str) -> Dict[str, Any]:
    normalized = _normalize(resume_text)
    sections = {
        "name": "",
        "email": "",
        "phone": "",
        "skills": [],
        "experience": "",
        "education": "",
        "projects": "",
        "certifications": "",
        "summary": "",
    }

    email_match = re.search(r"([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})", resume_text, flags=re.IGNORECASE)
    phone_match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", resume_text)

    if email_match:
        sections["email"] = email_match.group(1)
    if phone_match:
        sections["phone"] = phone_match.group(0)
    sections["name"] = _extract_candidate_name(resume_text)

    sections["summary"] = _extract_section(resume_text, "summary") or ""
    sections["experience"] = _extract_section(resume_text, "experience") or ""
    sections["education"] = _extract_section(resume_text, "education") or ""
    sections["projects"] = _extract_section(resume_text, "projects") or ""
    sections["certifications"] = _extract_section(resume_text, "certifications") or ""

    skills_text = _extract_section(resume_text, "skills")
    if skills_text:
        sections["skills"] = [s.strip() for s in re.split(r"[,;|]", skills_text) if s.strip()]
    else:
        skill_tokens = [token for token in _extract_keywords(resume_text) if token not in {"experience", "education", "summary", "projects", "certifications", "email", "phone"}]
        sections["skills"] = list(dict.fromkeys(skill_tokens[:12]))

    return {"raw_text": resume_text, "normalized_text": normalized, **sections}


def _calculate_ats_score(profile: Dict[str, Any]) -> Dict[str, Any]:
    text = profile["raw_text"]
    normalized = profile["normalized_text"]

    contact_score = 100 if (profile["name"] and profile["email"] and profile["phone"]) else 60
    summary_score = 100 if profile["summary"] else 40
    skills = profile["skills"]
    skills_score = min(100, max(20, round(100 * min(len(skills), 8) / 8))) if skills else 20
    experience_score = 100 if profile["experience"] else 40
    education_score = 100 if profile["education"] else 60
    formatting_score = 100 if len(text.splitlines()) >= 3 else 60
    action_verbs_score = 100 if re.search(r"\b(built|developed|led|designed|managed|created|improved|implemented|delivered|optimized)\b", normalized, re.I) else 50
    measurable_score = 100 if re.search(r"\b\d+%\b|\b\d+\s*(years|months|clients|users|projects|teams)\b", normalized, re.I) else 40

    breakdown = {
        "contact_info": {"label": "Contact Info", "score": contact_score, "weight": 10},
        "summary": {"label": "Summary", "score": summary_score, "weight": 10},
        "skills_match": {"label": "Skills Match", "score": skills_score, "weight": 25},
        "work_experience": {"label": "Work Experience", "score": experience_score, "weight": 20},
        "education": {"label": "Education", "score": education_score, "weight": 10},
        "formatting": {"label": "Formatting", "score": formatting_score, "weight": 10},
        "action_verbs": {"label": "Action Verbs", "score": action_verbs_score, "weight": 10},
        "measurable_achievements": {"label": "Measurable Achievements", "score": measurable_score, "weight": 5},
    }

    weighted_score = sum((item["score"] * item["weight"]) for item in breakdown.values()) / 100
    overall_score = round(weighted_score, 2)

    return {"profile": profile, "breakdown": breakdown, "score": overall_score}


@router.post("/ats")
def analyze_ats(payload: ATSRequest):
    profile = _build_resume_profile(payload.resume_text)
    result = _calculate_ats_score(profile)
    return {
        "score": result["score"],
        "breakdown": result["breakdown"],
        "profile": result["profile"],
        "recommendations": [
            "Add a stronger professional summary with target keywords.",
            "Include quantified achievements and metrics in your experience bullets.",
            "Mirror job-specific keywords in your skills section."
        ],
    }


@router.post("/job-match")
def job_match(payload: JobMatchRequest):
    resume_tokens = set(_filter_keywords(_extract_keywords(payload.resume_text)))
    jd_tokens = set(_filter_keywords(_extract_keywords(payload.job_description)))

    if not resume_tokens or not jd_tokens:
        match_percentage = 0
    else:
        overlap = resume_tokens & jd_tokens
        match_percentage = round((len(overlap) / max(len(jd_tokens), 1)) * 100, 2)

    missing_keywords = sorted(list(jd_tokens - resume_tokens))
    present_keywords = sorted(list(resume_tokens & jd_tokens))
    recruiter_suggestions = [
        f"Add more emphasis on {', '.join(missing_keywords[:3]) or 'target keywords'} to align with the role.",
        "Quantify impact with metrics and business outcomes.",
        "Consider tailoring your summary and headline to the job description."
    ]

    return {
        "match_percentage": match_percentage,
        "missing_keywords": missing_keywords,
        "present_keywords": present_keywords,
        "recruiter_suggestions": recruiter_suggestions,
    }
