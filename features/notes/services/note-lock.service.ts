import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { envelopeEncrypt, envelopeDecrypt } from "@/lib/encryption/envelope";
import { hashPassword, comparePassword, safeEqual } from "@/lib/auth/password";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { NotFoundError } from "@/lib/errors";

const UNLOCK_MAX_ATTEMPTS = 5;
const UNLOCK_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const noteLockService = {
  async getLockStatus(noteId: string): Promise<{ isLocked: boolean }> {
    const lock = await noteLockRepository.findByNoteId(noteId);
    return { isLocked: !!lock };
  },

  async lockNote(
    noteId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const note = await noteRepository.findById(noteId);
    if (!note) throw new NotFoundError("Catatan tidak ditemukan.");

    const existingLock = await noteLockRepository.findByNoteId(noteId);
    if (existingLock) {
      return { success: false, error: "Catatan sudah dalam keadaan terkunci." };
    }

    if (!password || password.length < 4) {
      return { success: false, error: "Password minimal 4 karakter." };
    }

    const plaintext = JSON.stringify(note.content ?? {});
    const encrypted = envelopeEncrypt(plaintext);
    const passwordHash = await hashPassword(password);

    await noteLockRepository.create({
      noteId,
      passwordHash,
      contentCiphertext: encrypted.contentCiphertext,
      contentIv: encrypted.contentIv,
      contentAuthTag: encrypted.contentAuthTag,
      dekWrapped: encrypted.dekWrapped,
      dekWrapIv: encrypted.dekWrapIv,
      dekWrapAuthTag: encrypted.dekWrapAuthTag,
    });

    // Nullify plaintext in notes table for security & search vector isolation
    await noteRepository.update(noteId, { content: null });

    return { success: true };
  },

  async verifyAndDecrypt(
    noteId: string,
    password: string
  ): Promise<{ success: boolean; content?: unknown; error?: string }> {
    const rateLimitKey = `unlock:${noteId}`;
    const { allowed, retryAfterMs } = checkRateLimit(
      rateLimitKey,
      UNLOCK_MAX_ATTEMPTS,
      UNLOCK_WINDOW_MS
    );

    if (!allowed) {
      const minutes = Math.ceil(retryAfterMs / 60000);
      return {
        success: false,
        error: `Terlalu banyak percobaan kata sandi. Coba lagi dalam ${minutes} menit.`,
      };
    }

    const lock = await noteLockRepository.findByNoteId(noteId);
    if (!lock) {
      return { success: false, error: "Catatan tidak terkunci." };
    }

    const isValid = await comparePassword(password, lock.passwordHash);
    if (!isValid) {
      return { success: false, error: "Password salah. Silakan coba lagi." };
    }

    // Reset rate limit counter on successful verification
    resetRateLimit(rateLimitKey);

    try {
      const plaintext = envelopeDecrypt({
        contentCiphertext: lock.contentCiphertext,
        contentIv: lock.contentIv,
        contentAuthTag: lock.contentAuthTag,
        dekWrapped: lock.dekWrapped,
        dekWrapIv: lock.dekWrapIv,
        dekWrapAuthTag: lock.dekWrapAuthTag,
      });

      const parsed = JSON.parse(plaintext);
      return { success: true, content: parsed };
    } catch (err) {
      console.error("[NoteLockService] Decryption failed:", err);
      return {
        success: false,
        error: "Gagal mendekripsi catatan. Master key mungkin telah berubah.",
      };
    }
  },

  async updateLockedContent(
    noteId: string,
    password: string,
    newContent: unknown
  ): Promise<{ success: boolean; error?: string }> {
    const lock = await noteLockRepository.findByNoteId(noteId);
    if (!lock) {
      return { success: false, error: "Catatan tidak terkunci." };
    }

    const isValid = await comparePassword(password, lock.passwordHash);
    if (!isValid) {
      return { success: false, error: "Otorisasi password catatan gagal." };
    }

    const plaintext = JSON.stringify(newContent ?? {});
    const encrypted = envelopeEncrypt(plaintext);

    await noteLockRepository.updateEncryptedContent(noteId, {
      contentCiphertext: encrypted.contentCiphertext,
      contentIv: encrypted.contentIv,
      contentAuthTag: encrypted.contentAuthTag,
      dekWrapped: encrypted.dekWrapped,
      dekWrapIv: encrypted.dekWrapIv,
      dekWrapAuthTag: encrypted.dekWrapAuthTag,
    });

    return { success: true };
  },

  async removeLock(
    noteId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const lock = await noteLockRepository.findByNoteId(noteId);
    if (!lock) {
      return { success: false, error: "Catatan tidak terkunci." };
    }

    const isValid = await comparePassword(password, lock.passwordHash);
    if (!isValid) {
      return { success: false, error: "Password salah. Tidak dapat menghapus kunci." };
    }

    try {
      const plaintext = envelopeDecrypt({
        contentCiphertext: lock.contentCiphertext,
        contentIv: lock.contentIv,
        contentAuthTag: lock.contentAuthTag,
        dekWrapped: lock.dekWrapped,
        dekWrapIv: lock.dekWrapIv,
        dekWrapAuthTag: lock.dekWrapAuthTag,
      });

      const content = JSON.parse(plaintext);

      // Restore plaintext to notes table and remove lock entry
      await noteRepository.update(noteId, { content });
      await noteLockRepository.delete(noteId);

      // Reset any active rate limit counters for this note
      resetRateLimit(`unlock:${noteId}`);

      return { success: true };
    } catch (err) {
      console.error("[NoteLockService] Decryption during remove lock failed:", err);
      return { success: false, error: "Gagal memulihkan konten catatan." };
    }
  },

  async resetPasswordWithAppPassword(
    noteId: string,
    appPasswordInput: string,
    newNotePassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const rateLimitKey = `reset_lock:${noteId}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000);
    if (!allowed) {
      const minutes = Math.ceil(retryAfterMs / 60000);
      return {
        success: false,
        error: `Terlalu banyak percobaan reset. Coba lagi dalam ${minutes} menit.`,
      };
    }

    const lock = await noteLockRepository.findByNoteId(noteId);
    if (!lock) {
      return { success: false, error: "Catatan tidak dalam status terkunci." };
    }

    // Safe constant-time comparison against app password to avoid timing attacks
    const isAppPasswordValid = safeEqual(appPasswordInput, process.env.APP_PASSWORD);
    if (!isAppPasswordValid) {
      return { success: false, error: "Password aplikasi salah. Otorisasi reset ditolak." };
    }

    if (!newNotePassword || newNotePassword.length < 4) {
      return { success: false, error: "Password baru minimal 4 karakter." };
    }

    const newHash = await hashPassword(newNotePassword);
    await noteLockRepository.updatePasswordHash(noteId, newHash);

    // Reset rate limits on successful password reset
    resetRateLimit(rateLimitKey);
    resetRateLimit(`unlock:${noteId}`);

    return { success: true };
  },
};

