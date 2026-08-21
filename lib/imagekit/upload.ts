import { getImageKitClient } from "./client";
import { MAX_FILE_SIZE_BYTES } from "@/config/app";

export type UploadResult = {
  fileId: string;
  url: string;
  name: string;
  size: number;
  fileType: string;
};

export async function uploadFile(
  file: Buffer,
  fileName: string,
  folder: string = "/denycode"
): Promise<UploadResult> {
  if (file.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Ukuran file melebihi batas maksimum ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }

  const client = getImageKitClient();
  const result = await client.files.upload({
    file: file as unknown as string,
    fileName,
    folder,
    useUniqueFileName: true,
  });

  return {
    fileId: result.fileId ?? "",
    url: result.url ?? "",
    name: result.name ?? fileName,
    size: result.size ?? file.length,
    fileType: result.fileType ?? "image",
  };
}