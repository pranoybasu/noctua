import re
import httpx
import logging
from models import DiffSegment

logger = logging.getLogger(__name__)


async def fetch_diff(diff_url: str, token: str = "") -> str:
    """Fetch the unified diff from GitHub."""
    headers = {"Accept": "application/vnd.github.v3.diff"}
    if token:
        headers["Authorization"] = f"token {token}"

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(diff_url, headers=headers)
        resp.raise_for_status()
        return resp.text


def extract_added_lines(diff: str) -> str:
    """Extract only the added lines (lines starting with '+') from a unified diff."""
    added: list[str] = []
    for line in diff.splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            added.append(line[1:])
    return "\n".join(added)


def parse_diff_files(diff: str) -> list[dict]:
    """Parse a unified diff into per-file change information."""
    files: list[dict] = []
    current_file: dict | None = None

    for line in diff.splitlines():
        if line.startswith("diff --git"):
            if current_file:
                files.append(current_file)
            match = re.search(r"b/(.+)$", line)
            filename = match.group(1) if match else "unknown"
            current_file = {
                "filename": filename,
                "additions": 0,
                "deletions": 0,
                "lines": [],
            }
        elif current_file:
            if line.startswith("+") and not line.startswith("+++"):
                current_file["additions"] += 1
                current_file["lines"].append(line[1:])
            elif line.startswith("-") and not line.startswith("---"):
                current_file["deletions"] += 1

    if current_file:
        files.append(current_file)

    return files


def compute_diff_segments(
    diff_files: list[dict],
    security_issues: list[dict],
) -> list[DiffSegment]:
    """
    Produce proportional segments for the Diff Timeline heatmap.
    Maps file-level changes to safe/warn/critical bands based on
    change volume and security findings.
    """
    if not diff_files:
        return [DiffSegment(pct=100, color="safe")]

    critical_files = set()
    for issue in security_issues:
        if issue.get("severity") == "critical":
            critical_files.add("*")

    total_changes = sum(f["additions"] + f["deletions"] for f in diff_files)
    if total_changes == 0:
        return [DiffSegment(pct=100, color="safe")]

    segments: list[DiffSegment] = []
    has_critical = len(critical_files) > 0

    for f in diff_files:
        changes = f["additions"] + f["deletions"]
        pct = max(1, round((changes / total_changes) * 100))

        complexity = f["additions"] / max(changes, 1)
        if has_critical and (f["additions"] > 20 or "*" in critical_files):
            color = "critical"
        elif complexity > 0.8 and f["additions"] > 10:
            color = "warn"
        else:
            color = "safe"

        segments.append(DiffSegment(pct=pct, color=color))

    total_pct = sum(s.pct for s in segments)
    if total_pct != 100 and segments:
        segments[-1].pct += 100 - total_pct

    merged: list[DiffSegment] = []
    for seg in segments:
        if merged and merged[-1].color == seg.color:
            merged[-1].pct += seg.pct
        else:
            merged.append(seg)

    return merged
