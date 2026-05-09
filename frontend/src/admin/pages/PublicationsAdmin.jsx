import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { AdminPage, Field, TextInput, TextArea, Select, Toggle, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import HelpTip from "@/admin/components/HelpTip";
import TiptapField from "@/admin/components/TiptapField";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";

const useTr = () => {
  const { lang } = useLang();
  return (ar, en) => (lang === "ar" ? ar : en);
};

// ---------------- LIST ----------------
export function PublicationsListAdmin() {
  const tr = useTr();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const r = await apiCall("get", `/admin/publications?${params}`);
    if (r.ok) setItems(r.data.items || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status]);

  return (
    <AdminPage title={tr("الإصدارات", "Publications")} subtitle={tr("إدارة المحتوى · المكتبة البحثية", "CMS · Research library")}
      helpAr={"إدارة كل الإصدارات (دراسات، أبحاث، أوراق سياسات، تقارير...). كل إصدار له حالة (مسودة/قيد المراجعة/منشور/مؤرشف) ومستوى وصول يحدد من يستطيع قراءته. فقط «المنشورة» تظهر للزوار."}
      helpEn="Manage all publications (studies, research, policy papers, reports). Each has a status (draft/under-review/published/archived) and an access level controlling who can read it. Only Published items appear publicly."
      actions={<Link to="/admin/publications/new" className="lz-btn-primary" data-testid="new-pub-btn"><Plus size={15} /><span>{tr("إصدار جديد", "New publication")}</span></Link>}>
      <div className="flex flex-wrap gap-3 mb-6">
        <TextInput value={q} onChange={setQ} placeholder={tr("بحث في العنوان أو الوسوم…", "Search title / tag…")} testid="pub-list-search" />
        <Select value={status} onChange={setStatus} options={[
          { value: "", label: tr("كل الحالات", "All statuses") },
          { value: "draft", label: tr("مسودة", "Draft") },
          { value: "under_review", label: tr("قيد المراجعة", "Under review") },
          { value: "published", label: tr("منشور", "Published") },
          { value: "archived", label: tr("مؤرشف", "Archived") },
        ]} testid="pub-list-status" />
      </div>
      <div className="bg-white border border-rule">
        {items === null ? (
          <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-mute text-center">{tr("لا توجد إصدارات.", "No publications.")}</div>
        ) : (
          <table className="w-full text-[14px]" data-testid="pub-list-table">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                <th className="text-start p-4">{tr("العنوان", "Title")}</th>
                <th className="text-start p-4">{tr("النوع", "Type")}</th>
                <th className="text-start p-4">{tr("الوصول", "Access")}</th>
                <th className="text-start p-4">{tr("الحالة", "Status")}</th>
                <th className="text-start p-4 tabular-nums">{tr("المشاهدات", "Views")}</th>
                <th className="text-start p-4">{tr("آخر تحديث", "Updated")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-0 hover:bg-ivory-cream transition-colors" data-testid={`pub-row-${p.id}`}>
                  <td className="p-4">
                    <Link to={`/admin/publications/${p.id}`} className="text-navy hover:text-brass lz-linkline">{p.title_ar || p.title_en}</Link>
                    <div className="text-[12px] text-mute mt-1">{p.title_en}</div>
                  </td>
                  <td className="p-4 text-mute">{p.publication_type}</td>
                  <td className="p-4"><span className="text-[11.5px] uppercase tracking-[0.14em] text-navy/80">{p.access_level}</span></td>
                  <td className="p-4"><StatusPill s={p.status} tr={tr} /></td>
                  <td className="p-4 tabular-nums text-mute">{p.view_count || 0}</td>
                  <td className="p-4 text-mute text-[12.5px]">{(p.updated_at || "").slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPage>
  );
}

function StatusPill({ s, tr }) {
  const map = { draft: "bg-rule text-ink", under_review: "bg-amber-100 text-amber-900",
                published: "bg-green-100 text-green-900", archived: "bg-red-50 text-red-900" };
  const labels = {
    draft: tr("مسودة", "Draft"),
    under_review: tr("قيد المراجعة", "Under review"),
    published: tr("منشور", "Published"),
    archived: tr("مؤرشف", "Archived"),
  };
  return <span className={`px-2 py-1 text-[11px] uppercase tracking-wide ${map[s] || "bg-rule"}`}>{labels[s] || s}</span>;
}

// ---------------- EDIT ----------------
export function PublicationEditAdmin() {
  const tr = useTr();
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const form = useDirtyForm(isNew ? {
    title_ar: "", title_en: "", summary_ar: "", summary_en: "",
    content_html_ar: "", content_html_en: "", preview_html_ar: "", preview_html_en: "",
    publication_type: "study", access_level: "public", pdf_access_level: "public",
    status: "draft", featured: false, responses_enabled: true,
    author_ids: [], tags: [],
  } : {});

  useEffect(() => {
    apiCall("get", "/admin/categories").then((r) => r.ok && setCategories(r.data.items || []));
    apiCall("get", "/admin/authors").then((r) => r.ok && setAuthors(r.data.items || []));
    if (!isNew) {
      apiCall("get", `/admin/publications/${id}`).then((r) => {
        if (r.ok) form.commit(r.data);
        setLoaded(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    setSaving(true);
    const r = isNew
      ? await apiCall("post", "/admin/publications", form.value)
      : await apiCall("patch", `/admin/publications/${id}`, form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      setMsg(tr("تم الحفظ ✓", "Saved ✓"));
      if (isNew) nav(`/admin/publications/${r.data.id}`, { replace: true });
      setTimeout(() => setMsg(""), 2500);
    } else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  async function uploadPdf(file) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/pdf", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch("pdf_file_url", data.url);
    } catch (e) { setMsg(`${tr("رفع", "Upload")}: ${formatApiError(e.response?.data?.detail) || e.message}`); }
  }
  async function uploadCover(file) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch("cover_image_url", data.url);
    } catch (e) { setMsg(`${tr("رفع", "Upload")}: ${formatApiError(e.response?.data?.detail) || e.message}`); }
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const toggleAuthor = (aid) => {
    const list = form.value.author_ids || [];
    form.patch("author_ids", list.includes(aid) ? list.filter((x) => x !== aid) : [...list, aid]);
  };

  return (
    <AdminPage
      title={isNew ? tr("إصدار جديد", "New publication") : (form.value.title_ar || form.value.title_en || tr("تعديل الإصدار", "Edit publication"))}
      subtitle={tr("إدارة المحتوى · المحرر", "CMS · Editor")}
      helpAr="حرّر بيانات الإصدار. الحقول التقنية في العمود الجانبي (الحالة، مستوى الوصول، وصول PDF) لها أيقونات معلومات ⓘ - مرّر عليها للشرح."
      helpEn="Edit the publication's content and metadata. Technical fields in the side panel (status, access level, PDF access) have ⓘ icons — hover for explanations."
      actions={<Link to="/admin/publications" className="lz-btn-ghost"><ArrowLeft size={15} /> {tr("رجوع", "Back")}</Link>}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label={tr("العنوان بالعربية", "Title AR")}><TextInput value={form.value.title_ar} onChange={(v) => form.patch("title_ar", v)} dir="rtl" testid="pub-title-ar" /></Field>
            <Field label={tr("العنوان بالإنجليزية", "Title EN")}><TextInput value={form.value.title_en} onChange={(v) => form.patch("title_en", v)} testid="pub-title-en" /></Field>
            <Field label={tr("المعرّف بالعربية", "Slug AR")} hint={tr("يُنشأ تلقائياً من العنوان لو فضي", "Auto-generated from title if empty")}><TextInput value={form.value.slug_ar} onChange={(v) => form.patch("slug_ar", v)} dir="rtl" testid="pub-slug-ar" /></Field>
            <Field label={tr("المعرّف بالإنجليزية", "Slug EN")}><TextInput value={form.value.slug_en} onChange={(v) => form.patch("slug_en", v)} testid="pub-slug-en" /></Field>
            <Field label={tr("الملخص بالعربية", "Summary AR")}><TextArea value={form.value.summary_ar} onChange={(v) => form.patch("summary_ar", v)} dir="rtl" rows={3} testid="pub-summary-ar" /></Field>
            <Field label={tr("الملخص بالإنجليزية", "Summary EN")}><TextArea value={form.value.summary_en} onChange={(v) => form.patch("summary_en", v)} rows={3} testid="pub-summary-en" /></Field>
          </div>

          <div>
            <h3 className="lz-h3 mb-3">{tr("نص المقال — العربية (RTL)", "Article — Arabic (RTL)")}</h3>
            <TiptapField value={form.value.content_html_ar} onChange={(v) => form.patch("content_html_ar", v)} dir="rtl" testid="tiptap-ar" />
          </div>
          <div>
            <h3 className="lz-h3 mb-3">{tr("نص المقال — الإنجليزية (LTR)", "Article — English (LTR)")}</h3>
            <TiptapField value={form.value.content_html_en} onChange={(v) => form.patch("content_html_en", v)} dir="ltr" testid="tiptap-en" />
          </div>
          <div>
            <h3 className="lz-h3 mb-3">{tr("معاينة (تظهر للقراء غير المسجلين) — عربية", "Preview (shown to gated readers) AR")}</h3>
            <TiptapField value={form.value.preview_html_ar} onChange={(v) => form.patch("preview_html_ar", v)} dir="rtl" testid="tiptap-preview-ar" />
          </div>
          <div>
            <h3 className="lz-h3 mb-3">{tr("معاينة — إنجليزية", "Preview EN")}</h3>
            <TiptapField value={form.value.preview_html_en} onChange={(v) => form.patch("preview_html_en", v)} dir="ltr" testid="tiptap-preview-en" />
          </div>
        </div>

        {/* Side metadata panel */}
        <aside className="space-y-5 xl:sticky xl:top-6 self-start">
          <Field label={<span className="inline-flex items-center">{tr("الحالة", "Status")}<HelpTip ar={"فقط الإصدارات بحالة «منشور» تظهر للزوار. «مؤرشف» يخفيها مع الاحتفاظ بالبيانات."} en="Only Published items appear publicly. Archived hides them while keeping all data." /></span>}>
            <Select value={form.value.status} onChange={(v) => form.patch("status", v)} options={[
              { value: "draft", label: tr("مسودة", "Draft") },
              { value: "under_review", label: tr("قيد المراجعة", "Under review") },
              { value: "published", label: tr("منشور", "Published") },
              { value: "archived", label: tr("مؤرشف", "Archived") },
            ]} testid="pub-status" />
          </Field>
          <Field label={tr("النوع", "Type")}>
            <Select value={form.value.publication_type} onChange={(v) => form.patch("publication_type", v)} options={[
              { value: "study", label: tr("دراسة", "Study") },
              { value: "research", label: tr("بحث", "Research") },
              { value: "policy_paper", label: tr("ورقة سياسات", "Policy paper") },
              { value: "report", label: tr("تقرير", "Report") },
              { value: "essay", label: tr("مقالة", "Essay") },
              { value: "opinion", label: tr("رأي", "Opinion") },
            ]} testid="pub-type" />
          </Field>
          <Field label={tr("المجال / التصنيف", "Category / Field")}>
            <Select value={form.value.category_id || ""} onChange={(v) => form.patch("category_id", v)} options={[
              { value: "", label: tr("— لا شيء —", "— none —") },
              ...categories.map((c) => ({ value: c.id, label: c.title_en || c.title_ar })),
            ]} testid="pub-category" />
          </Field>
          <Field label={<span className="inline-flex items-center">{tr("مستوى الوصول", "Access level")}<HelpTip ar="عام: متاح للجميع. معاينة + تسجيل: ملخص فقط للزائر، النص الكامل بعد الدخول. للمسجلين: لازم تسجيل دخول لقراءة أي شيء. مخفي: لا يظهر إطلاقاً." en="Public: open. Preview+login: summary only for guests, full text for members. Registered: login required for any content. Hidden: not shown at all." /></span>}>
            <Select value={form.value.access_level} onChange={(v) => form.patch("access_level", v)} options={[
              { value: "public", label: tr("عام", "Public") },
              { value: "preview_login", label: tr("معاينة + تسجيل دخول", "Preview + login") },
              { value: "registered", label: tr("للمسجلين فقط", "Registered only") },
              { value: "hidden", label: tr("مخفي / مسودة", "Hidden / draft") },
            ]} testid="pub-access" />
          </Field>
          <Field label={<span className="inline-flex items-center">{tr("الوصول إلى ملف PDF", "PDF access")}<HelpTip ar="منفصل عن مستوى الوصول للنص. عام: تحميل مفتوح. يتطلب دخول: لازم تسجيل دخول لتنزيل الملف. معطّل: لا يظهر زر التحميل إطلاقاً." en="Independent of content access. Public: open download. Login required: must sign in to download. Disabled: no download button at all." /></span>}>
            <Select value={form.value.pdf_access_level} onChange={(v) => form.patch("pdf_access_level", v)} options={[
              { value: "public", label: tr("عام", "Public") },
              { value: "login_required", label: tr("يتطلب تسجيل الدخول", "Login required") },
              { value: "admin_only", label: tr("للإدارة فقط", "Admin only") },
              { value: "disabled", label: tr("معطّل", "Disabled") },
            ]} testid="pub-pdf-access" />
          </Field>
          <Toggle checked={!!form.value.featured} onChange={(v) => form.patch("featured", v)} label={<span className="inline-flex items-center">{tr("إصدار مميّز", "Featured")}<HelpTip ar={"يجعل الإصدار يظهر في قسم «أحدث الإصدارات» بالصفحة الرئيسية. لو لا يوجد إصدار مميّز، يعرض القسم أحدث الإصدارات تلقائياً."} en="Pins the publication to the home page Featured section. If nothing is featured, the section falls back to the latest publications automatically." /></span>} testid="pub-featured" />
          <Toggle checked={!!form.value.responses_enabled} onChange={(v) => form.patch("responses_enabled", v)} label={<span className="inline-flex items-center">{tr("استقبال الردود البحثية", "Responses enabled")}<HelpTip ar="يعرض نموذج إرسال الردود البحثية أسفل صفحة الإصدار. الردود تخضع لمراجعة الإدارة قبل النشر." en="Shows the research-response form on this publication's page. All submissions are moderated before they appear." /></span>} testid="pub-responses" />

          <Field label={tr("الباحثون", "Authors")}>
            <div className="space-y-1 max-h-52 overflow-auto bg-white border border-rule p-2">
              {authors.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-[13px] p-1 hover:bg-ivory-cream cursor-pointer">
                  <input type="checkbox" checked={(form.value.author_ids || []).includes(a.id)} onChange={() => toggleAuthor(a.id)} />
                  <span>{a.name_en || a.name_ar}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label={tr("الوسوم (افصل بفاصلة)", "Tags (comma-separated)")}>
            <TextInput value={(form.value.tags || []).join(", ")} onChange={(v) => form.patch("tags", v.split(",").map((s) => s.trim()).filter(Boolean))} testid="pub-tags" />
          </Field>

          <Field label={tr("صورة الغلاف", "Cover image")}>
            <div className="space-y-2">
              {form.value.cover_image_url && <img src={form.value.cover_image_url} alt="" className="border border-rule max-h-32" />}
              <TextInput value={form.value.cover_image_url} onChange={(v) => form.patch("cover_image_url", v)} />
              <input type="file" accept="image/*" onChange={(e) => uploadCover(e.target.files?.[0])} className="text-[12.5px]" />
            </div>
          </Field>

          <Field label={tr("ملف PDF (رفع أو رابط)", "PDF (upload or URL)")}>
            <div className="space-y-2">
              {form.value.pdf_file_url && <div className="text-[12.5px] text-green-700">{tr("تم الرفع:", "Uploaded:")} {form.value.pdf_file_url}</div>}
              <input type="file" accept="application/pdf" onChange={(e) => uploadPdf(e.target.files?.[0])} className="text-[12.5px]" />
              <TextInput value={form.value.external_pdf_url} onChange={(v) => form.patch("external_pdf_url", v)} placeholder={tr("رابط PDF خارجي (احتياطي)", "External PDF URL (fallback)")} />
            </div>
          </Field>

          <Field label={tr("وقت القراءة (دقيقة)", "Reading time (min)")}>
            <TextInput type="number" value={form.value.reading_time_minutes} onChange={(v) => form.patch("reading_time_minutes", Number(v) || 0)} />
          </Field>

          <SaveBar dirty={form.dirty || isNew} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
        </aside>
      </div>
    </AdminPage>
  );
}
