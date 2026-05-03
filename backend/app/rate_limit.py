"""Mongo-backed rate limiter. Multi-worker safe; buckets auto-expire via TTL index.

Usage:
    from app.rate_limit import check_and_record
    await check_and_record(["login:user@x.com", f"login:ip:{ip}"], max_fails=5, window_s=300, lock_s=900)

On first call the module ensures TTL indexes on `rate_limit_buckets`.
"""
from __future__ import annotations
import time
from typing import Iterable
from fastapi import HTTPException, Request
from app.config import db


_indexes_ready = False


async def _ensure_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    # `lock_expires_at` acts as the lock marker; `ttl_at` ensures buckets self-clean.
    await db.rate_limit_buckets.create_index("ttl_at", expireAfterSeconds=0)
    await db.rate_limit_buckets.create_index("key", unique=True)
    _indexes_ready = True


def client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _now_ms() -> int:
    return int(time.time() * 1000)


async def enforce_locked(keys: Iterable[str]) -> None:
    """Raise 429 if any key is currently locked."""
    await _ensure_indexes()
    now_ms = await _now_ms()
    locked = await db.rate_limit_buckets.find_one(
        {"key": {"$in": list(keys)}, "lock_until_ms": {"$gt": now_ms}},
        {"_id": 0, "key": 1, "lock_until_ms": 1},
    )
    if locked:
        seconds = max(1, (locked["lock_until_ms"] - now_ms) // 1000)
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Try again in {seconds // 60 + 1} minutes.",
        )


async def record_fail(keys: Iterable[str], *, max_fails: int, window_s: int, lock_s: int) -> None:
    """Increment fail counters; lock the key when threshold reached inside window."""
    await _ensure_indexes()
    now_ms = await _now_ms()
    window_ms = window_s * 1000
    for k in keys:
        # keep only recent attempts
        doc = await db.rate_limit_buckets.find_one({"key": k}, {"_id": 0})
        fails = [t for t in (doc.get("fails_ms", []) if doc else []) if now_ms - t < window_ms]
        fails.append(now_ms)
        lock_until_ms = 0
        if len(fails) >= max_fails:
            lock_until_ms = now_ms + lock_s * 1000
            fails = []  # reset window after lock
        # TTL horizon = max of (lock_until, last-fail + window) + small buffer
        import datetime as _dt
        horizon_ms = max(lock_until_ms, (fails[-1] if fails else now_ms) + window_ms) + 60_000
        await db.rate_limit_buckets.update_one(
            {"key": k},
            {"$set": {
                "key": k,
                "fails_ms": fails,
                "lock_until_ms": lock_until_ms,
                "ttl_at": _dt.datetime.fromtimestamp(horizon_ms / 1000, tz=_dt.timezone.utc),
            }},
            upsert=True,
        )


async def reset_fail(keys: Iterable[str]) -> None:
    await _ensure_indexes()
    await db.rate_limit_buckets.delete_many({"key": {"$in": list(keys)}})


async def check_and_record_attempt(request: Request, action: str, *,
                                   subject: str | None = None,
                                   max_fails: int = 5,
                                   window_s: int = 300,
                                   lock_s: int = 900) -> list[str]:
    """Pre-flight check that raises 429 if locked. Returns keys to call record_fail/reset_fail with."""
    ip = client_ip(request)
    keys = [f"{action}:ip:{ip}"]
    if subject:
        keys.append(f"{action}:subj:{subject.lower()}")
    await enforce_locked(keys)
    return keys
