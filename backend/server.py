"""LIZAM Center for Legal Research — Phase 3 entrypoint.
Clean modular architecture with lifespan + tightened CORS.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGIN_REGEX, UPLOAD_DIR, client
from app.security import utc_iso
from app.routers import auth as auth_router
from app.routers import public as public_router
from app.routers import admin as admin_router
from app.routers import uploads as uploads_router
from app.routers import image_assets as image_assets_router
from app.routers import responses as responses_router
from app.routers import google_auth as google_auth_router
from app.routers import hero_media as hero_media_router
from app.seed import seed_all

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("lizam")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await seed_all()
    except Exception:
        logger.exception("Seeding failed")
    yield
    client.close()


app = FastAPI(title="LIZAM API", version="0.3.0", lifespan=lifespan)

api = APIRouter(prefix="/api")


@api.get("/healthz")
async def healthz():
    return {"ok": True, "service": "lizam-api", "version": "0.3.0", "ts": utc_iso()}


api.include_router(auth_router.router)
api.include_router(google_auth_router.router)
api.include_router(public_router.router)
api.include_router(responses_router.public_router)
api.include_router(admin_router.router)
api.include_router(responses_router.admin_router)
api.include_router(uploads_router.router)
api.include_router(image_assets_router.router)
api.include_router(hero_media_router.public_router)
api.include_router(hero_media_router.admin_router)
app.include_router(api)

# Static uploads — MUST be served under /api/* because the Kubernetes ingress
# only proxies /api/* to the backend. Anything else hits the frontend dev
# server and returns the React HTML fallback (silently breaking images).
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
