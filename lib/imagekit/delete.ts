import { getImageKitClient } from "./client";

export async function deleteFile(fileId: string): Promise<void> {
  const client = getImageKitClient();
  await client.files.delete(fileId);
}