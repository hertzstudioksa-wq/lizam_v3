"""Resend email adapter. DISABLED by default.

Setup:
    1. Get an API key from https://resend.com/api-keys (free tier available).
    2. Add to backend/.env:
           RESEND_API_KEY=re_xxxxxxxxxxxx
           RESEND_FROM="LIZAM <noreply@your-verified-domain.sa>"
    3. Verify your sending domain in the Resend dashboard.
    4. Set feature_toggles.email_notifications = True via /admin/toggles.
    5. Restart backend.

Until RESEND_API_KEY is set, all send calls are no-ops (logged + stored in dashboard only).
"""
from __future__ import annotations
import os
import logging
import httpx

log = logging.getLogger("lizam.email")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "")
RESEND_ENDPOINT = "https://api.resend.com/emails"


def is_configured() -> bool:
    return bool(RESEND_API_KEY and RESEND_FROM)


async def send_email(to: str, subject: str, html: str, *, tags: dict | None = None) -> dict:
    """Returns {ok, skipped?, error?, id?}. Never raises — email failures never break flows."""
    if not is_configured():
        log.info("[email skipped — Resend not configured] to=%s subject=%s", to, subject)
        return {"ok": True, "skipped": True, "reason": "resend_not_configured"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": RESEND_FROM,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                    **({"tags": [{"name": k, "value": v} for k, v in (tags or {}).items()]} if tags else {}),
                },
            )
            if r.status_code >= 400:
                log.warning("Resend error %s: %s", r.status_code, r.text)
                return {"ok": False, "error": r.text, "status": r.status_code}
            return {"ok": True, "id": r.json().get("id")}
    except Exception as e:  # noqa: BLE001
        log.exception("Resend send failed")
        return {"ok": False, "error": str(e)}
