"""main.py"""

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.config import settings
from app.core.database import Base, engine
from app.models import Folder, Note


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"message": "Welcome to Knowledge Vault API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
