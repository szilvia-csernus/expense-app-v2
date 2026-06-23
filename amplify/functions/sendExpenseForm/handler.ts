import { Amplify } from "@aws-amplify/core";
import {
  getAmplifyDataClientConfig,
  type DataClientEnv,
} from "@aws-amplify/backend-function/runtime";
import { fetchAuthSession } from "aws-amplify/auth";
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
import { parseMultipart } from "./parseMultipart";
import { verifyTurnstile } from "./verifyTurnstile";

let configureAmplifyPromise: Promise<void> | undefined;

const ensureAmplifyConfigured = async () => {
  if (!configureAmplifyPromise) {
    configureAmplifyPromise = (async () => {
      const { resourceConfig, libraryOptions } =
        await getAmplifyDataClientConfig(process.env as DataClientEnv);
      Amplify.configure(resourceConfig, libraryOptions);
      console.log("Amplify configured for data client");
    })();
  }
  await configureAmplifyPromise;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // Check if origin is allowed ( for requests outside a modern browser where CORS is not enforced.)
  const origin = event.headers?.origin || event.headers?.Origin;
  const referer = event.headers?.referer || event.headers?.Referer;
  const appId = process.env.AWS_APP_ID;
  const branch = process.env.AWS_BRANCH;
  const env = process.env.ENV || "dev";
  const devOrigins =
    env === "dev" ? ["http://localhost:5173", "http://localhost:4173"] : [];

  if (!appId || !branch) {
    console.warn("AWS_APP_ID or AWS_BRANCH not set, using defaults:", {
      appId,
      branch,
    });
  }
  const allowedOrigins = [
    `https://${branch}.${appId}.amplifyapp.com`,
    ...devOrigins,
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

  console.log(
    "AMPLIFY_DATA_GRAPHQL_ENDPOINT:",
    process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || "missing"
  );
  console.log("AWS_REGION:", process.env.AWS_REGION || "missing");

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "OPTIONS") {
    // Don't block preflight requests
    // Check if request has a valid origin or referer
    const hasValidOrigin = origin && allowedOrigins.includes(origin);
    const hasValidReferer =
      referer && allowedOrigins.some((allowed) => referer.startsWith(allowed));

    if (!hasValidOrigin && !hasValidReferer) {
      console.log(
        `Blocked request from invalid origin: ${origin}, referer: ${referer}`
      );
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Forbidden - Invalid origin" }),
      };
    }
  }

  // Parse multipart form data

  try {
    const { fields, receipts } = await parseMultipart(event);

    // Verify the Cloudflare Turnstile token before doing any further work.
    // This runs before the monthly-limit counter so bots can't exhaust it.
    const sourceIp = event.requestContext?.identity?.sourceIp;
    if (!(await verifyTurnstile(fields.turnstileToken, sourceIp))) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Human verification failed" }),
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

    // Extract form data from the event
    const formData = JSON.parse(fields.formData);
    const churchPK = fields.churchPK;

    await ensureAmplifyConfigured();

    const session = await fetchAuthSession();
    console.log("Fetched auth session", {
      hasCredentials: Boolean(session.credentials),
      identityId: session.identityId ?? "none",
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
