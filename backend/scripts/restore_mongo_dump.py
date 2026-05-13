"""Restore mongodump BSON files into a local MongoDB database (no mongorestore required).

Usage (from repo root or backend/):
  python scripts/restore_mongo_dump.py "path/to/mongo_dump/lizam_db" [--uri URI] [--db NAME]

Default URI: mongodb://127.0.0.1:27017
Default DB:  lizam_db
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from bson import decode_all
from pymongo import MongoClient


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("dump_dir", type=Path, help="Folder containing *.bson + *.metadata.json (e.g. mongo_dump/lizam_db)")
    ap.add_argument("--uri", default="mongodb://127.0.0.1:27017", help="Mongo connection string")
    ap.add_argument("--db", default="lizam_db", help="Target database name")
    args = ap.parse_args()

    dump_dir: Path = args.dump_dir.resolve()
    if not dump_dir.is_dir():
        print(f"Not a directory: {dump_dir}", file=sys.stderr)
        return 1

    bson_files = sorted(dump_dir.glob("*.bson"))
    if not bson_files:
        print(f"No .bson files in {dump_dir}", file=sys.stderr)
        return 1

    client = MongoClient(args.uri)
    db = client[args.db]

    for bf in bson_files:
        coll_name = bf.stem
        raw = bf.read_bytes()
        docs = decode_all(raw) if raw else []
        db.drop_collection(coll_name)
        if docs:
            db[coll_name].insert_many(docs)
        print(f"{coll_name}: {len(docs)} documents")

    print(f"Done. Database={args.db!r} uri={args.uri!r}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
