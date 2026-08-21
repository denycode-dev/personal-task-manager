export interface OptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

/**
 * Memformat ukuran bytes menjadi string yang mudah dibaca (KB / MB).
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Mengubah dan mengompresi gambar dari browser menjadi format WebP dengan kualitas 80%.
 * Menggunakan Browser HTML Canvas API.
 *
 * @param input - File atau Blob gambar sumber
 * @param quality - Kualitas kompresi WebP (default 0.8 = 80%)
 * @param fallbackName - Nama file cadangan jika input tidak memiliki nama
 */
export async function optimizeImageToWebP(
  input: File | Blob,
  quality: number = 0.8,
  fallbackName: string = "image"
): Promise<OptimizationResult> {
  const originalSize = input.size;
  const baseName =
    input instanceof File
      ? input.name.replace(/\.[^/.]+$/, "")
      : fallbackName.replace(/\.[^/.]+$/, "");
  const outputFileName = `${baseName}.webp`;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(input);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          throw new Error("Dimensi gambar tidak valid.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Gagal menginisialisasi 2D canvas context.");
        }

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke WebP dengan kualitas yang ditentukan
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengonversi gambar ke format WebP."));
              return;
            }

            const optimizedFile = new File([blob], outputFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const reductionPercentage =
              originalSize > 0
                ? Math.max(
                    0,
                    Math.round(((originalSize - optimizedFile.size) / originalSize) * 100)
                  )
                : 0;

            resolve({
              file: optimizedFile,
              originalSize,
              optimizedSize: optimizedFile.size,
              reductionPercentage,
              width,
              height,
            });
          },
          "image/webp",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal memuat file gambar untuk dioptimasi."));
    };

    img.src = objectUrl;
  });
}
