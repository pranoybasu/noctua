import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import analyze, preflight, health

START_TIME = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    global START_TIME
    START_TIME = time.time()
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Noctua Engine",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analyze.router)
    app.include_router(preflight.router)
    app.include_router(health.router)

    return app


app = create_app()
