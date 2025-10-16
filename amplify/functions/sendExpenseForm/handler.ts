import { Amplify } from "aws-amplify";
import {
  generateMainMessage,
  generateMessageToSubmitter,
  generateMessageToFinance,
  generateReplyTemplate,
} from "./generateMessages";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { generateAttachment } from "./generateAttachment";
import { sendEmails } from "./sendEmails";
import { validateForm } from "./validateForm";
import { getChurchDetailsAndUpdateCounter } from "./getChurchDetailsAndUpdateCounter";
import { checkMonthlyLimit } from "./checkMonthlyLimit";
import { checkRateLimit } from "./checkIPRateLimit";
import { parseMultipart } from "./parseMultipart";
// import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

// async function loadAppId() {
//   try {
//     console.log("Loading Amplify App ID from Parameter Store...");

//     const appIdResult = await ssmClient.send(
//       new GetParameterCommand({ Name: "/expense-app/amplify-app-id" })
//     );

//     if (!appIdResult.Parameter?.Value) {
//       throw new Error("Amplify App ID is missing from Parameter Store");
//     }

//     console.log("Amplify App ID loaded successfully from Parameter Store");
//     return appIdResult.Parameter.Value;
//   } catch (error) {
//     console.error("Error loading Amplify App ID from Parameter Store:", error);
//     throw new Error("Failed to load Amplify App ID");
//   }
// }

export const handler: APIGatewayProxyHandler = async (event) => {
  // Check if origin is allowed ( for requests outside a modern browser where CORS is not enforced.)
  const origin = event.headers?.origin || event.headers?.Origin || "*";
  const appId = process.env.AWS_APP_ID;

  if (!appId) {
    throw new Error("AWS_APP_ID not set, using fallback (empty string)");
  }
  const allowedOrigins = [
    `https://main.${appId}.amplifyapp.com`,
    "http://localhost:5173",
  ];

  const corsHeaders = {
    "Access-Control-Allow-Origin": "", // Will be set conditionally
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Only add the origin if it's in the allowed list
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  } else {
    corsHeaders["Access-Control-Allow-Origin"] = allowedOrigins[0];
  }

  console.log("Environment variables:", JSON.stringify(process.env, null, 2));

  console.log(
    "AMPLIFY_DATA_GRAPHQL_ENDPOINT:",
    process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || "missing"
  );
  console.log("AWS_REGION:", process.env.AWS_REGION || "missing");
  console.log(
    "AMPLIFY_DATA_API_KEY exists:",
    process.env.AMPLIFY_DATA_API_KEY ? process.env.AMPLIFY_DATA_API_KEY : "NO"
  );

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  // Rate limiting
  const clientIP = event.requestContext.identity.sourceIp || "unknown";
  if (!checkRateLimit(clientIP)) {
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Rate limit exceeded" }),
    };
  }

  // Monthly limit
  if (!(await checkMonthlyLimit())) {
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Monthly limit exceeded" }),
    };
  }

  // Parse multipart form data

  try {
    const { fields, receipts } = await parseMultipart(event);

    // Extract form data from the event
    const formData = JSON.parse(fields.formData);
    const churchPK = fields.churchPK;

    const apiKey = process.env.AMPLIFY_DATA_API_KEY;
    if (!apiKey) {
      console.error("API Key environment variable is missing!");
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Server configuration error" }),
      };
    }

    // Configure Amplify for appsync graphql calls
    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!,
          region: process.env.AWS_REGION,
          defaultAuthMode: "apiKey",
          apiKey: process.env.AMPLIFY_DATA_API_KEY!,
        },
      },
    });

    // Validate form data
    if (!validateForm(formData, receipts) || !formData || !receipts) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid form data" }),
      };
    }

    // Fetch church details
    const churchData = await getChurchDetailsAndUpdateCounter(churchPK);
    if (!churchData || !churchData.financeEmail) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Church not found" }),
      };
    }

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
      receipts,
      churchData,
      churchData.claimsCounter || 1
    );
    if (!pdfBuffer) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "PDF generation failed" }),
      };
    }
    // Send emails
    await sendEmails(
      churchData,
      formData,
      messageToSubmitter,
      messageToFinance,
      messageTemplate,
      pdfBuffer
    );
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Form processed successfully",
      }),
    };
  } catch (error: unknown) {
    console.error("Error processing form:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    };
  }
};
