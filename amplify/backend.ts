import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { sendExpenseForm } from "./functions/sendExpenseForm/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
  sendExpenseForm,
});

// Get current AWS account and region dynamically
const stack = Stack.of(backend.sendExpenseForm.resources.lambda);
const region = stack.region;
const accountId = stack.account;

// Grant Lambda permission to read existing SSM parameters (dynamically)
backend.sendExpenseForm.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ssm:GetParameter"],
    resources: [
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/gmail/client-id`,
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/gmail/client-secret`, 
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/gmail/refresh-token`,
    ],
  })
);

// Add environment variables for the Lambda function
backend.sendExpenseForm.addEnvironment("STORAGE_BUCKET_NAME", backend.storage.resources.bucket.bucketName);

// Set environment variables to Parameter Store paths (not the actual values)
backend.sendExpenseForm.addEnvironment("GMAIL_CLIENT_ID", "/expense-app/gmail/client-id");
backend.sendExpenseForm.addEnvironment("GMAIL_CLIENT_SECRET", "/expense-app/gmail/client-secret");
backend.sendExpenseForm.addEnvironment("GMAIL_REFRESH_TOKEN", "/expense-app/gmail/refresh-token");
