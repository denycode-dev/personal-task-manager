"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChecklistAction } from "@/features/checklists/actions/checklist.action";
import { toast } from "sonner";
import { Plus, CircleNotch, Clock, X, Calendar } from "@phosphor-icons/react";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import type { Folder as FolderType } from "@/lib/db/schema";

type Props = {
  folders?: FolderType[];
  defaultFolderId?: string;
};

export function CreateChecklistForm({ folders = [], defaultFolderId = "" }: Props) {
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [deadline, setDeadline] = useState("");
  const [showDeadline, setShowDeadline] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const setPresetDeadline = (type: "today" | "tomorrow" | "3days" | "1week") => {
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
    setShowDeadline(true);
  };

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createChecklistAction(
        title.trim(),
        folderId || undefined,
        deadline ? new Date(deadline).toISOString() : undefined
      );
      if (result.success) {
        toast.success("Checklist berhasil dibuat.");
        router.push(`/checklists/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="border-2 border-black bg-white p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          suppressHydrationWarning
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isPending && submit()}
          placeholder="Nama daftar tugas / checklist baru..."
          className="flex-1 border-2 border-black px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:bg-yellow-50 disabled:opacity-60 font-bold"
          disabled={isPending}
        />

        {folders.length > 0 && (
          <select
            suppressHydrationWarning
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={isPending}
            className="border-2 border-black px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:bg-yellow-50 font-bold max-w-full sm:max-w-[180px] disabled:opacity-60 cursor-pointer"
            title="Pilih folder untuk checklist ini"
          >
            <option value="">— Tanpa Folder —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        )}

        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setShowDeadline((v) => !v)}
          className={`px-3 py-2 border-2 border-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            deadline
              ? "bg-yellow-300 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              : showDeadline
              ? "bg-neutral-200 text-black"
              : "bg-white hover:bg-neutral-100 text-neutral-700"
          }`}
          title="Atur deadline tugas"
        >
          <Clock size={15} weight="bold" />
          <span className="hidden sm:inline">
            {deadline ? "Deadline Diatur" : "+ Deadline"}
          </span>
        </button>

        <button
          suppressHydrationWarning
          onClick={submit}
          disabled={isPending || !title.trim()}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all min-w-[130px] cursor-pointer"
        >
          {isPending ? (
            <>
              <CircleNotch size={16} weight="bold" className="animate-spin" />
              <span>Membuat...</span>
            </>
          ) : (
            <>
              <Plus size={16} weight="bold" />
              <span>Buat Checklist</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Deadline Panel */}
      {showDeadline && (
        <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-black flex items-center gap-1">
              <Calendar size={13} weight="bold" />
              <span>Deadline Tugas:</span>
            </span>
            <button
              type="button"
              onClick={() => setPresetDeadline("today")}
              className="px-2 py-0.5 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 cursor-pointer"
            >
              Hari Ini (23:59)
            </button>
            <button
              type="button"
              onClick={() => setPresetDeadline("tomorrow")}
              className="px-2 py-0.5 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 cursor-pointer"
            >
              Besok (17:00)
            </button>
            <button
              type="button"
              onClick={() => setPresetDeadline("3days")}
              className="px-2 py-0.5 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 cursor-pointer"
            >
              +3 Hari
            </button>
            <button
              type="button"
              onClick={() => setPresetDeadline("1week")}
              className="px-2 py-0.5 text-[11px] font-bold border border-black bg-neutral-100 hover:bg-yellow-200 cursor-pointer"
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
              className="border-2 border-black px-2 py-1 text-xs bg-white focus:outline-none focus:bg-yellow-50 font-mono"
            />
            {deadline && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setDeadline("")}
                className="p-1 border border-black bg-white hover:bg-red-50 text-red-600 cursor-pointer"
                title="Hapus deadline"
              >
                <X size={13} weight="bold" />
              </button>
            )}
            {deadline && <DeadlineBadge deadline={new Date(deadline)} />}
          </div>
        </div>
      )}
    </div>
  );
}
