import type { ExpenseFormData } from "./types";
import { ALLOWED_MIME_TYPES } from "./detectFileType";

export function validateForm(
  formData: ExpenseFormData,
  receipts: {
    buffer: Buffer<ArrayBufferLike>;
    mimetype: string;
    filename: string;
  }[],
): boolean {
  // Check required fields
  const requiredFields = [
    "name",
    "email",
    "date",
    "description",
    "purpose",
    "total",
    "church",
  ];

  for (const field of requiredFields) {
    if (!formData[field as keyof ExpenseFormData]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Check if at least one receipt exists
  if (!receipts || receipts.length === 0) {
    console.error("No receipt files found");
    return false;
  }

  // Check if receipts total file size is not greater than 5MB
  const totalSize = receipts.reduce((acc, file) => acc + file.buffer.length, 0);
  if (totalSize > 4.5 * 1024 * 1024) {
    console.error("Total receipt file size exceeds 4.5MB");
    return false;
  }

  // Check that every receipt is an allowed file type (verified by magic bytes)
  for (const receipt of receipts) {
    if (!ALLOWED_MIME_TYPES.has(receipt.mimetype)) {
      console.error(`Unsupported file type: ${receipt.mimetype || "unknown"}`);
      return false;
    }
  }

  return true;
}
