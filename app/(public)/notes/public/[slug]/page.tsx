export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { noteShareService, extractNoteExcerpt } from "@/features/notes/services/note-share.service";
import { PublicNoteViewer } from "@/features/notes/components/public-note-viewer";
import { APP_NAME } from "@/config/app";

interface PublicNotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PublicNotePageProps
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
    <PublicNoteViewer
      noteId={data.note.id}
      title={data.note.title}
      initialContent={data.note.content}
      isLocked={data.isLocked}
      updatedAt={data.note.updatedAt}
    />
  );
}
