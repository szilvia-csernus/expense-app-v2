import { centerImageOnPage, processAndResizeImage } from "./processImage";
import type { ExpenseFormData, Church } from "./types";
import { PDFDocument, StandardFonts, PDFPage, rgb } from "pdf-lib";
import { downloadFileAsBuffer } from "./downloadFileAsBuffer";

async function downloadAndEmbedLogo(pdfDoc: PDFDocument, logoUrl: string) {
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
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { height, width } = page.getSize();

    // Load fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Space on top
    let yPosition = height - 80;

    // Colors
    const textColor = rgb(0.3, 0.3, 0.3);
    const borderColor = rgb(0.8, 0.8, 0.8); // rgb(204, 204, 204)

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

        yPosition -= 30; // Space after logo
      }
    }

    // Main title (matching h1 style)
    page.drawText(`Expense Form - ${counter}`, {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
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
    console.log(`Processing ${form.receipts.length} receipt(s)...`);
    
    for (let i = 0; i < form.receipts.length; i++) {
      const receiptPath = form.receipts[i];
      console.log(`Processing receipt ${i + 1}/${form.receipts.length}: ${receiptPath}`);
      
      try {
        const { buffer, contentType } = await downloadFileAsBuffer(receiptPath);
        console.log(`Downloaded receipt: ${buffer.length} bytes, type: ${contentType}`);

        if (contentType.startsWith("image/")) {
          console.log("Processing as image...");
          
          // Process and resize image intelligently
          const result = await processAndResizeImage(
            pdfDoc,
            buffer,
            contentType
          );

          if (!result) {
            console.error("Failed to process image, skipping...");
            continue;
          }

          const { img, dims } = result;
          console.log(`Image processed successfully: ${dims.width}x${dims.height}`);

          // Create new page for the image
          const newPage = pdfDoc.addPage();
          console.log("Created new page for image");

          // Center the image on the page
          const position = centerImageOnPage(newPage, dims.width, dims.height);
          console.log(`Positioning image at: ${position.x}, ${position.y}`);

          // Draw the image with calculated dimensions and position
          newPage.drawImage(img, {
            x: position.x,
            y: position.y,
            width: dims.width,
            height: dims.height,
          });
          
          console.log("Image drawn on page successfully");
          
        } else if (contentType === "application/pdf") {
          console.log("Processing as PDF...");
          
          // PDF processing remains the same
          const receiptPdf = await PDFDocument.load(buffer);
          const copiedPages = await pdfDoc.copyPages(
            receiptPdf,
            receiptPdf.getPageIndices()
          );
          copiedPages.forEach((page: PDFPage) => pdfDoc.addPage(page));
          
          console.log("PDF pages added successfully");
        } else {
          console.warn(`Unsupported content type: ${contentType}`);
        }
      } catch (error) {
        console.error(`Error processing receipt ${receiptPath}:`, error);
        // Continue with next receipt instead of returning null
        continue;
      }
    }

    console.log("Saving PDF document...");
    const pdfBytes = await pdfDoc.save();
    console.log(`PDF generated successfully: ${pdfBytes.length} bytes`);
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}
