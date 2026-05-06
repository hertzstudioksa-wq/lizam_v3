import { useEffect, useState } from "react";
import { AdminPage, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";

export default function AuditLogAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState({ target_type: "", action: "" });

  async function load() {
    const params = new URLSearchParams();
    if (filter.target_type) params.set("target_type", filter.target_type);
    if (filter.action) params.set("action", filter.action);
    params.set("limit", "200");
    const r = await apiCall("get", `/admin/audit?${params.toString()}`);
    if (r.ok) setItems(r.data.items || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter.target_type, filter.action]);

  const TARGETS = [
    ["", tr("الكل", "All")],
    ["publication", tr("إصدار", "publication")],
    ["user", tr("مستخدم", "user")],
    ["response", tr("رد بحثي", "response")],
    ["settings", tr("الإعدادات", "settings")],
    ["branding", tr("الهوية", "branding")],
    ["toggles", tr("المفاتيح", "toggles")],
    ["home", tr("الرئيسية", "home")],
    ["author", tr("باحث", "author")],
    ["category", tr("مجال", "category")],
  ];
  const ACTIONS = [
    ["", tr("الكل", "All")],
    ["login", tr("تسجيل دخول", "login")],
    ["create", tr("إنشاء", "create")],
    ["update", tr("تحديث", "update")],
    ["moderate", tr("مراجعة", "moderate")],
    ["publish", tr("نشر", "publish")],
    ["archive", tr("أرشفة", "archive")],
    ["delete", tr("حذف", "delete")],
  ];

  return (
    <AdminPage title={tr("سجل النشاط", "Audit Log")} subtitle={tr("نشاط الإدارة · آخر 200 حدث", "Admin activity · Last 200 events")}>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="text-[12.5px] text-mute">
          {tr("نوع الهدف:", "Target type:")}
          <select className="ms-2 border border-rule px-2 py-1 text-[13px]"
                  value={filter.target_type}
                  onChange={(e) => setFilter((f) => ({ ...f, target_type: e.target.value }))}
                  data-testid="audit-filter-target-type">
            {TARGETS.map(([v, l]) => <option key={v || "all"} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-[12.5px] text-mute">
          {tr("الإجراء:", "Action:")}
          <select className="ms-2 border border-rule px-2 py-1 text-[13px]"
                  value={filter.action}
                  onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
                  data-testid="audit-filter-action">
            {ACTIONS.map(([v, l]) => <option key={v || "all"} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="bg-white border border-rule">
        {items === null ? <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>
          : items.length === 0 ? <div className="p-10 text-mute text-center">{tr("لا توجد أحداث تطابق الفلتر الحالي.", "No audit events match the current filter.")}</div>
          : (
            <table className="w-full text-[13px]" data-testid="audit-table">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                  <th className="text-start p-3">{tr("الوقت", "Time")}</th>
                  <th className="text-start p-3">{tr("المستخدم", "Actor")}</th>
                  <th className="text-start p-3">{tr("الإجراء", "Action")}</th>
                  <th className="text-start p-3">{tr("الهدف", "Target")}</th>
                  <th className="text-start p-3">{tr("التفاصيل", "Details")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e, i) => (
                  <tr key={i} className="border-b border-rule last:border-0 hover:bg-paper" data-testid={`audit-row-${i}`}>
                    <td className="p-3 text-mute whitespace-nowrap tabular-nums">
                      {(e.ts || "").replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="p-3 text-navy-deep">{e.actor_email || <em className="text-mute">—</em>}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[11px] border border-rule uppercase tracking-[0.12em]">{e.action}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-mute text-[11px] uppercase me-1">{e.target_type}</span>
                      <span className="tabular-nums">{(e.target_id || "").slice(0, 24)}</span>
                    </td>
                    <td className="p-3 text-mute text-[12px] max-w-[40ch]">
                      <code className="whitespace-pre-wrap break-words">{e.details ? JSON.stringify(e.details) : ""}</code>
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
