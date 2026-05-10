"""Hero media schema (Pydantic). Kept in a separate module to avoid bloating
`models.py` and to make the allowed page keys easy to import elsewhere."""
import re
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


# Built-in page keys (always available in the admin UI). Admins can add
# additional custom keys at runtime via the "Add page" action — the validator
# accepts any slug-style key (lowercase letters, digits, dashes, underscores).
BUILTIN_PAGE_KEYS = {
    "_default",
    "home",
    "publications",
    "about",
    "contact",
}

# Back-compat alias (used by older imports / tests).
ALLOWED_PAGE_KEYS = BUILTIN_PAGE_KEYS

# Acceptable custom page key pattern. Underscore allowed for the special
# "_default" sentinel; otherwise lowercase ascii + digits + hyphens, 2..40
# characters. Disallows leading digits/dashes for cleanliness.
_KEY_RE = re.compile(r"^(?:_default|[a-z][a-z0-9_-]{1,39})$")


def is_valid_page_key(key: str) -> bool:
    return bool(_KEY_RE.match(key or ""))


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
    label_ar: Optional[str] = None  # human-readable name shown in admin UI
    label_en: Optional[str] = None
