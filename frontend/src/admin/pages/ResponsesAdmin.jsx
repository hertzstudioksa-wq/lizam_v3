import { useEffect, useState } from "react";
import { AdminPage, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";

const STATUS_COLORS = {
  submitted: "#B4914A",
  under_review: "#3A6EA5",
  approved: "#2E8B57",
  rejected: "#9E3B3B",
  archived: "#6F7480",
};

export default function ResponsesAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const STATUS_LABELS = {
    submitted: tr("مُرسَل", "Submitted"),
    under_review: tr("قيد المراجعة", "Under review"),
    approved: tr("معتمد", "Approved"),
    rejected: tr("مرفوض", "Rejected"),
    archived: tr("مؤرشف", "Archived"),
  };
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const q = filter ? `?status=${filter}` : "";
    const r = await apiCall("get", `/admin/responses${q}`);
    if (r.ok) setItems(r.data.items || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function moderate(id, patch) {
    const r = await apiCall("patch", `/admin/responses/${id}`, patch);
    if (r.ok) {
      setMsg(tr("تم التحديث ✓", "Updated ✓"));
      setSelected(r.data);
      setTimeout(() => setMsg(""), 2500);
      load();
    } else {
      setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
    }
  }

  async function remove(id) {
    if (!window.confirm(tr("هل تريد حذف هذا الرد نهائياً؟", "Delete this response permanently?"))) return;
    const r = await apiCall("delete", `/admin/responses/${id}`);
    if (r.ok) { setSelected(null); load(); }
    else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  const FILTERS = [
    ["", tr("الكل", "All")],
    ["submitted", STATUS_LABELS.submitted],
    ["under_review", STATUS_LABELS.under_review],
    ["approved", STATUS_LABELS.approved],
    ["rejected", STATUS_LABELS.rejected],
    ["archived", STATUS_LABELS.archived],
  ];

  return (
    <AdminPage title={tr("الردود البحثية", "Research Responses")} subtitle={tr("المراجعة · إرسال → اعتماد / رفض / أرشفة", "Moderation · Submit → Approve / Reject / Archive")}>
      {msg && <div className="mb-4 px-4 py-2.5 bg-paper border-l-2 border-brass text-[13px]" data-testid="responses-status">{msg}</div>}

      <div className="flex items-center gap-2 mb-6 flex-wrap" data-testid="responses-filters">
        {FILTERS.map(([k, label]) => (
          <button key={k || "all"} type="button"
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-[13px] border ${filter === k ? "bg-navy-deep text-white border-navy-deep" : "bg-white text-ink border-rule"}`}
            data-testid={`responses-filter-${k || "all"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-7 bg-white border border-rule">
          {items === null ? <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>
            : items.length === 0 ? <div className="p-10 text-mute text-center">{tr("لا توجد ردود", "No responses")} {filter && `${tr("في","in")} "${STATUS_LABELS[filter] || filter}"`}.</div>
            : (
              <ul className="divide-y divide-rule">
                {items.map((r) => (
                  <li key={r.id}
                      onClick={() => { setSelected(r); setNotes(r.internal_notes || ""); }}
                      className={`p-4 cursor-pointer hover:bg-paper ${selected?.id === r.id ? "bg-paper" : ""}`}
                      data-testid={`response-row-${r.id}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-medium text-navy-deep truncate">{r.title}</div>
                        <div className="text-[12px] text-mute mt-0.5 truncate">
                          {r.author_name} · {r.author_email}
                        </div>
                        <div className="text-[11.5px] text-mute mt-0.5 truncate">
                          {r.publication_title_en || r.publication_title_ar || r.publication_id}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.18em] px-2 py-1 shrink-0"
                            style={{ color: STATUS_COLORS[r.status] || "#000", border: `1px solid ${STATUS_COLORS[r.status]}` }}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </div>

        {/* Detail / moderation */}
        <div className="lg:col-span-5">
          {!selected ? (
            <div className="p-10 text-mute text-center border border-rule bg-white">{tr("اختر رداً للمراجعة.", "Select a response to moderate.")}</div>
          ) : (
            <div className="bg-white border border-rule p-5" data-testid="response-detail">
              <div className="text-[11px] tracking-[0.22em] uppercase text-brass font-semibold">{STATUS_LABELS[selected.status] || selected.status}</div>
              <h3 className="text-[18px] font-medium text-navy-deep mt-2">{selected.title}</h3>
              <div className="text-[13px] text-mute mt-1">
                {selected.author_name} · <a href={`mailto:${selected.author_email}`} className="underline">{selected.author_email}</a>
              </div>
              <div className="text-[12.5px] text-mute mt-1">
                {tr("الإصدار:", "Publication:")} {selected.publication_title_en || selected.publication_title_ar || selected.publication_id}
              </div>

              <div className="mt-4 border-t border-rule pt-4">
                <div className="text-[12px] text-mute mb-1">{tr("نص الرد:", "Submitted body:")}</div>
                <div className="prose prose-sm max-w-none border border-rule p-3 bg-paper text-[14px]"
                     dangerouslySetInnerHTML={{ __html: selected.body_html }} />
              </div>

              <div className="mt-5">
                <label className="text-[12px] text-mute">{tr("ملاحظات داخلية (للإدارة فقط)", "Internal notes (admins only)")}</label>
                <textarea className="w-full mt-1 border border-rule p-2 text-[13px] h-20"
                          value={notes} onChange={(e) => setNotes(e.target.value)}
                          data-testid="response-notes" />
                <button type="button"
                        onClick={() => moderate(selected.id, { internal_notes: notes })}
                        className="mt-2 px-3 py-1.5 text-[12.5px] border border-rule hover:border-navy"
                        data-testid="response-save-notes">
                  {tr("حفظ الملاحظات", "Save notes")}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => moderate(selected.id, { status: "under_review" })}
                        className="px-3 py-2 text-[12.5px] bg-white border border-rule hover:border-navy"
                        data-testid="response-action-review">
                  {tr("تحديد قيد المراجعة", "Mark under review")}
                </button>
                <button type="button" onClick={() => moderate(selected.id, { status: "approved", public_visible: true })}
                        className="px-3 py-2 text-[12.5px] bg-[color:var(--tb-gold,#B4914A)] text-white"
                        data-testid="response-action-approve">
                  {tr("اعتماد ونشر", "Approve & publish")}
                </button>
                <button type="button" onClick={() => moderate(selected.id, { status: "rejected", public_visible: false })}
                        className="px-3 py-2 text-[12.5px] bg-white border border-rule text-[#9E3B3B]"
                        data-testid="response-action-reject">
                  {tr("رفض", "Reject")}
                </button>
                <button type="button" onClick={() => moderate(selected.id, { status: "archived", public_visible: false })}
                        className="px-3 py-2 text-[12.5px] bg-white border border-rule text-mute"
                        data-testid="response-action-archive">
                  {tr("أرشفة", "Archive")}
                </button>
                <button type="button" onClick={() => remove(selected.id)}
                        className="ms-auto px-3 py-2 text-[12.5px] text-[#9E3B3B]"
                        data-testid="response-action-delete">
                  {tr("حذف", "Delete")}
                </button>
              </div>

              <label className="mt-4 flex items-center gap-2 text-[12.5px] cursor-pointer">
                <input type="checkbox"
                       checked={selected.public_visible || false}
                       onChange={(e) => moderate(selected.id, { public_visible: e.target.checked })}
                       data-testid="response-public-visible" />
                <span>{tr("مرئي للعموم", "Publicly visible")}</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
