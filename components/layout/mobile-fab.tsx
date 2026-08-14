"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  X,
  Note,
  Kanban,
  CheckSquare,
  CalendarBlank,
  Folder,
} from "@phosphor-icons/react";
import { createBoardAction } from "@/features/kanban/actions/board.action";
import { createChecklistAction } from "@/features/checklists/actions/checklist.action";
import { createTimelineEventAction } from "@/features/timeline/actions/timeline.action";
import { createFolderAction } from "@/features/folders/actions/folder.action";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type QuickModalType = "board" | "checklist" | "event" | "folder" | null;

export function MobileFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<QuickModalType>(null);
  const [titleInput, setTitleInput] = useState("");
  const [startAtInput, setStartAtInput] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [folderColor, setFolderColor] = useState("#FFD500");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // If user is inside note editor (/notes/[id] or /notes/new), hide the FAB to prevent obstruction
  if (pathname.startsWith("/notes/") || pathname === "/notes/new") {
    return null;
  }

  const handleActionClick = (action: "note" | "board" | "checklist" | "event" | "folder") => {
    setIsOpen(false);
    if (action === "note") {
      router.push("/notes/new");
    } else {
      setTitleInput("");
      setStartAtInput(new Date().toISOString().slice(0, 16));
      setModalType(action);
    }
  };

  const handleCreateBoard = () => {
    if (!titleInput.trim()) return;
    startTransition(async () => {
      const res = await createBoardAction({ title: titleInput.trim() });
      if (res.success) {
        toast.success("Papan Kanban berhasil dibuat.");
        setModalType(null);
        router.push(`/kanban/${res.data.id}`);
      } else {
        toast.error(res.error ?? "Gagal membuat board.");
      }
    });
  };

  const handleCreateChecklist = () => {
    if (!titleInput.trim()) return;
    startTransition(async () => {
      const res = await createChecklistAction(titleInput.trim());
      if (res.success) {
        toast.success("Checklist berhasil dibuat.");
        setModalType(null);
        router.push(`/checklists/${res.data.id}`);
      } else {
        toast.error(res.error ?? "Gagal membuat checklist.");
      }
    });
  };

  const handleCreateEvent = () => {
    if (!titleInput.trim() || !startAtInput) return;
    startTransition(async () => {
      const res = await createTimelineEventAction({
        title: titleInput.trim(),
        startAt: startAtInput,
        color: "#F72585",
      });
      if (res.success) {
        toast.success("Event kalender berhasil ditambahkan.");
        setModalType(null);
        if (pathname === "/calendar") {
          window.location.reload();
        } else {
          router.push("/calendar");
        }
      } else {
        toast.error(res.error ?? "Gagal membuat event.");
      }
    });
  };

  const handleCreateFolder = () => {
    if (!titleInput.trim()) return;
    startTransition(async () => {
      const res = await createFolderAction({
        name: titleInput.trim(),
        color: folderColor,
      });
      if (res.success) {
        toast.success("Folder berhasil dibuat.");
        setModalType(null);
        if (pathname === "/folders") {
          window.location.reload();
        } else {
          router.push("/folders");
        }
      } else {
        toast.error(res.error ?? "Gagal membuat folder.");
      }
    });
  };

  return (
    <>
      {/* Backdrop overlay when speed dial is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="md:hidden fixed bottom-36 right-4 z-50 flex flex-col items-end gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => handleActionClick("note")}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-black active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Tulis Catatan</span>
            <span className="p-1 bg-white border border-black">
              <Note size={16} weight="bold" />
            </span>
          </button>

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => handleActionClick("board")}
            className="flex items-center gap-2 px-3 py-2 bg-blue-200 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-black active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Papan Kanban</span>
            <span className="p-1 bg-white border border-black">
              <Kanban size={16} weight="bold" />
            </span>
          </button>

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => handleActionClick("checklist")}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-200 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-black active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Checklist Baru</span>
            <span className="p-1 bg-white border border-black">
              <CheckSquare size={16} weight="bold" />
            </span>
          </button>

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => handleActionClick("event")}
            className="flex items-center gap-2 px-3 py-2 bg-pink-200 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-black active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Event Kalender</span>
            <span className="p-1 bg-white border border-black">
              <CalendarBlank size={16} weight="bold" />
            </span>
          </button>

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => handleActionClick("folder")}
            className="flex items-center gap-2 px-3 py-2 bg-purple-200 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-black active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Folder Baru</span>
            <span className="p-1 bg-white border border-black">
              <Folder size={16} weight="bold" />
            </span>
          </button>
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`md:hidden fixed bottom-20 right-4 z-50 w-13 h-13 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-black text-yellow-400 rotate-45 scale-105"
            : "bg-yellow-400 hover:bg-yellow-300 text-black active:translate-x-0.5 active:translate-y-0.5"
        }`}
        aria-label={isOpen ? "Tutup menu tambah" : "Menu tambah cepat"}
      >
        <Plus size={28} weight="bold" />
      </button>

      {/* Quick Create Dialogs */}
      <Dialog open={modalType !== null} onOpenChange={(o) => !o && setModalType(null)}>
        <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm bg-white p-5 space-y-3">
          <DialogHeader className="border-b-2 border-black pb-2">
            <DialogTitle className="font-black text-base text-black">
              {modalType === "board" && "Buat Papan Kanban"}
              {modalType === "checklist" && "Buat Checklist Baru"}
              {modalType === "event" && "Tambah Event Kalender"}
              {modalType === "folder" && "Buat Folder Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1 text-xs">
            <div>
              <label className="font-bold text-black block mb-1">
                {modalType === "folder" ? "Nama Folder *" : "Judul *"}
              </label>
              <input
                suppressHydrationWarning
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder={
                  modalType === "board"
                    ? "Nama papan..."
                    : modalType === "checklist"
                      ? "Nama checklist..."
                      : modalType === "event"
                        ? "Nama event..."
                        : "Nama folder..."
                }
                className="w-full border-2 border-black px-3 py-2 text-xs focus:outline-none focus:bg-yellow-50"
              />
            </div>

            {modalType === "event" && (
              <div>
                <label className="font-bold text-black block mb-1">Waktu Mulai *</label>
                <input
                  suppressHydrationWarning
                  type="datetime-local"
                  value={startAtInput}
                  onChange={(e) => setStartAtInput(e.target.value)}
                  className="w-full border-2 border-black px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
            )}

            {modalType === "folder" && (
              <div>
                <label className="font-bold text-black block mb-1.5">Warna Penanda</label>
                <div className="flex gap-1.5 flex-wrap">
                  {["#FFD500", "#FF6B6B", "#4361EE", "#06D6A0", "#7209B7", "#FF9F1C"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFolderColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 border-2 ${
                          folderColor === c ? "border-black scale-125 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "border-transparent"
                        }`}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black/10">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100"
              >
                Batal
              </button>
              <button
                suppressHydrationWarning
                type="button"
                disabled={isPending || !titleInput.trim()}
                onClick={() => {
                  if (modalType === "board") handleCreateBoard();
                  if (modalType === "checklist") handleCreateChecklist();
                  if (modalType === "event") handleCreateEvent();
                  if (modalType === "folder") handleCreateFolder();
                }}
                className="px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isPending ? "Membuat..." : "Buat Sekarang"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
