"use client";

import { useState, useTransition } from "react";
import { Clock, X, CircleNotch, CalendarPlus } from "@phosphor-icons/react";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { updateChecklistDeadlineAction } from "@/features/checklists/actions/checklist.action";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  checklistId: string;
  currentDeadline: Date | null | undefined;
};

export function ChecklistDeadlinePicker({ checklistId, currentDeadline }: Props) {
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState(
    currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : ""
  );
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setDeadline(currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : "");
    setOpen(true);
  };

  const setPreset = (type: "today" | "tomorrow" | "3days" | "1week") => {
    const now = new Date();
    if (type === "today") {
      now.setHours(23, 59, 0, 0);
    } else if (type === "tomorrow") {
      now.setDate(now.getDate() + 1);
      now.setHours(17, 0, 0, 0);
    } else if (type === "3days") {
      now.setDate(now.getDate() + 3);
      now.setHours(17, 0, 0, 0);
    } else if (type === "1week") {
      now.setDate(now.getDate() + 7);
      now.setHours(17, 0, 0, 0);
    }
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setDeadline(localISOTime);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateChecklistDeadlineAction(checklistId, deadline ? new Date(deadline).toISOString() : null);
      if (res.success) {
        toast.success(deadline ? "Deadline tugas diperbarui." : "Deadline tugas dihapus.");
        setOpen(false);
      } else {
        toast.error(res.error || "Gagal memperbarui deadline.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {currentDeadline ? (
          <button
            type="button"
            onClick={handleOpen}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title="Klik untuk mengubah deadline tugas"
          >
            <DeadlineBadge deadline={new Date(currentDeadline)} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black bg-white hover:bg-yellow-200 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-neutral-800"
            title="Atur batas waktu (deadline) untuk tugas checklist ini"
          >
            <CalendarPlus size={14} weight="bold" />
            <span>+ Deadline Tugas</span>
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-4">
          <DialogHeader className="border-b-2 border-black pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-yellow-400 border border-black text-black">
                <Clock size={16} weight="bold" />
              </span>
              <DialogTitle className="font-black text-sm text-black">
                Atur Deadline Tugas Utama
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tenggat waktu ini merupakan batas waktu maksimal untuk seluruh item checklist di dalam tugas ini.
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPreset("today")}
                className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
              >
                Hari Ini (23:59)
              </button>
              <button
                type="button"
                onClick={() => setPreset("tomorrow")}
                className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
              >
                Besok (17:00)
              </button>
              <button
                type="button"
                onClick={() => setPreset("3days")}
                className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
              >
                +3 Hari
              </button>
              <button
                type="button"
                onClick={() => setPreset("1week")}
                className="px-2 py-1 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 transition-colors cursor-pointer"
              >
                +1 Minggu
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                suppressHydrationWarning
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border-2 border-black px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:bg-yellow-50 flex-1 font-mono"
                disabled={isPending}
              />
              {deadline && (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setDeadline("")}
                  className="p-1.5 border border-black bg-neutral-100 hover:bg-red-100 text-red-600 cursor-pointer"
                  title="Hapus deadline"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>

            {deadline && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-neutral-500 font-semibold">Pratinjau:</span>
                <DeadlineBadge deadline={new Date(deadline)} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t-2 border-black/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <CircleNotch size={14} weight="bold" className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan</span>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
