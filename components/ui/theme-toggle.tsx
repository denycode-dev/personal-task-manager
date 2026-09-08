"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, BookOpen, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    id: "light",
    label: "Terang",
    description: "Neobrutalism orisinal",
    icon: Sun,
    badgeBg: "bg-yellow-400 text-black",
  },
  {
    id: "dark",
    label: "Gelap",
    description: "Sleek dark neobrutal",
    icon: Moon,
    badgeBg: "bg-zinc-800 text-yellow-300",
  },
  {
    id: "read",
    label: "Mode Baca",
    description: "Warm paper & sepia",
    icon: BookOpen,
    badgeBg: "bg-[#ebdcc4] text-[#2d2116]",
  },
] as const;

interface ThemeToggleProps {
  variant?: "dropdown" | "compact" | "segmented";
  className?: string;
}

export function ThemeToggle({ variant = "dropdown", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          className
        )}
      >
        <Sun size={18} weight="bold" />
      </div>
    );
  }

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
  const CurrentIcon = currentTheme.icon;

  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex p-1 border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--border)] gap-1",
          className
        )}
      >
        {THEMES.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              title={t.label}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs font-black transition-all cursor-pointer",
                isActive
                  ? "bg-yellow-400 text-black border-2 border-border shadow-[1px_1px_0px_0px_var(--border)]"
                  : "hover:bg-muted text-foreground border-2 border-transparent"
              )}
            >
              <Icon size={14} weight={isActive ? "fill" : "bold"} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => {
          const nextIndex = (THEMES.findIndex((t) => t.id === theme) + 1) % THEMES.length;
          setTheme(THEMES[nextIndex].id);
        }}
        title={`Tema saat ini: ${currentTheme.label}. Klik untuk ganti.`}
        aria-label={`Tema saat ini: ${currentTheme.label}. Klik untuk ganti.`}
        className={cn(
          "p-1.5 border-2 border-border bg-card text-foreground hover:bg-yellow-300 hover:text-black transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer flex items-center justify-center",
          className
        )}
      >
        <CurrentIcon size={18} weight="bold" />
      </button>
    );
  }

  // Default: Dropdown Neobrutalism
  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Ubah Tema (${currentTheme.label})`}
        aria-label={`Ubah Tema: ${currentTheme.label}`}
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-black border-2 border-border bg-card text-foreground hover:bg-yellow-300 hover:text-black transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer select-none"
      >
        <CurrentIcon size={17} weight="fill" className="shrink-0" />
        <span className="hidden sm:inline">{currentTheme.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-card border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/20 mb-1">
            Pilih Tampilan
          </div>
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold transition-all text-left cursor-pointer",
                  isActive
                    ? "bg-yellow-400 text-black border border-border shadow-[1px_1px_0px_0px_var(--border)]"
                    : "hover:bg-muted text-foreground border border-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("p-1 border border-border/40", t.badgeBg)}>
                    <Icon size={13} weight={isActive ? "fill" : "bold"} />
                  </span>
                  <div>
                    <p className="leading-tight">{t.label}</p>
                    <p className="text-[10px] font-normal opacity-75">{t.description}</p>
                  </div>
                </div>
                {isActive && <Check size={14} weight="bold" className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
