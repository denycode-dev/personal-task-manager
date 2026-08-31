export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { folderShareService } from "@/features/folders/services/folder-share.service";
import { PublicFolderViewer } from "@/features/folders/components/public-folder-viewer";
import { APP_NAME } from "@/config/app";

interface PublicFolderPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PublicFolderPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const data = await folderShareService.getPublicFolder(slug);

  if (!data) {
    return {
      title: `Folder Tidak Ditemukan — ${APP_NAME}`,
      description: "Folder publik tidak ditemukan atau tautan telah dinonaktifkan.",
      robots: {
        index: false,
        follow: false,
        noarchive: true,
        nocache: true,
      },
    };
  }

  const folderName = data.folder.name?.trim() || "Folder Tanpa Judul";
  const title = `Folder: ${folderName} (${data.totalNotes} Catatan) — ${APP_NAME}`;
  const description = `Koleksi ${data.totalNotes} catatan publik dalam folder "${folderName}" di ${APP_NAME}.`;

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
      type: "website",
      siteName: APP_NAME,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `/folders/public/${slug}`,
    },
  };
}

export default async function PublicFolderPage({ params }: PublicFolderPageProps) {
  const { slug } = await params;

  const data = await folderShareService.getPublicFolder(slug);
  if (!data) notFound();

  return (
    <PublicFolderViewer
      folder={data.folder}
      breadcrumbs={data.breadcrumbs}
      subfolders={data.subfolders}
      notes={data.notes}
      slug={slug}
    />
  );
}
