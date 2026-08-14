import Link from "next/link";
import {
  NotePencil,
  Lock,
  ArrowRight,
  Plus,
  FileText,
} from "@phosphor-icons/react/dist/ssr";
import type { RecentNoteSummary } from "@/features/dashboard/types";

interface RecentNotesWidgetProps {
  notes: RecentNoteSummary[];
}

export function RecentNotesWidget({ notes }: RecentNotesWidgetProps) {
  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            <NotePencil size={20} weight="bold" />
          </div>
          <div>
            <h2 className="text-lg font-black text-black leading-tight">
              Catatan Terbaru
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Dokumen & ide yang baru diedit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notes/new"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Tulis Baru</span>
          </Link>
          <Link
            href="/notes"
            className="p-1 text-xs font-bold text-black hover:underline inline-flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-black/30 bg-yellow-50/50 text-center space-y-3">
          <div className="inline-flex p-3 bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <FileText size={28} weight="bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-black">Belum Ada Catatan</h3>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto">
              Mulai tulis ide, notulensi rapat, atau dokumentasi pertamamu sekarang.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Catatan Pertama</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="group flex items-center justify-between p-3 border-2 border-black bg-neutral-50 hover:bg-yellow-100/70 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  {note.isLocked && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black">
                      <Lock size={10} weight="fill" />
                      Terkunci
                    </span>
                  )}

                  {note.folder && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                        style={{ backgroundColor: note.folder.color }}
                      />
                      <span className="truncate max-w-[120px]">{note.folder.name}</span>
                    </span>
                  )}
                </div>

                <p className="font-bold text-sm text-black truncate group-hover:underline decoration-2">
                  {note.title || "Catatan tanpa judul"}
                </p>

                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Diperbarui {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <span className="p-1 text-black group-hover:translate-x-1 transition-transform shrink-0">
                <ArrowRight size={16} weight="bold" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
