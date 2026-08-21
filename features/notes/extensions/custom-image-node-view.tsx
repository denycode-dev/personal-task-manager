"use client";

import React, { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  Trash,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { deleteImageKitFileAction } from "@/lib/imagekit/actions";

export function CustomImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, alt, fileId, width = "100%", alignment = "center", caption = "" } = node.attrs;

  const [isHovered, setIsHovered] = useState(false);

  const widthOptions = ["25%", "50%", "75%", "100%"];

  const containerAlignClass =
    alignment === "left"
      ? "items-start text-left"
      : alignment === "right"
      ? "items-end text-right"
      : "items-center text-center";

  const handleDelete = () => {
    // Hapus node dari editor dokumen
    deleteNode();

    // Hapus file secara permanen dari server ImageKit
    const targetFile = fileId || src;
    if (targetFile) {
      deleteImageKitFileAction(targetFile).catch((err) => {
        console.warn("Failed to delete image from ImageKit on node deletion:", err);
      });
    }
  };

  return (
    <NodeViewWrapper className={`my-4 flex flex-col ${containerAlignClass} relative group`}>
      <div
        className={`relative inline-block border-2 transition-all duration-150 ${
          selected
            ? "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-yellow-400"
            : "border-black/30 hover:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
        }`}
        style={{ width: width === "100%" ? "100%" : width, maxWidth: "100%" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Action Toolbar Overlay */}
        {(selected || isHovered) && (
          <div className="absolute top-2 right-2 z-20 flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-xs p-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-100">
            {/* Size Selector */}
            <div className="flex items-center gap-0.5 border-r border-black/20 pr-1 mr-0.5">
              {widthOptions.map((opt) => (
                <button
                  suppressHydrationWarning
                  key={opt}
                  type="button"
                  onClick={() => updateAttributes({ width: opt })}
                  title={`Ubah ukuran ke ${opt}`}
                  className={`px-1.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                    width === opt
                      ? "bg-yellow-400 border-black text-black font-black"
                      : "bg-white border-transparent text-neutral-600 hover:border-black hover:text-black"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Alignment Selector */}
            <div className="flex items-center gap-0.5 border-r border-black/20 pr-1 mr-0.5">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => updateAttributes({ alignment: "left" })}
                title="Perataan Kiri"
                className={`p-1 text-xs border transition-colors cursor-pointer ${
                  alignment === "left"
                    ? "bg-yellow-400 border-black text-black"
                    : "bg-white border-transparent text-neutral-600 hover:border-black hover:text-black"
                }`}
              >
                <TextAlignLeft size={13} weight="bold" />
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => updateAttributes({ alignment: "center" })}
                title="Perataan Tengah"
                className={`p-1 text-xs border transition-colors cursor-pointer ${
                  alignment === "center"
                    ? "bg-yellow-400 border-black text-black"
                    : "bg-white border-transparent text-neutral-600 hover:border-black hover:text-black"
                }`}
              >
                <TextAlignCenter size={13} weight="bold" />
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => updateAttributes({ alignment: "right" })}
                title="Perataan Kanan"
                className={`p-1 text-xs border transition-colors cursor-pointer ${
                  alignment === "right"
                    ? "bg-yellow-400 border-black text-black"
                    : "bg-white border-transparent text-neutral-600 hover:border-black hover:text-black"
                }`}
              >
                <TextAlignRight size={13} weight="bold" />
              </button>
            </div>

            {/* Open Full Image */}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka gambar di tab baru"
              className="p-1 text-neutral-600 hover:text-black bg-white hover:bg-neutral-100 border border-transparent hover:border-black transition-colors"
            >
              <ArrowSquareOut size={13} weight="bold" />
            </a>

            {/* Delete Image */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleDelete}
              title="Hapus gambar dari catatan dan ImageKit"
              className="p-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-transparent hover:border-rose-600 transition-colors cursor-pointer"
            >
              <Trash size={13} weight="bold" />
            </button>
          </div>
        )}

        {/* Image Content */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || "Gambar Catatan"}
          className="w-full h-auto object-contain block select-none"
          draggable={false}
        />

        {/* WebP Badge */}
        {src && typeof src === "string" && (src.includes(".webp") || src.includes("webp")) && (
          <div className="absolute bottom-1 left-1 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            <span className="px-1.5 py-0.5 bg-black/80 text-yellow-300 text-[9px] font-mono font-bold tracking-wider uppercase">
              WebP 80%
            </span>
          </div>
        )}
      </div>

      {/* Caption if provided */}
      {caption && (
        <p className="text-xs text-neutral-500 italic mt-1.5 max-w-full">
          {caption}
        </p>
      )}
    </NodeViewWrapper>
  );
}
