import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

/**
 * ReorderControls — minimal, dependency-free up/down + drag-handle controls
 * for ordering items in a list. No external DnD library.
 *
 * Usage:
 *   <ReorderControls
 *     index={i}
 *     total={items.length}
 *     onMove={(from, to) => ...}
 *     testid={`reorder-${item.id}`}
 *   />
 *
 * onMove receives indices, NOT items, so the parent owns the ordering state.
 */
export function ReorderControls({ index, total, onMove, testid }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <div className="inline-flex items-center gap-0.5" data-testid={testid}>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onMove(index, index - 1)}
        title={tr("نقل لأعلى", "Move up")}
        aria-label={tr("نقل لأعلى", "Move up")}
        className="h-7 w-7 inline-flex items-center justify-center text-mute hover:text-navy hover:bg-paper transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        data-testid={testid ? `${testid}-up` : undefined}
      >
        <ArrowUp size={14} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onMove(index, index + 1)}
        title={tr("نقل لأسفل", "Move down")}
        aria-label={tr("نقل لأسفل", "Move down")}
        className="h-7 w-7 inline-flex items-center justify-center text-mute hover:text-navy hover:bg-paper transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        data-testid={testid ? `${testid}-down` : undefined}
      >
        <ArrowDown size={14} strokeWidth={1.8} />
      </button>
      <span
        className="h-7 w-7 inline-flex items-center justify-center text-mute/40 cursor-grab active:cursor-grabbing"
        title={tr("اسحب لإعادة الترتيب", "Drag to reorder")}
        aria-hidden
      >
        <GripVertical size={14} strokeWidth={1.6} />
      </span>
    </div>
  );
}

/** Pure helper — return a new array with `from` index moved to `to`. */
export function moveItem(arr, from, to) {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
