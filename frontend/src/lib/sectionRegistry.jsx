import { useEffect, useState } from "react";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { api } from "@/lib/api";

// Section types available in the page builder
export const SECTION_TYPES = {
  page_hero: {
    label_ar: "بطل الصفحة (Hero)",
    label_en: "Page Hero",
    icon: "Layout",
    defaultConfig: {
      eyebrow_ar: "", eyebrow_en: "",
      title_ar: "", title_en: "",
      subtitle_ar: "", subtitle_en: "",
      bg_image_url: "", overlay: 0.6,
    },
    configFields: [
      { key: "eyebrow_ar", type: "text", label_ar: "Eyebrow — عربية", label_en: "Eyebrow AR", dir: "rtl" },
      { key: "eyebrow_en", type: "text", label_ar: "Eyebrow — إنجليزية", label_en: "Eyebrow EN" },
      { key: "title_ar", type: "text", label_ar: "العنوان — عربية", label_en: "Title AR", dir: "rtl" },
      { key: "title_en", type: "text", label_ar: "العنوان — إنجليزية", label_en: "Title EN" },
      { key: "subtitle_ar", type: "textarea", label_ar: "الوصف — عربية", label_en: "Subtitle AR", dir: "rtl" },
      { key: "subtitle_en", type: "textarea", label_ar: "الوصف — إنجليزية", label_en: "Subtitle EN" },
      { key: "bg_image_url", type: "image", label_ar: "صورة خلفية", label_en: "Background image" },
    ]
  },
  rich_text: {
    label_ar: "نص حر",
    label_en: "Rich Text",
    icon: "FileText",
    defaultConfig: { content_ar: "", content_en: "" },
    configFields: [
      { key: "content_ar", type: "richtext", label_ar: "المحتوى — عربية", label_en: "Content AR", dir: "rtl" },
      { key: "content_en", type: "richtext", label_ar: "المحتوى — إنجليزية", label_en: "Content EN" },
    ]
  },
  publications_feed: {
    label_ar: "أحدث الإصدارات",
    label_en: "Publications Feed",
    icon: "BookOpen",
    defaultConfig: { title_ar: "أحدث الإصدارات", title_en: "Latest Publications", count: 3 },
    configFields: [
      { key: "title_ar", type: "text", label_ar: "العنوان — عربية", label_en: "Title AR", dir: "rtl" },
      { key: "title_en", type: "text", label_ar: "العنوان — إنجليزية", label_en: "Title EN" },
      { key: "count", type: "number", label_ar: "عدد الإصدارات", label_en: "Number of items" },
    ]
  },
  contact_cta: {
    label_ar: "دعوة للتواصل",
    label_en: "Contact CTA",
    icon: "Mail",
    defaultConfig: {
      title_ar: "تواصل مع المركز", title_en: "Get in Touch",
      blurb_ar: "", blurb_en: "",
      button_ar: "تواصل معنا", button_en: "Contact Us"
    },
    configFields: [
      { key: "title_ar", type: "text", label_ar: "العنوان — عربية", label_en: "Title AR", dir: "rtl" },
      { key: "title_en", type: "text", label_ar: "العنوان — إنجليزية", label_en: "Title EN" },
      { key: "blurb_ar", type: "textarea", label_ar: "النص — عربية", label_en: "Text AR", dir: "rtl" },
      { key: "blurb_en", type: "textarea", label_ar: "النص — إنجليزية", label_en: "Text EN" },
    ]
  },
};

// Section renderer — used on public pages
export function SectionRenderer({ section, pageKey }) {
  const { lang } = useLang();
  const { type, config = {} } = section;

  switch (type) {
    case "page_hero":
      return <PageHeroSection config={config} pageKey={pageKey} lang={lang} />;
    case "rich_text":
      return <RichTextSection config={config} lang={lang} />;
    case "publications_feed":
      return <PublicationsFeedSection config={config} lang={lang} />;
    case "contact_cta":
      return <ContactCtaSection config={config} lang={lang} />;
    default:
      // Library sections (type like "home:about", "about:board", etc.)
      if (type && type.includes(":")) {
        return <LibrarySectionRenderer type={type} config={config} lang={lang} />;
      }
      return null;
  }
}

// ---------------------------------------------------------------------------
// Individual section components
// ---------------------------------------------------------------------------

function PageHeroSection({ config, pageKey, lang }) {
  return (
    <section
      className="relative isolate overflow-hidden flex flex-col"
      style={{ minHeight: "50vh", background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
    >
      <HeroMediaLayer pageKey={pageKey || "default"} extendBehindHeader />
      <div style={{ paddingTop: "clamp(130px, 16vh, 180px)" }} />
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-16 mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-14">
        {(config[`eyebrow_${lang}`] || config.eyebrow_ar) && (
          <div className="flex items-center gap-3 mb-4">
            <span style={{ height: 1, width: 28, background: "var(--tb-gold, #B08C5A)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, letterSpacing: lang === "ar" ? "0.02em" : "0.22em", color: "var(--tb-gold, #B08C5A)" }} className="uppercase">
              {config[`eyebrow_${lang}`] || config.eyebrow_ar}
            </span>
          </div>
        )}
        <h1
          className="tb-display"
          style={{ fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.15, color: "var(--tb-paper-base, #FBFAF7)" }}
        >
          {config[`title_${lang}`] || config.title_ar || ""}
        </h1>
        {(config[`subtitle_${lang}`] || config.subtitle_ar) && (
          <p className="mt-5 max-w-[60ch]" style={{ fontSize: "clamp(14px, 1.5vw, 16.5px)", lineHeight: 1.8, color: "rgba(251,250,247,0.78)" }}>
            {config[`subtitle_${lang}`] || config.subtitle_ar}
          </p>
        )}
      </div>
    </section>
  );
}

function RichTextSection({ config, lang }) {
  const html = config[`content_${lang}`] || config.content_ar || "";
  if (!html) return null;
  return (
    <section className="py-16 md:py-20" style={{ background: "var(--tb-ivory, #F7F5F0)" }}>
      <div className="mx-auto max-w-[860px] px-6 md:px-10">
        <div className="lz-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

function PublicationsFeedSection({ config, lang }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get(`/public/publications?limit=${config.count || 3}&sort=latest`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {});
  }, [config.count]);

  return (
    <section className="py-16 md:py-20" style={{ background: "var(--tb-paper, #F7F8FA)" }}>
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
        {(config[`title_${lang}`] || config.title_ar) && (
          <h2
            className="tb-display mb-10"
            style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", color: "var(--tb-navy-deep, #0A111C)" }}
          >
            {config[`title_${lang}`] || config.title_ar}
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((pub) => {
            const title = pub[`title_${lang}`] || pub.title_ar || "";
            const slug = pub[`slug_${lang}`] || pub.slug_ar || pub.id;
            return (
              <a
                key={pub.id}
                href={`/publications/${slug}`}
                className="group block bg-white border border-rule hover:border-brass transition-colors p-5"
              >
                <h3
                  className="text-[15px] font-medium text-navy-deep leading-snug line-clamp-3"
                  style={{ fontFamily: '"Thmanyah Serif Display", serif' }}
                >
                  {title}
                </h3>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContactCtaSection({ config, lang }) {
  return (
    <section
      className="py-16 md:py-20"
      style={{ background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
    >
      <div className="mx-auto max-w-[700px] px-6 text-center">
        <h2 className="tb-display" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}>
          {config[`title_${lang}`] || config.title_ar || ""}
        </h2>
        {(config[`blurb_${lang}`] || config.blurb_ar) && (
          <p className="mt-4 text-[15px] leading-[1.8] opacity-75">
            {config[`blurb_${lang}`] || config.blurb_ar}
          </p>
        )}
        <a
          href="/contact"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-brass text-brass hover:bg-brass hover:text-navy-deep transition-colors"
        >
          {config[`button_${lang}`] || config.button_ar || (lang === "ar" ? "تواصل معنا" : "Contact Us")}
        </a>
      </div>
    </section>
  );
}

/* ── Generic Library Section Renderer ─────────────────────────────────────
   Handles all "page:section_id" types from the library.
   Detects content shape and renders appropriately.
──────────────────────────────────────────────────────────────────────────── */
function LibrarySectionRenderer({ type, config, lang }) {
  // Helper: get bilingual value
  const t = (arKey, enKey) =>
    lang === "ar" ? (config[arKey] || config[enKey] || "")
                  : (config[enKey] || config[arKey] || "");

  // Style settings from _styles (set in ExtraSectionsManager)
  const styles = config._styles || {};
  const bgColor    = styles.bg_color    || null;
  const bgImageUrl = styles.bg?.url     || config.hero_background_url || null;
  const bgOverlay  = styles.bg?.overlay ?? 0.6;
  const gradient   = styles.gradient_accent || null;

  // Detect section kind from type string
  const isHero = type.endsWith(":hero");
  const isContactCta = type.endsWith(":contact_cta");
  const hasBgImage = !!bgImageUrl;

  // --- Hero-style sections ---
  if (isHero) {
    const eyebrow = t("hero_eyebrow_ar", "hero_eyebrow_en");
    const title   = t("hero_title_ar",   "hero_title_en");
    const subtitle= t("hero_subtitle_ar","hero_subtitle_en");
    return (
      <section className="relative isolate overflow-hidden flex flex-col"
        style={{ minHeight: "50vh", background: bgColor || "var(--tb-navy-900,#0A111C)", color: "var(--tb-paper-base,#FBFAF7)" }}>
        {hasBgImage && (
          <img src={bgImageUrl} alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 1 - bgOverlay }} />
        )}
        {!hasBgImage && bgColor && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: bgColor }} />
        )}
        {gradient && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `linear-gradient(to bottom left, transparent 60%, ${gradient}40 100%)` }} />
        )}
        <div style={{ paddingTop: "clamp(120px,14vh,160px)" }} />
        <div className="relative z-10 flex-1 flex flex-col justify-end pb-14 mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-14">
          {eyebrow && (
            <div className="flex items-center gap-3 mb-4">
              <span style={{ height:1,width:24,background:"var(--tb-gold,#B08C5A)",flexShrink:0 }} />
              <span className="tb-overline" style={{ color:"var(--tb-gold,#B08C5A)" }}>{eyebrow}</span>
            </div>
          )}
          {title && <h2 className="tb-display" style={{ fontSize:"clamp(1.8rem,3.2vw,2.8rem)",lineHeight:1.2 }}>{title}</h2>}
          {subtitle && <p className="mt-4 max-w-[60ch]" style={{ fontSize:"clamp(14px,1.4vw,16px)",lineHeight:1.8,color:"rgba(251,250,247,0.78)" }}>{subtitle}</p>}
        </div>
      </section>
    );
  }

  // --- Contact CTA sections ---
  if (isContactCta) {
    const title  = t("contact_title_ar",  "contact_title_en")  || t("title_ar","title_en");
    const blurb  = t("contact_blurb_ar",  "contact_blurb_en")  || t("blurb_ar","blurb_en");
    const label  = t("contact_cta_label_ar","contact_cta_label_en") || (lang==="ar"?"تواصل معنا":"Contact Us");
    return (
      <section className="py-20" style={{ background:"var(--tb-navy-900,#0A111C)",color:"var(--tb-paper-base,#FBFAF7)" }}>
        <div className="mx-auto max-w-[700px] px-6 text-center">
          {title && <h2 className="tb-display" style={{ fontSize:"clamp(1.5rem,2.4vw,2rem)" }}>{title}</h2>}
          {blurb && <p className="mt-4 opacity-75" style={{ fontSize:15,lineHeight:1.8 }}>{blurb}</p>}
          <a href="/contact" className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-brass text-brass hover:bg-brass hover:text-navy-deep transition-colors">
            {label}
          </a>
        </div>
      </section>
    );
  }

  // --- Generic text+content sections ---
  // Try to find eyebrow, title, body fields dynamically
  const eyebrow = config[`${type.split(":")[1]}_eyebrow_${lang}`]
    || config[`eyebrow_${lang}`]
    || config.eyebrow_ar || config.eyebrow_en || "";

  // Collect all text content from config
  const titleKeys   = Object.keys(config).filter(k => k.includes("title") && k.endsWith(`_${lang}`));
  const bodyKeys    = Object.keys(config).filter(k => (k.includes("body")||k.includes("blurb")||k.includes("ar")&&!k.includes("_en")) && k.endsWith(`_${lang}`));
  const imageKey    = Object.keys(config).find(k => k.includes("image_url") || k.includes("background_url"));

  const mainTitle   = titleKeys.length ? config[titleKeys[0]] : "";
  const mainBody    = bodyKeys.filter(k=>!k.includes("title")).slice(0,2).map(k=>config[k]).filter(Boolean).join(" ");
  const imageUrl    = imageKey ? config[imageKey] : "";

  if (!mainTitle && !mainBody && !eyebrow && !imageUrl) return null;

  const sectionBg = bgColor || "var(--tb-ivory,#F7F5F0)";

  return (
    <section className="py-16 md:py-20 relative" style={{ background: sectionBg }}>
      {gradient && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `linear-gradient(to bottom left, transparent 60%, ${gradient}30 100%)` }} />
      )}
      {bgImageUrl && (
        <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 1 - bgOverlay }} />
      )}
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
        <div className={imageUrl ? "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" : "max-w-[760px]"}>
          <div>
            {eyebrow && (
              <div className="flex items-center gap-2 mb-4">
                <span style={{ height:1,width:20,background:"var(--tb-gold,#B08C5A)" }} />
                <span className="tb-overline" style={{ color:"var(--tb-gold,#B08C5A)" }}>{eyebrow}</span>
              </div>
            )}
            {mainTitle && (
              <h2 className="tb-display" style={{ fontSize:"clamp(1.5rem,2.2vw,2rem)",lineHeight:1.25,color:"var(--tb-navy-deep,#0A111C)" }}>
                {mainTitle}
              </h2>
            )}
            {mainBody && (
              <p className="mt-5" style={{ fontSize:"clamp(14px,1.3vw,16px)",lineHeight:1.9,color:"rgba(28,37,51,0.75)",fontFamily:'"Thmanyah Serif Text",serif' }}>
                {mainBody}
              </p>
            )}
          </div>
          {imageUrl && (
            <div className="overflow-hidden" style={{ aspectRatio:"4/3" }}>
              <img src={imageUrl} alt={mainTitle} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
