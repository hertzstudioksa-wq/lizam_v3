import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Users, Eye, Download, Newspaper, BookOpen,
  MessageSquare, Mail, TrendingUp, Clock, ArrowLeft, ArrowRight,
  CheckCircle, AlertCircle, Edit3,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { apiCall } from "@/admin/components/AdminUI";

function fmt(n, lang) {
  if (n == null) return "—";
  return Number(n).toLocaleString(lang === "ar" ? "ar-SA" : "en");
}

function fmtDate(iso, lang) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return iso.slice(0, 10); }
}

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

/* ── Metric Card ── */
function MetricCard({ icon: Icon, label, value, sub, color, to }) {
  const inner = (
    <div
      className="bg-white border border-rule flex flex-col items-center justify-center text-center hover:border-brass transition-colors duration-200 h-full"
      style={{ borderTop: `3px solid ${color}`, minHeight: "150px", padding: "20px 16px" }}
    >
      <div className="w-9 h-9 flex items-center justify-center mb-3" style={{ background: color + "18", color }}>
        <Icon size={16} strokeWidth={1.6} />
      </div>
      <div className="text-[2rem] font-medium text-navy-deep tabular-nums leading-none mb-2">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-mute leading-tight">{label}</div>
      {sub && <div className="text-[11px] text-mute mt-1">{sub}</div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

/* ── Alert Card ── */
function AlertCard({ icon: Icon, label, count, color, to }) {
  if (!count) return null;
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 border border-rule bg-white hover:border-brass transition-colors"
    >
      <div className="shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: color + "18", color }}>
        <Icon size={18} strokeWidth={1.6} />
      </div>
      <div className="flex-1">
        <div className="text-[13.5px] font-medium text-navy-deep">{label}</div>
      </div>
      <span className="shrink-0 min-w-[28px] h-7 px-2 rounded-full text-[12px] font-bold inline-flex items-center justify-center text-white" style={{ background: color }}>
        {count}
      </span>
    </Link>
  );
}

/* ── Status pill ── */
function StatusPill({ status }) {
  const map = {
    published: { label: "منشور", color: "#16a34a" },
    draft: { label: "مسودة", color: "#6b7280" },
    under_review: { label: "مراجعة", color: "#d97706" },
    archived: { label: "أرشيف", color: "#9b8abf" },
  };
  const s = map[status] || { label: status, color: "#6b7280" };
  return (
    <span
      className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 border"
      style={{ color: s.color, borderColor: s.color + "55", background: s.color + "10" }}
    >
      {s.label}
    </span>
  );
}

/* ── Activity action label ── */
function actionLabel(action, entity) {
  const actionMap = {
    create: "أُضيف", update: "عُدِّل", delete: "حُذف",
    delete_permanent: "حُذف نهائياً", login: "دخول", publish: "نُشر",
    update_order: "رُتِّب",
  };
  const entityMap = {
    publication: "إصدار", news_item: "خبر", author: "باحث",
    contact_message: "رسالة", site_settings: "إعدادات",
    activities_page: "صفحة أنشطة", custom_page: "صفحة مخصصة",
    home_content: "الرئيسية", about_content: "عن المركز",
    contact_content: "التواصل", activity: "نشاط",
    branding: "الهوية", user: "مستخدم",
  };
  const a = actionMap[action] || action || "—";
  const e = entity ? (entityMap[entity] || entity) : "";
  return e ? `${a} ${e}` : a;
}

export default function AdminOverview() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall("get", "/admin/overview").then((r) => {
      if (r.ok) setData(r.data);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString(ar ? "ar-SA" : "en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return (
    <div className="p-10 text-mute flex items-center justify-center min-h-[60vh]">
      <div className="text-[14px]">{ar ? "جارٍ تحميل البيانات…" : "Loading dashboard…"}</div>
    </div>
  );

  const d = data || {};
  const hasAlerts = (d.messages_new > 0) || (d.responses_pending > 0);

  return (
    <div className="p-8 md:p-10 max-w-[1400px]" data-testid="admin-overview">

      {/* ── Header ── */}
      <div className="mb-10">
        <div className="text-[11.5px] uppercase tracking-[0.2em] text-mute mb-1">{dateStr}</div>
        <h1 className="text-[2rem] font-medium text-navy-deep" style={{ fontFamily: '"Thmanyah Serif Display", serif' }}>
          {ar ? "لوحة التحكم" : "Dashboard"}
        </h1>
        <p className="mt-1 text-[14px] text-mute">
          {ar ? "نظرة شاملة على محتوى المركز وأداء الموقع" : "A full picture of the center's content and site performance"}
        </p>
      </div>

      {/* ── Alerts ── */}
      {hasAlerts && (
        <div className="mb-8 space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-brass mb-3 flex items-center gap-2">
            <AlertCircle size={12} />
            {ar ? "يحتاج انتباهك" : "Needs attention"}
          </div>
          <AlertCard icon={Mail} label={ar ? `${d.messages_new} رسالة جديدة في صندوق التواصل` : `${d.messages_new} new contact messages`}
            count={d.messages_new} color="#B08C5A" to="/admin/messages" />
          <AlertCard icon={MessageSquare} label={ar ? `${d.responses_pending} رد بحثي قيد المراجعة` : `${d.responses_pending} research responses pending review`}
            count={d.responses_pending} color="#7FA8C9" to="/admin/responses" />
        </div>
      )}

      {/* ── Primary metrics ── */}
      <div className="mb-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-mute">{ar ? "الإصدارات والمحتوى" : "Publications & Content"}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={FileText} label={ar ? "إجمالي الإصدارات" : "Total publications"}
          value={fmt(d.publications_total, lang)} color="#B08C5A" to="/admin/publications" />
        <MetricCard icon={CheckCircle} label={ar ? "منشور" : "Published"}
          value={fmt(d.publications_published, lang)}
          sub={d.publications_total ? `${Math.round((d.publications_published / d.publications_total) * 100)}%` : ""}
          color="#16a34a" to="/admin/publications?status=published" />
        <MetricCard icon={Edit3} label={ar ? "مسودة / مراجعة" : "Draft / Review"}
          value={fmt(d.publications_draft, lang)} color="#d97706" to="/admin/publications?status=draft" />
        <MetricCard icon={Newspaper} label={ar ? "أخبار وفعاليات" : "News & Events"}
          value={fmt(d.news_published, lang)}
          sub={d.news_total ? `${ar ? "من أصل" : "of"} ${fmt(d.news_total, lang)}` : ""}
          color="#7BA08A" to="/admin/news" />
      </div>

      {/* ── Engagement metrics ── */}
      <div className="mb-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-mute">{ar ? "التفاعل والأداء" : "Engagement & Performance"}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <MetricCard icon={Eye} label={ar ? "إجمالي المشاهدات" : "Total views"}
          value={fmt(d.total_views, lang)} color="#7FA8C9" />
        <MetricCard icon={Download} label={ar ? "تحميلات PDF" : "PDF downloads"}
          value={fmt(d.total_pdf_downloads, lang)} color="#9B8ABF" />
        <MetricCard icon={Users} label={ar ? "الباحثون" : "Researchers"}
          value={fmt(d.authors_total, lang)} color="#7BA08A" to="/admin/authors" />
        <MetricCard icon={BookOpen} label={ar ? "المستخدمون" : "Users"}
          value={fmt(d.users_total, lang)} color="#C47878" to="/admin/users" />
      </div>

      {/* ── Content panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Top viewed */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-mute flex items-center gap-2">
              <TrendingUp size={12} style={{ color: "#B08C5A" }} />
              {ar ? "الأكثر مشاهدة" : "Most viewed"}
            </div>
          </div>
          <div className="bg-white border border-rule">
            {(d.top_viewed || []).length === 0 ? (
              <div className="p-6 text-mute text-[13px] text-center">{ar ? "لا توجد بيانات بعد" : "No data yet"}</div>
            ) : (
              <div className="divide-y divide-rule">
                {(d.top_viewed || []).map((pub, i) => {
                  const title = pub[`title_${lang}`] || pub.title_ar || pub.title_en;
                  return (
                    <Link key={pub.id} to={`/admin/publications/${pub.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-ivory-cream transition-colors">
                      <span className="shrink-0 w-6 text-[12px] tabular-nums text-mute text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-navy-deep truncate">{title}</div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-mute">
                          <span className="inline-flex items-center gap-1"><Eye size={10} /> {fmt(pub.view_count, lang)}</span>
                          {pub.pdf_download_count > 0 && (
                            <span className="inline-flex items-center gap-1"><Download size={10} /> {fmt(pub.pdf_download_count, lang)}</span>
                          )}
                        </div>
                      </div>
                      <Arrow size={12} className="shrink-0 text-mute" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent publications */}
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-mute flex items-center gap-2">
              <Clock size={12} style={{ color: "#B08C5A" }} />
              {ar ? "آخر الإصدارات" : "Recent publications"}
            </div>
            <Link to="/admin/publications" className="text-[11px] text-brass hover:underline">
              {ar ? "عرض الكل" : "View all"}
            </Link>
          </div>
          <div className="bg-white border border-rule">
            {(d.recent_publications || []).length === 0 ? (
              <div className="p-6 text-mute text-[13px] text-center">{ar ? "لا توجد إصدارات" : "No publications yet"}</div>
            ) : (
              <div className="divide-y divide-rule">
                {(d.recent_publications || []).map((pub) => {
                  const title = pub[`title_${lang}`] || pub.title_ar || pub.title_en;
                  return (
                    <Link key={pub.id} to={`/admin/publications/${pub.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-ivory-cream transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-navy-deep truncate">{title || "—"}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusPill status={pub.status} />
                          <span className="text-[11px] text-mute">{fmtDate(pub.updated_at, lang)}</span>
                        </div>
                      </div>
                      <Arrow size={12} className="shrink-0 text-mute mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-mute flex items-center gap-2">
              <CheckCircle size={12} style={{ color: "#B08C5A" }} />
              {ar ? "آخر النشاطات" : "Recent activity"}
            </div>
            <Link to="/admin/audit" className="text-[11px] text-brass hover:underline">
              {ar ? "السجل" : "Log"}
            </Link>
          </div>
          <div className="bg-white border border-rule">
            {(d.recent_activity || []).length === 0 ? (
              <div className="p-6 text-mute text-[13px] text-center">{ar ? "لا يوجد نشاط" : "No activity yet"}</div>
            ) : (
              <div className="divide-y divide-rule">
                {(d.recent_activity || []).map((log, i) => {
                  const fields = log.diff?.fields;
                  const actor = log.actor_email?.split("@")[0] || "—";
                  const actionText = actionLabel(log.action, log.target_type);
                  return (
                    <div key={i} className="px-4 py-3">
                      <div className="text-[12.5px] font-medium text-navy-deep">{actionText}</div>
                      {fields && fields.length > 0 && (
                        <div className="mt-0.5 text-[11px] text-mute truncate">
                          {fields.slice(0, 3).join(" · ")}
                          {fields.length > 3 && ` +${fields.length - 3}`}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-brass/80 font-medium">{actor}</span>
                        <span className="text-[10.5px] text-mute tabular-nums">{fmtTime(log.at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
