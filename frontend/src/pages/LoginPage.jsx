import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function LoginPage() {
  const { lang, t } = useLang();
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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
              disabled={loading}
              className="lz-btn-primary w-full disabled:opacity-60"
              data-testid="login-submit"
            >
              {loading ? t("common.loading") : t("admin.submit")}
            </button>

            <div className="pt-3 text-[13px] text-mute text-center">
              {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
              <Link to="/register" className="text-navy hover:text-navy-hover lz-linkline" data-testid="to-register">
                {t("nav.register")}
              </Link>
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
