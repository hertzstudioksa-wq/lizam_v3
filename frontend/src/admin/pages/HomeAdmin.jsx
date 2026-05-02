import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, TextArea, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";

const SECTIONS = ["hero", "about", "mission", "vision", "objectives", "fields_of_work", "featured_publications", "contact"];

export default function HomeAdmin() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  useEffect(() => {
    apiCall("get", "/admin/home").then((r) => { if (r.ok) form.commit(r.data || {}); setLoaded(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/home", form.value);
    setSaving(false);
    if (r.ok) { form.commit(r.data); setMsg("Saved ✓"); setTimeout(() => setMsg(""), 2500); }
    else setMsg(`Error: ${r.error}`);
  }

  const toggleSection = (s) => {
    const list = form.value.visible_sections || [];
    form.patch("visible_sections", list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);
  };

  if (!loaded) return <div className="p-10 text-mute">Loading…</div>;
  const visible = form.value.visible_sections || [];

  return (
    <AdminPage title="Home Page Content" subtitle="Public homepage">
      {/* Section visibility */}
      <h3 className="lz-h3">Section visibility</h3>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {SECTIONS.map((s) => {
          const on = visible.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggleSection(s)}
              className={`h-10 text-[13px] border transition-colors ${on ? "bg-navy text-ivory border-navy" : "bg-white text-navy border-rule hover:border-navy/40"}`}
              data-testid={`toggle-section-${s}`}>
              {s.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      {/* Hero */}
      <h3 className="lz-h3 mt-10">Hero</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label="Eyebrow AR"><TextInput value={form.value.hero_eyebrow_ar} onChange={(v) => form.patch("hero_eyebrow_ar", v)} dir="rtl" testid="hero-eyebrow-ar" /></Field>
        <Field label="Eyebrow EN"><TextInput value={form.value.hero_eyebrow_en} onChange={(v) => form.patch("hero_eyebrow_en", v)} testid="hero-eyebrow-en" /></Field>
        <Field label="Title AR (use \\n for line break)"><TextArea value={form.value.hero_title_ar} onChange={(v) => form.patch("hero_title_ar", v)} dir="rtl" rows={2} testid="hero-title-ar" /></Field>
        <Field label="Title EN"><TextArea value={form.value.hero_title_en} onChange={(v) => form.patch("hero_title_en", v)} rows={2} testid="hero-title-en" /></Field>
        <Field label="Subtitle AR"><TextArea value={form.value.hero_subtitle_ar} onChange={(v) => form.patch("hero_subtitle_ar", v)} dir="rtl" rows={3} testid="hero-subtitle-ar" /></Field>
        <Field label="Subtitle EN"><TextArea value={form.value.hero_subtitle_en} onChange={(v) => form.patch("hero_subtitle_en", v)} rows={3} testid="hero-subtitle-en" /></Field>
        <Field label="CTA primary AR"><TextInput value={form.value.hero_cta_primary_ar} onChange={(v) => form.patch("hero_cta_primary_ar", v)} dir="rtl" testid="cta1-ar" /></Field>
        <Field label="CTA primary EN"><TextInput value={form.value.hero_cta_primary_en} onChange={(v) => form.patch("hero_cta_primary_en", v)} testid="cta1-en" /></Field>
        <Field label="CTA secondary AR"><TextInput value={form.value.hero_cta_secondary_ar} onChange={(v) => form.patch("hero_cta_secondary_ar", v)} dir="rtl" testid="cta2-ar" /></Field>
        <Field label="CTA secondary EN"><TextInput value={form.value.hero_cta_secondary_en} onChange={(v) => form.patch("hero_cta_secondary_en", v)} testid="cta2-en" /></Field>
      </div>

      {/* About */}
      <h3 className="lz-h3 mt-10">About</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label="About AR"><TextArea value={form.value.about_ar} onChange={(v) => form.patch("about_ar", v)} dir="rtl" rows={5} testid="about-ar" /></Field>
        <Field label="About EN"><TextArea value={form.value.about_en} onChange={(v) => form.patch("about_en", v)} rows={5} testid="about-en" /></Field>
        <Field label="About extended AR"><TextArea value={form.value.about_extended_ar} onChange={(v) => form.patch("about_extended_ar", v)} dir="rtl" rows={4} /></Field>
        <Field label="About extended EN"><TextArea value={form.value.about_extended_en} onChange={(v) => form.patch("about_extended_en", v)} rows={4} /></Field>
      </div>

      {/* Mission & Vision */}
      <h3 className="lz-h3 mt-10">Mission & Vision</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label="Mission AR"><TextArea value={form.value.mission_ar} onChange={(v) => form.patch("mission_ar", v)} dir="rtl" rows={3} /></Field>
        <Field label="Mission EN"><TextArea value={form.value.mission_en} onChange={(v) => form.patch("mission_en", v)} rows={3} /></Field>
        <Field label="Vision AR"><TextArea value={form.value.vision_ar} onChange={(v) => form.patch("vision_ar", v)} dir="rtl" rows={3} /></Field>
        <Field label="Vision EN"><TextArea value={form.value.vision_en} onChange={(v) => form.patch("vision_en", v)} rows={3} /></Field>
      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}
