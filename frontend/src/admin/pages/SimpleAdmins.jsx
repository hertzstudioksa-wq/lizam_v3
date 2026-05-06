import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminPage, Field, TextInput, TextArea, Toggle, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const useTr = () => {
  const { lang } = useLang();
  return (ar, en) => (lang === "ar" ? ar : en);
};

/** Simple CRUD page used for Authors + Categories. */
function SimpleCrudAdmin({ title, subtitle, resource, fields, defaultDoc, testidBase }) {
  const tr = useTr();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);

  async function load() {
    const r = await apiCall("get", `/admin/${resource}`);
    if (r.ok) setItems(r.data.items || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function save() {
    const isNew = !editing.id;
    const r = isNew
      ? await apiCall("post", `/admin/${resource}`, editing)
      : await apiCall("patch", `/admin/${resource}/${editing.id}`, editing);
    if (r.ok) { setEditing(null); load(); }
  }

  async function archive(id) {
    if (!window.confirm(tr("هل تريد أرشفة هذا العنصر؟", "Archive this item?"))) return;
    await apiCall("delete", `/admin/${resource}/${id}`);
    load();
  }

  return (
    <AdminPage title={title} subtitle={subtitle}
      actions={<button type="button" className="lz-btn-primary" onClick={() => setEditing({ ...defaultDoc })} data-testid={`${testidBase}-new`}><Plus size={15} /><span>{tr("جديد", "New")}</span></button>}>
      {editing && (
        <div className="mb-8 border border-navy/20 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="lz-h3">{editing.id ? tr("تعديل", "Edit") : tr("جديد", "New")}</h3>
            <button onClick={() => setEditing(null)} className="text-mute hover:text-navy"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.type === "textarea" ? (
                  <TextArea value={editing[f.key] ?? ""} onChange={(v) => setEditing({ ...editing, [f.key]: v })} dir={f.dir} rows={f.rows || 3} testid={`${testidBase}-${f.key}`} />
                ) : f.type === "toggle" ? (
                  <Toggle checked={!!editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} label={f.label} testid={`${testidBase}-${f.key}`} />
                ) : f.type === "number" ? (
                  <TextInput type="number" value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: Number(v) || 0 })} testid={`${testidBase}-${f.key}`} />
                ) : (
                  <TextInput value={editing[f.key] ?? ""} onChange={(v) => setEditing({ ...editing, [f.key]: v })} dir={f.dir} testid={`${testidBase}-${f.key}`} />
                )}
              </Field>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={save} className="lz-btn-primary" data-testid={`${testidBase}-save`}>{tr("حفظ", "Save")}</button>
            <button type="button" onClick={() => setEditing(null)} className="lz-btn-ghost">{tr("إلغاء", "Cancel")}</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-rule">
        {items === null ? (
          <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-mute text-center">{tr("لا توجد عناصر.", "No items.")}</div>
        ) : (
          <table className="w-full text-[14px]" data-testid={`${testidBase}-table`}>
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                <th className="text-start p-4">{tr("العربية", "Arabic")}</th>
                <th className="text-start p-4">{tr("الإنجليزية", "English")}</th>
                <th className="text-start p-4">{tr("الحالة", "Active")}</th>
                <th className="text-start p-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-rule last:border-0 hover:bg-ivory-cream" data-testid={`${testidBase}-row-${it.id}`}>
                  <td className="p-4 text-navy">{it.name_ar || it.title_ar}</td>
                  <td className="p-4 text-mute">{it.name_en || it.title_en}</td>
                  <td className="p-4 text-[12.5px]">{it.active === false ? <span className="text-mute">{tr("غير نشط", "Inactive")}</span> : <span className="text-green-700">{tr("نشط", "Active")}</span>}</td>
                  <td className="p-4 text-end">
                    <button onClick={() => setEditing({ ...it })} className="text-navy hover:text-brass lz-linkline text-[13px]" data-testid={`${testidBase}-edit-${it.id}`}>{tr("تعديل", "Edit")}</button>
                    <button onClick={() => archive(it.id)} className="ms-4 text-red-700 hover:text-red-900 lz-linkline text-[13px]">{tr("أرشفة", "Archive")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPage>
  );
}

export function AuthorsAdmin() {
  const tr = useTr();
  return <SimpleCrudAdmin
    title={tr("الباحثون", "Researchers")} subtitle={tr("إدارة المحتوى · الباحثون", "CMS · Authors")} resource="authors" testidBase="author"
    defaultDoc={{ name_ar: "", name_en: "", title_ar: "", title_en: "", bio_ar: "", bio_en: "", active: true }}
    fields={[
      { key: "name_ar", label: tr("الاسم بالعربية", "Name AR"), dir: "rtl" },
      { key: "name_en", label: tr("الاسم بالإنجليزية", "Name EN") },
      { key: "title_ar", label: tr("الصفة بالعربية", "Title AR"), dir: "rtl" },
      { key: "title_en", label: tr("الصفة بالإنجليزية", "Title EN") },
      { key: "bio_ar", label: tr("نبذة بالعربية", "Bio AR"), type: "textarea", dir: "rtl" },
      { key: "bio_en", label: tr("نبذة بالإنجليزية", "Bio EN"), type: "textarea" },
      { key: "photo_url", label: tr("رابط الصورة", "Photo URL") },
      { key: "email", label: tr("البريد الإلكتروني", "Email") },
      { key: "linkedin", label: "LinkedIn" },
      { key: "active", label: tr("نشط", "Active"), type: "toggle" },
    ]}
  />;
}

export function CategoriesAdmin() {
  const tr = useTr();
  return <SimpleCrudAdmin
    title={tr("المجالات والتصنيفات", "Categories / Fields of Work")} subtitle={tr("إدارة المحتوى · التصنيف", "CMS · Taxonomy")} resource="categories" testidBase="cat"
    defaultDoc={{ title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "book-open", sort_order: 0, active: true }}
    fields={[
      { key: "title_ar", label: tr("العنوان بالعربية", "Title AR"), dir: "rtl" },
      { key: "title_en", label: tr("العنوان بالإنجليزية", "Title EN") },
      { key: "description_ar", label: tr("الوصف بالعربية", "Description AR"), type: "textarea", dir: "rtl" },
      { key: "description_en", label: tr("الوصف بالإنجليزية", "Description EN"), type: "textarea" },
      { key: "icon", label: tr("الأيقونة (scroll-text, scale, landmark, book-open, compass, gavel)", "Icon (scroll-text, scale, landmark, book-open, compass, gavel)") },
      { key: "sort_order", label: tr("ترتيب العرض", "Sort order"), type: "number" },
      { key: "active", label: tr("نشط", "Active"), type: "toggle" },
    ]}
  />;
}

// -------- Users --------
export function UsersAdmin() {
  const tr = useTr();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const r = await apiCall("get", `/admin/users?${params}`);
    if (r.ok) setItems(r.data.items || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  async function changeRole(userId, role) {
    await apiCall("patch", `/admin/users/${userId}`, { role });
    load();
  }
  async function toggleActive(userId, active) {
    await apiCall("patch", `/admin/users/${userId}`, { status: active ? "active" : "deactivated" });
    load();
  }

  const ROLE_LABELS = {
    super_admin: tr("مدير عام", "Super Admin"),
    admin: tr("مدير", "Admin"),
    editor: tr("محرّر", "Editor"),
    reviewer: tr("مراجع", "Reviewer"),
    registered: tr("مسجّل", "Registered"),
  };

  return (
    <AdminPage title={tr("المستخدمون", "Users")} subtitle={tr("إدارة المحتوى · الأعضاء", "CMS · Members")}>
      <div className="mb-6 max-w-sm">
        <TextInput value={q} onChange={setQ} placeholder={tr("بحث بالاسم أو البريد…", "Search by name or email…")} testid="users-search" />
      </div>
      <div className="bg-white border border-rule">
        {items === null ? <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>
          : items.length === 0 ? <div className="p-10 text-mute text-center">{tr("لا يوجد مستخدمون.", "No users.")}</div>
          : (
            <table className="w-full text-[14px]" data-testid="users-table">
              <thead>
                <tr className="text-[11.5px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                  <th className="text-start p-4">{tr("الاسم", "Name")}</th>
                  <th className="text-start p-4">{tr("البريد", "Email")}</th>
                  <th className="text-start p-4">{tr("الدور", "Role")}</th>
                  <th className="text-start p-4">{tr("الحالة", "Status")}</th>
                  <th className="text-start p-4">{tr("تاريخ الانضمام", "Joined")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-rule last:border-0" data-testid={`user-row-${u.id}`}>
                    <td className="p-4 text-navy">{u.name}</td>
                    <td className="p-4 text-mute">{u.email}</td>
                    <td className="p-4">
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-[13px] border border-rule h-8 px-2 bg-white" data-testid={`role-${u.id}`}>
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleActive(u.id, u.status !== "active")}
                        className="text-[12.5px] text-navy hover:text-brass lz-linkline">
                        {u.status === "active" ? tr("نشط · إلغاء التفعيل", "Active · Deactivate") : tr("غير نشط · تفعيل", "Inactive · Activate")}
                      </button>
                    </td>
                    <td className="p-4 text-mute text-[12.5px]">{(u.created_at || "").slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </AdminPage>
  );
}

// -------- Roles (read-only matrix) --------
export function RolesAdmin() {
  const tr = useTr();
  const [items, setItems] = useState(null);
  useEffect(() => { apiCall("get", "/admin/roles").then((r) => r.ok && setItems(r.data.items || [])); }, []);

  return (
    <AdminPage title={tr("الأدوار والصلاحيات", "Roles & Permissions")} subtitle={tr("مصفوفة مُطبَّقة على الخادم", "Server-enforced matrix")}>
      <p className="lz-lede mb-6 max-w-[60ch]">{tr("الأدوار يتم فرضها على مستوى الخادم. هذه الواجهة للعرض فقط — التعديل يتطلب مدير عام (سيُتاح التعديل في مرحلة قادمة).", "Roles are enforced server-side. This view is read-only — contact a Super Admin to modify (editable in a future phase).")}</p>
      <div className="bg-white border border-rule">
        {items === null ? <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div> : (
          <table className="w-full text-[14px]" data-testid="roles-table">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                <th className="text-start p-4">{tr("الدور", "Role")}</th>
                <th className="text-start p-4">{tr("المعرّف", "Key")}</th>
                <th className="text-start p-4">{tr("الصلاحيات", "Permissions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.key} className="border-b border-rule last:border-0" data-testid={`role-row-${r.key}`}>
                  <td className="p-4 text-navy">{r.name_ar} · {r.name_en}</td>
                  <td className="p-4 text-mute tabular-nums">{r.key}</td>
                  <td className="p-4 text-[12.5px]">
                    <div className="flex flex-wrap gap-1.5">
                      {(r.permissions || []).map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-paper border border-rule">{p}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPage>
  );
}

// -------- Feature toggles --------
export function TogglesAdmin() {
  const tr = useTr();
  const [toggles, setToggles] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { apiCall("get", "/admin/toggles").then((r) => r.ok && setToggles(r.data)); }, []);

  async function save(next) {
    setToggles(next);
    setSaving(true);
    const r = await apiCall("patch", "/admin/toggles", next);
    setSaving(false);
    if (r.ok) {
      invalidateSiteCache("site");
      setMsg(tr("تم الحفظ ✓", "Saved ✓"));
      setTimeout(() => setMsg(""), 1500);
    }
  }

  const rows = [
    { key: "registration", label: tr("تسجيل المستخدمين الجدد", "User registration") },
    { key: "gated_content", label: tr("قفل المحتوى (يطلب تسجيل دخول)", "Gated content (require login)") },
    { key: "google_login", label: tr("تسجيل الدخول بـ Google (مؤجل)", "Google login (deferred)") },
    { key: "pdf_download", label: tr("تحميل ملفات PDF", "PDF downloads") },
    { key: "research_responses", label: tr("استقبال الردود البحثية", "Research responses") },
    { key: "public_responses", label: tr("عرض الردود المعتمدة للعموم", "Show approved responses publicly") },
    { key: "authors_public_page", label: tr("صفحة الباحثين العامة", "Public Authors page") },
    { key: "contact_form", label: tr("نموذج التواصل", "Contact form") },
    { key: "policy_pages", label: tr("صفحات السياسات والخصوصية والشروط", "Policy / Privacy / Terms pages") },
    { key: "featured_publications", label: tr("الإصدارات المميّزة في الرئيسية", "Featured publications on home") },
    { key: "social_icons", label: tr("أيقونات التواصل الاجتماعي في التذييل", "Social media icons in footer") },
  ];

  if (!toggles) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  return (
    <AdminPage title={tr("مفاتيح الميزات", "Feature Toggles")} subtitle={tr("مفاتيح عامة للتحكم بسلوك الموقع", "Global switches")}>
      {msg && <div className="mb-4 text-[13px] text-green-700">{msg}</div>}
      {saving && <div className="mb-4 text-[13px] text-mute">{tr("جارٍ الحفظ…", "Saving…")}</div>}
      <div className="space-y-2 max-w-xl">
        {rows.map((r) => (
          <Toggle key={r.key} checked={!!toggles[r.key]} onChange={(v) => save({ ...toggles, [r.key]: v })} label={r.label} testid={`toggle-${r.key}`} />
        ))}
      </div>
    </AdminPage>
  );
}

// -------- Messages --------
export function MessagesAdmin() {
  const tr = useTr();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await apiCall("get", "/admin/messages");
    if (r.ok) setItems(r.data.items || []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    const r = await apiCall("patch", `/admin/messages/${id}`, { status });
    if (r.ok) { setMsg(tr(`تم التحديث إلى ${status} ✓`, `Marked ${status} ✓`)); setTimeout(() => setMsg(""), 2000); load(); }
    else setMsg(`${tr("ملاحظة", "Note")}: ${r.error}`);
  }

  const filtered = items?.filter((m) => !filter || (m.status || "new") === filter) || [];
  const FILTERS = [
    ["", tr("الكل", "All")],
    ["new", tr("جديد", "New")],
    ["read", tr("مقروء", "Read")],
    ["archived", tr("مؤرشف", "Archived")],
  ];

  return (
    <AdminPage title={tr("رسائل التواصل", "Contact Messages")} subtitle={tr("صندوق الوارد · تخزين فقط (إرسال البريد متوقف حتى تفعيل Resend)", "Inbox · Store only (email delivery deferred until Resend key configured)")}>
      {msg && <div className="mb-4 px-4 py-2 bg-paper border-l-2 border-brass text-[13px]">{msg}</div>}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {FILTERS.map(([k, label]) => (
          <button key={k || "all"} type="button"
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-[13px] border ${filter === k ? "bg-navy-deep text-white border-navy-deep" : "bg-white text-ink border-rule"}`}
            data-testid={`messages-filter-${k || "all"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="bg-white border border-rule">
        {items === null ? <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>
          : filtered.length === 0 ? <div className="p-10 text-mute text-center">{tr("لا توجد رسائل بعد. الرسائل الواردة من نموذج التواصل ستظهر هنا.", "No messages yet. Public contact form submissions will land here.")}</div>
          : (
            <table className="w-full text-[14px]" data-testid="messages-table">
              <thead>
                <tr className="text-[11.5px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                  <th className="text-start p-4">{tr("الحالة", "Status")}</th>
                  <th className="text-start p-4">{tr("من", "From")}</th>
                  <th className="text-start p-4">{tr("الموضوع / الرسالة", "Subject / Message")}</th>
                  <th className="text-start p-4">{tr("تاريخ الاستلام", "Received")}</th>
                  <th className="text-start p-4">{tr("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-rule last:border-0 align-top" data-testid={`message-row-${m.id}`}>
                    <td className="p-4">
                      <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 border border-rule">{m.status || "new"}</span>
                    </td>
                    <td className="p-4">{m.name}<div className="text-[12px] text-mute mt-0.5">{m.email}</div></td>
                    <td className="p-4">
                      <div className="text-[14px] text-navy-deep font-medium">{m.subject || <em className="text-mute">{tr("(بدون موضوع)", "(no subject)")}</em>}</div>
                      <div className="text-[12.5px] text-mute mt-1 max-w-[55ch]">{m.message}</div>
                    </td>
                    <td className="p-4 text-mute text-[12.5px] whitespace-nowrap tabular-nums">{(m.created_at || "").slice(0, 10)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        <button className="text-[11px] px-2 py-1 border border-rule hover:border-navy"
                                onClick={() => setStatus(m.id, "read")} data-testid={`message-action-read-${m.id}`}>{tr("تحديد كمقروء", "Mark read")}</button>
                        <button className="text-[11px] px-2 py-1 border border-rule hover:border-navy text-mute"
                                onClick={() => setStatus(m.id, "archived")} data-testid={`message-action-archive-${m.id}`}>{tr("أرشفة", "Archive")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </AdminPage>
  );
}
