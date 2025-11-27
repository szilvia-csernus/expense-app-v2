const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;

export const MAX_TOTAL_BYTES = 6 * 1024 * 1024;
export const TARGET_TOTAL_BYTES = 4.5 * 1024 * 1024;

export const getTotalSize = (files: File[]) =>
  files.reduce((acc, current) => acc + current.size, 0);

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = src;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });

const buildCompressedFileName = (originalName: string) => {
  const baseName = originalName.replace(/\.[^.]+$/, "");
  return `${baseName}-compressed.jpg`;
};

const hasBeenCompressed = (file: File) => file.name.includes("-compressed");

const compressImageToSize = async (file: File, targetBytes: number) => {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as never)) {
    return file;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const imageElement = await loadImageElement(dataUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    let currentWidth = imageElement.width;
    let currentHeight = imageElement.height;

    const initialScale = Math.min(
      1,
      Math.sqrt(targetBytes / Math.max(file.size, 1))
    );
    currentWidth = Math.max(1, Math.floor(currentWidth * initialScale));
    currentHeight = Math.max(1, Math.floor(currentHeight * initialScale));

    let bestBlob: Blob | null = null;
    let attempt = 0;
    const qualitySteps = [0.9, 0.8, 0.7, 0.6, 0.5];

    while (attempt < 5 && currentWidth >= 1 && currentHeight >= 1) {
      canvas.width = currentWidth;
      canvas.height = currentHeight;
      ctx.clearRect(0, 0, currentWidth, currentHeight);
      ctx.drawImage(imageElement, 0, 0, currentWidth, currentHeight);

      for (const quality of qualitySteps) {
        const blob = await canvasToBlob(canvas, quality);
        if (!blob) {
          continue;
        }
        bestBlob = blob;
        if (
          blob.size <= targetBytes ||
          quality === qualitySteps[qualitySteps.length - 1]
        ) {
          const newName = buildCompressedFileName(file.name);
          return new File([blob], newName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      currentWidth = Math.max(1, Math.floor(currentWidth * 0.9));
      currentHeight = Math.max(1, Math.floor(currentHeight * 0.9));
      attempt += 1;
    }

    if (bestBlob) {
      const fallbackName = buildCompressedFileName(file.name);
      return new File([bestBlob], fallbackName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  } catch (error) {
    console.warn("Failed to compress image, using original file", error);
  }

  return file;
};

const findLargestCompressibleIndex = (files: File[]) => {
  let maxIndex = -1;
  let maxSize = 0;
  files.forEach((file, index) => {
    if (
      !hasBeenCompressed(file) &&
      SUPPORTED_IMAGE_TYPES.includes(file.type as never) &&
      file.size > maxSize
    ) {
      maxIndex = index;
      maxSize = file.size;
    }
  });
  return maxIndex;
};

export const enforceTargetTotal = async (files: File[]) => {
  const updatedFiles = [...files];
  let totalSize = getTotalSize(updatedFiles);

  const compressedIndices = new Set<number>();

  while (totalSize > TARGET_TOTAL_BYTES) {
    const indexToCompress = findLargestCompressibleIndex(updatedFiles);
    if (indexToCompress === -1) {
      break;
    }

    if (compressedIndices.has(indexToCompress)) {
      break;
    }

    const fileToCompress = updatedFiles[indexToCompress];
    const bytesOverLimit = totalSize - TARGET_TOTAL_BYTES;
    const desiredSize = Math.max(
      fileToCompress.size - bytesOverLimit,
      200 * 1024
    );
    const compressedFile = await compressImageToSize(
      fileToCompress,
      desiredSize
    );

    if (compressedFile.size >= fileToCompress.size) {
      break;
    }

    updatedFiles[indexToCompress] = compressedFile;
    totalSize = totalSize - fileToCompress.size + compressedFile.size;
    compressedIndices.add(indexToCompress);
  }

  return {
    files: updatedFiles,
    totalSize,
    success: totalSize <= TARGET_TOTAL_BYTES,
  };
};
