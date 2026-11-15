"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { stripHtml } from "@/lib/utils";

interface RichTextEditorProps {
  /** Form field name — a hidden input carries the HTML into FormData. */
  name: string;
  value: string;
  onChange: (html: string) => void;
  ariaLabel?: string;
}

const toolButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10";

/**
 * Tiptap-based rich text editor styled to match the boxed auth fields.
 * Produces sanitized-at-submit HTML; a hidden input carries it into the form.
 */
export function RichTextEditor({ name, value, onChange, ariaLabel = "Description" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Sync externally-set content (e.g. AI-generated drafts) into the editor
  // once, without triggering onChange loops.
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    const incoming = stripHtml(value).trim() ? value : "";
    if (incoming !== current && !editor.isFocused) {
      editor.commands.setContent(incoming || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const btn = (
    active: boolean,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    action: () => void,
    disabled?: boolean,
  ) => (
    <button
      key={label}
      type="button"
      tabIndex={-1}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={action}
      className={`${toolButton} ${active ? "bg-black/10 text-foreground dark:bg-white/15" : "text-muted-foreground"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div
      className="rounded-[10px] border border-black/25 bg-card transition-colors focus-within:border-black/60 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-white/40"
      aria-label={ariaLabel}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-black/10 px-2 py-1.5 dark:border-white/10">
        {editor &&
          [
            btn(editor.isActive("bold"), "Bold", Bold, () => editor.chain().focus().toggleBold().run()),
            btn(editor.isActive("italic"), "Italic", Italic, () => editor.chain().focus().toggleItalic().run()),
            btn(editor.isActive("underline"), "Underline", Underline, () => editor.chain().focus().toggleUnderline().run()),
            btn(editor.isActive("strike"), "Strikethrough", Strikethrough, () => editor.chain().focus().toggleStrike().run()),
            btn(editor.isActive("link"), "Link", Link2, () => {
              const url = window.prompt("Link URL");
              if (!url) return;
              if (!/^https?:\/\//i.test(url)) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }, editor.isActive("link")),
            btn(editor.isActive("bulletList"), "Bullet list", List, () => editor.chain().focus().toggleBulletList().run()),
            btn(editor.isActive("orderedList"), "Numbered list", ListOrdered, () => editor.chain().focus().toggleOrderedList().run()),
            btn(editor.isActive("blockquote"), "Quote", Quote, () => editor.chain().focus().toggleBlockquote().run()),
            btn(false, "Undo", Undo2, () => editor.chain().focus().undo().run(), !editor.can().undo()),
            btn(false, "Redo", Redo2, () => editor.chain().focus().redo().run(), !editor.can().redo()),
          ]}
      </div>

      <EditorContent
        editor={editor}
        className="rich-editor min-h-32 px-5 py-4 text-lg leading-snug [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
      />

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
