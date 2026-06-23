import { auth, gmail } from "@googleapis/gmail";
import type { Church, EmailAttachment, ExpenseFormData } from "./types";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

// Load Gmail credentials from Parameter Store using the parameter names from environment variables
async function loadGmailCredentials() {
  try {
    console.log("Loading Gmail credentials from Parameter Store...");

    const [clientIdResult, clientSecretResult, refreshTokenResult] =
      await Promise.all([
        ssmClient.send(
          new GetParameterCommand({
            Name: process.env.GMAIL_CLIENT_ID,
            WithDecryption: true,
          }),
        ),
        ssmClient.send(
          new GetParameterCommand({
            Name: process.env.GMAIL_CLIENT_SECRET,
            WithDecryption: true,
          }),
        ),
        ssmClient.send(
          new GetParameterCommand({
            Name: process.env.GMAIL_REFRESH_TOKEN,
            WithDecryption: true,
          }),
        ),
      ]);

    if (
      !clientIdResult.Parameter?.Value ||
      !clientSecretResult.Parameter?.Value ||
      !refreshTokenResult.Parameter?.Value
    ) {
      throw new Error(
        "One or more Gmail credentials are missing from Parameter Store",
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
      error,
    );
    throw new Error("Failed to load Gmail credentials");
  }
}

async function sendEmail(
  credentials: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
  },
  from: string,
  to: string,
  subject: string,
  body: string,
  attachment: EmailAttachment | null,
  replyTo: string,
) {
  // Set up OAuth2 client
  const oAuth2Client = new auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    "http://localhost", // redirect URI
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
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
    );
    messageParts.push("Content-Transfer-Encoding: base64");
    messageParts.push(
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
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

export async function sendEmails(
  churchData: Church,
  formData: ExpenseFormData,
  messageToSubmitter: string,
  messageToFinance: string,
  messageTemplate: string,
  pdfBuffer: Buffer,
) {
  // Load credentials from Parameter Store
  const credentials = await loadGmailCredentials();
  // Send emails
  try {
    // Email to submitter
    await sendEmail(
      credentials,
      churchData.financeEmail,
      formData.email,
      `Expense Form ${churchData.claimsCounter} ${formData.description} ${formData.purpose}`,
      messageToSubmitter,
      null,
      churchData.financeEmail,
    );

    // Email to finance team
    await sendEmail(
      credentials,
      churchData.financeEmail,
      churchData.financeEmail,
      `EF ${churchData.claimsCounter} ${formData.description} ${formData.purpose}`,
      messageToFinance,
      {
        filename: `EF${churchData.claimsCounter}.pdf`,
        content: pdfBuffer.toString("base64"),
        contentType: "application/pdf",
      },
      formData.email,
    );

    // Email template back to finance team
    await sendEmail(
      credentials,
      churchData.financeEmail,
      churchData.financeEmail,
      `Expense Form ${churchData.claimsCounter} ${formData.description} ${formData.purpose}`,
      messageTemplate,
      null,
      formData.email,
    );

    console.log(`Email sent for expense form ${churchData.claimsCounter}`);

    return JSON.stringify({
      statusCode: 200,
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("406 - Error sending email. Please try again.");
  }
}
