import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api } from "@/lib/api";

export default function LoginPage() {
  const { lang, t } = useLang();
  const { login, refresh } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { data: site } = useSiteSettings();
  const registrationEnabled =
    !site || (site.feature_toggles?.registration !== false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleProcessing, setGoogleProcessing] = useState(false);

  // Fetch google toggle status + handle inbound #session_id from Emergent redirect
  useEffect(() => {
    api.get("/auth/google/status").then(({ data }) => setGoogleEnabled(!!data.enabled)).catch(() => {});
    const hash = window.location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (m) {
      const sid = m[1];
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      (async () => {
        setGoogleProcessing(true);
        try {
          const { data } = await api.post("/auth/google/callback", { session_id: sid });
          // AuthContext.login() sets user; reload equivalent:
          if (typeof refresh === "function") await refresh();
          const to = loc.state?.from?.pathname
            || (["super_admin", "admin", "editor", "reviewer"].includes(data.user?.role) ? "/admin" : "/account");
          nav(to, { replace: true });
        } catch (e) {
          setErr(e.response?.data?.detail || "Google login failed");
        } finally {
          setGoogleProcessing(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startGoogle() {
    const redirectTo = `${window.location.origin}/login`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectTo)}`;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setErr(typeof res.error === "string" ? res.error : t("auth.invalidCredentials"));
      return;
    }
    // Redirect to intended destination or admin if user is admin
    const to = loc.state?.from?.pathname
      || (["super_admin", "admin", "editor", "reviewer"].includes(res.user.role) ? "/admin" : "/account");
    nav(to, { replace: true });
  }

  return (
    <PublicLayout>
      <section className="pt-[120px] pb-24 min-h-[80vh]">
        <div className="mx-auto max-w-[560px] px-6">
          <div className="lz-eyebrow text-navy/70">
            {lang === "ar" ? "دخول الأعضاء" : "Member access"}
          </div>
          <div className="mt-3 h-px w-12 bg-brass" />
          <h1 className="lz-h2 mt-6">
            {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
          </h1>
          <p className="lz-lede mt-3">
            {lang === "ar"
              ? "الدخول للمحررين والأعضاء المسجلين. الوصول للمحتوى المقفل بعد تسجيل الدخول."
              : "Access for editors and registered members. Gated content will unlock after sign-in."}
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-10 space-y-5 bg-white border border-rule p-7 md:p-9"
            data-testid="login-form"
          >
            <Field label={t("admin.email")}>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 border border-rule focus:border-navy focus:ring-0 outline-none text-[15px]"
                data-testid="login-email"
              />
            </Field>
            <Field label={t("admin.password")}>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3 border border-rule focus:border-navy focus:ring-0 outline-none text-[15px]"
                data-testid="login-password"
              />
            </Field>

            {err && (
              <div
                className="text-[13px] text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2"
                data-testid="login-error"
              >
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleProcessing}
              className="lz-btn-primary w-full disabled:opacity-60"
              data-testid="login-submit"
            >
              {loading ? t("common.loading") : t("admin.submit")}
            </button>

            {googleEnabled && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <div className="h-px flex-1 bg-rule" />
                  <span className="text-[11px] uppercase tracking-[0.16em] text-mute">
                    {lang === "ar" ? "أو" : "Or"}
                  </span>
                  <div className="h-px flex-1 bg-rule" />
                </div>
                <button
                  type="button"
                  onClick={startGoogle}
                  disabled={googleProcessing}
                  className="w-full h-11 border border-rule hover:border-navy text-[14px] font-medium flex items-center justify-center gap-2.5 disabled:opacity-60"
                  data-testid="login-google-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 31.9 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.5 7.2 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.4-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.5 7.2 29 5 24 5 16.3 5 9.7 9 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 43c4.9 0 9.3-1.9 12.6-5l-5.8-4.9C29.1 34.5 26.7 35 24 35c-5.4 0-9.9-3.6-11.5-8.5l-6.6 5.1C9.4 38.9 16.1 43 24 43z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l5.8 4.9c-.4.4 6.2-4.5 6.2-14.5 0-1.3-.1-2.4-.4-3.5z" />
                  </svg>
                  <span>
                    {googleProcessing
                      ? (lang === "ar" ? "جارٍ إتمام الدخول…" : "Finishing sign-in…")
                      : (lang === "ar" ? "متابعة باستخدام Google" : "Continue with Google")}
                  </span>
                </button>
              </>
            )}

            <div className="pt-3 text-[13px] text-mute text-center">
              {registrationEnabled ? (
                <>
                  {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                  <Link to="/register" className="text-navy hover:text-navy-hover lz-linkline" data-testid="to-register">
                    {t("nav.register")}
                  </Link>
                </>
              ) : (
                <span data-testid="register-closed-note">
                  {lang === "ar" ? "التسجيل بحسابات جديدة معطّل حالياً." : "New account registration is currently disabled."}
                </span>
              )}
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
