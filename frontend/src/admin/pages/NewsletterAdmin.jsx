import { useEffect, useState } from "react";
import { Mail, UserX, Download } from "lucide-react";
import { AdminPage, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";

export default function NewsletterAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [items, setItems] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await apiCall("get", "/admin/newsletter");
    if (r.ok) {
      setItems(r.data.items || []);
      setActiveCount(r.data.active_count || 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function unsubscribe(id) {
    const r = await apiCall("delete", `/admin/newsletter/${id}`);
    if (r.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: "unsubscribed" } : i));
      setActiveCount(prev => prev - 1);
      setMsg(tr("تم إلغاء الاشتراك ✓", "Unsubscribed ✓"));
      setTimeout(() => setMsg(""), 2500);
    }
  }

  function exportCSV() {
    const active = items.filter(i => i.status === "active");
    const csv = ["email,language,date", ...active.map(i =>
      `${i.email},${i.language || "ar"},${(i.created_at || "").slice(0, 10)}`
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter_subscribers.csv";
    a.click(); URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const active = items.filter(i => i.status === "active");
  const unsubscribed = items.filter(i => i.status !== "active");

  return (
    <AdminPage
      title={tr("المشتركون في النشرة البريدية", "Newsletter Subscribers")}
      subtitle={tr("إدارة قائمة المشتركين", "Manage subscriber list")}
      helpAr="قائمة كل من اشترك في النشرة البريدية عبر الموقع. يمكن إلغاء اشتراك أي مستخدم أو تصدير القائمة."
      helpEn="All users who subscribed to the newsletter via the website. You can unsubscribe users or export the list."
      actions={
        <button type="button" onClick={exportCSV}
          className="lz-btn-ghost inline-flex items-center gap-2">
          <Download size={14} />
          {tr("تصدير CSV", "Export CSV")}
        </button>
      }
    >
      {msg && <div className="mb-4 text-[13px] text-green-700 font-medium">{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-[600px]">
        <div className="bg-white border border-rule p-4 text-center">
          <div className="text-[2rem] font-medium text-navy-deep tabular-nums">{activeCount}</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-mute mt-1">{tr("مشترك نشط", "Active")}</div>
        </div>
        <div className="bg-white border border-rule p-4 text-center">
          <div className="text-[2rem] font-medium text-navy-deep tabular-nums">{unsubscribed.length}</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-mute mt-1">{tr("ألغى الاشتراك", "Unsubscribed")}</div>
        </div>
        <div className="bg-white border border-rule p-4 text-center">
          <div className="text-[2rem] font-medium text-navy-deep tabular-nums">{items.length}</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-mute mt-1">{tr("الإجمالي", "Total")}</div>
        </div>
      </div>

      {/* Active subscribers */}
      <div className="bg-white border border-rule mb-6">
        <div className="px-5 py-3 border-b border-rule bg-paper flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-mute">
            {tr("المشتركون النشطون", "Active subscribers")} — {activeCount}
          </span>
        </div>
        {active.length === 0 ? (
          <div className="p-8 text-center text-mute text-[13px]">{tr("لا يوجد مشتركون بعد", "No subscribers yet")}</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.16em] text-mute border-b border-rule">
                <th className="text-start p-4">{tr("البريد الإلكتروني", "Email")}</th>
                <th className="text-start p-4">{tr("اللغة", "Language")}</th>
                <th className="text-start p-4">{tr("تاريخ الاشتراك", "Subscribed")}</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {active.map(sub => (
                <tr key={sub.id} className="border-b border-rule last:border-0 hover:bg-ivory-cream">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-mute shrink-0" />
                      <span className="font-medium text-navy-deep" dir="ltr">{sub.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-mute text-[12px]">
                    {sub.language === "en" ? "English" : "العربية"}
                  </td>
                  <td className="p-4 text-mute text-[12px]">
                    {(sub.created_at || "").slice(0, 10)}
                  </td>
                  <td className="p-4 text-end">
                    <button type="button" onClick={() => unsubscribe(sub.id)}
                      className="inline-flex items-center gap-1 text-[12px] text-mute hover:text-red-700 transition-colors">
                      <UserX size={13} />
                      {tr("إلغاء", "Unsubscribe")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Unsubscribed */}
      {unsubscribed.length > 0 && (
        <div className="bg-white border border-rule opacity-60">
          <div className="px-5 py-3 border-b border-rule bg-paper">
            <span className="text-[11px] uppercase tracking-[0.2em] text-mute">
              {tr("ألغوا الاشتراك", "Unsubscribed")} — {unsubscribed.length}
            </span>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {unsubscribed.map(sub => (
                <tr key={sub.id} className="border-b border-rule last:border-0">
                  <td className="p-3 text-mute" dir="ltr">{sub.email}</td>
                  <td className="p-3 text-mute text-[11px]">{(sub.created_at || "").slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
