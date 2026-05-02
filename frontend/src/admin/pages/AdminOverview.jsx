import { useOutletContext } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";

export default function AdminOverview() {
  const { overview } = useOutletContext() || {};
  const { lang, t } = useLang();

  const metrics = [
    { key: "publications_total", label: lang === "ar" ? "إجمالي الإصدارات" : "Publications" },
    { key: "publications_published", label: lang === "ar" ? "منشور" : "Published" },
    { key: "publications_draft", label: lang === "ar" ? "مسودة" : "Drafts" },
    { key: "users_total", label: lang === "ar" ? "المستخدمون" : "Users" },
    { key: "responses_pending", label: lang === "ar" ? "ردود قيد المراجعة" : "Pending Responses" },
    { key: "messages_new", label: lang === "ar" ? "رسائل جديدة" : "New Messages" },
  ];

  return (
    <div className="p-8 md:p-12" data-testid="admin-overview">
      <div className="lz-eyebrow text-navy/70">
        {lang === "ar" ? "نظرة عامة" : "Overview"}
      </div>
      <h1 className="lz-h2 mt-3">{t("admin.dashboard")}</h1>
      <p className="lz-lede mt-3">
        {lang === "ar"
          ? "مرحباً بك في لوحة تحكم المركز. هذه المرحلة الأولى — تم تجهيز الهيكل الإداري والإحصاءات الأولية. ستُفعَّل الوحدات الكاملة في المرحلة التالية."
          : "Welcome to the LIZAM admin console. Phase 1 delivers the admin shell and baseline metrics. Full modules will be activated in the next phase."}
      </p>

      {/* Metrics */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-px bg-rule border border-rule">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="bg-white p-6 md:p-7"
            data-testid={`metric-${m.key}`}
          >
            <div className="lz-eyebrow text-navy/60">{m.label}</div>
            <div className="mt-3 font-serif text-4xl text-navy-deep tabular-nums">
              {overview?.[m.key] ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Phase 1 note */}
      <div className="mt-12 border-s-2 border-brass ps-5 py-1 text-mute text-[14px]">
        {t("admin.phase1Note")}
      </div>
    </div>
  );
}
