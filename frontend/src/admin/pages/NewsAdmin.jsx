import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import {
  AdminPage, Field, TextInput, TextArea, SaveBar, useDirtyForm, apiCall, Toggle,
} from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";

const EMPTY = {
  title_ar: "", title_en: "", slug_ar: "", slug_en: "",
  summary_ar: "", summary_en: "", body_ar: "", body_en: "",
  cover_image_url: "", date: "", category_ar: "", category_en: "",
  status: "draft", featured: false,
};

export default function NewsAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null = list, "new" = new, id = edit
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  async function load() {
    const r = await apiCall("get", "/admin/news?limit=100");
    if (r.ok) setItems(r.data.items || []);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  function startNew() {
    form.commit({ ...EMPTY, date: new Date().toISOString().slice(0, 10) });
    setEditing("new");
  }

  async function startEdit(item) {
    form.commit({ ...EMPTY, ...item });
    setEditing(item.id);
  }

  async function save() {
    setSaving(true);
    let r;
    if (editing === "new") {
      r = await apiCall("post", "/admin/news", form.value);
    } else {
      r = await apiCall("patch", `/admin/news/${editing}`, form.value);
    }
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      setEditing(r.data.id);
      await load();
      setMsg(tr("تم الحفظ ✓", "Saved ✓"));
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
    }
  }

  async function deleteItem(id) {
    const r = await apiCall("delete", `/admin/news/${id}/permanent`);
    if (r.ok) { await load(); if (editing === id) setEditing(null); }
  }

  async function uploadImage(file) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch("cover_image_url", data.url);
    } catch (e) {
      setMsg(formatApiError(e.response?.data?.detail) || e.message);
    }
  }

  // ── LIST VIEW ──
  if (editing === null) {
    return (
      <AdminPage
        title={tr("الأخبار والفعاليات", "News & Events")}
        subtitle={tr("إدارة أخبار المركز", "Manage center news")}
        actions={
          <button type="button" className="lz-btn-primary" onClick={startNew}>
            <Plus size={15} />
            <span>{tr("خبر جديد", "New item")}</span>
          </button>
        }
      >
        {msg && <div className="mb-4 text-[13px] text-green-700">{msg}</div>}
        <div className="bg-white border border-rule">
          <div className="px-5 py-3 border-b border-rule bg-paper">
            <span className="text-[11px] uppercase tracking-[0.2em] text-mute">
              {tr(`${items.length} عنصر`, `${items.length} items`)}
            </span>
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-mute text-[14px]">
              {tr("لا توجد أخبار بعد. أضف أول خبر.", "No news yet. Add your first item.")}
            </div>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.16em] text-mute border-b border-rule">
                  <th className="text-start p-4">{tr("العنوان", "Title")}</th>
                  <th className="text-start p-4">{tr("التاريخ", "Date")}</th>
                  <th className="text-start p-4">{tr("الحالة", "Status")}</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const title = item[`title_${lang}`] || item.title_ar || item.title_en;
                  const isPublished = item.status === "published";
                  return (
                    <tr key={item.id} className="border-b border-rule last:border-0 hover:bg-ivory-cream">
                      <td className="p-4 font-medium text-navy-deep">{title || <span className="text-mute italic">{tr("بدون عنوان", "Untitled")}</span>}</td>
                      <td className="p-4 text-mute text-[12px]">{item.date || "—"}</td>
                      <td className="p-4">
                        <span className={`text-[10.5px] uppercase tracking-[0.12em] px-2 py-0.5 border ${isPublished ? "bg-green-50 border-green-200 text-green-800" : "bg-paper border-rule text-mute"}`}>
                          {isPublished ? tr("منشور", "Published") : tr("مسودة", "Draft")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 justify-end">
                          <button type="button" onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 text-navy hover:text-brass text-[12.5px]">
                            <Pencil size={12} /> {tr("تعديل", "Edit")}
                          </button>
                          <button type="button" onClick={() => deleteItem(item.id)}
                            className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 text-[12.5px]">
                            <Trash2 size={12} /> {tr("حذف", "Delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AdminPage>
    );
  }

  // ── EDIT / NEW VIEW ──
  return (
    <AdminPage
      title={editing === "new" ? tr("خبر جديد", "New item") : tr("تعديل الخبر", "Edit item")}
      subtitle={tr("الأخبار والفعاليات", "News & Events")}
      actions={
        <button type="button" className="lz-btn-ghost" onClick={() => { setEditing(null); load(); }}>
          ← {tr("العودة للقائمة", "Back to list")}
        </button>
      }
    >
      {msg && <div className="mb-4 text-[13px] text-green-700">{msg}</div>}

      <div className="max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Field label={tr("العنوان — عربية", "Title — AR")}>
          <TextInput value={form.value.title_ar} onChange={v => form.patch("title_ar", v)} dir="rtl" />
        </Field>
        <Field label={tr("العنوان — إنجليزية", "Title — EN")}>
          <TextInput value={form.value.title_en} onChange={v => form.patch("title_en", v)} />
        </Field>

        <Field label={tr("الملخص — عربية", "Summary — AR")}>
          <TextArea value={form.value.summary_ar} onChange={v => form.patch("summary_ar", v)} dir="rtl" rows={3} />
        </Field>
        <Field label={tr("الملخص — إنجليزية", "Summary — EN")}>
          <TextArea value={form.value.summary_en} onChange={v => form.patch("summary_en", v)} rows={3} />
        </Field>

        <Field label={tr("المحتوى الكامل — عربية", "Full content — AR")}>
          <TextArea value={form.value.body_ar} onChange={v => form.patch("body_ar", v)} dir="rtl" rows={6} />
        </Field>
        <Field label={tr("المحتوى الكامل — إنجليزية", "Full content — EN")}>
          <TextArea value={form.value.body_en} onChange={v => form.patch("body_en", v)} rows={6} />
        </Field>

        <Field label={tr("التصنيف — عربية", "Category — AR")}>
          <TextInput value={form.value.category_ar} onChange={v => form.patch("category_ar", v)} dir="rtl" placeholder={tr("مثال: ندوة", "e.g. Seminar")} />
        </Field>
        <Field label={tr("التصنيف — إنجليزية", "Category — EN")}>
          <TextInput value={form.value.category_en} onChange={v => form.patch("category_en", v)} placeholder="e.g. Seminar" />
        </Field>

        <Field label={tr("التاريخ", "Date")}>
          <TextInput value={form.value.date} onChange={v => form.patch("date", v)} type="date" />
        </Field>

        <Field label={tr("صورة الغلاف", "Cover image")}>
          <div className="space-y-2">
            {form.value.cover_image_url && (
              <img src={form.value.cover_image_url} alt=""
                className="border border-rule max-h-40 w-auto object-cover" />
            )}
            <TextInput value={form.value.cover_image_url} onChange={v => form.patch("cover_image_url", v)} placeholder="https://..." />
            <input type="file" accept="image/*" onChange={e => uploadImage(e.target.files?.[0])} className="text-[12.5px]" />
          </div>
        </Field>

        <div className="lg:col-span-2 flex items-center gap-8">
          <Toggle
            checked={form.value.status === "published"}
            onChange={v => form.patch("status", v ? "published" : "draft")}
            label={tr("منشور", "Published")}
          />
          <Toggle
            checked={!!form.value.featured}
            onChange={v => form.patch("featured", v)}
            label={tr("مميز", "Featured")}
          />
        </div>

      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}
