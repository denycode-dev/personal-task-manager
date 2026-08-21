"use client";

import { useState, useTransition } from "react";
import { addChecklistItemAction } from "@/features/checklists/actions/checklist.action";
import { toast } from "sonner";
import { Plus, Clock, X, CircleNotch, Calendar, WarningCircle } from "@phosphor-icons/react";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";

type Props = {
  checklistId: string;
  maxDeadline?: Date | string | null;
};

export function AddItemForm({ checklistId, maxDeadline }: Props) {
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showDeadlineSection, setShowDeadlineSection] = useState(false);
  const [isPending, startTransition] = useTransition();

  const maxDateObj = maxDeadline ? new Date(maxDeadline) : null;
  const maxDeadlineISO = maxDateObj
    ? new Date(maxDateObj.getTime() - maxDateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : undefined;

  const isExceedingMax = Boolean(
    maxDateObj && deadline && new Date(deadline).getTime() > maxDateObj.getTime()
  );

  const formattedMaxDeadline = maxDateObj
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(maxDateObj)
    : null;

  const setPresetDeadline = (type: "today" | "tomorrow" | "3days" | "matchTask") => {
    if (type === "matchTask" && maxDeadlineISO) {
      setDeadline(maxDeadlineISO);
      setShowDeadlineSection(true);
      return;
    }

    const now = new Date();
    if (type === "today") {
      now.setHours(23, 59, 0, 0);
    } else if (type === "tomorrow") {
      now.setDate(now.getDate() + 1);
      now.setHours(17, 0, 0, 0);
    } else if (type === "3days") {
      now.setDate(now.getDate() + 3);
      now.setHours(17, 0, 0, 0);
    }

    // Check if preset exceeds maxDeadline
    if (maxDateObj && now.getTime() > maxDateObj.getTime()) {
      toast.warning(`Preset melewati deadline tugas (${formattedMaxDeadline}), disesuaikan ke batas maksimal.`);
      if (maxDeadlineISO) setDeadline(maxDeadlineISO);
    } else {
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
      setDeadline(localISOTime);
    }
    setShowDeadlineSection(true);
  };

  const submit = () => {
    if (!content.trim()) return;

    if (isExceedingMax) {
      toast.error(
        `Deadline item tidak boleh melebihi batas waktu tugas utama (${formattedMaxDeadline}).`
      );
      return;
    }

    startTransition(async () => {
      const result = await addChecklistItemAction(
        checklistId,
        content.trim(),
        deadline ? new Date(deadline).toISOString() : undefined
      );

      if (result.success) {
        setContent("");
        setDeadline("");
        setShowDeadlineSection(false);
        toast.success("Item tugas berhasil ditambahkan.");
      } else {
        toast.error(result.error || "Gagal menambahkan item.");
      }
    });
  };

  return (
    <div className="mt-4 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
          <Plus size={14} weight="bold" />
          <span>Tambah Item Checklist</span>
        </h3>
        {maxDateObj && (
          <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 border border-amber-400">
            Batas Tugas: {formattedMaxDeadline}
          </span>
        )}
      </div>

      {/* Main Input Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          suppressHydrationWarning
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isPending && !isExceedingMax) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Tuliskan nama tugas / checklist item baru... (Tekan Enter)"
          className="flex-1 border-2 border-black px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:bg-yellow-50 disabled:opacity-60 font-medium"
          disabled={isPending}
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setShowDeadlineSection((v) => !v)}
            title="Atur tenggat waktu untuk item ini"
            className={`px-3 py-2 border-2 border-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deadline
                ? "bg-yellow-300 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : showDeadlineSection
                ? "bg-neutral-200 text-black"
                : "bg-white hover:bg-neutral-100 text-neutral-700"
            }`}
          >
            <Clock size={16} weight="bold" />
            <span className="hidden sm:inline">
              {deadline ? "Deadline Diatur" : "Atur Deadline"}
            </span>
          </button>

          <button
            suppressHydrationWarning
            type="button"
            onClick={submit}
            disabled={isPending || !content.trim() || isExceedingMax}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 min-w-[100px] cursor-pointer"
          >
            {isPending ? (
              <>
                <CircleNotch size={16} weight="bold" className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Plus size={16} weight="bold" />
                <span>Tambah</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Deadline Expandable Panel */}
      {showDeadlineSection && (
        <div className="p-3 border-2 border-dashed border-black/30 bg-yellow-50/60 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-black flex items-center gap-1">
              <Calendar size={14} weight="bold" />
              <span>Pilih Deadline Item:</span>
            </span>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setPresetDeadline("today")}
                className="px-2 py-0.5 text-[11px] font-bold border border-black bg-white hover:bg-yellow-200 cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setPresetDeadline("tomorrow")}
                className="px-2 py-0.5 text-[11px] font-bold border border-black bg-white hover:bg-yellow-200 cursor-pointer"
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => setPresetDeadline("3days")}
                className="px-2 py-0.5 text-[11px] font-bold border border-black bg-white hover:bg-yellow-200 cursor-pointer"
              >
                +3 Hari
              </button>
              {maxDeadlineISO && (
                <button
                  type="button"
                  onClick={() => setPresetDeadline("matchTask")}
                  className="px-2 py-0.5 text-[11px] font-black border border-black bg-amber-200 hover:bg-amber-300 cursor-pointer"
                  title="Samakan dengan batas waktu tugas utama"
                >
                  Batas Tugas
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              suppressHydrationWarning
              type="datetime-local"
              max={maxDeadlineISO}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`border-2 px-2.5 py-1 text-xs bg-white focus:outline-none font-mono ${
                isExceedingMax
                  ? "border-red-600 bg-red-50 text-red-900"
                  : "border-black focus:bg-yellow-50"
              }`}
            />

            {deadline && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setDeadline("")}
                className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 border border-black bg-white cursor-pointer inline-flex items-center gap-1"
              >
                <X size={12} weight="bold" />
                <span>Hapus</span>
              </button>
            )}

            {deadline && !isExceedingMax && (
              <div className="flex items-center gap-1">
                <DeadlineBadge deadline={new Date(deadline)} />
              </div>
            )}
          </div>

          {/* Validation Warning Alert */}
          {isExceedingMax && (
            <div className="p-2 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-bold flex items-center gap-1.5 animate-in shake">
              <WarningCircle size={16} weight="fill" className="text-red-600 shrink-0" />
              <span>
                Deadline item melebihi deadline tugas ({formattedMaxDeadline}). Silakan pilih waktu yang lebih awal.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
