export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function NotesPublicFolderAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/folders/public/${slug}`);
}
