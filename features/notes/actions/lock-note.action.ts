"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, getSession } from "@/lib/auth/session";
import { noteLockService } from "@/features/notes/services/note-lock.service";
import { noteShareRepository } from "@/features/notes/repositories/note-share.repository";
import type { ActionResult } from "@/types/api";

export async function lockNoteAction(
  noteId: string,
  password: string
): Promise<ActionResult<{ isLocked: boolean }>> {
  await requireAuth();

  if (!password || password.trim().length < 4) {
    return { success: false, error: "Password minimal 4 karakter." };
  }

  const result = await noteLockService.lockNote(noteId, password.trim());
  if (!result.success) {
    return { success: false, error: result.error ?? "Gagal mengunci catatan." };
  }

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/notes");
  revalidatePath("/dashboard");

  return { success: true, data: { isLocked: true } };
}

export async function unlockNoteAction(
  noteId: string,
  password: string
): Promise<ActionResult<{ content: unknown }>> {
  // Authorization check: User must either have an active session or the note must be publicly shared
  const session = await getSession();
  if (!session) {
    const share = await noteShareRepository.findByNoteId(noteId);
    if (!share) {
      return {
        success: false,
        error: "Akses ditolak. Catatan ini bersifat privat dan memerlukan autentikasi.",
      };
    }
  }

  const result = await noteLockService.verifyAndDecrypt(noteId, password);
  if (!result.success) {
    return { success: false, error: result.error ?? "Password salah." };
  }

  return { success: true, data: { content: result.content } };
}


export async function saveLockedNoteAction(
  noteId: string,
  password: string,
  content: unknown
): Promise<ActionResult<{ saved: boolean }>> {
  await requireAuth();

  const result = await noteLockService.updateLockedContent(noteId, password, content);
  if (!result.success) {
    return { success: false, error: result.error ?? "Gagal menyimpan catatan terkunci." };
  }

  return { success: true, data: { saved: true } };
}

export async function removeLockAction(
  noteId: string,
  password: string
): Promise<ActionResult<{ isLocked: boolean }>> {
  await requireAuth();

  const result = await noteLockService.removeLock(noteId, password);
  if (!result.success) {
    return { success: false, error: result.error ?? "Password salah." };
  }

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/notes");
  revalidatePath("/dashboard");

  return { success: true, data: { isLocked: false } };
}

export async function resetNotePasswordAction(
  noteId: string,
  appPasswordInput: string,
  newNotePassword: string
): Promise<ActionResult<{ reset: boolean }>> {
  await requireAuth();

  const result = await noteLockService.resetPasswordWithAppPassword(
    noteId,
    appPasswordInput,
    newNotePassword
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Gagal mereset password note." };
  }

  return { success: true, data: { reset: true } };
}
