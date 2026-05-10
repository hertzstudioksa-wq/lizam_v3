import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { api, formatApiError } from "@/lib/api";

/**
 * Theme B — Newsletter signup (Nadeem-inspired).
 * Deep navy band, centered editorial heading, single email input + button.
 * Posts to /api/public/newsletter/subscribe — backend stores email in Mongo
 * and silently skips delivery until Resend is configured.
 */
export default function NewsletterB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | submitting | done | error
  const [errMsg, setErrMsg] = useState("");

  // Visibility — placed AFTER all hooks. Defaults to TRUE.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("newsletter")) return null;
  if (home?.newsletter_enabled === false) return null;

  async function submit(e) {
    e.preventDefault();
    if (state === "submitting" || !email) return;
    setState("submitting");
    setErrMsg("");
    try {
      await api.post("/public/newsletter/subscribe", { email, language: lang });
      setState("done");
      setEmail("");
    } catch (err) {
      setErrMsg(formatApiError(err.response?.data?.detail) || err.message);
      setState("error");
    }
  }

  return (
    <section
      id="newsletter"
      data-testid="section-newsletter"
      data-theme-component="theme-b-newsletter"
      style={{ background: "var(--tb-navy-900)", color: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[920px] px-6 md:px-12 py-28 md:py-36 text-center">
        <div className="inline-flex items-center justify-center gap-3">
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
          <span className="tb-overline" style={{ color: "var(--tb-gold-soft)", letterSpacing: "0.22em" }}>
            {home?.[`newsletter_eyebrow_${lang}`] || (lang === "ar" ? "النشرة البحثية" : "Research Newsletter")}
          </span>
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
        </div>

        <h2
          className="tb-display mt-10 mx-auto"
          style={{
            fontSize: "clamp(2rem, 3.8vw, 3rem)",
            lineHeight: 1.3,
            fontWeight: 500,
            color: "var(--tb-paper-base)",
            maxWidth: "22ch",
          }}
          data-testid="newsletter-title"
        >
          {home?.[`newsletter_title_${lang}`] || (lang === "ar"
            ? "اشترك في نشرة المركز البحثية."
            : "Subscribe to the Center's research bulletin.")}
        </h2>

        <p
          className="mt-7 mx-auto"
          style={{
            fontFamily: '"Thmanyah Serif Text", serif',
            fontSize: 16,
            lineHeight: 1.95,
            color: "rgba(251, 250, 247, 0.72)",
            maxWidth: "54ch",
          }}
          data-testid="newsletter-blurb"
        >
          {home?.[`newsletter_blurb_${lang}`] || (lang === "ar"
            ? "تصلك أحدث الدراسات والأوراق التحليلية والتغطيات الصادرة عن المركز مباشرة إلى بريدك."
            : "Receive the most recent studies, analytical papers and coverage from the Center, delivered straight to your inbox.")}
        </p>

        {state === "done" ? (
          <div
            className="mt-12 inline-flex items-center gap-3 px-7 py-4"
            style={{ border: "1px solid var(--tb-gold)", color: "var(--tb-gold)" }}
            data-testid="newsletter-success"
          >
            <Check size={18} strokeWidth={1.8} />
            <span style={{ fontFamily: '"Thmanyah Sans", sans-serif', fontSize: 14, letterSpacing: "0.06em" }}>
              {lang === "ar" ? "تم التسجيل. شكراً لاهتمامك." : "Subscribed. Thank you for your interest."}
            </span>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-12 mx-auto flex flex-col sm:flex-row items-stretch gap-3 max-w-[520px]"
            data-testid="newsletter-form"
          >
            <div
              className="flex items-center gap-3 px-5 flex-1"
              style={{
                border: "1px solid rgba(212, 185, 130, 0.35)",
                background: "rgba(251, 250, 247, 0.04)",
                height: 54,
              }}
            >
              <Mail size={16} strokeWidth={1.6} style={{ color: "var(--tb-gold-soft)", flexShrink: 0 }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === "ar" ? "بريدك الإلكتروني" : "Your email address"}
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="flex-1 bg-transparent border-0 outline-none text-[15px]"
                style={{
                  color: "var(--tb-paper-base)",
                  fontFamily: lang === "ar" ? '"Thmanyah Sans", sans-serif' : '"Thmanyah Sans", sans-serif',
                }}
                data-testid="newsletter-email"
              />
            </div>
            <button
              type="submit"
              disabled={state === "submitting"}
              className="px-9 transition-all duration-400 disabled:opacity-60"
              style={{
                background: "var(--tb-gold)",
                color: "var(--tb-navy-900)",
                fontFamily: '"Thmanyah Sans", sans-serif',
                fontSize: 14,
                letterSpacing: "0.14em",
                textTransform: lang === "ar" ? "none" : "uppercase",
                fontWeight: 600,
                height: 54,
                whiteSpace: "nowrap",
              }}
              data-testid="newsletter-submit"
            >
              {state === "submitting"
                ? (lang === "ar" ? "جارٍ التسجيل…" : "Subscribing…")
                : (lang === "ar" ? "اشتراك" : "Subscribe")}
            </button>
          </form>
        )}

        {state === "error" && errMsg && (
          <div className="mt-5 text-[13px]" style={{ color: "rgba(231, 168, 168, 0.85)" }} data-testid="newsletter-error">
            {errMsg}
          </div>
        )}

        <p
          className="mt-7 text-[12px]"
          style={{ color: "rgba(251, 250, 247, 0.45)", fontFamily: '"Thmanyah Sans", sans-serif' }}
        >
          {lang === "ar"
            ? "نحترم خصوصيتك. يمكنك إلغاء الاشتراك في أي وقت."
            : "We respect your privacy. You may unsubscribe at any time."}
        </p>
      </div>
    </section>
  );
}
