import { useState } from "react";
import { Mail, Send } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api, formatApiError } from "@/lib/api";

export default function ContactPage() {
  const { lang, t } = useLang();
  const { data: site } = useSiteSettings();
  const email = site?.contact_email || "info@lizam.sa";
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", consent: false });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.consent) {
      setError(lang === "ar" ? "يرجى الموافقة على معالجة البيانات." : "Please agree to the data-processing notice.");
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

  return (
    <PublicLayout>
      <section className="pt-[130px] md:pt-[150px] pb-20 bg-ivory min-h-[70vh]">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
          <div className="lz-eyebrow text-navy/70">{lang === "ar" ? "تواصل" : "Contact"}</div>
          <div className="mt-3 h-px w-12 bg-brass" />
          <h1 className="lz-display mt-6 max-w-[22ch]" style={{ color: "#121A2A" }}>
            {lang === "ar" ? "تواصل مع المركز" : "Get in touch"}
          </h1>
          <p className="lz-lede mt-6 max-w-[58ch]">
            {lang === "ar"
              ? "نرحّب بالتعاون البحثي والاستفسارات المؤسسية من القطاعين العام والخاص، ومن الباحثين والممارسين."
              : "We welcome research collaboration and institutional enquiries from the public and private sectors and from researchers and practitioners."}
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Left: contact info */}
            <aside className="md:col-span-4 space-y-8">
              <div>
                <div className="lz-eyebrow text-mute">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</div>
                <a
                  href={`mailto:${email}`}
                  className="mt-3 inline-flex items-center gap-2 text-[17px] text-navy-deep hover:text-brass transition-colors lz-linkline"
                  style={{ fontFamily: '"Thmanyah Serif Display", serif' }}
                  data-testid="contact-page-email"
                >
                  <Mail size={16} strokeWidth={1.5} />
                  <span>{email}</span>
                </a>
              </div>
              <div>
                <div className="lz-eyebrow text-mute">{lang === "ar" ? "الموقع" : "Location"}</div>
                <div className="mt-3 text-[15px] text-ink/85">
                  {lang === "ar" ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia"}
                </div>
              </div>
            </aside>

            {/* Right: form */}
            <div className="md:col-span-8">
              {submitted ? (
                <div className="border border-rule bg-white p-10 text-center" data-testid="contact-success">
                  <div className="lz-eyebrow text-brass">{lang === "ar" ? "تم الاستلام" : "Received"}</div>
                  <div className="mt-3 h-px w-10 bg-brass mx-auto" />
                  <h2 className="lz-h3 mt-6">
                    {lang === "ar" ? "شكراً لتواصلك مع المركز." : "Thank you for reaching out."}
                  </h2>
                  <p className="mt-3 text-[14.5px] text-mute max-w-[50ch] mx-auto">
                    {lang === "ar"
                      ? "سيقوم فريق المركز بمراجعة رسالتك والرد عليك في أقرب فرصة."
                      : "Our team will review your message and respond at the earliest opportunity."}
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="bg-white border border-rule p-7 md:p-9 space-y-5" data-testid="contact-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label={lang === "ar" ? "الاسم" : "Name"}>
                      <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]" data-testid="contact-name" />
                    </Field>
                    <Field label={t("admin.email")}>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]" data-testid="contact-email-field" />
                    </Field>
                  </div>
                  <Field label={lang === "ar" ? "الموضوع" : "Subject"}>
                    <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]" data-testid="contact-subject" />
                  </Field>
                  <Field label={lang === "ar" ? "الرسالة" : "Message"}>
                    <textarea required minLength={10} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-3 py-2.5 border border-rule focus:border-navy outline-none text-[15px] leading-[1.8] resize-y" data-testid="contact-message" />
                  </Field>
                  <label className="flex items-start gap-2 text-[13px] text-ink/80 cursor-pointer">
                    <input type="checkbox" checked={form.consent}
                           onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                           className="mt-1" data-testid="contact-consent" />
                    <span>
                      {lang === "ar"
                        ? "أوافق على معالجة بياناتي للتواصل معي بخصوص رسالتي."
                        : "I consent to my data being processed so the center can respond to my enquiry."}
                    </span>
                  </label>
                  {error && (
                    <div className="text-[13px] text-[#9E3B3B] border-l-2 border-[#9E3B3B] ps-3" data-testid="contact-error">{error}</div>
                  )}
                  <button type="submit" disabled={sending} className="lz-btn-primary inline-flex" data-testid="contact-submit">
                    <Send size={15} strokeWidth={1.8} />
                    <span>{sending ? (lang === "ar" ? "جارٍ الإرسال…" : "Sending…") : (lang === "ar" ? "إرسال" : "Send")}</span>
                  </button>
                  <p className="text-[12.5px] text-mute">
                    {lang === "ar" ? "سيتم تخزين الرسائل في لوحة التحكم. إذا تم تكوين مفتاح Resend يتم إرسال إشعار بالبريد فوراً." : "Messages are stored in the admin dashboard. If a Resend API key is configured, a notification email is sent immediately."}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-2">{label}</span>
      {children}
    </label>
  );
}
