"""Hero media — per-page configurable hero background (image/video) with
overlay opacity, focal point, and a global default fallback.

Used by Theme A / B / future themes uniformly via the `useHeroMedia` hook.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.config import db
from app.models_hero import HeroMediaIn, ALLOWED_PAGE_KEYS
from app.security import require_admin, utc_iso, uid


admin_router = APIRouter(prefix="/admin", tags=["admin"])
public_router = APIRouter(prefix="/public", tags=["public"])


def _validate_page_key(page_key: str) -> str:
    if page_key not in ALLOWED_PAGE_KEYS:
        raise HTTPException(status_code=404, detail=f"Unknown hero page_key. Allowed: {sorted(ALLOWED_PAGE_KEYS)}")
    return page_key


@public_router.get("/hero-media")
async def public_hero_media():
    """Returns all hero media records (enabled or not is up to the consumer
    — components fall through to `_default` when a per-page record is disabled
    or missing)."""
    docs = await db.hero_media.find({}, {"_id": 0}).to_list(50)
    by_page = {d["page_key"]: d for d in docs}
    default = by_page.get("_default")
    return {"items": docs, "by_page": by_page, "default": default}


@admin_router.get("/hero-media")
async def admin_hero_media_list(_admin=Depends(require_admin)):
    docs = await db.hero_media.find({}, {"_id": 0}).to_list(50)
    return {"items": docs}


@admin_router.patch("/hero-media/{page_key}")
async def admin_hero_media_patch(
    page_key: str,
    body: HeroMediaIn,
    _admin=Depends(require_admin),
):
    _validate_page_key(page_key)
    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    patch["page_key"] = page_key
    patch["updated_at"] = utc_iso()
    patch["_seed_origin"] = "admin"

    existing = await db.hero_media.find_one({"page_key": page_key}, {"_id": 0})
    if existing:
        await db.hero_media.update_one({"page_key": page_key}, {"$set": patch})
    else:
        patch.setdefault("id", uid())
        patch.setdefault("enabled", True)
        patch.setdefault("media_type", "image")
        patch.setdefault("overlay_opacity", 0.5)
        patch.setdefault("focal_x", 50)
        patch.setdefault("focal_y", 50)
        await db.hero_media.insert_one(patch)
    doc = await db.hero_media.find_one({"page_key": page_key}, {"_id": 0})
    return doc


@admin_router.delete("/hero-media/{page_key}")
async def admin_hero_media_reset(page_key: str, _admin=Depends(require_admin)):
    """Clears the per-page record. The page will fall back to `_default`."""
    _validate_page_key(page_key)
    if page_key == "_default":
        raise HTTPException(status_code=400, detail="Cannot delete the global default; PATCH it instead.")
    await db.hero_media.delete_one({"page_key": page_key})
    return {"ok": True}
