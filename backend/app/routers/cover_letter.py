import os
import re
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str


def _build_fallback_cover_letter(resume_text: str, job_description: str) -> str:
    summary = " ".join(re.findall(r"[A-Za-z0-9#.+-]+", resume_text))[:700]
    role = " ".join(re.findall(r"[A-Za-z0-9#.+-]+", job_description))[:700]
    return f"""Dear Hiring Manager,

I am excited to apply for the opportunity described in the role posting. My background in technology, problem-solving, and delivery aligns well with the needs of this position. Based on the information provided, I believe my experience and skills would allow me to contribute quickly and add measurable value to your team.

My resume highlights strengths in {summary[:200]} and a track record of delivering results in fast-moving, collaborative environments. I am particularly interested in this role because it emphasizes {role[:200]} and I would welcome the chance to bring that same focus and impact to your organization.

I would be delighted to discuss how my experience can support your team and help advance your business goals. Thank you for considering my application.

Sincerely,
Your Name
"""


def _generate_with_nvidia(resume_text: str, job_description: str) -> Optional[str]:
    api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except Exception:
        return None

    try:
        client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        )
        response = client.chat.completions.create(
            model=os.getenv("NVIDIA_MODEL", "deepseek-ai/deepseek-v4-pro"),
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Write a polished and concise cover letter tailored to this role and resume. "
                        f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
                    ),
                }
            ],
            temperature=float(os.getenv("NVIDIA_TEMPERATURE", "1")),
            top_p=float(os.getenv("NVIDIA_TOP_P", "0.95")),
            max_tokens=int(os.getenv("NVIDIA_MAX_TOKENS", "16384")),
            extra_body={"chat_template_kwargs": {"thinking": False}},
            stream=False,
        )
        content = ""
        if getattr(response, "choices", None):
            message = response.choices[0].message
            content = getattr(message, "content", "") or ""
        return content.strip() or None
    except Exception:
        return None


@router.post("/cover-letter")
def generate_cover_letter(payload: CoverLetterRequest):
    resume_text = payload.resume_text.strip()
    job_description = payload.job_description.strip()

    if not resume_text or not job_description:
        return {"cover_letter": "Please provide both a resume and a job description."}

    nvidia_content = _generate_with_nvidia(resume_text, job_description)
    if nvidia_content:
        return {"cover_letter": nvidia_content}

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            from anthropic import Anthropic

            client = Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=600,
                temperature=0.7,
                system="You are a professional career assistant generating concise, tailored cover letters.",
                messages=[
                    {
                        "role": "user",
                        "content": (
                            "Write a polished and concise cover letter tailored to this role and resume. "
                            f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
                        ),
                    }
                ],
            )
            content = "".join(block.text for block in response.content if getattr(block, "text", None))
            if content:
                return {"cover_letter": content}
        except Exception:
            pass

    return {"cover_letter": _build_fallback_cover_letter(resume_text, job_description)}
