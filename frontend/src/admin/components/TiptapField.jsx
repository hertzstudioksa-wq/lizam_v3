import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  Link2, Undo, Redo, Minus,
} from "lucide-react";

/**
 * Bilingual TipTap field — one instance per language with correct dir.
 */
export default function TiptapField({ value = "", onChange, dir = "ltr", placeholder = "", testid }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
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
        editorProps: { attributes: { dir, class: "lz-tiptap min-h-[280px] max-h-[620px] overflow-y-auto p-5 outline-none text-[15px] leading-[1.9]" } },
      });
    }
  }, [editor, dir]);

  if (!editor) return null;

  return (
    <div className="border border-rule bg-white" dir={dir}>
      <Toolbar editor={editor} dir={dir} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, dir }) {
  const btn = (active) =>
    `h-8 px-2 inline-flex items-center justify-center text-[12.5px] transition-colors ${
      active ? "bg-navy/10 text-navy-deep" : "text-mute hover:text-navy"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-rule bg-paper" dir="ltr">
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold"><Bold size={14} /></button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><Italic size={14} /></button>
      <span className="w-px h-5 bg-rule mx-1" />
      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2"><Heading2 size={14} /></button>
      <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="H3"><Heading3 size={14} /></button>
      <span className="w-px h-5 bg-rule mx-1" />
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list"><List size={14} /></button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered list"><ListOrdered size={14} /></button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Quote"><Quote size={14} /></button>
      <span className="w-px h-5 bg-rule mx-1" />
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="Rule"><Minus size={14} /></button>
      <button type="button" className={btn(editor.isActive("link"))} onClick={() => {
        const url = window.prompt("URL:");
        if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        else editor.chain().focus().unsetLink().run();
      }} aria-label="Link"><Link2 size={14} /></button>
      <span className="w-px h-5 bg-rule mx-1" />
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} aria-label="Undo"><Undo size={14} /></button>
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} aria-label="Redo"><Redo size={14} /></button>
      <span className="ms-auto text-[11px] text-mute uppercase tracking-[0.18em]">{dir}</span>
    </div>
  );
}
