"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table/table";
import { TableRow } from "@tiptap/extension-table/row";
import { TableHeader } from "@tiptap/extension-table/header";
import { TableCell } from "@tiptap/extension-table/cell";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { updateNoteAction } from "@/features/notes/actions/update-note.action";
import { unlockNoteAction, saveLockedNoteAction } from "@/features/notes/actions/lock-note.action";
import { toast } from "sonner";
import { AUTO_SAVE_DEBOUNCE_MS } from "@/config/app";
import { Lock, Key, ArrowRight, ShieldCheck, CircleNotch } from "@phosphor-icons/react";
import type { Note } from "@/lib/db/schema";

type Props = {
  note: Note;
  isLocked?: boolean;
};

type ToolbarBtn = {
  label: string;
  title: string;
  action: () => void;
  active?: boolean;
};

const editorExtensions = [
  StarterKit.configure({
    codeBlock: { HTMLAttributes: { class: "not-prose" } },
  }),
  Underline,
  Image,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

export function NoteEditor({ note, isLocked = false }: Props) {
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [title, setTitle] = useState(note.title);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [unlockedContent, setUnlockedContent] = useState<unknown | null>(
    isLocked ? null : note.content
  );
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const triggerSave = useCallback(
    (newTitle: string, content: unknown) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveState("saving");
      saveTimerRef.current = setTimeout(() => {
        startTransition(async () => {
          if (isLocked && sessionPassword) {
            // Save encrypted content
            const lockRes = await saveLockedNoteAction(note.id, sessionPassword, content);
            const titleRes = await updateNoteAction(note.id, { title: newTitle });
            setSaveState(lockRes.success && titleRes.success ? "saved" : "error");
            if (!lockRes.success || !titleRes.success) {
              toast.error("Gagal menyimpan catatan terenkripsi.");
            }
          } else {
            // Save normal plaintext
            const result = await updateNoteAction(note.id, { title: newTitle, content });
            setSaveState(result.success ? "saved" : "error");
            if (!result.success) toast.error("Gagal menyimpan catatan.");
          }
        });
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    [note.id, isLocked, sessionPassword]
  );

  const editor = useEditor({
    extensions: editorExtensions,
    content: (unlockedContent as any) ?? "",
    onUpdate({ editor }) {
      triggerSave(title, editor.getJSON());
    },
    immediatelyRender: false,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    triggerSave(e.target.value, editor?.getJSON());
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPasswordInput) return;

    setIsUnlocking(true);
    try {
      const res = await unlockNoteAction(note.id, unlockPasswordInput);
      if (res.success) {
        setSessionPassword(unlockPasswordInput);
        setUnlockedContent(res.data.content ?? {});
        editor?.commands.setContent(res.data.content as any);
        toast.success("Catatan berhasil didekripsi!");
      } else {
        toast.error(res.error ?? "Password salah.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat membuka catatan.");
    } finally {
      setIsUnlocking(false);
    }
  };

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  // If note is locked and not yet unlocked in current session, show Lock Gate
  if (isLocked && !sessionPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="w-full max-w-md border-2 border-black bg-yellow-50 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="inline-flex p-3.5 bg-rose-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <Lock size={32} weight="fill" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-black">Catatan Terkunci</h2>
            <p className="text-xs text-neutral-700 leading-relaxed max-w-xs mx-auto">
              Dokumen ini dienkripsi dengan <strong>AES-256 Envelope Encryption</strong>. Masukkan password catatan Anda untuk mendekripsi dan membaca isinya.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3 pt-2">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-black">Password Catatan</label>
              <input
                suppressHydrationWarning
                type="password"
                required
                autoFocus
                value={unlockPasswordInput}
                onChange={(e) => setUnlockPasswordInput(e.target.value)}
                placeholder="Masukkan password catatan"
                className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-white"
              />
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={isUnlocking || !unlockPasswordInput}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:opacity-50 min-h-[36px]"
            >
              {isUnlocking ? (
                <>
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                  <span>Mendekripsi...</span>
                </>
              ) : (
                <>
                  <Key size={16} weight="bold" />
                  <span>Buka Catatan</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t-2 border-black/10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-neutral-600">
            <ShieldCheck size={14} weight="bold" className="text-emerald-700" />
            <span>Enkripsi terisolasi & aman</span>
          </div>
        </div>
      </div>
    );
  }

  if (!editor) return null;

  const toolbarGroups: ToolbarBtn[][] = [
    // Text formatting
    [
      { label: "B",  title: "Bold",          action: () => editor.chain().focus().toggleBold().run(),          active: editor.isActive("bold") },
      { label: "I",  title: "Italic",         action: () => editor.chain().focus().toggleItalic().run(),        active: editor.isActive("italic") },
      { label: "U",  title: "Underline",      action: () => editor.chain().focus().toggleUnderline().run(),     active: editor.isActive("underline") },
      { label: "S",  title: "Strikethrough",  action: () => editor.chain().focus().toggleStrike().run(),        active: editor.isActive("strike") },
    ],
    // Headings
    [
      { label: "H1", title: "Heading 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
      { label: "H2", title: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
      { label: "H3", title: "Heading 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    ],
    // Lists
    [
      { label: "• List",  title: "Bullet list",   action: () => editor.chain().focus().toggleBulletList().run(),   active: editor.isActive("bulletList") },
      { label: "1. List", title: "Ordered list",  action: () => editor.chain().focus().toggleOrderedList().run(),  active: editor.isActive("orderedList") },
    ],
    // Blocks
    [
      { label: "❝",     title: "Blockquote", action: () => editor.chain().focus().toggleBlockquote().run(),  active: editor.isActive("blockquote") },
      { label: "</>",   title: "Code block", action: () => editor.chain().focus().toggleCodeBlock().run(),   active: editor.isActive("codeBlock") },
      { label: "code",  title: "Inline code", action: () => editor.chain().focus().toggleCode().run(),       active: editor.isActive("code") },
    ],
    // Table
    [
      { label: "⊞ Tabel",    title: "Sisipkan tabel 3×3",  action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: "+ Kolom",    title: "Tambah kolom",         action: () => editor.chain().focus().addColumnAfter().run() },
      { label: "+ Baris",    title: "Tambah baris",         action: () => editor.chain().focus().addRowAfter().run() },
      { label: "✕ Tabel",   title: "Hapus tabel",          action: () => editor.chain().focus().deleteTable().run() },
    ],
    // Misc
    [
      { label: "—",   title: "Garis horizontal", action: () => editor.chain().focus().setHorizontalRule().run() },
      { label: "↩",   title: "Undo", action: () => editor.chain().focus().undo().run() },
      { label: "↪",   title: "Redo", action: () => editor.chain().focus().redo().run() },
    ],
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Title + save state bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b-2 border-black bg-white sticky top-0 z-10 gap-4">
        <input
          suppressHydrationWarning
          value={title}
          onChange={handleTitleChange}
          className="text-xl font-bold bg-transparent outline-none flex-1"
          placeholder="Judul catatan"
        />
        <div className="flex items-center gap-2">
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black">
              <Lock size={10} weight="fill" />
              Terenkripsi AES-256
            </span>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {saveState === "saving" ? "Menyimpan…" : saveState === "error" ? "⚠ Gagal menyimpan" : "✓ Tersimpan"}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 border-b border-black/15 bg-white sticky top-[57px] z-10">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex gap-0.5">
            {group.map(({ label, title, action, active }) => (
              <button
                suppressHydrationWarning
                key={label}
                onClick={action}
                title={title}
                className={`px-2 py-1 text-xs font-mono border border-black/30 transition-colors select-none
                  ${active ? "bg-yellow-400 border-black font-bold" : "bg-white hover:bg-gray-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="flex-1 px-6 py-4 overflow-y-auto [&_.tiptap]:min-h-[300px] [&_.tiptap]:outline-none"
      />
    </div>
  );
}
