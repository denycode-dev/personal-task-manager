"use client";

import { useEffect } from "react";
import { ListBullets, X, ArrowRight } from "@phosphor-icons/react";
import type { TocItem } from "@/features/notes/utils/reading-utils";

interface TableOfContentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TocItem[];
  activeId?: string;
  onSelectHeading: (id: string) => void;
}

export function TableOfContentsModal({
  isOpen,
  onClose,
  items,
  activeId,
  onSelectHeading,
}: TableOfContentsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 space-y-4 max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="toc-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-400 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <ListBullets size={18} weight="bold" />
            </div>
            <div>
              <h2 id="toc-modal-title" className="text-sm font-black text-black">
                Daftar Isi Catatan
              </h2>
              <p className="text-[11px] text-neutral-600 font-medium">
                {items.length} sub-judul ditemukan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-black hover:bg-neutral-100 border border-black transition-colors"
            aria-label="Tutup daftar isi"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto pr-1 space-y-1.5 flex-1 divide-y divide-neutral-100">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-medium italic">
              Tidak ada sub-judul (H1, H2, H3) dalam catatan ini.
            </div>
          ) : (
            items.map((item, idx) => {
              const isActive = activeId === item.id;
              const indentClass =
                item.level === 1
                  ? "pl-2 font-bold"
                  : item.level === 2
                  ? "pl-6 font-medium text-neutral-800"
                  : "pl-10 text-xs text-neutral-600";

              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    onSelectHeading(item.id);
                    onClose();
                  }}
                  className={`w-full text-left py-2 px-2.5 rounded-none flex items-center justify-between gap-2 text-xs transition-all ${indentClass} ${
                    isActive
                      ? "bg-yellow-100 border-l-4 border-black text-black font-black shadow-xs"
                      : "hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  <span className="truncate">{item.text}</span>
                  <ArrowRight
                    size={13}
                    weight="bold"
                    className={`shrink-0 opacity-40 ${
                      isActive ? "opacity-100 text-black" : ""
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t-2 border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
          <span>Klik judul untuk melompat langsung</span>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-mono">
            ESC untuk tutup
          </kbd>
        </div>
      </div>
    </div>
  );
}
