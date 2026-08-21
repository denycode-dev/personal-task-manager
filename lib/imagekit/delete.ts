import { getImageKitClient } from "./client";
import { logger } from "@/lib/logger";

/**
 * Menghapus satu file dari server ImageKit berdasarkan fileId.
 */
export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId || typeof fileId !== "string" || !fileId.trim()) return;
  const cleanId = fileId.trim();

  try {
    const client = getImageKitClient();
    await client.files.delete(cleanId);
    logger.info("ImageKit file deleted successfully", { fileId: cleanId });
  } catch (err: unknown) {
    logger.warn("Failed to delete ImageKit file", { fileId: cleanId, error: err });
  }
}

/**
 * Menghapus banyak file sekaligus dari server ImageKit dalam batch/chunk (maksimal 100 file per request sesuai API ImageKit).
 */
export async function deleteFiles(fileIds: string[]): Promise<void> {
  const validIds = Array.from(
    new Set(
      fileIds.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    )
  );

  if (validIds.length === 0) return;

  try {
    const client = getImageKitClient();
    const CHUNK_SIZE = 100;

    for (let i = 0; i < validIds.length; i += CHUNK_SIZE) {
      const chunk = validIds.slice(i, i + CHUNK_SIZE);
      await client.files.bulk.delete({ fileIds: chunk });
    }

    logger.info("ImageKit files bulk deleted successfully", { count: validIds.length });
  } catch (err: unknown) {
    logger.warn("Bulk delete failed on ImageKit, falling back to individual deletes", {
      count: validIds.length,
      error: err,
    });
    // Fallback: delete individually in parallel
    await Promise.allSettled(validIds.map((id) => deleteFile(id)));
  }
}

/**
 * Mencari dan menghapus file dari ImageKit berdasarkan URL file publik.
 */
export async function deleteFileByUrl(url: string): Promise<void> {
  if (!url || typeof url !== "string" || !url.includes("ik.imagekit.io")) return;

  try {
    const cleanUrl = url.split("?")[0];
    const fileName = cleanUrl.split("/").pop();
    if (!fileName) return;

    const client = getImageKitClient();
    const results = await client.assets.list({
      searchQuery: `name = "${fileName}"`,
      type: "file",
      limit: 5,
    });

    if (Array.isArray(results) && results.length > 0) {
      const matched = results.find(
        (item) => "fileId" in item && (item as unknown as { name?: string }).name === fileName
      );
      const targetId =
        matched && "fileId" in matched
          ? (matched as unknown as { fileId: string }).fileId
          : "fileId" in results[0]
          ? (results[0] as unknown as { fileId: string }).fileId
          : null;

      if (targetId) {
        await client.files.delete(targetId);
        logger.info("ImageKit file deleted by URL", { url, fileId: targetId });
      }
    }
  } catch (err: unknown) {
    logger.warn("Failed to delete ImageKit file by URL", { url, error: err });
  }
}

/**
 * Mengekstrak seluruh ImageKit fileId dan ImageKit URL dari konten catatan (TipTap JSON / HTML / string).
 */
export function extractImageKitFilesFromContent(content: unknown): {
  fileIds: string[];
  urls: string[];
} {
  const fileIds = new Set<string>();
  const urls = new Set<string>();

  if (!content) return { fileIds: [], urls: [] };

  function traverse(node: unknown) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) traverse(item);
      return;
    }

    const obj = node as Record<string, unknown>;

    // Cek atribut TipTap node (misal: node.attrs)
    if (obj.attrs && typeof obj.attrs === "object") {
      const attrs = obj.attrs as Record<string, unknown>;
      if (typeof attrs.fileId === "string" && attrs.fileId.trim()) {
        fileIds.add(attrs.fileId.trim());
      }
      if (typeof attrs.imagekitFileId === "string" && attrs.imagekitFileId.trim()) {
        fileIds.add(attrs.imagekitFileId.trim());
      }
      if (typeof attrs.src === "string" && attrs.src.includes("ik.imagekit.io")) {
        urls.add(attrs.src.trim());
      }
    }

    // Cek properti langsung
    if (typeof obj.fileId === "string" && obj.fileId.trim()) {
      fileIds.add(obj.fileId.trim());
    }
    if (typeof obj.imagekitFileId === "string" && obj.imagekitFileId.trim()) {
      fileIds.add(obj.imagekitFileId.trim());
    }
    if (typeof obj.url === "string" && obj.url.includes("ik.imagekit.io")) {
      urls.add(obj.url.trim());
    }
    if (typeof obj.fileUrl === "string" && obj.fileUrl.includes("ik.imagekit.io")) {
      urls.add(obj.fileUrl.trim());
    }

    // Rekursif ke anak konten atau properti objek
    if (Array.isArray(obj.content)) {
      for (const child of obj.content) traverse(child);
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        traverse(obj[key]);
      }
    }
  }

  traverse(content);

  // Regex fallback untuk stringified JSON/HTML
  try {
    const rawString = typeof content === "string" ? content : JSON.stringify(content);
    const urlMatches = rawString.match(/https?:\/\/ik\.imagekit\.io\/[^\s"'\\]+/g);
    if (urlMatches) {
      for (const u of urlMatches) {
        urls.add(u);
      }
    }
  } catch {}

  return {
    fileIds: Array.from(fileIds),
    urls: Array.from(urls),
  };
}