"use server";

import { revalidatePath } from "next/cache";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { noteLockService } from "@/features/notes/services/note-lock.service";
import type { ActionResult } from "@/types/api";

export interface SavePublicNoteInput {
  slug: string;
  noteId: string;
  content: unknown;
  baseVersion?: number;
  force?: boolean;
  password?: string;
  title?: string;
}

export interface SavePublicNoteSuccess {
  saved: true;
  version: number;
  updatedAt: Date;
}

export interface SavePublicNoteConflict {
  saved: false;
  conflict: true;
  serverVersion: number;
  serverUpdatedAt: Date;
  serverContent: unknown | null;
}

export type SavePublicNoteResult = SavePublicNoteSuccess | SavePublicNoteConflict;

/**
 * Menyimpan perubahan catatan publik dengan Optimistic Concurrency Control (OCC).
 * Mencegah "Lost Update" saat banyak pengguna mengedit catatan yang sama bersamaan.
 */
export async function savePublicNoteAction(
  input: SavePublicNoteInput
): Promise<ActionResult<SavePublicNoteResult>> {
  const { slug, noteId, content, baseVersion, force = false, password, title } = input;

  if (!slug || !noteId) {
    return { success: false, error: "Parameter tidak lengkap." };
  }

  // 1. Validasi keberadaan tautan share dan izin edit publik
  const share = await noteShareRepository.findBySlug(slug);
  if (!share || share.noteId !== noteId) {
    return {
      success: false,
      error: "Tautan publik tidak valid atau sudah dinonaktifkan.",
    };
  }

  if (!share.isEditable) {
    return {
      success: false,
      error: "Catatan ini hanya dapat dibaca dan tidak mengizinkan pengeditan publik.",
    };
  }

  // 2. Periksa apakah catatan dilindungi enkripsi (password)
  const lock = await noteLockRepository.findByNoteId(noteId);
  if (lock) {
    if (!password) {
      return {
        success: false,
        error: "Kata sandi diperlukan untuk menyimpan catatan terenkripsi.",
      };
    }

    // OCC pre-check untuk catatan terkunci jika baseVersion disertakan dan bukan force
    if (baseVersion !== undefined && !force) {
      const currentNote = await noteRepository.findById(noteId);
      if (currentNote && currentNote.version !== baseVersion) {
        // Terjadi konflik: pengguna lain telah mengedit terlebih dahulu
        const decryptRes = await noteLockService.verifyAndDecrypt(noteId, password);
        return {
          success: true,
          data: {
            saved: false,
            conflict: true,
            serverVersion: currentNote.version,
            serverUpdatedAt: currentNote.updatedAt,
            serverContent: decryptRes.success ? decryptRes.content : null,
          },
        };
      }
    }

    const lockResult = await noteLockService.updateLockedContent(
      noteId,
      password,
      content
    );

    if (!lockResult.success) {
      return {
        success: false,
        error: lockResult.error ?? "Kata sandi catatan tidak valid.",
      };
    }

    // Perbarui timestamp & version di tabel notes
    let updatedNote;
    if (baseVersion !== undefined && !force) {
      updatedNote = await noteRepository.updateWithVersion(noteId, baseVersion, {
        ...(title !== undefined && title.trim().length > 0 ? { title: title.trim() } : {}),
      });

      // Jika updateWithVersion menghasilkan undefined (race condition), tangani sebagai konflik
      if (!updatedNote) {
        const freshNote = await noteRepository.findById(noteId);
        const decryptRes = await noteLockService.verifyAndDecrypt(noteId, password);
        return {
          success: true,
          data: {
            saved: false,
            conflict: true,
            serverVersion: freshNote?.version ?? (baseVersion + 1),
            serverUpdatedAt: freshNote?.updatedAt ?? new Date(),
            serverContent: decryptRes.success ? decryptRes.content : null,
          },
        };
      }
    } else {
      updatedNote = await noteRepository.update(noteId, {
        ...(title !== undefined && title.trim().length > 0 ? { title: title.trim() } : {}),
      });
    }

    revalidatePath(`/notes/public/${slug}`);
    revalidatePath(`/notes/${noteId}`);
    revalidatePath("/notes");

    return {
      success: true,
      data: {
        saved: true,
        version: updatedNote?.version ?? 1,
        updatedAt: updatedNote?.updatedAt ?? new Date(),
      },
    };
  }

  // 3. Catatan publik tidak terkunci: simpan dengan OCC atomic update di Postgres
  if (baseVersion !== undefined && !force) {
    const updatedNote = await noteRepository.updateWithVersion(noteId, baseVersion, {
      content,
      ...(title !== undefined && title.trim().length > 0 ? { title: title.trim() } : {}),
    });

    // Jika baris yang terupdate = 0 (undefined), berarti ada pengguna lain yang menyimpan duluan
    if (!updatedNote) {
      const currentNote = await noteRepository.findById(noteId);
      return {
        success: true,
        data: {
          saved: false,
          conflict: true,
          serverVersion: currentNote?.version ?? (baseVersion + 1),
          serverUpdatedAt: currentNote?.updatedAt ?? new Date(),
          serverContent: currentNote?.content ?? null,
        },
      };
    }

    revalidatePath(`/notes/public/${slug}`);
    revalidatePath(`/notes/${noteId}`);
    revalidatePath("/notes");

    return {
      success: true,
      data: {
        saved: true,
        version: updatedNote.version,
        updatedAt: updatedNote.updatedAt,
      },
    };
  }

  // 4. Force save / unversioned fallback
  const updatedNote = await noteRepository.update(noteId, {
    content,
    ...(title !== undefined && title.trim().length > 0 ? { title: title.trim() } : {}),
  });

  revalidatePath(`/notes/public/${slug}`);
  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/notes");

  return {
    success: true,
    data: {
      saved: true,
      version: updatedNote?.version ?? 1,
      updatedAt: updatedNote?.updatedAt ?? new Date(),
    },
  };
}

interface SyncPublicNoteInput {
  slug: string;
  noteId: string;
  lastUpdatedAt?: string | Date;
  lastVersion?: number;
  password?: string;
}

export async function syncPublicNoteAction(
  input: SyncPublicNoteInput
): Promise<
  ActionResult<{
    isUpdated: boolean;
    version: number;
    updatedAt: Date;
    content?: unknown | null;
    title?: string;
  }>
> {
  const { slug, noteId, lastUpdatedAt, lastVersion, password } = input;

  if (!slug || !noteId) {
    return { success: false, error: "Parameter tidak lengkap." };
  }

  // 1. Validasi keberadaan tautan share
  const share = await noteShareRepository.findBySlug(slug);
  if (!share || share.noteId !== noteId) {
    return {
      success: false,
      error: "Tautan publik tidak valid atau sudah dinonaktifkan.",
    };
  }

  // 2. Ambil catatan terbaru dari database
  const note = await noteRepository.findById(noteId);
  if (!note) {
    return { success: false, error: "Catatan tidak ditemukan." };
  }

  // 3. Bandingkan version dan timestamp
  if (lastVersion !== undefined && note.version === lastVersion) {
    return {
      success: true,
      data: {
        isUpdated: false,
        version: note.version,
        updatedAt: note.updatedAt,
      },
    };
  }

  if (lastUpdatedAt && lastVersion === undefined) {
    const localTime = new Date(lastUpdatedAt).getTime();
    const serverTime = new Date(note.updatedAt).getTime();
    if (serverTime <= localTime) {
      return {
        success: true,
        data: {
          isUpdated: false,
          version: note.version,
          updatedAt: note.updatedAt,
        },
      };
    }
  }

  // 4. Ada pembaruan: periksa enkripsi jika catatan terkunci
  const lock = await noteLockRepository.findByNoteId(noteId);
  if (lock) {
    if (!password) {
      return {
        success: true,
        data: {
          isUpdated: true,
          version: note.version,
          updatedAt: note.updatedAt,
          title: note.title,
          content: null,
        },
      };
    }

    const decryptRes = await noteLockService.verifyAndDecrypt(noteId, password);
    if (!decryptRes.success) {
      return {
        success: false,
        error: decryptRes.error ?? "Gagal mendekripsi catatan terkunci.",
      };
    }

    return {
      success: true,
      data: {
        isUpdated: true,
        version: note.version,
        updatedAt: note.updatedAt,
        title: note.title,
        content: decryptRes.content,
      },
    };
  }

  // 5. Catatan tidak terkunci: kirim konten terbaru beserta version
  return {
    success: true,
    data: {
      isUpdated: true,
      version: note.version,
      updatedAt: note.updatedAt,
      title: note.title,
      content: note.content,
    },
  };
}
