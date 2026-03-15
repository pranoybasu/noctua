import os
import logging
from config import get_settings

logger = logging.getLogger(__name__)


async def send_security_alert(
    repo: str,
    pr_number: int,
    pr_title: str,
    author: str,
    issues: list[dict],
    pr_url: str = "",
) -> None:
    """Send an email alert when critical security issues are found."""
    settings = get_settings()
    if not settings.resend_api_key:
        logger.info("Resend API key not set — skipping email alert")
        return

    try:
        import resend
        resend.api_key = settings.resend_api_key

        critical = [i for i in issues if i.get("severity") == "critical"]
        if not critical:
            return

        issue_lines = "\n".join(
            f"  • [{i['rule']}] line {i['line']}: {i.get('snippet', '')[:80]}"
            for i in critical
        )

        html_issues = "".join(
            f'<li><strong>{i["rule"]}</strong> (line {i["line"]}): '
            f'<code>{i.get("snippet", "")[:80]}</code></li>'
            for i in critical
        )

        link = pr_url or f"https://github.com/{repo}/pull/{pr_number}"

        resend.Emails.send({
            "from": "Noctua <noctua@resend.dev>",
            "to": [os.environ.get("ALERT_EMAIL_TO", "noctua-alerts@example.com")],
            "subject": f"🚨 Noctua: {len(critical)} critical issue(s) in {repo}#{pr_number}",
            "html": f"""
                <h2>🦉 Noctua Security Alert</h2>
                <p><strong>{repo}</strong> — PR #{pr_number}: {pr_title}</p>
                <p>Author: {author}</p>
                <h3>Critical Issues Found:</h3>
                <ul>{html_issues}</ul>
                <p><a href="{link}">View PR on GitHub →</a></p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Sent by Noctua AI PR Intelligence
                </p>
            """,
        })

        logger.info(f"Security alert sent for {repo}#{pr_number}")

    except Exception as e:
        logger.error(f"Failed to send security alert: {e}")
