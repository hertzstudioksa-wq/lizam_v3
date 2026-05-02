import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, Select, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import { api, formatApiError } from "@/lib/api";

const FONT_OPTIONS = [
  { value: "Thmanyah Sans", label: "Thmanyah Sans (institutional)" },
  { value: "Thmanyah Serif Display", label: "Thmanyah Serif Display (editorial)" },
  { value: "IBM Plex Sans Arabic", label: "IBM Plex Sans Arabic (fallback)" },
  { value: "Inter", label: "Inter (EN UI)" },
  { value: "Source Serif 4", label: "Source Serif 4 (EN editorial)" },
];

export default function BrandingAdmin() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  useEffect(() => {
    apiCall("get", "/admin/branding").then((r) => { if (r.ok) form.commit(r.data || {}); setLoaded(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/branding", form.value);
    setSaving(false);
    if (r.ok) { form.commit(r.data); setMsg("Saved ✓"); setTimeout(() => setMsg(""), 2500); }
    else setMsg(`Error: ${r.error}`);
  }

  async function uploadImage(key, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch(key, data.url);
    } catch (e) {
      setMsg(`Upload error: ${formatApiError(e.response?.data?.detail) || e.message}`);
    }
  }

  if (!loaded) return <div className="p-10 text-mute">Loading…</div>;

  const ColorRow = ({ k, label }) => (
    <div className="flex items-center gap-3">
      <input type="color" value={form.value[k] || "#000000"} onChange={(e) => form.patch(k, e.target.value)} className="h-10 w-12 p-0 border border-rule cursor-pointer" data-testid={`color-${k}`} />
      <TextInput value={form.value[k]} onChange={(v) => form.patch(k, v)} testid={`color-text-${k}`} />
    </div>
  );

  return (
    <AdminPage title="Design & Branding" subtitle="Visual identity">
      {/* Preview */}
      <div className="mb-10 p-6 border border-rule" style={{ background: form.value.background_color || "#F7F8FA" }}>
        <div className="flex items-center gap-4">
          {form.value.logo_url && <img src={form.value.logo_url} alt="" style={{ height: 44, width: "auto" }} />}
          <div>
            <div className="lz-eyebrow" style={{ color: form.value.primary_color }}>Live preview</div>
            <div className="text-[20px]" style={{ color: form.value.secondary_color, fontFamily: form.value.font_ar || "inherit" }}>مركز لزام للدراسات القانونية</div>
            <div className="text-[14px] mt-1" style={{ color: form.value.muted_text_color || "#667085" }}>Saudi research center · A trusted reference for legal studies</div>
            <button type="button" className="mt-3 px-4 py-2 text-[13px]" style={{ background: form.value.primary_color, color: "#fff" }}>Primary action</button>
            <button type="button" className="mt-3 ms-2 px-4 py-2 text-[13px] border" style={{ borderColor: form.value.accent_color, color: form.value.accent_color }}>Accent</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1100px]">
        <Field label="Logo (dark version)" hint="Used on light backgrounds">
          <div className="space-y-2">
            <TextInput value={form.value.logo_url} onChange={(v) => form.patch("logo_url", v)} testid="logo-url" />
            <input type="file" accept="image/*" onChange={(e) => uploadImage("logo_url", e.target.files?.[0])} className="text-[13px]" data-testid="logo-upload" />
          </div>
        </Field>
        <Field label="Logo (light version)" hint="Used on dark backgrounds">
          <div className="space-y-2">
            <TextInput value={form.value.logo_light_url} onChange={(v) => form.patch("logo_light_url", v)} testid="logo-light-url" />
            <input type="file" accept="image/*" onChange={(e) => uploadImage("logo_light_url", e.target.files?.[0])} className="text-[13px]" data-testid="logo-light-upload" />
          </div>
        </Field>
        <Field label="Favicon">
          <div className="space-y-2">
            <TextInput value={form.value.favicon_url} onChange={(v) => form.patch("favicon_url", v)} testid="favicon-url" />
            <input type="file" accept="image/*,.ico" onChange={(e) => uploadImage("favicon_url", e.target.files?.[0])} className="text-[13px]" data-testid="favicon-upload" />
          </div>
        </Field>

        <Field label="Primary (navy)"><ColorRow k="primary_color" /></Field>
        <Field label="Secondary (deep navy)"><ColorRow k="secondary_color" /></Field>
        <Field label="Accent (brass)"><ColorRow k="accent_color" /></Field>
        <Field label="Background"><ColorRow k="background_color" /></Field>
        <Field label="Text color"><ColorRow k="text_color" /></Field>
        <Field label="Muted text"><ColorRow k="muted_text_color" /></Field>

        <Field label="Arabic font">
          <Select value={form.value.font_ar} onChange={(v) => form.patch("font_ar", v)} options={FONT_OPTIONS} testid="font-ar" />
        </Field>
        <Field label="English font">
          <Select value={form.value.font_en} onChange={(v) => form.patch("font_en", v)} options={FONT_OPTIONS} testid="font-en" />
        </Field>
      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}
