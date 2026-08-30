import { NextResponse } from "next/server";
import { folderShareService } from "@/features/folders/services/folder-share.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; noteId: string }> }
) {
  try {
    const { slug, noteId } = await params;
    const data = await folderShareService.getPublicFolderNoteDetail(slug, noteId);

    if (!data) {
      return NextResponse.json({ error: "Catatan tidak ditemukan di folder publik ini." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data catatan." }, { status: 500 });
  }
}
