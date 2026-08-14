export const dynamic = "force-dynamic";

import Link from "next/link";
import { checklistRepository } from "@/features/checklists/repositories/checklist.repository";
import { CreateChecklistForm } from "@/features/checklists/components/create-checklist-form";
import { CheckSquareOffset, CheckSquare, Plus, ArrowRight, ListChecks } from "@phosphor-icons/react/dist/ssr";

export default async function ChecklistsPage() {
  const checklists = await checklistRepository.findAll();

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

      <CreateChecklistForm />

      {checklists.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-black/30 bg-emerald-50/50 space-y-3">
          <div className="inline-flex p-3.5 bg-emerald-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <ListChecks size={32} weight="bold" />
          </div>
          <p className="text-base font-black text-black">Belum ada daftar checklist.</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Buat grup checklist baru di atas untuk mulai mencatat to-do list harianmu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {checklists.map((cl) => (
            <li key={cl.id}>
              <Link
                href={`/checklists/${cl.id}`}
                className="group flex items-center justify-between p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="p-2 bg-emerald-300 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-emerald-950 shrink-0">
                    <CheckSquareOffset size={20} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-base text-black truncate group-hover:underline decoration-2">
                      {cl.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dibuat {new Date(cl.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Lihat Item</span>
                  <ArrowRight size={14} weight="bold" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
