import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, FileText, ArrowLeft } from "lucide-react";
import { AdminPage, Field, TextInput, TextArea, Select, Toggle, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import TiptapField from "@/admin/components/TiptapField";
import { api, formatApiError } from "@/lib/api";

// ---------------- LIST ----------------
export function PublicationsListAdmin() {
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
    <AdminPage title="Publications" subtitle="CMS · Research library"
      actions={<Link to="/admin/publications/new" className="lz-btn-primary" data-testid="new-pub-btn"><Plus size={15} /><span>New publication</span></Link>}>
      <div className="flex flex-wrap gap-3 mb-6">
        <TextInput value={q} onChange={setQ} placeholder="Search title / tag…" testid="pub-list-search" />
        <Select value={status} onChange={setStatus} options={[
          { value: "", label: "All statuses" },
          { value: "draft", label: "Draft" },
          { value: "under_review", label: "Under review" },
          { value: "published", label: "Published" },
          { value: "archived", label: "Archived" },
        ]} testid="pub-list-status" />
      </div>
      <div className="bg-white border border-rule">
        {items === null ? (
          <div className="p-10 text-mute">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-mute text-center">No publications.</div>
        ) : (
          <table className="w-full text-[14px]" data-testid="pub-list-table">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                <th className="text-start p-4">Title</th>
                <th className="text-start p-4">Type</th>
                <th className="text-start p-4">Access</th>
                <th className="text-start p-4">Status</th>
                <th className="text-start p-4 tabular-nums">Views</th>
                <th className="text-start p-4">Updated</th>
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
                  <td className="p-4"><StatusPill s={p.status} /></td>
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

function StatusPill({ s }) {
  const map = { draft: "bg-rule text-ink", under_review: "bg-amber-100 text-amber-900",
                published: "bg-green-100 text-green-900", archived: "bg-red-50 text-red-900" };
  return <span className={`px-2 py-1 text-[11px] uppercase tracking-wide ${map[s] || "bg-rule"}`}>{s}</span>;
}

// ---------------- EDIT ----------------
export function PublicationEditAdmin() {
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
      setMsg("Saved ✓");
      if (isNew) nav(`/admin/publications/${r.data.id}`, { replace: true });
      setTimeout(() => setMsg(""), 2500);
    } else setMsg(`Error: ${r.error}`);
  }

  async function uploadPdf(file) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/pdf", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch("pdf_file_url", data.url);
    } catch (e) { setMsg(`Upload: ${formatApiError(e.response?.data?.detail) || e.message}`); }
  }
  async function uploadCover(file) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch("cover_image_url", data.url);
    } catch (e) { setMsg(`Upload: ${formatApiError(e.response?.data?.detail) || e.message}`); }
  }

  if (!loaded) return <div className="p-10 text-mute">Loading…</div>;

  const toggleAuthor = (aid) => {
    const list = form.value.author_ids || [];
    form.patch("author_ids", list.includes(aid) ? list.filter((x) => x !== aid) : [...list, aid]);
  };

  return (
    <AdminPage
      title={isNew ? "New publication" : (form.value.title_ar || form.value.title_en || "Edit publication")}
      subtitle="CMS · Editor"
      actions={<Link to="/admin/publications" className="lz-btn-ghost"><ArrowLeft size={15} /> Back</Link>}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Title AR"><TextInput value={form.value.title_ar} onChange={(v) => form.patch("title_ar", v)} dir="rtl" testid="pub-title-ar" /></Field>
            <Field label="Title EN"><TextInput value={form.value.title_en} onChange={(v) => form.patch("title_en", v)} testid="pub-title-en" /></Field>
            <Field label="Slug AR" hint="Auto-generated from title if empty"><TextInput value={form.value.slug_ar} onChange={(v) => form.patch("slug_ar", v)} dir="rtl" testid="pub-slug-ar" /></Field>
            <Field label="Slug EN"><TextInput value={form.value.slug_en} onChange={(v) => form.patch("slug_en", v)} testid="pub-slug-en" /></Field>
            <Field label="Summary AR"><TextArea value={form.value.summary_ar} onChange={(v) => form.patch("summary_ar", v)} dir="rtl" rows={3} testid="pub-summary-ar" /></Field>
            <Field label="Summary EN"><TextArea value={form.value.summary_en} onChange={(v) => form.patch("summary_en", v)} rows={3} testid="pub-summary-en" /></Field>
          </div>

          <div>
            <h3 className="lz-h3 mb-3">Article — Arabic (RTL)</h3>
            <TiptapField value={form.value.content_html_ar} onChange={(v) => form.patch("content_html_ar", v)} dir="rtl" testid="tiptap-ar" />
          </div>
          <div>
            <h3 className="lz-h3 mb-3">Article — English (LTR)</h3>
            <TiptapField value={form.value.content_html_en} onChange={(v) => form.patch("content_html_en", v)} dir="ltr" testid="tiptap-en" />
          </div>
          <div>
            <h3 className="lz-h3 mb-3">Preview (shown to gated readers) AR</h3>
            <TiptapField value={form.value.preview_html_ar} onChange={(v) => form.patch("preview_html_ar", v)} dir="rtl" testid="tiptap-preview-ar" />
          </div>
          <div>
            <h3 className="lz-h3 mb-3">Preview EN</h3>
            <TiptapField value={form.value.preview_html_en} onChange={(v) => form.patch("preview_html_en", v)} dir="ltr" testid="tiptap-preview-en" />
          </div>
        </div>

        {/* Side metadata panel */}
        <aside className="space-y-5 xl:sticky xl:top-6 self-start">
          <Field label="Status">
            <Select value={form.value.status} onChange={(v) => form.patch("status", v)} options={[
              { value: "draft", label: "Draft" },
              { value: "under_review", label: "Under review" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]} testid="pub-status" />
          </Field>
          <Field label="Type">
            <Select value={form.value.publication_type} onChange={(v) => form.patch("publication_type", v)} options={[
              { value: "study", label: "Study" },
              { value: "research", label: "Research" },
              { value: "policy_paper", label: "Policy paper" },
              { value: "report", label: "Report" },
              { value: "essay", label: "Essay" },
              { value: "opinion", label: "Opinion" },
            ]} testid="pub-type" />
          </Field>
          <Field label="Category / Field">
            <Select value={form.value.category_id || ""} onChange={(v) => form.patch("category_id", v)} options={[
              { value: "", label: "— none —" },
              ...categories.map((c) => ({ value: c.id, label: c.title_en || c.title_ar })),
            ]} testid="pub-category" />
          </Field>
          <Field label="Access level">
            <Select value={form.value.access_level} onChange={(v) => form.patch("access_level", v)} options={[
              { value: "public", label: "Public" },
              { value: "preview_login", label: "Preview + login" },
              { value: "registered", label: "Registered only" },
              { value: "hidden", label: "Hidden / draft" },
            ]} testid="pub-access" />
          </Field>
          <Field label="PDF access">
            <Select value={form.value.pdf_access_level} onChange={(v) => form.patch("pdf_access_level", v)} options={[
              { value: "public", label: "Public" },
              { value: "login_required", label: "Login required" },
              { value: "admin_only", label: "Admin only" },
              { value: "disabled", label: "Disabled" },
            ]} testid="pub-pdf-access" />
          </Field>
          <Toggle checked={!!form.value.featured} onChange={(v) => form.patch("featured", v)} label="Featured" testid="pub-featured" />
          <Toggle checked={!!form.value.responses_enabled} onChange={(v) => form.patch("responses_enabled", v)} label="Responses enabled" testid="pub-responses" />

          <Field label="Authors">
            <div className="space-y-1 max-h-52 overflow-auto bg-white border border-rule p-2">
              {authors.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-[13px] p-1 hover:bg-ivory-cream cursor-pointer">
                  <input type="checkbox" checked={(form.value.author_ids || []).includes(a.id)} onChange={() => toggleAuthor(a.id)} />
                  <span>{a.name_en || a.name_ar}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Tags (comma-separated)">
            <TextInput value={(form.value.tags || []).join(", ")} onChange={(v) => form.patch("tags", v.split(",").map((s) => s.trim()).filter(Boolean))} testid="pub-tags" />
          </Field>

          <Field label="Cover image">
            <div className="space-y-2">
              {form.value.cover_image_url && <img src={form.value.cover_image_url} alt="" className="border border-rule max-h-32" />}
              <TextInput value={form.value.cover_image_url} onChange={(v) => form.patch("cover_image_url", v)} />
              <input type="file" accept="image/*" onChange={(e) => uploadCover(e.target.files?.[0])} className="text-[12.5px]" />
            </div>
          </Field>

          <Field label="PDF (upload or URL)">
            <div className="space-y-2">
              {form.value.pdf_file_url && <div className="text-[12.5px] text-green-700">Uploaded: {form.value.pdf_file_url}</div>}
              <input type="file" accept="application/pdf" onChange={(e) => uploadPdf(e.target.files?.[0])} className="text-[12.5px]" />
              <TextInput value={form.value.external_pdf_url} onChange={(v) => form.patch("external_pdf_url", v)} placeholder="External PDF URL (fallback)" />
            </div>
          </Field>

          <Field label="Reading time (min)">
            <TextInput type="number" value={form.value.reading_time_minutes} onChange={(v) => form.patch("reading_time_minutes", Number(v) || 0)} />
          </Field>

          <SaveBar dirty={form.dirty || isNew} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
        </aside>
      </div>
    </AdminPage>
  );
}
