"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table/table";
import { TableRow } from "@tiptap/extension-table/row";
import { TableHeader } from "@tiptap/extension-table/header";
import { TableCell } from "@tiptap/extension-table/cell";
import { Lock, Key, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { unlockNoteAction } from "@/features/notes/actions/lock-note.action";
import { toast } from "sonner";

interface PublicNoteViewerProps {
  noteId: string;
  title: string;
  initialContent: unknown | null;
  isLocked: boolean;
  updatedAt: Date;
}

function parseNoteContent(raw: unknown): unknown {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

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

export function PublicNoteViewer({
  noteId,
  title,
  initialContent,
  isLocked,
  updatedAt,
}: PublicNoteViewerProps) {
  const [content, setContent] = useState<unknown | null>(initialContent);
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(!isLocked);

  const editor = useEditor({
    extensions: editorExtensions,
    content: (parseNoteContent(initialContent) as any) ?? "",
    editable: false,
    immediatelyRender: false,
  });

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsUnlocking(true);
    try {
      const res = await unlockNoteAction(noteId, password);
      if (res.success) {
        const parsed = parseNoteContent(res.data.content);
        setContent(parsed);
        setUnlocked(true);
        editor?.commands.setContent(parsed as any);
        toast.success("Catatan berhasil didekripsi!");
      } else {
        toast.error(res.error ?? "Password catatan salah.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memverifikasi password.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Metadata Header */}
      <div className="border-b-2 border-black pb-4 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight">
          {title || "Catatan Tanpa Judul"}
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          Terakhir diperbarui{" "}
          {new Date(updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Lock Gate if Locked and not unlocked */}
      {!unlocked ? (
        <div className="p-6 sm:p-8 border-2 border-black bg-yellow-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4 max-w-md mx-auto my-6">
          <div className="inline-flex p-3.5 bg-rose-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <Lock size={32} weight="fill" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-black">Catatan Ini Terkunci</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Pemilik telah mengunci isi catatan ini dengan enkripsi AES-256. Masukkan password catatan untuk membaca isinya.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3 pt-2 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-black">Password Catatan</label>
              <input
                suppressHydrationWarning
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-white"
              />
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={isUnlocking}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Key size={16} weight="bold" />
              <span>{isUnlocking ? "Mendekripsi..." : "Buka Catatan"}</span>
            </button>
          </form>

          <div className="pt-2 border-t-2 border-black/10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-neutral-600">
            <ShieldCheck size={14} weight="bold" className="text-emerald-700" />
            <span>Terenkripsi aman</span>
          </div>
        </div>
      ) : (
        <div className="tiptap prose prose-sm max-w-none text-black leading-relaxed">
          {editor && (!editor.isEmpty || content) ? (
            <EditorContent
              editor={editor}
              className="[&_.tiptap]:outline-none [&_.tiptap]:min-h-[150px]"
            />
          ) : (
            <p className="text-muted-foreground italic text-sm">
              Catatan ini belum memiliki konten teks.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
