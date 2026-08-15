"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui.store";
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
        "hidden md:flex flex-col min-h-screen border-r-2 border-black bg-white transition-all duration-200 select-none z-30",
        sidebarMinimized ? "w-16 p-2" : "w-60 p-4"
      )}
    >
      {/* Header with Title and Minimize Toggle */}
      <div
        className={cn(
          "flex items-center mb-6 pb-2 border-b-2 border-black/10",
          sidebarMinimized ? "justify-center" : "justify-between px-2"
        )}
      >
        {!sidebarMinimized && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-black text-lg text-black hover:opacity-80 transition-opacity"
          >
            <span className="p-1 bg-yellow-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Sparkle size={16} weight="fill" />
            </span>
            <span>Denycode</span>
          </Link>
        )}

        <button
          suppressHydrationWarning
          type="button"
          onClick={toggleSidebarMinimized}
          className="p-1.5 hover:bg-yellow-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
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
              title={sidebarMinimized ? item.label : undefined}
              className={cn(
                "flex items-center rounded-none font-bold transition-all",
                sidebarMinimized
                  ? "justify-center p-2.5"
                  : "gap-3 px-3 py-2 text-sm",
                isActive
                  ? "bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                  : "hover:bg-neutral-100 text-neutral-700 hover:text-black border-2 border-transparent"
              )}
            >
              <Icon
                size={20}
                weight={isActive ? "fill" : "bold"}
                className="shrink-0"
              />
              {!sidebarMinimized && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info footer */}
      {!sidebarMinimized ? (
        <div className="pt-3 border-t-2 border-black/10 text-[11px] text-muted-foreground font-semibold px-2">
          <p>Denycode Task Manager</p>
          <p className="text-[10px] text-neutral-400">Deni Irawan Nugraha</p>
        </div>
      ) : (
        <div className="pt-2 border-t-2 border-black/10 flex justify-center text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
        </div>
      )}
    </aside>
  );
}
