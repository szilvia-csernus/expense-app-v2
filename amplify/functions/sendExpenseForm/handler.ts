import type { Schema } from "../../data/resource";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/sendExpenseForm";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import {
  generateMainMessage,
  generateMessageToSubmitter,
  generateMessageToFinance,
  generateReplyTemplate,
} from "./generateMessages";

import type { ExpenseFormData } from "./types";
import { generateAttachment } from "./generateAttachment";
import { sendEmail } from "./sendEmail";

export const handler: Schema["sendExpenseForm"]["functionHandler"] = async (
  event
) => {
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);

  Amplify.configure(resourceConfig, libraryOptions);

  // Create a client
  const client = generateClient<Schema>();

  // Extract form data from the event
  const formData = event.arguments.formData as ExpenseFormData;
  const churchPK = event.arguments.churchPK;

  // Get church data function
  async function getChurchDetails(churchPK: string) {
    try {
      // Get the full record
      const response = await client.models.ExpenseApp.get({
        PK: churchPK,
        SK: "PROFILE",
      });

      // Check if we have valid data
      if (!response.data) {
        console.error("Church not found");
        return null;
      }

      // Extract only the needed fields from the data property
      return {
        financeEmail: response.data.financeEmail,
        financeContactName: response.data.financeContactName,
        churchLongName: response.data.churchLongName,
        claimsCounter: response.data.claimsCounter,
        logo: response.data.logo,
      };
    } catch (error) {
      console.error("Error getting church details:", error);
      return null;
    }
  }

  try {
    // Validate form data
    if (!validateForm(formData) || !formData) {
      throw new Error("400 - Invalid form data");
    }

    // Fetch church details
    const churchData = await getChurchDetails(churchPK);
    if (!churchData || !churchData.financeEmail) {
      throw new Error("400 - Invalid church data");
    }

    // Get the counter value and increment it
    // Update the counter
    await client.models.ExpenseApp.update({
      PK: churchPK,
      SK: "PROFILE",
      claimsCounter: churchData.claimsCounter
        ? churchData.claimsCounter + 1
        : 1,
    });

    // Generate email content
    const mainMessage = generateMainMessage(formData);
    const messageToSubmitter = generateMessageToSubmitter(
      churchData,
      formData.name
    );
    const messageToFinance = generateMessageToFinance(mainMessage);
    const messageTemplate = generateReplyTemplate(
      churchData,
      formData.name,
      mainMessage
    );

    // Generate PDF attachment
    const pdfBuffer = await generateAttachment(
      formData,
      churchData,
      churchData.claimsCounter || 1
    );
    if (!pdfBuffer) {
      throw new Error("406 - Error processing image files");
    }

    // Send emails
    try {
      // Email to submitter
      await sendEmail(
        churchData.financeEmail,
        formData.email,
        `Expense Form ${churchData.claimsCounter} ${formData.description} ${formData.purpose}`,
        messageToSubmitter,
        null,
        churchData.financeEmail
      );

      // Email to finance team
      await sendEmail(
        churchData.financeEmail,
        churchData.financeEmail,
        `EF ${churchData.claimsCounter} ${formData.description} ${formData.purpose}`,
        messageToFinance,
        {
          filename: `EF${churchData.claimsCounter}.pdf`,
          content: pdfBuffer.toString("base64"),
          contentType: "application/pdf",
        },
        formData.email
      );

      // Email template back to finance team
      await sendEmail(
        churchData.financeEmail,
        churchData.financeEmail,
        `Expense Form ${churchData.claimsCounter} ${formData.description} ${formData.purpose}`,
        messageTemplate,
        null,
        formData.email
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
  } catch (error) {
    console.error("Error processing form:", error);
    throw error;
  }
};

// Validate the form data
function validateForm(formData: ExpenseFormData): boolean {
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
  const hasReceipt = formData.receipts && formData.receipts.length > 0;
  if (!hasReceipt) {
    console.error("No receipt files found");
    return false;
  }

  return true;
}
