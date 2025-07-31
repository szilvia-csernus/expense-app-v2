import { downloadData } from "aws-amplify/storage";

export const downloadFileAsBuffer = async (
  receiptUrl: string
): Promise<{ buffer: Buffer; contentType: string }> => {
  try {
    const downloadResult = await downloadData({
      path: receiptUrl,
      options: {
        bucket: "receiptsBucket",
      },
    }).result;

    console.log(`Downloaded file from ${receiptUrl}`);

    const blob = await downloadResult.body.blob();
    // convert to raw bytes first
    const arrayBuffer = await blob.arrayBuffer();
    // then to Node.js Buffer
    const buffer = Buffer.from(arrayBuffer);
    const contentType =
      downloadResult.metadata?.contentType || "application/octet-stream";

    return { buffer, contentType };
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
    throw new Error(`Failed to download file.`);
  }
};
