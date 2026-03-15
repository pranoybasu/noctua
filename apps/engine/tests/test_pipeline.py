import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from models import AnalyzeRequest, ReviewPersona
from services.pipeline import run_pipeline


@pytest.mark.asyncio
class TestPipeline:
    async def test_full_pipeline_success(self, sample_diff, mock_groq, mock_supabase):
        request = AnalyzeRequest(
            pr_id="test-pr-id",
            pr_number=42,
            repo="pranoy-basu/noctua-demo",
            repo_id="test-repo-id",
            diff_url="https://github.com/test/test/pull/42.diff",
            title="feat: add helpers",
            author="pranoy-basu",
            token="ghp_testtoken",
            persona=ReviewPersona.balanced,
        )

        with (
            patch("services.pipeline.fetch_diff", AsyncMock(return_value=sample_diff)),
            patch("services.pipeline.ai_review", AsyncMock(return_value={
                "summary": "Clean code.", "quality_score": 85, "suggestions": []
            })),
            patch("services.pipeline.update_pr_status", AsyncMock()),
            patch("services.pipeline.update_pr_results", AsyncMock()),
            patch("services.pipeline.upsert_team_stats", AsyncMock()),
            patch("services.pipeline.create_analysis_job", AsyncMock(return_value="job-1")),
            patch("services.pipeline.complete_analysis_job", AsyncMock()),
            patch("services.pipeline.post_pr_comment", AsyncMock(return_value=12345)),
            patch("services.pipeline.send_security_alert", AsyncMock()),
        ):
            result = await run_pipeline(request)

        assert result.status == "ok"
        assert result.quality_score == 85
        assert result.duration_ms > 0

    async def test_pipeline_handles_ai_failure(self, sample_diff, mock_supabase):
        request = AnalyzeRequest(
            pr_id="test-pr-id",
            pr_number=42,
            repo="pranoy-basu/noctua-demo",
            repo_id="test-repo-id",
            diff_url="https://github.com/test/test/pull/42.diff",
            title="test PR",
            author="test",
            persona=ReviewPersona.balanced,
        )

        with (
            patch("services.pipeline.fetch_diff", AsyncMock(return_value=sample_diff)),
            patch("services.pipeline.ai_review", AsyncMock(side_effect=Exception("Groq down"))),
            patch("services.pipeline.update_pr_status", AsyncMock()),
            patch("services.pipeline.update_pr_results", AsyncMock()),
            patch("services.pipeline.upsert_team_stats", AsyncMock()),
            patch("services.pipeline.create_analysis_job", AsyncMock(return_value="job-1")),
            patch("services.pipeline.complete_analysis_job", AsyncMock()),
            patch("services.pipeline.post_pr_comment", AsyncMock(return_value=None)),
            patch("services.pipeline.send_security_alert", AsyncMock()),
        ):
            result = await run_pipeline(request)

        assert result.status == "ok"
        assert result.quality_score == 70

    async def test_pipeline_diff_fetch_failure(self):
        request = AnalyzeRequest(
            pr_id="test-pr-id",
            pr_number=42,
            repo="test/test",
            repo_id="test-repo-id",
            diff_url="https://bad-url.invalid/fail",
            title="test",
            author="test",
            persona=ReviewPersona.balanced,
        )

        with (
            patch("services.pipeline.fetch_diff", AsyncMock(side_effect=Exception("Network error"))),
            patch("services.pipeline.update_pr_status", AsyncMock()),
            patch("services.pipeline.create_analysis_job", AsyncMock(return_value="job-1")),
            patch("services.pipeline.complete_analysis_job", AsyncMock()),
        ):
            result = await run_pipeline(request)

        assert result.status == "error"
        assert "failed" in result.ai_summary.lower()
