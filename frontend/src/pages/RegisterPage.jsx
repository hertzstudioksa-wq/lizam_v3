import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function RegisterPage() {
  const { lang, t } = useLang();
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    nav("/account", { replace: true });
  }

  return (
    <PublicLayout>
      <section className="pt-[120px] pb-24 min-h-[80vh]">
        <div className="mx-auto max-w-[560px] px-6">
          <div className="lz-eyebrow text-navy/70">
            {lang === "ar" ? "حساب جديد" : "Create account"}
          </div>
          <div className="mt-3 h-px w-12 bg-brass" />
          <h1 className="lz-h2 mt-6">
            {lang === "ar" ? "التسجيل في المركز" : "Register"}
          </h1>
          <p className="lz-lede mt-3">
            {lang === "ar"
              ? "أنشئ حساباً للوصول للمحتوى المقفل والمشاركة بالردود البحثية."
              : "Create an account to access gated content and submit research responses."}
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-10 space-y-5 bg-white border border-rule p-7 md:p-9"
            data-testid="register-form"
          >
            <Field label={lang === "ar" ? "الاسم" : "Full name"}>
              <input
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]"
                data-testid="register-name"
              />
            </Field>
            <Field label={t("admin.email")}>
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]"
                data-testid="register-email"
              />
            </Field>
            <Field label={t("admin.password")}>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]"
                data-testid="register-password"
              />
            </Field>

            {err && (
              <div
                className="text-[13px] text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2"
                data-testid="register-error"
              >
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="lz-btn-primary w-full disabled:opacity-60"
              data-testid="register-submit"
            >
              {loading ? t("common.loading") : t("nav.register")}
            </button>

            <div className="pt-3 text-[13px] text-mute text-center">
              {lang === "ar" ? "لديك حساب؟" : "Already registered?"}{" "}
              <Link to="/login" className="text-navy hover:text-navy-hover lz-linkline" data-testid="to-login">
                {t("nav.login")}
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
