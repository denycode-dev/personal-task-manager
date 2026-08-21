"use client";

import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table/table";
import { TableRow } from "@tiptap/extension-table/row";
import { TableHeader } from "@tiptap/extension-table/header";
import { TableCell } from "@tiptap/extension-table/cell";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { updateNoteAction } from "@/features/notes/actions/update-note.action";
import { unlockNoteAction, saveLockedNoteAction } from "@/features/notes/actions/lock-note.action";
import { toast } from "sonner";
import { AUTO_SAVE_DEBOUNCE_MS } from "@/config/app";
import { Lock, Key, ShieldCheck, CircleNotch, Image as ImageIcon } from "@phosphor-icons/react";
import { CustomImage } from "@/features/notes/extensions/custom-image-extension";
import { optimizeImageToWebP, formatFileSize } from "@/features/notes/utils/image-optimizer";
import { uploadClientFile } from "@/lib/imagekit/client-upload";
import type { Note } from "@/lib/db/schema";

type Props = {
  note: Note;
  isLocked?: boolean;
};

type ToolbarBtn = {
  label: React.ReactNode;
  title: string;
  action: () => void;
  active?: boolean;
};

const editorExtensions = [
  StarterKit.configure({
    codeBlock: { HTMLAttributes: { class: "not-prose" } },
  }),
  Underline,
  CustomImage,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

export function NoteEditor({ note, isLocked = false }: Props) {
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [title, setTitle] = useState(note.title);
  const titleRef = useRef(title);

  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [unlockedContent, setUnlockedContent] = useState<unknown | null>(
    isLocked ? null : note.content
  );
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleImageProcessAndInsertRef = useRef<
    ((file: File | Blob, position?: number) => Promise<void>) | null
  >(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

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
    content: (unlockedContent as Record<string, unknown>) ?? "",
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              handleImageProcessAndInsertRef.current?.(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event, _slice, moved) {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files.length > 0
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            handleImageProcessAndInsertRef.current?.(file, coordinates?.pos);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate({ editor: currentEditor }) {
      triggerSave(titleRef.current, currentEditor.getJSON());
    },
    immediatelyRender: false,
  });

  /**
   * Alur terpusat untuk memproses, mengompresi ke WebP 80%, dan mengunggah gambar ke ImageKit
   */
  const handleImageProcessAndInsert = useCallback(
    async (file: File | Blob, position?: number) => {
      if (!editor) {
        toast.error("Editor belum siap, silakan coba beberapa saat lagi.");
        return;
      }

      setIsUploadingImage(true);
      const toastId = toast.loading("Mengoptimasi gambar ke format WebP (80%)...");

      try {
        // 1. Optimasi di browser menggunakan Canvas API
        const { file: optimizedFile, reductionPercentage, optimizedSize } =
          await optimizeImageToWebP(file, 0.8, "note-image");

        toast.loading("Mengunggah gambar ke ImageKit CDN...", { id: toastId });

        // 2. Unggah ke ImageKit CDN
        const uploaded = await uploadClientFile(optimizedFile, {
          folder: "/denycode/notes",
        });

        // 3. Sisipkan gambar ke editor Tiptap pada posisi kursor atau koordinat drop
        const imageAttrs = {
          src: uploaded.url,
          alt: uploaded.name || "Gambar Catatan",
          fileId: uploaded.fileId,
          width: "100%",
          alignment: "center",
        };

        if (typeof position === "number") {
          editor
            .chain()
            .focus()
            .insertContentAt(position, {
              type: "image",
              attrs: imageAttrs,
            })
            .run();
        } else {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: imageAttrs,
            })
            .run();
        }

        // Trigger auto-save immediately to persist image in note
        triggerSave(titleRef.current, editor.getJSON());

        const savingsText =
          reductionPercentage > 0 ? ` (hemat ${reductionPercentage}%)` : "";
        toast.success(
          `Gambar berhasil diunggah! ${formatFileSize(optimizedSize)}${savingsText} [WebP 80%]`,
          { id: toastId }
        );
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengunggah gambar.";
        toast.error(`Gagal mengunggah gambar: ${errorMsg}`, { id: toastId });
      } finally {
        setIsUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor, triggerSave]
  );

  useEffect(() => {
    handleImageProcessAndInsertRef.current = handleImageProcessAndInsert;
  }, [handleImageProcessAndInsert]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;
    if (editor) {
      triggerSave(newTitle, editor.getJSON());
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageProcessAndInsert(file);
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
        editor?.commands.setContent((res.data.content as Content) ?? {});
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

  const handleOpenImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:opacity-50 min-h-[36px] cursor-pointer"
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
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

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
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 border-b border-black/15 bg-white sticky top-[57px] z-10 items-center">
        {/* Media & Image Upload Button */}
        <div className="flex gap-0.5">
          <button
            suppressHydrationWarning
            type="button"
            onClick={handleOpenImagePicker}
            title="Unggah Gambar (Otomatis WebP 80% ke ImageKit)"
            className="px-2 py-1 text-xs font-mono border border-black/30 transition-colors select-none cursor-pointer flex items-center gap-1 bg-white text-neutral-800 hover:bg-yellow-100 hover:border-black"
          >
            <ImageIcon size={14} weight="bold" />
            <span>Gambar</span>
          </button>
        </div>

        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex gap-0.5">
            {group.map(({ label, title, action, active }, idx) => (
              <button
                suppressHydrationWarning
                key={idx}
                onClick={action}
                title={title}
                className={`px-2 py-1 text-xs font-mono border border-black/30 transition-colors select-none cursor-pointer flex items-center gap-1
                  ${active ? "bg-yellow-400 border-black font-bold text-black" : "bg-white text-neutral-800 hover:bg-yellow-100 hover:border-black"}`}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Uploading Banner State */}
      {isUploadingImage && (
        <div className="px-6 py-2 bg-yellow-100 border-b-2 border-black flex items-center justify-between gap-2 text-xs font-bold text-neutral-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CircleNotch size={16} weight="bold" className="animate-spin text-black shrink-0" />
            <span>Sedang mengompresi gambar (WebP 80%) & mengunggah ke ImageKit...</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-black text-yellow-400 px-1.5 py-0.5">
            Upload Aktif
          </span>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className="flex-1 px-6 py-4 overflow-y-auto [&_.tiptap]:min-h-[300px] [&_.tiptap]:outline-none"
      />
    </div>
  );
}
