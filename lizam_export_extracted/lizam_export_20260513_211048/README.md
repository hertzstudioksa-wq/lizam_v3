# LIZAM — Full Local Restore Package

This package contains everything required to run LIZAM locally:

```
lizam_export_<timestamp>/
├── mongo_dump/lizam_db/    ← BSON dump of the full database
├── uploads.tar.gz          ← All user-uploaded images + PDFs
└── env/
    ├── backend.env         ← exact backend secrets (MONGO_URL, JWT_SECRET, admin)
    └── frontend.env        ← frontend env template (set REACT_APP_BACKEND_URL)
```

## 1. Prerequisites

| Tool | Min version | Notes |
|---|---|---|
| Python | 3.11+ | matches FastAPI ≥0.110 in `backend/requirements.txt` |
| Node.js | 18+ (LTS) | for React 19 |
| Yarn | 1.22+ | classic, not Berry |
| MongoDB | 6.0+ | with `mongorestore` available |
| MongoDB tools | latest | `mongorestore` ships with `mongodb-database-tools` |

Install MongoDB tools if missing:
```bash
# macOS
brew install mongodb/brew/mongodb-database-tools

# Ubuntu / Debian
sudo apt-get install -y mongodb-database-tools

# Windows
# Download from https://www.mongodb.com/try/download/database-tools
```

## 2. Restore MongoDB

Start your local MongoDB server (defaults to `mongodb://localhost:27017`), then:

```bash
# From inside the extracted export folder:
mongorestore \
  --uri="mongodb://localhost:27017" \
  --db=lizam_db \
  --drop \
  mongo_dump/lizam_db/
```

Flags explained:
- `--drop` clears any existing `lizam_db` before importing (clean restore).
- `--db=lizam_db` matches `DB_NAME` in `backend/.env`.

Verify after restore:
```bash
mongosh "mongodb://localhost:27017/lizam_db" --quiet --eval \
  'db.getCollectionNames().forEach(c => print(c + ": " + db[c].countDocuments({})))'
```

Expected output (your numbers will match these exactly at export time):

| Collection | Docs |
|---|---|
| `users` | 162 |
| `roles` | 5 |
| `publications` | 57 |
| `authors` | 95 |
| `categories` | 58 |
| `research_responses` | 100 |
| `contact_messages` | 48 |
| `newsletter_subscribers` | 2 |
| `home_content` | 1 |
| `about_content` | 1 |
| `site_settings` | 1 |
| `hero_media` | 5 |
| `image_assets` | 5 |
| `audit_log` | 7,585 |
| `rate_limit_buckets` | 0 |

## 3. Restore uploaded files

```bash
# Replace /path/to/lizam/backend with the real path on your machine
tar -xzf uploads.tar.gz -C /path/to/lizam/backend/
```

This recreates:
```
backend/uploads/
├── images/   (19 MB — 80+ PNG/JPG/WEBP user uploads)
└── pdfs/     (88 KB — research publication PDFs)
```

Verify:
```bash
ls /path/to/lizam/backend/uploads/images | wc -l    # → 80+ files
ls /path/to/lizam/backend/uploads/pdfs | wc -l      # → 5+ files
```

## 4. Configure .env files

### `backend/.env`
Copy `env/backend.env` into your project as `backend/.env`. Contents:

```ini
MONGO_URL="mongodb://localhost:27017"
DB_NAME="lizam_db"
CORS_ORIGINS="*"
JWT_SECRET="lizam_a7f3c9e4b2d8615f0e9c3a7b4d6e1f8c2a5b9d4e7f1c3a6b0d8e5f2c9a4b7d1e3f6"
ADMIN_EMAIL="admin@lizam.sa"
ADMIN_PASSWORD="Lizam@2026"
```

**Security**: rotate `JWT_SECRET` and `ADMIN_PASSWORD` immediately for production.

Optional env vars (defaults shown in `backend/app/config.py`):

| Var | Default | Purpose |
|---|---|---|
| `MAX_UPLOAD_MB` | `20` | Upload size cap |
| `ALLOWED_ORIGIN_REGEX` | `^https://(*.preview.emergentagent.com\|*.emergentagent.com\|localhost(:\d+)?)$` | CORS regex (override for production domains) |

### `frontend/.env`
Copy `env/frontend.env` into your project as `frontend/.env`. For local:

```ini
REACT_APP_BACKEND_URL=http://localhost:8001
ENABLE_HEALTH_CHECK=false
```

For deployment, set `REACT_APP_BACKEND_URL` to your live API origin (no trailing slash).

## 5. Install + run

```bash
# --- Backend ---
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# --- Frontend (new terminal) ---
cd frontend
yarn install
yarn start    # opens http://localhost:3000
```

## 6. Smoke test the restore

```bash
# Health-check the public endpoints
curl -s http://localhost:8001/api/public/site-settings | python3 -m json.tool | head -5
curl -s http://localhost:8001/api/public/home-content  | python3 -c "import sys,json; print('home keys:', len(json.load(sys.stdin)))"
curl -s http://localhost:8001/api/public/about-content | python3 -c "import sys,json; print('about keys:', len(json.load(sys.stdin)))"

# Admin login (returns user object on success)
curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lizam.sa","password":"Lizam@2026"}'
```

Then visit:
- **Public site**: http://localhost:3000/
- **About page**: http://localhost:3000/about
- **Admin dashboard**: http://localhost:3000/admin/login

## 7. Admin credentials

| Email | Password | Role |
|---|---|---|
| `admin@lizam.sa` | `Lizam@2026` | super_admin |

Change the password from `/admin/users` after first login.

## 8. Uploaded files served by FastAPI

The backend mounts `backend/uploads/` at `/api/uploads/` (configured in `backend/server.py`). After restoring `uploads/`, all image and PDF URLs stored in MongoDB (`logo_url`, `image_url`, `pdf_file_url`, etc.) will resolve correctly. No URL rewriting needed.

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Public page shows empty content | Frontend can't reach backend | Confirm `REACT_APP_BACKEND_URL` matches the running backend origin |
| `mongorestore` says "command not found" | Tools not installed | See Section 1 |
| Login fails with "Invalid credentials" | Admin user wasn't seeded | Delete `users` collection, restart backend — it auto-seeds from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` |
| Images broken (404) | `uploads/` not extracted to `backend/uploads/` | Re-run the `tar -xzf` command in Section 3 |
| CORS errors in browser | Origin not allowed | Set `CORS_ORIGINS="*"` (already in backend.env) or add your origin to the regex |

---
Generated by `scripts/export_lizam.sh` — keep this package private; it contains active credentials.
