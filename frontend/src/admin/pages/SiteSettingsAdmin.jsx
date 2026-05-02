import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, TextArea, Select, Toggle, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";

export default function SiteSettingsAdmin() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  useEffect(() => {
    apiCall("get", "/admin/site-settings").then((r) => {
      if (r.ok) {
        form.commit(r.data || {});
      }
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const payload = {
      site_name_ar: form.value.site_name_ar, site_name_en: form.value.site_name_en,
      tagline_ar: form.value.tagline_ar, tagline_en: form.value.tagline_en,
      default_language: form.value.default_language,
      contact_email: form.value.contact_email, phone: form.value.phone,
      address_ar: form.value.address_ar, address_en: form.value.address_en,
      footer_text_ar: form.value.footer_text_ar, footer_text_en: form.value.footer_text_en,
      social_links: form.value.social_links || {},
    };
    const r = await apiCall("patch", "/admin/site-settings", payload);
    setSaving(false);
    if (r.ok) { form.commit(r.data); setMsg("Saved ✓"); setTimeout(() => setMsg(""), 2500); }
    else setMsg(`Error: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">Loading…</div>;

  return (
    <AdminPage title="Site Settings" subtitle="General">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label="Arabic site name"><TextInput value={form.value.site_name_ar} onChange={(v) => form.patch("site_name_ar", v)} dir="rtl" testid="site-name-ar" /></Field>
        <Field label="English site name"><TextInput value={form.value.site_name_en} onChange={(v) => form.patch("site_name_en", v)} dir="ltr" testid="site-name-en" /></Field>
        <Field label="Arabic tagline"><TextInput value={form.value.tagline_ar} onChange={(v) => form.patch("tagline_ar", v)} dir="rtl" testid="tagline-ar" /></Field>
        <Field label="English tagline"><TextInput value={form.value.tagline_en} onChange={(v) => form.patch("tagline_en", v)} dir="ltr" testid="tagline-en" /></Field>
        <Field label="Default language">
          <Select value={form.value.default_language} onChange={(v) => form.patch("default_language", v)} options={[{value:"ar",label:"Arabic"},{value:"en",label:"English"}]} testid="default-lang" />
        </Field>
        <Field label="Contact email"><TextInput type="email" value={form.value.contact_email} onChange={(v) => form.patch("contact_email", v)} testid="contact-email" /></Field>
        <Field label="Phone"><TextInput value={form.value.phone} onChange={(v) => form.patch("phone", v)} testid="phone" /></Field>
        <Field label="Arabic address"><TextInput value={form.value.address_ar} onChange={(v) => form.patch("address_ar", v)} dir="rtl" testid="address-ar" /></Field>
        <Field label="English address"><TextInput value={form.value.address_en} onChange={(v) => form.patch("address_en", v)} dir="ltr" testid="address-en" /></Field>
        <Field label="Arabic footer text"><TextArea value={form.value.footer_text_ar} onChange={(v) => form.patch("footer_text_ar", v)} dir="rtl" rows={2} testid="footer-ar" /></Field>
        <Field label="English footer text"><TextArea value={form.value.footer_text_en} onChange={(v) => form.patch("footer_text_en", v)} rows={2} testid="footer-en" /></Field>
      </div>

      <h3 className="lz-h3 mt-12">Social Links</h3>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        {["twitter","linkedin","youtube","facebook","instagram"].map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
            <TextInput value={form.value.social_links?.[k]} onChange={(v) => form.patch("social_links", {...(form.value.social_links||{}), [k]: v})} testid={`social-${k}`} />
          </Field>
        ))}
      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}
