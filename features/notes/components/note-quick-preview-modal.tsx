"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { CustomImage } from "@/features/notes/extensions/custom-image-extension";
import { MermaidCodeBlock } from "@/features/notes/extensions/mermaid-code-block-extension";
import { Table } from "@tiptap/extension-table/table";
import { TableRow } from "@tiptap/extension-table/row";
import { TableHeader } from "@tiptap/extension-table/header";
import { TableCell } from "@tiptap/extension-table/cell";
import type { EnrichedNote } from "@/features/notes/types/note.types";
import type { Folder } from "@/lib/db/schema";
import Link from "next/link";
import {
  X,
  Lock,
  CalendarBlank,
  Folder as FolderIcon,
  ArrowSquareOut,
  TreeStructure,
} from "@phosphor-icons/react";

interface NoteQuickPreviewModalProps {
  note: EnrichedNote | null;
  folder?: Folder;
  isOpen: boolean;
  onClose: () => void;
}

const previewExtensions = [
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

export function NoteQuickPreviewModal({
  note,
  folder,
  isOpen,
  onClose,
}: NoteQuickPreviewModalProps) {
  const content = note?.content ? parseNoteContent(note.content) : "";

  const editor = useEditor(
    {
      extensions: previewExtensions,
      content,
      editable: false,
      immediatelyRender: false,
    },
    [note?.id, note?.content]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full max-h-[90vh] bg-white border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-yellow-300 border-b-2 border-black select-none">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-base sm:text-lg text-black truncate max-w-md">
                {note.title || "Catatan tanpa judul"}
              </h2>
              {folder && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-white text-neutral-800 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <FolderIcon size={12} weight="fill" style={{ color: folder.color }} />
                  <span>{folder.name}</span>
                </span>
              )}
              {note.isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black">
                  <Lock size={11} weight="fill" />
                  <span>Terkunci</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-800 mt-1 font-medium">
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
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/notes/${note.id}`}
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-yellow-300 border border-black font-bold text-xs flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Buka di Editor</span>
              <ArrowSquareOut size={14} weight="bold" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white hover:bg-neutral-100 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              title="Tutup (Esc)"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {note.isLocked ? (
            <div className="p-8 border-2 border-dashed border-neutral-300 text-center space-y-3 bg-neutral-50 my-6">
              <div className="w-12 h-12 bg-neutral-900 text-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto">
                <Lock size={24} weight="fill" />
              </div>
              <h4 className="font-black text-sm uppercase text-neutral-900">
                Catatan Terenkripsi (AES-256)
              </h4>
              <p className="text-xs text-neutral-600 max-w-md mx-auto">
                Konten catatan ini diproteksi sandi. Silakan buka catatan di editor untuk memasukkan kata sandi pembuka.
              </p>
              <Link
                href={`/notes/${note.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <span>Buka Catatan</span>
                <ArrowSquareOut size={14} weight="bold" />
              </Link>
            </div>
          ) : (
            <div className="prose max-w-none [&_.tiptap]:outline-none">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-neutral-100 border-t-2 border-black flex items-center justify-between text-xs text-neutral-600">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <TreeStructure size={14} weight="bold" className="text-neutral-800" />
            <span>Dukungan Diagram Mermaid & Format Kaya Aktif</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
