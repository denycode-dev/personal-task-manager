export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { noteService } from "@/features/notes/services/note.service";
import { noteLockService } from "@/features/notes/services/note-lock.service";
import { noteShareService } from "@/features/notes/services/note-share.service";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import { NoteEditor } from "@/features/notes/components/note-editor";
import { NoteFolderPicker } from "@/features/notes/components/note-folder-picker";
import { NoteShareDialog } from "@/features/notes/components/note-share-dialog";
import { NoteLockDialog } from "@/features/notes/components/note-lock-dialog";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { deleteNoteAction } from "@/features/notes/actions/delete-note.action";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { APP_NAME } from "@/config/app";
import Link from "next/link";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: NotePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const note = await noteService.getById(id);
    const title = note.title?.trim() || "Catatan";
    return {
      title: `${title} — ${APP_NAME}`,
    };
  } catch {
    return {
      title: `Catatan — ${APP_NAME}`,
    };
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;

  let note;
  try {
    note = await noteService.getById(id);
  } catch {
    notFound();
  }

  const [folders, lockStatus, shareStatus] = await Promise.all([
    folderRepository.findAll(),
    noteLockService.getLockStatus(id),
    noteShareService.getShareByNoteId(id),
  ]);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-black/20 bg-white text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/notes"
            className="text-muted-foreground hover:text-black flex items-center gap-1 shrink-0 font-medium"
          >
            <ArrowLeft size={16} weight="bold" />
            <span className="hidden sm:inline">Catatan</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="truncate font-bold text-black max-w-[150px] sm:max-w-[280px]">
            {note.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <NoteFolderPicker
            noteId={id}
            currentFolderId={note.folderId}
            folders={folders}
          />

          <NoteShareDialog
            noteId={id}
            noteTitle={note.title}
            initialIsShared={shareStatus.isShared}
            initialSlug={shareStatus.publicSlug}
          />

          <NoteLockDialog
            noteId={id}
            isLocked={lockStatus.isLocked}
          />

          <DeleteConfirmButton
            action={deleteNoteAction.bind(null, id)}
            confirmTitle="Hapus Catatan"
            confirmMessage={`Hapus catatan "${note.title}"? Tindakan ini akan menghapus catatan secara permanen.`}
          />
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor key={note.id} note={note} isLocked={lockStatus.isLocked} />
      </div>
    </div>
  );
}
