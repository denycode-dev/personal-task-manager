"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(true);
    setProgress(20);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        const diff = Math.max(1, (90 - prev) * 0.15);
        return prev + diff;
      });
    }, 100);
  };

  const complete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 200);
  };

  // Route change complete
  useEffect(() => {
    complete();
  }, [pathname, searchParams]);

  // Global link click interceptor
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, downloads, modifier keys, hash links, or same page
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.hasAttribute("download") ||
        target.getAttribute("target") === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's pointing to the exact same pathname + search
      const currentFullUrl = window.location.pathname + window.location.search;
      if (href === currentFullUrl) return;

      start();
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-[3.5px] bg-yellow-400 border-b border-black shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all ease-out duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
