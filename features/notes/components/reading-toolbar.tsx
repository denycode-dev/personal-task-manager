"use client";

import { useState, useRef, useEffect } from "react";
import {
  TextAa,
  Sun,
  Moon,
  Scroll,
  ArrowsOutSimple,
  ArrowsInSimple,
  Copy,
  Check,
  Printer,
  ShareNetwork,
  ListBullets,
  Eye,
  EyeSlash,
  SlidersHorizontal,
  ArrowsHorizontal,
  MarkdownLogo,
  DownloadSimple,
} from "@phosphor-icons/react";
import type { ReaderPreferences } from "@/features/notes/utils/reading-utils";

interface ReadingToolbarProps {
  preferences: ReaderPreferences;
  onUpdatePreferences: (updates: Partial<ReaderPreferences>) => void;
  tocCount: number;
  onOpenToc: () => void;
  onCopyText: () => void;
  onShare: () => void;
  onExportMarkdown: () => void;
  isCopied: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ReadingToolbar({
  preferences,
  onUpdatePreferences,
  tocCount,
  onOpenToc,
  onCopyText,
  onShare,
  onExportMarkdown,
  isCopied,
  isFullscreen,
  onToggleFullscreen,
}: ReadingToolbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Close settings popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarContainerRef.current &&
        !toolbarContainerRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <div ref={toolbarContainerRef} className="relative select-none">
      {/* Top Toolbar Container */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-md border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
        {/* Left Cluster: Table of Contents & Focus Mode */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {tocCount > 0 && (
            <button
              onClick={onOpenToc}
              title="Buka Daftar Isi"
              aria-label="Buka Daftar Isi"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <ListBullets size={15} weight="bold" />
              <span className="hidden md:inline">Daftar Isi</span>
              <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-mono rounded-full leading-tight">
                {tocCount}
              </span>
            </button>
          )}

          {/* Focus Mode Button */}
          <button
            onClick={() =>
              onUpdatePreferences({ focusMode: !preferences.focusMode })
            }
            title={
              preferences.focusMode
                ? "Keluar dari Mode Fokus (ESC)"
                : "Mode Fokus (Bebas Distraksi)"
            }
            aria-label="Toggle mode fokus"
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer ${
              preferences.focusMode
                ? "bg-black text-white"
                : "bg-neutral-100 hover:bg-yellow-300 text-black"
            }`}
          >
            {preferences.focusMode ? (
              <>
                <EyeSlash size={15} weight="bold" />
                <span className="hidden md:inline">Fokus Aktif</span>
              </>
            ) : (
              <>
                <Eye size={15} weight="bold" />
                <span className="hidden md:inline">Fokus</span>
              </>
            )}
          </button>
        </div>

        {/* Right Cluster: Quick Actions, Theme, & Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Theme Switchers */}
          <div className="flex items-center border border-black p-0.5 bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => onUpdatePreferences({ theme: "light" })}
              title="Tema Terang (Putih Bersih)"
              aria-label="Tema terang"
              className={`p-1 sm:p-1.5 text-xs transition-colors cursor-pointer ${
                preferences.theme === "light"
                  ? "bg-white text-black font-black border border-black shadow-xs"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Sun size={14} weight="bold" />
            </button>
            <button
              onClick={() => onUpdatePreferences({ theme: "sepia" })}
              title="Tema Sepia (Kertas Hangat)"
              aria-label="Tema sepia"
              className={`p-1 sm:p-1.5 text-xs transition-colors cursor-pointer ${
                preferences.theme === "sepia"
                  ? "bg-[#f5ebd7] text-[#433422] font-black border border-black shadow-xs"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Scroll size={14} weight="bold" />
            </button>
            <button
              onClick={() => onUpdatePreferences({ theme: "dark" })}
              title="Tema Gelap (Malam)"
              aria-label="Tema gelap"
              className={`p-1 sm:p-1.5 text-xs transition-colors cursor-pointer ${
                preferences.theme === "dark"
                  ? "bg-neutral-900 text-yellow-400 font-black border border-black shadow-xs"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Moon size={14} weight="bold" />
            </button>
          </div>

          {/* Reader Preferences Button */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="Pengaturan Tampilan Baca (Font, Ukuran, Lebar)"
            aria-label="Pengaturan tampilan"
            aria-expanded={isSettingsOpen}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer ${
              isSettingsOpen
                ? "bg-yellow-400 text-black font-black"
                : "bg-white hover:bg-neutral-100 text-black"
            }`}
          >
            <SlidersHorizontal size={15} weight="bold" />
            <span className="hidden sm:inline">Tampilan</span>
          </button>

          {/* Export Markdown */}
          <button
            onClick={onExportMarkdown}
            title="Ekspor catatan ke file Markdown (.md)"
            aria-label="Ekspor Markdown"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <MarkdownLogo size={16} weight="bold" />
          </button>

          {/* Copy Text */}
          <button
            onClick={onCopyText}
            title="Salin teks isi catatan"
            aria-label="Salin teks"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {isCopied ? (
              <Check size={16} weight="bold" className="text-emerald-700" />
            ) : (
              <Copy size={16} weight="bold" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={onShare}
            title="Bagikan catatan"
            aria-label="Bagikan link catatan"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <ShareNetwork size={16} weight="bold" />
          </button>

          {/* Print (Tablet & Desktop) */}
          <button
            onClick={handlePrint}
            title="Cetak / Simpan sebagai PDF"
            aria-label="Cetak catatan"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all hidden sm:inline-flex cursor-pointer"
          >
            <Printer size={16} weight="bold" />
          </button>

          {/* Fullscreen Toggle (Desktop) */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            aria-label="Toggle layar penuh"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all hidden lg:inline-flex cursor-pointer"
          >
            {isFullscreen ? (
              <ArrowsInSimple size={16} weight="bold" />
            ) : (
              <ArrowsOutSimple size={16} weight="bold" />
            )}
          </button>
        </div>
      </div>

      {/* Reader Settings Popover Card */}
      {isSettingsOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-80 p-4 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <TextAa size={16} weight="bold" />
              Kenyamanan Membaca
            </h3>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-[11px] font-bold text-neutral-600 hover:text-black underline cursor-pointer"
            >
              Tutup
            </button>
          </div>

          {/* Container Width */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-black flex items-center gap-1">
              <ArrowsHorizontal size={14} weight="bold" />
              Lebar Container Konten
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onUpdatePreferences({ containerWidth: "standard" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.containerWidth === "standard"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Standar
              </button>
              <button
                onClick={() => onUpdatePreferences({ containerWidth: "wide" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.containerWidth === "wide"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Lebar
              </button>
              <button
                onClick={() => onUpdatePreferences({ containerWidth: "full" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.containerWidth === "full"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Penuh
              </button>
            </div>
          </div>

          {/* Font Family Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-black">
              Jenis Huruf (Typography)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onUpdatePreferences({ fontFamily: "sans" })}
                className={`py-1 px-2 text-xs font-sans font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontFamily === "sans"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Sans Modern
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontFamily: "serif" })}
                className={`py-1 px-2 text-xs font-serif font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontFamily === "serif"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Serif Buku
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontFamily: "mono" })}
                className={`py-1 px-2 text-xs font-mono font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontFamily === "mono"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Mono Tech
              </button>
            </div>
          </div>

          {/* Font Size Adjuster */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-black">
              Ukuran Teks
            </label>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => onUpdatePreferences({ fontSize: "sm" })}
                className={`py-1 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontSize === "sm"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Kecil
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontSize: "base" })}
                className={`py-1 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontSize === "base"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Sedang
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontSize: "lg" })}
                className={`py-1 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontSize === "lg"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Besar
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontSize: "xl" })}
                className={`py-1 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.fontSize === "xl"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Ekstra
              </button>
            </div>
          </div>

          {/* Line Spacing Adjuster */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-black">
              Kerapatan Baris
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onUpdatePreferences({ lineHeight: "normal" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.lineHeight === "normal"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Rapat
              </button>
              <button
                onClick={() => onUpdatePreferences({ lineHeight: "relaxed" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.lineHeight === "relaxed"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => onUpdatePreferences({ lineHeight: "loose" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all cursor-pointer ${
                  preferences.lineHeight === "loose"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Renggang
              </button>
            </div>
          </div>

          {/* Quick Document Export Section */}
          <div className="space-y-1.5 pt-2 border-t-2 border-neutral-100">
            <label className="text-[11px] font-bold text-black flex items-center gap-1">
              <DownloadSimple size={14} weight="bold" />
              Ekspor & Cetak Dokumen
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onExportMarkdown();
                  setIsSettingsOpen(false);
                }}
                className="py-1.5 px-2 text-xs font-bold bg-neutral-50 hover:bg-yellow-300 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <MarkdownLogo size={14} weight="bold" />
                <span>Unduh .MD</span>
              </button>
              <button
                onClick={() => {
                  handlePrint();
                  setIsSettingsOpen(false);
                }}
                className="py-1.5 px-2 text-xs font-bold bg-neutral-50 hover:bg-yellow-300 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Printer size={14} weight="bold" />
                <span>Cetak / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
