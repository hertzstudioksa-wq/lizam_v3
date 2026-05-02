"""File upload router — images + PDFs, admin-only, sanitized filenames."""
import re
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from app.config import UPLOAD_DIR, MAX_UPLOAD_MB, ALLOWED_IMAGE_MIME, ALLOWED_PDF_MIME
from app.security import require_permission

router = APIRouter(prefix="/uploads", tags=["uploads"])
_MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024
_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_filename(name: str) -> str:
    name = name.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    name = _SAFE_NAME.sub("-", name)
    return name[:120] or "file"


async def _save(file: UploadFile, subdir: str, allowed_mimes: set[str]) -> dict:
    if file.content_type not in allowed_mimes:
        raise HTTPException(status_code=415, detail=f"Unsupported type: {file.content_type}")
    contents = await file.read()
    if len(contents) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_MB}MB")
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    target_dir: Path = UPLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "").suffix.lower() or ".bin"
    name = f"{uuid.uuid4().hex}{ext}"
    out = target_dir / name
    out.write_bytes(contents)
    return {
        "filename": name,
        "original": _safe_filename(file.filename or name),
        "size": len(contents),
        "mime": file.content_type,
        "url": f"/uploads/{subdir}/{name}",
    }


@router.post("/image")
async def upload_image(file: UploadFile = File(...),
                      user: dict = Depends(require_permission("uploads.create"))):
    return await _save(file, "images", ALLOWED_IMAGE_MIME)


@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...),
                    user: dict = Depends(require_permission("uploads.create"))):
    return await _save(file, "pdfs", ALLOWED_PDF_MIME)
