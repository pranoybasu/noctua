import httpx

PERSONA_EMOJI = {
    "strict": "🔍",
    "mentor": "🎓",
    "fast": "⚡",
    "balanced": "🦉",
}


def format_review_comment(
    result: dict,
    issues: list[dict],
    persona: str,
    code_dna: dict,
) -> str:
    emoji = PERSONA_EMOJI.get(persona, "🦉")
    lines: list[str] = []

    lines.append(f"## {emoji} Noctua Review — *{persona}* mode\n")
    lines.append(f"> {result.get('summary', 'Analysis complete.')}\n")
    lines.append(f"**Quality score:** `{result.get('quality_score', '—')}/100`\n")

    if issues:
        critical = [i for i in issues if i.get("severity") == "critical"]
        high = [i for i in issues if i.get("severity") == "high"]
        medium = [i for i in issues if i.get("severity") == "medium"]

        lines.append(f"### 🚨 Security scan — {len(issues)} issue(s)\n")

        for label, group in [("Critical", critical), ("High", high), ("Medium", medium)]:
            for iss in group:
                lines.append(
                    f"- **{label}** `{iss['rule']}` (line {iss['line']}): "
                    f"`{iss.get('snippet', '')[:80]}`"
                )
        lines.append("")

    suggestions = result.get("suggestions", [])
    if suggestions:
        lines.append("### 💡 Suggestions\n")
        for s in suggestions[:8]:
            line_ref = f" (line {s['line']})" if s.get("line") else ""
            lines.append(f"- {s['message']}{line_ref}")
        lines.append("")

    if code_dna:
        lines.append(
            f"### 🧬 Code DNA — `{result.get('author', 'author')}`\n"
            f"| Metric | Value |\n|---|---|\n"
            f"| Avg line length | {code_dna.get('avg_line_length', 0):.1f} |\n"
            f"| Comment ratio | {code_dna.get('comment_ratio', 0):.0%} |\n"
            f"| Nesting depth | {code_dna.get('avg_nesting_depth', 0):.1f} |\n"
            f"| Type hints | {'✓' if code_dna.get('uses_type_hints') else '✗'} |\n"
            f"| Naming score | {code_dna.get('snake_case_score', 0):.0%} |\n"
        )

    lines.append(f"\n---\n*Reviewed by [Noctua]() in {persona} mode*")
    return "\n".join(lines)


async def post_pr_comment(
    repo: str,
    pr_number: int,
    body: str,
    token: str,
) -> int | None:
    """Posts a comment on the PR and returns the comment ID."""
    if not token:
        return None

    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json={"body": body}, headers=headers)
        if resp.status_code in (200, 201):
            return resp.json().get("id")
        return None
