import { upload } from "@imagekit/next";
import { MAX_FILE_SIZE_BYTES } from "@/config/app";

export interface ClientUploadResult {
  fileId: string;
  url: string;
  name: string;
  size: number;
  fileType: string;
  thumbnailUrl?: string;
}

export interface ClientUploadOptions {
  folder?: string;
  tags?: string[];
  onProgress?: (event: ProgressEvent) => void;
  abortSignal?: AbortSignal;
}

/**
 * Mengunggah file ke ImageKit dari sisi client menggunakan SDK resmi @imagekit/next.
 * Parameter otentikasi (token, signature, expire) diambil secara aman dari server Route Handler.
 */
export async function uploadClientFile(
  file: File,
  options: ClientUploadOptions = {}
): Promise<ClientUploadResult> {
  const { folder = "/denycode", tags, onProgress, abortSignal } = options;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Ukuran file melebihi batas maksimum ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`
    );
  }

  // 1. Dapatkan parameter otentikasi dari server
  const authRes = await fetch("/api/upload/imagekit", {
    method: "GET",
  });

  if (!authRes.ok) {
    const errorData = await authRes.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Gagal mendapatkan parameter otentikasi ImageKit dari server."
    );
  }

  const { token, expire, signature, publicKey } = await authRes.json();

  if (!token || !expire || !signature || !publicKey) {
    throw new Error("Parameter otentikasi ImageKit tidak valid.");
  }

  // 2. Unggah file menggunakan fungsi upload dari @imagekit/next
  const response = await upload({
    file,
    fileName: file.name,
    token,
    expire,
    signature,
    publicKey,
    folder,
    tags,
    useUniqueFileName: true,
    onProgress,
    abortSignal,
  });

  return {
    fileId: response.fileId ?? "",
    url: response.url ?? "",
    name: response.name ?? file.name,
    size: response.size ?? file.size,
    fileType: response.fileType ?? (file.type || "file"),
    thumbnailUrl: response.thumbnailUrl,
  };
}
