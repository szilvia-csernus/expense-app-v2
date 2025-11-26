import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { sendExpenseFormFunction } from "./functions/sendExpenseForm/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib";
import {
  Cors,
  LambdaIntegration,
  RestApi,
  Period,
  UsagePlan,
  GatewayResponse,
  ResponseType,
  AuthorizationType,
  ContentHandling,
  PassthroughBehavior,
} from "aws-cdk-lib/aws-apigateway";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
  sendExpenseFormFunction,
});

const apiStack = Stack.of(backend.sendExpenseFormFunction.resources.lambda);

const appId = process.env.AWS_APP_ID;
const branch = process.env.AWS_BRANCH || "dev";
const env = process.env.ENV || "dev";
// Get current AWS account and region dynamically
const region = Stack.of(apiStack).region;
const accountId = Stack.of(apiStack).account;
const devOrigins =
  env === "dev" ? ["http://localhost:5173", "http://localhost:4173"] : [];

// These origins are used for the preflight CORS requests (OPTIONS)
const ORIGINS = [
  `https://${branch}.${appId}.amplifyapp.com`, // Test / Production environment
  ...devOrigins, // Local frontend preview server
];

// create Rest API
const restApi = new RestApi(apiStack, "RestApi", {
  restApiName: `expenseFormApi-${branch}`,
  deploy: true,
  deployOptions: {
    stageName: "dev",
    throttlingRateLimit: 1,
    throttlingBurstLimit: 2,
  },
  binaryMediaTypes: ["multipart/form-data", "image/*", "application/pdf"],
  defaultCorsPreflightOptions: {
    allowMethods: Cors.ALL_METHODS,
    allowOrigins: ORIGINS,
    allowHeaders: [
      "Content-Type",
      "X-Amz-Date",
      "Authorization",
      "X-Amz-Security-Token",
      "X-Amz-User-Agent",
    ],
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.sendExpenseFormFunction.resources.lambda,
  {
    contentHandling: ContentHandling.CONVERT_TO_TEXT, // Important for binary data
    passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
  }
);

// create a new resource path with IAM authorization
const submitExpenseResource = restApi.root.addResource("submit-expense", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.NONE,
  },
});

// add methods you would like to create to the resource path
submitExpenseResource.addMethod("POST", lambdaIntegration, {
  apiKeyRequired: false,
  methodResponses: [
    { statusCode: "200" }, // Success
    { statusCode: "400" }, // Bad Request (validation errors)
    { statusCode: "401" }, // Unauthorized (IAM/API Key issues)
    { statusCode: "404" }, // Not Found (church not found)
    { statusCode: "406" }, // Not Acceptable (file too large)
    { statusCode: "408" }, // Request Timeout
    { statusCode: "413" }, // Content too large
    { statusCode: "429" }, // Too Many Requests (rate limiting)
    { statusCode: "500" }, // Server Error (general errors)
  ],
});

// add a proxy resource path to the API
submitExpenseResource.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// Usage plan is needed to enable rate limiting
const usagePlan = new UsagePlan(apiStack, "ExpenseFormUsagePlan", {
  name: `ExpenseFormUsagePlan-${branch}`,
  description: `Usage plan for expense form API - ${branch}`,
  throttle: {
    rateLimit: 1, // 1 request per second
    burstLimit: 2, // 2 concurrent requests max
  },
  quota: {
    limit: 100, // 100 requests per month
    period: Period.MONTH,
  },
});

// Associate the usage plan with the API stage
usagePlan.addApiStage({
  api: restApi,
  stage: restApi.deploymentStage,
});

// Output API endpoint for frontend
backend.addOutput({
  custom: {
    API: {
      [restApi.restApiName!]: {
        endpoint: restApi.url,
        region: Stack.of(restApi).region,
        apiName: restApi.restApiName,
      },
    },
  },
});

const notificationTopicArn = `arn:aws:sns:${region}:${accountId}:expense-app-limit-alerts`;

// Add environment variable for the topic ARN
backend.sendExpenseFormFunction.addEnvironment(
  "NOTIFICATION_TOPIC_ARN",
  notificationTopicArn
);

// Add SNS permissions to your Lambda function
backend.sendExpenseFormFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["sns:Publish"],
    resources: [notificationTopicArn],
  })
);

// Update your existing SSM permissions to include the request-count parameter
backend.sendExpenseFormFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ssm:GetParameter", "ssm:PutParameter"],
    resources: [
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/gmail/client-id`,
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/gmail/client-secret`,
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/gmail/refresh-token`,
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/request-count`,
      `arn:aws:ssm:${region}:${accountId}:parameter/expense-app/notification-email`,
    ],
  })
);

// Grant S3 access to the Lambda explicitly (function -> storage only)
backend.sendExpenseFormFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  })
);

backend.sendExpenseFormFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["appsync:GraphQL"],
    resources: [backend.data.resources.graphqlApi.arn + "/*"],
  })
);

// Add environment variables for the GraphQL endpoint
backend.sendExpenseFormFunction.addEnvironment(
  "AMPLIFY_DATA_GRAPHQL_ENDPOINT",
  backend.data.graphqlUrl
);

backend.sendExpenseFormFunction.addEnvironment(
  "AMPLIFY_DATA_DEFAULT_NAME",
  branch || "dev"
);

// Add environment variables for the Lambda function
backend.sendExpenseFormFunction.addEnvironment(
  "STORAGE_BUCKET_NAME",
  backend.storage.resources.bucket.bucketName
);

// Set environment variables to Parameter Store paths (not the actual values)
backend.sendExpenseFormFunction.addEnvironment(
  "GMAIL_CLIENT_ID",
  "/expense-app/gmail/client-id"
);
backend.sendExpenseFormFunction.addEnvironment(
  "GMAIL_CLIENT_SECRET",
  "/expense-app/gmail/client-secret"
);
backend.sendExpenseFormFunction.addEnvironment(
  "GMAIL_REFRESH_TOKEN",
  "/expense-app/gmail/refresh-token"
);
backend.sendExpenseFormFunction.addEnvironment("AWS_APP_ID", appId || "");
backend.sendExpenseFormFunction.addEnvironment("AWS_BRANCH", branch || "dev");

// CORS on default API Gateway error responses
new GatewayResponse(apiStack, "Default4xxWithCors", {
  restApi,
  type: ResponseType.DEFAULT_4XX,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'Content-Type'",
    "Access-Control-Allow-Methods": "'OPTIONS,POST'",
  },
});
new GatewayResponse(apiStack, "Default5xxWithCors", {
  restApi,
  type: ResponseType.DEFAULT_5XX,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'Content-Type'",
    "Access-Control-Allow-Methods": "'OPTIONS,POST'",
  },
});
