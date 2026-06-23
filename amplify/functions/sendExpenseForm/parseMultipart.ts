import type { APIGatewayProxyEvent } from "aws-lambda";
import { ReceiptBuffer } from "./types";
import { detectMimeType } from "./detectFileType";

export async function parseMultipart(
  event: APIGatewayProxyEvent
): Promise<{ fields: Record<string, string>; receipts: ReceiptBuffer[] }> {
  const headers = event.headers || {};
  const contentType = headers["content-type"] || headers["Content-Type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new Error("Content-Type must be multipart/form-data");
  }

  const body = Buffer.from(
    event.body ?? "",
    event.isBase64Encoded ? "base64" : "utf8"
  );

  if (body.length === 0) {
    throw new Error("Request body is empty");
  }

  // Build a Request so we can use the FormData API to parse it
  const req = new Request("http://local", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });

  if (!req.body) {
    throw new Error("Request body is null");
  }

  const formData = await req.formData();

  if (!formData) {
    throw new Error("FormData is null");
  }

  console.log("FormData keys:", Array.from(formData.keys()));

  const fields: Record<string, string> = {};
  const receipts: ReceiptBuffer[] = [];

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      fields[key] = value;
    } else {
      const ab = await value.arrayBuffer();
      const buf = Buffer.from(ab);
      receipts.push({
        buffer: buf,
        mimetype: detectMimeType(buf) ?? "",
        filename: value.name,
      });
    }
  }

  return { fields, receipts };
}
