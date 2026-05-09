"""Hero media schema (Pydantic). Kept in a separate module to avoid bloating
`models.py` and to make the allowed page keys easy to import elsewhere."""
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


# Page keys the CMS can assign hero media to. `_default` is the global fallback
# used by any page that does not have its own record (or whose record is
# disabled / has no URL).
ALLOWED_PAGE_KEYS = {
    "_default",
    "home",
    "publications",
    "about",
    "contact",
}


class HeroMediaIn(BaseModel):
    """Patch payload for `PATCH /admin/hero-media/{page_key}`. All optional —
    only fields that are present are merged into the existing record."""
    model_config = ConfigDict(extra="ignore")
    media_type: Optional[Literal["image", "video"]] = None
    url: Optional[str] = None  # /api/uploads/images/... or external https://
    poster_url: Optional[str] = None  # video poster fallback
    overlay_opacity: Optional[float] = Field(default=None, ge=0.0, le=0.9)
    focal_x: Optional[int] = Field(default=None, ge=0, le=100)  # percent
    focal_y: Optional[int] = Field(default=None, ge=0, le=100)  # percent
    enabled: Optional[bool] = None
    alt_ar: Optional[str] = None
    alt_en: Optional[str] = None
