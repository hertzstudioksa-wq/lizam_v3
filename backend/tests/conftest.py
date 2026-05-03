"""Pytest conftest — clears Mongo-backed rate-limit buckets before each session.

The Phase 4 Mongo rate limiter persists across test runs, so without this reset
a full test suite (which performs many admin logins) trips the 5-attempt window.
"""
import os
import pytest
from pymongo import MongoClient


@pytest.fixture(autouse=True, scope="session")
def _reset_rate_limits():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "lizam_db")
    c = MongoClient(mongo_url)
    try:
        c[db_name].rate_limit_buckets.delete_many({})
    except Exception:
        pass
    yield
    try:
        c[db_name].rate_limit_buckets.delete_many({})
    except Exception:
        pass


@pytest.fixture(autouse=True)
def _clear_bucket_between_tests():
    """Also clear between individual tests — ensures no cross-test lockouts."""
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "lizam_db")
    c = MongoClient(mongo_url)
    try:
        c[db_name].rate_limit_buckets.delete_many({})
    except Exception:
        pass
    yield
