"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowCounterClockwise,
  DownloadSimple,
  Check,
  Copy,
  HandGrabbing,
  CornersOut,
} from "@phosphor-icons/react";

interface MermaidPanZoomCanvasProps {
  svg: string;
  theme?: "light" | "dark" | "sepia";
  isFullscreen?: boolean;
  minHeight?: string;
  maxHeight?: string;
  onOpenFullscreen?: () => void;
  onDownloadSvg?: () => void;
  onCopySvg?: () => void;
  isCopiedSvg?: boolean;
  bindFunctions?: ((element: Element) => void) | null;
  className?: string;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 5.0;
const SCALE_STEP = 0.25;

export function MermaidPanZoomCanvas({
  svg,
  theme = "light",
  isFullscreen = false,
  minHeight = "280px",
  maxHeight = "560px",
  onOpenFullscreen,
  onDownloadSvg,
  onCopySvg,
  isCopiedSvg = false,
  bindFunctions,
  className = "",
}: MermaidPanZoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showWheelHint, setShowWheelHint] = useState(false);

  // Refs for tracking drag coordinates without stale closures
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  panRef.current = pan;
  scaleRef.current = scale;

  // Bind interactive Mermaid events whenever SVG or DOM mounts
  useEffect(() => {
    if (svg && bindFunctions && contentRef.current) {
      try {
        bindFunctions(contentRef.current);
      } catch {
        // Silently ignore binding failures for diagrams without interactive links
      }
    }
  }, [svg, bindFunctions, scale, pan]);

  // Clean up hint timeout
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  // Zoom Helpers
  const updateZoom = useCallback((newScale: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(newScale * 100) / 100));
    setScale(clamped);
  }, []);

  const handleZoomIn = useCallback(() => {
    updateZoom(scaleRef.current + SCALE_STEP);
  }, [updateZoom]);

  const handleZoomOut = useCallback(() => {
    updateZoom(scaleRef.current - SCALE_STEP);
  }, [updateZoom]);

  const handleReset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pointer Drag Handlers (Unified Mouse + Touch + Pen)
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0) return;

    // Ignore clicks on controls/buttons
    if ((e.target as HTMLElement).closest("button, [data-prevent-pan]")) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    try {
      container.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }

    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panRef.current };
    setIsDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newPan = {
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    };

    panRef.current = newPan;
    setPan(newPan);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      if (containerRef.current?.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  // Wheel zoom logic:
  // - In fullscreen: wheel zooms directly.
  // - In inline view: Ctrl/Cmd + wheel zooms; regular wheel scrolls page normally to avoid scroll trapping.
  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (isFullscreen) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      updateZoom(scaleRef.current * zoomFactor);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      updateZoom(scaleRef.current * zoomFactor);
    } else {
      // Show helpful hint pill briefly
      setShowWheelHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowWheelHint(false);
      }, 2000);
    }
  };

  // Native wheel event listener to guarantee { passive: false } for preventDefault on Ctrl+Wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      if (isFullscreen || e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onNativeWheel);
    };
  }, [isFullscreen]);

  // Keyboard navigation
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === "0") {
      e.preventDefault();
      handleReset();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPan((p) => ({ ...p, x: p.x + 40 }));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPan((p) => ({ ...p, x: p.x - 40 }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPan((p) => ({ ...p, y: p.y + 40 }));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setPan((p) => ({ ...p, y: p.y - 40 }));
    }
  };

  // Background style based on active theme
  const bgClass =
    theme === "dark"
      ? "bg-[#09090b] text-neutral-100"
      : theme === "sepia"
      ? "bg-[#fdf8ee] text-[#382b22]"
      : "bg-white text-neutral-900";

  // Grid pattern dots for canvas aesthetic
  const gridDotColor =
    theme === "dark"
      ? "rgba(255,255,255,0.06)"
      : theme === "sepia"
      ? "rgba(92,64,40,0.08)"
      : "rgba(0,0,0,0.05)";

  const inlineHeightStyle = isFullscreen
    ? { height: "100%", width: "100%" }
    : { minHeight, maxHeight, height: "460px" };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Interactive Mermaid Diagram Canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleReset}
      style={{
        ...inlineHeightStyle,
        backgroundImage: `radial-gradient(${gridDotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: "20px 20px",
        touchAction: "none",
      }}
      className={`relative w-full overflow-hidden select-none outline-none transition-colors duration-150 ${bgClass} ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
    >
      {/* Zoomable & Pannable Content Container */}
      <div
        className="mermaid-pan-zoom-viewport absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            willChange: isDragging ? "transform" : "auto",
            transition: isDragging ? "none" : "transform 140ms ease-out",
          }}
          className="mermaid-container pointer-events-auto flex items-center justify-center [&_svg]:max-w-none [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Floating Scroll Trap Prevention Hint */}
      {showWheelHint && !isFullscreen && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 bg-black/90 text-white text-[11px] font-mono font-medium rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-neutral-700 flex items-center gap-1.5">
            <span className="text-yellow-400 font-bold">💡 Tips:</span>
            <span>Tahan <strong>Ctrl</strong> + scroll mouse untuk zoom diagram</span>
          </div>
        </div>
      )}

      {/* Canvas Status & Interaction Hint Badge (Bottom Left) */}
      <div
        data-prevent-pan
        className="absolute bottom-3 left-3 z-20 flex items-center gap-2 pointer-events-none opacity-80 hover:opacity-100 transition-opacity"
      >
        <div className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-300 border border-black/30 dark:border-neutral-700 backdrop-blur-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
          <HandGrabbing size={12} weight="bold" />
          <span className="hidden sm:inline">Klik & seret untuk menggeser</span>
          <span className="sm:hidden">Seret</span>
        </div>
      </div>

      {/* Floating Control Toolbar (Bottom Right) */}
      <div
        data-prevent-pan
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs p-1 border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none"
      >
        {/* Zoom Out Button */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          className="w-7 h-7 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer border border-transparent hover:border-black"
          title="Perkecil Diagram (Shortcut: - atau Ctrl+Scroll Down)"
        >
          <MagnifyingGlassMinus size={15} weight="bold" />
        </button>

        {/* Current Scale Display & Quick Reset */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleReset}
          className="px-2 py-0.5 min-w-[50px] text-center font-mono text-xs font-black text-black dark:text-white hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black transition-colors cursor-pointer border border-black/20 hover:border-black"
          title="Klik untuk Reset ke 100% (Shortcut: 0 atau Double Click)"
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom In Button */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          className="w-7 h-7 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer border border-transparent hover:border-black"
          title="Perbesar Diagram (Shortcut: + atau Ctrl+Scroll Up)"
        >
          <MagnifyingGlassPlus size={15} weight="bold" />
        </button>

        {/* Reset Pan & Scale Button */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleReset}
          className="w-7 h-7 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black transition-colors cursor-pointer border border-transparent hover:border-black ml-0.5"
          title="Pusatkan Diagram & Reset Zoom (Double Click)"
        >
          <ArrowCounterClockwise size={14} weight="bold" />
        </button>

        {/* Fullscreen Button (Only when in inline mode) */}
        {!isFullscreen && onOpenFullscreen && (
          <button
            suppressHydrationWarning
            type="button"
            onClick={onOpenFullscreen}
            className="w-7 h-7 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black transition-colors cursor-pointer border-l border-black/20 pl-1 ml-0.5"
            title="Perbesar Layar Penuh"
          >
            <CornersOut size={15} weight="bold" />
          </button>
        )}

        {/* Download SVG (Optional) */}
        {onDownloadSvg && (
          <button
            suppressHydrationWarning
            type="button"
            onClick={onDownloadSvg}
            className="w-7 h-7 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black transition-colors cursor-pointer border border-transparent hover:border-black"
            title="Unduh Berkas SVG Diagram"
          >
            <DownloadSimple size={14} weight="bold" />
          </button>
        )}

        {/* Copy SVG (Optional) */}
        {onCopySvg && (
          <button
            suppressHydrationWarning
            type="button"
            onClick={onCopySvg}
            className="px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200 hover:bg-yellow-300 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black transition-colors cursor-pointer border border-transparent hover:border-black flex items-center gap-1"
            title="Salin Kode SVG"
          >
            {isCopiedSvg ? (
              <>
                <Check size={13} weight="bold" className="text-green-600" />
                <span className="text-[10px]">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={13} weight="bold" />
                <span className="text-[10px]">SVG</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
