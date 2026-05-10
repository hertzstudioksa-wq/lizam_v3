import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

/**
 * Confirmation modal for destructive (permanent) deletions.
 *
 * UX guards:
 *  - User must type the literal word (default: "حذف" / "DELETE") to enable the
 *    delete button.
 *  - Esc closes. Background click closes.
 *  - The delete button is red and shows a loading state while the request runs.
 *
 * Usage:
 *   <ConfirmDeleteDialog
 *     open={!!targetId}
 *     onClose={() => setTargetId(null)}
 *     onConfirm={async () => { await api.delete(...); reload(); }}
 *     entityName={targetTitle}
 *   />
 */
export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  entityName,
  warningAr,
  warningEn,
  testid = "confirm-delete-dialog",
}) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const phrase = tr("حذف", "DELETE");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) {
      setTyped("");
      setErr("");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const canConfirm = typed.trim() === phrase && !busy;

  async function handleConfirm() {
    if (!canConfirm) return;
    setBusy(true);
    setErr("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setErr(typeof detail === "string" ? detail : (e?.message || "Error"));
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10, 17, 28, 0.55)" }}
      onClick={() => !busy && onClose()}
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-testid={testid}
    >
      <div
        className="relative w-full max-w-md bg-white border border-rule shadow-xl"
        style={{ borderRadius: 6 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          className="absolute top-3 end-3 text-mute hover:text-navy"
          aria-label={tr("إغلاق", "Close")}
          data-testid={`${testid}-close`}
        >
          <X size={18} />
        </button>

        <div className="p-6 md:p-7">
          <div className="flex items-start gap-3">
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}>
              <AlertTriangle size={20} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h2 className="lz-h3 text-navy-deep">
                {tr("حذف نهائي", "Permanent delete")}
              </h2>
              <p className="mt-2 text-[13.5px] text-ink/80 leading-[1.8]">
                {tr(
                  warningAr ||
                    "هذا الإجراء سيمسح السجل من قاعدة البيانات نهائياً ولا يمكن التراجع عنه.",
                  warningEn ||
                    "This action permanently removes the record from the database and cannot be undone."
                )}
              </p>
              {entityName && (
                <p
                  className="mt-3 px-3 py-2 bg-paper border border-rule text-[13.5px] text-navy-deep break-words"
                  data-testid={`${testid}-entity`}
                >
                  {entityName}
                </p>
              )}
            </div>
          </div>

          <label className="block mt-6">
            <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-2">
              {lang === "ar" ? (
                <>اكتب كلمة <span className="font-semibold text-red-700">«حذف»</span> للتأكيد</>
              ) : (
                <>Type <span className="font-semibold text-red-700">DELETE</span> to confirm</>
              )}
            </span>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="w-full h-11 px-3 bg-white border border-rule focus:border-red-700 outline-none text-[14.5px]"
              placeholder={phrase}
              data-testid={`${testid}-input`}
            />
          </label>

          {err && (
            <div className="mt-3 px-3 py-2 bg-red-50 border-l-2 border-red-700 text-[13px] text-red-900" data-testid={`${testid}-error`}>
              {err}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="lz-btn-ghost"
              data-testid={`${testid}-cancel`}
            >
              {tr("إلغاء", "Cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canConfirm ? "#dc2626" : "#fca5a5",
                letterSpacing: lang === "ar" ? "normal" : "0.04em",
              }}
              data-testid={`${testid}-confirm`}
            >
              {busy ? tr("جارٍ الحذف…", "Deleting…") : tr("حذف نهائي", "Delete permanently")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
