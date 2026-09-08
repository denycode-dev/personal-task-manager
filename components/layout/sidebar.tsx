"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui.store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  House,
  Note,
  Kanban,
  CheckSquare,
  CalendarBlank,
  Folder,
  SidebarSimple,
  Sparkle,
} from "@phosphor-icons/react";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: House },
  { href: "/notes", label: "Catatan", icon: Note },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/checklists", label: "Checklist", icon: CheckSquare },
  { href: "/calendar", label: "Kalender", icon: CalendarBlank },
  { href: "/folders", label: "Folder", icon: Folder },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarMinimized, toggleSidebarMinimized } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col min-h-screen border-r-2 border-border bg-card text-foreground transition-all duration-200 select-none z-30",
        sidebarMinimized ? "w-16 p-2" : "w-60 p-4",
      )}
    >
      {/* Header with Title and Minimize Toggle */}
      <div
        className={cn(
          "flex items-center mb-6 pb-2 border-b-2 border-border/20",
          sidebarMinimized ? "justify-center" : "justify-between px-2",
        )}
      >
        {!sidebarMinimized && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-black text-lg text-foreground hover:opacity-80 transition-opacity"
          >
            <span className="p-1 bg-yellow-400 text-black border border-border shadow-[1px_1px_0px_0px_var(--border)]">
              <Sparkle size={16} weight="fill" />
            </span>
            <span>Denycode</span>
          </Link>
        )}

        <button
          suppressHydrationWarning
          type="button"
          onClick={toggleSidebarMinimized}
          className="p-1.5 hover:bg-yellow-300 hover:text-black border-2 border-border bg-card text-foreground shadow-[1px_1px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          title={sidebarMinimized ? "Perluas Sidebar" : "Kecilkan Sidebar"}
          aria-label={sidebarMinimized ? "Perluas Sidebar" : "Kecilkan Sidebar"}
        >
          <SidebarSimple size={18} weight="bold" />
        </button>
      </div>

      {/* Navigation items */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={sidebarMinimized ? item.label : undefined}
              className={cn(
                "flex items-center rounded-none font-bold transition-all active:translate-x-0.5 active:translate-y-0.5",
                sidebarMinimized
                  ? "justify-center p-2.5"
                  : "gap-3 px-3 py-2 text-sm",
                isActive
                  ? "bg-yellow-400 border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] text-black"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground border-2 border-transparent",
              )}
            >
              <Icon
                size={20}
                weight={isActive ? "fill" : "bold"}
                className="shrink-0"
              />
              {!sidebarMinimized && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info footer + Theme Switcher */}
      {!sidebarMinimized ? (
        <div className="pt-3 border-t-2 border-border/20 text-[11px] text-muted-foreground font-semibold px-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider">Tampilan</span>
            <ThemeToggle variant="dropdown" />
          </div>
          <div>
            <p className="text-foreground">Denycode Task Manager</p>
            <p className="text-[10px] text-muted-foreground">Deni Irawan Nugraha</p>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t-2 border-border/20 flex flex-col items-center gap-2 text-muted-foreground">
          <ThemeToggle variant="compact" />
          <span
            className="w-2 h-2 rounded-full bg-emerald-500"
            title="Online"
          />
        </div>
      )}
    </aside>
  );
}
