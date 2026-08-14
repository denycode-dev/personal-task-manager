export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { noteShareService } from "@/features/notes/services/note-share.service";
import { PublicNoteViewer } from "@/features/notes/components/public-note-viewer";
import { Sparkle, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function PublicNotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await noteShareService.getPublicNote(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-neutral-50 text-black flex flex-col justify-between">
      <div>
        {/* Public Header */}
        <header className="border-b-2 border-black bg-white px-4 sm:px-6 py-3 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black uppercase bg-yellow-400 border border-black">
                <Sparkle size={12} weight="fill" />
                Denycode
              </span>
              <span className="font-bold text-xs sm:text-sm text-black">
                Task Manager
              </span>
            </div>

            <span className="text-[11px] font-bold text-neutral-600 px-2 py-0.5 bg-neutral-100 border border-neutral-300">
              Catatan Publik (Read-Only)
            </span>
          </div>
        </header>

        {/* Public Note Body */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="p-6 sm:p-8 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <PublicNoteViewer
              noteId={data.note.id}
              title={data.note.title}
              initialContent={data.note.content}
              isLocked={data.isLocked}
              updatedAt={data.note.updatedAt}
            />
          </div>
        </main>
      </div>

      {/* Public Footer */}
      <footer className="border-t-2 border-black bg-white px-4 py-4 text-center text-xs font-semibold text-neutral-600">
        <p>Denycode Task Manager • Personal productivity workspace</p>
      </footer>
    </div>
  );
}
