import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { sendExpenseFormFunction } from "./functions/sendExpenseForm/resource";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Fn, Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import {
  Cors,
  LambdaIntegration,
  RestApi,
  Period,
  UsagePlan,
  ApiKey,
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

// const apiStack = backend.createStack("api-stack");
const apiStack = Stack.of(backend.sendExpenseFormFunction.resources.lambda);

export const ORIGINS = [
  `https://main.${Fn.sub("d${AWS::AccountId}")}.amplifyapp.com`,
  "http://localhost:5173",
];
// create Rest API
const restApi = new RestApi(apiStack, "RestApi", {
  restApiName: "expenseFormApi",
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
      "X-Api-Key",
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
  apiKeyRequired: true,
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
submitExpenseResource.addMethod("GET", lambdaIntegration);
submitExpenseResource.addMethod("DELETE", lambdaIntegration);
submitExpenseResource.addMethod("PUT", lambdaIntegration);

// add a proxy resource path to the API
submitExpenseResource.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${restApi.arnForExecuteApi("*", "/submit-expense", "dev")}`,
        `${restApi.arnForExecuteApi("*", "/submit-expense/*", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// Optional: Create usage plan for even more control
const usagePlan = new UsagePlan(apiStack, "ExpenseFormUsagePlan", {
  name: "ExpenseFormUsagePlan",
  description: "Usage plan for expense form API",
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

// Optional: Create API key for additional security
const apiKey = new ApiKey(apiStack, "ExpenseFormApiKey", {
  description: "API Key for Expense Form, used as a public api key in frontend",
});

usagePlan.addApiKey(apiKey);

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

// Get current AWS account and region dynamically
const region = Stack.of(restApi).region;
const accountId = Stack.of(restApi).account;

// Create SNS topic for notifications - Create just once!!! (and comment out the alternative ways below)
// const notificationTopic = new Topic(apiStack, "ExpenseLimitNotificationTopic", {
//   displayName: "Expense App Limit Notifications",
//   topicName: "expense-app-limit-alerts",
// });

// Just reference the existing topic by ARN - later on, use this instead of the code above, by commenting it out
const notificationTopic = Topic.fromTopicArn(
  apiStack,
  "ExpenseLimitNotificationTopic",
  `arn:aws:sns:${region}:${accountId}:expense-app-limit-alerts`
);

// Add environment variable for the topic ARN
backend.sendExpenseFormFunction.addEnvironment(
  "NOTIFICATION_TOPIC_ARN",
  notificationTopic.topicArn
);

// Add SNS permissions to your Lambda function
backend.sendExpenseFormFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["sns:Publish"],
    resources: [notificationTopic.topicArn],
  })
);

// Create or reference an SSM parameter for notification email
const notificationEmailParam = StringParameter.fromStringParameterName(
  apiStack,
  "NotificationEmailParam",
  "/expense-app/notification-email"
);

// Use the parameter value for the subscription
notificationTopic.addSubscription(
  new EmailSubscription(notificationEmailParam.stringValue)
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

if (!backend.data.apiKey) {
  throw new Error("GraphQL API key is undefined during deployment");
}

backend.sendExpenseFormFunction.addEnvironment(
  "AMPLIFY_DATA_API_KEY",
  backend.data.apiKey
);

backend.sendExpenseFormFunction.addEnvironment(
  "AMPLIFY_DATA_DEFAULT_NAME",
  "main"
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

// CORS on default API Gateway error responses
new GatewayResponse(apiStack, "Default4xxWithCors", {
  restApi,
  type: ResponseType.DEFAULT_4XX,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'Content-Type,x-api-key'",
    "Access-Control-Allow-Methods": "'OPTIONS,POST'",
  },
});
new GatewayResponse(apiStack, "Default5xxWithCors", {
  restApi,
  type: ResponseType.DEFAULT_5XX,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'Content-Type,x-api-key'",
    "Access-Control-Allow-Methods": "'OPTIONS,POST'",
  },
});
