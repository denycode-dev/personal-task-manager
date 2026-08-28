"use server";

import { revalidatePath } from "next/cache";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import { noteRepository } from "@/features/notes/repositories/note.repository";
import { noteLockRepository } from "@/features/notes/repositories/note-lock.repository";
import { noteLockService } from "@/features/notes/services/note-lock.service";
import type { ActionResult } from "@/types/api";

interface SavePublicNoteInput {
  slug: string;
  noteId: string;
  content: unknown;
  password?: string;
  title?: string;
}

export async function savePublicNoteAction(
  input: SavePublicNoteInput
): Promise<ActionResult<{ saved: boolean; updatedAt: Date }>> {
  const { slug, noteId, content, password, title } = input;

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

    // Perbarui timestamp (dan judul jika ada) di tabel notes
    const updatedNote = await noteRepository.update(noteId, {
      ...(title !== undefined && title.trim().length > 0
        ? { title: title.trim() }
        : {}),
      updatedAt: new Date(),
    });

    revalidatePath(`/notes/public/${slug}`);
    revalidatePath(`/notes/${noteId}`);
    revalidatePath("/notes");

    return {
      success: true,
      data: {
        saved: true,
        updatedAt: updatedNote?.updatedAt ?? new Date(),
      },
    };
  }

  // 3. Catatan publik tidak terkunci: simpan konten langsung
  const updatedNote = await noteRepository.update(noteId, {
    content,
    ...(title !== undefined && title.trim().length > 0
      ? { title: title.trim() }
      : {}),
    updatedAt: new Date(),
  });

  revalidatePath(`/notes/public/${slug}`);
  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/notes");

  return {
    success: true,
    data: {
      saved: true,
      updatedAt: updatedNote?.updatedAt ?? new Date(),
    },
  };
}

interface SyncPublicNoteInput {
  slug: string;
  noteId: string;
  lastUpdatedAt?: string | Date;
  password?: string;
}

export async function syncPublicNoteAction(
  input: SyncPublicNoteInput
): Promise<
  ActionResult<{
    isUpdated: boolean;
    updatedAt: Date;
    content?: unknown | null;
    title?: string;
  }>
> {
  const { slug, noteId, lastUpdatedAt, password } = input;

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

  // 3. Bandingkan timestamp updatedAt
  if (lastUpdatedAt) {
    const localTime = new Date(lastUpdatedAt).getTime();
    const serverTime = new Date(note.updatedAt).getTime();
    // Jika tidak ada perubahan baru di server, kembalikan isUpdated: false tanpa mentransfer data besar
    if (serverTime <= localTime) {
      return {
        success: true,
        data: {
          isUpdated: false,
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
        updatedAt: note.updatedAt,
        title: note.title,
        content: decryptRes.content,
      },
    };
  }

  // 5. Catatan tidak terkunci: kirim konten terbaru
  return {
    success: true,
    data: {
      isUpdated: true,
      updatedAt: note.updatedAt,
      title: note.title,
      content: note.content,
    },
  };
}
