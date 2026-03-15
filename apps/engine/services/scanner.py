import re
from models import SecurityIssue, IssueSeverity

PATTERNS: dict[IssueSeverity, list[tuple[str, str]]] = {
    IssueSeverity.critical: [
        (
            r'(?i)(api[_-]?key|secret[_-]?key|password|auth[_-]?token|private[_-]?key)\s*[=:]\s*["\'][A-Za-z0-9_\-/.+=]{8,}',
            "hardcoded-secret",
        ),
        (r'\beval\s*\(', "eval-usage"),
        (r'\bexec\s*\(', "exec-usage"),
        (
            r'(?i)(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|gsk_[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16})',
            "leaked-api-key",
        ),
    ],
    IssueSeverity.high: [
        (r'\.execute\s*\(.*(%s|%d|\bformat\b|\bf")', "sql-injection"),
        (r'\.raw\s*\(.*\+', "raw-sql-concatenation"),
        (r'subprocess\.(call|run|Popen)\s*\(.*shell\s*=\s*True', "shell-injection"),
        (r'pickle\.loads?\s*\(', "insecure-deserialization"),
        (r'(?i)innerHTML\s*=', "xss-innerhtml"),
        (r'dangerouslySetInnerHTML', "xss-react-dangeroushtml"),
    ],
    IssueSeverity.medium: [
        (r'(?i)print\s*\(.*(?:password|secret|token|key)', "debug-leak"),
        (r'(?i)console\.log\s*\(.*(?:password|secret|token|key)', "debug-leak-js"),
        (r'(?i)#\s*TODO.*(?:security|auth|hack|fix)', "security-todo"),
        (r'(?i)verify\s*=\s*False', "ssl-verify-disabled"),
        (r'(?i)CORS.*\*', "cors-wildcard"),
    ],
}


def scan_code(code: str) -> list[SecurityIssue]:
    """Scan added lines for security issues using regex pattern matching."""
    issues: list[SecurityIssue] = []
    lines = code.splitlines()

    for line_num, line_content in enumerate(lines, start=1):
        stripped = line_content.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("//"):
            continue

        for severity, patterns in PATTERNS.items():
            for pattern, rule in patterns:
                if re.search(pattern, line_content):
                    snippet = line_content.strip()[:120]
                    issues.append(
                        SecurityIssue(
                            severity=severity,
                            rule=rule,
                            line=line_num,
                            snippet=snippet,
                        )
                    )
                    break

    seen = set()
    unique: list[SecurityIssue] = []
    for iss in issues:
        key = (iss.rule, iss.line)
        if key not in seen:
            seen.add(key)
            unique.append(iss)

    return unique
