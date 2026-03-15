import time
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    from main import START_TIME
    uptime = int(time.time() - START_TIME) if START_TIME else 0
    return {
        "status": "ok",
        "version": "1.0.0",
        "uptime_seconds": uptime,
    }
