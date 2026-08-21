export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUploadAuthParams } from "@imagekit/next/server";
import { uploadFile } from "@/lib/imagekit/upload";
import { deleteFile, deleteFileByUrl } from "@/lib/imagekit/delete";
import { MAX_FILE_SIZE_BYTES } from "@/config/app";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || "";
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "Konfigurasi ImageKit (API keys) belum lengkap." },
      { status: 500 }
    );
  }

  const authParams = getUploadAuthParams({
    publicKey,
    privateKey,
  });

  return NextResponse.json({
    ...authParams,
    publicKey,
    urlEndpoint,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "/denycode";

  if (!file) {
    return NextResponse.json(
      { error: "File tidak ditemukan." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Ukuran file melebihi batas maksimum 5MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(buffer, file.name, folder);
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  const fileUrl = searchParams.get("fileUrl");

  if (!fileId && !fileUrl) {
    return NextResponse.json(
      { error: "fileId atau fileUrl wajib disertakan." },
      { status: 400 }
    );
  }

  try {
    if (fileId) {
      await deleteFile(fileId);
    } else if (fileUrl) {
      await deleteFileByUrl(fileUrl);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal menghapus file dari ImageKit.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
