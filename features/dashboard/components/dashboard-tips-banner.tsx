import {
  DeviceMobile,
  ShieldCheck,
  CalendarBlank,
  Lightbulb,
} from "@phosphor-icons/react/dist/ssr";

export function DashboardTipsBanner() {
  return (
    <section className="border-2 border-black bg-neutral-100 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
      <div className="flex items-center gap-2">
        <span className="p-1.5 bg-yellow-400 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black">
          <Lightbulb size={18} weight="fill" />
        </span>
        <h2 className="text-sm font-black uppercase tracking-wider text-black">
          Panduan & Fitur Unggulan Denycode
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-black">
            <DeviceMobile size={18} weight="bold" className="text-sky-600 shrink-0" />
            <span>PWA & Offline Ready</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Install di desktop/smartphone Anda untuk akses cepat seperti aplikasi native dan dukungan cache offline.
          </p>
        </div>

        <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-black">
            <CalendarBlank size={18} weight="bold" className="text-purple-600 shrink-0" />
            <span>Indikator Deadline H-1</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Semua kartu Kanban dan item Checklist otomatis dipantau dan diberi badge warna saat mendekati batas waktu.
          </p>
        </div>

        <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-black">
            <ShieldCheck size={18} weight="bold" className="text-emerald-600 shrink-0" />
            <span>Keamanan Terpusat</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Data tersimpan aman di cloud PostgreSQL serverless Neon dengan autentikasi single-user terenkripsi.
          </p>
        </div>
      </div>
    </section>
  );
}
