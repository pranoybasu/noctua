import asyncio
import time
import logging
from models import AnalyzeRequest, AnalysisResult
from services.ai import ai_review
from services.scanner import scan_code
from services.dna import build_code_dna
from services.diff import fetch_diff, extract_added_lines, parse_diff_files, compute_diff_segments
from services.github_client import format_review_comment, post_pr_comment
from services.supabase_client import (
    update_pr_status,
    update_pr_results,
    upsert_team_stats,
    create_analysis_job,
    complete_analysis_job,
)
from services.email import send_security_alert

logger = logging.getLogger(__name__)


async def run_pipeline(job: AnalyzeRequest) -> AnalysisResult:
    """
    Full analysis pipeline:
    1. Fetch diff from GitHub
    2. Run AI review, security scan, and Code DNA in parallel
    3. Write results to Supabase
    4. Post GitHub comment
    5. Send email alert if critical issues found
    """
    start = time.time()
    job_id = ""

    try:
        await update_pr_status(job.pr_id, "analyzing")
        job_id = await create_analysis_job(job.pr_id)

        raw_diff = await fetch_diff(job.diff_url, job.token)
        added_code = extract_added_lines(raw_diff)
        diff_files = parse_diff_files(raw_diff)

        ai_task = asyncio.create_task(
            ai_review(raw_diff, job.title, job.author, job.persona)
        )
        scan_task = asyncio.create_task(
            asyncio.to_thread(scan_code, added_code)
        )
        dna_task = asyncio.create_task(
            asyncio.to_thread(build_code_dna, added_code, job.author)
        )

        ai_result, security_issues, code_dna = await asyncio.gather(
            ai_task, scan_task, dna_task,
            return_exceptions=True,
        )

        if isinstance(ai_result, Exception):
            logger.error(f"AI review failed: {ai_result}")
            ai_result = {
                "summary": "AI review failed — scanner results only.",
                "quality_score": 70,
                "suggestions": [],
            }

        if isinstance(security_issues, Exception):
            logger.error(f"Scanner failed: {security_issues}")
            security_issues = []

        if isinstance(code_dna, Exception):
            logger.error(f"DNA analysis failed: {code_dna}")
            from models import CodeDNA
            code_dna = CodeDNA()

        issues_dicts = [iss.model_dump() for iss in security_issues]
        dna_dict = code_dna.model_dump()
        diff_segments = compute_diff_segments(diff_files, issues_dicts)
        segments_dicts = [seg.model_dump() for seg in diff_segments]

        critical_issues = [i for i in issues_dicts if i["severity"] == "critical"]
        preflight_passed = len(critical_issues) == 0

        comment_body = format_review_comment(
            {**ai_result, "author": job.author},
            issues_dicts,
            job.persona.value,
            dna_dict,
        )
        comment_id = await post_pr_comment(
            job.repo, job.pr_number, comment_body, job.token
        )

        duration_ms = int((time.time() - start) * 1000)

        await update_pr_results(
            pr_id=job.pr_id,
            quality_score=ai_result["quality_score"],
            ai_summary=ai_result["summary"],
            suggestions=ai_result.get("suggestions", []),
            security_issues=issues_dicts,
            preflight_passed=preflight_passed,
            code_dna=dna_dict,
            diff_segments=segments_dicts,
            persona_used=job.persona.value,
            github_comment_id=comment_id,
        )

        await upsert_team_stats(
            repo_id=job.repo_id,
            author=job.author,
            quality_score=ai_result["quality_score"],
            sec_issues=len(security_issues),
            preflight_ok=preflight_passed,
            dna=dna_dict,
        )

        if critical_issues:
            await send_security_alert(
                repo=job.repo,
                pr_number=job.pr_number,
                pr_title=job.title,
                author=job.author,
                issues=issues_dicts,
                pr_url=job.github_pr_url or "",
            )

        if job_id:
            await complete_analysis_job(job_id, "done", duration_ms=duration_ms)

        return AnalysisResult(
            status="ok",
            quality_score=ai_result["quality_score"],
            ai_summary=ai_result["summary"],
            suggestions=ai_result.get("suggestions", []),
            security_issues=security_issues if not isinstance(security_issues, Exception) else [],
            preflight_passed=preflight_passed,
            code_dna=code_dna if not isinstance(code_dna, Exception) else CodeDNA(),
            diff_segments=diff_segments,
            duration_ms=duration_ms,
        )

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        logger.error(f"Pipeline failed for PR {job.pr_id}: {e}")

        await update_pr_status(job.pr_id, "failed")
        if job_id:
            await complete_analysis_job(job_id, "failed", str(e), duration_ms)

        return AnalysisResult(
            status="error",
            ai_summary=f"Analysis failed: {str(e)[:200]}",
            duration_ms=duration_ms,
        )
