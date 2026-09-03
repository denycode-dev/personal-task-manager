"use client";

import { useState, useEffect, useRef, useMemo, useCallback, useTransition } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { CustomImage } from "@/features/notes/extensions/custom-image-extension";
import { MermaidCodeBlock } from "@/features/notes/extensions/mermaid-code-block-extension";
import { Table } from "@tiptap/extension-table/table";
import { TableRow } from "@tiptap/extension-table/row";
import { TableHeader } from "@tiptap/extension-table/header";
import { TableCell } from "@tiptap/extension-table/cell";
import {
  Lock,
  Key,
  ShieldCheck,
  Clock,
  Article,
  CalendarBlank,
  Sparkle,
  EyeSlash,
  ArrowUp,
  PencilSimple,
  BookOpen,
  Check,
  CircleNotch,
  ArrowsClockwise,
  GitMerge,
  Lightning,
  DownloadSimple,
  WarningOctagon,
} from "@phosphor-icons/react";
import { unlockNoteAction } from "@/features/notes/actions/lock-note.action";
import {
  savePublicNoteAction,
  syncPublicNoteAction,
} from "@/features/notes/actions/save-public-note.action";
import { toast } from "sonner";
import { ReadingToolbar } from "@/features/notes/components/reading-toolbar";
import { TableOfContentsModal } from "@/features/notes/components/table-of-contents-modal";
import {
  type ReaderPreferences,
  DEFAULT_READER_PREFERENCES,
  calculateReadingStats,
  extractTableOfContents,
  extractPlainText,
  downloadMarkdownFile,
} from "@/features/notes/utils/reading-utils";

interface PublicNoteViewerProps {
  noteId: string;
  slug: string;
  title: string;
  initialContent: unknown | null;
  initialVersion?: number;
  isLocked: boolean;
  isEditable?: boolean;
  updatedAt: Date;
}

interface ConflictInfo {
  serverVersion: number;
  serverUpdatedAt: Date;
  serverContent: unknown | null;
  localDraft: unknown;
}

type ToolbarBtn = {
  label: React.ReactNode;
  title: string;
  action: () => void;
  active?: boolean;
};

const STORAGE_KEY = "denycode_public_reader_prefs_v1";
const OPTIMAL_SYNC_INTERVAL_MS = 4000; // 4 detik: interval optimal real-time polling tanpa membebani server/database

function parseNoteContent(raw: unknown): Content {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Content;
    } catch {
      return raw;
    }
  }
  return raw as Content;
}

/**
 * Menggabungkan dokumen Tiptap secara non-destruktif untuk menghindari kehilangan data (Zero Data Loss).
 */
function mergeTiptapContents(serverContent: unknown, localDraft: unknown): unknown {
  const parse = (c: unknown): { type?: string; content?: unknown[] } => {
    if (!c) return { type: "doc", content: [] };
    if (typeof c === "string") {
      try {
        return JSON.parse(c);
      } catch {
        return {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: c }] }],
        };
      }
    }
    return c as { type?: string; content?: unknown[] };
  };

  const sDoc = parse(serverContent);
  const lDoc = parse(localDraft);

  const sNodes = Array.isArray(sDoc.content) ? sDoc.content : [];
  const lNodes = Array.isArray(lDoc.content) ? lDoc.content : [];

  const dividerNode = {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "——— [Draf Tambahan Penggabungan Bersama] ———",
        marks: [{ type: "bold" }],
      },
    ],
  };

  return {
    type: "doc",
    content: [...sNodes, dividerNode, ...lNodes],
  };
}

const editorExtensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  MermaidCodeBlock,
  Underline,
  CustomImage,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

export function PublicNoteViewer({
  noteId,
  slug,
  title,
  initialContent,
  initialVersion = 1,
  isLocked,
  isEditable = false,
  updatedAt,
}: PublicNoteViewerProps) {
  const [content, setContent] = useState<unknown | null>(initialContent);
  const [currentVersion, setCurrentVersion] = useState<number>(initialVersion);
  const currentVersionRef = useRef<number>(initialVersion);

  const [password, setPassword] = useState("");
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(!isLocked);

  // Edit / Read view mode when editable is true
  const [activeViewMode, setActiveViewMode] = useState<"edit" | "read">("edit");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  // Multi-user background sync states
  const [lastSyncedUpdatedAt, setLastSyncedUpdatedAt] = useState<Date>(updatedAt);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasRemoteChanges, setHasRemoteChanges] = useState(false);
  const [pendingRemoteContent, setPendingRemoteContent] = useState<unknown | null>(null);

  // Optimistic Concurrency Control conflict modal state
  const [conflictData, setConflictData] = useState<ConflictInfo | null>(null);

  const lastUserTypingTimeRef = useRef<number>(0);
  const isRemoteApplyingRef = useRef<boolean>(false);

  // Reader Preferences State
  const [preferences, setPreferences] = useState<ReaderPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_READER_PREFERENCES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return {
          ...DEFAULT_READER_PREFERENCES,
          ...JSON.parse(saved),
          focusMode: false,
        };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_READER_PREFERENCES;
  });
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const handleUpdatePreferences = useCallback(
    (updates: Partial<ReaderPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...updates };
        try {
          const toPersist = { ...next };
          delete (toPersist as Partial<ReaderPreferences>).focusMode;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    []
  );

  // Calculate Reading Stats & ToC
  const readingStats = useMemo(() => {
    return calculateReadingStats(unlocked ? content : null);
  }, [unlocked, content]);

  const tocItems = useMemo(() => {
    return extractTableOfContents(unlocked ? content : null);
  }, [unlocked, content]);

  // Debounced auto-save function dengan Optimistic Concurrency Control (OCC)
  const triggerSave = useCallback(
    (
      newContent: unknown,
      options?: { force?: boolean; baseVersion?: number }
    ) => {
      if (!isEditable) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveState("saving");

      const force = options?.force ?? false;
      const targetVersion = options?.baseVersion ?? currentVersionRef.current;

      const executeSave = () => {
        startTransition(async () => {
          const res = await savePublicNoteAction({
            slug,
            noteId,
            content: newContent,
            baseVersion: targetVersion,
            force,
            password: sessionPassword ?? undefined,
          });

          if (res.success) {
            if (res.data.saved) {
              setSaveState("saved");
              setContent(newContent);
              setCurrentVersion(res.data.version);
              currentVersionRef.current = res.data.version;
              setLastSyncedUpdatedAt(new Date(res.data.updatedAt));
              setConflictData(null);
            } else if (res.data.conflict) {
              // Terjadi bentrokan OCC: pengguna lain telah memperbarui catatan
              setSaveState("error");
              setConflictData({
                serverVersion: res.data.serverVersion,
                serverUpdatedAt: new Date(res.data.serverUpdatedAt),
                serverContent: res.data.serverContent,
                localDraft: newContent,
              });
              toast.warning(
                "Konflik terdeteksi: Pengguna lain telah memperbarui catatan ini terlebih dahulu."
              );
            }
          } else {
            setSaveState("error");
            toast.error(res.error ?? "Gagal menyimpan perubahan catatan.");
          }
        });
      };

      if (force) {
        executeSave();
      } else {
        saveTimerRef.current = setTimeout(executeSave, 800);
      }
    },
    [isEditable, slug, noteId, sessionPassword]
  );

  const editor = useEditor({
    extensions: editorExtensions,
    content: parseNoteContent(initialContent),
    editable: isEditable && unlocked && activeViewMode === "edit",
    onUpdate({ editor: currentEditor }) {
      if (isRemoteApplyingRef.current) return;
      lastUserTypingTimeRef.current = Date.now();
      if (!isEditable) return;
      triggerSave(currentEditor.getJSON());
    },
    immediatelyRender: false,
  });

  // Keep editor editable property synchronized
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditable && unlocked && activeViewMode === "edit");
    }
  }, [editor, isEditable, unlocked, activeViewMode]);

  // Cleanup auto-save timer on unmount
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  // Multi-user periodic sync function (OCC-aware)
  const performSync = useCallback(
    async (forceApply: boolean = false) => {
      if (isLocked && !unlocked) return;
      if (isSyncing) return;

      setIsSyncing(true);
      try {
        const res = await syncPublicNoteAction({
          slug,
          noteId,
          lastVersion: currentVersionRef.current,
          lastUpdatedAt: lastSyncedUpdatedAt,
          password: sessionPassword ?? undefined,
        });

        if (res.success && res.data.isUpdated && res.data.content !== undefined) {
          const newContent = res.data.content;
          const newDate = new Date(res.data.updatedAt);
          const newVersion = res.data.version;

          const currentJSON = editor ? JSON.stringify(editor.getJSON()) : "";
          const newJSON = JSON.stringify(newContent);

          // Jika isinya persis sama, hanya perbarui version & timestamp
          if (currentJSON === newJSON) {
            setLastSyncedUpdatedAt(newDate);
            setCurrentVersion(newVersion);
            currentVersionRef.current = newVersion;
            setHasRemoteChanges(false);
            setPendingRemoteContent(null);
            return;
          }

          // Periksa apakah pengguna lokal sedang aktif mengetik
          const now = Date.now();
          const isUserActivelyTyping =
            isEditable &&
            activeViewMode === "edit" &&
            (saveState === "saving" ||
              now - lastUserTypingTimeRef.current < 2500 ||
              Boolean(editor?.isFocused));

          if (isUserActivelyTyping && !forceApply) {
            // Tahan dan tampilkan banner notifikasi agar kursor dan ketikan pengguna tidak terganggu
            setHasRemoteChanges(true);
            setPendingRemoteContent(newContent);
          } else {
            // Terapkan sinkronisasi langsung
            isRemoteApplyingRef.current = true;
            const parsed = parseNoteContent(newContent);
            editor?.commands.setContent(parsed as Content);
            setContent(parsed);
            setCurrentVersion(newVersion);
            currentVersionRef.current = newVersion;
            setLastSyncedUpdatedAt(newDate);
            setHasRemoteChanges(false);
            setPendingRemoteContent(null);
            isRemoteApplyingRef.current = false;
            toast.info("Catatan disinkronkan dengan pembaruan terbaru.");
          }
        } else if (res.success && !res.data.isUpdated) {
          setLastSyncedUpdatedAt(new Date(res.data.updatedAt));
          if (res.data.version) {
            setCurrentVersion(res.data.version);
            currentVersionRef.current = res.data.version;
          }
        }
      } catch {
        // Polling background gagal diam tanpa mengganggu pengguna
      } finally {
        setIsSyncing(false);
      }
    },
    [
      isLocked,
      unlocked,
      isSyncing,
      slug,
      noteId,
      lastSyncedUpdatedAt,
      sessionPassword,
      editor,
      isEditable,
      activeViewMode,
      saveState,
    ]
  );

  // Jalankan sync periodik optimal setiap 4 detik saat tab aktif
  useEffect(() => {
    if (isLocked && !unlocked) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          performSync(false);
        }
      }, OPTIMAL_SYNC_INTERVAL_MS);
    };

    startInterval();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performSync(false);
        startInterval();
      } else if (intervalId) {
        clearInterval(intervalId);
      }
    };

    const handleWindowFocus = () => {
      performSync(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isLocked, unlocked, performSync]);

  const handleApplyRemoteChanges = () => {
    if (!pendingRemoteContent) return;
    isRemoteApplyingRef.current = true;
    const parsed = parseNoteContent(pendingRemoteContent);
    editor?.commands.setContent(parsed as Content);
    setContent(parsed);
    setHasRemoteChanges(false);
    setPendingRemoteContent(null);
    isRemoteApplyingRef.current = false;
    toast.success("Perubahan dari pengguna lain berhasil diterapkan.");
  };

  const handleManualSync = () => {
    performSync(true);
    toast.success("Menyinkronkan data...");
  };

  // Conflict Resolution Handlers
  const handleResolveMerge = () => {
    if (!conflictData) return;
    const merged = mergeTiptapContents(conflictData.serverContent, conflictData.localDraft);
    isRemoteApplyingRef.current = true;
    const parsed = parseNoteContent(merged);
    editor?.commands.setContent(parsed as Content);
    setContent(parsed);
    isRemoteApplyingRef.current = false;

    // Simpan versi gabungan ke server menggunakan baseVersion dari server
    triggerSave(merged, { force: false, baseVersion: conflictData.serverVersion });
    setConflictData(null);
    toast.success("Draf Anda dan perubahan server berhasil digabungkan!");
  };

  const handleResolveForceOverwrite = () => {
    if (!conflictData) return;
    triggerSave(conflictData.localDraft, { force: true });
    setConflictData(null);
    toast.info("Menyimpan draf lokal Anda sebagai versi terbaru...");
  };

  const handleResolveUseServer = () => {
    if (!conflictData) return;
    isRemoteApplyingRef.current = true;
    const parsed = parseNoteContent(conflictData.serverContent);
    editor?.commands.setContent(parsed as Content);
    setContent(parsed);
    setCurrentVersion(conflictData.serverVersion);
    currentVersionRef.current = conflictData.serverVersion;
    setLastSyncedUpdatedAt(new Date(conflictData.serverUpdatedAt));
    setConflictData(null);
    setSaveState("saved");
    isRemoteApplyingRef.current = false;
    toast.info("Versi terbaru dari server berhasil dimuat.");
  };

  // Track Reading Progress Bar & Scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, (window.scrollY / totalHeight) * 100)
        );
        setScrollProgress(progress);
      }
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Escape key exits focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && preferences.focusMode) {
        handleUpdatePreferences({ focusMode: false });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [preferences.focusMode, handleUpdatePreferences]);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Mode layar penuh tidak didukung di browser ini.");
    }
  };

  const handleCopyText = async () => {
    if (!unlocked) {
      toast.error("Catatan terkunci belum dapat disalin.");
    }

    try {
      const rawText = `${title || "Catatan Tanpa Judul"}\n\n${extractPlainText(
        content
      )}`;
      await navigator.clipboard.writeText(rawText);
      setIsCopied(true);
      toast.success("Teks catatan berhasil disalin ke clipboard!");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Gagal menyalin teks catatan.");
    }
  };

  const handleExportMarkdown = () => {
    if (!unlocked) {
      toast.error("Buka catatan terlebih dahulu untuk mengekspor.");
      return;
    }
    try {
      downloadMarkdownFile(title, content, updatedAt);
      toast.success("Catatan berhasil diekspor sebagai file Markdown (.md)!");
    } catch {
      toast.error("Gagal mengekspor catatan ke file Markdown.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: title || "Catatan Denycode",
      text: `Baca catatan: "${title || "Catatan Publik"}" di Denycode Task Manager`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Tautan catatan publik berhasil disalin ke clipboard!");
      } catch {
        toast.error("Gagal menyalin tautan.");
      }
    }
  };

  const handleSelectHeading = (headingId: string) => {
    if (!contentAreaRef.current) return;
    const targetItem = tocItems.find((t) => t.id === headingId);
    if (!targetItem) return;

    setActiveTocId(headingId);
    const headings = contentAreaRef.current.querySelectorAll("h1, h2, h3, h4");
    for (const h of headings) {
      if (
        h.textContent?.trim().toLowerCase() ===
        targetItem.text.trim().toLowerCase()
      ) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        h.classList.add("bg-yellow-200", "transition-colors", "duration-700");
        setTimeout(() => {
          h.classList.remove("bg-yellow-200");
        }, 1800);
        break;
      }
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsUnlocking(true);
    try {
      const res = await unlockNoteAction(noteId, password);
      if (res.success) {
        const parsed = parseNoteContent(res.data.content);
        setContent(parsed);
        setSessionPassword(password);
        setUnlocked(true);
        editor?.commands.setContent(parsed as Content);
        if (isEditable) {
          editor?.setEditable(activeViewMode === "edit");
        }
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

  // Dynamic Typography & Width Classes
  const widthClasses = {
    standard: "max-w-3xl",
    wide: "max-w-5xl",
    full: "max-w-7xl",
  }[preferences.containerWidth];

  const fontClasses = {
    sans: "font-sans",
    serif: "font-serif tracking-normal",
    mono: "font-mono text-[0.93em]",
  }[preferences.fontFamily];

  const fontSizeClasses = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-relaxed",
    lg: "text-lg leading-loose",
    xl: "text-xl leading-loose",
  }[preferences.fontSize];

  const lineHeightClasses = {
    normal: "[&_p]:leading-normal [&_li]:leading-normal",
    relaxed: "[&_p]:leading-relaxed [&_li]:leading-relaxed",
    loose: "[&_p]:leading-loose [&_li]:leading-loose",
  }[preferences.lineHeight];

  // Theme Tints for Reader Paper
  const themeCardStyles = {
    light:
      "bg-white text-neutral-900 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    sepia:
      "bg-[#fcf7ed] text-[#382b22] border-2 border-[#5c4028] shadow-[6px_6px_0px_0px_rgba(92,64,40,1)] [&_.tiptap_pre]:bg-[#2c2018] [&_.tiptap_pre]:border-[#5c4028] [&_.tiptap_code]:bg-[#ede2cb] [&_.tiptap_blockquote]:border-[#d4a373] [&_.tiptap_blockquote]:bg-[#faeed9]",
    dark: "bg-[#18181b] text-neutral-100 border-2 border-neutral-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] [&_.tiptap_pre]:bg-[#09090b] [&_.tiptap_pre]:border-neutral-700 [&_.tiptap_code]:bg-neutral-800 [&_.tiptap_code]:text-yellow-300 [&_.tiptap_blockquote]:border-yellow-400 [&_.tiptap_blockquote]:bg-neutral-900 [&_.tiptap_blockquote]:text-neutral-300 [&_.tiptap_th]:bg-neutral-800 [&_.tiptap_th]:text-yellow-400 [&_.tiptap_td]:border-neutral-700 [&_.tiptap_th]:border-neutral-700",
  }[preferences.theme];

  const themePageBg = {
    light: "bg-neutral-100",
    sepia: "bg-[#f4ebd9]",
    dark: "bg-[#09090b] text-neutral-100",
  }[preferences.theme];

  // Formatting Toolbar Buttons for Edit Mode
  const toolbarGroups: ToolbarBtn[][] = [
    // Text formatting
    [
      { label: "B", title: "Tebal (Bold)", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
      { label: "I", title: "Miring (Italic)", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
      { label: "U", title: "Garis Bawah (Underline)", action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") },
      { label: "S", title: "Coret (Strikethrough)", action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive("strike") },
    ],
    // Headings
    [
      { label: "H1", title: "Heading 1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) },
      { label: "H2", title: "Heading 2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
      { label: "H3", title: "Heading 3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) },
    ],
    // Lists
    [
      { label: "• List", title: "Daftar Poin", action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
      { label: "1. List", title: "Daftar Nomor", action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
    ],
    // Blocks
    [
      { label: "❝", title: "Kutipan (Blockquote)", action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote") },
      { label: "</>", title: "Blok Kode", action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive("codeBlock") },
      { label: "code", title: "Kode Sebaris", action: () => editor?.chain().focus().toggleCode().run(), active: editor?.isActive("code") },
    ],
    // Table
    [
      { label: "⊞ Tabel", title: "Sisipkan tabel 3×3", action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: "+ Kolom", title: "Tambah kolom", action: () => editor?.chain().focus().addColumnAfter().run() },
      { label: "+ Baris", title: "Tambah baris", action: () => editor?.chain().focus().addRowAfter().run() },
      { label: "✕ Tabel", title: "Hapus tabel", action: () => editor?.chain().focus().deleteTable().run() },
    ],
    // Misc
    [
      { label: "—", title: "Garis horizontal", action: () => editor?.chain().focus().setHorizontalRule().run() },
      { label: "↩", title: "Batal (Undo)", action: () => editor?.chain().focus().undo().run() },
      { label: "↪", title: "Ulangi (Redo)", action: () => editor?.chain().focus().redo().run() },
    ],
  ];

  return (
    <div
      ref={viewerContainerRef}
      className={`min-h-screen transition-colors duration-200 ${themePageBg} ${
        preferences.focusMode ? "pt-4 sm:pt-6" : ""
      }`}
    >
      {/* 1. Top Sticky Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/10 pointer-events-none print:hidden">
        <div
          className="h-full bg-yellow-400 transition-all duration-100 ease-out shadow-[0px_0px_4px_rgba(250,204,21,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Public Header (Hidden in Focus Mode or Print) */}
      {!preferences.focusMode && (
        <header className="border-b-2 border-black bg-white px-4 sm:px-6 py-3 sticky top-0 z-30 print:hidden shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,1)]">
                <Sparkle size={13} weight="fill" />
                Denycode
              </span>
              <span className="font-bold text-xs sm:text-sm text-black tracking-tight">
                Task Manager
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Multi-user live sync indicator with version tag */}
              {unlocked && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  title={`Sinkronisasi multi-pengguna aktif setiap 4 detik. Versi saat ini: v${currentVersion}. Klik untuk menyinkronkan sekarang.`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border-2 border-black bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <ArrowsClockwise
                    size={13}
                    weight="bold"
                    className={isSyncing ? "animate-spin text-black" : "text-neutral-700"}
                  />
                  <span className="text-[11px] font-black text-black">
                    {isSyncing ? "Menyinkronkan..." : `Sync 4d`}
                  </span>
                  <span className="bg-neutral-200 text-neutral-800 text-[10px] font-bold px-1 rounded-none border border-neutral-400">
                    v{currentVersion}
                  </span>
                </button>
              )}

              {/* Auto-save status indicator if in editable mode */}
              {isEditable && unlocked && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border-2 border-black bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {saveState === "saving" ? (
                    <>
                      <CircleNotch size={13} weight="bold" className="animate-spin text-neutral-800" />
                      <span className="text-neutral-700 font-bold text-[11px]">Menyimpan…</span>
                    </>
                  ) : saveState === "error" ? (
                    <span className="text-rose-600 font-black text-[11px] flex items-center gap-1">
                      <WarningOctagon size={13} weight="bold" />
                      {conflictData ? "Konflik Edit" : "Gagal menyimpan"}
                    </span>
                  ) : (
                    <>
                      <Check size={13} weight="bold" className="text-emerald-700" />
                      <span className="text-emerald-800 font-bold text-[11px]">Tersimpan</span>
                    </>
                  )}
                </div>
              )}

              {/* Mode Switcher Pill (Edit vs Baca) if editable & unlocked */}
              {isEditable && unlocked && (
                <div className="inline-flex border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-neutral-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewMode("edit");
                      editor?.setEditable(true);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                      activeViewMode === "edit"
                        ? "bg-emerald-300 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        : "text-neutral-700 hover:text-black"
                    }`}
                  >
                    <PencilSimple size={13} weight="bold" />
                    <span>Mode Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewMode("read");
                      editor?.setEditable(false);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                      activeViewMode === "read"
                        ? "bg-yellow-300 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        : "text-neutral-700 hover:text-black"
                    }`}
                  >
                    <BookOpen size={13} weight="bold" />
                    <span>Mode Baca</span>
                  </button>
                </div>
              )}

              {/* Badge Izin Akses */}
              {isEditable ? (
                <span className="text-[11px] font-black text-black px-2.5 py-1 bg-emerald-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                  <PencilSimple size={13} weight="bold" />
                  <span>Bisa Diedit</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-neutral-800 px-2.5 py-1 bg-yellow-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Catatan Publik (Hanya Baca)
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 3. Main Reader / Editor Area */}
      <main
        className={`mx-auto px-2 sm:px-6 py-3 sm:py-8 transition-all duration-200 ${widthClasses} max-w-full`}
      >
        {/* Floating Focus Mode Banner */}
        {preferences.focusMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3 px-4 py-2 bg-black text-white border-2 border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <EyeSlash size={16} weight="bold" className="text-yellow-400" />
                Mode Fokus Aktif
              </span>
              <button
                onClick={() => handleUpdatePreferences({ focusMode: false })}
                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-black border border-black transition-colors cursor-pointer"
              >
                Keluar (ESC)
              </button>
            </div>
          </div>
        )}

        {/* Remote Changes Alert Banner (Saat user sedang mengetik) */}
        {hasRemoteChanges && !conflictData && (
          <div className="mb-3 p-3 bg-yellow-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs font-bold text-black">
              <ArrowsClockwise size={16} weight="bold" className="animate-spin text-black shrink-0" />
              <span>Pengguna lain telah memperbarui catatan ini. Klik untuk menerapkan pembaruan terbaru.</span>
            </div>
            <button
              type="button"
              onClick={handleApplyRemoteChanges}
              className="px-3 py-1 bg-black text-yellow-300 hover:bg-neutral-800 text-xs font-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer whitespace-nowrap transition-transform hover:-translate-y-0.5"
            >
              Terapkan Perubahan
            </button>
          </div>
        )}

        {/* Conflict Resolution Modal (Optimistic Concurrency Control Triggered) */}
        {conflictData && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full p-6 text-black space-y-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-300 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <WarningOctagon size={16} weight="fill" />
                  Konflik Multi-User Terdeteksi
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Catatan Telah Diperbarui Pengguna Lain
                </h3>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  Pengguna lain baru saja menyimpan versi yang lebih baru (v{conflictData.serverVersion}) pada saat Anda sedang mengedit.
                  Ketikkan Anda di draf lokal tetap aman. Silakan pilih cara penanganan:
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Gabungkan Konten (Non-Destructive Smart Merge) */}
                <button
                  type="button"
                  onClick={handleResolveMerge}
                  className="w-full text-left p-3.5 border-2 border-black bg-emerald-100 hover:bg-emerald-200 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 flex items-start gap-3 cursor-pointer"
                >
                  <GitMerge size={22} weight="bold" className="text-emerald-900 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                      Gabungkan Konten Otomatis
                      <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase">
                        Zero Data Loss
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-900 mt-0.5">
                      Menyisipkan draf lokal Anda di bagian bawah pembaruan server dengan pemisah yang rapi. Tidak ada kata yang hilang!
                    </div>
                  </div>
                </button>

                {/* 2. Gunakan Versi Server */}
                <button
                  type="button"
                  onClick={handleResolveUseServer}
                  className="w-full text-left p-3.5 border-2 border-black bg-neutral-100 hover:bg-neutral-200 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 flex items-start gap-3 cursor-pointer"
                >
                  <DownloadSimple size={22} weight="bold" className="text-neutral-800 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-xs text-neutral-900">
                      Gunakan Versi Server (v{conflictData.serverVersion})
                    </div>
                    <div className="text-[11px] text-neutral-600 mt-0.5">
                      Menerapkan perubahan dari pengguna lain dan membatalkan draf lokal Anda.
                    </div>
                  </div>
                </button>

                {/* 3. Paksa Simpan Versi Saya */}
                <button
                  type="button"
                  onClick={handleResolveForceOverwrite}
                  className="w-full text-left p-3.5 border-2 border-black bg-rose-100 hover:bg-rose-200 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 flex items-start gap-3 cursor-pointer"
                >
                  <Lightning size={22} weight="bold" className="text-rose-900 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-xs text-rose-950 flex items-center gap-1.5">
                      Timpa dengan Draf Saya
                      <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase">
                        Override
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-900 mt-0.5">
                      Menyimpan draf lokal Anda secara paksa dan menimpa perubahan server.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar Bar: Switch between Reading Toolbar and Formatting Toolbar */}
        {unlocked && (
          <div
            className={`sticky z-20 print:hidden transition-all duration-200 mb-3 sm:mb-4 ${
              preferences.focusMode
                ? "top-2 sm:top-4"
                : "top-[53px] sm:top-[60px]"
            }`}
          >
            {isEditable && activeViewMode === "edit" ? (
              /* Formatting Toolbar for Edit Mode */
              <div className="flex flex-wrap gap-x-2 gap-y-1 p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] items-center">
                {toolbarGroups.map((group, gi) => (
                  <div key={gi} className="flex gap-0.5 border-r border-black/20 pr-2 mr-1 last:border-r-0 last:pr-0 last:mr-0">
                    {group.map(({ label, title: btnTitle, action, active }, idx) => (
                      <button
                        suppressHydrationWarning
                        key={idx}
                        type="button"
                        onClick={action}
                        title={btnTitle}
                        className={`px-2 py-1 text-xs font-mono border border-black/30 transition-colors select-none cursor-pointer flex items-center gap-1 ${
                          active
                            ? "bg-yellow-400 border-black font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            : "bg-white text-neutral-800 hover:bg-yellow-100 hover:border-black"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              /* Reading Toolbar for Reader Mode */
              <ReadingToolbar
                preferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
                tocCount={tocItems.length}
                onOpenToc={() => setIsTocOpen(true)}
                onCopyText={handleCopyText}
                onShare={handleShare}
                onExportMarkdown={handleExportMarkdown}
                isCopied={isCopied}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
              />
            )}
          </div>
        )}

        {/* Reader / Editor Container Card */}
        <div
          data-theme={preferences.theme}
          className={`p-4 sm:p-10 md:p-12 transition-all duration-200 overflow-hidden ${themeCardStyles}`}
        >
          {/* Title & Meta Header */}
          <div className="border-b-2 border-current/20 pb-6 mb-6 sm:mb-8 space-y-4">
            <h1
              className={`font-black tracking-tight leading-tight transition-all ${
                preferences.fontSize === "xl"
                  ? "text-3xl sm:text-4xl md:text-5xl"
                  : preferences.fontSize === "lg"
                  ? "text-2xl sm:text-3xl md:text-4xl"
                  : "text-2xl sm:text-3xl"
              } ${fontClasses}`}
            >
              {title || "Catatan Tanpa Judul"}
            </h1>

            {/* Badges / Meta row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold opacity-90">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/5 dark:bg-white/10 border border-current/20 rounded-none">
                <CalendarBlank size={14} weight="bold" />
                <span>
                  {new Date(updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {unlocked && readingStats.words > 0 && (
                <>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400/20 border border-current/20 text-current">
                    <Clock size={14} weight="bold" />
                    <span>~{readingStats.readingTimeMinutes} min baca</span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/5 dark:bg-white/10 border border-current/20">
                    <Article size={14} weight="bold" />
                    <span>{readingStats.words} kata</span>
                  </div>
                </>
              )}

              {isLocked && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                  <Lock size={13} weight="fill" />
                  <span>Terenkripsi AES-256</span>
                </div>
              )}

              {isEditable && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                  <PencilSimple size={13} weight="bold" />
                  <span>Kolaborasi Multi-User</span>
                </div>
              )}
            </div>
          </div>

          {/* Lock Gate if Locked and not unlocked */}
          {!unlocked ? (
            <div className="p-6 sm:p-8 border-2 border-black bg-yellow-50 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4 max-w-md mx-auto my-8 print:hidden">
              <div className="inline-flex p-3.5 bg-rose-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
                <Lock size={32} weight="fill" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-black">
                  Catatan Ini Terkunci
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {isEditable
                    ? "Pemilik telah mengunci isi catatan ini dengan enkripsi AES-256. Masukkan password catatan untuk mulai membaca dan mengedit isinya."
                    : "Pemilik telah mengunci isi catatan ini dengan enkripsi AES-256. Masukkan password catatan untuk membaca isinya."}
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3 pt-2 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">
                    Password Catatan
                  </label>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password catatan..."
                    className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-white bg-white text-black"
                  />
                </div>

                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isUnlocking}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform text-black cursor-pointer"
                >
                  <Key size={16} weight="bold" />
                  <span>
                    {isUnlocking
                      ? "Mendekripsi..."
                      : isEditable
                      ? "Buka & Mulai Edit"
                      : "Buka Catatan"}
                  </span>
                </button>
              </form>

              <div className="pt-2 border-t-2 border-black/10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-neutral-600">
                <ShieldCheck
                  size={14}
                  weight="bold"
                  className="text-emerald-700"
                />
                <span>Terenkripsi end-to-end aman</span>
              </div>
            </div>
          ) : (
            /* Note Content Area */
            <div
              ref={contentAreaRef}
              className={`tiptap transition-all duration-150 ${fontClasses} ${fontSizeClasses} ${lineHeightClasses} max-w-full overflow-hidden`}
            >
              {editor && (!editor.isEmpty || content || (isEditable && activeViewMode === "edit")) ? (
                <div
                  className={
                    isEditable && activeViewMode === "edit"
                      ? "p-3 sm:p-5 border-2 border-dashed border-black/30 focus-within:border-black bg-black/[0.01] transition-colors rounded-none"
                      : ""
                  }
                >
                  <EditorContent
                    editor={editor}
                    className="[&_.tiptap]:outline-none [&_.tiptap]:min-h-[250px] [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:block [&_.tableWrapper]:my-4 [&_.tableWrapper]:pb-2 [&_.tableWrapper]:touch-pan-x"
                  />
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-current/60 italic text-sm font-medium">
                    Catatan ini belum memiliki konten teks.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. Public Footer (Hidden in Focus Mode or Print) */}
      {!preferences.focusMode && (
        <footer className="border-t-2 border-black bg-white px-4 py-6 text-center text-xs font-semibold text-neutral-600 mt-12 print:hidden">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>Denycode Task Manager • Personal productivity workspace</p>
            <p className="text-[11px] text-neutral-500">
              {isEditable
                ? "Kolaborasi catatan publik aman dengan Optimistic Concurrency Control (OCC)"
                : "Membaca nyaman dan bebas distraksi"}
            </p>
          </div>
        </footer>
      )}

      {/* 5. Table of Contents Modal */}
      <TableOfContentsModal
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        items={tocItems}
        activeId={activeTocId}
        onSelectHeading={handleSelectHeading}
      />

      {/* 6. Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          title="Kembali ke atas"
          aria-label="Kembali ke atas"
          className="fixed bottom-6 right-6 z-40 p-3 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all print:hidden cursor-pointer"
        >
          <ArrowUp size={18} weight="bold" />
        </button>
      )}

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .tiptap {
            font-size: 12pt !important;
            line-height: 1.6 !important;
            color: black !important;
          }
          .tiptap a {
            text-decoration: underline !important;
          }
        }
      `}</style>
    </div>
  );
}
