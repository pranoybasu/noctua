from supabase import create_client, Client
from config import get_settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _client


async def update_pr_status(pr_id: str, status: str, **fields) -> None:
    data = {"status": status, **fields}
    get_supabase().table("pull_requests").update(data).eq("id", pr_id).execute()


async def update_pr_results(
    pr_id: str,
    quality_score: int,
    ai_summary: str,
    suggestions: list,
    security_issues: list,
    preflight_passed: bool,
    code_dna: dict,
    diff_segments: list,
    persona_used: str,
    github_comment_id: int | None = None,
) -> None:
    import datetime

    data = {
        "status": "done",
        "quality_score": quality_score,
        "ai_summary": ai_summary,
        "suggestions": suggestions,
        "security_issues": security_issues,
        "preflight_passed": preflight_passed,
        "code_dna": code_dna,
        "diff_segments": diff_segments,
        "persona_used": persona_used,
        "analyzed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    if github_comment_id:
        data["github_comment_id"] = github_comment_id

    get_supabase().table("pull_requests").update(data).eq("id", pr_id).execute()


async def upsert_team_stats(
    repo_id: str,
    author: str,
    quality_score: int,
    sec_issues: int,
    preflight_ok: bool,
    dna: dict,
) -> None:
    get_supabase().rpc(
        "upsert_team_stats",
        {
            "p_repo_id": repo_id,
            "p_author": author,
            "p_quality_score": quality_score,
            "p_sec_issues": sec_issues,
            "p_preflight_ok": preflight_ok,
            "p_dna": dna,
        },
    ).execute()


async def create_analysis_job(pr_id: str) -> str:
    result = (
        get_supabase()
        .table("analysis_jobs")
        .insert({"pr_id": pr_id, "status": "running"})
        .execute()
    )
    return result.data[0]["id"] if result.data else ""


async def complete_analysis_job(
    job_id: str, status: str = "done", error_msg: str | None = None, duration_ms: int = 0
) -> None:
    import datetime

    data: dict = {
        "status": status,
        "completed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "duration_ms": duration_ms,
    }
    if error_msg:
        data["error_msg"] = error_msg

    get_supabase().table("analysis_jobs").update(data).eq("id", job_id).execute()
