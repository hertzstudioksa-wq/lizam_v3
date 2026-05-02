"""Sanitization utilities for user-submitted HTML (TipTap output)."""
import re
import bleach

ALLOWED_TAGS = [
    "p", "br", "strong", "em", "u", "s", "sub", "sup", "blockquote", "pre", "code",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "a", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
    "figure", "figcaption", "img",
    "span", "div",
]
ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height", "loading"],
    "th": ["colspan", "rowspan", "scope"],
    "td": ["colspan", "rowspan"],
    "*": ["dir", "lang", "class", "id", "style"],
}
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]

# Minimal inline style whitelist (text-align and direction only)
_STYLE_SAFE = re.compile(r"^(text-align|direction):\s*(left|right|center|justify|rtl|ltr)\s*;?$", re.I)


def _strip_style(name, value):
    # Only allow whitelisted style declarations
    if name != "style":
        return True
    safe = []
    for decl in value.split(";"):
        if _STYLE_SAFE.match(decl.strip()):
            safe.append(decl.strip())
    return "; ".join(safe) if safe else False


def sanitize_html(html: str | None) -> str:
    if not html:
        return ""
    cleaner = bleach.Cleaner(
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )
    return cleaner.clean(html)


def slugify(s: str) -> str:
    """Lightweight slug — preserves Arabic chars, replaces spaces with dashes."""
    if not s:
        return ""
    s = s.strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^\w\u0600-\u06FF-]", "", s, flags=re.UNICODE)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:200]


def estimate_reading_time(html_ar: str | None, html_en: str | None) -> int:
    """Rough reading time in minutes based on longer of the two contents."""
    text_ar = bleach.clean(html_ar or "", tags=[], strip=True)
    text_en = bleach.clean(html_en or "", tags=[], strip=True)
    words_ar = len(text_ar.split())
    words_en = len(text_en.split())
    # ~ 200 wpm for EN, ~ 140 wpm for AR (slightly slower on average)
    mins = max(words_en // 200, int(words_ar / 140))
    return max(1, mins) if (words_ar + words_en) > 0 else 1
