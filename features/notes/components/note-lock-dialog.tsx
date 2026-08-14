"use client";

import { useState, useTransition } from "react";
import { Lock, LockOpen, Key, X, ShieldCheck, ArrowCounterClockwise } from "@phosphor-icons/react";
import { lockNoteAction, removeLockAction, resetNotePasswordAction } from "@/features/notes/actions/lock-note.action";
import { toast } from "sonner";

interface NoteLockDialogProps {
  noteId: string;
  isLocked: boolean;
  onLockStatusChanged?: (isLocked: boolean) => void;
}

export function NoteLockDialog({
  noteId,
  isLocked,
  onLockStatusChanged,
}: NoteLockDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"lock" | "remove" | "reset">("lock");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      toast.error("Password minimal 4 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    startTransition(async () => {
      const res = await lockNoteAction(noteId, password);
      if (res.success) {
        toast.success("Catatan berhasil dikunci dengan enkripsi AES-256!");
        setPassword("");
        setConfirmPassword("");
        setIsOpen(false);
        onLockStatusChanged?.(true);
      } else {
        toast.error(res.error ?? "Gagal mengunci catatan.");
      }
    });
  };

  const handleRemoveLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Masukkan password catatan.");
      return;
    }

    startTransition(async () => {
      const res = await removeLockAction(noteId, password);
      if (res.success) {
        toast.success("Kunci catatan berhasil dihapus permanen.");
        setPassword("");
        setIsOpen(false);
        onLockStatusChanged?.(false);
      } else {
        toast.error(res.error ?? "Password salah. Gagal menghapus kunci.");
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appPassword) {
      toast.error("Masukkan password aplikasi.");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password baru minimal 4 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await resetNotePasswordAction(noteId, appPassword, newPassword);
      if (res.success) {
        toast.success("Password catatan berhasil direset!");
        setAppPassword("");
        setNewPassword("");
        setMode("lock");
        setIsOpen(false);
      } else {
        toast.error(res.error ?? "Password aplikasi salah.");
      }
    });
  };

  return (
    <>
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => {
          setMode(isLocked ? "remove" : "lock");
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform ${
          isLocked
            ? "bg-rose-400 text-black hover:bg-rose-300"
            : "bg-white hover:bg-neutral-100 text-black"
        }`}
        title={isLocked ? "Kelola Kunci Catatan" : "Kunci Catatan"}
      >
        {isLocked ? <Lock size={14} weight="fill" /> : <LockOpen size={14} weight="bold" />}
        <span className="hidden sm:inline">{isLocked ? "Terkunci" : "Kunci"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`p-1.5 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black ${
                    isLocked ? "bg-rose-300" : "bg-yellow-300"
                  }`}
                >
                  <Key size={18} weight="bold" />
                </span>
                <h3 className="font-black text-base text-black">
                  {mode === "lock"
                    ? "Kunci Catatan Ini"
                    : mode === "remove"
                      ? "Hapus Kunci Catatan"
                      : "Reset Password Catatan"}
                </h3>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 border border-black"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Mode 1: Lock Note */}
            {mode === "lock" && (
              <form onSubmit={handleLock} className="space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Isi catatan akan dienkripsi dengan <strong>AES-256 Envelope Encryption</strong>. Hanya mereka yang mengetahui password ini yang dapat membuka atau mengedit isi catatan.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Password Catatan</label>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Konfirmasi Password</label>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    minLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password di atas"
                    className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200"
                  >
                    Batal
                  </button>
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-1.5 text-xs font-black bg-rose-400 hover:bg-rose-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {isPending ? "Mengunci..." : "Kunci Catatan"}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Remove Lock */}
            {mode === "remove" && (
              <form onSubmit={handleRemoveLock} className="space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Masukkan password catatan saat ini untuk mendekripsi dan membuka kunci catatan secara permanen.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Password Catatan</label>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password catatan"
                    className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-xs font-bold text-black underline flex items-center gap-1"
                  >
                    <ArrowCounterClockwise size={13} weight="bold" />
                    <span>Lupa Password?</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200"
                    >
                      Batal
                    </button>
                    <button
                      suppressHydrationWarning
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {isPending ? "Membuka..." : "Buka Kunci Permanen"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Mode 3: Reset Password via App Password */}
            {mode === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Sebagai pemilik aplikasi, Anda dapat mereset password catatan yang terkunci dengan memverifikasi <strong>Password Global Aplikasi</strong>.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Password Aplikasi (Global)</label>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="Password login aplikasi"
                    className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Password Baru Catatan</label>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru (min 4 karakter)"
                    className="w-full px-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setMode("remove")}
                    className="text-xs font-bold text-muted-foreground hover:text-black"
                  >
                    Kembali
                  </button>

                  <div className="flex gap-2">
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200"
                    >
                      Batal
                    </button>
                    <button
                      suppressHydrationWarning
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-1.5 text-xs font-black bg-emerald-400 hover:bg-emerald-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {isPending ? "Mereset..." : "Simpan Password Baru"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
