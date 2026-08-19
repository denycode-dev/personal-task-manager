"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
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
} from "@phosphor-icons/react";
import { unlockNoteAction } from "@/features/notes/actions/lock-note.action";
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
  title: string;
  initialContent: unknown | null;
  isLocked: boolean;
  updatedAt: Date;
}

const STORAGE_KEY = "denycode_public_reader_prefs_v1";

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
          const { focusMode: _focusMode, ...toPersist } = next;
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

  const editor = useEditor({
    extensions: editorExtensions,
    content: parseNoteContent(initialContent),
    editable: false,
    immediatelyRender: false,
  });

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
      return;
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
        // User cancelled or error
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
        setUnlocked(true);
        editor?.commands.setContent(parsed as Content);
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
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Sparkle size={13} weight="fill" />
                Denycode
              </span>
              <span className="font-bold text-xs sm:text-sm text-black tracking-tight">
                Task Manager
              </span>
            </div>

            <div className="flex items-center gap-2">
              {scrollProgress > 0 && (
                <span className="hidden md:inline-flex text-[11px] font-bold text-neutral-600 px-2 py-0.5 bg-neutral-100 border border-neutral-300">
                  {Math.round(scrollProgress)}% terbaca
                </span>
              )}
              <span className="text-[11px] font-bold text-neutral-700 px-2.5 py-1 bg-yellow-100 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                Catatan Publik (Read-Only)
              </span>
            </div>
          </div>
        </header>
      )}

      {/* 3. Main Reader Area */}
      <main
        className={`mx-auto px-2 sm:px-6 py-4 sm:py-10 transition-all duration-200 ${widthClasses} max-w-full`}
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
                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-black border border-black transition-colors"
              >
                Keluar (ESC)
              </button>
            </div>
          </div>
        )}

        {/* Reader Container Card */}
        <div
          className={`p-4 sm:p-10 md:p-12 transition-all duration-200 overflow-hidden ${themeCardStyles}`}
        >
          {/* Reader Top Toolbar */}
          <div className="mb-6 sm:mb-8 print:hidden">
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
          </div>

          {/* Title & Reading Meta Header */}
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
                  Pemilik telah mengunci isi catatan ini dengan enkripsi
                  AES-256. Masukkan password catatan untuk membaca isinya.
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
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform text-black"
                >
                  <Key size={16} weight="bold" />
                  <span>{isUnlocking ? "Mendekripsi..." : "Buka Catatan"}</span>
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
              {editor && (!editor.isEmpty || content) ? (
                <EditorContent
                  editor={editor}
                  className="[&_.tiptap]:outline-none [&_.tiptap]:min-h-[250px] [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:block [&_.tableWrapper]:my-4 [&_.tableWrapper]:pb-2 [&_.tableWrapper]:touch-pan-x"
                />
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
              Membaca nyaman dan bebas distraksi
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
          className="fixed bottom-6 right-6 z-40 p-3 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all print:hidden"
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
