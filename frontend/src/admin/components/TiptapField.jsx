import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { useEffect, useRef } from "react";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  Link2, Undo, Redo, Minus, Table as TableIcon, Upload,
  Plus, Trash2, ChevronDown, ChevronRight,
} from "lucide-react";

/** Extract title + summary from mammoth HTML, return cleaned content */
function extractDocumentParts(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  const children = Array.from(body.children).filter((el) => el.textContent.trim());

  // ── 1. TITLE ──────────────────────────────────────────────────────────────
  // Priority: <h1> → first short bold <p> → first short <p> before any heading
  let titleEl = null;
  let title = "";

  const h1 = body.querySelector("h1");
  if (h1) {
    titleEl = h1;
  } else {
    // Check first 3 elements for a short bold/heading-like paragraph
    for (const el of children.slice(0, 3)) {
      const text = el.textContent.trim();
      const isShort = text.length < 200;
      const isBold = !!el.querySelector("strong, b") && el.textContent === (el.querySelector("strong, b")?.textContent || "");
      const isHeading = /^H[1-6]$/.test(el.tagName);
      if (isShort && (isHeading || isBold)) {
        titleEl = el;
        break;
      }
    }
    // Last fallback: if very first element is short and next is a heading → it's the title
    if (!titleEl && children.length > 1) {
      const first = children[0];
      const second = children[1];
      if (
        first.textContent.trim().length < 200 &&
        /^H[1-6]$/.test(second?.tagName)
      ) {
        titleEl = first;
      }
    }
  }

  if (titleEl) {
    title = titleEl.textContent.trim();
    titleEl.remove();
  }

  // ── 2. SUMMARY ────────────────────────────────────────────────────────────
  // Find heading with ملخص / مقدمة / abstract then collect paragraphs after it
  const SUMMARY_WORDS = ["ملخص", "ملخص تنفيذي", "مقدمة", "abstract", "summary", "introduction"];
  let summary = "";
  let summaryHeading = null;

  for (const el of body.querySelectorAll("h1,h2,h3,h4")) {
    if (SUMMARY_WORDS.some((w) => el.textContent.trim().toLowerCase().includes(w))) {
      summaryHeading = el;
      break;
    }
  }

  if (summaryHeading) {
    const parts = [];
    let next = summaryHeading.nextElementSibling;
    while (next && !["H1","H2","H3","H4"].includes(next.tagName)) {
      const t = next.textContent.trim();
      if (t) parts.push(t);
      next = next.nextElementSibling;
    }
    summary = parts.slice(0, 4).join(" ").slice(0, 600);
  }

  // Fallback: first paragraph
  if (!summary) {
    const firstP = body.querySelector("p");
    if (firstP && firstP.textContent.trim().length > 30) {
      summary = firstP.textContent.trim().slice(0, 500);
    }
  }

  return { title, summary, content: body.innerHTML };
}

export default function TiptapField({ value = "", onChange, onImport, dir = "ltr", placeholder = "", testid }) {
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        dir,
        class: "lz-tiptap min-h-[280px] max-h-[620px] overflow-y-auto p-5 outline-none text-[15px] leading-[1.9]",
        "data-testid": testid,
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            dir,
            class: "lz-tiptap min-h-[280px] max-h-[620px] overflow-y-auto p-5 outline-none text-[15px] leading-[1.9]",
          },
        },
      });
    }
  }, [editor, dir]);

  // Import Word (.docx) via mammoth
  async function handleWordImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      // mammoth browser bundle — exports via module.exports (CJS)
      const mod = await import("mammoth");
      const convertToHtml = mod.convertToHtml ?? mod.default?.convertToHtml ?? mod.default;
      if (typeof convertToHtml !== "function") throw new Error("mammoth لم يُحمَّل بشكل صحيح");

      const arrayBuffer = await file.arrayBuffer();
      const result = await convertToHtml({
        arrayBuffer,
        // Tell mammoth: Word's "Title" style → <h1>
        // Covers Arabic/English title styles in Word
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='عنوان'] => h1:fresh",
          "p[style-name='Titre'] => h1:fresh",
        ],
      });

      if (editor && result.value) {
        if (onImport) {
          const { summary, content } = extractDocumentParts(result.value);
          // Title = filename without extension, cleaned up
          const title = file.name.replace(/\.docx?$/i, "").replace(/[-_]+/g, " ").trim();
          editor.commands.setContent(content, true);
          onChange?.(editor.getHTML());
          onImport({ title, summary });
        } else {
          editor.commands.setContent(result.value, true);
          onChange?.(editor.getHTML());
        }
      }
      if (result.messages?.length) {
        console.warn("mammoth warnings:", result.messages);
      }
    } catch (err) {
      console.error("Word import error:", err);
      alert(`خطأ في الاستيراد: ${err.message}`);
    }
  }

  if (!editor) return null;

  return (
    <div className="border border-rule bg-white" dir={dir}>
      <Toolbar editor={editor} dir={dir} fileRef={fileRef} />
      {/* Hidden file input for Word import */}
      <input
        ref={fileRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleWordImport}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, dir, fileRef }) {
  const btn = (active) =>
    `h-8 px-2 inline-flex items-center justify-center text-[12.5px] transition-colors ${
      active ? "bg-navy/10 text-navy-deep" : "text-mute hover:text-navy"
    }`;

  const inTable = editor.isActive("table");

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-rule bg-paper" dir="ltr">

      {/* ── Text formatting ── */}
      <button type="button" className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></button>
      <button type="button" className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></button>

      <Sep />

      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><Heading2 size={14} /></button>
      <button type="button" className={btn(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3"><Heading3 size={14} /></button>

      <Sep />

      <button type="button" className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={14} /></button>
      <button type="button" className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={14} /></button>
      <button type="button" className={btn(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={14} /></button>

      <Sep />

      <button type="button" className={btn(false)}
        onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus size={14} /></button>
      <button type="button" className={btn(editor.isActive("link"))} title="Link"
        onClick={() => {
          const url = window.prompt("URL:");
          if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}><Link2 size={14} /></button>

      <Sep />

      {/* ── Table controls ── */}
      {!inTable ? (
        <button
          type="button"
          className={`${btn(false)} gap-1`}
          title="إدراج جدول"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon size={14} />
          <span className="text-[11px]">جدول</span>
        </button>
      ) : (
        <>
          <button type="button" className={`${btn(false)} gap-1`} title="إضافة صف"
            onClick={() => editor.chain().focus().addRowAfter().run()}>
            <ChevronDown size={13} /><span className="text-[10px]">صف</span>
          </button>
          <button type="button" className={`${btn(false)} gap-1`} title="إضافة عمود"
            onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <ChevronRight size={13} /><span className="text-[10px]">عمود</span>
          </button>
          <button type="button" className={`${btn(false)} gap-1 text-red-600 hover:text-red-700`} title="حذف صف"
            onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 size={12} /><span className="text-[10px]">صف</span>
          </button>
          <button type="button" className={`${btn(false)} gap-1 text-red-600 hover:text-red-700`} title="حذف عمود"
            onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2 size={12} /><span className="text-[10px]">عمود</span>
          </button>
          <button type="button" className={`${btn(false)} text-red-700`} title="حذف الجدول"
            onClick={() => editor.chain().focus().deleteTable().run()}>
            <TableIcon size={13} />×
          </button>
        </>
      )}

      <Sep />

      {/* ── Word import ── */}
      <button
        type="button"
        className={`${btn(false)} gap-1.5 border border-rule px-2.5 text-navy-deep hover:border-brass hover:text-brass`}
        title="استيراد ملف Word (.docx)"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={13} />
        <span className="text-[11px] font-medium">استيراد Word</span>
      </button>

      <Sep />

      <button type="button" className={btn(false)}
        onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={14} /></button>
      <button type="button" className={btn(false)}
        onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={14} /></button>

      <span className="ms-auto text-[11px] text-mute uppercase tracking-[0.18em]">{dir}</span>
    </div>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-rule mx-1 shrink-0" />;
}
