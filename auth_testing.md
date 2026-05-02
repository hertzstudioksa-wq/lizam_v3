# LIZAM — Auth Testing Playbook

Source of truth for authentication testing in Phase 1.

## Seeded accounts

- Super Admin:
  - email: `admin@lizam.sa`
  - password: `Lizam@2026`
  - role: `super_admin`

Seeding is idempotent: if the admin exists but `ADMIN_PASSWORD` changed in `.env`, the hash is updated on startup.

## Endpoints

All under `/api` base (production uses the `REACT_APP_BACKEND_URL`).

- `POST /api/auth/register` → `{name, email, password}` → 200 `UserOut` (sets cookies)
- `POST /api/auth/login` → `{email, password}` → 200 `UserOut` (sets cookies); 401 on bad credentials
- `POST /api/auth/logout` → clears cookies
- `GET /api/auth/me` → 200 `UserOut` (needs `access_token` cookie or `Bearer` header); 401 otherwise
- `POST /api/auth/refresh` → uses `refresh_token` cookie to rotate access cookie; 401 otherwise

## Cookie policy

`access_token` (60 min) + `refresh_token` (7 days), `httpOnly`, `Secure`, `SameSite=None`, path=`/`.

## Frontend notes

- `axios` client created with `withCredentials: true` in `src/lib/api.js`.
- `AuthContext` bootstraps via `/auth/me` on mount.
- `AdminLayout` redirects to `/login` when user is unauthenticated and to `/` when user lacks admin-like role.

## Quick curl smoke

```bash
API=https://lizam-legal.preview.emergentagent.com/api
curl -c /tmp/c.txt -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@lizam.sa","password":"Lizam@2026"}' -i
curl -b /tmp/c.txt $API/auth/me -i
curl -b /tmp/c.txt $API/admin/overview -i
```
