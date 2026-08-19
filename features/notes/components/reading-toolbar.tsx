"use client";

import { useState } from "react";
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
} from "@phosphor-icons/react";
import type { ReaderPreferences } from "@/features/notes/utils/reading-utils";

interface ReadingToolbarProps {
  preferences: ReaderPreferences;
  onUpdatePreferences: (updates: Partial<ReaderPreferences>) => void;
  tocCount: number;
  onOpenToc: () => void;
  onCopyText: () => void;
  onShare: () => void;
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
  isCopied,
  isFullscreen,
  onToggleFullscreen,
}: ReadingToolbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative">
      {/* Top Toolbar Container */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
        {/* Left: Table of Contents & Focus Mode */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {tocCount > 0 && (
            <button
              onClick={onOpenToc}
              title="Buka Daftar Isi"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              <ListBullets size={15} weight="bold" />
              <span>Daftar Isi</span>
              <span className="ml-0.5 px-1.5 py-0.2 bg-black text-white text-[10px] font-mono rounded-full">
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
                ? "Keluar dari Mode Fokus"
                : "Mode Fokus (Bebas Distraksi)"
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all ${
              preferences.focusMode
                ? "bg-black text-white"
                : "bg-neutral-100 hover:bg-yellow-300 text-black"
            }`}
          >
            {preferences.focusMode ? (
              <>
                <EyeSlash size={15} weight="bold" />
                <span className="hidden xs:inline">Mode Fokus Aktif</span>
              </>
            ) : (
              <>
                <Eye size={15} weight="bold" />
                <span className="hidden xs:inline">Mode Fokus</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Quick actions & Settings Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Theme Switchers */}
          <div className="flex items-center border border-black p-0.5 bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => onUpdatePreferences({ theme: "light" })}
              title="Tema Terang (Putih Bersih)"
              className={`p-1.5 text-xs transition-colors ${
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
              className={`p-1.5 text-xs transition-colors ${
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
              className={`p-1.5 text-xs transition-colors ${
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
            title="Pengaturan Tampilan Baca"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all ${
              isSettingsOpen
                ? "bg-yellow-400 text-black font-black"
                : "bg-white hover:bg-neutral-100 text-black"
            }`}
          >
            <SlidersHorizontal size={15} weight="bold" />
            <span className="hidden sm:inline">Tampilan</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={onCopyText}
            title="Salin isi catatan"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
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
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
          >
            <ShareNetwork size={16} weight="bold" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="Cetak / Simpan sebagai PDF"
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all hidden xs:inline-flex"
          >
            <Printer size={16} weight="bold" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            className="p-1.5 text-black bg-white hover:bg-yellow-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all hidden md:inline-flex"
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
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-4 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <TextAa size={16} weight="bold" />
              Kenyamanan Membaca
            </h3>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-[11px] font-bold text-neutral-600 hover:text-black underline"
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
                className={`py-1 px-2 text-xs font-bold border border-black transition-all ${
                  preferences.containerWidth === "standard"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Standar
              </button>
              <button
                onClick={() => onUpdatePreferences({ containerWidth: "wide" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all ${
                  preferences.containerWidth === "wide"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Lebar
              </button>
              <button
                onClick={() => onUpdatePreferences({ containerWidth: "full" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all ${
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
                className={`py-1 px-2 text-xs font-sans font-bold border border-black transition-all ${
                  preferences.fontFamily === "sans"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Sans Modern
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontFamily: "serif" })}
                className={`py-1 px-2 text-xs font-serif font-bold border border-black transition-all ${
                  preferences.fontFamily === "serif"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Serif Buku
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontFamily: "mono" })}
                className={`py-1 px-2 text-xs font-mono font-bold border border-black transition-all ${
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
                className={`py-1 text-xs font-bold border border-black transition-all ${
                  preferences.fontSize === "sm"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Kecil
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontSize: "base" })}
                className={`py-1 text-xs font-bold border border-black transition-all ${
                  preferences.fontSize === "base"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Sedang
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontSize: "lg" })}
                className={`py-1 text-xs font-bold border border-black transition-all ${
                  preferences.fontSize === "lg"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Besar
              </button>
              <button
                onClick={() => onUpdatePreferences({ fontSize: "xl" })}
                className={`py-1 text-xs font-bold border border-black transition-all ${
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
                className={`py-1 px-2 text-xs font-bold border border-black transition-all ${
                  preferences.lineHeight === "normal"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Rapat
              </button>
              <button
                onClick={() => onUpdatePreferences({ lineHeight: "relaxed" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all ${
                  preferences.lineHeight === "relaxed"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => onUpdatePreferences({ lineHeight: "loose" })}
                className={`py-1 px-2 text-xs font-bold border border-black transition-all ${
                  preferences.lineHeight === "loose"
                    ? "bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Renggang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
