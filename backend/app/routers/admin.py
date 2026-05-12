"""Admin CRUD router + audit logging + feature toggles."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from app.config import db
from app.models import (
    SiteSettingsIn, BrandingIn, HomeContentIn, AboutContentIn, PublicationIn, AuthorIn, CategoryIn, UserUpdateIn,
    FeatureToggles,
)
from app.sanitize import sanitize_html, slugify, estimate_reading_time
from app.security import (
    require_admin, require_permission, hash_password, uid, utc_iso,
)

router = APIRouter(prefix="/admin", tags=["admin"])


async def audit_log(actor: dict, action: str, target_type: str, target_id: str = "",
                    diff: dict | None = None) -> None:
    try:
        await db.audit_log.insert_one({
            "id": uid(),
            "actor_id": actor.get("id"),
            "actor_email": actor.get("email"),
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "diff": diff or {},
            "at": utc_iso(),
        })
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Overview + Audit log
# ---------------------------------------------------------------------------
@router.get("/overview")
async def overview(user: dict = Depends(require_admin)):
    pubs_total = await db.publications.count_documents({})
    pubs_published = await db.publications.count_documents({"status": "published"})
    pubs_draft = await db.publications.count_documents({"status": {"$in": ["draft", "under_review"]}})
    users_total = await db.users.count_documents({})
    responses_pending = await db.research_responses.count_documents({"status": "submitted"})
    messages_new = await db.contact_messages.count_documents({"status": "new"})
    return {
        "publications_total": pubs_total,
        "publications_published": pubs_published,
        "publications_draft": pubs_draft,
        "users_total": users_total,
        "responses_pending": responses_pending,
        "messages_new": messages_new,
    }


@router.get("/audit")
async def get_audit(limit: int = 50, user: dict = Depends(require_permission("audit.read"))):
    items = await db.audit_log.find({}, {"_id": 0}).sort("at", -1).limit(limit).to_list(length=limit)
    return {"items": items}


# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------
@router.get("/site-settings")
async def admin_get_site_settings(user: dict = Depends(require_permission("settings.read"))):
    doc = await db.site_settings.find_one({"id": "site"}, {"_id": 0})
    return doc or {}


@router.patch("/site-settings")
async def admin_update_site_settings(body: SiteSettingsIn,
                                     user: dict = Depends(require_permission("settings.edit"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"  # mark as admin-edited; seed guard respects this
    update["updated_by"] = user["email"]
    await db.site_settings.update_one({"id": "site"}, {"$set": update}, upsert=True)
    await audit_log(user, "update", "site_settings", "site", {"fields": list(update.keys())})
    return await db.site_settings.find_one({"id": "site"}, {"_id": 0})


# ---------------------------------------------------------------------------
# Branding (subset of site_settings — same collection, visual-only fields)
# ---------------------------------------------------------------------------
@router.get("/branding")
async def admin_get_branding(user: dict = Depends(require_permission("branding.read"))):
    doc = await db.site_settings.find_one({"id": "site"},
                                          {"_id": 0, "logo_url": 1, "logo_light_url": 1, "favicon_url": 1,
                                           "primary_color": 1, "secondary_color": 1, "accent_color": 1,
                                           "background_color": 1, "text_color": 1, "muted_text_color": 1,
                                           "font_ar": 1, "font_en": 1})
    return doc or {}


@router.patch("/branding")
async def admin_update_branding(body: BrandingIn,
                                user: dict = Depends(require_permission("branding.edit"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    update["updated_by"] = user["email"]
    await db.site_settings.update_one({"id": "site"}, {"$set": update}, upsert=True)
    await audit_log(user, "update", "branding", "site", {"fields": list(update.keys())})
    return await admin_get_branding(user)


# ---------------------------------------------------------------------------
# Home content
# ---------------------------------------------------------------------------
@router.get("/home")
async def admin_get_home(user: dict = Depends(require_permission("home.read"))):
    doc = await db.home_content.find_one({"id": "home"}, {"_id": 0})
    return doc or {}


@router.patch("/home")
async def admin_update_home(body: HomeContentIn,
                            user: dict = Depends(require_permission("home.edit"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    update["updated_by"] = user["email"]
    await db.home_content.update_one({"id": "home"}, {"$set": update}, upsert=True)
    await audit_log(user, "update", "home_content", "home", {"fields": list(update.keys())})
    return await db.home_content.find_one({"id": "home"}, {"_id": 0})


# ---------------------------------------------------------------------------
# About page content (separate collection from home_content). Reuses the
# `home.*` permission keys — same admin roles already manage page content.
# ---------------------------------------------------------------------------
@router.get("/about")
async def admin_get_about(user: dict = Depends(require_permission("home.read"))):
    doc = await db.about_content.find_one({"id": "about"}, {"_id": 0})
    return doc or {}


@router.patch("/about")
async def admin_update_about(body: AboutContentIn,
                             user: dict = Depends(require_permission("home.edit"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    update["updated_by"] = user["email"]
    await db.about_content.update_one({"id": "about"}, {"$set": update}, upsert=True)
    await audit_log(user, "update", "about_content", "about", {"fields": list(update.keys())})
    return await db.about_content.find_one({"id": "about"}, {"_id": 0})


# ---------------------------------------------------------------------------
# Publications
# ---------------------------------------------------------------------------
@router.get("/publications")
async def admin_list_publications(
    status: Optional[str] = None, q: Optional[str] = None,
    limit: int = 50, offset: int = 0,
    user: dict = Depends(require_permission("publications.read")),
):
    filt: dict = {}
    if status:
        filt["status"] = status
    if q:
        rx = {"$regex": q, "$options": "i"}
        filt["$or"] = [{"title_ar": rx}, {"title_en": rx}, {"tags": rx}]
    cursor = (db.publications.find(filt, {"_id": 0})
              .sort("updated_at", -1).skip(offset).limit(limit))
    items = await cursor.to_list(length=limit)
    total = await db.publications.count_documents(filt)
    return {"items": items, "total": total}


@router.get("/publications/{pub_id}")
async def admin_get_publication(pub_id: str,
                                user: dict = Depends(require_permission("publications.read"))):
    doc = await db.publications.find_one({"id": pub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Publication not found")
    return doc


@router.post("/publications")
async def admin_create_publication(body: PublicationIn,
                                   user: dict = Depends(require_permission("publications.create"))):
    data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    # Sanitize HTML
    for k in ("content_html_ar", "content_html_en", "preview_html_ar", "preview_html_en"):
        if k in data:
            data[k] = sanitize_html(data[k])
    # Auto-slugs
    data["slug_ar"] = data.get("slug_ar") or slugify(data.get("title_ar", "")) or uid()[:8]
    data["slug_en"] = data.get("slug_en") or slugify(data.get("title_en", "")) or uid()[:8]
    # Reading time
    if "reading_time_minutes" not in data:
        data["reading_time_minutes"] = estimate_reading_time(data.get("content_html_ar"), data.get("content_html_en"))
    data["id"] = uid()
    data["view_count"] = 0
    data["status"] = data.get("status", "draft")
    data["access_level"] = data.get("access_level", "public")
    data["pdf_access_level"] = data.get("pdf_access_level", "public")
    data["responses_enabled"] = data.get("responses_enabled", True)
    data["featured"] = data.get("featured", False)
    data["tags"] = data.get("tags", [])
    data["related_publication_ids"] = data.get("related_publication_ids", [])
    data["author_ids"] = data.get("author_ids", [])
    data["created_by"] = user["email"]
    data["updated_by"] = user["email"]
    data["created_at"] = utc_iso()
    data["updated_at"] = utc_iso()
    data["_seed_origin"] = "admin"
    if data["status"] == "published" and not data.get("published_at"):
        data["published_at"] = utc_iso()
    try:
        await db.publications.insert_one(data)
    except Exception as e:
        raise HTTPException(status_code=409, detail=f"Slug conflict or duplicate: {e}")
    await audit_log(user, "create", "publication", data["id"], {"title_ar": data.get("title_ar")})
    data.pop("_id", None)
    return data


@router.patch("/publications/{pub_id}")
async def admin_update_publication(pub_id: str, body: PublicationIn,
                                   user: dict = Depends(require_permission("publications.edit"))):
    existing = await db.publications.find_one({"id": pub_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Publication not found")
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    for k in ("content_html_ar", "content_html_en", "preview_html_ar", "preview_html_en"):
        if k in update:
            update[k] = sanitize_html(update[k])
    # Recompute reading time if content changed
    if any(k in update for k in ("content_html_ar", "content_html_en")) and "reading_time_minutes" not in update:
        ar = update.get("content_html_ar", existing.get("content_html_ar"))
        en = update.get("content_html_en", existing.get("content_html_en"))
        update["reading_time_minutes"] = estimate_reading_time(ar, en)
    # If transitioning to published, set published_at if empty
    if update.get("status") == "published" and not existing.get("published_at"):
        update["published_at"] = utc_iso()
    update["updated_by"] = user["email"]
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    await db.publications.update_one({"id": pub_id}, {"$set": update})
    await audit_log(user, "update", "publication", pub_id, {"fields": list(update.keys())})
    doc = await db.publications.find_one({"id": pub_id}, {"_id": 0})
    return doc


@router.delete("/publications/{pub_id}")
async def admin_archive_publication(pub_id: str,
                                    user: dict = Depends(require_permission("publications.archive"))):
    r = await db.publications.update_one({"id": pub_id},
                                         {"$set": {"status": "archived", "updated_at": utc_iso(),
                                                   "updated_by": user["email"], "_seed_origin": "admin"}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Publication not found")
    await audit_log(user, "archive", "publication", pub_id)
    return {"ok": True}


@router.delete("/publications/{pub_id}/permanent")
async def admin_delete_publication_permanent(
    pub_id: str,
    user: dict = Depends(require_permission("publications.archive")),
):
    """Hard-delete a publication AND its related research responses."""
    pub = await db.publications.find_one({"id": pub_id}, {"_id": 0, "title_ar": 1, "title_en": 1})
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    await db.publications.delete_one({"id": pub_id})
    # Cascade: delete dependent research responses
    resp_res = await db.research_responses.delete_many({"publication_id": pub_id})
    await audit_log(user, "delete_permanent", "publication", pub_id,
                    {"title": pub.get("title_ar") or pub.get("title_en"),
                     "responses_deleted": resp_res.deleted_count})
    return {"ok": True, "responses_deleted": resp_res.deleted_count}


# ---------------------------------------------------------------------------
# Authors
# ---------------------------------------------------------------------------
@router.get("/authors")
async def admin_list_authors(user: dict = Depends(require_permission("authors.read"))):
    items = await db.authors.find({}, {"_id": 0}).sort([("sort_order", 1), ("created_at", -1)]).to_list(length=500)
    return {"items": items}


@router.post("/authors/reorder")
async def admin_reorder_authors(body: List[dict],
                                user: dict = Depends(require_permission("authors.edit"))):
    """Bulk-set sort_order. Body: [{"id": "...", "sort_order": 0}, ...]"""
    for item in body:
        if not item.get("id"):
            continue
        await db.authors.update_one(
            {"id": item["id"]},
            {"$set": {"sort_order": int(item.get("sort_order", 0)),
                      "updated_at": utc_iso(), "_seed_origin": "admin"}},
        )
    await audit_log(user, "reorder", "author", "bulk", {"count": len(body)})
    return {"ok": True, "count": len(body)}


@router.post("/authors")
async def admin_create_author(body: AuthorIn, user: dict = Depends(require_permission("authors.create"))):
    data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    data["id"] = uid()
    data["active"] = data.get("active", True)
    data["created_at"] = utc_iso()
    data["updated_at"] = utc_iso()
    data["_seed_origin"] = "admin"
    await db.authors.insert_one(data)
    await audit_log(user, "create", "author", data["id"])
    data.pop("_id", None)
    return data


@router.patch("/authors/{author_id}")
async def admin_update_author(author_id: str, body: AuthorIn,
                              user: dict = Depends(require_permission("authors.edit"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    r = await db.authors.update_one({"id": author_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Author not found")
    await audit_log(user, "update", "author", author_id)
    return await db.authors.find_one({"id": author_id}, {"_id": 0})


@router.delete("/authors/{author_id}")
async def admin_archive_author(author_id: str,
                               user: dict = Depends(require_permission("authors.archive"))):
    r = await db.authors.update_one({"id": author_id},
                                    {"$set": {"active": False, "updated_at": utc_iso(),
                                              "_seed_origin": "admin"}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Author not found")
    await audit_log(user, "archive", "author", author_id)
    return {"ok": True}


@router.delete("/authors/{author_id}/permanent")
async def admin_delete_author_permanent(
    author_id: str,
    user: dict = Depends(require_permission("authors.archive")),
):
    """Hard-delete an author. Removes their id from all publications.author_ids."""
    author = await db.authors.find_one({"id": author_id}, {"_id": 0, "name_ar": 1, "name_en": 1})
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    await db.authors.delete_one({"id": author_id})
    # Cascade: scrub from publications
    pub_res = await db.publications.update_many(
        {"author_ids": author_id},
        {"$pull": {"author_ids": author_id}},
    )
    await audit_log(user, "delete_permanent", "author", author_id,
                    {"name": author.get("name_ar") or author.get("name_en"),
                     "publications_updated": pub_res.modified_count})
    return {"ok": True, "publications_updated": pub_res.modified_count}


# ---------------------------------------------------------------------------
# Categories / Fields of Work
# ---------------------------------------------------------------------------
@router.get("/categories")
async def admin_list_categories(user: dict = Depends(require_permission("categories.read"))):
    items = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(length=500)
    return {"items": items}


@router.post("/categories/reorder")
async def admin_reorder_categories(body: List[dict],
                                   user: dict = Depends(require_permission("categories.edit"))):
    """Bulk-set sort_order. Body: [{"id": "...", "sort_order": 0}, ...]"""
    for item in body:
        if not item.get("id"):
            continue
        await db.categories.update_one(
            {"id": item["id"]},
            {"$set": {"sort_order": int(item.get("sort_order", 0)),
                      "updated_at": utc_iso(), "_seed_origin": "admin"}},
        )
    await audit_log(user, "reorder", "category", "bulk", {"count": len(body)})
    return {"ok": True, "count": len(body)}


@router.post("/categories")
async def admin_create_category(body: CategoryIn,
                                user: dict = Depends(require_permission("categories.create"))):
    data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    data["id"] = uid()
    data["active"] = data.get("active", True)
    data["sort_order"] = data.get("sort_order", 999)
    data["icon"] = data.get("icon", "book-open")
    data["_seed_origin"] = "admin"
    data["created_at"] = utc_iso()
    data["updated_at"] = utc_iso()
    await db.categories.insert_one(data)
    await audit_log(user, "create", "category", data["id"])
    data.pop("_id", None)
    return data


@router.patch("/categories/{cat_id}")
async def admin_update_category(cat_id: str, body: CategoryIn,
                                user: dict = Depends(require_permission("categories.edit"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    r = await db.categories.update_one({"id": cat_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await audit_log(user, "update", "category", cat_id)
    return await db.categories.find_one({"id": cat_id}, {"_id": 0})


@router.delete("/categories/{cat_id}")
async def admin_archive_category(cat_id: str,
                                 user: dict = Depends(require_permission("categories.archive"))):
    r = await db.categories.update_one({"id": cat_id},
                                       {"$set": {"active": False, "updated_at": utc_iso(),
                                                 "_seed_origin": "admin"}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await audit_log(user, "archive", "category", cat_id)
    return {"ok": True}


@router.delete("/categories/{cat_id}/permanent")
async def admin_delete_category_permanent(
    cat_id: str,
    user: dict = Depends(require_permission("categories.archive")),
):
    """Hard-delete a category. Clears category_id from any publication referencing it."""
    cat = await db.categories.find_one({"id": cat_id}, {"_id": 0, "title_ar": 1, "title_en": 1})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.categories.delete_one({"id": cat_id})
    # Cascade: detach from publications
    pub_res = await db.publications.update_many(
        {"category_id": cat_id},
        {"$set": {"category_id": None}},
    )
    await audit_log(user, "delete_permanent", "category", cat_id,
                    {"title": cat.get("title_ar") or cat.get("title_en"),
                     "publications_updated": pub_res.modified_count})
    return {"ok": True, "publications_updated": pub_res.modified_count}


# ---------------------------------------------------------------------------
# Users + Roles
# ---------------------------------------------------------------------------
@router.get("/users")
async def admin_list_users(q: Optional[str] = None, user: dict = Depends(require_permission("users.read"))):
    filt: dict = {}
    if q:
        rx = {"$regex": q, "$options": "i"}
        filt["$or"] = [{"email": rx}, {"name": rx}]
    items = await db.users.find(filt, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(length=500)
    return {"items": items}


@router.patch("/users/{user_id}")
async def admin_update_user(user_id: str, body: UserUpdateIn,
                            user: dict = Depends(require_permission("users.edit"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    # Safety: cannot demote the last super_admin
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "role" in update and target.get("role") == "super_admin" and update["role"] != "super_admin":
        super_count = await db.users.count_documents({"role": "super_admin", "status": "active"})
        if super_count <= 1:
            raise HTTPException(status_code=409, detail="Cannot remove last Super Admin")
    update["updated_at"] = utc_iso()
    update["_seed_origin"] = "admin"
    await db.users.update_one({"id": user_id}, {"$set": update})
    await audit_log(user, "update", "user", user_id, {"fields": list(update.keys())})
    out = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return out


@router.delete("/users/{user_id}/permanent")
async def admin_delete_user_permanent(
    user_id: str,
    user: dict = Depends(require_permission("users.edit")),
):
    """Hard-delete a user account. Safety: cannot delete self or last active super_admin."""
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("id") == user.get("id") or target.get("email") == user.get("email"):
        raise HTTPException(status_code=409, detail="Cannot delete your own account")
    if target.get("role") == "super_admin":
        super_count = await db.users.count_documents({"role": "super_admin", "status": "active"})
        if super_count <= 1:
            raise HTTPException(status_code=409, detail="Cannot delete the last Super Admin")
    await db.users.delete_one({"id": user_id})
    await audit_log(user, "delete_permanent", "user", user_id,
                    {"email": target.get("email"), "role": target.get("role")})
    return {"ok": True}


@router.get("/roles")
async def admin_list_roles(user: dict = Depends(require_permission("roles.read"))):
    items = await db.roles.find({}, {"_id": 0}).to_list(length=100)
    return {"items": items}


# ---------------------------------------------------------------------------
# Feature toggles (subset of site settings)
# ---------------------------------------------------------------------------
@router.get("/toggles")
async def admin_get_toggles(user: dict = Depends(require_permission("toggles.read"))):
    doc = await db.site_settings.find_one({"id": "site"}, {"_id": 0, "feature_toggles": 1})
    return (doc or {}).get("feature_toggles") or FeatureToggles().model_dump()


@router.patch("/toggles")
async def admin_update_toggles(body: FeatureToggles,
                               user: dict = Depends(require_permission("toggles.edit"))):
    data = body.model_dump()
    await db.site_settings.update_one(
        {"id": "site"},
        {"$set": {"feature_toggles": data, "updated_at": utc_iso(),
                  "_seed_origin": "admin", "updated_by": user["email"]}},
        upsert=True,
    )
    await audit_log(user, "update", "toggles", "site", {"toggles": data})
    return data


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------
@router.get("/messages")
async def admin_list_messages(user: dict = Depends(require_permission("messages.read"))):
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    return {"items": items}


@router.patch("/messages/{mid}")
async def admin_patch_message(mid: str, body: dict,
                              user: dict = Depends(require_permission("messages.read"))):
    status = (body or {}).get("status")
    if status not in ("new", "read", "archived"):
        raise HTTPException(status_code=400, detail="Invalid status")
    r = await db.contact_messages.update_one({"id": mid}, {"$set": {"status": status}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    await audit_log(user, "update", "message", mid, {"status": status})
    return {"ok": True, "status": status}


@router.delete("/messages/{mid}/permanent")
async def admin_delete_message_permanent(
    mid: str,
    user: dict = Depends(require_permission("messages.read")),
):
    """Hard-delete a contact message."""
    msg = await db.contact_messages.find_one({"id": mid}, {"_id": 0, "email": 1, "subject": 1})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    await db.contact_messages.delete_one({"id": mid})
    await audit_log(user, "delete_permanent", "message", mid,
                    {"email": msg.get("email"), "subject": msg.get("subject")})
    return {"ok": True}


# ---------------- Newsletter subscribers ---------------------------------
@router.get("/newsletter")
async def admin_list_newsletter(user: dict = Depends(require_permission("messages.read"))):
    items = await db.newsletter_subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=2000)
    active = await db.newsletter_subscribers.count_documents({"status": "active"})
    return {"items": items, "active_count": active}


@router.delete("/newsletter/{sub_id}")
async def admin_unsubscribe_newsletter(sub_id: str,
                                       user: dict = Depends(require_permission("messages.read"))):
    r = await db.newsletter_subscribers.update_one(
        {"id": sub_id}, {"$set": {"status": "unsubscribed"}}
    )
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    await audit_log(user, "update", "newsletter", sub_id, {"status": "unsubscribed"})
    return {"ok": True}


@router.delete("/newsletter/{sub_id}/permanent")
async def admin_delete_newsletter_permanent(
    sub_id: str,
    user: dict = Depends(require_permission("messages.read")),
):
    """Hard-delete a newsletter subscriber record."""
    sub = await db.newsletter_subscribers.find_one({"id": sub_id}, {"_id": 0, "email": 1})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    await db.newsletter_subscribers.delete_one({"id": sub_id})
    await audit_log(user, "delete_permanent", "newsletter", sub_id, {"email": sub.get("email")})
    return {"ok": True}
