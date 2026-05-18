import { useEffect, useState } from "react";
import {
  AdminPage, Field, TextInput, SaveBar, useDirtyForm, apiCall,
} from "@/admin/components/AdminUI";
import {
  SectionCard, BgImageBlock, BgColorControl, GradientAccentControl,
  EyebrowRow, BiInput, moveItem,
} from "@/admin/components/sectionControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const SECTIONS = ["hero", "info", "form"];

const SECTION_LABELS_AR = {
  hero: "البطل (Hero)",
  info: "معلومات التواصل",
  form: "النموذج والرسائل",
};
const SECTION_LABELS_EN = {
  hero: "Hero",
  info: "Contact Info",
  form: "Form & Messages",
};

export default function ContactAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  // Default values that match the page fallbacks — shown when DB is empty
  const DEFAULTS = {
    hero_eyebrow_ar: "تواصل معنا", hero_eyebrow_en: "Contact Us",
    hero_title_ar: "تواصل مع المركز", hero_title_en: "Get in Touch",
    hero_subtitle_ar: "نرحّب بالتعاون البحثي والاستفسارات المؤسسية من القطاعين العام والخاص، ومن الباحثين والممارسين القانونيين.",
    hero_subtitle_en: "We welcome research collaboration and institutional enquiries from the public and private sectors, researchers, and legal practitioners.",
    location_ar: "", location_en: "",
    form_heading_ar: "كيف يمكننا مساعدتك؟", form_heading_en: "How can we help you?",
    form_subheading_ar: "يسعدنا تلقي استفساراتكم ومقترحاتكم البحثية. يمكنكم التواصل معنا عبر النموذج أو مباشرةً عبر البريد الإلكتروني.",
    form_subheading_en: "We welcome your enquiries and research proposals. You may reach us via the form or directly by email.",
    field_name_ar: "الاسم", field_name_en: "Name",
    field_subject_ar: "الموضوع", field_subject_en: "Subject",
    field_message_ar: "الرسالة", field_message_en: "Message",
    submit_label_ar: "إرسال الرسالة", submit_label_en: "Send Message",
    consent_ar: "أوافق على معالجة بياناتي للتواصل معي بخصوص رسالتي.",
    consent_en: "I consent to my data being processed so the center can respond to my enquiry.",
    success_title_ar: "شكراً لتواصلك مع المركز", success_title_en: "Thank you for reaching out",
    success_body_ar: "سيقوم فريق المركز بمراجعة رسالتك والرد عليك في أقرب وقت ممكن، وعادةً خلال 3 أيام عمل.",
    success_body_en: "Our team will review your message and respond at the earliest opportunity, usually within 3 business days.",
  };

  useEffect(() => {
    apiCall("get", "/admin/contact-content").then((r) => {
      if (r.ok) {
        // Merge DB data over defaults so empty DB shows current page text
        form.commit({ ...DEFAULTS, ...(r.data || {}) });
      }
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/contact-content", form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      invalidateSiteCache("contact");
      setMsg(tr("تم الحفظ ✓ — صفحة /contact حُدِّثت فوراً.", "Saved ✓ — /contact updated."));
      setTimeout(() => setMsg(""), 3500);
    } else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const visible = form.value.visible_sections || SECTIONS;
  const toggleVisibility = (id) => {
    const next = visible.includes(id) ? visible.filter((s) => s !== id) : [...visible, id];
    form.patch("visible_sections", next);
  };
  const hidden = SECTIONS.filter((s) => !visible.includes(s));
  const sectionLabel = (k) => (lang === "ar" ? SECTION_LABELS_AR[k] : SECTION_LABELS_EN[k]) || k;
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  const orderInfo = (id) => ({
    orderIndex: visible.indexOf(id) >= 0 ? visible.indexOf(id) : undefined,
    orderTotal: visible.length,
  });

  return (
    <AdminPage
      title={tr("محتوى صفحة التواصل", "Contact Page Content")}
      subtitle={tr("داش بورد كامل — قسم بقسم", "Full dashboard — section by section")}
      helpAr="تحكم في نصوص صفحة التواصل: قسم البطل، معلومات التواصل، ونصوص النموذج. الصفحة العامة: /contact"
      helpEn="Edit all text on the Contact page: hero, contact info, and form copy. Public page: /contact."
    >
      <div className="max-w-[1180px] flex flex-col gap-6">

        {/* Hidden sections panel */}
        {hidden.length > 0 && (
          <div className="border border-rule bg-paper px-5 py-4">
            <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">{tr("أقسام مخفية", "Hidden sections")}</div>
            <div className="flex flex-wrap gap-2">
              {hidden.map((k) => (
                <button key={k} type="button" onClick={() => toggleVisibility(k)}
                  className="text-[12px] px-3 py-1 border border-rule bg-white hover:border-brass hover:text-navy-deep">
                  + {sectionLabel(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. HERO                                                        */}
        {/* ============================================================ */}
        <SectionCard id="hero" title={tr("قسم البطل (Hero)", "Hero")}
          eyebrow={tr("١", "1")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("hero")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="hero_eyebrow_ar" keyEn="hero_eyebrow_en"
              sectionKey="hero" testid="contact-hero" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_title_ar" keyEn="hero_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main title" multiline rows={2}
              testid="contact-hero-title" sectionKey="hero" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_subtitle_ar" keyEn="hero_subtitle_en"
              labelAr="النص الفرعي" labelEn="Subtitle" multiline rows={3}
              testid="contact-hero-sub" sectionKey="hero" fieldKey="subtitle" />
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.62}
              label={tr("صورة خلفية البطل", "Hero background image")} />
          </div>
          <BgColorControl form={form} sectionKey="hero" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="hero" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 2. INFO                                                         */}
        {/* ============================================================ */}
        <SectionCard id="info" title={tr("معلومات التواصل", "Contact Info")}
          eyebrow={tr("٢", "2")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("info")} onMove={moveSection}>
          <p className="mt-3 text-[12.5px] text-mute">
            {tr("البريد الإلكتروني يُدار من إعدادات الموقع (contact_email).", "Email is managed in Site Settings (contact_email).")}
          </p>
          <div className="mt-4">
            <BiInput form={form} keyAr="location_ar" keyEn="location_en"
              labelAr="الموقع الجغرافي" labelEn="Location"
              testid="contact-location" sectionKey="info" fieldKey="location" />
          </div>
          <div className="mt-4">
            <Field label={tr("رقم الهاتف (اختياري)", "Phone (optional)")}>
              <TextInput value={form.value.phone || ""} onChange={(v) => form.patch("phone", v)}
                placeholder="+966 xx xxx xxxx" testid="contact-phone" />
            </Field>
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 3. FORM                                                         */}
        {/* ============================================================ */}
        <SectionCard id="form" title={tr("النموذج والرسائل", "Form & Messages")}
          eyebrow={tr("٣", "3")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("form")} onMove={moveSection}>

          <div className="mt-4">
            <BiInput form={form} keyAr="form_heading_ar" keyEn="form_heading_en"
              labelAr="العنوان الرئيسي للقسم" labelEn="Section main heading"
              testid="contact-form-heading" sectionKey="form" fieldKey="heading" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="form_subheading_ar" keyEn="form_subheading_en"
              labelAr="النص التعريفي تحت العنوان" labelEn="Subtitle below heading"
              multiline rows={2}
              testid="contact-form-subheading" sectionKey="form" fieldKey="subheading" />
          </div>

          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("تسميات الحقول", "Field labels")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Field label={tr("حقل الاسم — عربية", "Name field — AR")}>
                <TextInput value={form.value.field_name_ar || ""} onChange={(v) => form.patch("field_name_ar", v)} dir="rtl" placeholder="الاسم" testid="contact-field-name-ar" />
              </Field>
            </div>
            <div>
              <Field label={tr("حقل الاسم — إنجليزية", "Name field — EN")}>
                <TextInput value={form.value.field_name_en || ""} onChange={(v) => form.patch("field_name_en", v)} placeholder="Name" testid="contact-field-name-en" />
              </Field>
            </div>
            <div>
              <Field label={tr("حقل الموضوع — عربية", "Subject field — AR")}>
                <TextInput value={form.value.field_subject_ar || ""} onChange={(v) => form.patch("field_subject_ar", v)} dir="rtl" placeholder="الموضوع" testid="contact-field-subject-ar" />
              </Field>
            </div>
            <div>
              <Field label={tr("حقل الموضوع — إنجليزية", "Subject field — EN")}>
                <TextInput value={form.value.field_subject_en || ""} onChange={(v) => form.patch("field_subject_en", v)} placeholder="Subject" testid="contact-field-subject-en" />
              </Field>
            </div>
            <div>
              <Field label={tr("حقل الرسالة — عربية", "Message field — AR")}>
                <TextInput value={form.value.field_message_ar || ""} onChange={(v) => form.patch("field_message_ar", v)} dir="rtl" placeholder="الرسالة" testid="contact-field-message-ar" />
              </Field>
            </div>
            <div>
              <Field label={tr("حقل الرسالة — إنجليزية", "Message field — EN")}>
                <TextInput value={form.value.field_message_en || ""} onChange={(v) => form.patch("field_message_en", v)} placeholder="Message" testid="contact-field-message-en" />
              </Field>
            </div>
          </div>

          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("زر الإرسال", "Submit button")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label={tr("نص الزر — عربية", "Button label — AR")}>
              <TextInput value={form.value.submit_label_ar || ""} onChange={(v) => form.patch("submit_label_ar", v)} dir="rtl" placeholder="إرسال" testid="contact-submit-ar" />
            </Field>
            <Field label={tr("نص الزر — إنجليزية", "Button label — EN")}>
              <TextInput value={form.value.submit_label_en || ""} onChange={(v) => form.patch("submit_label_en", v)} placeholder="Send" testid="contact-submit-en" />
            </Field>
          </div>

          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("نص الموافقة (Consent)", "Consent text")}</h4>
          <div className="mt-2">
            <BiInput form={form} keyAr="consent_ar" keyEn="consent_en"
              labelAr="نص الموافقة — عربية / إنجليزية" labelEn="Consent copy — AR / EN"
              multiline rows={2} testid="contact-consent" sectionKey="form" fieldKey="consent" />
          </div>

          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("رسالة النجاح", "Success message")}</h4>
          <div className="mt-2">
            <BiInput form={form} keyAr="success_title_ar" keyEn="success_title_en"
              labelAr="عنوان الرسالة" labelEn="Success heading"
              testid="contact-success-title" sectionKey="form" fieldKey="success_title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="success_body_ar" keyEn="success_body_en"
              labelAr="نص الرسالة" labelEn="Success body" multiline rows={3}
              testid="contact-success-body" sectionKey="form" fieldKey="success_body" />
          </div>

        </SectionCard>

      </div>


      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}
