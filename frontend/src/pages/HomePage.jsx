import PublicLayout from "@/components/layout/PublicLayout";
import Hero from "@/components/home/Hero";
import { useLang } from "@/i18n/LanguageContext";

/**
 * Phase 1 — Home page shows ONLY the Hero as the visual checkpoint.
 * A small placeholder section beneath explains the remaining sections
 * are being scheduled for Phase 2, so the page never feels broken/empty.
 */
export default function HomePage() {
  const { lang } = useLang();
  return (
    <PublicLayout>
      <Hero />

      {/* Phase 1 transition strip */}
      <section
        className="relative bg-ivory"
        data-testid="phase1-placeholder"
      >
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
            <div className="md:col-span-4">
              <div className="lz-eyebrow text-navy/70">
                {lang === "ar" ? "نظرة أولى · مرحلة ١" : "First Look · Phase 1"}
              </div>
              <div className="mt-4 h-px w-12 bg-brass" />
            </div>
            <div className="md:col-span-8 space-y-6">
              <h2 className="lz-h2">
                {lang === "ar"
                  ? "هذه معاينة بصرية أولى تستعرض لغة المركز البصرية."
                  : "A first visual draft that sets the institutional tone."}
              </h2>
              <p className="lz-lede">
                {lang === "ar"
                  ? "تم في هذه المرحلة تجهيز الهوية البصرية، نظام التصميم، بنية الصفحات العامة ولوحة التحكم، طبقة الترجمة (عربي/إنجليزي مع دعم RTL/LTR)، ونموذج البيانات الخاص بالمركز والإصدارات. ستبدأ المرحلة التالية ببناء بقية أقسام الصفحة الرئيسية (من نحن، الرسالة والرؤية، الأهداف، مجالات العمل، الإصدارات، تواصل) بنفس اللغة البصرية التي ترونها هنا."
                  : "Phase 1 delivers the visual identity, design system, bilingual shell (AR/EN with full RTL/LTR support), public & admin routing, and the complete data model for the center and its publications. Phase 2 will build the remaining homepage sections (About, Mission & Vision, Objectives, Fields of Work, Featured Publications, Contact) in the same editorial language you see here."}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <PlaceholderPill label={lang === "ar" ? "عن المركز" : "About"} />
                <PlaceholderPill label={lang === "ar" ? "الرسالة والرؤية" : "Mission & Vision"} />
                <PlaceholderPill label={lang === "ar" ? "الأهداف" : "Objectives"} />
                <PlaceholderPill label={lang === "ar" ? "مجالات العمل" : "Fields of Work"} />
                <PlaceholderPill label={lang === "ar" ? "الإصدارات" : "Publications"} />
                <PlaceholderPill label={lang === "ar" ? "تواصل" : "Contact"} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function PlaceholderPill({ label }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-navy/75 bg-white border border-rule">
      <span className="h-1 w-1 bg-brass" />
      <span>{label}</span>
    </span>
  );
}
