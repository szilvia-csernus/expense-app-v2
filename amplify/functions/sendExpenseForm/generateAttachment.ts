import { centerImageOnPage, processAndResizeImage } from "./processImage";
import type { ExpenseFormData, Church } from "./types";
import * as PDFLib from "pdf-lib";

async function downloadAndEmbedLogo(
  pdfDoc: PDFLib.PDFDocument,
  logoUrl: string
) {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      console.warn("Could not fetch logo:", response.statusText);
      return null;
    }

    const logoBuffer = await response.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);

    // Try to embed as PNG first, then JPG
    try {
      return await pdfDoc.embedPng(logoBytes);
    } catch {
      return await pdfDoc.embedJpg(logoBytes);
    }
  } catch (error) {
    console.warn("Error downloading logo:", error);
    return null;
  }
}

// Generate PDF attachment with form data and receipts
export async function generateAttachment(
  form: ExpenseFormData,
  churchData: Church,
  counter: number
): Promise<Buffer | null> {
  try {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage();
    const { height, width } = page.getSize();

    // Load fonts
    const regularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Space on top
    let yPosition = height - 80;

    // Colors
    const textColor = PDFLib.rgb(0.3, 0.3, 0.3);
    const borderColor = PDFLib.rgb(0.8, 0.8, 0.8); // rgb(204, 204, 204)

    // Add logo if available
    if (churchData.logo) {
      const logo = await downloadAndEmbedLogo(pdfDoc, churchData.logo);
      if (logo) {
        // Scale logo to fit header (60px height like your HTML)
        const logoHeight = 35;
        const logoWidth = logo.width * (logoHeight / logo.height);

        page.drawImage(logo, {
          x: 50,
          y: yPosition,
          width: logoWidth,
          height: logoHeight,
        });

        yPosition -= 20; // Space after logo
      }
    }

    // Main title (matching h1 style)
    page.drawText(`EXPENSE FORM - ${counter}`, {
      x: 50,
      y: yPosition,
      size: 15,
      font: regularFont,
      color: textColor,
    });

    yPosition -= 70;

    // Helper function for section headers (h2 style)
    const drawSectionHeader = (title: string) => {
      page.drawText(title, {
        x: 50,
        y: yPosition,
        size: 13,
        font: regularFont,
        color: textColor,
      });

      // Draw underline (border-bottom)
      page.drawLine({
        start: { x: 50, y: yPosition - 5 },
        end: { x: width - 50, y: yPosition - 5 },
        thickness: 1,
        color: borderColor,
      });

      yPosition -= 30;
    };

    // Helper function for form fields
    const drawField = (label: string, value: string | null | undefined) => {
      // Label (matching labelText style)
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 9,
        font: regularFont,
        color: textColor,
      });

      yPosition -= 14;

      // Value (matching formInput style)
      page.drawText(value || "N/A", {
        x: 50,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: textColor,
      });

      // Add some spacing like margin-top: 8px
      yPosition -= 26;
    };

    // PERSONAL INFORMATION section
    drawSectionHeader("PERSONAL INFORMATION");
    drawField("Name", form.name);
    drawField("Email address", form.email);

    yPosition -= 20; // Extra spacing before next section

    // EXPENSES section
    drawSectionHeader("EXPENSES");
    drawField("Church", form.church);
    drawField("Purpose", form.purpose);
    drawField("Date of expense (on receipt)", form.date);
    drawField("Description", form.description);
    drawField("Total", `€${form.total}`);

    yPosition -= 20; // Extra spacing before next section

    // BANK DETAILS section
    drawSectionHeader("BANK DETAILS");
    drawField("Bank Account", form.iban);
    drawField("Name of Bank Account Holder (if different)", form.accountName);

    // Process receipts on separate pages
    for (const receiptData of form.receipts) {
      try {
        if (receiptData.startsWith("data:image")) {
          const base64Data = receiptData.split(",")[1];
          const imageBuffer = Buffer.from(base64Data, "base64");

          // Process and resize image intelligently
          const result = await processAndResizeImage(
            pdfDoc,
            imageBuffer,
            receiptData
          );

          if (!result) {
            console.error("Failed to process image, skipping...");
            continue;
          }

          const { img, dims } = result;

          // Create new page for the image
          const newPage = pdfDoc.addPage();

          // Center the image on the page
          const position = centerImageOnPage(newPage, dims.width, dims.height);

          // Draw the image with calculated dimensions and position
          newPage.drawImage(img, {
            x: position.x,
            y: position.y,
            width: dims.width,
            height: dims.height,
          });

          // Optional: Add a subtle border around images for better presentation
          newPage.drawRectangle({
            x: position.x - 2,
            y: position.y - 2,
            width: dims.width + 4,
            height: dims.height + 4,
            borderColor: PDFLib.rgb(0.9, 0.9, 0.9),
            borderWidth: 1,
          });
        } else if (receiptData.startsWith("data:application/pdf")) {
          // PDF processing remains the same
          const base64Data = receiptData.split(",")[1];
          const pdfBuffer = Buffer.from(base64Data, "base64");
          const receiptPdf = await PDFLib.PDFDocument.load(pdfBuffer);
          const copiedPages = await pdfDoc.copyPages(
            receiptPdf,
            receiptPdf.getPageIndices()
          );
          copiedPages.forEach((page) => pdfDoc.addPage(page));
        }
      } catch (error) {
        console.error(`Error processing receipt:`, error);
        // Continue with next receipt instead of returning null
        continue;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}
