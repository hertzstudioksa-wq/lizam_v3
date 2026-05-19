"""
Diagnose & fix about_content in MongoDB.
Run from the backend/ directory:
    MONGODB_URL="mongodb+srv://..." DB_NAME="lizam" python fix_about.py

What it does:
  - Checks if about_content document exists
  - If exists: clears extra_sections to []
  - If missing: prints instructions (restart backend to re-seed)
"""
import asyncio, os, sys
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME   = os.environ.get("DB_NAME", "lizam")


async def main():
    print(f"Connecting to {MONGO_URL[:40]}... DB={DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Count documents to diagnose
    count = await db.about_content.count_documents({})
    print(f"about_content documents found: {count}")

    if count == 0:
        print("\nERROR: about_content collection is EMPTY.")
        print("Fix: restart the backend — the seed runs on startup and will recreate the document.")
        print("     sudo systemctl restart lizam-backend  (or your equivalent)")
        client.close()
        sys.exit(1)

    doc = await db.about_content.find_one({}, {"_id": 0, "id": 1, "extra_sections": 1, "_seed_origin": 1})
    print(f"Document id={doc.get('id')}, _seed_origin={doc.get('_seed_origin')}")
    print(f"Current extra_sections: {doc.get('extra_sections')}")

    result = await db.about_content.update_one(
        {"id": "about"},
        {"$set": {"extra_sections": []}}
    )
    print(f"\nDone. Modified {result.modified_count} document(s). extra_sections is now [].")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
