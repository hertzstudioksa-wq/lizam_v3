import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminPage, Field, TextInput, TextArea, Toggle, apiCall } from "@/admin/components/AdminUI";
import HelpTip from "@/admin/components/HelpTip";
import ConfirmDeleteDialog from "@/admin/components/ConfirmDeleteDialog";
import { ReorderControls, moveItem } from "@/admin/components/ReorderControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const useTr = () => {
  const { lang } = useLang();
  return (ar, en) => (lang === "ar" ? ar : en);
};

/** Simple CRUD page used for Authors + Categories. */
function SimpleCrudAdmin({ title, subtitle, resource, fields, defaultDoc, testidBase, helpAr, helpEn }) {
  const tr = useTr();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [permTarget, setPermTarget] = useState(null);

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

  async function permanentDelete() {
    if (!permTarget) return;
    const r = await apiCall("delete", `/admin/${resource}/${permTarget.id}/permanent`);
    if (!r.ok) throw new Error(r.error);
    load();
  }

  return (
    <AdminPage title={title} subtitle={subtitle} helpAr={helpAr} helpEn={helpEn}
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
                    <button onClick={() => archive(it.id)} className="ms-4 text-amber-700 hover:text-amber-900 lz-linkline text-[13px]">{tr("أرشفة", "Archive")}</button>
                    <button onClick={() => setPermTarget(it)} className="ms-4 text-red-700 hover:text-red-900 lz-linkline text-[13px]" data-testid={`${testidBase}-delete-${it.id}`}>{tr("حذف نهائي", "Delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        onConfirm={permanentDelete}
        entityName={permTarget?.title_ar || permTarget?.name_ar || permTarget?.title_en || permTarget?.name_en}
        testid={`${testidBase}-confirm-delete`}
      />
    </AdminPage>
  );
}

/** Reorder panel — used above Authors and Categories CRUD lists. */
function ReorderPanel({ resource, items, setItems, testidBase, displayKey, helpAr, helpEn }) {
  const tr = useTr();
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");
  const [draftOrder, setDraftOrder] = useState(null);

  const ordered = draftOrder || items;
  const dirty = draftOrder !== null;

  function handleMove(from, to) {
    setDraftOrder(moveItem(ordered, from, to));
  }

  async function commit() {
    setSavingOrder(true);
    const body = (draftOrder || []).map((it, idx) => ({ id: it.id, sort_order: idx }));
    const r = await apiCall("post", `/admin/${resource}/reorder`, body);
    setSavingOrder(false);
    if (r.ok) {
      setItems(draftOrder);
      setDraftOrder(null);
      setOrderMsg(tr("تم حفظ الترتيب ✓", "Order saved ✓"));
      setTimeout(() => setOrderMsg(""), 2500);
    } else {
      setOrderMsg(`${tr("خطأ","Error")}: ${r.error}`);
    }
  }

  if (!items?.length) return null;

  return (
    <section className="mb-8 max-w-[760px] bg-white border border-rule" data-testid={`${testidBase}-reorder-panel`}>
      <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-rule">
        <div>
          <h3 className="text-[14px] font-medium text-navy-deep">{tr("ترتيب العرض", "Display order")}</h3>
          <p className="text-[12px] text-mute mt-0.5">{tr(helpAr || "اسحب أو استخدم الأسهم لإعادة ترتيب العناصر كما تظهر للزائر.", helpEn || "Drag or use arrows to reorder items as they appear publicly.")}</p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDraftOrder(null)} className="text-[12.5px] text-mute hover:text-navy">
              {tr("إلغاء", "Cancel")}
            </button>
            <button type="button" onClick={commit} disabled={savingOrder}
              className="px-3 py-1.5 text-[12.5px] bg-navy-deep text-white disabled:opacity-50"
              data-testid={`${testidBase}-reorder-save`}>
              {savingOrder ? tr("جارٍ الحفظ…", "Saving…") : tr("حفظ الترتيب", "Save order")}
            </button>
          </div>
        )}
        {orderMsg && <span className="text-[12.5px] text-green-700">{orderMsg}</span>}
      </header>
      <ul className="divide-y divide-rule">
        {ordered.map((it, idx) => (
          <li key={it.id} className="flex items-center gap-3 px-5 py-2.5" data-testid={`${testidBase}-reorder-row-${it.id}`}>
            <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
            <span className="flex-1 text-[14px] text-navy-deep">{it[displayKey] || it.title_ar || it.name_ar || it.id}</span>
            <ReorderControls index={idx} total={ordered.length} onMove={handleMove} testid={`${testidBase}-reorder-${it.id}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AuthorsAdmin() {
  const tr = useTr();
  const [items, setItems] = useState([]);
  // Listen for the SimpleCrud list inside to expose its items via callback.
  // Simplest approach: fetch once here for the reorder panel, and rely on
  // SimpleCrud to refetch on its own.
  useEffect(() => {
    apiCall("get", "/admin/authors").then((r) => r.ok && setItems(r.data.items || []));
  }, []);

  return (
    <>
      <div className="px-8 md:px-10 pt-8">
        <ReorderPanel resource="authors" items={items} setItems={setItems} testidBase="author" displayKey="name_ar"
          helpAr="رتّب الباحثين كما يظهرون في الصفحة العامة. استخدم الأسهم لتغيير المواضع، ثم اضغط حفظ الترتيب."
          helpEn="Order researchers as they appear on the public page. Use arrows to move items then click Save order." />
      </div>
      <SimpleCrudAdmin
        title={tr("الباحثون", "Researchers")} subtitle={tr("إدارة المحتوى · الباحثون", "CMS · Authors")} resource="authors" testidBase="author"
        helpAr="أضف وعدّل بيانات الباحثين والمستشارين الذين يظهرون في صفحاتهم وفي بيانات الإصدارات. عطّل أي بطاقة لإخفائها من الموقع العام."
        helpEn="Add and edit profiles for researchers and contributors. Deactivate any profile to hide it from the public site."
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
      />
    </>
  );
}

export function CategoriesAdmin() {
  const tr = useTr();
  const [items, setItems] = useState([]);
  useEffect(() => {
    apiCall("get", "/admin/categories").then((r) => r.ok && setItems(r.data.items || []));
  }, []);

  return (
    <>
      <div className="px-8 md:px-10 pt-8">
        <ReorderPanel resource="categories" items={items} setItems={setItems} testidBase="cat" displayKey="title_ar"
          helpAr="رتّب المجالات كما تظهر في الصفحة الرئيسية وقائمة الإصدارات. هذا الترتيب يلغي الحاجة لتعديل رقم الترتيب اليدوي."
          helpEn="Order fields of work as they appear on the home page and publications listing. Replaces manual sort_order entry." />
      </div>
      <SimpleCrudAdmin
        title={tr("المجالات والتصنيفات", "Categories / Fields of Work")} subtitle={tr("إدارة المحتوى · التصنيف", "CMS · Taxonomy")} resource="categories" testidBase="cat"
        helpAr="عرّف مجالات عمل المركز التي تُستخدم لتصنيف الإصدارات وعرضها في الصفحة الرئيسية. الأيقونة لكل مجال تظهر كرمز بصري."
        helpEn="Define the Center's fields of work used to classify publications and display them on the home page. The icon shows as a visual marker."
        defaultDoc={{ title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "book-open", sort_order: 0, active: true }}
        fields={[
          { key: "title_ar", label: tr("العنوان بالعربية", "Title AR"), dir: "rtl" },
          { key: "title_en", label: tr("العنوان بالإنجليزية", "Title EN") },
          { key: "description_ar", label: tr("الوصف بالعربية", "Description AR"), type: "textarea", dir: "rtl" },
          { key: "description_en", label: tr("الوصف بالإنجليزية", "Description EN"), type: "textarea" },
          { key: "icon", label: tr("الأيقونة (scroll-text, scale, landmark, book-open, compass, gavel)", "Icon (scroll-text, scale, landmark, book-open, compass, gavel)") },
          { key: "active", label: tr("نشط", "Active"), type: "toggle" },
        ]}
      />
    </>
  );
}

// -------- Users --------
export function UsersAdmin() {
  const tr = useTr();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [permTarget, setPermTarget] = useState(null);

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
  async function permanentDelete() {
    if (!permTarget) return;
    const r = await apiCall("delete", `/admin/users/${permTarget.id}/permanent`);
    if (!r.ok) throw new Error(r.error);
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
    <AdminPage title={tr("المستخدمون", "Users")} subtitle={tr("إدارة المحتوى · الأعضاء", "CMS · Members")}
      helpAr="قائمة كل من سجّل في الموقع. يمكنك تغيير الدور (الصلاحيات) أو تعطيل أي حساب. تعطيل الحساب يمنع تسجيل الدخول لكن يحتفظ بالبيانات."
      helpEn="Every account that has registered on the site. Change a user's role to grant or revoke permissions, or deactivate to block sign-in while keeping the record.">
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
                  <th className="text-start p-4">{tr("إجراءات", "Actions")}</th>
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
                    <td className="p-4">
                      <button
                        onClick={() => setPermTarget(u)}
                        className="text-[12.5px] text-red-700 hover:text-red-900 lz-linkline"
                        data-testid={`user-delete-${u.id}`}
                      >
                        {tr("حذف نهائي", "Delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      <ConfirmDeleteDialog
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        onConfirm={permanentDelete}
        entityName={permTarget ? `${permTarget.name} · ${permTarget.email}` : ""}
        warningAr="سيتم حذف هذا الحساب وكل بياناته نهائياً. لا يمكن حذف حسابك الحالي أو آخر مدير عام."
        warningEn="This account and all its data will be permanently removed. You cannot delete your own account or the last Super Admin."
        testid="user-confirm-delete"
      />
    </AdminPage>
  );
}

// -------- Roles (read-only matrix) --------
export function RolesAdmin() {
  const tr = useTr();
  const [items, setItems] = useState(null);
  useEffect(() => { apiCall("get", "/admin/roles").then((r) => r.ok && setItems(r.data.items || [])); }, []);

  return (
    <AdminPage title={tr("الأدوار والصلاحيات", "Roles & Permissions")} subtitle={tr("مصفوفة مُطبَّقة على الخادم", "Server-enforced matrix")}
      helpAr="مصفوفة الأدوار: تُطبَّق صلاحياتها على الخادم لكل طلب. هذه الصفحة للعرض فقط لتوضيح ما يستطيع كل دور فعله. التعديل سيتاح في مرحلة لاحقة."
      helpEn="Role-permission matrix enforced server-side on every request. Read-only here for transparency; full editing arrives in a later phase.">
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
    { key: "registration",
      label: tr("تسجيل المستخدمين الجدد", "User registration"),
      tipAr: "عند إيقافه: تختفي صفحة /register للزوار ويرفض الخادم أي طلب تسجيل جديد. الحسابات الموجودة لا تتأثر.",
      tipEn: "When OFF: /register page becomes unavailable and the server rejects new sign-ups. Existing accounts are not affected." },
    { key: "gated_content",
      label: tr("قفل المحتوى (يطلب تسجيل دخول)", "Gated content (require login)"),
      tipAr: "المفتاح الرئيسي لنظام قفل المقالات. عند الإيقاف، تُفتح كل الإصدارات للجميع حتى لو كانت موسومة \"للمسجلين فقط\".",
      tipEn: "Master switch for the gating system. When OFF, every publication is open to all visitors regardless of its access_level." },
    { key: "google_login",
      label: tr("تسجيل الدخول بـ Google (مؤجل)", "Google login (deferred)"),
      tipAr: "يفعّل زرار \"الدخول بحساب Google\" في صفحة تسجيل الدخول. متوقف افتراضياً حتى يعتمد المركز عميل OAuth الإنتاجي.",
      tipEn: "Enables the Google sign-in button on /login. OFF by default until a production OAuth client is configured." },
    { key: "pdf_download",
      label: tr("تحميل ملفات PDF", "PDF downloads"),
      tipAr: "مفتاح عام لتحميل ملفات PDF. عند الإيقاف، تختفي أزرار التحميل ويرفض الخادم تنزيل أي ملف PDF.",
      tipEn: "Global PDF download switch. When OFF, all download buttons disappear and the server rejects PDF stream requests." },
    { key: "research_responses",
      label: tr("استقبال الردود البحثية", "Research responses"),
      tipAr: "تفعيل نموذج إرسال الردود البحثية على صفحة كل إصدار. عند الإيقاف، يختفي النموذج ويرفض الخادم الإرسالات الجديدة.",
      tipEn: "Enables the response submission form on each publication page. When OFF, the form is hidden and submissions are rejected." },
    { key: "public_responses",
      label: tr("عرض الردود المعتمدة للعموم", "Show approved responses publicly"),
      tipAr: "إذا فُعِّل، تظهر الردود التي اعتمدتها الإدارة في أسفل صفحة الإصدار. مستقل عن مفتاح \"استقبال الردود\".",
      tipEn: "When ON, responses approved by moderators appear at the bottom of each publication page. Independent of the submission switch." },
    { key: "authors_public_page",
      label: tr("صفحة الباحثين العامة", "Public Authors page"),
      tipAr: "تفعيل صفحة /authors التي تعرض كل الباحثين والمستشارين. متوقف افتراضياً.",
      tipEn: "Enables /authors public listing of all researchers. OFF by default." },
    { key: "contact_form",
      label: tr("نموذج التواصل", "Contact form"),
      tipAr: "نموذج التواصل في صفحة /contact. عند الإيقاف يظهر بدلاً منه عنوان البريد الإلكتروني فقط.",
      tipEn: "/contact page form. When OFF, only the contact email is shown as a fallback." },
    { key: "policy_pages",
      label: tr("صفحات السياسات والخصوصية والشروط", "Policy / Privacy / Terms pages"),
      tipAr: "تفعيل صفحات السياسات في الفوتر. يجب رفع المحتوى أولاً قبل التفعيل.",
      tipEn: "Enables policy pages linked from the footer. Add content before turning ON." },
    { key: "featured_publications",
      label: tr("الإصدارات المميّزة في الرئيسية", "Featured publications on home"),
      tipAr: "إظهار قسم \"أحدث الإصدارات\" في الصفحة الرئيسية. عند الإيقاف يُخفى القسم بالكامل.",
      tipEn: "Show the Featured publications section on the home page. When OFF the section is hidden entirely." },
    { key: "social_icons",
      label: tr("أيقونات التواصل الاجتماعي في التذييل", "Social media icons in footer"),
      tipAr: "إظهار أيقونات Twitter / LinkedIn / YouTube في الفوتر إذا أُدخلت روابطها في الإعدادات.",
      tipEn: "Show Twitter / LinkedIn / YouTube icons in the footer when their URLs are set in Site Settings." },
  ];

  if (!toggles) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  return (
    <AdminPage
      title={tr("مفاتيح الميزات", "Feature Toggles")}
      subtitle={tr("مفاتيح عامة للتحكم بسلوك الموقع", "Global switches")}
      helpAr="مفاتيح عامة تتحكم بسلوك الموقع لكل الزوار. التغييرات تنعكس فوراً بعد الحفظ. كل مفتاح له شرح تقني — مرّر الفأرة على أيقونة المعلومات لمعرفة أثره الدقيق."
      helpEn="Global switches that affect every visitor. Changes apply immediately on save. Hover the info icon next to each toggle for the precise behaviour it controls."
    >
      {msg && <div className="mb-4 text-[13px] text-green-700">{msg}</div>}
      {saving && <div className="mb-4 text-[13px] text-mute">{tr("جارٍ الحفظ…", "Saving…")}</div>}
      <div className="space-y-2 max-w-xl">
        {rows.map((r) => (
          <div key={r.key} className="flex items-stretch">
            <div className="flex-1">
              <Toggle checked={!!toggles[r.key]} onChange={(v) => save({ ...toggles, [r.key]: v })}
                label={<span className="inline-flex items-center">{r.label}<HelpTip ar={r.tipAr} en={r.tipEn} testid={`toggle-tip-${r.key}`} /></span>}
                testid={`toggle-${r.key}`} />
            </div>
          </div>
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
  const [permTarget, setPermTarget] = useState(null);

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

  async function permanentDelete() {
    if (!permTarget) return;
    const r = await apiCall("delete", `/admin/messages/${permTarget.id}/permanent`);
    if (!r.ok) throw new Error(r.error);
    load();
  }

  const filtered = items?.filter((m) => !filter || (m.status || "new") === filter) || [];
  const FILTERS = [
    ["", tr("الكل", "All")],
    ["new", tr("جديد", "New")],
    ["read", tr("مقروء", "Read")],
    ["archived", tr("مؤرشف", "Archived")],
  ];

  return (
    <AdminPage title={tr("رسائل التواصل", "Contact Messages")} subtitle={tr("صندوق الوارد · تخزين فقط (إرسال البريد متوقف حتى تفعيل Resend)", "Inbox · Store only (email delivery deferred until Resend key configured)")}
      helpAr="رسائل نموذج التواصل العام. تُخزَّن جميعها في قاعدة البيانات. عند تفعيل خدمة Resend مستقبلاً، سترسل أيضاً إلى بريد المركز تلقائياً. تستطيع تعليم الرسالة كمقروءة أو أرشفتها."
      helpEn="Submissions from the public contact form. All stored in the database. When Resend is configured later, they'll also forward to the Center inbox automatically. Mark messages as read or archive them.">
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
                        <button className="text-[11px] px-2 py-1 border border-red-300 hover:border-red-600 text-red-700"
                                onClick={() => setPermTarget(m)} data-testid={`message-action-delete-${m.id}`}>{tr("حذف نهائي", "Delete")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      <ConfirmDeleteDialog
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        onConfirm={permanentDelete}
        entityName={permTarget ? `${permTarget.name || "—"} · ${permTarget.email || "—"} · ${permTarget.subject || tr("(بدون موضوع)", "(no subject)")}` : ""}
        testid="message-confirm-delete"
      />
    </AdminPage>
  );
}
