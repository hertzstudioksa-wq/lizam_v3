import { useState } from "react";
import { Save } from "lucide-react";
import { api, formatApiError } from "@/lib/api";

export function AdminPage({ title, subtitle, children, actions }) {
  return (
    <div className="p-8 md:p-10" data-testid="admin-page">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="lz-eyebrow text-navy/70">{subtitle}</div>
          <div className="mt-3 h-px w-10 bg-brass" />
          <h1 className="lz-h2 mt-6">{title}</h1>
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, hint, children, dir }) {
  return (
    <label className="block" dir={dir}>
      <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-2">{label}</span>
      {children}
      {hint && <span className="block mt-1.5 text-[12px] text-mute">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, dir, placeholder, type = "text", testid }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      dir={dir}
      placeholder={placeholder}
      className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[14.5px] bg-white"
      data-testid={testid}
    />
  );
}

export function TextArea({ value, onChange, dir, placeholder, rows = 4, testid }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      dir={dir}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-rule focus:border-navy outline-none text-[14.5px] leading-[1.85] resize-y bg-white"
      data-testid={testid}
    />
  );
}

export function Select({ value, onChange, options, testid }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[14.5px] bg-white"
      data-testid={testid}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, testid }) {
  return (
    <label className="flex items-center justify-between gap-4 bg-white border border-rule px-4 py-3 cursor-pointer hover:border-navy/40 transition-colors">
      <span className="text-[14px] text-ink">{label}</span>
      <span className="relative">
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" data-testid={testid} />
        <span className={`block w-10 h-5 transition-colors ${checked ? "bg-navy" : "bg-rule"}`}>
          <span className={`block w-4 h-4 bg-white m-0.5 transition-transform ${checked ? "translate-x-5" : ""}`} />
        </span>
      </span>
    </label>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset, savedMessage }) {
  return (
    <div className="mt-8 flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className="lz-btn-primary disabled:opacity-50"
        data-testid="save-btn"
      >
        <Save size={15} />
        <span>{saving ? "Saving…" : "Save changes"}</span>
      </button>
      {dirty && (
        <button type="button" onClick={onReset} className="lz-btn-ghost" data-testid="cancel-btn">
          Cancel
        </button>
      )}
      {savedMessage && <span className="text-[13px] text-green-700 ms-2">{savedMessage}</span>}
    </div>
  );
}

export async function apiCall(method, url, body) {
  try {
    const { data } = await api.request({ method, url, data: body });
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
  }
}

export function useDirtyForm(initial) {
  const [value, setValue] = useState(initial || {});
  const [initialSnap, setInitialSnap] = useState(initial || {});
  const dirty = JSON.stringify(value) !== JSON.stringify(initialSnap);
  const reset = () => setValue(initialSnap);
  const commit = (next) => { setInitialSnap(next); setValue(next); };
  const patch = (k, v) => setValue((s) => ({ ...s, [k]: v }));
  return { value, setValue, patch, dirty, reset, commit, initialSnap, setInitialSnap };
}
