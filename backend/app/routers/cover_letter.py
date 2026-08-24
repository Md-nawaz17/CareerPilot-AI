import logging
import os
import re
from typing import Any, Optional, Sequence

from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.routers.analysis import _build_resume_profile

router = APIRouter()
logger = logging.getLogger(__name__)

DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_NVIDIA_MODEL = "deepseek-ai/deepseek-v4-pro"

KNOWN_SKILLS: Sequence[tuple[str, str]] = (
    ("Python", r"\bpython\b"),
    ("TypeScript", r"\btypescript\b"),
    ("JavaScript", r"\bjavascript\b"),
    ("React", r"\breact\b"),
    ("Node.js", r"\bnode(?:\.js)?\b"),
    ("FastAPI", r"\bfastapi\b"),
    ("Django", r"\bdjango\b"),
    ("Flask", r"\bflask\b"),
    ("SQL", r"\bsql\b"),
    ("MongoDB", r"\bmongodb\b"),
    ("Docker", r"\bdocker\b"),
    ("AWS", r"\baws\b"),
    ("Azure", r"\bazure\b"),
    ("Machine Learning", r"\bmachine learning\b"),
    ("Data Analysis", r"\bdata analysis\b"),
    ("Java", r"\bjava\b"),
    ("C++", r"\bc\+\+\b"),
)

SKILL_STOP_WORDS = {
    "address",
    "certification",
    "certifications",
    "contact",
    "education",
    "email",
    "experience",
    "github",
    "linkedin",
    "phone",
    "profile",
    "project",
    "projects",
    "resume",
    "skills",
    "summary",
}


class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str


def _clean_phrase(value: str, max_words: int = 8) -> str:
    compact = re.sub(r"\s+", " ", value).strip(" .,:;|-\t")
    words = compact.split()
    return " ".join(words[:max_words]).strip(" .,:;|-")


def _display_name(profile: dict[str, Any]) -> str:
    name = str(profile.get("name") or "").strip()
    if not name:
        return ""
    return " ".join(word.capitalize() if word.isupper() else word for word in name.split())


def _append_skill(skills: list[str], value: str) -> None:
    candidate = _clean_phrase(value, max_words=4)
    normalized = re.sub(r"[^a-z0-9+#.]", "", candidate.lower())
    if (
        not candidate
        or len(candidate) > 36
        or normalized in SKILL_STOP_WORDS
        or "@" in candidate
        or normalized.isdigit()
        or any(existing.lower() == candidate.lower() for existing in skills)
    ):
        return
    skills.append(candidate)


def _extract_top_skills(resume_text: str, profile: dict[str, Any]) -> list[str]:
    skills: list[str] = []
    labelled_match = re.search(
        r"(?im)^\s*(?:technical\s+|core\s+)?skills?\s*[:\-]?\s*(.+)$",
        resume_text,
    )
    if labelled_match:
        labelled_skills = re.split(
            r"(?i)\b(?:experience|education|projects?|certifications?|summary)\b\s*[:\-]?",
            labelled_match.group(1),
            maxsplit=1,
        )[0]
        for value in re.split(r"[,;|\u2022]", labelled_skills):
            _append_skill(skills, value)

    for display_name, pattern in KNOWN_SKILLS:
        if re.search(pattern, resume_text, flags=re.IGNORECASE):
            _append_skill(skills, display_name)

    for value in profile.get("skills", []):
        for skill in re.split(r"[,;|\u2022]", str(value)):
            _append_skill(skills, skill)

    return skills[:3]


def _extract_role_title(job_description: str) -> str:
    labelled_match = re.search(
        r"(?im)^\s*(?:job\s+title|position|role|title)\s*[:\-]\s*([^\n.]{3,100})",
        job_description,
    )
    if labelled_match:
        return _clean_phrase(labelled_match.group(1)) or "the advertised role"

    for line in job_description.splitlines():
        candidate = _clean_phrase(line)
        if 2 <= len(candidate.split()) <= 8 and not re.search(r"[.!?]", candidate):
            return candidate

    role_match = re.search(
        r"(?i)\b(?:seeking|looking\s+for|hiring)\s+(?:an?\s+)?([A-Za-z][A-Za-z0-9+/#&. -]{2,80})(?:[.,;\n]|$)",
        job_description,
    )
    if role_match:
        candidate = re.sub(r"\s+to\s+.*$", "", role_match.group(1), flags=re.IGNORECASE)
        return _clean_phrase(candidate) or "the advertised role"

    return "the advertised role"


def _format_skill_phrase(skills: Sequence[str]) -> str:
    if not skills:
        return "a practical, results-oriented technical background"
    if len(skills) == 1:
        return skills[0]
    if len(skills) == 2:
        return f"{skills[0]} and {skills[1]}"
    return f"{skills[0]}, {skills[1]}, and {skills[2]}"


def _build_fallback_cover_letter(
    resume_text: str,
    job_description: str,
    profile: Optional[dict[str, Any]] = None,
) -> str:
    resume_profile = profile or _build_resume_profile(resume_text)
    candidate_name = _display_name(resume_profile)
    skills = _extract_top_skills(resume_text, resume_profile)
    role_title = _extract_role_title(job_description)
    skill_phrase = _format_skill_phrase(skills)

    signature = f"\n\nSincerely,\n{candidate_name}" if candidate_name else "\n\nSincerely,"
    return (
        "Dear Hiring Manager,\n\n"
        f"I am writing to express interest in {role_title}. "
        f"With hands-on experience in {skill_phrase}, I bring a thoughtful approach to solving problems, collaborating with teams, and delivering dependable work.\n\n"
        "I am motivated by the opportunity to apply my skills in a role where I can contribute quickly, learn from a strong team, and support meaningful outcomes. "
        "I would welcome the chance to discuss how my background can help your organization meet its goals.\n"
        f"{signature}\n"
    )


def _build_cover_letter_prompt(
    resume_text: str,
    job_description: str,
    candidate_name: str,
) -> tuple[str, str]:
    system_message = (
        "You are a professional career writer. Write a concise, natural cover letter in three short paragraphs. "
        "Synthesize the candidate's relevant experience instead of copying the resume or job description. "
        "Do not include a contact block, do not invent achievements, and never use placeholders such as 'Your Name'."
    )
    signoff_instruction = (
        f"Close with 'Sincerely,' followed by '{candidate_name}'."
        if candidate_name
        else "Close with 'Sincerely,' and do not use a name placeholder."
    )
    user_message = (
        "Write a tailored cover letter for the role below. Use only supported details from the resume. "
        f"{signoff_instruction}\n\n"
        f"Resume:\n---\n{resume_text}\n---\n\n"
        f"Job description:\n---\n{job_description}\n---"
    )
    return system_message, user_message


def _generate_with_nvidia(
    resume_text: str,
    job_description: str,
    candidate_name: str,
) -> Optional[str]:
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        return None

    model = os.getenv("NVIDIA_MODEL", DEFAULT_NVIDIA_MODEL)
    base_url = os.getenv("NVIDIA_BASE_URL", DEFAULT_NVIDIA_BASE_URL)
    system_message, user_message = _build_cover_letter_prompt(resume_text, job_description, candidate_name)

    try:
        from openai import OpenAI
    except Exception:
        logger.exception("NVIDIA cover-letter generation is unavailable because the openai SDK could not be imported.")
        return None

    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=45.0, max_retries=1)
        request_options: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            "temperature": float(os.getenv("NVIDIA_TEMPERATURE", "0.4")),
            "top_p": float(os.getenv("NVIDIA_TOP_P", "0.9")),
            "max_tokens": int(os.getenv("NVIDIA_MAX_TOKENS", "700")),
            "stream": False,
        }
        if os.getenv("NVIDIA_DISABLE_THINKING", "").lower() in {"1", "true", "yes"}:
            request_options["extra_body"] = {"chat_template_kwargs": {"thinking": False}}

        response = client.chat.completions.create(**request_options)
        content = ""
        if getattr(response, "choices", None):
            content = getattr(response.choices[0].message, "content", "") or ""
        if content.strip():
            return content.strip()

        logger.warning("NVIDIA cover-letter generation returned no text (model=%s, base_url=%s).", model, base_url)
    except Exception:
        logger.exception("NVIDIA cover-letter generation failed (model=%s, base_url=%s).", model, base_url)
    return None


def _generate_with_anthropic(
    resume_text: str,
    job_description: str,
    candidate_name: str,
) -> Optional[str]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    system_message, user_message = _build_cover_letter_prompt(resume_text, job_description, candidate_name)
    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
            max_tokens=700,
            temperature=0.4,
            system=system_message,
            messages=[{"role": "user", "content": user_message}],
        )
        content = "".join(block.text for block in response.content if getattr(block, "text", None)).strip()
        if content:
            return content

        logger.warning("Anthropic cover-letter generation returned no text.")
    except Exception:
        logger.exception("Anthropic cover-letter generation failed.")
    return None


@router.post("/cover-letter")
def generate_cover_letter(payload: CoverLetterRequest):
    resume_text = payload.resume_text.strip()
    job_description = payload.job_description.strip()

    if not resume_text or not job_description:
        return {"cover_letter": "Please provide both a resume and a job description."}

    profile = _build_resume_profile(resume_text)
    candidate_name = _display_name(profile)

    nvidia_content = _generate_with_nvidia(resume_text, job_description, candidate_name)
    if nvidia_content:
        return {"cover_letter": nvidia_content, "generation_source": "nvidia"}

    anthropic_content = _generate_with_anthropic(resume_text, job_description, candidate_name)
    if anthropic_content:
        return {"cover_letter": anthropic_content, "generation_source": "anthropic"}

    if not os.getenv("NVIDIA_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        logger.warning("Using local cover-letter fallback because no NVIDIA_API_KEY or ANTHROPIC_API_KEY is configured.")
    else:
        logger.warning("Using local cover-letter fallback after configured AI providers did not return a response.")

    return {
        "cover_letter": _build_fallback_cover_letter(resume_text, job_description, profile),
        "generation_source": "fallback",
    }
