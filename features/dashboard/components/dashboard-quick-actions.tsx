import Link from "next/link";
import {
  NotePencil,
  Kanban,
  ListChecks,
  CalendarBlank,
  FolderSimple,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";

const quickActions = [
  {
    href: "/notes/new",
    label: "Tulis Catatan",
    description: "Editor rich text & format bebas",
    icon: <NotePencil size={20} weight="bold" />,
    colorBg: "bg-yellow-400 hover:bg-yellow-300",
  },
  {
    href: "/kanban",
    label: "Buka Kanban",
    description: "Kelola kartu alur kerja",
    icon: <Kanban size={20} weight="bold" />,
    colorBg: "bg-sky-400 hover:bg-sky-300",
  },
  {
    href: "/checklists",
    label: "Buat Checklist",
    description: "Daftar to-do & centang tugas",
    icon: <ListChecks size={20} weight="bold" />,
    colorBg: "bg-emerald-400 hover:bg-emerald-300",
  },
  {
    href: "/calendar",
    label: "Jadwal & Kalender",
    description: "Lihat timeline terpadu",
    icon: <CalendarBlank size={20} weight="bold" />,
    colorBg: "bg-purple-400 hover:bg-purple-300",
  },
  {
    href: "/folders",
    label: "Kelola Folder",
    description: "Kategori & organisasi data",
    icon: <FolderSimple size={20} weight="bold" />,
    colorBg: "bg-orange-400 hover:bg-orange-300",
  },
];

export function DashboardQuickActions() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-black uppercase tracking-tight text-black">
          <Lightning size={20} weight="fill" className="text-yellow-500" />
          Aksi Cepat (Quick Actions)
        </h2>
        <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
          Akses instan 1-klik
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col justify-between p-3.5 border-2 border-black ${action.colorBg} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-1.5 bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
                {action.icon}
              </span>
            </div>
            <div>
              <p className="font-black text-sm text-black leading-tight">{action.label}</p>
              <p className="text-[11px] font-medium text-black/75 mt-0.5 line-clamp-1">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
