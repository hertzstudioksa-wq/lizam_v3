import PublicLayout from "@/components/layout/PublicLayout";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function AccountPage() {
  const { user, bootstrapping, logout } = useAuth();
  const { lang, t } = useLang();
  const nav = useNavigate();

  if (bootstrapping) {
    return (
      <PublicLayout>
        <div className="pt-[140px] pb-24 text-center text-mute">{t("common.loading")}</div>
      </PublicLayout>
    );
  }
  if (!user || typeof user !== "object") return <Navigate to="/login" replace />;

  return (
    <PublicLayout>
      <section className="pt-[140px] pb-24">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="lz-eyebrow text-navy/70">
            {lang === "ar" ? "حسابي" : "My account"}
          </div>
          <div className="mt-3 h-px w-12 bg-brass" />
          <h1 className="lz-h2 mt-6">
            {lang === "ar" ? `أهلاً، ${user.name}` : `Hello, ${user.name}`}
          </h1>
          <div className="mt-8 bg-white border border-rule divide-y divide-rule" data-testid="account-card">
            <Row label={lang === "ar" ? "الاسم" : "Name"} value={user.name} />
            <Row label={t("admin.email")} value={user.email} />
            <Row label={lang === "ar" ? "الدور" : "Role"} value={user.role} />
          </div>
          <button
            type="button"
            onClick={async () => { await logout(); nav("/"); }}
            className="lz-btn-ghost mt-8"
            data-testid="account-logout"
          >
            {t("nav.logout")}
          </button>
        </div>
      </section>
    </PublicLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <span className="text-[12.5px] uppercase tracking-[0.18em] text-mute">{label}</span>
      <span className="text-[14.5px] text-ink">{value}</span>
    </div>
  );
}
