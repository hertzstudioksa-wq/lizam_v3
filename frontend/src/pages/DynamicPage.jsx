import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { SectionRenderer } from "@/lib/sectionRegistry";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function DynamicPage() {
  const { slug } = useParams();
  const { lang } = useLang();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine slug from URL if not in params (e.g. /activities or /fellows)
  const resolvedSlug = slug || window.location.pathname.replace(/^\//, "").split("/")[0];

  useEffect(() => {
    setLoading(true);
    setPage(null);
    api
      .get(`/public/custom-pages/${resolvedSlug}`)
      .then(({ data }) => { setPage(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [resolvedSlug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-[160px] pb-24 text-center text-mute">
          {lang === "ar" ? "جارٍ التحميل…" : "Loading…"}
        </div>
      </PublicLayout>
    );
  }

  if (!page) {
    return (
      <PublicLayout>
        <div className="pt-[160px] pb-24 text-center text-mute">
          {lang === "ar" ? "الصفحة غير موجودة." : "Page not found."}
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {(page.sections || []).map((section, i) => (
        <SectionRenderer key={i} section={section} pageKey={page.slug} />
      ))}
    </PublicLayout>
  );
}
