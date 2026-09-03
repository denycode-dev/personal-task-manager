"use client";

import { useState, useMemo, useEffect } from "react";
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
  Folder,
  MagnifyingGlass,
  X,
  SquaresFour,
  BookOpen,
  Lock,
  CalendarBlank,
  Copy,
  Check,
  ArrowSquareOut,
  Article,
  ArrowRight,
  ArrowLeft,
  CaretRight,
  CaretDown,
  TreeStructure,
  DownloadSimple,
  ArrowsOut,
  ArrowsIn,
  SidebarSimple,
  Clock,
  ListBullets,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { APP_NAME } from "@/config/app";
import {
  calculateReadingStats,
  downloadMarkdownFile,
  extractPlainText,
} from "@/features/notes/utils/reading-utils";
import type {
  PublicFolderNoteItem,
  PublicFolderSubfolderItem,
} from "@/features/folders/services/folder-share.service";

interface PublicFolderViewerProps {
  folder: {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  };
  breadcrumbs?: { id: string; name: string; color: string }[];
  subfolders?: PublicFolderSubfolderItem[];
  notes: PublicFolderNoteItem[];
  slug: string;
}

const editorExtensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  MermaidCodeBlock,
  Underline,
  CustomImage,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
];

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

// Single Page Content Reader Component using TipTap in read-only mode
function PublicPageContentReader({
  note,
  folder,
  breadcrumbs = [],
  fontSize,
  fontFamily,
}: {
  note: PublicFolderNoteItem;
  folder: { name: string; color: string };
  breadcrumbs?: { id: string; name: string; color: string }[];
  fontSize: "sm" | "base" | "lg";
  fontFamily: "sans" | "serif" | "mono";
}) {
  const content = useMemo(() => parseNoteContent(note.content), [note.content]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: editorExtensions,
    content,
    editorProps: {
      attributes: {
        class: `prose prose-neutral max-w-none focus:outline-none min-h-[300px] leading-relaxed text-black ${
          fontSize === "sm" ? "prose-sm" : fontSize === "lg" ? "prose-lg" : "prose-base"
        } ${
          fontFamily === "serif"
            ? "font-serif"
            : fontFamily === "mono"
            ? "font-mono"
            : "font-sans"
        }`,
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const readingStats = useMemo(() => {
    if (!note.content) return { words: 0, readingTimeMinutes: 1, characters: 0, paragraphs: 0 };
    const text = extractPlainText(note.content);
    return calculateReadingStats(text);
  }, [note.content]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-2 border-b-2 border-black pb-4">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold text-neutral-600">
          <span className="text-[10px] text-neutral-400 font-mono">LOKASI:</span>
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.id} className="flex items-center gap-1.5">
              {idx > 0 && <CaretRight size={11} weight="bold" className="text-neutral-400" />}
              <span
                className="w-2 h-2 rounded-xs border border-black"
                style={{ backgroundColor: crumb.color }}
              />
              <span className="truncate max-w-[120px]">{crumb.name}</span>
            </div>
          ))}
          {note.folderName && note.folderName !== folder.name && (
            <div className="flex items-center gap-1.5">
              <CaretRight size={11} weight="bold" className="text-neutral-400" />
              <span
                className="w-2 h-2 rounded-xs border border-black"
                style={{ backgroundColor: note.folderColor || "#FFD500" }}
              />
              <span className="text-black font-black">{note.folderName}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight">
          {note.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-neutral-500 pt-1">
          <span className="flex items-center gap-1">
            <CalendarBlank size={13} weight="bold" />
            <span>
              Diperbarui:{" "}
              {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={13} weight="bold" />
            <span>{readingStats.readingTimeMinutes} menit baca ({readingStats.words} kata)</span>
          </span>
        </div>
      </div>

      {/* Note Body */}
      {note.isLocked ? (
        <div className="p-8 my-6 text-center border-2 border-black bg-amber-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3 max-w-md mx-auto">
          <span className="inline-flex p-3 bg-amber-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Lock size={28} weight="fill" className="text-amber-900" />
          </span>
          <h3 className="text-base font-black text-black">Halaman Ini Terkunci</h3>
          <p className="text-xs text-neutral-700 font-medium">
            Catatan ini diproteksi dengan kata sandi oleh pemilik. Silakan buka halaman mandiri untuk memasukkan kata sandi.
          </p>
          <Link
            href={`/notes/public/${note.shareSlug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <span>Buka & Masukkan Kata Sandi</span>
            <ArrowSquareOut size={14} weight="bold" />
          </Link>
        </div>
      ) : (
        <div className="py-2">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

export function PublicFolderViewer({
  folder,
  breadcrumbs = [],
  subfolders = [],
  notes,
  slug,
}: PublicFolderViewerProps) {
  // Display Mode: 'reader' (Interactive Multi-page Book/Handbook) vs 'index' (Overview Grid)
  const [displayMode, setDisplayMode] = useState<"reader" | "index">("index");
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated-desc" | "updated-asc" | "title-asc" | "title-desc">("updated-desc");

  // Reader Settings
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");

  // Copy Feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPageLink, setCopiedPageLink] = useState(false);

  // Expanded subfolders in sidebar
  const [collapsedSubfolders, setCollapsedSubfolders] = useState<Set<string>>(new Set());

  const toggleSubfolderCollapse = (subId: string) => {
    setCollapsedSubfolders((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    let list = [...notes];

    // 1. Subfolder filter
    if (selectedSubfolderId !== "all") {
      if (selectedSubfolderId === "root") {
        list = list.filter((n) => !n.folderId || n.folderId === folder.id);
      } else {
        list = list.filter((n) => n.folderId === selectedSubfolderId);
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.snippet.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case "updated-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
        case "title-desc":
          return b.title.localeCompare(a.title, "id", { sensitivity: "base" });
        case "updated-desc":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return list;
  }, [notes, selectedSubfolderId, searchQuery, sortBy, folder.id]);

  // Active Note Object & Indices
  const activeNoteIndex = useMemo(() => {
    return filteredNotes.findIndex((n) => n.id === activeNoteId);
  }, [filteredNotes, activeNoteId]);

  const activeNote = useMemo(() => {
    if (activeNoteIndex >= 0) return filteredNotes[activeNoteIndex];
    return filteredNotes[0] || null;
  }, [filteredNotes, activeNoteIndex]);

  // Keep activeNoteId synced if notes change
  useEffect(() => {
    if (!activeNoteId && filteredNotes.length > 0) {
      setActiveNoteId(filteredNotes[0].id);
    }
  }, [activeNoteId, filteredNotes]);

  // Grouped structure for sidebar
  const notesByFolder = useMemo(() => {
    const rootNotes = notes.filter((n) => !n.folderId || n.folderId === folder.id);
    const subfolderGroups = subfolders.map((sub) => ({
      ...sub,
      notes: notes.filter((n) => n.folderId === sub.id),
    }));

    return { rootNotes, subfolderGroups };
  }, [notes, subfolders, folder.id]);

  // Navigation handlers
  const handlePrevPage = () => {
    if (activeNoteIndex > 0) {
      setActiveNoteId(filteredNotes[activeNoteIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (activeNoteIndex < filteredNotes.length - 1) {
      setActiveNoteId(filteredNotes[activeNoteIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayMode !== "reader") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) {
        handlePrevPage();
      } else if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) {
        handleNextPage();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayMode, activeNoteIndex, filteredNotes, isFullscreen]);

  const handleCopyFolderLink = () => {
    const url = typeof window !== "undefined" ? window.location.origin + `/folders/public/${slug}` : "";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Tautan folder publik berhasil disalin!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPageLink = (note: PublicFolderNoteItem) => {
    const url = typeof window !== "undefined" ? window.location.origin + `/notes/public/${note.shareSlug}` : "";
    navigator.clipboard.writeText(url);
    setCopiedPageLink(true);
    toast.success(`Tautan halaman "${note.title}" berhasil disalin!`);
    setTimeout(() => setCopiedPageLink(false), 2000);
  };

  const handleExportActiveMarkdown = () => {
    if (!activeNote) return;
    const text = activeNote.content ? extractPlainText(activeNote.content) : activeNote.snippet;
    downloadMarkdownFile(activeNote.title || "Catatan", text);
    toast.success(`Halaman "${activeNote.title}" berhasil diunduh (.md)!`);
  };

  const handleSelectNoteFromSidebar = (noteId: string) => {
    setActiveNoteId(noteId);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // On small screens, close sidebar automatically after selecting a page
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`min-h-screen bg-neutral-100 text-black flex flex-col font-sans ${isFullscreen ? "fixed inset-0 z-50 bg-white overflow-y-auto" : ""}`}>
      {/* 1. Global Header Bar */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-30 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Folder Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="p-1.5 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center shrink-0"
              style={{ backgroundColor: folder.color }}
            >
              <Folder size={18} weight="fill" className="text-black" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-300 px-1.5 py-0.2 border border-black">
                  Koleksi Multi-Halaman
                </span>
                {breadcrumbs.length > 1 && (
                  <span className="text-[10px] text-neutral-500 font-bold hidden sm:inline">
                    ({breadcrumbs.length} Tingkat)
                  </span>
                )}
              </div>
              <h1 className="font-black text-xs sm:text-base text-black truncate max-w-[180px] sm:max-w-md">
                {folder.name}
              </h1>
            </div>
          </div>

          {/* Center / Right: Mode Switcher & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle: Multi-Page Reader vs Index Overview */}
            <div className="flex border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
              <button
                type="button"
                onClick={() => setDisplayMode("reader")}
                className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  displayMode === "reader"
                    ? "bg-yellow-400 text-black font-black"
                    : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
                title="Mode Pembaca Dokumen Multi-Halaman"
              >
                <BookOpen size={15} weight={displayMode === "reader" ? "fill" : "bold"} />
                <span className="hidden md:inline">Mode Buku / Dokumen</span>
              </button>
              <div className="w-[2px] bg-black" />
              <button
                type="button"
                onClick={() => setDisplayMode("index")}
                className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  displayMode === "index"
                    ? "bg-yellow-400 text-black font-black"
                    : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
                title="Mode Galeri & Indeks Semua Halaman"
              >
                <SquaresFour size={15} weight={displayMode === "index" ? "fill" : "bold"} />
                <span className="hidden md:inline">Indeks Halaman</span>
              </button>
            </div>

            {/* Copy Link Button */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleCopyFolderLink}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer"
              title="Salin Tautan Folder"
            >
              {copiedLink ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
              <span className="hidden sm:inline">{copiedLink ? "Tersalin" : "Salin Link"}</span>
            </button>

            {/* Fullscreen Toggle in Reader Mode */}
            {displayMode === "reader" && (
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="p-1.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform cursor-pointer hidden sm:inline-flex"
                title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Layar Penuh Fokus Baca"}
              >
                {isFullscreen ? <ArrowsIn size={14} weight="bold" /> : <ArrowsOut size={14} weight="bold" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      {displayMode === "reader" ? (
        /* ========================================================================= */
        /* MULTI-PAGE DOCUMENT / BOOK READER VIEW                                     */
        /* ========================================================================= */
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col md:flex-row gap-6 items-start">
          {/* A. Sidebar Outline / Table of Contents */}
          {isSidebarOpen && (
            <aside className="w-full md:w-80 shrink-0 bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sticky top-16 max-h-[calc(100vh-5rem)] overflow-hidden z-20">
              {/* Sidebar Header */}
              <div className="p-3 bg-yellow-300 border-b-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TreeStructure size={16} weight="bold" />
                  <span className="font-black text-xs text-black uppercase tracking-wider">
                    Daftar Isi ({notes.length} Halaman)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 hover:bg-yellow-400 border border-black rounded-xs transition-colors cursor-pointer bg-white text-black"
                  title="Tutup / Sembunyikan Panel Daftar Isi"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* Sidebar Search */}
              <div className="p-2.5 border-b-2 border-black/10 bg-neutral-50">
                <div className="relative">
                  <MagnifyingGlass
                    size={14}
                    weight="bold"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari halaman catatan..."
                    className="w-full pl-7 pr-6 py-1.5 text-xs bg-white border-2 border-black font-medium text-black focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar List of Pages */}
              <div className="overflow-y-auto p-2 space-y-3 flex-1 scrollbar-thin">
                {/* Root Folder Notes */}
                {notesByFolder.rootNotes.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-black text-neutral-700 uppercase tracking-wider bg-neutral-100 border border-black/20">
                      <Folder size={13} weight="fill" style={{ color: folder.color }} />
                      <span className="truncate">{folder.name}</span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        ({notesByFolder.rootNotes.length})
                      </span>
                    </div>
                    <div className="space-y-1 pl-1">
                      {notesByFolder.rootNotes
                        .filter((n) =>
                          searchQuery.trim()
                            ? n.title.toLowerCase().includes(searchQuery.toLowerCase())
                            : true
                        )
                        .map((note) => {
                          const isSelected = activeNote?.id === note.id;
                          const pageNum = filteredNotes.findIndex((fn) => fn.id === note.id) + 1;
                          return (
                            <button
                              key={note.id}
                              type="button"
                              onClick={() => handleSelectNoteFromSidebar(note.id)}
                              className={`w-full text-left p-2 border-2 transition-all flex items-start gap-2 cursor-pointer ${
                                isSelected
                                  ? "bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black"
                                  : "bg-white border-transparent hover:border-black hover:bg-neutral-50 text-neutral-800"
                              }`}
                            >
                              <span className="text-[10px] font-mono px-1 py-0.2 bg-black/10 rounded-xs shrink-0 mt-0.5">
                                {pageNum > 0 ? `${pageNum}` : "•"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs truncate block font-bold leading-tight">
                                  {note.title}
                                </span>
                                {note.isLocked && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-800 font-bold mt-0.5">
                                    <Lock size={10} weight="fill" />
                                    Terkunci
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Subfolder Sections */}
                {notesByFolder.subfolderGroups.map((sub) => {
                  const isCollapsed = collapsedSubfolders.has(sub.id);
                  const subNotes = sub.notes.filter((n) =>
                    searchQuery.trim()
                      ? n.title.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  );
                  if (subNotes.length === 0 && searchQuery.trim()) return null;

                  return (
                    <div key={sub.id} className="space-y-1 pt-1 border-t border-black/10">
                      <div
                        className="flex items-center justify-between px-2 py-1 text-[11px] font-black text-neutral-700 uppercase tracking-wider bg-neutral-100 border border-black/20 cursor-pointer select-none hover:bg-neutral-200 transition-colors"
                        onClick={() => toggleSubfolderCollapse(sub.id)}
                        style={{ paddingLeft: `${Math.max(0.5, sub.depth * 0.5)}rem` }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span
                            className="w-2.5 h-2.5 rounded-xs border border-black shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="truncate">{sub.name}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            ({sub.notes.length})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="p-0.5 text-neutral-500 hover:text-black"
                          title={isCollapsed ? "Buka subfolder" : "Ciutkan subfolder"}
                        >
                          {isCollapsed ? (
                            <CaretRight size={12} weight="bold" />
                          ) : (
                            <CaretDown size={12} weight="bold" />
                          )}
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-1 pl-2">
                          {subNotes.map((note) => {
                            const isSelected = activeNote?.id === note.id;
                            const pageNum = filteredNotes.findIndex((fn) => fn.id === note.id) + 1;
                            return (
                              <button
                                key={note.id}
                                type="button"
                                onClick={() => handleSelectNoteFromSidebar(note.id)}
                                className={`w-full text-left p-2 border-2 transition-all flex items-start gap-2 cursor-pointer ${
                                  isSelected
                                    ? "bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black"
                                    : "bg-white border-transparent hover:border-black hover:bg-neutral-50 text-neutral-800"
                                }`}
                              >
                                <span className="text-[10px] font-mono px-1 py-0.2 bg-black/10 rounded-xs shrink-0 mt-0.5">
                                  {pageNum > 0 ? `${pageNum}` : "•"}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs truncate block font-bold leading-tight">
                                    {note.title}
                                  </span>
                                  {note.isLocked && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-800 font-bold mt-0.5">
                                      <Lock size={10} weight="fill" />
                                      Terkunci
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* B. Main Reading Pane */}
          <section className="flex-1 min-w-0 w-full bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            {/* Top Toolbar in Reader: Sidebar Toggle Button, Font Size, Typography, Page Actions */}
            <div className="p-3 bg-neutral-50 border-b-2 border-black flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Always-accessible Toggle Sidebar Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer ${
                    isSidebarOpen
                      ? "bg-yellow-300 hover:bg-yellow-200 text-black"
                      : "bg-white hover:bg-yellow-100 text-neutral-800"
                  }`}
                  title={isSidebarOpen ? "Sembunyikan Panel Daftar Isi" : "Buka Panel Daftar Isi"}
                >
                  <SidebarSimple size={16} weight="bold" />
                  <span>{isSidebarOpen ? "Tutup Daftar Isi" : "Buka Daftar Isi"}</span>
                </button>

                <span className="text-xs font-bold text-neutral-600 hidden sm:inline">
                  Halaman <strong>{activeNoteIndex + 1}</strong> dari <strong>{filteredNotes.length}</strong>
                </span>
              </div>

              {/* Reader Typography Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Font Size Selector */}
                <div className="flex border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-white text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFontSize("sm")}
                    className={`px-2 py-0.5 cursor-pointer ${fontSize === "sm" ? "bg-yellow-300 font-black" : "hover:bg-neutral-100"}`}
                    title="Ukuran teks lebih kecil"
                  >
                    A-
                  </button>
                  <div className="w-[1px] bg-black" />
                  <button
                    type="button"
                    onClick={() => setFontSize("base")}
                    className={`px-2 py-0.5 cursor-pointer ${fontSize === "base" ? "bg-yellow-300 font-black" : "hover:bg-neutral-100"}`}
                    title="Ukuran teks normal"
                  >
                    A
                  </button>
                  <div className="w-[1px] bg-black" />
                  <button
                    type="button"
                    onClick={() => setFontSize("lg")}
                    className={`px-2 py-0.5 cursor-pointer ${fontSize === "lg" ? "bg-yellow-300 font-black" : "hover:bg-neutral-100"}`}
                    title="Ukuran teks lebih besar"
                  >
                    A+
                  </button>
                </div>

                {/* Font Family Selector */}
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as typeof fontFamily)}
                  className="px-2 py-0.5 text-xs font-bold bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:outline-none"
                  aria-label="Jenis Huruf"
                >
                  <option value="sans">Sans Serif</option>
                  <option value="serif">Serif (Buku)</option>
                  <option value="mono">Monospace</option>
                </select>

                {/* Action Buttons */}
                {activeNote && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyPageLink(activeNote)}
                      className="p-1 text-xs font-bold bg-white hover:bg-yellow-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="Salin tautan ke halaman ini"
                    >
                      {copiedPageLink ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                      <span className="hidden sm:inline text-[11px]">Link Halaman</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportActiveMarkdown}
                      className="p-1 text-xs font-bold bg-white hover:bg-lime-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="Unduh halaman ini sebagai Markdown (.md)"
                    >
                      <DownloadSimple size={13} weight="bold" />
                      <span className="hidden sm:inline text-[11px]">Ekspor</span>
                    </button>

                    <Link
                      href={`/notes/public/${activeNote.shareSlug}`}
                      target="_blank"
                      className="p-1 text-xs font-bold bg-white hover:bg-neutral-100 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors inline-flex items-center gap-1"
                      title="Buka catatan mandiri di tab baru"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                      <span className="hidden sm:inline text-[11px]">Tab Baru</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Note Content Renderer */}
            <div className="p-5 sm:p-8 flex-1">
              {activeNote ? (
                <PublicPageContentReader
                  note={activeNote}
                  folder={folder}
                  breadcrumbs={breadcrumbs}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                />
              ) : (
                <div className="text-center py-16 space-y-2 text-neutral-500">
                  <Article size={32} weight="bold" className="mx-auto text-neutral-400" />
                  <p className="font-bold text-sm">Tidak ada halaman yang dipilih.</p>
                </div>
              )}
            </div>

            {/* C. Bottom Turn-Page Navigation Bar */}
            <div className="p-4 bg-neutral-50 border-t-2 border-black flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={activeNoteIndex <= 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-yellow-300 disabled:opacity-40 disabled:hover:bg-white border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-black text-neutral-700">
                <span className="hidden sm:inline">
                  Halaman {activeNoteIndex + 1} dari {filteredNotes.length}
                </span>
                <button
                  type="button"
                  onClick={() => setDisplayMode("index")}
                  className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[11px] font-black cursor-pointer"
                  title="Lihat seluruh daftar isi dalam tampilan galeri kartu"
                >
                  Daftar Semua
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={activeNoteIndex >= filteredNotes.length - 1}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:hover:bg-yellow-400 border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Selanjutnya</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </section>
        </div>
      ) : (
        /* ========================================================================= */
        /* GALLERY / INDEX OVERVIEW VIEW                                             */
        /* ========================================================================= */
        <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
          {/* Folder Hero Banner */}
          <div
            className="p-5 sm:p-6 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden space-y-3 bg-white"
            style={{ borderLeftColor: folder.color, borderLeftWidth: "8px" }}
          >
            {breadcrumbs.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold text-neutral-700 bg-neutral-50 p-2 border border-black/30 rounded-xs">
                <span className="text-[10px] text-neutral-500 font-mono">JALUR HIERARKI:</span>
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1.5">
                    {idx > 0 && <CaretRight size={12} weight="bold" className="text-neutral-400" />}
                    <span
                      className="w-2.5 h-2.5 rounded-xs border border-black inline-block shrink-0"
                      style={{ backgroundColor: crumb.color }}
                    />
                    <span className={idx === breadcrumbs.length - 1 ? "font-black text-black" : "text-neutral-600"}>
                      {crumb.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-sm border-2 border-black inline-block"
                    style={{ backgroundColor: folder.color }}
                  />
                  <h2 className="text-xl sm:text-2xl font-black text-black">{folder.name}</h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 font-medium max-w-2xl">
                  Koleksi catatan publik multi-halaman yang dibagikan dari {APP_NAME}. Anda dapat membaca langsung halaman demi halaman atau memilih topik dari indeks di bawah.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-neutral-800">
                <span className="px-3 py-1.5 bg-yellow-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  📚 {notes.length} Total Halaman
                </span>
                {subfolders.length > 0 && (
                  <span className="px-3 py-1.5 bg-sky-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    📁 {subfolders.length} Subfolder
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subfolder Filter Chips */}
          {subfolders.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedSubfolderId("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                  selectedSubfolderId === "all"
                    ? "bg-yellow-400 text-black font-black translate-x-0.5 translate-y-0.5 shadow-none"
                    : "bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span>Semua Halaman</span>
                <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
                  {notes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubfolderId("root")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                  selectedSubfolderId === "root"
                    ? "bg-yellow-400 text-black font-black translate-x-0.5 translate-y-0.5 shadow-none"
                    : "bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span>{folder.name} (Utama)</span>
                <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
                  {notesByFolder.rootNotes.length}
                </span>
              </button>

              {subfolders.map((sub) => {
                const count = notes.filter((n) => n.folderId === sub.id).length;
                const isSelected = selectedSubfolderId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubfolderId(sub.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-yellow-400 text-black font-black translate-x-0.5 translate-y-0.5 shadow-none"
                        : "bg-white text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-xs border border-black"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                    <span className="px-1.5 py-0.2 bg-black/10 rounded-xs text-[10px] font-black">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search & Sort Controls */}
          <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan di dalam folder ini..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-neutral-50 border-2 border-black font-medium text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-black cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-2 text-xs font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:outline-none"
              aria-label="Urutkan catatan"
            >
              <option value="updated-desc">Terbaru Diperbarui</option>
              <option value="updated-asc">Terlama Diperbarui</option>
              <option value="title-asc">Judul (A - Z)</option>
              <option value="title-desc">Judul (Z - A)</option>
            </select>
          </div>

          {/* Index Grid Cards */}
          {filteredNotes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <span className="inline-flex p-3 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Article size={28} weight="bold" />
              </span>
              <h3 className="text-base font-black text-black">
                {searchQuery ? "Tidak ada halaman yang cocok" : "Folder ini belum memiliki catatan"}
              </h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto font-medium">
                {searchQuery
                  ? `Tidak ditemukan halaman dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                  : "Belum ada halaman catatan yang ditambahkan ke folder ini oleh pemilik."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note, idx) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setDisplayMode("reader");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {note.folderName && note.folderName !== folder.name ? (
                          <span
                            className="inline-block px-1.5 py-0.2 border border-black text-[10px] font-black rounded-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            style={{ backgroundColor: note.folderColor || "#FFD500" }}
                          >
                            📁 {note.folderName}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-400 font-bold">
                            Halaman #{idx + 1}
                          </span>
                        )}
                        <h3 className="font-black text-sm text-black group-hover:underline decoration-2 line-clamp-2">
                          {note.title}
                        </h3>
                      </div>
                      {note.isLocked && (
                        <span className="p-1 bg-amber-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0" title="Dilindungi Kata Sandi">
                          <Lock size={13} weight="fill" className="text-amber-800" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-3 font-medium leading-relaxed">
                      {note.snippet}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-bold text-neutral-500">
                    <span className="flex items-center gap-1">
                      <CalendarBlank size={13} weight="bold" />
                      {new Date(note.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400 group-hover:bg-yellow-300 border border-black text-black font-black text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      <span>Baca Halaman</span>
                      <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* 3. Footer */}
      <footer className="border-t-2 border-black bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-neutral-600">
          <p>© {new Date().getFullYear()} Deni Irawan Nugraha</p>
          <p className="text-[11px] text-neutral-500">
            Dibagikan dari folder &quot;{folder.name}&quot; ({notes.length} Halaman)
          </p>
        </div>
      </footer>
    </div>
  );
}
