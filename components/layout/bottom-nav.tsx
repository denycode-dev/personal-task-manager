"use client";

import { House, Note, Kanban, CheckSquare, CalendarBlank } from "@phosphor-icons/react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: <House weight="fill" /> },
  { href: "/notes", label: "Catatan", icon: <Note weight="fill" /> },
  { href: "/kanban", label: "Kanban", icon: <Kanban weight="fill" /> },
  { href: "/checklists", label: "Checklist", icon: <CheckSquare weight="fill" /> },
  { href: "/calendar", label: "Kalender", icon: <CalendarBlank weight="fill" /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black flex justify-around px-2 py-3 z-50">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 text-xs",
            pathname === item.href ? "font-bold" : "text-muted-foreground"
          )}
        >
          <span className="text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
