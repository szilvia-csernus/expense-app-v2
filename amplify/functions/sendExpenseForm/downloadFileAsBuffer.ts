import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// Function to detect image type from file header (magic bytes)
function detectImageType(buffer: Buffer): string | null {
  // Check for common image file signatures
  if (buffer.length < 4) return null;
  
  // PNG signature: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return "image/png";
  }
  
  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return "image/jpeg";
  }
  
  // GIF signature: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }
  
  // WebP signature: starts with "RIFF" and contains "WEBP"
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return "image/webp";
  }
  
  // PDF signature: %PDF
  if (buffer.length >= 4 && 
      buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }
  
  return null;
}

export const downloadFileAsBuffer = async (
  receiptPath: string
): Promise<{ buffer: Buffer; contentType: string }> => {
  try {
    console.log(`Downloading file from ${receiptPath}...`);
    
    // Get bucket name from environment variable
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    
    if (!bucketName) {
      throw new Error("Storage bucket name not found in environment variables");
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: receiptPath,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error("No file content returned from S3");
    }

    console.log(`Downloaded file from ${receiptPath}`);

    // Convert the stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    let contentType = response.ContentType || "application/octet-stream";

    // If content type is generic, try to detect from file content
    if (contentType === "application/octet-stream") {
      const detectedType = detectImageType(buffer);
      if (detectedType) {
        contentType = detectedType;
        console.log(`Detected file type from content: ${contentType}`);
      }
    }

    console.log(`File size: ${buffer.length} bytes, Content-Type: ${contentType}`);

    return { buffer, contentType };
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
    throw new Error(`Failed to download file.`);
  }
};
