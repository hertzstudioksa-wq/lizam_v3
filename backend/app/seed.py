"""Idempotent seeding with `_seed_origin` guard — never overwrites admin-edited docs."""
import logging
from app.config import db, ADMIN_EMAIL, ADMIN_PASSWORD, SEED_ORIGIN
from app.security import hash_password, verify_password, uid, utc_iso
from app.sanitize import sanitize_html

logger = logging.getLogger("lizam.seed")

DEFAULT_FIELDS = [
    {"id": "", "sort_order": 1, "icon": "scroll-text", "active": True,
     "title_ar": "الدراسات التشريعية", "title_en": "Legislative Studies",
     "description_ar": "تصميم الأنظمة واللوائح وصياغتها، وضمان الاتساق التشريعي، وقياس الأثر التشريعي.",
     "description_en": "The design and drafting of laws and regulations, legislative coherence, and measuring regulatory impact."},
    {"id": "", "sort_order": 2, "icon": "scale", "active": True,
     "title_ar": "الممارسات القضائية والتاريخ المؤسسي", "title_en": "Judicial Practices & Institutional History",
     "description_ar": "دراسة التطور التاريخي للمؤسسات القانونية، والتسبيب القضائي، وتطوير آليات فض المنازعات.",
     "description_en": "Studying the historical evolution of legal institutions, judicial reasoning, and dispute resolution mechanisms."},
    {"id": "", "sort_order": 3, "icon": "landmark", "active": True,
     "title_ar": "السياسات العامة والحوكمة", "title_en": "Public Policy & Governance",
     "description_ar": "تحليل تصميم السياسات العامة وصياغتها، ودراسة التفاعل بين القانون والسياسة العامة.",
     "description_en": "Analysing policy design, the interaction between law and public policy."},
    {"id": "", "sort_order": 4, "icon": "book-open", "active": True,
     "title_ar": "الشريعة الإسلامية والنظم القانونية", "title_en": "Islamic Sharia & Legal Systems",
     "description_ar": "التحليل الفقهي في السياقات المعاصرة، ودراسة التفاعل بين الفقه والنظم القانونية الحديثة.",
     "description_en": "Fiqh analysis in contemporary contexts and the interplay between Islamic jurisprudence and modern legal systems."},
    {"id": "", "sort_order": 5, "icon": "compass", "active": True,
     "title_ar": "المجالات المتخصصة والناشئة", "title_en": "Specialised & Emerging Fields",
     "description_ar": "القانون والتقنية، المرافق العامة الإلكترونية، الحوكمة الرقمية، والجوانب القانونية للاستدامة.",
     "description_en": "Law and technology, e-public utilities, digital governance, and legal dimensions of sustainability."},
]


async def _upsert_if_seed(collection, query: dict, doc: dict) -> None:
    """Seed guard: insert if missing; update only if existing doc is a seed.
    Admin-edited docs (with _seed_origin == 'admin') are never overwritten."""
    existing = await collection.find_one(query)
    if existing is None:
        doc["_seed_origin"] = SEED_ORIGIN
        await collection.insert_one(doc)
        return
    if existing.get("_seed_origin") == "admin":
        logger.info("Skip re-seed (admin-edited): %s", query)
        return
    # Seed-origin or missing → refresh
    doc["_seed_origin"] = SEED_ORIGIN
    await collection.update_one(query, {"$set": doc})


async def seed_all() -> None:
    # Indexes
    await db.roles.create_index("key", unique=True)
    await db.users.create_index("email", unique=True)
    await db.publications.create_index("id", unique=True)
    await db.publications.create_index([("slug_ar", 1)], unique=True, sparse=True)
    await db.publications.create_index([("slug_en", 1)], unique=True, sparse=True)
    await db.publications.create_index([("status", 1), ("published_at", -1)])
    await db.categories.create_index("id", unique=True)
    await db.authors.create_index("id", unique=True)
    await db.newsletter_subscribers.create_index("email", unique=True)
    await db.newsletter_subscribers.create_index([("status", 1), ("created_at", -1)])

    # Roles
    default_roles = [
        {"key": "super_admin", "name_ar": "مدير عام", "name_en": "Super Admin", "permissions": ["*"]},
        {"key": "admin", "name_ar": "مدير", "name_en": "Admin",
         "permissions": ["publications.*", "responses.*", "users.read", "users.edit",
                         "settings.*", "branding.*", "home.*", "toggles.*", "audit.read", "messages.read",
                         "authors.*", "categories.*", "roles.read"]},
        {"key": "editor", "name_ar": "محرر", "name_en": "Editor",
         "permissions": ["publications.create", "publications.edit", "publications.read",
                         "authors.read", "authors.edit", "categories.read"]},
        {"key": "reviewer", "name_ar": "مراجع", "name_en": "Reviewer",
         "permissions": ["responses.moderate", "publications.read", "responses.read"]},
        {"key": "registered", "name_ar": "مستخدم مسجل", "name_en": "Registered User",
         "permissions": ["responses.submit"]},
    ]
    for r in default_roles:
        r["id"] = r.get("id") or uid()
        r["created_at"] = utc_iso()
        await db.roles.update_one({"key": r["key"]}, {"$setOnInsert": r}, upsert=True)

    # Super Admin (password refreshed from env if changed; otherwise left alone)
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": uid(), "name": "LIZAM Super Admin", "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "super_admin", "status": "active", "auth_provider": "local",
            "created_at": utc_iso(), "updated_at": utc_iso(),
        })
    elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD),
                      "role": "super_admin", "updated_at": utc_iso()}},
        )

    # Site settings (guarded)
    site_defaults = {
        "id": "site",
        "site_name_ar": "مركز لزام للدراسات القانونية",
        "site_name_en": "LIZAM Center for Legal Research",
        "tagline_ar": "مركز بحثي متخصص في الدراسات القانونية والسياسات العامة",
        "tagline_en": "A research center specializing in legal studies and public policy",
        "default_language": "ar",
        "active_theme": "A",
        "logo_url": "/brand/lizam-logo.png",
        "logo_light_url": "/brand/lizam-logo-light.png",
        "favicon_url": "/favicon.ico",
        "primary_color": "#23324D", "secondary_color": "#121A2A",
        "accent_color": "#B89B5E", "background_color": "#F7F8FA",
        "text_color": "#1D2939", "muted_text_color": "#667085",
        "font_ar": "Thmanyah Sans", "font_en": "Thmanyah Sans",
        "contact_email": "info@lizam.sa", "phone": "",
        "address_ar": "المملكة العربية السعودية", "address_en": "Kingdom of Saudi Arabia",
        "footer_text_ar": "© {year} مركز لزام للدراسات القانونية. جميع الحقوق محفوظة.",
        "footer_text_en": "© {year} LIZAM Center for Legal Research. All rights reserved.",
        "social_links": {"twitter": "", "linkedin": "", "youtube": "", "facebook": "", "instagram": ""},
        "feature_toggles": {
            "registration": True, "gated_content": True, "google_login": False,
            "research_responses": True, "public_responses": True,
            "authors_public_page": False, "contact_form": True,
            "featured_publications": True, "policy_pages": False,
            "pdf_download": True, "social_icons": True,
        },
        # Public-site typography scale (1.0 = baseline). Range 0.85–1.5 each.
        "font_scale": {"hero": 1.0, "heading": 1.0, "body": 1.0, "eyebrow": 1.0},
        "updated_at": utc_iso(),
    }
    await _upsert_if_seed(db.site_settings, {"id": "site"}, site_defaults)

    # One-time backfill: ensure active_theme exists on existing admin-edited site_settings docs
    await db.site_settings.update_one(
        {"id": "site", "active_theme": {"$exists": False}},
        {"$set": {"active_theme": "B"}},
    )
    # One-time backfill: ensure font_scale exists on existing admin-edited site_settings docs
    await db.site_settings.update_one(
        {"id": "site", "font_scale": {"$exists": False}},
        {"$set": {"font_scale": {"hero": 1.0, "heading": 1.0, "body": 1.0, "eyebrow": 1.0}}},
    )
    # One-time backfill: ensure eyebrow axis exists on older font_scale docs
    await db.site_settings.update_one(
        {"id": "site", "font_scale.eyebrow": {"$exists": False}},
        {"$set": {"font_scale.eyebrow": 1.0}},
    )

    # Home content — seeded once, refreshed on seed-only restarts
    home_defaults = {
        "id": "home",
        "hero_eyebrow_ar": "المجلد الأول · إصدار 2026",
        "hero_eyebrow_en": "Volume I · Edition 2026",
        # Section eyebrows (kicker labels). Editable from /admin/home.
        "about_eyebrow_ar": "عن المركز",
        "about_eyebrow_en": "About",
        "mission_eyebrow_ar": "المنطلقات",
        "mission_eyebrow_en": "Foundations",
        "objectives_eyebrow_ar": "الأهداف",
        "objectives_eyebrow_en": "Objectives",
        "fields_eyebrow_ar": "مجالات العمل",
        "fields_eyebrow_en": "Fields of Work",
        "featured_eyebrow_ar": "المكتبة البحثية",
        "featured_eyebrow_en": "Research Library",
        "contact_eyebrow_ar": "تواصل",
        "contact_eyebrow_en": "Contact",
        "hero_title_ar": "بحث قانوني رصين\nلصناعة قرار أكثر نضجاً",
        "hero_title_en": "Rigorous Legal Research\nfor Sharper Decisions",
        "hero_subtitle_ar": "مركز لزام للدراسات القانونية مركز بحثي سعودي متخصص في الدراسات القانونية والسياسات العامة، ينتج معرفة قانونية مستقلة تخدم القطاعين العام والخاص، وتدعم صنّاع القرار برؤى تحليلية موثوقة.",
        "hero_subtitle_en": "LIZAM Center for Legal Research is a Saudi research center specializing in legal studies and public policy, producing independent legal knowledge that serves the public and private sectors and supports decision-makers with trusted analytical insights.",
        "hero_cta_primary_ar": "استعراض الإصدارات", "hero_cta_primary_en": "Explore Publications",
        "hero_cta_secondary_ar": "تواصل مع المركز", "hero_cta_secondary_en": "Contact the Center",
        "about_ar": "يجسّد مركز لزام مبادرة جماعية من نخبة من الأكاديميين القانونيين السعوديين الملتزمين بتطوير البحث القانوني الرصين، وتحديث الممارسات القانونية بما يستلهم التجارب العالمية القائمة على أسس علمية ومؤسسية.",
        "about_en": "LIZAM Center is a collective initiative led by a select group of Saudi legal academics committed to advancing rigorous legal research and modernising legal practice in light of leading global experiences grounded in scholarly and institutional foundations.",
        "about_extended_ar": "ويقوم المركز على اعتقاد راسخ بأن الأنظمة القانونية تتطور من خلال الاجتهاد البحثي المستمر، والحوار المؤسسي، والمساهمات التحليلية المعمقة في عملية صنع القرار في القطاعين العام والخاص.",
        "about_extended_en": "The Center rests on a firm conviction that legal systems evolve through sustained scholarly inquiry, institutional dialogue, and substantive analytical contributions to decision-making across the public and private sectors.",
        "mission_ar": "تتمثل رسالة المركز في الارتقاء بالبحث القانوني في المملكة العربية السعودية من خلال إنتاج دراسات قانونية أصيلة ومعاصرة وذات صلة بالسياسات العامة، تسهم في تطوير القانون والمؤسسات القانونية وممارسات الحوكمة في الكيانات العامة والخاصة وغير الربحية. ولا ينظر المركز إلى البحث القانوني كمجرد تحليل وصفي، بل كنشاط نقدي وبنّاء يفحص القواعد القانونية والترتيبات المؤسسية والخيارات التنظيمية في ضوء سياقاتها المتنوعة.",
        "mission_en": "The Center's mission is to advance legal research in the Kingdom of Saudi Arabia by producing original, contemporary, and policy-relevant legal studies that contribute to the development of law, legal institutions, and governance practices across public, private, and non-profit entities. Legal research, in our view, is not a merely descriptive exercise but a critical and constructive activity that examines legal rules, institutional arrangements, and regulatory choices in light of their diverse contexts.",
        "mission_points_ar": [
            "تعزيز جودة وعمق البحوث القانونية المتعلقة بالأنظمة والمؤسسات القانونية السعودية، بما يعزّز مكانتها دولياً.",
            "تجسير الفجوة بين الدراسات القانونية الأكاديمية والممارسة المؤسسية.",
            "تعزيز ثقافة بحثية تثمن المنهجية الصارمة، والاستقلال الفكري، والتبادل المعرفي المفتوح.",
        ],
        "mission_points_en": [
            "Elevate the quality and depth of legal research on Saudi legal systems and institutions, strengthening their international standing.",
            "Bridge the gap between academic legal scholarship and institutional practice.",
            "Cultivate a research culture that values methodological rigour, intellectual independence, and open exchange of knowledge.",
        ],
        "vision_ar": "تتمثل رؤية المركز في أن يصبح مؤسسة بحثية قانونية رائدة وعالمية، مقرّها السعودية، ومعترفاً بجدية طرحها الفكري، وعمقها التحليلي، ومساهمتها المستدامة في الفكر القانوني وصياغة السياسات والتطوير التشريعي والمؤسسي.",
        "vision_en": "The Center's vision is to become a leading legal research institution of global standing, headquartered in Saudi Arabia, recognised for the seriousness of its intellectual contribution, the depth of its analysis, and its sustained impact on legal thought, policymaking, and legislative and institutional development.",
        "vision_points_ar": [
            "أن يكون مرجعاً موثوقاً للدراسات القانونية وتحليل السياسات المتعلقة بالمملكة العربية السعودية.",
            "المساهمة الفعّالة في الحوارات الإقليمية والعالمية حول القانون والحوكمة والإصلاح القانوني.",
            "إعداد جيل جديد من الباحثين القانونيين المؤهلين للتعامل مع القضايا القانونية والمؤسسية المعقدة.",
            "تقديم نموذج استشاري قانوني قائم على منهجيات البحث السليمة والمعاصرة، ومحققاً لآثار مؤسسية طويلة الأمد.",
        ],
        "vision_points_en": [
            "To serve as a trusted reference for legal research and policy analysis relevant to the Kingdom of Saudi Arabia.",
            "To contribute meaningfully to regional and global conversations on law, governance, and legal reform.",
            "To prepare a new generation of legal researchers equipped to engage with complex legal and institutional questions.",
            "To offer a contemporary legal advisory model rooted in sound research methodologies, with lasting institutional impact.",
        ],
        "vision_points_en": [
            "Serve as a trusted reference for legal research and policy analysis relevant to the Kingdom of Saudi Arabia.",
            "Contribute to regional and global conversations on law, governance, and legal reform.",
            "Prepare a new generation of Saudi legal researchers.",
            "Offer a contemporary research and advisory model rooted in sound methodology.",
        ],
        "objectives": [
            {"id": uid(), "sort_order": i+1, **o}
            for i, o in enumerate([
                {"title_ar": "النهوض بالدراسات القانونية", "title_en": "Advancing Legal Studies",
                 "description_ar": "إنتاج بحثي نوعي وطويل المدى، لمعالجة القضايا ذات الصلة بالقانون والحوكمة والسياسات في المملكة، بما يشمل دراسات السياسات وأوراق العمل والدراسات المعمّقة.",
                 "description_en": "Producing high-quality, long-horizon research that addresses pressing questions in law, governance, and policy in the Kingdom — including policy studies, working papers, and in-depth analyses."},
                {"title_ar": "دعم حوكمة القطاع العام", "title_en": "Supporting Public Sector Governance",
                 "description_ar": "إسناد المؤسسات العامة بدراسات معمّقة ومحايدة ومستندة إلى التحليل والبحث الرصين في قضايا التشريع والتنظيم والصلاحيات المؤسسية والتصميم الإداري، والمساهمة في مداولات السياسات العامة عبر توضيح المفاهيم القانونية والاختصاصات المؤسسية والقيود المعيارية ذات الصلة بالحوكمة واتخاذ القرار.",
                 "description_en": "Supporting public institutions with in-depth, independent, research-grounded analysis on legislation, regulation, institutional mandates, and administrative design — and contributing to policy deliberations by clarifying the legal concepts, institutional competencies, and normative constraints relevant to governance and decision-making."},
                {"title_ar": "خدمة القطاع الخاص", "title_en": "Serving the Private Sector",
                 "description_ar": "تقديم خدمات بحثية واستشارية تساعد الكيانات الخاصة على فهم الأطر التنظيمية والمخاطر القانونية.",
                 "description_en": "Research and advisory services that help private entities navigate regulatory frameworks and legal risks."},
                {"title_ar": "بناء القدرات البحثية", "title_en": "Building Research Capabilities",
                 "description_ar": "توجيه الباحثين والممارسين في بداية مسيرتهم المهنية المهتمين بالبحث القانوني المتقدم.",
                 "description_en": "Mentoring early-career researchers and practitioners engaged with advanced legal research."},
                {"title_ar": "تعزيز المعرفة المتاحة للجميع", "title_en": "Promoting Open Access to Knowledge",
                 "description_ar": "إتاحة المخرجات البحثية للجمهور، والإسهام في إثراء النقاش العام حول القضايا القانونية والسياسات العامة، وتشجيع تداول الأفكار بين الأوساط الأكاديمية والمهنية وصنّاع القرار.",
                 "description_en": "Making research outputs publicly accessible, enriching public discourse on legal and policy matters, and fostering the exchange of ideas across academic, professional, and policy-making communities."},
            ])
        ],
        "fields_of_work": [{**f, "id": uid()} for f in DEFAULT_FIELDS],
        "visible_sections": ["hero", "about", "mission", "vision", "objectives",
                             "fields_of_work", "featured_publications", "contact"],
        "updated_at": utc_iso(),
    }
    await _upsert_if_seed(db.home_content, {"id": "home"}, home_defaults)

    # ---- About page content (dedicated page, separate collection) ----
    about_defaults = {
        "id": "about",
        # Ordered list of section keys — drives both rendering order and visibility
        "visible_sections": [
            "hero", "intro", "mission_vision", "objectives",
            "board", "partners", "contact_cta",
        ],
        # Hero
        "hero_eyebrow_ar": "عن المركز",
        "hero_eyebrow_en": "About",
        "hero_title_ar": "بحث قانوني رصين، في خدمة الحوكمة والسياسات.",
        "hero_title_en": "Rigorous Legal Research in Service of Governance and Policy.",
        "hero_subtitle_ar": "مركز سعودي متخصص في الدراسات القانونية والسياسات العامة، يقدّم معرفة مستقلة تخدم القطاعين العام والخاص.",
        "hero_subtitle_en": "A Saudi research center dedicated to legal studies and public policy — producing independent knowledge that serves public and private institutions.",
        # Intro
        "intro_eyebrow_ar": "نبذة",
        "intro_eyebrow_en": "Overview",
        "intro_title_ar": "مَنْ نحن",
        "intro_title_en": "Who We Are",
        "intro_body_ar": "يجسّد مركز لزام مبادرة جماعية من نخبة من الأكاديميين القانونيين السعوديين الملتزمين بتطوير البحث القانوني الرصين، وتحديث الممارسات القانونية بما يستلهم التجارب العالمية القائمة على أسس علمية ومؤسسية.",
        "intro_body_en": "LIZAM is a collective initiative led by a select group of Saudi legal academics committed to advancing rigorous legal research and modernising legal practice in light of leading global experiences grounded in scholarly foundations.",
        "intro_body_extended_ar": "ويقوم المركز على اعتقاد راسخ بأن الأنظمة القانونية تتطور من خلال الاجتهاد البحثي المستمر، والحوار المؤسسي، والمساهمات التحليلية المعمقة في عملية صنع القرار.",
        "intro_body_extended_en": "The Center is built on the conviction that legal systems evolve through sustained scholarly inquiry, institutional dialogue, and substantive analytical contributions to decision-making.",
        # Mission & Vision (numbered manifesto)
        "mission_eyebrow_ar": "الفصل الأول",
        "mission_eyebrow_en": "Chapter One",
        "mission_title_ar": "الرسالة",
        "mission_title_en": "Mission",
        "mission_body_ar": "تتمثل رسالة المركز في الارتقاء بالبحث القانوني في المملكة العربية السعودية من خلال إنتاج دراسات قانونية أصيلة ومعاصرة وذات صلة بالسياسات العامة، تسهم في تطوير القانون والمؤسسات القانونية وممارسات الحوكمة.",
        "mission_body_en": "Our mission is to advance legal research in Saudi Arabia by producing original, contemporary, and policy-relevant legal studies that contribute to the development of law, legal institutions, and governance practices.",
        "mission_points_ar": [
            "تعزيز جودة وعمق البحوث القانونية السعودية، بما يعزّز مكانتها دولياً.",
            "تجسير الفجوة بين الدراسات الأكاديمية والممارسة المؤسسية.",
            "تعزيز ثقافة بحثية تُقدّر المنهجية الصارمة والاستقلال الفكري.",
        ],
        "mission_points_en": [
            "Elevate the quality and depth of Saudi legal research, strengthening its international standing.",
            "Bridge the gap between academic legal scholarship and institutional practice.",
            "Cultivate a research culture that values methodological rigour and intellectual independence.",
        ],
        "vision_eyebrow_ar": "الفصل الثاني",
        "vision_eyebrow_en": "Chapter Two",
        "vision_title_ar": "الرؤية",
        "vision_title_en": "Vision",
        "vision_body_ar": "تتمثل رؤية المركز في أن يصبح مؤسسة بحثية قانونية رائدة وعالمية، مقرّها السعودية، ومعترفاً بجدية طرحها الفكري، وعمقها التحليلي، ومساهمتها المستدامة في الفكر القانوني وصياغة السياسات.",
        "vision_body_en": "Our vision is to become a leading legal research institution of global standing, headquartered in Saudi Arabia, recognised for its intellectual contribution and sustained impact on legal thought and policymaking.",
        "vision_points_ar": [
            "أن يكون مرجعاً موثوقاً للدراسات القانونية المتعلقة بالمملكة.",
            "المساهمة في الحوارات الإقليمية والعالمية حول القانون والحوكمة.",
            "إعداد جيل جديد من الباحثين القانونيين السعوديين.",
            "تقديم نموذج استشاري قائم على منهجيات بحثية حديثة.",
        ],
        "vision_points_en": [
            "Serve as a trusted reference for legal research relevant to the Kingdom.",
            "Contribute to regional and global conversations on law and governance.",
            "Prepare a new generation of Saudi legal researchers.",
            "Offer a contemporary advisory model rooted in sound methodology.",
        ],
        # Objectives
        "objectives_eyebrow_ar": "الأهداف",
        "objectives_eyebrow_en": "Objectives",
        "objectives_title_ar": "خمسة أهداف تحدد أولوياتنا البحثية.",
        "objectives_title_en": "Five priorities that shape our research.",
        "objectives": [
            {"id": uid(), "sort_order": i + 1, **o}
            for i, o in enumerate([
                {"title_ar": "النهوض بالدراسات القانونية", "title_en": "Advancing Legal Studies",
                 "description_ar": "إنتاج بحثي نوعي وطويل المدى، لمعالجة القضايا ذات الصلة بالقانون والحوكمة والسياسات في المملكة.",
                 "description_en": "High-quality, long-horizon research addressing law, governance, and policy issues in the Kingdom."},
                {"title_ar": "دعم حوكمة القطاع العام", "title_en": "Supporting Public Sector Governance",
                 "description_ar": "إسناد المؤسسات العامة بدراسات معمّقة ومحايدة في قضايا التشريع والتنظيم والصلاحيات المؤسسية.",
                 "description_en": "Supporting public institutions with in-depth, independent analysis on legislation, regulation, and institutional mandates."},
                {"title_ar": "خدمة القطاع الخاص", "title_en": "Serving the Private Sector",
                 "description_ar": "تقديم خدمات بحثية واستشارية تساعد الكيانات الخاصة على فهم الأطر التنظيمية والمخاطر القانونية.",
                 "description_en": "Research and advisory services helping private entities navigate regulatory frameworks and legal risks."},
                {"title_ar": "بناء القدرات البحثية", "title_en": "Building Research Capabilities",
                 "description_ar": "توجيه الباحثين والممارسين في بداية مسيرتهم المهنية المهتمين بالبحث القانوني المتقدم.",
                 "description_en": "Mentoring early-career researchers and practitioners engaged with advanced legal research."},
                {"title_ar": "تعزيز المعرفة المتاحة للجميع", "title_en": "Promoting Open Access to Knowledge",
                 "description_ar": "إتاحة المخرجات البحثية للجمهور، والإسهام في إثراء النقاش العام حول القضايا القانونية والسياسات.",
                 "description_en": "Making research outputs publicly accessible and enriching public discourse on legal and policy matters."},
            ])
        ],
        # Board of Directors (4 members default)
        "board_eyebrow_ar": "القيادة",
        "board_eyebrow_en": "Leadership",
        "board_title_ar": "مجلس الإدارة",
        "board_title_en": "Board of Directors",
        "board_blurb_ar": "نخبة من القانونيين والمختصين الذين يقودون توجّه المركز البحثي والمؤسسي.",
        "board_blurb_en": "A distinguished group of legal scholars and professionals steering the Center's research and institutional direction.",
        "board_members": [
            {"id": uid(), "sort_order": 1,
             "name_ar": "د. فيصل القحطاني", "name_en": "Dr. Faisal Al-Qahtani",
             "role_ar": "رئيس مجلس الإدارة", "role_en": "Chairman of the Board",
             "bio_ar": "أستاذ القانون التجاري، خبرة تزيد عن عشرين عاماً في الاستشارات والتشريع.",
             "bio_en": "Professor of commercial law with over two decades of advisory and legislative experience.",
             "image_url": "",
             "linkedin": ""},
            {"id": uid(), "sort_order": 2,
             "name_ar": "د. نوال السبيعي", "name_en": "Dr. Nawal Al-Subaie",
             "role_ar": "نائبة الرئيس", "role_en": "Vice Chair",
             "bio_ar": "متخصصة في السياسات العامة والقانون الإداري، باحثة معتمدة في عدد من المراكز الدولية.",
             "bio_en": "Specialist in public policy and administrative law, affiliated with leading international research centres.",
             "image_url": "",
             "linkedin": ""},
            {"id": uid(), "sort_order": 3,
             "name_ar": "أ. عبدالعزيز الراشد", "name_en": "Mr. Abdulaziz Al-Rashid",
             "role_ar": "عضو مجلس", "role_en": "Board Member",
             "bio_ar": "مستشار قانوني في الحوكمة المؤسسية وأطر الامتثال للقطاعين العام والخاص.",
             "bio_en": "Legal advisor on corporate governance and compliance frameworks across public and private sectors.",
             "image_url": "",
             "linkedin": ""},
            {"id": uid(), "sort_order": 4,
             "name_ar": "د. هند العنزي", "name_en": "Dr. Hind Al-Anazi",
             "role_ar": "عضو مجلس", "role_en": "Board Member",
             "bio_ar": "باحثة في الفقه المعاصر والقانون المقارن، مهتمة بقضايا الحوكمة الرقمية.",
             "bio_en": "Scholar of contemporary jurisprudence and comparative law with a focus on digital governance.",
             "image_url": "",
             "linkedin": ""},
        ],
        # Success partners
        "partners_eyebrow_ar": "شركاء النجاح",
        "partners_eyebrow_en": "Success Partners",
        "partners_title_ar": "نعمل مع كيانات رائدة",
        "partners_title_en": "We work with leading institutions",
        "partners_blurb_ar": "شراكات بحثية ومؤسسية مع جهات حكومية وأكاديمية تُعزّز أثر المركز.",
        "partners_blurb_en": "Research and institutional partnerships with government, academic, and professional entities that amplify the Center's impact.",
        "partners": [
            {"id": uid(), "sort_order": i + 1, "name_ar": "", "name_en": "", "logo_url": "", "link": ""}
            for i in range(6)
        ],
        # Contact CTA
        "contact_eyebrow_ar": "تواصل",
        "contact_eyebrow_en": "Contact",
        "contact_title_ar": "نرحّب بالتعاون البحثي والاستفسارات المؤسسية.",
        "contact_title_en": "We welcome research collaboration and institutional enquiries.",
        "contact_blurb_ar": "تواصل مع فريق المركز لمناقشة الشراكات أو طلب دراسة قانونية مخصصة.",
        "contact_blurb_en": "Reach out to discuss research partnerships or request a bespoke legal study.",
        "contact_cta_label_ar": "تواصل معنا",
        "contact_cta_label_en": "Get in touch",
        "contact_cta_link": "/contact",
        # Default Hero background image (admins can override from /admin/about)
        "section_styles": {
            "hero": {
                "bg": {
                    "url": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=2400",
                    "focal_x": 50, "focal_y": 50,
                    "overlay_opacity": 0.62,
                    "enabled": True,
                }
            },
        },
        "updated_at": utc_iso(),
    }
    await _upsert_if_seed(db.about_content, {"id": "about"}, about_defaults)

    # ---- Image asset slots ----
    # Only slots actually consumed by the active public theme (Theme B) are
    # seeded. Adding more here would surface as orphan rows in /admin/images
    # that have no public effect. To wire up a new visual, add a consumer
    # component first, then add the slot here.
    image_slots = [
        {
            "slot_key": "about_image",
            "title_ar": "صورة قسم \"عن المركز\"",
            "title_en": "About section image",
            "usage_note_ar": "صورة جانبية ترافق قسم \"عن المركز\" — مكتبات أو فضاءات بحثية.",
            "usage_note_en": "Side image paired with the About section — libraries or research spaces.",
            "url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600",
            "alt_ar": "مكتبة بحثية",
            "alt_en": "Research library",
            "active": True,
            "recommended_width": 1600, "recommended_height": 2000,
            "aspect_ratio": "4:5 (portrait editorial)",
            "sort_order": 1,
        },
        {
            "slot_key": "objectives_background",
            "title_ar": "خلفية قسم الأهداف",
            "title_en": "Objectives section background",
            "usage_note_ar": "صورة خلفية للأهداف بلون داكن مع طبقة شفافة. اختياري.",
            "usage_note_en": "Optional dark-mode background image behind objectives.",
            "url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2400",
            "alt_ar": "نسيج معماري داكن",
            "alt_en": "Dark architectural texture",
            "active": False,
            "recommended_width": 2400, "recommended_height": 1400,
            "aspect_ratio": "12:7",
            "sort_order": 2,
        },
        {
            "slot_key": "foundations_background",
            "title_ar": "خلفية قسم \"المنطلقات\" (الرسالة والرؤية)",
            "title_en": "Foundations section background (Mission & Vision)",
            "usage_note_ar": "صورة خلفية اختيارية لقسم المنطلقات/الرسالة والرؤية. عند التفعيل تحلّ محل خلفية الورق الدافئ.",
            "usage_note_en": "Optional background for the Foundations / Mission & Vision band. When active it replaces the warm paper background.",
            "url": "",
            "alt_ar": "خلفية المنطلقات",
            "alt_en": "Foundations backdrop",
            "active": False,
            "recommended_width": 2400, "recommended_height": 1400,
            "aspect_ratio": "12:7",
            "sort_order": 3,
        },
        {
            "slot_key": "fields_of_work_background",
            "title_ar": "خلفية قسم \"مجالات العمل\"",
            "title_en": "Fields of Work section background",
            "usage_note_ar": "صورة خلفية اختيارية لقسم مجالات العمل. اختر صورة هادئة لتُبقي الكروت قابلة للقراءة.",
            "usage_note_en": "Optional background for the Fields of Work band. Pick a calm image so the cards remain readable.",
            "url": "",
            "alt_ar": "خلفية مجالات العمل",
            "alt_en": "Fields of work backdrop",
            "active": False,
            "recommended_width": 2400, "recommended_height": 1400,
            "aspect_ratio": "12:7",
            "sort_order": 4,
        },
        {
            "slot_key": "library_background",
            "title_ar": "خلفية قسم \"المكتبة البحثية\" (أحدث الإصدارات)",
            "title_en": "Research Library section background (Latest Publications)",
            "usage_note_ar": "صورة خلفية اختيارية لقسم المكتبة البحثية على الصفحة الرئيسية.",
            "usage_note_en": "Optional background image for the Research Library / Latest Publications band on the home page.",
            "url": "",
            "alt_ar": "خلفية المكتبة البحثية",
            "alt_en": "Research library backdrop",
            "active": False,
            "recommended_width": 2400, "recommended_height": 1400,
            "aspect_ratio": "12:7",
            "sort_order": 5,
        },
    ]
    for slot in image_slots:
        existing = await db.image_assets.find_one({"slot_key": slot["slot_key"]})
        if existing is None:
            slot["_seed_origin"] = SEED_ORIGIN
            slot["created_at"] = utc_iso()
            slot["updated_at"] = utc_iso()
            await db.image_assets.insert_one(slot)
        elif existing.get("_seed_origin") != "admin":
            # Refresh seed-owned slot (preserve admin edits)
            slot["_seed_origin"] = SEED_ORIGIN
            slot["updated_at"] = utc_iso()
            await db.image_assets.update_one({"slot_key": slot["slot_key"]}, {"$set": slot})
    await db.image_assets.create_index("slot_key", unique=True)

    # Categories — from DEFAULT_FIELDS
    home_doc = await db.home_content.find_one({"id": "home"}, {"_id": 0})
    fields_list = home_doc.get("fields_of_work") if home_doc else DEFAULT_FIELDS
    for f in fields_list:
        existing_cat = await db.categories.find_one({"id": f["id"]}) if f.get("id") else None
        doc = {
            "id": f["id"] or uid(),
            "title_ar": f["title_ar"], "title_en": f["title_en"],
            "description_ar": f.get("description_ar", ""), "description_en": f.get("description_en", ""),
            "icon": f.get("icon", "book-open"),
            "sort_order": f.get("sort_order", 0),
            "active": True, "updated_at": utc_iso(),
        }
        if not existing_cat:
            doc["_seed_origin"] = SEED_ORIGIN
            doc["created_at"] = utc_iso()
            await db.categories.insert_one(doc)
        elif existing_cat.get("_seed_origin") != "admin":
            doc["_seed_origin"] = SEED_ORIGIN
            await db.categories.update_one({"id": doc["id"]}, {"$set": doc})

    # Authors (seed only if missing)
    for seed_author in [
        {"name_ar": "د. عبدالله الحارثي", "name_en": "Dr. Abdullah Al-Harithi",
         "title_ar": "باحث أول", "title_en": "Senior Researcher",
         "bio_ar": "باحث قانوني متخصص في الدراسات التشريعية والحوكمة.",
         "bio_en": "Legal researcher specialising in legislative studies and governance."},
        {"name_ar": "أ. ريم القحطاني", "name_en": "Ms. Reem Al-Qahtani",
         "title_ar": "باحثة في السياسات العامة", "title_en": "Public Policy Researcher",
         "bio_ar": "متخصصة في تحليل السياسات العامة وأثرها التنظيمي.",
         "bio_en": "Specialist in public policy analysis and its regulatory impact."},
    ]:
        exists = await db.authors.find_one({"name_en": seed_author["name_en"]})
        if not exists:
            await db.authors.insert_one({
                "id": uid(), **seed_author, "active": True,
                "_seed_origin": SEED_ORIGIN,
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Publications — seeded only if collection empty (CMS owns them afterwards)
    existing_pubs = await db.publications.count_documents({})
    if existing_pubs == 0:
        cats = await db.categories.find({}, {"_id": 0, "id": 1}).to_list(length=10)
        authors_list = await db.authors.find({}, {"_id": 0, "id": 1}).to_list(length=10)
        seeds = [
            {"title_ar": "تطور الأنظمة التشريعية في المملكة العربية السعودية",
             "title_en": "The Evolution of Legislative Systems in the Kingdom of Saudi Arabia",
             "publication_type": "study",
             "summary_ar": "دراسة تستعرض مراحل التطور التشريعي وأثرها على البناء المؤسسي للدولة الحديثة.",
             "summary_en": "A study reviewing stages of legislative development and their impact on modern state-building.",
             "tags": ["تشريع", "حوكمة"], "featured": True, "access_level": "preview_login",
             "reading_time_minutes": 18, "view_count": 412},
            {"title_ar": "قراءة في ضوابط السياسة العامة وأثرها على بيئة الأعمال",
             "title_en": "Reading Public Policy Frameworks and Their Impact on Business",
             "publication_type": "policy_paper",
             "summary_ar": "ورقة سياسات تبحث في توازن البيئة التنظيمية.",
             "summary_en": "A policy paper on balancing regulatory oversight with private sector enablement.",
             "tags": ["سياسات عامة", "تنظيم"], "featured": True, "access_level": "public",
             "reading_time_minutes": 12, "view_count": 278},
            {"title_ar": "حوكمة الذكاء الاصطناعي: إطار قانوني مقترح",
             "title_en": "Governing Artificial Intelligence: A Proposed Legal Framework",
             "publication_type": "research",
             "summary_ar": "بحث يقترح إطاراً قانونياً لحوكمة تقنيات الذكاء الاصطناعي.",
             "summary_en": "Research proposing a legal framework for AI governance.",
             "tags": ["ذكاء اصطناعي", "حوكمة"], "featured": False, "access_level": "registered",
             "reading_time_minutes": 25, "view_count": 164},
        ]
        for i, p in enumerate(seeds):
            doc = {
                "id": uid(),
                "title_ar": p["title_ar"], "title_en": p["title_en"],
                "slug_ar": f"lizam-pub-{i+1}", "slug_en": f"lizam-pub-{i+1}",
                "summary_ar": p["summary_ar"], "summary_en": p["summary_en"],
                "content_html_ar": sanitize_html(
                    f"<h2>ملخص</h2><p>{p['summary_ar']}</p><h2>المقدمة</h2>"
                    "<p>تتناول هذه الدراسة مسألة جوهرية من مسائل القانون والحوكمة في المملكة العربية السعودية.</p>"
                    "<h2>النتائج</h2><ul><li>رصد اتجاهات واضحة.</li><li>تحديد الفجوات المؤسسية.</li></ul>"
                    "<blockquote>لا يمكن إعادة بناء المؤسسات دون فهم دقيق لسياقها.</blockquote>"
                ),
                "content_html_en": sanitize_html(
                    f"<h2>Abstract</h2><p>{p['summary_en']}</p><h2>Introduction</h2>"
                    "<p>This study addresses a core question of law and governance in the Kingdom.</p>"
                    "<h2>Findings</h2><ul><li>Identifies clear trends.</li><li>Maps institutional gaps.</li></ul>"
                    "<blockquote>Legal institutions cannot be rebuilt without precise context.</blockquote>"
                ),
                "preview_html_ar": f"<p>{p['summary_ar']}</p>",
                "preview_html_en": f"<p>{p['summary_en']}</p>",
                "publication_type": p["publication_type"],
                "category_id": cats[i % len(cats)]["id"] if cats else None,
                "author_ids": [authors_list[i % len(authors_list)]["id"]] if authors_list else [],
                "cover_image_url": "", "pdf_file_url": "",
                "external_pdf_url": "https://example.com/lizam-sample.pdf",
                "access_level": p["access_level"],
                "pdf_access_level": "public" if p["access_level"] == "public" else "login_required",
                "responses_enabled": True, "featured": p["featured"], "status": "published",
                "published_at": utc_iso(), "updated_at": utc_iso(),
                "view_count": p["view_count"], "reading_time_minutes": p["reading_time_minutes"],
                "tags": p["tags"], "related_publication_ids": [],
                "created_by": ADMIN_EMAIL, "updated_by": ADMIN_EMAIL,
                "created_at": utc_iso(), "_seed_origin": SEED_ORIGIN,
            }
            await db.publications.insert_one(doc)

    # ---- Hero media (per-page hero background images) ----
    # Seeds the global default + a few per-page records. _upsert_if_seed
    # respects admin edits — once an editor changes a record, the seed will
    # never overwrite it.
    hero_defaults = [
        {
            "page_key": "_default",
            "media_type": "image",
            "url": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=2400",
            "overlay_opacity": 0.55,
            "focal_x": 50, "focal_y": 50,
            "enabled": True,
            "alt_ar": "منظر معماري كلاسيكي للمكتبة",
            "alt_en": "Classical library architectural view",
            "updated_at": utc_iso(),
        },
        {
            "page_key": "home",
            "media_type": "image",
            "url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2400",
            "overlay_opacity": 0.55,
            "focal_x": 50, "focal_y": 45,
            "enabled": True,
            "alt_ar": "مساحة عمل بحثية",
            "alt_en": "Research workspace",
            "updated_at": utc_iso(),
        },
        {
            "page_key": "publications",
            "media_type": "image",
            "url": "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=2400",
            "overlay_opacity": 0.55,
            "focal_x": 50, "focal_y": 50,
            "enabled": True,
            "alt_ar": "أرشيف الإصدارات",
            "alt_en": "Publications archive",
            "updated_at": utc_iso(),
        },
        {
            "page_key": "publication_detail",
            "media_type": "image",
            "url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=2400",
            "overlay_opacity": 0.62,
            "focal_x": 50, "focal_y": 45,
            "enabled": True,
            "alt_ar": "خلفية صفحة الإصدار",
            "alt_en": "Publication detail backdrop",
            "updated_at": utc_iso(),
        },
    ]
    for doc in hero_defaults:
        await _upsert_if_seed(db.hero_media, {"page_key": doc["page_key"]}, {**doc, "id": uid()})

    logger.info("Seed complete (guarded)")
