import { useState } from "react";
import Reveal from "@/components/theme-b/Reveal";
import { Mail, MapPin, Phone, Send, Clock, ArrowLeft, ArrowRight, Twitter, Linkedin, Youtube, Facebook, Instagram } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings, useContactContent } from "@/hooks/useSiteSettings";
import { api, formatApiError } from "@/lib/api";
import { getTextAlign } from "@/lib/sectionTypo";

export default function ContactPage() {
  const { lang, t } = useLang();
  const isRtl = lang === "ar";
  const { data: site } = useSiteSettings();
  const { data: contact } = useContactContent();
  const ga = (section, field) => getTextAlign(contact, section, field) || undefined;

  const contactEyebrow = contact?.[`hero_eyebrow_${lang}`] || (isRtl ? "تواصل معنا" : "Contact Us");
  const heroTitle    = contact?.[`hero_title_${lang}`]    || (isRtl ? "تواصل مع المركز" : "Get in Touch");
  const heroSubtitle = contact?.[`hero_subtitle_${lang}`] || (isRtl
    ? "نرحّب بالتعاون البحثي والاستفسارات المؤسسية من القطاعين العام والخاص، ومن الباحثين والممارسين القانونيين."
    : "We welcome research collaboration and institutional enquiries from the public and private sectors, researchers, and legal practitioners.");

  // location: contact-content override → site address → hardcoded fallback
  const locationValue = contact?.[`location_${lang}`]
    || (isRtl ? site?.address_ar : site?.address_en)
    || (isRtl ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia");
  const formHeading    = contact?.[`form_heading_${lang}`]    || (isRtl ? "كيف يمكننا مساعدتك؟" : "How can we help you?");
  const formSubheading = contact?.[`form_subheading_${lang}`]
    || (isRtl
      ? "يسعدنا تلقي استفساراتكم ومقترحاتكم البحثية. يمكنكم التواصل معنا عبر النموذج أو مباشرةً عبر البريد الإلكتروني."
      : "We welcome your enquiries and research proposals. You may reach us via the form or directly by email.");
  const fieldName     = contact?.[`field_name_${lang}`]    || (isRtl ? "الاسم" : "Name");
  const fieldSubject  = contact?.[`field_subject_${lang}`] || (isRtl ? "الموضوع" : "Subject");
  const fieldMessage  = contact?.[`field_message_${lang}`] || (isRtl ? "الرسالة" : "Message");
  const submitLabel   = contact?.[`submit_label_${lang}`]  || (isRtl ? "إرسال الرسالة" : "Send Message");
  const consentText   = contact?.[`consent_${lang}`] || (isRtl
    ? "أوافق على معالجة بياناتي للتواصل معي بخصوص رسالتي."
    : "I consent to my data being processed so the center can respond to my enquiry.");
  const successTitle = contact?.[`success_title_${lang}`] || (isRtl ? "شكراً لتواصلك مع المركز" : "Thank you for reaching out");
  const successBody  = contact?.[`success_body_${lang}`]  || (isRtl
    ? "سيقوم فريق المركز بمراجعة رسالتك والرد عليك في أقرب وقت ممكن، وعادةً خلال 3 أيام عمل."
    : "Our team will review your message and respond at the earliest opportunity, usually within 3 business days.");

  const email  = site?.contact_email || "info@lizam.sa";
  const phone  = contact?.phone || site?.phone || "";

  // Social links from site settings — only show ones that are filled
  const socials = site?.social_links || {};
  const socialItems = [
    { key: "twitter",   label: "Twitter / X", icon: <Twitter size={14} strokeWidth={1.5} />,   href: socials.twitter },
    { key: "linkedin",  label: "LinkedIn",     icon: <Linkedin size={14} strokeWidth={1.5} />,  href: socials.linkedin },
    { key: "youtube",   label: "YouTube",      icon: <Youtube size={14} strokeWidth={1.5} />,   href: socials.youtube },
    { key: "facebook",  label: "Facebook",     icon: <Facebook size={14} strokeWidth={1.5} />,  href: socials.facebook },
    { key: "instagram", label: "Instagram",    icon: <Instagram size={14} strokeWidth={1.5} />, href: socials.instagram },
  ].filter((s) => s.href);

  const [form, setForm]         = useState({ name: "", email: "", subject: "", message: "", consent: false });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");
  const [sending, setSending]   = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.consent) {
      setError(isRtl ? "يرجى الموافقة على معالجة البيانات." : "Please agree to the data-processing notice.");
      return;
    }
    setSending(true);
    try {
      await api.post("/public/contact", form);
      setSubmitted(true);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message || "Submission failed.");
    } finally {
      setSending(false);
    }
  }

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <PublicLayout>

      {/* ─────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────── */}
      <section
        className="relative isolate overflow-hidden pt-[140px] md:pt-[160px] pb-20 md:pb-24 min-h-[62vh]"
        style={{ background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
        data-testid="contact-masthead"
      >
        <HeroMediaLayer pageKey="contact" extendBehindHeader />
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full min-h-[40vh]">
          <Reveal variant="up">
            <div className="flex items-center gap-3">
              <span style={{ height: 1, width: 26, background: "var(--tb-gold, #B08C5A)" }} />
              <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>{contactEyebrow}</span>
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h1 className="tb-display mt-5 max-w-[26ch]"
              style={{ color: "var(--tb-paper-base, #FBFAF7)", fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.2 }}>
              {heroTitle}
            </h1>
          </Reveal>
          <Reveal variant="up" delay={2}>
            <p className="mt-6 max-w-[58ch]"
              style={{ color: "rgba(251,250,247,0.82)", fontSize: "1.0625rem", lineHeight: 1.85, whiteSpace: "pre-line", textAlign: ga("hero","subtitle") }}>
              {heroSubtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          CONTACT CHANNELS STRIP
      ───────────────────────────────────────────── */}
      <div
        style={{ background: "var(--tb-navy-800, #0F1929)" }}
        data-testid="contact-channels"
      >
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10" style={{ direction: isRtl ? "rtl" : "ltr" }}>

            {/* Email */}
            <div className="flex items-start gap-4 py-8 px-2 md:px-6">
              <div
                className="shrink-0 w-10 h-10 flex items-center justify-center"
                style={{ border: "1px solid rgba(176,140,90,0.35)", color: "var(--tb-gold, #B08C5A)" }}
              >
                <Mail size={18} strokeWidth={1.4} />
              </div>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "rgba(251,250,247,0.45)" }} className="uppercase mb-1">
                  {isRtl ? "البريد الإلكتروني" : "Email"}
                </div>
                <a
                  href={`mailto:${email}`}
                  className="text-[15px] hover:text-yellow-300 transition-colors"
                  style={{ color: "var(--tb-paper-base, #FBFAF7)", direction: "ltr", unicodeBidi: "embed" }}
                  data-testid="contact-page-email"
                >
                  {email}
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-4 py-8 px-2 md:px-6">
              <div
                className="shrink-0 w-10 h-10 flex items-center justify-center"
                style={{ border: "1px solid rgba(176,140,90,0.35)", color: "var(--tb-gold, #B08C5A)" }}
              >
                <MapPin size={18} strokeWidth={1.4} />
              </div>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "rgba(251,250,247,0.45)" }} className="uppercase mb-1">
                  {isRtl ? "الموقع" : "Location"}
                </div>
                <div className="text-[15px]" style={{ color: "var(--tb-paper-base, #FBFAF7)" }}>
                  {locationValue}
                </div>
              </div>
            </div>

            {/* Phone or Response time */}
            <div className="flex items-start gap-4 py-8 px-2 md:px-6">
              <div
                className="shrink-0 w-10 h-10 flex items-center justify-center"
                style={{ border: "1px solid rgba(176,140,90,0.35)", color: "var(--tb-gold, #B08C5A)" }}
              >
                {phone ? <Phone size={18} strokeWidth={1.4} /> : <Clock size={18} strokeWidth={1.4} />}
              </div>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "rgba(251,250,247,0.45)" }} className="uppercase mb-1">
                  {phone ? (isRtl ? "الهاتف" : "Phone") : (isRtl ? "وقت الاستجابة" : "Response Time")}
                </div>
                <div className="text-[15px]" style={{ color: "var(--tb-paper-base, #FBFAF7)" }}>
                  {phone
                    ? <a href={`tel:${phone}`} className="hover:text-yellow-300 transition-colors">{phone}</a>
                    : (isRtl ? "خلال 3 أيام عمل" : "Within 3 business days")
                  }
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          FORM + SIDEBAR
      ───────────────────────────────────────────── */}
      <section
        className="py-20 md:py-28"
        style={{ background: "var(--tb-ivory, #F7F5F0)" }}
        data-testid="contact-form-section"
      >
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">

          {/* Section heading — centered */}
          <div className="mb-12 md:mb-16 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span style={{ height: 1, width: 24, background: "var(--tb-gold, #B08C5A)" }} />
              <span style={{ fontSize: 10.5, letterSpacing: "0.22em", color: "var(--tb-gold, #B08C5A)" }} className="uppercase">
                {isRtl ? "أرسل رسالتك" : "Send a message"}
              </span>
              <span style={{ height: 1, width: 24, background: "var(--tb-gold, #B08C5A)" }} />
            </div>
            <h2
              className="tb-display mx-auto"
              style={{
                color: "var(--tb-navy-deep, #0A111C)",
                fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
                lineHeight: 1.2,
              }}
            >
              {formHeading}
            </h2>
            <p
              className="mt-4 mx-auto"
              style={{
                fontSize: "clamp(14px, 1.4vw, 16px)",
                color: "rgba(28,37,51,0.6)",
                lineHeight: 1.8,
                maxWidth: "62ch",
                whiteSpace: "pre-line",
              }}
            >
              {formSubheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16" style={{ direction: isRtl ? "rtl" : "ltr" }}>

            {/* ── Sidebar ── */}
            <aside className="lg:col-span-4 space-y-8">

              {/* Info cards */}
              <div className="space-y-3">
                <InfoCard
                  icon={<Mail size={15} strokeWidth={1.5} />}
                  label={isRtl ? "البريد الإلكتروني" : "Email address"}
                  value={<a href={`mailto:${email}`} className="hover:text-brass transition-colors break-all">{email}</a>}
                />
                <InfoCard
                  icon={<MapPin size={15} strokeWidth={1.5} />}
                  label={isRtl ? "الموقع الجغرافي" : "Location"}
                  value={locationValue}
                />
                {phone && (
                  <InfoCard
                    icon={<Phone size={15} strokeWidth={1.5} />}
                    label={isRtl ? "رقم الهاتف" : "Phone"}
                    value={<a href={`tel:${phone}`} className="hover:text-brass transition-colors">{phone}</a>}
                  />
                )}
                <InfoCard
                  icon={<Clock size={15} strokeWidth={1.5} />}
                  label={isRtl ? "وقت الاستجابة" : "Response time"}
                  value={isRtl ? "خلال 3 أيام عمل" : "Within 3 business days"}
                />
              </div>

              {/* Social links */}
              {socialItems.length > 0 && (
                <div>
                  <div style={{ height: 1, background: "rgba(28,37,51,0.1)", marginBottom: 16 }} />
                  <div style={{ fontSize: 10.5, letterSpacing: "0.18em", color: "rgba(28,37,51,0.45)" }} className="uppercase mb-3">
                    {isRtl ? "تابعنا" : "Follow us"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {socialItems.map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.label}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 transition-colors"
                        style={{
                          fontSize: 12.5,
                          border: "1px solid rgba(28,37,51,0.15)",
                          color: "rgba(28,37,51,0.6)",
                          background: "white",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--tb-gold, #B08C5A)"; e.currentTarget.style.color = "var(--tb-gold, #B08C5A)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(28,37,51,0.15)"; e.currentTarget.style.color = "rgba(28,37,51,0.6)"; }}
                      >
                        {s.icon}
                        <span>{s.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <div style={{ height: 1, background: "rgba(28,37,51,0.1)", marginBottom: 16 }} />
                <p style={{ fontSize: 13, color: "rgba(28,37,51,0.5)", lineHeight: 1.7 }}>
                  {isRtl
                    ? "للتعاون البحثي أو الاستفسارات الأكاديمية يُنصح بذكر تفاصيل الموضوع في خانة الرسالة."
                    : "For research collaboration or academic enquiries, please include topic details in the message field."}
                </p>
              </div>

            </aside>

            {/* ── Form ── */}
            <div className="lg:col-span-8">
              {submitted ? (
                <SuccessCard title={successTitle} body={successBody} isRtl={isRtl} ArrowIcon={ArrowIcon} />
              ) : (
                <form
                  onSubmit={onSubmit}
                  className="bg-white p-8 md:p-10 space-y-6"
                  style={{ border: "1px solid rgba(28,37,51,0.1)", boxShadow: "0 2px 24px rgba(10,17,28,0.06)" }}
                  data-testid="contact-form"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label={fieldName}>
                      <input
                        required minLength={2}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-11 px-3 border outline-none text-[15px] transition-colors focus:border-navy-deep"
                        style={{ borderColor: "rgba(28,37,51,0.18)", background: "var(--tb-ivory, #F7F5F0)" }}
                        data-testid="contact-name"
                      />
                    </Field>
                    <Field label={t("admin.email")}>
                      <input
                        type="email" required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full h-11 px-3 border outline-none text-[15px] transition-colors focus:border-navy-deep"
                        style={{ borderColor: "rgba(28,37,51,0.18)", background: "var(--tb-ivory, #F7F5F0)" }}
                        data-testid="contact-email-field"
                      />
                    </Field>
                  </div>

                  <Field label={fieldSubject}>
                    <input
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-11 px-3 border outline-none text-[15px] transition-colors focus:border-navy-deep"
                      style={{ borderColor: "rgba(28,37,51,0.18)", background: "var(--tb-ivory, #F7F5F0)" }}
                      data-testid="contact-subject"
                    />
                  </Field>

                  <Field label={fieldMessage}>
                    <textarea
                      required minLength={10} rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3 py-3 border outline-none text-[15px] leading-[1.8] resize-y transition-colors focus:border-navy-deep"
                      style={{ borderColor: "rgba(28,37,51,0.18)", background: "var(--tb-ivory, #F7F5F0)" }}
                      data-testid="contact-message"
                    />
                  </Field>

                  <label className="flex items-start gap-3 cursor-pointer" style={{ fontSize: 13, color: "rgba(28,37,51,0.7)", lineHeight: 1.6 }}>
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      className="mt-0.5 shrink-0"
                      data-testid="contact-consent"
                    />
                    <span>{consentText}</span>
                  </label>

                  {error && (
                    <div
                      className="text-[13px] ps-3"
                      style={{ color: "#9E3B3B", borderInlineStart: "2px solid #9E3B3B" }}
                      data-testid="contact-error"
                    >
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <button
                      type="submit"
                      disabled={sending}
                      className="lz-btn-primary inline-flex items-center gap-2"
                      data-testid="contact-submit"
                    >
                      <Send size={15} strokeWidth={1.8} />
                      <span>{sending ? (isRtl ? "جارٍ الإرسال…" : "Sending…") : submitLabel}</span>
                    </button>
                    <p style={{ fontSize: 12, color: "rgba(28,37,51,0.4)" }}>
                      {isRtl ? "رسالتك محفوظة بأمان في لوحة التحكم." : "Your message is securely stored in the dashboard."}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}

/* ── Sub-components ── */

function InfoCard({ icon, label, value }) {
  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{ border: "1px solid rgba(28,37,51,0.1)", background: "white" }}
    >
      <span
        className="shrink-0 w-8 h-8 flex items-center justify-center"
        style={{ color: "var(--tb-gold, #B08C5A)", background: "rgba(176,140,90,0.08)" }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontSize: 10.5, letterSpacing: "0.18em", color: "rgba(28,37,51,0.45)" }} className="uppercase mb-0.5">
          {label}
        </div>
        <div style={{ fontSize: 14.5, color: "var(--tb-ink, #1C2533)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SuccessCard({ title, body, isRtl, ArrowIcon }) {
  return (
    <div
      className="p-10 md:p-14 text-center"
      style={{ border: "1px solid rgba(28,37,51,0.1)", background: "white", boxShadow: "0 2px 24px rgba(10,17,28,0.06)" }}
      data-testid="contact-success"
    >
      {/* Gold checkmark circle */}
      <div
        className="w-16 h-16 mx-auto flex items-center justify-center"
        style={{ border: "1px solid var(--tb-gold, #B08C5A)", color: "var(--tb-gold, #B08C5A)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div style={{ fontSize: 10.5, letterSpacing: "0.22em", color: "var(--tb-gold, #B08C5A)" }} className="uppercase mt-6 mb-3">
        {isRtl ? "تم الاستلام" : "Received"}
      </div>
      <div style={{ height: 1, width: 40, background: "var(--tb-gold, #B08C5A)", margin: "0 auto 24px" }} />

      <h2
        className="tb-display"
        style={{ color: "var(--tb-navy-deep, #0A111C)", fontSize: "clamp(1.3rem, 2vw, 1.7rem)", lineHeight: 1.25 }}
      >
        {title}
      </h2>
      <p className="mt-4 mx-auto" style={{ fontSize: 15, color: "rgba(28,37,51,0.6)", lineHeight: 1.8, maxWidth: "48ch" }}>
        {body}
      </p>

      <a
        href="/"
        className="inline-flex items-center gap-2 mt-8"
        style={{ fontSize: 13.5, color: "var(--tb-navy-deep, #0A111C)", letterSpacing: "0.06em" }}
      >
        <ArrowIcon size={14} strokeWidth={1.6} />
        <span>{isRtl ? "العودة للرئيسية" : "Back to home"}</span>
      </a>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span
        className="block mb-2 uppercase"
        style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(28,37,51,0.5)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
