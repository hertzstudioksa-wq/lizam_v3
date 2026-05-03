"""Pydantic models (inputs + optional validators)."""
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SocialLinks(BaseModel):
    twitter: Optional[str] = ""
    linkedin: Optional[str] = ""
    youtube: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""


class FeatureToggles(BaseModel):
    registration: bool = True
    gated_content: bool = True
    google_login: bool = False
    research_responses: bool = True
    public_responses: bool = True
    authors_public_page: bool = False
    contact_form: bool = True
    featured_publications: bool = True
    policy_pages: bool = False
    pdf_download: bool = True
    social_icons: bool = True
    email_notifications: bool = False


# ----- Auth IO -----
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


# ----- Admin IO -----
class SiteSettingsIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    site_name_ar: Optional[str] = None
    site_name_en: Optional[str] = None
    tagline_ar: Optional[str] = None
    tagline_en: Optional[str] = None
    default_language: Optional[Literal["ar", "en"]] = None
    active_theme: Optional[Literal["A", "B"]] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address_ar: Optional[str] = None
    address_en: Optional[str] = None
    footer_text_ar: Optional[str] = None
    footer_text_en: Optional[str] = None
    social_links: Optional[SocialLinks] = None
    feature_toggles: Optional[FeatureToggles] = None


class BrandingIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    logo_url: Optional[str] = None
    logo_light_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    muted_text_color: Optional[str] = None
    font_ar: Optional[str] = None
    font_en: Optional[str] = None


class HomeContentIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    hero_eyebrow_ar: Optional[str] = None
    hero_eyebrow_en: Optional[str] = None
    hero_title_ar: Optional[str] = None
    hero_title_en: Optional[str] = None
    hero_subtitle_ar: Optional[str] = None
    hero_subtitle_en: Optional[str] = None
    hero_cta_primary_ar: Optional[str] = None
    hero_cta_primary_en: Optional[str] = None
    hero_cta_secondary_ar: Optional[str] = None
    hero_cta_secondary_en: Optional[str] = None
    about_ar: Optional[str] = None
    about_en: Optional[str] = None
    about_extended_ar: Optional[str] = None
    about_extended_en: Optional[str] = None
    mission_ar: Optional[str] = None
    mission_en: Optional[str] = None
    mission_points_ar: Optional[List[str]] = None
    mission_points_en: Optional[List[str]] = None
    vision_ar: Optional[str] = None
    vision_en: Optional[str] = None
    vision_points_ar: Optional[List[str]] = None
    vision_points_en: Optional[List[str]] = None
    objectives: Optional[List[Dict[str, Any]]] = None
    fields_of_work: Optional[List[Dict[str, Any]]] = None
    visible_sections: Optional[List[str]] = None


class PublicationIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title_ar: Optional[str] = None
    title_en: Optional[str] = None
    slug_ar: Optional[str] = None
    slug_en: Optional[str] = None
    summary_ar: Optional[str] = None
    summary_en: Optional[str] = None
    content_html_ar: Optional[str] = None
    content_html_en: Optional[str] = None
    preview_html_ar: Optional[str] = None
    preview_html_en: Optional[str] = None
    publication_type: Optional[str] = None
    category_id: Optional[str] = None
    author_ids: Optional[List[str]] = None
    cover_image_url: Optional[str] = None
    pdf_file_url: Optional[str] = None
    external_pdf_url: Optional[str] = None
    access_level: Optional[Literal["public", "preview_login", "registered", "hidden"]] = None
    pdf_access_level: Optional[Literal["public", "login_required", "admin_only", "disabled"]] = None
    responses_enabled: Optional[bool] = None
    featured: Optional[bool] = None
    status: Optional[Literal["draft", "under_review", "published", "archived"]] = None
    published_at: Optional[str] = None
    reading_time_minutes: Optional[int] = None
    tags: Optional[List[str]] = None
    related_publication_ids: Optional[List[str]] = None


class AuthorIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    title_ar: Optional[str] = None
    title_en: Optional[str] = None
    bio_ar: Optional[str] = None
    bio_en: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    linkedin: Optional[str] = None
    active: Optional[bool] = None


class CategoryIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title_ar: Optional[str] = None
    title_en: Optional[str] = None
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    active: Optional[bool] = None


class UserUpdateIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Optional[Literal["super_admin", "admin", "editor", "reviewer", "registered"]] = None
    status: Optional[Literal["active", "deactivated"]] = None
    name: Optional[str] = None
