import base64
import logging
from fastapi import APIRouter
from models import PreflightRequest, PreflightResult
from services.scanner import scan_code

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/preflight", response_model=PreflightResult)
async def preflight(req: PreflightRequest):
    """
    Called by the GitHub Action on every push.
    Decodes the base64-encoded diff and scans for critical security issues.
    Returns pass/fail — the Action fails if critical issues are found.
    """
    try:
        diff_text = base64.b64decode(req.diff_b64).decode("utf-8", errors="replace")
    except Exception:
        return PreflightResult(
            passed=False,
            critical_count=0,
            message="Failed to decode diff payload",
        )

    added_lines: list[str] = []
    for line in diff_text.splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            added_lines.append(line[1:])

    code = "\n".join(added_lines)
    issues = scan_code(code)

    critical = [i for i in issues if i.severity.value == "critical"]
    high = [i for i in issues if i.severity.value == "high"]
    blocking = critical + high

    passed = len(critical) == 0

    if passed and not blocking:
        message = "All clear — no security issues found"
    elif passed:
        message = f"Passed with {len(high)} high-severity warning(s)"
    else:
        message = f"Blocked: {len(critical)} critical issue(s) found"

    return PreflightResult(
        passed=passed,
        critical_count=len(critical),
        message=message,
        issues=[i for i in blocking],
    )
