import Link from "next/link";
import {
  NotePencil,
  Kanban,
  CheckSquare,
  CalendarBlank,
  FolderSimple,
  ArrowRight,
  Plus,
  Compass,
} from "@phosphor-icons/react/dist/ssr";
import type { DashboardStats } from "@/features/dashboard/types";

interface DashboardNavigationHubProps {
  stats: DashboardStats;
}

export function DashboardNavigationHub({ stats }: DashboardNavigationHubProps) {
  const navModules = [
    {
      id: "notes",
      title: "Catatan (Notes)",
      description: "Tulis dan susun ide dengan rich-text editor bebas gangguan.",
      href: "/notes",
      quickActionHref: "/notes/new",
      quickActionLabel: "Tulis Baru",
      icon: <NotePencil size={24} weight="bold" />,
      metricLabel: `${stats.totalNotes} Catatan`,
      colorTheme: "bg-yellow-100 hover:bg-yellow-200/90",
      badgeColor: "bg-yellow-400 text-black",
      buttonColor: "bg-yellow-400 hover:bg-yellow-300",
    },
    {
      id: "kanban",
      title: "Papan Kanban",
      description: "Visualisasikan alur kerja dengan tahapan tugas & drag-and-drop.",
      href: "/kanban",
      quickActionHref: "/kanban",
      quickActionLabel: "Papan Baru",
      icon: <Kanban size={24} weight="bold" />,
      metricLabel: `${stats.totalBoards} Papan • ${stats.totalCards} Kartu`,
      colorTheme: "bg-sky-100 hover:bg-sky-200/90",
      badgeColor: "bg-sky-400 text-black",
      buttonColor: "bg-sky-400 hover:bg-sky-300",
    },
    {
      id: "checklists",
      title: "Checklist Harian",
      description: "Daftar to-do ringkas dan pelacak target yang perlu diselesaikan.",
      href: "/checklists",
      quickActionHref: "/checklists",
      quickActionLabel: "Checklist Baru",
      icon: <CheckSquare size={24} weight="bold" />,
      metricLabel: `${stats.checklistDone}/${stats.checklistTotal} Selesai (${stats.checklistCompletionRate}%)`,
      colorTheme: "bg-emerald-100 hover:bg-emerald-200/90",
      badgeColor: "bg-emerald-400 text-black",
      buttonColor: "bg-emerald-400 hover:bg-emerald-300",
    },
    {
      id: "calendar",
      title: "Kalender & Linimasa",
      description: "Lihat seluruh deadline tugas dan event dalam satu kalender global.",
      href: "/calendar",
      quickActionHref: "/calendar",
      quickActionLabel: "Buka Kalender",
      icon: <CalendarBlank size={24} weight="bold" />,
      metricLabel: "Linimasa Terpadu",
      colorTheme: "bg-purple-100 hover:bg-purple-200/90",
      badgeColor: "bg-purple-400 text-black",
      buttonColor: "bg-purple-400 hover:bg-purple-300",
    },
    {
      id: "folders",
      title: "Folder & Organisasi",
      description: "Kelompokkan catatan, kanban, dan checklist dalam kategori proyek.",
      href: "/folders",
      quickActionHref: "/folders",
      quickActionLabel: "Kelola Folder",
      icon: <FolderSimple size={24} weight="bold" />,
      metricLabel: `${stats.totalFolders} Folder Aktif`,
      colorTheme: "bg-orange-100 hover:bg-orange-200/90",
      badgeColor: "bg-orange-400 text-black",
      buttonColor: "bg-orange-400 hover:bg-orange-300",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-black uppercase tracking-tight text-black">
          <Compass size={20} weight="bold" className="text-black" />
          Pusat Navigasi Fitur (Navigation Hub)
        </h2>
        <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
          Pilih modul untuk mulai bekerja
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navModules.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col justify-between p-5 border-2 border-black ${item.colorTheme} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                  {item.icon}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-xs font-black border-2 border-black ${item.badgeColor} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] truncate max-w-[170px]`}
                >
                  {item.metricLabel}
                </span>
              </div>

              <h3 className="text-lg font-black text-black leading-snug">
                {item.title}
              </h3>
              <p className="text-xs font-medium text-black/75 mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-black/20 flex items-center justify-between gap-2">
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 text-xs font-black text-black hover:underline decoration-2"
              >
                <span>Buka Modul</span>
                <ArrowRight size={14} weight="bold" />
              </Link>

              <Link
                href={item.quickActionHref}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold ${item.buttonColor} text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform`}
              >
                <Plus size={13} weight="bold" />
                <span>{item.quickActionLabel}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
