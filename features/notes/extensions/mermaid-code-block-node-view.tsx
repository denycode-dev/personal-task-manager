"use client";

import React, { useState, useEffect, useId, useRef, useCallback } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import {
  renderMermaidDiagram,
  isMermaidSyntax,
  downloadMermaidSvg,
} from "@/features/notes/utils/mermaid-renderer";
import {
  Code,
  Eye,
  Copy,
  Check,
  ArrowsOut,
  DownloadSimple,
  WarningCircle,
  CircleNotch,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowCounterClockwise,
  X,
  TreeStructure,
} from "@phosphor-icons/react";

export function MermaidCodeBlockNodeView(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const language = node.attrs.language || "";
  const codeContent = node.textContent || "";
  const uniqueId = useId();

  // Check if content is mermaid
  const isExplicitMermaid = language.toLowerCase() === "mermaid";
  const detectedMermaid = isMermaidSyntax(codeContent);
  const isMermaid = isExplicitMermaid || detectedMermaid;

  // Initial view mode: diagram if mermaid detected, otherwise code
  const isReadonly = !editor.isEditable;
  const [viewMode, setViewMode] = useState<"diagram" | "code">(() => {
    if (isMermaid) return "diagram";
    return "code";
  });

  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedSvg, setIsCopiedSvg] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const prevCodeRef = useRef(codeContent);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced render function for Mermaid
  const executeRender = useCallback(async (codeToRender: string) => {
    if (!codeToRender.trim()) {
      setSvg("");
      setError(null);
      return;
    }

    setIsRendering(true);
    try {
      const result = await renderMermaidDiagram(uniqueId, codeToRender);
      if (result.error) {
        setError(result.error);
        setSvg("");
      } else {
        setSvg(result.svg);
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setSvg("");
    } finally {
      setIsRendering(false);
    }
  }, [uniqueId]);

  useEffect(() => {
    if (!isMermaid) return;

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce rendering by 300ms while user is typing in code mode
    renderTimeoutRef.current = setTimeout(() => {
      executeRender(codeContent);
    }, 300);

    prevCodeRef.current = codeContent;

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [codeContent, isMermaid, executeRender]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopiedCode(true);
      setTimeout(() => setIsCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopySvg = async () => {
    if (!svg) return;
    try {
      await navigator.clipboard.writeText(svg);
      setIsCopiedSvg(true);
      setTimeout(() => setIsCopiedSvg(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadSvg = () => {
    if (!svg) return;
    const title = (language || "diagram").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    downloadMermaidSvg(svg, `${title}-${Date.now()}.svg`);
  };

  const handleToggleToMermaid = () => {
    updateAttributes({ language: "mermaid" });
    setViewMode("diagram");
  };

  return (
    <NodeViewWrapper className="my-4 not-prose select-text">
      <div className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-neutral-100 border-b-2 border-black text-xs select-none">
          <div className="flex items-center gap-2 min-w-0">
            {isMermaid ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-yellow-300 border border-black font-black text-[11px] uppercase tracking-wider text-black">
                <TreeStructure size={14} weight="bold" />
                <span>Mermaid Diagram</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-200 border border-black font-mono text-[11px] font-bold text-neutral-800">
                <Code size={13} weight="bold" />
                <span>{language || "code"}</span>
              </span>
            )}

            {isRendering && (
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600 font-mono">
                <CircleNotch size={12} weight="bold" className="animate-spin" />
                <span>Merender...</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {isMermaid && (
              <div className="inline-flex border border-black p-0.5 bg-white mr-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setViewMode("diagram")}
                  className={`px-2 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === "diagram"
                      ? "bg-black text-yellow-300"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                  title="Tampilkan Pratinjau Diagram Visual"
                >
                  <Eye size={12} weight="bold" />
                  <span>Diagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className={`px-2 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === "code"
                      ? "bg-black text-yellow-300"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                  title="Tampilkan / Edit Kode Sumber"
                >
                  <Code size={12} weight="bold" />
                  <span>Kode</span>
                </button>
              </div>
            )}

            {!isMermaid && !isReadonly && (
              <button
                type="button"
                onClick={handleToggleToMermaid}
                className="px-2 py-1 text-[11px] font-bold bg-yellow-200 hover:bg-yellow-300 text-black border border-black flex items-center gap-1 cursor-pointer transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                title="Jadikan sebagai Diagram Mermaid"
              >
                <TreeStructure size={12} weight="bold" />
                <span>Render Mermaid</span>
              </button>
            )}

            {isMermaid && svg && viewMode === "diagram" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 hover:bg-yellow-100 border border-black/30 hover:border-black text-neutral-800 bg-white transition-colors cursor-pointer"
                  title="Perbesar Layar Penuh"
                >
                  <ArrowsOut size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="p-1.5 hover:bg-yellow-100 border border-black/30 hover:border-black text-neutral-800 bg-white transition-colors cursor-pointer"
                  title="Unduh Berkas SVG Diagram"
                >
                  <DownloadSimple size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="px-2 py-1 text-[11px] font-semibold hover:bg-yellow-100 border border-black/30 hover:border-black text-neutral-800 bg-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Salin Kode SVG Diagram"
                >
                  {isCopiedSvg ? (
                    <>
                      <Check size={12} weight="bold" className="text-green-600" />
                      <span>SVG Tersalin</span>
                    </>
                  ) : (
                    <span>Salin SVG</span>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2 py-1 text-[11px] font-semibold hover:bg-yellow-100 border border-black/30 hover:border-black text-neutral-800 bg-white transition-colors cursor-pointer flex items-center gap-1"
              title="Salin Kode Sumber"
            >
              {isCopiedCode ? (
                <>
                  <Check size={12} weight="bold" className="text-green-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy size={12} weight="bold" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visual Diagram View */}
        {isMermaid && viewMode === "diagram" && (
          <div className="p-4 bg-white min-h-[140px] flex flex-col items-center justify-center relative overflow-hidden">
            {error ? (
              <div className="w-full p-3 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-700">
                  <WarningCircle size={15} weight="fill" />
                  <span>Sintaks Mermaid Tidak Valid</span>
                </div>
                <p className="text-[11px] leading-relaxed break-words opacity-90">{error}</p>
                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold border border-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Code size={12} weight="bold" />
                  <span>Buka Kode untuk Memperbaiki</span>
                </button>
              </div>
            ) : svg ? (
              <div
                className="w-full flex items-center justify-center overflow-x-auto py-2 [&_svg]:max-w-full [&_svg]:h-auto transition-transform"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : isRendering ? (
              <div className="py-8 flex flex-col items-center gap-2 text-neutral-500 text-xs font-mono">
                <CircleNotch size={20} weight="bold" className="animate-spin text-neutral-800" />
                <span>Membuat diagram visual...</span>
              </div>
            ) : (
              <div className="py-8 text-neutral-400 italic text-xs font-mono">
                Diagram kosong. Ketik kode Mermaid untuk merender visual.
              </div>
            )}
          </div>
        )}

        {/* Code Content View (Kept in DOM so ProseMirror state remains completely stable) */}
        <pre
          className={`px-4 py-3 bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto leading-relaxed border-t border-black/20 ${
            isMermaid && viewMode === "diagram" ? "hidden" : "block"
          }`}
        >
          <NodeViewContent as="div" className="outline-none block selection:bg-yellow-400 selection:text-black font-mono text-xs" />
        </pre>
      </div>

      {/* Fullscreen Zoom Modal for Large Diagrams */}
      {isModalOpen && svg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex-1 max-w-6xl w-full mx-auto bg-white border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-yellow-300 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <TreeStructure size={20} weight="bold" className="text-black" />
                <h3 className="font-black text-sm text-black uppercase tracking-wide">
                  Pratinjau Diagram Mermaid
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-black px-1 py-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.25))}
                    className="p-1 hover:bg-neutral-100 cursor-pointer"
                    title="Perkecil"
                  >
                    <MagnifyingGlassMinus size={14} weight="bold" />
                  </button>
                  <span className="px-1.5 font-bold min-w-[45px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.min(3, z + 0.25))}
                    className="p-1 hover:bg-neutral-100 cursor-pointer"
                    title="Perbesar"
                  >
                    <MagnifyingGlassPlus size={14} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    className="p-1 hover:bg-neutral-100 cursor-pointer border-l border-neutral-300 ml-0.5"
                    title="Reset Ukuran"
                  >
                    <ArrowCounterClockwise size={13} weight="bold" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-neutral-100 text-black border border-black flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <DownloadSimple size={13} weight="bold" />
                  <span>Unduh SVG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center bg-black hover:bg-neutral-800 text-white border border-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  title="Tutup (Esc)"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            </div>

            {/* Modal Body with Zoomable SVG */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-50/50">
              <div
                style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
                className="transition-transform duration-100 flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
