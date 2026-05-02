"""Image asset slot management for the public site (Theme B and beyond)."""
from typing import Optional
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException
from app.config import db
from app.security import require_permission, utc_iso

router = APIRouter(prefix="/admin/image-assets", tags=["admin", "images"])


class ImageAssetIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    url: Optional[str] = None
    alt_ar: Optional[str] = None
    alt_en: Optional[str] = None
    active: Optional[bool] = None
    focal_x: Optional[float] = None  # 0..1
    focal_y: Optional[float] = None  # 0..1


@router.get("")
async def admin_list_image_assets(user: dict = Depends(require_permission("settings.read"))):
    items = await db.image_assets.find({}, {"_id": 0}).sort("sort_order", 1).to_list(length=200)
    return {"items": items}


@router.patch("/{slot_key}")
async def admin_update_image_asset(slot_key: str, body: ImageAssetIn,
                                   user: dict = Depends(require_permission("settings.edit"))):
    existing = await db.image_assets.find_one({"slot_key": slot_key})
    if not existing:
        raise HTTPException(status_code=404, detail="Image slot not found")
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    update["updated_by"] = user.get("email", "")
    await db.image_assets.update_one({"slot_key": slot_key}, {"$set": update})
    doc = await db.image_assets.find_one({"slot_key": slot_key}, {"_id": 0})
    return doc
