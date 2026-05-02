import { useLang } from "@/i18n/LanguageContext";

export default function AdminComingSoon({ titleAr, titleEn }) {
  const { lang, t } = useLang();
  return (
    <div className="p-8 md:p-12" data-testid="admin-coming-soon">
      <div className="lz-eyebrow text-navy/70">
        {lang === "ar" ? "قيد التطوير" : "Coming soon"}
      </div>
      <h1 className="lz-h2 mt-3">{lang === "ar" ? titleAr : titleEn}</h1>
      <p className="lz-lede mt-3 max-w-2xl">{t("admin.comingSoon")}</p>
      <div className="mt-10 border border-rule bg-white p-8 text-mute text-[14px]">
        {lang === "ar"
          ? "ستُفعَّل هذه الوحدة في المرحلة القادمة وفق خطة المشروع المعتمدة."
          : "This module will be enabled in the next phase as per the approved project plan."}
      </div>
    </div>
  );
}
