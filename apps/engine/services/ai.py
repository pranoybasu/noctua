import json
import asyncio
import logging
from groq import AsyncGroq
from config import get_settings
from models import ReviewPersona, Suggestion

logger = logging.getLogger(__name__)

PERSONAS = {
    ReviewPersona.strict: {
        "system": (
            "You are a meticulous senior engineer performing a code review. "
            "Call out EVERY issue you find: logic bugs, missing edge cases, "
            "naming inconsistencies, unnecessary complexity. Be direct and cite "
            "specific line numbers. No encouragement. If the code is poor quality, "
            "say so bluntly. Score harshly."
        ),
        "score_weight": 0.6,
    },
    ReviewPersona.mentor: {
        "system": (
            "You are a kind and experienced senior engineer mentoring a junior developer. "
            "For every issue, explain WHY it matters using analogies and simple language. "
            "Suggest concrete alternatives with code examples. Be warm and patient. "
            "Always end with one genuine compliment about something the author did well."
        ),
        "score_weight": 1.1,
    },
    ReviewPersona.fast: {
        "system": (
            "You are a fast-moving startup CTO reviewing code. Focus ONLY on blocking "
            "issues: security vulnerabilities, broken logic, data loss risks. Skip style "
            "nits and minor refactoring suggestions. Keep your review under 5 bullet points. "
            "Optimize for shipping speed."
        ),
        "score_weight": 0.9,
    },
    ReviewPersona.balanced: {
        "system": (
            "You are an experienced and pragmatic code reviewer. Balance thoroughness "
            "with practicality. Flag important issues but don't nitpick formatting. "
            "Acknowledge good patterns. Provide actionable suggestions."
        ),
        "score_weight": 1.0,
    },
}

REVIEW_USER_PROMPT = """Review this pull request and respond with valid JSON only.

PR Title: {title}
Author: {author}

Diff (unified format):
```
{diff}
```

Respond with this exact JSON schema:
{{
  "summary": "2-3 sentence summary of the PR changes and quality",
  "quality_score": <integer 0-100>,
  "suggestions": [
    {{"line": <int or 0>, "message": "<actionable suggestion>", "severity": "warning"|"info"}}
  ]
}}

Be specific about line numbers when possible. Limit suggestions to the top 8 most important."""

MAX_RETRIES = 3
RETRY_DELAY = 2.0


async def ai_review(
    diff: str,
    title: str,
    author: str,
    persona: ReviewPersona = ReviewPersona.balanced,
) -> dict:
    """Call Groq LLaMA-3 with persona-specific system prompt. Returns parsed result."""
    settings = get_settings()
    cfg = PERSONAS.get(persona, PERSONAS[ReviewPersona.balanced])

    truncated_diff = _smart_truncate(diff, max_chars=7500)

    user_prompt = REVIEW_USER_PROMPT.format(
        title=title, author=author, diff=truncated_diff
    )

    client = AsyncGroq(api_key=settings.groq_api_key)

    for attempt in range(MAX_RETRIES):
        try:
            resp = await client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": cfg["system"]},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500,
            )

            raw = resp.choices[0].message.content or "{}"
            result = json.loads(raw)

            raw_score = int(result.get("quality_score", 70))
            weighted = int(raw_score * cfg["score_weight"])
            result["quality_score"] = max(0, min(100, weighted))

            result.setdefault("summary", "Analysis complete.")
            result.setdefault("suggestions", [])

            suggestions = []
            for s in result["suggestions"]:
                suggestions.append(
                    Suggestion(
                        line=int(s.get("line", 0)),
                        message=str(s.get("message", "")),
                        severity=s.get("severity", "warning"),
                    ).model_dump()
                )
            result["suggestions"] = suggestions

            return result

        except json.JSONDecodeError:
            logger.warning(f"AI returned invalid JSON (attempt {attempt + 1})")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (attempt + 1))
        except Exception as e:
            logger.error(f"Groq API error (attempt {attempt + 1}): {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (attempt + 1))

    return {
        "summary": "AI review unavailable — analysis completed with scanner only.",
        "quality_score": 70,
        "suggestions": [],
    }


def _smart_truncate(diff: str, max_chars: int = 7500) -> str:
    """Truncate diff at hunk boundaries to avoid cutting mid-line."""
    if len(diff) <= max_chars:
        return diff

    hunks = diff.split("\ndiff --git ")
    result = hunks[0]

    for hunk in hunks[1:]:
        candidate = result + "\ndiff --git " + hunk
        if len(candidate) > max_chars:
            break
        result = candidate

    if len(result) > max_chars:
        result = result[:max_chars].rsplit("\n", 1)[0]

    return result
