export const dynamic = "force-dynamic";

import Link from "next/link";
import { checklistRepository } from "@/features/checklists/repositories/checklist.repository";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { deleteChecklistAction } from "@/features/checklists/actions/checklist.action";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { CreateChecklistForm } from "@/features/checklists/components/create-checklist-form";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { CheckSquareOffset, ArrowRight, ListChecks } from "@phosphor-icons/react/dist/ssr";

export default async function ChecklistsPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { folderId } = await searchParams;
  const [checklists, folders] = await Promise.all([
    checklistRepository.findAll(folderId || undefined),
    folderRepository.findAll(),
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black">Checklist Harian</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Daftar periksa tugas sederhana dengan deadline dan status progress
          </p>
        </div>
      </div>

      <CreateChecklistForm folders={folders} defaultFolderId={folderId} />

      {/* Folder filter pills */}
      {folders.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href="/checklists"
            className={`px-3 py-1 text-xs border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform ${
              !folderId ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
            }`}
          >
            Semua
          </Link>
          {folders.map((f) => (
            <Link
              key={f.id}
              href={`/checklists?folderId=${f.id}`}
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

      {checklists.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-emerald-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-emerald-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <ListChecks size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">Belum ada daftar checklist.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {folderId
              ? "Tidak ada checklist di folder ini. Buat checklist baru di atas atau pilih folder lain."
              : "Buat grup checklist baru di atas untuk mulai mencatat to-do list harianmu."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {checklists.map((cl) => {
            const folder = folders.find((f) => f.id === cl.folderId);
            return (
              <li
                key={cl.id}
                className="group relative flex items-center justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all gap-4"
              >
                <Link href={`/checklists/${cl.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="p-2 bg-emerald-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-emerald-950 shrink-0">
                    <CheckSquareOffset size={20} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                        {cl.title}
                      </p>
                      {folder ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 border border-black/20 shrink-0">
                          <span
                            className="inline-block w-2 h-2 rounded-xs border border-black"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="truncate max-w-[100px]">{folder.name}</span>
                        </span>
                      ) : null}
                      {cl.deadline && (
                        <div className="shrink-0">
                          <DeadlineBadge deadline={new Date(cl.deadline)} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dibuat {new Date(cl.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/checklists/${cl.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Lihat Item</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>

                  <DeleteConfirmButton
                    action={deleteChecklistAction.bind(null, cl.id)}
                    confirmTitle="Hapus Checklist"
                    confirmMessage={`Hapus checklist "${cl.title}"? Semua item di dalamnya akan ikut terhapus.`}
                    successMessage="Checklist berhasil dihapus."
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-black rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                    iconSize={15}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
