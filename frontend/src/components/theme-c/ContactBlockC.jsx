import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api } from "@/lib/api";

export default function ContactBlockC() {
  const { lang } = useLang();
  const { data } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) { setErr(lang === "ar" ? "يرجى الموافقة على معالجة البيانات." : "Please agree to data processing."); return; }
    setSending(true); setErr("");
    try {
      await api.post("/public/contact", { ...form, consent: true });
      setDone(true);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || (lang === "ar" ? "تعذّر الإرسال." : "Could not send."));
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="relative py-24 md:py-32"
      style={{ background: "var(--tc-navy-dark)", color: "var(--tc-ivory)" }}
      data-testid="section-contact"
      data-theme-component="theme-c-contact"
    >
      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-5">
            <div className="tc-eyebrow-light">{lang === "ar" ? "تواصل" : "Contact"}</div>
            <h2
              className="mt-6 text-[36px] md:text-[44px] lg:text-[52px] leading-[1.15] font-semibold"
              style={{ fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
            >
              {lang === "ar" ? "بإمكانك الكتابة إلينا مباشرة." : "Reach the center directly."}
            </h2>
            <p className="mt-6 max-w-[44ch] text-[15.5px] leading-[1.75]" style={{ color: "rgba(248,247,243,0.66)" }}>
              {lang === "ar"
                ? "للاستفسارات البحثية أو طلبات التعاون، نرحب بمراسلتكم. سنعود إليكم خلال أيام العمل."
                : "For research queries and collaboration requests, we welcome your message. We'll respond within business days."}
            </p>
            {data?.contact_email && (
              <div className="mt-10 space-y-2">
                <div className="tc-eyebrow-light">{lang === "ar" ? "بريد المركز" : "Email"}</div>
                <a href={`mailto:${data.contact_email}`} className="text-[18px] hover:text-[var(--tc-gold)] transition-colors">{data.contact_email}</a>
              </div>
            )}
          </div>

          <form onSubmit={submit} className="lg:col-span-7 space-y-7" data-testid="contact-form">
            {done ? (
              <div className="border-l-2 ps-5 py-4" style={{ borderColor: "var(--tc-gold)" }}>
                <div className="tc-eyebrow-light">{lang === "ar" ? "تم الاستلام" : "Received"}</div>
                <p className="mt-2 text-[16px]" style={{ color: "rgba(248,247,243,0.85)" }}>
                  {lang === "ar" ? "شكراً لتواصلكم. سنعود إليكم في أقرب وقت." : "Thank you. We'll be in touch shortly."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <label className="block">
                    <span className="tc-eyebrow-light">{lang === "ar" ? "الاسم" : "Name"}</span>
                    <input className="tc-field mt-2" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" />
                  </label>
                  <label className="block">
                    <span className="tc-eyebrow-light">{lang === "ar" ? "البريد" : "Email"}</span>
                    <input type="email" className="tc-field mt-2" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" />
                  </label>
                </div>
                <label className="block">
                  <span className="tc-eyebrow-light">{lang === "ar" ? "الموضوع" : "Subject"}</span>
                  <input className="tc-field mt-2" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="contact-subject" />
                </label>
                <label className="block">
                  <span className="tc-eyebrow-light">{lang === "ar" ? "نص الرسالة" : "Message"}</span>
                  <textarea rows={4} className="tc-field mt-2 resize-none" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" />
                </label>
                <label className="flex items-start gap-3 cursor-pointer text-[13.5px]" style={{ color: "rgba(248,247,243,0.7)" }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" data-testid="contact-consent" />
                  <span>
                    {lang === "ar"
                      ? "أوافق على معالجة بياناتي للتواصل وفقاً لسياسة الخصوصية."
                      : "I agree to my data being processed for contact purposes per the privacy policy."}
                  </span>
                </label>
                {err && <div className="text-[13px]" style={{ color: "#E08585" }}>{err}</div>}
                <button type="submit" className="tc-btn-primary" disabled={sending} data-testid="contact-submit">
                  <span>{sending ? (lang === "ar" ? "جارٍ الإرسال…" : "Sending…") : (lang === "ar" ? "إرسال الرسالة" : "Send message")}</span>
                  {!sending && <ArrowRight size={16} className={lang === "ar" ? "rotate-180" : ""} />}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
