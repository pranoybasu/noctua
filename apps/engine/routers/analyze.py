import logging
from fastapi import APIRouter, BackgroundTasks
from models import AnalyzeRequest, AnalysisResult
from services.pipeline import run_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Triggered by the Next.js webhook handler.
    Runs the full analysis pipeline as a background task so the
    webhook handler gets an immediate 200 response.
    """
    logger.info(f"Received analysis request for {req.repo}#{req.pr_number}")

    background_tasks.add_task(_run, req)

    return AnalysisResult(
        status="ok",
        ai_summary="Analysis started",
        quality_score=0,
        duration_ms=0,
    )


async def _run(req: AnalyzeRequest) -> None:
    try:
        result = await run_pipeline(req)
        logger.info(
            f"Analysis complete for {req.repo}#{req.pr_number} — "
            f"score={result.quality_score}, duration={result.duration_ms}ms"
        )
    except Exception as e:
        logger.error(f"Background pipeline error: {e}")
