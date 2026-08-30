"use client";

import { useState, useMemo } from "react";
import {
  Folder,
  MagnifyingGlass,
  X,
  SquaresFour,
  ListBullets,
  Lock,
  CalendarBlank,
  Copy,
  Check,
  ShareNetwork,
  ArrowSquareOut,
  Article,
  ArrowRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { APP_NAME } from "@/config/app";
import type { PublicFolderNoteItem } from "@/features/folders/services/folder-share.service";

interface PublicFolderViewerProps {
  folder: {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  };
  notes: PublicFolderNoteItem[];
  slug: string;
}

export function PublicFolderViewer({
  folder,
  notes,
}: PublicFolderViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"updated-desc" | "updated-asc" | "title-asc" | "title-desc">("updated-desc");
  const [copiedFolderLink, setCopiedFolderLink] = useState(false);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let list = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.snippet.toLowerCase().includes(q)
      );
    }

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
  }, [notes, searchQuery, sortBy]);

  const handleCopyFolderLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setCopiedFolderLink(true);
    toast.success("Tautan folder berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedFolderLink(false), 2000);
  };

  const handleNativeShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Folder Catatan: ${folder.name}`,
          text: `Lihat kumpulan catatan dalam folder "${folder.name}" di ${APP_NAME}`,
          url,
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          handleCopyFolderLink();
        }
      }
    } else {
      handleCopyFolderLink();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-black flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-30 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="p-1.5 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center"
              style={{ backgroundColor: folder.color }}
            >
              <Folder size={18} weight="fill" className="text-black" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">
                Folder Publik
              </span>
              <h1 className="font-black text-sm sm:text-base text-black truncate max-w-[200px] sm:max-w-md">
                {folder.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleCopyFolderLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer"
              title="Salin Tautan Folder"
            >
              {copiedFolderLink ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
              <span className="hidden sm:inline">{copiedFolderLink ? "Tersalin" : "Salin Link"}</span>
            </button>

            <button
              suppressHydrationWarning
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-purple-300 hover:bg-purple-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer"
              title="Bagikan"
            >
              <ShareNetwork size={14} weight="bold" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
        {/* Folder Info Banner */}
        <div
          className="p-5 sm:p-6 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
          style={{ backgroundColor: `${folder.color}22` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-sm border-2 border-black inline-block"
                  style={{ backgroundColor: folder.color }}
                />
                <h2 className="text-xl sm:text-2xl font-black text-black">{folder.name}</h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 font-medium">
                Koleksi catatan publik yang dibagikan dari {APP_NAME}. Klik catatan untuk membaca halaman penuh.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-neutral-800">
              <span className="px-2.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                📚 {notes.length} Catatan
              </span>
              <span className="px-2.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                🕒 Diperbarui: {new Date(folder.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Sort, View Toggle */}
        <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
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

          <div className="flex items-center gap-2">
            {/* Sort Selector */}
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

            {/* View Mode Toggle */}
            <div className="flex border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 cursor-pointer transition-colors ${
                  viewMode === "grid" ? "bg-yellow-400 text-black" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
                title="Tampilan Kartu (Grid)"
                aria-label="Tampilan Kartu"
              >
                <SquaresFour size={16} weight={viewMode === "grid" ? "fill" : "bold"} />
              </button>
              <div className="w-[2px] bg-black" />
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 cursor-pointer transition-colors ${
                  viewMode === "list" ? "bg-yellow-400 text-black" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
                title="Tampilan Tabel (List)"
                aria-label="Tampilan Tabel"
              >
                <ListBullets size={16} weight={viewMode === "list" ? "fill" : "bold"} />
              </button>
            </div>
          </div>
        </div>

        {/* Notes Listing */}
        {filteredNotes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <span className="inline-flex p-3 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Article size={28} weight="bold" />
            </span>
            <h3 className="text-base font-black text-black">
              {searchQuery ? "Tidak ada catatan yang cocok" : "Folder ini belum memiliki catatan"}
            </h3>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto font-medium">
              {searchQuery
                ? `Tidak ditemukan catatan dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : "Belum ada catatan yang ditambahkan ke folder ini oleh pemilik."}
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
        ) : viewMode === "grid" ? (
          /* Grid View - Direct Link */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/public/${note.shareSlug}`}
                className="group p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-sm text-black group-hover:text-amber-700 transition-colors line-clamp-2">
                      {note.title}
                    </h3>
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
                  <span className="inline-flex items-center gap-1 text-black font-black group-hover:underline">
                    <span>Buka Catatan</span>
                    <ArrowRight size={13} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* List View - Direct Link */
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] divide-y-2 divide-black overflow-hidden">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/public/${note.shareSlug}`}
                className="p-3.5 sm:p-4 hover:bg-yellow-50/60 transition-colors cursor-pointer flex items-center justify-between gap-4 block group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {note.isLocked && (
                      <span className="p-0.5 bg-amber-200 border border-black" title="Dilindungi Kata Sandi">
                        <Lock size={12} weight="fill" className="text-amber-800" />
                      </span>
                    )}
                    <h3 className="font-black text-xs sm:text-sm text-black truncate group-hover:text-amber-700 transition-colors">
                      {note.title}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-600 truncate font-medium">
                    {note.snippet}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs font-bold text-neutral-500">
                  <span className="hidden sm:inline">
                    {new Date(note.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="px-3 py-1 bg-yellow-400 group-hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black text-xs inline-flex items-center gap-1">
                    <span>Buka</span>
                    <ArrowSquareOut size={13} weight="bold" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t-2 border-black bg-white py-4 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-neutral-600">
          <p>© {new Date().getFullYear()} {APP_NAME} — Kumpulan Catatan Publik</p>
          <p className="text-[11px] text-neutral-500">
            Dibagikan dari folder &quot;{folder.name}&quot;
          </p>
        </div>
      </footer>
    </div>
  );
}
