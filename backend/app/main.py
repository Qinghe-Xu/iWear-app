"""iWear 后端入口：建表、注册路由、静态资源与健康检查。"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db as db_module
from .config import settings

DB_PATH = settings.data_dir / "iwear.db"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_module.set_db_path(str(DB_PATH))
    await db_module.init_db(str(DB_PATH))
    yield


def create_app() -> FastAPI:
    from . import auth, files, user

    app = FastAPI(title="iWear API", version="1.0.0", lifespan=lifespan)
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    app.include_router(auth.router)
    app.include_router(user.router)
    app.include_router(files.router)

    @app.get("/api/health")
    async def health():
        return {
            "ok": True,
            "image_configured": settings.image.available,
            "vision_configured": settings.vision.available,
            "stylist_configured": settings.stylist.available,
        }

    return app


app = create_app()
