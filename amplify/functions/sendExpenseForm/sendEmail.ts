import { google } from "googleapis";
import type { EmailAttachment } from "./types";

// Set up OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

export async function sendEmail(
  from: string,
  to: string,
  subject: string,
  body: string,
  attachment: EmailAttachment | null
) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];

  if (attachment) {
    // Multipart MIME for attachments
    const boundary = "__MY_BOUNDARY__";
    messageParts.push(
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      attachment.content,
      `--${boundary}--`
    );
  } else {
    // Simple text email
    messageParts.push("Content-Type: text/plain; charset=utf-8", "", body);
  }

  const rawMessage = Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage,
    },
  });
}
