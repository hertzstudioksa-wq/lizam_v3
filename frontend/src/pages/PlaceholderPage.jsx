import PublicLayout from "@/components/layout/PublicLayout";
import { useLang } from "@/i18n/LanguageContext";

export default function PlaceholderPage({ titleKey, noteKey }) {
  const { t, lang } = useLang();
  return (
    <PublicLayout>
      <section className="pt-[140px] pb-28 min-h-[70vh]">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
          <div className="lz-eyebrow text-navy/70">
            {lang === "ar" ? "قيد التطوير" : "Coming in next phase"}
          </div>
          <div className="mt-3 h-px w-12 bg-brass" />
          <h1 className="lz-display mt-8 max-w-3xl">{t(titleKey)}</h1>
          <p className="lz-lede mt-6">{t(noteKey)}</p>
        </div>
      </section>
    </PublicLayout>
  );
}
