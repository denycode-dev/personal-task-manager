export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { noteShareService, extractNoteExcerpt } from "@/features/notes/services/note-share.service";
import { PublicNoteViewer } from "@/features/notes/components/public-note-viewer";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { APP_NAME } from "@/config/app";

interface PublicNotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PublicNotePageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const data = await noteShareService.getPublicNote(slug);

  if (!data) {
    return {
      title: `Catatan Tidak Ditemukan — ${APP_NAME}`,
      description: "Catatan publik tidak ditemukan atau tautan telah dinonaktifkan.",
      robots: {
        index: false,
        follow: false,
        noarchive: true,
        nocache: true,
      },
    };
  }

  const rawTitle = data.note.title?.trim();
  const noteTitle = rawTitle && rawTitle.length > 0 ? rawTitle : "Catatan Tanpa Judul";
  const title = `${noteTitle} — ${APP_NAME}`;
  const description = extractNoteExcerpt(data.note.content, data.isLocked, 160);

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      siteName: APP_NAME,
      publishedTime: data.note.createdAt ? new Date(data.note.createdAt).toISOString() : undefined,
      modifiedTime: new Date(data.note.updatedAt).toISOString(),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `/notes/public/${slug}`,
    },
  };
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
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
