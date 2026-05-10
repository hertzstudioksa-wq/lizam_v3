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
    # Ordered list of header-nav item keys. Items NOT in the array are hidden
    # from the public header. Allowed keys: "home" | "publications" | "about" | "contact"
    header_nav_order: Optional[List[str]] = None
    # Three-axis typography scale applied to public Theme B (range 0.85–1.25 each)
    font_scale: Optional[Dict[str, float]] = None  # {hero, heading, body}


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
    # Section eyebrows (small kicker labels above each section heading)
    hero_eyebrow_ar: Optional[str] = None
    hero_eyebrow_en: Optional[str] = None
    about_eyebrow_ar: Optional[str] = None
    about_eyebrow_en: Optional[str] = None
    mission_eyebrow_ar: Optional[str] = None
    mission_eyebrow_en: Optional[str] = None
    objectives_eyebrow_ar: Optional[str] = None
    objectives_eyebrow_en: Optional[str] = None
    fields_eyebrow_ar: Optional[str] = None
    fields_eyebrow_en: Optional[str] = None
    featured_eyebrow_ar: Optional[str] = None
    featured_eyebrow_en: Optional[str] = None
    contact_eyebrow_ar: Optional[str] = None
    contact_eyebrow_en: Optional[str] = None
    # Hero
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
    # ---------------- Phase: section-by-section dashboard ----------------
    # Per-section font-scale + small per-section style overrides
    # (saved as { hero: {title_scale: 1.1}, objectives: {title_scale: 1.05}, ... })
    section_styles: Optional[Dict[str, Dict[str, Any]]] = None
    # Hero — buttons & background media
    hero_cta_primary_link: Optional[str] = None
    hero_cta_secondary_link: Optional[str] = None
    hero_background_url: Optional[str] = None
    hero_background_type: Optional[Literal["image", "video"]] = None
    # About — optional side image
    about_image_url: Optional[str] = None
    # Fields of Work — section heading
    fields_title_ar: Optional[str] = None
    fields_title_en: Optional[str] = None
    # Featured Publications — heading + display rules
    featured_title_ar: Optional[str] = None
    featured_title_en: Optional[str] = None
    featured_blurb_ar: Optional[str] = None
    featured_blurb_en: Optional[str] = None
    featured_count: Optional[int] = None  # 3, 6, or 9
    featured_sort: Optional[Literal["latest", "most_viewed"]] = None
    # Contact band
    contact_title_ar: Optional[str] = None
    contact_title_en: Optional[str] = None
    contact_blurb_ar: Optional[str] = None
    contact_blurb_en: Optional[str] = None
    # Newsletter
    newsletter_enabled: Optional[bool] = None
    newsletter_title_ar: Optional[str] = None
    newsletter_title_en: Optional[str] = None
    newsletter_blurb_ar: Optional[str] = None
    newsletter_blurb_en: Optional[str] = None
    newsletter_eyebrow_ar: Optional[str] = None
    newsletter_eyebrow_en: Optional[str] = None
    # Pull-band ("ركيزة عمل المركز")
    pull_band_text_ar: Optional[str] = None
    pull_band_text_en: Optional[str] = None
    pull_band_attribution_ar: Optional[str] = None
    pull_band_attribution_en: Optional[str] = None
    # Fields of work — body paragraph
    fields_body_ar: Optional[str] = None
    fields_body_en: Optional[str] = None


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
    sort_order: Optional[int] = None
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
