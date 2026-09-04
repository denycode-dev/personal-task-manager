"use client";

import React, { useState, useEffect, useId, useRef, useCallback } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import {
  renderMermaidDiagram,
  isMermaidSyntax,
  downloadMermaidSvg,
} from "@/features/notes/utils/mermaid-renderer";
import {
  highlightCodeWithShiki,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
} from "@/features/notes/utils/shiki-highlighter";
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
  Sun,
  Moon,
  ListNumbers,
  PencilSimple,
  Terminal,
} from "@phosphor-icons/react";

export function MermaidCodeBlockNodeView(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const language = node.attrs.language || "";
  const codeContent = node.textContent || "";
  const uniqueId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const modalSvgContainerRef = useRef<HTMLDivElement>(null);
  const bindFunctionsRef = useRef<((element: Element) => void) | null>(null);

  // Check if content is mermaid
  const isExplicitMermaid = language.toLowerCase() === "mermaid";
  const detectedMermaid = isMermaidSyntax(codeContent);
  const isMermaid = isExplicitMermaid || detectedMermaid;

  const isReadonly = !editor.isEditable;

  // View modes
  // For mermaid: 'diagram' | 'code'
  // For standard code: 'highlight' (pretty view) | 'edit' (raw input in tiptap)
  const [viewMode, setViewMode] = useState<"diagram" | "code" | "highlight" | "edit">(() => {
    if (isMermaid) return "diagram";
    if (isReadonly) return "highlight";
    return "edit";
  });

  // Theme & presentation settings
  const [themeMode, setThemeMode] = useState<"auto" | "light" | "dark">("auto");
  const [detectedTheme, setDetectedTheme] = useState<"light" | "dark" | "sepia">("light");
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  // State for Mermaid
  const [svg, setSvg] = useState<string>("");
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [isRenderingMermaid, setIsRenderingMermaid] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // State for Shiki
  const [shikiHtml, setShikiHtml] = useState<string>("");
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Copy feedbacks
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedSvg, setIsCopiedSvg] = useState(false);

  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect surrounding note theme
  useEffect(() => {
    const updateDetectedTheme = () => {
      if (!wrapperRef.current) return;
      const el = wrapperRef.current;

      const themedAncestor = el.closest("[data-theme]");
      if (themedAncestor) {
        const t = themedAncestor.getAttribute("data-theme");
        if (t === "dark" || t === "sepia" || t === "light") {
          setDetectedTheme(t);
          return;
        }
      }

      if (
        el.closest(".dark") ||
        el.closest("[class*='bg-[#09090b]']") ||
        el.closest("[class*='bg-[#18181b]']")
      ) {
        setDetectedTheme("dark");
        return;
      }

      if (
        el.closest("[class*='bg-[#f4ebd9]']") ||
        el.closest("[class*='bg-[#fcf7ed]']")
      ) {
        setDetectedTheme("sepia");
        return;
      }

      if (document.documentElement.classList.contains("dark")) {
        setDetectedTheme("dark");
        return;
      }

      setDetectedTheme("light");
    };

    updateDetectedTheme();

    // Listen for theme mutations on parent or root
    const observer = new MutationObserver(updateDetectedTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const activeEffectiveTheme: "light" | "dark" | "sepia" =
    themeMode === "auto" ? detectedTheme : themeMode;

  // Execute Mermaid Render
  const executeMermaidRender = useCallback(
    async (codeToRender: string, themeToUse: "light" | "dark" | "sepia") => {
      if (!codeToRender.trim()) {
        setSvg("");
        setMermaidError(null);
        return;
      }

      setIsRenderingMermaid(true);
      try {
        const result = await renderMermaidDiagram(uniqueId, codeToRender, themeToUse);
        if (result.error) {
          setMermaidError(result.error);
          setSvg("");
          bindFunctionsRef.current = null;
        } else {
          setSvg(result.svg);
          setMermaidError(null);
          bindFunctionsRef.current = result.bindFunctions || null;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setMermaidError(msg);
        setSvg("");
        bindFunctionsRef.current = null;
      } finally {
        setIsRenderingMermaid(false);
      }
    },
    [uniqueId]
  );

  // Bind interactive events (clicks, links, tooltips) after SVG is inserted into DOM per Mermaid official docs
  useEffect(() => {
    if (svg && bindFunctionsRef.current && svgContainerRef.current) {
      try {
        bindFunctionsRef.current(svgContainerRef.current);
      } catch {
        // Silently ignore binding errors for diagrams without interactions
      }
    }
  }, [svg, viewMode]);

  useEffect(() => {
    if (isModalOpen && svg && bindFunctionsRef.current && modalSvgContainerRef.current) {
      try {
        bindFunctionsRef.current(modalSvgContainerRef.current);
      } catch {
        // Silently ignore binding errors in modal
      }
    }
  }, [isModalOpen, svg, zoomScale]);

  // Execute Shiki Highlight
  const executeShikiHighlight = useCallback(
    async (codeToHighlight: string, langToHighlight: string, themeToUse: "light" | "dark" | "sepia", lineNums: boolean) => {
      if (!codeToHighlight.trim()) {
        setShikiHtml("");
        return;
      }

      setIsHighlighting(true);
      try {
        const { html } = await highlightCodeWithShiki(
          codeToHighlight,
          langToHighlight,
          themeToUse,
          lineNums
        );
        setShikiHtml(html);
      } catch {
        setShikiHtml("");
      } finally {
        setIsHighlighting(false);
      }
    },
    []
  );

  // Trigger re-render whenever code, language, theme, or line numbers change
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      if (isMermaid) {
        executeMermaidRender(codeContent, activeEffectiveTheme);
      }
      executeShikiHighlight(codeContent, language, activeEffectiveTheme, showLineNumbers);
    }, 200);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [codeContent, language, isMermaid, activeEffectiveTheme, showLineNumbers, executeMermaidRender, executeShikiHighlight]);

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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    updateAttributes({ language: newLang });
    if (newLang === "mermaid") {
      setViewMode("diagram");
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === "auto") return "dark";
      if (prev === "dark") return "light";
      return "auto";
    });
  };

  // Theme styling for wrapper and headers
  const isDarkActive = activeEffectiveTheme === "dark";
  const isSepiaActive = activeEffectiveTheme === "sepia";
  const effectiveLanguage = normalizeLanguage(language, codeContent);
  const isEditingMode = !isReadonly && (viewMode === "edit" || (isMermaid && viewMode === "code"));

  const cardBorderClass = isEditingMode
    ? "border-2 border-black/30 dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)] bg-transparent !bg-transparent"
    : isDarkActive
    ? "border-2 border-neutral-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-[#0d1117]"
    : isSepiaActive
    ? "border-2 border-[#5c4028] shadow-[3px_3px_0px_0px_rgba(92,64,40,1)] bg-[#fdf6e3]"
    : "border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white";

  const headerBgClass = isEditingMode
    ? "bg-neutral-100/70 dark:bg-neutral-900/70 backdrop-blur-xs border-b border-black/15 text-neutral-900 dark:text-neutral-100"
    : isDarkActive
    ? "bg-[#161b22] border-b-2 border-neutral-700 text-neutral-200"
    : isSepiaActive
    ? "bg-[#f4ebd9] border-b-2 border-[#5c4028] text-[#382b22]"
    : "bg-neutral-100 border-b-2 border-black text-neutral-900";

  return (
    <NodeViewWrapper ref={wrapperRef} className="my-4 not-prose select-text">
      <div className={`rounded-none overflow-hidden transition-all ${cardBorderClass}`}>
        {/* Header Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs select-none ${headerBgClass}`}>
          {/* Left Cluster: Window Dots + Language Selector */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Terminal Window Dots */}
            <div className="flex items-center gap-1.5 shrink-0 opacity-85">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black/30" />
            </div>

            {/* Language Badge / Selector */}
            {isMermaid ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-yellow-300 border border-black font-black text-[11px] uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <TreeStructure size={13} weight="bold" />
                <span>Mermaid Diagram</span>
              </span>
            ) : isReadonly ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 border border-current/30 font-mono text-[11px] font-bold">
                <Terminal size={12} weight="bold" />
                <span>{SUPPORTED_LANGUAGES[effectiveLanguage] || effectiveLanguage}</span>
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  value={effectiveLanguage}
                  onChange={handleLanguageChange}
                  className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-neutral-800 text-black dark:text-white border border-black dark:border-neutral-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] outline-none cursor-pointer"
                  title="Pilih Bahasa Kode untuk Pewarnaan Sintaks"
                >
                  <option value="javascript">JavaScript (Default)</option>
                  <option value="go">Go / Golang</option>
                  <option value="typescript">TypeScript</option>
                  <option value="tsx">React TSX</option>
                  <option value="jsx">React JSX</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash / Shell</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                  <option value="rust">Rust</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="diff">Diff</option>
                  <option value="dockerfile">Dockerfile</option>
                  <option value="graphql">GraphQL</option>
                  <option value="mermaid">Mermaid Diagram</option>
                  <option value="markdown">Markdown</option>
                  <option value="text">Plain Text</option>
                </select>
              </div>
            )}

            {(isRenderingMermaid || isHighlighting) && (
              <span className="inline-flex items-center gap-1 text-[10px] opacity-75 font-mono">
                <CircleNotch size={11} weight="bold" className="animate-spin" />
                <span>Memproses...</span>
              </span>
            )}
          </div>

          {/* Right Cluster: View Toggle, Theme Switcher, Line Numbers, Copy Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mermaid Mode Switcher */}
            {isMermaid && (
              <div className="inline-flex border border-black dark:border-neutral-600 p-0.5 bg-white dark:bg-neutral-900 mr-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setViewMode("diagram")}
                  className={`px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === "diagram"
                      ? "bg-black text-yellow-300 dark:bg-yellow-400 dark:text-black"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  title="Tampilkan Pratinjau Diagram Visual"
                >
                  <Eye size={12} weight="bold" />
                  <span>Diagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className={`px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === "code"
                      ? "bg-black text-yellow-300 dark:bg-yellow-400 dark:text-black"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  title="Tampilkan / Edit Kode Sumber"
                >
                  <Code size={12} weight="bold" />
                  <span>Kode</span>
                </button>
              </div>
            )}

            {/* Standard Code: Toggle Edit vs Highlighted Preview (Only when editor is editable) */}
            {!isMermaid && !isReadonly && (
              <div className="inline-flex border border-black dark:border-neutral-600 p-0.5 bg-white dark:bg-neutral-900 mr-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === "edit"
                      ? "bg-black text-yellow-300 dark:bg-yellow-400 dark:text-black"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  title="Edit Kode Langsung"
                >
                  <PencilSimple size={12} weight="bold" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("highlight")}
                  className={`px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === "highlight"
                      ? "bg-black text-yellow-300 dark:bg-yellow-400 dark:text-black"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  title="Pratinjau dengan Shiki Syntax Highlighting"
                >
                  <Eye size={12} weight="bold" />
                  <span>Pratinjau Shiki</span>
                </button>
              </div>
            )}

            {/* Line Numbers Toggle Button */}
            <button
              type="button"
              onClick={() => setShowLineNumbers((prev) => !prev)}
              className={`p-1.5 border border-black/30 dark:border-neutral-600 hover:border-black transition-colors cursor-pointer ${
                showLineNumbers
                  ? "bg-yellow-200 dark:bg-neutral-700 text-black dark:text-yellow-300 font-bold"
                  : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              }`}
              title={showLineNumbers ? "Sembunyikan Nomor Baris" : "Tampilkan Nomor Baris"}
            >
              <ListNumbers size={13} weight="bold" />
            </button>

            {/* Shiki Theme Switcher (Auto / Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 hover:bg-yellow-100 dark:hover:bg-neutral-700 border border-black/30 dark:border-neutral-600 hover:border-black bg-white dark:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
              title={`Tema Sintaks: ${themeMode.toUpperCase()} (Aktif: ${activeEffectiveTheme}). Klik untuk beralih.`}
            >
              {activeEffectiveTheme === "dark" ? (
                <Moon size={13} weight="fill" className="text-yellow-400" />
              ) : (
                <Sun size={13} weight="bold" className="text-amber-600" />
              )}
            </button>

            {/* Mermaid SVG Actions */}
            {isMermaid && svg && viewMode === "diagram" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 hover:bg-yellow-100 dark:hover:bg-neutral-700 border border-black/30 dark:border-neutral-600 hover:border-black bg-white dark:bg-neutral-800 transition-colors cursor-pointer"
                  title="Perbesar Layar Penuh"
                >
                  <ArrowsOut size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="p-1.5 hover:bg-yellow-100 dark:hover:bg-neutral-700 border border-black/30 dark:border-neutral-600 hover:border-black bg-white dark:bg-neutral-800 transition-colors cursor-pointer"
                  title="Unduh Berkas SVG Diagram"
                >
                  <DownloadSimple size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="px-2 py-1 text-[11px] font-semibold hover:bg-yellow-100 dark:hover:bg-neutral-700 border border-black/30 dark:border-neutral-600 hover:border-black bg-white dark:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
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

            {/* Copy Source Code Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2 py-1 text-[11px] font-semibold hover:bg-yellow-100 dark:hover:bg-neutral-700 border border-black/30 dark:border-neutral-600 hover:border-black bg-white dark:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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

        {/* ── Case 1: Visual Mermaid Diagram View ── */}
        {isMermaid && viewMode === "diagram" && (
          <div
            className={`p-4 min-h-[140px] flex flex-col items-center justify-center relative ${
              isDarkActive
                ? "bg-[#09090b]"
                : isSepiaActive
                ? "bg-[#fdf8ee]"
                : "bg-white"
            }`}
          >
            {mermaidError ? (
              <div className="w-full p-3 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 text-red-900 dark:text-red-200 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-300">
                  <WarningCircle size={15} weight="fill" />
                  <span>Sintaks Mermaid Tidak Valid</span>
                </div>
                <p className="text-[11px] leading-relaxed break-words opacity-90">{mermaidError}</p>
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
                ref={svgContainerRef}
                className="w-full flex justify-center overflow-x-auto py-3 scrollbar-thin [&_svg]:max-w-none [&_svg]:h-auto transition-transform"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : isRenderingMermaid ? (
              <div className="py-8 flex flex-col items-center gap-2 text-neutral-500 text-xs font-mono">
                <CircleNotch size={20} weight="bold" className="animate-spin text-neutral-800 dark:text-neutral-200" />
                <span>Membuat diagram visual...</span>
              </div>
            ) : (
              <div className="py-8 text-neutral-400 italic text-xs font-mono">
                Diagram kosong. Ketik kode Mermaid untuk merender visual.
              </div>
            )}
          </div>
        )}

        {/* ── Case 2: Shiki Highlighted View (Default for Read Mode, or when toggled in Edit Mode) ── */}
        {((!isMermaid && (isReadonly || viewMode === "highlight")) ||
          (isMermaid && viewMode === "code" && isReadonly)) &&
          shikiHtml && (
            <div
              className={`shiki-container overflow-x-auto ${
                showLineNumbers ? "with-line-numbers" : ""
              }`}
              dangerouslySetInnerHTML={{ __html: shikiHtml }}
            />
          )}

        {/* ── Case 3: Raw Tiptap Editable Code Block ── */}
        {/* KEPT IN DOM ALWAYS so ProseMirror state, cursor and input mapping remain 100% stable */}
        <pre
          style={{ backgroundColor: "transparent" }}
          className={`px-4 py-3 font-mono text-xs overflow-x-auto leading-relaxed border-t border-black/15 bg-transparent !bg-transparent text-neutral-900 dark:text-neutral-100 ${
            // Hide if we are showing the visual mermaid diagram OR showing the Shiki highlighted view
            (isMermaid && viewMode === "diagram") ||
            (!isMermaid && (isReadonly || viewMode === "highlight")) ||
            (isMermaid && viewMode === "code" && isReadonly)
              ? "hidden"
              : "block"
          }`}
        >
          <NodeViewContent
            as="div"
            style={{ backgroundColor: "transparent" }}
            className="outline-none block selection:bg-yellow-300 selection:text-black font-mono text-xs bg-transparent !bg-transparent text-inherit"
          />
        </pre>
      </div>

      {/* Fullscreen Zoom Modal for Large Diagrams */}
      {isModalOpen && svg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex-1 max-w-6xl w-full mx-auto bg-white dark:bg-neutral-900 border-3 border-black dark:border-neutral-600 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-yellow-300 border-b-2 border-black select-none">
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
                  <span className="px-1.5 font-bold min-w-[45px] text-center text-black">
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
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-950">
              <div
                ref={modalSvgContainerRef}
                style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
                className="transition-transform duration-100 flex items-center justify-center [&_svg]:max-w-none [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
