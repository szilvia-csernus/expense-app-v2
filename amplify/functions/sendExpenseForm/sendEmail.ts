import { auth, gmail } from "@googleapis/gmail";
import type { EmailAttachment } from "./types";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

// Load Gmail credentials from Parameter Store using the parameter names from environment variables
async function loadGmailCredentials() {
  try {
    console.log("Loading Gmail credentials from Parameter Store...");

    const [clientIdResult, clientSecretResult, refreshTokenResult] =
      await Promise.all([
        ssmClient.send(
          new GetParameterCommand({ Name: process.env.GMAIL_CLIENT_ID })
        ),
        ssmClient.send(
          new GetParameterCommand({ Name: process.env.GMAIL_CLIENT_SECRET })
        ),
        ssmClient.send(
          new GetParameterCommand({ Name: process.env.GMAIL_REFRESH_TOKEN })
        ),
      ]);

    if (
      !clientIdResult.Parameter?.Value ||
      !clientSecretResult.Parameter?.Value ||
      !refreshTokenResult.Parameter?.Value
    ) {
      throw new Error(
        "One or more Gmail credentials are missing from Parameter Store"
      );
    }

    const credentials = {
      client_id: clientIdResult.Parameter.Value,
      client_secret: clientSecretResult.Parameter.Value,
      refresh_token: refreshTokenResult.Parameter.Value,
    };

    console.log("Gmail credentials loaded successfully from Parameter Store");
    return credentials;
  } catch (error) {
    console.error(
      "Error loading Gmail credentials from Parameter Store:",
      error
    );
    throw new Error("Failed to load Gmail credentials");
  }
}

export async function sendEmail(
  from: string,
  to: string,
  subject: string,
  body: string,
  attachment: EmailAttachment | null,
  replyTo: string
) {
  // Load credentials from Parameter Store
  const credentials = await loadGmailCredentials();

  // Set up OAuth2 client
  const oAuth2Client = new auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    "http://localhost" // redirect URI
  );
  oAuth2Client.setCredentials({ refresh_token: credentials.refresh_token });

  const email = gmail({ version: "v1", auth: oAuth2Client });

  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];

  if (attachment) {
    // With attachment
    const boundary = "boundary_" + Math.random().toString(36).slice(2, 11);
    messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    messageParts.push("");
    messageParts.push(`--${boundary}`);
    messageParts.push("Content-Type: text/html; charset=utf-8");
    messageParts.push("");
    messageParts.push(body);
    messageParts.push("");
    messageParts.push(`--${boundary}`);
    messageParts.push(
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`
    );
    messageParts.push("Content-Transfer-Encoding: base64");
    messageParts.push(
      `Content-Disposition: attachment; filename="${attachment.filename}"`
    );
    messageParts.push("");
    messageParts.push(attachment.content);
    messageParts.push(`--${boundary}--`);
  } else {
    // Without attachment
    messageParts.push("Content-Type: text/html; charset=utf-8");
    messageParts.push("");
    messageParts.push(body);
  }

  const message = messageParts.join("\n");
  const encodedMessage = Buffer.from(message).toString("base64");

  try {
    const result = await email.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("Email sent successfully:", result.data.id);
    return result.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
