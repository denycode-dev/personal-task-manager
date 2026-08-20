export const dynamic = "force-dynamic";

import Link from "next/link";
import { noteService } from "@/features/notes/services/note.service";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { deleteNoteAction } from "@/features/notes/actions/delete-note.action";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { db } from "@/lib/db";
import { noteLocks, noteShares } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { Lock, ShareNetwork, Plus, NotePencil } from "@phosphor-icons/react/dist/ssr";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { folderId } = await searchParams;
  const [notes, folders] = await Promise.all([
    noteService.getAll(folderId || undefined),
    folderRepository.findAll(),
  ]);

  const noteIds = notes.map((n) => n.id);
  const [lockedRows, sharedRows] = noteIds.length > 0
    ? await Promise.all([
        db.select({ noteId: noteLocks.noteId }).from(noteLocks).where(inArray(noteLocks.noteId, noteIds)).catch(() => []),
        db.select({ noteId: noteShares.noteId }).from(noteShares).where(inArray(noteShares.noteId, noteIds)).catch(() => []),
      ])
    : [[], []];

  const lockedSet = new Set(lockedRows.map((r) => r.noteId));
  const sharedSet = new Set(sharedRows.map((r) => r.noteId));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black">Catatan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Dokumentasi, ide, dan catatan terenkripsi
          </p>
        </div>
        <Link
          href="/notes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-yellow-400 font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Plus size={16} weight="bold" />
          <span>Tulis Baru</span>
        </Link>
      </div>

      {/* Folder filter */}
      {folders.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href="/notes"
            className={`px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform ${
              !folderId ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
            }`}
          >
            Semua
          </Link>
          {folders.map((f) => (
            <Link
              key={f.id}
              href={`/notes?folderId=${f.id}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform ${
                folderId === f.id ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
              }`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                style={{ backgroundColor: f.color }}
              />
              <span>{f.name}</span>
            </Link>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-yellow-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <NotePencil size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">Belum ada catatan.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Mulai tulis catatan pertamamu sekarang dengan rich-text editor bebas gangguan.
          </p>
          <div className="pt-2">
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Catatan Baru</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const folder = folders.find((f) => f.id === note.folderId);
            const isLocked = lockedSet.has(note.id);
            const isShared = sharedSet.has(note.id);

            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {folder ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm border border-black"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate max-w-[120px]">{folder.name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        Tanpa Folder
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {isLocked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-neutral-900 text-yellow-400 border border-black">
                          <Lock size={10} weight="fill" />
                          Kunci
                        </span>
                      )}
                      {isShared && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-purple-200 text-purple-900 border border-black">
                          <ShareNetwork size={10} weight="bold" />
                          Publik
                        </span>
                      )}
                      <DeleteConfirmButton
                        action={deleteNoteAction.bind(null, note.id)}
                        confirmTitle="Hapus Catatan"
                        confirmMessage={`Hapus catatan "${note.title || "Catatan tanpa judul"}"? Tindakan ini akan menghapus catatan secara permanen.`}
                        successMessage="Catatan berhasil dihapus."
                        className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                        iconSize={14}
                      />
                    </div>
                  </div>

                  <Link href={`/notes/${note.id}`} className="block">
                    <h2 className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                      {note.title || "Catatan tanpa judul"}
                    </h2>
                  </Link>
                </div>

                <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/notes/${note.id}`}
                    className="text-black font-bold group-hover:translate-x-0.5 transition-transform"
                  >
                    Buka &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
