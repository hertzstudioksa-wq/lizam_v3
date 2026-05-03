import { useEffect, useState } from "react";
import { AdminPage, apiCall } from "@/admin/components/AdminUI";

export default function AuditLogAdmin() {
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

  return (
    <AdminPage title="Audit Log" subtitle="Admin activity · Last 200 events">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="text-[12.5px] text-mute">
          Target type:
          <select className="ms-2 border border-rule px-2 py-1 text-[13px]"
                  value={filter.target_type}
                  onChange={(e) => setFilter((f) => ({ ...f, target_type: e.target.value }))}
                  data-testid="audit-filter-target-type">
            <option value="">All</option>
            <option value="publication">publication</option>
            <option value="user">user</option>
            <option value="response">response</option>
            <option value="settings">settings</option>
            <option value="branding">branding</option>
            <option value="toggles">toggles</option>
            <option value="home">home</option>
            <option value="author">author</option>
            <option value="category">category</option>
          </select>
        </label>
        <label className="text-[12.5px] text-mute">
          Action:
          <select className="ms-2 border border-rule px-2 py-1 text-[13px]"
                  value={filter.action}
                  onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
                  data-testid="audit-filter-action">
            <option value="">All</option>
            <option value="login">login</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="moderate">moderate</option>
            <option value="publish">publish</option>
            <option value="archive">archive</option>
            <option value="delete">delete</option>
          </select>
        </label>
      </div>
      <div className="bg-white border border-rule">
        {items === null ? <div className="p-10 text-mute">Loading…</div>
          : items.length === 0 ? <div className="p-10 text-mute text-center">No audit events match the current filter.</div>
          : (
            <table className="w-full text-[13px]" data-testid="audit-table">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                  <th className="text-start p-3">Time</th>
                  <th className="text-start p-3">Actor</th>
                  <th className="text-start p-3">Action</th>
                  <th className="text-start p-3">Target</th>
                  <th className="text-start p-3">Details</th>
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
