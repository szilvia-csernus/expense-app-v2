import { PDFDocument, PDFImage, PDFPage } from "pdf-lib";

export async function processAndResizeImage(
  pdfDoc: PDFDocument,
  imageBuffer: Buffer,
  contentType: string
): Promise<{
  img: PDFImage;
  dims: { width: number; height: number };
} | null> {
  try {
    let img;

    console.log(`Processing image with content type: ${contentType}`);

    const lowerContentType = contentType.toLowerCase();

    // Detect and embed image format based on content type
    if (lowerContentType.includes("png")) {
      img = await pdfDoc.embedPng(imageBuffer);
    } else if (
      lowerContentType.includes("jpeg") ||
      lowerContentType.includes("jpg")
    ) {
      img = await pdfDoc.embedJpg(imageBuffer);
    } else {
      // Try JPG first, then PNG as fallback
      try {
        img = await pdfDoc.embedJpg(imageBuffer);
      } catch {
        img = await pdfDoc.embedPng(imageBuffer);
      }
    }

    // A4 dimensions in points (72 points = 1 inch)
    // A4 = 210mm x 297mm = 595 x 842 points
    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;

    // Leave some margin (50 points on each side)
    const MAX_WIDTH = A4_WIDTH - 100; // 495 points
    const MAX_HEIGHT = A4_HEIGHT - 100; // 742 points

    // Get original dimensions
    const originalWidth = img.width;
    const originalHeight = img.height;

    console.log(`Original image size: ${originalWidth}x${originalHeight}`);

    // Calculate if resizing is needed
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
      // Calculate scale factor to fit within A4 while maintaining aspect ratio
      const scaleX = MAX_WIDTH / originalWidth;
      const scaleY = MAX_HEIGHT / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      newWidth = originalWidth * scale;
      newHeight = originalHeight * scale;

      console.log(
        `Resizing image to: ${Math.round(newWidth)}x${Math.round(newHeight)} (scale: ${scale.toFixed(2)})`
      );
    } else {
      console.log("Image fits within A4, keeping original size");
    }

    return {
      img,
      dims: { width: newWidth, height: newHeight },
    };
  } catch (error) {
    console.error("Error processing image:", error);
    return null;
  }
}

export function centerImageOnPage(
  page: PDFPage,
  imgWidth: number,
  imgHeight: number
): { x: number; y: number } {
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  return {
    x: (pageWidth - imgWidth) / 2,
    y: (pageHeight - imgHeight) / 2,
  };
}
