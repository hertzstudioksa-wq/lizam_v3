import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminPage, Field, TextInput, TextArea, Toggle, apiCall } from "@/admin/components/AdminUI";
import HelpTip from "@/admin/components/HelpTip";
import ConfirmDeleteDialog from "@/admin/components/ConfirmDeleteDialog";
import { ImageUploader } from "@/admin/components/sectionControls";
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
                ) : f.type === "image" ? (
                  <ImageUploader value={editing[f.key] ?? ""} onChange={(v) => setEditing({ ...editing, [f.key]: v })} label={f.label} hint={f.hint} testid={`${testidBase}-${f.key}`} />
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
                  <td className="p-4 text-[12.5px]">{it.active === false ? <span className="text-mute">{tr("مخفي", "Hidden")}</span> : <span className="text-green-700">{tr("ظاهر على الموقع", "Visible")}</span>}</td>
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
  return (
    <SimpleCrudAdmin
      title={tr("الباحثون", "Researchers")}
      subtitle={tr("إدارة المحتوى · الباحثون", "CMS · Authors")}
      resource="authors" testidBase="author"
      helpAr="أضف وعدّل بيانات الباحثين والمستشارين الذين يظهرون في بيانات الإصدارات. عطّل أي بطاقة لإخفائها."
      helpEn="Add and edit researcher profiles shown on publications. Deactivate any profile to hide it."
      defaultDoc={{ name_ar: "", name_en: "", title_ar: "", title_en: "", bio_ar: "", bio_en: "", photo_url: "", email: "", linkedin: "", active: false, is_fellow: false }}
      fields={[
        { key: "name_ar",   label: tr("الاسم بالعربية", "Name AR"), dir: "rtl" },
        { key: "name_en",   label: tr("الاسم بالإنجليزية", "Name EN") },
        { key: "title_ar",  label: tr("الصفة / المنصب — عربية", "Title AR"), dir: "rtl" },
        { key: "title_en",  label: tr("الصفة / المنصب — إنجليزية", "Title EN") },
        { key: "bio_ar",    label: tr("نبذة بالعربية", "Bio AR"), type: "textarea", dir: "rtl", rows: 3 },
        { key: "bio_en",    label: tr("نبذة بالإنجليزية", "Bio EN"), type: "textarea", rows: 3 },
        { key: "photo_url", label: tr("صورة الباحث", "Author photo"), type: "image", hint: tr("يفضّل صورة مربعة، وجه واضح.", "Square crop preferred, clear face.") },
        { key: "email",     label: tr("البريد الإلكتروني", "Email") },
        { key: "linkedin",  label: "LinkedIn" },
        { key: "active",    label: tr("إظهار على الموقع", "Show on website"), type: "toggle" },
        { key: "is_fellow", label: tr("زميل لزام (يظهر في صفحة الزملاء)", "LIZAM Fellow (appears in Fellows page)"), type: "toggle" },
      ]}
    />
  );
}

export function CategoriesAdmin() {
  const tr = useTr();
  return (
    <SimpleCrudAdmin
      title={tr("المجالات والتصنيفات", "Categories / Fields of Work")}
      subtitle={tr("إدارة المحتوى · التصنيف", "CMS · Taxonomy")}
      resource="categories" testidBase="cat"
      helpAr="عرّف مجالات عمل المركز التي تُستخدم لتصنيف الإصدارات وعرضها في الصفحة الرئيسية."
      helpEn="Define the Center's fields of work used to classify publications and display them on the home page."
      defaultDoc={{ title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "book-open", active: true }}
      fields={[
        { key: "title_ar",       label: tr("العنوان بالعربية", "Title AR"), dir: "rtl" },
        { key: "title_en",       label: tr("العنوان بالإنجليزية", "Title EN") },
        { key: "description_ar", label: tr("الوصف بالعربية", "Description AR"), type: "textarea", dir: "rtl" },
        { key: "description_en", label: tr("الوصف بالإنجليزية", "Description EN"), type: "textarea" },
        { key: "icon",           label: tr("الأيقونة (scroll-text, scale, landmark, book-open, compass, gavel)", "Icon") },
        { key: "active",         label: tr("نشط", "Active"), type: "toggle" },
      ]}
    />
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

  const [activeTab, setActiveTab] = useState("users");
  const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "reviewer"]);
  const admins  = (items || []).filter(u => ADMIN_ROLES.has(u.role));
  const members = (items || []).filter(u => !ADMIN_ROLES.has(u.role));

  const UserRow = (u) => (
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
          className={`text-[12.5px] lz-linkline ${u.status === "active" ? "text-green-700 hover:text-green-900" : "text-mute hover:text-navy"}`}>
          {u.status === "active" ? tr("نشط · تعطيل", "Active · Deactivate") : tr("معطّل · تفعيل", "Inactive · Activate")}
        </button>
      </td>
      <td className="p-4 text-mute text-[12.5px]">{(u.created_at || "").slice(0,10)}</td>
      <td className="p-4">
        <button onClick={() => setPermTarget(u)}
          className="text-[12.5px] text-red-700 hover:text-red-900 lz-linkline"
          data-testid={`user-delete-${u.id}`}>
          {tr("حذف نهائي", "Delete")}
        </button>
      </td>
    </tr>
  );

  const TableHead = () => (
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
  );

  return (
    <AdminPage title={tr("المستخدمون والصلاحيات", "Users & Permissions")} subtitle={tr("إدارة الحسابات · الأدوار", "Accounts · Roles")}
      helpAr="قائمة كل من سجّل في الموقع. يمكنك تغيير الدور (الصلاحيات) أو تعطيل أي حساب. في الأسفل شرح لكل دور."
      helpEn="Every account registered on the site. Change a user's role or deactivate their account. Scroll down for a full roles guide.">
      {/* ── Tabs ── */}
      <div className="flex items-stretch border-b border-rule mb-8">
        {[
          { key: "users",  labelAr: "المستخدمون",   labelEn: "Users" },
          { key: "roles",  labelAr: "الصلاحيات",    labelEn: "Permissions" },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`inline-flex items-center gap-2 px-5 py-3 text-[13.5px] -mb-px border-b-2 transition-colors ${
              activeTab === t.key ? "border-brass text-navy-deep" : "border-transparent text-mute hover:text-navy-deep"
            }`}>
            {tr(t.labelAr, t.labelEn)}
          </button>
        ))}
      </div>

      {/* ── Users tab ── */}
      {activeTab === "users" && (<>
      <div className="mb-6 max-w-sm">
        <TextInput value={q} onChange={setQ} placeholder={tr("بحث بالاسم أو البريد…", "Search by name or email…")} testid="users-search" />
      </div>

      {items === null ? <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div> : (
        <div className="space-y-10">

          {/* ── Admin users ── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#B08C5A" }} />
              <h3 className="text-[12px] uppercase tracking-[0.22em] font-semibold" style={{ color: "#B08C5A" }}>
                {tr(`الإداريون (${admins.length})`, `Admins (${admins.length})`)}
              </h3>
            </div>
            <div className="bg-white border border-rule">
              {admins.length === 0
                ? <div className="p-6 text-mute text-[13.5px] text-center">{tr("لا يوجد إداريون.", "No admins.")}</div>
                : <table className="w-full text-[14px]" data-testid="admins-table"><TableHead /><tbody>{admins.map(UserRow)}</tbody></table>
              }
            </div>
          </div>

          {/* ── Regular members ── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#7FA8C9" }} />
              <h3 className="text-[12px] uppercase tracking-[0.22em] font-semibold" style={{ color: "#7FA8C9" }}>
                {tr(`الأعضاء المسجّلون (${members.length})`, `Registered Members (${members.length})`)}
              </h3>
            </div>
            <div className="bg-white border border-rule">
              {members.length === 0
                ? <div className="p-6 text-mute text-[13.5px] text-center">{tr("لا يوجد أعضاء مسجّلون.", "No registered members.")}</div>
                : <table className="w-full text-[14px]" data-testid="members-table"><TableHead /><tbody>{members.map(UserRow)}</tbody></table>
              }
            </div>
          </div>

        </div>
      )}
      <ConfirmDeleteDialog
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        onConfirm={permanentDelete}
        entityName={permTarget ? `${permTarget.name} · ${permTarget.email}` : ""}
        warningAr="سيتم حذف هذا الحساب وكل بياناته نهائياً. لا يمكن حذف حسابك الحالي أو آخر مدير عام."
        warningEn="This account and all its data will be permanently removed. You cannot delete your own account or the last Super Admin."
        testid="user-confirm-delete"
      />
      </>)}

      {/* ── Roles tab ── */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-[1100px]">
          {ROLE_CARDS.map((role) => (
            <div key={role.key} className="bg-white border border-rule p-6" style={{ borderTop: `3px solid ${role.color}` }}>
              <div className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: role.color }}>{role.key}</div>
              <h3 className="text-[18px] font-medium text-navy-deep mb-4">{role.name_ar}</h3>
              <p className="text-[13.5px] leading-[1.75] text-ink/70 mb-5">{role.desc_ar}</p>
              <div className="text-[11px] uppercase tracking-[0.16em] text-mute mb-2">{tr("يستطيع", "Can do")}</div>
              <ul className="space-y-1.5 mb-4">
                {role.caps_ar.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-navy-deep/80">
                    <span style={{ color: role.color, flexShrink: 0, marginTop: 3 }}>✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
              {role.cannot_ar && (<>
                <div className="text-[11px] uppercase tracking-[0.16em] text-mute mb-2 mt-4">{tr("لا يستطيع", "Cannot do")}</div>
                <ul className="space-y-1.5">
                  {role.cannot_ar.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-mute">
                      <span style={{ color: "#C47878", flexShrink: 0, marginTop: 3 }}>✗</span>
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </>)}
            </div>
          ))}
        </div>
      )}

    </AdminPage>
  );
}

// -------- Roles (human-readable cards) --------
const ROLE_CARDS = [
  {
    key: "super_admin",
    color: "#B08C5A",
    name_ar: "المدير العام",
    name_en: "Super Admin",
    desc_ar: "صلاحيات كاملة وغير محدودة على كل شيء في الموقع والداشبورد — إدارة المستخدمين، الإعدادات، المحتوى، والأدوار.",
    desc_en: "Full unrestricted access to everything — users, settings, content, and roles.",
    caps_ar: [
      "إدارة كل المحتوى (إنشاء، تعديل، نشر، أرشفة)",
      "إدارة المستخدمين وتغيير أدوارهم",
      "تعديل إعدادات الموقع والهوية البصرية",
      "إدارة مفاتيح الميزات",
      "عرض سجل العمليات (Audit Log)",
      "الاعتدال على الردود البحثية",
      "كل ما يستطيعه الأدوار الأخرى",
    ],
  },
  {
    key: "admin",
    color: "#7FA8C9",
    name_ar: "مدير",
    name_en: "Admin",
    desc_ar: "صلاحيات واسعة تشمل إدارة كل المحتوى والمستخدمين والإعدادات، ماعدا تغيير أدوار المدير العام.",
    desc_en: "Broad access covering all content, users, and settings — except Super Admin role management.",
    caps_ar: [
      "إنشاء وتعديل ونشر وأرشفة الإصدارات",
      "إدارة الباحثين والتصنيفات",
      "تعديل إعدادات الموقع والهوية البصرية",
      "إدارة المستخدمين (قراءة وتعديل)",
      "الاعتدال على الردود البحثية",
      "تعديل مفاتيح الميزات",
      "عرض الرسائل وسجل العمليات",
      "رفع الملفات والصور",
    ],
  },
  {
    key: "editor",
    color: "#7BA08A",
    name_ar: "محرر",
    name_en: "Editor",
    desc_ar: "يستطيع إنشاء المحتوى وتعديله لكن لا يملك صلاحية النشر أو الأرشفة أو إدارة المستخدمين.",
    desc_en: "Can create and edit content but cannot publish, archive, or manage users.",
    caps_ar: [
      "إنشاء وتعديل الإصدارات (دون نشر أو أرشفة)",
      "تعديل بيانات الباحثين",
      "قراءة إعدادات الموقع والهوية (دون تعديل)",
      "رفع الملفات والصور",
    ],
    cannot_ar: [
      "لا يستطيع نشر أو أرشفة الإصدارات",
      "لا يستطيع إدارة المستخدمين",
      "لا يستطيع تعديل الإعدادات أو الهوية البصرية",
    ],
  },
  {
    key: "reviewer",
    color: "#9B8ABF",
    name_ar: "مراجع",
    name_en: "Reviewer",
    desc_ar: "دور محدود للمطّلعين على المحتوى فقط — يستطيع قراءة الإصدارات والاعتدال على الردود البحثية فقط.",
    desc_en: "Limited read-only role — can view publications and moderate research responses only.",
    caps_ar: [
      "قراءة الإصدارات المنشورة والمسودات",
      "قراءة الردود البحثية والاعتدال عليها",
    ],
    cannot_ar: [
      "لا يستطيع تعديل أي محتوى",
      "لا يستطيع الوصول للإعدادات أو المستخدمين",
      "لا يستطيع رفع ملفات أو صور",
    ],
  },
  {
    key: "registered",
    color: "#C47878",
    name_ar: "عضو مسجّل",
    name_en: "Registered",
    desc_ar: "مستخدم عادي سجّل في الموقع العام — لا يملك أي صلاحيات في الداشبورد الإداري.",
    desc_en: "Regular public-site member — no dashboard access whatsoever.",
    caps_ar: [
      "إرسال ردود بحثية على الإصدارات",
      "الوصول للمحتوى المقيّد (المتاح للمسجلين)",
    ],
    cannot_ar: [
      "لا يستطيع الدخول على الداشبورد",
    ],
  },
];

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
